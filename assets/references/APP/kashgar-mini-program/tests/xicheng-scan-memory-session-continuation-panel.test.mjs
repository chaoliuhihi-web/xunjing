import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scan = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan', 'scan.vue'), 'utf8')

const getBlock = (source, pattern, label) => {
  const block = source.match(pattern)?.[0] || ''
  assert.ok(block, `Should find ${label}`)
  return block
}

for (const required of [
  'scan-memory-session-panel',
  'AI识境连续会话包',
  'memorySessionContinuation',
  'memorySessionActionItems',
  'continueMemorySessionWithXiaojing',
  'openMemorySessionTravelogue',
  '继续问小京',
  '生成今日游记'
]) {
  assert.ok(scan.includes(required), `Scan entry should expose continuous memory continuation: ${required}`)
}

assert.match(
  scan,
  /<view v-if="memorySessionContinuation" class="scan-memory-session-panel xicheng-paper-card">[\s\S]*memorySessionContinuation\.sceneCount[\s\S]*memorySessionContinuation\.poiTrailText[\s\S]*memorySessionActionItems/,
  'Scan page should show the continuous session package before the next capture'
)

assert.match(
  scan,
  /memorySessionContinuation\(\)[\s\S]*this\.buildSceneFusionContext\(\)[\s\S]*visionAgentMemorySessionPackage[\s\S]*sceneCount[\s\S]*poiTrailText[\s\S]*continuityCueText[\s\S]*domainContinuityText[\s\S]*serviceContinuityText/,
  'Memory continuation view model should normalize the stored session package from Scene Engine context'
)

assert.match(
  scan,
  /memorySessionActionItems\(\)[\s\S]*continue-memory-guide[\s\S]*继续问小京[\s\S]*travelogue-memory-draft[\s\S]*生成今日游记/,
  'Memory continuation panel should expose direct Agent actions instead of only passive text'
)

assert.match(
  scan,
  /createMemorySessionContinuationContext\(\)[\s\S]*this\.buildVisionAgentSceneContext\('memory-session', \{[\s\S]*sourceLabel:\s*'AI识境连续会话包'[\s\S]*\}\)[\s\S]*entry:\s*'scan-memory-session'/,
  'Continuation actions should reuse the same Vision Agent context contract as recognition results'
)

const continueBlock = getBlock(
  scan,
  /continueMemorySessionWithXiaojing\(\)[\s\S]*?\n\t\t\},\n\t\topenMemorySessionTravelogue/,
  'continueMemorySessionWithXiaojing block'
)

for (const required of [
  '/pages/ai-guide/ai-guide',
  'visionAgentContext=${encodeRouteValue(JSON.stringify(visionAgentContext))}',
  "sourceRecognitionContext=${encodeRouteValue(visionAgentContext.sourceRecognitionContext || '')}"
]) {
  assert.ok(continueBlock.includes(required), `Continue action should pass memory-session context into Xiaojing: ${required}`)
}

const travelogueBlock = getBlock(
  scan,
  /openMemorySessionTravelogue\(\)[\s\S]*?\n\t\t\},\n\t\thandleRecognitionUnavailable/,
  'openMemorySessionTravelogue block'
)

for (const required of [
  '/pages/xicheng/travelogue/travelogue',
  'visionAgentContext=${encodeRouteValue(JSON.stringify(visionAgentContext))}',
  "memorySessionSceneCount=${encodeRouteValue(visionAgentContext.memorySessionSceneCount || '')}"
]) {
  assert.ok(travelogueBlock.includes(required), `Travelogue action should carry continuous session context: ${required}`)
}
