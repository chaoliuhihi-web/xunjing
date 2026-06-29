import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const computedBlock = travelogue.match(/computed:\s*\{[\s\S]*?\n\t\},\n\tonLoad/)?.[0] || ''

for (const required of [
  'isUnsafeSourceBlockedMaterial',
  'hasReviewableMaterialEvidence',
  'hasReviewableWorkMaterialEvidence',
  'getReviewableMaterialSources',
  'getReviewableWorkMaterialSources',
  'getReviewableRouteCheckinSources',
  'normalizeXichengReviewedSources',
  "['BLOCKED', 'UNAVAILABLE']"
]) {
  assert.ok(
    travelogue.includes(required),
    `Travelogue evidence gate should reject unsafe materials with token ${required}`
  )
}

assert.match(
  travelogue,
  /isUnsafeSourceBlockedMaterial\s*=\s*\(material = \{\}\) => \{[\s\S]*const safetyStatus = normalizeXichengSafetyStatus\(material\.safetyStatus\)[\s\S]*return \['BLOCKED', 'UNAVAILABLE'\]\.includes\(safetyStatus\)/,
  'Unsafe material helper should normalize legacy cached safetyStatus values before rejecting BLOCKED or UNAVAILABLE materials'
)

assert.doesNotMatch(
  travelogue.match(/isUnsafeSourceBlockedMaterial\s*=\s*\(material = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || '',
  /String\(material\.safetyStatus \|\| ''\)\.toUpperCase\(\)/,
  'Unsafe material helper should not hand-roll safetyStatus normalization without trim support'
)

assert.match(
  travelogue,
  /hasReviewableMaterialEvidence\s*=\s*\(material = \{\}\) => \{[\s\S]*if \(!material \|\| isUnsafeSourceBlockedMaterial\(material\)\) return false[\s\S]*material\.poiCode[\s\S]*material\.poiName[\s\S]*material\.remarkText[\s\S]*material\.imagePath[\s\S]*material\.aiAnswerExcerpt/,
  'Reviewable material helper should preserve normal POI, photo, remark, route, and Xiaojing evidence while rejecting unsafe materials first'
)

assert.match(
  travelogue,
  /getReviewableMaterialSources\s*=\s*\(material = \{\}\) => \{[\s\S]*if \(!hasReviewableMaterialEvidence\(material\)\) return \[\][\s\S]*return normalizeXichengReviewedSources\(material\.sources\)/,
  'Reviewable source helper should clear unsafe materials and normalize cached sources before source counts or public share cards use them'
)

assert.match(
  travelogue,
  /getReviewableWorkMaterialSources\s*=\s*\(material = \{\}\) => \{[\s\S]*if \(!hasReviewableWorkMaterialEvidence\(material\)\) return \[\][\s\S]*return normalizeXichengReviewedSources\(material\.sources\)/,
  'Reviewable work source helper should exclude planning-only route imports before review readiness counts official sources'
)

assert.match(
  travelogue,
  /getReviewableRouteCheckinSources\s*=\s*\(checkin = \{\}\) => \{[\s\S]*if \(!hasReviewableRouteCheckinEvidence\(checkin\)\) return \[\][\s\S]*return normalizeXichengReviewedSources\(checkin\.sources\)/,
  'Reviewable route check-in source helper should count source-backed route passport evidence while rejecting unsafe check-ins'
)

assert.match(
  computedBlock,
  /sourceCount\(\)[\s\S]*const materialSourceCount = this\.materials\.reduce\(\(total, material\) => \{[\s\S]*return total \+ getReviewableMaterialSources\(material\)\.length[\s\S]*const routeCheckinSourceCount = this\.routeCheckins\.reduce\(\(total, checkin\) => \{[\s\S]*return total \+ getReviewableRouteCheckinSources\(checkin\)\.length[\s\S]*return materialSourceCount \+ routeCheckinSourceCount/,
  'Travelogue source count should include reviewable route check-in sources while ignoring stale unsafe material or check-in sources'
)

assert.match(
  computedBlock,
  /workSourceCount\(\)[\s\S]*const materialSourceCount = this\.materials\.reduce\(\(total, material\) => \{[\s\S]*return total \+ getReviewableWorkMaterialSources\(material\)\.length[\s\S]*const routeCheckinSourceCount = this\.routeCheckins\.reduce\(\(total, checkin\) => \{[\s\S]*return total \+ getReviewableRouteCheckinSources\(checkin\)\.length[\s\S]*return materialSourceCount \+ routeCheckinSourceCount/,
  'Travelogue work source count should include source-backed route check-ins while still ignoring planning-only imported route sources before publish or review readiness'
)

assert.match(
  computedBlock,
  /recognizedRoute\(\)[\s\S]*this\.materials\.find\(material => material && hasReviewableMaterialEvidence\(material\) && material\.routeRecommendation\)[\s\S]*if \(routeMaterial\) return routeMaterial\.routeRecommendation[\s\S]*return this\.importedRoute \|\| null/,
  'Travelogue recognized route should ignore stale routeRecommendation values on BLOCKED or UNAVAILABLE materials while retaining the active imported route'
)

assert.match(
  travelogue,
  /hasXichengTravelogueDraftEvidence\s*=\s*\(\{[\s\S]*const hasMaterialEvidence = Array\.isArray\(materials\) && materials\.some\(material => \{[\s\S]*return hasReviewableMaterialEvidence\(material\)[\s\S]*return hasMaterialEvidence \|\| hasTrackEvidence \|\| hasStudyEvidence \|\| hasRouteEvidence/,
  'Travelogue draft evidence gate should use the reviewable material helper before allowing material evidence to generate a draft'
)

assert.match(
  travelogue,
  /const reviewableMaterials = materials\.filter\(material => hasReviewableMaterialEvidence\(material\)\)[\s\S]*const poiNames = Array\.from\(new Set\([\s\S]*reviewableMaterials[\s\S]*const photoCount = reviewableMaterials\.filter\(material => material && material\.type === 'photo'\)\.length[\s\S]*const remarkTexts = reviewableMaterials[\s\S]*const aiGuideExcerpts = reviewableMaterials[\s\S]*filter\(material => material && material\.type === 'ai-guide' && material\.aiAnswerExcerpt\)[\s\S]*map\(material => material\.aiAnswerExcerpt\)/,
  'Travelogue draft generator should only fold reviewable POIs, photos, remarks, and Xiaojing excerpts into a generated draft'
)

assert.doesNotMatch(
  travelogue,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Safe-source travelogue evidence gate must stay local and must not introduce backend calls or client-side secrets'
)
