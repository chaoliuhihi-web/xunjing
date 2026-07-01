import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const runbookPath = path.join(root, 'docs', 'xicheng-app-preprod-evidence-runbook.md')
const checklistPath = path.join(root, 'docs', 'xicheng-app-release-checklist.md')

assert.ok(
  fs.existsSync(runbookPath),
  'Xicheng APP should keep a preprod evidence runbook for non-local HTTPS readiness'
)

const runbook = fs.readFileSync(runbookPath, 'utf8')
const checklist = fs.readFileSync(checklistPath, 'utf8')

for (const required of [
  '非本地 HTTPS',
  'APP readiness evidence',
  'XUNJING_APP_API_BASE_URL',
  'VITE_XUNJING_YUDAO_APP_BASE_URL',
  'VITE_XUNJING_TENANT_ID',
  'WX_MP_APP_ID',
  'WX_MP_SECRET',
  'WX_MINIAPP_APPID',
  'WX_MINIAPP_SECRET',
  'qa/xicheng-yudao-server-smoke-evidence.json',
  'qa/xicheng-app-readiness-local-evidence.json',
  'qa/xicheng-app-readiness-evidence.json',
  'feature/xicheng-p0',
  'npm run xunjing:platform:verify --',
  'npm run verify:yudao:local',
  'npm run xunjing:yudao:release:gate',
  'npm run build:app:release',
  '西城首页 -> 文本识别 -> 识别结果 -> 小京讲解 -> 开始记录 -> 西城游记草稿',
  'baseUrl must match release evidence appApiBaseUrl',
  '20/20',
  'safetyStatus=BLOCKED',
  'sources',
  'tenant-id'
]) {
  assert.ok(runbook.includes(required), `Preprod evidence runbook should mention ${required}`)
}

assert.ok(
  checklist.includes('xicheng-app-preprod-evidence-runbook.md'),
  'Release checklist should link the preprod evidence runbook'
)

assert.doesNotMatch(
  runbook,
  /sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}/,
  'Preprod evidence runbook must not contain real secrets or tokens'
)
