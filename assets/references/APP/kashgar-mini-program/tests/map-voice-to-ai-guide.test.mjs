import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const mapDetailPath = path.join(root, 'subPackages', 'feature', 'map_two', 'detail.vue')
const aiGuidePath = path.join(root, 'pages', 'ai-guide', 'ai-guide.vue')
const mapDetail = fs.readFileSync(mapDetailPath, 'utf8')
const aiGuide = fs.readFileSync(aiGuidePath, 'utf8')

assert.doesNotMatch(
  mapDetail,
  /voicePanelText|voice-panel/,
  'map page should not render a voice reply panel above recommendations'
)

assert.doesNotMatch(
  mapDetail,
  /askCozeText|COZE_CONFIG|VOICE_REPLY_PROMPT|runVoiceQuestion/,
  'map page voice flow should not request AI answers locally'
)

assert.match(
  mapDetail,
  /goAiGuideWithQuestion\s*\(\s*result\s*\)/,
  'map page should navigate to AI guide with the recognized voice text after release'
)

assert.match(
  mapDetail,
  /url:\s*`\/pages\/ai-guide\/ai-guide\?question=\$\{encodeURIComponent\(question\)\}`/,
  'map page should pass the recognized question through the AI guide route'
)

assert.match(
  aiGuide,
  /import\s+\{[^}]*\bonLoad\b[^}]*\}\s+from '@dcloudio\/uni-app'/,
  'AI guide page should register an onLoad hook for route parameters'
)

assert.match(
  aiGuide,
  /decodeRouteValue\(options\.question\)/,
  'AI guide page should safely decode the incoming map voice question'
)

assert.match(
  aiGuide,
  /inputText\.value\s*=\s*question[\s\S]*sendMessage\(\)/,
  'AI guide page should auto-send the incoming map voice question'
)

assert.match(
  mapDetail,
  /\.home-entry\s*\{[\s\S]*border-radius:\s*50%[\s\S]*border:\s*3rpx solid #D7A64D/,
  'map home button should use a simple round gold outline style from the map controls'
)

assert.doesNotMatch(
  mapDetail,
  /\.home-entry\s*\{[\s\S]*background:\s*linear-gradient\(145deg, #7B61FF/,
  'map home button should not keep the old purple gradient block style'
)

assert.doesNotMatch(
  mapDetail,
  /home-entry-glow|\.home-entry::before/,
  'map home button should avoid decorative glow/highlight details'
)

assert.match(
  mapDetail,
  /\.quick-action\s*\{[\s\S]*width:\s*76rpx[\s\S]*border:\s*3rpx solid #303030/,
  'map keyboard button should use a simple round black outline style'
)

assert.match(
  mapDetail,
  /<view class="float-con-box">[\s\S]*<view class="float-con-item"[\s\S]*<view class="right-btns">[\s\S]*<view class="right-btn" @click="openMaters">[\s\S]*<view class="right-btn" @click="goAiGuide">/,
  'map list and AI guide buttons should sit below the left category controls instead of floating on the right'
)

assert.match(
  mapDetail,
  /\.keyboard-icon\s*\{[\s\S]*border:\s*3rpx solid #303030[\s\S]*grid-template-columns:\s*repeat\(3, 1fr\)/,
  'map keyboard icon should use a clean outlined 3x3 keyboard glyph'
)

assert.match(
  mapDetail,
  /<view class="recommend-with-guide">[\s\S]*class="map-guide-atlas-viewport"[\s\S]*<view class="recommend-content-slot">[\s\S]*v-if="selectedMarker" class="selected-place-row"[\s\S]*v-else class="recommend-row"/,
  'map guide should stay visible while selected marker detail and recommendations swap in a fixed content slot'
)

assert.match(
  mapDetail,
  /\.recommend-content-slot\s*\{[\s\S]*height:\s*150rpx/,
  'recommendation row and selected marker detail should share a tall content-slot height'
)

assert.match(
  mapDetail,
  /\.selected-place-row\s*\{[\s\S]*height:\s*140rpx[\s\S]*\.selected-place-img\s*\{[\s\S]*width:\s*150rpx[\s\S]*height:\s*100rpx/,
  'selected marker detail card should be tall enough to fill the white area and avoid squashing its image'
)

assert.match(
  mapDetail,
  /\.recommend-with-guide\s*\{[\s\S]*position:\s*relative/,
  'guide wrapper should provide an anchor for the floating map guide'
)

assert.match(
  mapDetail,
  /\.map-guide-atlas-viewport\s*\{[\s\S]*position:\s*absolute[\s\S]*top:\s*-132px[\s\S]*transform:\s*translateX\(-50%\)/,
  'map guide should float over the map instead of reserving blank layout space above the detail card'
)

assert.doesNotMatch(
  mapDetail,
  /\.map-guide-atlas-viewport\s*\{[\s\S]*margin:\s*-135px auto 9px/,
  'map guide viewport should not use normal-flow negative margins that leave blank space in the bottom bar'
)
