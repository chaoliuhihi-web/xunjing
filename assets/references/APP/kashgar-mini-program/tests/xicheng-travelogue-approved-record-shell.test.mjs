import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const recordShell = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengTravelogueRecordShell.vue'), 'utf8')
const recordHeroCard = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengTravelogueRecordHeroCard.vue'), 'utf8')
const materialDraftCard = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengTravelogueMaterialDraftCard.vue'), 'utf8')
const css = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.css'), 'utf8')
const combinedSource = `${travelogue}\n${recordShell}\n${recordHeroCard}\n${materialDraftCard}`
const combinedStyle = `${css}\n${recordShell}\n${recordHeroCard}\n${materialDraftCard}`

for (const required of [
  'travelogue-approved-record-shell',
  'travelogue-approved-topbar',
  '生成今日游记草稿',
  '今日素材',
  '生成风格',
  '最近记录',
  '小京提示',
  'showLegacyTravelogueHero',
  'showAdvancedTravelogueGeneration',
  'showTravelogueOpsDetails'
]) {
  assert.ok(combinedSource.includes(required), `Travelogue record page should include approved reference token: ${required}`)
}

assert.match(
  combinedSource,
  /<xicheng-travelogue-record-shell[\s\S]*@generate="generateTravelogueDraft"[\s\S]*<xicheng-travelogue-record-hero-card[\s\S]*@generate="\$emit\('generate'\)"[\s\S]*<button class="travelogue-approved-primary[\s\S]*\$emit\('generate'\)[\s\S]*一键生成游记/,
  'Approved travelogue record shell should keep the primary one-tap draft generation action'
)

assert.match(
  combinedSource,
  /<xicheng-travelogue-record-shell[\s\S]*@add-photo="addPhotoMaterial"[\s\S]*<xicheng-travelogue-record-hero-card[\s\S]*@add-photo="\$emit\('add-photo'\)"[\s\S]*<button class="travelogue-approved-secondary[\s\S]*\$emit\('add-photo'\)[\s\S]*添加素材/,
  'Approved travelogue record shell should expose add-material fallback before generation'
)

assert.match(
  travelogue,
  /showLegacyTravelogueHero:\s*false/,
  'Old oversized travelogue hero should not render before the approved record shell by default'
)

assert.match(
  travelogue,
  /showAdvancedTravelogueGeneration:\s*false/,
  'Old advanced generation stack should be folded below the approved record shell by default'
)

assert.match(
  travelogue,
  /showTravelogueOpsDetails:\s*false/,
  'Route passport, study task, ops and raw material details should not expand on the default record page'
)

for (const requiredStyle of [
  '.travelogue-approved-record-shell',
  '.travelogue-approved-hero-card',
  '.travelogue-approved-material-grid',
  '.travelogue-approved-draft-card',
  '.travelogue-approved-style-row',
  '.travelogue-approved-tip-card'
]) {
  assert.ok(combinedStyle.includes(requiredStyle), `Travelogue approved record shell should style ${requiredStyle}`)
}
