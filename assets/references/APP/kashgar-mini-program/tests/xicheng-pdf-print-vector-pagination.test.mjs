import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const pdfPrint = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'pdf-print', 'pdf-print.vue'), 'utf8')

for (const token of [
  'print-page-counter-button',
  'print-page-counter-prev',
  'print-page-counter-next',
  ':disabled="currentPageIndex === 0"',
  ':disabled="currentPageIndex === previewPages.length - 1"',
  '<xicheng-icon name="back"',
  '<xicheng-icon name="next"',
  'aria-label="上一页"',
  'aria-label="下一页"'
]) {
  assert.ok(pdfPrint.includes(token), `PDF print pagination should use unified vector button token: ${token}`)
}

assert.match(
  pdfPrint,
  /<button class="print-page-counter-button print-page-counter-prev"[\s\S]*<xicheng-icon name="back"[\s\S]*<\/button>[\s\S]*<text class="print-page-counter-label">页码预览 第 \{\{ currentPageIndex \+ 1 \}\} \/ \{\{ previewPages\.length \}\} 页<\/text>[\s\S]*<button class="print-page-counter-button print-page-counter-next"[\s\S]*<xicheng-icon name="next"[\s\S]*<\/button>/,
  'PDF print pagination should render previous button, stable label, and next button in the approved order'
)

assert.match(
  pdfPrint,
  /\.print-page-counter-button\s*\{[\s\S]*width:\s*76rpx[\s\S]*height:\s*76rpx[\s\S]*border-radius:\s*999rpx/,
  'PDF print pagination buttons should reserve stable 44pt-style touch targets'
)

assert.doesNotMatch(
  pdfPrint,
  />\s*[‹›]\s*<\/text>|@click="selectPreviewPage\([^"]+\)">[‹›]/,
  'PDF print pagination should not hand-write chevrons as text controls'
)

assert.ok(pdfPrint.split(/\r?\n/).length < 820, 'PDF print page should stay compact for APP packaging')
