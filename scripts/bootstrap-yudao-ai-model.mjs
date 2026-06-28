import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'

const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])

const requiredKeys = [
  'XUNJING_TENANT_ID',
  'MYSQL_HOST',
  'MYSQL_PORT',
  'MYSQL_DATABASE',
  'MYSQL_USERNAME',
  'MYSQL_PASSWORD',
  'QWEN_API_KEY',
  'QWEN_BASE_URL',
  'QWEN_MODEL'
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

function sqlString(value) {
  return `'${String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
}

function sqlNumber(value, fallback) {
  const number = Number(value ?? fallback)
  if (!Number.isFinite(number)) {
    throw new Error(`Invalid numeric value: ${value}`)
  }
  return String(number)
}

export function validateBootstrapEnv(env) {
  for (const key of requiredKeys) {
    if (!env[key]) {
      throw new Error(`${key} is required for Yudao AI model bootstrap`)
    }
  }
}

export function buildMysqlArgs(env) {
  validateBootstrapEnv(env)
  return [
    '--protocol=tcp',
    '--default-character-set=utf8mb4',
    `--host=${env.MYSQL_HOST}`,
    `--port=${env.MYSQL_PORT}`,
    `--user=${env.MYSQL_USERNAME}`,
    env.MYSQL_DATABASE
  ]
}

function commandAvailable(command) {
  const result = spawnSync(command, ['--version'], {
    encoding: 'utf8',
    stdio: 'ignore'
  })
  return result.status === 0
}

function isLoopbackHost(host) {
  return ['127.0.0.1', 'localhost', '::1', '0.0.0.0'].includes(String(host || '').trim())
}

function dockerMysqlHost(env) {
  if (env.MYSQL_DOCKER_HOST) {
    return env.MYSQL_DOCKER_HOST
  }
  return isLoopbackHost(env.MYSQL_HOST) ? 'host.docker.internal' : env.MYSQL_HOST
}

export function resolveMysqlInvocation(env, options = {}) {
  validateBootstrapEnv(env)

  const requestedClient = env.MYSQL_CLIENT || options.mysqlClient || 'auto'
  if (!['auto', 'local', 'docker'].includes(requestedClient)) {
    throw new Error('MYSQL_CLIENT must be one of: auto, local, docker')
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
      args: buildMysqlArgs(env),
      env: {
        MYSQL_PWD: env.MYSQL_PASSWORD
      }
    }
  }

  if (requestedClient === 'docker' && !hasDocker) {
    throw new Error('Docker is required because MYSQL_CLIENT=docker')
  }

  if (requestedClient === 'docker' || (requestedClient === 'auto' && hasDocker)) {
    const dockerEnv = {
      ...env,
      MYSQL_HOST: dockerMysqlHost(env)
    }
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
        ...buildMysqlArgs(dockerEnv)
      ],
      env: {
        MYSQL_PWD: env.MYSQL_PASSWORD
      }
    }
  }

  throw new Error('mysql CLI is not installed and Docker is not available for Yudao AI model bootstrap')
}

export function buildYudaoAiBootstrapSql(env) {
  validateBootstrapEnv(env)
  const tenantId = sqlNumber(env.XUNJING_TENANT_ID, 1)
  const platform = env.YUDAO_AI_PLATFORM || 'TongYi'
  const apiKeyName = env.YUDAO_AI_API_KEY_NAME || '星河寻境通义千问'
  const chatModelName = env.YUDAO_AI_CHAT_MODEL_NAME || '星河寻境默认问答模型'
  const temperature = sqlNumber(env.YUDAO_AI_TEMPERATURE, 0.4)
  const maxTokens = sqlNumber(env.YUDAO_AI_MAX_TOKENS, 1200)
  const maxContexts = sqlNumber(env.YUDAO_AI_MAX_CONTEXTS, 8)

  return `
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

START TRANSACTION;

SET @tenant_id := ${tenantId};
SET @platform := ${sqlString(platform)};
SET @api_key_name := ${sqlString(apiKeyName)};
SET @api_key_value := ${sqlString(env.QWEN_API_KEY)};
SET @base_url := ${sqlString(env.QWEN_BASE_URL)};
SET @chat_model_name := ${sqlString(chatModelName)};
SET @chat_model := ${sqlString(env.QWEN_MODEL)};
SET @operator := 'xunjing-ai-bootstrap';
SET @api_key_id := NULL;
SET @model_id := NULL;

SELECT @api_key_id := id
FROM ai_api_key
WHERE name = @api_key_name
  AND platform = @platform
  AND tenant_id = @tenant_id
  AND deleted = b'0'
ORDER BY id
LIMIT 1;

UPDATE ai_api_key
SET api_key = @api_key_value,
    url = @base_url,
    status = 0,
    updater = @operator,
    update_time = NOW()
WHERE id = @api_key_id;

INSERT INTO ai_api_key (
  name, api_key, platform, url, status,
  creator, create_time, updater, update_time, deleted, tenant_id
)
SELECT
  @api_key_name, @api_key_value, @platform, @base_url, 0,
  @operator, NOW(), @operator, NOW(), b'0', @tenant_id
WHERE @api_key_id IS NULL;

SET @api_key_id := COALESCE(@api_key_id, LAST_INSERT_ID());

SELECT @model_id := id
FROM ai_model
WHERE platform = @platform
  AND model = @chat_model
  AND type = 1
  AND tenant_id = @tenant_id
  AND deleted = b'0'
ORDER BY id
LIMIT 1;

UPDATE ai_model
SET key_id = @api_key_id,
    name = @chat_model_name,
    sort = 0,
    status = 0,
    temperature = ${temperature},
    max_tokens = ${maxTokens},
    max_contexts = ${maxContexts},
    updater = @operator,
    update_time = NOW()
WHERE id = @model_id;

INSERT INTO ai_model (
  key_id, name, model, platform, type, sort, status, temperature, max_tokens, max_contexts,
  creator, create_time, updater, update_time, deleted, tenant_id
)
SELECT
  @api_key_id, @chat_model_name, @chat_model, @platform, 1, 0, 0, ${temperature}, ${maxTokens}, ${maxContexts},
  @operator, NOW(), @operator, NOW(), b'0', @tenant_id
WHERE @model_id IS NULL;

COMMIT;
`.trimStart()
}

export function resolveChatCompletionsUrl(baseUrl) {
  const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '')
  if (!trimmed) {
    throw new Error('QWEN_BASE_URL is required for AI provider smoke')
  }
  if (trimmed.endsWith('/chat/completions')) {
    return trimmed
  }
  return `${trimmed}/chat/completions`
}

export function buildAiProviderSmokeRequest(env) {
  validateBootstrapEnv(env)
  const url = resolveChatCompletionsUrl(env.QWEN_BASE_URL)
  return {
    url,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.QWEN_API_KEY}`
      },
      body: JSON.stringify({
        model: env.QWEN_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a connectivity smoke test. Reply with xunjing-ai-smoke-ok only.'
          },
          {
            role: 'user',
            content: 'Return xunjing-ai-smoke-ok.'
          }
        ],
        temperature: 0,
        max_tokens: 16
      })
    }
  }
}

