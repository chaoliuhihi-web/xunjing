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
  'poiCode: context.poiCode ||',
  'poiName: context.poiName ||',
  'companionName: context.companionName || XICHENG_REGION_CONFIG.companionName',
  "safetyStatus: context.safetyStatus || ''"
]) {
  assert.ok(buildPayloadBlock.includes(required), `Xicheng chat payload should include ${required}`)
}

assert.match(
  chatRequest,
  /const XICHENG_BLOCKED_ANSWER\s*=\s*'无已审核来源，不能回答'/,
  'Xicheng chat facade should share the exact blocked-answer copy used by Xiaojing'
)

assert.match(
  normalizeResponseBlock,
  /const safetyStatus = payload\.safetyStatus \|\| ''/,
  'Xicheng chat response normalization should keep safetyStatus as a first-class field'
)

assert.match(
  normalizeResponseBlock,
  /answer:\s*safetyStatus === 'BLOCKED'\s*\?\s*XICHENG_BLOCKED_ANSWER\s*:\s*payload\.answer/,
  'Xicheng chat response normalization should convert BLOCKED responses into the exact refused answer'
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
