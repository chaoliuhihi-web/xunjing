import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')

const recognitionActionBlockedBlock = scanResult.match(/recognitionActionBlocked\(\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''
const safetyStatusLabelBlock = scanResult.match(/safetyStatusLabel\(\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''
const sourceEmptyCopyBlock = scanResult.match(/sourceEmptyCopy\(\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''
const questionEmptyCopyBlock = scanResult.match(/questionEmptyCopy\(\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''
const suggestedQuestionsBlock = scanResult.match(/suggestedQuestions\(\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''
const sourceListBlock = scanResult.match(/sourceList\(\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''
const unsafeRecognitionSafetyStatusBlock = scanResult.match(/unsafeRecognitionSafetyStatus\(\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''
const askXiaojingBlock = scanResult.match(/askXiaojing\(question = '', \{ serviceHandoffContext = null \} = \{\}\)[\s\S]*?\n\t\t\},\n\t\tselectCandidate/)?.[0] || ''
const startRecordingBlock = scanResult.match(/startRecording\(\)[\s\S]*?\n\t+\},\n\t\tcreateRouteCheckinEvent/)?.[0] || ''
const normalizeSuggestedQuestionsBlock = scanResult.match(/const normalizeSuggestedQuestions\s*=\s*\(result = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const normalizeReviewedSourcesBlock = scanResult.match(/const normalizeReviewedSources\s*=\s*\(result = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const normalizeRecommendedRouteBlock = scanResult.match(/const normalizeRecommendedRoute\s*=\s*\(result = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const recommendedRouteBlock = scanResult.match(/recommendedRoute\(\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''
const applyContextBlock = aiGuide.match(/const applyXichengAiContext\s*=\s*\(options = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const requestChatBlock = aiGuide.match(/const requestXunjingAiChat\s*=\s*\(question\) => \{[\s\S]*?\n\}\n\nconst escapeHtml/)?.[0] || ''

assert.ok(recognitionActionBlockedBlock, 'Recognition result should expose a central action-blocking computed value')
assert.ok(safetyStatusLabelBlock, 'Recognition result should expose a safety status label computed value')
assert.ok(sourceEmptyCopyBlock, 'Recognition result should expose unsafe-source empty copy')
assert.ok(questionEmptyCopyBlock, 'Recognition result should expose a safe empty question copy')
assert.ok(suggestedQuestionsBlock, 'Recognition result should expose safety-aware Xiaojing question suggestions')
assert.ok(sourceListBlock, 'Recognition result should expose safety-aware reviewed sources')
assert.ok(unsafeRecognitionSafetyStatusBlock, 'Recognition result should expose an unsafe safety-status computed value')
assert.ok(askXiaojingBlock, 'Recognition result should expose askXiaojing')
assert.ok(startRecordingBlock, 'Recognition result should expose startRecording')
assert.ok(normalizeSuggestedQuestionsBlock, 'Recognition result should expose suggested-question normalization')
assert.ok(normalizeReviewedSourcesBlock, 'Recognition result should expose reviewed-source normalization')
assert.ok(normalizeRecommendedRouteBlock, 'Recognition result should expose safety-aware route recommendation normalization')
assert.ok(recommendedRouteBlock, 'Recognition result should expose recommendedRoute')

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
  /const getCurrentXichengScanResultRouteOptions\s*=\s*\(\) => \{[\s\S]*location\.hash[\s\S]*URLSearchParams[\s\S]*options\[key\] = decodeRouteValue\(value\)[\s\S]*options\.safetyStatus = normalizeXichengSafetyStatus\(decodeRouteValue\(options\.safetyStatus\)\)/,
  'Recognition result should parse H5 hash route params so safetyStatus=BLOCKED is not dropped in browser QA'
)

assert.match(
  scanResult,
  /const mergeXichengScanResultRouteOptions\s*=\s*\(routeOptions = \{\}\) => \{[\s\S]*const h5RouteOptions = getCurrentXichengScanResultRouteOptions\(\)[\s\S]*safetyStatus:\s*normalizeXichengSafetyStatus\(routeOptions\.safetyStatus \|\| h5RouteOptions\.safetyStatus\)/,
  'Recognition result should merge runtime and H5 route options while preserving explicit unsafe safetyStatus'
)

assert.match(
  scanResult,
  /const normalizeResult = \(result = \{\}\) => \(\{[\s\S]*safetyStatus:\s*normalizeXichengSafetyStatus\(result\.safetyStatus\)/,
  'Recognition result normalization should preserve backend safetyStatus such as BLOCKED after normalization'
)

assert.match(
  scanResult,
  /recognitionSignalItems\(\)[\s\S]*key:\s*'safety'[\s\S]*label:\s*'审核状态'[\s\S]*value:\s*this\.safetyStatusLabel/,
  'Recognition result UI should show a human-readable safety audit status in the approved recognition signal list'
)

assert.match(
  safetyStatusLabelBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(this\.result\.safetyStatus\)[\s\S]*safetyStatus === 'BLOCKED'[\s\S]*已拦截[\s\S]*safetyStatus === 'UNAVAILABLE'[\s\S]*来源服务不可用/,
  'Recognition result safety status label should normalize legacy cached values before display'
)

assert.match(
  sourceEmptyCopyBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(this\.result\.safetyStatus\)[\s\S]*safetyStatus === 'BLOCKED'[\s\S]*无已审核来源，不能回答[\s\S]*safetyStatus === 'UNAVAILABLE'[\s\S]*小京暂时无法获取已审核来源，请稍后再试/,
  'Recognition result empty-source copy should fail closed for BLOCKED and UNAVAILABLE safety states'
)

assert.match(
  scanResult,
  /<text v-if="suggestedQuestions\.length === 0" class="question-empty">\{\{ questionEmptyCopy \}\}<\/text>/,
  'Recognition result should show an explicit safe empty state when no Xiaojing follow-up questions are allowed'
)

assert.match(
  questionEmptyCopyBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(this\.result\.safetyStatus\)[\s\S]*safetyStatus === 'BLOCKED'[\s\S]*无已审核来源，不能问小京[\s\S]*safetyStatus === 'UNAVAILABLE'[\s\S]*小京暂时无法获取已审核来源，不能问小京/,
  'Recognition result empty question copy should explain why Xiaojing follow-ups are unavailable for unsafe states'
)

assert.match(
  normalizeSuggestedQuestionsBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(result\.safetyStatus\)[\s\S]*isXichengUnsafeSafetyStatus\(safetyStatus\)[\s\S]*return \[\]/,
  'Recognition result should hide suggested questions when safetyStatus is BLOCKED or UNAVAILABLE'
)

assert.match(
  suggestedQuestionsBlock,
  /return normalizeSuggestedQuestions\(this\.result\)/,
  'Recognition result computed Xiaojing questions should reuse safety-aware normalization instead of generating defaults for BLOCKED or UNAVAILABLE results'
)

assert.match(
  sourceListBlock,
  /return normalizeReviewedSources\(this\.result\)/,
  'Recognition result computed source list should reuse safety-aware normalization so stale BLOCKED or UNAVAILABLE results cannot expose reviewed sources'
)

assert.match(
  normalizeReviewedSourcesBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(result\.safetyStatus\)[\s\S]*isXichengUnsafeSafetyStatus\(safetyStatus\)[\s\S]*return \[\][\s\S]*return normalizeXichengReviewedSources\(result\.sources\)/,
  'Recognition result should hide reviewed sources when safetyStatus is BLOCKED or UNAVAILABLE'
)

assert.match(
  normalizeRecommendedRouteBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(result\.safetyStatus\)[\s\S]*if \(isXichengUnsafeSafetyStatus\(safetyStatus\)\) \{[\s\S]*return null[\s\S]*return result\.routeRecommendation \|\| result\.recommendedRoute \|\| null/,
  'Recognition result should hide recommended routes when safetyStatus is BLOCKED or UNAVAILABLE'
)

assert.match(
  scanResult,
  /routeRecommendation:\s*normalizeRecommendedRoute\(result\)[\s\S]*recommendedRoute:\s*normalizeRecommendedRoute\(result\)/,
  'Recognition result normalization should not preserve routeRecommendation/recommendedRoute for unsafe recognition results'
)

assert.match(
  recommendedRouteBlock,
  /if \(this\.unsafeRecognitionSafetyStatus\) return null[\s\S]*return this\.result\.routeRecommendation \|\| this\.result\.recommendedRoute \|\| null/,
  'Recognition result computed route card should fail closed if the active result becomes BLOCKED or UNAVAILABLE'
)

assert.match(
  scanResult,
  /sources:\s*normalizeReviewedSources\(candidate\)[\s\S]*\}\)[\s\S]*const normalizeRecognitionCandidates/,
  'Recognition candidate normalization should pass sources through the safety-aware source helper'
)

assert.match(
  scanResult,
  /sources:\s*normalizeReviewedSources\(result\)[\s\S]*candidates:\s*normalizeRecognitionCandidates\(result\.candidates\)/,
  'Recognition result normalization should pass sources through the safety-aware source helper'
)

assert.match(
  unsafeRecognitionSafetyStatusBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(this\.result\.safetyStatus\)[\s\S]*return isXichengUnsafeSafetyStatus\(safetyStatus\)/,
  'Recognition result should treat BLOCKED and UNAVAILABLE safety states as unsafe for local actions'
)

for (const [label, block] of [
  ['safety status label', safetyStatusLabelBlock],
  ['empty-source copy', sourceEmptyCopyBlock],
  ['unsafe action gate', unsafeRecognitionSafetyStatusBlock]
]) {
  assert.doesNotMatch(
    block,
    /this\.result\.safetyStatus\s*===|'BLOCKED', 'UNAVAILABLE'\]\.includes\(this\.result\.safetyStatus\)/,
    `${label} should not compare raw result.safetyStatus without trim-aware normalization`
  )
}

assert.match(
  recognitionActionBlockedBlock,
  /this\.pendingCandidateConfirmation \|\| this\.missingOfficialPoiContext \|\| this\.unsafeRecognitionSafetyStatus/,
  'Recognition result bottom actions should be disabled when safety status has no reviewed answer source'
)

assert.match(
  askXiaojingBlock,
  /if \(this\.unsafeRecognitionSafetyStatus\) \{[\s\S]*this\.showUnsafeRecognitionToast\('问小京'\)[\s\S]*return/,
  'Suggested questions and the Xiaojing button should not navigate when recognition safety status is BLOCKED or UNAVAILABLE'
)

assert.match(
  startRecordingBlock,
  /if \(this\.unsafeRecognitionSafetyStatus\) \{[\s\S]*this\.showUnsafeRecognitionToast\('开始记录'\)[\s\S]*return/,
  'Recognition result should not create travelogue materials from BLOCKED or UNAVAILABLE recognition contexts'
)

assert.match(
  scanResult,
  /safetyStatus:\s*routeOptions\.safetyStatus \|\| \(selectedCached && selectedCached\.safetyStatus\) \|\| ''/,
  'Recognition result should prefer route safetyStatus and fall back to matching cached recognition safetyStatus'
)

assert.match(
  scanResult,
  /const routeUnsafeSafetyStatus = isXichengUnsafeSafetyStatus\(routeOptions\.safetyStatus\)[\s\S]*const selectedCached = cachedBlockedByProductionFixture \|\| routeUnsafeSafetyStatus[\s\S]*\? null[\s\S]*: selectCachedRecognitionForRoute\(cached, mergedRouteOptions\)/,
  'Recognition result should not let stale cached POI/source data override explicit BLOCKED or UNAVAILABLE route contexts'
)

assert.match(
  scanResult,
  /if \(!this\.unsafeRecognitionSafetyStatus && this\.result\.officialPoiMatched && this\.result\.poiCode && this\.result\.poiName\) \{[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.storageKey, this\.result\)/,
  'Recognition result should not persist unsafe recognition contexts back into the shared Xiaojing cache'
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
  /const loadCachedXichengRecognitionContext\s*=\s*\(context = \{\}\) => \{[\s\S]*const safetyStatus = normalizeXichengSafetyStatus\(cached\.safetyStatus\)[\s\S]*safetyStatus,/,
  'AI guide should restore safetyStatus from the matching cached recognition context'
)

assert.match(
  applyContextBlock,
  /const mergedSafetyStatus = normalizeXichengSafetyStatus\(context\.safetyStatus \|\| cachedRecognition\.safetyStatus \|\| routeOnlyRecognition\.safetyStatus\)[\s\S]*safetyStatus:\s*mergedSafetyStatus/,
  'AI guide should merge route, cached, and route-only official POI safetyStatus into Xiaojing context'
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
