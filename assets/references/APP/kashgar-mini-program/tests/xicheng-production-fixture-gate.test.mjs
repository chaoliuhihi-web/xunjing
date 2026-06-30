import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const triggerRequest = fs.readFileSync(path.join(root, 'request', 'xunjing', 'trigger.js'), 'utf8')
const regionConfig = fs.readFileSync(path.join(root, 'config', 'regions', 'xicheng.js'), 'utf8')
const home = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'home', 'home.vue'), 'utf8')
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')

const fallbackGate = triggerRequest.match(/export const isXichengDevelopmentFallbackAllowed\s*=\s*\(\)\s*=>\s*\{[\s\S]*?\n\}/)?.[0] || ''
const fixtureCacheGate = triggerRequest.match(/export const isXichengDevelopmentRecognitionCacheBlocked\s*=\s*\(recognition = \{\}\)\s*=>\s*\{[\s\S]*?\n\}/)?.[0] || ''

assert.ok(
  fallbackGate,
  'Xicheng trigger facade should expose a production-safe development fixture gate'
)

assert.match(
  fallbackGate,
  /runtimeEnv\.PROD\s*===\s*true[\s\S]*runtimeEnv\.MODE\s*===\s*'production'[\s\S]*nodeEnv\s*===\s*'production'/,
  'Development trigger fixture gate should explicitly reject known production builds'
)

assert.match(
  fallbackGate,
  /runtimeEnv\.VITE_XICHENG_ALLOW_DEVELOPMENT_FIXTURE\s*===\s*'true'/,
  'Development trigger fixture gate should still allow an explicit local field-demo override'
)

assert.match(
  fallbackGate,
  /runtimeEnv\.DEV\s*===\s*true|runtimeEnv\.MODE\s*===\s*'development'|nodeEnv\s*===\s*'development'/,
  'Development trigger fixture gate should only infer fixture access from explicit development signals'
)

assert.doesNotMatch(
  fallbackGate,
  /nodeEnv\s*!==\s*'production'/,
  'Unknown or unset NODE_ENV should not enable the Xicheng development fixture by default'
)

assert.match(
  triggerRequest,
  /allowDevelopmentFallback\s*=\s*isXichengDevelopmentFallbackAllowed\(\)/,
  'Text and photo recognition should use the production-safe development fixture gate as their default'
)

assert.match(
  fixtureCacheGate,
  /recognition\.developmentOnly \|\| recognition\.notForProduction \|\| recognition\.triggerType === 'development-fixture'[\s\S]*!isXichengDevelopmentFallbackAllowed\(\)/,
  'Xicheng trigger facade should centralize stale development fixture cache blocking for all production-facing pages'
)

assert.match(
  regionConfig,
  /XICHENG_DEVELOPMENT_TRIGGER_FIXTURE[\s\S]*developmentOnly:\s*true[\s\S]*notForProduction:\s*true/,
  'The fixture should remain clearly labeled as development-only and not-for-production'
)

assert.match(
  home,
  /import \{[\s\S]*isXichengDevelopmentRecognitionCacheBlocked[\s\S]*\} from '@\/request\/xunjing\/trigger\.js'/,
  'Xicheng home should import the shared development fixture cache gate before restoring cached recognition results'
)

assert.match(
  home,
  /isBlockedDevelopmentRecognitionCache\(recognition = \{\}\)[\s\S]*return isXichengDevelopmentRecognitionCacheBlocked\(recognition\)/,
  'Xicheng home should delegate stale development-only recognition cache detection to the shared trigger facade'
)

assert.match(
  home,
  /loadRecentRecognition\(\)[\s\S]*if \(this\.isBlockedDevelopmentRecognitionCache\(cached\)\) \{[\s\S]*uni\.removeStorageSync\(XICHENG_REGION_CONFIG\.storageKey\)[\s\S]*this\.recentRecognition = null[\s\S]*return/,
  'Xicheng home should clear stale development fixture cache instead of showing it as a production recent recognition'
)

assert.match(
  home,
  /openScanResult\(trigger = \{\}, source = ''\)[\s\S]*if \(this\.isBlockedDevelopmentRecognitionCache\(trigger\)\) \{[\s\S]*this\.handleRecognitionUnavailable\(source \|\| 'text'\)[\s\S]*return[\s\S]*uni\.setStorageSync\(this\.region\.storageKey, result\)/,
  'Xicheng home should not persist or navigate development fixture recognition payloads when production does not allow fixtures'
)

assert.match(
  scanResult,
  /import \{ isXichengDevelopmentRecognitionCacheBlocked \} from '@\/request\/xunjing\/trigger\.js'/,
  'Xicheng recognition result page should import the shared production-safe development fixture cache gate'
)

assert.match(
  scanResult,
  /isBlockedDevelopmentRecognitionCache\(recognition = \{\}\)[\s\S]*return isXichengDevelopmentRecognitionCacheBlocked\(recognition\)/,
  'Xicheng recognition result page should delegate stale development-only recognition cache detection to the shared trigger facade'
)

assert.match(
  scanResult,
  /const mergedRouteOptions = mergeXichengScanResultRouteOptions\(options\)[\s\S]*const routeOptions = normalizeRouteOptions\(mergedRouteOptions\)[\s\S]*const routeUnsafeSafetyStatus = isXichengUnsafeSafetyStatus\(routeOptions\.safetyStatus\)[\s\S]*const cachedBlockedByProductionFixture = this\.isBlockedDevelopmentRecognitionCache\(cached\)[\s\S]*if \(cachedBlockedByProductionFixture\) \{[\s\S]*uni\.removeStorageSync\(XICHENG_REGION_CONFIG\.storageKey\)[\s\S]*const selectedCached = cachedBlockedByProductionFixture \|\| routeUnsafeSafetyStatus[\s\S]*\? null[\s\S]*: selectCachedRecognitionForRoute\(cached, mergedRouteOptions\)/,
  'Xicheng recognition result page should clear stale development fixture cache and unsafe route cache before normalizing the result'
)
