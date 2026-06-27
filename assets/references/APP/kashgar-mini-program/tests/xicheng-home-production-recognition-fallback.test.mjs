import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const home = read('pages', 'xicheng', 'home', 'home.vue')
const triggerRequest = read('request', 'xunjing', 'trigger.js')

assert.doesNotMatch(
  home,
  /resolveTextAndOpenResult\('白塔寺 西城文化点',\s*'scan'\)/,
  'Scan failure should not continue with a hard-coded Baitasi recognition seed in production-facing entrypoints'
)

assert.doesNotMatch(
  home,
  /resolveTextAndOpenResult\('白塔寺 文物说明牌 北京西城',\s*'ocr'\)/,
  'OCR entry should not continue with a hard-coded Baitasi recognition seed'
)

assert.match(
  home,
  /import \{[\s\S]*resolveXichengOcrImageTrigger[\s\S]*\} from '@\/request\/xunjing\/trigger\.js'/,
  'Xicheng home should import a dedicated OCR image trigger helper'
)

assert.match(
  home,
  /startScanRecognition\(\)[\s\S]*fail:\s*\(\)\s*=>\s*\{[\s\S]*handleRecognitionUnavailable\('scan'\)/,
  'Scan failure should surface a no-result state instead of fabricating a POI'
)

assert.match(
  home,
  /startOcrRecognition\(\)[\s\S]*uni\.chooseImage\(\{[\s\S]*resolveXichengOcrImageTrigger\(\{[\s\S]*filePath[\s\S]*ocrText:\s*this\.textRecognitionInput\.trim\(\)[\s\S]*this\.openScanResult\(trigger,\s*'ocr'\)/,
  'OCR recognition should send the selected image and optional typed OCR hint through the backend trigger contract'
)

assert.match(
  home,
  /startGpsRecognition\(\)[\s\S]*const location = await requestCurrentLocationForTrigger\(\)[\s\S]*if\s*\(!location\)\s*\{[\s\S]*this\.handleRecognitionUnavailable\('gps'\)[\s\S]*return[\s\S]*resolveXichengTextTrigger\(\{[\s\S]*source:\s*'gps'[\s\S]*location/,
  'GPS recognition should stop with a user-facing unavailable state when location permission or location data is unavailable'
)

assert.match(
  home,
  /handleRecognitionUnavailable\(source = 'scan'\)[\s\S]*source === 'gps'[\s\S]*无法获取当前位置/,
  'Recognition unavailable copy should include a GPS-specific location permission message'
)

assert.match(
  triggerRequest,
  /export const resolveXichengOcrImageTrigger\s*=\s*async[\s\S]*requestXichengTriggerResolve\(\{[\s\S]*ocrText[\s\S]*photoMeta:\s*buildPhotoMetaForTrigger\(\{ filePath, location, imageInfo, imageBase64 \}\)[\s\S]*normalizeXichengTriggerResult\(result,\s*'ocr'\)/,
  'Trigger facade should expose an OCR image flow that keeps OCR labeled as OCR while using the shared multimodal backend contract'
)

assert.doesNotMatch(
  `${home}\n${triggerRequest}`,
  /COZE_CONFIG|QWEN_API_KEY|DASHSCOPE_API_KEY|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Production-safe recognition fallback work should not introduce client-side AI secrets'
)
