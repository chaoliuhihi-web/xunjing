import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')

for (const required of [
  'domainSceneServiceActions',
  'createDomainSceneServiceActions',
  'serviceIntent',
  'serviceIntentLabel',
  'coupon',
  'order',
  'reservation',
  'ticket',
  'experience',
  'translate',
  '点推荐菜',
  '领优惠',
  '预约/排队',
  '查票务',
  '约体验',
  '翻译导航'
]) {
  assert.ok(scanResult.includes(required), `Vision Agent domain service actions should include ${required}`)
}

assert.match(
  scanResult,
  /sceneServiceActions\(\)[\s\S]*return \[[\s\S]*\.\.\.this\.domainSceneServiceActions[\s\S]*next-stop[\s\S]*travelogue/,
  'Generic scene services should be extended by domain-driven service actions'
)

assert.match(
  scanResult,
  /domainSceneServiceActions\(\)[\s\S]*return this\.createDomainSceneServiceActions\(this\.prioritizedSceneUnderstandingCards\)/,
  'Domain service actions should be derived from the ranked scene-understanding domains'
)

assert.match(
  scanResult,
  /createDomainSceneServiceActions\(cards = \[\]\)[\s\S]*menu[\s\S]*order[\s\S]*coupon[\s\S]*food[\s\S]*merchant[\s\S]*event[\s\S]*ticket[\s\S]*heritage[\s\S]*experience[\s\S]*sign-ocr[\s\S]*translate/,
  'Domain service action factory should map menu, food, event, heritage, and OCR domains to concrete city-service intents'
)

assert.match(
  scanResult,
  /createDomainSceneServiceActions\(cards = \[\]\)[\s\S]*filter\(card => card && Number\(card\.score \|\| 0\) > 0\)/,
  'Domain service actions should only appear when a scene-understanding domain is actually matched'
)

assert.match(
  scanResult,
  /prioritizeSceneServiceActions\(actions = \[\]\)[\s\S]*serviceIntent[\s\S]*sceneDomain[\s\S]*ticket[\s\S]*experience[\s\S]*order/,
  'Scene service ranking should boost concrete domain service intents'
)

assert.match(
  scanResult,
  /rememberVisionAgentServiceTask\(action = \{\}\)[\s\S]*serviceIntent:\s*action\.serviceIntent \|\| ''[\s\S]*serviceIntentLabel:\s*this\.serviceIntentLabel\(action\.serviceIntent \|\| ''\)/,
  'Persisted Vision Agent task-package entries should retain service intent labels'
)

assert.match(
  scanResult,
  /serviceTaskTypeLabel\(taskType = 'service'\)[\s\S]*ticketing[\s\S]*票务[\s\S]*experience[\s\S]*体验[\s\S]*navigation[\s\S]*导航/,
  'Task type labels should distinguish ticketing, experience, and navigation service actions'
)

assert.match(
  travelogue,
  /createVisionAgentServiceTaskMeta\(task = \{\}\)[\s\S]*serviceIntentLabel[\s\S]*sceneDomain[\s\S]*actionPrompt[\s\S]*statusText/,
  'Travelogue task-package metadata should surface service intent labels beside scene domains'
)
