import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const home = read('pages', 'xicheng', 'home', 'home.vue')
const scan = read('pages', 'xicheng', 'scan', 'scan.vue')

const homeOpenScanResultBlock = home.match(/openScanResult\(trigger = \{\}, source = ''\)[\s\S]*?\n\t\t\},\n\t\topenRecentRecognition/)?.[0] || ''
const scanOpenScanResultBlock = scan.match(/openScanResult\(trigger = \{\}, source = ''\)[\s\S]*?\n\t\t\},\n\t\thandleRecognitionUnavailable/)?.[0] || ''

assert.ok(homeOpenScanResultBlock, 'Xicheng home should expose openScanResult')
assert.ok(scanOpenScanResultBlock, 'Xicheng scan page should expose openScanResult')

assert.match(
  scan,
  /import \{ isXichengUnsafeSafetyStatus, normalizeXichengSafetyStatus \} from '@\/request\/xunjing\/safety\.js'/,
  'Scan page should import the shared Xicheng safety helpers before deciding whether to cache a recognition result'
)

for (const [name, block] of [
  ['home', homeOpenScanResultBlock],
  ['scan', scanOpenScanResultBlock]
]) {
  assert.match(
    block,
    /const unsafeSafetyStatus = isXichengUnsafeSafetyStatus\(normalizeXichengSafetyStatus\(result\.safetyStatus\)\)/,
    `${name} openScanResult should normalize and detect BLOCKED or UNAVAILABLE recognition results before cache writes`
  )

  assert.match(
    block,
    /if \(unsafeSafetyStatus\) \{[\s\S]*uni\.removeStorageSync\(this\.region\.storageKey\)[\s\S]*\} else \{[\s\S]*uni\.setStorageSync\(this\.region\.storageKey, result\)/,
    `${name} openScanResult should clear stale shared cache for unsafe recognition contexts and only persist safe results`
  )

  assert.match(
    block,
    /safetyStatus=\$\{encodeRouteValue\(result\.safetyStatus \|\| ''\)\}/,
    `${name} openScanResult should still route unsafe safetyStatus to the result page for fail-closed display`
  )
}

assert.match(
  homeOpenScanResultBlock,
  /if \(unsafeSafetyStatus\) \{[\s\S]*this\.recentRecognition = null[\s\S]*\} else \{[\s\S]*this\.recentRecognition = result/,
  'Home should not keep unsafe recognition results as the recent-recognition shortcut'
)

assert.doesNotMatch(
  `${home}\n${scan}`,
  /Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Unsafe recognition cache gate must not introduce client-side secrets'
)
