import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const helperPath = path.join(root, 'request', 'xunjing', 'visionAgentSceneUnderstanding.js')
const helperSource = fs.readFileSync(helperPath, 'utf8')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')

for (const required of [
  'XICHENG_VISION_AGENT_SCENE_DOMAINS',
  'createXichengVisionAgentSceneUnderstandingCards',
  'inferXichengVisionAgentSceneUnderstandingPackage',
  'createXichengVisionAgentSceneUnderstandingPrompt',
  'createXichengVisionAgentDomainServiceActions'
]) {
  assert.ok(helperSource.includes(required), `Scene understanding helper should expose ${required}`)
}

const runtimeSource = `${helperSource}
export {
  XICHENG_VISION_AGENT_SCENE_DOMAINS,
  createXichengVisionAgentSceneUnderstandingCards,
  inferXichengVisionAgentSceneUnderstandingPackage,
  createXichengVisionAgentSceneUnderstandingPrompt,
  createXichengVisionAgentDomainServiceActions
}
`
  .replaceAll('export const ', 'const ')

const {
  createXichengVisionAgentSceneUnderstandingCards,
  inferXichengVisionAgentSceneUnderstandingPackage,
  createXichengVisionAgentSceneUnderstandingPrompt
} = await import(`data:text/javascript;base64,${Buffer.from(runtimeSource).toString('base64')}`)

const domainCards = createXichengVisionAgentSceneUnderstandingCards()
for (const domainKey of ['architecture', 'artifact', 'menu', 'food', 'sign-ocr', 'heritage', 'plant', 'animal', 'person', 'event']) {
  assert.ok(
    domainCards.some(card => card.domainKey === domainKey),
    `Scene domain taxonomy should cover ${domainKey}`
  )
}

const menuPackage = inferXichengVisionAgentSceneUnderstandingPackage({
  result: {
    poiName: '喀什老城菜单',
    source: 'ocr',
    ocrText: '烤包子 羊肉串 清真 辣度 推荐菜 适合四个人',
    sourceLabel: '菜单 OCR'
  },
  visionAgentContext: {
    visionCaption: '游客拍到餐厅菜单和烤包子',
    serviceText: '需要点餐、优惠和人数建议'
  }
})

assert.equal(menuPackage.primaryDomainKey, 'menu', 'Menu OCR should become the primary scene domain')
assert.equal(menuPackage.primaryDomainLabel, '菜单', 'Menu package should expose a human domain label')
assert.ok(menuPackage.domainCards[0].domainKey === 'menu', 'Menu domain should rank first')
assert.ok(
  menuPackage.serviceActions.some(action => action.actionKey === 'menu-order' && action.serviceIntent === 'order'),
  'Menu scene should create an order service action'
)
assert.ok(
  menuPackage.serviceActions.some(action => action.actionKey === 'menu-coupon' && action.serviceIntent === 'coupon'),
  'Menu scene should create a coupon service action'
)
assert.match(
  createXichengVisionAgentSceneUnderstandingPrompt(menuPackage.domainCards[0], '喀什老城菜单'),
  /菜品[\s\S]*辣度[\s\S]*清真[\s\S]*推荐菜/,
  'Menu prompt should ask for dish, spice, halal, and recommendation understanding'
)

const signPackage = inferXichengVisionAgentSceneUnderstandingPackage({
  result: {
    poiName: '古城巷道路牌',
    source: 'ocr',
    text: '维吾尔文 路牌 方向 导航'
  },
  visionAgentContext: {
    ocrText: '维吾尔文路牌，游客想知道发音和怎么走'
  }
})

assert.equal(signPackage.primaryDomainKey, 'sign-ocr', 'Road sign OCR should become the primary scene domain')
assert.ok(
  signPackage.serviceActions.some(action => action.actionKey === 'sign-translate' && action.serviceIntent === 'translate'),
  'Sign OCR scene should create a translate/navigation service action'
)
assert.match(
  createXichengVisionAgentSceneUnderstandingPrompt(signPackage.domainCards[0], '古城巷道路牌'),
  /翻译[\s\S]*发音[\s\S]*导航/,
  'Sign OCR prompt should ask for translation, pronunciation, and navigation'
)

for (const required of [
  "from '@/request/xunjing/visionAgentSceneUnderstanding.js'",
  'visionAgentSceneUnderstandingPackage()',
  'inferXichengVisionAgentSceneUnderstandingPackage({',
  'enrichedVisionAgentContext()',
  'sceneUnderstandingPackage: this.visionAgentSceneUnderstandingPackage',
  'primarySceneDomainKey: this.visionAgentSceneUnderstandingPackage.primaryDomainKey',
  'primarySceneDomainLabel: this.visionAgentSceneUnderstandingPackage.primaryDomainLabel',
  'visionAgentContext = this.enrichedVisionAgentContext'
]) {
  assert.ok(scanResult.includes(required), `Scan result should consume scene understanding package: ${required}`)
}

assert.match(
  scanResult,
  /prioritizedSceneUnderstandingCards\(\)[\s\S]*this\.visionAgentSceneUnderstandingPackage\.domainCards/,
  'Scan result scene cards should come from the shared scene understanding package'
)

assert.match(
  scanResult,
  /domainSceneServiceActions\(\)[\s\S]*this\.visionAgentSceneUnderstandingPackage\.serviceActions/,
  'Scan result service actions should come from the shared scene understanding package'
)

for (const required of [
  'sceneUnderstandingPackage',
  'primarySceneDomainKey',
  'primarySceneDomainLabel',
  'sceneUnderstandingSummary',
  'Agent识别场景',
  "appendChip('domain', '场景', context.primarySceneDomainLabel)",
  'context.sceneUnderstandingSummary ? `Agent识别场景：${context.sceneUnderstandingSummary}。` :'
]) {
  assert.ok(aiGuide.includes(required), `AI guide should consume scene understanding package context: ${required}`)
}
