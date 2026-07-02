import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const share = read('pages', 'xicheng', 'share', 'share.vue')
const queuePath = path.join(root, 'components', 'xicheng', 'XichengPublishConfirmQueue.vue')

assert.ok(
  fs.existsSync(queuePath),
  'Share page should split the multichannel publish confirmation queue into XichengPublishConfirmQueue'
)

const queue = fs.readFileSync(queuePath, 'utf8')

for (const token of [
  'XichengPublishConfirmQueue',
  '发布确认队列',
  '逐个确认后发布',
  '待生成素材',
  '素材已生成',
  '继续确认',
  '生成素材',
  'confirm-queue-item-ready',
  'confirm-queue-action-primary',
  "emits: ['focus', 'confirm']",
  "this.$emit('focus', item)",
  "this.$emit('confirm', item)"
]) {
  assert.ok(queue.includes(token), `Publish confirmation queue should expose approved token: ${token}`)
}

assert.match(
  queue,
  /v-for="item in normalizedItems"[\s\S]*item\.label[\s\S]*item\.statusText[\s\S]*item\.actionText/,
  'Publish confirmation queue should render data-driven channel rows with status and action copy'
)

assert.match(
  queue,
  /normalizedItems\(\)[\s\S]*assetReady: item\.assetReady === true[\s\S]*statusText: item\.statusText \|\| \(item\.assetReady \? '素材已生成' : '待生成素材'\)[\s\S]*actionText: item\.actionText \|\| \(item\.assetReady \? '继续确认' : '生成素材'\)/,
  'Publish confirmation queue should normalize missing channel state into user-facing ready/pending copy'
)

for (const token of [
  "import XichengPublishConfirmQueue from '@/components/xicheng/XichengPublishConfirmQueue.vue'",
  'XichengPublishConfirmQueue,',
  '<xicheng-publish-confirm-queue',
  ':items="publishConfirmationQueue"',
  ':focused-channel="selectedPublishChannel"',
  '@focus="focusPublishChannel"',
  '@confirm="confirmPublishQueueItem"',
  'publishConfirmationQueue()',
  'createPublishConfirmationQueueItem(channelKey)',
  'focusPublishChannel(item = {})',
  'confirmPublishQueueItem(item = {})',
  'focusNextPublishConfirmationChannel()'
]) {
  assert.ok(share.includes(token), `Share page should expose publish confirmation queue token: ${token}`)
}

assert.match(
  share,
  /publishConfirmationQueue\(\)[\s\S]*return this\.selectedPublishChannels\.map\(channelKey => this\.createPublishConfirmationQueueItem\(channelKey\)\)/,
  'Share page should derive the publish confirmation queue from the selected multichannel set'
)

assert.match(
  share,
  /createPublishConfirmationQueueItem\(channelKey\)[\s\S]*const artifactCount = this\.getSelectedChannelArtifactCount\(channelKey\)[\s\S]*assetReady: artifactCount > 0[\s\S]*statusText: artifactCount > 0 \? '素材已生成' : '待生成素材'[\s\S]*actionText: artifactCount > 0 \? '继续确认' : '生成素材'/,
  'Share page should show each selected channel as ready only after its channel-specific artifact exists'
)

assert.match(
  share,
  /getSelectedChannelArtifactCount\(channelKey = this\.selectedPublishChannel\)[\s\S]*const selectedChannel = normalizeXichengSharePublishChannel\(channelKey\)/,
  'Share page should allow preflight and queue checks to count artifacts for any selected channel, not only the focused preview channel'
)

assert.match(
  share,
  /createSelectedChannelShareArtifacts\(\)[\s\S]*this\.focusNextPublishConfirmationChannel\(\)[\s\S]*已生成所选渠道素材，请逐项确认发布/,
  'One-key publish should generate selected assets and then focus the next confirmation item instead of ending at a toast-only state'
)

assert.match(
  share,
  /confirmPublishQueueItem\(item = \{\}\)[\s\S]*this\.selectedPublishChannel = normalizeXichengSharePublishChannel\(item\.key\)[\s\S]*if \(this\.selectedPublishChannel === 'pdf'\)[\s\S]*this\.openPdfPrintPage\(\)[\s\S]*return[\s\S]*this\.createChannelShareArtifact\(this\.selectedPublishChannel\)/,
  'Confirming a queue item should open PDF preview for PDF and generate/confirm the selected social or public channel asset'
)

assert.ok(
  share.indexOf('<xicheng-publish-preflight-panel') < share.indexOf('<xicheng-publish-confirm-queue'),
  'Share page should show the confirmation queue after release preflight checks'
)

assert.ok(
  share.indexOf('<xicheng-publish-confirm-queue') < share.indexOf('<xicheng-social-share-preview'),
  'Share page should show the confirmation queue before the focused social preview'
)

assert.ok(share.split(/\r?\n/).length < 780, 'Share page should remain a compact shell after adding the confirmation queue')
assert.ok(queue.split(/\r?\n/).length < 260, 'Publish confirmation queue component should stay compact for APP packaging')

assert.doesNotMatch(
  `${share}\n${queue}`,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|startLocationUpdateBackground/,
  'Publish confirmation queue should not introduce backend calls, client secrets, or high-risk background permissions'
)
