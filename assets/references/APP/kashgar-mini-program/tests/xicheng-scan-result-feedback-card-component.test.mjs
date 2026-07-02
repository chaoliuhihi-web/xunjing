import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResultPath = path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue')
const feedbackCardPath = path.join(root, 'components', 'xicheng', 'XichengScanResultFeedbackCard.vue')

const scanResult = fs.readFileSync(scanResultPath, 'utf8')
const feedbackCard = fs.readFileSync(feedbackCardPath, 'utf8')
const template = scanResult.match(/<template>[\s\S]*?<\/template>/)?.[0] || ''

assert.ok(template, 'Recognition result page should have a template')

assert.match(
  scanResult,
  /import XichengScanResultFeedbackCard from '@\/components\/xicheng\/XichengScanResultFeedbackCard\.vue'/,
  'Recognition result page should import the split feedback card component'
)

assert.match(
  scanResult,
  /XichengScanResultFeedbackCard/,
  'Recognition result page should register the split feedback card component'
)

assert.match(
  template,
  /<xicheng-scan-result-feedback-card[\s\S]*:feedback-note="feedbackNote"[\s\S]*:recognition-feedback="recognitionFeedback"[\s\S]*@update:feedback-note="feedbackNote = \$event"[\s\S]*@submit-feedback="submitRecognitionFeedback"[\s\S]*@withdraw-feedback="withdrawRecognitionFeedback"[\s\S]*\/>/,
  'Recognition result page should delegate recognition feedback UI while keeping persistence methods in the page shell'
)

assert.ok(
  !template.includes('class="feedback-card xicheng-paper-card"'),
  'Recognition result page shell should not keep inline feedback card markup after the split'
)

for (const token of [
  'class="feedback-card xicheng-paper-card"',
  '识别反馈',
  '待反馈',
  '识别准确',
  '识别有误',
  '撤回反馈',
  'feedback-input',
  'feedback-actions',
  'source-empty'
]) {
  assert.ok(feedbackCard.includes(token), `Split feedback card should keep ${token}`)
}

assert.match(
  feedbackCard,
  /props:[\s\S]*feedbackNote:[\s\S]*recognitionFeedback:/,
  'Split feedback card should accept the current note and persisted feedback state as props'
)

assert.match(
  feedbackCard,
  /emits:\s*\[[\s\S]*'update:feedback-note'[\s\S]*'submit-feedback'[\s\S]*'withdraw-feedback'[\s\S]*\]/,
  'Split feedback card should emit note updates, submit, and withdraw events'
)

assert.match(
  feedbackCard,
  /v-model="draftFeedbackNote"[\s\S]*@input="updateFeedbackNote"/,
  'Split feedback card should bind the UniApp textarea to a local draft so parent resets clear the visible input'
)

assert.match(
  feedbackCard,
  /data\(\)[\s\S]*draftFeedbackNote:\s*this\.feedbackNote/,
  'Split feedback card should initialize a local feedback note draft from the parent prop'
)

assert.match(
  feedbackCard,
  /watch:[\s\S]*feedbackNote\(value\)[\s\S]*this\.draftFeedbackNote = value/,
  'Split feedback card should resync the local draft when the parent clears feedbackNote'
)

assert.match(
  feedbackCard,
  /updateFeedbackNote\(event\)[\s\S]*this\.draftFeedbackNote = event\.detail\.value[\s\S]*\$emit\('update:feedback-note', this\.draftFeedbackNote\)/,
  'Split feedback card should emit explicit note updates from the local draft'
)

assert.ok(
  scanResult.split('\n').length < 1967,
  'Component split should reduce scan-result.vue below its previous 1967 line count'
)
