import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'

const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])
const expectedTenantIdDefault = '1'
const expectedPackageCode = 'XICHENG-MAP-001'
const expectedRegionCode = 'beijing-xicheng'
const localCandidatePoiFloor = 80
const localCandidateKnowledgeDocFloor = 84
const localCandidateMapPointFloor = 80

const requiredEnvKeys = [
  'XUNJING_TENANT_ID',
  'MYSQL_HOST',
  'MYSQL_PORT',
  'MYSQL_DATABASE',
  'MYSQL_USERNAME',
  'MYSQL_PASSWORD'
]

const numericMetricKeys = new Set([
  'packageCount',
  'poiTotal',
  'poiApprovedPublished',
  'poiGeoReviewRequired',
  'poiLicenseReviewRequired',
  'knowledgeDocuments',
  'mapPoints',
  'qrCodes',
  'publicReportLocalCandidate',
  'publicReportProductionReady'
])

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

function isLoopbackHost(host) {
  return ['127.0.0.1', 'localhost', '::1', '0.0.0.0'].includes(String(host || '').trim())
}

function commandAvailable(command) {
  const result = spawnSync(command, ['--version'], {
    encoding: 'utf8',
    stdio: 'ignore'
  })
  return result.status === 0
}

function dockerMysqlHost(env) {
  if (env.MYSQL_DOCKER_HOST) {
    return env.MYSQL_DOCKER_HOST
  }
  return isLoopbackHost(env.MYSQL_HOST) ? 'host.docker.internal' : env.MYSQL_HOST
}

function mysqlArgs(env) {
  return [
    '--protocol=tcp',
    '--default-character-set=utf8mb4',
    `--host=${env.MYSQL_HOST}`,
    `--port=${env.MYSQL_PORT}`,
    `--user=${env.MYSQL_USERNAME}`,
    env.MYSQL_DATABASE,
    '--batch',
    '--raw',
    '--skip-column-names'
  ]
}

export function validateRuntimeSeedEnv(env) {
  for (const key of requiredEnvKeys) {
    if (!hasText(env[key])) {
      throw new Error(`${key} is required for Xicheng Yudao runtime seed verification`)
    }
  }
}

