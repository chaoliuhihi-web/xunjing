import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

assert.ok(exists('config', 'regions', 'xicheng.js'), 'Xicheng P0 should centralize city constants in config/regions/xicheng.js')
assert.ok(exists('request', 'xunjing', 'trigger.js'), 'Xicheng P0 should expose a dedicated request/xunjing/trigger.js facade')
assert.ok(exists('request', 'xunjing', 'chat.js'), 'Xicheng P0 should expose a dedicated request/xunjing/chat.js facade')
assert.ok(exists('pages', 'xicheng', 'home', 'home.vue'), 'Xicheng P0 should have a dedicated home page')
assert.ok(exists('pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'Xicheng P0 should have a dedicated recognition result page')

const regionConfig = read('config', 'regions', 'xicheng.js')
const triggerRequest = read('request', 'xunjing', 'trigger.js')
const chatRequest = read('request', 'xunjing', 'chat.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')
const pagesJson = read('pages.json')
const combined = [
  regionConfig,
  triggerRequest,
  chatRequest,
  home,
  scanResult,
  aiGuide
].join('\n')
const blockedAiBranch = aiGuide.match(/if\s*\(\s*result\s*&&\s*result\.safetyStatus\s*===\s*'BLOCKED'\s*\)\s*\{[\s\S]*?\n\s*\}\n\s*if\s*\(\s*result\s*&&\s*result\.fallback\s*\)/)?.[0] || ''

for (const required of [
  'XICHENG_REGION_CONFIG',
  "regionCode: 'beijing-xicheng'",
  "packageCode: 'XICHENG-MAP-001'",
  "sceneCode: 'xicheng-multimodal-trigger'",
  "companionName: '小京'",
  "cityName: '北京西城'",
  'routePassport',
  'parentChildTasks',
  'sharePoster'
]) {
  assert.ok(regionConfig.includes(required), `Xicheng region config should include ${required}`)
}

assert.match(
  regionConfig,
  /XICHENG_DEVELOPMENT_TRIGGER_FIXTURE[\s\S]*developmentOnly:\s*true[\s\S]*notForProduction:\s*true[\s\S]*白塔寺/,
  'Xicheng config should keep an explicit development-only trigger fixture for field demos without backend data'
)

assert.match(
  triggerRequest,
  /import \{[\s\S]*XICHENG_REGION_CONFIG[\s\S]*XICHENG_DEVELOPMENT_TRIGGER_FIXTURE[\s\S]*\} from '@\/config\/regions\/xicheng\.js'/,
  'Trigger facade should import Xicheng region config instead of hardcoding city constants in pages'
)

for (const required of [
  'app-api/xunjing/triggers/resolve',
  "'tenant-id': XICHENG_REGION_CONFIG.tenantId",
  'regionCode: XICHENG_REGION_CONFIG.regionCode',
  'packageCode: XICHENG_REGION_CONFIG.packageCode',
  'sceneCode: XICHENG_REGION_CONFIG.sceneCode',
  'sourceChannel: XICHENG_REGION_CONFIG.sourceChannel',
  'suggestedQuestions',
  'sources',
  'isXichengDevelopmentFallbackAllowed',
  'resolveXichengTextTrigger',
  'resolveXichengPhotoTrigger',
  'createXichengDevelopmentTriggerFallback'
]) {
  assert.ok(triggerRequest.includes(required), `Trigger facade should include ${required}`)
}

for (const required of [
  'app-api/xunjing/ai/chat',
  "'tenant-id': XICHENG_REGION_CONFIG.tenantId",
  'regionCode: context.regionCode || XICHENG_REGION_CONFIG.regionCode',
  'poiCode: context.poiCode',
  'poiName: context.poiName',
  'companionName: context.companionName || XICHENG_REGION_CONFIG.companionName',
  'suggestedQuestions',
  'sources',
  'safetyStatus'
]) {
  assert.ok(chatRequest.includes(required), `Chat facade should include ${required}`)
}

for (const required of [
  '小京',
  'AI旅伴',
  '扫一扫',
  '拍照识别',
  'OCR识别',
  '推荐路线',
  '开始记录',
  '生成游记草稿',
  'routePassport',
  'parentChildTasks',
  'sharePoster',
  'resolveXichengTextTrigger',
  'resolveXichengPhotoTrigger',
  '/pages/xicheng/scan-result/scan-result'
]) {
  assert.ok(home.includes(required), `Xicheng home should include ${required}`)
}

for (const required of [
  'confidencePercent',
  'sourceLabel',
  'suggestedQuestions',
  'sourceList',
  '已审核来源',
  'askXiaojing',
  '/pages/ai-guide/ai-guide?',
  'regionCode',
  'poiCode',
  'poiName',
  'companionName'
]) {
  assert.ok(scanResult.includes(required), `Recognition result page should include ${required}`)
}

assert.doesNotMatch(
  scanResult,
  /result:\s*normalizeResult\(\)[\s\S]*XICHENG_DEVELOPMENT_TRIGGER_FIXTURE/,
  'Recognition result page should not initialize empty production state by merging the development fixture as a real result'
)

assert.match(
  aiGuide,
  /XICHENG_BLOCKED_ANSWER\s*=\s*'无已审核来源，不能回答'/,
  'AI guide should define the exact blocked answer for unapproved-source responses'
)

assert.match(
  blockedAiBranch,
  /if\s*\(\s*result\s*&&\s*result\.safetyStatus\s*===\s*'BLOCKED'\s*\)[\s\S]*XICHENG_BLOCKED_ANSWER[\s\S]*sources:\s*result\.sources/,
  'AI guide should render BLOCKED as a blocked answer with sources metadata instead of using local fallback'
)

assert.doesNotMatch(
  blockedAiBranch,
  /createLocalXichengAiFallback|createLocalXunjingAiFallback/,
  'AI guide should never fabricate a local Xicheng answer for BLOCKED safety responses'
)

assert.match(
  aiGuide,
  /const xichengAiContext\s*=\s*ref\(\{[\s\S]*regionCode[\s\S]*poiCode[\s\S]*poiName[\s\S]*companionName/,
  'AI guide should keep Xicheng route context from recognition result navigation'
)

assert.match(
  aiGuide,
  /const requestXunjingAiChat\s*=\s*\(question\)[\s\S]*const context = xichengAiContext\.value \|\| \{\}[\s\S]*buildXichengContextQuestion\(question,\s*context\)/,
  'AI guide should pass Xicheng POI context into the AI request while preserving the user-facing question'
)

assert.match(
  aiGuide,
  /hasXichengAiContext\(context\) && !options\.question[\s\S]*showAiCompanionHome\.value = false[\s\S]*setWelcomeMessage\(\)/,
  'AI guide should open the Xiaojing chat shell instead of the Kashgar companion home when Xicheng context has no initial question'
)

assert.match(
  pagesJson,
  /"path":\s*"pages\/xicheng\/home\/home"[\s\S]*"navigationBarTitleText":\s*"西城AI旅伴"/,
  'pages.json should register the Xicheng home page'
)

assert.match(
  pagesJson,
  /"path":\s*"pages\/xicheng\/scan-result\/scan-result"[\s\S]*"navigationBarTitleText":\s*"识别结果"/,
  'pages.json should register the Xicheng recognition result page'
)

assert.doesNotMatch(
  combined,
  /COZE_CONFIG|QWEN_API_KEY|DASHSCOPE_API_KEY|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Xicheng P0 client flow should not expose AI vendor secrets'
)
