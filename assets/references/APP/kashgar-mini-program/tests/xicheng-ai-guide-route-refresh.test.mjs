import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')

const currentRouteOptionsBlock = aiGuide.match(/const getCurrentXichengAiRouteOptions\s*=\s*\(\) => \{[\s\S]*?\n\}/)?.[0] || ''
const refreshBlock = aiGuide.match(/const refreshXichengAiRouteContext\s*=\s*\(\{[\s\S]*?\n\}/)?.[0] || ''
const onShowBlock = aiGuide.match(/onShow\(\(\) => \{[\s\S]*?\n\}\)/)?.[0] || ''
const onLoadBlock = aiGuide.match(/onLoad\(\(options = \{\}\) => \{[\s\S]*?\n\}\)/)?.[0] || ''
const hashRouteRefreshBlock = aiGuide.match(/const handleXichengH5RouteHashChange\s*=\s*\(\) => \{[\s\S]*?\n\}/)?.[0] || ''
const onUnloadBlock = aiGuide.match(/onUnload\(\(\) => \{[\s\S]*?\n\}\)/)?.[0] || ''

assert.ok(
  currentRouteOptionsBlock,
  'AI guide should expose current route option extraction for H5 same-page query refresh'
)

for (const required of [
  'location.hash',
  'URLSearchParams',
  'decodeRouteValue',
  'safetyStatus'
]) {
  assert.ok(currentRouteOptionsBlock.includes(required), `Current route option extraction should include ${required}`)
}

assert.ok(
  refreshBlock,
  'AI guide should expose a route refresh helper that can re-apply Xicheng context on page show'
)

for (const required of [
  'applyXichengAiContext(routeOptions)',
  'routeOptions.question',
  'setWelcomeMessage()',
  'sendInitialQuestion(decodeRouteValue(routeOptions.question))',
  'loadMessagesCache()'
]) {
  assert.ok(refreshBlock.includes(required), `Route refresh helper should include ${required}`)
}

assert.match(
  refreshBlock,
  /const previousScope = getActiveXichengCacheScope\(\)[\s\S]*const nextScope = getActiveXichengCacheScope\(\)[\s\S]*previousScope !== nextScope/,
  'Route refresh should detect POI scope changes before restoring cached messages'
)

assert.ok(
  onShowBlock.includes('refreshXichengAiRouteContext({ preferCache: true })'),
  'onShow should refresh the active Xicheng route context instead of only restoring old cached messages'
)

assert.ok(
  onLoadBlock.includes('refreshXichengAiRouteContext({ routeOptions: options, preferCache: false })'),
  'onLoad should share the same route refresh path as onShow'
)

assert.ok(
  hashRouteRefreshBlock.includes('refreshXichengAiRouteContext({ preferCache: true })'),
  'AI guide should refresh Xicheng context when an H5 hash-only route change keeps the same page instance alive'
)

assert.ok(
  hashRouteRefreshBlock.includes('interruptCurrentResponse({ showStatus: false })'),
  'AI guide should interrupt a stale in-flight answer before applying a new H5 hash route context'
)

assert.match(
  aiGuide,
  /window\.addEventListener\('hashchange',\s*handleXichengH5RouteHashChange\)/,
  'AI guide should subscribe to H5 hashchange events for same-page query refresh'
)

assert.match(
  onUnloadBlock,
  /window\.removeEventListener\('hashchange',\s*handleXichengH5RouteHashChange\)/,
  'AI guide should clean up the H5 hashchange listener on unload'
)
