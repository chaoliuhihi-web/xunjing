import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

assert.ok(
  exists('request', 'xunjing', 'sources.js'),
  'Xicheng APP should centralize backend SourceRespVO normalization for reviewed-source display'
)

const sourceHelper = read('request', 'xunjing', 'sources.js')
const triggerRequest = read('request', 'xunjing', 'trigger.js')
const chatRequest = read('request', 'xunjing', 'chat.js')
const messageCache = read('request', 'xunjing', 'messageCache.js')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const scanResultSourcesCard = exists('components', 'xicheng', 'XichengScanResultSourcesCard.vue')
  ? read('components', 'xicheng', 'XichengScanResultSourcesCard.vue')
  : ''
const scanResultDisplaySurface = `${scanResult}\n${scanResultSourcesCard}`
const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

for (const required of [
  'normalizeXichengReviewedSources',
  'getXichengDisplaySourceTitle',
  'getXichengDisplaySourceDescription',
  'contentDigest',
  'sourceUrl',
  'excerpt',
  'url'
]) {
  assert.ok(sourceHelper.includes(required), `Reviewed source helper should normalize ${required}`)
}

assert.doesNotMatch(
  sourceHelper,
  /\.\.\.source/,
  'Reviewed source helper should whitelist display fields instead of retaining raw backend source metadata'
)

assert.match(
  triggerRequest,
  /normalizeXichengReviewedSources\(result\.sources\)/,
  'Trigger result normalization should convert backend SourceRespVO fields into APP display fields'
)

assert.match(
  chatRequest,
  /normalizeXichengReviewedSources\(payload\.sources\)/,
  'Xicheng chat response normalization should convert backend SourceRespVO fields into APP display fields'
)

assert.match(
  scanResult,
  /normalizeXichengReviewedSources\(result\.sources\)/,
  'Recognition result normalization should also repair cached or route-loaded backend sources before display'
)

assert.match(
  messageCache,
  /normalizeXichengReviewedSources\(item\.sources\)/,
  'AI guide message cache helper should repair cached assistant message sources before rendering reviewed-source cards'
)

assert.match(
  aiGuide,
  /normalizeXichengReviewedSources\(context\.sources\)/,
  'AI guide should expose normalized reviewed sources from the active recognition context'
)

for (const [name, page] of [
  ['AI guide', aiGuide],
  ['recognition result', scanResultDisplaySurface],
  ['travelogue', travelogue]
]) {
  assert.match(
    page,
    /getXichengDisplaySourceTitle[\s\S]*getXichengDisplaySourceDescription/,
    `${name} should reuse the shared reviewed-source display helpers`
  )
}

