import { mkdir, writeFile } from 'node:fs/promises'
import { createHash, createHmac } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'

const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])
const requiredKeys = ['OSS_ENDPOINT', 'OSS_BUCKET', 'OSS_PREFIX', 'OSS_ACCESS_KEY', 'OSS_SECRET_KEY']
const placeholderTokens = [
  'replace-with',
  'placeholder',
  'your-',
  'example.com',
  'local-or-staging'
]
const emptyPayloadHash = sha256('')

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

function hasFlag(args, name) {
  return args.includes(name)
}

function hasText(value) {
  return String(value || '').trim().length > 0
}

function isLoopbackHost(host) {
  return ['127.0.0.1', 'localhost', '::1', '0.0.0.0'].includes(String(host || '').trim().toLowerCase())
}

function isPlaceholderValue(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return !normalized || placeholderTokens.some((token) => normalized.includes(token))
}

function endpointUrl(endpoint) {
  const trimmed = String(endpoint || '').trim().replace(/\/+$/, '')
  if (!trimmed) {
    throw new Error('OSS_ENDPOINT is required')
  }
  return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
}

function isNonLocalHttpsUrl(value) {
  try {
    const url = endpointUrl(value)
    return url.protocol === 'https:' && !isLoopbackHost(url.hostname)
  } catch {
    return false
  }
}

export function validateObjectStorageEnv(env, { allowLocal = false } = {}) {
  for (const key of requiredKeys) {
    if (isPlaceholderValue(env[key])) {
      throw new Error(`${key} must be configured with a real value`)
    }
  }
  const endpoint = endpointUrl(env.OSS_ENDPOINT)
  const isLocal = isLoopbackHost(endpoint.hostname)
  if (!allowLocal && (endpoint.protocol !== 'https:' || isLocal)) {
    throw new Error('OSS_ENDPOINT must be a non-local HTTPS URL')
  }
  if (allowLocal && !['http:', 'https:'].includes(endpoint.protocol)) {
    throw new Error('OSS_ENDPOINT must be an HTTP or HTTPS URL')
  }
  if (!allowLocal && String(env.OSS_PREFIX || '').includes('/local/')) {
    throw new Error('OSS_PREFIX must not point at a local prefix for production smoke')
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function hmac(key, value, output) {
  return createHmac('sha256', key).update(value).digest(output)
}

export function resolveObjectStorageRegion(endpoint, explicitRegion) {
  if (hasText(explicitRegion)) {
    return String(explicitRegion).trim()
  }
  let host = String(endpoint || '').trim()
  try {
    host = endpointUrl(endpoint).hostname
  } catch {
    // Keep the raw host fallback.
  }
  if (host.startsWith('oss-') && host.includes('.aliyuncs.com')) {
    return host.slice(4, host.indexOf('.aliyuncs.com'))
  }
  if (host.startsWith('cos.') && host.includes('.myqcloud.com')) {
    return host.slice(4, host.indexOf('.myqcloud.com'))
  }
  if (host.startsWith('s3.') && host.includes('.amazonaws.com')) {
    const region = host.slice(3, host.indexOf('.amazonaws.com'))
    return region && region !== 'accelerate' ? region : 'us-east-1'
  }
  return 'us-east-1'
}

function normalizePrefix(prefix) {
  const trimmed = String(prefix || '').trim().replace(/^\/+/, '')
  return trimmed && !trimmed.endsWith('/') ? `${trimmed}/` : trimmed
}

function normalizeObjectKey(key) {
  return String(key || '').trim().replace(/^\/+/, '')
}

function encodePathSegments(value) {
  return String(value || '')
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function resolvePathStyle(env, endpoint) {
  if (hasText(env.OSS_PATH_STYLE)) {
    return String(env.OSS_PATH_STYLE).trim().toLowerCase() !== 'false'
  }
  return true
}

function buildObjectUrl({ env, objectKey }) {
  const endpoint = endpointUrl(env.OSS_ENDPOINT)
  const pathStyle = resolvePathStyle(env, endpoint)
  const bucket = String(env.OSS_BUCKET || '').trim()
  const encodedKey = encodePathSegments(objectKey)
  if (pathStyle) {
    const basePath = endpoint.pathname.replace(/\/+$/, '')
    endpoint.pathname = `${basePath}/${encodeURIComponent(bucket)}/${encodedKey}`
    return { url: endpoint, pathStyle }
  }
  endpoint.hostname = `${bucket}.${endpoint.hostname}`
  const basePath = endpoint.pathname.replace(/\/+$/, '')
  endpoint.pathname = `${basePath}/${encodedKey}`
  return { url: endpoint, pathStyle }
}

function toAmzDate(date = new Date()) {
  if (typeof date === 'string' && /^\d{8}T\d{6}Z$/.test(date)) {
    return date
  }
  return new Date(date).toISOString().replace(/[:-]|\.\d{3}/g, '')
}

function signingKey(secretKey, dateStamp, region) {
  const dateKey = hmac(`AWS4${secretKey}`, dateStamp)
  const regionKey = hmac(dateKey, region)
  const serviceKey = hmac(regionKey, 's3')
  return hmac(serviceKey, 'aws4_request')
}

export function buildS3SignedRequest({
  env,
  method,
  objectKey,
  body = '',
  amzDate = toAmzDate()
}) {
  const normalizedMethod = String(method || '').trim().toUpperCase()
  const payload = body || ''
  const payloadHash = normalizedMethod === 'PUT' ? sha256(payload) : emptyPayloadHash
  const region = resolveObjectStorageRegion(env.OSS_ENDPOINT, env.OSS_REGION)
  const { url, pathStyle } = buildObjectUrl({ env, objectKey })
  const dateStamp = amzDate.slice(0, 8)
  const headers = {
    host: url.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate
  }
  if (normalizedMethod === 'PUT') {
    headers['content-type'] = 'text/plain; charset=utf-8'
  }
  const signedHeaderNames = Object.keys(headers).sort()
  const canonicalHeaders = signedHeaderNames
    .map((name) => `${name}:${String(headers[name]).trim()}\n`)
    .join('')
  const canonicalRequest = [
    normalizedMethod,
    url.pathname,
    url.searchParams.toString(),
    canonicalHeaders,
    signedHeaderNames.join(';'),
    payloadHash
  ].join('\n')
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256(canonicalRequest)
  ].join('\n')
  const signature = hmac(signingKey(env.OSS_SECRET_KEY, dateStamp, region), stringToSign, 'hex')
  const authorization = `AWS4-HMAC-SHA256 Credential=${env.OSS_ACCESS_KEY}/${credentialScope}, `
    + `SignedHeaders=${signedHeaderNames.join(';')}, Signature=${signature}`
  const requestHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, value])
  )
  requestHeaders.Authorization = authorization
  return {
    url: url.toString(),
    options: {
      method: normalizedMethod,
      headers: requestHeaders,
      body: normalizedMethod === 'PUT' ? payload : undefined
    },
    summary: {
      endpointHost: endpointUrl(env.OSS_ENDPOINT).host,
      requestHost: url.host,
      bucket: String(env.OSS_BUCKET || '').trim(),
      prefix: normalizePrefix(env.OSS_PREFIX),
      objectKey,
      objectKeySha256: sha256(objectKey),
      region,
      pathStyle,
      contentSha256: payloadHash
    }
  }
}

