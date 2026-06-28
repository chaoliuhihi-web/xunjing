import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

assert.ok(
  exists('request', 'xunjing', 'safety.js'),
  'Xicheng safetyStatus normalization should live in a shared request/xunjing/safety.js helper'
)

const safetyHelper = exists('request', 'xunjing', 'safety.js')
  ? read('request', 'xunjing', 'safety.js')
  : ''
const chatRequest = read('request', 'xunjing', 'chat.js')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')

assert.match(
  safetyHelper,
  /export const normalizeXichengSafetyStatus\s*=\s*\(safetyStatus = ''\) => String\(safetyStatus \|\| ''\)\.trim\(\)\.toUpperCase\(\)/,
  'Shared safety helper should normalize empty, lowercase, and mixed-case safetyStatus values to uppercase strings'
)

for (const [label, source] of [
  ['chat facade', chatRequest],
  ['recognition result page', scanResult],
  ['AI guide page', aiGuide],
]) {
  assert.ok(
    source.includes("normalizeXichengSafetyStatus"),
    `${label} should reuse normalizeXichengSafetyStatus instead of comparing raw safetyStatus values`
  )
}

assert.match(
  chatRequest,
  /safetyStatus:\s*normalizeXichengSafetyStatus\(context\.safetyStatus\)/,
  'Xicheng chat payload should send normalized safetyStatus to Yudao'
)

assert.match(
  chatRequest,
  /const safetyStatus = normalizeXichengSafetyStatus\(payload\.safetyStatus\)/,
  'Xicheng chat response normalizer should normalize backend safetyStatus before BLOCKED handling'
)

assert.match(
  aiGuide,
  /normalizeXichengSafetyStatus\(decodeRouteValue\(options\.safetyStatus\)\)/,
  'AI guide should normalize route safetyStatus before storing Xicheng context'
)

assert.match(
  aiGuide,
  /normalizeXichengSafetyStatus\(context\.safetyStatus\) === 'BLOCKED'/,
  'AI guide should short-circuit BLOCKED contexts after normalizing safetyStatus'
)

assert.match(
  aiGuide,
  /normalizeXichengSafetyStatus\(result\.safetyStatus\) === 'BLOCKED'/,
  'AI guide should handle BLOCKED AI responses after normalizing safetyStatus'
)

assert.match(
  scanResult,
  /normalizeXichengSafetyStatus\(decodeRouteValue\(options\.safetyStatus\)\)/,
  'Recognition result should normalize route safetyStatus before carrying it into Xiaojing'
)
