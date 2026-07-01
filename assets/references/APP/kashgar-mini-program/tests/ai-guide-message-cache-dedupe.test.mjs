import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')
const helperSource = fs.readFileSync(path.join(root, 'request', 'xunjing', 'messageCache.js'), 'utf8')
const executableHelperSource = helperSource
  .split('\n')
  .filter(line => !line.startsWith('import '))
  .join('\n')
  .replace(/export const /g, 'const ')

assert.match(
  aiGuide,
  /import \{ normalizeXichengCachedMessages \} from '@\/request\/xunjing\/messageCache\.js'/,
  'AI guide should reuse the shared message cache normalizer instead of restoring raw cached ids'
)

const loadHelper = new Function(`
const normalizeXichengSafetyStatus = (safetyStatus = '') => String(safetyStatus || '').trim().toUpperCase()
const isXichengUnsafeSafetyStatus = (safetyStatus = '') => ['BLOCKED', 'UNAVAILABLE'].includes(normalizeXichengSafetyStatus(safetyStatus))
const normalizeXichengReviewedSources = (sources = []) => Array.isArray(sources) ? sources.filter(Boolean) : []
${executableHelperSource}
return { normalizeXichengCachedMessages }
`)

const { normalizeXichengCachedMessages } = loadHelper()

const restored = normalizeXichengCachedMessages(
  [
    {
      id: 'msg_duplicate',
      role: 'assistant',
      content: '欢迎继续了解白塔寺',
      followUps: ['白塔寺建筑细节 已审核来源'],
      sources: [{ title: '白塔寺官方资料', excerpt: '已审核来源' }],
      safetyStatus: 'PASSED',
      isPending: false
    },
    {
      id: 'msg_duplicate',
      role: 'user',
      content: '讲讲白塔寺',
      isPending: false
    },
    {
      id: '',
      role: 'assistant',
      content: '后端不应展示的未审核回答',
      followUps: ['继续追问'],
      sources: [{ title: '不应展示' }],
      safetyStatus: 'blocked',
      isPending: false
    }
  ],
  {
    createMessageId: (() => {
      let seed = 0
      return () => `msg_repaired_${seed++}`
    })()
  }
)

assert.equal(restored.length, 3, 'cache normalizer should keep valid cached user and assistant messages')

const ids = restored.map(item => item.id)
assert.equal(new Set(ids).size, ids.length, 'cache normalizer should repair duplicate or missing message ids before rendering')
assert.deepEqual(ids, ['msg_duplicate', 'msg_repaired_0', 'msg_repaired_1'])

const repairedBlocked = restored[2]
assert.equal(repairedBlocked.safetyStatus, 'BLOCKED', 'cache normalizer should normalize cached safetyStatus values')
assert.equal(
  repairedBlocked.content,
  '无已审核来源，不能回答',
  'unsafe cached assistant messages should replace stale raw content with the fixed BLOCKED refusal'
)
assert.deepEqual(repairedBlocked.followUps, [], 'unsafe cached messages should not restore stale follow-up chips')
assert.deepEqual(repairedBlocked.sources, [], 'unsafe cached messages should not restore stale reviewed sources')