for (const [name, page] of [
  ['AI guide', aiGuide],
  ['recognition result', scanResultDisplaySurface],
  ['travelogue', travelogue]
]) {
  assert.doesNotMatch(
    page,
    /replace\(\s*\/POI 级已审核来源：\[\^。\]\*。\/g/,
    `${name} should not duplicate internal reviewed-source cleanup regexes outside the shared source helper`
  )
}

const sourceModule = `${sourceHelper.replace(/export const /g, 'const ')}
export { normalizeXichengReviewedSources, getXichengDisplaySourceTitle, getXichengDisplaySourceDescription }`
const {
  normalizeXichengReviewedSources,
  getXichengDisplaySourceTitle,
  getXichengDisplaySourceDescription
} = await import(`data:text/javascript;base64,${Buffer.from(sourceModule).toString('base64')}`)
const [normalized] = normalizeXichengReviewedSources([
  {
    id: 7,
    title: '西城审核资料',
    sourceType: 'OFFICIAL_PUBLIC',
    sourceUrl: 'https://example.com/xicheng',
    contentDigest: '妙应寺白塔是西城白塔寺片区的重要历史文化地标。',
    score: 0.93
  }
])

assert.equal(normalized.title, '西城审核资料')
assert.equal(normalized.excerpt, '妙应寺白塔是西城白塔寺片区的重要历史文化地标。')
assert.equal(normalized.summary, '妙应寺白塔是西城白塔寺片区的重要历史文化地标。')
assert.equal(normalized.url, 'https://example.com/xicheng')
assert.equal(normalized.sourceUrl, 'https://example.com/xicheng')
assert.equal(normalized.sourceType, 'OFFICIAL_PUBLIC')
assert.equal(normalized.score, 0.93)

const [safeNormalized] = normalizeXichengReviewedSources([
  {
    id: 8,
    sourceTitle: '后台审核来源',
    sourceUrl: 'https://example.com/source',
    contentDigest: '用于展示的审核摘要。',
    rawText: '完整原文不应进入 APP 展示缓存',
    content: '内部全文不应进入 APP 展示缓存',
    embedding: [0.1, 0.2],
    authorization: 'Bearer secret',
    apiKey: 'sk-not-real-but-sensitive'
  }
])

for (const blocked of ['rawText', 'content', 'embedding', 'authorization', 'apiKey']) {
  assert.equal(
    Object.prototype.hasOwnProperty.call(safeNormalized, blocked),
    false,
    `Reviewed source normalization should not preserve raw backend field ${blocked}`
  )
}

assert.deepEqual(
  normalizeXichengReviewedSources([
    {},
    null,
    'bad-source',
    {
      rawText: '只有内部原文不能作为 APP 已审核展示来源',
      content: '只有内部全文不能作为 APP 已审核展示来源'
    }
  ]),
  [],
  'Reviewed source normalization should drop blank/raw-only source records so sourceCount cannot be inflated'
)

assert.deepEqual(
  normalizeXichengReviewedSources([
    {
      title: '明确已审核来源',
      reviewStatus: '已审核',
      contentDigest: '该来源可以展示。'
    },
    {
      title: '英文已审核来源',
      auditStatus: 'APPROVED',
      contentDigest: '该英文审核状态来源可以展示。'
    },
    {
      title: '待审核来源',
      reviewStatus: '待审核',
      contentDigest: '该来源尚未审核，不应展示。'
    },
    {
      title: '英文待审核来源',
      auditStatus: 'PENDING',
      contentDigest: '该来源尚未审核，不应展示。'
    },
    {
      title: '拒绝来源',
      sourceStatus: 'REJECTED',
      contentDigest: '该来源未通过审核，不应展示。'
    },
    {
      title: '草稿来源',
      status: 'DRAFT',
      contentDigest: '该来源还在草稿中，不应展示。'
    }
  ]).map(source => source.title),
  ['明确已审核来源', '英文已审核来源'],
  'Reviewed source normalization should fail closed by dropping explicitly pending, rejected, or draft source records'
)

assert.equal(
  getXichengDisplaySourceTitle({ title: '白塔寺 POI 级已审核来源' }),
  '白塔寺',
  'Shared source display helper should strip raw reviewed-source suffixes from source titles'
)

assert.equal(
  getXichengDisplaySourceDescription({
    excerpt: 'POI 级已审核来源：触发关键词、坐标和别名来自内部种子。白塔寺适合观察白塔和寺院格局。生产发布前仍需完成运营复核。'
  }),
  '白塔寺适合观察白塔和寺院格局。',
  'Shared source display helper should strip internal seed and production-review notes from source descriptions'
)

assert.equal(
  getXichengDisplaySourceDescription({
    url: 'https://example.com/source',
    sourceType: 'official-poi-config'
  }),
  '官方公开来源',
  'Shared source display helper should show neutral copy when only structured source metadata is available'
)

assert.equal(
  getXichengDisplaySourceDescription({
    excerpt: '一二三四五六七八九十'
  }, 4),
  '一二三四...',
  'Shared source display helper should support bounded descriptions for compact cards and PDF templates'
)
