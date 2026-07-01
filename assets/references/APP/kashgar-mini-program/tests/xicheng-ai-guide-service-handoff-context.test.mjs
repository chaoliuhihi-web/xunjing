import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')
const aiGuideCss = read('pages', 'ai-guide', 'ai-guide-xicheng-chat.css')
const routeParams = read('request', 'xunjing', 'routeParams.js')
const serviceHandoff = read('request', 'xunjing', 'serviceHandoff.js')

for (const required of [
  'serviceHandoffContext',
  'createServiceHandoffRouteContext',
  'parseXichengServiceHandoffContext',
  'serviceHandoffTitle',
  'serviceHandoffIntentText',
  'serviceHandoffStepText',
  'serviceHandoffSummary',
  'xichengServiceHandoffContext',
  'xicheng-service-handoff-strip',
  'AI识境服务承接'
]) {
  assert.ok(
    `${scanResult}\n${aiGuide}\n${aiGuideCss}\n${serviceHandoff}`.includes(required),
    `AI guide service handoff continuity should include ${required}`
  )
}

assert.match(
  scanResult,
  /askXiaojing\(question = '', \{ serviceHandoffContext = null \} = \{\}\)[\s\S]*serviceHandoffContext[\s\S]*encodeRouteValue\(JSON\.stringify\(serviceHandoffContext\)\)/,
  'Scan result should allow Xiaojing handoff routes to carry a structured serviceHandoffContext payload'
)

assert.match(
  scanResult,
  /openServiceHandoffPrimaryAction\(\)[\s\S]*const serviceHandoffContext = this\.createServiceHandoffRouteContext\(task\)[\s\S]*this\.askXiaojing\(prompt,\s*\{ serviceHandoffContext \}\)/,
  'Primary service handoff action should pass the selected service task into Xiaojing as structured context'
)

assert.match(
  scanResult,
  /createServiceHandoffRouteContext\(task = \{\}\)[\s\S]*actionTitle[\s\S]*taskTypeLabel[\s\S]*serviceIntentLabel[\s\S]*handoffSummary[\s\S]*handoffSteps[\s\S]*slice\(0,\s*3\)/,
  'Scan result should trim service handoff route context to bounded, reviewable service fields'
)

assert.match(
  serviceHandoff,
  /export const parseXichengServiceHandoffContext\s*=\s*\(value = ''\) => \{[\s\S]*decodeXichengRouteValue\(value\)[\s\S]*JSON\.parse[\s\S]*handoffSteps/,
  'Service handoff helper should parse serviceHandoffContext route JSON and fail closed to an empty service handoff'
)

assert.match(
  aiGuide,
  /normalizeXichengAiContext\s*=\s*\(options = \{\}\) => \([\s\S]*\.\.\.createXichengServiceHandoffRouteContext\(options\.serviceHandoffContext\)/,
  'Normalized Xiaojing context should include service handoff title, intent, step text, and summary from the helper'
)

assert.match(
  aiGuide,
  /const xichengServiceHandoffContext = computed\(\(\) => createXichengServiceHandoffViewContext\(xichengAiContext\.value \|\| \{\}\)\)/,
  'Xicheng Xiaojing should derive a compact visible service handoff context object'
)

assert.match(
  aiGuide,
  /<view v-if="xichengServiceHandoffContext" class="xicheng-service-handoff-strip">[\s\S]*AI识境服务承接[\s\S]*xichengServiceHandoffContext\.intentText[\s\S]*xichengServiceHandoffContext\.stepText/,
  'Xicheng Xiaojing hero should visibly retain service intent and next steps from AI识境'
)

assert.match(
  `${aiGuide}\n${serviceHandoff}`,
  /buildXichengContextQuestion[\s\S]*buildXichengServiceHandoffPromptPrefix\(context\)[\s\S]*服务承接[\s\S]*服务意图[\s\S]*下一步[\s\S]*不要编造可用券、库存或排队结果/,
  'Xiaojing request prompt should include service handoff constraints and anti-fake commerce guidance'
)

assert.match(
  routeParams,
  /createXichengRouteSignature[\s\S]*serviceHandoffContext:\s*decodeXichengRouteValue\(routeOptions\.serviceHandoffContext\)/,
  'Route signature should include serviceHandoffContext so same-page Xiaojing refreshes can switch between service handoffs'
)
