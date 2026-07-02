import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const reader = read('pages', 'xicheng', 'travelogue-reader', 'travelogue-reader.vue')
const longPreview = read('components', 'xicheng', 'XichengLongTraveloguePreview.vue')
const longPreviewCss = read('components', 'xicheng', 'XichengLongTraveloguePreview.css')
const shell = `${reader}\n${longPreview}\n${longPreviewCss}`

assert.match(
  reader,
  /<xicheng-long-travelogue-preview[\s\S]*:estimated-read-minutes="estimatedReadMinutes"[\s\S]*:print-page-count="printPageCount"[\s\S]*:privacy-summary="privacySummary"/,
  'Travelogue reader should pass reading time, printable page count, and privacy summary into the keepsake preview'
)

assert.match(
  reader,
  /estimatedReadMinutes\(\)[\s\S]*Math\.max\(3,[\s\S]*Math\.ceil\(/,
  'Travelogue reader should derive a compact estimated reading time from article material instead of hard-coding it'
)

assert.match(
  reader,
  /printPageCount\(\)[\s\S]*Math\.max\(4,[\s\S]*this\.longArticleChapters\.length[\s\S]*this\.photoMemoryCards\.length/,
  'Travelogue reader should derive printable PDF page count from chapters and photo memories'
)

assert.match(
  reader,
  /privacySummary\(\)[\s\S]*精确轨迹默认隐藏[\s\S]*发布前可检查公开范围/,
  'Travelogue reader should surface the public-scope privacy rule before sharing or printing'
)

for (const token of [
  'long-print-readiness-panel',
  '成书预览',
  '预计阅读',
  'A4 可打印',
  '隐私保护',
  '打印成册',
  'printPageCountLabel',
  'estimatedReadMinutesLabel',
  'privacySummary'
]) {
  assert.ok(shell.includes(token), `Keepsake reader should expose printable-readiness UI token: ${token}`)
}

assert.match(
  longPreview,
  /<button class="long-print-cta" @click="\$emit\('export-pdf'\)">[\s\S]*打印成册/,
  'Printable-readiness panel should provide a direct print/PDF action using the existing export-pdf event'
)

assert.match(
  longPreview,
  /printPageCountLabel\(\)[\s\S]*this\.printPageCount > 0[\s\S]*`\$\{this\.printPageCount\} 页`[\s\S]*'待生成'/,
  'Printable page count label should not inflate empty page evidence'
)

assert.match(
  longPreview,
  /estimatedReadMinutesLabel\(\)[\s\S]*this\.estimatedReadMinutes > 0[\s\S]*`\$\{this\.estimatedReadMinutes\} 分钟`[\s\S]*'待生成'/,
  'Estimated read time label should not inflate empty article evidence'
)

assert.doesNotMatch(
  shell,
  /AI补充|AI 补充|由AI生成|由 AI 生成|小京来源补充|\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Printable keepsake reader should not reveal generation scaffolding, call backend directly, or contain client secrets'
)
