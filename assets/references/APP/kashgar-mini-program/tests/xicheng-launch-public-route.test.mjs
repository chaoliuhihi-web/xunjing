import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const pagesJson = JSON.parse(read('pages.json'))
const app = read('App.vue')

assert.equal(
  pagesJson.pages[0]?.path,
  'pages/xicheng/home/home',
  'APP default launch page should be the Xicheng P0 home, while Kashgar remains addressable at /pages/index/index'
)

for (const route of [
  'pages/xicheng/home/home',
  'pages/xicheng/scan-result/scan-result',
  'pages/xicheng/route-detail/route-detail',
  'pages/xicheng/travelogue/travelogue',
  'pages/xicheng/inspiration/inspiration',
  'pages/ai-guide/ai-guide',
]) {
  assert.ok(
    app.includes(`'${route}'`),
    `Cold-start P0 route ${route} should be public so unauthenticated visitors can complete the Xicheng companion flow`
  )
}
