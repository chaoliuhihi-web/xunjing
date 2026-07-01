import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { normalizeReleaseHttpsUrl } from './release_url_guard.mjs'

const requiredScenarioIds = [
  'install-release-build',
  'home-loads-xicheng',
  'camera-photo-recognition',
  'ocr-text-recognition',
  'gps-recognition-permission',
  'text-recognition-baitasi',
  'scan-entry-map-detail',
  'scan-result-sources',
  'xiaojing-sourced-answer',
  'xiaojing-blocked-answer',
  'recording-start-stop',
  'travelogue-draft-generated'
]
const supportedReleaseTargets = new Set(['android', 'ios'])
const supportedEvidenceRefExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.mp4',
  '.mov'
])
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const fail = (message) => {
  console.error(message)
  process.exit(1)
}

const maxEvidenceAgeHours = Number(process.env.XUNJING_EVIDENCE_MAX_AGE_HOURS || 72)
const maxFutureSkewMs = 5 * 60 * 1000

const assertFreshTimestamp = (label, value) => {
  const parsedTime = Date.parse(String(value || ''))
  if (!Number.isFinite(parsedTime)) {
    fail(`Native device evidence ${label} must be a valid ISO timestamp`)
  }
  const now = Date.now()
  if (parsedTime - now > maxFutureSkewMs) {
    fail(`Native device evidence ${label} must not be in the future`)
  }
  const ageHours = (now - parsedTime) / 1000 / 60 / 60
  if (ageHours > maxEvidenceAgeHours) {
    fail(`Native device evidence ${label} is stale; evidence must be fresh within ${maxEvidenceAgeHours} hours`)
  }
}

const getRepoRoot = () => {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })
  return result.status === 0 && result.stdout.trim()
    ? result.stdout.trim()
    : process.cwd()
}

const repoRoot = getRepoRoot()
const getCurrentHead = () => {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8'
  })
  return result.status === 0 ? result.stdout.trim() : ''
}

const currentHead = getCurrentHead()
const qaEvidenceRoot = path.join(repoRoot, 'qa')

const isInsideDir = (childPath, parentPath) => {
  const relativePath = path.relative(parentPath, childPath)
  return Boolean(relativePath) && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
}

const resolveArtifactPath = (artifactPath) => {
  if (path.isAbsolute(artifactPath)) {
    return artifactPath
  }
  return path.resolve(repoRoot, artifactPath)
}

const resolveEvidenceRefPath = (evidenceRef) => {
  if (path.isAbsolute(evidenceRef)) {
    return evidenceRef
  }
  return path.resolve(repoRoot, evidenceRef)
}

const readFileHeader = (filePath, byteCount = 32) => {
  const fd = fs.openSync(filePath, 'r')
  try {
    const header = Buffer.alloc(byteCount)
    const bytesRead = fs.readSync(fd, header, 0, byteCount, 0)
    return header.subarray(0, bytesRead)
  } finally {
    fs.closeSync(fd)
  }
}

const evidenceRefContentMatchesExtension = (filePath, ext) => {
  const header = readFileHeader(filePath)
  if (ext === '.jpg' || ext === '.jpeg') {
    return header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
  }
  if (ext === '.png') {
    return header.length >= pngSignature.length && header.subarray(0, pngSignature.length).equals(pngSignature)
  }
  if (ext === '.webp') {
    return header.length >= 12 && header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP'
  }
  if (ext === '.mp4' || ext === '.mov') {
    return header.length >= 12 && header.toString('ascii', 4, 8) === 'ftyp'
  }
  return false
}

const assertMobileReleaseArtifact = (label, artifactPath) => {
  const ext = path.extname(artifactPath).toLowerCase()
  if (!['.apk', '.aab', '.ipa'].includes(ext)) {
    fail(`${label} must be a mobile install package: APK, AAB, or IPA`)
  }
}

const assertReadableMobileArchive = (label, artifactPath) => {
  const result = spawnSync('unzip', ['-tq', artifactPath], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  })
  if (result.status !== 0) {
    fail(`${label} must be a readable APK/AAB/IPA ZIP archive: ${result.stderr || result.stdout}`)
  }
}

const listMobileArchiveEntries = (label, artifactPath) => {
  const result = spawnSync('unzip', ['-Z', '-1', artifactPath], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  })
  if (result.status !== 0) {
    fail(`${label} entries cannot be read as an APK/AAB/IPA ZIP archive: ${result.stderr || result.stdout}`)
  }
  return result.stdout.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)
}

const assertArtifactMatchesReleaseTargets = ({ artifactPath, releaseTargets, label }) => {
  if (releaseTargets.length !== 1) {
    fail(`${label} supports one platform per single release artifact. Create separate native evidence files for android and ios.`)
  }
  const target = releaseTargets[0]
  const ext = path.extname(artifactPath).toLowerCase()
  if (target === 'android' && !['.apk', '.aab'].includes(ext)) {
    fail(`${label} for android must use an APK or AAB release artifact`)
  }
  if (target === 'ios' && ext !== '.ipa') {
    fail(`${label} for ios must use an IPA release artifact`)
  }
}

