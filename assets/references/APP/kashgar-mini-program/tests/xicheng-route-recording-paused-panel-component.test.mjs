import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const panelPath = path.join(root, 'components', 'xicheng', 'XichengRouteRecordingPanel.vue')
const pausedPanelPath = path.join(root, 'components', 'xicheng', 'XichengRouteRecordingPausedPanel.vue')

const panel = fs.readFileSync(panelPath, 'utf8')
const panelTemplate = panel.match(/<template>[\s\S]*?<\/template>/)?.[0] || ''

assert.ok(
  fs.existsSync(pausedPanelPath),
  'Paused route recording controls should live in XichengRouteRecordingPausedPanel.vue instead of growing XichengRouteRecordingPanel.vue'
)

const pausedPanel = fs.readFileSync(pausedPanelPath, 'utf8')

assert.match(
  panel,
  /import XichengRouteRecordingPausedPanel from '@\/components\/xicheng\/XichengRouteRecordingPausedPanel\.vue'[\s\S]*components:\s*\{[\s\S]*XichengRouteRecordingPausedPanel/,
  'Route recording panel should import and register the paused-state child component'
)

assert.match(
  panelTemplate,
  /<xicheng-route-recording-paused-panel[\s\S]*v-if="isPaused"[\s\S]*:distance-kilometers="distanceKilometers"[\s\S]*:elapsed-minutes="elapsedMinutes"[\s\S]*:completed-stop-count="completedStopCount"[\s\S]*:route-stop-items="routeStopItems"[\s\S]*:material-count="materialCount"[\s\S]*:next-stop="nextStop"[\s\S]*:next-stop-image="nextStopImage"[\s\S]*:next-stop-title="nextStopTitle"[\s\S]*:next-walk-text="nextWalkText"[\s\S]*:companion-avatar="companionAvatar"[\s\S]*@resume="\$emit\('resume'\)"[\s\S]*@finish="\$emit\('finish'\)"[\s\S]*@photo="\$emit\('photo'\)"[\s\S]*@materials="\$emit\('materials'\)"[\s\S]*@navigate-next="\$emit\('navigate-next'\)"/,
  'Route recording panel should pass paused-state display data and semantic actions into the child component'
)

for (const removedInlineToken of [
  'class="recording-paused-stats',
  'class="recording-paused-actions"',
  'class="recording-paused-next-card',
  'class="recording-xiaojing-card'
]) {
  assert.ok(
    !panelTemplate.includes(removedInlineToken),
    `Route recording panel template should not keep inline ${removedInlineToken} after the paused panel split`
  )
}

for (const token of [
  'name: \'XichengRouteRecordingPausedPanel\'',
  'recording-paused-stats',
  '已记录',
  '用时',
  '已到达',
  '素材',
  'recording-paused-actions',
  '继续记录',
  '结束并生成游记',
  '补记照片',
  '查看今日素材',
  'recording-paused-next-card',
  '下一站：{{ nextStopTitle }}',
  '预计步行 {{ nextWalkText }}',
  '导航到下一站',
  'recording-xiaojing-card',
  '记录已暂停，继续后会接着保存路线记录。'
]) {
  assert.ok(pausedPanel.includes(token), `Paused recording panel should preserve ${token}`)
}

assert.match(
  pausedPanel,
  /props:[\s\S]*distanceKilometers:[\s\S]*elapsedMinutes:[\s\S]*completedStopCount:[\s\S]*routeStopItems:[\s\S]*materialCount:[\s\S]*nextStop:[\s\S]*nextStopImage:[\s\S]*nextStopTitle:[\s\S]*nextWalkText:[\s\S]*companionAvatar:/,
  'Paused recording panel should be data-driven and keep route/session state in the parent'
)

assert.match(
  pausedPanel,
  /emits:\s*\[[\s\S]*'resume'[\s\S]*'finish'[\s\S]*'photo'[\s\S]*'materials'[\s\S]*'navigate-next'[\s\S]*\]/,
  'Paused recording panel should emit semantic actions instead of owning route logic'
)

assert.match(
  pausedPanel,
  /\.recording-paused-actions\s*\{[\s\S]*position:\s*sticky[\s\S]*bottom:\s*168rpx[\s\S]*z-index:\s*12/,
  'Paused recording actions should remain sticky above the four-tab bottom nav'
)

assert.ok(
  pausedPanel.split('\n').length <= 340,
  'Paused route recording panel should stay compact'
)
