import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const longPreview = read('components', 'xicheng', 'XichengLongTraveloguePreview.vue')
const statePanelPath = path.join(root, 'components', 'xicheng', 'XichengTravelogueGenerationStatePanel.vue')
const stateMixin = read('components', 'xicheng', 'travelogueGenerationState.js')

assert.ok(fs.existsSync(statePanelPath), 'Travelogue generation should split insufficient/failed states into XichengTravelogueGenerationStatePanel.vue')

const statePanel = fs.readFileSync(statePanelPath, 'utf8')

for (const token of [
  '素材不足',
  '不能生成草稿',
  '继续探索',
  '补充照片',
  '生成失败',
  '素材已保存',
  '重新生成',
  '手动编辑',
  '失败原因'
]) {
  assert.ok(statePanel.includes(token), `Generation state panel should expose approved reference token: ${token}`)
}

for (const token of [
  'status',
  'materialHints',
  'failureReason',
  "$emit('explore')",
  "$emit('add-photo')",
  "$emit('retry')",
  "$emit('manual-edit')"
]) {
  assert.ok(statePanel.includes(token), `Generation state panel should expose state/action contract: ${token}`)
}

assert.ok(statePanel.split(/\r?\n/).length < 260, 'Generation state panel should stay compact for APP packaging')
assert.doesNotMatch(
  statePanel,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|background-location|startLocationUpdateBackground/,
  'Generation state panel should not introduce backend calls, client secrets, or high-risk background permissions'
)

for (const token of [
  "import XichengTravelogueGenerationStatePanel from '@/components/xicheng/XichengTravelogueGenerationStatePanel.vue'",
  "import { createXichengTravelogueGenerationStateMixin } from '@/components/xicheng/travelogueGenerationState.js'",
  'XichengTravelogueGenerationStatePanel',
  'mixins: [createXichengTravelogueGenerationStateMixin()]',
  '<xicheng-travelogue-generation-state-panel',
  ':status="travelogueGenerationState"',
  ':has-evidence="hasTraveloguePreviewEvidence"',
  ':material-hints="travelogueMaterialHints"',
  ':failure-reason="travelogueGenerationFailureReason"',
  '@explore="openRoutesPage"',
  '@add-photo="addPhotoMaterial"',
  '@retry="generateTravelogueDraft"',
  '@manual-edit="scrollToDraftEditor"'
]) {
  assert.ok(travelogue.includes(token), `travelogue.vue should wire generation state panel via ${token}`)
}

for (const token of [
  'travelogueGenerationStatus',
  'travelogueGenerationFailureReason',
  'travelogueMaterialHints',
  'openRoutesPage'
]) {
  assert.ok(stateMixin.includes(token), `travelogue generation mixin should carry state contract: ${token}`)
}

assert.match(
  stateMixin,
  /travelogueGenerationState\(\)[\s\S]*this\.travelogueGenerationStatus === 'failed'[\s\S]*return 'failed'[\s\S]*!this\.hasTraveloguePreviewEvidence[\s\S]*return 'insufficient'[\s\S]*return 'ready'/,
  'travelogue generation mixin should compute insufficient, failed, and ready states'
)

assert.match(
  stateMixin,
  /generateTravelogueDraft\(\)[\s\S]*if \(!this\.hasTraveloguePreviewEvidence\)[\s\S]*this\.travelogueGenerationStatus = 'insufficient'[\s\S]*title: '素材不足，不能生成草稿'/,
  'generateTravelogueDraft should block empty generation with an explicit insufficient-materials state'
)

assert.match(
  stateMixin,
  /try \{[\s\S]*this\.refreshDraftFromEvidence\(\)[\s\S]*this\.travelogueGenerationStatus = 'ready'[\s\S]*\} catch \(error\) \{[\s\S]*this\.travelogueGenerationStatus = 'failed'[\s\S]*this\.travelogueGenerationFailureReason/,
  'generateTravelogueDraft should keep material and expose a failed retry state when generation errors'
)

assert.ok(stateMixin.split(/\r?\n/).length < 90, 'travelogue generation mixin should stay compact')
assert.ok(travelogue.split(/\r?\n/).length < 3000, 'travelogue.vue should stay below the APP page style extraction budget after adding states')

for (const token of [
  'hasEvidence',
  '待补充真实路线和照片',
  '等待补充照片',
  '继续补充真实素材',
  '路线和距离待记录',
  'dayOneRouteText',
  'routeMetaText',
  'endingText'
]) {
  assert.ok(longPreview.includes(token), `Long travelogue preview should keep no-evidence output honest via ${token}`)
}

assert.match(
  longPreview,
  /routeSummary\(\)[\s\S]*if \(!this\.hasEvidence\)[\s\S]*return '待补充真实路线和照片'/,
  'Long preview should not claim photos and routes are ready when material evidence is missing'
)