export function buildRuntimeSeedSql(env) {
  validateRuntimeSeedEnv(env)
  const tenantId = sqlNumber(env.XUNJING_TENANT_ID, expectedTenantIdDefault)

  return `
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET @tenant_id := ${tenantId};

SELECT 'packageCount', COUNT(*)
FROM xunjing_resource_package
WHERE package_code = '${expectedPackageCode}'
  AND status = 'PUBLISHED'
  AND tenant_id = @tenant_id
  AND deleted = b'0'
UNION ALL
SELECT 'poiTotal', COUNT(*)
FROM xunjing_poi
WHERE region_code = '${expectedRegionCode}'
  AND tenant_id = @tenant_id
  AND deleted = b'0'
UNION ALL
SELECT 'poiApprovedPublished', COUNT(*)
FROM xunjing_poi
WHERE region_code = '${expectedRegionCode}'
  AND review_status = 'APPROVED'
  AND status = 'PUBLISHED'
  AND tenant_id = @tenant_id
  AND deleted = b'0'
UNION ALL
SELECT 'poiGeoReviewRequired', COUNT(*)
FROM xunjing_poi
WHERE region_code = '${expectedRegionCode}'
  AND geo_status = 'REVIEW_REQUIRED'
  AND tenant_id = @tenant_id
  AND deleted = b'0'
UNION ALL
SELECT 'poiLicenseReviewRequired', COUNT(*)
FROM xunjing_poi
WHERE region_code = '${expectedRegionCode}'
  AND license_status = 'REVIEW_REQUIRED'
  AND tenant_id = @tenant_id
  AND deleted = b'0'
UNION ALL
SELECT 'knowledgeDocuments', COUNT(*)
FROM xunjing_knowledge_document kd
JOIN xunjing_resource_package rp ON kd.package_id = rp.id
WHERE rp.package_code = '${expectedPackageCode}'
  AND kd.review_status = 'APPROVED'
  AND kd.vector_status = 'INDEXED'
  AND kd.tenant_id = @tenant_id
  AND kd.deleted = b'0'
  AND rp.tenant_id = @tenant_id
  AND rp.deleted = b'0'
UNION ALL
SELECT 'mapPoints', COUNT(*)
FROM xunjing_map_point mp
JOIN xunjing_resource_package rp ON mp.package_id = rp.id
WHERE rp.package_code = '${expectedPackageCode}'
  AND mp.status = 'PUBLISHED'
  AND mp.tenant_id = @tenant_id
  AND mp.deleted = b'0'
  AND rp.tenant_id = @tenant_id
  AND rp.deleted = b'0'
UNION ALL
SELECT 'qrCodes', COUNT(*)
FROM xunjing_qrcode qc
JOIN xunjing_resource_package rp ON qc.package_id = rp.id
WHERE rp.package_code = '${expectedPackageCode}'
  AND qc.scene_code = 'QR-XICHENG-MAP-001'
  AND qc.status = 'ACTIVE'
  AND qc.tenant_id = @tenant_id
  AND qc.deleted = b'0'
  AND rp.tenant_id = @tenant_id
  AND rp.deleted = b'0'
UNION ALL
SELECT 'publicReportLocalCandidate', COUNT(*)
FROM xunjing_public_report
WHERE metrics_json LIKE '%"packageCode":"${expectedPackageCode}"%'
  AND metrics_json LIKE '%"p0LocalCandidate":true%'
  AND tenant_id = @tenant_id
  AND deleted = b'0'
UNION ALL
SELECT 'publicReportProductionReady', COUNT(*)
FROM xunjing_public_report
WHERE metrics_json LIKE '%"packageCode":"${expectedPackageCode}"%'
  AND metrics_json LIKE '%"productionReady":true%'
  AND tenant_id = @tenant_id
  AND deleted = b'0'
UNION ALL
SELECT 'samplePoiCodes', COALESCE(GROUP_CONCAT(poi_code ORDER BY id SEPARATOR ','), '')
FROM (
  SELECT id, poi_code
  FROM xunjing_poi
  WHERE region_code = '${expectedRegionCode}'
    AND tenant_id = @tenant_id
    AND deleted = b'0'
  ORDER BY id
  LIMIT 5
) seed_sample;
`.trimStart()
}

export function parseMetricRows(output) {
  const metrics = {}
  for (const line of String(output || '').split(/\r?\n/)) {
    if (!line.trim() || !line.includes('\t')) {
      continue
    }
    const [key, ...valueParts] = line.split('\t')
    const value = valueParts.join('\t')
    if (numericMetricKeys.has(key)) {
      metrics[key] = Number(value || 0)
    } else {
      metrics[key] = value
    }
  }
  return metrics
}

function check(name, ok, detail, blockers = []) {
  return { name, ok, detail, blockers }
}

function countMetric(metrics, key) {
  const value = Number(metrics[key] || 0)
  return Number.isFinite(value) ? value : 0
}

