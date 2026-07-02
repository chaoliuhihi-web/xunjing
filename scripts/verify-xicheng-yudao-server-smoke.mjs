import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'

const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])
const defaultPackageCode = 'XICHENG-MAP-001'
const expectedRegionCode = 'beijing-xicheng'
const productionPoiTarget = 80
const productionMediaAssetTarget = 8
const placeholderTokens = [
  'replace-with',
  'placeholder',
  'your-',
  'example.com',
  'your-production-domain'
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

function hasText(value) {
  return String(value || '').trim().length > 0
}

function isLoopbackHost(host) {
  return ['127.0.0.1', 'localhost', '::1', '0.0.0.0', 'host.docker.internal']
    .includes(String(host || '').trim().toLowerCase())
}

function isPlaceholderValue(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return !normalized || placeholderTokens.some((token) => normalized.includes(token))
}

function normalizedBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function isNonLocalHttpsUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !isLoopbackHost(url.hostname)
  } catch {
    return false
  }
}

export function validateYudaoServerSmokeEnv(env) {
  if (isPlaceholderValue(env.XUNJING_APP_API_BASE_URL)) {
    throw new Error('XUNJING_APP_API_BASE_URL must be configured with a real value')
  }
  if (!isNonLocalHttpsUrl(env.XUNJING_APP_API_BASE_URL)) {
    throw new Error('XUNJING_APP_API_BASE_URL must be a non-local HTTPS URL')
  }
  if (isPlaceholderValue(env.XUNJING_TENANT_ID)) {
    throw new Error('XUNJING_TENANT_ID must be configured with a real value')
  }
}

function buildUrl(baseUrl, pathname, params = {}) {
  const url = new URL(pathname, `${normalizedBaseUrl(baseUrl)}/`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}

function unwrapYudaoData(body) {
  return body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'data')
    ? body.data
    : body
}

function redact(text, env) {
  let output = String(text || '')
  for (const key of ['INTERNAL_AUTH_TOKEN', 'MYSQL_PASSWORD', 'QWEN_API_KEY', 'DASHSCOPE_API_KEY', 'OSS_SECRET_KEY']) {
    if (hasText(env[key])) {
      output = output.split(env[key]).join(`[REDACTED_${key}]`)
    }
  }
  return output
}

async function loadEvidenceFile(rootDir, evidenceFile, label) {
  if (!evidenceFile) {
    return undefined
  }
  const resolvedFile = resolveEvidenceFile(rootDir, evidenceFile)
  try {
    return {
      path: resolvedFile,
      data: JSON.parse(await readFile(resolvedFile, 'utf8'))
    }
  } catch (error) {
    throw new Error(`${label} evidence cannot be read: ${error.message}`)
  }
}

function summarizeBuildEvidence(buildEvidenceRef) {
  if (!buildEvidenceRef) {
    return {}
  }
  const evidence = buildEvidenceRef.data || {}
  const summary = evidence.summary || {}
  const blockers = []
  if (evidence.artifactType !== 'xicheng-yudao-server-build') {
    blockers.push('Yudao server build evidence artifactType must be xicheng-yudao-server-build')
  }
  if (evidence.ok !== true) {
    blockers.push('Yudao server build evidence ok must be true')
  }
  if (evidence.status !== 'YUDAO_SERVER_JAR_BUILT') {
    blockers.push('Yudao server build evidence status must be YUDAO_SERVER_JAR_BUILT')
  }
  if (!/^[a-f0-9]{40}$/i.test(String(summary.gitCommit || ''))) {
    blockers.push('Yudao server build evidence gitCommit must be a 40-character git commit SHA')
  }
  if (summary.gitDirty !== false) {
    blockers.push('Yudao server build evidence gitDirty must be false')
  }
  if (!/^[a-f0-9]{64}$/i.test(String(summary.jarSha256 || ''))) {
    blockers.push('Yudao server build evidence jarSha256 must be a sha256 hex digest')
  }
  if (!Number.isFinite(Number(summary.jarSizeBytes)) || Number(summary.jarSizeBytes) <= 0) {
    blockers.push('Yudao server build evidence jarSizeBytes must be positive')
  }
  if (blockers.length > 0) {
    throw new Error(blockers.join('; '))
  }
  return {
    buildEvidenceFile: buildEvidenceRef.path,
    buildStatus: evidence.status,
    buildGitAvailable: summary.gitAvailable,
    buildGitBranch: summary.gitBranch,
    buildGitCommit: summary.gitCommit,
    buildGitDirty: summary.gitDirty,
    buildGitDirtyFileCount: summary.gitDirtyFileCount,
    buildJarFile: summary.jarFile,
    buildJarSha256: summary.jarSha256,
    buildJarSizeBytes: summary.jarSizeBytes
  }
}

