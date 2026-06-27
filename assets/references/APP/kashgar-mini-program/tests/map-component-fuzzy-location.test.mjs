import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const mapComponentPath = path.join(root, 'components', 'my-map', 'my-map.vue')
const mapComponent = fs.readFileSync(mapComponentPath, 'utf8')

assert.doesNotMatch(
  mapComponent,
  /:show-location\s*=\s*["']true["']|show-location\s*=\s*["']true["']/,
  'map component should not enable native show-location because it requires scope.userLocation'
)

assert.doesNotMatch(
  mapComponent,
  /map-btn_x|toLocation\(\)|left2\.png|moveToLocation/,
  'map component should not render a locate-me button after switching to fuzzy location'
)
