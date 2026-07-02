import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const triggerRequest = read('request', 'xunjing', 'trigger.js')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const opsDetails = read('components', 'xicheng', 'XichengTravelogueOpsDetails.vue')
const travelogueRouteSurface = `${travelogue}\n${opsDetails}`

assert.match(
  regionConfig,
  /routeRecommendation:\s*\{[\s\S]*title:\s*'白塔寺 - 历代帝王庙 - 什刹海'[\s\S]*durationText:\s*'约 2\.5 小时'/,
  'Xicheng fixture should model backend routeRecommendation data for field demos'
)

assert.match(
  triggerRequest,
  /const normalizeRecommendedRoute\s*=\s*\(result = \{\}\) => \{[\s\S]*const safetyStatus = normalizeXichengSafetyStatus\(result\.safetyStatus\)[\s\S]*isXichengUnsafeSafetyStatus\(safetyStatus\)[\s\S]*return null[\s\S]*return result\.routeRecommendation \|\| result\.recommendedRoute \|\| null/,
  'Trigger normalization should preserve backend routeRecommendation/recommendedRoute only when reviewed sources are available'
)

assert.match(
  triggerRequest,
  /routeRecommendation:\s*normalizeRecommendedRoute\(result\)[\s\S]*recommendedRoute:\s*normalizeRecommendedRoute\(result\)/,
  'Trigger normalization should not preserve unsafe routeRecommendation/recommendedRoute fields'
)

for (const required of [
  'routeRecommendation',
  'recommendedRoute',
  '推荐路线',
  'route-card',
  'route-title',
  'route-steps'
]) {
  assert.ok(scanResult.includes(required), `Recognition result page should surface route recommendation ${required}`)
}

assert.match(
  scanResult,
  /recommendedRoute\(\)[\s\S]*this\.result\.routeRecommendation\s*\|\|\s*this\.result\.recommendedRoute\s*\|\|\s*null/,
  'Recognition result page should expose a computed recommendedRoute from normalized trigger data'
)

assert.match(
  scanResult,
  /startRecording\(\)[\s\S]*routeRecommendation:\s*this\.recommendedRoute/,
  'Recognition result startRecording should persist the recommended route into journey materials'
)

for (const required of [
  'recognizedRoute',
  '识别推荐路线',
  'routeRecommendation',
  'route-steps'
]) {
  assert.ok(travelogueRouteSurface.includes(required), `Travelogue page should show recognized route recommendation ${required}`)
}

assert.match(
  travelogue,
  /recognizedRoute\(\)[\s\S]*const routeMaterial = this\.materials\.find\([\s\S]*material\.routeRecommendation[\s\S]*if \(routeMaterial\) return routeMaterial\.routeRecommendation[\s\S]*return this\.importedRoute \|\| null/,
  'Travelogue should derive the active route from recorded recognition materials, then fall back to the imported official route'
)

assert.match(
  travelogue,
  /createXichengTravelogueDraft[\s\S]*routeRecommendation[\s\S]*routeRecommendation\.title/,
  'Travelogue draft generation should include the recognized route title when available'
)
