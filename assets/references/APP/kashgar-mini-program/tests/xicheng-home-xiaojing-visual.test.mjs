import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const companionAsset = path.join(root, 'static', 'xicheng', 'xiaojing-companion.png')
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
  fs.existsSync(heroLandmarkAsset),
  'Xicheng APP should ship a compact scenic landmark image for the home hero'
)

assert.ok(
  fs.statSync(heroLandmarkAsset).size < 300 * 1024,
  'Xicheng scenic landmark image should stay compact instead of shipping a full-page mockup'
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
  /visualAssets:\s*\{[\s\S]*heroLandmark:\s*'\/static\/xicheng\/scene-baitasi-waterfront\.jpg'[\s\S]*routeThumbnails:\s*\{[\s\S]*['"]baitasi-imperial-shichahai['"]:\s*'\/static\/xicheng\/route-baitasi-culture\.jpg'[\s\S]*['"]beihai-shichahai-waterfront['"]:\s*'\/static\/xicheng\/route-shichahai-waterfront\.jpg'[\s\S]*['"]dashilar-old-brand-walk['"]:\s*'\/static\/xicheng\/route-hutong-life\.jpg'/,
  'Xicheng region config should expose compact reusable visual assets instead of page-local image paths'
)

for (const required of [
  'class="home-location-row"',
  'class="hero-landmark-image"',
  ':src="region.visualAssets.heroLandmark"',
  'class="hero xicheng-reference-hero"',
  'class="hero-atmosphere"',
  'class="hero-main"',
  'class="companion-visual"',
  'class="xiaojing-avatar"',
  ':src="region.companionAvatar"',
  'mode="aspectFit"',
  'class="home-action-duo"',
  'home-scan-card',
  'home-ask-card',
  'class="home-share-button"',
  'id="xicheng-map-entry-section"',
  'class="home-light-entry-grid"',
  '文旅地图',
  '西城 Citywalk',
  '小京',
  '我陪你看懂西城'
]) {
  assert.ok(home.includes(required), `Xicheng home hero should render Xiaojing visual cue ${required}`)
}

assert.match(
  home,
  /<image[\s\S]*class="xiaojing-avatar"[\s\S]*:src="region\.companionAvatar"[\s\S]*mode="aspectFit"/,
  'Xicheng home should render Xiaojing as an image in the hero, not as text-only copy'
)

assert.match(
  home,
  /home-scan-card[\s\S]*扫一扫[\s\S]*拍照识别 · 文字识别 · 附近触发[\s\S]*home-ask-card[\s\S]*问问小京/,
  'Xicheng home first-screen action hierarchy should expose one automatic scan entry and Xiaojing, not multiple recognition choices'
)

assert.ok(
  home.indexOf('id="xicheng-map-entry-section"') > home.indexOf('class="home-action-duo"') &&
    home.indexOf('id="xicheng-map-entry-section"') < home.indexOf('class="home-memory-grid"'),
  'Xicheng home should surface compact map and Citywalk entries after the two primary action cards'
)

assert.match(
  home,
  /class="home-share-button"[\s\S]*@click="openXichengShare"/,
  'Xicheng home should keep the share poster entry as a small top-right action instead of a prominent home card'
)

assert.match(
  styleBlock,
  /\.xicheng-reference-hero\s*\{[\s\S]*min-height:\s*640rpx[\s\S]*overflow:\s*hidden/,
  'Xicheng home hero should use an immersive first-screen hero treatment aligned with the visual reference'
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
  /\.xicheng-reference-hero \.xiaojing-avatar\s*\{[\s\S]*width:\s*386rpx[\s\S]*height:\s*462rpx/,
  'Xicheng home Xiaojing visual should be large enough to anchor the first viewport instead of reading as a small avatar'
)

assert.match(
  styleBlock,
  /\.home-action-duo\s*\{[\s\S]*grid-template-columns:\s*1fr 1fr[\s\S]*\.home-action-card\s*\{[\s\S]*min-height:\s*158rpx/,
  'Xicheng home primary action cards should preserve the approved two-card first-screen layout'
)

assert.match(
  styleBlock,
  /\.home-scan-card\s*\{[\s\S]*background:\s*linear-gradient[\s\S]*\.home-ask-card\s*\{[\s\S]*background:\s*rgba\(255,\s*253,\s*248,\s*0\.94\)/,
  'Xicheng home should visually distinguish the scan entry and Xiaojing card like the reference'
)

assert.match(
  styleBlock,
  /\.home-light-entry-grid\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(0,\s*1fr\)[\s\S]*\.home-light-entry\s*\{[\s\S]*min-height:\s*170rpx/,
  'Xicheng home should use a compact two-column map and recording entry grid instead of long stacked sections'
)

assert.doesNotMatch(
  home,
  /route-reference-grid|home-secondary-directory|亲子研学|运营报告|一键抄作业/,
  'Xicheng home should not keep hidden route-feed, parent-child study, ops report, or inspiration-import modules'
)

assert.doesNotMatch(
  `${home}\n${regionConfig}`,
  /xicheng-multimodal\/design-mockups|01-home-xiaojing-xicheng|\/static\/tabbar\/ai_companion_avatar\.png/,
  'Xicheng home should not ship a full-page mockup or reuse the Kashgar tab avatar as the Xiaojing hero'
)
