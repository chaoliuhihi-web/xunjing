import { describe, expect, test } from 'vitest'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildAiBootstrapEvidence,
  buildMysqlArgs,
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

  test('builds secret-safe AI bootstrap evidence for release gate consumption', () => {
    const evidence = buildAiBootstrapEvidence({
      env,
      client: 'docker',
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
        client: 'docker'
      }
    })
    expect(evidence.checks.map((check) => check.name)).toEqual([
      'ai-api-key-upsert',
      'default-chat-model-upsert',
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
