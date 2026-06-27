import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const myPagePath = path.join(root, 'subPackages', 'user', 'my', 'my.vue')
const myPage = fs.readFileSync(myPagePath, 'utf8')

assert.doesNotMatch(
  myPage,
  /stats-icon-follow|stats-divider|followCount|myFollowList/,
  'profile stats card should remove the separate follow column'
)

assert.match(
  myPage,
  /<navigator[\s\S]*class="stats-card"[\s\S]*url="\/subPackages\/user\/myLikes\/myLikes"[\s\S]*<view class="stats-main">[\s\S]*<text class="stats-title">[\s\S]*<\/text>[\s\S]*<text class="stats-desc">[\s\S]*<\/text>/,
  'profile stats card should be a simple native navigator entry for likes'
)

assert.doesNotMatch(
  myPage,
  /@click="goMyLikes"|@tap="goMyLikes"|const goMyLikes/,
  'profile stats card should not use dynamic tap handlers that can collide with minified data keys'
)

assert.match(
  myPage,
  /\.stats-card\s*\{[\s\S]*background:\s*#FFFFFF[\s\S]*border-radius:\s*26rpx[\s\S]*box-shadow:\s*0 10rpx 28rpx rgba\(31, 34, 40, 0\.06\)/,
  'profile stats card should use a clean white card treatment'
)

assert.match(
  myPage,
  /\.stats-icon-wrap\s*\{[\s\S]*background:\s*#FFF4E8[\s\S]*color:\s*#D39A42/,
  'profile stats icon should use a restrained warm accent instead of bright badges'
)

assert.match(
  myPage,
  /const APP_VERSION = '1\.0\.0'/,
  'profile page should hardcode the current app version until the version API is ready'
)

assert.match(
  myPage,
  /<view class="version-info">[\s\S]*<text class="version-text">[\s\S]*\{\{ APP_VERSION \}\}[\s\S]*<\/text>[\s\S]*<\/view>[\s\S]*<tab-bar :current="2" \/>/,
  'profile page should show the current version above the AI guide tab character'
)

assert.match(
  myPage,
  /request\('api2\/Drama\/getZanDrama',\s*\{[\s\S]*userId[\s\S]*page_size:\s*1[\s\S]*\},\s*'GET'\)/,
  'profile likes count should come from the new getZanDrama total instead of local cache'
)

assert.match(
  myPage,
  /const getSavedUserId = \(\) => \{[\s\S]*uni\.getStorageSync\('userId'\)[\s\S]*userInfo\.id[\s\S]*userModel\.member\.id[\s\S]*uni\.setStorageSync\('userId', userId\)[\s\S]*\}/,
  'profile likes count should recover userId from existing login caches before returning zero'
)

assert.match(
  myPage,
  /likeCount\.value = Number\(res\.data\.total \|\| 0\)/,
  'profile likes count should use the documented total field'
)

assert.match(
  myPage,
  /\.version-info\s*\{[\s\S]*position:\s*fixed[\s\S]*bottom:\s*310rpx[\s\S]*z-index:\s*10001/,
  'profile page version should sit visibly above the custom tab bar'
)

assert.match(
  myPage,
  /\.version-text\s*\{[\s\S]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.72\)[\s\S]*color:\s*#858585/,
  'profile page version should use a subtle visible pill style'
)
