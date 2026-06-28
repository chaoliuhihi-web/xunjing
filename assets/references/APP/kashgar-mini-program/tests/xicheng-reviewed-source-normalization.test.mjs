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
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')

for (const required of [
  'normalizeXichengReviewedSources',
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
  aiGuide,
  /normalizeXichengReviewedSources\(item\.sources\)/,
  'AI guide should repair cached assistant message sources before rendering reviewed-source cards'
)

assert.match(
  aiGuide,
  /normalizeXichengReviewedSources\(context\.sources\)/,
  'AI guide should expose normalized reviewed sources from the active recognition context'
)

const sourceModule = `${sourceHelper.replace(/export const /g, 'const ')}
export { normalizeXichengReviewedSources }`
const { normalizeXichengReviewedSources } = await import(`data:text/javascript;base64,${Buffer.from(sourceModule).toString('base64')}`)
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
