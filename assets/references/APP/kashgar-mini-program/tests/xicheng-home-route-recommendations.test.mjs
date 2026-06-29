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
  'XICHENG_ROUTE_RECOMMENDATION_FILTERS',
  'createXichengOfficialPoiSources',
  'recommendedRoutes: XICHENG_RECOMMENDED_ROUTES',
  'routeRecommendationFilters: XICHENG_ROUTE_RECOMMENDATION_FILTERS',
  'filteredRecommendedRoutes',
  'route-recommendation-section',
  'route-filter-bar',
  'route-filter-chip',
  '路线推荐',
  'v-for="route in filteredRecommendedRoutes.slice(0, 3)"',
  'recommended-route-card',
  'route-meta',
  'route-stops',
  '查看路线',
  '加入路线护照',
  'openRecommendedRouteDetail(route)',
  'openRecommendedRoute(route)'
]) {
  assert.ok(home.includes(required), `Xicheng home should expose route recommendation UI ${required}`)
}

assert.match(
  home,
  /openRecommendedRoute\(route = \{\}\)[\s\S]*routePayload[\s\S]*regionCode:\s*this\.region\.regionCode[\s\S]*packageCode:\s*this\.region\.packageCode[\s\S]*sceneCode:\s*this\.region\.sceneCode[\s\S]*sourceChannel:\s*this\.region\.sourceChannel[\s\S]*routeSource:\s*'home-recommendation'[\s\S]*sourceLabel:\s*'官方推荐路线'/,
  'Opening a home recommended route should persist full route attribution for route passport operations'
)

assert.match(
  home,
  /import \{ createXichengOfficialPoiSources \} from '@\/request\/xunjing\/officialPoi\.js'/,
  'Home recommended routes should reuse the shared official POI source helper'
)

assert.match(
  home,
  /const routeMaterials = stops\.map\(stop => \{[\s\S]*const sources = createXichengOfficialPoiSources\(stop\)[\s\S]*return \{[\s\S]*type:\s*'official-route-poi'[\s\S]*regionCode:\s*this\.region\.regionCode[\s\S]*packageCode:\s*this\.region\.packageCode[\s\S]*sceneCode:\s*this\.region\.sceneCode[\s\S]*sourceChannel:\s*this\.region\.sourceChannel[\s\S]*routeCode:\s*route\.routeCode/,
  'Home recommended route POI materials should carry scene and source channel for review and city operations reports'
)

assert.match(
  home,
  /const routeMaterials = stops\.map\(stop => \{[\s\S]*type:\s*'official-route-poi'[\s\S]*sources,[\s\S]*sourceCount:\s*sources\.length[\s\S]*reviewStatus:\s*this\.region\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'/,
  'Home recommended route POI materials should be pending review and private before share or review handoff'
)

assert.match(
  home,
  /uni\.setStorageSync\(this\.region\.inspirationStorageKey,\s*routePayload\)[\s\S]*uni\.setStorageSync\(this\.region\.materialsStorageKey/,
  'Home recommended routes should save the route and route POI materials before opening the travelogue'
)

assert.match(
  home,
  /openRecommendedRoute\(route = \{\}\)[\s\S]*\/pages\/xicheng\/travelogue\/travelogue\?mode=route[\s\S]*regionCode=\$\{encodeURIComponent\(this\.region\.regionCode\)\}[\s\S]*packageCode=\$\{encodeURIComponent\(this\.region\.packageCode\)\}[\s\S]*sceneCode=\$\{encodeURIComponent\(this\.region\.sceneCode\)\}[\s\S]*sourceChannel=\$\{encodeURIComponent\(this\.region\.sourceChannel\)\}[\s\S]*routeCode=\$\{encodeURIComponent\(route\.routeCode \|\| ''\)\}[\s\S]*companionName=\$\{encodeURIComponent\(this\.region\.companionName\)\}/,
  'Home recommended route navigation should preserve Xicheng region, package, scene, source channel, route, and companion context'
)

assert.match(
  home,
  /openXichengTravelogue\(mode = 'record'\)[\s\S]*\/pages\/xicheng\/travelogue\/travelogue\?mode=\$\{encodeURIComponent\(mode\)\}[\s\S]*regionCode=\$\{encodeURIComponent\(this\.region\.regionCode\)\}[\s\S]*packageCode=\$\{encodeURIComponent\(this\.region\.packageCode\)\}[\s\S]*sceneCode=\$\{encodeURIComponent\(this\.region\.sceneCode\)\}[\s\S]*sourceChannel=\$\{encodeURIComponent\(this\.region\.sourceChannel\)\}[\s\S]*companionName=\$\{encodeURIComponent\(this\.region\.companionName\)\}/,
  'Home direct travelogue entry should preserve scene and source channel for review and city operations attribution'
)

assert.doesNotMatch(
  home,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Home route recommendation MVP should not add backend calls or client-side secrets'
)
