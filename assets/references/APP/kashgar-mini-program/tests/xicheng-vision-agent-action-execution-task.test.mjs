import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')

for (const required of [
  'rememberVisionAgentExecutionTask',
  'createVisionAgentActionPrompt',
  'actionPrompt',
  'agentDecisionActionKey',
  '已进入小京执行',
  'Agent'
]) {
  assert.ok(scanResult.includes(required), `Vision Agent action execution should persist task package data: ${required}`)
}

assert.match(
  scanResult,
  /openVisionAgentAction\(action = \{\}\)[\s\S]*const prompt = this\.createVisionAgentActionPrompt\(action\)[\s\S]*this\.rememberVisionAgentExecutionTask\(action,\s*prompt\)[\s\S]*this\.askXiaojing\(prompt\)/,
  'Tapping a Vision Agent action should persist an execution task before handing off to Xiaojing'
)

assert.match(
  scanResult,
  /createVisionAgentActionPrompt\(action = \{\}\)[\s\S]*photo-spot[\s\S]*video-brief[\s\S]*deep-history[\s\S]*kids-story[\s\S]*english/,
  'Vision Agent prompts should stay centralized so the persisted task and Xiaojing handoff use the same intent'
)

assert.match(
  scanResult,
  /rememberVisionAgentExecutionTask\(action = \{\}, prompt = ''\)[\s\S]*rememberVisionAgentServiceTask\(\{[\s\S]*taskType:\s*'agent'[\s\S]*actionPrompt:\s*prompt[\s\S]*status:\s*'handoff'[\s\S]*statusText:\s*'已进入小京执行'/,
  'Execution tasks should use the existing task-package persistence with an Agent handoff status and prompt'
)

assert.match(
  scanResult,
  /serviceTaskTypeLabel\(taskType = 'service'\)[\s\S]*taskType === 'agent'[\s\S]*return 'Agent'/,
  'Task type labels should distinguish Agent execution tasks from service tasks'
)

assert.match(
  travelogue,
  /createVisionAgentServiceTaskMeta\(task = \{\}\)[\s\S]*actionPrompt[\s\S]*statusText/,
  'Travelogue task package should surface Agent execution prompts in task metadata'
)
