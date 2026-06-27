import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const triggerRequest = read('request', 'xunjing', 'trigger.js')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

assert.match(
  regionConfig,
  /routeRecommendation:\s*\{[\s\S]*title:\s*'白塔寺 - 历代帝王庙 - 什刹海'[\s\S]*durationText:\s*'约 2\.5 小时'/,
  'Xicheng fixture should model backend routeRecommendation data for field demos'
)

assert.match(
  triggerRequest,
  /routeRecommendation:\s*result\.routeRecommendation\s*\|\|\s*result\.recommendedRoute\s*\|\|\s*null/,
  'Trigger normalization should preserve backend routeRecommendation/recommendedRoute'
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
  assert.ok(travelogue.includes(required), `Travelogue page should show recognized route recommendation ${required}`)
}

assert.match(
  travelogue,
  /recognizedRoute\(\)[\s\S]*this\.materials\.find\([\s\S]*material\.routeRecommendation/,
  'Travelogue should derive the recognized route from recorded recognition materials'
)

assert.match(
  travelogue,
  /createXichengTravelogueDraft[\s\S]*routeRecommendation[\s\S]*routeRecommendation\.title/,
  'Travelogue draft generation should include the recognized route title when available'
)
