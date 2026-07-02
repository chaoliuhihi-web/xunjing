import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const share = read('pages', 'xicheng', 'share', 'share.vue')
const componentPath = path.join(root, 'components', 'xicheng', 'XichengShareAssetPanel.vue')

assert.ok(
  fs.existsSync(componentPath),
  'Share page should split the memorial asset actions into XichengShareAssetPanel'
)

const component = fs.readFileSync(componentPath, 'utf8')

for (const token of [
  'XichengShareAssetPanel',
  '纪念产物',
  '朋友圈素材',
  '小红书笔记',
  'PDF 纪念册',
  '预览精美游记',
  'PDF 打印预览',
  "emits: ['create-moments', 'create-xiaohongshu', 'create-pdf', 'open-reader', 'open-pdf']",
  "this.$emit('create-moments')",
  "this.$emit('create-xiaohongshu')",
  "this.$emit('create-pdf')",
  "this.$emit('open-reader')",
  "this.$emit('open-pdf')"
]) {
  assert.ok(component.includes(token), `Share asset panel should expose approved token: ${token}`)
}

assert.match(
  component,
  /props:[\s\S]*artifactCount:[\s\S]*type: Number[\s\S]*default: 0/,
  'Share asset panel should receive the generated artifact count as a prop'
)

assert.match(
  component,
  /<text class="section-badge">\{\{ safeArtifactCount \}\} 个<\/text>/,
  'Share asset panel should render a normalized artifact count badge'
)

for (const token of [
  "import XichengShareAssetPanel from '@/components/xicheng/XichengShareAssetPanel.vue'",
  'XichengShareAssetPanel,',
  '<xicheng-share-asset-panel',
  ':artifact-count="shareArtifacts.length"',
  '@create-moments="createChannelShareArtifact(\'moments\')"',
  '@create-xiaohongshu="createChannelShareArtifact(\'xiaohongshu\')"',
  '@create-pdf="createPdfShareArtifact"',
  '@open-reader="openTravelogueReaderPage"',
  '@open-pdf="openPdfPrintPage"'
]) {
  assert.ok(share.includes(token), `Share page should delegate asset panel contract token: ${token}`)
}

assert.doesNotMatch(
  share,
  /<view class="asset-card xicheng-paper-card">[\s\S]*<\/view>\s*<view v-if="currentVisionAgentShareBoundary"/,
  'Share page should not keep the memorial asset card markup inline after splitting the component'
)

assert.ok(share.split(/\r?\n/).length < 700, 'Share page should shrink after splitting the memorial asset panel')
assert.ok(component.split(/\r?\n/).length < 260, 'Share asset panel component should stay compact for APP packaging')

assert.doesNotMatch(
  `${share}\n${component}`,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|startLocationUpdateBackground/,
  'Share asset panel split should not introduce backend calls, client secrets, or high-risk background permissions'
)
