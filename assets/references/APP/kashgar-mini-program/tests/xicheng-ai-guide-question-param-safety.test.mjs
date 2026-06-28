import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')

assert.match(
  aiGuide,
  /import \{ decodeXichengRouteValue \} from '@\/request\/xunjing\/routeParams\.js'[\s\S]*const decodeRouteValue = decodeXichengRouteValue/,
  'AI guide should reuse the shared safe route value decoder for malformed or nested entry params'
)

assert.match(
  aiGuide,
  /onLoad\(\(options = \{\}\) => \{[\s\S]*if \(!options\.question\) return[\s\S]*showAiCompanionHome\.value = false[\s\S]*sendInitialQuestion\(decodeRouteValue\(options\.question\)\)/,
  'AI guide should decode the initial question through the safe helper before sending it to Xiaojing'
)

assert.doesNotMatch(
  aiGuide,
  /sendInitialQuestion\(decodeURIComponent\(options\.question\)\)/,
  'AI guide should not directly decode the initial question because malformed links can break the Xiaojing P0 entry flow'
)
