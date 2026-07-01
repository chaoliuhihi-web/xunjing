import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const visionAgentTravelogue = fs.readFileSync(path.join(root, 'request', 'xunjing', 'visionAgentTravelogue.js'), 'utf8')
const combinedSource = `${travelogue}\n${visionAgentTravelogue}`

const loadJourneyBlock = travelogue.match(/async loadJourney\(options = \{\}\)[\s\S]*?\n\t\t\},\n\t\tshouldAutoStartRecording/)?.[0] || ''
const draftCreationBlock = loadJourneyBlock.match(/createXichengTravelogueDraft\(\{[\s\S]*?\n\t\t\t\t\t\}\)/)?.[0] || ''
const routeMemoryPackageBlock = visionAgentTravelogue.match(/createVisionAgentMemorySessionPackageFromRouteContext\s*=\s*\(context = \{\}, fallbackSceneCount = ''\)[\s\S]*?\n\nexport const createVisionAgentRealSystemBoundary/)?.[0] || ''

assert.ok(loadJourneyBlock, 'Travelogue should expose loadJourney')
assert.ok(draftCreationBlock, 'Travelogue should create the initial draft inside loadJourney')
assert.ok(routeMemoryPackageBlock, 'Travelogue should expose route context memory package builder')

for (const required of [
  'parseTravelogueVisionAgentContext',
  'createVisionAgentMemorySessionPackageFromRouteContext',
  'visionAgentRouteContext',
  'visionAgentRouteContextSource',
  'route-vision-agent-context'
]) {
  assert.ok(combinedSource.includes(required), `Travelogue should support AI识境 route context handoff: ${required}`)
}

assert.match(
  visionAgentTravelogue,
  /parseTravelogueVisionAgentContext\s*=\s*\(value = ''\)[\s\S]*decodeXichengRouteValue\(value\)[\s\S]*JSON\.parse\(decodedValue\)[\s\S]*return parsedContext && typeof parsedContext === 'object' \? parsedContext : \{\}/,
  'Travelogue should safely decode and parse the AI识境 context that scan passes through route params'
)

for (const required of [
  'context.visionAgentMemorySessionPackage',
  'Number(',
  'sceneCount',
  'context.visionAgentMemorySessionText',
  'context.sourceRecognitionContext',
  'return null'
]) {
  assert.ok(routeMemoryPackageBlock.includes(required), `Route context memory package builder should include ${required}`)
}

for (const required of [
  'const visionAgentRouteContext = parseTravelogueVisionAgentContext(options.visionAgentContext)',
  'this.visionAgentRouteContext = visionAgentRouteContext',
  "this.visionAgentRouteContextSource = visionAgentRouteContext.entry || ''",
  'const routeMemorySessionPackage = createVisionAgentMemorySessionPackageFromRouteContext(visionAgentRouteContext, decodeJourneyRouteValue(options.memorySessionSceneCount))',
  'this.visionAgentMemorySessionPackage = routeMemorySessionPackage'
]) {
  assert.ok(loadJourneyBlock.includes(required), `loadJourney should inject AI识境 route context before drafting: ${required}`)
}

assert.match(
  loadJourneyBlock,
  /loadVisionAgentMemorySessionPackage\(\)[\s\S]*createVisionAgentMemorySessionPackageFromRouteContext[\s\S]*if \(routeMemorySessionPackage\) \{[\s\S]*this\.visionAgentMemorySessionPackage = routeMemorySessionPackage[\s\S]*\}[\s\S]*const storedMaterials/,
  'Route-provided AI识境 memory should override stale storage before materials and draft are composed'
)

assert.ok(
  draftCreationBlock.includes('visionAgentMemorySessionPackage: this.visionAgentMemorySessionPackage'),
  'Initial travelogue draft should receive the route-injected AI识境 memory package'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*visionAgentRouteContext:\s*this\.visionAgentRouteContext[\s\S]*visionAgentRouteContextSource:\s*this\.visionAgentRouteContextSource/,
  'Local ops report should preserve whether the travelogue was generated from an AI识境 route context'
)
