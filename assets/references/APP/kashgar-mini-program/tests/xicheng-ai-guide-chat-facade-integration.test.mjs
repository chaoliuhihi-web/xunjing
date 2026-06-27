import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')
const chatFacade = fs.readFileSync(path.join(root, 'request', 'xunjing', 'chat.js'), 'utf8')

const normalizeBlock = aiGuide.match(/const normalizeXunjingAiResponse\s*=\s*\(res\) => \{[\s\S]*?\n\}/)?.[0] || ''

assert.match(
  aiGuide,
  /import \{ normalizeXichengAiChatResponse \} from '@\/request\/xunjing\/chat\.js'/,
  'AI guide should import the Xicheng chat facade response normalizer'
)

assert.ok(
  normalizeBlock.includes('normalizeXichengAiChatResponse(payload)'),
  'AI guide should reuse the Xicheng chat facade when normalizing Xiaojing responses'
)

assert.match(
  normalizeBlock,
  /hasXichengAiContext\(\)[\s\S]*normalizeXichengAiChatResponse\(payload\)[\s\S]*AI返回为空/,
  'Xicheng response normalization should keep facade fields and still reject empty non-blocked answers'
)

for (const required of [
  "const XICHENG_BLOCKED_ANSWER = '无已审核来源，不能回答'",
  'suggestedQuestions',
  'sources',
  'safetyStatus',
  "safetyStatus === 'BLOCKED' ? XICHENG_BLOCKED_ANSWER"
]) {
  assert.ok(chatFacade.includes(required), `Xicheng chat facade should remain the authority for ${required}`)
}

assert.doesNotMatch(
  normalizeBlock,
  /先按西城试运营资料|本地导览资料|历史沿革|建筑细节|街区生活|亲子研学观察|推荐：从/,
  'Xicheng response normalization should not introduce local fabricated guide content'
)
