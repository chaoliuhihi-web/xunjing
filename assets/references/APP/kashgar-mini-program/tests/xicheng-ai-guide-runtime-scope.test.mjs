import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')

const packageDetailRequest = aiGuide.match(/const requestXunjingPackageDetail\s*=\s*\(context = xichengAiContext\.value\)[\s\S]*?\n\}/)?.[0] || ''
const resourceEventRequest = aiGuide.match(/const requestXunjingResourceEvent\s*=\s*\(\{ eventType = 'VIEW', payload = \{\}, context = xichengAiContext\.value \} = \{\}\)[\s\S]*?\n\}/)?.[0] || ''
const packageLoader = aiGuide.match(/const loadXunjingPackageDetail\s*=\s*async\s*\(context = xichengAiContext\.value\)[\s\S]*?\n\}/)?.[0] || ''
const onLoadBlock = aiGuide.match(/onLoad\(\(options = \{\}\) => \{[\s\S]*?\n\}\)/)?.[0] || ''
const initialXichengContext = aiGuide.match(/const xichengAiContext\s*=\s*ref\(\{[\s\S]*?\n\}\)/)?.[0] || ''
const normalizeContextBlock = aiGuide.match(/const normalizeXichengAiContext\s*=\s*\(options = \{\}\) => \(\{[\s\S]*?\n\}\)/)?.[0] || ''
const emptyCachedRecognitionBlock = aiGuide.match(/const createEmptyXichengRecognitionContext\s*=\s*\(\) => \(\{[\s\S]*?\n\}\)/)?.[0] || ''
const cachedRecognitionBlock = aiGuide.match(/const loadCachedXichengRecognitionContext\s*=\s*\(context = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const contextResetBlock = aiGuide.match(/xichengAiContext\.value = \{[\s\S]*?sources:\s*\[\][\s\S]*?\n\t\t\}/)?.[0] || ''
const contextApplyBlock = aiGuide.match(/xichengAiContext\.value = \{[\s\S]*?sources:\s*cachedRecognition\.sources[\s\S]*?\n\t\}/)?.[0] || ''

for (const [label, block] of [
  ['initial Xicheng AI context', initialXichengContext],
  ['normalized Xicheng route context', normalizeContextBlock],
  ['empty cached recognition context', emptyCachedRecognitionBlock],
  ['cached recognition context loader', cachedRecognitionBlock],
  ['invalid context reset', contextResetBlock],
  ['active Xicheng context apply', contextApplyBlock]
]) {
  assert.ok(block, `Should find ${label}`)
}

for (const required of [
  "sceneCode: ''",
  "sourceChannel: ''"
]) {
  assert.ok(initialXichengContext.includes(required), `Initial Xicheng context should include ${required}`)
  assert.ok(emptyCachedRecognitionBlock.includes(required), `Empty cached recognition context should include ${required}`)
  assert.ok(contextResetBlock.includes(required), `Invalid Xicheng context reset should include ${required}`)
}

for (const required of [
  'sceneCode: decodeRouteValue(options.sceneCode)',
  'sourceChannel: decodeRouteValue(options.sourceChannel)'
]) {
  assert.ok(normalizeContextBlock.includes(required), `Route options should hydrate ${required}`)
}

for (const required of [
  'sceneCode: cached.sceneCode ||',
  'sourceChannel: cached.sourceChannel ||'
]) {
  assert.ok(cachedRecognitionBlock.includes(required), `Cached recognition hydration should restore ${required}`)
}

for (const required of [
  'sceneCode: context.sceneCode || cachedRecognition.sceneCode || XICHENG_REGION_CONFIG.aiSceneCode',
  'sourceChannel: context.sourceChannel || cachedRecognition.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel'
]) {
  assert.ok(contextApplyBlock.includes(required), `Applied Xicheng context should preserve ${required}`)
}

assert.match(
  aiGuide,
  /const getActiveXunjingAiConfig\s*=\s*\(context = xichengAiContext\.value\) => \{[\s\S]*hasXichengAiContext\(context\)[\s\S]*packageCode:\s*context\.packageCode \|\| XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*XICHENG_REGION_CONFIG\.aiSceneCode[\s\S]*tenantId:\s*XICHENG_REGION_CONFIG\.tenantId[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*return XUNJING_AI_CONFIG/,
  'AI chat request should resolve package, scene, tenant, and source channel from active Xicheng context'
)

assert.match(
  aiGuide,
  /const getActiveXunjingResourceConfig\s*=\s*\(context = xichengAiContext\.value\) => \{[\s\S]*hasXichengAiContext\(context\)[\s\S]*packageCode:\s*context\.packageCode \|\| XICHENG_REGION_CONFIG\.packageCode[\s\S]*tenantId:\s*XICHENG_REGION_CONFIG\.tenantId[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*return XUNJING_RESOURCE_CONFIG/,
  'AI guide should resolve resource package config from active Xicheng context instead of always using the Kashgar package'
)

assert.match(
  aiGuide,
  /const getActiveXunjingEventConfig\s*=\s*\(context = xichengAiContext\.value\) => \{[\s\S]*hasXichengAiContext\(context\)[\s\S]*packageCode:\s*context\.packageCode \|\| XICHENG_REGION_CONFIG\.packageCode[\s\S]*tenantId:\s*XICHENG_REGION_CONFIG\.tenantId[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*return XUNJING_EVENT_CONFIG/,
  'AI guide should resolve analytics event config from active Xicheng context instead of always using the Kashgar package'
)

assert.match(
  packageDetailRequest,
  /const resourceConfig = getActiveXunjingResourceConfig\(context\)[\s\S]*url:\s*buildYudaoAppApiUrl\(resourceConfig\.apiPath\)[\s\S]*packageCode:\s*resourceConfig\.packageCode[\s\S]*'tenant-id':\s*resourceConfig\.tenantId/,
  'Package detail request should send the active Xicheng packageCode and tenant-id when Xiaojing is opened from a Xicheng recognition'
)

assert.match(
  resourceEventRequest,
  /const eventConfig = getActiveXunjingEventConfig\(context\)[\s\S]*url:\s*buildYudaoAppApiUrl\(eventConfig\.apiPath\)[\s\S]*'tenant-id':\s*eventConfig\.tenantId[\s\S]*packageCode:\s*eventConfig\.packageCode[\s\S]*sourceChannel:\s*eventConfig\.sourceChannel/,
  'Resource event request should send VIEW/ASK/MEDIA_USE events under the active Xicheng package'
)

assert.match(
  aiGuide,
  /const requestXunjingAiChat\s*=\s*\(question\)[\s\S]*const context = xichengAiContext\.value \|\| \{\}[\s\S]*const aiConfig = getActiveXunjingAiConfig\(context\)[\s\S]*packageCode:\s*aiConfig\.packageCode[\s\S]*sceneCode:\s*aiConfig\.sceneCode[\s\S]*sourceChannel:\s*aiConfig\.sourceChannel[\s\S]*url:\s*buildYudaoAppApiUrl\(aiConfig\.apiPath\)[\s\S]*'tenant-id':\s*aiConfig\.tenantId/,
  'AI chat request should send the active Xicheng tenant-id, API path, and package context when Xiaojing is opened from recognition'
)

assert.match(
  packageLoader,
  /const packageScope = getXunjingPackageDetailScope\(context\)[\s\S]*xunjingPackageDetailRequestedScope === packageScope[\s\S]*requestXunjingPackageDetail\(context\)/,
  'Package detail loading should be scoped by active package so Kashgar and Xicheng do not block each other'
)

assert.match(
  onLoadBlock,
  /const context = applyXichengAiContext\(options\)[\s\S]*loadXunjingPackageDetail\(context\)/,
  'AI guide onLoad should apply Xicheng route context before loading the active package detail'
)
