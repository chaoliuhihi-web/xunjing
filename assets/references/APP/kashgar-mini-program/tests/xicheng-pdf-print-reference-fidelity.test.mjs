import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const pdfPrint = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'pdf-print', 'pdf-print.vue'), 'utf8')

for (const token of [
  'PDF 纪念册',
  '在白塔下遇见西城',
  '星河寻境西城 · Citywalk 纪念册',
  'A4 纵向',
  '6 页',
  '可打印',
  'print-page-stage',
  'print-page-counter',
  'print-thumbnail-strip',
  'print-settings-grid',
  'export-content-card',
  '保存 PDF',
  '预览全部',
  '打印 / 分享 PDF'
]) {
  assert.ok(pdfPrint.includes(token), `PDF print page should expose approved reference token: ${token}`)
}

for (const pageLabel of ['封面', '路线', '照片', '游记', '来源', '封底']) {
  assert.ok(pdfPrint.includes(`label: '${pageLabel}'`), `PDF print preview should include ${pageLabel} thumbnail`)
}

for (const settingLabel of ['纸张', '边距', '图片质量', '隐藏精确轨迹', '附官方来源页']) {
  assert.ok(pdfPrint.includes(`label: '${settingLabel}'`), `PDF print settings should include ${settingLabel}`)
}

for (const exportItem of ['游记正文', '路线概览', '精选照片', '资料来源']) {
  assert.ok(pdfPrint.includes(`title: '${exportItem}'`), `PDF export content should include ${exportItem}`)
}

for (const methodName of ['selectPreviewPage', 'previewAllPages', 'savePdf', 'systemPrintPdf', 'sharePdf']) {
  assert.match(pdfPrint, new RegExp(`${methodName}\\(`), `PDF print page should define ${methodName}`)
}

assert.match(
  pdfPrint,
  /currentPreviewPage\(\)[\s\S]*return this\.previewPages\[this\.currentPageIndex\] \|\| this\.previewPages\[0\]/,
  'PDF page should render a selected large preview page from the thumbnail strip'
)

assert.match(
  pdfPrint,
  /printSettings\(\)[\s\S]*hideExactTrack[\s\S]*officialSources/,
  'PDF print settings should keep exact tracks hidden and official source pages enabled by default'
)

assert.match(
  pdfPrint,
  /exportContentItems\(\)[\s\S]*reviewedSourceCount[\s\S]*materialCount/,
  'PDF export content summary should reflect reviewed sources and selected material count'
)

assert.ok(pdfPrint.split(/\r?\n/).length < 760, 'PDF print page should stay compact and component-friendly')

assert.doesNotMatch(
  pdfPrint,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|background-location|startLocationUpdateBackground/,
  'PDF print page should not introduce backend calls, client secrets, or high-risk background permissions'
)
