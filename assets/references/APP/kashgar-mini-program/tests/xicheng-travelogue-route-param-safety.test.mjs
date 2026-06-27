import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

for (const required of [
  'decodeJourneyRouteValue',
  'return decodeURIComponent(String(value || \'\'))',
  'catch (error)',
  'return String(value || \'\')'
]) {
  assert.ok(
    travelogue.includes(required),
    `Travelogue route parameter decoding should tolerate malformed input marker ${required}`
  )
}

assert.match(
  travelogue,
  /const decodeJourneyRouteValue\s*=\s*\(value = ''\) => \{[\s\S]*try \{[\s\S]*return decodeURIComponent\(String\(value \|\| ''\)\)[\s\S]*\} catch \(error\) \{[\s\S]*return String\(value \|\| ''\)[\s\S]*\}/,
  'Travelogue should use a safe route decoding helper that falls back to the raw value'
)

assert.match(
  travelogue,
  /async loadJourney\(options = \{\}\)[\s\S]*const routePoiName = decodeJourneyRouteValue\(options\.poiName\)[\s\S]*poiCode: decodeJourneyRouteValue\(options\.poiCode\)/,
  'Travelogue loadJourney should decode POI route params through the safe helper before saving manual entry evidence'
)

assert.doesNotMatch(
  travelogue,
  /options\.poiName \? decodeURIComponent\(options\.poiName\)|options\.poiCode \? decodeURIComponent\(options\.poiCode\)/,
  'Travelogue loadJourney should not directly decode route params because malformed URLs can break the P0 record flow'
)
