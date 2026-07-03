import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const regionConfig = fs.readFileSync(path.join(root, 'config', 'regions', 'xicheng.js'), 'utf8')
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const opsDetails = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengTravelogueOpsDetails.vue'), 'utf8')
const travelogueServiceTaskSurface = `${travelogue}\n${opsDetails}`

assert.match(
  regionConfig,
  /visionAgentServiceTasksStorageKey:\s*'xicheng_vision_agent_service_tasks'/,
  'Xicheng region config should own the AI识境 service task package storage key'
)

assert.match(
  regionConfig,
  /privacyClearStorageKeys:[\s\S]*XICHENG_REGION_BASE_CONFIG\.visionAgentServiceTasksStorageKey/,
  'Privacy clearing should remove AI识境 service tasks with the rest of local scene memory'
)

assert.match(
  scanResult,
  /rememberVisionAgentServiceTask\(action = \{\}\)[\s\S]*XICHENG_REGION_CONFIG\.visionAgentServiceTasksStorageKey[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.visionAgentServiceTasksStorageKey/,
  'Scan result should persist service tasks through the configured AI识境 task package key'
)

for (const required of [
  'AI识境任务包',
  'visionAgentServiceTasks',
  'visibleVisionAgentServiceTasks',
  'loadVisionAgentServiceTasks',
  'vision-agent-task-card',
  'visionAgentServiceTaskCount',
  '路线、商家、记录和游记素材',
  '选择路线、美食、记录或生成游记'
]) {
  assert.ok(travelogueServiceTaskSurface.includes(required), `Travelogue should expose AI识境 service task package behavior: ${required}`)
}

assert.doesNotMatch(
  travelogueServiceTaskSurface,
  /路线、商家、徽章|选择路线、美食、徽章/,
  'Travelogue AI识境 task package copy should align with recording/travelogue material, not old badge collection'
)

assert.match(
  travelogue,
  /loadVisionAgentServiceTasks\(\)[\s\S]*uni\.getStorageSync\(XICHENG_REGION_CONFIG\.visionAgentServiceTasksStorageKey\)[\s\S]*this\.visionAgentServiceTasks/,
  'Travelogue should load AI识境 tasks from the configured storage key'
)

assert.match(
  travelogue,
  /createXichengTravelogueDraft\s*=\s*\(\{[\s\S]*visionAgentServiceTasks = \[\][\s\S]*visionAgentTaskText[\s\S]*AI识境已收集/,
  'Travelogue draft generation should fold AI识境 service tasks into the generated story'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*visionAgentServiceTaskCount:\s*this\.visionAgentServiceTaskCount/,
  'Local ops report should count AI识境 service tasks as an operating signal'
)
