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
  'main',
  '西城 P0 开发、验收和发版候选统一使用 `main`',
  '`product/city-companion-main` 是历史产品分支，本轮不再作为西城 P0 发版线',
  'for f in tests/*.test.mjs; do node "$f" || exit 1; done',
  'npm run doctor:release:prereqs',
  'npm run build',
  'npm run build:app:release',
  'npm run verify:yudao:local',
  'npm run verify:yudao:preprod',
  'npm run test:run',
  'xicheng-app-page-size-budget.test.mjs',
  '/app-api/xunjing/**',
  'tenant-id',
  'suggestedQuestions',
  'sources',
  'safetyStatus=BLOCKED',
  'XICHENG_DEVELOPMENT_TRIGGER_FIXTURE',
  'XUNJING_APP_API_BASE_URL',
  'XUNJING_RELEASE_ENV_FILE',
  'XUNJING_PLATFORM_ENV_FILE',
  'WX_MP_APP_ID',
  'WX_MP_SECRET',
  'WX_MINIAPP_APPID',
  'WX_MINIAPP_SECRET',
  '非本地 HTTPS',
  'APP readiness evidence',
  'summary.xichengRegionCode',
  'summary.xichengPackageCode',
  'preprod-evidence-stale',
  'preprod-evidence-invalid-base-url',
  'preprod-evidence-invalid-tenant-id',
  'preprod-evidence-missing-required-check',
  'beijing-xicheng',
  '/app-api/xunjing/scan/resolve',
  'API 可达性',
  'qa/xicheng-yudao-server-smoke-evidence.json',
  'git rev-parse --short HEAD',
  'git rev-list --left-right --count HEAD...github/main',
  'git rev-list --left-right --count HEAD...origin/main',
  'node_modules',
  'dist',
  'unpackage',
  'tmp',
  '真实 token'
]) {
  assert.ok(checklist.includes(required), `Xicheng APP release checklist should mention ${required}`)
}

assert.doesNotMatch(
  checklist,
  /最近已同步发版基线：`[0-9a-f]{7,12}`/,
  'Xicheng APP release checklist should use live git parity commands instead of a hardcoded short SHA baseline'
)

assert.doesNotMatch(
  checklist,
  /product\/city-companion-main` 是稳定主线，不直接开发/,
  'Xicheng APP release checklist should not keep the old stable-mainline branch policy after development moved to main'
)

assert.doesNotMatch(
  checklist,
  /sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}/,
  'Xicheng APP release checklist must not contain real secrets or tokens'
)
