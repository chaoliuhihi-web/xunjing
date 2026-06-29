import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const officialPoiSources = fs.readFileSync(path.join(root, 'request', 'xunjing', 'officialPoi.js'), 'utf8')

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
