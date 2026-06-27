import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const myLikesPath = path.join(root, 'subPackages', 'user', 'myLikes', 'myLikes.vue')
const myLikesPage = fs.readFileSync(myLikesPath, 'utf8')

assert.match(
  myLikesPage,
  /<text class="nav-title">我的点赞<\/text>/,
  'my likes page title should be 我的点赞'
)

assert.match(
  myLikesPage,
  /<text class="tab-text">百县百剧<\/text>[\s\S]*<text class="tab-text">喀什剧场<\/text>/,
  'my likes page tabs should be 百县百剧 and 喀什剧场'
)

assert.doesNotMatch(
  myLikesPage,
  /<text class="nav-title">我的收藏<\/text>|<text class="tab-text">我的点赞<\/text>|<text class="tab-text">我的关注<\/text>/,
  'old collection/follow labels should not remain in the visible header or tabs'
)

assert.match(
  myLikesPage,
  /request\('api2\/Drama\/getZanDrama',\s*params,\s*'GET'/,
  'my likes page should load liked drama from the new getZanDrama API'
)

assert.match(
  myLikesPage,
  /const LIKE_TAB_TYPES = \['1,2', '3'\][\s\S]*type:\s*LIKE_TAB_TYPES\[tabIndex\][\s\S]*page_size:\s*pageSize/,
  'my likes page should request the documented type filter and pagination params'
)

assert.match(
  myLikesPage,
  /const getSavedUserId = \(\) => \{[\s\S]*uni\.getStorageSync\('userId'\)[\s\S]*userInfo\.id[\s\S]*userModel\.member\.id[\s\S]*uni\.setStorageSync\('userId', userId\)[\s\S]*\}/,
  'my likes page should recover userId from existing login caches before showing a login prompt'
)

assert.match(
  myLikesPage,
  /const userId = getSavedUserId\(\)[\s\S]*if \(!userId\)[\s\S]*uni\.showToast/,
  'my likes page should only show login prompt after all cached userId fallbacks are missing'
)

assert.match(
  myLikesPage,
  /Number\(item\.type\) === 3[\s\S]*\/subPackages\/feature\/theater\/theaterDetail\?dramaId=\$\{item\.id\}[\s\S]*\/subPackages\/feature\/shortPlays\/shortPlays\?id=\$\{item\.id\}/,
  'my likes page should route type 3 liked drama to theater detail and other liked drama to short play detail'
)
