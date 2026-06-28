import { describe, expect, test } from 'vitest'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildAiProviderSmokeRequest,
  buildAiBootstrapEvidence,
  buildMysqlArgs,
  checkAiProviderSmoke,
  resolveEvidenceFile,
  resolveMysqlInvocation,
  buildYudaoAiBootstrapSql,
  validateBootstrapEnv
} from './bootstrap-yudao-ai-model.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const env = {
  XUNJING_TENANT_ID: '1',
  MYSQL_HOST: '127.0.0.1',
  MYSQL_PORT: '33306',
  MYSQL_DATABASE: 'yudao_xinghe_xunjing',
  MYSQL_USERNAME: 'xunjing',
  MYSQL_PASSWORD: 'test-mysql-password',
  QWEN_API_KEY: 'test-qwen-api-key',
  QWEN_BASE_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  QWEN_MODEL: 'qwen-plus'
}

const providerSmoke = {
  checkedAt: '2026-06-28T00:00:00.000Z',
  baseUrlHost: 'dashscope.aliyuncs.com',
  endpointPath: '/compatible-mode/v1/chat/completions',
  model: 'qwen-plus',
  httpStatus: 200,
  responseTextLength: 19,
  latencyMs: 42
}

describe('Yudao AI model bootstrap', () => {
  test('generates idempotent SQL for TongYi chat model without hardcoded secrets', () => {
    const sql = buildYudaoAiBootstrapSql(env)

    expect(sql).toContain('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci')
    expect(sql).toContain('START TRANSACTION')
    expect(sql).toContain('ai_api_key')
    expect(sql).toContain('ai_model')
    expect(sql).toContain("'星河寻境通义千问'")
    expect(sql).toContain("'TongYi'")
    expect(sql).toContain("'qwen-plus'")
    expect(sql).toContain('type, sort, status, temperature, max_tokens, max_contexts')
    expect(sql).toContain('COMMIT')
  })

  test('requires model secrets and database connection variables', () => {
    expect(() => validateBootstrapEnv({ ...env, QWEN_API_KEY: '' })).toThrow('QWEN_API_KEY')
    expect(() => validateBootstrapEnv({ ...env, MYSQL_DATABASE: '' })).toThrow('MYSQL_DATABASE')
  })

  test('keeps MySQL password out of process arguments', () => {
    const args = buildMysqlArgs(env)

    expect(args).toEqual([
      '--protocol=tcp',
      '--default-character-set=utf8mb4',
      '--host=127.0.0.1',
      '--port=33306',
      '--user=xunjing',
      'yudao_xinghe_xunjing'
    ])
    expect(args.join(' ')).not.toContain('test-mysql-password')
  })

  test('falls back to Docker mysql client without leaking password in args', () => {
    const invocation = resolveMysqlInvocation(env, {
      hasLocalMysql: false,
      hasDocker: true
    })

    expect(invocation.command).toBe('docker')
    expect(invocation.client).toBe('docker')
    expect(invocation.args).toContain('--env')
    expect(invocation.args).toContain('MYSQL_PWD')
    expect(invocation.args).toContain('mysql:8.4')
    expect(invocation.args.join(' ')).toContain('--host=host.docker.internal')
    expect(invocation.args.join(' ')).not.toContain('test-mysql-password')
  })

  test('rejects unsupported mysql client values', () => {
    expect(() => resolveMysqlInvocation({ ...env, MYSQL_CLIENT: 'shell' })).toThrow('MYSQL_CLIENT')
  })

  test('builds an OpenAI-compatible provider smoke request without putting the key in URL or body', () => {
    const request = buildAiProviderSmokeRequest(env)
    const body = JSON.parse(request.options.body)

    expect(request.url).toBe('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions')
    expect(request.options.method).toBe('POST')
    expect(request.options.headers.Authorization).toBe('Bearer test-qwen-api-key')
    expect(body.model).toBe('qwen-plus')
    expect(body.temperature).toBe(0)
    expect(body.max_tokens).toBe(16)
    expect(body.messages.at(-1).content).toContain('xunjing-ai-smoke-ok')
    expect(request.url).not.toContain('test-qwen-api-key')
    expect(request.options.body).not.toContain('test-qwen-api-key')
  })

  test('checks the real provider with a secret-safe smoke summary', async () => {
    const smoke = await checkAiProviderSmoke({
      env,
      checkedAt: '2026-06-28T00:00:00.000Z',
      nowMs: () => 1000,
      fetchImpl: async (url, options) => {
        expect(url).toBe('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions')
        expect(options.headers.Authorization).toBe('Bearer test-qwen-api-key')
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            choices: [
              {
                message: {
                  content: 'xunjing-ai-smoke-ok'
                }
              }
            ]
          })
        }
      }
    })

    expect(smoke).toMatchObject({
      checkedAt: '2026-06-28T00:00:00.000Z',
      baseUrlHost: 'dashscope.aliyuncs.com',
      endpointPath: '/compatible-mode/v1/chat/completions',
      model: 'qwen-plus',
      httpStatus: 200,
      responseTextLength: 19,
      latencyMs: 0
    })
    expect(JSON.stringify(smoke)).not.toContain('test-qwen-api-key')
    expect(JSON.stringify(smoke)).not.toContain('test-mysql-password')
  })

  test('builds secret-safe AI bootstrap evidence for release gate consumption', () => {
    const evidence = buildAiBootstrapEvidence({
      env,
      client: 'docker',
      providerSmoke,
      checkedAt: '2026-06-28T00:00:00.000Z'
    })

    expect(evidence).toMatchObject({
      artifactType: 'xicheng-yudao-ai-bootstrap',
      ok: true,
      status: 'YUDAO_AI_MODEL_BOOTSTRAPPED',
      checkedAt: '2026-06-28T00:00:00.000Z',
      summary: {
        tenantId: '1',
        platform: 'TongYi',
        model: 'qwen-plus',
        client: 'docker',
        providerSmokeHost: 'dashscope.aliyuncs.com',
        providerSmokeModel: 'qwen-plus'
      }
    })
    expect(evidence.checks.map((check) => check.name)).toEqual([
      'ai-api-key-upsert',
      'default-chat-model-upsert',
      'ai-provider-smoke',
      'secret-redaction'
    ])
    expect(JSON.stringify(evidence)).not.toContain('test-mysql-password')
    expect(JSON.stringify(evidence)).not.toContain('test-qwen-api-key')
  })

  test('keeps bootstrap evidence files under qa tmp or workbench', async () => {
    expect(resolveEvidenceFile(rootDir, 'qa/yudao-ai-bootstrap-evidence.json')).toBe(
      resolve(rootDir, 'qa/yudao-ai-bootstrap-evidence.json')
    )
    expect(() => resolveEvidenceFile(rootDir, 'ops/leak.json')).toThrow('evidence file must be under qa/, tmp/ or workbench/')
  })

  test('is exposed as a documented npm script without storing real keys', async () => {
    const packageJson = JSON.parse(await readFile(resolve(rootDir, 'package.json'), 'utf8'))
    const deployDoc = await readFile(resolve(rootDir, 'docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')

    expect(packageJson.scripts['xunjing:ai:bootstrap']).toBe('node scripts/bootstrap-yudao-ai-model.mjs')
    expect(deployDoc).toContain('npm run xunjing:ai:bootstrap')
    expect(deployDoc).toContain('mysql:8.4')
    expect(deployDoc).toContain('不会把真实 key 写入 SQL、Markdown 或 Git')
  })
})
