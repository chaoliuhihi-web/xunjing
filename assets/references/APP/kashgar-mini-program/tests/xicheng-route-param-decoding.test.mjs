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
const home = read('pages', 'xicheng', 'home', 'home.vue')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const inspiration = read('pages', 'xicheng', 'inspiration', 'inspiration.vue')
const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const routeDetail = read('pages', 'xicheng', 'route-detail', 'route-detail.vue')

assert.match(
  routeParamsSource,
  /export const decodeXichengRouteValue\s*=\s*\(value = ''\)/,
  'Shared route parameter helper should export decodeXichengRouteValue'
)

assert.match(
  routeParamsSource,
  /export const createXichengRouteOutputValue\s*=\s*\(value = '', \{[\s\S]*platform = ''[\s\S]*\} = \{\}\)/,
  'Shared route parameter helper should export createXichengRouteOutputValue for platform-safe outbound route params'
)

assert.match(
  routeParamsSource,
  /for \(let decodeIndex = 0; decodeIndex < 3; decodeIndex \+= 1\)[\s\S]*decodeURIComponent\(decodedValue\)[\s\S]*return decodedValue/,
  'Shared route parameter helper should safely decode nested H5 route values without infinite loops'
)

for (const [label, source] of [
  ['AI guide', aiGuide],
  ['travelogue', travelogue]
]) {
  assert.match(
    source,
    /import \{ decodeXichengRouteValue \} from '@\/request\/xunjing\/routeParams\.js'/,
    `${label} should import the shared Xicheng route parameter decoder`
  )
}

for (const [label, source] of [
  ['Home', home],
  ['Inspiration', inspiration]
]) {
  assert.match(
    source,
    /import \{ createXichengRouteOutputValue \} from '@\/request\/xunjing\/routeParams\.js'/,
    `${label} should import the shared outbound route helper`
  )

  assert.match(
    source,
    /const encodeRouteValue = \(value = ''\) => createXichengRouteOutputValue\(value, \{ platform: process\.env\.UNI_PLATFORM \}\)/,
    `${label} should use the shared H5-safe outbound route helper before navigating`
  )
}

for (const [label, source] of [
  ['Scan result', scanResult],
  ['Route detail', routeDetail]
]) {
  assert.match(
    source,
    /import \{ decodeXichengRouteValue, createXichengRouteOutputValue \} from '@\/request\/xunjing\/routeParams\.js'/,
    `${label} should import shared inbound and outbound route helpers`
  )

  assert.match(
    source,
    /const encodeRouteValue = \(value = ''\) => createXichengRouteOutputValue\(value, \{ platform: process\.env\.UNI_PLATFORM \}\)/,
    `${label} should use the shared H5-safe outbound route helper before navigating`
  )
}

assert.match(
  scanResult,
  /const decodeRouteValue = decodeXichengRouteValue/,
  'Scan result should keep the shared decoder for inbound route params'
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
const { decodeXichengRouteValue, createXichengRouteOutputValue } = await import(
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
assert.equal(
  createXichengRouteOutputValue('%E5%A6%99%E5%BA%94%E5%AF%BA%E7%99%BD%E5%A1%94', { platform: 'h5' }),
  '妙应寺白塔',
  'H5 route output should pass raw decoded Chinese text so uni.navigateTo encodes it once'
)
assert.equal(
  createXichengRouteOutputValue('妙应寺白塔', { platform: 'app' }),
  '%E5%A6%99%E5%BA%94%E5%AF%BA%E7%99%BD%E5%A1%94',
  'Non-H5 route output should stay URL-encoded for app and mini-program runtimes'
)
