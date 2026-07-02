import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const share = read('pages', 'xicheng', 'share', 'share.vue')
const channelGrid = read('components', 'xicheng', 'XichengPublishChannelGrid.vue')

for (const token of [
  'selectedPublishChannels',
  ':selected-keys="selectedPublishChannels"',
  ':selected-count="selectedPublishChannelCount"',
  '@toggle="togglePublishChannel"',
  'handlePublishAction',
  'createSelectedChannelShareArtifacts',
  'savePublishSettings',
  'isPublishActionCard(channelKey)'
]) {
  assert.ok(share.includes(token), `Share page should expose multichannel publish contract token: ${token}`)
}

for (const token of [
  '公开可见',
  '好友可见',
  '仅自己保存',
  'channel-visibility',
  'isChannelActive(card.key)',
  'selectedKeys',
  "this.$emit('toggle', card)",
  "this.$emit('select', card)",
  "this.$emit('select', card.key)",
  'channelCards()',
  'handleCardTap(card)',
  "type: 'action'",
  "key: 'save'",
  "key: 'publish'",
  'channel-action-primary',
  'pointer-events: none'
]) {
  assert.ok(channelGrid.includes(token), `Publish channel grid should expose approved multiselect token: ${token}`)
}

for (const token of [
  '可同时选择多个渠道发布',
  '已选 {{ selectedCount }} 个渠道',
  'v-for="card in channelCards"',
  '保存设置',
  '一键发布'
]) {
  assert.ok(channelGrid.includes(token), `Publish channel grid should expose stable channel-only token: ${token}`)
}

assert.doesNotMatch(
  channelGrid,
  /publishAction|handleGridClick|data-publish-action|\$emit\('action'/,
  'Publish actions should use ordinary card selection with simple action keys, not DOM delegation or action payload objects'
)

assert.doesNotMatch(
  share,
  /channel\.publishAction|@action=/,
  'Share page should not depend on channel-grid action payloads for publish actions'
)

assert.match(
  share,
  /selectPublishChannel\(channel = \{\}\)[\s\S]*const channelKey = typeof channel === 'string' \? channel : channel\.key[\s\S]*if \(this\.isPublishActionCard\(channelKey\)\)[\s\S]*this\.handlePublishAction\(channelKey\)[\s\S]*return/,
  'Share page should route publish action string keys through the same select event path that works for channel cards'
)


assert.match(
  share,
  /togglePublishChannel\(channel = \{\}\)[\s\S]*this\.selectedPublishChannels[\s\S]*this\.selectedPublishChannel = channelKey/,
  'Share page should keep a focused preview channel while toggling the multi-channel publish set'
)

assert.match(
  share,
  /createSelectedChannelShareArtifacts\(\)[\s\S]*this\.selectedPublishChannels\.forEach[\s\S]*this\.createShareArtifact/,
  'Share page should create artifacts for all selected channels from the one-key publish action'
)

assert.match(
  share,
  /sanitizePublicVisionAgentPackage\(packagePayload = \{\}\)[\s\S]*const safePackagePayload = safeObject\(packagePayload\)[\s\S]*safePackagePayload\.packageName/,
  'Share preview package sanitization should tolerate null public Vision Agent packages during one-key publish'
)

assert.doesNotMatch(
  share,
  /selectPublishChannel\(channel = \{\}\)[\s\S]*if \(this\.selectedPublishChannel === 'pdf'\) this\.openPdfPrintPage\(\)/,
  'Selecting the PDF publish channel should not immediately leave the settings page; users can open PDF preview from explicit actions'
)

assert.ok(share.split(/\r?\n/).length < 760, 'Share page should remain a compact shell after adding multichannel controls')
assert.ok(channelGrid.split(/\r?\n/).length < 260, 'Publish channel grid should remain compact after adding multiselect UI')
