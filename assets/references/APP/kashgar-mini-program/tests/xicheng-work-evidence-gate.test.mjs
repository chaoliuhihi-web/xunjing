import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

for (const required of [
  'hasReviewableJourneyEvidence',
  'hasXichengReviewableWorkEvidence',
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
  /hasXichengReviewableWorkEvidence\s*=\s*\(\{[\s\S]*materials = \[\][\s\S]*recordingSession = null[\s\S]*studyTaskEvidence = \[\][\s\S]*routeCheckins = \[\][\s\S]*hasXichengTravelogueDraftEvidence\(\{[\s\S]*materials[\s\S]*recordingSession[\s\S]*studyTaskEvidence[\s\S]*\}\)[\s\S]*hasRouteCheckinEvidence[\s\S]*return hasJourneyEvidence \|\| hasRouteCheckinEvidence/,
  'Work publishing should require real journey evidence or actual route checkins, not route planning alone'
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

assert.match(
  travelogue,
  /generatePoster\(\)\s*\{[\s\S]*if \(!this\.hasReviewableJourneyEvidence\(\)\) \{[\s\S]*this\.showWorkEvidenceRequiredToast\('分享海报'\)[\s\S]*return[\s\S]*const posterAsset = this\.createShareArtifact\('poster'\)/,
  'Poster generation should stop before creating a poster asset when the journey has no real evidence'
)

assert.match(
  travelogue,
  /exportMemorialPdf\(\)\s*\{[\s\S]*if \(!this\.hasReviewableJourneyEvidence\(\)\) \{[\s\S]*this\.showWorkEvidenceRequiredToast\('PDF纪念册'\)[\s\S]*return[\s\S]*const pdfAsset = this\.createShareArtifact\('pdf'\)/,
  'PDF memorial export should stop before creating a PDF asset when the journey has no real evidence'
)

assert.match(
  travelogue,
  /submitReview\(\)\s*\{[\s\S]*if \(!this\.hasReviewableJourneyEvidence\(\)\) \{[\s\S]*this\.showWorkEvidenceRequiredToast\('作品审核'\)[\s\S]*return[\s\S]*this\.reviewText = XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*const reviewPayload = this\.submitReviewPackage\(\)/,
  'Review submission should stop before creating an operations package when the journey has no real evidence'
)

assert.doesNotMatch(
  travelogue,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'work publishing evidence gate must not introduce backend calls or client-side secrets'
)
