import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const editorShare = fs.readFileSync(path.join(root, 'components', 'xicheng', 'travelogue-editor-share.vue'), 'utf8')

for (const required of [
  'XichengTravelogueEditorShare',
  '<xicheng-travelogue-editor-share',
  'editableTravelogueTitle',
  'editorPhotoCards',
  'travelogueTagChips',
  'publishTravelogue'
]) {
  assert.ok(travelogue.includes(required), `Xicheng travelogue page should wire editor share shell through ${required}`)
}

for (const required of [
  'travelogue-editor-share-panel',
  '编辑游记',
  'editor-title-card',
  '照片 ({{ photoCards.length }}/9)',
  'editor-route-map-card',
  '今日路线',
  '我的感受',
  '小京补充',
  '资料来源：已核实',
  '添加标签',
  '保存草稿',
  '生成分享图',
  '发布'
]) {
  assert.ok(editorShare.includes(required), `Xicheng travelogue editor share component should include ${required}`)
}

for (const required of [
  '<xicheng-icon name="edit"',
  '<xicheng-icon name="close"',
  '<xicheng-icon name="plus"',
  '<xicheng-icon name="location"',
  '<xicheng-icon name="explore"',
  '<xicheng-icon name="record"',
  '<xicheng-icon name="play"',
  '<xicheng-icon name="heart"'
]) {
  assert.ok(editorShare.includes(required), `Travelogue editor share should use shared icon token: ${required}`)
}

assert.match(
  editorShare,
  /class="editor-tag-chip"[\s\S]*<text class="editor-tag-text">\{\{ tag \}\}<\/text>[\s\S]*<xicheng-icon name="close"/,
  'Travelogue editor tag chips should use a shared close icon instead of a handwritten × glyph'
)

assert.match(
  editorShare,
  /class="editor-tag-chip editor-tag-add"[\s\S]*<xicheng-icon name="plus"[\s\S]*<text>添加标签<\/text>/,
  'Travelogue editor add-tag affordance should use the shared plus icon and text separately'
)

assert.doesNotMatch(
  editorShare,
  /\{\{\s*tag\s*\}\}\s*×|\+\s*添加标签/,
  'Travelogue editor tag controls should not hand-write structural × or + glyphs'
)

assert.doesNotMatch(
  editorShare,
  /<uni-icons\b/,
  'Travelogue editor share component should not use raw uni-icons after adopting the unified icon system'
)

assert.match(
  editorShare,
  /\.editor-photo-remove\s*\{[\s\S]*width:\s*72rpx[\s\S]*height:\s*72rpx/,
  'Travelogue editor photo remove control should keep a stable app touch target'
)

assert.match(
  editorShare,
  /name:\s*'XichengTravelogueEditorShare'[\s\S]*emits:\s*\['update:title', 'save', 'generate-share', 'publish', 'add-photo'\]/,
  'Travelogue editor share component should expose title update and action events for the parent page'
)

assert.match(
  travelogue,
  /editorPhotoCards\(\)[\s\S]*this\.traveloguePreviewTags[\s\S]*this\.traveloguePreviewImage/,
  'Travelogue editor share photo cards should reuse compact route tags and local visual assets'
)

assert.match(
  travelogue,
  /editorRouteItems\(\)[\s\S]*this\.recognizedRouteStops[\s\S]*09:00/,
  'Travelogue editor share route block should summarize route stops with stable visible times'
)

assert.match(
  travelogue,
  /publishTravelogue\(\)[\s\S]*this\.submitReview\(\)/,
  'Travelogue publish action should reuse the existing review submission flow instead of bypassing audit'
)

assert.match(
  travelogue,
  /saveDraft\([^)]*\)[\s\S]*editableTravelogueTitle:\s*this\.editableTravelogueTitle/,
  'Travelogue draft persistence should save the editable share title'
)

assert.doesNotMatch(
  `${travelogue}\n${editorShare}`,
  /xicheng-multimodal\/design-mockups|11-travelogue-editor-share\.png/,
  'Travelogue editor runtime UI should not reference full-page design mockup screenshots'
)
