import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const indexPage = fs.readFileSync(path.join(root, 'pages', 'index', 'index.vue'), 'utf8')

const targetPathBlock = indexPage.match(/normalizeXunjingTriggerTargetPath\(trigger = \{\}\)[\s\S]*?\n\t\t\},\n\t\tnavigateToXunjingTrigger/)?.[0] || ''
const navigateBlock = indexPage.match(/navigateToXunjingTrigger\(trigger = \{\}\)[\s\S]*?\n\t\t\},\n\t\tasync resolveXunjingMultimodalFromText/)?.[0] || ''

assert.ok(targetPathBlock, 'Index page should expose normalizeXunjingTriggerTargetPath')
assert.ok(navigateBlock, 'Index page should expose navigateToXunjingTrigger')

assert.match(
  indexPage,
  /import \{ XICHENG_REGION_CONFIG \} from '@\/config\/regions\/xicheng\.js'/,
  'Index multimodal entry should reuse Xicheng region config for official APP context'
)

assert.match(
  indexPage,
  /import \{[^}]*isXichengUnsafeSafetyStatus[^}]*normalizeXichengSafetyStatus[^}]*\} from '@\/request\/xunjing\/safety\.js'/,
  'Index multimodal entry should reuse the shared Xicheng safety status normalizer'
)

assert.match(
  indexPage,
  /import \{ normalizeXichengReviewedSources \} from '@\/request\/xunjing\/sources\.js'/,
  'Index multimodal entry should reuse the shared reviewed source normalizer'
)

for (const required of [
  'regionCode: trigger.regionCode || XICHENG_REGION_CONFIG.regionCode',
  'packageCode: trigger.packageCode || XICHENG_REGION_CONFIG.packageCode',
  'sceneCode: trigger.sceneCode || XICHENG_REGION_CONFIG.sceneCode',
  'sourceChannel: trigger.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel',
  'companionName: trigger.companionName || XICHENG_REGION_CONFIG.companionName',
  'safetyStatus: normalizeXichengSafetyStatus(trigger.safetyStatus)',
  'trigger: \'multimodal\''
]) {
  assert.ok(targetPathBlock.includes(required), `Index multimodal target URL should carry ${required}`)
}

assert.match(
  navigateBlock,
  /this\.persistXichengMultimodalRecognition\(trigger\)[\s\S]*const targetUrl = this\.normalizeXunjingTriggerTargetPath\(trigger\)/,
  'Index should persist the full multimodal recognition before building Xiaojing or route target URLs'
)

assert.match(
  indexPage,
  /persistXichengMultimodalRecognition\(trigger = \{\}\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.storageKey[\s\S]*safetyStatus:\s*normalizeXichengSafetyStatus\(trigger\.safetyStatus\)[\s\S]*sources:\s*this\.normalizeXichengMultimodalSources\(trigger\)[\s\S]*suggestedQuestions:\s*this\.normalizeXichengMultimodalSuggestedQuestions\(trigger\)/,
  'Index should cache normalized safetyStatus plus safety-aware reviewed sources and suggested questions for the Xiaojing page'
)

const persistedSourcesBlock = indexPage.match(/normalizeXichengMultimodalSources\(trigger = \{\}\)[\s\S]*?\n\t\t\},/)?.[0] || ''
const persistedQuestionsBlock = indexPage.match(/normalizeXichengMultimodalSuggestedQuestions\(trigger = \{\}\)[\s\S]*?\n\t\t\},/)?.[0] || ''
const persistedRouteBlock = indexPage.match(/normalizeXichengMultimodalRoute\(trigger = \{\}\)[\s\S]*?\n\t\t\},/)?.[0] || ''

assert.match(
  persistedSourcesBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(trigger\.safetyStatus\)[\s\S]*isXichengUnsafeSafetyStatus\(safetyStatus\)[\s\S]*return \[\][\s\S]*return normalizeXichengReviewedSources\(trigger\.sources\)/,
  'Index should clear cached reviewed sources when multimodal recognition is BLOCKED or UNAVAILABLE'
)

assert.match(
  persistedQuestionsBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(trigger\.safetyStatus\)[\s\S]*isXichengUnsafeSafetyStatus\(safetyStatus\)[\s\S]*return \[\][\s\S]*Array\.isArray\(trigger\.suggestedQuestions\) \? trigger\.suggestedQuestions : \[\]/,
  'Index should clear cached suggested questions when multimodal recognition is BLOCKED or UNAVAILABLE'
)

assert.match(
  persistedRouteBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(trigger\.safetyStatus\)[\s\S]*isXichengUnsafeSafetyStatus\(safetyStatus\)[\s\S]*return null[\s\S]*return trigger\.routeRecommendation \|\| trigger\.recommendedRoute \|\| null/,
  'Index should clear cached route recommendations when multimodal recognition is BLOCKED or UNAVAILABLE'
)

assert.match(
  indexPage,
  /persistXichengMultimodalRecognition\(trigger = \{\}\)[\s\S]*routeRecommendation:\s*this\.normalizeXichengMultimodalRoute\(trigger\)[\s\S]*recommendedRoute:\s*this\.normalizeXichengMultimodalRoute\(trigger\)/,
  'Index should cache safety-aware route recommendations for recent recognition and Xiaojing context'
)

assert.doesNotMatch(
  indexPage,
  /Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Index multimodal Xiaojing context wiring should not introduce client-side AI secrets'
)
