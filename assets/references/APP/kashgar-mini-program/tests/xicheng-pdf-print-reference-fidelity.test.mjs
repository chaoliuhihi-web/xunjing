import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const pdfPrint = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'pdf-print', 'pdf-print.vue'), 'utf8')
const previewComponentPath = path.join(root, 'components', 'xicheng', 'XichengPdfPrintPreview.vue')
const shareAssets = fs.readFileSync(path.join(root, 'request', 'xunjing', 'shareAssets.js'), 'utf8')
const getMethodBlock = (source, methodName) => {
  const match = source.match(new RegExp(`${methodName}\\(\\)\\s*\\{([\\s\\S]*?)\\n\\t\\t\\},`))
  return match ? match[1] : ''
}

assert.ok(
  fs.existsSync(previewComponentPath),
  'PDF print page should split the heavy page preview stage into XichengPdfPrintPreview instead of growing the page shell'
)

const previewComponent = fs.readFileSync(previewComponentPath, 'utf8')
const pdfSurface = `${pdfPrint}\n${previewComponent}`

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
  'print-all-pages-overview',
  '全页总览',
  'print-settings-grid',
  'export-content-card',
  '保存 PDF',
  '预览全部',
  '打印 / 分享 PDF',
  '打印前检查',
  '不会自动发布',
  '系统打印/分享前会再次确认'
]) {
  assert.ok(pdfSurface.includes(token), `PDF print page should expose approved reference token: ${token}`)
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
  /import XichengPdfPrintPreview from '@\/components\/xicheng\/XichengPdfPrintPreview\.vue'[\s\S]*components:[\s\S]*XichengPdfPrintPreview/,
  'PDF print page should import and register the split preview component'
)

assert.match(
  pdfPrint,
  /<xicheng-pdf-print-preview[\s\S]*:preview-pages="previewPages"[\s\S]*:current-page-index="currentPageIndex"[\s\S]*:current-preview-page="currentPreviewPage"[\s\S]*:show-all-pages-preview="showAllPagesPreview"[\s\S]*@select-page="selectPreviewPage"/,
  'PDF print page should pass preview data, all-page overview state and page selection into the split preview component'
)

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

assert.match(
  pdfPrint,
  /printPreflightItems\(\)[\s\S]*隐私保护[\s\S]*精确轨迹默认隐藏[\s\S]*来源检查[\s\S]*只导出已审核来源[\s\S]*用户确认[\s\S]*系统打印\/分享前会再次确认/,
  'PDF print page should summarize privacy, source and user-confirmation readiness before export actions'
)

assert.match(
  pdfPrint,
  /previewAllPages\(\)[\s\S]*this\.showAllPagesPreview = !this\.showAllPagesPreview/,
  'Preview-all action should toggle a real all-page overview instead of showing only a toast'
)

assert.doesNotMatch(
  getMethodBlock(pdfPrint, 'previewAllPages'),
  /uni\.showToast/,
  'Preview-all action should not remain a toast-only placeholder'
)

assert.match(
  previewComponent,
  /v-if="showAllPagesPreview"[\s\S]*class="print-all-pages-overview[\s\S]*v-for="page in previewPages"[\s\S]*class="all-page-mini-sheet"[\s\S]*@click="\$emit\('select-page', page\.pageNo - 1\)"/,
  'Split PDF preview component should render a tappable all-page overview for print checking'
)

assert.match(
  pdfPrint,
  /confirmPdfExportAction\(actionLabel = ''\)[\s\S]*uni\.showModal\(\{[\s\S]*title:\s*`\$\{actionLabel\}确认`[\s\S]*content:\s*'PDF 会先保存到本机预览，不会自动发布；系统打印\/分享前会再次确认。'[\s\S]*confirmText:\s*actionLabel[\s\S]*resolve\(Boolean\(res\.confirm\)\)/,
  'PDF print export actions should ask the user for confirmation instead of silently saving or printing'
)

assert.match(
  pdfPrint,
  /async savePdf\(\)[\s\S]*const confirmed = await this\.confirmPdfExportAction\('保存 PDF'\)[\s\S]*if \(!confirmed\) return[\s\S]*PDF 纪念册已保存到我的游记/,
  'Save PDF action should be gated by the export confirmation copy before saving to my travelogues'
)

assert.match(
  pdfPrint,
  /import \{ createXichengPdfPrintArtifact \} from '@\/request\/xunjing\/shareAssets\.js'/,
  'PDF print page should delegate saved PDF artifact construction to the shared share-asset helper'
)

assert.match(
  shareAssets,
  /createXichengPdfPrintArtifact = \(\{[\s\S]*artifactId:\s*`pdf-print-\$\{Date\.now\(\)\}`[\s\S]*assetType:\s*'pdf'[\s\S]*assetLabel:\s*getXichengShareChannelAssetLabel\('pdf', 'pdf'\)[\s\S]*templateCode:\s*getXichengShareChannelTemplateCode\('pdf', 'pdf'\)[\s\S]*publishChannel:\s*'pdf'[\s\S]*title[\s\S]*pageCount[\s\S]*reviewedSourceCount[\s\S]*materialCount[\s\S]*publishStatus:\s*'private'/,
  'Shared share-asset helper should create a reusable local PDF artifact with print metadata and private publish status'
)

assert.match(
  pdfPrint,
  /persistSavedPdfArtifact\(artifact = \{\}\)[\s\S]*this\.shareArtifacts = \[artifact, \.\.\.existingArtifacts\.filter\(item => item && item\.artifactId !== artifact\.artifactId\)\]\.slice\(0, 8\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.shareAssetStorageKey, this\.shareArtifacts\)/,
  'PDF print page should persist saved PDF artifacts into the same local share asset library used by 我的游记'
)

assert.match(
  pdfPrint,
  /async savePdf\(\)[\s\S]*const confirmed = await this\.confirmPdfExportAction\('保存 PDF'\)[\s\S]*if \(!confirmed\) return[\s\S]*const pdfArtifact = createXichengPdfPrintArtifact\(\{[\s\S]*title:\s*this\.printTitle[\s\S]*pageCount:\s*this\.previewPages\.length[\s\S]*this\.persistSavedPdfArtifact\(pdfArtifact\)[\s\S]*PDF 纪念册已保存到我的游记/,
  'Save PDF action should create and persist a reusable local PDF artifact after user confirmation'
)

assert.match(
  pdfPrint,
  /async sharePdf\(\)[\s\S]*const confirmed = await this\.confirmPdfExportAction\('打印 \/ 分享 PDF'\)[\s\S]*if \(!confirmed\) return[\s\S]*将唤起系统打印或分享 PDF/,
  'Print/share PDF action should be gated by the export confirmation copy'
)

assert.match(
  pdfPrint,
  /\.setting-label,[\s\S]*\.setting-value,[\s\S]*\.export-title,[\s\S]*\.export-desc,[\s\S]*\.export-count[\s\S]*display:\s*block/,
  'PDF print settings and export rows should keep title, description, and count text on separate scan-friendly lines after splitting preview styles'
)

assert.ok(pdfPrint.split(/\r?\n/).length < 520, 'PDF print page shell should stay compact after splitting the preview stage')
assert.ok(previewComponent.split(/\r?\n/).length < 430, 'PDF print preview component should stay compact for APP packaging')

assert.doesNotMatch(
  pdfSurface,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|background-location|startLocationUpdateBackground/,
  'PDF print page should not introduce backend calls, client secrets, or high-risk background permissions'
)
