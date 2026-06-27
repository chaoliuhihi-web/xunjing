import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const detailPath = path.join(root, 'subPackages', 'feature', 'map_two', 'detail.vue')
const detail = fs.readFileSync(detailPath, 'utf8')

assert.match(
  detail,
  /MAP_GUIDE_ATLAS_URL\s*=\s*'https:\/\/www\.neoxiake\.com\/\/upload\/admin\/20260528\/2ea11df9b7429762a9fb737e302ed743\.png'/,
  'map page should use the uploaded original-resolution remote atlas URL'
)

assert.match(
  detail,
  /MAP_GUIDE_FRAME_COUNT\s*=\s*301/,
  'map guide animation should play all 301 original 30fps atlas frames'
)

assert.match(
  detail,
  /MAP_GUIDE_ATLAS_COLUMNS\s*=\s*20/,
  'map guide animation should use the original-resolution atlas 20-column grid'
)

assert.match(
  detail,
  /MAP_GUIDE_ATLAS_ROWS\s*=\s*16/,
  'map guide animation should use the original-resolution atlas 16-row grid'
)

assert.match(
  detail,
  /MAP_GUIDE_FRAME_INTERVAL\s*=\s*33/,
  'map guide animation should play the original atlas at 30fps'
)

assert.match(
  detail,
  /MAP_GUIDE_FRAME_WIDTH_PX\s*=\s*117/,
  'map guide animation should use an integer px frame width 50% larger while avoiding subpixel jitter on phones'
)

assert.match(
  detail,
  /MAP_GUIDE_FRAME_HEIGHT_PX\s*=\s*156/,
  'map guide animation should use an integer px frame height 50% larger while avoiding subpixel jitter on phones'
)

assert.match(
  detail,
  /class="map-guide-atlas-viewport"/,
  'map guide animation should render above the recommendation row'
)

assert.match(
  detail,
  /:style="mapGuideAtlasStyle"/,
  'map guide atlas image should be positioned with a computed atlas style'
)

assert.match(
  detail,
  /transform:\s*`translate3d\(\$\{-column \* MAP_GUIDE_FRAME_WIDTH_PX\}px, \$\{-row \* MAP_GUIDE_FRAME_HEIGHT_PX\}px, 0\)`/,
  'map guide atlas should move by integer px with translate3d instead of rpx transforms'
)