function okDeleteStatus(status) {
  return [200, 202, 204].includes(Number(status))
}

async function assertHttpOk(response, label, env) {
  if (!response.ok) {
    throw new Error(redact(`${label} returned HTTP ${response.status}`, env))
  }
}

export async function checkObjectStorageProviderSmoke({
  env,
  objectKey,
  body = 'xicheng object storage smoke',
  fetchImpl = globalThis.fetch,
  checkedAt = new Date().toISOString(),
  amzDate = toAmzDate(checkedAt),
  nowMs = () => Date.now(),
  allowLocal = false
}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is required for object storage smoke')
  }
  validateObjectStorageEnv(env, { allowLocal })
  const normalizedKey = normalizeObjectKey(objectKey || `${normalizePrefix(env.OSS_PREFIX)}release-smoke/xicheng-object-storage-smoke-${Date.now()}.txt`)
  const startedAt = nowMs()

  const putRequest = buildS3SignedRequest({ env, method: 'PUT', objectKey: normalizedKey, body, amzDate })
  const putResponse = await fetchImpl(putRequest.url, putRequest.options)
  await assertHttpOk(putResponse, 'Object storage PUT smoke', env)

  const getRequest = buildS3SignedRequest({ env, method: 'GET', objectKey: normalizedKey, amzDate })
  const getResponse = await fetchImpl(getRequest.url, getRequest.options)
  await assertHttpOk(getResponse, 'Object storage GET smoke', env)
  const readBack = await getResponse.text()
  if (readBack !== body) {
    throw new Error('Object storage smoke read-back content did not match uploaded body')
  }

  const deleteRequest = buildS3SignedRequest({ env, method: 'DELETE', objectKey: normalizedKey, amzDate })
  const deleteResponse = await fetchImpl(deleteRequest.url, deleteRequest.options)
  if (!deleteResponse.ok && !okDeleteStatus(deleteResponse.status)) {
    throw new Error(redact(`Object storage DELETE smoke returned HTTP ${deleteResponse.status}`, env))
  }

  return {
    checkedAt,
    ...putRequest.summary,
    putHttpStatus: putResponse.status,
    getHttpStatus: getResponse.status,
    deleteHttpStatus: deleteResponse.status,
    readBackMatches: true,
    deleted: true,
    latencyMs: Math.max(0, nowMs() - startedAt)
  }
}

