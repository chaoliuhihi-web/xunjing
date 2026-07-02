import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const chatRequest = fs.readFileSync(path.join(root, 'request', 'xunjing', 'chat.js'), 'utf8')

const buildPayloadBlock = chatRequest.match(/export const buildXichengAiChatPayload\s*=\s*\(\{ question = '', context = \{\} \} = \{\}\) => \(\{[\s\S]*?\n\}\)/)?.[0] || ''
const normalizeResponseBlock = chatRequest.match(/export const normalizeXichengAiChatResponse\s*=\s*\(payload = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''

assert.ok(buildPayloadBlock, 'Xicheng chat facade should expose buildXichengAiChatPayload')
assert.ok(normalizeResponseBlock, 'Xicheng chat facade should expose normalizeXichengAiChatResponse')

for (const required of [
  'packageCode: context.packageCode || XICHENG_REGION_CONFIG.packageCode',
  'regionCode: context.regionCode || XICHENG_REGION_CONFIG.regionCode',
  'sceneCode: context.sceneCode || XICHENG_REGION_CONFIG.aiSceneCode',
  'sourceChannel: context.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel',
  'poiCode: context.poiCode ||',
  'poiName: context.poiName ||',
  'companionName: context.companionName || XICHENG_REGION_CONFIG.companionName',
  'safetyStatus: normalizeXichengSafetyStatus(context.safetyStatus)'
]) {
  assert.ok(buildPayloadBlock.includes(required), `Xicheng chat payload should include ${required}`)
}

assert.ok(
  buildPayloadBlock.includes('...createXichengServiceHandoffEvidenceFields(context)'),
  'Xicheng chat payload should reuse the shared service handoff evidence helper so backend AI routing receives scene-service intent'
)

assert.match(
  chatRequest,
  /const XICHENG_BLOCKED_ANSWER\s*=\s*'无已审核来源，不能回答'/,
  'Xicheng chat facade should share the exact blocked-answer copy used by Xiaojing'
)

assert.match(
  chatRequest,
  /const XICHENG_UNAVAILABLE_ANSWER\s*=\s*'小京暂时无法获取已审核来源，请稍后再试'/,
  'Xicheng chat facade should share the exact unavailable-answer copy used by Xiaojing'
)

assert.match(
  normalizeResponseBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(payload\.safetyStatus\)/,
  'Xicheng chat response normalization should keep safetyStatus as a first-class field'
)

assert.match(
  normalizeResponseBlock,
  /const reviewedSources = normalizeXichengReviewedSources\(payload\.sources\)[\s\S]*const sourceBackedAnswerUnavailable = isXichengUnsafeSafetyStatus\(safetyStatus\) \|\| reviewedSources\.length === 0[\s\S]*const safeSuggestedQuestions = sourceBackedAnswerUnavailable \? \[\] : suggestedQuestions[\s\S]*followUps:\s*safeSuggestedQuestions/,
  'Xicheng chat response normalization should expose safe followUps while clearing prompts for unsafe or source-missing responses'
)

assert.match(
  normalizeResponseBlock,
  /const answer = responseSafetyStatus === 'BLOCKED'\s*\?\s*XICHENG_BLOCKED_ANSWER[\s\S]*responseSafetyStatus === 'UNAVAILABLE'\s*\?\s*XICHENG_UNAVAILABLE_ANSWER[\s\S]*answer,/,
  'Xicheng chat response normalization should convert BLOCKED or source-missing responses into exact refused copy'
)

assert.match(
  normalizeResponseBlock,
  /const safeSources = sourceBackedAnswerUnavailable \? \[\] : reviewedSources[\s\S]*sources:\s*safeSources/,
  'Xicheng chat response normalization should fail closed and clear sources when safetyStatus is unsafe or reviewed sources are missing'
)

assert.match(
  chatRequest,
  /'tenant-id':\s*XICHENG_REGION_CONFIG\.tenantId/,
  'Xicheng chat request should keep tenant-id on /app-api/xunjing/** calls'
)

assert.doesNotMatch(
  chatRequest,
  /Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Xicheng chat facade should not introduce client-side AI secrets'
)

let runtimeChatSource = chatRequest
  .replace(
    /import \{[\s\S]*?\} from '@\/request\/xunjingMultimodal\.js'/,
    `const buildYudaoAppApiUrl = (path) => 'https://example.test/' + path
const getXunjingUserTraceId = () => 'guest'
const getYudaoCommonResultPayload = (res) => {
  if (res && res.data && res.data.code !== undefined && Number(res.data.code) !== 0) {
    const error = new Error(res.data.msg || res.data.message || 'Yudao CommonResult failed')
    error.yudaoCommonResultCode = Number(res.data.code)
    throw error
  }
  return res && res.data && res.data.data ? res.data.data : {}
}`
  )
  .replace(
    /import \{[^}]*normalizeXichengSafetyStatus[^}]*\} from '@\/request\/xunjing\/safety\.js'/,
    `const normalizeXichengSafetyStatus = (safetyStatus = '') => String(safetyStatus || '').trim().toUpperCase()
const isXichengUnsafeSafetyStatus = (safetyStatus = '') => ['BLOCKED', 'UNAVAILABLE'].includes(normalizeXichengSafetyStatus(safetyStatus))`
  )
  .replace(
    /import \{ normalizeXichengReviewedSources \} from '@\/request\/xunjing\/sources\.js'/,
    `const normalizeXichengReviewedSources = (sources = []) => Array.isArray(sources) ? sources : []`
  )
  .replace(
    /import \{ createXichengServiceHandoffEvidenceFields \} from '@\/request\/xunjing\/serviceHandoff\.js'/,
    `const createXichengServiceHandoffEvidenceFields = (context = {}) => {
  const serviceHandoffContext = context.serviceHandoffContext || {}
  if (!serviceHandoffContext || !context.serviceHandoffTitle) return {}
  return {
    serviceHandoffActionKey: serviceHandoffContext.actionKey || '',
    serviceHandoffTaskType: serviceHandoffContext.taskType || '',
    serviceHandoffIntent: serviceHandoffContext.serviceIntent || '',
    serviceHandoffIntentText: context.serviceHandoffIntentText || serviceHandoffContext.serviceIntentText || '',
    serviceHandoffStepText: context.serviceHandoffStepText || '',
    serviceHandoffSummary: context.serviceHandoffSummary || serviceHandoffContext.handoffSummary || '',
    serviceHandoffRequiresRealSystem: Boolean(serviceHandoffContext.serviceIntent || serviceHandoffContext.taskType)
  }
}`
  )
  .replace(
    /import \{ XICHENG_REGION_CONFIG \} from '@\/config\/regions\/xicheng\.js'/,
    `const XICHENG_REGION_CONFIG = Object.freeze({
  packageCode: 'XICHENG-MAP-001',
  regionCode: 'beijing-xicheng',
  aiSceneCode: 'xicheng-ai-guide',
  sourceChannel: 'APP_UNIAPP',
  companionName: '小京',
  tenantId: '1'
})`
  )

