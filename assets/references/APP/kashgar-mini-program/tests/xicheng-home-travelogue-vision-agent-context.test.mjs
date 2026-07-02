import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const home = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'home', 'home.vue'), 'utf8')

const openTravelogueBlock = home.match(/openXichengTravelogue\(mode = 'record'\)[\s\S]*?\n\t\t\},\n\t\topenXichengRecording/)?.[0] || ''

assert.ok(openTravelogueBlock, 'Home should expose openXichengTravelogue')

for (const required of [
  "const visionAgentContext = this.buildVisionAgentSceneContext('home-travelogue', this.recentRecognition || {})",
  'const query = [',
  '`visionAgentContext=${encodeRouteValue(JSON.stringify(visionAgentContext))}`',
  "`sourceRecognitionContext=${encodeRouteValue(visionAgentContext.sourceRecognitionContext || '')}`",
  "`memorySessionSceneCount=${encodeRouteValue(visionAgentContext.memorySessionSceneCount || '')}`",
  "`poiCode=${encodeRouteValue(visionAgentContext.poiCode || '')}`",
  "`poiName=${encodeRouteValue(visionAgentContext.poiName || '')}`",
  "`safetyStatus=${encodeRouteValue(visionAgentContext.safetyStatus || '')}`"
]) {
  assert.ok(
    openTravelogueBlock.includes(required),
    `Home travelogue entry should carry AI识境 context into the draft: ${required}`
  )
}

assert.match(
  openTravelogueBlock,
  /url:\s*`\/pages\/xicheng\/travelogue\/travelogue\?\$\{query\}`/,
  'Home travelogue entry should navigate with the composed Vision Agent query instead of a plain region-only URL'
)
