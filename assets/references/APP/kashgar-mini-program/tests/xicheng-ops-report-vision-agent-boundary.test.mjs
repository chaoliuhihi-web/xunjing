import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const opsReport = read('pages', 'xicheng', 'ops-report', 'ops-report.vue')
const regionConfig = read('config', 'regions', 'xicheng.js')

for (const required of [
  'localOpsReportKey',
  'visionAgentRealSystemBoundary',
  'visionAgentRealSystemRequiredTaskCount',
  'visionAgentSceneDomainLabels',
  'visionAgentServiceIntentLabels',
  'visionAgentOpsBoundarySummary',
  'AI识境服务待接入',
  '真实系统待确认',
  'service-boundary'
]) {
  assert.ok(opsReport.includes(required) || regionConfig.includes(required), `Ops report should expose AI识境 real-system boundary behavior: ${required}`)
}

assert.match(
  opsReport,
  /refreshReport\(\)[\s\S]*uni\.getStorageSync\(XICHENG_REGION_CONFIG\.localOpsReportKey\)[\s\S]*this\.localOpsReport[\s\S]*uni\.getStorageSync\(XICHENG_REGION_CONFIG\.shareAssetStorageKey\)[\s\S]*this\.shareArtifacts/,
  'Standalone ops report should load the locally generated operations report and share artifacts before summarizing AI识境 boundaries'
)

assert.match(
  opsReport,
  /visionAgentOpsBoundarySummary\(\)[\s\S]*this\.localOpsReport[\s\S]*visionAgentRealSystemBoundary[\s\S]*this\.shareArtifacts[\s\S]*publicVisionAgentRealSystemBoundary[\s\S]*realSystemBoundaryText/,
  'Ops report should aggregate AI识境 real-system boundary evidence from the local ops report, share artifacts, and public-preview package summaries'
)

assert.match(
  opsReport,
  /visionAgentOpsBoundarySummary\(\)[\s\S]*visionAgentRealSystemRequiredTaskCount[\s\S]*visionAgentSceneDomainLabels[\s\S]*visionAgentServiceIntentLabels[\s\S]*slice\(0, 6\)/,
  'Ops report should expose bounded counts and labels for service domains and intents instead of raw AI识境 task details'
)

assert.match(
  opsReport,
  /<view v-if="visionAgentOpsBoundarySummary\.hasBoundary" class="ranking-card service-boundary-card xicheng-paper-card">[\s\S]*AI识境服务待接入[\s\S]*真实系统待确认[\s\S]*visionAgentOpsBoundarySummary\.boundaryText/,
  'Ops report UI should show a dedicated service-boundary card for operators when AI识境 actions require real merchant, ticketing, coupon, or reservation systems'
)

assert.doesNotMatch(
  opsReport.match(/visionAgentOpsBoundarySummary\(\)[\s\S]*?\n\t\t\},\n\t\tinsightCopy/)?.[0] || '',
  /handoffSteps|sourceRecognitionContext|latitude|longitude|imagePath|photoPath|sources:/,
  'Ops AI识境 boundary summary should not expose raw handoff steps, recognition context, coordinates, image paths, photo paths, or source lists'
)
