import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')
const aiGuideCss = read('pages', 'ai-guide', 'ai-guide-xicheng-chat.css')

const normalizeContextBlock = aiGuide.match(/const normalizeXichengAiContext\s*=\s*\(options = \{\}\) => \([\s\S]*?\n\}\)/)?.[0] || ''
const applyContextBlock = aiGuide.match(/const applyXichengAiContext\s*=\s*\(options = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const contextQuestionBlock = aiGuide.match(/const buildXichengContextQuestion\s*=\s*\(question = '', context = xichengAiContext\.value\) => \{[\s\S]*?\n\}/)?.[0] || ''
const heroSubtitleBlock = aiGuide.match(/const xichengHeroSubtitle\s*=\s*computed\(\(\) => \{[\s\S]*?\n\}\)/)?.[0] || ''

assert.ok(normalizeContextBlock, 'AI guide should expose Xicheng context normalization')
assert.ok(applyContextBlock, 'AI guide should expose Xicheng context application')
assert.ok(contextQuestionBlock, 'AI guide should expose Xicheng prompt context builder')
assert.ok(heroSubtitleBlock, 'AI guide should expose Xicheng hero subtitle')

for (const required of [
  'parseXichengVisionAgentContext',
  'visionAgentContext: parseXichengVisionAgentContext(options.visionAgentContext)',
  'sourceRecognitionContext',
  'sceneFusionSummary',
  'sceneFusionSignals',
  'worldInterfaceSummary',
  'worldInterfaceSignals',
  'visionAgentMemorySessionText',
  'memorySessionSceneCount',
  'localTimeText',
  'weatherText',
  'headingText',
  'serviceText',
  'knowledgeGraphText',
  'agentDecisionActionTitle',
  'agentDecisionReasonSummary',
  'agentDecisionReasonCards'
]) {
  assert.ok(aiGuide.includes(required), `AI guide should carry Vision Agent context token ${required}`)
}

assert.match(
  aiGuide,
  /const parseXichengVisionAgentContext\s*=\s*\(value = ''\) => \{[\s\S]*decodeRouteValue\(value\)[\s\S]*JSON\.parse[\s\S]*sourceRecognitionContext/,
  'AI guide should decode the route Vision Agent context JSON and fail soft into sourceRecognitionContext text'
)

assert.match(
  applyContextBlock,
  /visionAgentContext:\s*context\.visionAgentContext[\s\S]*sourceRecognitionContext:\s*context\.sourceRecognitionContext[\s\S]*sceneFusionSummary:\s*context\.sceneFusionSummary[\s\S]*sceneFusionSignals:\s*context\.sceneFusionSignals[\s\S]*worldInterfaceSummary:\s*context\.worldInterfaceSummary[\s\S]*worldInterfaceSignals:\s*context\.worldInterfaceSignals[\s\S]*visionAgentMemorySessionText:\s*context\.visionAgentMemorySessionText[\s\S]*memorySessionSceneCount:\s*context\.memorySessionSceneCount[\s\S]*agentDecisionReasonSummary:\s*context\.agentDecisionReasonSummary[\s\S]*agentDecisionReasonCards:\s*context\.agentDecisionReasonCards/,
  'Applied Xiaojing context should retain Vision Agent scene fusion, World Interface, memory session, decision reasons, and live-signal fields'
)

assert.match(
  contextQuestionBlock,
  /worldInterfaceSummary[\s\S]*世界交互入口[\s\S]*sceneFusionSummary[\s\S]*AI识境现场判断[\s\S]*agentDecisionReasonSummary[\s\S]*Agent决策依据[\s\S]*visionAgentMemorySessionText[\s\S]*连续识境[\s\S]*localTimeText[\s\S]*weatherText[\s\S]*headingText/,
  'Xiaojing request prompt should include World Interface, AI识境 scene decision, Agent decision reasons, memory continuity, and live environment signals'
)

assert.match(
  heroSubtitleBlock,
  /agentDecisionReasonSummary[\s\S]*worldInterfaceSummary[\s\S]*sceneFusionSummary[\s\S]*AI识境已接入[\s\S]*visionAgentMemorySessionText/,
  'Xicheng Xiaojing hero subtitle should make the carried AI识境 decision reasons and World Interface context visible'
)

for (const required of [
  'xichengVisionAgentContextChips',
  'xicheng-vision-agent-strip',
  'AI识境已接入',
  'xicheng-vision-agent-chip'
]) {
  assert.ok(aiGuide.includes(required), `Xicheng Xiaojing UI should expose Vision Agent context chip ${required}`)
}

assert.match(
  aiGuide,
  /const xichengVisionAgentContextChips = computed\(\(\) => \{[\s\S]*agentDecisionReasonSummary[\s\S]*worldInterfaceSummary[\s\S]*sceneFusionSummary[\s\S]*visionAgentMemorySessionText[\s\S]*localTimeText[\s\S]*weatherText[\s\S]*headingText[\s\S]*slice\(0, 6\)/,
  'Xicheng Xiaojing should derive compact visible chips from Agent decision reasons, World Interface, scene fusion, memory, time, weather, and heading signals'
)

for (const required of [
  '.xicheng-vision-agent-strip',
  '.xicheng-vision-agent-chip-row',
  '.xicheng-vision-agent-chip'
]) {
  assert.ok(aiGuideCss.includes(required), `Xicheng Xiaojing CSS should style Vision Agent context strip: ${required}`)
}
