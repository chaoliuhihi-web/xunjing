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
      '查看文旅地图',
      '商家、路线和后续动作会进入足迹',
      'openTravelogue',
      'openRoutes',
      'xicheng-icon name="travelogue"'
    ],
    forbiddenPattern: /路线护照|生成路线护照|openPassport|成长和Agent动作|taskType === 'growth' \? '成长'/
  },
  {
    route: 'pages/xicheng/passport/passport',
    title: '路线记录',
    file: ['pages', 'xicheng', 'passport', 'passport.vue'],
    requiredTokens: [
      'xicheng-passport',
      'XICHENG_REGION_CONFIG.badgeAwardStorageKey',
      'XICHENG_REGION_CONFIG.studyTaskStorageKey',
      'route-passport-stamp.png',
      '路线记录',
      '路线复盘',
      '街区观察记录',
      "uni.setNavigationBarTitle({ title: '路线记录' })",
      'xicheng-icon name="route"'
    ],
    forbiddenPattern: /路线护照|我的路线护照|已获得徽章|亲子研学任务|领取徽章|徽章|积分/
  },
  {
    route: 'pages/xicheng/share/share',
    title: '分享纪念',
    file: ['pages', 'xicheng', 'share', 'share.vue'],
    componentFiles: [
      ['components', 'xicheng', 'XichengShareAssetPanel.vue'],
      ['components', 'xicheng', 'XichengSharePrivacyReviewPanel.vue']
    ],
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
    title: '我的游记',
    file: ['pages', 'xicheng', 'works', 'works.vue'],
    requiredTokens: [
      'xicheng-works',
      'XICHENG_REGION_CONFIG.journeyStorageKey',
      '登录信息',
      '我的游记',
      '隐私授权',
      'openTravelogue',
      '继续编辑',
      'xicheng-icon name="edit"'
    ],
    forbiddenPattern: /审核状态总览|作品审核状态|AI 正在审核中|生成分享海报|提交审核|路线护照|徽章|亲子研学任务|积分/
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
  const pageEntry = pagesJson.pages.find(entry => entry.path === page.route)
  assert.ok(
    pageEntry?.style?.navigationStyle === 'custom',
    `pages.json should register ${page.route} as a custom-navigation Xicheng P0 page`
  )
  assert.equal(
    pageEntry.style?.navigationBarTitleText,
    page.title,
    `pages.json should keep ${page.route} title aligned with the page shell`
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

  const componentSource = (page.componentFiles || [])
    .map(componentFile => readOptional(...componentFile))
    .join('\n')
  const implementationSurface = `${source}\n${componentSource}`

  for (const token of page.requiredTokens) {
    assert.ok(implementationSurface.includes(token), `${page.route} should expose ${token}`)
  }

  assert.doesNotMatch(
    implementationSurface,
    /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|background-location|startLocationUpdateBackground/,
    `${page.route} should not introduce backend calls, client secrets, or high-risk background permissions`
  )

  if (page.forbiddenPattern) {
    assert.doesNotMatch(
      implementationSurface,
      page.forbiddenPattern,
      `${page.route} should not surface disabled or duplicated product modules`
    )
  }
}
