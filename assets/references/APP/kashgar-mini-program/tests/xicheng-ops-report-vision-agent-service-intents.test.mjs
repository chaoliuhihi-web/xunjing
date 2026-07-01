import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const opsReport = read('pages', 'xicheng', 'ops-report', 'ops-report.vue')
const regionConfig = read('config', 'regions', 'xicheng.js')

assert.match(
  regionConfig,
  /visionAgentServiceTasksStorageKey:\s*'xicheng_vision_agent_service_tasks'/,
  'Region config should own the AI识境 task package key consumed by the standalone ops report'
)

for (const required of [
  'visionAgentServiceTasks',
  'visionAgentServiceTaskCount',
  'merchantServiceTasks',
  'merchantServiceTaskCount',
  'serviceIntentSummaryCards',
  'formatVisionAgentServiceIntentLabel',
  'AI识境服务',
  '商家意向',
  '点餐',
  '优惠',
  '预约'
]) {
  assert.ok(opsReport.includes(required), `Ops report should expose AI识境 service-intent operations behavior: ${required}`)
}

assert.match(
  opsReport,
  /metrics\(\)[\s\S]*label:\s*'AI识境服务'[\s\S]*value:\s*this\.visionAgentServiceTaskCount[\s\S]*label:\s*'商家意向'[\s\S]*value:\s*this\.merchantServiceTaskCount/,
  'Ops report top metrics should count AI识境 service tasks and merchant-intent actions'
)

assert.match(
  opsReport,
  /trendBars\(\)[\s\S]*label:\s*'AI识境'[\s\S]*value:\s*this\.visionAgentServiceTaskCount[\s\S]*label:\s*'商家'[\s\S]*value:\s*this\.merchantServiceTaskCount/,
  'Ops trend chart should include AI识境 and merchant service demand, not only scan, Q&A, route, and travelogue'
)

assert.match(
  opsReport,
  /serviceIntentSummaryCards\(\)[\s\S]*const serviceIntentCounts = this\.visionAgentServiceTasks\.reduce\(\(summary, task\)[\s\S]*serviceIntent[\s\S]*formatVisionAgentServiceIntentLabel[\s\S]*slice\(0, 4\)/,
  'Ops report should derive service-intent cards from real AI识境 tasks and cap the displayed summary'
)

assert.match(
  opsReport,
  /<view class="ranking-card vision-agent-service-lane xicheng-paper-card">[\s\S]*<text class="section-title">AI识境服务意图<\/text>[\s\S]*serviceIntentSummaryCards[\s\S]*service-intent-card/,
  'Ops report UI should show a dedicated AI识境 service-intent lane for city operation review'
)

assert.match(
  opsReport,
  /refreshReport\(\)[\s\S]*uni\.getStorageSync\(XICHENG_REGION_CONFIG\.visionAgentServiceTasksStorageKey\)[\s\S]*this\.visionAgentServiceTasks/,
  'Ops report refresh should load AI识境 task-package actions from the same storage key used by scan result, travelogue, and footprint'
)

assert.match(
  opsReport,
  /insightCopy\(\)[\s\S]*this\.merchantServiceTaskCount > 0[\s\S]*商家服务意图/,
  'Xiaojing ops insight should react when AI识境 has captured merchant service demand'
)
