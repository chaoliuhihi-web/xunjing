import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

assert.ok(
  exists('request', 'xunjing', 'routeMaterials.js'),
  'Official route material persistence should use a shared helper instead of duplicating merge logic in route pages'
)

const helper = read('request', 'xunjing', 'routeMaterials.js')
const routes = read('pages', 'xicheng', 'routes', 'routes.vue')
const routeDetail = read('pages', 'xicheng', 'route-detail', 'route-detail.vue')

const routeMaterialKeyBlock = helper.match(/export const createXichengRouteMaterialKey\s*=\s*\(material = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const mergeBlock = helper.match(/export const mergeXichengOfficialRouteMaterials\s*=\s*\(routeMaterials = \[\], existingMaterials = \[\]\) => \{[\s\S]*?\n\}/)?.[0] || ''

for (const required of [
  'material.type',
  'material.routeCode',
  'material.poiCode',
  'material.poiName'
]) {
  assert.ok(routeMaterialKeyBlock.includes(required), `Official route material key should include ${required}`)
}

assert.match(
  mergeBlock,
  /const routeMaterialKeys = new Set\([\s\S]*routeMaterials[\s\S]*createXichengRouteMaterialKey/,
  'Official route material merge should compute route material keys before merging with cached materials'
)

assert.match(
  mergeBlock,
  /existingMaterials[\s\S]*filter\(material => !routeMaterialKeys\.has\(createXichengRouteMaterialKey\(material\)\)\)/,
  'Official route material merge should remove cached duplicates with the same type, routeCode, and POI before prepending fresh route materials'
)

assert.match(
  routes,
  /import \{ mergeXichengOfficialRouteMaterials \} from '@\/request\/xunjing\/routeMaterials\.js'[\s\S]*mergeXichengOfficialRouteMaterials\(routeMaterials,\s*materials\)\.slice\(0,\s*80\)/,
  'Route list passport persistence should dedupe repeated official route POI materials before writing local storage'
)

assert.match(
  routeDetail,
  /import \{ mergeXichengOfficialRouteMaterials \} from '@\/request\/xunjing\/routeMaterials\.js'[\s\S]*mergeXichengOfficialRouteMaterials\(routeMaterials,\s*materials\)\.slice\(0,\s*80\)/,
  'Route detail passport persistence should dedupe repeated official route POI materials before writing local storage'
)
