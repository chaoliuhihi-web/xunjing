import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const opsDetails = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengTravelogueOpsDetails.vue'), 'utf8')
const travelogueTrackQualitySurface = `${travelogue}\n${opsDetails}`

for (const required of [
  'filteredTrackPointCount',
  '轨迹质量',
  '异常点',
  'qualityReport',
  'filteredTrackPoints: this.recordingSession.filteredTrackPoints',
  'filteredTrackPointCount: this.filteredTrackPointCount'
]) {
  assert.ok(travelogueTrackQualitySurface.includes(required), `Travelogue should expose track quality reporting token ${required}`)
}

assert.match(
  opsDetails,
  /<text class="report-value">\{\{ filteredTrackPointCount \}\}<\/text>[\s\S]*<text class="report-label">异常点<\/text>/,
  'Split recording summary should show filtered abnormal track point count'
)

assert.match(
  travelogue,
  /filteredTrackPointCount\(\)[\s\S]*Array\.isArray\(this\.recordingSession\.filteredTrackPoints\)[\s\S]*this\.recordingSession\.filteredTrackPoints\.length/,
  'Travelogue should compute filtered track point count from the recording session'
)

assert.match(
  travelogue,
  /qualityReport\(\)[\s\S]*acceptedTrackPointCount:\s*this\.routePointCount[\s\S]*filteredTrackPointCount:\s*this\.filteredTrackPointCount[\s\S]*lowAccuracyPointCount[\s\S]*abnormalJumpPointCount/,
  'Travelogue should summarize accepted, filtered, low-accuracy, and abnormal-jump track quality counts'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*qualityReport:\s*this\.qualityReport[\s\S]*filteredTrackPoints:\s*this\.recordingSession\.filteredTrackPoints[\s\S]*filteredTrackPointCount:\s*this\.filteredTrackPointCount/,
  'Review package should include track quality report and filtered abnormal point evidence for operations review'
)

assert.match(
  travelogue,
  /createPublicRecordingSummary\(\)[\s\S]*filteredTrackPointCount:\s*this\.filteredTrackPointCount[\s\S]*qualityReport:\s*this\.qualityReport/,
  'Public recording summary should include aggregate track quality counts without exact coordinates'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*qualityReport:\s*this\.qualityReport[\s\S]*filteredTrackPointCount:\s*this\.filteredTrackPointCount/,
  'Poster and PDF share artifacts should include aggregate track quality reporting'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*qualityReport:\s*this\.qualityReport[\s\S]*filteredTrackPointCount:\s*this\.filteredTrackPointCount/,
  'Local operations report should include aggregate track quality reporting'
)

assert.match(
  opsDetails,
  /轨迹质量：\{\{ opsReport\.qualityReport\.usableRate \}\}% 可用 · 异常点：\{\{ opsReport\.filteredTrackPointCount \}\}/,
  'Split local operations report UI should expose track quality and abnormal point counts for acceptance review'
)

assert.doesNotMatch(
  travelogueTrackQualitySurface,
  /background-location|startLocationUpdateBackground|\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Track quality reporting should not introduce background location, backend calls, or client-side secrets'
)
