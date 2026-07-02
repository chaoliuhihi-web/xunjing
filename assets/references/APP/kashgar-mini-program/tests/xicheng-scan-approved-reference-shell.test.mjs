import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scan = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan', 'scan.vue'), 'utf8')

for (const required of [
  'scan-reference-page',
  'scan-reference-topbar',
  'scan-reference-hero',
  'scan-reference-camera',
  'scan-reference-viewfinder',
  'scan-reference-auto-card',
  'scan-reference-mode-chip',
  'scan-reference-nearby-card',
  '附近可能是：',
  '白塔寺片区',
  'showAdvancedScanContext'
]) {
  assert.ok(scan.includes(required), `Approved scan reference shell should include ${required}`)
}

assert.match(
  scan,
  /<view class="scan-reference-camera[\s\S]*<image[\s\S]*scene-baitasi-waterfront\.jpg[\s\S]*class="scan-reference-viewfinder"/,
  'Scan page should render the approved large camera viewfinder using the bundled Xicheng bitmap asset'
)

assert.match(
  scan,
  /class="scan-reference-auto-card[\s\S]*自动识别中：[\s\S]*v-for="mode in scanRecognitionModes"[\s\S]*{{ mode }}/,
  'Scan page should expose the approved automatic recognition card without separate mode buttons'
)

assert.match(
  scan,
  /showAdvancedScanContext:\s*false/,
  'Scene Engine and Agent detail panels should be hidden from the default approved scan screen'
)

assert.doesNotMatch(
  scan,
  /@click="startPhotoRecognition"|@click="startGpsRecognition"|@click="startOcrRecognition"|@click="startTextRecognition"/,
  'Approved scan screen must keep one automatic recognition action instead of multiple recognition buttons'
)
