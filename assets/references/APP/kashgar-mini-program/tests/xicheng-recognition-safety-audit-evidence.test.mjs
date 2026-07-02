import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')

const startRecordingBlock = scanResult.match(/startRecording\(\)[\s\S]*?\n\t+\},\n\t\tcreateRouteCheckinEvent/)?.[0] || ''
const createCheckinBlock = scanResult.match(/createRouteCheckinEvent\(material\)[\s\S]*?\n\t\t\},\n\t\tpersistRouteCheckinEvent/)?.[0] || ''
const createFeedbackBlock = scanResult.match(/createRecognitionFeedback\(feedbackType = 'correct'\)[\s\S]*?\n\t\t\},\n\t\tpersistRecognitionFeedback/)?.[0] || ''

assert.ok(startRecordingBlock, 'Recognition result should expose startRecording')
assert.ok(createCheckinBlock, 'Recognition result should expose createRouteCheckinEvent')
assert.ok(createFeedbackBlock, 'Recognition result should expose createRecognitionFeedback')

assert.match(
  startRecordingBlock,
  /safetyStatus:\s*normalizeXichengSafetyStatus\(this\.result\.safetyStatus\)/,
  'Recognition materials saved for travelogue review should preserve normalized backend safetyStatus'
)

assert.match(
  createCheckinBlock,
  /safetyStatus:\s*normalizeXichengSafetyStatus\(material\.safetyStatus\)/,
  'Route check-in events should preserve normalized recognition safetyStatus for operations audit'
)

assert.match(
  createFeedbackBlock,
  /safetyStatus:\s*normalizeXichengSafetyStatus\(this\.result\.safetyStatus\)/,
  'Recognition feedback records should preserve normalized safetyStatus with POI correction evidence'
)

assert.match(
  scanResult,
  /submitRecognitionFeedback\(feedbackType = 'correct'\)[\s\S]*const feedback = this\.createRecognitionFeedback\(feedbackType\)[\s\S]*this\.persistRecognitionFeedback\(feedback\)/,
  'Recognition feedback should continue to persist through the local reviewable feedback flow'
)

assert.doesNotMatch(
  scanResult,
  /Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Safety audit evidence should not introduce client-side AI secrets'
)