const { normalizeXichengAiChatResponse, requestXichengAiChat } = await import(
  `data:text/javascript;base64,${Buffer.from(runtimeChatSource).toString('base64')}`
)

let lastRequestOptions = null
const installChatRequestMock = (handler) => {
  lastRequestOptions = null
  globalThis.uni = {
    request: (options) => {
      lastRequestOptions = options
      handler(options)
    }
  }
}

const blockedResponse = normalizeXichengAiChatResponse({
  answer: '后端不应展示的未审核回答',
  safetyStatus: 'blocked',
  suggestedQuestions: ['继续讲讲白塔寺'],
  sources: [{ title: '未使用来源' }],
  logId: 'blocked-log-1'
})

assert.deepEqual(
  blockedResponse,
  {
    answer: '无已审核来源，不能回答',
    suggestedQuestions: [],
    followUps: [],
    sources: [],
    safetyStatus: 'BLOCKED',
    logId: 'blocked-log-1'
  },
  'Xicheng chat facade should fail closed for BLOCKED responses without follow-ups or reviewed sources'
)

const unavailableResponse = normalizeXichengAiChatResponse({
  answer: '后端不应展示的未审核兜底回答',
  safetyStatus: 'unavailable',
  suggestedQuestions: ['继续追问不可用来源'],
  sources: [{ title: '不可用来源' }],
  logId: 'unavailable-log-1'
})

