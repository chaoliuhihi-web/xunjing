import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const home = read('pages', 'xicheng', 'home', 'home.vue')
const recording = read('pages', 'xicheng', 'recording', 'recording.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

for (const required of [
  "{ key: 'footprint', title: '收藏', icon: 'favorite' }",
  "{ key: 'mine', title: '我的', icon: 'mine' }",
  "openXichengFootprint()",
  "openXichengRecording()",
  "openXichengPassport()",
  "openXichengShare()",
  "openXichengWorks()",
  "openXichengOpsReport()",
  "url: '/pages/xicheng/footprint/footprint'",
  "url: '/pages/xicheng/passport/passport'",
  "url: '/pages/xicheng/share/share'",
  "url: '/pages/xicheng/works/works'",
  "url: '/pages/xicheng/ops-report/ops-report'",
  "@click=\"openXichengPassport\"",
  "@click=\"openXichengShare\"",
  "@click=\"openXichengOpsReport\""
]) {
  assert.ok(home.includes(required), `Xicheng home should expose growth page entry ${required}`)
}

assert.match(
  home,
  /handleXichengHomeNav\(key = 'explore'\)[\s\S]*case 'footprint':[\s\S]*this\.openXichengFootprint\(\)[\s\S]*case 'mine':[\s\S]*this\.openXichengWorks\(\)/,
  'Home bottom nav should route 收藏 to footprint and 我的 to works instead of hiding both behind travelogue'
)

assert.match(
  home,
  /handleXichengP0FlowAction\(key = 'guide'\)[\s\S]*case 'record':[\s\S]*this\.openXichengRecording\(\)[\s\S]*case 'draft':[\s\S]*this\.openXichengTravelogue\('draft'\)/,
  'Home P0 flow strip should send 开始记录 into the route recording page rather than only the travelogue editor'
)

for (const required of [
  'openPassport',
  'openFootprint',
  "url: '/pages/xicheng/passport/passport'",
  "url: '/pages/xicheng/footprint/footprint'",
  '@click="openPassport"',
  '@click="openFootprint"'
]) {
  assert.ok(recording.includes(required), `Recording page should expose post-recording entry ${required}`)
}

for (const required of [
  'openSharePage',
  'openWorksPage',
  'openOpsReportPage',
  "url: '/pages/xicheng/share/share'",
  "url: '/pages/xicheng/works/works'",
  "url: '/pages/xicheng/ops-report/ops-report'",
  '@click="openSharePage"',
  '@click="openWorksPage"',
  '@click="openOpsReportPage"'
]) {
  assert.ok(travelogue.includes(required), `Travelogue should link split growth page ${required}`)
}

assert.match(
  travelogue,
  /generatePoster\(\)[\s\S]*this\.persistShareArtifact\(posterAsset\)[\s\S]*this\.openSharePage\(\)/,
  'After creating a poster, travelogue should take users to the dedicated share page'
)

assert.match(
  travelogue,
  /submitReview\(\)[\s\S]*this\.reviewSubmission = reviewPayload[\s\S]*this\.openWorksPage\(\)/,
  'After submitting review, travelogue should take users to the works review-status page'
)