const assertMobileArchiveMatchesPlatform = ({ artifactPath, releaseTarget, label }) => {
  const ext = path.extname(artifactPath).toLowerCase()
  const entries = listMobileArchiveEntries(label, artifactPath)
  if (releaseTarget === 'android' && ext === '.apk' && !entries.includes('AndroidManifest.xml')) {
    fail(`${label} for android APK must contain AndroidManifest.xml at the archive root`)
  }
  if (releaseTarget === 'android' && ext === '.aab' && !entries.includes('base/manifest/AndroidManifest.xml')) {
    fail(`${label} for android AAB must contain base/manifest/AndroidManifest.xml`)
  }
  if (releaseTarget === 'ios' && ext === '.ipa' && !entries.some((entry) => /^Payload\/[^/]+\.app(?:\/|$)/.test(entry))) {
    fail(`${label} for ios IPA must contain a Payload/*.app bundle`)
  }
}

const containsTemplatePlaceholder = (value) => /\bTODO\b|placeholder|template/i.test(String(value || ''))

const evidencePath = process.argv[2] || process.env.XUNJING_NATIVE_DEVICE_EVIDENCE_FILE || '../../../../qa/xicheng-native-device-evidence.json'
const resolvedEvidencePath = path.resolve(process.cwd(), evidencePath)

if (!fs.existsSync(resolvedEvidencePath)) {
  fail(`Native device evidence file not found: ${resolvedEvidencePath}`)
}

let evidence
try {
  evidence = JSON.parse(fs.readFileSync(resolvedEvidencePath, 'utf8'))
} catch (error) {
  fail(`Native device evidence JSON is invalid: ${error.message}`)
}

if (evidence?.artifactType !== 'xicheng-native-device-evidence') {
  fail('Native device evidence artifactType must be xicheng-native-device-evidence')
}

if (String(evidence.templateNotice || '').trim()) {
  fail('Native device evidence must not include templateNotice; complete the real-device evidence template before launch')
}

assertFreshTimestamp('createdAt', evidence.createdAt)

if (evidence.branch !== 'feature/xicheng-p0') {
  fail('Native device evidence branch must be feature/xicheng-p0')
}

if (!/^[0-9a-f]{7,40}$/i.test(String(evidence.commit || ''))) {
  fail('Native device evidence commit must be a git SHA')
}

if (currentHead && String(evidence.commit || '').trim() !== currentHead) {
  fail(`Native device evidence commit must match current HEAD ${currentHead}`)
}

try {
  normalizeReleaseHttpsUrl('Native device evidence appApiBaseUrl', evidence.appApiBaseUrl)
} catch (error) {
  fail(error.message)
}

if (!String(evidence.tenantId || '').trim()) {
  fail('Native device evidence tenantId is required')
}

if (!/^[1-9]\d*$/.test(String(evidence.tenantId).trim())) {
  fail('Native device evidence tenantId must be a positive integer tenant id')
}

if (!evidence.build || evidence.build.mode !== 'release' || !String(evidence.build.artifact || '').trim()) {
  fail('Native device evidence build.mode must be release and build.artifact is required')
}

const artifactSha256 = String(evidence.build.artifactSha256 || '').trim().toLowerCase()
if (!/^[0-9a-f]{64}$/i.test(artifactSha256)) {
  fail('Native device evidence build.artifactSha256 must be a SHA256 hex digest')
}

const artifactSizeBytes = Number(evidence.build.artifactSizeBytes)
if (!Number.isSafeInteger(artifactSizeBytes) || artifactSizeBytes <= 0) {
  fail('Native device evidence build.artifactSizeBytes must be a positive integer')
}

const resolvedArtifactPath = resolveArtifactPath(String(evidence.build.artifact).trim())
if (!fs.existsSync(resolvedArtifactPath)) {
  fail(`Native device evidence release artifact not found: ${resolvedArtifactPath}`)
}

assertMobileReleaseArtifact('Native device evidence release artifact', resolvedArtifactPath)
assertReadableMobileArchive('Native device evidence release artifact', resolvedArtifactPath)

const artifactStat = fs.statSync(resolvedArtifactPath)
if (!artifactStat.isFile()) {
  fail(`Native device evidence release artifact must be a file: ${resolvedArtifactPath}`)
}

if (artifactStat.size !== artifactSizeBytes) {
  fail(`Native device evidence build.artifactSizeBytes mismatch: expected ${artifactSizeBytes}, got ${artifactStat.size}`)
}

const actualArtifactSha256 = crypto
  .createHash('sha256')
  .update(fs.readFileSync(resolvedArtifactPath))
  .digest('hex')

if (actualArtifactSha256 !== artifactSha256) {
  fail('Native device evidence build.artifactSha256 does not match the release artifact SHA256')
}

const releaseTargets = Array.isArray(evidence.releaseTargets) && evidence.releaseTargets.length > 0
  ? evidence.releaseTargets.map((target) => String(target || '').trim().toLowerCase()).filter(Boolean)
  : []

