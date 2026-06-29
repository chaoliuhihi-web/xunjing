import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')
const uploadBlock = aiGuide.match(/const uploadAndSendImage\s*=\s*async\s*\(filePath\) => \{[\s\S]*?\n\}/)?.[0] || ''
const followUpsBlock = aiGuide.match(/const createXunjingTriggerFollowUps\s*=\s*\(trigger\) => \{[\s\S]*?\n\}/)?.[0] || ''

assert.match(
  aiGuide,
  /import \{ resolveXichengPhotoTrigger \} from '@\/request\/xunjing\/trigger\.js'/,
  'AI guide photo upload should use the Xicheng trigger facade so sources, suggestedQuestions, and safetyStatus are normalized'
)

assert.doesNotMatch(
  aiGuide,
  /import \{ resolveXunjingPhotoTrigger \} from '@\/request\/xunjingMultimodal\.js'/,
  'AI guide photo upload should not bypass the Xicheng trigger facade with the generic multimodal resolver'
)

assert.match(
  aiGuide,
  /const applyXichengPhotoTriggerContext\s*=\s*\(trigger = \{\}\) => \{[\s\S]*const safetyStatus = normalizeXichengSafetyStatus\(trigger\.safetyStatus\)[\s\S]*const unsafeSafetyStatus = isXichengUnsafeSafetyStatus\(safetyStatus\)[\s\S]*sources:\s*unsafeSafetyStatus \? \[\] : normalizeXichengReviewedSources\(trigger\.sources\)[\s\S]*suggestedQuestions:\s*unsafeSafetyStatus \? \[\] : Array\.isArray\(trigger\.suggestedQuestions\) \? trigger\.suggestedQuestions : \[\][\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.storageKey, recognitionContext\)[\s\S]*xichengAiContext\.value = \{[\s\S]*\.\.\.recognitionContext/,
  'AI guide should apply a successful photo trigger to the active Xicheng context and recognition cache'
)

assert.match(
  uploadBlock,
  /resolveXichengPhotoTrigger\(\{[\s\S]*filePath[\s\S]*ocrText:\s*inputText\.value[\s\S]*activeRecognitionContext = applyXichengPhotoTriggerContext\(trigger\)[\s\S]*loadXunjingPackageDetail\(activeRecognitionContext\)/,
  'AI guide photo recognition should update Xiaojing context before the next question is sent'
)

assert.match(
  uploadBlock,
  /commitAssistantMessage\(assistantMessage,\s*\{[\s\S]*followUps:\s*createXunjingTriggerFollowUps\(trigger\)[\s\S]*sources:\s*activeRecognitionContext\.sources[\s\S]*safetyStatus:\s*activeRecognitionContext\.safetyStatus/,
  'AI guide photo recognition message should display reviewed sources and carry safetyStatus'
)

assert.match(
  aiGuide,
  /const buildXunjingTriggerAssistantContent\s*=\s*\(trigger\) => \{[\s\S]*const safetyStatus = normalizeXichengSafetyStatus\(trigger\.safetyStatus\)[\s\S]*safetyStatus === 'BLOCKED'[\s\S]*XICHENG_BLOCKED_ANSWER[\s\S]*safetyStatus === 'UNAVAILABLE'[\s\S]*XICHENG_UNAVAILABLE_ANSWER/,
  'AI guide photo recognition copy should fail closed for BLOCKED and UNAVAILABLE trigger results'
)

assert.match(
  aiGuide,
  /const createXunjingTriggerFollowUps\s*=\s*\(trigger\) => \{[\s\S]*const safetyStatus = normalizeXichengSafetyStatus\(trigger && trigger\.safetyStatus\)[\s\S]*isXichengUnsafeSafetyStatus\(safetyStatus\)[\s\S]*return \[\][\s\S]*Array\.isArray\(trigger\.suggestedQuestions\)/,
  'AI guide photo recognition should not create local follow-ups for unsafe trigger results and should prefer backend suggestedQuestions'
)

assert.ok(
  followUpsBlock.indexOf('isXichengUnsafeSafetyStatus(safetyStatus)') <
    followUpsBlock.indexOf('!trigger || !trigger.poiName'),
  'AI guide photo recognition should check unsafe safetyStatus before creating generic no-POI follow-ups'
)

assert.match(
  uploadBlock,
  /catch \(error\) \{[\s\S]*activeRecognitionContext = \{[\s\S]*safetyStatus:\s*'UNAVAILABLE'[\s\S]*sources:\s*\[\][\s\S]*content = XICHENG_UNAVAILABLE_ANSWER/,
  'AI guide photo recognition failure should fail closed with the reviewed-source unavailable answer, no sources, and UNAVAILABLE safetyStatus'
)
