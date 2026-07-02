import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

assert.match(
  regionConfig,
  /visionAgentMemorySessionStorageKey:\s*'xicheng_vision_agent_memory_session'/,
  'Xicheng config should name the AI识境 continuous memory session package storage key'
)

assert.match(
  regionConfig,
  /privacyClearStorageKeys:[\s\S]*XICHENG_REGION_BASE_CONFIG\.visionAgentMemorySessionStorageKey/,
  'Privacy clearing should remove AI识境 continuous memory session packages'
)

for (const required of [
  'AI识境连续会话包',
  'createVisionAgentMemorySessionPackage',
  'visionAgentMemorySessionPackage',
  'sceneCount',
  'poiTrailText',
  'continuityCueText',
  'domainContinuityText',
  'serviceContinuityText'
]) {
  assert.ok(scanResult.includes(required), `Scan result should expose Vision Agent memory session behavior: ${required}`)
}

assert.match(
  scanResult,
  /createVisionAgentMemorySnapshot\(stage = 'current'\)[\s\S]*const sceneUnderstandingPackage = this\.visionAgentSceneUnderstandingPackage[\s\S]*sceneUnderstandingPackage[\s\S]*primarySceneDomainKey[\s\S]*sceneDomainLabels:\s*sceneUnderstandingPackage\.domainCards[\s\S]*serviceIntentLabels:\s*this\.prioritizedSceneServiceActions/,
  'Memory snapshots should retain the shared scene understanding package, scene domains, and service intents so later captures know what the visitor was looking at'
)

assert.match(
  scanResult,
  /createVisionAgentMemorySessionPackage\(memoryTrail = \[\], currentSnapshot = null\)[\s\S]*if \(sessionSnapshots\.length === 0\) return null[\s\S]*sceneCount[\s\S]*poiTrailText[\s\S]*continuityCueText[\s\S]*domainContinuityText[\s\S]*serviceContinuityText/,
  'Continuous memory package should derive only from real snapshots and summarize POI trail, domains, and service continuity'
)

assert.match(
  scanResult,
  /rememberVisionAgentSceneMemory\(\)[\s\S]*const memorySessionPackage = this\.createVisionAgentMemorySessionPackage\(nextMemoryTrail, snapshot\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.visionAgentMemorySessionStorageKey, memorySessionPackage\)/,
  'Persisting scene memory should also persist a structured continuous memory session package'
)

assert.match(
  scanResult,
  /rememberVisionAgentServiceTask\(action = \{\}\)[\s\S]*memorySessionPackage:\s*this\.visionAgentMemorySessionPackage/,
  'Service task packages should carry the continuous memory session package into downstream actions'
)

for (const required of [
  'visionAgentMemorySessionPackage',
  'loadVisionAgentMemorySessionPackage',
  '连续识境',
  'AI识境连续会话包'
]) {
  assert.ok(travelogue.includes(required), `Travelogue should consume Vision Agent memory session packages: ${required}`)
}

assert.match(
  travelogue,
  /loadVisionAgentMemorySessionPackage\(\)[\s\S]*uni\.getStorageSync\(XICHENG_REGION_CONFIG\.visionAgentMemorySessionStorageKey\)[\s\S]*this\.visionAgentMemorySessionPackage/,
  'Travelogue should load the AI识境 continuous memory session package from local storage'
)

assert.match(
  travelogue,
  /createXichengTravelogueDraft\s*=\s*\(\{[\s\S]*visionAgentMemorySessionPackage = null[\s\S]*const visionAgentMemorySessionText[\s\S]*visionAgentMemorySessionPackage\.continuityCueText[\s\S]*visionAgentMemorySessionPackage\.poiTrailText/,
  'Generated travelogue copy should fold the continuous memory session package into the story'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*visionAgentMemorySessionPackage:\s*this\.visionAgentMemorySessionPackage[\s\S]*visionAgentMemorySceneCount:\s*this\.visionAgentMemorySessionPackage\?\.sceneCount/,
  'Local ops report should expose continuous memory session dimensions'
)
