import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const readOptional = (...segments) => {
  const filePath = path.join(root, ...segments)
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
}

const pagesJson = JSON.parse(read('pages.json'))
const app = read('App.vue')

const requiredPages = [
  {
    route: 'pages/xicheng/footprint/footprint',
    title: '我的西城足迹',
    file: ['pages', 'xicheng', 'footprint', 'footprint.vue'],
    requiredTokens: [
      'xicheng-footprint',
      'XICHENG_REGION_CONFIG.materialsStorageKey',
      'XICHENG_REGION_CONFIG.checkinStorageKey',
      '生成今日游记',
      'openTravelogue',
      'xicheng-icon name="travelogue"'
    ]
  },
  {
    route: 'pages/xicheng/passport/passport',
    title: '路线护照',
    file: ['pages', 'xicheng', 'passport', 'passport.vue'],
    requiredTokens: [
      'xicheng-passport',
      'XICHENG_REGION_CONFIG.badgeAwardStorageKey',
      'XICHENG_REGION_CONFIG.studyTaskStorageKey',
      'route-passport-stamp.png',
      '亲子研学任务',
      'xicheng-icon name="passport"'
    ]
  },
  {
    route: 'pages/xicheng/share/share',
    title: '分享纪念',
    file: ['pages', 'xicheng', 'share', 'share.vue'],
    requiredTokens: [
      'xicheng-share',
      'XICHENG_REGION_CONFIG.shareAssetStorageKey',
      'share-poster-background.jpg',
      'PDF 纪念册',
      '提交审核',
      'createShareArtifact'
    ]
  },
  {
    route: 'pages/xicheng/works/works',
    title: '我的作品',
    file: ['pages', 'xicheng', 'works', 'works.vue'],
    requiredTokens: [
      'xicheng-works',
      'XICHENG_REGION_CONFIG.reviewStorageKey',
      '审核中',
      '需修改',
      '继续编辑',
      'xicheng-icon name="edit"'
    ]
  },
  {
    route: 'pages/xicheng/ops-report/ops-report',
    title: '运营报告',
    file: ['pages', 'xicheng', 'ops-report', 'ops-report.vue'],
    requiredTokens: [
      'xicheng-ops-report',
      'xicheng-city-ops-report-v1',
      'XICHENG_REGION_CONFIG.materialsStorageKey',
      'XICHENG_REGION_CONFIG.shareAssetStorageKey',
      '不展示用户隐私明细',
      'createHotPoiRanking'
    ]
  }
]

for (const page of requiredPages) {
  assert.ok(
    pagesJson.pages.some(entry => entry.path === page.route && entry.style?.navigationStyle === 'custom'),
    `pages.json should register ${page.route} as a custom-navigation Xicheng P0 page`
  )

  assert.ok(
    app.includes(`'${page.route}'`),
    `${page.route} should be public so shared Xicheng P0 links do not force login before viewing`
  )

  const source = readOptional(...page.file)
  assert.ok(source, `${page.route} should have an implemented Vue page`)
  assert.ok(
    source.split(/\r?\n/).length < 900,
    `${page.route} should stay a focused shell page and avoid growing into another large file`
  )

  for (const token of page.requiredTokens) {
    assert.ok(source.includes(token), `${page.route} should expose ${token}`)
  }

  assert.doesNotMatch(
    source,
    /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|background-location|startLocationUpdateBackground/,
    `${page.route} should not introduce backend calls, client secrets, or high-risk background permissions`
  )
}
