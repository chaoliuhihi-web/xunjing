import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')

for (const required of [
  'createVisionAgentFollowupQuestions',
  'baseQuestions',
  'prioritizedSceneUnderstandingCards',
  'cityKnowledgeGraphNodes',
  'prioritizedSceneServiceActions',
  'readVisionAgentMemoryTrail',
  '看见什么，就能问什么',
  '连续识境'
]) {
  assert.ok(scanResult.includes(required), `AI识境 follow-up questions should include ${required}`)
}

assert.match(
  scanResult,
  /suggestedQuestions\(\)\s*\{[\s\S]*const baseQuestions = normalizeSuggestedQuestions\(this\.result\)[\s\S]*if \(this\.recognitionActionBlocked\) \{[\s\S]*return normalizeSuggestedQuestions\(this\.result\)[\s\S]*return this\.createVisionAgentFollowupQuestions\(baseQuestions\)/,
  'Recognition result should keep unsafe follow-up gating while enriching safe results through the Vision Agent question composer'
)

assert.match(
  scanResult,
  /createVisionAgentFollowupQuestions\(baseQuestions = \[\]\)\s*\{[\s\S]*appendQuestion[\s\S]*prioritizedSceneUnderstandingCards[\s\S]*createSceneUnderstandingPrompt[\s\S]*cityKnowledgeGraphNodes[\s\S]*createKnowledgeGraphNodePrompt/,
  'Vision Agent follow-up composer should turn scene-domain and knowledge-graph understanding into clickable Xiaojing questions'
)

assert.match(
  scanResult,
  /createVisionAgentFollowupQuestions\(baseQuestions = \[\]\)\s*\{[\s\S]*prioritizedSceneServiceActions[\s\S]*createVisionAgentServiceHandoff[\s\S]*createServiceHandoffPrompt[\s\S]*readVisionAgentMemoryTrail[\s\S]*连续识境[\s\S]*slice\(0, 6\)/,
  'Vision Agent follow-up composer should include service handoff and memory continuity questions, then cap the visible question list'
)

assert.doesNotMatch(
  scanResult.match(/createVisionAgentFollowupQuestions\(baseQuestions = \[\]\)[\s\S]*?\n\t\t\},\n\t\tknowledgeGraphNodeTypeLabel/)?.[0] || '',
  /latitude|longitude|imagePath|photoPath|sources:/,
  'Vision Agent follow-up questions should not expose coordinates, local photo paths, raw image paths, or raw source lists'
)
