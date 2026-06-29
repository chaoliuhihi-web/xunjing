import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const officialPoiSources = fs.readFileSync(path.join(root, 'request', 'xunjing', 'officialPoi.js'), 'utf8')
const regionConfig = fs.readFileSync(path.join(root, 'config', 'regions', 'xicheng.js'), 'utf8')

assert.match(
  scanResult,
  /import \{[\s\S]*XICHENG_OFFICIAL_POIS[\s\S]*XICHENG_RECOMMENDED_ROUTES[\s\S]*\} from '@\/config\/regions\/xicheng\.js'/,
  'Recognition result page should import official POI and route config for cache-miss route entry'
)

for (const required of [
  'findXichengOfficialPoiForResult',
  'applyXichengOfficialPoiDefaults',
  'createXichengOfficialPoiSources',
  'findXichengRecommendedRouteForPoi',
  'officialPoiMatched',
  'confidenceDisplay',
  'confidenceMetaLabel'
]) {
  assert.ok(scanResult.includes(required), `Recognition result official POI fallback should include ${required}`)
}

assert.match(
  officialPoiSources,
  /export const createXichengOfficialPoiSources\s*=\s*\(officialPoi = \{\}\)[\s\S]*sourceType:\s*'official-poi-config'[\s\S]*reviewStatus:\s*XICHENG_REGION_CONFIG\.reviewStatus\.approved/,
  'Shared official POI fallback helper should create approved official-poi-config sources'
)

assert.match(
  scanResult,
  /const normalizePoiCodeKey\s*=\s*\(value = ''\) => String\(value \|\| ''\)\.trim\(\)\.toLowerCase\(\)[\s\S]*const findXichengOfficialPoiForResult\s*=\s*\(result = \{\}\) => \{[\s\S]*normalizePoiCodeKey\(poi\.poiCode\) === poiCodeKey/,
  'Official POI fallback should match poiCode case-insensitively so XICHENG-BAITASI and xicheng-baitasi both work'
)

assert.match(
  scanResult,
  /applyXichengOfficialPoiDefaults\s*=\s*\(result = \{\}\)[\s\S]*const sources = existingSources\.length > 0 \? existingSources : createXichengOfficialPoiSources\(officialPoi\)[\s\S]*theme:\s*result\.theme \|\| officialPoi\.theme[\s\S]*reason:\s*result\.reason \|\| officialPoi\.summary[\s\S]*sources,[\s\S]*safetyStatus:\s*safetyStatus \|\| \(sources\.length > 0 \? 'PASSED' : ''\)/,
  'Official POI fallback should enrich a route-only result with summary, reviewed sources, and explicit PASSED safety status'
)

assert.match(
  scanResult,
  /const normalizeSuggestedQuestions\s*=\s*\(result = \{\}\) => \{[\s\S]*return createXichengPoiSuggestedQuestions\(result\.poiName\)/,
  'Recognition result fallback questions should be generated from the current POI name instead of leaking another POI prompt'
)

assert.match(
  scanResult,
  /onLoad\(options = \{\}\)[\s\S]*const normalizedResult = normalizeResult\([\s\S]*applyXichengOfficialPoiDefaults\([\s\S]*this\.result = normalizedResult[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.storageKey, this\.result\)/,
  'Recognition result page should persist official POI defaults so Xiaojing can restore sources when opened next'
)

assert.match(
  scanResult,
  /confidenceMetaLabel\(\)[\s\S]*if \(this\.hasDisplayableConfidence\) return '置信度'[\s\S]*if \(this\.result\.officialPoiMatched\) return '官方匹配'[\s\S]*confidenceDisplay\(\)[\s\S]*if \(this\.hasDisplayableConfidence\)[\s\S]*return `\$\{this\.confidencePercent\}%`[\s\S]*if \(this\.result\.officialPoiMatched\) return '官方POI'/,
  'Recognition result page should label route-only official POI fallback as official matching instead of putting 官方POI under a fixed confidence label'
)

assert.match(
  scanResult,
  /<text class="meta-value">\{\{ confidenceDisplay \}\}<\/text>\s*<text class="meta-label">\{\{ confidenceMetaLabel \}\}<\/text>/,
  'Recognition result first meta tile should render the dynamic confidence or official-matching label'
)

assert.match(
  scanResult,
  /const normalizeRouteOptions\s*=\s*\(options = \{\}\) => \(\{[\s\S]*confidence:\s*decodeRouteValue\(options\.confidence\)[\s\S]*confidencePercent:\s*decodeRouteValue\(options\.confidencePercent\)/,
  'Recognition result page should keep route confidence parameters when entering from scan/photo/OCR/GPS recognition'
)

assert.match(
  scanResult,
  /confidence:\s*routeOptions\.confidence \|\| \(selectedCached && selectedCached\.confidence\) \|\| ''[\s\S]*confidencePercent:\s*routeOptions\.confidencePercent \|\| \(selectedCached && selectedCached\.confidencePercent\) \|\| ''/,
  'Recognition result page should preserve route confidence into the normalized result before display and Xiaojing cache handoff'
)

for (const required of [
  'class="scan-result-topbar"',
  'class="result-hero-layout"',
  'class="result-poi-image"',
  ':src="resultVisualImage"',
  'class="result-source-signal"',
  'recognitionSignalItems',
  'class="result-companion-card"',
  ':src="region.companionAvatar"',
  '小京已为你匹配到这里'
]) {
  assert.ok(scanResult.includes(required), `Recognition result visual shell should include ${required}`)
}

assert.match(
  scanResult,
  /resultVisualImage\(\)[\s\S]*this\.region\.visualAssets[\s\S]*heroLandmark/,
  'Recognition result page should reuse compact region visual assets for the POI card image'
)

assert.match(
  scanResult,
  /recognitionSignalItems\(\)[\s\S]*拍照识别[\s\S]*文字识别[\s\S]*附近触发/,
  'Recognition result page should show the same photo/text/nearby detection source labels as the Xicheng reference design'
)

assert.match(
  scanResult,
  /\.result-poi-image\s*\{[\s\S]*width:\s*250rpx[\s\S]*height:\s*360rpx[\s\S]*object-fit:\s*cover/,
  'Recognition result POI image should use stable dimensions so the first card matches the visual reference without layout shift'
)

assert.match(
  regionConfig,
  /visualAssets:\s*\{[\s\S]*heroLandmark:\s*'\/static\/xicheng\/scene-baitasi-waterfront\.jpg'/,
  'Recognition result page should rely on the shared compact visual asset exposed by region config'
)

assert.doesNotMatch(
  scanResult,
  /xicheng-multimodal\/design-mockups|02-recognition-result-baitasi\.png/,
  'Recognition result page should not ship or reference full-page mockup screenshots as runtime UI'
)
