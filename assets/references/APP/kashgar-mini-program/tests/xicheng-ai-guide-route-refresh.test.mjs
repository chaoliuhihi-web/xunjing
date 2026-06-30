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
  'createXichengRouteSignature(routeOptions)',
  'lastAppliedXichengRouteSignature = routeSignature',
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
  hashRouteRefreshBlock.includes('const routeOptions = mergeXichengAiRouteOptions()')
    && hashRouteRefreshBlock.includes('const nextRouteSignature = createXichengRouteSignature(routeOptions)')
    && hashRouteRefreshBlock.includes('nextRouteSignature === lastAppliedXichengRouteSignature')
    && hashRouteRefreshBlock.includes('return')
    && hashRouteRefreshBlock.includes('refreshXichengAiRouteContext({ routeOptions, preferCache: true })'),
  'AI guide should ignore duplicate H5 hashchange events for the already applied route while refreshing real same-page route changes'
)

assert.ok(
  hashRouteRefreshBlock.includes('interruptCurrentResponse({ showStatus: false })'),
  'AI guide should interrupt a stale in-flight answer before applying a new H5 hash route context'
)

assert.ok(
  hashRouteRefreshBlock.indexOf('nextRouteSignature === lastAppliedXichengRouteSignature') < hashRouteRefreshBlock.indexOf('interruptCurrentResponse({ showStatus: false })'),
  'AI guide should compare the H5 route signature before interrupting an in-flight initial question'
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
