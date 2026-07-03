import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const actionGrid = read('components', 'xicheng', 'XichengTravelogueActionGrid.vue')
const workEvidenceBlock = travelogue.match(/export const hasXichengReviewableWorkEvidence\s*=\s*\(\{[\s\S]*?\n\}/)?.[0] || ''

for (const required of [
  'hasReviewableJourneyEvidence',
  'hasXichengReviewableWorkEvidence',
  'hasReviewableWorkMaterialEvidence',
  'XICHENG_PLANNING_ONLY_MATERIAL_TYPES',
  'showWorkEvidenceRequiredToast',
  '请先补充真实素材再'
]) {
  assert.ok(
    travelogue.includes(required),
    `Travelogue work publishing should expose no-evidence gate marker ${required}`
  )
}

assert.match(
  travelogue,
  /XICHENG_PLANNING_ONLY_MATERIAL_TYPES[\s\S]*official-route-poi[\s\S]*inspiration-poi[\s\S]*inspiration-image/,
  'Planning-only route and inspiration materials should be named separately from reviewable journey evidence'
)

assert.match(
  travelogue,
  /hasReviewableWorkMaterialEvidence\s*=\s*\(material = \{\}\) => \{[\s\S]*XICHENG_PLANNING_ONLY_MATERIAL_TYPES\.includes\(material\.type\)[\s\S]*return false[\s\S]*return hasReviewableMaterialEvidence\(material\)/,
  'Work material evidence should reject planning-only route imports before using the broader draft evidence check'
)

assert.match(
  travelogue,
  /hasXichengReviewableWorkEvidence\s*=\s*\(\{[\s\S]*materials = \[\][\s\S]*recordingSession = null[\s\S]*studyTaskEvidence = \[\][\s\S]*routeCheckins = \[\][\s\S]*hasMaterialEvidence[\s\S]*hasReviewableWorkMaterialEvidence[\s\S]*hasTrackEvidence[\s\S]*hasStudyEvidence[\s\S]*hasRouteCheckinEvidence[\s\S]*return hasMaterialEvidence \|\| hasTrackEvidence \|\| hasStudyEvidence \|\| hasRouteCheckinEvidence/,
  'Work publishing should require real journey material, track, study, or actual route check-in evidence'
)

assert.ok(workEvidenceBlock, 'Work evidence helper block should be extractable for focused safety assertions')

assert.doesNotMatch(
  workEvidenceBlock,
  /hasXichengTravelogueDraftEvidence\(/,
  'Work evidence gate must not reuse the broader travelogue draft gate because route planning can create draft evidence'
)

assert.match(
  travelogue,
  /hasReviewableJourneyEvidence\(\)\s*\{[\s\S]*return hasXichengReviewableWorkEvidence\(\{[\s\S]*materials:\s*this\.materials[\s\S]*recordingSession:\s*this\.recordingSession[\s\S]*studyTaskEvidence:\s*this\.studyTaskEvidence[\s\S]*routeCheckins:\s*this\.routeCheckins[\s\S]*\}\)/,
  'Poster, PDF, and review submission should reuse the stricter work evidence gate'
)

assert.doesNotMatch(
  travelogue,
  /hasReviewableJourneyEvidence\(\)\s*\{[\s\S]*routeRecommendation:\s*this\.recognizedRoute[\s\S]*\}/,
  'Route planning/import alone must not unlock poster, PDF, or review submission'
)

assert.match(
  travelogue,
  /showWorkEvidenceRequiredToast\(actionLabel = '生成作品'\)\s*\{[\s\S]*uni\.showToast\(\{[\s\S]*title:\s*`请先补充真实素材再\$\{actionLabel\}`[\s\S]*icon:\s*'none'/,
  'Blocked work publishing actions should show a no-evidence explanation instead of creating artifacts'
)

const needsEvidenceBindings = actionGrid.match(/requiresEvidence:\s*true/g) || []
assert.equal(
  needsEvidenceBindings.length,
  3,
  'Poster, PDF, and review actions should visibly indicate that real journey evidence is required before they can produce reviewable work'
)

assert.match(
  actionGrid,
  /action\.requiresEvidence && !hasReviewableEvidence/,
  'Split action grid should apply the muted no-evidence state only to actions that require reviewable work evidence'
)

assert.match(
  actionGrid,
  /\.work-action-needs-evidence\s*\{[\s\S]*opacity:\s*0\.58[\s\S]*border-style:\s*dashed/,
  'No-evidence work actions should have a visible muted state while preserving tap-to-explain behavior'
)

assert.doesNotMatch(
  actionGrid.match(/\.work-action-needs-evidence\s*\{[\s\S]*?\n\}/)?.[0] || '',
  /pointer-events:\s*none/,
  'No-evidence action styling should not suppress clicks because the existing click handler shows the required-evidence explanation'
)

assert.match(
  travelogue,
  /generatePoster\(\)\s*\{[\s\S]*if \(!this\.hasReviewableJourneyEvidence\(\)\) \{[\s\S]*this\.showWorkEvidenceRequiredToast\('社交分享素材'\)[\s\S]*return[\s\S]*const posterAsset = this\.createShareArtifact\('poster'\)/,
  'Poster generation should stop before creating a poster asset when the journey has no real evidence'
)

assert.match(
  travelogue,
  /exportMemorialPdf\(\)\s*\{[\s\S]*if \(!this\.hasReviewableJourneyEvidence\(\)\) \{[\s\S]*this\.showWorkEvidenceRequiredToast\('PDF纪念册'\)[\s\S]*return[\s\S]*const pdfAsset = this\.createShareArtifact\('pdf'\)/,
  'PDF memorial export should stop before creating a PDF asset when the journey has no real evidence'
)

assert.match(
  travelogue,
  /submitReview\(\)\s*\{[\s\S]*if \(!this\.hasReviewableJourneyEvidence\(\)\) \{[\s\S]*this\.showWorkEvidenceRequiredToast\('发布前检查'\)[\s\S]*return[\s\S]*this\.reviewText = XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*const reviewPayload = this\.submitReviewPackage\(\)/,
  'Review submission should stop before creating an operations package when the journey has no real evidence'
)

assert.doesNotMatch(
  travelogue,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'work publishing evidence gate must not introduce backend calls or client-side secrets'
)
