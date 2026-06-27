import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const mapPath = path.join(root, 'components', 'my-map', 'my-map.vue')
const detailPath = path.join(root, 'subPackages', 'feature', 'map_two', 'detail.vue')
const mapComponent = fs.readFileSync(mapPath, 'utf8')
const detailPage = fs.readFileSync(detailPath, 'utf8')
const mountedBlock = mapComponent.slice(
  mapComponent.indexOf('mounted()'),
  mapComponent.indexOf('beforeDestroy()')
)

assert.match(
  mapComponent,
  /showHandDrawnMap:\s*\{\s*type:\s*Boolean,\s*default:\s*false\s*\}/,
  'hand drawn map overlay should be controlled by a hidden-by-default prop'
)

assert.doesNotMatch(
  mountedBlock,
  /addGroundOverlay\(/,
  'hand drawn map overlay should not be added during initial mount'
)

assert.match(
  detailPage,
  /<mapView[\s\S]*:showHandDrawnMap="showHandDrawnMap"/,
  'map detail page should pass hand drawn map visibility into the map component'
)

assert.match(
  detailPage,
  /<view class="right-btn" @click="goAiGuide">[\s\S]*<\/view>\s*<view class="hand-drawn-switch-row" @click="toggleHandDrawnMap">/,
  'hand drawn map switch should sit below the left-side AI guide control'
)

assert.match(
  mapComponent,
  /syncHandDrawnOverlay\(\)[\s\S]*if \(this\.showHandDrawnMap\)[\s\S]*addGroundOverlay\([\s\S]*else[\s\S]*removeGroundOverlay\(/,
  'overlay sync should add when enabled and remove when disabled'
)

assert.match(
  mapComponent,
  /showHandDrawnMap\([^)]*\) \{[\s\S]*this\.syncHandDrawnOverlay\(\)/,
  'map component should sync the native overlay whenever the parent switch changes'
)

assert.match(
  mapComponent,
  /<canvas[\s\S]*:class="\{ 'tile-layer-hidden': !showHandDrawnMap \}"[\s\S]*canvas-id="tileLayer"/,
  'offline hand drawn tile canvas should be hidden when the hand drawn switch is off'
)

assert.match(
  mapComponent,
  /showHandDrawnMap\([^)]*\) \{[\s\S]*this\.syncHandDrawnTiles\(\)/,
  'map component should sync the offline hand drawn tile layer whenever the parent switch changes'
)

assert.match(
  mapComponent,
  /drawTiles\(\) \{[\s\S]*if \(!this\.showHandDrawnMap\) \{[\s\S]*this\.clearTileLayer\(\)[\s\S]*return/,
  'offline hand drawn tiles should not be drawn while the hand drawn switch is off'
)

assert.match(
  detailPage,
  /const showHandDrawnMap = ref\(false\)[\s\S]*const toggleHandDrawnMap = \(\) => \{[\s\S]*showHandDrawnMap\.value = !showHandDrawnMap\.value/,
  'map detail page should keep the switch off by default and toggle it on tap'
)

assert.match(
  detailPage,
  /class="hand-drawn-switch-track"[\s\S]*class="hand-drawn-switch-label">手绘地图/,
  'hand drawn map switch should use the requested switch plus label style'
)

assert.match(
  detailPage,
  /\.hand-drawn-switch-row\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255[^}]*border-radius:[^}]*box-shadow:[^}]*padding:/,
  'hand drawn map switch should have a white card background so the label stays readable over the map'
)

assert.doesNotMatch(
  mapComponent,
  /class="tool-btn hand-drawn-toggle"|toggleHandDrawnMap\(\)/,
  'map component should not keep the old right-side hand drawn toggle UI'
)
