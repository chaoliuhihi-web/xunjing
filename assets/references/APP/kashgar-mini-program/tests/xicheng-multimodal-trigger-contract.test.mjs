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
  "packageCode: 'XICHENG-MAP-001'",
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
  /export const buildPhotoMetaForTrigger[\s\S]*imageId[\s\S]*imageUrl[\s\S]*takenAt[\s\S]*imageMimeType[\s\S]*imageWidth[\s\S]*imageHeight[\s\S]*imageBase64[\s\S]*exifLocation/,
  'Photo trigger payload should keep image id, local path, capture time, MIME, dimensions, base64, and EXIF/current location for travel notes and backend vision recognition'
)

assert.match(
  triggerModule,
  /export const readLocalImageBase64ForTrigger[\s\S]*getFileSystemManager\(\)[\s\S]*encoding:\s*'base64'[\s\S]*MAX_VISION_IMAGE_BASE64_CHARS/,
  'Photo trigger helper should read bounded local image base64 for backend vision recognition without exposing model keys in the client'
)

assert.match(
  triggerModule,
  /export const requestImageInfoForTrigger[\s\S]*uni\.getImageInfo[\s\S]*toImageMimeType/,
  'Photo trigger helper should read local image dimensions and MIME for backend vision recognition'
)

assert.match(
  triggerModule,
  /export const inferImageLabelsFromLocalHints[\s\S]*white_pagoda[\s\S]*imperial_garden[\s\S]*imperial_temple[\s\S]*hutong/,
  'Photo trigger helper should keep deterministic image-label fallback hints for Xicheng field fixtures when backend vision provider is not configured'
)

assert.match(
  triggerModule,
  /export const resolveXunjingPhotoTrigger\s*=\s*async[\s\S]*Promise\.all\(\[[\s\S]*requestCurrentLocationForTrigger\(\)[\s\S]*requestImageInfoForTrigger\(filePath\)[\s\S]*readLocalImageBase64ForTrigger\(filePath\)[\s\S]*photoMeta:\s*buildPhotoMetaForTrigger\(\{ filePath, location, imageInfo, imageBase64 \}\)/,
  'Photo trigger helper should combine photo bytes, image metadata, location, fallback labels, and OCR text before calling backend'
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
