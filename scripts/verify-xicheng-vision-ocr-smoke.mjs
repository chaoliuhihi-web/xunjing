import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'

const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])
const requiredKeys = ['XUNJING_VISION_API_URL', 'XUNJING_VISION_API_KEY', 'XUNJING_VISION_MODEL']
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
  return ['127.0.0.1', 'localhost', '::1', '0.0.0.0'].includes(String(host || '').trim().toLowerCase())
}

function isPlaceholderProviderValue(value) {
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

export function validateVisionOcrEnv(env) {
  for (const key of requiredKeys) {
    if (isPlaceholderProviderValue(env[key])) {
      throw new Error(`${key} must be configured with a real value`)
    }
  }
  if (!isNonLocalHttpsUrl(env.XUNJING_VISION_API_URL)) {
    throw new Error('XUNJING_VISION_API_URL must be a non-local HTTPS URL')
  }
}

export function resolveChatCompletionsUrl(baseUrl) {
  const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '')
  if (!trimmed) {
    throw new Error('XUNJING_VISION_API_URL is required for vision OCR smoke')
  }
  return trimmed.endsWith('/chat/completions') ? trimmed : `${trimmed}/chat/completions`
}

function validateSmokeImageUrl(imageUrl) {
  if (!isNonLocalHttpsUrl(imageUrl)) {
    throw new Error('vision OCR smoke image must be a non-local HTTPS URL')
  }
}

export function buildVisionOcrSmokeRequest({ env, imageUrl }) {
  validateVisionOcrEnv(env)
  validateSmokeImageUrl(imageUrl)
  const url = resolveChatCompletionsUrl(env.XUNJING_VISION_API_URL)
  return {
    url,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.XUNJING_VISION_API_KEY}`
      },
      body: JSON.stringify({
        model: env.XUNJING_VISION_MODEL,
        temperature: 0,
        max_tokens: 128,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '你是西城文旅视觉/OCR连通性检查器。只输出 JSON，不要解释。'
                  + '格式为 {"labels":["xunjing_vision_smoke"],"caption":"一句中文描述"}。'
                  + '如果能读取图片，请保留 labels 中的 xunjing_vision_smoke。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ]
      })
    }
  }
}

function providerContentFromResponse(data) {
  return data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    data?.output?.text ||
    data?.output?.choices?.[0]?.message?.content ||
    ''
}

function unwrapJson(content) {
  const trimmed = String(content || '').trim()
  if (!trimmed) {
    return ''
  }
  let unwrapped = trimmed
  if (unwrapped.startsWith('```')) {
    unwrapped = unwrapped.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '')
  }
  const start = unwrapped.indexOf('{')
  const end = unwrapped.lastIndexOf('}')
  return start >= 0 && end > start ? unwrapped.slice(start, end + 1) : unwrapped
}

function parseVisionSmokeContent(content) {
  const fallback = {
    labels: [],
    captionLength: 0
  }
  if (!hasText(content)) {
    return fallback
  }
  try {
    const parsed = JSON.parse(unwrapJson(content))
    return {
      labels: Array.isArray(parsed.labels)
        ? parsed.labels.map((item) => String(item || '').trim()).filter(Boolean)
        : [],
      captionLength: String(parsed.caption || '').length
    }
  } catch {
    return {
      labels: String(content).includes('xunjing_vision_smoke') ? ['xunjing_vision_smoke'] : [],
      captionLength: String(content).length
    }
  }
}

export async function checkVisionOcrProviderSmoke({
  env,
  imageUrl,
  fetchImpl = globalThis.fetch,
  checkedAt = new Date().toISOString(),
  nowMs = () => Date.now()
}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is required for vision OCR smoke')
  }
  const { url, options } = buildVisionOcrSmokeRequest({ env, imageUrl })
  const endpoint = new URL(url)
  const startedAt = nowMs()
  let response
  try {
    response = await fetchImpl(url, options)
  } catch (error) {
    throw new Error(redact(`Vision OCR smoke request failed: ${error.message}`, env))
  }
  const rawBody = await response.text()
  let parsedBody
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    parsedBody = undefined
  }
  if (!response.ok) {
    throw new Error(redact(`Vision OCR smoke returned HTTP ${response.status}`, env))
  }
  const assistantContent = providerContentFromResponse(parsedBody)
  if (!hasText(assistantContent)) {
    throw new Error('Vision OCR smoke response did not contain assistant content')
  }
  const parsedContent = parseVisionSmokeContent(assistantContent)
  return {
    checkedAt,
    baseUrlHost: endpoint.host,
    endpointPath: endpoint.pathname,
    model: env.XUNJING_VISION_MODEL,
    httpStatus: response.status,
    sampleImageRef: imageUrl,
    responseTextLength: String(assistantContent).length,
    labels: parsedContent.labels,
    captionLength: parsedContent.captionLength,
    latencyMs: Math.max(0, nowMs() - startedAt)
  }
}

