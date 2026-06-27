import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const indexPath = path.join(root, 'pages', 'index', 'index.vue')
const indexPage = fs.readFileSync(indexPath, 'utf8')
const buildPagePath = path.join(root, 'unpackage', 'dist', 'build', 'mp-weixin', 'pages', 'index', 'index.js')
const devPagePath = path.join(root, 'unpackage', 'dist', 'dev', 'mp-weixin', 'pages', 'index', 'index.js')
const buildPage = fs.existsSync(buildPagePath) ? fs.readFileSync(buildPagePath, 'utf8') : ''
const devPage = fs.existsSync(devPagePath) ? fs.readFileSync(devPagePath, 'utf8') : ''
const initLocation = indexPage.slice(
  indexPage.indexOf('initLocation(force = false)'),
  indexPage.indexOf('reverseGeocodeLocation(latitude, longitude)')
)

assert.ok(
  indexPage.includes("currentCity: '定位失败'"),
  'home location should not default to Beijing before a real location succeeds'
)

assert.doesNotMatch(
  initLocation,
  /currentCity\s*=\s*(?:cached && cached\.city \? cached\.city : '北京'|'北京')/,
  'home location failures should not fall back to cached city or Beijing'
)

assert.match(
  initLocation,
  /isReverseGeocoderQuotaLimited\(\)[\s\S]*this\.currentCity = '定位失败'/,
  'home location quota limit should show location failure'
)

assert.match(
  initLocation,
  /catch \(error\)[\s\S]*this\.currentCity = '定位失败'/,
  'home reverse geocode failure should show location failure'
)

assert.match(
  initLocation,
  /fail: \(error\) => \{[\s\S]*this\.currentCity = '定位失败'/,
  'home getLocation failure should show location failure'
)

assert.match(
  indexPage,
  /formatCityName\(city = ''\) \{[\s\S]*return String\(city \|\| ''\)\.replace\(\u002F市\$\u002F, ''\)/,
  'home city formatter should not invent Beijing when no city is returned'
)

assert.match(
  initLocation,
  /fail: \(error\) => \{[\s\S]*this\.currentCity = '定位失败'[\s\S]*this\.showLocationPermissionModal\(\)/,
  'home getLocation failure should guide users to open location permission and retry'
)

assert.match(
  indexPage,
  /const HOME_LOCATION_TIMEOUT_MS = \d+/,
  'home location should define a local timeout for stuck native location requests'
)

assert.match(
  initLocation,
  /const locationTimeoutTimer = setTimeout\(\(\) => \{[\s\S]*this\.currentCity = '定位失败'[\s\S]*this\.isLocating = false[\s\S]*\}, HOME_LOCATION_TIMEOUT_MS\)/,
  'home location should show failure if native getLocation never calls success or fail'
)

assert.match(
  initLocation,
  /complete: \(\) => \{[\s\S]*if \(!nativeLocationSucceeded\) \{[\s\S]*finishLocationFlow\(\)/,
  'home location should clear the local timeout when native location fails before reverse geocoding'
)

assert.match(
  initLocation,
  /const finishLocationFlow = \(\) => \{[\s\S]*clearTimeout\(locationTimeoutTimer\)[\s\S]*this\.isLocating = false[\s\S]*success: async \(location\) => \{[\s\S]*finally \{[\s\S]*finishLocationFlow\(\)/,
  'home location timeout should cover reverse geocoding after native getLocation succeeds'
)

assert.match(
  initLocation,
  /uni\.getSetting\(\{[\s\S]*scope\.userFuzzyLocation[\s\S]*this\.showLocationPermissionModal\(\)/,
  'home location should check existing location authorization and guide users when permission was denied'
)

assert.match(
  indexPage,
  /showLocationPermissionModal\(\) \{[\s\S]*uni\.showModal\(\{[\s\S]*confirmText:[\s\S]*uni\.openSetting\(\{[\s\S]*scope\.userFuzzyLocation[\s\S]*this\.initLocation\(true\)/,
  'home location should centralize the open-setting permission guide'
)

assert.match(
  initLocation,
  /cached && cached\.city[\s\S]*this\.isUsableCachedCity\(cached\.city\)/,
  'home location should not trust transient cached labels like locating'
)

assert.match(
  indexPage,
  /isUsableCachedCity\(city\) \{[\s\S]*定位中[\s\S]*定位失败/,
  'home location should reject transient location labels from cache'
)

if (buildPage) {
  assert.match(
    buildPage,
    /nativeLocationSucceeded|let r=!1/,
    'mp-weixin build output should contain the guarded location completion flow'
  )
}

if (devPage) {
  assert.match(
    devPage,
    /nativeLocationSucceeded|let r=!1/,
    'mp-weixin dev output should contain the guarded location completion flow for phone preview'
  )
}
