import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const opsDetails = read('components', 'xicheng', 'XichengTravelogueOpsDetails.vue')
const travelogueBadgeSurface = `${travelogue}\n${opsDetails}`
const sliceBetween = (content, start, end) => {
  const startIndex = content.indexOf(start)
  const endIndex = content.indexOf(end, startIndex)
  assert.ok(startIndex >= 0, `missing start marker ${start}`)
  assert.ok(endIndex > startIndex, `missing end marker ${end}`)
  return content.slice(startIndex, endIndex)
}
const routeBadgeAwardFactory = sliceBetween(
  travelogue,
  '\t\tcreateRouteBadgeAward() {',
  'persistRouteBadgeAward(award)'
)

assert.ok(
  regionConfig.includes("badgeAwardStorageKey: 'xicheng:badgeAwards'"),
  'Xicheng config should define a local route passport badge award storage key'
)

for (const required of [
  'badgeAwards',
  'activeBadgeAward',
  'routePassportTargetCount',
  'routePassportCheckinCount',
  'claimRouteBadge',
  'createRouteBadgeAward',
  'persistRouteBadgeAward',
  'badgeAwardStorageKey',
  '领取徽章',
  '徽章达成记录',
  'awardId',
  'badgeCode',
  'badgeName',
  'routePassportTitle',
  'passportProgress',
  'studyTaskEvidenceCount',
  'awardedAt',
  'badgeAwardCount'
]) {
  assert.ok(travelogueBadgeSurface.includes(required), `Travelogue should support route badge award evidence ${required}`)
}

assert.match(
  travelogue,
  /uni\.getStorageSync\(XICHENG_REGION_CONFIG\.badgeAwardStorageKey\)[\s\S]*this\.badgeAwards/,
  'Travelogue should restore badge awards from local storage'
)

assert.match(
  travelogue,
  /activeBadgeAward\(\)[\s\S]*this\.badgeAwards\.find\(award => award && award\.badgeCode === this\.routeBadgeCode\)/,
  'Travelogue should compute the active route badge award'
)

assert.match(
  travelogue,
  /routeBadgeCode\(\)[\s\S]*return `\$\{XICHENG_REGION_CONFIG\.regionCode\}:route-passport:citywalk`/,
  'Route badge code should be stable for review and operations reporting'
)

assert.match(
  regionConfig,
  /routePassport:\s*\{[\s\S]*targetCheckinCount:\s*3[\s\S]*thresholdText:\s*'完成 3 个文化点打卡可生成西城路线纪念章'/,
  'Route passport config should declare the 3-check-in completion target used by the UI copy'
)

assert.match(
  travelogue,
  /routePassportCheckinCount\(\)[\s\S]*new Set\([\s\S]*this\.routeCheckins[\s\S]*filter\(checkin => this\.hasReviewableRouteCheckinEvidence\(checkin\)\)[\s\S]*checkin\.poiCode \|\| checkin\.poiName[\s\S]*return Math\.min\(checkedPoiKeys\.size, this\.routePassportTargetCount\)/,
  'Route passport progress should count unique reviewable route check-in POIs, not unsafe check-ins or study task completions'
)

assert.match(
  travelogue,
  /passportProgress\(\)[\s\S]*const total = Math\.max\(this\.routePassportTargetCount, 1\)[\s\S]*return Math\.min\(100, Math\.round\(\(this\.routePassportCheckinCount \/ total\) \* 100\)\)/,
  'Route passport progress should be calculated from the 3-check-in target'
)

assert.match(
  travelogue,
  /claimRouteBadge\(\)[\s\S]*if \(!this\.badgeUnlocked \|\| this\.activeBadgeAward\) return[\s\S]*const award = this\.createRouteBadgeAward\(\)[\s\S]*this\.persistRouteBadgeAward\(award\)/,
  'Claiming a route badge should require an unlocked passport and avoid duplicate awards'
)

assert.match(
  routeBadgeAwardFactory,
  /awardId:\s*`badge-\$\{Date\.now\(\)\}`[\s\S]*badgeCode:\s*this\.routeBadgeCode[\s\S]*badgeName:\s*this\.badgeName[\s\S]*routePassportTitle:\s*this\.routePassport\.title[\s\S]*regionCode:\s*XICHENG_REGION_CONFIG\.regionCode[\s\S]*packageCode:\s*XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*XICHENG_REGION_CONFIG\.sceneCode[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*passportProgress:\s*this\.passportProgress[\s\S]*routePassportTargetCount:\s*this\.routePassportTargetCount[\s\S]*routePassportCheckinCount:\s*this\.routePassportCheckinCount[\s\S]*checkinCount:\s*this\.checkinCount[\s\S]*studyTaskEvidenceCount:\s*this\.studyTaskEvidenceCount[\s\S]*reviewStatus:\s*XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'/,
  'Badge award payload should include identity, attribution context, route passport context, completion evidence, and private review status'
)

assert.match(
  travelogue,
  /persistRouteBadgeAward\(award\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.badgeAwardStorageKey, this\.badgeAwards\)[\s\S]*this\.saveDraft\(\{ silent: true \}\)/,
  'Persisting a route badge award should save it locally and refresh the travelogue payload'
)

assert.match(
  travelogue,
  /saveDraft\(\{ silent = false \} = \{\}\)[\s\S]*badgeAwards:\s*this\.badgeAwards[\s\S]*activeBadgeAward:\s*this\.activeBadgeAward/,
  'Saved travelogue draft should include route badge award state'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*badgeAwards:\s*this\.badgeAwards[\s\S]*activeBadgeAward:\s*this\.activeBadgeAward[\s\S]*badgeAwardCount:\s*this\.badgeAwardCount/,
  'Review package should include badge awards for operations review'
)

assert.match(
  travelogue,
  /createShareArtifact\(assetType\)[\s\S]*activeBadgeAward:\s*this\.activeBadgeAward[\s\S]*badgeAwardCount:\s*this\.badgeAwardCount/,
  'Poster and PDF assets should include claimed badge award evidence'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*badgeAwardCount:\s*this\.badgeAwardCount/,
  'Local operations report should include badge award count'
)

assert.doesNotMatch(
  travelogue,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Local badge award MVP should not introduce backend calls or client-side secrets'
)
