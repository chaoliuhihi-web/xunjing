import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'

const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])
const requiredKeys = [
  'QDRANT_URL',
  'QDRANT_API_KEY',
  'QDRANT_TEXT_COLLECTION',
  'QDRANT_IMAGE_COLLECTION'
]
const placeholderTokens = [
  'replace-with',
  'placeholder',
  'your-',
  'example.com',
  'local-or-staging'
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

function hasFlag(args, name) {
  return args.includes(name)
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

function qdrantUrl(value) {
  const trimmed = String(value || '').trim().replace(/\/+$/, '')
  if (!trimmed) {
    throw new Error('QDRANT_URL is required')
  }
  return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
}

function collectionUrl(baseUrl, collectionName) {
  const url = qdrantUrl(baseUrl)
  const basePath = url.pathname.replace(/\/+$/, '')
  url.pathname = `${basePath}/collections/${encodeURIComponent(collectionName)}`
  return url
}

export function validateQdrantEnv(env, { allowLocal = false } = {}) {
  for (const key of requiredKeys) {
    if (isPlaceholderValue(env[key])) {
      throw new Error(`${key} must be configured with a real value`)
    }
  }
  const endpoint = qdrantUrl(env.QDRANT_URL)
  const isLocal = isLoopbackHost(endpoint.hostname)
  if (!allowLocal && (endpoint.protocol !== 'https:' || isLocal)) {
    throw new Error('QDRANT_URL must be a non-local HTTPS URL')
  }
  if (allowLocal && !['http:', 'https:'].includes(endpoint.protocol)) {
    throw new Error('QDRANT_URL must be an HTTP or HTTPS URL')
  }
}

function redact(text, env) {
  let output = String(text || '')
  for (const key of ['QDRANT_API_KEY', 'MYSQL_PASSWORD', 'QWEN_API_KEY', 'DASHSCOPE_API_KEY']) {
    if (hasText(env[key])) {
      output = output.split(env[key]).join(`[REDACTED_${key}]`)
    }
  }
  return output
}

async function fetchCollection({ env, fetchImpl, collectionName, label }) {
  const url = collectionUrl(env.QDRANT_URL, collectionName)
  const response = await fetchImpl(url.toString(), {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'api-key': env.QDRANT_API_KEY
    }
  })
  if (!response.ok) {
    throw new Error(redact(`${label} returned HTTP ${response.status}`, env))
  }
  const body = await response.json()
  return {
    httpStatus: response.status,
    status: body?.result?.status,
    pointsCount: Number(body?.result?.points_count ?? body?.result?.vectors_count ?? 0)
  }
}

export async function checkQdrantProviderSmoke({
  env,
  fetchImpl = globalThis.fetch,
  checkedAt = new Date().toISOString(),
  nowMs = () => Date.now(),
  allowLocal = false
}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is required for Qdrant smoke')
  }
  validateQdrantEnv(env, { allowLocal })
  const endpoint = qdrantUrl(env.QDRANT_URL)
  const textCollection = String(env.QDRANT_TEXT_COLLECTION || '').trim()
  const imageCollection = String(env.QDRANT_IMAGE_COLLECTION || '').trim()
  const startedAt = nowMs()
  const textSmoke = await fetchCollection({
    env,
    fetchImpl,
    collectionName: textCollection,
    label: 'Qdrant text collection smoke'
  })
  const imageSmoke = await fetchCollection({
    env,
    fetchImpl,
    collectionName: imageCollection,
    label: 'Qdrant image collection smoke'
  })

  return {
    checkedAt,
    providerSmokeHost: endpoint.host,
    providerSmokeEndpointPath: '/collections',
    textCollection,
    imageCollection,
    textCollectionHttpStatus: textSmoke.httpStatus,
    imageCollectionHttpStatus: imageSmoke.httpStatus,
    textCollectionStatus: textSmoke.status,
    imageCollectionStatus: imageSmoke.status,
    textCollectionPointsCount: textSmoke.pointsCount,
    imageCollectionPointsCount: imageSmoke.pointsCount,
    latencyMs: Math.max(0, nowMs() - startedAt)
  }
}