assert.deepEqual(
  unavailableResponse,
  {
    answer: '小京暂时无法获取已审核来源，请稍后再试',
    suggestedQuestions: [],
    followUps: [],
    sources: [],
    safetyStatus: 'UNAVAILABLE',
    logId: 'unavailable-log-1'
  },
  'Xicheng chat facade should fail closed for UNAVAILABLE responses without follow-ups or reviewed sources'
)

const sourceMissingResponse = normalizeXichengAiChatResponse({
  answer: '后端异常返回的无来源回答不应展示',
  safetyStatus: 'PASSED',
  suggestedQuestions: ['继续追问无来源回答'],
  sources: [],
  logId: 'missing-source-log-1'
})

assert.deepEqual(
  sourceMissingResponse,
  {
    answer: '小京暂时无法获取已审核来源，请稍后再试',
    suggestedQuestions: [],
    followUps: [],
    sources: [],
    safetyStatus: 'UNAVAILABLE',
    logId: 'missing-source-log-1'
  },
  'Xicheng chat facade should fail closed when a nominally safe response has no reviewed sources'
)

installChatRequestMock((options) => options.success?.({ statusCode: 503, data: { msg: 'service unavailable' } }))
await assert.rejects(
  () => requestXichengAiChat({
    question: '讲讲白塔寺',
    context: {
      poiCode: 'xicheng-baitasi',
      poiName: '妙应寺白塔',
      safetyStatus: 'PASSED',
      serviceHandoffTitle: '推荐菜/点单',
      serviceHandoffIntentText: '点餐',
      serviceHandoffStepText: '推荐菜/点单、优惠券、预约/排队',
      serviceHandoffSummary: '把菜单识别转成点单建议',
      serviceHandoffContext: {
        actionKey: 'nearby-food',
        taskType: 'merchant',
        serviceIntent: 'order',
        handoffSummary: '把菜单识别转成点单建议'
      }
    }
  }),
  (error) => {
    assert.match(error.message, /西城小京接口异常:503/)
    assert.equal(error.yudaoHttpStatusCode, 503)
    return true
  },
  'Xicheng chat facade should preserve HTTP status codes so callers can fail closed instead of treating guard failures as source-backed fallback'
)
assert.equal(lastRequestOptions.header['tenant-id'], '1')
assert.equal(lastRequestOptions.data.poiCode, 'xicheng-baitasi')
assert.equal(lastRequestOptions.data.serviceHandoffActionKey, 'nearby-food')
assert.equal(lastRequestOptions.data.serviceHandoffTaskType, 'merchant')
assert.equal(lastRequestOptions.data.serviceHandoffIntent, 'order')
assert.equal(lastRequestOptions.data.serviceHandoffRequiresRealSystem, true)

installChatRequestMock((options) => options.success?.({ statusCode: 200, data: { code: 401, msg: '账号未登录' } }))
await assert.rejects(
  () => requestXichengAiChat({
    question: '讲讲白塔寺',
    context: { poiCode: 'xicheng-baitasi', poiName: '妙应寺白塔', safetyStatus: 'PASSED' }
  }),
  (error) => {
    assert.equal(error.yudaoCommonResultCode, 401)
    assert.match(error.message, /账号未登录/)
    return true
  },
  'Xicheng chat facade should preserve CommonResult business codes for backend auth or guard failures'
)

delete globalThis.uni