function buildRuntimeChecks(metrics) {
  const checks = []
  const packageCount = countMetric(metrics, 'packageCount')
  const poiTotal = countMetric(metrics, 'poiTotal')
  const poiApprovedPublished = countMetric(metrics, 'poiApprovedPublished')
  const knowledgeDocuments = countMetric(metrics, 'knowledgeDocuments')
  const mapPoints = countMetric(metrics, 'mapPoints')
  const qrCodes = countMetric(metrics, 'qrCodes')
  const publicReportLocalCandidate = countMetric(metrics, 'publicReportLocalCandidate')

  checks.push(check(
    'resource-package',
    packageCount >= 1,
    packageCount >= 1
      ? `${expectedPackageCode} published resource package exists in runtime database`
      : `${expectedPackageCode} published resource package is missing from runtime database`,
    packageCount >= 1 ? [] : [`runtime database must contain published package ${expectedPackageCode}`]
  ))
  checks.push(check(
    'poi-count',
    poiTotal >= localCandidatePoiFloor,
    poiTotal >= localCandidatePoiFloor
      ? `runtime database contains ${poiTotal} Xicheng POIs`
      : `runtime database contains only ${poiTotal}/${localCandidatePoiFloor} Xicheng POIs`,
    poiTotal >= localCandidatePoiFloor
      ? []
      : [`runtime database must contain at least ${localCandidatePoiFloor} Xicheng POIs`]
  ))
  checks.push(check(
    'poi-approval',
    poiApprovedPublished >= localCandidatePoiFloor,
    poiApprovedPublished >= localCandidatePoiFloor
      ? `runtime database contains ${poiApprovedPublished} approved published Xicheng POIs`
      : `runtime database contains only ${poiApprovedPublished}/${localCandidatePoiFloor} approved published Xicheng POIs`,
    poiApprovedPublished >= localCandidatePoiFloor
      ? []
      : [`runtime database must contain at least ${localCandidatePoiFloor} approved published Xicheng POIs`]
  ))
  checks.push(check(
    'knowledge-documents',
    knowledgeDocuments >= localCandidateKnowledgeDocFloor,
    knowledgeDocuments >= localCandidateKnowledgeDocFloor
      ? `runtime database contains ${knowledgeDocuments} approved indexed Xicheng knowledge documents`
      : `runtime database contains only ${knowledgeDocuments}/${localCandidateKnowledgeDocFloor} approved indexed Xicheng knowledge documents`,
    knowledgeDocuments >= localCandidateKnowledgeDocFloor
      ? []
      : [`runtime database must contain at least ${localCandidateKnowledgeDocFloor} approved indexed Xicheng knowledge documents`]
  ))
  checks.push(check(
    'map-points',
    mapPoints >= localCandidateMapPointFloor,
    mapPoints >= localCandidateMapPointFloor
      ? `runtime database contains ${mapPoints} published Xicheng map points`
      : `runtime database contains only ${mapPoints}/${localCandidateMapPointFloor} published Xicheng map points`,
    mapPoints >= localCandidateMapPointFloor
      ? []
      : [`runtime database must contain at least ${localCandidateMapPointFloor} published Xicheng map points`]
  ))
  checks.push(check(
    'qr-code',
    qrCodes >= 1,
    qrCodes >= 1
      ? 'runtime database contains active QR-XICHENG-MAP-001'
      : 'runtime database is missing active QR-XICHENG-MAP-001',
    qrCodes >= 1 ? [] : ['runtime database must contain active QR-XICHENG-MAP-001']
  ))
  checks.push(check(
    'local-candidate-report',
    publicReportLocalCandidate >= 1,
    publicReportLocalCandidate >= 1
      ? 'runtime public report records p0LocalCandidate=true'
      : 'runtime public report does not record p0LocalCandidate=true',
    publicReportLocalCandidate >= 1 ? [] : ['runtime public report must record p0LocalCandidate=true']
  ))
  checks.push(check(
    'secret-redaction',
    true,
    'Evidence excludes MySQL password and other runtime secret values',
    []
  ))

  return checks
}

function buildProductionBlockers(metrics) {
  const blockers = []
  const geoReviewRequired = countMetric(metrics, 'poiGeoReviewRequired')
  const licenseReviewRequired = countMetric(metrics, 'poiLicenseReviewRequired')
  const publicReportProductionReady = countMetric(metrics, 'publicReportProductionReady')

  if (geoReviewRequired > 0) {
    blockers.push(`${geoReviewRequired} Xicheng POIs still require coordinate review`)
  }
  if (licenseReviewRequired > 0) {
    blockers.push(`${licenseReviewRequired} Xicheng POIs still require source license review`)
  }
  if (publicReportProductionReady < 1) {
    blockers.push('runtime public report still records productionReady=false')
  }
  return blockers
}

