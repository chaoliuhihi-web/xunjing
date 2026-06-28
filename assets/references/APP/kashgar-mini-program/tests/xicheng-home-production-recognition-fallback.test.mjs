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
  /confirmImageRecognitionPurpose\(actionLabel = '图片识别'\)[\s\S]*uni\.showModal\(\{[\s\S]*title:\s*`\$\{actionLabel\}用途说明`[\s\S]*仅用于本次西城 POI 识别[\s\S]*不默认公开[\s\S]*不会用于模型评估或运营纠错，除非你另行授权/,
  'Image recognition should explain purpose, non-public default, and no model-evaluation or ops-correction reuse before opening camera or album'
)

assert.match(
  home,
  /startOcrRecognition\(\)[\s\S]*const confirmed = await this\.confirmImageRecognitionPurpose\('OCR识别'\)[\s\S]*if \(!confirmed\) return[\s\S]*uni\.chooseImage/,
  'OCR image recognition should ask for image-use confirmation before opening the camera or album picker'
)

assert.match(
  home,
  /startPhotoRecognition\(\)[\s\S]*const confirmed = await this\.confirmImageRecognitionPurpose\('拍照识别'\)[\s\S]*if \(!confirmed\) return[\s\S]*uni\.chooseImage\(\{[\s\S]*const filePath = res\.tempFilePaths[\s\S]*if\s*\(!filePath\)\s*\{[\s\S]*this\.handleRecognitionUnavailable\('photo'\)[\s\S]*return[\s\S]*resolveXichengPhotoTrigger\(\{ filePath \}\)/,
  'Photo recognition should surface an unavailable state when camera or album returns no image file'
)

assert.match(
  home,
  /startPhotoRecognition\(\)[\s\S]*fail:\s*\(\)\s*=>\s*\{[\s\S]*this\.handleRecognitionUnavailable\('photo'\)/,
  'Photo recognition should surface an unavailable state when the user cancels or camera permission fails'
)

assert.match(
  home,
  /startGpsRecognition\(\)[\s\S]*const location = await requestCurrentLocationForTrigger\(\)[\s\S]*if\s*\(!location\)\s*\{[\s\S]*this\.handleRecognitionUnavailable\('gps'\)[\s\S]*return[\s\S]*resolveXichengTextTrigger\(\{[\s\S]*source:\s*'gps'[\s\S]*location/,
  'GPS recognition should stop with a user-facing unavailable state when location permission or location data is unavailable'
)

assert.match(
  home,
  /handleRecognitionUnavailable\(source = 'scan'\)[\s\S]*source === 'gps'[\s\S]*无法获取当前位置[\s\S]*source === 'photo'[\s\S]*未获得可识别照片/,
  'Recognition unavailable copy should include GPS and photo-specific permission messages'
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
