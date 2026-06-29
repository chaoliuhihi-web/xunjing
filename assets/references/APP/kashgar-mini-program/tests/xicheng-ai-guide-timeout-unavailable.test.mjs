import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')

const timeoutBlock = aiGuide.match(/responseTimeoutTimer\s*=\s*setTimeout\(\(\) => \{[\s\S]*?\n\t\t\}, AI_RESPONSE_TIMEOUT_MS\)/)?.[0] || ''

assert.ok(timeoutBlock, 'AI guide should keep an explicit timeout branch for stalled Yudao AI requests')

for (const required of [
  'hasXichengAiContext(xichengAiContext.value)',
  'XICHENG_UNAVAILABLE_ANSWER',
  "safetyStatus: 'UNAVAILABLE'",
  'sources: []',
  'followUps: []',
  'fallback: true',
  'timeout: true',
  'resolve({'
]) {
  assert.ok(timeoutBlock.includes(required), `Xicheng timeout branch should include ${required}`)
}

assert.match(
  timeoutBlock,
  /commitAssistantMessage\(assistantMessage,\s*\{[\s\S]*isPending:\s*false[\s\S]*sources:\s*\[\][\s\S]*safetyStatus:\s*'UNAVAILABLE'/,
  'Xicheng timeout branch should replace the pending assistant message with a safe unavailable response'
)

assert.doesNotMatch(
  timeoutBlock,
  /createLocalKashgarAiFallback|createLocalXunjingAiFallback|先按西城试运营资料|本地导览资料|历史沿革|建筑细节|推荐：从/,
  'Xicheng timeout branch should not fabricate local guide or route content'
)
