import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

const pagesJson = read('pages.json')
const home = read('pages', 'xicheng', 'home', 'home.vue')

assert.ok(
  exists('pages', 'xicheng', 'scan', 'scan.vue'),
  'Xicheng P0 should have a dedicated scan page for the approved single-entry auto recognition flow'
)

const scan = read('pages', 'xicheng', 'scan', 'scan.vue')

assert.match(
  pagesJson,
  /"path":\s*"pages\/xicheng\/scan\/scan"[\s\S]*"navigationBarTitleText":\s*"扫一扫"/,
  'pages.json should register pages/xicheng/scan/scan as the Xicheng scan entry'
)

assert.match(
  home,
  /startScanRecognition\(\)[\s\S]*uni\.navigateTo\(\{[\s\S]*url:\s*`\/pages\/xicheng\/scan\/scan\?/,
  'Home "扫一扫" should open the dedicated scan page instead of running hidden recognition from the home page'
)

assert.match(
  home,
  /regionCode=\$\{encodeRouteValue\(this\.region\.regionCode\)\}[\s\S]*packageCode=\$\{encodeRouteValue\(this\.region\.packageCode\)\}[\s\S]*sourceChannel=\$\{encodeRouteValue\(this\.region\.sourceChannel\)\}/,
  'Home scan entry should preserve Xicheng region, package, and source channel context'
)

assert.match(
  scan,
  /<button[^>]*class="primary-button xicheng-primary-action scan-primary-button"[^>]*@click="startAutoRecognition"[\s\S]*开始自动识别/,
  'Scan page should expose one primary auto recognition button'
)

assert.doesNotMatch(
  scan,
  /@click="startPhotoRecognition"|@click="startGpsRecognition"|@click="startOcrRecognition"|@click="startTextRecognition"/,
  'Scan page should not turn the approved single-entry scan page into separate mode buttons'
)

for (const required of [
  '二维码',
  '照片',
  'OCR文字',
  '地点线索',
  '路线图',
  'resolveXichengTextTrigger',
  'resolveXichengPhotoTrigger',
  'requestCurrentLocationForTrigger',
  'XICHENG_REGION_CONFIG',
  'openScanResult',
  'tenantId'
]) {
  assert.ok(scan.includes(required), `Scan page should include ${required}`)
}

assert.match(
  scan,
  /uni\.scanCode\([\s\S]*success:\s*async \(res\) => \{[\s\S]*this\.resolveTextAndOpenResult\(res\.result/,
  'Scan page should try QR/barcode text through the shared Xicheng trigger flow'
)

assert.match(
  scan,
  /uni\.chooseImage\([\s\S]*sourceType:\s*\['camera',\s*'album'\][\s\S]*resolveXichengPhotoTrigger/,
  'Scan page should use one camera/album chooser for photo, OCR, and route-map recognition signals'
)

assert.match(
  scan,
  /uni\.navigateTo\(\{[\s\S]*\/pages\/xicheng\/scan-result\/scan-result\?source=\$\{encodeRouteValue\(source\)\}[\s\S]*regionCode=\$\{encodeRouteValue\(result\.regionCode/,
  'Scan page should navigate to scan-result with source plus Xicheng region/package/POI context'
)

assert.doesNotMatch(
  scan,
  /Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Scan page should not introduce client-side AI secrets'
)
