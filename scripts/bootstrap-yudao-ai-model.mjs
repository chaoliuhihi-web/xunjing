import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'

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

function redact(text, env) {
  let output = text
  for (const key of ['MYSQL_PASSWORD', 'QWEN_API_KEY']) {
    if (env[key]) {
      output = output.split(env[key]).join(`[REDACTED_${key}]`)
    }
  }
  return output
}

async function runCli() {
  const args = process.argv.slice(2)
  const envFile = readArgValue(args, '--env-file') || process.env.XUNJING_ENV_FILE
  const fileEnv = envFile ? await loadEnvFile(envFile) : {}
  const env = { ...process.env, ...fileEnv }
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

  console.log(JSON.stringify({
    ok: true,
    client: invocation.client,
    tenantId: env.XUNJING_TENANT_ID,
    platform: env.YUDAO_AI_PLATFORM || 'TongYi',
    model: env.QWEN_MODEL,
    database: env.MYSQL_DATABASE,
    message: 'Yudao AI API key and default chat model bootstrapped without printing secrets'
  }, null, 2))
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
