import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scan = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan', 'scan.vue'), 'utf8')
const advancedPanel = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengScanAdvancedContextPanel.vue'), 'utf8')
const scanSceneDomainSurface = `${scan}\n${advancedPanel}`

for (const required of [
  'scan-scene-domain-panel',
  '看见什么，就能问什么',
  'sceneDomainCapabilities',
  'sceneDomainImageLabels',
  '建筑',
  '文物',
  '菜单',
  '食物',
  '路牌/OCR',
  '非遗',
  '植物',
  '动物',
  '人物',
  '活动'
]) {
  assert.ok(scanSceneDomainSurface.includes(required), `AI识境 scan entry should expose scene-domain hint: ${required}`)
}

assert.match(
  advancedPanel,
  /<view class="scan-scene-domain-panel xicheng-paper-card">[\s\S]*v-for="domain in sceneDomainCapabilities"[\s\S]*domain\.label[\s\S]*domain\.copy/,
  'Scan page should render a pre-capture scene-domain panel from the same domain list used by the Agent'
)

assert.match(
  scan,
  /sceneDomainCapabilities:\s*\[[\s\S]*domainKey:\s*'architecture'[\s\S]*domainKey:\s*'artifact'[\s\S]*domainKey:\s*'menu'[\s\S]*domainKey:\s*'food'[\s\S]*domainKey:\s*'sign-ocr'[\s\S]*domainKey:\s*'heritage'[\s\S]*domainKey:\s*'plant'[\s\S]*domainKey:\s*'animal'[\s\S]*domainKey:\s*'person'[\s\S]*domainKey:\s*'event'/,
  'Scan entry should cover the ten product-required Vision Agent scene domains before capture'
)

assert.match(
  scan,
  /sceneDomainImageLabels\(\)[\s\S]*this\.sceneDomainCapabilities[\s\S]*domain\.label[\s\S]*domain\.title[\s\S]*照片[\s\S]*OCR文字[\s\S]*地点线索[\s\S]*路线图/,
  'Photo recognition should derive backend image labels from the visible scene-domain capability list plus generic input labels'
)

assert.match(
  scan,
  /sceneDomainImageLabels\(\)[\s\S]*const selectedSceneDomain = this\.getSelectedSceneDomainCapability\(\)[\s\S]*return Array\.from\(new Set\(\[[\s\S]*`sceneDomainIntent:\$\{selectedSceneDomain\.domainKey\}`[\s\S]*selectedSceneDomain\.label[\s\S]*selectedSceneDomain\.title[\s\S]*selectedSceneDomain\.copy[\s\S]*\.\.\.domainLabels/,
  'Backend image labels should prioritize the selected scene-domain intent before generic domain hints'
)

assert.match(
  scan,
  /resolveXichengPhotoTrigger\(\{[\s\S]*imageLabels:\s*this\.sceneDomainImageLabels/,
  'Photo trigger should pass the expanded scene-domain labels into the multimodal backend facade'
)

assert.match(
  scan,
  /import \{[\s\S]*resolveXichengOcrImageTrigger[\s\S]*resolveXichengPhotoTrigger[\s\S]*\} from '@\/request\/xunjing\/trigger\.js'/,
  'Scan page should import the dedicated OCR image trigger helper next to the photo trigger'
)

assert.match(
  scan,
  /v-for="domain in sceneDomainCapabilities"[\s\S]*:class="\{ 'scene-domain-item-active': selectedSceneDomainKey === domain\.domainKey \}"[\s\S]*@click="selectSceneDomain\(domain\)"/,
  'Scene-domain cards should let the single AI识境 entry bias recognition without adding separate mode buttons'
)

assert.match(
  scan,
  /selectedSceneDomainKey:\s*'architecture'/,
  'Scan page should keep an explicit selected scene domain for backend trigger intent'
)

assert.match(
  scan,
  /selectSceneDomain\(domain = \{\}\)[\s\S]*this\.selectedSceneDomainKey = domain\.domainKey/,
  'Selecting a visible scene domain should update the Vision Agent recognition intent'
)

assert.match(
  scan,
  /getSelectedSceneDomainCapability\(\)[\s\S]*this\.sceneDomainCapabilities\.find\(domain => domain\.domainKey === this\.selectedSceneDomainKey\)/,
  'Scan page should resolve the selected visible scene domain before building Agent context'
)

assert.match(
  scan,
  /buildVisionAgentSceneContext\(source = '', trigger = \{\}\)[\s\S]*const selectedSceneDomain = this\.getSelectedSceneDomainCapability\(\)[\s\S]*sceneDomainIntentKey:\s*selectedSceneDomain\.domainKey[\s\S]*sceneDomainIntentLabel:\s*selectedSceneDomain\.label[\s\S]*sceneDomainIntentTitle:\s*selectedSceneDomain\.title[\s\S]*sceneDomainIntentCopy:\s*selectedSceneDomain\.copy/,
  'Vision Agent context should preserve the selected scene-domain intent for result-page understanding'
)

assert.match(
  scan,
  /sourceRecognitionContext:\s*this\.createSceneDomainSourceRecognitionContext\(source,\s*trigger,\s*selectedSceneDomain\)/,
  'Scan result context should serialize the selected scene domain into sourceRecognitionContext for later handoff'
)

assert.match(
  scan,
  /buildTriggerSceneSignals\(source = ''\)[\s\S]*buildSceneFusionContext\(\)[\s\S]*buildWorldInterfaceSnapshot\(fusionContext\)[\s\S]*getSelectedSceneDomainCapability\(\)[\s\S]*buildAgentDecisionSnapshot\(\)[\s\S]*sceneFusionSummary[\s\S]*worldInterfaceSummary[\s\S]*localTimeText[\s\S]*weatherText[\s\S]*headingText[\s\S]*headingDegrees[\s\S]*sceneDomainIntentKey[\s\S]*agentDecisionReasonSummary[\s\S]*memorySessionSceneCount/,
  'Scan page should build bounded Scene Engine trigger signals from live fusion, world-interface, selected domain, Agent decision, and memory context'
)

assert.match(
  scan,
  /shouldUseOcrImageRecognition\(\)[\s\S]*\['sign-ocr',\s*'menu'\]\.includes\(this\.selectedSceneDomainKey\)/,
  'Text-dense scene domains such as route signs and menus should route selected images through OCR recognition'
)

assert.match(
  scan,
  /const source = this\.shouldUseOcrImageRecognition\(\) \? 'ocr' : 'photo'[\s\S]*const sceneSignals = this\.buildTriggerSceneSignals\(source\)[\s\S]*source === 'ocr'\s*\? resolveXichengOcrImageTrigger\(\{[\s\S]*filePath[\s\S]*text[\s\S]*ocrText:\s*text[\s\S]*imageLabels:\s*this\.sceneDomainImageLabels[\s\S]*sceneSignals[\s\S]*\}\)[\s\S]*:\s*resolveXichengPhotoTrigger\(\{[\s\S]*sceneSignals[\s\S]*this\.openScanResult\(trigger,\s*source\)/,
  'Auto recognition should send Scene Engine trigger signals through OCR/photo backend contracts and preserve the source in scan-result'
)

assert.match(
  scan,
  /resolveNearbyLocation\(\)[\s\S]*const source = location \? 'gps' : 'text'[\s\S]*const sceneSignals = this\.buildTriggerSceneSignals\(source\)[\s\S]*resolveXichengTextTrigger\(\{[\s\S]*sceneSignals[\s\S]*this\.openScanResult\(trigger,\s*source\)/,
  'Nearby GPS/text fallback recognition should send Scene Engine trigger signals before opening scan-result'
)

assert.match(
  scan,
  /resolveTextAndOpenResult\(text = '', source = 'scan'\)[\s\S]*const sceneSignals = this\.buildTriggerSceneSignals\(source\)[\s\S]*resolveXichengTextTrigger\(\{[\s\S]*sceneSignals[\s\S]*this\.openScanResult\(trigger,\s*source\)/,
  'Manual text or scan recognition should send Scene Engine trigger signals into the shared trigger facade'
)
