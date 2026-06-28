import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))
const countSourceLines = (content) => {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  return normalized.split('\n').length - (normalized.endsWith('\n') ? 1 : 0)
}

const PAGE_REFRACTOR_RESERVE_LINE_LIMIT = 3200

const indexPage = read('pages', 'index', 'index.vue')
const aiGuidePage = read('pages', 'ai-guide', 'ai-guide.vue')

for (const [relativePath, content] of [
  ['pages/index/index.vue', indexPage],
  ['pages/ai-guide/ai-guide.vue', aiGuidePage],
]) {
  const lineCount = countSourceLines(content)
  assert.ok(
    lineCount <= PAGE_REFRACTOR_RESERVE_LINE_LIMIT,
    `${relativePath} should stay under ${PAGE_REFRACTOR_RESERVE_LINE_LIMIT} lines so P0 feature work has room without crossing the 3500-line hard cap; got ${lineCount}.`
  )
}

assert.ok(
  exists('pages', 'index', 'index-theme.css'),
  'Index page should move trailing visual theme overrides into pages/index/index-theme.css'
)

assert.ok(
  exists('pages', 'index', 'kashgar-home-content.js'),
  'Index page should move static Kashgar home content into pages/index/kashgar-home-content.js'
)

assert.match(
  indexPage,
  /from '\.\/kashgar-home-content\.js'/,
  'Index page should import extracted static Kashgar home content instead of keeping long arrays in the SFC'
)

assert.match(
  indexPage,
  /<style\s+scoped\s+src="\.\/index-theme\.css"><\/style>/,
  'Index page should attach extracted theme CSS as a separate scoped style block after the base page style'
)

const indexTheme = exists('pages', 'index', 'index-theme.css')
  ? read('pages', 'index', 'index-theme.css')
  : ''

for (const selector of ['.container', '.custom-nav::after', '.function-item', '.theater-image-wrapper']) {
  assert.ok(
    indexTheme.includes(selector),
    `Extracted index theme CSS should preserve ${selector} styling`
  )
}

assert.ok(
  exists('pages', 'ai-guide', 'ai-guide-chat.css'),
  'AI guide page should move trailing chat composer/source styles into pages/ai-guide/ai-guide-chat.css'
)

assert.ok(
  exists('pages', 'ai-guide', 'kashgar-ai-content.js'),
  'AI guide page should move static Kashgar AI companion content into pages/ai-guide/kashgar-ai-content.js'
)

assert.match(
  aiGuidePage,
  /from '\.\/kashgar-ai-content\.js'/,
  'AI guide page should import extracted static Kashgar AI content instead of keeping long arrays in the SFC'
)

assert.match(
  aiGuidePage,
  /<style\s+scoped\s+src="\.\/ai-guide-chat\.css"><\/style>/,
  'AI guide should attach extracted chat CSS as a separate scoped style block after the base page style'
)

const aiGuideChat = exists('pages', 'ai-guide', 'ai-guide-chat.css')
  ? read('pages', 'ai-guide', 'ai-guide-chat.css')
  : ''

for (const selector of ['.input-area', '.upload-btn', '.follow-up-list', '.message-source-list']) {
  assert.ok(
    aiGuideChat.includes(selector),
    `Extracted AI guide chat CSS should preserve ${selector} styling`
  )
}
