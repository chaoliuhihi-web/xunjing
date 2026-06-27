import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const triggerModule = fs.readFileSync(path.join(root, 'request', 'xunjingMultimodal.js'), 'utf8')
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')
const home = fs.readFileSync(path.join(root, 'pages', 'index', 'index.vue'), 'utf8')

for (const required of [
  "apiPath: 'app-api/xunjing/triggers/resolve'",
  "regionCode: 'beijing-xicheng'",
  "sceneCode: 'xicheng-multimodal-trigger'",
  "sourceChannel: 'APP_UNIAPP'",
  "'tenant-id': XUNJING_MULTIMODAL_TRIGGER_CONFIG.tenantId",
  'text',
  'ocrText',
  'location: normalizedLocation',
  'photoMeta',
  'imageLabels',
  'recentPoiCodes',
  'userTraceId: getXunjingUserTraceId()'
]) {
  assert.ok(triggerModule.includes(required), `Multimodal trigger module should include ${required}`)
}

assert.match(
  triggerModule,
  /export const requestCurrentLocationForTrigger[\s\S]*uni\.getLocation\(\{[\s\S]*type:\s*'gcj02'[\s\S]*isHighAccuracy:\s*true/,
  'Multimodal trigger module should collect GCJ-02 high-accuracy location for field tests'
)

assert.match(
  triggerModule,
  /export const buildPhotoMetaForTrigger[\s\S]*imageId[\s\S]*imageUrl[\s\S]*takenAt[\s\S]*exifLocation/,
  'Photo trigger payload should keep image id, local path, capture time, and EXIF/current location for travel notes'
)

assert.match(
  triggerModule,
  /export const inferImageLabelsFromLocalHints[\s\S]*white_pagoda[\s\S]*imperial_garden[\s\S]*imperial_temple[\s\S]*hutong/,
  'MVP should provide deterministic image-label hints for Xicheng field fixtures before native vision plugins are wired'
)

assert.match(
  triggerModule,
  /export const resolveXunjingPhotoTrigger\s*=\s*async[\s\S]*requestCurrentLocationForTrigger\(\)[\s\S]*return resolveXunjingMultimodalTrigger\(\{[\s\S]*photoMeta:\s*buildPhotoMetaForTrigger\(\{ filePath, location \}\)/,
  'Photo trigger helper should combine photo, location, labels, and OCR text before calling backend'
)

assert.match(
  aiGuide,
  /resolveXunjingPhotoTrigger\(\{[\s\S]*filePath[\s\S]*text:\s*inputText\.value[\s\S]*ocrText:\s*inputText\.value/,
  'AI guide photo entry should pass local photo and OCR/text hints to multimodal trigger'
)

assert.match(
  home,
  /import \{ resolveXunjingMultimodalTrigger, requestCurrentLocationForTrigger \} from '@\/request\/xunjingMultimodal\.js'/,
  'Home scan entry should reuse the shared multimodal trigger request helpers'
)

assert.match(
  home,
  /requestXunjingMultimodalTriggerFromText\(text = ''\)[\s\S]*this\.currentLocation \|\| await requestCurrentLocationForTrigger\(\)[\s\S]*ocrText:\s*text/,
  'Home scan fallback should combine OCR-like scanned text with current location'
)

assert.match(
  home,
  /normalizeXunjingTriggerTargetPath\(trigger = \{\}\)[\s\S]*intent: trigger\.intent[\s\S]*trigger:\s*'multimodal'[\s\S]*\/pages\/ai-guide\/ai-guide/,
  'Home page should map backend trigger actions to existing APP routes instead of nonexistent detail pages'
)

assert.doesNotMatch(
  `${triggerModule}\n${aiGuide}\n${home}`,
  /Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|uni\.uploadFile\(/,
  'Multimodal MVP should not expose AI vendor secrets or upload photos directly from the client'
)
