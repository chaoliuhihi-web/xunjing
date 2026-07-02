import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const companionAsset = path.join(root, 'static', 'xicheng', 'xiaojing-companion.png')
const homeCompanionAsset = path.join(root, 'static', 'xicheng', 'xiaojing-companion-cutout-v2.png')
const heroPaperAsset = path.join(root, 'static', 'xicheng', 'home-hero-xicheng-approved-v3.jpg')
const heroLandmarkAsset = path.join(root, 'static', 'xicheng', 'scene-baitasi-waterfront.jpg')
const routeAssets = [
  'route-baitasi-culture.jpg',
  'route-shichahai-waterfront.jpg',
  'route-hutong-life.jpg'
].map(fileName => path.join(root, 'static', 'xicheng', fileName))
const styleBlock = home.match(/<style scoped>[\s\S]*<\/style>/)?.[0] || ''

assert.ok(
  fs.existsSync(companionAsset),
  'Xicheng APP should ship a dedicated Xiaojing companion visual asset'
)

assert.ok(
  fs.statSync(companionAsset).size < 500 * 1024,
  'Xicheng Xiaojing companion asset should be compact enough for the APP first viewport'
)

assert.ok(
  fs.existsSync(homeCompanionAsset),
  'Xicheng APP should ship a home-specific Xiaojing cutout so the hero does not show a rectangular image block'
)

assert.ok(
  fs.statSync(homeCompanionAsset).size < 360 * 1024,
  'Xicheng Xiaojing home cutout should stay compact enough for APP startup'
)

assert.ok(
  fs.existsSync(heroLandmarkAsset),
  'Xicheng APP should ship a compact scenic landmark image for the home hero'
)

assert.ok(
  fs.existsSync(heroPaperAsset),
  'Xicheng APP should ship a refined paper-style West City hero background for the approved home layout'
)

assert.ok(
  fs.statSync(heroLandmarkAsset).size < 300 * 1024,
  'Xicheng scenic landmark image should stay compact instead of shipping a full-page mockup'
)

assert.ok(
  fs.statSync(heroPaperAsset).size < 220 * 1024,
  'Xicheng paper hero background should stay compact for APP startup'
)

for (const asset of routeAssets) {
  assert.ok(fs.existsSync(asset), `Xicheng APP should ship compact route thumbnail ${path.basename(asset)}`)
  assert.ok(fs.statSync(asset).size < 300 * 1024, `Xicheng route thumbnail ${path.basename(asset)} should stay compact`)
}

assert.ok(
  regionConfig.includes("companionAvatar: '/static/xicheng/xiaojing-companion.png'"),
  'Xicheng region config should expose the dedicated Xiaojing companion avatar'
)

