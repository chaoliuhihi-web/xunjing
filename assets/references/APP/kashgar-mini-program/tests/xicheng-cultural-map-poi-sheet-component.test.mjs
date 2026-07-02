import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

const componentPath = ['components', 'xicheng', 'XichengCulturalMapPoiSheet.vue']

assert.ok(
  exists(...componentPath),
  'Cultural map POI bottom sheet should be extracted into XichengCulturalMapPoiSheet.vue'
)

const culturalMap = read('components', 'xicheng', 'XichengCulturalMap.vue')
const poiSheet = read(...componentPath)
const shell = `${culturalMap}\n${poiSheet}`

assert.match(
  culturalMap,
  /import XichengCulturalMapPoiSheet from '@\/components\/xicheng\/XichengCulturalMapPoiSheet\.vue'[\s\S]*components:\s*\{[\s\S]*XichengCulturalMapPoiSheet/,
  'Cultural map should import and register the extracted POI sheet component'
)

assert.match(
  culturalMap,
  /<xicheng-cultural-map-poi-sheet[\s\S]*v-if="selectedPoi"[\s\S]*:selected-poi="selectedPoi"[\s\S]*:category-label="getCategoryLabel\(selectedPoi\.categoryKey\)"[\s\S]*@close="clearSelectedPoi"[\s\S]*@navigate="\$emit\('navigate-poi', selectedPoi\)"[\s\S]*@ask="\$emit\('ask-poi', selectedPoi\)"[\s\S]*@add-to-route="\$emit\('add-poi-to-route', selectedPoi\)"/,
  'Cultural map should delegate POI sheet rendering while keeping action handoff in the parent'
)

for (const token of [
  'xicheng-map-bottom-sheet',
  'xicheng-map-sheet-handle',
  'xicheng-map-sheet-close',
  'xicheng-map-sheet-head',
  'xicheng-map-sheet-head-no-image',
  'xicheng-map-sheet-detail-list',
  '导航去这里',
  '问问小京',
  '加入路线',
  '开放时间',
  '距当前位置约 850 米',
  '来源：西城文旅官方资料库',
  '已审核来源'
]) {
  assert.ok(poiSheet.includes(token), `Extracted cultural map POI sheet should keep high-fidelity token: ${token}`)
}

assert.match(
  poiSheet,
  /props:\s*\{[\s\S]*selectedPoi:[\s\S]*type:\s*Object[\s\S]*categoryLabel:[\s\S]*type:\s*String/,
  'POI sheet should receive selected POI data and category label through props'
)

assert.match(
  poiSheet,
  /emits:\s*\['close',\s*'navigate',\s*'ask',\s*'add-to-route'\]/,
  'POI sheet should emit close and action events instead of owning navigation'
)

assert.match(
  poiSheet,
  /@click="\$emit\('close'\)"[\s\S]*@click="\$emit\('navigate'\)"[\s\S]*@click="\$emit\('ask'\)"[\s\S]*@click="\$emit\('add-to-route'\)"/,
  'POI sheet buttons should emit action events for the route page to handle'
)

assert.doesNotMatch(
  culturalMap,
  /class="xicheng-map-sheet-head"[\s\S]*selectedPoi\.openTime[\s\S]*class="xicheng-map-sheet-actions"/,
  'Cultural map shell should not keep the full POI sheet template inline after extraction'
)

assert.ok(culturalMap.split(/\r?\n/).length < 810, 'Cultural map component should shrink after extracting the POI sheet')
assert.ok(poiSheet.split(/\r?\n/).length < 230, 'Cultural map POI sheet component should remain compact for APP packaging')

assert.doesNotMatch(
  shell,
  /\/app-api\/xunjing|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Cultural map POI sheet extraction should not introduce backend calls or client-side secrets'
)
