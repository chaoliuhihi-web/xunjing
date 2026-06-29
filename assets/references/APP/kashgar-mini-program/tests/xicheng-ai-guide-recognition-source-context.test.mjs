import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')
const loadCachedRecognitionBlock = aiGuide.match(/const loadCachedXichengRecognitionContext\s*=\s*\(context = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const contextSourcesBlock = aiGuide.match(/const getXichengContextSources\s*=\s*\(\) => \{[\s\S]*?\n\}/)?.[0] || ''

for (const required of [
  'sourceLabel',
  'sources: []',
  'loadCachedXichengRecognitionContext',
  'getXichengContextSources'
]) {
  assert.ok(aiGuide.includes(required), `AI guide should keep recognition source context token ${required}`)
}

assert.ok(loadCachedRecognitionBlock, 'AI guide should expose cached Xicheng recognition context hydration')
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
  aiGuide,
  /xichengAiContext\.value = \{[\s\S]*poiCode:\s*context\.poiCode \|\| cachedRecognition\.poiCode[\s\S]*poiName:\s*context\.poiName \|\| cachedRecognition\.poiName[\s\S]*confidence:\s*context\.confidence \|\| cachedRecognition\.confidence[\s\S]*sourceLabel:\s*cachedRecognition\.sourceLabel[\s\S]*sources:\s*cachedRecognition\.sources/,
  'AI guide should merge cached recognition POI name, confidence, source label, and sources into Xiaojing context'
)

assert.match(
  contextSourcesBlock,
  /const safetyStatus = normalizeXichengSafetyStatus\(context\.safetyStatus\)[\s\S]*if \(isXichengUnsafeSafetyStatus\(safetyStatus\)\) \{[\s\S]*return \[\][\s\S]*return normalizeXichengReviewedSources\(context\.sources\)/,
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
