import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const component = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengSocialSharePreview.vue'), 'utf8')
const share = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'share', 'share.vue'), 'utf8')
const preflightPath = path.join(root, 'components', 'xicheng', 'XichengPublishPreflightPanel.vue')

assert.ok(
  fs.existsSync(preflightPath),
  'Share page should split publish preflight checks into XichengPublishPreflightPanel instead of hiding them in the page shell'
)

const preflight = fs.readFileSync(preflightPath, 'utf8')

for (const token of [
  '朋友圈预览',
  '小红书笔记预览',
  '将生成图片与文案，并唤起系统分享确认',
  '已生成标题、正文、标签和图片',
  '西城访客 Bruce',
  '好友可见',
  '1分钟前',
  'share-photo-collage',
  'share-note-carousel',
  'share-route-summary',
  '精确轨迹已隐藏',
  '发布素材',
  '自动生成素材',
  '分享图片',
  '位置不公开',
  '来源说明已保留',
  '发布后展示效果',
  '复制文案',
  '保存图片',
  '唤起朋友圈发布',
  '唤起小红书发布'
]) {
  assert.ok(component.includes(token), `Social share preview should expose approved token: ${token}`)
}

for (const computedName of [
  'previewImages',
  'materialRows',
  'routeStops',
  'primaryActionLabel',
  'privacySummary',
  'notePreviewTitle',
  'notePreviewBody'
]) {
  assert.match(component, new RegExp(`${computedName}\\(`), `Social share preview should compute ${computedName}`)
}

assert.match(
  component,
  /v-if="isXiaohongshu"[\s\S]*share-note-carousel[\s\S]*v-else[\s\S]*share-photo-collage/,
  'Social share preview should render distinct Xiaohongshu carousel and Moments collage layouts'
)

assert.match(
  component,
  /v-for="row in materialRows"[\s\S]*row\.label[\s\S]*row\.value/,
  'Social share preview should render material readiness rows from computed data'
)

assert.match(
  share,
  /<xicheng-social-share-preview[\s\S]*:channel="selectedPublishChannel"[\s\S]*@copy="copyChannelShareCopy"[\s\S]*@save-image="saveChannelShareImage"[\s\S]*@confirm="createChannelShareArtifact"/,
  'Share page should continue wiring channel preview actions through the split component'
)

for (const token of [
  '发布前检查',
  '隐私范围',
  '已审核来源',
  '素材生成',
  '用户确认',
  '系统分享确认',
  '精确位置已隐藏',
  '来源可公开',
  '素材已准备',
  '待生成素材',
  'preflight-grid',
  'preflight-row',
  'preflight-status-ready'
]) {
  assert.ok(preflight.includes(token), `Publish preflight panel should expose approved token: ${token}`)
}

assert.match(
  preflight,
  /v-for="item in normalizedItems"[\s\S]*item\.title[\s\S]*item\.status[\s\S]*item\.desc/,
  'Publish preflight panel should render data-driven preflight rows for APP-side release checks'
)

assert.match(
  share,
  /import XichengPublishPreflightPanel from '@\/components\/xicheng\/XichengPublishPreflightPanel\.vue'[\s\S]*XichengPublishPreflightPanel,/,
  'Share page should import and register the publish preflight component'
)

assert.match(
  share,
  /<xicheng-publish-preflight-panel[\s\S]*:items="publishPreflightItems"[\s\S]*:selected-channel="selectedPublishChannel"/,
  'Share page should render publish preflight status between channel selection and final review'
)

const publishPreflightBlock = share.match(/publishPreflightItems\(\)[\s\S]*?\n\t\t\},\n\t\tcurrentVisionAgentShareBoundary/)?.[0] || ''
for (const token of [
  'shareSettingState.hideExactLocation',
  'reviewedSourceCount',
  'getSelectedChannelArtifactCount()',
  '系统分享确认'
]) {
  assert.ok(
    publishPreflightBlock.includes(token),
    `Share page should derive preflight checks from privacy settings, reviewed source count, generated assets, and platform confirmation: ${token}`
  )
}

assert.ok(component.split(/\r?\n/).length < 360, 'Social share preview component should stay compact for APP packaging')
assert.ok(preflight.split(/\r?\n/).length < 260, 'Publish preflight panel should stay compact for APP packaging')

assert.doesNotMatch(
  `${component}\n${preflight}`,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|background-location|startLocationUpdateBackground/,
  'Social share preview and preflight panel should not introduce backend calls, client secrets, or high-risk background permissions'
)
