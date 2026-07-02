import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

assert.ok(
  exists('request', 'xunjing', 'inspirationImport.js'),
  'One-click copy-homework should use a dedicated functional import helper instead of page-local parsing'
)

const helper = read('request', 'xunjing', 'inspirationImport.js')
const inspiration = read('pages', 'xicheng', 'inspiration', 'inspiration.vue')

for (const required of [
  'detectXichengInspirationSourcePlatforms',
  'extractXichengGuideInput',
  'extractXichengPoiMatches',
  'buildXichengWalkRoute',
  'createXichengInspirationImportPackage',
  'createXichengInspirationRouteMaterials',
  'createXichengInspirationImportRecord',
  'sourcePlatforms',
  'unmatchedPlaceNames',
  'matchAlias',
  'matchConfidence',
  'routeCode',
  'distanceText',
  'routeSource',
  'copy-homework',
  '一键抄作业导入',
  '不抓取第三方链接原文',
  '不保存第三方平台原文'
]) {
  assert.ok(helper.includes(required), `Copy-homework helper should include ${required}`)
}

assert.match(
  helper,
  /xiaohongshu\.com[\s\S]*xhslink\.com[\s\S]*小红书[\s\S]*mp\.weixin\.qq\.com[\s\S]*公众号[\s\S]*mafengwo\.cn[\s\S]*马蜂窝/,
  'Import helper should classify 小红书、公众号、马蜂窝 sources from pasted links or text labels'
)

assert.match(
  helper,
  /XICHENG_OFFICIAL_POIS[\s\S]*aliases[\s\S]*matchIndex[\s\S]*matchedAliasesByPoiCode[\s\S]*sort\(\(left, right\) => left\.matchIndex - right\.matchIndex\)/,
  'Import helper should match official POIs by aliases, dedupe repeated aliases by POI, and preserve guide order'
)

assert.match(
  helper,
  /unmatchedPlaceNames[\s\S]*extractXichengUnmatchedPlaceNames[\s\S]*matchedPois/,
  'Import helper should keep unmatched place candidates visible for later manual review instead of silently dropping them'
)

assert.match(
  helper,
  /createXichengInspirationImportPackage\s*=\s*\(\{[\s\S]*rawText[\s\S]*imagePath[\s\S]*sourcePlatforms[\s\S]*matchedPois[\s\S]*unmatchedPlaceNames[\s\S]*const route = buildXichengWalkRoute/,
  'Import helper should create one package containing source, extraction, match and route outputs'
)

assert.match(
  helper,
  /routeCode:\s*createXichengCopyHomeworkRouteCode\(stops\)[\s\S]*routeSource:\s*'copy-homework'[\s\S]*sourceLabel:\s*'一键抄作业导入'/,
  'Generated routes should have a stable copy-homework route identity and source label'
)

assert.match(
  helper,
  /createXichengInspirationRouteMaterials\s*=\s*\(importPackage = \{\}\)[\s\S]*type:\s*'inspiration-poi'[\s\S]*importId:\s*importPackage\.importId[\s\S]*sourcePlatforms:\s*importPackage\.sourcePlatforms[\s\S]*sources,[\s\S]*sourceCount:\s*sources\.length[\s\S]*safetyStatus:\s*'PASSED'/,
  'Generated POI materials should carry import id, source platforms, reviewed official sources and PASSED safety status'
)

assert.match(
  helper,
  /type:\s*'inspiration-image'[\s\S]*importId:\s*importPackage\.importId[\s\S]*sourcePolicy:\s*'不保存第三方平台原文'/,
  'Image materials should be tied to the same import id and privacy policy'
)

assert.match(
  inspiration,
  /import \{[\s\S]*createXichengInspirationImportPackage[\s\S]*createXichengInspirationRouteMaterials[\s\S]*createXichengInspirationImportRecord[\s\S]*\} from '@\/request\/xunjing\/inspirationImport\.js'/,
  'Inspiration page should use the copy-homework functional helper'
)

assert.match(
  inspiration,
  /refreshInspirationImportPackage\(\{ includeImageOnly = false \} = \{\}\)[\s\S]*this\.importPackage = createXichengInspirationImportPackage\(\{[\s\S]*rawText:\s*this\.rawText[\s\S]*imagePath:\s*this\.imagePath[\s\S]*target:\s*this\.target/,
  'Inspiration page should refresh one authoritative import package from the current input'
)

assert.match(
  inspiration,
  /saveInspirationRoute\(\{ silent = false, includeImageOnly = false \} = \{\}\)[\s\S]*this\.refreshInspirationImportPackage\(\{ includeImageOnly \}\)[\s\S]*const importPackage = this\.importPackage[\s\S]*createXichengInspirationRouteMaterials\(importPackage\)/,
  'Saving should persist materials from the same generated import package that the route preview uses'
)

assert.doesNotMatch(
  `${helper}\n${inspiration}`,
  /fetch\(|uni\.request\(|\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Copy-homework import should stay local in APP and must not introduce backend calls or secrets'
)
