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
const eventRequest = read('request', 'xunjing', 'events.js')
const triggerRequest = read('request', 'xunjing', 'trigger.js')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')
const indexPage = read('pages', 'index', 'index.vue')
const xichengHome = read('pages', 'xicheng', 'home', 'home.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

assert.match(
  safetyHelper,
  /export const normalizeXichengSafetyStatus\s*=\s*\(safetyStatus = ''\) => String\(safetyStatus \|\| ''\)\.trim\(\)\.toUpperCase\(\)/,
  'Shared safety helper should normalize empty, lowercase, and mixed-case safetyStatus values to uppercase strings'
)

assert.match(
  safetyHelper,
  /export const isXichengUnsafeSafetyStatus\s*=\s*\(safetyStatus = ''\) => \['BLOCKED', 'UNAVAILABLE'\]\.includes\(normalizeXichengSafetyStatus\(safetyStatus\)\)/,
  'Shared safety helper should centralize BLOCKED and UNAVAILABLE unsafe status checks'
)

for (const [label, source] of [
  ['chat facade', chatRequest],
  ['trigger facade', triggerRequest],
  ['recognition result page', scanResult],
  ['AI guide page', aiGuide],
  ['index multimodal cache', indexPage],
  ['Xicheng home page', xichengHome],
  ['travelogue page', travelogue],
]) {
  assert.ok(
    source.includes("normalizeXichengSafetyStatus"),
    `${label} should reuse normalizeXichengSafetyStatus instead of comparing raw safetyStatus values`
  )
}

for (const [label, source] of [
  ['chat facade', chatRequest],
  ['trigger facade', triggerRequest],
  ['recognition result page', scanResult],
  ['AI guide page', aiGuide],
  ['index multimodal cache', indexPage],
  ['Xicheng home page', xichengHome],
  ['travelogue page', travelogue],
  ['recognition feedback event', eventRequest],
]) {
  assert.ok(
    source.includes("isXichengUnsafeSafetyStatus"),
    `${label} should reuse isXichengUnsafeSafetyStatus instead of duplicating BLOCKED/UNAVAILABLE checks`
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
  /const contextSafetyStatus = normalizeXichengSafetyStatus\(context\.safetyStatus\)[\s\S]*isXichengUnsafeSafetyStatus\(contextSafetyStatus\)/,
  'AI guide should short-circuit BLOCKED and UNAVAILABLE contexts after normalizing safetyStatus'
)

assert.match(
  aiGuide,
  /normalizeXichengSafetyStatus\(result\.safetyStatus\) === 'BLOCKED'/,
  'AI guide should handle BLOCKED AI responses after normalizing safetyStatus'
)

assert.match(
  aiGuide,
  /const materialSafetyStatus = normalizeXichengSafetyStatus\(result\.safetyStatus\)[\s\S]*safetyStatus:\s*materialSafetyStatus/,
  'AI guide should persist normalized safetyStatus into local Xiaojing answer materials'
)

assert.match(
  scanResult,
  /safetyStatus:\s*normalizeXichengSafetyStatus\(this\.result\.safetyStatus\)/,
  'Recognition result should persist normalized safetyStatus into local feedback records'
)

assert.match(
  scanResult,
  /startRecording\(\)[\s\S]*safetyStatus:\s*normalizeXichengSafetyStatus\(this\.result\.safetyStatus\)[\s\S]*const checkinEvent = this\.createRouteCheckinEvent\(material\)/,
  'Recognition result should persist normalized safetyStatus into local journey materials before creating route check-ins'
)

assert.match(
  scanResult,
  /createRouteCheckinEvent\(material\)[\s\S]*safetyStatus:\s*normalizeXichengSafetyStatus\(material\.safetyStatus\)/,
  'Recognition result should persist normalized safetyStatus into local route check-in events'
)

assert.match(
  eventRequest,
  /safetyStatus:\s*normalizeXichengSafetyStatus\(feedback\.safetyStatus\)/,
  'Recognition feedback event payload should send normalized safetyStatus to Yudao'
)

assert.match(
  scanResult,
  /normalizeXichengSafetyStatus\(decodeRouteValue\(options\.safetyStatus\)\)/,
  'Recognition result should normalize route safetyStatus before carrying it into Xiaojing'
)

const safetyModule = `${safetyHelper.replace(/export const /g, 'const ')}
export { normalizeXichengSafetyStatus, isXichengUnsafeSafetyStatus }`
const { normalizeXichengSafetyStatus, isXichengUnsafeSafetyStatus } = await import(`data:text/javascript;base64,${Buffer.from(safetyModule).toString('base64')}`)

assert.equal(normalizeXichengSafetyStatus(' blocked '), 'BLOCKED')
assert.equal(isXichengUnsafeSafetyStatus(' blocked '), true)
assert.equal(isXichengUnsafeSafetyStatus('unavailable'), true)
assert.equal(isXichengUnsafeSafetyStatus('approved'), false)
