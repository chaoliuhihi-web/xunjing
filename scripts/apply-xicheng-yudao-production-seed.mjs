import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'
import {
  buildRuntimeSeedEvidence,
  buildRuntimeSeedSql,
  parseMetricRows,
  resolveEvidenceFile,
  resolveMysqlInvocation
} from './verify-xicheng-yudao-runtime-seed.mjs'

const artifactType = 'xicheng-yudao-production-seed-apply'
const readyStatus = 'YUDAO_XICHENG_PRODUCTION_SEED_APPLIED'
const notReadyStatus = 'YUDAO_XICHENG_PRODUCTION_SEED_APPLY_NOT_READY'
const requiredSeedEvidenceChecks = [
  'sql-file',
  'seed-shape',
  'seed-preconditions',
  'poi-count',
  'poi-approval',
  'production-metrics',
  'review-batch-metrics',
  'field-evidence',
  'source-license-evidence',
  'source-documents'
]

function readArgValue(args, name) {
  const equalPrefix = `${name}=`
  const equalArg = args.find((arg) => arg.startsWith(equalPrefix))
  if (equalArg) {
    return equalArg.slice(equalPrefix.length)
  }
  const index = args.indexOf(name)
  if (index >= 0) {
    return args[index + 1]
  }
  return undefined
}

function readFlag(args, name) {
  return args.includes(name) || args.some((arg) => arg === `${name}=true`)
}

