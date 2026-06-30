import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const pagesJson = JSON.parse(read('pages.json'))
const appConfig = read('app.js')
const app = read('App.vue')
const index = read('pages', 'index', 'index.vue')

assert.equal(
  pagesJson.pages[0]?.path,
  'pages/xicheng/home/home',
  'APP default launch page should be the Xicheng P0 home, while Kashgar remains addressable at /pages/index/index'
)

assert.match(
  appConfig,
  /tabBar:\s*\{[\s\S]*list:\s*\[[\s\S]*pagePath:\s*'pages\/xicheng\/home\/home'[\s\S]*text:\s*'西城'/,
  'Global APP tab config should also point the default home entry at the Xicheng P0 home'
)

assert.doesNotMatch(
  appConfig,
  /tabBar:\s*\{[\s\S]*list:\s*\[[\s\S]*pagePath:\s*'pages\/index\/index'[\s\S]*text:\s*'首页'/,
  'Global APP tab config should not keep the legacy Kashgar index as the default home entry'
)

assert.match(
  index,
  /const XICHENG_HOME_ROUTE\s*=\s*'\/pages\/xicheng\/home\/home'/,
  'Legacy index page should centralize the Xicheng home route used for default redirects'
)

assert.match(
  index,
  /redirectToXichengHome\(\)[\s\S]*const runWindowFallback[\s\S]*window\.location\.replace\(`\$\{origin\}#\$\{XICHENG_HOME_ROUTE\}`\)[\s\S]*uni\.reLaunch\(\{[\s\S]*url:\s*XICHENG_HOME_ROUTE[\s\S]*fail:\s*runWindowFallback[\s\S]*redirectLegacyIndexToXicheng\(options = \{\}\)[\s\S]*this\.shouldKeepKashgarLegacyIndex\(options\)[\s\S]*this\.resolveXunjingLaunchScene\(options\)[\s\S]*scan\.sceneCode \|\| scan\.packageCode[\s\S]*setTimeout\(\(\) => \{[\s\S]*this\.redirectToXichengHome\(\)/,
  'Opening /pages/index/index without an explicit Kashgar or scan context should route users back to the Xicheng P0 home through the Uni router, with a full H5 hash fallback'
)

assert.match(
  index,
  /<view v-if="isRedirectingToXicheng" class="xicheng-legacy-redirect"/,
  'Default legacy index opens should show a Xicheng transition state instead of exposing the Kashgar template before redirect'
)

assert.match(
  index,
  /legacyIndexRouteResolved:\s*false/,
  'Legacy index route classification should start unresolved so default opens cannot flash Kashgar before onLoad'
)

assert.match(
  index,
  /<view v-else-if="legacyIndexRouteResolved && useKashgarLocalContent && showKashgarLanding"[\s\S]*<view v-else-if="legacyIndexRouteResolved && useKashgarLocalContent && showKashgarPlayHome"[\s\S]*<view v-else-if="legacyIndexRouteResolved && useKashgarLocalContent"/,
  'Legacy index should not render Kashgar content until the route has been classified as an explicit Kashgar or scan context'
)

assert.match(
  index,
  /isRedirectingToXicheng:\s*false[\s\S]*redirectLegacyIndexToXicheng\(options = \{\}\)[\s\S]*this\.isRedirectingToXicheng = false[\s\S]*return false[\s\S]*this\.isRedirectingToXicheng = false[\s\S]*return false[\s\S]*this\.isRedirectingToXicheng = true/,
  'Legacy index should only suppress Kashgar content while the default Xicheng redirect is active, preserving explicit Kashgar and scan contexts'
)

assert.match(
  index,
  /<text class="xicheng-legacy-redirect-title">西城 AI 旅伴<\/text>[\s\S]*\.xicheng-legacy-redirect\s*\{/,
  'The legacy redirect placeholder should be visibly branded as the Xicheng AI companion'
)

assert.match(
  index,
  /shouldKeepKashgarLegacyIndex\(options = \{\}\)[\s\S]*city === 'kashgar'[\s\S]*options\.mode === 'landing'[\s\S]*options\.mode === 'play'[\s\S]*options\.dramaId/,
  'Kashgar should remain available only through explicit city, landing/play, or drama deep-link context'
)

assert.match(
  index,
  /onLoad\(options = \{\}\)\s*\{[\s\S]*this\.initNavigationBar\(\)[\s\S]*if \(this\.redirectLegacyIndexToXicheng\(options\)\) return[\s\S]*this\.resolveKashgarHomeMode\(options\)[\s\S]*this\.applyKashgarHomeContent\(\)[\s\S]*this\.resolveXunjingScanLaunch\(options\)/,
  'Legacy index onLoad should redirect default opens before rendering Kashgar, while preserving explicit Kashgar and scan flows'
)

assert.match(
  index,
  /getH5LegacyIndexRouteOptions\(\)[\s\S]*typeof window === 'undefined'[\s\S]*window\.location\.hash[\s\S]*\/pages\/index\/index[\s\S]*this\.parseXunjingQueryString\(query\)/,
  'Legacy index should parse the H5 hash query so SPA navigation to the old index route can still be redirected'
)

assert.match(
  index,
  /onShow\(\)\s*\{[\s\S]*if \(this\.useKashgarLocalContent\) \{[\s\S]*this\.redirectLegacyIndexToXicheng\(this\.getH5LegacyIndexRouteOptions\(\)\)[\s\S]*return[\s\S]*this\.syncTheaterLikeStateFromApi\(\)/,
  'Legacy index onShow should also redirect default H5 hash navigations that do not remount the page'
)

assert.match(
  index,
  /path:\s*`\/pages\/index\/index\?city=kashgar&dramaId=\$\{item\.id\}`[\s\S]*path:\s*'\/pages\/index\/index\?city=kashgar'/,
  'Kashgar share paths should opt into the legacy Kashgar route explicitly'
)

for (const route of [
  'pages/xicheng/home/home',
  'pages/xicheng/scan-result/scan-result',
  'pages/xicheng/route-detail/route-detail',
  'pages/xicheng/travelogue/travelogue',
  'pages/xicheng/inspiration/inspiration',
  'pages/ai-guide/ai-guide',
]) {
  assert.ok(
    app.includes(`'${route}'`),
    `Cold-start P0 route ${route} should be public so unauthenticated visitors can complete the Xicheng companion flow`
  )
}
