import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const detailPath = path.join(root, 'subPackages', 'feature', 'map_two', 'detail.vue')
const detailPage = fs.readFileSync(detailPath, 'utf8')

assert.match(
  detailPage,
  /<view class="float-con-box">[\s\S]*<view class="float-con-item"[\s\S]*<view class="right-btns">[\s\S]*<view class="right-btn" @click="openMaters">[\s\S]*<view class="right-btn" @click="goAiGuide">[\s\S]*<\/view>\s*<\/view>\s*<!-- 底部互动栏 -->/,
  'map list and AI guide controls should be stacked inside the left category controls below the category items'
)

assert.match(
  detailPage,
  /\.right-btns\s*\{[\s\S]*display:\s*flex[\s\S]*flex-direction:\s*column[\s\S]*align-items:\s*flex-start/,
  'map list and AI guide controls should align with the left category stack instead of floating on the right'
)

assert.doesNotMatch(
  detailPage,
  /\.right-btns\s*\{[\s\S]*(right:\s*20rpx|top:\s*220rpx)/,
  'map list and AI guide controls should not keep the old right-side fixed offsets'
)
