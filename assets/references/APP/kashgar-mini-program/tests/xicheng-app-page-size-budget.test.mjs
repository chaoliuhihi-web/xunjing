import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const maxLines = 3200
const pagesJson = JSON.parse(fs.readFileSync(path.join(root, 'pages.json'), 'utf8'))

const pageBudgets = [
  'pages/ai-guide/ai-guide.vue',
  'pages/index/index.vue',
  'pages/xicheng/travelogue/travelogue.vue',
  'pages/xicheng/scan/scan.vue',
  'pages/xicheng/poi/poi.vue',
  'pages/xicheng/routes/routes.vue',
  'pages/xicheng/route-detail/route-detail.vue',
  'pages/xicheng/recording/recording.vue',
  'pages/xicheng/scan-result/scan-result.vue',
  'pages/xicheng/home/home.vue',
  'pages/xicheng/inspiration/inspiration.vue',
  'pages/xicheng/footprint/footprint.vue',
  'pages/xicheng/passport/passport.vue',
  'pages/xicheng/share/share.vue',
  'pages/xicheng/works/works.vue',
  'pages/xicheng/ops-report/ops-report.vue',
  'pages/xicheng/travelogue-reader/travelogue-reader.vue',
  'pages/xicheng/pdf-print/pdf-print.vue'
]

const xichengPages = pagesJson.pages
  .map((entry) => entry.path)
  .filter((pagePath) => pagePath.startsWith('pages/xicheng/'))
  .map((pagePath) => `${pagePath}.vue`)

assert.deepEqual(
  xichengPages.filter((pagePath) => !pageBudgets.includes(pagePath)),
  [],
  'Every registered Xicheng page should be covered by the page size budget gate'
)

const lineCounts = pageBudgets.map((relativePath) => {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8')
  return {
    relativePath,
    lineCount: source.split(/\r?\n/).length
  }
})

assert.deepEqual(
  lineCounts.filter((entry) => entry.lineCount > maxLines),
  [],
  `Xicheng APP pages must stay under ${maxLines} lines; split components before adding more UI`
)

assert.ok(
  lineCounts.find((entry) => entry.relativePath === 'pages/xicheng/travelogue/travelogue.vue'),
  'Travelogue page should be covered because it is the highest-risk page for future feature growth'
)
