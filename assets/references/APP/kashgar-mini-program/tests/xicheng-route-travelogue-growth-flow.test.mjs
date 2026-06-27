import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

for (const file of [
  ['request', 'xunjing', 'route.js'],
  ['request', 'xunjing', 'track.js'],
  ['request', 'xunjing', 'travelogue.js'],
  ['pages', 'xicheng', 'route-detail', 'route-detail.vue'],
  ['pages', 'xicheng', 'material-box', 'material-box.vue'],
  ['pages', 'xicheng', 'travelogue', 'travelogue.vue'],
  ['pages', 'xicheng', 'passport', 'passport.vue']
]) {
  assert.ok(exists(...file), `Xicheng route/travelogue flow should include ${file.join('/')}`)
}

const regionConfig = read('config', 'regions', 'xicheng.js')
const routeRequest = read('request', 'xunjing', 'route.js')
const trackRequest = read('request', 'xunjing', 'track.js')
const travelogueRequest = read('request', 'xunjing', 'travelogue.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const routeDetail = read('pages', 'xicheng', 'route-detail', 'route-detail.vue')
const materialBox = read('pages', 'xicheng', 'material-box', 'material-box.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const passport = read('pages', 'xicheng', 'passport', 'passport.vue')
const pagesJson = read('pages.json')
const combined = [
  regionConfig,
  routeRequest,
  trackRequest,
  travelogueRequest,
  home,
  scanResult,
  routeDetail,
  materialBox,
  travelogue,
  passport
].join('\n')

for (const required of [
  'XICHENG_DEFAULT_ROUTE',
  'routeId',
  'passportTasks',
  'checkinPoints',
  'badges',
  'materialTimeline',
  'travelogueTemplate',
  'cityOpsReport'
]) {
  assert.ok(regionConfig.includes(required), `Xicheng region config should seed ${required}`)
}

for (const required of [
  'app-api/xunjing/routes/recommend',
  'app-api/xunjing/routes/{routeId}/passport',
  'app-api/xunjing/routes/{routeId}/checkins',
  "'tenant-id': XICHENG_REGION_CONFIG.tenantId",
  'regionCode: XICHENG_REGION_CONFIG.regionCode',
  'packageCode: XICHENG_REGION_CONFIG.packageCode',
  'getXichengRouteRecommendation',
  'getXichengRoutePassport',
  'submitXichengCheckin',
  'createXichengRouteDevelopmentFallback'
]) {
  assert.ok(routeRequest.includes(required), `Route request facade should include ${required}`)
}

for (const required of [
  'app-api/xunjing/tracks/sessions',
  'app-api/xunjing/tracks/{trackSessionId}/points/batch',
  "'tenant-id': XICHENG_REGION_CONFIG.tenantId",
  'XICHENG_ACTIVE_TRACK_STORAGE_KEY',
  'XICHENG_MATERIAL_TIMELINE_STORAGE_KEY',
  'startXichengTrackSession',
  'pauseXichengTrackSession',
  'resumeXichengTrackSession',
  'endXichengTrackSession',
  'appendXichengMaterialEvent'
]) {
  assert.ok(trackRequest.includes(required), `Track/material request facade should include ${required}`)
}

for (const required of [
  'app-api/xunjing/travelogues/generate',
  'app-api/xunjing/posters/generate',
  'app-api/xunjing/memorials/pdf',
  'app-api/xunjing/works/{workId}/submit-review',
  "'tenant-id': XICHENG_REGION_CONFIG.tenantId",
  'generateXichengTravelogueDraft',
  'generateXichengSharePoster',
  'generateXichengMemorialPdf',
  'submitXichengWorkReview'
]) {
  assert.ok(travelogueRequest.includes(required), `Travelogue request facade should include ${required}`)
}

for (const route of [
  'pages/xicheng/route-detail/route-detail',
  'pages/xicheng/material-box/material-box',
  'pages/xicheng/travelogue/travelogue',
  'pages/xicheng/passport/passport'
]) {
  assert.ok(pagesJson.includes(`"path": "${route}"`), `pages.json should register ${route}`)
}

for (const required of [
  '/pages/xicheng/route-detail/route-detail',
  '/pages/xicheng/material-box/material-box',
  '/pages/xicheng/travelogue/travelogue',
  '/pages/xicheng/passport/passport',
  '今日推荐路线',
  '旅行素材盒'
]) {
  assert.ok(home.includes(required), `Xicheng home should link to ${required}`)
}

for (const required of [
  '推荐路线',
  '加入旅行素材',
  '/pages/xicheng/route-detail/route-detail',
  '/pages/xicheng/material-box/material-box'
]) {
  assert.ok(scanResult.includes(required), `Recognition result should link to ${required}`)
}

for (const required of [
  '路线护照',
  '亲子研学任务',
  '打卡徽章',
  '开始记录',
  'submitXichengCheckin',
  'startXichengTrackSession',
  '/pages/xicheng/material-box/material-box'
]) {
  assert.ok(routeDetail.includes(required), `Route detail should include ${required}`)
}

for (const required of [
  '旅行素材盒',
  '轨迹',
  '照片',
  '识别事件',
  '用户备注',
  '暂停',
  '继续',
  '结束记录',
  '生成游记草稿',
  'appendXichengMaterialEvent',
  '/pages/xicheng/travelogue/travelogue'
]) {
  assert.ok(materialBox.includes(required), `Material box should include ${required}`)
}

for (const required of [
  '游记草稿',
  '朋友圈短文',
  '小红书图文笔记',
  '分享海报',
  'PDF纪念册',
  '提交审核',
  'generateXichengTravelogueDraft',
  'generateXichengSharePoster',
  'generateXichengMemorialPdf',
  'submitXichengWorkReview'
]) {
  assert.ok(travelogue.includes(required), `Travelogue page should include ${required}`)
}

for (const required of [
  '路线护照',
  '完成度',
  '打卡任务',
  '亲子研学任务',
  '徽章',
  '分享海报',
  '作品审核',
  '城市运营报告'
]) {
  assert.ok(passport.includes(required), `Passport page should include ${required}`)
}

assert.doesNotMatch(
  combined,
  /COZE_CONFIG|QWEN_API_KEY|DASHSCOPE_API_KEY|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Xicheng route/travelogue flow should not expose AI vendor secrets'
)