export function buildQdrantSmokeEvidence({
  env,
  providerSmoke,
  checkedAt = new Date().toISOString()
}) {
  if (
    !providerSmoke ||
    Number(providerSmoke.textCollectionHttpStatus || 0) < 200 ||
    Number(providerSmoke.textCollectionHttpStatus || 0) >= 300 ||
    Number(providerSmoke.imageCollectionHttpStatus || 0) < 200 ||
    Number(providerSmoke.imageCollectionHttpStatus || 0) >= 300
  ) {
    throw new Error('Qdrant collection smoke evidence is required before building evidence')
  }
  const evidence = {
    artifactType: 'xicheng-qdrant-smoke',
    ok: true,
    status: 'XICHENG_QDRANT_SMOKE_READY',
    checkedAt,
    summary: {
      providerSmokeCheckedAt: providerSmoke.checkedAt,
      providerSmokeHost: providerSmoke.providerSmokeHost,
      providerSmokeEndpointPath: providerSmoke.providerSmokeEndpointPath,
      textCollection: providerSmoke.textCollection,
      imageCollection: providerSmoke.imageCollection,
      textCollectionHttpStatus: providerSmoke.textCollectionHttpStatus,
      imageCollectionHttpStatus: providerSmoke.imageCollectionHttpStatus,
      textCollectionStatus: providerSmoke.textCollectionStatus,
      imageCollectionStatus: providerSmoke.imageCollectionStatus,
      textCollectionPointsCount: providerSmoke.textCollectionPointsCount,
      imageCollectionPointsCount: providerSmoke.imageCollectionPointsCount,
      providerSmokeLatencyMs: providerSmoke.latencyMs
    },
    checks: [
      {
        name: 'qdrant-request',
        ok: true,
        detail: 'Configured Qdrant received authenticated collection requests',
        blockers: []
      },
      {
        name: 'qdrant-text-collection',
        ok: true,
        detail: 'Configured Qdrant text collection is reachable',
        summary: {
          collection: providerSmoke.textCollection,
          httpStatus: providerSmoke.textCollectionHttpStatus,
          status: providerSmoke.textCollectionStatus,
          pointsCount: providerSmoke.textCollectionPointsCount
        },
        blockers: []
      },
      {
        name: 'qdrant-image-collection',
        ok: true,
        detail: 'Configured Qdrant image collection is reachable',
        summary: {
          collection: providerSmoke.imageCollection,
          httpStatus: providerSmoke.imageCollectionHttpStatus,
          status: providerSmoke.imageCollectionStatus,
          pointsCount: providerSmoke.imageCollectionPointsCount
        },
        blockers: []
      },
      {
        name: 'secret-redaction',
        ok: true,
        detail: 'Evidence excludes Qdrant API key and provider secrets',
        blockers: []
      }
    ],
    blockers: []
  }
  const serialized = JSON.stringify(evidence)
  if (hasText(env.QDRANT_API_KEY) && serialized.includes(env.QDRANT_API_KEY)) {
    throw new Error('Qdrant evidence must not contain QDRANT_API_KEY')
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
  const providerSmoke = await checkQdrantProviderSmoke({
    env,
    allowLocal: hasFlag(args, '--allow-local')
  })
  const evidence = buildQdrantSmokeEvidence({ env, providerSmoke })
  const evidenceFile = readArgValue(args, '--evidence-file') || readArgValue(args, '--output')
  await writeEvidence({ rootDir, evidenceFile, evidence })
  console.log(JSON.stringify({
    ok: true,
    status: evidence.status,
    providerSmokeHost: evidence.summary.providerSmokeHost,
    providerSmokeEndpointPath: evidence.summary.providerSmokeEndpointPath,
    textCollection: evidence.summary.textCollection,
    imageCollection: evidence.summary.imageCollection,
    textCollectionHttpStatus: evidence.summary.textCollectionHttpStatus,
    imageCollectionHttpStatus: evidence.summary.imageCollectionHttpStatus,
    textCollectionStatus: evidence.summary.textCollectionStatus,
    imageCollectionStatus: evidence.summary.imageCollectionStatus,
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
