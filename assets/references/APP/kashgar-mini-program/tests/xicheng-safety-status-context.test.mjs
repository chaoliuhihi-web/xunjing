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
  /const normalizeRouteOptions = \(options = \{\}\) => \(\{[\s\S]*safetyStatus:\s*decodeRouteValue\(options\.safetyStatus\)/,
  'Recognition result route options should decode safetyStatus from navigation params'
)

assert.match(
  scanResult,
  /const normalizeResult = \(result = \{\}\) => \(\{[\s\S]*safetyStatus:\s*result\.safetyStatus \|\| ''/,
  'Recognition result normalization should preserve backend safetyStatus such as BLOCKED'
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
  /const normalizeXichengAiContext = \(options = \{\}\) => \(\{[\s\S]*safetyStatus:\s*decodeRouteValue\(options\.safetyStatus\)/,
  'AI guide should decode safetyStatus from route params'
)

assert.match(
  aiGuide,
  /const loadCachedXichengRecognitionContext\s*=\s*\(context = \{\}\) => \{[\s\S]*safetyStatus:\s*cached\.safetyStatus \|\| ''/,
  'AI guide should restore safetyStatus from the matching cached recognition context'
)

assert.match(
  applyContextBlock,
  /safetyStatus:\s*context\.safetyStatus \|\| cachedRecognition\.safetyStatus/,
  'AI guide should merge route and cached safetyStatus into Xiaojing context'
)

assert.match(
  requestChatBlock,
  /requestPayload\.safetyStatus = context\.safetyStatus \|\| ''/,
  'AI chat request should send the active recognition safetyStatus to the Yudao APP API'
)

assert.doesNotMatch(
  `${scanResult}\n${aiGuide}`,
  /Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Safety status context wiring should not introduce client-side secrets'
)
