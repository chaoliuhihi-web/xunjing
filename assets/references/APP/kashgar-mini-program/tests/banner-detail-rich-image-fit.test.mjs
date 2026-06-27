import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const bannerPath = path.join(root, 'pages', 'banner', 'banner.vue')
const bannerPage = fs.readFileSync(bannerPath, 'utf8')

assert.match(
  bannerPage,
  /<rich-text class="banner-content" :nodes="formatBannerDetail\(bannerInfo\.detail\)"/,
  'banner detail should render formatted rich-text nodes instead of raw HTML'
)

assert.match(
  bannerPage,
  /formatBannerDetail\(detail = ''\) \{[\s\S]*<img\\b\(\[\^>\]\*\)>[\s\S]*style="\$\{imageStyle\}"/,
  'banner detail formatter should rewrite uploaded image tags'
)

assert.match(
  bannerPage,
  /const imageStyle = ['"][^'"]*max-width\s*:\s*100%[^'"]*width\s*:\s*100%[^'"]*height\s*:\s*auto[^'"]*display\s*:\s*block/,
  'banner detail formatter should constrain uploaded images to the article width'
)

assert.match(
  bannerPage,
  /\.banner-info\s*\{[\s\S]*box-sizing:\s*border-box[\s\S]*overflow-x:\s*hidden/,
  'banner detail content container should prevent horizontal overflow'
)

assert.match(
  bannerPage,
  /\.banner-content\s*\{[\s\S]*width:\s*100%[\s\S]*overflow-wrap:\s*break-word/,
  'banner detail rich text should fit the mobile container and wrap long text'
)
