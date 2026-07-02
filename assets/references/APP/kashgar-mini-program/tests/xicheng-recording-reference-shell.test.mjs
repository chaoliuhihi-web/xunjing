import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

const componentPath = ['components', 'xicheng', 'XichengRouteRecordingPanel.vue']

assert.ok(
  exists(...componentPath),
  'Route recording page should extract the approved UI shell into a dedicated component'
)

const recording = read('pages', 'xicheng', 'recording', 'recording.vue')
const panel = read(...componentPath)
const getStyleBlock = (source, selector) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] || ''
}
const liveActionsStyle = getStyleBlock(panel, '.recording-live-actions')

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
  assert.ok(panel.includes(required), `Recording panel should include approved UI element ${required}`)
}

assert.match(
  panel,
  /v-if="isPaused"[\s\S]*class="recording-paused-stats[^"]*"[\s\S]*已记录[\s\S]*用时[\s\S]*已到达[\s\S]*素材/,
  'Paused recording shell should expose a compact route summary matching the approved paused/finish reference'
)

assert.match(
  panel,
  /class="recording-paused-stats[^"]*"[\s\S]*class="recording-paused-actions"[\s\S]*class="recording-paused-next-card/,
  'Paused recording shell should surface finish/travelogue actions before secondary next-stop guidance'
)

assert.match(
  panel,
  /v-for="segment in routeSegments"[\s\S]*class="recording-path-segment recording-route-segment"[\s\S]*:style="getRouteSegmentStyle\(segment\)"/,
  'Recording route line should be rendered from dynamic route-stop segments instead of fixed decorative CSS segments'
)

assert.match(
  panel,
  /routeSegments\(\)[\s\S]*this\.routeStopItems[\s\S]*slice\(0,\s*-1\)[\s\S]*Math\.hypot[\s\S]*Math\.atan2/,
  'Recording route segments should be calculated from adjacent route-stop coordinates'
)

assert.match(
  panel,
  /getRouteSegmentStyle\(segment = \{\}\)[\s\S]*left:\$\{segment\.left\}%[\s\S]*top:\$\{segment\.top\}%[\s\S]*width:\$\{segment\.width\}%[\s\S]*rotate\(\$\{segment\.angle\}deg\)/,
  'Recording route segment style should use percentage position, length, and rotation'
)

assert.doesNotMatch(
  panel,
  /recording-path-segment-1|recording-path-segment-2|recording-path-segment-3|recording-path-segment-4/,
  'Recording route should not keep fixed segment classes after switching to route-stop-driven geometry'
)

assert.match(
  panel,
  /\.recording-paused-actions\s*\{[\s\S]*position:\s*sticky[\s\S]*bottom:\s*168rpx[\s\S]*z-index:\s*12/,
  'Paused recording actions should stay above the four-tab bottom nav in the target mobile viewport'
)

assert.match(
  liveActionsStyle,
  /position:\s*sticky[\s\S]*bottom:\s*168rpx[\s\S]*z-index:\s*12/,
  'Live recording actions should stay above the four-tab bottom nav so Generate Travelogue remains tappable'
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
  panel + recording,
  /\/app-api\/xunjing|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'High-fidelity recording shell should not introduce backend calls or client-side secrets'
)
