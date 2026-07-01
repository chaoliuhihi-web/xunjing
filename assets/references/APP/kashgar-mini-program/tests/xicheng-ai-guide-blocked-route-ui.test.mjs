import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')

const applyContextBlock = aiGuide.match(/const applyXichengAiContext\s*=\s*\(options = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const cacheScopeBlock = aiGuide.match(/const getActiveXichengCacheScope\s*=\s*\(\) => \{[\s\S]*?\n\}/)?.[0] || ''
const heroQuestionsBlock = aiGuide.match(/const xichengHeroQuestions\s*=\s*computed\(\(\) => \{[\s\S]*?\n\}\)/)?.[0] || ''
const routeRefreshBlock = aiGuide.match(/const refreshXichengAiRouteContext\s*=\s*\([\s\S]*?\n\}/)?.[0] || ''
const welcomeContentBlock = aiGuide.match(/const getXichengWelcomeContent\s*=\s*\(\) => \{[\s\S]*?\n\}/)?.[0] || ''
const unsafeCacheBlock = aiGuide.match(/const shouldSkipXichengUnsafeMessageCache\s*=\s*\(\) => \{[\s\S]*?\n\}/)?.[0] || ''
const loadChatHistoryBlock = aiGuide.match(/const loadChatHistory\s*=\s*async\s*\(\{[\s\S]*?\n\}/)?.[0] || ''

assert.ok(applyContextBlock, 'AI guide should expose Xicheng context application')
assert.ok(cacheScopeBlock, 'AI guide should expose Xicheng cache scope')
assert.ok(heroQuestionsBlock, 'AI guide should expose Xicheng hero prompt questions')
assert.ok(routeRefreshBlock, 'AI guide should expose route context refresh')
assert.ok(welcomeContentBlock, 'AI guide should expose Xicheng safety-aware welcome content')
assert.ok(unsafeCacheBlock, 'AI guide should expose unsafe context cache suppression')
assert.ok(loadChatHistoryBlock, 'AI guide should expose chat history loading')

assert.match(
  aiGuide,
  /const mergeXichengAiRouteOptions\s*=\s*\(routeOptions = \{\}\) => \{[\s\S]*getCurrentXichengAiRouteOptions\(\)[\s\S]*safetyStatus:\s*normalizeXichengSafetyStatus\(routeOptions\.safetyStatus \|\| h5RouteOptions\.safetyStatus\)/,
  'H5 onLoad route options should be merged with the hash parser so safetyStatus=BLOCKED is not dropped'
)

assert.match(
  routeRefreshBlock,
  /rawRouteOptions = null[\s\S]*const routeOptions = mergeXichengAiRouteOptions\(rawRouteOptions \|\| \{\}\)/,
  'Route refresh should normalize explicit onLoad options through the H5 hash-aware merger'
)

assert.match(
  applyContextBlock,
  /const mergedSafetyStatus = normalizeXichengSafetyStatus\(context\.safetyStatus \|\| cachedRecognition\.safetyStatus \|\| routeOnlyRecognition\.safetyStatus\)[\s\S]*const unsafeMergedSafetyStatus = isXichengUnsafeSafetyStatus\(mergedSafetyStatus\)/,
  'AI guide should calculate the final merged safety status before exposing context sources'
)

assert.match(
  applyContextBlock,
  /sourceLabel:\s*unsafeMergedSafetyStatus \? '' : \(cachedRecognition\.sourceLabel \|\| routeOnlyRecognition\.sourceLabel\)[\s\S]*safetyStatus:\s*mergedSafetyStatus[\s\S]*sources:\s*unsafeMergedSafetyStatus \? \[\] : \(cachedRecognition\.sources\.length > 0 \? cachedRecognition\.sources : routeOnlyRecognition\.sources\)/,
  'BLOCKED or UNAVAILABLE route contexts should clear cached and route-only official POI sources before rendering'
)

assert.match(
  cacheScopeBlock,
  /const packageCode = context\.packageCode \|\| XICHENG_REGION_CONFIG\.packageCode[\s\S]*const safetyStatus = normalizeXichengSafetyStatus\(context\.safetyStatus\)[\s\S]*const safetyScope = safetyStatus \? `:\$\{encodeURIComponent\(safetyStatus\)\}` : ''[\s\S]*return `\$\{encodeURIComponent\(regionCode\)\}:\$\{encodeURIComponent\(packageCode\)\}:\$\{encodeURIComponent\(poiScope\)\}\$\{safetyScope\}`/,
  'Xicheng chat cache keys should include packageCode and safetyStatus so package-scoped old sourced answers are not reused in BLOCKED sessions'
)

assert.match(
  heroQuestionsBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(context\.safetyStatus\)[\s\S]*if \(isXichengUnsafeSafetyStatus\(safetyStatus\)\) \{[\s\S]*return \[\][\s\S]*createXichengPoiSuggestedQuestions/,
  'Xicheng hero prompt chips should be hidden for BLOCKED or UNAVAILABLE contexts'
)

assert.ok(
  heroQuestionsBlock.indexOf('isXichengUnsafeSafetyStatus(safetyStatus)') < heroQuestionsBlock.indexOf('createXichengPoiSuggestedQuestions'),
  'Unsafe contexts should check safety before rendering default POI follow-up prompts'
)

assert.match(
  welcomeContentBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(context\.safetyStatus\)[\s\S]*safetyStatus === 'BLOCKED'[\s\S]*XICHENG_BLOCKED_ANSWER[\s\S]*safetyStatus === 'UNAVAILABLE'[\s\S]*XICHENG_UNAVAILABLE_ANSWER/,
  'Blocked or unavailable Xicheng welcome copy should refuse before generic helper copy'
)

assert.match(
  aiGuide,
  /const createWelcomeMessage\s*=\s*\(\) => \(\{[\s\S]*content:\s*hasXichengAiContext\(\)\s*\?\s*getXichengWelcomeContent\(\)[\s\S]*sources:\s*hasXichengAiContext\(\) \? getXichengContextSources\(\) : \[\][\s\S]*safetyStatus:\s*hasXichengAiContext\(\) \? normalizeXichengSafetyStatus\(xichengAiContext\.value\.safetyStatus\) : ''/,
  'Welcome message should render the same safety-aware refused copy and safety status that source filtering uses'
)

assert.match(
  unsafeCacheBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(xichengAiContext\.value\.safetyStatus\)[\s\S]*return hasXichengAiContext\(\) && isXichengUnsafeSafetyStatus\(safetyStatus\)/,
  'Unsafe Xicheng contexts should be able to suppress stale sourced message caches'
)

assert.match(
  loadChatHistoryBlock,
  /if \(shouldSkipXichengUnsafeMessageCache\(\)\) \{[\s\S]*setWelcomeMessage\(\)[\s\S]*return/,
  'BLOCKED or UNAVAILABLE Xiaojing entries should rebuild the refused welcome state instead of restoring stale sourced cache'
)

assert.match(
  aiGuide,
  /const cachedMessages = preferCache && !scopeChanged && !shouldSkipXichengUnsafeMessageCache\(\) \? loadMessagesCache\(\) : \[\]/,
  'Route refresh should skip cached sourced messages while an unsafe safety status is active'
)
