import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')

assert.match(
  scanResult,
  /import \{[\s\S]*XICHENG_OFFICIAL_POIS[\s\S]*XICHENG_RECOMMENDED_ROUTES[\s\S]*\} from '@\/config\/regions\/xicheng\.js'/,
  'Recognition result page should import official POI and route config for cache-miss route entry'
)

for (const required of [
  'findXichengOfficialPoiForResult',
  'applyXichengOfficialPoiDefaults',
  'createXichengOfficialPoiSources',
  "sourceType: 'official-poi-config'",
  "reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.approved",
  'findXichengRecommendedRouteForPoi',
  'officialPoiMatched',
  'confidenceDisplay'
]) {
  assert.ok(scanResult.includes(required), `Recognition result official POI fallback should include ${required}`)
}

assert.match(
  scanResult,
  /const normalizePoiCodeKey\s*=\s*\(value = ''\) => String\(value \|\| ''\)\.trim\(\)\.toLowerCase\(\)[\s\S]*const findXichengOfficialPoiForResult\s*=\s*\(result = \{\}\) => \{[\s\S]*normalizePoiCodeKey\(poi\.poiCode\) === poiCodeKey/,
  'Official POI fallback should match poiCode case-insensitively so XICHENG-BAITASI and xicheng-baitasi both work'
)

assert.match(
  scanResult,
  /applyXichengOfficialPoiDefaults\s*=\s*\(result = \{\}\)[\s\S]*theme:\s*result\.theme \|\| officialPoi\.theme[\s\S]*reason:\s*result\.reason \|\| officialPoi\.summary[\s\S]*sources:\s*existingSources\.length > 0 \? existingSources : createXichengOfficialPoiSources\(officialPoi\)/,
  'Official POI fallback should enrich a route-only result with summary and theme while preserving backend-reviewed sources first'
)

assert.match(
  scanResult,
  /onLoad\(options = \{\}\)[\s\S]*const normalizedResult = normalizeResult\([\s\S]*applyXichengOfficialPoiDefaults\([\s\S]*this\.result = normalizedResult[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.storageKey, this\.result\)/,
  'Recognition result page should persist official POI defaults so Xiaojing can restore sources when opened next'
)

assert.match(
  scanResult,
  /confidenceDisplay\(\)[\s\S]*if \(Number\(this\.result\.confidencePercent \|\| 0\) > 0\)[\s\S]*return `\$\{this\.confidencePercent\}%`[\s\S]*if \(this\.result\.officialPoiMatched\) return '官方POI'/,
  'Recognition result page should avoid showing 0% for a route-only official POI entry'
)
