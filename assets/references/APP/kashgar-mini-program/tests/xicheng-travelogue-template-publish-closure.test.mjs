import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const readOptional = (...segments) => {
  const filePath = path.join(root, ...segments)
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
}

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')
const share = read('pages', 'xicheng', 'share', 'share.vue')
const works = read('pages', 'xicheng', 'works', 'works.vue')
const generationHero = read('components', 'xicheng', 'XichengTravelogueGenerationHero.vue')
const travelogueGenerationSurface = `${travelogue}\n${generationHero}`

const componentContracts = [
  {
    name: 'XichengTravelogueTemplateGallery.vue',
    requiredTokens: ['城市漫步杂志', '胡同手账', '古建札记', '相册纪念', 'PDF 纪念册', '使用此模板生成']
  },
  {
    name: 'XichengTravelogueTemplateSettings.vue',
    requiredTokens: ['模板细节定制', '封面', '排版风格', '内容重点', '图片裁切', '来源与隐私']
  },
  {
    name: 'XichengPublishChannelGrid.vue',
    requiredTokens: ['发布渠道', '星河寻境公开游记', '朋友圈', '小红书', 'PDF 打印', '唤起用户确认']
  },
  {
    name: 'XichengSocialSharePreview.vue',
    requiredTokens: ['朋友圈发布预览', '小红书笔记预览', '复制文案', '保存图片', '发布确认']
  },
  {
    name: 'XichengKeepsakeTravelogueCard.vue',
    requiredTokens: ['精美游记', 'PDF 纪念册', '继续阅读', '分享', '打印']
  }
]

for (const contract of componentContracts) {
  const source = readOptional('components', 'xicheng', contract.name)
  assert.ok(source, `${contract.name} should exist as a split component, not page-bulk markup`)
  assert.ok(source.split(/\r?\n/).length < 360, `${contract.name} should stay compact for APP packaging`)
  for (const token of contract.requiredTokens) {
    assert.ok(source.includes(token), `${contract.name} should expose approved UI token: ${token}`)
  }
  assert.doesNotMatch(
    source,
    /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|background-location|startLocationUpdateBackground/,
    `${contract.name} should not introduce backend calls, client secrets, or high-risk background permissions`
  )
}

for (const token of [
  'xicheng-travelogue-template-gallery',
  'xicheng-travelogue-template-settings',
  'selectedTravelogueTemplate',
  'applyTravelogueTemplate',
  'updateTravelogueTemplateSettings'
]) {
  assert.ok(travelogueGenerationSurface.includes(token), `travelogue generation surface should wire template generation via ${token}`)
}

for (const token of [
  'xicheng-publish-channel-grid',
  'xicheng-social-share-preview',
  'selectedPublishChannel',
  'selectPublishChannel',
  'createChannelShareArtifact'
]) {
  assert.ok(share.includes(token), `share.vue should wire publish channel/social preview via ${token}`)
}

for (const token of [
  'xicheng-keepsake-travelogue-card',
  'openSharePage',
  'openPdfPrintPage',
  'openTravelogueReaderPage'
]) {
  assert.ok(works.includes(token), `works.vue should wire keepsake library cards via ${token}`)
}