function assertNoSecrets(evidence, env) {
  const serialized = JSON.stringify(evidence)
  for (const key of ['MYSQL_PASSWORD', 'OSS_SECRET_KEY', 'QWEN_API_KEY', 'DASHSCOPE_API_KEY']) {
    if (hasText(env[key]) && serialized.includes(env[key])) {
      throw new Error(`runtime seed evidence must not contain ${key}`)
    }
  }
}

export function buildRuntimeSeedEvidence({
  env,
  metrics,
  client,
  checkedAt = new Date().toISOString()
}) {
  validateRuntimeSeedEnv(env)
  const checks = buildRuntimeChecks(metrics)
  const blockers = checks.flatMap((item) => item.blockers || [])
  const productionBlockers = buildProductionBlockers(metrics)
  const ok = blockers.length === 0
  const evidence = {
    artifactType: 'xicheng-yudao-runtime-seed',
    ok,
    status: ok ? 'YUDAO_XICHENG_LOCAL_SEED_READY' : 'YUDAO_XICHENG_LOCAL_SEED_NOT_READY',
    checkedAt,
    summary: {
      tenantId: String(env.XUNJING_TENANT_ID),
      database: env.MYSQL_DATABASE,
      client,
      packageCode: expectedPackageCode,
      regionCode: expectedRegionCode,
      packageCount: countMetric(metrics, 'packageCount'),
      poiTotal: countMetric(metrics, 'poiTotal'),
      poiApprovedPublished: countMetric(metrics, 'poiApprovedPublished'),
      poiGeoReviewRequired: countMetric(metrics, 'poiGeoReviewRequired'),
      poiLicenseReviewRequired: countMetric(metrics, 'poiLicenseReviewRequired'),
      knowledgeDocuments: countMetric(metrics, 'knowledgeDocuments'),
      mapPoints: countMetric(metrics, 'mapPoints'),
      qrCodes: countMetric(metrics, 'qrCodes'),
      publicReportLocalCandidate: countMetric(metrics, 'publicReportLocalCandidate'),
      publicReportProductionReady: countMetric(metrics, 'publicReportProductionReady'),
      samplePoiCodes: String(metrics.samplePoiCodes || '').split(',').filter(Boolean),
      localCandidateReady: ok,
      productionReady: productionBlockers.length === 0,
      productionBlockers
    },
    checks,
    blockers
  }

  assertNoSecrets(evidence, env)
  return evidence
}

export function resolveMysqlInvocation(env, options = {}) {
  validateRuntimeSeedEnv(env)
  const requestedClient = env.MYSQL_CLIENT || options.mysqlClient || 'auto'
  if (!['auto', 'local', 'container', 'docker'].includes(requestedClient)) {
    throw new Error('MYSQL_CLIENT must be one of: auto, local, container, docker')
  }

  const hasLocalMysql = options.hasLocalMysql ?? commandAvailable('mysql')
  const hasDocker = options.hasDocker ?? commandAvailable('docker')

  if (requestedClient === 'local' && !hasLocalMysql) {
    throw new Error('mysql CLI is required because MYSQL_CLIENT=local')
  }
  if (requestedClient === 'local' || (requestedClient === 'auto' && hasLocalMysql)) {
    return {
      client: 'local',
      command: 'mysql',
      args: mysqlArgs(env),
      env: {
        MYSQL_PWD: env.MYSQL_PASSWORD
      }
    }
  }

  if (requestedClient === 'container' && !hasDocker) {
    throw new Error('Docker is required because MYSQL_CLIENT=container')
  }
  if (requestedClient === 'container' || (requestedClient === 'auto' && hasDocker && hasText(env.MYSQL_CONTAINER))) {
    const containerName = env.MYSQL_CONTAINER || 'xunjing-mysql'
    return {
      client: 'container',
      command: 'docker',
      args: [
        'exec',
        '-i',
        '-e',
        'MYSQL_PWD',
        containerName,
        'mysql',
        ...mysqlArgs({
          ...env,
          MYSQL_HOST: env.MYSQL_CONTAINER_HOST || '127.0.0.1',
          MYSQL_PORT: env.MYSQL_CONTAINER_PORT || '3306'
        })
      ],
      env: {
        MYSQL_PWD: env.MYSQL_PASSWORD
      }
    }
  }

  if (requestedClient === 'docker' && !hasDocker) {
    throw new Error('Docker is required because MYSQL_CLIENT=docker')
  }
  if (requestedClient === 'docker' || (requestedClient === 'auto' && hasDocker)) {
    return {
      client: 'docker',
      command: 'docker',
      args: [
        'run',
        '--rm',
        '-i',
        '--add-host=host.docker.internal:host-gateway',
        '--env',
        'MYSQL_PWD',
        env.MYSQL_DOCKER_IMAGE || 'mysql:8.4',
        'mysql',
        ...mysqlArgs({
          ...env,
          MYSQL_HOST: dockerMysqlHost(env)
        })
      ],
      env: {
        MYSQL_PWD: env.MYSQL_PASSWORD
      }
    }
  }

  throw new Error('mysql CLI or Docker is required for Xicheng Yudao runtime seed verification')
}

