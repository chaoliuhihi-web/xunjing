import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const maxLines = 3200

const pageBudgets = [
  'pages/ai-guide/ai-guide.vue',
  'pages/index/index.vue',
  'pages/xicheng/travelogue/travelogue.vue',
  'pages/xicheng/poi/poi.vue',
  'pages/xicheng/route-detail/route-detail.vue',
  'pages/xicheng/recording/recording.vue',
  'pages/xicheng/scan-result/scan-result.vue',
  'pages/xicheng/home/home.vue',
  'pages/xicheng/inspiration/inspiration.vue'
]

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
