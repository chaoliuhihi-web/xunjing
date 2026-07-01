import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const indexPage = fs.readFileSync(path.join(root, 'pages', 'index', 'index.vue'), 'utf8')
const indexKashgarNotesStyle = fs.readFileSync(path.join(root, 'pages', 'index', 'index-kashgar-notes.css'), 'utf8')
const indexSource = `${indexPage}\n${indexKashgarNotesStyle}`
const tabBar = fs.readFileSync(path.join(root, 'components', 'tab-bar', 'tab-bar.vue'), 'utf8')

assert.ok(
  fs.existsSync(path.join(root, 'favicon.ico')),
  'Frontend QA should not emit a browser favicon 404 on the UniApp H5 preview route'
)

assert.match(
  indexPage,
  /class="kashgar-home kashgar-travel-notes-home"/,
  'Kashgar home should render the travel-notes reference shell'
)

assert.match(
  indexSource,
  /\.kashgar-travel-notes-home\s*\{[\s\S]*padding:\s*0\s+22rpx\s+250rpx/,
  'Kashgar travel-notes home should leave enough bottom padding for the fixed APP tab bar'
)

assert.match(
  indexSource,
  /\.kashgar-travel-banner\s*\{[\s\S]*height:\s*236rpx/,
  'Kashgar travel banner should be compact enough for the first viewport reference layout'
)

assert.match(
  indexSource,
  /\.kashgar-note-cover-wrap\s*\{[\s\S]*height:\s*116rpx/,
  'Kashgar travel note cards should keep a compact image ratio'
)

assert.match(
  indexSource,
  /\.kashgar-travel-note-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
  'Kashgar travel notes should use the reference two-column grid'
)

for (const requiredText of ['跟着游记', 'AI识境', '我的']) {
  assert.ok(
    tabBar.includes(`>${requiredText}<`),
    `Tab bar should include the reference label ${requiredText}`
  )
}

assert.match(
  tabBar,
  /<text class="center-text">AI识境<\/text>/,
  'Center AI tab should show the AI识境 primary entry label below the character'
)

const centerOffsetMatch = tabBar.match(/\.center-btn-wrapper\s*\{[\s\S]*?margin-top:\s*(-?\d+)px/)
assert.ok(centerOffsetMatch, 'Center AI tab should declare a controlled vertical offset')
assert.ok(
  Number(centerOffsetMatch[1]) >= -18,
  'Center AI tab should not protrude into the Kashgar CTA area'
)

assert.match(
  tabBar,
  /\.center-avatar\s*\{[\s\S]*?pointer-events:\s*none/,
  'Center AI companion avatar should stay decorative and not intercept APP tab taps'
)

assert.match(
  tabBar,
  /src="\/static\/tabbar\/ai_companion_avatar\.png"/,
  'Center AI tab should use the Kashgar companion avatar asset'
)
