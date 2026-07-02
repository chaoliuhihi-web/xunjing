import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

assert.ok(
  exists('request', 'xunjing', 'inspirationLinkImport.js'),
  'One-click copy-homework should provide a backend link import request layer'
)

const linkImport = read('request', 'xunjing', 'inspirationLinkImport.js')
const inspirationImport = read('request', 'xunjing', 'inspirationImport.js')
const inspiration = read('pages', 'xicheng', 'inspiration', 'inspiration.vue')

for (const required of [
  'XICHENG_INSPIRATION_LINK_IMPORT_API_PATH',
  'app-api/xunjing/inspirations/import-link',
  'requestXichengInspirationLinkImport',
  'normalizeXichengInspirationLinkImportResult',
  'extractXichengPrimaryInspirationLink',
  'buildYudaoAppApiUrl',
  'getXunjingUserTraceId',
  'getYudaoCommonResultPayload',
  'tenant-id',
  'XICHENG_REGION_CONFIG.tenantId',
  'sourcePlatforms',
  'extractedText',
  'sourceUrl',
  'sourceTitle',
  '不保存第三方平台原文'
]) {
  assert.ok(linkImport.includes(required), `Link import request layer should include ${required}`)
}

assert.match(
  linkImport,
  /uni\.request\(\{[\s\S]*url:\s*buildYudaoAppApiUrl\(XICHENG_INSPIRATION_LINK_IMPORT_API_PATH\)[\s\S]*method:\s*'POST'[\s\S]*'tenant-id':\s*XICHENG_REGION_CONFIG\.tenantId[\s\S]*data:\s*\{[\s\S]*regionCode:\s*XICHENG_REGION_CONFIG\.regionCode[\s\S]*packageCode:\s*XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*'xicheng-inspiration-import'[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*userTraceId:\s*getXunjingUserTraceId\(\)[\s\S]*linkUrl/,
  'Link import should call the Yudao APP API with Xicheng context and tenant id'
)

assert.match(
  inspirationImport,
  /linkImportResult[\s\S]*sourceUrl[\s\S]*sourceTitle[\s\S]*linkImported[\s\S]*rawText:\s*''/,
  'Generated import package should keep link metadata and never persist third-party full text'
)

assert.match(
  inspiration,
  /import \{[\s\S]*extractXichengPrimaryInspirationLink[\s\S]*requestXichengInspirationLinkImport[\s\S]*\} from '@\/request\/xunjing\/inspirationLinkImport\.js'/,
  'Inspiration page should use the backend link import request layer'
)

assert.match(
  inspiration,
  /async runExtraction\(\)[\s\S]*const linkUrl = extractXichengPrimaryInspirationLink\(this\.rawText\)[\s\S]*if \(linkUrl\) \{[\s\S]*const imported = await this\.importInspirationLink\(linkUrl\)[\s\S]*if \(imported\) return[\s\S]*if \(this\.isLinkOnlyInput\(this\.rawText\)\) return[\s\S]*this\.refreshInspirationImportPackage\(\)/,
  'Running extraction should fetch supported links first and avoid treating a link-only input as parsed guide text when backend parsing fails'
)

assert.match(
  inspiration,
  /async importInspirationLink\(linkUrl = ''\)[\s\S]*this\.isLinkImporting = true[\s\S]*const linkImportResult = await requestXichengInspirationLinkImport\(\{[\s\S]*linkUrl,[\s\S]*target:\s*this\.target[\s\S]*\}\)[\s\S]*if \(!linkImportResult\.extractedText\)[\s\S]*this\.showInspirationLinkUnavailable\(\)[\s\S]*this\.linkImportResult = linkImportResult[\s\S]*this\.refreshInspirationImportPackage\(\{ linkImportResult \}\)/,
  'Inspiration page should build the route from backend extracted link content, not from the URL string'
)

assert.doesNotMatch(
  linkImport,
  /fetch\(|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Link import request layer should not use raw fetch or introduce secrets'
)
