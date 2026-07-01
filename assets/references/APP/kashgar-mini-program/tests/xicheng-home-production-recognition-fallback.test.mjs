import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const home = read('pages', 'xicheng', 'home', 'home.vue')
const scan = read('pages', 'xicheng', 'scan', 'scan.vue')
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
  /import \{ isXunjingUserCancelled \} from '@\/request\/xunjing\/userCancel\.js'/,
  'Xicheng home should reuse the shared user-cancel helper instead of duplicating picker and scanner cancellation checks'
)

assert.doesNotMatch(
  home,
  /isXicheng(?:Scan|ImageSelection)Cancel\(err = \{\}\)/,
  'Xicheng home should not duplicate local cancellation helpers once the shared helper exists'
)

assert.match(
  home,
  /startScanRecognition\(\)\s*\{[\s\S]*if\s*\(this\.recognizing\)\s*return[\s\S]*const entry = 'home-primary'[\s\S]*this\.buildSceneVisionEntryUrl\(this\.buildSceneVisionContext\(\), entry\)/,
  'Home AI识境 recognition should ignore duplicate quick-card taps and open the dedicated single-entry scan page through the context builder'
)

assert.match(
  scan,
  /startAutoRecognition\(\)\s*\{[\s\S]*if\s*\(this\.recognizing\)\s*return[\s\S]*uni\.scanCode/,
  'Scan page auto recognition should ignore duplicate taps while another recognition flow is already running'
)

const actionCardDisabledBindings = home.match(/'home-action-disabled': recognizing/g) || []
assert.equal(
  actionCardDisabledBindings.length,
  2,
  'The approved single-entry scan card and Xiaojing card should show a disabled busy state while recognition is running'
)

assert.match(
  home,
  /askXiaojing\(\)\s*\{[\s\S]*if\s*\(this\.recognizing\)\s*return[\s\S]*uni\.navigateTo/,
  'Xiaojing entry should not navigate away while a recognition flow is running'
)

assert.match(
  home,
  /startTextRecognition\(\)\s*\{[\s\S]*if\s*\(this\.recognizing\)\s*return[\s\S]*const text = this\.textRecognitionInput\.trim\(\)/,
  'Text recognition should not open the text panel or retry while another recognition flow is running'
)

assert.match(
  scan,
  /startAutoRecognition\(\)[\s\S]*fail:\s*\(err\)\s*=>\s*\{[\s\S]*if\s*\(isXunjingUserCancelled\(err\)\) return[\s\S]*this\.chooseAutoRecognitionImage\(\)/,
  'Scan page should ignore normal scanner cancellation and only fall through to image recognition for non-cancel scanner failures'
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
  /startOcrRecognition\(\)[\s\S]*fail:\s*\(err\)\s*=>\s*\{[\s\S]*if\s*\(isXunjingUserCancelled\(err\)\)\s*\{[\s\S]*return[\s\S]*this\.handleRecognitionUnavailable\('ocr'\)/,
  'OCR recognition should ignore normal image picker cancellation and only surface unavailable state for non-cancel failures'
)

assert.match(
  home,
  /startPhotoRecognition\(\)[\s\S]*fail:\s*\(err\)\s*=>\s*\{[\s\S]*if\s*\(isXunjingUserCancelled\(err\)\)\s*\{[\s\S]*return[\s\S]*this\.handleRecognitionUnavailable\('photo'\)/,
  'Photo recognition should ignore normal image picker cancellation and only surface unavailable state for non-cancel failures'
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
  home,
  /handleRecognitionServiceFailure\(source = 'scan', error = null\)[\s\S]*const message = source === 'gps'[\s\S]*定位识别服务暂不可用[\s\S]*source === 'photo'[\s\S]*拍照识别服务暂不可用[\s\S]*source === 'ocr'[\s\S]*OCR识别服务暂不可用[\s\S]*西城识别服务暂不可用[\s\S]*this\.lastError = message[\s\S]*uni\.showToast/,
  'Recognition backend failures such as Yudao CommonResult 401 should show source-specific service-unavailable copy instead of raw backend auth errors'
)

assert.match(
  home,
  /resolveTextAndOpenResult\(text = '', source = 'ocr'\)[\s\S]*catch \(error\) \{[\s\S]*this\.handleRecognitionServiceFailure\(source, error\)/,
  'Text recognition should fail closed through the shared service-unavailable handler'
)

assert.match(
  scan,
  /resolveTextAndOpenResult\(text = '', source = 'scan'\)[\s\S]*catch \(error\) \{[\s\S]*this\.handleRecognitionServiceFailure\(source, error\)/,
  'Dedicated scan page text recognition should fail closed through the shared service-unavailable handler'
)

assert.match(
  home,
  /startOcrRecognition\(\)[\s\S]*catch \(error\) \{[\s\S]*this\.handleRecognitionServiceFailure\('ocr', error\)/,
  'OCR recognition should fail closed through the shared service-unavailable handler'
)

assert.match(
  home,
  /startGpsRecognition\(\)[\s\S]*catch \(error\) \{[\s\S]*this\.handleRecognitionServiceFailure\('gps', error\)/,
  'GPS recognition should fail closed through the shared service-unavailable handler'
)

assert.match(
  home,
  /startPhotoRecognition\(\)[\s\S]*catch \(error\) \{[\s\S]*this\.handleRecognitionServiceFailure\('photo', error\)/,
  'Photo recognition should fail closed through the shared service-unavailable handler'
)

assert.match(
  triggerRequest,
  /export const resolveXichengOcrImageTrigger\s*=\s*async[\s\S]*requestXichengTriggerResolve\(\{[\s\S]*ocrText[\s\S]*photoMeta:\s*buildPhotoMetaForTrigger\(\{ filePath, location, imageInfo, imageBase64 \}\)[\s\S]*normalizeXichengTriggerResult\(result,\s*'ocr'\)/,
  'Trigger facade should expose an OCR image flow that keeps OCR labeled as OCR while using the shared multimodal backend contract'
)

assert.doesNotMatch(
  `${home}\n${scan}\n${triggerRequest}`,
  /COZE_CONFIG|QWEN_API_KEY|DASHSCOPE_API_KEY|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Production-safe recognition fallback work should not introduce client-side AI secrets'
)
