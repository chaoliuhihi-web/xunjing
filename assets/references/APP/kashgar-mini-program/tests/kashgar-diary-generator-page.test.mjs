import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const indexPath = path.join(root, 'pages', 'index', 'index.vue')
const aiGuidePath = path.join(root, 'pages', 'ai-guide', 'ai-guide.vue')
const aiContentPath = path.join(root, 'pages', 'ai-guide', 'kashgar-ai-content.js')

const indexPage = fs.readFileSync(indexPath, 'utf8')
const aiGuidePage = fs.readFileSync(aiGuidePath, 'utf8')
const aiGuideStyle = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide-kashgar-diary.css'), 'utf8')
const aiGuideSource = `${aiGuidePage}\n${fs.readFileSync(aiContentPath, 'utf8')}\n${aiGuideStyle}`

assert.match(
  indexPage,
  /if\s*\(\s*action\.target\s*===\s*'diary'\s*\)\s*\{[\s\S]*?uni\.navigateTo\(\{[\s\S]*?url:\s*'\/pages\/ai-guide\/ai-guide\?mode=diary'/,
  'existing home diary action should navigate into the reused AI guide diary mode'
)

const requiredSnippets = [
  'KASHGAR_DIARY_GENERATOR_ENABLED',
  'showKashgarDiaryGenerator',
  'kashgar-diary-generator',
  '生成我的喀什游记',
  'AI 帮你记录喀什，留下独一无二的旅程回忆',
  '/static/kashgar/diary-generator-hero.png',
  '/static/kashgar/diary-generator-mascot.png',
  '喀什古城',
  '老茶馆',
  '鸽子广场',
  '烤包子',
  '亲子游记',
  '朋友圈',
  '小红书',
  '旅行纪念页',
  'AI 预览',
  '沿着石巷，把喀什写进今天',
  'AI 已为你整理完成',
  '行程亮点提炼',
  'PDF纪念册',
  '继续优化',
  '一键生成'
]

for (const snippet of requiredSnippets) {
  assert.ok(aiGuideSource.includes(snippet), `AI guide diary mode should include ${snippet}`)
}

assert.match(
  aiGuidePage,
  /onLoad\(\(options\s*=\s*\{\}\)\s*=>\s*\{[\s\S]*?if\s*\(\s*KASHGAR_DIARY_GENERATOR_ENABLED\s*&&\s*options\.mode\s*===\s*'diary'\s*\)/,
  'AI guide onLoad should switch to diary mode when mode=diary is present'
)

assert.match(
  aiGuidePage,
  /const\s+openKashgarDiaryGenerator\s*=\s*\(\)\s*=>\s*\{[\s\S]*?showKashgarDiaryGenerator\.value\s*=\s*true[\s\S]*?showAiCompanionHome\.value\s*=\s*false/,
  'AI guide should expose a local mode switch instead of creating a separate page'
)

assert.match(
  aiGuidePage,
  /const\s+generateKashgarDiary\s*=\s*\(\)\s*=>\s*\{[\s\S]*?uni\.showToast\(\{[\s\S]*?title:\s*'喀小寻正在生成游记'/,
  'one-click generation should provide immediate feedback while backend generation is deferred'
)

assert.match(
  aiGuideSource,
  /\.kashgar-diary-hero\s*\{[\s\S]*?height:\s*370rpx;/,
  'diary generator hero should be compact enough to keep actions in the first mobile viewport'
)

assert.match(
  aiGuideSource,
  /\.kashgar-diary-action\s*\{[\s\S]*?height:\s*66rpx;/,
  'diary generator bottom actions should use compact first-viewport sizing'
)

for (const asset of [
  'static/kashgar/diary-generator-hero.png',
  'static/kashgar/diary-generator-mascot.png'
]) {
  assert.ok(fs.existsSync(path.join(root, asset)), `missing diary generator asset ${asset}`)
}
