import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'

const defaultOutputPath = '../../../../qa/xicheng-native-device-evidence.json'
const requiredScenarioIds = [
  'install-release-build',
  'home-loads-xicheng',
  'camera-photo-recognition',
  'ocr-text-recognition',
  'gps-recognition-permission',
  'text-recognition-baitasi',
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

const args = process.argv.slice(2)
const readArg = (name, fallback) => {
  const index = args.indexOf(name)
  if (index !== -1 && args[index + 1]) {
    return args[index + 1]
  }
  return fallback
}

const hasFlag = (name) => args.includes(name)

const runGit = (gitArgs) => {
  const result = spawnSync('git', gitArgs, {
    cwd: process.cwd(),
    encoding: 'utf8'
  })
  if (result.status !== 0) {
    fail(`Unable to run git ${gitArgs.join(' ')}: ${result.stderr || result.stdout}`)
  }
  return result.stdout.trim()
}

const assertNonLocalHttpsUrl = (label, value) => {
  let parsed
  try {
    parsed = new URL(String(value || '').trim())
  } catch {
    fail(`${label} must be a non-local HTTPS URL`)
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase()
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

  if (parsed.protocol !== 'https:' || localOrLanHost) {
    fail(`${label} must be a non-local HTTPS URL`)
  }

  return parsed.toString().replace(/\/+$/, '')
}

const resolveInputFile = (label, inputPath) => {
  if (!String(inputPath || '').trim()) {
    fail(`${label} is required`)
  }
  const resolved = path.resolve(process.cwd(), inputPath)
  if (!fs.existsSync(resolved)) {
    fail(`${label} not found: ${resolved}`)
  }
  if (!fs.statSync(resolved).isFile()) {
    fail(`${label} must be a file: ${resolved}`)
  }
  return resolved
}

const artifactArg = readArg('--artifact', process.env.XUNJING_RELEASE_ARTIFACT)
const outputArg = readArg('--output', process.env.XUNJING_NATIVE_DEVICE_EVIDENCE_FILE || defaultOutputPath)
const appApiBaseUrl = assertNonLocalHttpsUrl('XUNJING_APP_API_BASE_URL', process.env.XUNJING_APP_API_BASE_URL)
const tenantId = String(process.env.XUNJING_TENANT_ID || '').trim()

if (!tenantId) {
  fail('XUNJING_TENANT_ID is required')
}

const artifactPath = resolveInputFile('Release artifact', artifactArg)
const outputPath = path.resolve(process.cwd(), outputArg)
const force = hasFlag('--force')

if (fs.existsSync(outputPath) && !force) {
  fail(`Native device evidence template already exists: ${outputPath}. Pass --force to overwrite intentionally.`)
}

const platformArg = readArg('--platform', process.env.XUNJING_RELEASE_TARGETS || 'android')
const releaseTargets = platformArg
  .split(',')
  .map((target) => target.trim().toLowerCase())
  .filter(Boolean)

if (releaseTargets.length === 0) {
  fail('At least one release target platform is required')
}

const artifactBytes = fs.readFileSync(artifactPath)
const artifactSha256 = crypto.createHash('sha256').update(artifactBytes).digest('hex')
const currentCommit = runGit(['rev-parse', 'HEAD'])
const branch = String(process.env.XUNJING_RELEASE_BRANCH || 'feature/xicheng-p0').trim()
const firstPlatform = releaseTargets[0]

const evidence = {
  artifactType: 'xicheng-native-device-evidence',
  createdAt: new Date().toISOString(),
  branch,
  commit: currentCommit,
  appApiBaseUrl,
  tenantId,
  releaseTargets,
  build: {
    mode: 'release',
    artifact: artifactPath,
    artifactSha256,
    artifactSizeBytes: artifactBytes.length,
    command: 'npm run build:app:release'
  },
  devices: releaseTargets.map((platform) => ({
    platform,
    model: 'TODO physical device model',
    osVersion: 'TODO OS version',
    appVersion: 'TODO installed app version',
    installer: 'TODO installer or distribution channel'
  })),
  scenarios: requiredScenarioIds.map((id) => ({
    id,
    platform: firstPlatform,
    status: 'TODO',
    evidenceRef: 'TODO screenshot-or-recording-path',
    notes: 'TODO replace with physical-device verification notes before setting status to PASS'
  })),
  templateNotice: 'This template is not launch evidence until every required scenario is verified on a physical device and marked PASS.'
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)

console.log(JSON.stringify({
  ok: true,
  output: outputPath,
  releaseArtifact: artifactPath,
  artifactSizeBytes: artifactBytes.length,
  artifactSha256,
  releaseTargets,
  scenarioCount: requiredScenarioIds.length
}, null, 2))
