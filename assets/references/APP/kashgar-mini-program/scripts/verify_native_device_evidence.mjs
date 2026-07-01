import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'

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

const resolveArtifactPath = (artifactPath) => {
  if (path.isAbsolute(artifactPath)) {
    return artifactPath
  }
  return path.resolve(getRepoRoot(), artifactPath)
}

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

assertFreshTimestamp('createdAt', evidence.createdAt)

if (evidence.branch !== 'feature/xicheng-p0') {
  fail('Native device evidence branch must be feature/xicheng-p0')
}

if (!/^[0-9a-f]{7,40}$/i.test(String(evidence.commit || ''))) {
  fail('Native device evidence commit must be a git SHA')
}

let parsedApiBaseUrl
try {
  parsedApiBaseUrl = new URL(String(evidence.appApiBaseUrl || ''))
} catch {
  fail('Native device evidence appApiBaseUrl must be a non-local HTTPS URL')
}

const hostname = parsedApiBaseUrl.hostname.replace(/^\[|\]$/g, '').toLowerCase()
const localOrLanHost = (
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '0.0.0.0' ||
  hostname === '::1' ||
  hostname.startsWith('10.') ||
  hostname.startsWith('172.') ||
  hostname.startsWith('192.168.') ||
  hostname.startsWith('169.254.')
)

if (parsedApiBaseUrl.protocol !== 'https:' || localOrLanHost) {
  fail('Native device evidence appApiBaseUrl must be a non-local HTTPS URL')
}

if (!String(evidence.tenantId || '').trim()) {
  fail('Native device evidence tenantId is required')
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

const devices = Array.isArray(evidence.devices) ? evidence.devices : []
for (const target of releaseTargets) {
  const hasDevice = devices.some((device) => (
    device &&
    String(device.platform || '').trim().toLowerCase() === target &&
    String(device.model || '').trim() &&
    String(device.osVersion || '').trim() &&
    String(device.appVersion || '').trim()
  ))
  if (!hasDevice) {
    fail(`Native device evidence must include a physical device record for ${target}`)
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
  scenarioCount: requiredScenarioIds.length
}, null, 2))
