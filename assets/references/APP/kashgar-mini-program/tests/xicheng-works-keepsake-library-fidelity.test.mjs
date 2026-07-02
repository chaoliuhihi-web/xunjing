import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const works = read('pages', 'xicheng', 'works', 'works.vue')
const keepsakeCard = read('components', 'xicheng', 'XichengKeepsakeTravelogueCard.vue')
const worksStyle = works.match(/<style scoped>[\s\S]*<\/style>/)?.[0] || ''

for (const token of [
  'works-page-head',
  'works-page-title',
  'works-manage-button',
  '西城记忆',
  'openWorksManager',
  'profile-account-art',
  'profile-library-overview',
  '已保存的精美游记、PDF 纪念册和发布素材',
  'library-filter-row',
  'selectedLibraryFilter',
  'filteredTravelogueItems',
  'libraryStats',
  '可打印 PDF',
  '本机草稿',
  '账号资料',
  '素材授权',
  '公开范围',
  'openPrivacyScopeSettings',
  'xicheng-keepsake-travelogue-card'
]) {
  assert.ok(works.includes(token), `Works page should match keepsake library UI token: ${token}`)
}

assert.match(
  works,
  /class="works-page-head"[\s\S]*class="works-page-title"[\s\S]*我的游记[\s\S]*class="works-manage-button"[\s\S]*管理/,
  'Works page should match the approved keepsake library shell with a large page title and management action'
)

assert.match(
  works,
  /class="works-page-kicker">西城记忆<\/text>/,
  'Works page heading kicker should avoid repeating 我的 and use a cleaner keepsake context label'
)

assert.match(
  worksStyle,
  /\.works-page-title\s*\{[\s\S]*font-size:\s*60rpx[\s\S]*font-family:\s*"Songti SC"/,
  'Works page title should use the same high-fidelity cultural typography as the approved reference'
)

assert.match(
  worksStyle,
  /\.profile-card\s*\{[\s\S]*grid-template-columns:\s*150rpx minmax\(0,\s*1fr\)/,
  'Works profile card should use a larger account portrait treatment instead of the current compact utility row'
)

assert.match(
  works,
  /class="profile-card xicheng-paper-card"[\s\S]*class="profile-library-overview"[\s\S]*v-for="stat in libraryStats"/,
  'Works page should merge keepsake stats into the login card so the first screen reaches the travelogue list sooner'
)

assert.match(
  worksStyle,
  /\.profile-library-overview\s*\{[\s\S]*grid-column:\s*1 \/ -1[\s\S]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/,
  'Works profile stats should be a compact full-width strip inside the account card'
)

for (const token of [
  'keepsake-cover-badge',
  'keepsake-meta-row',
  'keepsake-primary-meta',
  'getMetaValue',
  '3 个地点',
  '2.5 小时',
  '步行约 3.2 公里',
  '继续阅读',
  '分享',
  '打印 PDF',
  '查看素材',
  '继续编辑'
]) {
  assert.ok(keepsakeCard.includes(token), `Keepsake travelogue card should expose approved library token: ${token}`)
}

assert.match(
  works,
  /v-for="filter in libraryFilters"[\s\S]*:class="\{ active: selectedLibraryFilter === filter\.key \}"[\s\S]*@click="selectLibraryFilter\(filter\.key\)"/,
  'Works page should render segmented library filters instead of a flat list only'
)

assert.match(
  works,
  /<xicheng-keepsake-travelogue-card[\s\S]*v-for="item in filteredTravelogueItems"[\s\S]*@read="openTravelogueReaderPage"[\s\S]*@share="openSharePage"[\s\S]*@print="openPdfPrintPage"/,
  'Works page should render filtered keepsake cards with reader/share/PDF actions'
)

assert.match(
  keepsakeCard,
  /v-for="meta in metaItems"[\s\S]*getMetaValue\(meta\)/,
  'Keepsake card should render route metadata from structured fields'
)

assert.ok(works.split(/\r?\n/).length < 900, 'Works page should remain compact for APP packaging')
assert.ok(keepsakeCard.split(/\r?\n/).length < 260, 'Keepsake card should remain compact for APP packaging')

assert.doesNotMatch(
  `${works}\n${keepsakeCard}`,
  /works-library-hero|值得反复打开的西城记忆|审核状态总览|作品审核状态|生成分享海报|亲子研学任务|路线护照|徽章|积分|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Works keepsake library should not reintroduce removed modules or client secrets'
)