if (releaseTargets.length === 0) {
  fail('Native device evidence releaseTargets must include at least one platform')
}

const unsupportedReleaseTargets = releaseTargets.filter((target) => !supportedReleaseTargets.has(target))
if (unsupportedReleaseTargets.length > 0) {
  fail(`Native device evidence releaseTargets must be mobile platforms: android or ios; unsupported platform(s): ${unsupportedReleaseTargets.join(', ')}`)
}

assertArtifactMatchesReleaseTargets({
  artifactPath: resolvedArtifactPath,
  releaseTargets,
  label: 'Native device evidence releaseTargets'
})
assertMobileArchiveMatchesPlatform({
  artifactPath: resolvedArtifactPath,
  releaseTarget: releaseTargets[0],
  label: 'Native device evidence release artifact'
})

const devices = Array.isArray(evidence.devices) ? evidence.devices : []
for (const target of releaseTargets) {
  for (const device of devices) {
    for (const field of ['model', 'osVersion', 'appVersion', 'installer']) {
      if (containsTemplatePlaceholder(device?.[field])) {
        fail(`Native device evidence ${field} for ${target} must not contain TODO/template placeholders`)
      }
    }
  }
  const hasDevice = devices.some((device) => (
    device &&
    String(device.platform || '').trim().toLowerCase() === target &&
    String(device.model || '').trim() &&
    String(device.osVersion || '').trim() &&
    String(device.appVersion || '').trim() &&
    String(device.installer || '').trim()
  ))
  if (!hasDevice) {
    fail(`Native device evidence must include a physical device record for ${target} with model, osVersion, appVersion, and installer install channel`)
  }
}

const scenarios = Array.isArray(evidence.scenarios) ? evidence.scenarios : []
const scenarioById = new Map(scenarios.map((scenario) => [scenario?.id, scenario]))

for (const id of requiredScenarioIds) {
  const scenario = scenarioById.get(id)
  if (!scenario) {
    fail(`Native device evidence missing required scenario: ${id}`)
  }
  if (String(scenario.status || '').toUpperCase() !== 'PASS') {
    fail(`Native device evidence scenario ${id} must have status PASS`)
  }
  if (!releaseTargets.includes(String(scenario.platform || '').trim().toLowerCase())) {
    fail(`Native device evidence scenario ${id} must reference a release target platform`)
  }
  if (!String(scenario.evidenceRef || '').trim()) {
    fail(`Native device evidence scenario ${id} must include evidenceRef`)
  }
  if (containsTemplatePlaceholder(scenario.notes)) {
    fail(`Native device evidence scenario ${id} notes must not contain TODO/template placeholders`)
  }
  const resolvedEvidenceRef = resolveEvidenceRefPath(String(scenario.evidenceRef).trim())
  if (!isInsideDir(resolvedEvidenceRef, qaEvidenceRoot)) {
    fail(`Native device evidence scenario ${id} evidenceRef must be stored under qa/: ${resolvedEvidenceRef}`)
  }
  if (!fs.existsSync(resolvedEvidenceRef)) {
    fail(`Native device evidence scenario ${id} evidenceRef file not found: ${resolvedEvidenceRef} (截图/录屏)`)
  }
  const evidenceRefExt = path.extname(resolvedEvidenceRef).toLowerCase()
  if (!supportedEvidenceRefExtensions.has(evidenceRefExt)) {
    fail(`Native device evidence scenario ${id} evidenceRef must be a screenshot or recording file: jpg, jpeg, png, webp, mp4, or mov`)
  }
  const evidenceRefStat = fs.statSync(resolvedEvidenceRef)
  if (!evidenceRefStat.isFile() || evidenceRefStat.size <= 0) {
    fail(`Native device evidence scenario ${id} evidenceRef file must be a non-empty screenshot or recording`)
  }
  if (!evidenceRefContentMatchesExtension(resolvedEvidenceRef, evidenceRefExt)) {
    fail(`Native device evidence scenario ${id} evidenceRef file content must match a supported screenshot or recording media signature: JPEG, PNG, WebP, MP4, or MOV`)
  }
}

const scanEntryScenario = scenarioById.get('scan-entry-map-detail')
const scanEntryNotes = String(scanEntryScenario?.notes || '')
if (!scanEntryNotes.includes('/pages/map/detail') || !scanEntryNotes.includes('XICHENG-MAP-001')) {
  fail('Native device evidence scenario scan-entry-map-detail notes must include /pages/map/detail and XICHENG-MAP-001')
}

console.log(JSON.stringify({
  ok: true,
  evidenceFile: resolvedEvidencePath,
  releaseTargets,
  releaseArtifact: resolvedArtifactPath,
  artifactSizeBytes,
  artifactSha256,
  deviceCount: devices.length,
  scenarioCount: requiredScenarioIds.length,
  scenarioEvidenceFileCount: requiredScenarioIds.length
}, null, 2))
