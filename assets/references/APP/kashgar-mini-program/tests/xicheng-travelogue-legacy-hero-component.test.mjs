import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const traveloguePath = path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue')
const legacyHeroPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueLegacyHero.vue')

const travelogue = fs.readFileSync(traveloguePath, 'utf8')

assert.ok(
  fs.existsSync(legacyHeroPath),
  'Legacy travelogue hero should live in XichengTravelogueLegacyHero.vue instead of growing travelogue.vue'
)

const legacyHero = fs.readFileSync(legacyHeroPath, 'utf8')

assert.match(
  travelogue,
  /import XichengTravelogueLegacyHero from '@\/components\/xicheng\/XichengTravelogueLegacyHero\.vue'[\s\S]*components:[\s\S]*XichengTravelogueLegacyHero/,
  'Travelogue page should import and register the split legacy hero component'
)

assert.match(
  travelogue,
  /<xicheng-travelogue-legacy-hero[\s\S]*v-if="!isTravelogueEditMode && showLegacyTravelogueHero"[\s\S]*:region="region"[\s\S]*:title="travelogueHeroTitle"[\s\S]*:subtitle="travelogueHeroSubtitle"[\s\S]*:companion-line="travelogueCompanionLine"[\s\S]*\/>/,
  'Travelogue page should pass only prepared display data into the split legacy hero component'
)

assert.doesNotMatch(
  travelogue,
  /<view v-if="!isTravelogueEditMode && showLegacyTravelogueHero" :class="\['hero'[\s\S]*travelogue-companion-bubble[\s\S]*<\/view>\s*<\/view>\s*<\/view>/,
  'Travelogue page should not keep the full inline legacy hero markup after the component split'
)

for (const required of [
  'name: \'XichengTravelogueLegacyHero\'',
  'class="hero xicheng-paper-card xicheng-travelogue-hero"',
  'class="travelogue-hero-main"',
  'class="travelogue-companion"',
  'class="travelogue-companion-avatar"',
  'class="travelogue-companion-bubble xicheng-companion-bubble"',
  ':src="region.companionAvatar"',
  '{{ region.cityName }} P0',
  '{{ title }}',
  '{{ subtitle }}',
  '{{ region.companionName }}',
  '{{ companionLine }}'
]) {
  assert.ok(legacyHero.includes(required), `Split legacy hero should preserve ${required}`)
}

assert.match(
  legacyHero,
  /props:[\s\S]*region:[\s\S]*type: Object[\s\S]*title:[\s\S]*type: String[\s\S]*subtitle:[\s\S]*type: String[\s\S]*companionLine:[\s\S]*type: String/,
  'Split legacy hero should be data-driven and keep page state in travelogue.vue'
)

assert.ok(
  legacyHero.split('\n').length <= 140,
  'Split legacy hero component should stay compact'
)
