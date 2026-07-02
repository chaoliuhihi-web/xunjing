import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const home = read('pages', 'xicheng', 'home', 'home.vue')
const recording = read('pages', 'xicheng', 'recording', 'recording.vue')
const recordingPanel = read('components', 'xicheng', 'XichengRouteRecordingPanel.vue')
const recordingShell = `${recording}\n${recordingPanel}`
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const travelogueRecordShell = read('components', 'xicheng', 'XichengTravelogueRecordShell.vue')
const travelogueActionGrid = read('components', 'xicheng', 'XichengTravelogueActionGrid.vue')
const travelogueShell = `${travelogue}\n${travelogueRecordShell}\n${travelogueActionGrid}`
const works = read('pages', 'xicheng', 'works', 'works.vue')

for (const required of [
  "{ key: 'record', title: '记录', icon: 'record' }",
  "{ key: 'mine', title: '我的', icon: 'mine' }",
  "openXichengRecording()",
  "openXichengWorks()",
  "url: '/pages/xicheng/works/works'"
]) {
  assert.ok(home.includes(required), `Xicheng home should expose only current top-level growth/personal entry ${required}`)
}

assert.match(
  home,
  /handleXichengHomeNav\(key = 'explore'\)[\s\S]*case 'record':[\s\S]*this\.openXichengRecording\(\)[\s\S]*case 'mine':[\s\S]*this\.openXichengWorks\(\)/,
  'Home bottom nav should route 记录 to Citywalk recording and 我的 to the personal works surface'
)

assert.doesNotMatch(
  home,
  /homeSecondaryEntries|openHomeSecondaryEntry|key: 'passport'|key: 'share'|key: 'ops'|key: 'footprint'|class="home-share-button"|openXichengShare|title: '收藏'|openXichengPassport|openXichengOpsReport|openXichengFootprint|url: '\/pages\/xicheng\/ops-report\/ops-report'|亲子研学任务|运营报告/,
  'Home should hide route passport, share, parent-child study, ops report, and 收藏 as top-level growth entries'
)

for (const required of [
  '我的游记',
  '登录信息',
  '西城足迹',
  '隐私授权',
  'personal-entry-card',
  'openFootprint',
  'openTravelogue',
  "url: '/pages/xicheng/footprint/footprint'",
  '@click="openFootprint"'
]) {
  assert.ok(works.includes(required), `Works personal center should expose simplified travelogue entry ${required}`)
}

assert.doesNotMatch(
  works,
  /我的收藏|审核状态总览|作品审核状态|生成分享海报|提交审核|亲子研学任务/,
  'Works personal center should not reintroduce duplicated favorite/share/review modules'
)

for (const required of [
  'openPassport',
  'openFootprint',
  "url: '/pages/xicheng/passport/passport'",
  "url: '/pages/xicheng/footprint/footprint'",
  '@passport="openPassport"',
  '@footprint="openFootprint"',
  "$emit('passport')",
  "$emit('footprint')"
]) {
  assert.ok(recordingShell.includes(required), `Recording page should keep post-recording secondary entry ${required}`)
}

for (const required of [
  'openSharePage',
  'openWorksPage',
  'openOpsReportPage',
  "url: '/pages/xicheng/share/share'",
  "url: '/pages/xicheng/works/works'",
  "url: '/pages/xicheng/ops-report/ops-report'",
  '@open-share="openSharePage"',
  '@open-works="openWorksPage"',
  '@open-ops-report="openOpsReportPage"',
  "label: '分享纪念'",
  "label: '我的游记'",
  "label: '运营报告'"
]) {
  assert.ok(travelogueShell.includes(required), `Travelogue should link split secondary growth page ${required}`)
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
