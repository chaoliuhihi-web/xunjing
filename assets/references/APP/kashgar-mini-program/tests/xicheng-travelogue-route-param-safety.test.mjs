import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

for (const required of [
  'decodeJourneyRouteValue',
  "import { decodeXichengRouteValue } from '@/request/xunjing/routeParams.js'",
  'const decodeJourneyRouteValue = decodeXichengRouteValue',
  'normalizeXichengRouteCode'
]) {
  assert.ok(
    travelogue.includes(required),
    `Travelogue route parameter decoding should tolerate malformed input marker ${required}`
  )
}

assert.match(
  travelogue,
  /import \{ decodeXichengRouteValue \} from '@\/request\/xunjing\/routeParams\.js'[\s\S]*const decodeJourneyRouteValue = decodeXichengRouteValue/,
  'Travelogue should use the shared safe route decoding helper that falls back to the raw value'
)

assert.match(
  travelogue,
  /async loadJourney\(options = \{\}\)[\s\S]*const routeCode = normalizeXichengRouteCode\(decodeJourneyRouteValue\(options\.routeCode \|\| options\.routeId\)\)[\s\S]*const routePoiName = decodeJourneyRouteValue\(options\.poiName\)[\s\S]*poiCode: decodeJourneyRouteValue\(options\.poiCode\)/,
  'Travelogue loadJourney should decode POI route params through the safe helper before saving manual entry evidence'
)

assert.match(
  travelogue,
  /const resolveRouteByCode = \(routeCode = ''\) => \{[\s\S]*const normalizedRouteCode = normalizeXichengRouteCode\(routeCode\)[\s\S]*route\.routeCode === normalizedRouteCode/,
  'Travelogue route handoff should normalize legacy routeId aliases before resolving official route materials'
)

assert.doesNotMatch(
  travelogue,
  /options\.poiName \? decodeURIComponent\(options\.poiName\)|options\.poiCode \? decodeURIComponent\(options\.poiCode\)/,
  'Travelogue loadJourney should not directly decode route params because malformed URLs can break the P0 record flow'
)
