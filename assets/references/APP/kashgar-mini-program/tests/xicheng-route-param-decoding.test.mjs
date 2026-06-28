import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

assert.ok(
  exists('request', 'xunjing', 'routeParams.js'),
  'Xicheng route parameter decoding should live in a shared request/xunjing helper'
)

const routeParamsSource = read('request', 'xunjing', 'routeParams.js')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

assert.match(
  routeParamsSource,
  /export const decodeXichengRouteValue\s*=\s*\(value = ''\)/,
  'Shared route parameter helper should export decodeXichengRouteValue'
)

assert.match(
  routeParamsSource,
  /for \(let decodeIndex = 0; decodeIndex < 3; decodeIndex \+= 1\)[\s\S]*decodeURIComponent\(decodedValue\)[\s\S]*return decodedValue/,
  'Shared route parameter helper should safely decode nested H5 route values without infinite loops'
)

for (const [label, source] of [
  ['scan result', scanResult],
  ['AI guide', aiGuide],
  ['travelogue', travelogue]
]) {
  assert.match(
    source,
    /import \{ decodeXichengRouteValue \} from '@\/request\/xunjing\/routeParams\.js'/,
    `${label} should import the shared Xicheng route parameter decoder`
  )
}

assert.match(
  scanResult,
  /const decodeRouteValue = decodeXichengRouteValue/,
  'Scan result should reuse the shared route decoder for source, POI, and safetyStatus params'
)

assert.match(
  aiGuide,
  /const decodeRouteValue = decodeXichengRouteValue/,
  'AI guide should reuse the shared route decoder before matching cached recognition sources'
)

assert.match(
  travelogue,
  /const decodeJourneyRouteValue = decodeXichengRouteValue/,
  'Travelogue should reuse the shared route decoder before creating manual route materials'
)

const runtimeSource = routeParamsSource
const { decodeXichengRouteValue } = await import(
  `data:text/javascript;base64,${Buffer.from(runtimeSource).toString('base64')}`
)

assert.equal(decodeXichengRouteValue('白塔寺'), '白塔寺')
assert.equal(decodeXichengRouteValue('%E7%99%BD%E5%A1%94%E5%AF%BA'), '白塔寺')
assert.equal(decodeXichengRouteValue('%25E7%2599%25BD%25E5%25A1%2594%25E5%25AF%25BA'), '白塔寺')
assert.equal(
  decodeXichengRouteValue('%2525E7%252599%2525BD%2525E5%2525A1%252594%2525E5%2525AF%2525BA'),
  '白塔寺'
)
assert.equal(
  decodeXichengRouteValue('%E7%ZZ'),
  '%E7%ZZ',
  'Malformed route parameters should remain readable instead of throwing during page load'
)
