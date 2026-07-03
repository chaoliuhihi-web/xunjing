import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const share = read('pages', 'xicheng', 'share', 'share.vue')
const componentPath = path.join(root, 'components', 'xicheng', 'XichengSharePrivacyReviewPanel.vue')

assert.ok(
  fs.existsSync(componentPath),
  'Share page should split privacy settings and review steps into XichengSharePrivacyReviewPanel'
)

const component = fs.readFileSync(componentPath, 'utf8')

for (const token of [
  'XichengSharePrivacyReviewPanel',
  '分享设置',
  '待审核 · 未公开',
  '分享前只生成本地预览',
  '精确定位、照片路径和原始素材只进入本机审核包',
  'share-setting-list',
  'share-review-steps',
  'privacy-card',
  '发布前检查',
  "emits: ['toggle-setting', 'submit-review']",
  "this.$emit('toggle-setting', setting.key)",
  "this.$emit('submit-review')"
]) {
  assert.ok(component.includes(token), `Privacy review panel should expose approved token: ${token}`)
}

assert.match(
  component,
  /props:[\s\S]*settings:[\s\S]*type: Array[\s\S]*reviewSteps:[\s\S]*type: Array/,
  'Privacy review panel should receive normalized settings and review steps as props'
)

assert.match(
  component,
  /v-for="setting in normalizedSettings"[\s\S]*setting\.title[\s\S]*setting\.desc[\s\S]*share-switch-on/,
  'Privacy review panel should render durable setting rows with switch state'
)

assert.match(
  component,
  /v-for="step in normalizedReviewSteps"[\s\S]*step\.index[\s\S]*step\.title[\s\S]*review-step-active/,
  'Privacy review panel should render the review progress steps from page state'
)

for (const token of [
  "import XichengSharePrivacyReviewPanel from '@/components/xicheng/XichengSharePrivacyReviewPanel.vue'",
  'XichengSharePrivacyReviewPanel,',
  '<xicheng-share-privacy-review-panel',
  ':settings="shareSettings"',
  ':review-steps="reviewSteps"',
  '@toggle-setting="toggleShareSetting"',
  '@submit-review="submitReview"'
]) {
  assert.ok(share.includes(token), `Share page should delegate privacy review panel token: ${token}`)
}

assert.doesNotMatch(
  share,
  /<view class="privacy-card xicheng-paper-card">[\s\S]*<\/view>\s*<\/view>\s*<\/template>/,
  'Share page should not keep the privacy and review card markup inline after splitting the component'
)

assert.ok(share.split(/\r?\n/).length < 680, 'Share page should shrink after splitting the privacy review panel')
assert.ok(component.split(/\r?\n/).length < 280, 'Privacy review panel component should stay compact for APP packaging')

assert.doesNotMatch(
  `${share}\n${component}`,
  /分享纪念|提交审核|分享海报|作品审核|审核状态总览|生成分享海报/,
  'Share publishing page should use travelogue publishing copy instead of legacy poster/review-growth wording'
)

assert.doesNotMatch(
  `${share}\n${component}`,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|startLocationUpdateBackground/,
  'Privacy review panel split should not introduce backend calls, client secrets, or high-risk background permissions'
)
