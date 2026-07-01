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
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const share = read('pages', 'xicheng', 'share', 'share.vue')
const works = read('pages', 'xicheng', 'works', 'works.vue')

const requiredPages = [
  {
    route: 'pages/xicheng/travelogue-reader/travelogue-reader',
    title: '精美游记',
    file: ['pages', 'xicheng', 'travelogue-reader', 'travelogue-reader.vue'],
    tokens: [
      'xicheng-travelogue-reader',
      '杂志式封面',
      '路线故事线',
      '照片叙事',
      '继续编辑',
      '发布设置',
      'PDF打印',
      'XICHENG_REGION_CONFIG.journeyStorageKey',
      'XICHENG_REGION_CONFIG.shareAssetStorageKey'
    ]
  },
  {
    route: 'pages/xicheng/pdf-print/pdf-print',
    title: 'PDF打印预览',
    file: ['pages', 'xicheng', 'pdf-print', 'pdf-print.vue'],
    tokens: [
      'xicheng-pdf-print',
      'A4 打印设置',
      '页码预览',
      '保存 PDF',
      '系统打印',
      '分享 PDF',
      '预览全部页面',
      'XICHENG_REGION_CONFIG.shareAssetStorageKey'
    ]
  }
]

for (const page of requiredPages) {
  const pageEntry = pagesJson.pages.find(entry => entry.path === page.route)
  assert.ok(pageEntry, `pages.json should register ${page.route}`)
  assert.equal(pageEntry.style?.navigationBarTitleText, page.title, `${page.route} title should match approved UI`)
  assert.equal(pageEntry.style?.navigationStyle, 'custom', `${page.route} should use the Xicheng custom shell`)
  assert.ok(app.includes(`'${page.route}'`), `${page.route} should be public for saved travelogue links`)

  const source = readOptional(...page.file)
  assert.ok(source, `${page.route} should have an implemented Vue page`)
  assert.ok(source.split(/\r?\n/).length < 900, `${page.route} should stay focused and component-friendly`)
  for (const token of page.tokens) {
    assert.ok(source.includes(token), `${page.route} should expose ${token}`)
  }
  assert.doesNotMatch(
    source,
    /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|background-location|startLocationUpdateBackground/,
    `${page.route} should not introduce backend calls, client secrets, or high-risk background permissions`
  )
}

for (const [sourceName, source, required] of [
  ['travelogue.vue', travelogue, ['openTravelogueReaderPage', "url: '/pages/xicheng/travelogue-reader/travelogue-reader'", 'openPdfPrintPage', "url: '/pages/xicheng/pdf-print/pdf-print'"]],
  ['share.vue', share, ['openPdfPrintPage', "url: '/pages/xicheng/pdf-print/pdf-print'", 'openTravelogueReaderPage', "url: '/pages/xicheng/travelogue-reader/travelogue-reader'"]],
  ['works.vue', works, ['openTravelogueReaderPage', "url: '/pages/xicheng/travelogue-reader/travelogue-reader'", 'openPdfPrintPage', "url: '/pages/xicheng/pdf-print/pdf-print'"]]
]) {
  for (const token of required) {
    assert.ok(source.includes(token), `${sourceName} should link the keepsake reader/PDF print flow via ${token}`)
  }
}
