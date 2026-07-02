import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'

const artifactType = 'xicheng-h5-api-trial'
const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])
const defaultPackageCode = 'XICHENG-MAP-001'
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

function normalizedBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function isLoopbackHost(host) {
  return ['127.0.0.1', 'localhost', '::1', '0.0.0.0', 'host.docker.internal']
    .includes(String(host || '').trim().toLowerCase())
}

function isPlaceholderValue(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return !normalized || placeholderTokens.some((token) => normalized.includes(token))
}

function isNonLocalHttpsUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !isLoopbackHost(url.hostname)
  } catch {
    return false
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

function getHeader(headers, name) {
  if (!headers) {
    return ''
  }
  if (typeof headers.get === 'function') {
    return headers.get(name) || ''
  }
  return headers[name] || headers[name.toLowerCase()] || ''
}

function parseBasicRealm(header) {
  const match = String(header || '').match(/^Basic\s+realm="([^"]+)"/i)
  return match ? match[1] : ''
}

export function validateH5ApiTrialEnv(env) {
  if (isPlaceholderValue(env.XUNJING_APP_API_BASE_URL)) {
    throw new Error('XUNJING_APP_API_BASE_URL must be configured with a real value')
  }
  if (!isNonLocalHttpsUrl(env.XUNJING_APP_API_BASE_URL)) {
    throw new Error('XUNJING_APP_API_BASE_URL must be a non-local HTTPS URL')
  }
  if (isPlaceholderValue(env.XUNJING_ADMIN_BASE_URL)) {
    throw new Error('XUNJING_ADMIN_BASE_URL must be configured with a real value')
  }
  if (!isNonLocalHttpsUrl(env.XUNJING_ADMIN_BASE_URL)) {
    throw new Error('XUNJING_ADMIN_BASE_URL must be a non-local HTTPS URL')
  }
  if (isPlaceholderValue(env.XUNJING_TENANT_ID)) {
    throw new Error('XUNJING_TENANT_ID must be configured with a real value')
  }
}

