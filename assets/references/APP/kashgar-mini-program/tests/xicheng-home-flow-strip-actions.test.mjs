import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const home = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'home', 'home.vue'), 'utf8')

for (const required of [
  'id="xicheng-map-entry-section"',
  'class="home-light-entry-grid"',
  'class="home-light-entry home-map-entry xicheng-paper-card"',
  'class="home-light-entry home-record-entry xicheng-paper-card home-travelogue-entry"',
  '文旅地图',
  'POI 地图 · 路线推荐',
  '游记生成',
  'AI 帮你记录行程，生成专属游记',
  '开始记录',
  '游记草稿',
  '@click="openXichengRoutes"',
  '@click.stop="openXichengRecording"'
]) {
  assert.ok(home.includes(required), `Xicheng home should expose compact primary P0 entry ${required}`)
}

assert.match(
  home,
  /xichengHomeNavItems:\s*\[[\s\S]*\{ key: 'record', title: '记录', icon: 'record' \}/,
  'The old 收藏 bottom tab should become the Citywalk recording tab'
)

assert.match(
  home,
  /handleXichengHomeNav\(key = 'explore'\)[\s\S]*case 'record':[\s\S]*this\.openXichengRecording\(\)/,
  'The bottom record tab should open the Citywalk recording page'
)

assert.doesNotMatch(
  home,
  /homeSecondaryEntries|openHomeSecondaryEntry|class="flow-strip"|class="journey-panel|class="ops-section|class="inspiration-panel|class="home-share-button"|openXichengShare|title: '收藏'|key: 'footprint'|亲子研学|运营报告/,
  'Xicheng home should not keep hidden growth, share, parent-child study, ops report, or favorite entrypoints on the primary page'
)
