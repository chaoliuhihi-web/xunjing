import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const opsReport = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'ops-report', 'ops-report.vue'), 'utf8')

assert.match(
  opsReport,
  /import \{ isXichengUnsafeSafetyStatus \} from '@\/request\/xunjing\/safety\.js'/,
  'Ops report should reuse the shared safety status helper instead of comparing raw strings'
)

assert.match(
  opsReport,
  /sourceReadinessStatus\(\)[\s\S]*this\.materials\.some\(item => isXichengUnsafeSafetyStatus\(item && item\.safetyStatus\) \|\| Number\(item && item\.sourceCount \|\| 0\) === 0\)[\s\S]*SOURCE_REVIEW_REQUIRED/,
  'Ops report readiness should send BLOCKED, UNAVAILABLE, lowercase, trimmed unsafe statuses and zero-source materials to review'
)

assert.match(
  opsReport,
  /const unsafeSafetyCount = this\.materials\.filter\(item => isXichengUnsafeSafetyStatus\(item && item\.safetyStatus\)\)\.length[\s\S]*安全拦截[\s\S]*value:\s*unsafeSafetyCount/,
  'Ops report safety metric should count both BLOCKED and UNAVAILABLE unsafe materials through the shared helper'
)

assert.doesNotMatch(
  opsReport,
  /item\.safetyStatus\s*===\s*'BLOCKED'/,
  'Ops report should not hand-roll BLOCKED checks that miss UNAVAILABLE or legacy whitespace/case values'
)
