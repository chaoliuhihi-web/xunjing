import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')

const requestChatBlock = aiGuide.match(/const requestXunjingAiChat\s*=\s*\(question\) => \{[\s\S]*?\n\}\n\nconst escapeHtml/)?.[0] || ''
const blockedContextBlock = requestChatBlock.match(/if\s*\(hasXichengAiContext\(context\) && normalizeXichengSafetyStatus\(context\.safetyStatus\) === 'BLOCKED'\)\s*\{[\s\S]*?\n\t\}/)?.[0] || ''

assert.ok(requestChatBlock, 'AI guide should expose requestXunjingAiChat')

assert.ok(
  blockedContextBlock,
  'AI guide should short-circuit when the active Xicheng recognition context is already BLOCKED'
)

for (const required of [
  'XICHENG_BLOCKED_ANSWER',
  'sources: []',
  'suggestedQuestions: []',
  "safetyStatus: 'BLOCKED'",
  'blockedRequest.abort = () => {}',
  'return blockedRequest'
]) {
  assert.ok(blockedContextBlock.includes(required), `Blocked context short-circuit should include ${required}`)
}

assert.doesNotMatch(
  blockedContextBlock,
  /createLocalXichengAiFallback|createLocalXunjingAiFallback|uni\.request/,
  'Blocked Xicheng contexts should not fall through to local fallback or a network request before refusing to answer'
)

assert.doesNotMatch(
  blockedContextBlock,
  /sources:\s*getXichengContextSources\(\)|sources:\s*result\.sources|normalizeXichengReviewedSources/,
  'Blocked Xicheng contexts should not attach recognition or backend sources to a no-reviewed-source refusal'
)

assert.ok(
  requestChatBlock.indexOf(blockedContextBlock) < requestChatBlock.indexOf('uni.request({'),
  'Blocked context guard should run before starting the AI network request'
)

assert.doesNotMatch(
  blockedContextBlock,
  /先按西城试运营资料|本地导览资料|历史沿革|建筑细节|街区生活|亲子研学观察|推荐：从/,
  'Blocked context guard should not fabricate guide or route content'
)
