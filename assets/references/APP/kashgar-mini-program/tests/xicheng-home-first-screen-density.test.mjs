import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const home = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'home', 'home.vue'), 'utf8')
const style = home.match(/<style scoped>[\s\S]*<\/style>/)?.[0] || ''

for (const required of [
  'xicheng-home-first-screen-density',
  'id="xicheng-home-route-recommendation-section"',
  '路线推荐',
  '官方 Citywalk',
  '一键抄作业'
]) {
  assert.ok(home.includes(required), `Home first-screen density should keep route recommendation visible: ${required}`)
}

assert.match(
  style,
  /\.xicheng-home-first-screen-density \.home-action-duo\s*\{[\s\S]*margin-top:\s*14rpx/,
  'Home first-screen density layer should pull the scan/recent row closer to the hero'
)

assert.match(
  style,
  /\.xicheng-home-first-screen-density \.home-light-entry-grid\s*\{[\s\S]*margin-top:\s*14rpx/,
  'Home first-screen density layer should avoid pushing the map/travelogue row too far below the fold'
)

assert.match(
  style,
  /\.xicheng-home-first-screen-density \.home-route-recommendation-section\s*\{[\s\S]*margin-top:\s*12rpx/,
  'Home first-screen density layer should keep the route recommendation section close enough to peek above the tab bar'
)
