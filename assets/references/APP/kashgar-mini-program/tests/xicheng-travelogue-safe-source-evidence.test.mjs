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
  'getReviewableMaterialSources',
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
  /getReviewableMaterialSources\s*=\s*\(material = \{\}\) => \{[\s\S]*if \(!hasReviewableMaterialEvidence\(material\)\) return \[\][\s\S]*return Array\.isArray\(material\.sources\) \? material\.sources : \[\]/,
  'Reviewable source helper should clear sources for unsafe materials before source counts or public share cards use them'
)

assert.match(
  computedBlock,
  /sourceCount\(\)[\s\S]*this\.materials\.reduce\(\(total, material\) => \{[\s\S]*return total \+ getReviewableMaterialSources\(material\)\.length/,
  'Travelogue source count should ignore stale sources on BLOCKED or UNAVAILABLE materials'
)

assert.match(
  computedBlock,
  /recognizedRoute\(\)[\s\S]*this\.materials\.find\(material => material && hasReviewableMaterialEvidence\(material\) && material\.routeRecommendation\)[\s\S]*return routeMaterial \? routeMaterial\.routeRecommendation : null/,
  'Travelogue recognized route should ignore stale routeRecommendation values on BLOCKED or UNAVAILABLE materials'
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
