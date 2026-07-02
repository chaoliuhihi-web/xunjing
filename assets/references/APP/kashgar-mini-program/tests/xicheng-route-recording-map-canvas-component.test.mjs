import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const panelPath = path.join(root, 'components', 'xicheng', 'XichengRouteRecordingPanel.vue')
const mapCanvasPath = path.join(root, 'components', 'xicheng', 'XichengRouteRecordingMapCanvas.vue')

assert.ok(
  fs.existsSync(mapCanvasPath),
  'Route recording map canvas should be split into XichengRouteRecordingMapCanvas.vue'
)

const panel = fs.readFileSync(panelPath, 'utf8')
const mapCanvas = fs.readFileSync(mapCanvasPath, 'utf8')
const panelTemplate = panel.match(/<template>[\s\S]*?<\/template>/)?.[0] || ''
const getStyleBlock = (source, selector) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] || ''
}
const mapCanvasStyle = getStyleBlock(mapCanvas, '.recording-map-canvas')

assert.match(
  panel,
  /import XichengRouteRecordingMapCanvas from '@\/components\/xicheng\/XichengRouteRecordingMapCanvas\.vue'/,
  'Route recording panel should import the split map canvas component'
)

assert.match(
  panel,
  /components:\s*\{[\s\S]*XichengRouteRecordingMapCanvas[\s\S]*\}/,
  'Route recording panel should register the split map canvas component'
)

assert.match(
  panelTemplate,
  /<xicheng-route-recording-map-canvas[\s\S]*:is-paused="isPaused"[\s\S]*:route-title="routeTitle"[\s\S]*:elapsed-minutes="elapsedMinutes"[\s\S]*:distance-kilometers="distanceKilometers"[\s\S]*:completed-stop-count="completedStopCount"[\s\S]*:route-stop-items="routeStopItems"[\s\S]*:next-stop="nextStop"[\s\S]*:completed-stop-poi-codes="completedStopPoiCodes"[\s\S]*@locate="\$emit\('locate'\)"[\s\S]*@toggle-layer="\$emit\('toggle-layer'\)"[\s\S]*\/>/,
  'Route recording panel should delegate map rendering while preserving locate and layer events'
)

for (const removedInlineToken of [
  'class="recording-map-canvas xicheng-paper-card"',
  'class="recording-route-path"',
  'class="recording-map-tool-stack"',
  'class="recording-live-pin"'
]) {
  assert.ok(
    !panelTemplate.includes(removedInlineToken),
    `Route recording panel template should not keep inline ${removedInlineToken} after the map split`
  )
}

for (const token of [
  'class="recording-map-canvas xicheng-paper-card"',
  'recording-map-paper-grid',
  'recording-map-water-main',
  'recording-map-street-top',
  'recording-map-district',
  'recording-progress-card',
  '路线进度',
  '已用时',
  '已走距离',
  '完成进度',
  'recording-category-legend',
  'recording-route-path',
  'recording-route-segment',
  'recording-stop-marker',
  'recording-live-pin',
  'recording-map-tool-stack',
  '定位',
  '图层',
  '100 m'
]) {
  assert.ok(mapCanvas.includes(token), `Split route recording map canvas should keep ${token}`)
}

assert.match(
  mapCanvas,
  /routeSegments\(\)[\s\S]*this\.routeStopItems[\s\S]*slice\(0,\s*-1\)[\s\S]*Math\.hypot[\s\S]*Math\.atan2/,
  'Split map canvas should calculate route segments from adjacent route stops'
)

assert.match(
  mapCanvas,
  /getRouteSegmentStyle\(segment = \{\}\)[\s\S]*left:\$\{segment\.left\}%[\s\S]*top:\$\{segment\.top\}%[\s\S]*width:\$\{segment\.width\}%[\s\S]*rotate\(\$\{segment\.angle\}deg\)/,
  'Split map canvas should keep percentage route segment positioning'
)

assert.match(
  mapCanvas,
  /emits:\s*\[[\s\S]*'locate'[\s\S]*'toggle-layer'[\s\S]*\]/,
  'Split map canvas should emit map actions instead of mutating page state'
)

assert.match(
  mapCanvasStyle,
  /min-height:\s*640rpx/,
  'Recording map canvas should be compact enough for the next-stop check-in card to clear the bottom nav'
)

assert.ok(
  mapCanvas.split('\n').length <= 520,
  'Split route recording map canvas should stay compact enough to maintain independently'
)

assert.ok(
  panel.split('\n').length < 900,
  'Route recording panel should shrink after extracting the map canvas'
)
