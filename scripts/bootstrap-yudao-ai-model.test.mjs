import { describe, expect, test } from 'vitest'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildMysqlArgs,
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
  MYSQL_PASSWORD: 'secret',
  QWEN_API_KEY: 'test-qwen-api-key',
  QWEN_BASE_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  QWEN_MODEL: 'qwen-plus'
}

describe('Yudao AI model bootstrap', () => {
  test('generates idempotent SQL for TongYi chat model without hardcoded secrets', () => {
    const sql = buildYudaoAiBootstrapSql(env)

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
    expect(args.join(' ')).not.toContain('secret')
  })

  test('is exposed as a documented npm script without storing real keys', async () => {
    const packageJson = JSON.parse(await readFile(resolve(rootDir, 'package.json'), 'utf8'))
    const deployDoc = await readFile(resolve(rootDir, 'docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')

    expect(packageJson.scripts['xunjing:ai:bootstrap']).toBe('node scripts/bootstrap-yudao-ai-model.mjs')
    expect(deployDoc).toContain('npm run xunjing:ai:bootstrap')
    expect(deployDoc).toContain('不会把真实 key 写入 SQL、Markdown 或 Git')
  })
})
