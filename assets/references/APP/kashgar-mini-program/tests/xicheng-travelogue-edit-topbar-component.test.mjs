import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const componentPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueEditTopbar.vue')

assert.ok(
  fs.existsSync(componentPath),
  'Travelogue edit chrome should be isolated in XichengTravelogueEditTopbar.vue instead of growing travelogue.vue'
)

const editTopbar = fs.readFileSync(componentPath, 'utf8')
const travelogueSurface = `${travelogue}\n${editTopbar}`

assert.match(
  travelogue,
  /import XichengTravelogueEditTopbar from '@\/components\/xicheng\/XichengTravelogueEditTopbar\.vue'[\s\S]*components:[\s\S]*XichengTravelogueEditTopbar/,
  'Travelogue page should import and register the split edit topbar component'
)

assert.match(
  travelogue,
  /<xicheng-travelogue-edit-topbar[\s\S]*v-if="isTravelogueEditMode"[\s\S]*@go-back="goBack"[\s\S]*@open-actions="openTravelogueActions"/,
  'Travelogue page should delegate edit topbar rendering while keeping navigation handlers on the page'
)

for (const required of [
  "name: 'XichengTravelogueEditTopbar'",
  'class="travelogue-editor-topbar"',
  'class="travelogue-editor-back"',
  'class="travelogue-editor-title"',
  '编辑游记',
  'class="travelogue-editor-more"',
  '<xicheng-icon name="back"',
  '<xicheng-icon name="more"',
  "$emit('go-back')",
  "$emit('open-actions')"
]) {
  assert.ok(travelogueSurface.includes(required), `Travelogue edit topbar surface should include ${required}`)
}

assert.doesNotMatch(
  travelogue,
  /<view v-if="isTravelogueEditMode" class="travelogue-editor-topbar">[\s\S]*travelogue-editor-more[\s\S]*<\/view>\s*<xicheng-travelogue-record-shell/,
  'travelogue.vue should not keep the full inline edit topbar after component extraction'
)
