import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'

const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])
const requiredKeys = [
  'QWEN_BASE_URL',
  'DASHSCOPE_API_KEY',
  'QWEN_EMBEDDING_MODEL',
  'DASHSCOPE_EMBEDDING_ENABLED'
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

function isNonLocalHttpsUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !isLoopbackHost(url.hostname)
  } catch {
    return false
  }
}

export function validateEmbeddingEnv(env) {
  for (const key of requiredKeys) {
    if (isPlaceholderValue(env[key])) {
      throw new Error(`${key} must be configured with a real value`)
    }
  }
  if (!isNonLocalHttpsUrl(env.QWEN_BASE_URL)) {
    throw new Error('QWEN_BASE_URL must be a non-local HTTPS URL')
  }
  if (String(env.DASHSCOPE_EMBEDDING_ENABLED || '').trim().toLowerCase() !== 'true') {
    throw new Error('DASHSCOPE_EMBEDDING_ENABLED must be true for embedding smoke')
  }
}

export function resolveEmbeddingsUrl(baseUrl) {
  const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '')
  if (!trimmed) {
    throw new Error('QWEN_BASE_URL is required for embedding smoke')
  }
  return trimmed.endsWith('/embeddings') ? trimmed : `${trimmed}/embeddings`
}

export function buildEmbeddingSmokeRequest({ env, input = 'xicheng embedding smoke' }) {
  validateEmbeddingEnv(env)
  const url = resolveEmbeddingsUrl(env.QWEN_BASE_URL)
  return {
    url,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.DASHSCOPE_API_KEY}`
      },
      body: JSON.stringify({
        model: env.QWEN_EMBEDDING_MODEL,
        input: [input]
      })
    }
  }
}

function embeddingFromResponse(data) {
  const direct = data?.data?.[0]?.embedding
  if (Array.isArray(direct)) {
    return direct
  }
  const dashscope = data?.output?.embeddings?.[0]?.embedding
  return Array.isArray(dashscope) ? dashscope : []
}

function redact(text, env) {
  let output = String(text || '')
  for (const key of ['DASHSCOPE_API_KEY', 'QWEN_API_KEY', 'MYSQL_PASSWORD']) {
    if (hasText(env[key])) {
      output = output.split(env[key]).join(`[REDACTED_${key}]`)
    }
  }
  return output
}

export async function checkEmbeddingProviderSmoke({
  env,
  input = 'xicheng embedding smoke',
  fetchImpl = globalThis.fetch,
  checkedAt = new Date().toISOString(),
  nowMs = () => Date.now()
}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is required for embedding smoke')
  }
  const { url, options } = buildEmbeddingSmokeRequest({ env, input })
  const endpoint = new URL(url)
  const startedAt = nowMs()
  let response
  try {
    response = await fetchImpl(url, options)
  } catch (error) {
    throw new Error(redact(`Embedding smoke request failed: ${error.message}`, env))
  }
  const rawBody = await response.text()
  let parsedBody
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    parsedBody = undefined
  }
  if (!response.ok) {
    throw new Error(redact(`Embedding smoke returned HTTP ${response.status}`, env))
  }
  const embedding = embeddingFromResponse(parsedBody)
  const finiteValueCount = embedding.filter((value) => Number.isFinite(Number(value))).length
  if (embedding.length === 0 || finiteValueCount !== embedding.length) {
    throw new Error('Embedding provider smoke did not return a non-empty numeric vector')
  }

  return {
    checkedAt,
    providerSmokeHost: endpoint.host,
    providerSmokeEndpointPath: endpoint.pathname,
    model: env.QWEN_EMBEDDING_MODEL,
    httpStatus: response.status,
    vectorDimensions: embedding.length,
    finiteValueCount,
    latencyMs: Math.max(0, nowMs() - startedAt)
  }
}

export function buildEmbeddingSmokeEvidence({
  env,
  providerSmoke,
  checkedAt = new Date().toISOString()
}) {
  if (
    !providerSmoke ||
    Number(providerSmoke.httpStatus || 0) !== 200 ||
    Number(providerSmoke.vectorDimensions || 0) <= 0 ||
    Number(providerSmoke.finiteValueCount || 0) !== Number(providerSmoke.vectorDimensions || 0)
  ) {
    throw new Error('Embedding provider smoke must return a non-empty numeric vector')
  }
  const evidence = {
    artifactType: 'xicheng-embedding-smoke',
    ok: true,
    status: 'XICHENG_EMBEDDING_SMOKE_READY',
    checkedAt,
    summary: {
      providerSmokeCheckedAt: providerSmoke.checkedAt,
      providerSmokeHost: providerSmoke.providerSmokeHost,
      providerSmokeEndpointPath: providerSmoke.providerSmokeEndpointPath,
      model: providerSmoke.model,
      providerSmokeHttpStatus: providerSmoke.httpStatus,
      vectorDimensions: providerSmoke.vectorDimensions,
      finiteValueCount: providerSmoke.finiteValueCount,
      providerSmokeLatencyMs: providerSmoke.latencyMs
    },
    checks: [
      {
        name: 'embedding-provider-request',
        ok: true,
        detail: 'Configured embedding provider received an OpenAI-compatible embeddings request',
        blockers: []
      },
      {
        name: 'embedding-provider-smoke',
        ok: true,
        detail: 'Configured embedding provider returned a non-empty numeric vector',
        summary: {
          host: providerSmoke.providerSmokeHost,
          endpointPath: providerSmoke.providerSmokeEndpointPath,
          model: providerSmoke.model,
          httpStatus: providerSmoke.httpStatus,
          vectorDimensions: providerSmoke.vectorDimensions
        },
        blockers: []
      },
      {
        name: 'secret-redaction',
        ok: true,
        detail: 'Evidence excludes DashScope API key and embedding vector values',
        blockers: []
      }
    ],
    blockers: []
  }
  const serialized = JSON.stringify(evidence)
  if (hasText(env.DASHSCOPE_API_KEY) && serialized.includes(env.DASHSCOPE_API_KEY)) {
    throw new Error('embedding evidence must not contain DASHSCOPE_API_KEY')
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
  const providerSmoke = await checkEmbeddingProviderSmoke({
    env,
    input: readArgValue(args, '--input') || 'xicheng embedding smoke'
  })
  const evidence = buildEmbeddingSmokeEvidence({ env, providerSmoke })
  const evidenceFile = readArgValue(args, '--evidence-file') || readArgValue(args, '--output')
  await writeEvidence({ rootDir, evidenceFile, evidence })
  console.log(JSON.stringify({
    ok: true,
    status: evidence.status,
    providerSmokeHost: evidence.summary.providerSmokeHost,
    providerSmokeEndpointPath: evidence.summary.providerSmokeEndpointPath,
    model: evidence.summary.model,
    providerSmokeHttpStatus: evidence.summary.providerSmokeHttpStatus,
    vectorDimensions: evidence.summary.vectorDimensions,
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