function redact(text, env) {
  let output = String(text || '')
  for (const key of ['XUNJING_VISION_API_KEY', 'QWEN_API_KEY', 'DASHSCOPE_API_KEY']) {
    if (hasText(env[key])) {
      output = output.split(env[key]).join(`[REDACTED_${key}]`)
    }
  }
  return output
}

export function buildVisionOcrSmokeEvidence({
  env,
  providerSmoke,
  checkedAt = new Date().toISOString()
}) {
  if (!providerSmoke || providerSmoke.httpStatus !== 200 || !providerSmoke.responseTextLength) {
    throw new Error('Vision OCR provider smoke evidence is required before building evidence')
  }
  if (!Array.isArray(providerSmoke.labels) || !providerSmoke.labels.includes('xunjing_vision_smoke')) {
    throw new Error('Vision OCR provider smoke must include xunjing_vision_smoke label')
  }
  const evidence = {
    artifactType: 'xicheng-vision-ocr-smoke',
    ok: true,
    status: 'XICHENG_VISION_OCR_SMOKE_READY',
    checkedAt,
    summary: {
      model: env.XUNJING_VISION_MODEL,
      providerSmokeCheckedAt: providerSmoke.checkedAt,
      providerSmokeHost: providerSmoke.baseUrlHost,
      providerSmokeEndpointPath: providerSmoke.endpointPath,
      providerSmokeHttpStatus: providerSmoke.httpStatus,
      sampleImageRef: providerSmoke.sampleImageRef,
      responseTextLength: providerSmoke.responseTextLength,
      labels: providerSmoke.labels,
      captionLength: providerSmoke.captionLength,
      providerSmokeLatencyMs: providerSmoke.latencyMs
    },
    checks: [
      {
        name: 'vision-provider-request',
        ok: true,
        detail: 'Configured vision provider received an OpenAI-compatible multimodal request',
        blockers: []
      },
      {
        name: 'vision-provider-smoke',
        ok: true,
        detail: 'Configured vision provider returned a multimodal completion response',
        summary: {
          checkedAt: providerSmoke.checkedAt,
          host: providerSmoke.baseUrlHost,
          endpointPath: providerSmoke.endpointPath,
          model: providerSmoke.model,
          httpStatus: providerSmoke.httpStatus,
          sampleImageRef: providerSmoke.sampleImageRef,
          responseTextLength: providerSmoke.responseTextLength,
          labels: providerSmoke.labels,
          captionLength: providerSmoke.captionLength,
          latencyMs: providerSmoke.latencyMs
        },
        blockers: []
      },
      {
        name: 'secret-redaction',
        ok: true,
        detail: 'Evidence excludes vision API keys and other provider secrets',
        blockers: []
      }
    ],
    blockers: []
  }
  const serialized = JSON.stringify(evidence)
  for (const key of ['XUNJING_VISION_API_KEY', 'QWEN_API_KEY', 'DASHSCOPE_API_KEY']) {
    if (hasText(env[key]) && serialized.includes(env[key])) {
      throw new Error(`vision OCR evidence must not contain ${key}`)
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
  const imageUrl = readArgValue(args, '--image-url') ||
    process.env.XUNJING_VISION_SMOKE_IMAGE_URL
  if (!hasText(imageUrl)) {
    throw new Error('--image-url or XUNJING_VISION_SMOKE_IMAGE_URL is required for vision OCR smoke')
  }
  const providerSmoke = await checkVisionOcrProviderSmoke({ env, imageUrl })
  const evidence = buildVisionOcrSmokeEvidence({ env, providerSmoke })
  const evidenceFile = readArgValue(args, '--evidence-file') || readArgValue(args, '--output')
  await writeEvidence({ rootDir, evidenceFile, evidence })
  console.log(JSON.stringify({
    ok: true,
    status: evidence.status,
    model: evidence.summary.model,
    providerSmokeHost: evidence.summary.providerSmokeHost,
    providerSmokeEndpointPath: evidence.summary.providerSmokeEndpointPath,
    providerSmokeHttpStatus: evidence.summary.providerSmokeHttpStatus,
    sampleImageRef: evidence.summary.sampleImageRef,
    responseTextLength: evidence.summary.responseTextLength,
    labels: evidence.summary.labels,
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
