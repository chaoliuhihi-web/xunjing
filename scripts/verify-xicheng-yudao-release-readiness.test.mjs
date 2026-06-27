import { mkdtemp, mkdir, rm, writeFile, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'
import {
  verifyXichengYudaoReleaseReadiness
} from './verify-xicheng-yudao-release-readiness.mjs'

const tempDirs = []
const freshCheckedAt = () => new Date().toISOString()
const staleCheckedAt = () => new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
const requiredManifestEvidenceChecks = [
  'manifest-shape',
  'manifest-production-flags',
  'poi-count',
  'poi-identity',
  'poi-coordinates',
  'poi-triggers',
  'poi-source-license',
  'poi-field-evidence',
  'poi-content',
  'poi-audit'
]
const requiredSeedEvidenceChecks = [
  'sql-file',
  'seed-shape',
  'poi-count',
  'poi-approval',
  'production-metrics',
  'field-evidence',
  'source-documents'
]

function passedChecks(names) {
  return names.map((name) => ({ name, ok: true, detail: `${name} passed`, blockers: [] }))
}

function productionEnv(overrides = {}) {
  return {
    SPRING_PROFILES_ACTIVE: 'production',
    XUNJING_TENANT_ID: '1001',
    XUNJING_APP_API_BASE_URL: 'https://xunjing-api.xingheai.net',
    MYSQL_HOST: 'xunjing-prod-mysql.internal',
    MYSQL_PORT: '3306',
    MYSQL_DATABASE: 'yudao_xinghe_xunjing_prod',
    MYSQL_USERNAME: 'xunjing_prod',
    MYSQL_PASSWORD: 'prod-db-password',
    REDIS_HOST: 'xunjing-prod-redis.internal',
    REDIS_PORT: '6379',
    REDIS_DATABASE: '0',
    REDIS_PASSWORD: 'prod-redis-password',
    OSS_ENDPOINT: 'https://oss-cn-beijing.aliyuncs.com',
    OSS_BUCKET: 'xinghe-xunjing-prod',
    OSS_PREFIX: 'xinghe-xunjing/production/',
    OSS_ACCESS_KEY: 'prod-oss-access-key',
    OSS_SECRET_KEY: 'prod-oss-secret-key',
    QDRANT_URL: 'http://xunjing-prod-qdrant.internal:6333',
    QDRANT_HOST: 'xunjing-prod-qdrant.internal',
    QDRANT_GRPC_PORT: '6334',
    QDRANT_TEXT_COLLECTION: 'xinghe_xunjing_text_production',
    QDRANT_IMAGE_COLLECTION: 'xinghe_xunjing_image_production',
    QWEN_API_KEY: 'prod-qwen-api-key',
    QWEN_BASE_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    QWEN_MODEL: 'qwen-plus',
    DASHSCOPE_API_KEY: 'prod-dashscope-api-key',
    WX_MP_APP_ID: 'wx-prod-mp-appid',
    WX_MP_SECRET: 'wx-prod-mp-secret',
    WX_MINIAPP_APPID: 'wx-prod-miniapp-appid',
    WX_MINIAPP_SECRET: 'wx-prod-miniapp-secret',
    XUNJING_VISION_API_URL: 'https://vision.xingheai.net/xunjing/recognize',
    XUNJING_VISION_API_KEY: 'prod-vision-api-key',
    XUNJING_VISION_MODEL: 'xunjing-ocr-vision-prod',
    INTERNAL_AUTH_TOKEN: 'prod-internal-auth-token',
    ...overrides
  }
}

async function createProductionReadyFixture() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-release-ready-'))
  tempDirs.push(rootDir)
  const sqlDir = path.join(rootDir, 'backend/yudao/sql/mysql')
  await mkdir(sqlDir, { recursive: true })

  await writeFile(
    path.join(sqlDir, 'ruoyi-vue-pro.sql'),
    [
      'CREATE TABLE `system_users` (`id` bigint);',
      'CREATE TABLE `system_tenant` (`id` bigint);',
      'CREATE TABLE `system_menu` (`id` bigint);',
      'CREATE TABLE `system_oauth2_client` (`id` bigint);',
      'CREATE TABLE `infra_api_access_log` (`id` bigint);'
    ].join('\n')
  )

  const poiRows = Array.from({ length: 80 }, (_, index) => {
    const suffix = String(index + 1).padStart(3, '0')
    const code = `xicheng-prod-poi-${suffix}`
    return [
      `(@map_package_id, '${code}', 'beijing-xicheng', 'Production POI ${suffix}', 'Production POI ${suffix}', '["Production POI ${suffix}","Alias ${suffix}"]', 'museum', 'P0', 'Beijing Xicheng', 39.9000000, 116.3000000, 'GCJ02',`,
      " JSON_OBJECT('geo','field_verified','content','authorized_source','sourceUrl',@xicheng_source_url,'licenseStatus','APPROVED'),",
      ` '{"gpsRadiusMeters":180,"ocrKeywords":["Production POI ${suffix}"],"photoLabels":["museum","xicheng"],"minConfidence":0.85}',`,
      ` '{"poiId":"${code}","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"APPROVED","licenseStatus":"APPROVED","shortIntro":"Reviewed production source.","recommendedQuestions":["What is this POI?"]}',`,
      " 'APPROVED', 'APPROVED', 'APPROVED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id)"
    ].join('')
  }).join(',\n')

  await writeFile(
    path.join(sqlDir, 'xunjing-seed-xicheng-p0.sql'),
    [
      'SET @xicheng_source_url := "https://www.bjxch.gov.cn/reviewed-source";',
      'INSERT INTO `xunjing_poi` VALUES',
      `${poiRows};`,
      'INSERT INTO `xunjing_resource_package` (`readiness_json`) VALUES (\'{"p0Ready":true,"productionReady":true,"regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","poiSeedCount":80,"targetP0PoiCount":80}\');',
      "INSERT INTO `xunjing_knowledge_document` (`title`, `source_url`, `review_status`, `index_status`) SELECT CONCAT(`name`, ' POI production source'), CONCAT(@xicheng_source_url, '#', `poi_code`), 'APPROVED', 'INDEXED' FROM `xunjing_poi`;"
    ].join('\n')
  )

  return rootDir
}

