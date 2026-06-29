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
  /const sources = getXichengContextSources\(context\)[\s\S]*if \(sources\.length === 0\) \{[\s\S]*answer:\s*XICHENG_UNAVAILABLE_ANSWER[\s\S]*sources:\s*\[\][\s\S]*followUps:\s*\[\][\s\S]*safetyStatus:\s*'UNAVAILABLE'/,
  'Xicheng AI fallback should still return an unavailable state without sources when no reviewed source is available'
)

assert.match(
  xichengFallback,
  /const fallbackAnswer = `小京暂时没有拿到在线 AI 回答[\s\S]*已审核来源[\s\S]*sourceSummary[\s\S]*return \{[\s\S]*answer:\s*fallbackAnswer[\s\S]*sources[\s\S]*followUps:\s*createSourceFollowUps\(sources\)[\s\S]*safetyStatus:\s*'PASSED'/,
  'Xicheng AI fallback may only degrade to a source-backed summary when reviewed context sources are already available'
)

assert.match(
  aiGuide,
  /responseTimeoutTimer = setTimeout\(\(\) => \{[\s\S]*if \(hasXichengAiContext\(xichengAiContext\.value\)\) \{[\s\S]*const timeoutFallback = createLocalXichengAiFallback\(question, xichengAiContext\.value\)[\s\S]*appendAnswerContent\(state, timeoutFallback\.answer\)[\s\S]*sources: timeoutFallback\.sources/,
  'Xicheng AI timeout fallback should reuse the same reviewed-source guard instead of always dropping to empty sources'
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

assert.match(
  aiGuide,
  /if \(result && result\.fallback\) \{[\s\S]*state\.safetyStatus = result\.safetyStatus \|\| ''[\s\S]*safetyStatus:\s*state\.safetyStatus[\s\S]*settleRequest\(\(\) => resolve\(\{ answer:\s*state\.fullContent,\s*followUps:\s*state\.followUps,\s*sources:\s*state\.sources,\s*safetyStatus:\s*state\.safetyStatus,\s*fallback:\s*true \}\)\)/,
  'Streaming fallback result should preserve UNAVAILABLE safetyStatus for material persistence and operations events'
)