function providerContentFromResponse(data) {
  return data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    data?.output?.text ||
    ''
}

export async function checkAiProviderSmoke({
  env,
  fetchImpl = globalThis.fetch,
  checkedAt = new Date().toISOString(),
  nowMs = () => Date.now()
}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is required for AI provider smoke')
  }
  const { url, options } = buildAiProviderSmokeRequest(env)
  const endpoint = new URL(url)
  const startedAt = nowMs()
  let response
  try {
    response = await fetchImpl(url, options)
  } catch (error) {
    throw new Error(redact(`AI provider smoke request failed: ${error.message}`, env))
  }
  const rawBody = await response.text()
  let parsedBody
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    parsedBody = undefined
  }
  if (!response.ok) {
    throw new Error(redact(`AI provider smoke returned HTTP ${response.status}`, env))
  }
  const assistantContent = providerContentFromResponse(parsedBody)
  if (!assistantContent) {
    throw new Error('AI provider smoke response did not contain assistant content')
  }
  return {
    checkedAt,
    baseUrlHost: endpoint.host,
    endpointPath: endpoint.pathname,
    model: env.QWEN_MODEL,
    httpStatus: response.status,
    responseTextLength: String(assistantContent).length,
    latencyMs: Math.max(0, nowMs() - startedAt)
  }
}

