import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '..')

const currentDocs = [
  'README.md',
  'docs/README.md',
  'docs/00_项目总览/资料索引.md',
  'docs/01_产品规划/README.md',
  'docs/01_产品规划/寻境C端产品功能文档_v1.4.md',
  'docs/01_产品规划/寻境业务对象与状态机文档_v1.2.md',
  'docs/02_开发规划/开发入口说明.md',
  'docs/02_开发规划/寻境C端完整产品技术实施蓝图_v1.0.md',
  'docs/04_AI交接任务书/README.md',
  'docs/04_AI交接任务书/下一阶段开发任务书.md',
  'docs/04_AI交接任务书/寻境C端完整产品AI实施任务书_v1.0.md',
  'docs/04_AI交接任务书/寻境C端实施执行台账.md',
  'docs/05_验收与证据/README.md',
  'docs/05_验收与证据/寻境C端P0验收门禁_v1.0.md'
]

for (const relativePath of currentDocs) {
  assert.ok(fs.existsSync(path.join(root, relativePath)), `missing current document: ${relativePath}`)
}

const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g
for (const relativePath of currentDocs) {
  const content = read(relativePath)
  for (const match of content.matchAll(markdownLinkPattern)) {
    const target = match[1]
    if (/^(https?:|mailto:|#)/.test(target)) continue
    const cleanTarget = decodeURIComponent(target.split('#')[0])
    const resolved = path.resolve(path.dirname(path.join(root, relativePath)), cleanTarget)
    assert.ok(fs.existsSync(resolved), `${relativePath} contains broken link: ${target}`)
  }
}

const docsIndex = read('docs/README.md')
for (const token of [
  '寻境 C 端产品功能文档 v1.4',
  '寻境业务对象与状态机文档 v1.2',
  '寻境 C 端完整产品技术实施蓝图 v1.0',
  '寻境 C 端完整产品 AI 实施任务书 v1.0',
  '寻境 C 端 P0 验收门禁 v1.0',
  '合作方、加盟、分润和结算暂不进入当前实施范围'
]) {
  assert.ok(docsIndex.includes(token), `docs index must declare: ${token}`)
}
assert.ok(docsIndex.includes('当前分支：`main`'), 'docs index must declare main as the current branch')

const product = read('docs/01_产品规划/寻境C端产品功能文档_v1.4.md')
assert.match(product, /完整产品的六个闭环/)
assert.match(product, /规划一次新旅行/)
assert.match(product, /旅行结束了，做成作品/)
assert.match(product, /标准商品不拆分定金和尾款/)
assert.match(product, /合作方、加盟、渠道分润和结算功能暂不进入产品范围/)

const objects = read('docs/01_产品规划/寻境业务对象与状态机文档_v1.2.md')
assert.match(objects, /DRAFT -> COMPLETED/)
assert.match(objects, /PAID 已付款/)
assert.doesNotMatch(objects, /CommissionLedger|PartnerAttribution|SettlementStatement|DEPOSIT_PAID|BALANCE_PAID/)

const taskbook = read('docs/04_AI交接任务书/寻境C端完整产品AI实施任务书_v1.0.md')
const taskIds = [...taskbook.matchAll(/^### (XJ-C\d-\d{2})\b/gm)].map(match => match[1])
assert.equal(taskIds.length, 18, 'taskbook must contain 18 detailed task cards')
assert.equal(new Set(taskIds).size, taskIds.length, 'task IDs must be unique')
for (const token of ['BLOCKED_ENV', '完成定义', '主要写路径', '双入口', '一次付款']) {
  assert.ok(taskbook.includes(token), `taskbook must include executable token: ${token}`)
}

const ledger = read('docs/04_AI交接任务书/寻境C端实施执行台账.md')
const ledgerTaskIds = [...ledger.matchAll(/^\| (XJ-C\d-\d{2}) \|/gm)].map(match => match[1])
assert.equal(ledgerTaskIds.length, 18, 'execution ledger must contain all 18 tasks')
assert.deepEqual(new Set(ledgerTaskIds), new Set(taskIds), 'execution ledger and taskbook IDs must match')
assert.match(ledger, /第一位执行 AI 从 `XJ-C0-01` 开始/)

const acceptance = read('docs/05_验收与证据/寻境C端P0验收门禁_v1.0.md')
for (let level = 0; level <= 6; level += 1) {
  assert.ok(acceptance.includes(`L${level}`), `acceptance gate must include L${level}`)
}
for (const scenario of ['U1 行后直接做作品', 'U2 行前计划', 'U3 轻行中', 'U4 同行共同素材', 'U5 订单与售后', 'U6 隐私与删除']) {
  assert.ok(acceptance.includes(scenario), `acceptance gate must include ${scenario}`)
}

process.stdout.write(`xunjing C docs gate passed: ${currentDocs.length} documents, ${taskIds.length} task cards\n`)
