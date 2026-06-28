import assert from 'node:assert/strict'
import fs from 'node:fs'

let triggerSource = fs.readFileSync(new URL('../request/xunjing/trigger.js', import.meta.url), 'utf8')

triggerSource = triggerSource
  .replace(
    /import \{[\s\S]*?\} from '@\/request\/xunjingMultimodal\.js'/,
    `const buildPhotoMetaForTrigger = (payload) => payload
const buildYudaoAppApiUrl = (path) => 'https://example.test/' + String(path || '').split('/').filter(Boolean).join('/')
const getXunjingUserTraceId = () => 'guest'
const getYudaoCommonResultPayload = (res) => res && res.data && res.data.data ? res.data.data : {}
const inferImageLabelsFromLocalHints = () => []
const normalizeLocationForTrigger = (location = null) => location
const readLocalImageBase64ForTrigger = async () => null
const requestCurrentLocationForTrigger = async () => null
const requestImageInfoForTrigger = async () => null`
  )
  .replace(
    /import \{ normalizeXichengReviewedSources \} from '@\/request\/xunjing\/sources\.js'/,
    `const normalizeXichengReviewedSources = (sources = []) => Array.isArray(sources)
  ? sources.map(source => ({
    ...source,
    url: source.url || source.sourceUrl || '',
    excerpt: source.excerpt || source.contentDigest || source.summary || '',
    summary: source.summary || source.contentDigest || source.excerpt || ''
  }))
  : []`
  )
  .replace(
    /import \{[\s\S]*?\} from '@\/config\/regions\/xicheng\.js'/,
    `const XICHENG_REGION_CONFIG = Object.freeze({
  regionCode: 'beijing-xicheng',
  packageCode: 'XICHENG-MAP-001',
  sceneCode: 'xicheng-multimodal-trigger',
  sourceChannel: 'APP_UNIAPP',
  tenantId: '1'
})
const XICHENG_SUGGESTED_QUESTIONS = Object.freeze(['讲讲这个文化点'])
const XICHENG_DEVELOPMENT_TRIGGER_FIXTURE = Object.freeze({
  triggerType: 'development-fixture',
  sourceLabel: '开发兜底样例',
  poiCode: 'xicheng-baitasi',
  poiName: '白塔寺',
  confidence: 0.86,
  sources: []
})`
  )

const triggerModule = await import(`data:text/javascript;base64,${Buffer.from(triggerSource).toString('base64')}`)
const { normalizeXichengTriggerResult } = triggerModule

const percentOnlyResult = normalizeXichengTriggerResult({
  poiCode: 'xicheng-baitasi',
  poiName: '白塔寺',
  confidencePercent: 87,
  suggestedQuestions: ['白塔寺为什么是西城地标？'],
  sources: [{ title: '西城审核资料' }],
  safetyStatus: 'APPROVED'
}, 'text')

assert.equal(
  percentOnlyResult.confidence,
  0.87,
  'Trigger normalization should convert backend confidencePercent into decimal confidence for APP UI'
)
assert.equal(
  percentOnlyResult.confidencePercent,
  87,
  'Trigger normalization should preserve backend confidencePercent for result-page display'
)
assert.deepEqual(percentOnlyResult.suggestedQuestions, ['白塔寺为什么是西城地标？'])
assert.equal(percentOnlyResult.sources[0].title, '西城审核资料')
assert.equal(percentOnlyResult.safetyStatus, 'APPROVED')

const decimalResult = normalizeXichengTriggerResult({
  poiCode: 'xicheng-shichahai',
  poiName: '什刹海',
  confidence: 0.72
}, 'gps')

assert.equal(decimalResult.confidence, 0.72)
assert.equal(decimalResult.confidencePercent, 72)
