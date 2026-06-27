import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

assert.ok(exists('pages', 'xicheng', 'ops-report', 'ops-report.vue'), 'Xicheng P1 should add a city ops report page')

const home = read('pages', 'xicheng', 'home', 'home.vue')
const passport = read('pages', 'xicheng', 'passport', 'passport.vue')
const opsReport = read('pages', 'xicheng', 'ops-report', 'ops-report.vue')
const pagesJson = read('pages.json')
const combined = [home, passport, opsReport].join('\n')

assert.match(
  pagesJson,
  /"path":\s*"pages\/xicheng\/ops-report\/ops-report"[\s\S]*"navigationBarTitleText":\s*"城市运营报告"/,
  'pages.json should register a Xicheng city ops report page'
)

for (const required of [
  '城市运营报告',
  '/pages/xicheng/ops-report/ops-report'
]) {
  assert.ok(home.includes(required), `Xicheng home should expose ${required}`)
  assert.ok(passport.includes(required), `Xicheng passport should link to ${required}`)
}

for (const required of [
  '城市运营报告',
  'getXichengCityOpsReportPreview',
  'cityOpsReport',
  '访问量',
  '识别量',
  '路线完成',
  '作品数',
  '分享数',
  '误触发',
  '运营建议',
  '作品审核',
  '分享海报'
]) {
  assert.ok(opsReport.includes(required), `City ops report page should include ${required}`)
}

assert.doesNotMatch(
  combined,
  /COZE_CONFIG|QWEN_API_KEY|DASHSCOPE_API_KEY|Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'City ops report front-end entry should not expose AI vendor secrets'
)
