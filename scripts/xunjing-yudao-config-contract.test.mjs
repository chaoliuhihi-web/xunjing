import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const resourcesDir = 'backend/yudao/yudao-server/src/main/resources'

describe('xunjing yudao runtime config contract', () => {
  test('base application config names the Xunjing Qdrant text collection', async () => {
    const config = await readFile(resolve(rootDir, resourcesDir, 'application.yaml'), 'utf8')

    expect(config).toContain('chat: ${SPRING_AI_MODEL_CHAT:none}')
    expect(config).toContain('embedding: ${SPRING_AI_MODEL_EMBEDDING:none}')
    expect(config).toContain('image: ${SPRING_AI_MODEL_IMAGE:none}')
    expect(config).toContain('moderation: ${SPRING_AI_MODEL_MODERATION:none}')
    expect(config).toContain('collection-name: ${QDRANT_TEXT_COLLECTION:xinghe_xunjing_text_local}')
    expect(config).toContain('host: ${QDRANT_HOST:127.0.0.1}')
    expect(config).toContain('port: ${QDRANT_GRPC_PORT:36334}')
    expect(config).toContain('vectorstore: # 向量存储\n      type: ${SPRING_AI_VECTORSTORE_TYPE:qdrant}')
    expect(config).toContain('redis:\n        initialize-schema: false')
    expect(config).toContain('milvus:\n        initialize-schema: false')
    expect(config).toContain('enabled: ${DASHSCOPE_ENABLED:false}')
    expect(config).toContain('enabled: ${DASHSCOPE_AGENT_ENABLED:false}')
  })

  test('server runtime only packages modules needed by Xunjing P0', async () => {
    const serverPom = await readFile(resolve(rootDir, 'backend/yudao/yudao-server/pom.xml'), 'utf8')

    expect(serverPom).toContain('<artifactId>yudao-module-ai</artifactId>')
    expect(serverPom).toContain('<artifactId>yudao-module-xunjing</artifactId>')
    expect(serverPom).not.toContain('<artifactId>yudao-module-aivideo</artifactId>')
  })

  test('package scripts include safe Yudao AI model bootstrap', async () => {
    const packageJson = JSON.parse(await readFile(resolve(rootDir, 'package.json'), 'utf8'))
    const deployDoc = await readFile(resolve(rootDir, 'docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')

    expect(packageJson.scripts['xunjing:ai:bootstrap']).toBe('node scripts/bootstrap-yudao-ai-model.mjs')
    expect(deployDoc).toContain('npm run xunjing:ai:bootstrap')
    expect(deployDoc).toContain('不会把真实 key 写入 SQL、Markdown 或 Git')
  })

  test('local dependency env example includes app runtime and compose port variables', async () => {
    const envExample = await readFile(resolve(rootDir, 'ops/xunjing-platform.env.example'), 'utf8')

    expect(envExample).toContain('SPRING_PROFILES_ACTIVE=local')
    expect(envExample).toContain('SPRING_AI_VECTORSTORE_TYPE=none')
    expect(envExample).toContain('SPRING_AI_MODEL_EMBEDDING=none')
    expect(envExample).toContain('MYSQL_HOST=127.0.0.1')
    expect(envExample).toContain('MYSQL_PORT=33306')
    expect(envExample).toContain('XUNJING_MYSQL_PORT=33306')
    expect(envExample).toContain('REDIS_HOST=127.0.0.1')
    expect(envExample).toContain('REDIS_PORT=36379')
    expect(envExample).toContain('QDRANT_URL=http://127.0.0.1:36333')
    expect(envExample).toContain('QDRANT_HOST=127.0.0.1')
    expect(envExample).toContain('QDRANT_GRPC_PORT=36334')
    expect(envExample).toContain('QWEN_API_KEY=replace-with-local-or-staging-key')
    expect(envExample).toContain('QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1')
    expect(envExample).toContain('QWEN_MODEL=qwen-plus')
    expect(envExample).toContain('DASHSCOPE_ENABLED=false')
    expect(envExample).toContain('DASHSCOPE_EMBEDDING_ENABLED=false')
    expect(envExample).toContain('DASHSCOPE_API_KEY=replace-with-real-dashscope-key')
    expect(envExample).toContain('WX_MP_APP_ID=replace-with-wechat-mp-appid')
    expect(envExample).toContain('WX_MP_SECRET=replace-with-wechat-mp-secret')
    expect(envExample).toContain('WX_MINIAPP_APPID=replace-with-wechat-miniapp-appid')
    expect(envExample).toContain('WX_MINIAPP_SECRET=replace-with-wechat-miniapp-secret')
    expect(envExample).toContain('INTERNAL_AUTH_TOKEN=replace-with-local-internal-token')
  })

  test('keeps generated runtime profile overrides local-only and out of git', async () => {
    const gitignore = await readFile(resolve(rootDir, '.gitignore'), 'utf8')
    const deployDoc = await readFile(resolve(rootDir, 'docs/02_开发规划/星河寻境业务平台部署说明.md'), 'utf8')

    for (const profile of ['application-local.yaml', 'application-dev.yaml']) {
      expect(gitignore).toContain(`backend/yudao/yudao-server/src/main/resources/${profile}`)
      expect(deployDoc).toContain(profile)
    }

    expect(deployDoc).toContain('ops/xunjing-platform.env.example')
    expect(deployDoc).toContain('QDRANT_TEXT_COLLECTION')
    expect(deployDoc).toContain('DASHSCOPE_API_KEY')
  })
})
