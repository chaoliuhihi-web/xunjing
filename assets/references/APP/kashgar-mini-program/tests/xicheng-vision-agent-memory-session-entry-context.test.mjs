import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const scan = read('pages', 'xicheng', 'scan', 'scan.vue')

assert.match(
  regionConfig,
  /visionAgentMemorySessionStorageKey:\s*'xicheng_vision_agent_memory_session'/,
  'Region config should own the AI识境 continuous memory session storage key'
)

for (const required of [
  'readVisionAgentMemorySessionPackage',
  'visionAgentMemorySessionPackage',
  'visionAgentMemorySessionText',
  'memorySessionSceneCount',
  '连续识境'
]) {
  assert.ok(home.includes(required), `Home AI识境 entry should consume continuous memory session package: ${required}`)
}

assert.match(
  home,
  /buildSceneVisionContext\(\)[\s\S]*const memorySessionPackage = this\.readVisionAgentMemorySessionPackage\(\)[\s\S]*visionAgentMemorySessionPackage:\s*memorySessionPackage[\s\S]*visionAgentMemorySessionText:/,
  'Home AI识境 context should load the structured memory session package and expose a compact continuity text'
)

assert.match(
  home,
  /buildSceneVisionSignals\(context = this\.buildSceneVisionContext\(\)\)[\s\S]*memorySessionSceneCount[\s\S]*key:\s*'memory-session'[\s\S]*label:\s*'连续识境'/,
  'Home world entry should show continuous memory as a first-class live signal before the next capture'
)

assert.match(
  home,
  /buildSceneVisionEntryUrl\(context = this\.buildSceneVisionContext\(\), entry = 'home-world-entry'\)[\s\S]*\['memorySessionText',\s*context\.visionAgentMemorySessionText[\s\S]*\['memorySessionSceneCount',\s*context\.memorySessionSceneCount/,
  'Home AI识境 entry URL should pass compact memory-session continuity into the scan page'
)

for (const required of [
  'readVisionAgentMemorySessionPackage',
  'visionAgentMemorySessionPackage',
  'visionAgentMemorySessionText',
  'memorySessionSceneCount',
  '连续识境'
]) {
  assert.ok(scan.includes(required), `Scan Scene Engine should consume continuous memory session package: ${required}`)
}

assert.match(
  scan,
  /applyVisionAgentQueryContext\(options = \{\}\)[\s\S]*memorySessionText:\s*decodeRouteValue\(options\.memorySessionText\)[\s\S]*memorySessionSceneCount:\s*decodeRouteValue\(options\.memorySessionSceneCount\)/,
  'Scan page should hydrate compact memory-session continuity from the home entry URL'
)

assert.match(
  scan,
  /buildSceneFusionContext\(\)[\s\S]*const memorySessionPackage = this\.readVisionAgentMemorySessionPackage\(\)[\s\S]*visionAgentMemorySessionPackage:\s*memorySessionPackage[\s\S]*visionAgentMemorySessionText:/,
  'Scan Scene Engine should merge stored continuous memory package into the live fusion context'
)

assert.match(
  scan,
  /buildSceneFusionSignals\(context = this\.buildSceneFusionContext\(\)\)[\s\S]*key:\s*'memory-session'[\s\S]*label:\s*'连续识境'/,
  'Scan fusion panel should expose continuous memory as a dedicated signal, not only raw Memory trail'
)

assert.match(
  scan,
  /createSceneAgentActionPreviews\(\)[\s\S]*const memorySessionPackage[\s\S]*const memorySessionSceneCount[\s\S]*const hasMemoryCue = memoryTrail\.length > 0 \|\| memorySessionSceneCount > 0[\s\S]*score:\s*hasMemoryCue \? 46 : 18/,
  'Agent preview ranking should prioritize continuing the memory session when prior scene count exists'
)

assert.match(
  scan,
  /buildVisionAgentSceneContext\(source = '', trigger = \{\}\)[\s\S]*visionAgentMemorySessionPackage:[\s\S]*visionAgentMemorySessionText:[\s\S]*memorySessionSceneCount:/,
  'Scan result context should carry the continuous memory package for downstream cards and Xiaojing continuity'
)
