import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const share = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'share', 'share.vue'), 'utf8')
const shareAssetPanel = fs.readFileSync(path.join(root, 'components', 'xicheng', 'XichengShareAssetPanel.vue'), 'utf8')
const shareAssets = fs.readFileSync(path.join(root, 'request', 'xunjing', 'shareAssets.js'), 'utf8')
const shareSurface = `${share}\n${shareAssetPanel}`

for (const token of [
  '朋友圈素材',
  '小红书笔记',
  'PDF 纪念册',
  "createChannelShareArtifact('moments')",
  "createChannelShareArtifact('xiaohongshu')",
  'publishChannel',
  'getXichengShareChannelAssetLabel',
  'getXichengShareChannelAssetType',
  'getXichengShareChannelTemplateCode'
]) {
  assert.ok(shareSurface.includes(token), `Share page should expose channel-focused asset token: ${token}`)
}

for (const token of [
  'channelAssetLabelMap',
  'channelTemplateCodeMap',
  'channelAssetTypeMap',
  '朋友圈素材',
  '小红书笔记',
  'xicheng-moments-share-v1',
  'xicheng-xiaohongshu-note-v1',
  'normalizeXichengSharePublishChannel'
]) {
  assert.ok(shareAssets.includes(token), `Shared share asset helper should expose channel token: ${token}`)
}

assert.match(
  share,
  /createChannelShareArtifact\(channelKey = ''\)[\s\S]*const requestedChannel = typeof channelKey === 'string' && channelKey \? channelKey : this\.selectedPublishChannel[\s\S]*this\.selectedPublishChannel = requestedChannel[\s\S]*this\.createShareArtifact\(getXichengShareChannelAssetType\(requestedChannel\)\)/,
  'Share page should create assets for an explicit selected publish channel, not only the current UI selection'
)

assert.match(
  share,
  /onLoad\(options = \{\}\)[\s\S]*const routeChannel = normalizeXichengSharePublishChannel\(decodeXichengRouteValue\(options\.channel\)\)[\s\S]*this\.selectedPublishChannel = routeChannel[\s\S]*this\.selectedPublishChannels = Array\.from\(new Set\(\[routeChannel,\s*\.\.\.this\.selectedPublishChannels\]\)\)/,
  'Share page should honor the selected publish channel passed from the travelogue action grid'
)

assert.doesNotMatch(
  `${shareSurface}\n${shareAssets}`,
  /亲子研学报告|createShareArtifact\('study'\)|xicheng-study-report-v1/,
  'Share page primary asset creation should focus on travelogue publishing and PDF printing, not study reports'
)

assert.ok(share.split(/\r?\n/).length < 900, 'Share page should stay under the focused shell page budget')
assert.ok(shareAssets.split(/\r?\n/).length < 120, 'Share asset helper should stay compact for APP packaging')
