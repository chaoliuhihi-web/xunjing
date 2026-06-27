import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aboutPath = path.join(root, 'pagesInfo', 'aboutus', 'aboutus.vue')
const aboutPage = fs.readFileSync(aboutPath, 'utf8')

assert.match(
  aboutPage,
  /request\('api2\/Drama\/getAbout',\s*\{\},\s*'GET'/,
  'about us page should load content from the new getAbout API'
)

assert.match(
  aboutPage,
  /formatAboutContent\(res\.data\.content\)/,
  'about us page should render the documented data.content HTML field'
)

assert.match(
  aboutPage,
  /<view class="about-content-card">[\s\S]*<rich-text class="new_con"[\s\S]*<\/rich-text>[\s\S]*<\/view>/,
  'about us page should wrap long rich-text content in an inset readable container'
)

assert.match(
  aboutPage,
  /\.about-content-card\s*\{[\s\S]*margin:\s*24rpx 32rpx 80rpx[\s\S]*padding:\s*36rpx 28rpx/,
  'about us content container should add horizontal breathing room on mobile'
)

assert.doesNotMatch(
  aboutPage,
  /margin:\s*0 32rpx 28rpx/,
  'about us rich-text paragraph nodes should not add horizontal margins that overflow the card'
)

assert.doesNotMatch(
  aboutPage,
  /api\/login\/about|type:\s*'24'|resdata\.detail/,
  'about us page should not keep the old login/about payload mapping'
)
