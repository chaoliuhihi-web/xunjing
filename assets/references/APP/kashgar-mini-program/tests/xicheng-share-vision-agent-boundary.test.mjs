import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const share = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'share', 'share.vue'), 'utf8')

for (const required of [
  'sanitizePublicVisionAgentPackage',
  'currentVisionAgentShareBoundary',
  'publicVisionAgentAutoTraveloguePackage',
  'publicVisionAgentRealSystemBoundary',
  'vision-agent-share-boundary',
  'AI识境服务边界',
  '真实系统待确认'
]) {
  assert.ok(share.includes(required), `Share page should preserve AI识境 boundary token ${required}`)
}

assert.match(
  share,
  /sanitizePublicVisionAgentPackage\(packagePayload = \{\}\)\s*\{[\s\S]*packageName:\s*packagePayload\.packageName \|\| 'AI识境自动素材包'[\s\S]*taskCount:\s*toSafeCount\(packagePayload\.taskCount\)[\s\S]*sceneDomainLabels:\s*safeArray\(packagePayload\.sceneDomainLabels\)[\s\S]*serviceIntentLabels:\s*safeArray\(packagePayload\.serviceIntentLabels\)[\s\S]*realSystemRequiredTaskCount:\s*toSafeCount\(packagePayload\.realSystemRequiredTaskCount\)[\s\S]*realSystemBoundaryText:\s*String\(packagePayload\.realSystemBoundaryText \|\| ''\)/,
  'Share page should whitelist only public AI识境 package summary fields'
)

assert.match(
  share,
  /createSharePublicPreview\(journeyDraft = \{\}\)[\s\S]*const publicVisionAgentAutoTraveloguePackage = this\.sanitizePublicVisionAgentPackage\(publicPreview\.publicVisionAgentAutoTraveloguePackage \|\| journeyDraft\.visionAgentAutoTraveloguePackage\)[\s\S]*publicVisionAgentAutoTraveloguePackage,[\s\S]*publicVisionAgentRealSystemBoundary:\s*publicVisionAgentAutoTraveloguePackage\.realSystemBoundaryText \|\| journeyDraft\.visionAgentRealSystemBoundary \|\| ''/,
  'Share public preview should carry the sanitized AI识境 package and real-system boundary from the journey draft'
)

assert.match(
  share,
  /createShareArtifact\(assetType\)[\s\S]*const publicPreview = this\.createSharePublicPreview\(journeyDraft\)[\s\S]*visionAgentAutoTraveloguePackage:\s*publicPreview\.publicVisionAgentAutoTraveloguePackage[\s\S]*visionAgentRealSystemBoundary:\s*publicPreview\.publicVisionAgentRealSystemBoundary/,
  'Generated share artifacts should persist the same sanitized AI识境 boundary that users see in the public preview'
)

assert.match(
  share,
  /sanitizeShareArtifactForReview\(artifact = \{\}\)\s*\{[\s\S]*const publicPreview = this\.createSharePublicPreview\(\{ publicPreview: artifact\.publicPreview, visionAgentAutoTraveloguePackage: artifact\.visionAgentAutoTraveloguePackage, visionAgentRealSystemBoundary: artifact\.visionAgentRealSystemBoundary \}\)[\s\S]*visionAgentAutoTraveloguePackage:\s*publicPreview\.publicVisionAgentAutoTraveloguePackage[\s\S]*visionAgentRealSystemBoundary:\s*publicPreview\.publicVisionAgentRealSystemBoundary/,
  'Share review sanitizer should rebuild AI识境 package and boundary from cached artifacts before operations review'
)

assert.match(
  share,
  /currentVisionAgentShareBoundary\(\)[\s\S]*this\.shareArtifacts[\s\S]*visionAgentRealSystemBoundary[\s\S]*this\.getShareJourneyDraft\(\)[\s\S]*visionAgentRealSystemBoundary/,
  'Share page should show the latest generated artifact boundary and fall back to the current journey draft boundary'
)

assert.match(
  share,
  /<view v-if="currentVisionAgentShareBoundary" class="vision-agent-share-boundary xicheng-paper-card">[\s\S]*AI识境服务边界[\s\S]*currentVisionAgentShareBoundary/,
  'Share page should make the AI识境 real-system boundary visible before users submit review or share'
)

assert.doesNotMatch(
  share.match(/sanitizePublicVisionAgentPackage\(packagePayload = \{\}\)[\s\S]*?\n\t\t\},\n\t\tcreateSharePublicPreview/)?.[0] || '',
  /tasks|serviceTask|handoffSteps|sourceRecognitionContext|latitude|longitude|imagePath|photoPath|sources:/,
  'Public AI识境 package sanitizer should not expose raw tasks, handoff steps, source context, coordinates, photo paths, or sources'
)
