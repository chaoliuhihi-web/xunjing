import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const triggerRequest = fs.readFileSync(path.join(root, 'request', 'xunjing', 'trigger.js'), 'utf8')
const regionConfig = fs.readFileSync(path.join(root, 'config', 'regions', 'xicheng.js'), 'utf8')

const fallbackGate = triggerRequest.match(/export const isXichengDevelopmentFallbackAllowed\s*=\s*\(\)\s*=>\s*\{[\s\S]*?\n\}/)?.[0] || ''

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
  regionConfig,
  /XICHENG_DEVELOPMENT_TRIGGER_FIXTURE[\s\S]*developmentOnly:\s*true[\s\S]*notForProduction:\s*true/,
  'The fixture should remain clearly labeled as development-only and not-for-production'
)
