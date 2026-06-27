import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const root = process.cwd()
const detailPath = path.join(root, 'subPackages', 'feature', 'theater', 'theaterDetail.vue')
const homePath = path.join(root, 'pages', 'index', 'index.vue')

const detail = fs.readFileSync(detailPath, 'utf8')
const home = fs.readFileSync(homePath, 'utf8')

const requiredDetailSnippets = [
  'KASHGAR_STORY_DETAIL_LOCAL_CONTENT_ENABLED',
  'useKashgarStoryDetail',
  'kashgar-story-detail',
  'kashgar-story-background',
  '/static/kashgar/story-stone-alley-final.png',
  '/static/kashgar/story-author-avatar.png',
  '沿着石巷去看喀什',
  '喀什古城',
  '星河漫游记',
  '+ 关注',
  '1.2万',
  '分享',
  '# 人文',
  '# 美食',
  '# 古城',
  '# 老街',
  '# 慢生活',
  '2025/05/19 · 阅读约 5 分钟',
  '清晨的喀什，阳光刚洒进石巷，馕香与茶香已在街角升腾。',
  '老城的每一块砖、每一扇门，都在低声诉说着时光的故事。',
  '跟着我的脚步，一起慢慢走进喀什的日常。',
  '说点什么…',
  '收藏',
  '326',
  '更多'
]

for (const snippet of requiredDetailSnippets) {
  assert.ok(detail.includes(snippet), `theater detail should include ${snippet}`)
}

assert.match(
  detail,
  /<view\s+v-if="useKashgarStoryDetail"\s+class="kashgar-story-detail"/,
  'theater detail should render a local Kashgar story branch before the legacy video swiper'
)

assert.match(
  detail,
  /if\s*\(\s*useKashgarStoryDetail\.value\s*\)\s*\{[\s\S]*?return[\s\S]*?\}[\s\S]*?if\s*\(\s*dramaId\.value\s*\)\s*\{[\s\S]*?getVideoDetail\(\)/,
  'local Kashgar story detail should return before calling backend video detail APIs'
)

assert.match(
  home,
  /url:\s*`\/subPackages\/feature\/theater\/theaterDetail\?dramaId=\$\{note\.id\}&localStory=1`/,
  'homepage travel-note cards should open the local story detail demo branch'
)

const requiredAssets = [
  'static/kashgar/story-stone-alley-final.png',
  'static/kashgar/story-author-avatar.png'
]

for (const asset of requiredAssets) {
  assert.ok(fs.existsSync(path.join(root, asset)), `missing detail asset ${asset}`)
}
