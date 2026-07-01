import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const regionConfig = read('config', 'regions', 'xicheng.js')

const getBlock = (source, pattern, label) => {
  const block = source.match(pattern)?.[0] || ''
  assert.ok(block, `Should find ${label}`)
  return block
}

for (const required of [
  'vision-agent-memory-panel',
  '连续理解',
  '上一拍',
  '当前场景',
  '下一问',
  'visionAgentTimelineItems'
]) {
  assert.ok(scanResult.includes(required), `Scan result should make Vision Agent continuity visible: ${required}`)
}

assert.match(
  scanResult,
  /visionAgentTimelineItems\(\)[\s\S]*parseVisionAgentSourceContext[\s\S]*readVisionAgentMemoryTrail[\s\S]*createVisionAgentMemorySnapshot/,
  'Continuity timeline should combine previous recognition context, local memory trail, and current scene snapshot'
)

for (const requiredMethod of [
  'parseVisionAgentSourceContext',
  'readVisionAgentMemoryTrail',
  'createVisionAgentMemorySnapshot',
  'rememberVisionAgentSceneMemory'
]) {
  assert.ok(scanResult.includes(`${requiredMethod}(`), `Scan result should implement ${requiredMethod}`)
}

assert.match(
  scanResult,
  /rememberVisionAgentSceneMemory\(\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.visionAgentMemoryStorageKey/,
  'Result page should persist each safe scene as Vision Agent memory for later recognition continuity'
)

const onLoadBlock = getBlock(
  scanResult,
  /onLoad\(options = \{\}\) \{[\s\S]*?\n\t\},\n\tmethods:/,
  'scan result onLoad block'
)
assert.ok(
  onLoadBlock.includes('this.rememberVisionAgentSceneMemory()'),
  'Loading a safe result should write the current scene into the Vision Agent memory trail'
)

const askXiaojingBlock = getBlock(
  scanResult,
  /askXiaojing\(question = '', \{ serviceHandoffContext = null \} = \{\}\)[\s\S]*?\n\t\t\},\n\t\topenVisionAgentAction/,
  'scan result askXiaojing block'
)
assert.match(
  askXiaojingBlock,
  /this\.rememberVisionAgentSceneMemory\(\)[\s\S]*visionAgentContext/,
  'Continuing into Xiaojing should refresh the memory trail before passing Vision Agent context'
)

assert.match(
  regionConfig,
  /visionAgentMemoryStorageKey:\s*'xicheng_vision_agent_memory_trail'/,
  'Xicheng config should name the local Vision Agent memory trail storage key'
)

assert.match(
  regionConfig,
  /privacyClearStorageKeys:[\s\S]*XICHENG_REGION_BASE_CONFIG\.visionAgentMemoryStorageKey/,
  'Privacy clear list should remove local Vision Agent memory trail data'
)
