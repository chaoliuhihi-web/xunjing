import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const pagePath = path.join(root, 'subPackages', 'feature', 'shortPlay', 'shortplay.vue')
const page = fs.readFileSync(pagePath, 'utf8')

assert.match(
  page,
  /<scroll-view class="scroll-content"[\s\S]*<image class="bg-image"[\s\S]*<view class="city-filter-bar"[\s\S]*<view class="drama-grid"/,
  'shortPlay page should put the hero image, city filter, and cards inside the same scroll-view'
)

assert.match(
  page,
  /<image class="bg-image"[\s\S]*mode="widthFix"/,
  'shortPlay hero image should use widthFix so the top poster is not cropped'
)

assert.doesNotMatch(
  page,
  /\.bg-image\s*\{[\s\S]*?position:\s*fixed/,
  'shortPlay hero image should not be fixed to the viewport'
)

assert.doesNotMatch(
  page,
  /\.bg-image\s*\{[^}]*height:\s*\d+rpx/,
  'shortPlay hero image should not use a fixed rpx height that crops the poster'
)

assert.doesNotMatch(
  page,
  /\.city-filter-bar\s*\{[\s\S]*?position:\s*fixed/,
  'shortPlay city filter should scroll with the hero image'
)

assert.doesNotMatch(
  page,
  /\.scroll-content\s*\{[\s\S]*?position:\s*fixed/,
  'shortPlay scroll-view should own the full page scroll instead of being fixed below the hero'
)
