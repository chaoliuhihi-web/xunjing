import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuidePath = path.join(root, 'pages', 'ai-guide', 'ai-guide.vue')
const aiGuide = fs.readFileSync(aiGuidePath, 'utf8')
const askEventSource = aiGuide.match(/recordXunjingResourceEvent\(\{\s*eventType:\s*'ASK'[\s\S]*?\n\s*\}\)/)?.[0] || ''

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
  /const requestXunjingAiChat\s*=\s*\(question\)[\s\S]*uni\.request\(\{[\s\S]*url:\s*buildYudaoAppApiUrl\(XUNJING_AI_CONFIG\.apiPath\)[\s\S]*method:\s*'POST'/,
  'AI guide should request the Yudao APP AI proxy through uni.request'
)

assert.match(
  aiGuide,
  /const XUNJING_RESOURCE_CONFIG\s*=\s*\{[\s\S]*apiPath:\s*'app-api\/xunjing\/resource\/package'[\s\S]*packageCode:\s*XUNJING_AI_CONFIG\.packageCode/,
  'AI guide should centralize the Yudao public package endpoint without hardcoding a second package code'
)

assert.match(
  aiGuide,
  /const XUNJING_EVENT_CONFIG\s*=\s*\{[\s\S]*apiPath:\s*'app-api\/xunjing\/resource\/events'[\s\S]*packageCode:\s*XUNJING_AI_CONFIG\.packageCode/,
  'AI guide should centralize the Yudao resource event endpoint without hardcoding a second package code'
)

assert.match(
  aiGuide,
  /const requestXunjingPackageDetail\s*=\s*\(context = xichengAiContext\.value\)[\s\S]*const resourceConfig = getActiveXunjingResourceConfig\(context\)[\s\S]*uni\.request\(\{[\s\S]*url:\s*buildYudaoAppApiUrl\(resourceConfig\.apiPath\)[\s\S]*method:\s*'GET'[\s\S]*packageCode:\s*resourceConfig\.packageCode[\s\S]*'tenant-id':\s*resourceConfig\.tenantId/,
  'AI guide should fetch public package detail from the Yudao APP API with active packageCode and tenant-id'
)

assert.match(
  aiGuide,
  /const requestXunjingResourceEvent\s*=\s*\(\{ eventType = 'VIEW', payload = \{\}, context = xichengAiContext\.value \} = \{\}\)[\s\S]*const eventConfig = getActiveXunjingEventConfig\(context\)[\s\S]*uni\.request\(\{[\s\S]*url:\s*buildYudaoAppApiUrl\(eventConfig\.apiPath\)[\s\S]*method:\s*'POST'[\s\S]*'tenant-id':\s*eventConfig\.tenantId[\s\S]*packageCode:\s*eventConfig\.packageCode[\s\S]*eventType[\s\S]*sourceChannel:\s*eventConfig\.sourceChannel[\s\S]*payloadJson:\s*JSON\.stringify\(payload\)/,
  'AI guide should post Yudao resource events with active tenant-id, packageCode, eventType, sourceChannel, userTraceId, and payloadJson'
)

assert.match(
  aiGuide,
  /const recordXunjingResourceEvent\s*=\s*\(options\)[\s\S]*requestXunjingResourceEvent\(options\)[\s\S]*catch/,
  'AI guide should make resource event reporting non-blocking and tolerate gateway failures'
)

assert.match(
  aiGuide,
  /const applyXunjingPackageDetail\s*=\s*\(detail\)[\s\S]*detail\.mapPoints[\s\S]*detail\.mediaAssets[\s\S]*aiCompanionPlaces\.value\s*=/,
  'AI guide should use Yudao public package mapPoints/mediaAssets to hydrate the companion home when available'
)

assert.match(
  aiGuide,
  /const loadXunjingPackageDetail\s*=\s*async\s*\(context = xichengAiContext\.value\)[\s\S]*requestXunjingPackageDetail\(context\)[\s\S]*applyXunjingPackageDetail\(detail\)[\s\S]*catch/,
  'AI guide should load active package detail non-blockingly and keep local content on gateway failures'
)

assert.match(
  aiGuide,
  /onLoad\(\(options = \{\}\) => \{[\s\S]*const context = applyXichengAiContext\(options\)[\s\S]*loadXunjingPackageDetail\(context\)[\s\S]*recordXunjingResourceEvent\(\{[\s\S]*eventType:\s*'VIEW'[\s\S]*page:\s*'ai-guide'/,
  'AI guide should start public package loading and record a non-blocking page view during page load'
)

assert.match(
  aiGuide,
  /const aiResult = await startXunjingAiRequest\([\s\S]*recordXunjingResourceEvent\(\{[\s\S]*eventType:\s*'ASK'[\s\S]*questionLength:\s*userMessage\.length[\s\S]*fallback:\s*Boolean\(aiResult && aiResult\.fallback\)/,
  'AI guide should record an ASK event after AI replies without blocking the user response'
)

assert.doesNotMatch(
  askEventSource,
  /question:\s*userMessage/,
  'Resource event payloads should avoid storing the raw user question in client-side analytics'
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
  /const createSourceFollowUps\s*=\s*\(sources = \[\]\)[\s\S]*source\.title/,
  'AI guide should surface Yudao source titles as follow-up chips'
)

assert.match(
  aiGuide,
  /const startXunjingAiRequest\s*=\s*\(\{ question, assistantMessage \}\)[\s\S]*requestXunjingAiChat\(question\)[\s\S]*appendAnswerContent\(state, result\.answer\)/,
  'AI guide should keep the existing assistant bubble flow while using the Yudao AI response'
)

assert.match(
  aiGuide,
  /import \{ resolveXunjingPhotoTrigger \} from '@\/request\/xunjingMultimodal\.js'/,
  'AI guide should use the shared Xunjing multimodal trigger request module for photo recognition'
)

assert.match(
  aiGuide,
  /const uploadAndSendImage\s*=\s*async\s*\(filePath\)[\s\S]*resolveXunjingPhotoTrigger\(\{[\s\S]*filePath[\s\S]*ocrText:\s*inputText\.value[\s\S]*recordXunjingResourceEvent\(\{[\s\S]*eventType:\s*'MEDIA_USE'/,
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
