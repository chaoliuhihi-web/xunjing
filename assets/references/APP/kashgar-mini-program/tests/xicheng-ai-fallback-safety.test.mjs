import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')

const xichengFallback = aiGuide.match(/const createLocalXichengAiFallback\s*=\s*\(question = '', context = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const genericFallback = aiGuide.match(/const createLocalXunjingAiFallback\s*=\s*\(question = '', context = xichengAiContext\.value\) => \{[\s\S]*?\n\}/)?.[0] || ''

assert.ok(
  xichengFallback,
  'AI guide should keep a Xicheng-specific unavailable fallback branch'
)

assert.match(
  aiGuide,
  /const XICHENG_UNAVAILABLE_ANSWER\s*=\s*'小京暂时无法获取已审核来源，请稍后再试'/,
  'Xicheng AI fallback copy should clearly state that no reviewed source-backed answer is available'
)

assert.match(
  xichengFallback,
  /answer:\s*XICHENG_UNAVAILABLE_ANSWER[\s\S]*sources:\s*\[\][\s\S]*followUps:\s*\[\][\s\S]*safetyStatus:\s*'UNAVAILABLE'/,
  'Xicheng AI fallback should return an unavailable state without sources or follow-up prompts'
)

assert.doesNotMatch(
  xichengFallback,
  /先按西城试运营资料|本地导览资料|历史沿革|建筑细节|街区生活|亲子研学观察|推荐：从/,
  'Xicheng AI fallback should not fabricate local guide, route, or travelogue content when the reviewed-source service is unavailable'
)

assert.match(
  genericFallback,
  /hasXichengAiContext\(context\)[\s\S]*createLocalXichengAiFallback\(question, context\)[\s\S]*createLocalKashgarAiFallback\(question\)/,
  'Generic AI fallback should keep Kashgar local fallback while routing Xicheng contexts to the safe unavailable fallback'
)
