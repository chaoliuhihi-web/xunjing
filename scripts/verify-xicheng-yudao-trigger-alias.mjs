import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'
import {
  resolveEvidenceFile,
  resolveMysqlInvocation
} from './verify-xicheng-yudao-runtime-seed.mjs'

const artifactType = 'xicheng-yudao-trigger-alias'
const readyStatus = 'YUDAO_XICHENG_TRIGGER_ALIAS_READY'
const reviewRequiredStatus = 'YUDAO_XICHENG_TRIGGER_ALIAS_REVIEW_REQUIRED'
const expectedPackageCode = 'XICHENG-MAP-001'
const expectedRegionCode = 'beijing-xicheng'
const expectedTenantIdDefault = '1'

function readArgValue(args, name) {
  const equalPrefix = `${name}=`
  const equalArg = args.find((arg) => arg.startsWith(equalPrefix))
  if (equalArg) {
    return equalArg.slice(equalPrefix.length)
  }
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

function hasText(value) {
  return String(value || '').trim().length > 0
}

function sqlNumber(value, fallback) {
  const number = Number(value ?? fallback)
  if (!Number.isFinite(number)) {
    throw new Error(`Invalid numeric value: ${value}`)
  }
  return String(Math.trunc(number))
}

function numberMetric(metrics, key) {
  const number = Number(metrics[key] || 0)
  return Number.isFinite(number) ? number : 0
}

export function buildTriggerAliasSql(env = {}) {
  const tenantId = sqlNumber(env.XUNJING_TENANT_ID, expectedTenantIdDefault)
  return `
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET @tenant_id := ${tenantId};

SELECT 'shichahaiExists', COUNT(*)
FROM xunjing_poi
WHERE poi_code = 'xicheng-shichahai'
  AND region_code = '${expectedRegionCode}'
  AND tenant_id = @tenant_id
  AND deleted = b'0'
UNION ALL
SELECT 'yandaiExists', COUNT(*)
FROM xunjing_poi
WHERE poi_code = 'xicheng-yandai-xiejie'
  AND region_code = '${expectedRegionCode}'
  AND tenant_id = @tenant_id
  AND deleted = b'0'
UNION ALL
SELECT 'shichahaiHasYandaiAlias', COUNT(*)
FROM xunjing_poi
WHERE poi_code = 'xicheng-shichahai'
  AND region_code = '${expectedRegionCode}'
  AND tenant_id = @tenant_id
  AND deleted = b'0'
  AND JSON_CONTAINS(aliases_json, JSON_QUOTE('烟袋斜街'))
UNION ALL
SELECT 'yandaiHasAlias', COUNT(*)
FROM xunjing_poi
WHERE poi_code = 'xicheng-yandai-xiejie'
  AND region_code = '${expectedRegionCode}'
  AND tenant_id = @tenant_id
  AND deleted = b'0'
  AND JSON_CONTAINS(aliases_json, JSON_QUOTE('烟袋斜街'))
UNION ALL
SELECT 'yandaiHasTriggerKeyword', COUNT(*)
FROM xunjing_poi
WHERE poi_code = 'xicheng-yandai-xiejie'
  AND region_code = '${expectedRegionCode}'
  AND tenant_id = @tenant_id
  AND deleted = b'0'
  AND JSON_CONTAINS(JSON_EXTRACT(trigger_json, '$.ocrKeywords'), JSON_QUOTE('烟袋斜街'));
`.trimStart()
}

export function parseTriggerAliasRows(output) {
  const metrics = {}
  for (const line of String(output || '').split(/\r?\n/)) {
    if (!line.trim() || !line.includes('\t')) {
      continue
    }
    const [key, ...valueParts] = line.split('\t')
    metrics[key] = Number(valueParts.join('\t') || 0)
  }
  return metrics
}

export function buildTriggerAliasEvidence({
  metrics,
  client = 'unknown',
  checkedAt = new Date().toISOString(),
  env = {}
}) {
  const blockers = []
  const checks = []
  const shichahaiExists = numberMetric(metrics, 'shichahaiExists')
  const yandaiExists = numberMetric(metrics, 'yandaiExists')
  const shichahaiHasYandaiAlias = numberMetric(metrics, 'shichahaiHasYandaiAlias')
  const yandaiHasAlias = numberMetric(metrics, 'yandaiHasAlias')
  const yandaiHasTriggerKeyword = numberMetric(metrics, 'yandaiHasTriggerKeyword')

  if (shichahaiExists !== 1) {
    blockers.push('xicheng-shichahai runtime POI row must exist exactly once')
  }
  checks.push({
    name: 'shichahai-row',
    ok: shichahaiExists === 1,
    detail: 'runtime database contains the Shichahai POI row'
  })

  if (yandaiExists !== 1) {
    blockers.push('xicheng-yandai-xiejie runtime POI row must exist exactly once')
  }
  checks.push({
    name: 'yandai-row',
    ok: yandaiExists === 1,
    detail: 'runtime database contains the Yandai Xiejie POI row'
  })

  if (shichahaiHasYandaiAlias !== 0) {
    blockers.push('xicheng-shichahai aliases_json must not contain 烟袋斜街')
  }
  if (yandaiHasAlias !== 1) {
    blockers.push('xicheng-yandai-xiejie aliases_json must contain 烟袋斜街')
  }
  if (yandaiHasTriggerKeyword !== 1) {
    blockers.push('xicheng-yandai-xiejie trigger_json.ocrKeywords must contain 烟袋斜街')
  }
  checks.push({
    name: 'alias-ownership',
    ok: shichahaiHasYandaiAlias === 0 && yandaiHasAlias === 1 && yandaiHasTriggerKeyword === 1,
    detail: 'Yandai Xiejie owns its trigger alias and Shichahai no longer claims it'
  })
  checks.push({
    name: 'secret-redaction',
    ok: true,
    detail: 'evidence contains only counts and no MySQL password or provider keys'
  })

  const evidence = {
    artifactType,
    ok: blockers.length === 0,
    status: blockers.length === 0 ? readyStatus : reviewRequiredStatus,
    checkedAt,
    summary: {
      tenantId: String(env.XUNJING_TENANT_ID || expectedTenantIdDefault),
      database: env.MYSQL_DATABASE,
      client,
      packageCode: expectedPackageCode,
      regionCode: expectedRegionCode,
      shichahaiExists,
      yandaiExists,
      shichahaiHasYandaiAlias,
      yandaiHasAlias,
      yandaiHasTriggerKeyword
    },
    checks,
    blockers
  }

  if (hasText(env.MYSQL_PASSWORD) && JSON.stringify(evidence).includes(env.MYSQL_PASSWORD)) {
    throw new Error('trigger alias evidence must not contain MYSQL_PASSWORD')
  }
  return evidence
}

function redact(text, env) {
  let output = String(text || '')
  for (const key of ['MYSQL_PASSWORD', 'OSS_SECRET_KEY', 'QWEN_API_KEY', 'DASHSCOPE_API_KEY', 'WX_MP_SECRET', 'WX_MINIAPP_SECRET']) {
    if (hasText(env[key])) {
      output = output.split(env[key]).join(`[REDACTED_${key}]`)
    }
  }
  return output
}

async function writeEvidence({ rootDir, evidenceFile, evidence }) {
  const resolvedFile = resolveEvidenceFile(rootDir, evidenceFile)
  if (!resolvedFile) {
    return
  }
  await mkdir(path.dirname(resolvedFile), { recursive: true })
  await writeFile(resolvedFile, `${JSON.stringify(evidence, null, 2)}\n`)
}

async function runCli() {
  const args = process.argv.slice(2)
  const rootDir = path.resolve(readArgValue(args, '--root') || process.cwd())
  const envFile = readArgValue(args, '--env-file') || process.env.XUNJING_ENV_FILE
  const fileEnv = envFile ? await loadEnvFile(envFile) : {}
  const env = { ...process.env, ...fileEnv }
  const invocation = resolveMysqlInvocation(env)
  const result = spawnSync(invocation.command, invocation.args, {
    input: buildTriggerAliasSql(env),
    encoding: 'utf8',
    env: {
      ...process.env,
      ...invocation.env
    }
  })

  if (result.status !== 0) {
    const message = result.error?.message || result.stderr || result.stdout || `${invocation.command} command failed`
    throw new Error(redact(message.trim(), env))
  }

  const evidence = buildTriggerAliasEvidence({
    env,
    client: invocation.client,
    metrics: parseTriggerAliasRows(result.stdout)
  })
  await writeEvidence({
    rootDir,
    evidenceFile: readArgValue(args, '--evidence-file') || readArgValue(args, '--output'),
    evidence
  })

  console.log(JSON.stringify({
    ok: evidence.ok,
    status: evidence.status,
    tenantId: evidence.summary.tenantId,
    database: evidence.summary.database,
    client: evidence.summary.client,
    packageCode: evidence.summary.packageCode,
    regionCode: evidence.summary.regionCode,
    shichahaiHasYandaiAlias: evidence.summary.shichahaiHasYandaiAlias,
    yandaiHasAlias: evidence.summary.yandaiHasAlias,
    yandaiHasTriggerKeyword: evidence.summary.yandaiHasTriggerKeyword,
    blockers: evidence.blockers,
    evidenceFile: readArgValue(args, '--evidence-file') || readArgValue(args, '--output') || undefined
  }, null, 2))

  if (!evidence.ok) {
    process.exitCode = 1
  }
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
