import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')
const serviceHandoff = read('request', 'xunjing', 'serviceHandoff.js')

for (const required of [
  'createXichengServiceHandoffEvidenceFields',
  'serviceHandoffActionKey',
  'serviceHandoffTaskType',
  'serviceHandoffIntent',
  'serviceHandoffIntentText',
  'serviceHandoffStepText',
  'serviceHandoffSummary',
  'serviceHandoffRequiresRealSystem'
]) {
  assert.ok(`${aiGuide}\n${serviceHandoff}`.includes(required), `Service handoff evidence should expose ${required}`)
}

assert.match(
  serviceHandoff,
  /export const createXichengServiceHandoffEvidenceFields\s*=\s*\(context = \{\}\) => \{[\s\S]*serviceHandoffContext[\s\S]*actionKey[\s\S]*taskType[\s\S]*serviceIntent[\s\S]*serviceHandoffRequiresRealSystem:\s*Boolean\(serviceHandoffContext\.serviceIntent \|\| serviceHandoffContext\.taskType\)/,
  'Service handoff helper should produce bounded evidence fields for materials, AI request payloads, and events'
)

assert.match(
  aiGuide,
  /import \{[^}]*createXichengServiceHandoffEvidenceFields[^}]*\} from '@\/request\/xunjing\/serviceHandoff\.js'/,
  'AI guide should import the shared service handoff evidence helper instead of duplicating extraction logic'
)

assert.match(
  aiGuide,
  /const persistXichengAiGuideMaterial[\s\S]*const material = \{[\s\S]*sourceLabel:\s*'小京讲解'[\s\S]*\.\.\.createXichengServiceHandoffEvidenceFields\(context\)[\s\S]*reviewStatus:\s*XICHENG_REGION_CONFIG\.reviewStatus\.pending/,
  'Persisted Xiaojing answer material should include service handoff evidence before review status'
)

assert.match(
  aiGuide,
  /const requestXunjingAiChat\s*=\s*\(question\) => \{[\s\S]*if \(hasXichengAiContext\(context\)\) \{[\s\S]*requestPayload\.safetyStatus[\s\S]*Object\.assign\(requestPayload,\s*createXichengServiceHandoffEvidenceFields\(context\)\)/,
  'Xiaojing backend request payload should carry service handoff evidence for ops routing'
)

assert.match(
  aiGuide,
  /buildXunjingResourceEventPayload[\s\S]*poiName:\s*payload\.poiName \|\| context\.poiName \|\| ''[\s\S]*\.\.\.createXichengServiceHandoffEvidenceFields\(context\)[\s\S]*safetyStatus:/,
  'Resource event payloads should include service handoff evidence for operations reporting'
)