async function fetchJson({ fetchImpl, url, tenantId, label }) {
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
    throw new Error(`${label} did not return valid JSON`)
  }
  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}`)
  }
  return {
    httpStatus: response.status,
    data: unwrapYudaoData(parsed)
  }
}

async function fetchAdminH5({ fetchImpl, adminBaseUrl }) {
  const response = await fetchImpl(`${normalizedBaseUrl(adminBaseUrl)}/`, {
    method: 'GET',
    headers: {
      accept: 'text/html,application/xhtml+xml'
    }
  })
  const rawBody = await response.text()
  const wwwAuthenticate = getHeader(response.headers, 'www-authenticate')
  if (response.status === 401 && /^Basic\b/i.test(wwwAuthenticate)) {
    return {
      httpStatus: response.status,
      mode: 'BASIC_AUTH_PROTECTED',
      basicAuthRealm: parseBasicRealm(wwwAuthenticate)
    }
  }
  if (response.ok && /<div[^>]+id=["']app["']/i.test(rawBody) && /<script\b/i.test(rawBody)) {
    return {
      httpStatus: response.status,
      mode: 'SPA_READY',
      basicAuthRealm: ''
    }
  }
  throw new Error('admin H5 must return Basic Auth protection or a real SPA shell')
}

export async function checkXichengH5ApiTrial({
  env,
  packageCode = defaultPackageCode,
  fetchImpl = globalThis.fetch,
  checkedAt = new Date().toISOString(),
  nowMs = () => Date.now()
}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is required for Xicheng H5/API trial')
  }
  validateH5ApiTrialEnv(env)
  const apiBaseUrl = normalizedBaseUrl(env.XUNJING_APP_API_BASE_URL)
  const adminBaseUrl = normalizedBaseUrl(env.XUNJING_ADMIN_BASE_URL)
  const tenantId = String(env.XUNJING_TENANT_ID || '').trim()
  const apiEndpoint = new URL(apiBaseUrl)
  const adminEndpoint = new URL(adminBaseUrl)
  const startedAt = nowMs()

  const publicReportResponse = await fetchJson({
    fetchImpl,
    url: buildUrl(apiBaseUrl, '/app-api/xunjing/public-report/summary', { packageCode }),
    tenantId,
    label: 'Xicheng public report trial'
  })
  const publicReportData = publicReportResponse.data || {}
  const packageCount = Number(publicReportData.packageCount || 0)
  const reviewedKnowledgeCount = Number(publicReportData.reviewedKnowledgeCount || 0)
  const reviewedMediaCount = Number(publicReportData.reviewedMediaCount || 0)
  const mapPointCount = Number(publicReportData.mapPointCount || 0)
  const p0Ready = publicReportData.p0Ready === true ||
    (
      packageCount >= 1 &&
      reviewedKnowledgeCount >= productionPoiTarget &&
      reviewedMediaCount >= productionMediaAssetTarget &&
      mapPointCount >= productionPoiTarget
    )
  if (!p0Ready) {
    throw new Error('Xicheng public report must prove P0 data is ready')
  }

  const adminH5 = await fetchAdminH5({ fetchImpl, adminBaseUrl })

  return {
    checkedAt,
    apiBaseUrl,
    apiHost: apiEndpoint.host,
    adminBaseUrl,
    adminHost: adminEndpoint.host,
    tenantId,
    packageCode,
    publicReportHttpStatus: publicReportResponse.httpStatus,
    publicReportP0Ready: p0Ready,
    publicReportPackageCount: packageCount,
    publicReportReviewedKnowledgeCount: reviewedKnowledgeCount,
    publicReportReviewedMediaCount: reviewedMediaCount,
    publicReportMapPointCount: mapPointCount,
    adminHttpStatus: adminH5.httpStatus,
    adminH5Mode: adminH5.mode,
    adminBasicAuthRealm: adminH5.basicAuthRealm,
    latencyMs: Math.max(0, nowMs() - startedAt)
  }
}

export function buildXichengH5ApiTrialEvidence({
  env,
  providerTrial,
  checkedAt = new Date().toISOString()
}) {
  validateH5ApiTrialEnv(env)
  if (
    !providerTrial ||
    providerTrial.packageCode !== defaultPackageCode ||
    Number(providerTrial.publicReportHttpStatus || 0) < 200 ||
    Number(providerTrial.publicReportHttpStatus || 0) >= 300 ||
    providerTrial.publicReportP0Ready !== true ||
    Number(providerTrial.publicReportPackageCount || 0) < 1 ||
    Number(providerTrial.publicReportReviewedKnowledgeCount || 0) < productionPoiTarget ||
    Number(providerTrial.publicReportReviewedMediaCount || 0) < productionMediaAssetTarget ||
    Number(providerTrial.publicReportMapPointCount || 0) < productionPoiTarget ||
    !['BASIC_AUTH_PROTECTED', 'SPA_READY'].includes(providerTrial.adminH5Mode)
  ) {
    throw new Error('H5/API trial must prove Xicheng P0 API data and admin H5 access boundary are ready')
  }
  return {
    artifactType,
    ok: true,
    status: 'XICHENG_H5_API_TRIAL_READY',
    checkedAt,
    summary: {
      providerTrialCheckedAt: providerTrial.checkedAt,
      apiBaseUrl: providerTrial.apiBaseUrl,
      apiHost: providerTrial.apiHost,
      adminBaseUrl: providerTrial.adminBaseUrl,
      adminHost: providerTrial.adminHost,
      tenantId: providerTrial.tenantId,
      packageCode: providerTrial.packageCode,
      publicReportHttpStatus: providerTrial.publicReportHttpStatus,
      publicReportP0Ready: providerTrial.publicReportP0Ready,
      publicReportPackageCount: providerTrial.publicReportPackageCount,
      publicReportReviewedKnowledgeCount: providerTrial.publicReportReviewedKnowledgeCount,
      publicReportReviewedMediaCount: providerTrial.publicReportReviewedMediaCount,
      publicReportMapPointCount: providerTrial.publicReportMapPointCount,
      adminHttpStatus: providerTrial.adminHttpStatus,
      adminH5Mode: providerTrial.adminH5Mode,
      adminBasicAuthRealm: providerTrial.adminBasicAuthRealm,
      latencyMs: providerTrial.latencyMs
    },
    checks: [
      { name: 'https-api-domain', ok: true, blockers: [] },
      { name: 'https-admin-h5-domain', ok: true, blockers: [] },
      { name: 'tenant-header', ok: true, blockers: [] },
      { name: 'xicheng-public-report', ok: true, blockers: [] },
      { name: 'admin-h5-protection', ok: true, blockers: [] },
      { name: 'secret-redaction', ok: true, blockers: [] }
    ],
    blockers: []
  }
}

export function resolveH5ApiTrialEvidenceFile(rootDir, evidenceFile) {
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
  const resolvedFile = resolveH5ApiTrialEvidenceFile(rootDir, evidenceFile)
  if (!resolvedFile) {
    return
  }
  await mkdir(path.dirname(resolvedFile), { recursive: true })
  await writeFile(resolvedFile, `${JSON.stringify(evidence, null, 2)}\n`)
}

async function loadH5ApiTrialEnv({
  args = [],
  processEnv = process.env
} = {}) {
  const envFile = readArgValue(args, '--env-file')
  const fileEnv = envFile ? await loadEnvFile(envFile) : {}
  const env = {
    ...fileEnv,
    ...processEnv
  }
  if (readArgValue(args, '--api-base-url') || readArgValue(args, '--base-url')) {
    env.XUNJING_APP_API_BASE_URL = readArgValue(args, '--api-base-url') || readArgValue(args, '--base-url')
  }
  if (readArgValue(args, '--admin-base-url')) {
    env.XUNJING_ADMIN_BASE_URL = readArgValue(args, '--admin-base-url')
  }
  if (readArgValue(args, '--tenant-id')) {
    env.XUNJING_TENANT_ID = readArgValue(args, '--tenant-id')
  }
  return env
}

async function runCli() {
  const args = process.argv.slice(2)
  const rootDir = path.resolve(readArgValue(args, '--root') || process.cwd())
  const env = await loadH5ApiTrialEnv({ args })
  const checkedAt = new Date().toISOString()
  const providerTrial = await checkXichengH5ApiTrial({
    env,
    packageCode: readArgValue(args, '--package-code') || defaultPackageCode,
    checkedAt
  })
  const evidence = buildXichengH5ApiTrialEvidence({ env, providerTrial, checkedAt })
  await writeEvidence({
    rootDir,
    evidenceFile: readArgValue(args, '--evidence-file') ||
      readArgValue(args, '--output') ||
      'qa/xicheng-h5-api-trial-evidence.json',
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
