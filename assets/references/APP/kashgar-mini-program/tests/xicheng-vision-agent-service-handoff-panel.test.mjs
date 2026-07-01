import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')

for (const required of [
  'AI识境服务承接',
  'activeServiceHandoffTask',
  'activeServiceHandoffSteps',
  'serviceHandoffPrimaryAction',
  'createVisionAgentServiceHandoff',
  'createServiceHandoffPrompt',
  'openServiceHandoffPrimaryAction',
  'closeServiceHandoffPanel',
  'vision-agent-service-handoff',
  '服务意图',
  '下一步'
]) {
  assert.ok(scanResult.includes(required), `Scan result should expose service handoff panel behavior: ${required}`)
}

assert.match(
  scanResult,
  /data\(\)\s*\{[\s\S]*activeServiceHandoffTask:\s*null/,
  'Service handoff panel state should start closed'
)

assert.match(
  scanResult,
  /<view v-if="activeServiceHandoffTask" class="vision-agent-service-handoff xicheng-paper-card">[\s\S]*AI识境服务承接[\s\S]*服务意图[\s\S]*activeServiceHandoffSteps[\s\S]*openServiceHandoffPrimaryAction/,
  'Scan result should render an actionable service handoff panel after a service action is selected'
)

assert.match(
  scanResult,
  /openSceneServiceAction\(action = \{\}\)[\s\S]*const serviceTask = this\.rememberVisionAgentServiceTask\(action\)[\s\S]*this\.activeServiceHandoffTask = this\.createVisionAgentServiceHandoff\(serviceTask\)/,
  'Scene service actions should create a persisted task and open the service handoff panel'
)

assert.match(
  scanResult,
  /createVisionAgentServiceHandoff\(task = \{\}\)[\s\S]*merchant[\s\S]*推荐菜\/点单[\s\S]*优惠券[\s\S]*预约\/排队[\s\S]*route[\s\S]*加入旅行地图[\s\S]*推荐下一站[\s\S]*growth[\s\S]*完成打卡[\s\S]*领取徽章/,
  'Service handoff builder should map merchant, route, and growth actions to concrete next steps'
)

assert.match(
  scanResult,
  /createVisionAgentServiceHandoff\(task = \{\}\)[\s\S]*ticketing[\s\S]*票务信息[\s\S]*活动时间[\s\S]*experience[\s\S]*体验预约[\s\S]*附近体验[\s\S]*navigation[\s\S]*文字翻译[\s\S]*步行导航/,
  'Service handoff builder should map ticketing, experience, and navigation actions to concrete next steps'
)

assert.match(
  scanResult,
  /openServiceHandoffPrimaryAction\(\)[\s\S]*const task = this\.activeServiceHandoffTask[\s\S]*const prompt = this\.createServiceHandoffPrompt\(task\)[\s\S]*const serviceHandoffContext = this\.createServiceHandoffRouteContext\(task\)[\s\S]*this\.askXiaojing\(prompt,\s*\{ serviceHandoffContext \}\)/,
  'Primary service handoff action should continue through Xiaojing with a task-specific prompt and structured handoff context'
)
