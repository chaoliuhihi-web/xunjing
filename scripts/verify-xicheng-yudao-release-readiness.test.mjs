import { appendFile, mkdtemp, mkdir, rm, writeFile, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
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
  'manifest-review-batch',
  'poi-count',
  'poi-identity',
  'poi-coordinates',
  'poi-triggers',
  'poi-source-license',
  'poi-field-evidence',
  'poi-content',
  'poi-audit'
]
const requiredWorkbookEvidenceChecks = [
  'workbook-file',
  'workbook-shape',
  'poi-count',
  'poi-identity',
  'poi-source-license',
  'poi-field-evidence',
  'poi-content-audit',
  'no-placeholder-cells'
]
const requiredSeedEvidenceChecks = [
  'sql-file',
  'seed-shape',
  'seed-preconditions',
  'poi-count',
  'poi-approval',
  'production-metrics',
  'review-batch-metrics',
  'field-evidence',
  'source-license-evidence',
  'source-documents'
]
const requiredSourceCoverageEvidenceChecks = [
  'source-review-file',
  'source-pages',
  'poi-source-coverage',
  'secret-redaction'
]
const requiredVisionOcrEvidenceChecks = [
  'vision-provider-request',
  'vision-provider-smoke',
  'secret-redaction'
]
const requiredObjectStorageEvidenceChecks = [
  'object-storage-request',
  'object-storage-write',
  'object-storage-read',
  'object-storage-delete',
  'secret-redaction'
]
const requiredRuntimeSeedEvidenceChecks = [
  'resource-package',
  'poi-count',
  'poi-approval',
  'knowledge-documents',
  'map-points',
  'qr-code',
  'local-candidate-report',
  'secret-redaction'
]

function passedChecks(names) {
  return names.map((name) => ({ name, ok: true, detail: `${name} passed`, blockers: [] }))
}

