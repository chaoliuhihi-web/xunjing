import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

for (const required of [
  'hasXichengTravelogueDraftEvidence',
  'hasTraveloguePreviewEvidence',
  'traveloguePreviewTitle',
  '等待你的西城素材',
  '待补充素材',
  '来源审核后生成',
  '请先通过识别、开始记录、补充照片或现场备注积累真实素材，再预览西城游记',
  '请先通过识别、开始记录、补充照片或现场备注积累真实素材',
  '本次西城 Citywalk'
]) {
  assert.ok(
    travelogue.includes(required),
    `Travelogue draft generation should gate empty drafts with reviewed journey evidence marker ${required}`
  )
}

assert.match(
  travelogue,
  /hasXichengTravelogueDraftEvidence\s*=\s*\(\{[\s\S]*materials = \[\][\s\S]*recordingSession = null[\s\S]*studyTaskEvidence = \[\][\s\S]*routeRecommendation = null[\s\S]*routeCheckins = \[\][\s\S]*hasMaterialEvidence[\s\S]*hasTrackEvidence[\s\S]*hasStudyEvidence[\s\S]*hasRouteEvidence[\s\S]*hasRouteCheckinEvidence[\s\S]*return hasMaterialEvidence \|\| hasTrackEvidence \|\| hasStudyEvidence \|\| hasRouteEvidence \|\| hasRouteCheckinEvidence/,
  'Travelogue should centralize the evidence gate across materials, route recording, study tasks, recognized routes, and actual route check-ins'
)

assert.match(
  travelogue,
  /createXichengTravelogueDraft\s*=\s*\(\{[\s\S]*routeCheckins = \[\][\s\S]*if \(!hasXichengTravelogueDraftEvidence\(\{[\s\S]*materials[\s\S]*routeRecommendation[\s\S]*recordingSession[\s\S]*studyTaskEvidence[\s\S]*routeCheckins[\s\S]*return `请先通过识别、开始记录、补充照片或现场备注积累真实素材/,
  'Travelogue draft generator should return a no-evidence prompt before creating a narrative draft'
)

assert.match(
  travelogue,
  /hasTraveloguePreviewEvidence\(\)[\s\S]*hasXichengTravelogueDraftEvidence\(\{[\s\S]*materials:\s*this\.materials[\s\S]*routeRecommendation:\s*this\.recognizedRoute \|\| this\.importedRoute[\s\S]*recordingSession:\s*this\.recordingSession[\s\S]*studyTaskEvidence:\s*this\.studyTaskEvidence[\s\S]*routeCheckins:\s*this\.routeCheckins/,
  'Travelogue preview should use the same evidence gate as draft generation before showing narrative copy'
)

assert.match(
  travelogue,
  /traveloguePreviewText\(\)[\s\S]*if \(!this\.hasTraveloguePreviewEvidence\)[\s\S]*return XICHENG_TRAVELOGUE_PREVIEW_EMPTY_TEXT/,
  'Travelogue preview should show a no-evidence state instead of sample narrative copy'
)

assert.match(
  travelogue,
  /traveloguePreviewTags\(\)[\s\S]*if \(!this\.hasTraveloguePreviewEvidence\)[\s\S]*return \[\.\.\.XICHENG_TRAVELOGUE_PREVIEW_EMPTY_TAGS\]/,
  'Travelogue preview tags should not default to sample Xicheng POIs when no evidence exists'
)

assert.doesNotMatch(
  travelogue,
  /poiNames\.length > 0 \? poiNames\.join\('、'\) : '白塔寺、西四街巷、什刹海'/,
  'Travelogue draft generator must not fabricate a default Xicheng route when no real journey evidence exists'
)
