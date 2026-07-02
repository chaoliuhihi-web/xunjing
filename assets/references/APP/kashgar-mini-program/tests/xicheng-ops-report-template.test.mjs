import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const opsDetails = read('components', 'xicheng', 'XichengTravelogueOpsDetails.vue')
const travelogueOpsSurface = `${travelogue}\n${opsDetails}`

for (const required of [
  'xicheng-city-ops-report-v1',
  'reportTemplateSections',
  'visitCount',
  'routeCompletionRate',
  'hotPois',
  'shareCount',
  'misTriggerCount',
  'optimizationSuggestions',
  'createHotPoiRanking',
  'createOptimizationSuggestions'
]) {
  assert.ok(travelogue.includes(required), `Xicheng local ops report should include ${required}`)
}

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*templateCode:\s*'xicheng-city-ops-report-v1'[\s\S]*templateSections:\s*this\.reportTemplateSections[\s\S]*visitCount:\s*this\.materialCount \+ this\.shareArtifacts\.length[\s\S]*recognitionCount:\s*this\.materialCount[\s\S]*routeCompletionRate:\s*this\.passportProgress[\s\S]*hotPois:\s*this\.createHotPoiRanking\(\)[\s\S]*workCount:\s*this\.draft \? 1 : 0[\s\S]*shareCount:\s*this\.shareArtifacts\.length[\s\S]*misTriggerCount:\s*this\.misTriggerCount[\s\S]*optimizationSuggestions:\s*this\.createOptimizationSuggestions\(\)/,
  'Local ops report should use the fixed city operations template fields required for P0 reporting'
)

assert.match(
  travelogue,
  /opsReport\(\)[\s\S]*return \{[\s\S]*regionCode:\s*XICHENG_REGION_CONFIG\.regionCode[\s\S]*packageCode:\s*XICHENG_REGION_CONFIG\.packageCode[\s\S]*sceneCode:\s*XICHENG_REGION_CONFIG\.sceneCode[\s\S]*sourceChannel:\s*XICHENG_REGION_CONFIG\.sourceChannel[\s\S]*companionName:\s*XICHENG_REGION_CONFIG\.companionName/,
  'Local ops report should carry Xicheng package, scene, source channel, and companion context for city operations attribution'
)

assert.match(
  travelogue,
  /reportTemplateSections\(\)[\s\S]*sectionKey:\s*'traffic'[\s\S]*sectionKey:\s*'route-completion'[\s\S]*sectionKey:\s*'hot-pois'[\s\S]*sectionKey:\s*'content-works'[\s\S]*sectionKey:\s*'sharing'[\s\S]*sectionKey:\s*'mis-trigger'[\s\S]*sectionKey:\s*'optimization'/,
  'City operations report should declare fixed template sections for traffic, route completion, hot POIs, content works, sharing, mis-trigger, and optimization'
)

assert.match(
  travelogue,
  /createHotPoiRanking\(\)[\s\S]*this\.materials\.reduce\(\(ranking, material\)[\s\S]*poiName[\s\S]*visitCount[\s\S]*Object\.values\(ranking\)[\s\S]*slice\(0, 5\)/,
  'Hot POI ranking should be derived from local journey materials and capped for operations preview'
)

assert.match(
  travelogue,
  /misTriggerCount\(\)[\s\S]*triggerConfidence[\s\S]*Number\(material\.triggerConfidence\)[\s\S]*confidence > 0 && confidence < 0\.6/,
  'Mis-trigger count should flag low-confidence recognition materials for operations follow-up'
)

assert.match(
  travelogue,
  /createOptimizationSuggestions\(\)[\s\S]*this\.misTriggerCount > 0[\s\S]*this\.workSourceCount === 0[\s\S]*this\.passportProgress < 100/,
  'Optimization suggestions should react to mis-trigger, source coverage, and route completion gaps'
)

assert.match(
  travelogueOpsSurface,
  /路线完成[\s\S]*热门 POI[\s\S]*误触发[\s\S]*优化建议/,
  'Travelogue UI should expose city operations report template fields for local acceptance review'
)

assert.match(
  travelogueOpsSurface,
  /试运营日报[\s\S]*识别、路线、分享、审核来源和安全状态/,
  'City operations report UI should present a ready trial-operations report instead of a future backend placeholder'
)

assert.doesNotMatch(
  travelogueOpsSurface,
  /上线后可替换|后端真实|待替换/,
  'City operations report UI should not ship future backend replacement placeholder copy'
)

assert.doesNotMatch(
  travelogueOpsSurface,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Local operations report template should not introduce backend calls or client-side secrets'
)
