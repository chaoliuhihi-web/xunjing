import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const sceneUnderstandingHelper = fs.readFileSync(path.join(root, 'request', 'xunjing', 'visionAgentSceneUnderstanding.js'), 'utf8')

for (const required of [
  'scene-understanding-panel',
  'prioritizedSceneUnderstandingCards',
  'sceneUnderstandingCards',
  'inferSceneUnderstandingDomainScore',
  'openSceneUnderstandingCard',
  'createSceneUnderstandingPrompt',
  'sceneDomain',
  '建筑',
  '文物',
  '菜单',
  '食物',
  '路牌',
  'OCR',
  '非遗',
  '植物',
  '动物',
  '人物',
  '活动'
]) {
  assert.ok(
    scanResult.includes(required) || sceneUnderstandingHelper.includes(required),
    `Vision Agent scene-domain understanding should include ${required}`
  )
}

assert.match(
  scanResult,
  /<view v-if="prioritizedSceneUnderstandingCards\.length > 0" class="scene-understanding-panel[\s\S]*v-for="card in prioritizedSceneUnderstandingCards"[\s\S]*@click="openSceneUnderstandingCard\(card\)"/,
  'Result page should render scene-domain cards that can be handed to the Agent'
)

assert.match(
  sceneUnderstandingHelper,
  /XICHENG_VISION_AGENT_SCENE_DOMAINS[\s\S]*domainKey:\s*'architecture'[\s\S]*domainKey:\s*'artifact'[\s\S]*domainKey:\s*'menu'[\s\S]*domainKey:\s*'food'[\s\S]*domainKey:\s*'sign-ocr'[\s\S]*domainKey:\s*'heritage'[\s\S]*domainKey:\s*'plant'[\s\S]*domainKey:\s*'animal'[\s\S]*domainKey:\s*'person'[\s\S]*domainKey:\s*'event'/,
  'Shared scene-domain taxonomy should cover the product-required Vision Agent domains'
)

assert.match(
  sceneUnderstandingHelper,
  /createSceneCombinedText[\s\S]*visionCaption[\s\S]*ocrText[\s\S]*serviceText[\s\S]*activityText[\s\S]*knowledgeGraphText/,
  'Shared scene-domain ranking should use camera/OCR, service, activity, and knowledge graph signals'
)

assert.match(
  sceneUnderstandingHelper,
  /createXichengVisionAgentSceneUnderstandingPrompt[\s\S]*menu[\s\S]*辣度[\s\S]*清真[\s\S]*推荐菜[\s\S]*sign-ocr[\s\S]*翻译[\s\S]*发音[\s\S]*导航[\s\S]*heritage[\s\S]*非遗[\s\S]*体验/,
  'Shared scene-domain prompts should switch from generic landmark explanation to domain-specific questions'
)

assert.match(
  scanResult,
  /openSceneUnderstandingCard\(card = \{\}\)[\s\S]*const prompt = this\.createSceneUnderstandingPrompt\(card\)[\s\S]*this\.rememberVisionAgentExecutionTask\(\{[\s\S]*sceneDomain:\s*card\.domainKey[\s\S]*\},\s*prompt\)[\s\S]*this\.askXiaojing\(prompt\)/,
  'Opening a scene-domain card should persist the selected domain before handing off to Xiaojing'
)

assert.match(
  scanResult,
  /rememberVisionAgentServiceTask\(action = \{\}\)[\s\S]*sceneDomain:\s*action\.sceneDomain \|\| ''/,
  'The local task package should keep the selected scene domain as operating context'
)

assert.match(
  travelogue,
  /createVisionAgentServiceTaskMeta\(task = \{\}\)[\s\S]*sceneDomain[\s\S]*actionPrompt[\s\S]*statusText/,
  'Travelogue task-package metadata should surface the selected scene domain'
)