export async function loadYudaoServerSmokeEnv({
  args = [],
  processEnv = process.env
} = {}) {
  const envFile = readArgValue(args, '--env-file')
  const fileEnv = envFile ? await loadEnvFile(envFile) : {}
  const env = {
    ...fileEnv,
    ...processEnv
  }
  if (readArgValue(args, '--base-url')) {
    env.XUNJING_APP_API_BASE_URL = readArgValue(args, '--base-url')
  }
  if (readArgValue(args, '--tenant-id')) {
    env.XUNJING_TENANT_ID = readArgValue(args, '--tenant-id')
  }
  return env
}

async function fetchJson({ env, fetchImpl, url, tenantId, label }) {
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'tenant-id': tenantId
    }
  })
  const rawBody = await response.text()
  let parsed
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    throw new Error(redact(`${label} did not return valid JSON`, env))
  }
  if (!response.ok) {
    throw new Error(redact(`${label} returned HTTP ${response.status}`, env))
  }
  return {
    httpStatus: response.status,
    data: unwrapYudaoData(parsed)
  }
}

export async function checkYudaoServerHttpSmoke({
  env,
  packageCode = defaultPackageCode,
  fetchImpl = globalThis.fetch,
  checkedAt = new Date().toISOString(),
  nowMs = () => Date.now()
}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is required for Yudao server smoke')
  }
  validateYudaoServerSmokeEnv(env)
  const baseUrl = normalizedBaseUrl(env.XUNJING_APP_API_BASE_URL)
  const tenantId = String(env.XUNJING_TENANT_ID || '').trim()
  const endpoint = new URL(baseUrl)
  const startedAt = nowMs()
  const packageResponse = await fetchJson({
    env,
    fetchImpl,
    url: buildUrl(baseUrl, '/app-api/xunjing/resource/package', { packageCode }),
    tenantId,
    label: 'Yudao resource package smoke'
  })
  const packageData = packageResponse.data || {}
  if (packageData.packageCode !== packageCode) {
    throw new Error(`Yudao resource package smoke must return packageCode=${packageCode}`)
  }
  if (packageData.regionCode !== expectedRegionCode) {
    throw new Error(`Yudao resource package smoke must return regionCode=${expectedRegionCode}`)
  }
  const mediaAssetCount = Array.isArray(packageData.mediaAssets)
    ? packageData.mediaAssets.length
    : Number(packageData.mediaAssetCount || packageData.mediaCount || 0)
  if (!Number.isFinite(mediaAssetCount) || mediaAssetCount < productionMediaAssetTarget) {
    throw new Error(`Yudao resource package smoke must return at least ${productionMediaAssetTarget} public media assets`)
  }

  const publicReportResponse = await fetchJson({
    env,
    fetchImpl,
    url: buildUrl(baseUrl, '/app-api/xunjing/public-report/summary', { packageCode }),
    tenantId,
    label: 'Yudao public report smoke'
  })
  const publicReportData = publicReportResponse.data || {}
  const packageCount = Number(publicReportData.packageCount || 0)
  const reviewedKnowledgeCount = Number(publicReportData.reviewedKnowledgeCount || 0)
  const reviewedMediaCount = Number(publicReportData.reviewedMediaCount || 0)
  const mapPointCount = Number(publicReportData.mapPointCount || 0)
  if (
    packageCount < 1 ||
    reviewedKnowledgeCount < productionPoiTarget ||
    reviewedMediaCount < productionMediaAssetTarget ||
    mapPointCount < productionPoiTarget
  ) {
    throw new Error('Yudao public report smoke must prove the Xicheng package, reviewed knowledge, reviewed media and map points are available')
  }

  return {
    checkedAt,
    baseUrl,
    providerSmokeHost: endpoint.host,
    tenantId,
    packageCode,
    packageHttpStatus: packageResponse.httpStatus,
    packageStatus: hasText(packageData.status) ? packageData.status : 'PUBLISHED',
    packageRegionCode: packageData.regionCode,
    mediaAssetCount,
    publicReportHttpStatus: publicReportResponse.httpStatus,
    publicReportPackageCount: packageCount,
    publicReportReviewedKnowledgeCount: reviewedKnowledgeCount,
    publicReportReviewedMediaCount: reviewedMediaCount,
    publicReportMapPointCount: mapPointCount,
    latencyMs: Math.max(0, nowMs() - startedAt)
  }
}

