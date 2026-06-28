import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const inspiration = read('pages', 'xicheng', 'inspiration', 'inspiration.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const sliceBetween = (content, start, end) => {
  const startIndex = content.indexOf(start)
  const endIndex = content.indexOf(end, startIndex)
  assert.ok(startIndex >= 0, `missing start marker ${start}`)
  assert.ok(endIndex > startIndex, `missing end marker ${end}`)
  return content.slice(startIndex, endIndex)
}
const importRecordFactory = sliceBetween(
  inspiration,
  'createInspirationImportRecord(route, includeImageOnly = false)',
  'persistInspirationImportRecord(importRecord)'
)

assert.ok(
  regionConfig.includes("inspirationImportStorageKey: 'xicheng:inspirationImports'"),
  'Xicheng config should define a local inspiration import record storage key'
)

for (const required of [
  'inspirationImports',
  'createInspirationImportRecord',
  'persistInspirationImportRecord',
  'createInspirationTextExcerpt',
  'inspirationImportStorageKey',
  'importId',
  'rawTextExcerpt',
  'rawTextLength',
  'sceneCode',
  'sourceChannel',
  'extractedPlaceNames',
  'matchedPoiCodes',
  'confirmedPois',
  'imageIncluded',
  'routeTitle',
  'sourcePolicy',
  '不保存第三方平台原文',
  'reviewStatus',
  'publishStatus'
]) {
  assert.ok(inspiration.includes(required), `Inspiration page should support import record evidence ${required}`)
}

assert.match(
  inspiration,
  /saveInspirationRoute\(\{ silent = false, includeImageOnly = false \} = \{\}\)[\s\S]*const importRecord = this\.createInspirationImportRecord\(route, includeImageOnly\)[\s\S]*this\.persistInspirationImportRecord\(importRecord\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.inspirationStorageKey, route\)/,
  'Saving an inspiration route should create and persist a reviewable import record before storing the route'
)

assert.match(
  importRecordFactory,
  /importId:\s*`inspiration-\$\{Date\.now\(\)\}`[\s\S]*regionCode:\s*XICHENG_REGION_CONFIG\.regionCode[\s\S]*packageCode:\s*XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*XICHENG_REGION_CONFIG\.sceneCode[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*rawTextExcerpt:\s*this\.createInspirationTextExcerpt\(this\.rawText\)[\s\S]*rawTextLength:\s*String\(this\.rawText \|\| ''\)\.length[\s\S]*extractedPlaceNames:\s*this\.matchedPois\.map\(poi => poi\.poiName\)[\s\S]*matchedPoiCodes:\s*this\.matchedPois\.map\(poi => poi\.poiCode\)[\s\S]*confirmedPois:\s*route\.stops[\s\S]*imageIncluded:\s*!!this\.imagePath[\s\S]*routeTitle:\s*route\.title[\s\S]*sourcePolicy:\s*'不保存第三方平台原文'[\s\S]*reviewStatus:\s*XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'/,
  'Inspiration import record should include attribution context, extraction, matching, confirmation, privacy, and review evidence'
)

assert.match(
  inspiration,
  /createInspirationTextExcerpt\(text = ''\)[\s\S]*String\(text \|\| ''\)\.replace\([\s\S]*\.slice\(0, 80\)/,
  'Inspiration import record should save a short sanitized text excerpt instead of the full imported text'
)

assert.match(
  inspiration,
  /persistInspirationImportRecord\(importRecord\)[\s\S]*const existingImports = uni\.getStorageSync\(XICHENG_REGION_CONFIG\.inspirationImportStorageKey\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.inspirationImportStorageKey/,
  'Inspiration import records should be persisted independently from the active route'
)

assert.doesNotMatch(
  inspiration,
  /rawText:\s*this\.rawText/,
  'Inspiration route should not persist the full raw imported text as public route data'
)

for (const required of [
  'inspirationImports',
  'inspirationImportCount',
  '灵感导入记录',
  'sourcePolicy'
]) {
  assert.ok(travelogue.includes(required), `Travelogue should expose inspiration import record evidence ${required}`)
}

assert.match(
  travelogue,
  /uni\.getStorageSync\(XICHENG_REGION_CONFIG\.inspirationImportStorageKey\)[\s\S]*this\.inspirationImports/,
  'Travelogue should restore inspiration import records from local storage'
)

assert.match(
  travelogue,
  /inspirationImportCount\(\)[\s\S]*return this\.inspirationImports\.length/,
  'Travelogue should compute inspiration import count'
)

assert.match(
  travelogue,
  /saveDraft\(\{ silent = false \} = \{\}\)[\s\S]*inspirationImports:\s*this\.inspirationImports[\s\S]*inspirationImportCount:\s*this\.inspirationImportCount/,
  'Saved travelogue draft should include inspiration import records'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*inspirationImports:\s*this\.inspirationImports[\s\S]*inspirationImportCount:\s*this\.inspirationImportCount/,
  'Review package should include inspiration import records'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*inspirationImportCount:\s*this\.inspirationImportCount/,
  'Local operations report should include inspiration import count'
)

assert.doesNotMatch(
  `${inspiration}\n${travelogue}`,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|https:\/\/www\.xiaohongshu\.com|mp\.weixin\.qq\.com/,
  'Inspiration import record MVP should stay local and avoid backend calls, secrets, or third-party scraping'
)
