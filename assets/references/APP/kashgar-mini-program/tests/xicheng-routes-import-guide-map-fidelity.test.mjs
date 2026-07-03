import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const routes = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'routes', 'routes.vue'), 'utf8')
const guide = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengMapImportGuide.vue'), 'utf8')
const shell = `${routes}\n${guide}`

for (const token of [
  'map-import-route-card',
  '一键导入攻略',
  '小红书',
  '公众号',
  '马蜂窝',
  '图片/文字',
  'AI 提取地点',
  '匹配官方 POI',
  '生成可走路线',
  'map-import-poi-rail',
  'map-import-selected-summary',
  '当前选点',
  '粘贴攻略',
  '从当前 POI 生成路线',
  'mapImportSources',
  'matchedImportPois',
  'selectedMapPoiSummary',
  'generateSelectedMapRoute',
  'map-import-expanded-body',
  'isExpanded: false',
  'toggleExpanded',
  '展开',
  '收起'
]) {
  assert.ok(shell.includes(token), `Routes map page should expose approved import-guide map token: ${token}`)
}

assert.match(
  routes,
  /import XichengMapImportGuide from '@\/components\/xicheng\/XichengMapImportGuide\.vue'[\s\S]*components:\s*\{[\s\S]*XichengMapImportGuide/,
  'Routes page should import and register the split map import guide component'
)

assert.match(
  routes,
  /<xicheng-map-import-guide[\s\S]*:map-import-sources="mapImportSources"[\s\S]*:matched-import-pois="matchedImportPois"[\s\S]*:selected-map-poi-summary="selectedMapPoiSummary"[\s\S]*@import-guide="openInspirationImport"[\s\S]*@generate-route="generateSelectedMapRoute"/,
  'Routes page should pass guide sources, matched POIs, selected POI summary, and actions into the split component'
)

assert.match(
  guide,
  /<view v-if="isExpanded" class="map-import-expanded-body">[\s\S]*<view class="map-import-step-row">[\s\S]*<view class="map-import-source-row">[\s\S]*v-for="source in mapImportSources"[\s\S]*source\.title[\s\S]*source\.desc/,
  'Routes page should keep import steps and source chips collapsed by default so the cultural map remains the primary screen area'
)

assert.match(
  guide,
  /<view v-if="isExpanded" class="map-import-expanded-body">[\s\S]*v-for="poi in matchedImportPois"[\s\S]*poi\.poiName[\s\S]*poi\.theme[\s\S]*map-import-selected-summary/,
  'Routes page should preview matched official POIs and selected POI summary only after the import guide panel is expanded'
)

assert.match(
  guide,
  /data\(\)\s*\{[\s\S]*return\s*\{[\s\S]*isExpanded:\s*false[\s\S]*methods:\s*\{[\s\S]*toggleExpanded\(\)[\s\S]*this\.isExpanded = !this\.isExpanded/,
  'Map import guide should default to compact mode and expose an explicit expand/collapse control'
)

assert.match(
  guide,
  /<button class="map-import-toggle xicheng-secondary-action" @click="toggleExpanded">[\s\S]*\{\{ isExpanded \? '收起' : '展开' \}\}/,
  'Map import guide should provide a visible expand/collapse button instead of permanently showing the detailed copy'
)

assert.match(
  routes,
  /selectedMapPoiSummary\(\)[\s\S]*selectedMapPoi[\s\S]*poiName[\s\S]*summary/,
  'Routes page should surface the currently selected map POI in the import panel'
)

assert.match(
  routes,
  /generateSelectedMapRoute\(\)[\s\S]*const selectedPoi[\s\S]*routeSource:\s*'map-import'[\s\S]*sourceLabel:\s*'一键导入攻略生成'[\s\S]*this\.persistRoutePassport\(generatedRoute\)[\s\S]*\/pages\/xicheng\/route-detail\/route-detail\?routeCode=/,
  'Routes page should generate a local walkable route from the selected POI, persist reviewed materials, and enter route detail'
)

assert.ok(routes.split(/\r?\n/).length < 880, 'Routes page should stay compact enough for APP packaging')
assert.ok(guide.split(/\r?\n/).length < 240, 'Map import guide component should stay compact enough for APP packaging')

assert.doesNotMatch(
  shell,
  /\/app-api\/xunjing|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}|background-location|startLocationUpdateBackground/,
  'Routes import guide panel should not introduce backend calls, client secrets, or high-risk background permissions'
)