function runGit(rootDir, args) {
  const result = spawnSync('git', args, {
    cwd: rootDir,
    encoding: 'utf8'
  })
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`)
  }
  return result.stdout.trim()
}

function initCleanGitRepo(rootDir) {
  runGit(rootDir, ['init'])
  runGit(rootDir, ['checkout', '-b', 'feature/xicheng-p0'])
  runGit(rootDir, ['config', 'user.name', 'Xicheng Release Test'])
  runGit(rootDir, ['config', 'user.email', 'xicheng-release@example.com'])
  runGit(rootDir, ['add', '.'])
  runGit(rootDir, ['commit', '-m', 'fixture'])
  return runGit(rootDir, ['rev-parse', 'HEAD'])
}

function mergeEvidence(base, overrides = {}) {
  return {
    ...base,
    ...overrides,
    summary: {
      ...(base.summary || {}),
      ...(overrides.summary || {})
    },
    checks: overrides.checks || base.checks,
    blockers: overrides.blockers || base.blockers
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function productionEnv(overrides = {}) {
  return {
    SPRING_PROFILES_ACTIVE: 'production',
    SPRING_AI_VECTORSTORE_TYPE: 'qdrant',
    SPRING_AI_MODEL_EMBEDDING: 'dashscope',
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
    DASHSCOPE_EMBEDDING_ENABLED: 'true',
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

  await writeFile(path.join(sqlDir, 'xunjing-seed-xicheng-p0.sql'), productionSeedSql())
  await writeYudaoServerJar(rootDir)

  return rootDir
}

async function writeYudaoServerJar(rootDir, relativePath = 'backend/yudao/yudao-server/target/yudao-server.jar') {
  const jarPath = path.join(rootDir, relativePath)
  await mkdir(path.dirname(jarPath), { recursive: true })
  await writeFile(jarPath, 'PK\u0003\u0004xicheng-yudao-server-build-artifact\n')
  return jarPath
}

function productionSeedSql() {
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

  return [
    'SET @xicheng_source_url := "https://www.bjxch.gov.cn/reviewed-source";',
    'INSERT INTO `xunjing_poi` VALUES',
    `${poiRows};`,
    'INSERT INTO `xunjing_resource_package` (`readiness_json`) VALUES (\'{"p0Ready":true,"productionReady":true,"regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","poiSeedCount":80,"targetP0PoiCount":80}\');',
    "INSERT INTO `xunjing_knowledge_document` (`title`, `source_url`, `review_status`, `index_status`) SELECT CONCAT(`name`, ' POI production source'), CONCAT(@xicheng_source_url, '#', `poi_code`), 'APPROVED', 'INDEXED' FROM `xunjing_poi`;"
  ].join('\n')
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
  const workbookEvidencePath = path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json')
  const seedEvidencePath = path.join(rootDir, 'qa/xicheng-poi-production-seed-evidence.json')
  const sourceCoverageEvidencePath = path.join(rootDir, 'qa/xicheng-poi-source-coverage-evidence.json')
  const sourceReviewApplyEvidencePath = path.join(rootDir, 'qa/xicheng-poi-source-review-apply-evidence.json')
  const productionReviewApplyEvidencePath = path.join(rootDir, 'qa/xicheng-poi-production-review-apply-evidence.json')
  const manifestSourcePath = path.join(rootDir, 'workbench/xicheng-production-pois.json')
  const sourceAppliedWorkbookPath = path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.source-applied.csv')
  const workbookSourcePath = path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.production-applied.csv')
  const seedSourcePath = path.join(rootDir, 'workbench/xicheng-poi-production-seed.sql')
  await mkdir(path.dirname(manifestEvidencePath), { recursive: true })
  await mkdir(path.dirname(manifestSourcePath), { recursive: true })
  const manifestSource = `${JSON.stringify({
    regionCode: 'beijing-xicheng',
    packageCode: 'XICHENG-MAP-001',
    productionReady: true,
    targetP0PoiCount: 80,
    pois: Array.from({ length: 80 }, (_, index) => ({ poiCode: `xicheng-prod-poi-${String(index + 1).padStart(3, '0')}` }))
  }, null, 2)}\n`
  const workbookSource = [
    'poiCode,name,licenseStatus,photoEvidenceStatus,triggerSmokeStatus',
    ...Array.from({ length: 80 }, (_, index) => {
      const suffix = String(index + 1).padStart(3, '0')
      return `xicheng-prod-poi-${suffix},Xicheng Production POI ${suffix},APPROVED,APPROVED,PASSED`
    })
  ].join('\n')
  const seedSource = overrides.seedSource || productionSeedSql()
  const sourceAppliedWorkbookSource = `${workbookSource}\n`
  await writeFile(manifestSourcePath, manifestSource)
  await writeFile(sourceAppliedWorkbookPath, sourceAppliedWorkbookSource)
  await writeFile(workbookSourcePath, workbookSource)
  await writeFile(seedSourcePath, seedSource)
  const manifestEvidence = mergeEvidence({
    artifactType: 'xicheng-poi-production-manifest-readiness',
    ok: true,
    status: 'PRODUCTION_POI_MANIFEST_READY',
    checkedAt: freshCheckedAt(),
    summary: {
      manifestFile: manifestSourcePath,
      manifestSha256: sha256(manifestSource),
      regionCode: 'beijing-xicheng',
      packageCode: 'XICHENG-MAP-001',
      totalPoiCount: 80,
      targetPoiCount: 80,
      productionReady: true,
      reviewBatchCode: 'xicheng-p0-poi-review-20260627',
      reviewBatchEvidencePackageRef: 'oss://xunjing-review/xicheng/review-batches/xicheng-p0-poi-review-20260627.zip',
      sourceWorkbookFile: workbookSourcePath,
      sourceWorkbookSha256: sha256(workbookSource)
    },
    checks: passedChecks(requiredManifestEvidenceChecks),
    blockers: []
  }, overrides.manifest)
  const workbookEvidence = mergeEvidence({
    artifactType: 'xicheng-poi-review-workbook-readiness',
    ok: true,
    status: 'XICHENG_POI_REVIEW_WORKBOOK_READY',
    checkedAt: freshCheckedAt(),
    summary: {
      workbookFile: workbookSourcePath,
      workbookSha256: sha256(workbookSource),
      workbookRows: 80,
      minPoiCount: 80,
      categoryCount: 8,
      placeholderCount: 0,
      workbookReadyPoiCount: 80,
      workbookPendingPoiCount: 0,
      pendingPoiCodes: [],
      pendingPoiTasks: []
    },
    checks: passedChecks(requiredWorkbookEvidenceChecks),
    blockers: []
  }, overrides.workbook)
  const seedEvidence = mergeEvidence({
    artifactType: 'xicheng-poi-production-seed-readiness',
    ok: true,
    status: 'PRODUCTION_POI_SEED_READY',
    checkedAt: freshCheckedAt(),
    summary: {
      sqlFile: seedSourcePath,
      sqlSha256: sha256(seedSource),
      poiCount: 80,
      minPoiCount: 80,
      productionReady: true,
      poiSeedCount: 80,
      targetP0PoiCount: 80,
      regionCode: 'beijing-xicheng',
      packageCode: 'XICHENG-MAP-001',
      reviewBatchCode: 'xicheng-p0-poi-review-20260627',
      reviewBatchEvidencePackageRef: 'oss://xunjing-review/xicheng/review-batches/xicheng-p0-poi-review-20260627.zip'
    },
    checks: passedChecks(requiredSeedEvidenceChecks),
    blockers: []
  }, overrides.seed)
  const sourceCoverageEvidence = mergeEvidence({
    artifactType: 'xicheng-poi-source-coverage',
    ok: true,
    status: 'SOURCE_COVERAGE_READY',
    checkedAt: freshCheckedAt(),
    summary: {
      sourceReviewRows: 2,
      sourceGroupCount: 2,
      poiCount: 80,
      coveredPoiCount: 80,
      uncoveredPoiCount: 0,
      uncoveredPoiCodes: [],
      sourcePageFetchMode: 'live',
      sourcePages: [
        {
          sourceUrl: 'https://www.bjxch.gov.cn/reviewed-source-a.html',
          fetchMode: 'live',
          ok: true,
          httpStatus: 200,
          sourceTextLength: 4096,
          sourceTextSha256: 'a'.repeat(64)
        },
        {
          sourceUrl: 'https://www.bjxch.gov.cn/reviewed-source-b.html',
          fetchMode: 'live',
          ok: true,
          httpStatus: 200,
          sourceTextLength: 8192,
          sourceTextSha256: 'b'.repeat(64)
        }
      ],
      sourceGroups: [
        {
          sourceUrl: 'https://www.bjxch.gov.cn/reviewed-source-a.html',
          sourceType: 'OFFICIAL_PUBLIC',
          poiCount: 40,
          coveredPoiCount: 40,
          uncoveredPoiCount: 0,
          uncoveredPoiCodes: []
        },
        {
          sourceUrl: 'https://www.bjxch.gov.cn/reviewed-source-b.html',
          sourceType: 'OFFICIAL_PUBLIC',
          poiCount: 40,
          coveredPoiCount: 40,
          uncoveredPoiCount: 0,
          uncoveredPoiCodes: []
        }
      ]
    },
    checks: passedChecks(requiredSourceCoverageEvidenceChecks),
    blockers: []
  }, overrides.sourceCoverage)
  const sourceReviewApplyEvidence = mergeEvidence({
    artifactType: 'xicheng-poi-source-review-apply',
    ok: true,
    status: 'SOURCE_REVIEW_APPLIED',
    checkedAt: freshCheckedAt(),
    summary: {
      workbookFile: path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.csv'),
      sourceReviewFile: path.join(rootDir, 'workbench/xicheng-poi-source-review-summary.csv'),
      sourceCoverageEvidenceFile: sourceCoverageEvidencePath,
      sourceCoverageStatus: 'SOURCE_COVERAGE_READY',
      sourceCoverageCoveredPoiCount: 80,
      sourceCoverageUncoveredPoiCount: 0,
      outputFile: sourceAppliedWorkbookPath,
      evidenceFile: sourceReviewApplyEvidencePath,
      workbookRows: 80,
      sourceReviewRows: 2,
      approvedSourceGroupCount: 2,
      appliedPoiCount: 80,
      pendingSourcePoiCount: 0,
      pendingSourcePoiCodes: [],
      outputSha256: sha256(sourceAppliedWorkbookSource)
    },
    blockers: []
  }, overrides.sourceReviewApply)
  const productionReviewApplyEvidence = mergeEvidence({
    artifactType: 'xicheng-poi-production-review-apply',
    ok: true,
    status: 'PRODUCTION_REVIEW_APPLIED',
    checkedAt: freshCheckedAt(),
    summary: {
      workbookFile: sourceAppliedWorkbookPath,
      productionReviewFile: path.join(rootDir, 'workbench/xicheng-poi-production-review-summary.csv'),
      sourceReviewApplyEvidenceFile: sourceReviewApplyEvidencePath,
      sourceReviewApplyStatus: 'SOURCE_REVIEW_APPLIED',
      sourceReviewAppliedPoiCount: 80,
      sourceReviewPendingSourcePoiCount: 0,
      sourceCoverageStatus: 'SOURCE_COVERAGE_READY',
      sourceCoverageUncoveredPoiCount: 0,
      outputFile: workbookSourcePath,
      evidenceFile: productionReviewApplyEvidencePath,
      workbookRows: 80,
      productionReviewRows: 80,
      approvedReviewRowCount: 80,
      appliedPoiCount: 80,
      pendingProductionReviewPoiCount: 0,
      pendingProductionReviewPoiCodes: [],
      appliedReviewRows: [],
      outputSha256: sha256(workbookSource)
    },
    blockers: []
  }, overrides.productionReviewApply)
  await writeFile(manifestEvidencePath, `${JSON.stringify(manifestEvidence, null, 2)}\n`)
  await writeFile(workbookEvidencePath, `${JSON.stringify(workbookEvidence, null, 2)}\n`)
  await writeFile(seedEvidencePath, `${JSON.stringify(seedEvidence, null, 2)}\n`)
  await writeFile(sourceCoverageEvidencePath, `${JSON.stringify(sourceCoverageEvidence, null, 2)}\n`)
  await writeFile(sourceReviewApplyEvidencePath, `${JSON.stringify(sourceReviewApplyEvidence, null, 2)}\n`)
  await writeFile(productionReviewApplyEvidencePath, `${JSON.stringify(productionReviewApplyEvidence, null, 2)}\n`)
  return {
    manifestEvidencePath,
    workbookEvidencePath,
    seedEvidencePath,
    sourceCoverageEvidencePath,
    sourceReviewApplyEvidencePath,
    productionReviewApplyEvidencePath
  }
}

async function writeAiBootstrapEvidence(rootDir, overrides = {}) {
  const evidencePath = path.join(rootDir, 'qa/xicheng-yudao-ai-bootstrap-evidence.json')
  await mkdir(path.dirname(evidencePath), { recursive: true })
  const evidence = mergeEvidence({
    artifactType: 'xicheng-yudao-ai-bootstrap',
    ok: true,
    status: 'YUDAO_AI_MODEL_BOOTSTRAPPED',
    checkedAt: freshCheckedAt(),
    summary: {
      tenantId: '1001',
      platform: 'TongYi',
      model: 'qwen-plus',
      client: 'docker',
      providerSmokeCheckedAt: freshCheckedAt(),
      providerSmokeHost: 'dashscope.aliyuncs.com',
      providerSmokeEndpointPath: '/compatible-mode/v1/chat/completions',
      providerSmokeModel: 'qwen-plus',
      providerSmokeHttpStatus: 200,
      providerSmokeLatencyMs: 42
    },
    checks: passedChecks(['ai-api-key-upsert', 'default-chat-model-upsert', 'ai-provider-smoke', 'secret-redaction']),
    blockers: []
  }, overrides)
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
  return evidencePath
}

async function writeVisionOcrEvidence(rootDir, overrides = {}) {
  const evidencePath = path.join(rootDir, 'qa/xicheng-vision-ocr-smoke-evidence.json')
  await mkdir(path.dirname(evidencePath), { recursive: true })
  const evidence = mergeEvidence({
    artifactType: 'xicheng-vision-ocr-smoke',
    ok: true,
    status: 'XICHENG_VISION_OCR_SMOKE_READY',
    checkedAt: freshCheckedAt(),
    summary: {
      model: 'xunjing-ocr-vision-prod',
      providerSmokeCheckedAt: freshCheckedAt(),
      providerSmokeHost: 'vision.xingheai.net',
      providerSmokeEndpointPath: '/xunjing/recognize/chat/completions',
      providerSmokeHttpStatus: 200,
      sampleImageRef: 'https://xunjing-assets.example.com/smoke/xicheng-baitasi-test-card.jpg',
      labels: ['xunjing_vision_smoke', 'white_pagoda'],
      responseTextLength: 64,
      providerSmokeLatencyMs: 55
    },
    checks: passedChecks(requiredVisionOcrEvidenceChecks),
    blockers: []
  }, overrides)
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
  return evidencePath
}

async function writeObjectStorageEvidence(rootDir, overrides = {}) {
  const evidencePath = path.join(rootDir, 'qa/xicheng-object-storage-smoke-evidence.json')
  await mkdir(path.dirname(evidencePath), { recursive: true })
  const evidence = mergeEvidence({
    artifactType: 'xicheng-object-storage-smoke',
    ok: true,
    status: 'XICHENG_OBJECT_STORAGE_SMOKE_READY',
    checkedAt: freshCheckedAt(),
    summary: {
      providerSmokeCheckedAt: freshCheckedAt(),
      endpointHost: 'oss-cn-beijing.aliyuncs.com',
      requestHost: 'oss-cn-beijing.aliyuncs.com',
      bucket: 'xinghe-xunjing-prod',
      prefix: 'xinghe-xunjing/production/',
      objectKeySha256: 'a'.repeat(64),
      region: 'cn-beijing',
      pathStyle: true,
      putHttpStatus: 200,
      getHttpStatus: 200,
      deleteHttpStatus: 204,
      readBackMatches: true,
      deleted: true,
      contentSha256: 'b'.repeat(64),
      providerSmokeLatencyMs: 77
    },
    checks: passedChecks(requiredObjectStorageEvidenceChecks),
    blockers: []
  }, overrides)
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
  return evidencePath
}

async function writeRuntimeSeedEvidence(rootDir, overrides = {}) {
  const evidencePath = path.join(rootDir, 'qa/xicheng-yudao-runtime-seed-production-evidence.json')
  await mkdir(path.dirname(evidencePath), { recursive: true })
  const evidence = mergeEvidence({
    artifactType: 'xicheng-yudao-runtime-seed',
    ok: true,
    status: 'YUDAO_XICHENG_PRODUCTION_SEED_READY',
    checkedAt: freshCheckedAt(),
    summary: {
      readinessMode: 'production',
      tenantId: '1001',
      database: 'yudao_xinghe_xunjing_prod',
      client: 'container',
      packageCode: 'XICHENG-MAP-001',
      regionCode: 'beijing-xicheng',
      packageCount: 1,
      poiTotal: 80,
      poiApprovedPublished: 80,
      poiGeoReviewRequired: 0,
      poiLicenseReviewRequired: 0,
      knowledgeDocuments: 84,
      mapPoints: 80,
      qrCodes: 1,
      publicReportLocalCandidate: 1,
      publicReportProductionReady: 1,
      localCandidateReady: true,
      productionReady: true,
      productionBlockers: [],
      samplePoiCodes: ['xicheng-baitasi', 'xicheng-gongwangfu'],
      geoReviewRequiredPoiCodes: [],
      licenseReviewRequiredPoiCodes: []
    },
    checks: passedChecks(requiredRuntimeSeedEvidenceChecks),
    blockers: []
  }, overrides)
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
  return evidencePath
}

async function writeProductionSeedApplyEvidence(rootDir, {
  seedEvidencePath = path.join(rootDir, 'qa/xicheng-poi-production-seed-evidence.json'),
  runtimeSeedEvidencePath = path.join(rootDir, 'qa/xicheng-yudao-runtime-seed-production-evidence.json'),
  overrides = {}
} = {}) {
  const evidencePath = path.join(rootDir, 'qa/xicheng-yudao-production-seed-apply-evidence.json')
  await mkdir(path.dirname(evidencePath), { recursive: true })
  const seedEvidence = JSON.parse(await readFile(seedEvidencePath, 'utf8'))
  const runtimeEvidence = JSON.parse(await readFile(runtimeSeedEvidencePath, 'utf8'))
  const seedSummary = seedEvidence.summary || {}
  const runtimeSummary = runtimeEvidence.summary || {}
  const evidence = mergeEvidence({
    artifactType: 'xicheng-yudao-production-seed-apply',
    ok: true,
    status: 'YUDAO_XICHENG_PRODUCTION_SEED_APPLIED',
    checkedAt: freshCheckedAt(),
    summary: {
      seedSqlFile: seedSummary.sqlFile,
      seedSqlSha256: seedSummary.sqlSha256,
      seedEvidenceFile: seedEvidencePath,
      runtimeEvidenceFile: runtimeSeedEvidencePath,
      applyEvidenceFile: evidencePath,
      mysqlClient: 'container',
      targetTenantId: '1001',
      targetDatabase: 'yudao_xinghe_xunjing_prod',
      packageCode: 'XICHENG-MAP-001',
      regionCode: 'beijing-xicheng',
      poiCount: 80,
      reviewBatchCode: seedSummary.reviewBatchCode,
      reviewBatchEvidencePackageRef: seedSummary.reviewBatchEvidencePackageRef,
      runtimeSeedStatus: runtimeEvidence.status,
      runtimeSeedProductionReady: runtimeSummary.productionReady,
      runtimeSeedPoiTotal: runtimeSummary.poiTotal,
      runtimeSeedKnowledgeDocuments: runtimeSummary.knowledgeDocuments,
      runtimeSeedMapPoints: runtimeSummary.mapPoints
    },
    checks: passedChecks([
      'seed-evidence',
      'mysql-apply',
      'runtime-seed-production-readiness',
      'secret-redaction'
    ]),
    blockers: []
  }, overrides)
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
  return evidencePath
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('xicheng Yudao release readiness gate', () => {
  test('keeps the current repo NOT_READY for production until reviewed POI evidence exists', async () => {
    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir: process.cwd(),
      stage: 'production'
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    expect(result.checks.find((check) => check.name === 'full-yudao-baseline')?.ok).toBe(true)
    expect(result.checks.map((check) => check.name)).toContain('yudao-server-artifact')
    expect(result.checks.find((check) => check.name === 'xicheng-production-poi-evidence')?.ok).toBe(false)
    expect(result.checks.find((check) => check.name === 'xicheng-production-poi')?.detail).toContain('productionReady=true')
    expect(result.checks.find((check) => check.name === 'xicheng-source-license')?.ok).toBe(false)
    expect(result.blockers).toEqual(expect.arrayContaining([
      expect.stringContaining('Vision OCR smoke evidence is required'),
      expect.stringContaining('Object storage smoke evidence is required'),
      expect.stringContaining('POI manifest evidence is required'),
      expect.stringContaining('xicheng seed must declare productionReady=true'),
      expect.stringContaining('80 Xicheng POI rows are not fully approved')
    ]))
  }, 20000)

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
    const {
      manifestEvidencePath,
      workbookEvidencePath,
      seedEvidencePath,
      sourceCoverageEvidencePath,
      sourceReviewApplyEvidencePath,
      productionReviewApplyEvidencePath
    } = await writeProductionPoiEvidence(rootDir)
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)
    const visionOcrEvidencePath = await writeVisionOcrEvidence(rootDir)
    const objectStorageEvidencePath = await writeObjectStorageEvidence(rootDir)
    const runtimeSeedEvidencePath = await writeRuntimeSeedEvidence(rootDir)
    const productionSeedApplyEvidencePath = await writeProductionSeedApplyEvidence(rootDir, {
      seedEvidencePath,
      runtimeSeedEvidencePath
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      aiBootstrapEvidencePath,
      visionOcrEvidencePath,
      objectStorageEvidencePath,
      runtimeSeedEvidencePath,
      productionSeedApplyEvidencePath,
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(true)
    expect(result.status).toBe('PRODUCTION_READY_CANDIDATE')
    expect(result.blockers).toEqual([])
    expect(result.checks.find((check) => check.name === 'xicheng-production-poi-evidence')?.summary).toMatchObject({
      sourceCoverageEvidenceFile: sourceCoverageEvidencePath,
      sourceCoverageStatus: 'SOURCE_COVERAGE_READY',
      sourceCoverageCoveredPoiCount: 80,
      sourceCoverageUncoveredPoiCount: 0,
      sourceReviewApplyEvidenceFile: sourceReviewApplyEvidencePath,
      sourceReviewApplyStatus: 'SOURCE_REVIEW_APPLIED',
      sourceReviewAppliedPoiCount: 80,
      sourceReviewPendingSourcePoiCount: 0,
      productionReviewApplyEvidenceFile: productionReviewApplyEvidencePath,
      productionReviewApplyStatus: 'PRODUCTION_REVIEW_APPLIED',
      productionReviewAppliedPoiCount: 80,
      productionReviewPendingPoiCount: 0,
      workbookEvidenceFile: workbookEvidencePath,
      sourceWorkbookFile: path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.production-applied.csv'),
      sourceWorkbookSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      workbookReadyPoiCount: 80,
      workbookPendingPoiCount: 0,
      pendingPoiCodes: [],
      pendingPoiTasks: []
    })
    expect(result.checks.find((check) => check.name === 'vision-ocr-service')?.summary).toMatchObject({
      visionOcrEvidenceFile: visionOcrEvidencePath,
      visionOcrModel: 'xunjing-ocr-vision-prod',
      visionOcrProviderSmokeHost: 'vision.xingheai.net'
    })
    expect(result.checks.find((check) => check.name === 'object-storage')?.summary).toMatchObject({
      objectStorageEvidenceFile: objectStorageEvidencePath,
      objectStorageBucket: 'xinghe-xunjing-prod',
      objectStorageProviderSmokeHost: 'oss-cn-beijing.aliyuncs.com'
    })
    expect(result.checks.find((check) => check.name === 'xicheng-runtime-seed-evidence')?.summary).toMatchObject({
      runtimeSeedEvidenceFile: runtimeSeedEvidencePath,
      runtimeSeedReadinessMode: 'production',
      runtimeSeedProductionReady: true,
      runtimeSeedPoiTotal: 80,
      runtimeSeedKnowledgeDocuments: 84,
      runtimeSeedMapPoints: 80,
      runtimeSeedGeoReviewRequiredPoiCodes: [],
      runtimeSeedLicenseReviewRequiredPoiCodes: []
    })
    expect(result.checks.find((check) => check.name === 'xicheng-production-seed-apply')?.summary).toMatchObject({
      productionSeedApplyEvidenceFile: productionSeedApplyEvidencePath,
      productionSeedApplySeedEvidenceFile: seedEvidencePath,
      productionSeedApplyRuntimeEvidenceFile: runtimeSeedEvidencePath,
      productionSeedApplyRuntimeSeedStatus: 'YUDAO_XICHENG_PRODUCTION_SEED_READY',
      productionSeedApplyRuntimeSeedProductionReady: true
    })
    expect(result.checks.map((check) => check.name)).toEqual([
      'release-source-revision',
      'runtime-env',
      'vector-embedding-runtime',
      'https-app-api-domain',
      'real-wechat-app',
      'real-ai-provider',
      'yudao-ai-model-bootstrap',
      'vision-ocr-service',
      'object-storage',
      'full-yudao-baseline',
      'yudao-server-artifact',
      'xicheng-production-poi-evidence',
      'xicheng-runtime-seed-evidence',
      'xicheng-production-seed-apply',
      'xicheng-production-poi',
      'xicheng-source-license'
    ])
  })

  test('fails closed when POI source coverage evidence is missing', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath, sourceCoverageEvidencePath } = await writeProductionPoiEvidence(rootDir)
    await rm(sourceCoverageEvidencePath, { force: true })
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)
    const visionOcrEvidencePath = await writeVisionOcrEvidence(rootDir)
    const objectStorageEvidencePath = await writeObjectStorageEvidence(rootDir)
    const runtimeSeedEvidencePath = await writeRuntimeSeedEvidence(rootDir)
    const productionSeedApplyEvidencePath = await writeProductionSeedApplyEvidence(rootDir, {
      seedEvidencePath,
      runtimeSeedEvidencePath
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      aiBootstrapEvidencePath,
      visionOcrEvidencePath,
      objectStorageEvidencePath,
      runtimeSeedEvidencePath,
      productionSeedApplyEvidencePath,
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    const evidenceCheck = result.checks.find((check) => check.name === 'xicheng-production-poi-evidence')
    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    expect(evidenceCheck?.ok).toBe(false)
    expect(evidenceCheck?.blockers.join('\n')).toContain('POI source coverage evidence is required before production release')
  })

  test('fails closed when POI source and production review apply evidence is missing', async () => {
    const rootDir = await createProductionReadyFixture()
    const {
      manifestEvidencePath,
      workbookEvidencePath,
      seedEvidencePath,
      sourceReviewApplyEvidencePath,
      productionReviewApplyEvidencePath
    } = await writeProductionPoiEvidence(rootDir)
    await rm(sourceReviewApplyEvidencePath, { force: true })
    await rm(productionReviewApplyEvidencePath, { force: true })
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)
    const visionOcrEvidencePath = await writeVisionOcrEvidence(rootDir)
    const objectStorageEvidencePath = await writeObjectStorageEvidence(rootDir)
    const runtimeSeedEvidencePath = await writeRuntimeSeedEvidence(rootDir)
    const productionSeedApplyEvidencePath = await writeProductionSeedApplyEvidence(rootDir, {
      seedEvidencePath,
      runtimeSeedEvidencePath
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      aiBootstrapEvidencePath,
      visionOcrEvidencePath,
      objectStorageEvidencePath,
      runtimeSeedEvidencePath,
      productionSeedApplyEvidencePath,
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    const evidenceCheck = result.checks.find((check) => check.name === 'xicheng-production-poi-evidence')
    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    expect(evidenceCheck?.ok).toBe(false)
    expect(evidenceCheck?.blockers.join('\n')).toContain('POI source review apply evidence is required before production release')
    expect(evidenceCheck?.blockers.join('\n')).toContain('POI production review apply evidence is required before production release')
  })

  test('surfaces pending POI codes from source and production review apply evidence', async () => {
    const rootDir = await createProductionReadyFixture()
    const {
      manifestEvidencePath,
      workbookEvidencePath,
      seedEvidencePath
    } = await writeProductionPoiEvidence(rootDir, {
      sourceReviewApply: {
        ok: false,
        status: 'SOURCE_REVIEW_DATA_REMAINS',
        summary: {
          appliedPoiCount: 78,
          pendingSourcePoiCount: 2,
          pendingSourcePoiCodes: ['xicheng-baitasi', 'xicheng-gongwangfu']
        },
        blockers: ['2 workbook POIs still require source license review']
      },
      productionReviewApply: {
        ok: false,
        status: 'PRODUCTION_REVIEW_DATA_REMAINS',
        summary: {
          appliedPoiCount: 79,
          pendingProductionReviewPoiCount: 1,
          pendingProductionReviewPoiCodes: ['xicheng-planetarium']
        },
        blockers: ['1 workbook POI still requires production review']
      }
    })
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)
    const visionOcrEvidencePath = await writeVisionOcrEvidence(rootDir)
    const objectStorageEvidencePath = await writeObjectStorageEvidence(rootDir)
    const runtimeSeedEvidencePath = await writeRuntimeSeedEvidence(rootDir)
    const productionSeedApplyEvidencePath = await writeProductionSeedApplyEvidence(rootDir, {
      seedEvidencePath,
      runtimeSeedEvidencePath
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      aiBootstrapEvidencePath,
      visionOcrEvidencePath,
      objectStorageEvidencePath,
      runtimeSeedEvidencePath,
      productionSeedApplyEvidencePath,
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    const evidenceCheck = result.checks.find((check) => check.name === 'xicheng-production-poi-evidence')
    expect(result.status).toBe('NOT_READY')
    expect(evidenceCheck?.summary).toMatchObject({
      sourceReviewPendingSourcePoiCount: 2,
      sourceReviewPendingSourcePoiCodes: ['xicheng-baitasi', 'xicheng-gongwangfu'],
      productionReviewPendingPoiCount: 1,
      productionReviewPendingPoiCodes: ['xicheng-planetarium']
    })
  })

  test('fails closed when POI source coverage evidence still has uncovered POIs', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir, {
      sourceCoverage: {
        ok: false,
        status: 'SOURCE_COVERAGE_REVIEW_REQUIRED',
        summary: {
          coveredPoiCount: 79,
          uncoveredPoiCount: 1,
          uncoveredPoiCodes: ['xicheng-baitasi']
        },
        checks: [
          ...passedChecks(['source-review-file', 'source-pages', 'secret-redaction']),
          {
            name: 'poi-source-coverage',
            ok: false,
            detail: '1 POI names are not found in their assigned source pages',
            blockers: ['xicheng-baitasi']
          }
        ],
        blockers: ['1 POI names are not found in their assigned source pages']
      }
    })
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)
    const visionOcrEvidencePath = await writeVisionOcrEvidence(rootDir)
    const objectStorageEvidencePath = await writeObjectStorageEvidence(rootDir)
    const runtimeSeedEvidencePath = await writeRuntimeSeedEvidence(rootDir)
    const productionSeedApplyEvidencePath = await writeProductionSeedApplyEvidence(rootDir, {
      seedEvidencePath,
      runtimeSeedEvidencePath
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      aiBootstrapEvidencePath,
      visionOcrEvidencePath,
      objectStorageEvidencePath,
      runtimeSeedEvidencePath,
      productionSeedApplyEvidencePath,
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    const evidenceCheck = result.checks.find((check) => check.name === 'xicheng-production-poi-evidence')
    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    expect(evidenceCheck?.ok).toBe(false)
    expect(evidenceCheck?.blockers.join('\n')).toContain('source coverage evidence status must be SOURCE_COVERAGE_READY')
    expect(evidenceCheck?.blockers.join('\n')).toContain('source coverage evidence uncoveredPoiCount must be 0')
  })

  test('fails closed when production runtime seed evidence is missing', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)
    const visionOcrEvidencePath = await writeVisionOcrEvidence(rootDir)
    const objectStorageEvidencePath = await writeObjectStorageEvidence(rootDir)

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      aiBootstrapEvidencePath,
      visionOcrEvidencePath,
      objectStorageEvidencePath,
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    const runtimeSeedCheck = result.checks.find((check) => check.name === 'xicheng-runtime-seed-evidence')
    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    expect(runtimeSeedCheck?.ok).toBe(false)
    expect(runtimeSeedCheck?.blockers.join('\n')).toContain('Yudao runtime production seed evidence is required before production release')
  })

  test('fails closed when production seed apply evidence is missing', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)
    const visionOcrEvidencePath = await writeVisionOcrEvidence(rootDir)
    const objectStorageEvidencePath = await writeObjectStorageEvidence(rootDir)
    const runtimeSeedEvidencePath = await writeRuntimeSeedEvidence(rootDir)

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      aiBootstrapEvidencePath,
      visionOcrEvidencePath,
      objectStorageEvidencePath,
      runtimeSeedEvidencePath,
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    const seedApplyCheck = result.checks.find((check) => check.name === 'xicheng-production-seed-apply')
    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    expect(seedApplyCheck?.ok).toBe(false)
    expect(seedApplyCheck?.blockers.join('\n')).toContain('Yudao production seed apply evidence is required before production release')
  })

  test('fails closed when a git-backed release root has uncommitted changes', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)
    await initCleanGitRepo(rootDir)
    await writeFile(path.join(rootDir, 'docs-dirty-release-note.md'), 'dirty release input\n')

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      aiBootstrapEvidencePath,
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    const revisionCheck = result.checks.find((check) => check.name === 'release-source-revision')
    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    expect(revisionCheck?.ok).toBe(false)
    expect(revisionCheck?.summary).toMatchObject({
      gitAvailable: true,
      gitBranch: 'feature/xicheng-p0',
      gitDirty: true,
      gitDirtyFileCount: 1
    })
    expect(revisionCheck?.blockers.join('\n')).toContain('git worktree must be clean before release evidence generation')
  })

  test('fails closed when a git-backed release root is not on the expected handoff branch', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)
    await initCleanGitRepo(rootDir)
    runGit(rootDir, ['checkout', '-b', 'workbench/unified-release'])

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      aiBootstrapEvidencePath,
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    const revisionCheck = result.checks.find((check) => check.name === 'release-source-revision')
    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    expect(revisionCheck?.ok).toBe(false)
    expect(revisionCheck?.summary).toMatchObject({
      gitAvailable: true,
      gitBranch: 'workbench/unified-release',
      expectedGitBranch: 'feature/xicheng-p0',
      gitDirty: false
    })
    expect(revisionCheck?.blockers).toContain('git branch must be feature/xicheng-p0 before release evidence generation')
  })

  test('fails closed when the deployable Yudao server jar artifact is missing', async () => {
    const rootDir = await createProductionReadyFixture()
    const yudaoServerJarPath = path.join(rootDir, 'backend/yudao/yudao-server/target/yudao-server.jar')
    await rm(yudaoServerJarPath, { force: true })
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      aiBootstrapEvidencePath,
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    const artifactCheck = result.checks.find((check) => check.name === 'yudao-server-artifact')
    expect(artifactCheck?.ok).toBe(false)
    expect(artifactCheck?.blockers.join('\n')).toContain('Yudao server jar is missing or empty')
  })

  test('accepts an external Yudao server jar artifact path for release evidence', async () => {
    const rootDir = await createProductionReadyFixture()
    const defaultJarPath = path.join(rootDir, 'backend/yudao/yudao-server/target/yudao-server.jar')
    const externalJarPath = await writeYudaoServerJar(rootDir, 'tmp/artifacts/yudao-server.jar')
    await rm(defaultJarPath, { force: true })
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)
    const visionOcrEvidencePath = await writeVisionOcrEvidence(rootDir)
    const objectStorageEvidencePath = await writeObjectStorageEvidence(rootDir)
    const runtimeSeedEvidencePath = await writeRuntimeSeedEvidence(rootDir)
    const productionSeedApplyEvidencePath = await writeProductionSeedApplyEvidence(rootDir, {
      seedEvidencePath,
      runtimeSeedEvidencePath
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      yudaoServerJarPath: externalJarPath,
      aiBootstrapEvidencePath,
      visionOcrEvidencePath,
      objectStorageEvidencePath,
      runtimeSeedEvidencePath,
      productionSeedApplyEvidencePath,
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(true)
    const artifactCheck = result.checks.find((check) => check.name === 'yudao-server-artifact')
    expect(artifactCheck?.ok).toBe(true)
    expect(artifactCheck?.detail).toContain(externalJarPath)
    expect(artifactCheck?.summary).toMatchObject({
      yudaoServerJarFile: externalJarPath,
      yudaoServerJarSha256: sha256(await readFile(externalJarPath, 'utf8'))
    })
  })

  test('accepts a verified external Yudao baseline SQL path without committing the baseline', async () => {
    const rootDir = await createProductionReadyFixture()
    const repoBaselinePath = path.join(rootDir, 'backend/yudao/sql/mysql/ruoyi-vue-pro.sql')
    const externalBaselinePath = path.join(rootDir, 'tmp/vendor-ruoyi-vue-pro.sql')
    await rm(repoBaselinePath, { force: true })
    await mkdir(path.dirname(externalBaselinePath), { recursive: true })
    await writeFile(
      externalBaselinePath,
      [
        'CREATE TABLE `system_users` (`id` bigint);',
        'CREATE TABLE `system_tenant` (`id` bigint);',
        'CREATE TABLE `system_menu` (`id` bigint);',
        'CREATE TABLE `system_oauth2_client` (`id` bigint);',
        'CREATE TABLE `infra_api_access_log` (`id` bigint);'
      ].join('\n')
    )
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)
    const visionOcrEvidencePath = await writeVisionOcrEvidence(rootDir)
    const objectStorageEvidencePath = await writeObjectStorageEvidence(rootDir)
    const runtimeSeedEvidencePath = await writeRuntimeSeedEvidence(rootDir)
    const productionSeedApplyEvidencePath = await writeProductionSeedApplyEvidence(rootDir, {
      seedEvidencePath,
      runtimeSeedEvidencePath
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      yudaoBaselineSqlPath: externalBaselinePath,
      aiBootstrapEvidencePath,
      visionOcrEvidencePath,
      objectStorageEvidencePath,
      runtimeSeedEvidencePath,
      productionSeedApplyEvidencePath,
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(true)
    const baselineCheck = result.checks.find((check) => check.name === 'full-yudao-baseline')
    expect(baselineCheck?.ok).toBe(true)
    expect(baselineCheck?.detail).toContain(externalBaselinePath)
    expect(baselineCheck?.summary).toMatchObject({
      yudaoBaselineSqlFile: externalBaselinePath,
      yudaoBaselineSqlSha256: sha256(await readFile(externalBaselinePath, 'utf8'))
    })
  })

  test('fails closed when the Yudao baseline SQL contains raw provider credentials', async () => {
    const rootDir = await createProductionReadyFixture()
    const baselinePath = path.join(rootDir, 'backend/yudao/sql/mysql/ruoyi-vue-pro.sql')
    const cloudAccessKey = ['LT', 'AI', '1234567890ABCDEF'].join('')
    const cloudAccessSecret = ['raw', 'cloud', 'provider', 'secret'].join('-')
    const smtpAuthCode = ['SMTP', 'AUTH', 'CODE', '12345678'].join('')
    const storageConfig = JSON.stringify({
      accessKey: ['ad', 'min'].join(''),
      accessSecret: ['pass', 'word'].join('')
    })
    await appendFile(
      baselinePath,
      [
        '',
        `INSERT INTO \`system_sms_channel\` (\`api_key\`, \`api_secret\`) VALUES ('${cloudAccessKey}', '${cloudAccessSecret}');`,
        `INSERT INTO \`system_mail_account\` (\`mail\`, \`password\`) VALUES ('mail@example.com', '${smtpAuthCode}');`,
        `INSERT INTO \`infra_file_config\` (\`config\`) VALUES ('${storageConfig}');`
      ].join('\n')
    )
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      aiBootstrapEvidencePath,
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    const baselineCheck = result.checks.find((check) => check.name === 'full-yudao-baseline')
    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    expect(baselineCheck?.ok).toBe(false)
    expect(baselineCheck?.blockers.join('\n')).toContain('complete Yudao baseline SQL must not contain raw provider credentials')
  })

  test('uses the production POI seed SQL referenced by seed evidence instead of forcing the local candidate seed', async () => {
    const rootDir = await createProductionReadyFixture()
    const localCandidateSeedPath = path.join(rootDir, 'backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql')
    await writeFile(
      localCandidateSeedPath,
      [
        'INSERT INTO `xunjing_poi` VALUES',
        "(@map_package_id, 'xicheng-local-candidate-001', 'beijing-xicheng', 'Local Candidate', 'Local Candidate', '[]', 'museum', 'P0', 'Beijing Xicheng', 39.9000000, 116.3000000, 'GCJ02', JSON_OBJECT('licenseStatus','REVIEW_REQUIRED'), '{}', '{\"productionReady\":false,\"targetP0PoiCount\":80}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id);"
      ].join('\n')
    )
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir, {
      seedSource: productionSeedSql()
    })
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)
    const visionOcrEvidencePath = await writeVisionOcrEvidence(rootDir)
    const objectStorageEvidencePath = await writeObjectStorageEvidence(rootDir)
    const runtimeSeedEvidencePath = await writeRuntimeSeedEvidence(rootDir)
    const productionSeedApplyEvidencePath = await writeProductionSeedApplyEvidence(rootDir, {
      seedEvidencePath,
      runtimeSeedEvidencePath
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      aiBootstrapEvidencePath,
      visionOcrEvidencePath,
      objectStorageEvidencePath,
      runtimeSeedEvidencePath,
      productionSeedApplyEvidencePath,
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(true)
    expect(result.status).toBe('PRODUCTION_READY_CANDIDATE')
    expect(result.checks.find((check) => check.name === 'https-app-api-domain')?.summary).toMatchObject({
      appApiBaseUrl: 'https://xunjing-api.xingheai.net'
    })
    expect(result.checks.find((check) => check.name === 'xicheng-production-poi')?.ok).toBe(true)
    expect(result.checks.find((check) => check.name === 'xicheng-source-license')?.ok).toBe(true)
  })

  test('fails closed when Yudao AI default model bootstrap evidence is missing', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    const aiCheck = result.checks.find((check) => check.name === 'yudao-ai-model-bootstrap')
    expect(aiCheck?.ok).toBe(false)
    expect(aiCheck?.blockers).toContain('Yudao AI bootstrap evidence is required before production release')
  })

  test('fails closed when Yudao AI bootstrap evidence lacks provider smoke proof', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir, {
      checks: passedChecks(['ai-api-key-upsert', 'default-chat-model-upsert', 'secret-redaction'])
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      aiBootstrapEvidencePath,
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    const aiCheck = result.checks.find((check) => check.name === 'yudao-ai-model-bootstrap')
    expect(aiCheck?.blockers).toContain('AI bootstrap evidence must include ai-provider-smoke')
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
      'POI workbook evidence is required before production release',
      'POI source coverage evidence is required before production release',
      'POI source review apply evidence is required before production release',
      'POI production review apply evidence is required before production release',
      'POI seed SQL evidence is required before production release'
    ])
  })

  test('fails closed when workbook readiness evidence is missing before Yudao release approval', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)

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
    expect(evidenceCheck?.blockers.join('\n')).toContain('POI workbook evidence is required before production release')
  })

  test('fails closed when workbook evidence lacks row-level ready POI progress', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir, {
      workbook: {
        summary: {
          workbookReadyPoiCount: undefined,
          workbookPendingPoiCount: undefined,
          pendingPoiCodes: undefined
        }
      }
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    const evidenceCheck = result.checks.find((check) => check.name === 'xicheng-production-poi-evidence')
    expect(evidenceCheck?.blockers.join('\n')).toContain('workbook evidence must prove 80 ready POI rows')
    expect(evidenceCheck?.blockers.join('\n')).toContain('workbook evidence must prove there are no pending POI rows')
  })

  test('fails closed when workbook evidence lacks pending task proof', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir, {
      workbook: {
        summary: {
          pendingPoiTasks: undefined
        }
      }
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    const evidenceCheck = result.checks.find((check) => check.name === 'xicheng-production-poi-evidence')
    expect(evidenceCheck?.blockers.join('\n')).toContain('workbook evidence must prove there are no pending POI tasks')
  })

  test('fails closed when workbook evidence does not match manifest source workbook provenance', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir, {
      workbook: {
        summary: {
          workbookFile: path.join(rootDir, 'workbench/other-xicheng-production-pois.review-workbook.csv'),
          workbookSha256: '0'.repeat(64)
        }
      }
    })

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv(),
      rootDir,
      stage: 'production',
      poiManifestEvidencePath: manifestEvidencePath,
      poiWorkbookEvidencePath: workbookEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    const evidenceCheck = result.checks.find((check) => check.name === 'xicheng-production-poi-evidence')
    expect(evidenceCheck?.blockers.join('\n')).toContain('workbook and manifest sourceWorkbookFile must match')
    expect(evidenceCheck?.blockers.join('\n')).toContain('workbook and manifest sourceWorkbookSha256 must match')
  })

  test('fails closed when seed evidence was generated before seed precondition guard existed', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir, {
      seed: {
        checks: passedChecks(requiredSeedEvidenceChecks.filter((name) => name !== 'seed-preconditions'))
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
    expect(evidenceCheck?.blockers.join('\n')).toContain('seed evidence must include seed-preconditions')
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
    expect(evidenceCheck?.blockers.join('\n')).toContain('seed evidence must include source-license-evidence')
  })

  test('fails closed when POI evidence was generated before review batch gates existed', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir, {
      manifest: {
        summary: {
          reviewBatchCode: undefined,
          reviewBatchEvidencePackageRef: undefined
        },
        checks: passedChecks(requiredManifestEvidenceChecks.filter((name) => name !== 'manifest-review-batch'))
      },
      seed: {
        summary: {
          reviewBatchCode: undefined,
          reviewBatchEvidencePackageRef: undefined
        },
        checks: passedChecks(requiredSeedEvidenceChecks.filter((name) => name !== 'review-batch-metrics'))
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
    expect(evidenceCheck?.blockers.join('\n')).toContain('manifest evidence must include manifest-review-batch')
    expect(evidenceCheck?.blockers.join('\n')).toContain('manifest evidence reviewBatchCode is required')
    expect(evidenceCheck?.blockers.join('\n')).toContain('manifest evidence reviewBatchEvidencePackageRef must be a non-local evidence package reference')
    expect(evidenceCheck?.blockers.join('\n')).toContain('seed evidence must include review-batch-metrics')
    expect(evidenceCheck?.blockers.join('\n')).toContain('seed evidence reviewBatchCode is required')
    expect(evidenceCheck?.blockers.join('\n')).toContain('seed evidence reviewBatchEvidencePackageRef must be a non-local evidence package reference')
  })

  test('fails closed when seed evidence does not declare the Xicheng region and package', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir, {
      seed: {
        summary: {
          regionCode: undefined,
          packageCode: undefined
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
    expect(evidenceCheck?.blockers.join('\n')).toContain('seed evidence regionCode must be beijing-xicheng')
    expect(evidenceCheck?.blockers.join('\n')).toContain('seed evidence packageCode must be XICHENG-MAP-001')
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

  test('fails closed when POI evidence is missing source file hash metadata', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir, {
      seed: {
        summary: {
          sqlFile: path.join(rootDir, 'workbench/xicheng-poi-production-seed.sql'),
          sqlSha256: undefined,
          poiCount: 80,
          minPoiCount: 80,
          productionReady: true,
          poiSeedCount: 80,
          targetP0PoiCount: 80
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
    expect(evidenceCheck?.blockers.join('\n')).toContain('seed evidence sqlSha256 must be a sha256 hex digest')
  })

  test('fails closed when POI evidence hash does not match its source file', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir, {
      manifest: {
        summary: {
          manifestFile: path.join(rootDir, 'workbench/xicheng-production-pois.json'),
          manifestSha256: '0'.repeat(64),
          regionCode: 'beijing-xicheng',
          packageCode: 'XICHENG-MAP-001',
          totalPoiCount: 80,
          targetPoiCount: 80,
          productionReady: true
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
    expect(evidenceCheck?.blockers.join('\n')).toContain('manifest evidence manifestSha256 must match manifestFile content')
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
      totalChecks: 16,
      appApiBaseUrl: 'http://127.0.0.1:48080',
      runtimeEnvFingerprintMode: 'redacted-runtime-env-v1',
      runtimeEnvRequiredKeyCount: expect.any(Number),
      runtimeEnvPresentKeyCount: expect.any(Number),
      runtimeEnvNonSecretSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      runtimeEnvSecretPresenceSha256: expect.stringMatching(/^[a-f0-9]{64}$/)
    })
    expect(evidence.blockers.join('\n')).toContain('SPRING_PROFILES_ACTIVE must be production')
    expect(JSON.stringify(evidence)).not.toContain('prod-db-password')
    expect(JSON.stringify(evidence)).not.toContain('replace-with-real-vision-key')
  })

  test('CLI accepts an external Yudao baseline SQL path for production release evidence', async () => {
    const rootDir = await createProductionReadyFixture()
    const repoBaselinePath = path.join(rootDir, 'backend/yudao/sql/mysql/ruoyi-vue-pro.sql')
    const externalBaselinePath = path.join(rootDir, 'tmp/vendor-ruoyi-vue-pro.sql')
    await rm(repoBaselinePath, { force: true })
    await mkdir(path.dirname(externalBaselinePath), { recursive: true })
    await writeFile(
      externalBaselinePath,
      [
        'CREATE TABLE `system_users` (`id` bigint);',
        'CREATE TABLE `system_tenant` (`id` bigint);',
        'CREATE TABLE `system_menu` (`id` bigint);',
        'CREATE TABLE `system_oauth2_client` (`id` bigint);',
        'CREATE TABLE `infra_api_access_log` (`id` bigint);'
      ].join('\n')
    )
    const envPath = await writeEnvFile(rootDir, productionEnv())
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)
    const visionOcrEvidencePath = await writeVisionOcrEvidence(rootDir)
    const objectStorageEvidencePath = await writeObjectStorageEvidence(rootDir)
    const runtimeSeedEvidencePath = await writeRuntimeSeedEvidence(rootDir)
    const productionSeedApplyEvidencePath = await writeProductionSeedApplyEvidence(rootDir, {
      seedEvidencePath,
      runtimeSeedEvidencePath
    })
    const evidenceRelativePath = 'qa/xicheng-yudao-release-evidence.json'
    const evidencePath = path.join(rootDir, evidenceRelativePath)

    const result = spawnSync(process.execPath, [
      path.resolve('scripts/verify-xicheng-yudao-release-readiness.mjs'),
      '--root', rootDir,
      '--stage', 'production',
      '--env-file', envPath,
      '--yudao-baseline-sql', externalBaselinePath,
      '--yudao-server-jar', path.join(rootDir, 'backend/yudao/yudao-server/target/yudao-server.jar'),
      '--ai-bootstrap-evidence', aiBootstrapEvidencePath,
      '--vision-ocr-evidence', visionOcrEvidencePath,
      '--object-storage-evidence', objectStorageEvidencePath,
      '--runtime-seed-evidence', runtimeSeedEvidencePath,
      '--production-seed-apply-evidence', productionSeedApplyEvidencePath,
      '--poi-manifest-evidence', manifestEvidencePath,
      '--poi-workbook-evidence', workbookEvidencePath,
      '--poi-seed-evidence', seedEvidencePath,
      '--evidence-file', evidenceRelativePath
    ], {
      cwd: process.cwd(),
      encoding: 'utf8'
    })

    expect(result.status).toBe(0)
    const evidence = JSON.parse(await readFile(evidencePath, 'utf8'))
    expect(evidence.status).toBe('PRODUCTION_READY_CANDIDATE')
    expect(evidence.summary).toMatchObject({
      yudaoBaselineSqlFile: externalBaselinePath,
      yudaoBaselineSqlSha256: sha256(await readFile(externalBaselinePath, 'utf8')),
      yudaoServerJarFile: path.join(rootDir, 'backend/yudao/yudao-server/target/yudao-server.jar'),
      aiBootstrapEvidenceFile: aiBootstrapEvidencePath,
      aiBootstrapModel: 'qwen-plus',
      visionOcrEvidenceFile: visionOcrEvidencePath,
      visionOcrModel: 'xunjing-ocr-vision-prod',
      visionOcrProviderSmokeHost: 'vision.xingheai.net',
      objectStorageEvidenceFile: objectStorageEvidencePath,
      objectStorageBucket: 'xinghe-xunjing-prod',
      objectStorageProviderSmokeHost: 'oss-cn-beijing.aliyuncs.com',
      runtimeSeedEvidenceFile: runtimeSeedEvidencePath,
      runtimeSeedReadinessMode: 'production',
      runtimeSeedProductionReady: true,
      productionSeedApplyEvidenceFile: productionSeedApplyEvidencePath,
      productionSeedApplyRuntimeEvidenceFile: runtimeSeedEvidencePath,
      productionSeedApplyRuntimeSeedStatus: 'YUDAO_XICHENG_PRODUCTION_SEED_READY',
      manifestEvidenceFile: manifestEvidencePath,
      workbookEvidenceFile: workbookEvidencePath,
      seedEvidenceFile: seedEvidencePath,
      poiManifestFile: path.join(rootDir, 'workbench/xicheng-production-pois.json'),
      poiManifestSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      sourceWorkbookFile: path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.production-applied.csv'),
      sourceWorkbookSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      poiSeedSqlFile: path.join(rootDir, 'workbench/xicheng-poi-production-seed.sql'),
      poiSeedSqlSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      workbookReadyPoiCount: 80,
      workbookPendingPoiCount: 0,
      pendingPoiCodes: [],
      pendingPoiTasks: [],
      runtimeEnvFingerprintMode: 'redacted-runtime-env-v1',
      runtimeEnvRequiredKeyCount: expect.any(Number),
      runtimeEnvPresentKeyCount: expect.any(Number),
      runtimeEnvNonSecretSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      runtimeEnvSecretPresenceSha256: expect.stringMatching(/^[a-f0-9]{64}$/)
    })
    expect(evidence.checks.find((check) => check.name === 'full-yudao-baseline')?.detail).toContain(externalBaselinePath)
  })

  test('CLI release evidence records clean git source revision metadata', async () => {
    const rootDir = await createProductionReadyFixture()
    const envPath = await writeEnvFile(rootDir, productionEnv())
    const { manifestEvidencePath, workbookEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)
    const aiBootstrapEvidencePath = await writeAiBootstrapEvidence(rootDir)
    const visionOcrEvidencePath = await writeVisionOcrEvidence(rootDir)
    const objectStorageEvidencePath = await writeObjectStorageEvidence(rootDir)
    const runtimeSeedEvidencePath = await writeRuntimeSeedEvidence(rootDir)
    const productionSeedApplyEvidencePath = await writeProductionSeedApplyEvidence(rootDir, {
      seedEvidencePath,
      runtimeSeedEvidencePath
    })
    const gitCommit = initCleanGitRepo(rootDir)
    const evidenceRelativePath = 'qa/xicheng-yudao-release-evidence.json'
    const evidencePath = path.join(rootDir, evidenceRelativePath)

    const result = spawnSync(process.execPath, [
      path.resolve('scripts/verify-xicheng-yudao-release-readiness.mjs'),
      '--root', rootDir,
      '--stage', 'production',
      '--env-file', envPath,
      '--ai-bootstrap-evidence', aiBootstrapEvidencePath,
      '--vision-ocr-evidence', visionOcrEvidencePath,
      '--object-storage-evidence', objectStorageEvidencePath,
      '--runtime-seed-evidence', runtimeSeedEvidencePath,
      '--production-seed-apply-evidence', productionSeedApplyEvidencePath,
      '--poi-manifest-evidence', manifestEvidencePath,
      '--poi-workbook-evidence', workbookEvidencePath,
      '--poi-seed-evidence', seedEvidencePath,
      '--evidence-file', evidenceRelativePath
    ], {
      cwd: process.cwd(),
      encoding: 'utf8'
    })

    expect(result.status).toBe(0)
    const evidence = JSON.parse(await readFile(evidencePath, 'utf8'))
    expect(evidence.summary).toMatchObject({
      gitAvailable: true,
      gitBranch: 'feature/xicheng-p0',
      gitCommit,
      gitDirty: false,
      gitDirtyFileCount: 0
    })
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
    const statusDoc = await readFile('docs/04_AI交接任务书/西城P0后台上线状态.md', 'utf8')

    expect(packageJson.scripts['xunjing:yudao:release:gate']).toBe(
      'node scripts/verify-xicheng-yudao-release-readiness.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:yudao:release:gate')
    expect(deployDoc).toContain('PRODUCTION_READY_CANDIDATE')
    expect(deployDoc).toContain('SPRING_AI_VECTORSTORE_TYPE')
    expect(deployDoc).toContain('SPRING_AI_MODEL_EMBEDDING')
    expect(deployDoc).toContain('DASHSCOPE_EMBEDDING_ENABLED')
    expect(deployDoc).toContain('--yudao-baseline-sql')
    expect(deployDoc).toContain('YUDAO_BASELINE_SQL')
    expect(deployDoc).toContain('--yudao-server-jar')
    expect(deployDoc).toContain('YUDAO_SERVER_JAR')
    expect(deployDoc).toContain('--poi-workbook-evidence')
    expect(deployDoc).toContain('workbookReadyPoiCount')
    expect(deployDoc).toContain('workbookPendingPoiCount')
    expect(deployDoc).toContain('pendingPoiTasks')
    expect(deployDoc).toContain('release evidence summary 会直接提升这些行级 POI 完成数')
    expect(deployDoc).toContain('release-source-revision')
    expect(deployDoc).toContain('summary.gitCommit')
    expect(deployDoc).toContain('--expected-branch feature/xicheng-p0')
    expect(deployDoc).toContain('summary.expectedGitBranch')
    expect(deployDoc).toContain('runtimeEnvFingerprintMode')
    expect(deployDoc).toContain('runtimeEnvNonSecretSha256')
    expect(statusDoc).toContain('workbookReadyPoiCount')
    expect(statusDoc).toContain('workbookPendingPoiCount')
    expect(statusDoc).toContain('pendingPoiTasks')
    expect(statusDoc).toContain('package summary 里直接展示 workbook 行级完成数')
    expect(statusDoc).toContain('release-source-revision')
    expect(statusDoc).toContain('summary.gitCommit')
    expect(statusDoc).toContain('--expected-branch feature/xicheng-p0')
    expect(statusDoc).toContain('runtimeEnvFingerprintMode')
    expect(deployDoc).toContain('seed evidence 的 `summary.sqlFile`')
    expect(deployDoc).toContain('sourceWorkbookSha256')
    expect(deployDoc).toContain('poiManifestSha256')
    expect(deployDoc).toContain('poiSeedSqlSha256')
  })

  test('fails closed when manifest evidence lacks source workbook provenance', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir, {
      manifest: {
        summary: {
          sourceWorkbookFile: undefined,
          sourceWorkbookSha256: undefined
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
    expect(evidenceCheck?.blockers.join('\n')).toContain('manifest source workbook evidence sourceWorkbookFile is required')
  })

  test('fails closed when production vector store or embedding runtime is disabled', async () => {
    const rootDir = await createProductionReadyFixture()
    const { manifestEvidencePath, seedEvidencePath } = await writeProductionPoiEvidence(rootDir)

    const result = await verifyXichengYudaoReleaseReadiness({
      env: productionEnv({
        SPRING_AI_VECTORSTORE_TYPE: 'none',
        SPRING_AI_MODEL_EMBEDDING: 'none',
        DASHSCOPE_EMBEDDING_ENABLED: 'false'
      }),
      rootDir,
      stage: 'production',
      poiManifestEvidencePath: manifestEvidencePath,
      poiSeedEvidencePath: seedEvidencePath
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe('NOT_READY')
    const vectorCheck = result.checks.find((check) => check.name === 'vector-embedding-runtime')
    expect(vectorCheck?.ok).toBe(false)
    expect(vectorCheck?.blockers).toEqual(expect.arrayContaining([
      'SPRING_AI_VECTORSTORE_TYPE must be qdrant for production',
      'SPRING_AI_MODEL_EMBEDDING must enable a real embedding provider for production',
      'DASHSCOPE_EMBEDDING_ENABLED must be true for production embeddings'
    ]))
  })
})
