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
  /const sourceBackedAnswerUnavailable = \['BLOCKED', 'UNAVAILABLE'\]\.includes\(safetyStatus\)[\s\S]*const safeSuggestedQuestions = sourceBackedAnswerUnavailable \? \[\] : suggestedQuestions[\s\S]*followUps:\s*safeSuggestedQuestions/,
  'Xicheng chat response normalization should expose safe followUps while clearing prompts for BLOCKED or UNAVAILABLE responses'
)

assert.match(
  normalizeResponseBlock,
  /const answer = safetyStatus === 'BLOCKED'\s*\?\s*XICHENG_BLOCKED_ANSWER[\s\S]*safetyStatus === 'UNAVAILABLE'\s*\?\s*XICHENG_UNAVAILABLE_ANSWER[\s\S]*answer,/,
  'Xicheng chat response normalization should convert BLOCKED responses into the exact refused answer'
)

assert.match(
  normalizeResponseBlock,
  /const safeSources = sourceBackedAnswerUnavailable \? \[\] : normalizeXichengReviewedSources\(payload\.sources\)[\s\S]*sources:\s*safeSources/,
  'Xicheng chat response normalization should fail closed and clear sources when safetyStatus is BLOCKED or UNAVAILABLE'
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
const getYudaoCommonResultPayload = (res) => res && res.data && res.data.data ? res.data.data : {}`
  )
  .replace(
    /import \{ normalizeXichengSafetyStatus \} from '@\/request\/xunjing\/safety\.js'/,
    `const normalizeXichengSafetyStatus = (safetyStatus = '') => String(safetyStatus || '').trim().toUpperCase()`
  )
  .replace(
    /import \{ normalizeXichengReviewedSources \} from '@\/request\/xunjing\/sources\.js'/,
    `const normalizeXichengReviewedSources = (sources = []) => Array.isArray(sources) ? sources : []`
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

const { normalizeXichengAiChatResponse } = await import(
  `data:text/javascript;base64,${Buffer.from(runtimeChatSource).toString('base64')}`
)

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
