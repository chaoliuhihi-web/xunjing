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

for (const required of [
  'regionCode: trigger.regionCode || XICHENG_REGION_CONFIG.regionCode',
  'packageCode: trigger.packageCode || XICHENG_REGION_CONFIG.packageCode',
  'sceneCode: trigger.sceneCode || XICHENG_REGION_CONFIG.sceneCode',
  'sourceChannel: trigger.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel',
  'companionName: trigger.companionName || XICHENG_REGION_CONFIG.companionName',
  'safetyStatus: trigger.safetyStatus || \'\'',
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
  /persistXichengMultimodalRecognition\(trigger = \{\}\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.storageKey[\s\S]*sources:\s*Array\.isArray\(trigger\.sources\) \? trigger\.sources : \[\][\s\S]*suggestedQuestions:\s*Array\.isArray\(trigger\.suggestedQuestions\) \? trigger\.suggestedQuestions : \[\]/,
  'Index should cache reviewed sources and suggested questions for the Xiaojing page instead of dropping them from the direct multimodal path'
)

assert.doesNotMatch(
  indexPage,
  /Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Index multimodal Xiaojing context wiring should not introduce client-side AI secrets'
)