function redact(text, env) {
  let output = text
  for (const key of ['MYSQL_PASSWORD', 'QWEN_API_KEY', 'DASHSCOPE_API_KEY']) {
    if (env[key]) {
      output = output.split(env[key]).join(`[REDACTED_${key}]`)
    }
  }
  return output
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

export function buildAiBootstrapEvidence({ env, client, providerSmoke, checkedAt = new Date().toISOString() }) {
  if (!providerSmoke || providerSmoke.httpStatus !== 200 || !providerSmoke.responseTextLength) {
    throw new Error('AI provider smoke evidence is required before building bootstrap evidence')
  }
  const evidence = {
    artifactType: 'xicheng-yudao-ai-bootstrap',
    ok: true,
    status: 'YUDAO_AI_MODEL_BOOTSTRAPPED',
    checkedAt,
    summary: {
      tenantId: String(env.XUNJING_TENANT_ID),
      platform: env.YUDAO_AI_PLATFORM || 'TongYi',
      model: env.QWEN_MODEL,
      client,
      providerSmokeCheckedAt: providerSmoke.checkedAt,
      providerSmokeHost: providerSmoke.baseUrlHost,
      providerSmokeEndpointPath: providerSmoke.endpointPath,
      providerSmokeModel: providerSmoke.model,
      providerSmokeHttpStatus: providerSmoke.httpStatus,
      providerSmokeLatencyMs: providerSmoke.latencyMs
    },
    checks: [
      {
        name: 'ai-api-key-upsert',
        ok: true,
        detail: 'Yudao ai_api_key upsert completed without printing credentials',
        blockers: []
      },
      {
        name: 'default-chat-model-upsert',
        ok: true,
        detail: 'Yudao ai_model default chat model upsert completed',
        blockers: []
      },
      {
        name: 'ai-provider-smoke',
        ok: true,
        detail: 'Configured AI provider returned a chat completion response',
        summary: {
          checkedAt: providerSmoke.checkedAt,
          host: providerSmoke.baseUrlHost,
          endpointPath: providerSmoke.endpointPath,
          model: providerSmoke.model,
          httpStatus: providerSmoke.httpStatus,
          responseTextLength: providerSmoke.responseTextLength,
          latencyMs: providerSmoke.latencyMs
        },
        blockers: []
      },
      {
        name: 'secret-redaction',
        ok: true,
        detail: 'Evidence excludes database passwords and AI API keys',
        blockers: []
      }
    ],
    blockers: []
  }
  const serialized = JSON.stringify(evidence)
  for (const key of ['MYSQL_PASSWORD', 'QWEN_API_KEY', 'DASHSCOPE_API_KEY']) {
    if (env[key] && serialized.includes(env[key])) {
      throw new Error(`bootstrap evidence must not contain ${key}`)
    }
  }
  return evidence
}

async function writeAiBootstrapEvidence({ rootDir, evidenceFile, evidence }) {
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
  const providerSmoke = await checkAiProviderSmoke({ env })
  const sql = buildYudaoAiBootstrapSql(env)
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
    const stderr = redact(result.error?.message || result.stderr || result.stdout || `${invocation.command} command failed`, env)
    throw new Error(stderr.trim())
  }

  const evidence = buildAiBootstrapEvidence({
    env,
    client: invocation.client,
    providerSmoke
  })
  await writeAiBootstrapEvidence({
    rootDir,
    evidenceFile: readArgValue(args, '--evidence-file') || readArgValue(args, '--output'),
    evidence
  })

  console.log(JSON.stringify({
    ok: true,
    client: invocation.client,
    tenantId: env.XUNJING_TENANT_ID,
    platform: env.YUDAO_AI_PLATFORM || 'TongYi',
    model: env.QWEN_MODEL,
    providerSmokeHost: providerSmoke.baseUrlHost,
    providerSmokeCheckedAt: providerSmoke.checkedAt,
    database: env.MYSQL_DATABASE,
    evidenceFile: readArgValue(args, '--evidence-file') || readArgValue(args, '--output') || undefined,
    message: 'Yudao AI API key and default chat model bootstrapped after provider smoke without printing secrets'
  }, null, 2))
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
