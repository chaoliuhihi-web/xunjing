import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const recordShellPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueRecordShell.vue')
const heroCardPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueRecordHeroCard.vue')

const recordShell = fs.readFileSync(recordShellPath, 'utf8')
const heroCard = fs.readFileSync(heroCardPath, 'utf8')
const recordShellTemplate = recordShell.match(/<template>[\s\S]*?<\/template>/)?.[0] || ''

assert.ok(recordShellTemplate, 'Travelogue record shell should have a template')

assert.match(
  recordShell,
  /import XichengTravelogueRecordHeroCard from '@\/components\/xicheng\/XichengTravelogueRecordHeroCard\.vue'/,
  'Travelogue record shell should import the split hero card component'
)

assert.match(
  recordShell,
  /components:\s*\{[\s\S]*XichengTravelogueRecordHeroCard[\s\S]*\}/,
  'Travelogue record shell should register the split hero card component'
)

assert.match(
  recordShellTemplate,
  /<xicheng-travelogue-record-hero-card[\s\S]*:preview-image="previewImage"[\s\S]*:beihai-route-image="beihaiRouteImage"[\s\S]*:baitasi-route-image="baitasiRouteImage"[\s\S]*@generate="\$emit\('generate'\)"[\s\S]*@add-photo="\$emit\('add-photo'\)"[\s\S]*\/>/,
  'Travelogue record shell should delegate the first-screen draft hero while preserving generate and add-photo events'
)

assert.ok(
  !recordShellTemplate.includes('class="travelogue-approved-hero-card xicheng-paper-card"'),
  'Travelogue record shell template should not keep inline hero card markup after the split'
)

for (const token of [
  'class="travelogue-approved-hero-card xicheng-paper-card"',
  'travelogue-approved-hero-copy',
  'travelogue-approved-hero-title',
  '生成今日游记草稿',
  '识别、路线、照片和问答会自动汇总成草稿',
  'travelogue-approved-primary',
  '一键生成游记',
  'travelogue-approved-secondary',
  '添加素材',
  'travelogue-approved-visual',
  'travelogue-approved-cover',
  'travelogue-approved-route-dot dot-a',
  'travelogue-approved-photo-card photo-a'
]) {
  assert.ok(heroCard.includes(token), `Split travelogue record hero card should keep ${token}`)
}

assert.match(
  heroCard,
  /name:\s*'XichengTravelogueRecordHeroCard'/,
  'Split travelogue record hero card should have a component name'
)

assert.match(
  heroCard,
  /props:[\s\S]*previewImage:[\s\S]*beihaiRouteImage:[\s\S]*baitasiRouteImage:/,
  'Split travelogue record hero card should accept visual assets as props'
)

assert.match(
  heroCard,
  /emits:\s*\[[\s\S]*'generate'[\s\S]*'add-photo'[\s\S]*\]/,
  'Split travelogue record hero card should emit semantic actions instead of calling page methods directly'
)

assert.ok(
  heroCard.split('\n').length <= 180,
  'Split travelogue record hero card component should stay compact'
)

assert.ok(
  recordShell.split('\n').length < 646,
  'Component split should reduce XichengTravelogueRecordShell.vue below its previous 646 line count'
)