export function resolveEvidenceFile(rootDir, evidenceFile) {
  if (!evidenceFile) {
    return undefined
  }
  const resolvedRoot = path.resolve(rootDir)
  const resolvedFile = path.isAbsolute(evidenceFile)
    ? path.resolve(evidenceFile)
    : path.resolve(resolvedRoot, evidenceFile)
  const relativePath = path.relative(resolvedRoot, resolvedFile)
  const [topLevelDir] = relativePath.split(path.sep)
  if (
    !relativePath ||
    relativePath.startsWith('..') ||
    path.isAbsolute(relativePath) ||
    !allowedEvidenceDirs.has(topLevelDir)
  ) {
    throw new Error('evidence file must be under qa/, tmp/ or workbench/')
  }
  return resolvedFile
}

async function writeEvidence({ rootDir, evidenceFile, evidence }) {
  const resolvedFile = resolveEvidenceFile(rootDir, evidenceFile)
  if (!resolvedFile) {
    return
  }
  await mkdir(path.dirname(resolvedFile), { recursive: true })
  await writeFile(resolvedFile, `${JSON.stringify(evidence, null, 2)}\n`)
}

function redact(text, env) {
  let output = String(text || '')
  for (const key of ['MYSQL_PASSWORD', 'OSS_SECRET_KEY', 'QWEN_API_KEY', 'DASHSCOPE_API_KEY']) {
    if (hasText(env[key])) {
      output = output.split(env[key]).join(`[REDACTED_${key}]`)
    }
  }
  return output
}

async function runCli() {
  const args = process.argv.slice(2)
  const rootDir = path.resolve(readArgValue(args, '--root') || process.cwd())
  const envFile = readArgValue(args, '--env-file') || process.env.XUNJING_ENV_FILE
  const fileEnv = envFile ? await loadEnvFile(envFile) : {}
  const env = { ...process.env, ...fileEnv }
  const sql = buildRuntimeSeedSql(env)
  const invocation = resolveMysqlInvocation(env)
  const result = spawnSync(invocation.command, invocation.args, {
    input: sql,
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

  const metrics = parseMetricRows(result.stdout)
  const evidence = buildRuntimeSeedEvidence({
    env,
    metrics,
    client: invocation.client
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
    poiTotal: evidence.summary.poiTotal,
    knowledgeDocuments: evidence.summary.knowledgeDocuments,
    mapPoints: evidence.summary.mapPoints,
    localCandidateReady: evidence.summary.localCandidateReady,
    productionReady: evidence.summary.productionReady,
    productionBlockers: evidence.summary.productionBlockers,
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
    process.exit(1)
  })
}
