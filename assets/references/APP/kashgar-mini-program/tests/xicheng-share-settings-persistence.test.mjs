import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const share = read('pages', 'xicheng', 'share', 'share.vue')

assert.ok(
  regionConfig.includes("shareSettingStorageKey: 'xicheng:shareSettings'"),
  'Xicheng config should define a dedicated local storage key for share privacy settings'
)

assert.match(
  regionConfig,
  /privacyClearStorageKeys:[\s\S]*XICHENG_REGION_BASE_CONFIG\.shareSettingStorageKey/,
  'Privacy clear list should include persisted share settings so local privacy choices can be removed'
)

for (const required of [
  'XICHENG_DEFAULT_SHARE_SETTING_STATE',
  'normalizeShareSettingState',
  'shareSettingStorageKey',
  'restoreShareSettings',
  'persistShareSettings'
]) {
  assert.ok(share.includes(required), `Share page should support persisted share setting token ${required}`)
}

assert.match(
  share,
  /const XICHENG_DEFAULT_SHARE_SETTING_STATE = Object\.freeze\(\{[\s\S]*hideExactLocation:\s*true[\s\S]*approvedOnly:\s*true[\s\S]*includeXiaojingSummary:\s*true[\s\S]*\}\)/,
  'Share page should centralize safe default privacy settings'
)

assert.match(
  share,
  /const normalizeShareSettingState\s*=\s*\(settings = \{\}\) => \(\{[\s\S]*hideExactLocation:\s*settings\.hideExactLocation !== false[\s\S]*approvedOnly:\s*settings\.approvedOnly !== false[\s\S]*includeXiaojingSummary:\s*settings\.includeXiaojingSummary !== false[\s\S]*\}\)/,
  'Share setting normalizer should fail closed by keeping all privacy toggles enabled unless explicitly false'
)

assert.match(
  share,
  /onShow\(\)[\s\S]*this\.restoreShareSettings\(\)[\s\S]*this\.shareArtifacts = safeArray\(uni\.getStorageSync\(XICHENG_REGION_CONFIG\.shareAssetStorageKey\)\)/,
  'Share page should restore persisted share settings before displaying existing artifacts'
)

assert.match(
  share,
  /restoreShareSettings\(\)[\s\S]*const storedShareSettings = safeObject\(uni\.getStorageSync\(XICHENG_REGION_CONFIG\.shareSettingStorageKey\)\)[\s\S]*this\.shareSettingState = normalizeShareSettingState\(storedShareSettings\)/,
  'Share page should load persisted settings through the privacy-preserving normalizer'
)

assert.match(
  share,
  /persistShareSettings\(\)[\s\S]*this\.shareSettingState = normalizeShareSettingState\(this\.shareSettingState\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.shareSettingStorageKey,\s*this\.shareSettingState\)/,
  'Share page should persist normalized share settings after changes'
)

assert.match(
  share,
  /toggleShareSetting\(key = ''\)[\s\S]*this\.shareSettingState\[key\] = !this\.shareSettingState\[key\][\s\S]*this\.persistShareSettings\(\)/,
  'Share setting toggles should be durable instead of resetting when the page is reopened'
)

assert.match(
  share,
  /privacySettings:\s*normalizeShareSettingState\(this\.shareSettingState\)/,
  'Generated share artifacts should snapshot normalized persisted privacy settings'
)

assert.doesNotMatch(
  share,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Persisting share settings should stay local and must not introduce backend calls or client-side secrets'
)
