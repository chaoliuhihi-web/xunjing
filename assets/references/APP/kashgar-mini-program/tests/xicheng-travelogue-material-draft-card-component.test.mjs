import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const recordShellPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueRecordShell.vue')
const materialDraftCardPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueMaterialDraftCard.vue')

const recordShell = fs.readFileSync(recordShellPath, 'utf8')
const materialDraftCard = fs.readFileSync(materialDraftCardPath, 'utf8')
const recordShellTemplate = recordShell.match(/<template>[\s\S]*?<\/template>/)?.[0] || ''

assert.ok(recordShellTemplate, 'Travelogue record shell should have a template')

assert.match(
  recordShell,
  /import XichengTravelogueMaterialDraftCard from '@\/components\/xicheng\/XichengTravelogueMaterialDraftCard\.vue'/,
  'Travelogue record shell should import the split material draft card component'
)

assert.match(
  recordShell,
  /components:\s*\{[\s\S]*XichengTravelogueMaterialDraftCard[\s\S]*\}/,
  'Travelogue record shell should register the split material draft card component'
)

assert.match(
  recordShellTemplate,
  /<xicheng-travelogue-material-draft-card[\s\S]*:preview-image="previewImage"[\s\S]*:preview-title="previewTitle"[\s\S]*:preview-text="previewText"[\s\S]*:material-count="materialCount"[\s\S]*:route-count="routeCount"[\s\S]*:photo-count="photoCount"[\s\S]*:qa-count="qaCount"[\s\S]*:has-evidence="hasEvidence"[\s\S]*@scroll-draft="\$emit\('scroll-draft'\)"[\s\S]*@open-reader="\$emit\('open-reader'\)"[\s\S]*\/>/,
  'Travelogue record shell should delegate the material summary and draft preview while preserving scroll and reader events'
)

for (const removedInlineToken of [
  'class="travelogue-approved-material-grid"',
  'class="travelogue-approved-draft-card"',
  'class="travelogue-approved-ready-line"'
]) {
  assert.ok(
    !recordShellTemplate.includes(removedInlineToken),
    `Travelogue record shell template should not keep inline ${removedInlineToken} after the split`
  )
}

for (const token of [
  'class="travelogue-approved-card xicheng-paper-card"',
  '今日素材',
  '查看全部',
  'travelogue-approved-material-grid',
  '识别地点',
  '路线',
  '照片',
  '问答',
  'travelogue-approved-ready-line',
  '素材充足，可生成草稿',
  '素材不足，继续补充后再生成',
  'travelogue-approved-draft-card',
  'travelogue-approved-draft-title',
  'travelogue-approved-draft-excerpt',
  'travelogue-approved-draft-meta',
  '预览草稿'
]) {
  assert.ok(materialDraftCard.includes(token), `Split travelogue material draft card should keep ${token}`)
}

assert.match(
  materialDraftCard,
  /name:\s*'XichengTravelogueMaterialDraftCard'/,
  'Split travelogue material draft card should have a component name'
)

assert.match(
  materialDraftCard,
  /props:[\s\S]*previewImage:[\s\S]*previewTitle:[\s\S]*previewText:[\s\S]*materialCount:[\s\S]*routeCount:[\s\S]*photoCount:[\s\S]*qaCount:[\s\S]*hasEvidence:/,
  'Split travelogue material draft card should accept preview and evidence state as props'
)

assert.match(
  materialDraftCard,
  /emits:\s*\[[\s\S]*'scroll-draft'[\s\S]*'open-reader'[\s\S]*\]/,
  'Split travelogue material draft card should emit semantic actions instead of calling page methods directly'
)

assert.ok(
  materialDraftCard.split('\n').length <= 260,
  'Split travelogue material draft card component should stay compact'
)

assert.ok(
  recordShell.split('\n').length < 509,
  'Component split should reduce XichengTravelogueRecordShell.vue below its previous 509 line count'
)
