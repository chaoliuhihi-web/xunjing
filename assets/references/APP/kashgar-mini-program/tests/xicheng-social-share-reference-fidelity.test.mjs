import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const component = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengSocialSharePreview.vue'), 'utf8')
const share = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'share', 'share.vue'), 'utf8')

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

assert.ok(component.split(/\r?\n/).length < 360, 'Social share preview component should stay compact for APP packaging')

assert.doesNotMatch(
  component,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|background-location|startLocationUpdateBackground/,
  'Social share preview should not introduce backend calls, client secrets, or high-risk background permissions'
)
