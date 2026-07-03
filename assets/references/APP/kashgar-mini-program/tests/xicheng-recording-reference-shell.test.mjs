import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

const componentPath = ['components', 'xicheng', 'XichengRouteRecordingPanel.vue']
const mapCanvasPath = ['components', 'xicheng', 'XichengRouteRecordingMapCanvas.vue']
const pausedPanelPath = ['components', 'xicheng', 'XichengRouteRecordingPausedPanel.vue']

assert.ok(
  exists(...componentPath),
  'Route recording page should extract the approved UI shell into a dedicated component'
)

assert.ok(
  exists(...mapCanvasPath),
  'Route recording page should keep the recording map canvas in a focused child component'
)

assert.ok(
  exists(...pausedPanelPath),
  'Route recording page should keep paused recording controls in a focused child component'
)

const recording = read('pages', 'xicheng', 'recording', 'recording.vue')
const panel = read(...componentPath)
const mapCanvas = read(...mapCanvasPath)
const pausedPanel = read(...pausedPanelPath)
const combinedShell = `${panel}\n${mapCanvas}\n${pausedPanel}`
const getStyleBlock = (source, selector) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] || ''
}
const liveActionsStyle = getStyleBlock(panel, '.recording-live-actions')
const liveNextCardStyle = getStyleBlock(panel, '.recording-live-next-card')
const liveNextImageStyle = getStyleBlock(panel, '.recording-live-next-image')
const checkinButtonStyle = getStyleBlock(panel, '.recording-checkin-button')
const pausedActionsStyle = getStyleBlock(pausedPanel, '.recording-paused-actions')

assert.match(
  recording,
  /import XichengRouteRecordingPanel from '@\/components\/xicheng\/XichengRouteRecordingPanel\.vue'/,
  'Recording page should import the dedicated recording panel component'
)

assert.match(
  recording,
  /<xicheng-route-recording-panel[\s\S]*:session="recordingSession"[\s\S]*:route="activeRoute"[\s\S]*:route-stops="routeStopCards"[\s\S]*:next-stop="nextStop"[\s\S]*@arrive="arriveAtNextStop"[\s\S]*@pause="pauseRecordingSession"[\s\S]*@resume="resumeRecordingSession"[\s\S]*@finish="generateTravelogue"/,
  'Recording page should pass route state into the component and wire live recording actions back to page methods'
)

for (const required of [
  '记录中',
  '已暂停',
  '白塔寺文化线',
  '路线进度',
  '已用时',
  '已走距离',
  '完成进度',
  'recording-map-canvas',
  'recording-route-path',
  'recording-route-segment',
  'recording-live-pin',
  'recording-progress-card',
  '下一站',
  '预计步行时间',
  '到达打卡',
  '游记素材任务',
  '暂停记录',
  '继续记录',
  '结束并生成游记',
  '导航到下一站',
  '补记照片',
  '查看今日素材',
  '为保证定位准确，请保持 APP 在前台运行'
]) {
  assert.ok(combinedShell.includes(required), `Recording shell should include approved UI element ${required}`)
}

assert.match(
  panel,
  /<xicheng-route-recording-paused-panel[\s\S]*v-if="isPaused"[\s\S]*:material-count="materialCount"[\s\S]*@finish="\$emit\('finish'\)"/,
  'Paused recording shell should delegate route summary and finish actions to the split paused panel'
)

assert.match(
  pausedPanel,
  /class="recording-paused-stats[^"]*"[\s\S]*已记录[\s\S]*用时[\s\S]*已到达[\s\S]*素材/,
  'Paused recording shell should expose a compact route summary matching the approved paused/finish reference'
)

assert.match(
  pausedPanel,
  /class="recording-paused-stats[^"]*"[\s\S]*class="recording-paused-actions"[\s\S]*class="recording-paused-next-card/,
  'Paused recording shell should surface finish/travelogue actions before secondary next-stop guidance'
)

assert.match(
  combinedShell,
  /v-for="segment in routeSegments"[\s\S]*class="recording-path-segment recording-route-segment"[\s\S]*:style="getRouteSegmentStyle\(segment\)"/,
  'Recording route line should be rendered from dynamic route-stop segments instead of fixed decorative CSS segments'
)

assert.match(
  combinedShell,
  /routeSegments\(\)[\s\S]*this\.routeStopItems[\s\S]*slice\(0,\s*-1\)[\s\S]*Math\.hypot[\s\S]*Math\.atan2/,
  'Recording route segments should be calculated from adjacent route-stop coordinates'
)

assert.match(
  combinedShell,
  /getRouteSegmentStyle\(segment = \{\}\)[\s\S]*left:\$\{segment\.left\}%[\s\S]*top:\$\{segment\.top\}%[\s\S]*width:\$\{segment\.width\}%[\s\S]*rotate\(\$\{segment\.angle\}deg\)/,
  'Recording route segment style should use percentage position, length, and rotation'
)

assert.doesNotMatch(
  combinedShell,
  /recording-path-segment-1|recording-path-segment-2|recording-path-segment-3|recording-path-segment-4/,
  'Recording route should not keep fixed segment classes after switching to route-stop-driven geometry'
)

assert.match(
  pausedActionsStyle,
  /position:\s*sticky[\s\S]*bottom:\s*168rpx[\s\S]*z-index:\s*12/,
  'Paused recording actions should stay above the four-tab bottom nav in the target mobile viewport'
)

assert.doesNotMatch(
  liveActionsStyle,
  /position:\s*sticky/,
  'Live recording actions should stay in normal flow so they do not cover the next-stop check-in button'
)

assert.match(
  liveNextCardStyle,
  /margin-bottom:\s*24rpx/,
  'Live next-stop card should leave visible breathing room before secondary recording actions'
)

assert.match(
  liveNextImageStyle,
  /height:\s*172rpx/,
  'Live next-stop image should stay compact enough for the check-in button to remain above the bottom nav'
)

assert.match(
  checkinButtonStyle,
  /min-height:\s*76rpx/,
  'Live check-in button should fit above the bottom nav in the target mobile viewport'
)

assert.match(
  panel,
  /v-else[\s\S]*class="recording-live-next-card[^"]*"[\s\S]*下一站[\s\S]*到达打卡/,
  'Live recording shell should prioritize the next stop card and check-in action'
)

for (const eventName of ['pause', 'resume', 'arrive', 'finish', 'ask', 'locate', 'toggle-layer']) {
  assert.ok(panel.includes(`$emit('${eventName}')`), `Recording panel should emit ${eventName} instead of mutating route state directly`)
}

assert.doesNotMatch(
  panel,
  /路线护照|我的足迹|保存足迹|结束并生成游记素材|亲子研学任务/,
  'Recording panel should keep the record flow focused on travelogue materials instead of older passport/footprint/study-growth entries'
)

assert.doesNotMatch(
  combinedShell + recording,
  /\/app-api\/xunjing|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'High-fidelity recording shell should not introduce backend calls or client-side secrets'
)
