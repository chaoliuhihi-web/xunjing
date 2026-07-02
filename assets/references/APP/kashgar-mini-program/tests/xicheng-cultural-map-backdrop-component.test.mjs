import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

const backdropPath = ['components', 'xicheng', 'XichengCulturalMapBackdrop.vue']
const mapConfigPath = ['config', 'regions', 'xichengMap.js']

assert.ok(
  exists(...backdropPath),
  'Cultural map decorative backdrop should be extracted into XichengCulturalMapBackdrop.vue'
)
assert.ok(
  exists(...mapConfigPath),
  'Cultural map categories, backdrop landmarks, and POI positions should live in xichengMap.js config'
)

const culturalMap = read('components', 'xicheng', 'XichengCulturalMap.vue')
const backdrop = read(...backdropPath)
const mapConfig = read(...mapConfigPath)
const shell = `${culturalMap}\n${backdrop}\n${mapConfig}`

assert.match(
  culturalMap,
  /import XichengCulturalMapBackdrop from '@\/components\/xicheng\/XichengCulturalMapBackdrop\.vue'[\s\S]*components:\s*\{[\s\S]*XichengCulturalMapBackdrop[\s\S]*XichengCulturalMapPoiSheet/,
  'Cultural map should import and register the extracted backdrop component'
)

assert.match(
  culturalMap,
  /<xicheng-cultural-map-backdrop\s*\/>/,
  'Cultural map canvas should render the extracted backdrop before route and POI overlays'
)

assert.match(
  mapConfig,
  /export const XICHENG_CULTURAL_MAP_CATEGORIES = Object\.freeze\(\[[\s\S]*文化建筑[\s\S]*历史遗迹[\s\S]*胡同院落[\s\S]*美食购物[\s\S]*自然景观/,
  'Cultural map categories should be reusable config, not inline component data'
)

assert.match(
  mapConfig,
  /export const XICHENG_CULTURAL_MAP_POI_LAYOUTS = Object\.freeze\(\{[\s\S]*'xicheng-baitasi':\s*\{ left:\s*19,\s*top:\s*63[\s\S]*'xicheng-shichahai':\s*\{ left:\s*50,\s*top:\s*39[\s\S]*'xicheng-beihai-north-gate':\s*\{ left:\s*68,\s*top:\s*27/,
  'Cultural map should keep reviewed POI positions in config so the map can be tuned without changing component flow'
)

for (const token of [
  'xicheng-map-paper-grid',
  'xicheng-map-water-main',
  'xicheng-map-landmark-district',
  'xicheng-map-category-legend',
  'XICHENG_CULTURAL_MAP_BACKDROP',
  'XICHENG_CULTURAL_MAP_CATEGORIES'
]) {
  assert.ok(shell.includes(token), `Cultural map backdrop extraction should preserve ${token}`)
}

assert.doesNotMatch(
  culturalMap,
  /const DEFAULT_MAP_CATEGORIES|const FALLBACK_POI_LAYOUT|const FALLBACK_POIS|mapSketches\(\)|mapTrees\(\)/,
  'Cultural map shell should not own static map categories, fallback POIs, or decorative sketch/tree data after extraction'
)

assert.ok(culturalMap.split(/\r?\n/).length < 620, 'Cultural map shell should shrink after backdrop/config extraction')
assert.ok(backdrop.split(/\r?\n/).length < 360, 'Cultural map backdrop component should stay compact for APP packaging')
assert.ok(mapConfig.split(/\r?\n/).length < 180, 'Cultural map config should stay compact and reviewable')

assert.doesNotMatch(
  shell,
  /\/app-api\/xunjing|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Cultural map backdrop/config extraction should not introduce backend calls or client-side secrets'
)