function hasText(value) {
  return String(value || '').trim().length > 0
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function resolveRootPath(rootDir, filePath) {
  if (!hasText(filePath)) {
    return undefined
  }
  return path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(rootDir, filePath)
}

function evidenceSummary(evidence) {
  return evidence && typeof evidence.summary === 'object' && evidence.summary !== null
    ? evidence.summary
    : {}
}

function evidenceBlockers(evidence) {
  return Array.isArray(evidence?.blockers) ? evidence.blockers : []
}

function checkEvidenceChecks(evidence, requiredChecks, blockers) {
  const checks = Array.isArray(evidence?.checks) ? evidence.checks : []
  const byName = new Map(checks.map((item) => [item.name, item]))
  requiredChecks.forEach((name) => {
    const item = byName.get(name)
    if (!item) {
      blockers.push(`seed evidence must include ${name}`)
    } else if (item.ok !== true) {
      blockers.push(`seed evidence check ${name} must be ok`)
    }
  })
}

function assertNoSecrets(value, env, label) {
  const serialized = JSON.stringify(value || {})
  for (const key of ['MYSQL_PASSWORD', 'OSS_SECRET_KEY', 'QWEN_API_KEY', 'DASHSCOPE_API_KEY', 'WX_MP_SECRET', 'WX_MINIAPP_SECRET']) {
    if (hasText(env[key]) && serialized.includes(env[key])) {
      throw new Error(`${label} must not contain ${key}`)
    }
  }
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

async function writeEvidenceFile(rootDir, evidenceFile, evidence) {
  const resolvedFile = resolveEvidenceFile(rootDir, evidenceFile)
  if (!resolvedFile) {
    return undefined
  }
  await mkdir(path.dirname(resolvedFile), { recursive: true })
  await writeFile(resolvedFile, `${JSON.stringify(evidence, null, 2)}\n`)
  return resolvedFile
}

export async function validateProductionSeedEvidenceForApply({
  rootDir = process.cwd(),
  seedSqlPath,
  seedEvidencePath
} = {}) {
  const resolvedRoot = path.resolve(rootDir)
  const seedSqlFile = resolveRootPath(resolvedRoot, seedSqlPath)
  const seedEvidenceFile = resolveRootPath(resolvedRoot, seedEvidencePath)
  if (!seedSqlFile) {
    throw new Error('--seed-sql is required')
  }
  if (!seedEvidenceFile) {
    throw new Error('--seed-evidence is required')
  }

  const [seedSql, seedEvidenceText] = await Promise.all([
    readFile(seedSqlFile, 'utf8'),
    readFile(seedEvidenceFile, 'utf8')
  ])
  const seedEvidence = JSON.parse(seedEvidenceText)
  const summary = evidenceSummary(seedEvidence)
  const blockers = []
  const seedSqlSha256 = sha256(seedSql)
  const evidenceSqlFile = resolveRootPath(resolvedRoot, summary.sqlFile)

  if (seedEvidence.artifactType !== 'xicheng-poi-production-seed-readiness') {
    blockers.push('seed evidence artifactType must be xicheng-poi-production-seed-readiness')
  }
  if (seedEvidence.ok !== true) {
    blockers.push('seed evidence ok must be true')
  }
  if (seedEvidence.status !== 'PRODUCTION_POI_SEED_READY') {
    blockers.push('seed evidence status must be PRODUCTION_POI_SEED_READY')
  }
  if (evidenceSqlFile !== seedSqlFile) {
    blockers.push('seed evidence sqlFile must match --seed-sql')
  }
  if (summary.sqlSha256 !== seedSqlSha256) {
    blockers.push('seed evidence sqlSha256 must match the SQL file content')
  }
  if (summary.productionReady !== true) {
    blockers.push('seed evidence productionReady must be true')
  }
  if (summary.regionCode !== 'beijing-xicheng') {
    blockers.push('seed evidence regionCode must be beijing-xicheng')
  }
  if (summary.packageCode !== 'XICHENG-MAP-001') {
    blockers.push('seed evidence packageCode must be XICHENG-MAP-001')
  }
  if (Number(summary.poiCount ?? summary.poiSeedCount) < 80) {
    blockers.push('seed evidence must prove at least 80 production POIs')
  }
  checkEvidenceChecks(seedEvidence, requiredSeedEvidenceChecks, blockers)
  if (evidenceBlockers(seedEvidence).length > 0) {
    blockers.push(`seed evidence contains blockers: ${evidenceBlockers(seedEvidence).join('; ')}`)
  }

  if (blockers.length > 0) {
    throw new Error(blockers.join('; '))
  }

  return {
    seedSqlFile,
    seedEvidenceFile,
    seedSql,
    seedSqlSha256,
    poiCount: Number(summary.poiCount ?? summary.poiSeedCount),
    minPoiCount: Number(summary.minPoiCount ?? 80),
    regionCode: summary.regionCode,
    packageCode: summary.packageCode,
    reviewBatchCode: summary.reviewBatchCode,
    reviewBatchEvidencePackageRef: summary.reviewBatchEvidencePackageRef
  }
}

function runMysql(invocation, sql, env, spawnImpl) {
  const result = spawnImpl(invocation.command, invocation.args, {
    input: sql,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...invocation.env
    }
  })
  if (result.status !== 0) {
    const message = result.error?.message || result.stderr || result.stdout || `${invocation.command} command failed`
    throw new Error(redact(String(message).trim(), env))
  }
  return result.stdout || ''
}

function buildApplyReport({
  validation,
  env,
  client,
  runtimeEvidence,
  runtimeEvidenceFile,
  applyEvidenceFile,
  checkedAt
}) {
  const blockers = runtimeEvidence.ok === true ? [] : runtimeEvidence.blockers
  const report = {
    artifactType,
    ok: runtimeEvidence.ok === true,
    status: runtimeEvidence.ok === true ? readyStatus : notReadyStatus,
    checkedAt,
    summary: {
      seedSqlFile: validation.seedSqlFile,
      seedSqlSha256: validation.seedSqlSha256,
      seedEvidenceFile: validation.seedEvidenceFile,
      runtimeEvidenceFile,
      applyEvidenceFile,
      mysqlClient: client,
      targetTenantId: String(env.XUNJING_TENANT_ID || ''),
      targetDatabase: env.MYSQL_DATABASE,
      packageCode: validation.packageCode,
      regionCode: validation.regionCode,
      poiCount: validation.poiCount,
      reviewBatchCode: validation.reviewBatchCode,
      reviewBatchEvidencePackageRef: validation.reviewBatchEvidencePackageRef,
      runtimeSeedStatus: runtimeEvidence.status,
      runtimeSeedProductionReady: runtimeEvidence.summary.productionReady,
      runtimeSeedPoiTotal: runtimeEvidence.summary.poiTotal,
      runtimeSeedKnowledgeDocuments: runtimeEvidence.summary.knowledgeDocuments,
      runtimeSeedMapPoints: runtimeEvidence.summary.mapPoints
    },
    checks: [
      {
        name: 'seed-evidence',
        ok: true,
        detail: 'Production seed SQL and readiness evidence are consistent',
        blockers: []
      },
      {
        name: 'mysql-apply',
        ok: true,
        detail: 'Production seed SQL was applied to the target Yudao database',
        blockers: []
      },
      {
        name: 'runtime-seed-production-readiness',
        ok: runtimeEvidence.ok === true,
        detail: runtimeEvidence.ok === true
          ? 'Target Yudao database reports YUDAO_XICHENG_PRODUCTION_SEED_READY'
          : 'Target Yudao database is not production seed ready',
        blockers
      },
      {
        name: 'secret-redaction',
        ok: true,
        detail: 'Apply evidence excludes database password and provider secrets',
        blockers: []
      }
    ],
    blockers
  }
  assertNoSecrets(report, env, 'production seed apply evidence')
  return report
}

export async function applyXichengYudaoProductionSeed({
  rootDir = process.cwd(),
  env = process.env,
  seedSqlPath,
  seedEvidencePath,
  runtimeEvidenceFile,
  applyEvidenceFile,
  confirmed = false,
  mysqlOptions = {},
  spawnImpl = spawnSync,
  checkedAt = new Date().toISOString()
} = {}) {
  if (confirmed !== true) {
    throw new Error('explicit --confirm-apply-xicheng-production-seed is required')
  }
  const resolvedRoot = path.resolve(rootDir)
  const validation = await validateProductionSeedEvidenceForApply({
    rootDir: resolvedRoot,
    seedSqlPath,
    seedEvidencePath
  })
  const invocation = resolveMysqlInvocation(env, mysqlOptions)
  runMysql(invocation, validation.seedSql, env, spawnImpl)

  const runtimeSql = buildRuntimeSeedSql(env)
  const runtimeOutput = runMysql(invocation, runtimeSql, env, spawnImpl)
  const runtimeEvidence = buildRuntimeSeedEvidence({
    env,
    metrics: parseMetricRows(runtimeOutput),
    client: invocation.client,
    mode: 'production',
    checkedAt
  })
  const resolvedRuntimeEvidenceFile = await writeEvidenceFile(resolvedRoot, runtimeEvidenceFile, runtimeEvidence)
  const resolvedApplyEvidenceFile = resolveEvidenceFile(resolvedRoot, applyEvidenceFile)
  const report = buildApplyReport({
    validation,
    env,
    client: invocation.client,
    runtimeEvidence,
    runtimeEvidenceFile: resolvedRuntimeEvidenceFile,
    applyEvidenceFile: resolvedApplyEvidenceFile,
    checkedAt
  })
  if (applyEvidenceFile) {
    await writeEvidenceFile(resolvedRoot, applyEvidenceFile, report)
  }
  return report
}

async function runCli() {
  const args = process.argv.slice(2)
  const rootDir = path.resolve(readArgValue(args, '--root') || process.cwd())
  const envFile = readArgValue(args, '--env-file') || process.env.XUNJING_ENV_FILE
  const fileEnv = envFile ? await loadEnvFile(envFile) : {}
  const env = { ...process.env, ...fileEnv }
  const report = await applyXichengYudaoProductionSeed({
    rootDir,
    env,
    seedSqlPath: readArgValue(args, '--seed-sql') || process.env.XICHENG_POI_PRODUCTION_SEED_SQL,
    seedEvidencePath: readArgValue(args, '--seed-evidence') || process.env.XICHENG_POI_SEED_EVIDENCE,
    runtimeEvidenceFile: readArgValue(args, '--runtime-evidence-file') ||
      readArgValue(args, '--runtime-seed-evidence') ||
      process.env.XICHENG_RUNTIME_SEED_EVIDENCE,
    applyEvidenceFile: readArgValue(args, '--apply-evidence-file') ||
      readArgValue(args, '--evidence-file') ||
      process.env.XICHENG_PRODUCTION_SEED_APPLY_EVIDENCE,
    confirmed: readFlag(args, '--confirm-apply-xicheng-production-seed')
  })
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) {
    process.exit(1)
  }
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