async function writeEnvFile(rootDir, env) {
  const envPath = path.join(rootDir, 'tmp/release.env')
  await mkdir(path.dirname(envPath), { recursive: true })
  await writeFile(
    envPath,
    Object.entries(env)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
  )
  return envPath
}

async function writeProductionPoiEvidence(rootDir, overrides = {}) {
  const manifestEvidencePath = path.join(rootDir, 'qa/xicheng-poi-manifest-evidence.json')
  const seedEvidencePath = path.join(rootDir, 'qa/xicheng-poi-production-seed-evidence.json')
  await mkdir(path.dirname(manifestEvidencePath), { recursive: true })
  const manifestEvidence = {
    artifactType: 'xicheng-poi-production-manifest-readiness',
    ok: true,
    status: 'PRODUCTION_POI_MANIFEST_READY',
    checkedAt: freshCheckedAt(),
    summary: {
      regionCode: 'beijing-xicheng',
      packageCode: 'XICHENG-MAP-001',
      totalPoiCount: 80,
      targetPoiCount: 80,
      productionReady: true
    },
    checks: passedChecks(requiredManifestEvidenceChecks),
    blockers: [],
    ...overrides.manifest
  }
  const seedEvidence = {
    artifactType: 'xicheng-poi-production-seed-readiness',
    ok: true,
    status: 'PRODUCTION_POI_SEED_READY',
    checkedAt: freshCheckedAt(),
    summary: {
      sqlFile: path.join(rootDir, 'workbench/xicheng-poi-production-seed.sql'),
      poiCount: 80,
      minPoiCount: 80,
      productionReady: true,
      poiSeedCount: 80,
      targetP0PoiCount: 80
    },
    checks: passedChecks(requiredSeedEvidenceChecks),
    blockers: [],
    ...overrides.seed
  }
  await writeFile(manifestEvidencePath, `${JSON.stringify(manifestEvidence, null, 2)}\n`)
  await writeFile(seedEvidencePath, `${JSON.stringify(seedEvidence, null, 2)}\n`)
  return { manifestEvidencePath, seedEvidencePath }
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('xicheng Yudao release readiness gate', () => {
  test('keeps the current repo NOT_READY for production until full baseline and reviewed POIs exist', async () => {
    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir: process.cwd(),
      stage: 'production'
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    expect(result.checks.find((check) => check.name === 'full-yudao-baseline')?.ok).toBe(false)
    expect(result.checks.find((check) => check.name === 'xicheng-production-poi-evidence')?.ok).toBe(false)
    expect(result.checks.find((check) => check.name === 'xicheng-production-poi')?.detail).toContain('24/80')
    expect(result.checks.find((check) => check.name === 'xicheng-source-license')?.ok).toBe(false)
    expect(result.blockers).toEqual(expect.arrayContaining([
      expect.stringContaining('complete Yudao baseline'),
      expect.stringContaining('POI manifest evidence is required'),
      expect.stringContaining('80 reviewed Xicheng POIs')
    ]))
  })

  test('rejects local candidate env placeholders and missing external service evidence', async () => {
    const env = await loadEnvFile('ops/xunjing-platform.env.example')

    const result = await verifyXichengYudaoReleaseReadiness({
      env,
      rootDir: process.cwd(),
      stage: 'production'
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    expect(result.checks.find((check) => check.name === 'runtime-env')?.ok).toBe(false)
    expect(result.checks.find((check) => check.name === 'https-app-api-domain')?.ok).toBe(false)
    expect(result.checks.find((check) => check.name === 'real-wechat-app')?.ok).toBe(false)
    expect(result.checks.find((check) => check.name === 'vision-ocr-service')?.ok).toBe(false)
    expect(result.checks.find((check) => check.name === 'real-ai-provider')?.ok).toBe(false)
    expect(result.blockers.join('\n')).toContain('SPRING_PROFILES_ACTIVE must be production')
    expect(result.blockers.join('\n')).toContain('WX_MINIAPP_APPID')
  })

  test('returns production candidate only when env, full baseline and 80 approved POIs are present', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      poiManifestEvidencePath: manifestEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(true)
    expect(result.status).toBe('PRODUCTION_READY_CANDIDATE')
    expect(result.blockers).toEqual([])
    expect(result.checks.map((check) => check.name)).toEqual([
      'runtime-env',
      'https-app-api-domain',
      'real-wechat-app',
      'real-ai-provider',
      'vision-ocr-service',
      'object-storage',
      'full-yudao-baseline',
      'xicheng-production-poi-evidence',
      'xicheng-production-poi',
      'xicheng-source-license'
    ])
  })

  test('fails closed when reviewed POI manifest and seed evidence are missing', async () => {
    const rootDir = await createProductionReadyFixture()

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production'
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    const evidenceCheck = result.checks.find((check) => check.name === 'xicheng-production-poi-evidence')
    expect(evidenceCheck?.ok).toBe(false)
    expect(evidenceCheck?.blockers).toEqual([
      'POI manifest evidence is required before production release',
      'POI seed SQL evidence is required before production release'
    ])
  })

  test('fails closed when production POI evidence is not ready', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir, {
      seed: {
        ok: false,
        status: 'NOT_READY',
        blockers: ['80 production POI seed rows required; found 1/80'],
        summary: {
          poiCount: 1,
          productionReady: false
        }
      }
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      poiManifestEvidencePath: manifestEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    const evidenceCheck = result.checks.find((check) => check.name === 'xicheng-production-poi-evidence')
    expect(evidenceCheck?.ok).toBe(false)
    expect(evidenceCheck?.blockers.join('\n')).toContain('seed evidence status must be PRODUCTION_POI_SEED_READY')
    expect(evidenceCheck?.blockers.join('\n')).toContain('seed evidence must prove at least 80 production POIs')
  })

  test('fails closed when POI evidence was generated before current field evidence gates', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir, {
      manifest: { checks: [] },
      seed: { checks: [] }
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      poiManifestEvidencePath: manifestEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    const evidenceCheck = result.checks.find((check) => check.name === 'xicheng-production-poi-evidence')
    expect(evidenceCheck?.ok).toBe(false)
    expect(evidenceCheck?.blockers.join('\n')).toContain('manifest evidence must include poi-field-evidence')
    expect(evidenceCheck?.blockers.join('\n')).toContain('seed evidence must include field-evidence')
  })

  test('fails closed when POI evidence is older than the release freshness window', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir, {
      manifest: {
        checkedAt: staleCheckedAt()
      }
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      poiManifestEvidencePath: manifestEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    const evidenceCheck = result.checks.find((check) => check.name === 'xicheng-production-poi-evidence')
    expect(evidenceCheck?.ok).toBe(false)
    expect(evidenceCheck?.blockers.join('\n')).toContain('manifest evidence checkedAt must be within the last 24 hours')
  })

  test('fails closed when POI evidence is missing checkedAt', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir, {
      seed: {
        checkedAt: undefined
      }
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      poiManifestEvidencePath: manifestEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    const evidenceCheck = result.checks.find((check) => check.name === 'xicheng-production-poi-evidence')
    expect(evidenceCheck?.ok).toBe(false)
    expect(evidenceCheck?.blockers.join('\n')).toContain('seed evidence checkedAt must be a valid timestamp')
  })

  test('writes a secret-safe release evidence file even when production is not ready', async () => {
    const rootDir = await createProductionReadyFixture()
    const envPath = await writeEnvFile(rootDir, productionEnv({
      SPRING_PROFILES_ACTIVE: 'local',
      XUNJING_APP_API_BASE_URL: 'http://127.0.0.1:48080',
      WX_MINIAPP_APPID: 'replace-with-real-miniapp-appid',
      XUNJING_VISION_API_KEY: 'replace-with-real-vision-key'
    }))
    const evidenceRelativePath = 'tmp/xicheng-yudao-release-evidence.json'
    const evidencePath = path.join(rootDir, evidenceRelativePath)

    const result = spawnSync(process.execPath, [
      path.resolve('scripts/verify-xicheng-yudao-release-readiness.mjs'),
      '--root', rootDir,
      '--stage', 'production',
      '--env-file', envPath,
      '--evidence-file', evidenceRelativePath
    ], {
      cwd: process.cwd(),
      encoding: 'utf8'
    })

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(evidencePath, 'utf8'))
    expect(evidence.artifactType).toBe('xicheng-yudao-release-readiness')
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.summary).toMatchObject({
      stage: 'production',
      status: 'NOT_READY',
      totalChecks: 10
    })
    expect(evidence.blockers.join('\n')).toContain('SPRING_PROFILES_ACTIVE must be production')
    expect(JSON.stringify(evidence)).not.toContain('prod-db-password')
    expect(JSON.stringify(evidence)).not.toContain('replace-with-real-vision-key')
  })

  test('rejects release evidence paths outside qa tmp or workbench', async () => {
    const rootDir = await createProductionReadyFixture()
    const envPath = await writeEnvFile(rootDir, productionEnv())
    const { manifestEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)

    const result = spawnSync(process.execPath, [
      path.resolve('scripts/verify-xicheng-yudao-release-readiness.mjs'),
      '--root', rootDir,
      '--stage', 'production',
      '--env-file', envPath,
      '--poi-manifest-evidence', manifestEvidencePath,
      '--poi-seed-evidence', seedEvidencePath,
      '--evidence-file', 'release-evidence.json'
    ], {
      cwd: process.cwd(),
      encoding: 'utf8'
    })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('evidence file must be under qa/, tmp/ or workbench/')
  })

  test('is documented as an npm release gate without storing secrets', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
    const deployDoc = await readFile('docs/02_开发规划/星河寻境业务平台部署说明.md', 'utf8')

    expect(packageJson.scripts['xunjing:yudao:release:gate']).toBe(
      'node scripts/verify-xicheng-yudao-release-readiness.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:yudao:release:gate')
    expect(deployDoc).toContain('PRODUCTION_READY_CANDIDATE')
  })
})
