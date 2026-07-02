import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const questionsCardPath = path.join(root, 'components', 'xicheng', 'XichengScanResultQuestionsCard.vue')

assert.ok(
  fs.existsSync(questionsCardPath),
  'Recognition result suggested questions should live in XichengScanResultQuestionsCard instead of growing scan-result.vue'
)

const questionsCard = fs.readFileSync(questionsCardPath, 'utf8')

assert.match(
  scanResult,
  /import XichengScanResultQuestionsCard from '@\/components\/xicheng\/XichengScanResultQuestionsCard\.vue'[\s\S]*components:[\s\S]*XichengScanResultQuestionsCard/,
  'Recognition result page should import and register the split suggested-questions card'
)

assert.match(
  scanResult,
  /<xicheng-scan-result-questions-card[\s\S]*:section-title="questionSectionTitle"[\s\S]*:questions="suggestedQuestions"[\s\S]*:recognition-action-blocked="recognitionActionBlocked"[\s\S]*:empty-copy="questionEmptyCopy"[\s\S]*@ask="askXiaojing"/,
  'Recognition result page should pass safety-aware questions, blocked state, and empty copy into the questions card'
)

assert.match(
  questionsCard,
  /<view class="question-card xicheng-paper-card">[\s\S]*<text class="section-title">\{\{ sectionTitle \}\}<\/text>/,
  'Questions card should preserve the approved paper-card visual shell and dynamic section title'
)

assert.match(
  questionsCard,
  /v-for="question in questions"[\s\S]*class="question-row"[\s\S]*:class="\{ 'question-row-disabled': recognitionActionBlocked \}"[\s\S]*@click="handleAsk\(question\)"/,
  'Questions card should render suggested questions and keep the blocked visual state'
)

assert.match(
  questionsCard,
  /<text v-if="questions\.length === 0" class="question-empty">\{\{ emptyCopy \}\}<\/text>/,
  'Questions card should show the BLOCKED empty copy when no reviewed-source question is allowed'
)

assert.match(
  questionsCard,
  /handleAsk\(question\) \{[\s\S]*if \(this\.recognitionActionBlocked\) return[\s\S]*this\.\$emit\('ask', question\)/,
  'Questions card should fail closed locally and emit safe questions back to the page'
)
