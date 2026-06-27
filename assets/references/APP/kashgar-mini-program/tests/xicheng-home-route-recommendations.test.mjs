import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')

assert.match(
  regionConfig,
  /export const XICHENG_RECOMMENDED_ROUTES\s*=\s*Object\.freeze\(\[/,
  'Xicheng config should expose official route recommendations for home operations'
)

for (const required of [
  "routeCode: 'baitasi-imperial-shichahai'",
  "routeCode: 'beihai-shichahai-waterfront'",
  "routeCode: 'dashilar-old-brand-walk'",
  'passportTaskCount',
  'studyTaskCount',
  'stops'
]) {
  assert.ok(regionConfig.includes(required), `Recommended routes should include ${required}`)
}

for (const required of [
  'XICHENG_RECOMMENDED_ROUTES',
  'recommendedRoutes: XICHENG_RECOMMENDED_ROUTES',
  'route-recommendation-section',
  '路线推荐',
  'v-for="route in recommendedRoutes.slice(0, 3)"',
  'recommended-route-card',
  'route-meta',
  'route-stops',
  '加入路线护照',
  'openRecommendedRoute(route)'
]) {
  assert.ok(home.includes(required), `Xicheng home should expose route recommendation UI ${required}`)
}

assert.match(
  home,
  /openRecommendedRoute\(route = \{\}\)[\s\S]*routePayload[\s\S]*regionCode:\s*this\.region\.regionCode[\s\S]*packageCode:\s*this\.region\.packageCode[\s\S]*sourceChannel:\s*this\.region\.sourceChannel[\s\S]*routeSource:\s*'home-recommendation'[\s\S]*sourceLabel:\s*'官方推荐路线'/,
  'Opening a home recommended route should persist route attribution for route passport operations'
)

assert.match(
  home,
  /uni\.setStorageSync\(this\.region\.inspirationStorageKey,\s*routePayload\)[\s\S]*uni\.setStorageSync\(this\.region\.materialsStorageKey/,
  'Home recommended routes should save the route and route POI materials before opening the travelogue'
)

assert.match(
  home,
  /openRecommendedRoute\(route = \{\}\)[\s\S]*\/pages\/xicheng\/travelogue\/travelogue\?mode=route[\s\S]*regionCode=\$\{encodeURIComponent\(this\.region\.regionCode\)\}[\s\S]*packageCode=\$\{encodeURIComponent\(this\.region\.packageCode\)\}[\s\S]*companionName=\$\{encodeURIComponent\(this\.region\.companionName\)\}/,
  'Home recommended route navigation should preserve Xicheng region, package, and companion context'
)

assert.doesNotMatch(
  home,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Home route recommendation MVP should not add backend calls or client-side secrets'
)
