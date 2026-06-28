import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

assert.ok(
  exists('request', 'xunjing', 'events.js'),
  'Xicheng APP should expose a dedicated xunjing event facade for operations feedback'
)

const eventRequest = read('request', 'xunjing', 'events.js')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')

for (const required of [
  "export const XICHENG_RESOURCE_EVENT_API_PATH = 'app-api/xunjing/resource/events'",
  'submitXichengRecognitionFeedbackEvent',
  'buildXichengRecognitionFeedbackEventPayload',
  "eventType: 'ERROR_FEEDBACK'",
  'payloadJson: JSON.stringify',
  'normalizeXichengSafetyStatus',
  'normalizeXichengReviewedSources',
  "'tenant-id': XICHENG_REGION_CONFIG.tenantId",
  'getXunjingUserTraceId()',
  'getYudaoCommonResultPayload(res)'
]) {
  assert.ok(eventRequest.includes(required), `Recognition feedback event facade should include ${required}`)
}

assert.match(
  eventRequest,
  /buildXichengRecognitionFeedbackEventPayload\s*=\s*\(feedback = \{\}\)[\s\S]*packageCode:\s*feedback\.packageCode \|\| XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*feedback\.sceneCode \|\| XICHENG_REGION_CONFIG\.sceneCode[\s\S]*eventType:\s*'ERROR_FEEDBACK'[\s\S]*sourceChannel:\s*feedback\.sourceChannel \|\| XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*userTraceId:\s*getXunjingUserTraceId\(\)[\s\S]*payloadJson:\s*JSON\.stringify/,
  'Recognition feedback event payload should carry package, scene, source channel, user trace id, and ERROR_FEEDBACK type'
)

assert.match(
  eventRequest,
  /payloadJson:\s*JSON\.stringify\(\{[\s\S]*category:\s*feedback\.misTrigger \? 'recognition_wrong' : 'recognition_confirmed'[\s\S]*feedbackId:\s*feedback\.feedbackId \|\| ''[\s\S]*poiCode:\s*feedback\.poiCode \|\| ''[\s\S]*poiName:\s*feedback\.poiName \|\| ''[\s\S]*confidence:\s*feedback\.confidence \|\| 0[\s\S]*safetyStatus:\s*normalizeXichengSafetyStatus\(feedback\.safetyStatus\)[\s\S]*sourceCount:\s*normalizeXichengReviewedSources\(feedback\.sources\)\.length[\s\S]*severity:\s*feedback\.misTrigger \? 'WARN' : 'INFO'/,
  'Recognition feedback event payload should send a bounded normalized-source summary instead of raw source arrays'
)

assert.doesNotMatch(
  eventRequest,
  /sources:\s*feedback\.sources|candidateConfirmationAudit|imageBase64|imageUrl|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Recognition feedback event facade should not upload raw sources, candidate audits, images, or client-side secrets'
)

assert.match(
  scanResult,
  /import \{ submitXichengRecognitionFeedbackEvent \} from '@\/request\/xunjing\/events\.js'/,
  'Recognition result page should import the Xicheng event facade'
)

assert.match(
  scanResult,
  /submitRecognitionFeedback\(feedbackType = 'correct'\)[\s\S]*const feedback = this\.createRecognitionFeedback\(feedbackType\)[\s\S]*this\.persistRecognitionFeedback\(feedback\)[\s\S]*this\.submitRecognitionFeedbackEvent\(feedback\)[\s\S]*this\.recognitionFeedback = feedback/,
  'Submitting recognition feedback should persist locally before attempting backend ERROR_FEEDBACK reporting'
)

assert.match(
  scanResult,
  /submitRecognitionFeedbackEvent\(feedback\)[\s\S]*submitXichengRecognitionFeedbackEvent\(feedback\)[\s\S]*\.then\(\(\) => this\.updateRecognitionFeedbackSyncStatus\(feedback\.feedbackId, 'synced'\)\)[\s\S]*\.catch\(\(\) => this\.updateRecognitionFeedbackSyncStatus\(feedback\.feedbackId, 'local_pending'\)\)/,
  'Backend feedback reporting should update sync status and fail back to local pending instead of blocking the user'
)

assert.match(
  scanResult,
  /createRecognitionFeedback\(feedbackType = 'correct'\)[\s\S]*eventType:\s*'ERROR_FEEDBACK'[\s\S]*syncStatus:\s*'local_pending'/,
  'Local feedback record should be marked as a pending ERROR_FEEDBACK event until backend reporting succeeds'
)

let eventRuntimeSource = eventRequest
  .replace(
    /import \{[\s\S]*?\} from '@\/request\/xunjingMultimodal\.js'/,
    `const buildYudaoAppApiUrl = (path) => 'https://example.test/' + path
const getXunjingUserTraceId = () => 'guest'
const getYudaoCommonResultPayload = (res) => res && res.data && res.data.data ? res.data.data : {}`
  )
  .replace(
    /import \{ normalizeXichengSafetyStatus \} from '@\/request\/xunjing\/safety\.js'/,
    `const normalizeXichengSafetyStatus = (safetyStatus = '') => String(safetyStatus || '').trim().toUpperCase()`
  )
  .replace(
    /import \{ normalizeXichengReviewedSources \} from '@\/request\/xunjing\/sources\.js'/,
    `const normalizeXichengReviewedSources = (sources = []) => Array.isArray(sources)
  ? sources.filter(source => source && (source.title || source.name || source.sourceTitle || source.sourceUrl || source.url || source.contentDigest || source.excerpt || source.summary))
  : []`
  )
  .replace(
    /import \{ XICHENG_REGION_CONFIG \} from '@\/config\/regions\/xicheng\.js'/,
    `const XICHENG_REGION_CONFIG = Object.freeze({
  packageCode: 'XICHENG-MAP-001',
  sceneCode: 'xicheng-multimodal-trigger',
  sourceChannel: 'APP_UNIAPP',
  tenantId: '1'
})`
  )

const { buildXichengRecognitionFeedbackEventPayload } = await import(
  `data:text/javascript;base64,${Buffer.from(eventRuntimeSource).toString('base64')}`
)
const feedbackPayload = buildXichengRecognitionFeedbackEventPayload({
  feedbackId: 'feedback-1',
  poiCode: 'xicheng-baitasi',
  poiName: '白塔寺',
  safetyStatus: 'approved',
  sources: [
    { title: '西城审核资料' },
    {},
    { rawText: '只有内部原文不能作为运营已审核来源' }
  ]
})
const parsedFeedbackPayload = JSON.parse(feedbackPayload.payloadJson)

assert.equal(
  parsedFeedbackPayload.sourceCount,
  1,
  'Recognition feedback event should count only normalized reviewed sources'
)
