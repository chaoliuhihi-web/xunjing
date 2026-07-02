import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuidePath = path.join(root, 'pages', 'ai-guide', 'ai-guide.vue')
const aiGuide = fs.readFileSync(aiGuidePath, 'utf8')
const recordEventSource = aiGuide.match(/const recordXunjingResourceEvent\s*=\s*\(options\) => \{[\s\S]*?\n\}/)?.[0] || ''
const loadPackageDetailSource = aiGuide.match(/const loadXunjingPackageDetail\s*=\s*async\s*\(context = xichengAiContext\.value\) => \{[\s\S]*?\n\}\n\nconst normalizeXunjingAiResponse/)?.[0] || ''
const askEventSource = aiGuide.match(/recordXunjingResourceEvent\(\{\s*eventType:\s*'ASK'[\s\S]*?\n\s*\}\)/)?.[0] || ''
const viewEventSource = aiGuide.match(/recordXunjingResourceEvent\(\{\s*eventType:\s*'VIEW'[\s\S]*?\n\s*\}\)/)?.[0] || ''
const sendMessageSource = aiGuide.match(/const sendMessage = async \(\) => \{[\s\S]*?\n\}\n\nconst sendInitialQuestion/)?.[0] || ''
const sendFailureCatchSource = sendMessageSource.match(/catch \(error\) \{[\s\S]*?console\.error\('调用 AI 失败:', error\)[\s\S]*?uni\.showToast\(\{[\s\S]*?发送失败[\s\S]*?\n\s*\}/)?.[0] || ''
const eventPayloadSource = aiGuide.match(/const buildXunjingResourceEventPayload\s*=\s*\(\{[\s\S]*?\n\}\nconst requestXunjingResourceEvent/)?.[0] || ''

assert.match(
  aiGuide,
  /const XUNJING_AI_CONFIG\s*=\s*\{[\s\S]*packageCode:\s*'KASHGAR-MAP-001'[\s\S]*apiPath:\s*'app-api\/xunjing\/ai\/chat'/,
  'AI guide should centralize the Yudao APP AI endpoint and Kashgar package code'
)

assert.match(
  aiGuide,
  /const buildYudaoAppApiUrl\s*=\s*\(path\)[\s\S]*config\.UrlYudaoAppRequest[\s\S]*config\.UrlRequest/,
  'AI guide should build Yudao APP API URLs from config, with the original online base as fallback'
)

assert.match(
  aiGuide,
  /const requestXunjingAiChat\s*=\s*\(question\)[\s\S]*const aiConfig = getActiveXunjingAiConfig\(context\)[\s\S]*uni\.request\(\{[\s\S]*url:\s*buildYudaoAppApiUrl\(aiConfig\.apiPath\)[\s\S]*method:\s*'POST'/,
  'AI guide should request the Yudao APP AI proxy through the active AI config'
)

assert.match(
  aiGuide,
  /const XUNJING_RESOURCE_CONFIG\s*=\s*\{[\s\S]*apiPath:\s*'app-api\/xunjing\/resource\/package'[\s\S]*packageCode:\s*XUNJING_AI_CONFIG\.packageCode/,
  'AI guide should centralize the Yudao public package endpoint without hardcoding a second package code'
)

assert.match(
  aiGuide,
  /const XUNJING_EVENT_CONFIG\s*=\s*\{[\s\S]*apiPath:\s*'app-api\/xunjing\/resource\/events'[\s\S]*packageCode:\s*XUNJING_AI_CONFIG\.packageCode[\s\S]*sceneCode:\s*XUNJING_AI_CONFIG\.sceneCode/,
  'AI guide should centralize the Yudao resource event endpoint with package and scene context'
)

assert.match(
  aiGuide,
  /const requestXunjingPackageDetail\s*=\s*\(context = xichengAiContext\.value\)[\s\S]*const resourceConfig = getActiveXunjingResourceConfig\(context\)[\s\S]*uni\.request\(\{[\s\S]*url:\s*buildYudaoAppApiUrl\(resourceConfig\.apiPath\)[\s\S]*method:\s*'GET'[\s\S]*packageCode:\s*resourceConfig\.packageCode[\s\S]*'tenant-id':\s*resourceConfig\.tenantId/,
  'AI guide should fetch public package detail from the Yudao APP API with active packageCode and tenant-id'
)

assert.match(
  aiGuide,
  /const buildXunjingResourceEventPayload\s*=\s*\(\{ payload = \{\}, context = \{\}, eventConfig = \{\} \} = \{\}\) => \{[\s\S]*hasXichengAiContext\(context\)[\s\S]*regionCode:\s*payload\.regionCode \|\| context\.regionCode \|\| XICHENG_REGION_CONFIG\.regionCode[\s\S]*packageCode:\s*payload\.packageCode \|\| context\.packageCode \|\| eventConfig\.packageCode \|\| XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*payload\.sceneCode \|\| context\.sceneCode \|\| XICHENG_REGION_CONFIG\.aiSceneCode[\s\S]*sourceChannel:\s*payload\.sourceChannel \|\| context\.sourceChannel \|\| eventConfig\.sourceChannel \|\| XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*poiCode:\s*payload\.poiCode \|\| context\.poiCode \|\| ''[\s\S]*poiName:\s*payload\.poiName \|\| context\.poiName \|\| ''[\s\S]*safetyStatus:\s*normalizeXichengSafetyStatus\(payload\.safetyStatus \|\| context\.safetyStatus \|\| ''\)/,
  'AI guide should centralize Xicheng resource event payload attribution before sending VIEW/ASK/MEDIA_USE/ERROR events'
)

assert.match(
  aiGuide,
  /const buildXunjingResourceEventPayload\s*=\s*\(\{ payload = \{\}, context = \{\}, eventConfig = \{\} \} = \{\}\) => \{[\s\S]*poiName:\s*payload\.poiName \|\| context\.poiName \|\| ''[\s\S]*\.\.\.createXichengVisionAgentChatContextFields\(context\)[\s\S]*\.\.\.createXichengServiceHandoffEvidenceFields\(context\)[\s\S]*safetyStatus:\s*normalizeXichengSafetyStatus/,
  'AI guide resource event payload should preserve AI Scene Vision structured context before service handoff evidence'
)

assert.ok(eventPayloadSource, 'AI guide should expose buildXunjingResourceEventPayload')
assert.doesNotMatch(
  eventPayloadSource,
  /sourceRecognitionContext|photoPath|latitude|longitude/,
  'AI guide resource event payload should not copy raw recognition context, photo paths, or coordinates into analytics payloadJson'
)

assert.match(
  aiGuide,
  /const requestXunjingResourceEvent\s*=\s*\(\{ eventType = 'VIEW', payload = \{\}, context = xichengAiContext\.value \} = \{\}\)[\s\S]*const eventConfig = getActiveXunjingEventConfig\(context\)[\s\S]*const eventPayload = buildXunjingResourceEventPayload\(\{ payload, context, eventConfig \}\)[\s\S]*uni\.request\(\{[\s\S]*url:\s*buildYudaoAppApiUrl\(eventConfig\.apiPath\)[\s\S]*method:\s*'POST'[\s\S]*'tenant-id':\s*eventConfig\.tenantId[\s\S]*packageCode:\s*eventConfig\.packageCode[\s\S]*sceneCode:\s*eventConfig\.sceneCode[\s\S]*eventType[\s\S]*sourceChannel:\s*eventConfig\.sourceChannel[\s\S]*payloadJson:\s*JSON\.stringify\(eventPayload\)/,
  'AI guide should post Yudao resource events with active tenant-id, packageCode, sceneCode, eventType, sourceChannel, userTraceId, and normalized payloadJson'
)

assert.match(
  aiGuide,
  /const recordXunjingResourceEvent\s*=\s*\(options\)[\s\S]*requestXunjingResourceEvent\(options\)[\s\S]*catch/,
  'AI guide should make resource event reporting non-blocking and tolerate gateway failures'
)

assert.doesNotMatch(
  recordEventSource,
  /console\.(warn|error)/,
  'AI guide should not pollute release QA console health when optional resource event reporting fails'
)

assert.match(
  aiGuide,
  /const applyXunjingPackageDetail\s*=\s*\(detail\)[\s\S]*detail\.mapPoints[\s\S]*detail\.mediaAssets[\s\S]*aiCompanionPlaces\.value\s*=/,
  'AI guide should use Yudao public package mapPoints/mediaAssets to hydrate the companion home when available'
)

assert.match(
  aiGuide,
  /const defaultAiCompanionPlaces\s*=\s*cloneContentList\(KASHGAR_AI_COMPANION_PLACES\)/,
  'AI guide should define the package hydration fallback places before applyXunjingPackageDetail uses them'
)

assert.match(
  aiGuide,
  /const applyXunjingPackageDetail\s*=\s*\(detail\)[\s\S]*const fallback = defaultAiCompanionPlaces\[index\] \|\| defaultAiCompanionPlaces\[0\]/,
  'AI guide package hydration should use the defined fallback places for missing media or summaries'
)

assert.match(
  aiGuide,
  /const loadXunjingPackageDetail\s*=\s*async\s*\(context = xichengAiContext\.value\)[\s\S]*requestXunjingPackageDetail\(context\)[\s\S]*applyXunjingPackageDetail\(detail\)[\s\S]*catch/,
  'AI guide should load active package detail non-blockingly and keep local content on gateway failures'
)

assert.doesNotMatch(
  loadPackageDetailSource,
  /console\.(warn|error)/,
  'AI guide should not pollute release QA console health when optional package detail hydration fails'
)

assert.match(
  aiGuide,
  /onLoad\(\(options = \{\}\) => \{[\s\S]*const context = refreshXichengAiRouteContext\(\{ routeOptions: options, preferCache: false \}\) \|\| xichengAiContext\.value[\s\S]*loadXunjingPackageDetail\(context\)[\s\S]*recordXunjingResourceEvent\(\{[\s\S]*eventType:\s*'VIEW'[\s\S]*page:\s*'ai-guide'/,
  'AI guide should start public package loading and record a non-blocking page view during page load'
)

for (const required of [
  'packageCode: context.packageCode || XICHENG_REGION_CONFIG.packageCode',
  'sceneCode: context.sceneCode || XICHENG_REGION_CONFIG.aiSceneCode',
  'sourceChannel: context.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel',
  "poiName: context.poiName || ''",
  "safetyStatus: context.safetyStatus || ''",
  "companionName: context.companionName || XICHENG_REGION_CONFIG.companionName"
]) {
  assert.ok(viewEventSource.includes(required), `Xicheng VIEW event payload should include operations field ${required}`)
}

assert.doesNotMatch(
  viewEventSource,
  /question:\s*options\.question|decodeRouteValue\(options\.question\)|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'AI guide VIEW event payload should not include the raw initial question or client-side secrets'
)

assert.match(
  aiGuide,
  /const aiResult = await startXunjingAiRequest\([\s\S]*recordXunjingResourceEvent\(\{[\s\S]*eventType:\s*'ASK'[\s\S]*questionLength:\s*userMessage\.length[\s\S]*fallback:\s*Boolean\(aiResult && aiResult\.fallback\)/,
  'AI guide should record an ASK event after AI replies without blocking the user response'
)

assert.ok(
  sendMessageSource.includes("const askSafetyStatus = normalizeXichengSafetyStatus(aiResult && aiResult.safetyStatus ? aiResult.safetyStatus : xichengAiContext.value.safetyStatus || '')"),
  'AI guide should normalize ASK safety status once before recording operations fields'
)

for (const required of [
  'packageCode: xichengAiContext.value.packageCode || XICHENG_REGION_CONFIG.packageCode',
  'sceneCode: XICHENG_REGION_CONFIG.aiSceneCode',
  'sourceChannel: xichengAiContext.value.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel',
  "poiName: xichengAiContext.value.poiName || ''",
  'safetyStatus: askSafetyStatus',
  "blocked: askSafetyStatus === 'BLOCKED'",
  "unavailable: askSafetyStatus === 'UNAVAILABLE'",
  'answerLength: aiResult && aiResult.answer ? String(aiResult.answer).length : 0'
]) {
  assert.ok(askEventSource.includes(required), `Xicheng ASK event payload should include operations field ${required}`)
}

assert.doesNotMatch(
  askEventSource,
  /question:\s*userMessage/,
  'Resource event payloads should avoid storing the raw user question in client-side analytics'
)

assert.match(
  sendFailureCatchSource,
  /recordXunjingResourceEvent\(\{[\s\S]*eventType:\s*'ERROR_FEEDBACK'[\s\S]*page:\s*'ai-guide'[\s\S]*category:\s*'ai_request_failed'[\s\S]*severity:\s*'ERROR'[\s\S]*questionLength:\s*userMessage\.length/,
  'AI guide should report non-interrupted send failures as ERROR_FEEDBACK events for operations triage'
)

for (const required of [
  'packageCode: xichengAiContext.value.packageCode || XICHENG_REGION_CONFIG.packageCode',
  'sceneCode: XICHENG_REGION_CONFIG.aiSceneCode',
  'sourceChannel: xichengAiContext.value.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel',
  "regionCode: xichengAiContext.value.regionCode || ''",
  "poiCode: xichengAiContext.value.poiCode || ''",
  "poiName: xichengAiContext.value.poiName || ''",
  "safetyStatus: xichengAiContext.value.safetyStatus || ''"
]) {
  assert.ok(sendFailureCatchSource.includes(required), `AI failure event payload should include ${required}`)
}

assert.doesNotMatch(
  sendFailureCatchSource,
  /question:\s*userMessage|inputText\.value|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'AI failure event payload should not include the raw user question or client-side secrets'
)

for (const required of [
  'const aiConfig = getActiveXunjingAiConfig(context)',
  "'tenant-id': aiConfig.tenantId",
  'packageCode: aiConfig.packageCode',
  'question',
  'sceneCode: aiConfig.sceneCode',
  'sourceChannel: aiConfig.sourceChannel',
  'userTraceId: getUserTraceId()'
]) {
  assert.ok(aiGuide.includes(required), `Yudao AI request should include ${required}`)
}

assert.match(
  aiGuide,
  /const normalizeXunjingAiResponse\s*=\s*\(res\)[\s\S]*res\.data\.code[\s\S]*answer[\s\S]*sources/,
  'AI guide should normalize the Yudao CommonResult response into answer and sources'
)

assert.match(
  aiGuide,
  /const createLocalKashgarAiFallback\s*=\s*\(question = ''\)[\s\S]*喀什古城[\s\S]*followUps/,
  'AI guide should provide a Kashgar-local fallback answer when the online Yudao AI proxy is unavailable'
)

assert.match(
  aiGuide,
  /if \(result && result\.fallback\)[\s\S]*commitAssistantMessage\(assistantMessage,[\s\S]*followUps: result\.followUps/,
  'AI guide should render fallback answers as successful assistant replies instead of showing a send failure'
)

assert.match(
  aiGuide,
  /statusCode:\s*res && res\.statusCode[\s\S]*fallback:\s*true/,
  'AI guide should convert non-2xx Yudao responses such as the current online 404 into a fallback result'
)

assert.match(
  aiGuide,
  /const createSourceFollowUps\s*=\s*\(sources = \[\]\) => sources[\s\S]*\.map\(getDisplaySourceFollowUp\)[\s\S]*\.filter\(Boolean\)[\s\S]*\.slice\(0, 3\)/,
  'AI guide should surface Yudao sources as display-safe follow-up chips'
)

assert.match(
  aiGuide,
  /const startXunjingAiRequest\s*=\s*\(\{ question, assistantMessage \}\)[\s\S]*requestXunjingAiChat\(question\)[\s\S]*appendAnswerContent\(state, result\.answer\)/,
  'AI guide should keep the existing assistant bubble flow while using the Yudao AI response'
)

assert.match(
  aiGuide,
  /import \{ resolveXichengPhotoTrigger \} from '@\/request\/xunjing\/trigger\.js'/,
  'AI guide should use the Xicheng trigger facade for photo recognition so sources and safetyStatus are normalized'
)

assert.match(
  aiGuide,
  /const uploadAndSendImage\s*=\s*async\s*\(filePath\)[\s\S]*resolveXichengPhotoTrigger\(\{[\s\S]*filePath[\s\S]*ocrText:\s*inputText\.value[\s\S]*recordXunjingResourceEvent\(\{[\s\S]*eventType:\s*'MEDIA_USE'/,
  'Image selection should call the Yudao multimodal trigger backend and record a non-blocking media event'
)

assert.match(
  aiGuide,
  /const buildXunjingTriggerAssistantContent\s*=\s*\(trigger\)[\s\S]*trigger\.poiName[\s\S]*trigger\.confidence[\s\S]*requiresUserConfirm/,
  'AI guide should turn multimodal trigger results into a user-facing recognition reply'
)

assert.match(
  aiGuide,
  /const isAiSpeechEnabled\s*=\s*\(\)\s*=>\s*false[\s\S]*const enqueueAiSpeech\s*=\s*\(content/,
  'Speech playback should remain disabled until a backend speech proxy is available'
)

assert.doesNotMatch(
  aiGuide,
  /COZE_CONFIG|COZE_TTS_CONFIG|requestCozeSpeech|uploadImageToCoze|startCozeStream|https:\/\/api\.coze\.cn|pat_[A-Za-z0-9]{20,}|Authorization['"]?\s*:\s*`Bearer|uni\.uploadFile\(/,
  'AI guide should not expose Coze client credentials or call Coze APIs directly'
)
