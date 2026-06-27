import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')

for (const required of [
  'KASHGAR_AI_COMPANION_HOME_ENABLED',
  'showAiCompanionHome',
  'kashgar-ai-home',
  '喀小寻 AI旅伴',
  '问问喀小寻~',
  '听讲解',
  '看攻略',
  '找打卡地',
  '问问题',
  '热门问题',
  '喀什古城有什么历史故事？',
  '精选打卡地',
  '加入旅行',
  '/static/kashgar/ai-companion-hero.png',
  '/static/kashgar/ai-place-gaotai.png',
]) {
  assert.ok(
    aiGuide.includes(required),
    `AI guide companion home should include ${required}`
  )
}

assert.match(
  aiGuide,
  /<tab-bar\s+:current="1"\s*\/>/,
  'AI companion home should render the shared APP tab bar as the active center tab'
)

assert.match(
  aiGuide,
  /const openAiCompanionChat\s*=\s*\(question = ''\)\s*=>\s*\{[\s\S]*showAiCompanionHome\.value = false[\s\S]*inputText\.value = question/,
  'AI companion home should open the existing chat shell without replacing chat implementation'
)

const compactRules = [
  [/\.kashgar-ai-hero\s*\{[\s\S]*?height:\s*(\d+)rpx/, 420, 'AI companion hero should leave room for questions and selected places above the fixed tab bar'],
  [/\.kashgar-ai-action-panel\s*\{[\s\S]*?padding:\s*(\d+)rpx/, 22, 'AI companion quick actions should stay compact on the first viewport'],
  [/\.kashgar-ai-question\s*\{[\s\S]*?min-height:\s*(\d+)rpx/, 46, 'AI companion question rows should not push selected places under the tab bar'],
  [/\.kashgar-ai-card\s*\{[\s\S]*?margin:\s*(\d+)rpx/, 14, 'AI companion cards should use compact vertical rhythm']
]

for (const [pattern, maxValue, message] of compactRules) {
  const match = aiGuide.match(pattern)
  assert.ok(match, message)
  assert.ok(Number(match[1]) <= maxValue, message)
}

const joinBottomMatch = aiGuide.match(/\.kashgar-ai-join\s*\{[\s\S]*?bottom:\s*(\d+)rpx/)
assert.ok(joinBottomMatch, 'AI companion join button should declare a bottom offset inside the selected-places card')
assert.ok(
  Number(joinBottomMatch[1]) >= 52,
  'AI companion join button should sit above the fixed tab bar'
)

assert.match(
  aiGuide,
  /onLoad\(\(options = \{\}\) => \{[\s\S]*showAiCompanionHome\.value = false[\s\S]*sendInitialQuestion/,
  'AI guide should skip the companion home when opened with an explicit question route'
)

assert.doesNotMatch(
  aiGuide,
  /openAiCompanionChat[\s\S]{0,240}sendMessage\(\)/,
  'AI companion home question taps should not auto-call the backend chat API before the user sends'
)
