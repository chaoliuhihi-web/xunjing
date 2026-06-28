import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

for (const required of [
  'persistXichengAiGuideMaterial',
  "type: 'ai-guide'",
  "sourceLabel: '小京讲解'",
  'aiAnswerExcerpt',
  'questionLength',
  'sourceCount',
  'sceneCode',
  'sourceChannel',
  'suggestedQuestions',
  'result.suggestedQuestions',
  'materialsStorageKey'
]) {
  assert.ok(aiGuide.includes(required), `AI guide should persist Xiaojing answer material token ${required}`)
}

assert.match(
  aiGuide,
  /const persistXichengAiGuideMaterial\s*=\s*\(\{ question = '', result = \{\}, assistantMessage = null \} = \{\}\) => \{[\s\S]*if \(!hasXichengAiContext\(context\)\) return null[\s\S]*const suggestedQuestions = Array\.isArray\(result\.followUps\)[\s\S]*\? result\.followUps[\s\S]*Array\.isArray\(result\.suggestedQuestions\)[\s\S]*result\.suggestedQuestions[\s\S]*uni\.getStorageSync\(XICHENG_REGION_CONFIG\.materialsStorageKey\)[\s\S]*type:\s*'ai-guide'[\s\S]*sourceLabel:\s*'小京讲解'[\s\S]*aiAnswerExcerpt:\s*String\(result\.answer \|\| assistantMessageContent \|\| ''\)\.slice\(0, 180\)[\s\S]*sources:\s*normalizeXichengReviewedSources\(result\.sources\)[\s\S]*suggestedQuestions[\s\S]*reviewStatus:\s*XICHENG_REGION_CONFIG\.reviewStatus\.pending[\s\S]*publishStatus:\s*'private'[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.materialsStorageKey/,
  'AI guide should create a local reviewable material from Xiaojing answer, reviewed sources, follow-ups, and safety status'
)

assert.match(
  aiGuide,
  /const aiResult = await startXunjingAiRequest\([\s\S]*persistXichengAiGuideMaterial\(\{[\s\S]*question:\s*userMessage[\s\S]*result:\s*aiResult[\s\S]*assistantMessage[\s\S]*\}\)[\s\S]*recordXunjingResourceEvent\(\{/,
  'AI guide should persist the Xiaojing answer material after the AI response and before non-blocking analytics'
)

const persistBlock = aiGuide.match(/const persistXichengAiGuideMaterial\s*=\s*\(\{[\s\S]*?\n\}/)?.[0] || ''
assert.ok(persistBlock, 'AI guide should expose a persistXichengAiGuideMaterial helper')

for (const required of [
  'sceneCode: XICHENG_REGION_CONFIG.aiSceneCode',
  'sourceChannel: context.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel'
]) {
  assert.ok(persistBlock.includes(required), `Xiaojing answer material should preserve operations attribution ${required}`)
}

assert.doesNotMatch(
  persistBlock,
  /uni\.request|\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Persisting Xiaojing answer material should stay local and must not introduce backend calls or client-side secrets'
)

for (const required of [
  'aiGuideMaterials',
  'aiGuideMaterialCount',
  'aiAnswerExcerpt',
  '小京讲解',
  '小京回答'
]) {
  assert.ok(travelogue.includes(required), `Travelogue should expose Xiaojing answer evidence token ${required}`)
}

assert.match(
  travelogue,
  /hasReviewableMaterialEvidence\s*=\s*\(material = \{\}\) => \{[\s\S]*material\.aiAnswerExcerpt[\s\S]*\}[\s\S]*hasXichengTravelogueDraftEvidence\s*=\s*\(\{[\s\S]*return hasReviewableMaterialEvidence\(material\)[\s\S]*return hasMaterialEvidence/,
  'Travelogue evidence gate should treat Xiaojing answer excerpts as valid journey evidence'
)

assert.match(
  travelogue,
  /createXichengTravelogueDraft\s*=\s*\(\{[\s\S]*const aiGuideExcerpts = materials[\s\S]*material\.type === 'ai-guide'[\s\S]*material\.aiAnswerExcerpt[\s\S]*const aiGuideText = aiGuideExcerpts\.length > 0[\s\S]*小京回答提到/,
  'Travelogue draft generator should fold Xiaojing answer excerpts into the generated draft'
)

assert.match(
  travelogue,
  /aiGuideMaterials\(\)[\s\S]*return this\.materials\.filter\(material => material && material\.type === 'ai-guide'\)[\s\S]*aiGuideMaterialCount\(\)[\s\S]*return this\.aiGuideMaterials\.length/,
  'Travelogue should compute Xiaojing answer material count from local journey materials'
)

assert.match(
  travelogue,
  /saveDraft\(\{ silent = false \} = \{\}\)[\s\S]*aiGuideMaterialCount:\s*this\.aiGuideMaterialCount/,
  'Saved travelogue draft should include Xiaojing answer material count'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*aiGuideMaterialCount:\s*this\.aiGuideMaterialCount/,
  'Review package should include Xiaojing answer material count'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*aiGuideMaterialCount:\s*this\.aiGuideMaterialCount/,
  'Local operations report should include Xiaojing answer material count'
)
