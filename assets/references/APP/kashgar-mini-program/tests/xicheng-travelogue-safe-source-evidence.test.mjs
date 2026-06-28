import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

for (const required of [
  'isUnsafeSourceBlockedMaterial',
  'hasReviewableMaterialEvidence',
  "['BLOCKED', 'UNAVAILABLE']",
  'hasReviewedSources'
]) {
  assert.ok(
    travelogue.includes(required),
    `Travelogue evidence gate should reject unsafe source-less materials with token ${required}`
  )
}

assert.match(
  travelogue,
  /isUnsafeSourceBlockedMaterial\s*=\s*\(material = \{\}\) => \{[\s\S]*const safetyStatus = normalizeXichengSafetyStatus\(material\.safetyStatus\)[\s\S]*const hasReviewedSources = Array\.isArray\(material\.sources\) && material\.sources\.length > 0[\s\S]*return \['BLOCKED', 'UNAVAILABLE'\]\.includes\(safetyStatus\) && !hasReviewedSources/,
  'Unsafe material helper should normalize legacy cached safetyStatus values before rejecting BLOCKED or UNAVAILABLE materials when reviewed sources are absent'
)

assert.doesNotMatch(
  travelogue.match(/isUnsafeSourceBlockedMaterial\s*=\s*\(material = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || '',
  /String\(material\.safetyStatus \|\| ''\)\.toUpperCase\(\)/,
  'Unsafe material helper should not hand-roll safetyStatus normalization without trim support'
)

assert.match(
  travelogue,
  /hasReviewableMaterialEvidence\s*=\s*\(material = \{\}\) => \{[\s\S]*if \(!material \|\| isUnsafeSourceBlockedMaterial\(material\)\) return false[\s\S]*material\.poiCode[\s\S]*material\.poiName[\s\S]*material\.remarkText[\s\S]*material\.imagePath[\s\S]*material\.aiAnswerExcerpt/,
  'Reviewable material helper should preserve normal POI, photo, remark, route, and Xiaojing evidence while rejecting unsafe source-less materials first'
)

assert.match(
  travelogue,
  /hasXichengTravelogueDraftEvidence\s*=\s*\(\{[\s\S]*const hasMaterialEvidence = Array\.isArray\(materials\) && materials\.some\(material => \{[\s\S]*return hasReviewableMaterialEvidence\(material\)[\s\S]*return hasMaterialEvidence \|\| hasTrackEvidence \|\| hasStudyEvidence \|\| hasRouteEvidence/,
  'Travelogue draft evidence gate should use the reviewable material helper before allowing material evidence to generate a draft'
)

assert.match(
  travelogue,
  /const aiGuideExcerpts = materials[\s\S]*filter\(material => material && material\.type === 'ai-guide' && material\.aiAnswerExcerpt && hasReviewableMaterialEvidence\(material\)\)[\s\S]*map\(material => material\.aiAnswerExcerpt\)/,
  'Travelogue draft generator should not fold source-less BLOCKED or UNAVAILABLE Xiaojing excerpts into a generated draft'
)

assert.doesNotMatch(
  travelogue,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Safe-source travelogue evidence gate must stay local and must not introduce backend calls or client-side secrets'
)