function redact(text, env) {
  let output = String(text || '')
  for (const key of ['OSS_ACCESS_KEY', 'OSS_SECRET_KEY', 'MYSQL_PASSWORD', 'QWEN_API_KEY', 'DASHSCOPE_API_KEY']) {
    if (hasText(env[key])) {
      output = output.split(env[key]).join(`[REDACTED_${key}]`)
    }
  }
  return output
}

export function buildObjectStorageSmokeEvidence({
  env,
  providerSmoke,
  checkedAt = new Date().toISOString()
}) {
  if (
    !providerSmoke ||
    !providerSmoke.putHttpStatus ||
    !providerSmoke.getHttpStatus ||
    !providerSmoke.deleteHttpStatus ||
    providerSmoke.readBackMatches !== true ||
    providerSmoke.deleted !== true
  ) {
    throw new Error('Object storage write read delete smoke evidence is required before building evidence')
  }
  const evidence = {
    artifactType: 'xicheng-object-storage-smoke',
    ok: true,
    status: 'XICHENG_OBJECT_STORAGE_SMOKE_READY',
    checkedAt,
    summary: {
      providerSmokeCheckedAt: providerSmoke.checkedAt,
      endpointHost: providerSmoke.endpointHost,
      requestHost: providerSmoke.requestHost,
      bucket: providerSmoke.bucket,
      prefix: providerSmoke.prefix,
      objectKeySha256: providerSmoke.objectKeySha256,
      region: providerSmoke.region,
      pathStyle: providerSmoke.pathStyle,
      putHttpStatus: providerSmoke.putHttpStatus,
      getHttpStatus: providerSmoke.getHttpStatus,
      deleteHttpStatus: providerSmoke.deleteHttpStatus,
      readBackMatches: providerSmoke.readBackMatches,
      deleted: providerSmoke.deleted,
      contentSha256: providerSmoke.contentSha256,
      providerSmokeLatencyMs: providerSmoke.latencyMs
    },
    checks: [
      {
        name: 'object-storage-request',
        ok: true,
        detail: 'Configured object storage received signed S3-compatible requests',
        blockers: []
      },
      {
        name: 'object-storage-write',
        ok: true,
        detail: 'Configured object storage accepted a smoke object upload',
        summary: {
          httpStatus: providerSmoke.putHttpStatus,
          bucket: providerSmoke.bucket,
          prefix: providerSmoke.prefix
        },
        blockers: []
      },
      {
        name: 'object-storage-read',
        ok: true,
        detail: 'Configured object storage returned the uploaded smoke object content',
        summary: {
          httpStatus: providerSmoke.getHttpStatus,
          readBackMatches: providerSmoke.readBackMatches
        },
        blockers: []
      },
      {
        name: 'object-storage-delete',
        ok: true,
        detail: 'Configured object storage deleted the smoke object',
        summary: {
          httpStatus: providerSmoke.deleteHttpStatus,
          deleted: providerSmoke.deleted
        },
        blockers: []
      },
      {
        name: 'secret-redaction',
        ok: true,
        detail: 'Evidence excludes object storage access keys and secrets',
        blockers: []
      }
    ],
    blockers: []
  }
  const serialized = JSON.stringify(evidence)
  for (const key of ['OSS_ACCESS_KEY', 'OSS_SECRET_KEY']) {
    if (hasText(env[key]) && serialized.includes(env[key])) {
      throw new Error(`object storage evidence must not contain ${key}`)
    }
  }
  return evidence
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
  const envFile = readArgValue(args, '--env-file') || process.env.XUNJING_ENV_FILE
  const fileEnv = envFile ? await loadEnvFile(envFile) : {}
  const env = { ...process.env, ...fileEnv }
  const allowLocal = hasFlag(args, '--allow-local')
  const objectKey = readArgValue(args, '--object-key') || process.env.XUNJING_STORAGE_SMOKE_OBJECT_KEY
  const body = readArgValue(args, '--body') || 'xicheng object storage smoke'
  const providerSmoke = await checkObjectStorageProviderSmoke({
    env,
    objectKey,
    body,
    allowLocal
  })
  const evidence = buildObjectStorageSmokeEvidence({ env, providerSmoke })
  const evidenceFile = readArgValue(args, '--evidence-file') || readArgValue(args, '--output')
  await writeEvidence({ rootDir, evidenceFile, evidence })
  console.log(JSON.stringify({
    ok: true,
    status: evidence.status,
    endpointHost: evidence.summary.endpointHost,
    requestHost: evidence.summary.requestHost,
    bucket: evidence.summary.bucket,
    prefix: evidence.summary.prefix,
    objectKeySha256: evidence.summary.objectKeySha256,
    putHttpStatus: evidence.summary.putHttpStatus,
    getHttpStatus: evidence.summary.getHttpStatus,
    deleteHttpStatus: evidence.summary.deleteHttpStatus,
    readBackMatches: evidence.summary.readBackMatches,
    deleted: evidence.summary.deleted,
    evidenceFile: evidenceFile || undefined
  }, null, 2))
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
