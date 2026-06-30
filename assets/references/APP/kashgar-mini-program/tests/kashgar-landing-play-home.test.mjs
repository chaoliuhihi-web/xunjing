import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const indexPage = fs.readFileSync(path.join(root, 'pages', 'index', 'index.vue'), 'utf8')
const kashgarHomeContent = fs.readFileSync(path.join(root, 'pages', 'index', 'kashgar-home-content.js'), 'utf8')
const kashgarLandingStyle = fs.readFileSync(path.join(root, 'pages', 'index', 'index-kashgar-landing.css'), 'utf8')
const kashgarPlayStyle = fs.readFileSync(path.join(root, 'pages', 'index', 'index-kashgar-play.css'), 'utf8')
const homeSource = `${indexPage}\n${kashgarHomeContent}\n${kashgarLandingStyle}\n${kashgarPlayStyle}`
const pagesJson = fs.readFileSync(path.join(root, 'pages.json'), 'utf8')

for (const required of [
  'KASHGAR_LANDING_LOCAL_CONTENT_ENABLED',
  'KASHGAR_PLAY_HOME_LOCAL_CONTENT_ENABLED',
  'showKashgarLanding',
  'showKashgarPlayHome',
  'kashgar-landing-entry',
  '古城故事 / 丝路风物 / 特色美食 / 官方攻略',
  '你好呀！',
  '我是喀小寻，',
  '你的丝路小导游！',
  '进入喀什',
  '/static/kashgar/map-illustration.png',
  '/static/tabbar/ai_companion_avatar.png',
]) {
  assert.ok(homeSource.includes(required), `Kashgar landing entry should include ${required}`)
}

assert.match(
  indexPage,
  /喀小寻带你[\s\S]*玩喀什/,
  'Kashgar landing entry should keep the reference launch title'
)

for (const required of [
  'kashgar-play-home',
  '喀什市',
  '以下是为你推荐的喀什旅行攻略，',
  '快开启喀什之旅吧',
  '点我对话吧~',
  '扫一扫',
  '景点/书本讲解',
  '跟着游记去旅行',
  '精选游记路线',
  '记录旅行',
  '随手记，自动成书',
  '推荐打卡地',
  '艾提尕尔清真寺',
  '高台民居',
  '喀什古城老街',
  '官方攻略',
  '喀什古城半日游',
  '查看攻略',
  '进入导览',
  '/static/kashgar/home-hero.png',
  '/static/kashgar/official-guide.png',
]) {
  assert.ok(homeSource.includes(required), `Kashgar play home should include ${required}`)
}

assert.match(
  indexPage,
  /<view v-else-if="legacyIndexRouteResolved && useKashgarLocalContent && showKashgarLanding" class="kashgar-home kashgar-landing-entry">/,
  'Landing screen should be a local branch inside the existing index page after explicit Kashgar route classification'
)

assert.match(
  indexPage,
  /<view v-else-if="legacyIndexRouteResolved && useKashgarLocalContent && showKashgarPlayHome" class="kashgar-home kashgar-play-home">/,
  'Play home should be a local branch inside the existing index page after explicit Kashgar route classification'
)

assert.match(
  indexPage,
  /onLoad\(options = \{\}\)\s*\{[\s\S]*this\.resolveKashgarHomeMode\(options\)[\s\S]*this\.applyKashgarHomeContent\(\)/,
  'Index onLoad should resolve local Kashgar modes before applying reused home content'
)

assert.match(
  indexPage,
  /resolveKashgarHomeMode\(options = \{\}\)\s*\{[\s\S]*options\.mode === 'landing'[\s\S]*options\.mode === 'play'/,
  'Index page should switch landing and play states from route mode without creating new pages'
)

assert.match(
  indexPage,
  /enterKashgarExperience\(\)\s*\{[\s\S]*this\.showKashgarLanding = false[\s\S]*this\.showKashgarPlayHome = true/,
  'Landing entry button should enter the reused play home state'
)

assert.match(
  indexPage,
  /openKashgarPlayChat\(\)\s*\{[\s\S]*url:\s*'\/pages\/ai-guide\/ai-guide'/,
  'Play home mascot card should reuse the original AI guide page'
)

assert.ok(
  !pagesJson.includes('kashgar-landing') && !pagesJson.includes('kashgar-play-home'),
  'Kashgar launch and play screens should not add separate UniApp pages'
)
