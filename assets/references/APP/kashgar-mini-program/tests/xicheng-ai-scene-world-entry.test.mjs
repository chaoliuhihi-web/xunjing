import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const pagesJson = read('pages.json')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const scan = read('pages', 'xicheng', 'scan', 'scan.vue')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const regionConfig = read('config', 'regions', 'xicheng.js')

assert.match(
  pagesJson,
  /"path":\s*"pages\/xicheng\/scan\/scan"[\s\S]*"navigationBarTitleText":\s*"AI识境"/,
  'AI识境 should be the named first-class scan entry in pages.json'
)

for (const required of [
  'home-world-entry',
  '世界交互入口',
  'AI识境',
  '看见什么，就能问什么',
  'worldEntrySignals',
  'worldEntrySummary',
  'buildSceneVisionContext',
  'buildSceneVisionEntryUrl',
  'startSceneVisionAgent'
]) {
  assert.ok(home.includes(required), `Xicheng home should expose AI识境 world entry: ${required}`)
}

assert.match(
  home,
  /buildSceneVisionContext\(\)[\s\S]*localTimeText[\s\S]*weatherText[\s\S]*headingText[\s\S]*userInterestTags/,
  'Home AI识境 entry should gather time, weather, direction, and user-interest context'
)

assert.match(
  home,
  /buildSceneVisionEntryUrl\(context = this\.buildSceneVisionContext\(\), entry = 'home-world-entry'\)[\s\S]*sourceRecognitionContext[\s\S]*knowledgeGraphText/,
  'Home AI识境 entry should pass memory and knowledge graph context into the scan page'
)

assert.match(
  home,
  /startScanRecognition\(\)[\s\S]*const entry = 'home-primary'[\s\S]*this\.buildSceneVisionEntryUrl\(this\.buildSceneVisionContext\(\), entry\)/,
  'Existing scan entry should route through the same AI识境 context builder'
)

for (const required of [
  'AI识境',
  '看见什么，就能问什么',
  'applyVisionAgentQueryContext',
  'buildVisionAgentSceneContext',
  'visionAgentContext',
  'sourceRecognitionContext',
  'localTimeText',
  'weatherText',
  'headingText',
  'headingDegrees',
  'activityText',
  'serviceText',
  'knowledgeGraphText',
  'userInterestTags',
  '建筑/文物',
  '菜单/美食',
  '路牌/OCR',
  '非遗/活动'
]) {
  assert.ok(scan.includes(required), `AI识境 scan page should carry scene understanding signal: ${required}`)
}

assert.match(
  scan,
  /onLoad\(options = \{\}\)[\s\S]*this\.applyVisionAgentQueryContext\(options\)/,
  'Scan page should hydrate Vision Agent context from home route parameters on load'
)

assert.match(
  scan,
  /openScanResult\(trigger = \{\}, source = ''\)[\s\S]*visionAgentContext:\s*this\.buildVisionAgentSceneContext\(source, trigger\)/,
  'Scan result payload should carry fused Vision Agent scene context'
)

for (const required of [
  'visionAgentActionCards',
  'sceneServiceActions',
  'openVisionAgentAction',
  'openSceneServiceAction',
  'rememberVisionAgentServiceTask',
  'visionAgentServiceTasksStorageKey',
  '30秒视频',
  '深入历史',
  '儿童版',
  'English',
  '去下一个景点',
  '附近美食',
  '纪念品',
  '领取徽章',
  '生成游记',
  '推荐菜/点单',
  '加入旅行地图'
]) {
  assert.ok(scanResult.includes(required), `Scan result should expose Vision Agent action/service capability: ${required}`)
}

assert.match(
  regionConfig,
  /visionAgentServiceTasksStorageKey:\s*'xicheng_vision_agent_service_tasks'/,
  'Region config should own the local Vision Agent task package key'
)

assert.match(
  scanResult,
  /rememberVisionAgentServiceTask\(action = \{\}\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.visionAgentServiceTasksStorageKey/,
  'Service actions should be collected into a configured local Vision Agent task package'
)

assert.match(
  scanResult,
  /askXiaojing\(question = '', \{ serviceHandoffContext = null \} = \{\}\)[\s\S]*visionAgentContext[\s\S]*sourceRecognitionContext/,
  'Continuing into Xiaojing should preserve Vision Agent memory context'
)
