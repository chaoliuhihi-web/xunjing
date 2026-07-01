import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const home = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'home', 'home.vue'), 'utf8')

for (const required of [
  'id="xicheng-map-entry-section"',
  'class="home-light-entry-grid"',
  'class="home-light-entry home-map-entry xicheng-paper-card"',
  'class="home-light-entry home-record-entry xicheng-paper-card"',
  '文旅地图',
  'POI 地图 · 路线推荐',
  '西城 Citywalk',
  '开始记录 Citywalk',
  '@click="openXichengRoutes"',
  '@click="openXichengRecording"',
  'class="home-share-button"',
  '@click="openXichengShare"'
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
  /homeSecondaryEntries|openHomeSecondaryEntry|class="flow-strip"|class="journey-panel|class="ops-section|class="inspiration-panel|title: '收藏'|key: 'footprint'|亲子研学|运营报告|一键抄作业/,
  'Xicheng home should not keep hidden growth, parent-child study, ops report, favorite, or inspiration-import entrypoints on the primary page'
)
