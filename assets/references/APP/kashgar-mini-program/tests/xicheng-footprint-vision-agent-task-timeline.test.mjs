import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const footprint = read('pages', 'xicheng', 'footprint', 'footprint.vue')
const regionConfig = read('config', 'regions', 'xicheng.js')

assert.match(
  regionConfig,
  /visionAgentServiceTasksStorageKey:\s*'xicheng_vision_agent_service_tasks'/,
  'Region config should own the AI识境 service task storage key used by footprint'
)

for (const required of [
  'visionAgentServiceTasks',
  'visionAgentServiceTaskCount',
  'loadVisionAgentFootprintTasks',
  'formatVisionAgentFootprintTaskDesc',
  'AI识境任务',
  '智能助手',
  '商家',
  '路线',
  '后续动作'
]) {
  assert.ok(footprint.includes(required), `Footprint should expose Vision Agent task timeline behavior: ${required}`)
}

assert.match(
  footprint,
  /metric-grid[\s\S]*{{ visionAgentServiceTaskCount }}[\s\S]*<text class="metric-label">AI任务<\/text>/,
  'Footprint hero metrics should count AI识境 task-package actions as a first-class journey signal'
)

assert.match(
  footprint,
  /footprintTabs\(\)[\s\S]*return \['全部', '识别', '问答', '路线', 'AI识境'\]/,
  'Footprint tabs should include AI识境 so task-package actions are not hidden under generic materials'
)

assert.match(
  footprint,
  /selectedFootprintFilter:\s*'全部'/,
  'Footprint should keep the selected timeline filter in page state'
)

assert.match(
  footprint,
  /footprint-filter-chip[\s\S]*:class="\{ active: selectedFootprintFilter === tab \}"[\s\S]*@click="selectFootprintFilter\(tab\)"/,
  'Footprint filter chips should be tappable and show the selected state'
)

assert.match(
  footprint,
  /filteredTimelineItems\(\)[\s\S]*if \(this\.selectedFootprintFilter === '全部'\) return this\.timelineItems[\s\S]*return this\.timelineItems\.filter\(item => item\.filterKey === this\.selectedFootprintFilter\)/,
  'Footprint should derive the visible timeline from the selected filter'
)

assert.match(
  footprint,
  /selectFootprintFilter\(tab = '全部'\)[\s\S]*this\.selectedFootprintFilter = this\.footprintTabs\.includes\(tab\) \? tab : '全部'/,
  'Footprint filter taps should normalize unknown tabs back to 全部'
)

assert.match(
  footprint,
  /section-badge">\{\{ filteredTimelineItems\.length \}\} 条[\s\S]*v-if="filteredTimelineItems\.length > 0"[\s\S]*v-for="item in filteredTimelineItems"/,
  'Footprint section count and list should render the filtered timeline, not the unfiltered source'
)

assert.match(
  footprint,
  /timelineItems\(\)[\s\S]*const visionAgentTaskItems = this\.visionAgentServiceTasks\.slice\(0, 6\)\.map\(\(task, index\) => \(\{[\s\S]*typeLabel:\s*'AI识境任务'[\s\S]*title:\s*task\.actionTitle \|\| task\.actionCopy \|\| 'AI识境后续动作'[\s\S]*desc:\s*this\.formatVisionAgentFootprintTaskDesc\(task\)[\s\S]*time:\s*formatTime\(task\.createdAt\)/,
  'Footprint timeline should render AI识境 service tasks with action title, typed label, formatted desc, and task time'
)

assert.match(
  footprint,
  /typeLabel:\s*item\.type === 'ai-guide' \? 'AI 问答' : '识别'[\s\S]*filterKey:\s*item\.type === 'ai-guide' \? '问答' : '识别'[\s\S]*typeLabel:\s*'路线'[\s\S]*filterKey:\s*'路线'[\s\S]*typeLabel:\s*'AI识境任务'[\s\S]*filterKey:\s*'AI识境'/,
  'Footprint timeline items should expose stable filter keys for recognition, Q&A, route, and AI识境 rows'
)

assert.match(
  footprint,
  /return \[\.\.\.materialItems, \.\.\.checkinItems, \.\.\.visionAgentTaskItems\][\s\S]*\.slice\(0, 10\)/,
  'Footprint timeline should merge AI识境 tasks with materials and route check-ins and keep enough recent items'
)

assert.match(
  footprint,
  /loadVisionAgentFootprintTasks\(\)[\s\S]*uni\.getStorageSync\(XICHENG_REGION_CONFIG\.visionAgentServiceTasksStorageKey\)[\s\S]*this\.visionAgentServiceTasks/,
  'Footprint should load AI识境 task-package actions from the same storage key used by scan result and travelogue'
)

assert.match(
  footprint,
  /loadFootprint\(\)[\s\S]*this\.loadVisionAgentFootprintTasks\(\)/,
  'Refreshing footprint should load Vision Agent tasks together with materials and check-ins'
)

assert.match(
  footprint,
  /formatVisionAgentFootprintTaskDesc\(task = \{\}\)[\s\S]*task\.poiName[\s\S]*task\.serviceIntentLabel[\s\S]*task\.actionPrompt[\s\S]*task\.statusText/,
  'Vision Agent task descriptions should preserve POI, service intent, prompt, and status for reviewable continuity'
)
