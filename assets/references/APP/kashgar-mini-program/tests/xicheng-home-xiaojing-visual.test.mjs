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
  'class="hero xicheng-paper-card xicheng-immersive-hero"',
  'class="hero-atmosphere"',
  'class="hero-main"',
  'class="companion-visual"',
  'class="xiaojing-avatar"',
  ':src="region.companionAvatar"',
  'mode="aspectFit"',
  'class="route-thumbnail"',
  ':src="getRouteThumbnail(route)"',
  'class="route-card-scroll"',
  'class="route-card-strip"',
  'quick-card-featured quick-card-scan',
  'quick-card-featured quick-card-ask',
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
  /quick-card-featured quick-card-scan[\s\S]*扫一扫[\s\S]*quick-card-featured quick-card-ask[\s\S]*问问小京[\s\S]*quick-card-photo[\s\S]*拍照识别/,
  'Xicheng home first-screen action hierarchy should promote scan and Xiaojing before secondary recognition modes'
)

assert.match(
  styleBlock,
  /\.xicheng-immersive-hero\s*\{[\s\S]*min-height:\s*680rpx[\s\S]*overflow:\s*hidden/,
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
  /\.xiaojing-avatar\s*\{[\s\S]*width:\s*340rpx[\s\S]*height:\s*436rpx/,
  'Xicheng home Xiaojing visual should be large enough to anchor the first viewport instead of reading as a small avatar'
)

assert.match(
  styleBlock,
  /\.quick-card-featured\s*\{[\s\S]*min-height:\s*150rpx/,
  'Xicheng home primary action cards should be larger than secondary recognition entry cards without pushing routes below the first viewport'
)

assert.match(
  styleBlock,
  /\.quick-grid\s*\{[\s\S]*display:\s*flex[\s\S]*overflow-x:\s*auto[\s\S]*scroll-snap-type:\s*x proximity[\s\S]*\.quick-card,\s*\.ops-card\s*\{[\s\S]*flex:\s*0 0 calc\(\(100% - 18rpx\) \/ 2\)/,
  'Xicheng home recognition entrypoints should show two complete cards and remain horizontally accessible so official routes surface earlier like the design reference'
)

assert.match(
  styleBlock,
  /\.hero-actions \.primary-button,\s*\.hero-actions \.ghost-button\s*\{[\s\S]*min-width:\s*0[\s\S]*padding:\s*0 4rpx[\s\S]*font-size:\s*26rpx[\s\S]*white-space:\s*nowrap/,
  'Xicheng home hero action buttons should keep four-character labels visible in the narrow first-screen column'
)

assert.match(
  styleBlock,
  /\.route-thumbnail\s*\{[\s\S]*width:\s*100%[\s\S]*aspect-ratio:\s*1\.25/,
  'Xicheng home route cards should include stable scenic thumbnails like the route recommendation mockup'
)

assert.match(
  styleBlock,
  /\.route-card-scroll\s*\{[\s\S]*overflow:\s*hidden[\s\S]*\.route-card-strip\s*\{[\s\S]*display:\s*flex[\s\S]*gap:\s*20rpx[\s\S]*\.recommended-route-card\s*\{[\s\S]*flex:\s*0 0 336rpx[\s\S]*width:\s*336rpx/,
  'Xicheng home route recommendations should be a horizontal card preview like the visual reference instead of a long vertical feed'
)

assert.doesNotMatch(
  `${home}\n${regionConfig}`,
  /xicheng-multimodal\/design-mockups|01-home-xiaojing-xicheng|\/static\/tabbar\/ai_companion_avatar\.png/,
  'Xicheng home should not ship a full-page mockup or reuse the Kashgar tab avatar as the Xiaojing hero'
)
