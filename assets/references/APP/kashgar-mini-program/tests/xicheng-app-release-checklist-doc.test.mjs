import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checklistPath = path.join(root, 'docs', 'xicheng-app-release-checklist.md')

assert.ok(
  fs.existsSync(checklistPath),
  'Xicheng APP should keep a release checklist for handoff and launch verification'
)

const checklist = fs.readFileSync(checklistPath, 'utf8')

for (const required of [
  'feature/xicheng-p0',
  'product/city-companion-main',
  'for f in tests/*.test.mjs; do node "$f" || exit 1; done',
  'npm run build',
  'npm run test:run',
  'xicheng-app-page-size-budget.test.mjs',
  '/app-api/xunjing/**',
  'tenant-id',
  'suggestedQuestions',
  'sources',
  'safetyStatus=BLOCKED',
  'XICHENG_DEVELOPMENT_TRIGGER_FIXTURE',
  'XUNJING_APP_API_BASE_URL',
  'WX_MP_APP_ID',
  'WX_MP_SECRET',
  'WX_MINIAPP_APPID',
  'WX_MINIAPP_SECRET',
  '非本地 HTTPS',
  'APP readiness evidence',
  'qa/xicheng-yudao-server-smoke-evidence.json',
  'node_modules',
  'dist',
  'unpackage',
  'tmp',
  '真实 token',
  '9864ba95'
]) {
  assert.ok(checklist.includes(required), `Xicheng APP release checklist should mention ${required}`)
}

assert.doesNotMatch(
  checklist,
  /sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}/,
  'Xicheng APP release checklist must not contain real secrets or tokens'
)
