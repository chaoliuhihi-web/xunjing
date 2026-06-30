import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const indexPage = fs.readFileSync(path.join(root, 'pages', 'index', 'index.vue'), 'utf8')

const stringifyBlock = indexPage.match(/stringifyXunjingQuery\(params = \{\}\)[\s\S]*?\n\t\t\},\n\t\tsafeDecodeXunjingText/)?.[0] || ''
const targetPathBlock = indexPage.match(/normalizeXunjingTriggerTargetPath\(trigger = \{\}\)[\s\S]*?\n\t\t\},\n\t\tnavigateToXunjingTrigger/)?.[0] || ''
const navigateBlock = indexPage.match(/navigateToXunjingTrigger\(trigger = \{\}\)[\s\S]*?\n\t\t\},\n\t\tasync resolveXunjingMultimodalFromText/)?.[0] || ''

assert.ok(stringifyBlock, 'Index page should expose stringifyXunjingQuery')
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

assert.match(
  indexPage,
  /import \{ createXichengRouteOutputValue \} from '@\/request\/xunjing\/routeParams\.js'/,
  'Index multimodal entry should reuse the shared outbound route parameter normalizer'
)

assert.match(
  indexPage,
  /const encodeXunjingRouteValue = \(value = ''\) => createXichengRouteOutputValue\(value, \{ platform: process\.env\.UNI_PLATFORM \}\)/,
  'Index multimodal entry should create platform-safe route values before navigating to Xiaojing'
)

assert.match(
  stringifyBlock,
  /\$\{encodeXunjingRouteValue\(key\)\}=\$\{encodeXunjingRouteValue\(params\[key\]\)\}/,
  'Index multimodal query builder should use platform-safe route output values for every query parameter'
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
  /const targetUrl = this\.normalizeXunjingTriggerTargetPath\(trigger\)[\s\S]*if \(!trigger\.requiresUserConfirm\) \{[\s\S]*this\.persistXichengMultimodalRecognition\(trigger\)[\s\S]*this\.navigateToXunjingTarget\(targetUrl\)/,
  'Index should persist multimodal recognition only when navigation does not require a user confirmation gate'
)

assert.match(
  navigateBlock,
  /if \(modalRes\.confirm\) \{[\s\S]*this\.persistXichengMultimodalRecognition\(trigger\)[\s\S]*this\.navigateToXunjingTarget\(targetUrl\)[\s\S]*resolve\(true\)[\s\S]*return[\s\S]*\}[\s\S]*resolve\(false\)/,
  'Index should persist gated multimodal recognition only after the user confirms the modal'
)

assert.doesNotMatch(
  navigateBlock,
  /navigateToXunjingTrigger\(trigger = \{\}\)\s*\{[\s\S]*this\.persistXichengMultimodalRecognition\(trigger\)[\s\S]*const targetUrl = this\.normalizeXunjingTriggerTargetPath\(trigger\)/,
  'Index should not write recognition cache before the modal can be cancelled'
)

assert.match(
  targetPathBlock,
  /const question = encodeXunjingRouteValue\(`讲讲\$\{trigger\.poiName \|\| '这个地方'\}`\)/,
  'Index multimodal Xiaojing question should use the shared H5-safe route output helper'
)

assert.doesNotMatch(
  targetPathBlock,
  /encodeURIComponent\(`讲讲/,
  'Index multimodal Xiaojing question should not pre-encode Chinese text on H5'
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