export function buildYudaoServerSmokeEvidence({
  env,
  providerSmoke,
  buildEvidenceRef,
  checkedAt = new Date().toISOString()
}) {
  validateYudaoServerSmokeEnv(env)
  if (
    !providerSmoke ||
    Number(providerSmoke.packageHttpStatus || 0) < 200 ||
    Number(providerSmoke.packageHttpStatus || 0) >= 300 ||
    Number(providerSmoke.publicReportHttpStatus || 0) < 200 ||
    Number(providerSmoke.publicReportHttpStatus || 0) >= 300 ||
    providerSmoke.packageCode !== defaultPackageCode ||
    providerSmoke.packageRegionCode !== expectedRegionCode ||
    Number(providerSmoke.mediaAssetCount || 0) < productionMediaAssetTarget ||
    Number(providerSmoke.publicReportPackageCount || 0) < 1 ||
    Number(providerSmoke.publicReportReviewedKnowledgeCount || 0) < productionPoiTarget ||
    Number(providerSmoke.publicReportReviewedMediaCount || 0) < productionMediaAssetTarget ||
    Number(providerSmoke.publicReportMapPointCount || 0) < productionPoiTarget
  ) {
    throw new Error('Yudao server smoke must prove the Xicheng package and public report endpoints are ready')
  }
  const buildSummary = summarizeBuildEvidence(buildEvidenceRef)
  return {
    artifactType: 'xicheng-yudao-server-smoke',
    ok: true,
    status: 'XICHENG_YUDAO_SERVER_SMOKE_READY',
    checkedAt,
    summary: {
      providerSmokeCheckedAt: providerSmoke.checkedAt,
      baseUrl: providerSmoke.baseUrl,
      providerSmokeHost: providerSmoke.providerSmokeHost,
      tenantId: providerSmoke.tenantId,
      packageCode: providerSmoke.packageCode,
      packageHttpStatus: providerSmoke.packageHttpStatus,
      packageStatus: providerSmoke.packageStatus,
      packageRegionCode: providerSmoke.packageRegionCode,
      mediaAssetCount: providerSmoke.mediaAssetCount,
      publicReportHttpStatus: providerSmoke.publicReportHttpStatus,
      publicReportPackageCount: providerSmoke.publicReportPackageCount,
      publicReportReviewedKnowledgeCount: providerSmoke.publicReportReviewedKnowledgeCount,
      publicReportReviewedMediaCount: providerSmoke.publicReportReviewedMediaCount,
      publicReportMapPointCount: providerSmoke.publicReportMapPointCount,
      latencyMs: providerSmoke.latencyMs,
      ...buildSummary
    },
    checks: [
      { name: 'https-backend-domain', ok: true, blockers: [] },
      { name: 'tenant-header', ok: true, blockers: [] },
      { name: 'resource-package-endpoint', ok: true, blockers: [] },
      { name: 'public-report-endpoint', ok: true, blockers: [] },
      { name: 'media-assets', ok: true, blockers: [] },
      ...(buildEvidenceRef ? [{ name: 'yudao-server-build-evidence', ok: true, blockers: [] }] : []),
      { name: 'secret-redaction', ok: true, blockers: [] }
    ],
    blockers: []
  }
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

async function runCli() {
  const args = process.argv.slice(2)
  const rootDir = path.resolve(readArgValue(args, '--root') || process.cwd())
  const env = await loadYudaoServerSmokeEnv({ args })
  const checkedAt = new Date().toISOString()
  const buildEvidenceRef = await loadEvidenceFile(
    rootDir,
    readArgValue(args, '--yudao-server-build-evidence') || readArgValue(args, '--build-evidence'),
    'Yudao server build'
  )
  const providerSmoke = await checkYudaoServerHttpSmoke({
    env,
    packageCode: readArgValue(args, '--package-code') || defaultPackageCode,
    checkedAt
  })
  const evidence = buildYudaoServerSmokeEvidence({ env, providerSmoke, buildEvidenceRef, checkedAt })
  await writeEvidence({
    rootDir,
    evidenceFile: readArgValue(args, '--evidence-file') || readArgValue(args, '--output'),
    evidence
  })
  console.log(JSON.stringify(evidence, null, 2))
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
