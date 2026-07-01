import fs from 'node:fs'
import path from 'node:path'

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

console.log(JSON.stringify({
  ok: true,
  evidenceFile: resolvedEvidencePath,
  releaseTargets,
  deviceCount: devices.length,
  scenarioCount: requiredScenarioIds.length
}, null, 2))