assert.match(
  regionConfig,
  /visualAssets:\s*\{[\s\S]*homeHeroBackground:\s*'\/static\/xicheng\/home-hero-xicheng-approved-v3\.jpg'[\s\S]*homeCompanion:\s*'\/static\/xicheng\/xiaojing-companion-cutout-v2\.png'[\s\S]*heroLandmark:\s*'\/static\/xicheng\/scene-baitasi-waterfront\.jpg'[\s\S]*routeThumbnails:\s*\{[\s\S]*['"]baitasi-imperial-shichahai['"]:\s*'\/static\/xicheng\/route-baitasi-culture\.jpg'[\s\S]*['"]beihai-shichahai-waterfront['"]:\s*'\/static\/xicheng\/route-shichahai-waterfront\.jpg'[\s\S]*['"]dashilar-old-brand-walk['"]:\s*'\/static\/xicheng\/route-hutong-life\.jpg'/,
  'Xicheng region config should expose compact reusable visual assets instead of page-local image paths'
)

for (const required of [
  'class="home-location-row"',
  'class="hero-landmark-image"',
  ':src="region.visualAssets.homeHeroBackground || region.visualAssets.heroLandmark"',
  'class="hero xicheng-reference-hero"',
  'class="hero-atmosphere"',
  'class="hero-main"',
  'class="companion-visual"',
  'class="xiaojing-avatar"',
  ':src="(region.visualAssets && region.visualAssets.homeCompanion) || region.companionAvatar"',
  'mode="aspectFit"',
  'class="home-action-duo"',
  'home-scan-card',
  'hero-ask-card',
  'class="home-share-button"',
  'id="xicheng-map-entry-section"',
  'class="home-light-entry-grid"',
  '文旅地图',
  '游记生成',
  '开始记录',
  '小京',
  '我陪你看懂西城'
]) {
  assert.ok(home.includes(required), `Xicheng home hero should render Xiaojing visual cue ${required}`)
}

assert.match(
  home,
  /<image[\s\S]*class="xiaojing-avatar"[\s\S]*:src="\(\s*region\.visualAssets && region\.visualAssets\.homeCompanion\s*\) \|\| region\.companionAvatar"[\s\S]*mode="aspectFit"/,
  'Xicheng home should render Xiaojing through the home-specific cutout asset, not as text-only copy or a rectangular source image'
)

assert.match(
  home,
  /hero-ask-card[\s\S]*问问小京[\s\S]*home-scan-card[\s\S]*扫一扫[\s\S]*拍照识别 · 文字识别 · 附近触发/,
  'Xicheng home first-screen action hierarchy should expose Xiaojing near the hero and one automatic scan entry, not multiple recognition choices'
)

assert.ok(
  home.indexOf('id="xicheng-map-entry-section"') > home.indexOf('class="home-action-duo"') &&
    home.indexOf('id="xicheng-map-entry-section"') < home.indexOf('id="xicheng-home-route-recommendation-section"'),
  'Xicheng home should surface compact map and Citywalk entries after the two primary action cards'
)

assert.match(
  home,
  /class="home-share-button"[\s\S]*@click="openXichengShare"/,
  'Xicheng home should keep the share poster entry as a small top-right action instead of a prominent home card'
)

assert.match(
  styleBlock,
  /\.xicheng-reference-hero\s*\{[\s\S]*min-height:\s*430rpx[\s\S]*overflow:\s*hidden/,
  'Xicheng home hero should use a compact paper-hero treatment that leaves first-screen room for the primary function cards'
)

assert.match(
  styleBlock,
  /\.home-location-row\s*\{[\s\S]*display:\s*flex[\s\S]*justify-content:\s*space-between/,
  'Xicheng home should start with a location/account row like the visual reference'
)

assert.match(
  styleBlock,
  /\.hero-landmark-image\s*\{[\s\S]*position:\s*absolute[\s\S]*left:\s*0[\s\S]*width:\s*100%[\s\S]*height:\s*100%[\s\S]*object-fit:\s*cover/,
  'Xicheng home hero should blend a full scenic landmark image behind Xiaojing instead of relying only on flat gradients'
)

assert.match(
  styleBlock,
  /\.xicheng-reference-hero \.xiaojing-avatar\s*\{[\s\S]*width:\s*314rpx[\s\S]*height:\s*390rpx/,
  'Xicheng home Xiaojing visual should anchor the compact paper hero without pushing function cards below the first viewport'
)

assert.match(
  styleBlock,
  /\.home-action-duo\s*\{[\s\S]*grid-template-columns:\s*1fr 1fr[\s\S]*\.home-action-card\s*\{[\s\S]*min-height:\s*158rpx/,
  'Xicheng home primary action cards should preserve the approved two-card first-screen layout'
)

assert.match(
  styleBlock,
  /\.home-scan-card\s*\{[\s\S]*background:\s*linear-gradient/,
  'Xicheng home should keep the scan entry visually primary'
)

assert.match(
  styleBlock,
  /\.hero-ask-card\s*\{[\s\S]*background:\s*rgba\(255,\s*253,\s*248,\s*0\.94\)/,
  'Xicheng home should keep the Xiaojing hero card visually distinct like the reference'
)

assert.match(
  styleBlock,
  /\.home-light-entry-grid\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(0,\s*1fr\)[\s\S]*\.home-light-entry\s*\{[\s\S]*min-height:\s*170rpx/,
  'Xicheng home should use a compact two-column map and recording entry grid instead of long stacked sections'
)

assert.doesNotMatch(
  home,
  /route-reference-grid|home-secondary-directory|亲子研学|运营报告/,
  'Xicheng home should not keep hidden route-feed, parent-child study, or ops report modules'
)

assert.doesNotMatch(
  `${home}\n${regionConfig}`,
  /xicheng-multimodal\/design-mockups|01-home-xiaojing-xicheng|\/static\/tabbar\/ai_companion_avatar\.png/,
  'Xicheng home should not ship a full-page mockup or reuse the Kashgar tab avatar as the Xiaojing hero'
)
