import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')

const requestChatBlock = aiGuide.match(/const requestXunjingAiChat\s*=\s*\(question\) => \{[\s\S]*?\n\}\n\nconst escapeHtml/)?.[0] || ''
const unsafeContextBlock = requestChatBlock.match(/const contextSafetyStatus = normalizeXichengSafetyStatus\(context\.safetyStatus\)[\s\S]*?if\s*\(hasXichengAiContext\(context\) && \['BLOCKED', 'UNAVAILABLE'\]\.includes\(contextSafetyStatus\)\)\s*\{[\s\S]*?\n\t\}/)?.[0] || ''

assert.ok(requestChatBlock, 'AI guide should expose requestXunjingAiChat')

assert.ok(
  unsafeContextBlock,
  'AI guide should short-circuit when the active Xicheng recognition context is already BLOCKED or UNAVAILABLE'
)

for (const required of [
  'XICHENG_BLOCKED_ANSWER',
  'XICHENG_UNAVAILABLE_ANSWER',
  "contextSafetyStatus === 'BLOCKED'",
  'sources: []',
  'suggestedQuestions: []',
  'safetyStatus: contextSafetyStatus',
  'unsafeRequest.abort = () => {}',
  'return unsafeRequest'
]) {
  assert.ok(unsafeContextBlock.includes(required), `Unsafe context short-circuit should include ${required}`)
}

assert.doesNotMatch(
  unsafeContextBlock,
  /createLocalXichengAiFallback|createLocalXunjingAiFallback|uni\.request/,
  'Unsafe Xicheng contexts should not fall through to local fallback or a network request before refusing to answer'
)

assert.doesNotMatch(
  unsafeContextBlock,
  /sources:\s*getXichengContextSources\(\)|sources:\s*result\.sources|normalizeXichengReviewedSources/,
  'Unsafe Xicheng contexts should not attach recognition or backend sources to a no-reviewed-source refusal'
)

assert.ok(
  requestChatBlock.indexOf(unsafeContextBlock) < requestChatBlock.indexOf('uni.request({'),
  'Unsafe context guard should run before starting the AI network request'
)

assert.doesNotMatch(
  unsafeContextBlock,
  /先按西城试运营资料|本地导览资料|历史沿革|建筑细节|街区生活|亲子研学观察|推荐：从/,
  'Unsafe context guard should not fabricate guide or route content'
)
