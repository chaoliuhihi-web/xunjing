import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')

for (const required of [
  'sourceLabel',
  'sources: []',
  'loadCachedXichengRecognitionContext',
  'getXichengContextSources'
]) {
  assert.ok(aiGuide.includes(required), `AI guide should keep recognition source context token ${required}`)
}

assert.match(
  aiGuide,
  /const loadCachedXichengRecognitionContext\s*=\s*\(context = \{\}\) => \{[\s\S]*uni\.getStorageSync\(XICHENG_REGION_CONFIG\.storageKey\)[\s\S]*cached\.poiCode === context\.poiCode[\s\S]*cached\.poiName === context\.poiName[\s\S]*sources:\s*Array\.isArray\(cached\.sources\) \? cached\.sources : \[\]/,
  'AI guide should restore reviewed source metadata from the latest recognition cache only when it matches the active POI context'
)

assert.match(
  aiGuide,
  /xichengAiContext\.value = \{[\s\S]*poiCode:\s*context\.poiCode \|\| cachedRecognition\.poiCode[\s\S]*poiName:\s*context\.poiName \|\| cachedRecognition\.poiName[\s\S]*confidence:\s*context\.confidence \|\| cachedRecognition\.confidence[\s\S]*sourceLabel:\s*cachedRecognition\.sourceLabel[\s\S]*sources:\s*cachedRecognition\.sources/,
  'AI guide should merge cached recognition POI name, confidence, source label, and sources into Xiaojing context'
)

assert.match(
  aiGuide,
  /const getXichengContextSources\s*=\s*\(\) => \{[\s\S]*xichengAiContext\.value[\s\S]*Array\.isArray\(context\.sources\) \? context\.sources : \[\]/,
  'AI guide should expose a safe helper for the active Xicheng reviewed sources'
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
