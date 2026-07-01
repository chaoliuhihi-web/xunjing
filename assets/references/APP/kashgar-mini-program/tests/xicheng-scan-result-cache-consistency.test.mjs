import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const selectCachedBlock = scanResult.match(/const selectCachedRecognitionForRoute\s*=\s*\(cached = \{\}, options = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const onLoadBlock = scanResult.match(/onLoad\(options = \{\}\) \{[\s\S]*?\n\t\},\n\tmethods:/)?.[0] || ''

assert.ok(
  selectCachedBlock,
  'Recognition result page should select cached recognition through a route-aware helper'
)

assert.match(
  selectCachedBlock,
  /const routePoiCode = decodeRouteValue\(options\.poiCode\)[\s\S]*if \(routePoiCode && cached\.poiCode !== routePoiCode\) \{[\s\S]*return null/,
  'Cached recognition should be rejected when the route poiCode differs from the cached poiCode'
)

assert.match(
  selectCachedBlock,
  /const routePoiName = decodeRouteValue\(options\.poiName\)[\s\S]*if \(routePoiName && cached\.poiName !== routePoiName\) \{[\s\S]*return null/,
  'Cached recognition should be rejected when the route poiName differs from the cached poiName'
)

assert.match(
  selectCachedBlock,
  /const routePackageCode = decodeRouteValue\(options\.packageCode\)[\s\S]*if \(routePackageCode && cached\.packageCode && cached\.packageCode !== routePackageCode\) \{[\s\S]*return null/,
  'Cached recognition should be rejected when the route packageCode differs from the cached packageCode'
)

assert.match(
  onLoadBlock,
  /const mergedRouteOptions = mergeXichengScanResultRouteOptions\(options\)[\s\S]*const routeOptions = normalizeRouteOptions\(mergedRouteOptions\)[\s\S]*const routeUnsafeSafetyStatus = isXichengUnsafeSafetyStatus\(routeOptions\.safetyStatus\)[\s\S]*const cachedBlockedByProductionFixture = this\.isBlockedDevelopmentRecognitionCache\(cached\)[\s\S]*const selectedCached = cachedBlockedByProductionFixture \|\| routeUnsafeSafetyStatus[\s\S]*\? null[\s\S]*: selectCachedRecognitionForRoute\(cached, mergedRouteOptions\)[\s\S]*\.\.\.\(selectedCached \|\| \{\}\)/,
  'Recognition result onLoad should only merge a cache object after production fixture, unsafe route safety, and route consistency checks'
)

for (const required of [
  'source: routeOptions.source || (selectedCached && selectedCached.source) ||',
  'regionCode: routeOptions.regionCode || (selectedCached && selectedCached.regionCode) || XICHENG_REGION_CONFIG.regionCode',
  'packageCode: routeOptions.packageCode || (selectedCached && selectedCached.packageCode) || XICHENG_REGION_CONFIG.packageCode',
  "poiCode: routeOptions.poiCode || (selectedCached && selectedCached.poiCode) || ''",
  'poiName: routeOptions.poiName || (selectedCached && selectedCached.poiName) || XICHENG_EMPTY_RECOGNITION_RESULT.poiName'
]) {
  assert.ok(onLoadBlock.includes(required), `Recognition result should prefer route-safe context field ${required}`)
}
