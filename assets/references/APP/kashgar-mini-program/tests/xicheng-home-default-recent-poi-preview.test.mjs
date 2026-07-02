import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const home = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'home', 'home.vue'), 'utf8')

for (const required of [
  'createDefaultRecentRecognitionPreview',
  'home-default-official-poi',
  'xicheng-baitasi',
  '白塔寺',
  '西城文旅官方资料库',
  'this.createDefaultRecentRecognitionPreview()'
]) {
  assert.ok(home.includes(required), `Home should expose the approved default recent POI preview: ${required}`)
}

assert.match(
  home,
  /loadRecentRecognition\(\)[\s\S]*this\.recentRecognition = cached && typeof cached === 'object' && \(cached\.poiCode \|\| cached\.poiName\)[\s\S]*\? cached[\s\S]*: this\.createDefaultRecentRecognitionPreview\(\)/,
  'Home should show the approved Baitasi recent card when no safe cached recognition exists'
)

assert.doesNotMatch(
  home.match(/createDefaultRecentRecognitionPreview\(\)[\s\S]*?\n\t\t\},\n\t\treadVisionAgentMemorySessionPackage/)?.[0] || '',
  /uni\.setStorageSync|XICHENG_DEVELOPMENT_TRIGGER_FIXTURE|developmentOnly|notForProduction/,
  'Default recent POI preview must stay in memory and must not reuse development fixtures or write fake recognition cache'
)
