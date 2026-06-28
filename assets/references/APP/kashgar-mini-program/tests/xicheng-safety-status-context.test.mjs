import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')

const askXiaojingBlock = scanResult.match(/askXiaojing\(question = ''\)[\s\S]*?\n\t\t\},\n\t\tstartRecording/)?.[0] || ''
const applyContextBlock = aiGuide.match(/const applyXichengAiContext\s*=\s*\(options = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const requestChatBlock = aiGuide.match(/const requestXunjingAiChat\s*=\s*\(question\) => \{[\s\S]*?\n\}\n\nconst escapeHtml/)?.[0] || ''

assert.match(
  scanResult,
  /const XICHENG_EMPTY_RECOGNITION_RESULT = Object\.freeze\(\{[\s\S]*safetyStatus:\s*''/,
  'Recognition result should initialize an explicit empty safetyStatus'
)

assert.match(
  scanResult,
  /const normalizeRouteOptions = \(options = \{\}\) => \(\{[\s\S]*safetyStatus:\s*normalizeXichengSafetyStatus\(decodeRouteValue\(options\.safetyStatus\)\)/,
  'Recognition result route options should decode and normalize safetyStatus from navigation params'
)

assert.match(
  scanResult,
  /const normalizeResult = \(result = \{\}\) => \(\{[\s\S]*safetyStatus:\s*normalizeXichengSafetyStatus\(result\.safetyStatus\)/,
  'Recognition result normalization should preserve backend safetyStatus such as BLOCKED after normalization'
)

assert.match(
  scanResult,
  /<text class="meta-value">\{\{ safetyStatusLabel \}\}<\/text>[\s\S]*<text class="meta-label">审核状态<\/text>/,
  'Recognition result UI should show a human-readable safety audit status near confidence and trigger status'
)

assert.match(
  scanResult,
  /sourceEmptyCopy\(\)[\s\S]*this\.result\.safetyStatus === 'BLOCKED'[\s\S]*无已审核来源，不能回答[\s\S]*this\.result\.safetyStatus === 'UNAVAILABLE'[\s\S]*小京暂时无法获取已审核来源，请稍后再试/,
  'Recognition result empty-source copy should fail closed for BLOCKED and UNAVAILABLE safety states'
)

assert.match(
  scanResult,
  /safetyStatus:\s*routeOptions\.safetyStatus \|\| \(selectedCached && selectedCached\.safetyStatus\) \|\| ''/,
  'Recognition result should prefer route safetyStatus and fall back to matching cached recognition safetyStatus'
)

assert.match(
  askXiaojingBlock,
  /`safetyStatus=\$\{encodeURIComponent\(this\.result\.safetyStatus \|\| ''\)\}`/,
  'Recognition result should carry safetyStatus into Xiaojing navigation'
)

assert.match(
  aiGuide,
  /const xichengAiContext\s*=\s*ref\(\{[\s\S]*safetyStatus:\s*''/,
  'AI guide should store safetyStatus in the active Xicheng context'
)

assert.match(
  aiGuide,
  /const normalizeXichengAiContext = \(options = \{\}\) => \(\{[\s\S]*safetyStatus:\s*normalizeXichengSafetyStatus\(decodeRouteValue\(options\.safetyStatus\)\)/,
  'AI guide should decode and normalize safetyStatus from route params'
)

assert.match(
  aiGuide,
  /const loadCachedXichengRecognitionContext\s*=\s*\(context = \{\}\) => \{[\s\S]*safetyStatus:\s*normalizeXichengSafetyStatus\(cached\.safetyStatus\)/,
  'AI guide should restore safetyStatus from the matching cached recognition context'
)

assert.match(
  applyContextBlock,
  /safetyStatus:\s*normalizeXichengSafetyStatus\(context\.safetyStatus \|\| cachedRecognition\.safetyStatus\)/,
  'AI guide should merge route and cached safetyStatus into Xiaojing context'
)

assert.match(
  requestChatBlock,
  /requestPayload\.safetyStatus = normalizeXichengSafetyStatus\(context\.safetyStatus\)/,
  'AI chat request should send the active recognition safetyStatus to the Yudao APP API'
)

assert.doesNotMatch(
  `${scanResult}\n${aiGuide}`,
  /Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Safety status context wiring should not introduce client-side secrets'
)
