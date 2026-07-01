import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')
const loadCachedRecognitionBlock = aiGuide.match(/const loadCachedXichengRecognitionContext\s*=\s*\(context = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const routeOnlyRecognitionBlock = aiGuide.match(/const createRouteOnlyXichengRecognitionContext\s*=\s*\(context = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const contextSourcesBlock = aiGuide.match(/const getXichengContextSources\s*=\s*\(context = xichengAiContext\.value\) => \{[\s\S]*?\n\}/)?.[0] || ''

for (const required of [
  'sourceLabel',
  'sources: []',
  'loadCachedXichengRecognitionContext',
  'createRouteOnlyXichengRecognitionContext',
  'createXichengOfficialPoiSources',
  'getXichengContextSources'
]) {
  assert.ok(aiGuide.includes(required), `AI guide should keep recognition source context token ${required}`)
}

assert.ok(loadCachedRecognitionBlock, 'AI guide should expose cached Xicheng recognition context hydration')
assert.ok(routeOnlyRecognitionBlock, 'AI guide should expose route-only official POI source hydration')
assert.ok(contextSourcesBlock, 'AI guide should expose active Xicheng context source hydration')

assert.match(
  aiGuide,
  /const loadCachedXichengRecognitionContext\s*=\s*\(context = \{\}\) => \{[\s\S]*uni\.getStorageSync\(XICHENG_REGION_CONFIG\.storageKey\)[\s\S]*cached\.poiCode === context\.poiCode[\s\S]*cached\.poiName === context\.poiName[\s\S]*sources:\s*unsafeSafetyStatus \? \[\] : normalizeXichengReviewedSources\(cached\.sources\)/,
  'AI guide should restore safety-filtered reviewed source metadata from the latest recognition cache only when it matches the active POI context'
)

assert.match(
  loadCachedRecognitionBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(cached\.safetyStatus\)[\s\S]*const unsafeSafetyStatus = isXichengUnsafeSafetyStatus\(safetyStatus\)[\s\S]*safetyStatus,[\s\S]*sources:\s*unsafeSafetyStatus \? \[\] : normalizeXichengReviewedSources\(cached\.sources\)/,
  'AI guide should fail closed when restoring cached BLOCKED or UNAVAILABLE recognition sources'
)

assert.match(
  loadCachedRecognitionBlock,
  /const matchesRegionCode = !context\.regionCode \|\| !cached\.regionCode \|\| cached\.regionCode === context\.regionCode[\s\S]*const matchesPackageCode = !context\.packageCode \|\| !cached\.packageCode \|\| cached\.packageCode === context\.packageCode[\s\S]*if \(!matchesRegionCode \|\| !matchesPackageCode\) \{[\s\S]*return createEmptyXichengRecognitionContext\(\)/,
  'AI guide should reject cached recognition sources when regionCode or packageCode differs from the active Xiaojing context'
)

assert.match(
  aiGuide,
  /const routeOnlyRecognition = cachedRecognition\.sources\.length > 0[\s\S]*createEmptyXichengRecognitionContext\(\)[\s\S]*createRouteOnlyXichengRecognitionContext\(context\)/,
  'AI guide should only use route-only official POI sources when no cached reviewed sources are available'
)

assert.match(
  aiGuide,
  /xichengAiContext\.value = \{[\s\S]*poiCode:\s*context\.poiCode \|\| cachedRecognition\.poiCode \|\| routeOnlyRecognition\.poiCode[\s\S]*poiName:\s*context\.poiName \|\| cachedRecognition\.poiName \|\| routeOnlyRecognition\.poiName[\s\S]*confidence:\s*context\.confidence \|\| cachedRecognition\.confidence \|\| routeOnlyRecognition\.confidence[\s\S]*sourceLabel:\s*unsafeMergedSafetyStatus \? '' : \(cachedRecognition\.sourceLabel \|\| routeOnlyRecognition\.sourceLabel\)[\s\S]*safetyStatus:\s*mergedSafetyStatus[\s\S]*sources:\s*unsafeMergedSafetyStatus \? \[\] : \(cachedRecognition\.sources\.length > 0 \? cachedRecognition\.sources : routeOnlyRecognition\.sources\)/,
  'AI guide should merge cached or route-only official POI name, confidence, source label, and sources only after the final safety status allows reviewed sources'
)

assert.match(
  routeOnlyRecognitionBlock,
  /findXichengOfficialPoiForAiContext\(context\)[\s\S]*createXichengOfficialPoiSources\(officialPoi\)[\s\S]*sourceLabel:\s*'西城官方 POI'[\s\S]*safetyStatus:\s*safetyStatus \|\| \(sources\.length > 0 \? 'PASSED' : ''\)/,
  'Route-only Xiaojing entry should hydrate reviewed official POI sources without requiring a recognition cache'
)

assert.match(
  routeOnlyRecognitionBlock,
  /if \(isXichengUnsafeSafetyStatus\(safetyStatus\)\) \{[\s\S]*return createEmptyXichengRecognitionContext\(\)/,
  'Route-only Xiaojing source fallback should remain fail-closed for BLOCKED or UNAVAILABLE context'
)

assert.match(
  contextSourcesBlock,
  /context = context \|\| \{\}[\s\S]*const safetyStatus = normalizeXichengSafetyStatus\(context\.safetyStatus\)[\s\S]*if \(isXichengUnsafeSafetyStatus\(safetyStatus\)\) \{[\s\S]*return \[\][\s\S]*return normalizeXichengReviewedSources\(context\.sources\)/,
  'AI guide should expose a normalized safe helper for the active Xicheng reviewed sources'
)

assert.match(
  aiGuide,
  /const createWelcomeMessage\s*=\s*\(\) => \(\{[\s\S]*sources:\s*hasXichengAiContext\(\)[\s\S]*getXichengContextSources\(\)[\s\S]*:\s*\[\]/,
  'Xicheng welcome message should display the recognition result reviewed sources before the first AI answer returns'
)

assert.doesNotMatch(
  aiGuide,
  /\/app-api\/xunjing\/triggers\/resolve|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Recognition source context hydration should stay local and not introduce extra trigger calls or client-side secrets'
)
