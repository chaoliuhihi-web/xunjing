import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const home = read('pages', 'xicheng', 'home', 'home.vue')
const companionAsset = path.join(root, 'static', 'xicheng', 'xiaojing-companion.png')
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
  regionConfig.includes("companionAvatar: '/static/xicheng/xiaojing-companion.png'"),
  'Xicheng region config should expose the dedicated Xiaojing companion avatar'
)

for (const required of [
  'class="hero xicheng-paper-card xicheng-immersive-hero"',
  'class="hero-atmosphere"',
  'class="hero-main"',
  'class="companion-visual"',
  'class="xiaojing-avatar"',
  ':src="region.companionAvatar"',
  'mode="aspectFit"',
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
  /\.xicheng-immersive-hero\s*\{[\s\S]*min-height:\s*560rpx[\s\S]*overflow:\s*hidden/,
  'Xicheng home hero should use an immersive first-screen hero treatment aligned with the visual reference'
)

assert.match(
  styleBlock,
  /\.xiaojing-avatar\s*\{[\s\S]*width:\s*260rpx[\s\S]*height:\s*334rpx/,
  'Xicheng home Xiaojing visual should be large enough to anchor the first viewport instead of reading as a small avatar'
)

assert.match(
  styleBlock,
  /\.quick-card-featured\s*\{[\s\S]*min-height:\s*174rpx/,
  'Xicheng home primary action cards should be larger than secondary recognition entry cards'
)

assert.match(
  styleBlock,
  /\.hero-actions \.primary-button,\s*\.hero-actions \.ghost-button\s*\{[\s\S]*min-width:\s*0[\s\S]*padding:\s*0 4rpx[\s\S]*font-size:\s*26rpx[\s\S]*white-space:\s*nowrap/,
  'Xicheng home hero action buttons should keep four-character labels visible in the narrow first-screen column'
)

assert.doesNotMatch(
  home,
  /xicheng-multimodal\/design-mockups|01-home-xiaojing-xicheng|\/static\/tabbar\/ai_companion_avatar\.png/,
  'Xicheng home should not ship a full-page mockup or reuse the Kashgar tab avatar as the Xiaojing hero'
)
