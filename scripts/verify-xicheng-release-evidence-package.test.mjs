import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

const tempDirs = []
const freshCheckedAt = () => new Date().toISOString()
const staleCheckedAt = () => new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()

async function createTempRoot() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'xicheng-release-evidence-package-'))
  tempDirs.push(rootDir)
  return rootDir
}

async function writeJson(rootDir, relativePath, value) {
  const filePath = path.join(rootDir, relativePath)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
  return filePath
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
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
  runGit(rootDir, ['config', 'user.name', 'Xicheng Package Test'])
  runGit(rootDir, ['config', 'user.email', 'xicheng-package@example.com'])
  runGit(rootDir, ['add', '.'])
  runGit(rootDir, ['commit', '-m', 'fixture'])
  return runGit(rootDir, ['rev-parse', 'HEAD'])
}

function mergeEvidence(base, overrides) {
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

async function writePoiSourceFiles(rootDir) {
  const manifestFile = path.join(rootDir, 'workbench/xicheng-production-pois.json')
  const workbookFile = path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.csv')
  const sourceAppliedWorkbookFile = path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.source-applied.csv')
  const sqlFile = path.join(rootDir, 'workbench/xicheng-poi-production-seed.sql')
  const manifestSource = `${JSON.stringify({
    regionCode: 'beijing-xicheng',
    packageCode: 'XICHENG-MAP-001',
    productionReady: true,
    targetP0PoiCount: 80,
    pois: Array.from({ length: 80 }, (_, index) => ({
      poiCode: `xicheng-prod-poi-${String(index + 1).padStart(3, '0')}`
    }))
  }, null, 2)}\n`
  const sqlSource = [
    '/* Generated from reviewed Xicheng POI production manifest. */',
    'INSERT INTO `xunjing_poi` VALUES',
    Array.from({ length: 80 }, (_, index) => {
      return `(@map_package_id, 'xicheng-prod-poi-${String(index + 1).padStart(3, '0')}')`
    }).join(',\n'),
    ';'
  ].join('\n')
  const workbookSource = [
    'poiCode,name,licenseStatus,photoEvidenceStatus,triggerSmokeStatus',
    ...Array.from({ length: 80 }, (_, index) => {
      return `xicheng-prod-poi-${String(index + 1).padStart(3, '0')},Xicheng Production POI ${index + 1},APPROVED,APPROVED,PASSED`
    })
  ].join('\n')
  await mkdir(path.dirname(manifestFile), { recursive: true })
  await writeFile(manifestFile, manifestSource)
  await writeFile(sourceAppliedWorkbookFile, `${workbookSource}\n`)
  await writeFile(workbookFile, workbookSource)
  await writeFile(sqlFile, sqlSource)
  return {
    manifestFile,
    manifestSha256: sha256(manifestSource),
    sourceAppliedWorkbookFile,
    sourceAppliedWorkbookSha256: sha256(`${workbookSource}\n`),
    workbookFile,
    workbookSha256: sha256(workbookSource),
    sqlFile,
    sqlSha256: sha256(sqlSource)
  }
}

async function writeYudaoBaselineFile(rootDir) {
  const baselineFile = path.join(rootDir, 'tmp/vendor-ruoyi-vue-pro.sql')
  const baselineSource = [
    'CREATE TABLE `system_users` (`id` bigint);',
    'CREATE TABLE `system_tenant` (`id` bigint);',
    'CREATE TABLE `system_menu` (`id` bigint);',
    'CREATE TABLE `system_oauth2_client` (`id` bigint);',
    'CREATE TABLE `infra_api_access_log` (`id` bigint);'
  ].join('\n')
  await mkdir(path.dirname(baselineFile), { recursive: true })
  await writeFile(baselineFile, baselineSource)
  return {
    baselineFile,
    baselineSha256: sha256(baselineSource)
  }
}

async function writeYudaoServerJarFile(rootDir) {
  const jarFile = path.join(rootDir, 'tmp/artifacts/yudao-server.jar')
  const jarSource = 'PK\u0003\u0004xicheng-yudao-server-build-artifact\n'
  await mkdir(path.dirname(jarFile), { recursive: true })
  await writeFile(jarFile, jarSource)
  return {
    jarFile,
    jarSha256: sha256(jarSource),
    jarSizeBytes: Buffer.byteLength(jarSource)
  }
}

async function writeYudaoServerBuildEvidenceFile(rootDir, serverJar, overrides = {}) {
  return writeJson(rootDir, 'qa/xicheng-yudao-server-build-evidence.json', {
    artifactType: 'xicheng-yudao-server-build',
    ok: true,
    status: 'YUDAO_SERVER_JAR_BUILT',
    checkedAt: freshCheckedAt(),
    summary: {
      buildMethod: 'mvn',
      backendDir: path.join(rootDir, 'backend/yudao'),
      mavenCommand: 'mvn',
      mavenArgs: ['--batch-mode', '--no-transfer-progress', '-pl', 'yudao-server', '-am', '-DskipTests', 'package'],
      testsIncluded: false,
      jarFile: serverJar.jarFile,
      jarSizeBytes: serverJar.jarSizeBytes,
      jarSha256: serverJar.jarSha256,
      ...(overrides.summary || {})
    },
    checks: [
      { name: 'maven-package', ok: true },
      { name: 'yudao-server-jar', ok: true }
    ],
    blockers: [],
    ...(overrides.evidence || {})
  })
}

async function writeReleaseEvidenceFile(rootDir, overrides = {}) {
  const baseline = await writeYudaoBaselineFile(rootDir)
  const serverJar = await writeYudaoServerJarFile(rootDir)
  await writeYudaoServerBuildEvidenceFile(rootDir, serverJar, overrides.yudaoServerBuildEvidence || {})
  const poiSources = await writePoiSourceFiles(rootDir)
  await writeSourceCoverageEvidenceFile(rootDir)
  await writeSourceReviewApplyEvidenceFile(rootDir)
  await writeProductionReviewApplyEvidenceFile(rootDir)
  return writeJson(rootDir, 'qa/xicheng-yudao-release-evidence.json', releaseEvidence({
    ...overrides,
    summary: {
      yudaoBaselineSqlFile: baseline.baselineFile,
      yudaoBaselineSqlSha256: baseline.baselineSha256,
      yudaoServerJarFile: serverJar.jarFile,
      yudaoServerJarSha256: serverJar.jarSha256,
      yudaoServerJarSizeBytes: serverJar.jarSizeBytes,
      yudaoServerBuildEvidenceFile: path.join(rootDir, 'qa/xicheng-yudao-server-build-evidence.json'),
      yudaoServerBuildMethod: 'mvn',
      yudaoServerBuildJarFile: serverJar.jarFile,
      yudaoServerBuildJarSha256: serverJar.jarSha256,
      yudaoServerBuildJarSizeBytes: serverJar.jarSizeBytes,
      manifestEvidenceFile: path.join(rootDir, 'qa/xicheng-poi-manifest-evidence.json'),
      workbookEvidenceFile: path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json'),
      seedEvidenceFile: path.join(rootDir, 'qa/xicheng-poi-production-seed-evidence.json'),
      sourceCoverageEvidenceFile: path.join(rootDir, 'qa/xicheng-poi-source-coverage-evidence.json'),
      sourceCoverageStatus: 'SOURCE_COVERAGE_READY',
      sourceCoverageSourceGroupCount: 2,
      sourceCoveragePoiCount: 80,
      sourceCoverageCoveredPoiCount: 80,
      sourceCoverageUncoveredPoiCount: 0,
      sourceCoverageUncoveredPoiCodes: [],
      sourceReviewApplyEvidenceFile: path.join(rootDir, 'qa/xicheng-poi-source-review-apply-evidence.json'),
      sourceReviewApplyStatus: 'SOURCE_REVIEW_APPLIED',
      sourceReviewAppliedPoiCount: 80,
      sourceReviewPendingSourcePoiCount: 0,
      productionReviewApplyEvidenceFile: path.join(rootDir, 'qa/xicheng-poi-production-review-apply-evidence.json'),
      productionReviewApplyStatus: 'PRODUCTION_REVIEW_APPLIED',
      productionReviewAppliedPoiCount: 80,
      productionReviewPendingPoiCount: 0,
      productionReviewTriggerSmokeApplyEvidenceFile: path.join(rootDir, 'qa/xicheng-poi-trigger-smoke-apply-evidence.json'),
      productionReviewTriggerSmokeApplyStatus: 'TRIGGER_SMOKE_APPLIED',
      productionReviewTriggerSmokeAppliedPoiCount: 80,
      productionReviewTriggerSmokePendingPoiCount: 0,
      aiBootstrapEvidenceFile: path.join(rootDir, 'qa/xicheng-yudao-ai-bootstrap-evidence.json'),
      aiBootstrapModel: 'qwen-plus',
      aiBootstrapProviderSmokeHost: 'dashscope.aliyuncs.com',
      qdrantEvidenceFile: path.join(rootDir, 'qa/xicheng-qdrant-smoke-evidence.json'),
      qdrantProviderSmokeHost: 'xunjing-prod-qdrant.internal:6333',
      qdrantProviderSmokeEndpointPath: '/collections',
      qdrantTextCollection: 'xinghe_xunjing_text_production',
      qdrantImageCollection: 'xinghe_xunjing_image_production',
      qdrantTextCollectionHttpStatus: 200,
      qdrantImageCollectionHttpStatus: 200,
      qdrantTextCollectionStatus: 'green',
      qdrantImageCollectionStatus: 'green',
      embeddingEvidenceFile: path.join(rootDir, 'qa/xicheng-embedding-smoke-evidence.json'),
      embeddingProviderSmokeHost: 'dashscope.aliyuncs.com',
      embeddingProviderSmokeEndpointPath: '/compatible-mode/v1/embeddings',
      embeddingProviderSmokeModel: 'text-embedding-v3',
      embeddingProviderSmokeHttpStatus: 200,
      embeddingVectorDimensions: 1536,
      embeddingFiniteValueCount: 1536,
      visionOcrEvidenceFile: path.join(rootDir, 'qa/xicheng-vision-ocr-smoke-evidence.json'),
      visionOcrModel: 'qwen-vl-plus',
      visionOcrProviderSmokeHost: 'dashscope.aliyuncs.com',
      objectStorageEvidenceFile: path.join(rootDir, 'qa/xicheng-object-storage-smoke-evidence.json'),
      objectStorageBucket: 'xinghe-xunjing-prod',
      objectStorageProviderSmokeHost: 'oss-cn-beijing.aliyuncs.com',
      objectStoragePutHttpStatus: 200,
      objectStorageGetHttpStatus: 200,
      objectStorageDeleteHttpStatus: 204,
      objectStorageReadBackMatches: true,
      objectStorageDeleted: true,
      runtimeSeedEvidenceFile: path.join(rootDir, 'qa/xicheng-yudao-runtime-seed-production-evidence.json'),
      runtimeSeedReadinessMode: 'production',
      runtimeSeedProductionReady: true,
      runtimeSeedLocalCandidateReady: true,
      runtimeSeedPoiTotal: 80,
      runtimeSeedPoiApprovedPublished: 80,
      runtimeSeedKnowledgeDocuments: 84,
      runtimeSeedMapPoints: 80,
      runtimeSeedGeoReviewRequired: 0,
      runtimeSeedLicenseReviewRequired: 0,
      runtimeSeedProductionBlockerCount: 0,
      productionSeedApplyEvidenceFile: path.join(rootDir, 'qa/xicheng-yudao-production-seed-apply-evidence.json'),
      productionSeedApplySeedSqlFile: poiSources.sqlFile,
      productionSeedApplySeedSqlSha256: poiSources.sqlSha256,
      productionSeedApplySeedEvidenceFile: path.join(rootDir, 'qa/xicheng-poi-production-seed-evidence.json'),
      productionSeedApplyRuntimeEvidenceFile: path.join(rootDir, 'qa/xicheng-yudao-runtime-seed-production-evidence.json'),
      productionSeedApplyTargetTenantId: '1001',
      productionSeedApplyTargetDatabase: 'yudao_xinghe_xunjing_prod',
      productionSeedApplyPackageCode: 'XICHENG-MAP-001',
      productionSeedApplyRegionCode: 'beijing-xicheng',
      productionSeedApplyRuntimeSeedStatus: 'YUDAO_XICHENG_PRODUCTION_SEED_READY',
      productionSeedApplyRuntimeSeedProductionReady: true,
      productionSeedApplyRuntimeSeedPoiTotal: 80,
      productionSeedApplyRuntimeSeedKnowledgeDocuments: 84,
      productionSeedApplyRuntimeSeedMapPoints: 80,
      poiManifestFile: poiSources.manifestFile,
      poiManifestSha256: poiSources.manifestSha256,
      sourceWorkbookFile: poiSources.workbookFile,
      sourceWorkbookSha256: poiSources.workbookSha256,
      poiSeedSqlFile: poiSources.sqlFile,
      poiSeedSqlSha256: poiSources.sqlSha256,
      ...(overrides.summary || {})
    }
  }))
}

async function writeManifestEvidenceFile(rootDir, overrides = {}) {
  const sources = await writePoiSourceFiles(rootDir)
  await writeJson(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json', workbookEvidence({
    summary: {
      workbookFile: sources.workbookFile,
      workbookSha256: sources.workbookSha256
    }
  }))
  return writeJson(rootDir, 'qa/xicheng-poi-manifest-evidence.json', manifestEvidence({
    ...overrides,
    summary: {
      manifestFile: sources.manifestFile,
      manifestSha256: sources.manifestSha256,
      sourceWorkbookFile: sources.workbookFile,
      sourceWorkbookSha256: sources.workbookSha256,
      ...(overrides.summary || {})
    }
  }))
}

async function writeWorkbookEvidenceFile(rootDir, overrides = {}) {
  const sources = await writePoiSourceFiles(rootDir)
  return writeJson(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json', workbookEvidence({
    ...overrides,
    summary: {
      workbookFile: sources.workbookFile,
      workbookSha256: sources.workbookSha256,
      ...(overrides.summary || {})
    }
  }))
}

async function writeSeedEvidenceFile(rootDir, overrides = {}) {
  const sources = await writePoiSourceFiles(rootDir)
  return writeJson(rootDir, 'qa/xicheng-poi-production-seed-evidence.json', seedEvidence({
    ...overrides,
    summary: {
      sqlFile: sources.sqlFile,
      sqlSha256: sources.sqlSha256,
      ...(overrides.summary || {})
    }
  }))
}

async function writeSourceCoverageEvidenceFile(rootDir, overrides = {}) {
  return writeJson(rootDir, 'qa/xicheng-poi-source-coverage-evidence.json', sourceCoverageEvidence(overrides))
}

async function writeSourceReviewApplyEvidenceFile(rootDir, overrides = {}) {
  const sources = await writePoiSourceFiles(rootDir)
  return writeJson(rootDir, 'qa/xicheng-poi-source-review-apply-evidence.json', mergeEvidence({
    artifactType: 'xicheng-poi-source-review-apply',
    ok: true,
    status: 'SOURCE_REVIEW_APPLIED',
    checkedAt: freshCheckedAt(),
    summary: {
      workbookFile: sources.workbookFile,
      sourceReviewFile: path.join(rootDir, 'workbench/xicheng-poi-source-review-summary.csv'),
      sourceCoverageEvidenceFile: path.join(rootDir, 'qa/xicheng-poi-source-coverage-evidence.json'),
      sourceCoverageStatus: 'SOURCE_COVERAGE_READY',
      sourceCoverageCoveredPoiCount: 80,
      sourceCoverageUncoveredPoiCount: 0,
      outputFile: sources.sourceAppliedWorkbookFile,
      evidenceFile: path.join(rootDir, 'qa/xicheng-poi-source-review-apply-evidence.json'),
      workbookRows: 80,
      sourceReviewRows: 2,
      approvedSourceGroupCount: 2,
      appliedPoiCount: 80,
      pendingSourcePoiCount: 0,
      pendingSourcePoiCodes: [],
      outputSha256: sources.sourceAppliedWorkbookSha256
    },
    blockers: []
  }, overrides))
}

async function writeProductionReviewApplyEvidenceFile(rootDir, overrides = {}) {
  const sources = await writePoiSourceFiles(rootDir)
  return writeJson(rootDir, 'qa/xicheng-poi-production-review-apply-evidence.json', mergeEvidence({
    artifactType: 'xicheng-poi-production-review-apply',
    ok: true,
    status: 'PRODUCTION_REVIEW_APPLIED',
    checkedAt: freshCheckedAt(),
    summary: {
      workbookFile: sources.sourceAppliedWorkbookFile,
      productionReviewFile: path.join(rootDir, 'workbench/xicheng-poi-production-review-summary.csv'),
      sourceReviewApplyEvidenceFile: path.join(rootDir, 'qa/xicheng-poi-source-review-apply-evidence.json'),
      sourceReviewApplyStatus: 'SOURCE_REVIEW_APPLIED',
      sourceReviewAppliedPoiCount: 80,
      sourceReviewPendingSourcePoiCount: 0,
      sourceCoverageStatus: 'SOURCE_COVERAGE_READY',
      sourceCoverageUncoveredPoiCount: 0,
      triggerSmokeApplyEvidenceFile: path.join(rootDir, 'qa/xicheng-poi-trigger-smoke-apply-evidence.json'),
      triggerSmokeApplyStatus: 'TRIGGER_SMOKE_APPLIED',
      triggerSmokeAppliedPoiCount: 80,
      triggerSmokePendingPoiCount: 0,
      outputFile: sources.workbookFile,
      evidenceFile: path.join(rootDir, 'qa/xicheng-poi-production-review-apply-evidence.json'),
      workbookRows: 80,
      productionReviewRows: 80,
      approvedReviewRowCount: 80,
      appliedPoiCount: 80,
      pendingProductionReviewPoiCount: 0,
      pendingProductionReviewPoiCodes: [],
      outputSha256: sources.workbookSha256
    },
    blockers: []
  }, overrides))
}

function releaseEvidence(overrides = {}) {
  return mergeEvidence({
    artifactType: 'xicheng-yudao-release-readiness',
    ok: true,
    status: 'PRODUCTION_READY_CANDIDATE',
    stage: 'production',
    checkedAt: freshCheckedAt(),
    summary: {
      stage: 'production',
      status: 'PRODUCTION_READY_CANDIDATE',
      totalChecks: 19,
      passedChecks: 19,
      failedChecks: 0,
      blockerCount: 0,
      gitAvailable: true,
      gitBranch: 'feature/xicheng-p0',
      gitCommit: 'a'.repeat(40),
      gitDirty: false,
      gitDirtyFileCount: 0,
      appApiBaseUrl: 'https://xunjing-api.xingheai.net',
      runtimeEnvFingerprintMode: 'redacted-runtime-env-v1',
      runtimeEnvRequiredKeyCount: 40,
      runtimeEnvPresentKeyCount: 40,
      runtimeEnvNonSecretSha256: 'b'.repeat(64),
      runtimeEnvSecretPresenceSha256: 'c'.repeat(64)
    },
    checks: [
      { name: 'release-source-revision', ok: true },
      { name: 'runtime-env', ok: true },
      { name: 'vector-embedding-runtime', ok: true },
      { name: 'embedding-provider-smoke', ok: true },
      { name: 'https-app-api-domain', ok: true },
      { name: 'real-wechat-app', ok: true },
      { name: 'real-ai-provider', ok: true },
      { name: 'yudao-ai-model-bootstrap', ok: true },
      { name: 'qdrant-vector-store', ok: true },
      { name: 'vision-ocr-service', ok: true },
      { name: 'object-storage', ok: true },
      { name: 'full-yudao-baseline', ok: true },
      { name: 'yudao-server-artifact', ok: true },
      { name: 'yudao-server-build-evidence', ok: true },
      { name: 'xicheng-production-poi-evidence', ok: true },
      { name: 'xicheng-runtime-seed-evidence', ok: true },
      { name: 'xicheng-production-seed-apply', ok: true },
      { name: 'xicheng-production-poi', ok: true },
      { name: 'xicheng-source-license', ok: true }
    ],
    blockers: [],
  }, overrides)
}

function manifestEvidence(overrides = {}) {
  return mergeEvidence({
    artifactType: 'xicheng-poi-production-manifest-readiness',
    ok: true,
    status: 'PRODUCTION_POI_MANIFEST_READY',
    checkedAt: freshCheckedAt(),
    summary: {
      regionCode: 'beijing-xicheng',
      packageCode: 'XICHENG-MAP-001',
      totalPoiCount: 80,
      targetPoiCount: 80,
      productionReady: true,
      reviewBatchCode: 'xicheng-p0-poi-review-20260627',
      reviewBatchEvidencePackageRef: 'oss://xunjing-review/xicheng/review-batches/xicheng-p0-poi-review-20260627.zip'
    },
    checks: [
      { name: 'manifest-shape', ok: true },
      { name: 'manifest-production-flags', ok: true },
      { name: 'manifest-review-batch', ok: true },
      { name: 'poi-count', ok: true },
      { name: 'poi-identity', ok: true },
      { name: 'poi-coordinates', ok: true },
      { name: 'poi-triggers', ok: true },
      { name: 'poi-source-license', ok: true },
      { name: 'poi-field-evidence', ok: true },
      { name: 'poi-content', ok: true },
      { name: 'poi-audit', ok: true }
    ],
    blockers: [],
  }, overrides)
}

function workbookEvidence(overrides = {}) {
  return mergeEvidence({
    artifactType: 'xicheng-poi-review-workbook-readiness',
    ok: true,
    status: 'XICHENG_POI_REVIEW_WORKBOOK_READY',
    checkedAt: freshCheckedAt(),
    summary: {
      workbookRows: 80,
      minPoiCount: 80,
      categoryCount: 8,
      placeholderCount: 0,
      workbookReadyPoiCount: 80,
      workbookPendingPoiCount: 0,
      pendingPoiCodes: [],
      pendingPoiTasks: []
    },
    checks: [
      { name: 'workbook-file', ok: true },
      { name: 'workbook-shape', ok: true },
      { name: 'poi-count', ok: true },
      { name: 'poi-identity', ok: true },
      { name: 'poi-source-license', ok: true },
      { name: 'poi-field-evidence', ok: true },
      { name: 'poi-content-audit', ok: true },
      { name: 'no-placeholder-cells', ok: true }
    ],
    blockers: [],
  }, overrides)
}

function seedEvidence(overrides = {}) {
  return mergeEvidence({
    artifactType: 'xicheng-poi-production-seed-readiness',
    ok: true,
    status: 'PRODUCTION_POI_SEED_READY',
    checkedAt: freshCheckedAt(),
    summary: {
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
    checks: [
      { name: 'sql-file', ok: true },
      { name: 'seed-shape', ok: true },
      { name: 'seed-preconditions', ok: true },
      { name: 'poi-count', ok: true },
      { name: 'poi-approval', ok: true },
      { name: 'production-metrics', ok: true },
      { name: 'review-batch-metrics', ok: true },
      { name: 'field-evidence', ok: true },
      { name: 'source-license-evidence', ok: true },
      { name: 'source-documents', ok: true }
    ],
    blockers: [],
  }, overrides)
}

function sourceCoverageEvidence(overrides = {}) {
  return mergeEvidence({
    artifactType: 'xicheng-poi-source-coverage',
    ok: true,
    status: 'SOURCE_COVERAGE_READY',
    checkedAt: freshCheckedAt(),
    summary: {
      sourceReviewFile: 'workbench/xicheng-poi-source-review-summary.csv',
      sourceReviewRows: 2,
      sourceGroupCount: 2,
      poiCount: 80,
      coveredPoiCount: 80,
      uncoveredPoiCount: 0,
      uncoveredPoiCodes: [],
      sourcePageFetchMode: 'cache',
      sourcePages: [
        {
          sourceUrl: 'https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html',
          fetchMode: 'cache',
          ok: true,
          sourceTextLength: 6218,
          sourceTextSha256: 'd'.repeat(64)
        },
        {
          sourceUrl: 'https://www.bjxch.gov.cn/xcfw/whfw/xxxq/pnidpv736523.html',
          fetchMode: 'cache',
          ok: true,
          sourceTextLength: 10136,
          sourceTextSha256: 'e'.repeat(64)
        }
      ],
      sourceGroups: [
        {
          sourceTitle: '3A级及以下旅游景区名录',
          sourceUrl: 'https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html',
          poiCount: 24,
          coveredPoiCount: 24,
          uncoveredPoiCount: 0,
          uncoveredPoiCodes: []
        },
        {
          sourceTitle: '西城区文物保护单位（81处）',
          sourceUrl: 'https://www.bjxch.gov.cn/xcfw/whfw/xxxq/pnidpv736523.html',
          poiCount: 56,
          coveredPoiCount: 56,
          uncoveredPoiCount: 0,
          uncoveredPoiCodes: []
        }
      ]
    },
    checks: [
      { name: 'source-review-file', ok: true },
      { name: 'source-pages', ok: true },
      { name: 'poi-source-coverage', ok: true },
      { name: 'secret-redaction', ok: true }
    ],
    blockers: [],
  }, overrides)
}

function appReadinessEvidence(overrides = {}) {
  return mergeEvidence({
    artifactType: 'xunjing-platform-readiness',
    ok: true,
    checkedAt: freshCheckedAt(),
    summary: {
      baseUrl: 'https://xunjing-api.xingheai.net',
      tenantId: '1',
      staticOnly: false,
      includeXichengAppCheck: true,
      includeXichengTriggerCheck: true,
      xichengRegionCode: 'beijing-xicheng',
      xichengPackageCode: 'XICHENG-MAP-001'
    },
    checks: [
      {
        name: 'live-xicheng-scan-resolve',
        ok: true,
        summary: {
          endpoint: '/app-api/xunjing/scan/resolve',
          tenantId: '1',
          packageCode: 'XICHENG-MAP-001',
          sceneCode: 'QR-XICHENG-MAP-001',
          targetPath: '/pages/map/detail?packageCode=XICHENG-MAP-001&sceneCode=QR-XICHENG-MAP-001'
        }
      },
      {
        name: 'live-xicheng-error-feedback',
        ok: true,
        summary: {
          endpoint: '/app-api/xunjing/resource/events',
          tenantId: '1',
          packageCode: 'XICHENG-MAP-001',
          sceneCode: 'xicheng-ai-guide',
          eventType: 'ERROR_FEEDBACK',
          eventId: 2001
        }
      },
      {
        name: 'live-xicheng-ai-chat-sourced',
        ok: true,
        summary: {
          endpoint: '/app-api/xunjing/ai/chat',
          tenantId: '1',
          regionCode: 'beijing-xicheng',
          packageCode: 'XICHENG-MAP-001',
          sceneCode: 'xicheng-ai-guide',
          poiCode: 'xicheng-baitasi',
          poiName: '妙应寺白塔',
          contextEcho: true,
          safetyStatus: 'PASSED',
          sourceCount: 1,
          logId: 2101
        }
      },
      {
        name: 'live-xicheng-ai-chat-blocked',
        ok: true,
        summary: {
          endpoint: '/app-api/xunjing/ai/chat',
          tenantId: '1',
          regionCode: 'beijing-xicheng',
          packageCode: 'XICHENG-MAP-001',
          sceneCode: 'xicheng-ai-guide',
          poiCode: 'xicheng-source-guard-negative',
          poiName: '来源门禁测试点位',
          contextEcho: true,
          safetyStatus: 'BLOCKED',
          sourceCount: 0,
          logId: 2102
        }
      },
      {
        name: 'live-xicheng-trigger-baitasi',
        ok: true,
        summary: {
          endpoint: '/app-api/xunjing/triggers/resolve',
          tenantId: '1',
          packageCode: 'XICHENG-MAP-001',
          regionCode: 'beijing-xicheng',
          poiCode: 'xicheng-baitasi',
          poiName: '妙应寺白塔',
          confidence: 0.92,
          requiresUserConfirm: false,
          sourceCount: 1,
          targetPath: '/pages/ai-guide/detail?regionCode=beijing-xicheng&poiCode=xicheng-baitasi&packageCode=XICHENG-MAP-001'
        }
      },
      {
        name: 'live-xicheng-trigger-gongwangfu',
        ok: true,
        summary: {
          endpoint: '/app-api/xunjing/triggers/resolve',
          tenantId: '1',
          packageCode: 'XICHENG-MAP-001',
          regionCode: 'beijing-xicheng',
          poiCode: 'xicheng-gongwangfu',
          poiName: '恭王府',
          confidence: 0.92,
          requiresUserConfirm: false,
          sourceCount: 1,
          targetPath: '/pages/ai-guide/detail?regionCode=beijing-xicheng&poiCode=xicheng-gongwangfu&packageCode=XICHENG-MAP-001'
        }
      },
      {
        name: 'live-xicheng-trigger-planetarium',
        ok: true,
        summary: {
          endpoint: '/app-api/xunjing/triggers/resolve',
          tenantId: '1',
          packageCode: 'XICHENG-MAP-001',
          regionCode: 'beijing-xicheng',
          poiCode: 'xicheng-planetarium',
          poiName: '北京天文馆',
          confidence: 0.92,
          requiresUserConfirm: false,
          sourceCount: 1,
          targetPath: '/pages/ai-guide/detail?regionCode=beijing-xicheng&poiCode=xicheng-planetarium&packageCode=XICHENG-MAP-001'
        }
      }
    ],
  }, overrides)
}

function readArgValue(args, name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

function runPackageGate(args, options = {}) {
  const resolvedArgs = [...args]
  const rootDir = readArgValue(resolvedArgs, '--root')
  if (
    !options.withoutDefaultWorkbookEvidence &&
    rootDir &&
    !resolvedArgs.includes('--poi-workbook-evidence')
  ) {
    resolvedArgs.push(
      '--poi-workbook-evidence',
      path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json')
    )
  }
  if (
    !options.withoutDefaultSourceCoverageEvidence &&
    rootDir &&
    !resolvedArgs.includes('--poi-source-coverage-evidence')
  ) {
    resolvedArgs.push(
      '--poi-source-coverage-evidence',
      path.join(rootDir, 'qa/xicheng-poi-source-coverage-evidence.json')
    )
  }
  if (
    !options.withoutDefaultSourceReviewApplyEvidence &&
    rootDir &&
    !resolvedArgs.includes('--poi-source-review-apply-evidence')
  ) {
    resolvedArgs.push(
      '--poi-source-review-apply-evidence',
      path.join(rootDir, 'qa/xicheng-poi-source-review-apply-evidence.json')
    )
  }
  if (
    !options.withoutDefaultProductionReviewApplyEvidence &&
    rootDir &&
    !resolvedArgs.includes('--poi-production-review-apply-evidence')
  ) {
    resolvedArgs.push(
      '--poi-production-review-apply-evidence',
      path.join(rootDir, 'qa/xicheng-poi-production-review-apply-evidence.json')
    )
  }
  return spawnSync(process.execPath, [
    path.resolve('scripts/verify-xicheng-release-evidence-package.mjs'),
    ...resolvedArgs
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 8
  })
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop(), { recursive: true, force: true })
  }
})

describe('xicheng release evidence package gate', () => {
  test('accepts a complete production release evidence package and writes package evidence', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const workbookPath = path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json')
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const sourceCoveragePath = await writeSourceCoverageEvidenceFile(rootDir)
    const sourceReviewApplyPath = await writeSourceReviewApplyEvidenceFile(rootDir)
    const productionReviewApplyPath = await writeProductionReviewApplyEvidenceFile(rootDir)
    const yudaoServerBuildPath = path.join(rootDir, 'qa/xicheng-yudao-server-build-evidence.json')
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'qa/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-workbook-evidence', workbookPath,
      '--poi-seed-evidence', seedPath,
      '--poi-source-coverage-evidence', sourceCoveragePath,
      '--poi-source-review-apply-evidence', sourceReviewApplyPath,
      '--poi-production-review-apply-evidence', productionReviewApplyPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'qa/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report.artifactType).toBe('xicheng-release-evidence-package')
    expect(report.status).toBe('XICHENG_RELEASE_EVIDENCE_PACKAGE_READY')
    expect(report.summary).toMatchObject({
      stage: 'production',
      releaseStatus: 'PRODUCTION_READY_CANDIDATE',
      yudaoServerBuildStatus: 'YUDAO_SERVER_JAR_BUILT',
      yudaoServerBuildMethod: 'mvn',
      poiWorkbookStatus: 'XICHENG_POI_REVIEW_WORKBOOK_READY',
      poiSourceCoverageStatus: 'SOURCE_COVERAGE_READY',
      poiSourceReviewApplyStatus: 'SOURCE_REVIEW_APPLIED',
      poiProductionReviewApplyStatus: 'PRODUCTION_REVIEW_APPLIED',
      appReadinessCheckCount: 7,
      xichengRegionCode: 'beijing-xicheng',
      xichengPackageCode: 'XICHENG-MAP-001',
      reviewBatchCode: 'xicheng-p0-poi-review-20260627',
      releaseEvidenceFile: releasePath,
      yudaoServerBuildEvidenceFile: yudaoServerBuildPath,
      poiManifestEvidenceFile: manifestPath,
      poiWorkbookEvidenceFile: workbookPath,
      poiSeedEvidenceFile: seedPath,
      poiSourceCoverageEvidenceFile: sourceCoveragePath,
      poiSourceReviewApplyEvidenceFile: sourceReviewApplyPath,
      poiProductionReviewApplyEvidenceFile: productionReviewApplyPath,
      appReadinessEvidenceFile: appPath,
      sourceWorkbookFile: path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.csv'),
      sourceWorkbookSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      workbookReadyPoiCount: 80,
      workbookPendingPoiCount: 0,
      sourceCoverageCoveredPoiCount: 80,
      sourceCoverageUncoveredPoiCount: 0,
      sourceReviewAppliedPoiCount: 80,
      sourceReviewPendingSourcePoiCount: 0,
      productionReviewAppliedPoiCount: 80,
      productionReviewPendingPoiCount: 0,
      productionReviewTriggerSmokeApplyStatus: 'TRIGGER_SMOKE_APPLIED',
      productionReviewTriggerSmokeAppliedPoiCount: 80,
      productionReviewTriggerSmokePendingPoiCount: 0,
      pendingPoiCodes: [],
      pendingPoiTasks: [],
      blockerCount: 0
    })
    const releaseEvidenceText = await readFile(releasePath, 'utf8')
    const yudaoServerBuildEvidenceText = await readFile(yudaoServerBuildPath, 'utf8')
    const manifestEvidenceText = await readFile(manifestPath, 'utf8')
    const workbookEvidenceText = await readFile(workbookPath, 'utf8')
    const seedEvidenceText = await readFile(seedPath, 'utf8')
    const sourceCoverageEvidenceText = await readFile(sourceCoveragePath, 'utf8')
    const sourceReviewApplyEvidenceText = await readFile(sourceReviewApplyPath, 'utf8')
    const productionReviewApplyEvidenceText = await readFile(productionReviewApplyPath, 'utf8')
    const appEvidenceText = await readFile(appPath, 'utf8')
    expect(report.evidenceFileSha256).toMatchObject({
      release: sha256(releaseEvidenceText),
      yudaoServerBuild: sha256(yudaoServerBuildEvidenceText),
      poiManifest: sha256(manifestEvidenceText),
      poiWorkbook: sha256(workbookEvidenceText),
      poiSeed: sha256(seedEvidenceText),
      poiSourceCoverage: sha256(sourceCoverageEvidenceText),
      poiSourceReviewApply: sha256(sourceReviewApplyEvidenceText),
      poiProductionReviewApply: sha256(productionReviewApplyEvidenceText),
      appReadiness: sha256(appEvidenceText)
    })
    expect(report.checks.map((check) => check.name)).toEqual([
      'release-gate-evidence',
      'yudao-server-build-evidence',
      'package-source-revision',
      'poi-manifest-evidence',
      'poi-workbook-evidence',
      'poi-seed-evidence',
      'poi-source-coverage-evidence',
      'poi-source-review-apply-evidence',
      'poi-production-review-apply-evidence',
      'app-readiness-evidence',
      'evidence-consistency',
      'secret-safety'
    ])
    expect(report.blockers).toEqual([])
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('XICHENG_RELEASE_EVIDENCE_PACKAGE_READY')
  })

  test('fails closed when workbook readiness evidence is missing before packaging', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ], { withoutDefaultWorkbookEvidence: true })

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.checks.map((check) => check.name)).toContain('poi-workbook-evidence')
    expect(report.blockers.join('\n')).toContain('workbook evidence is required')
  })

  test('fails closed when POI source coverage evidence is missing before packaging', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ], { withoutDefaultSourceCoverageEvidence: true })

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.checks.map((check) => check.name)).toContain('poi-source-coverage-evidence')
    expect(report.blockers.join('\n')).toContain('source coverage evidence is required')
  })

  test('fails closed when POI review apply evidence is missing before packaging', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const workbookPath = path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json')
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const sourceCoveragePath = await writeSourceCoverageEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-workbook-evidence', workbookPath,
      '--poi-seed-evidence', seedPath,
      '--poi-source-coverage-evidence', sourceCoveragePath,
      '--app-readiness-evidence', appPath
    ], {
      withoutDefaultSourceReviewApplyEvidence: true,
      withoutDefaultProductionReviewApplyEvidence: true
    })

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.checks.map((check) => check.name)).toContain('poi-source-review-apply-evidence')
    expect(report.checks.map((check) => check.name)).toContain('poi-production-review-apply-evidence')
    expect(report.blockers.join('\n')).toContain('source review apply evidence is required')
    expect(report.blockers.join('\n')).toContain('production review apply evidence is required')
  })

  test('fails closed when POI production review apply evidence lacks passed trigger smoke apply summary', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const workbookPath = path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json')
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const sourceCoveragePath = await writeSourceCoverageEvidenceFile(rootDir)
    const sourceReviewApplyPath = await writeSourceReviewApplyEvidenceFile(rootDir)
    const productionReviewApplyPath = await writeProductionReviewApplyEvidenceFile(rootDir, {
      summary: {
        triggerSmokeApplyEvidenceFile: undefined,
        triggerSmokeApplyStatus: 'TRIGGER_SMOKE_APPLY_REMAINS',
        triggerSmokeAppliedPoiCount: 79,
        triggerSmokePendingPoiCount: 1
      }
    })
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-workbook-evidence', workbookPath,
      '--poi-seed-evidence', seedPath,
      '--poi-source-coverage-evidence', sourceCoveragePath,
      '--poi-source-review-apply-evidence', sourceReviewApplyPath,
      '--poi-production-review-apply-evidence', productionReviewApplyPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.checks.map((check) => check.name)).toContain('poi-production-review-apply-evidence')
    expect(report.blockers.join('\n')).toContain('production review apply evidence triggerSmokeApplyEvidenceFile is required')
    expect(report.blockers.join('\n')).toContain('production review apply evidence triggerSmokeApplyStatus must be TRIGGER_SMOKE_APPLIED')
    expect(report.blockers.join('\n')).toContain('production review apply evidence triggerSmokeAppliedPoiCount must be at least 80')
    expect(report.blockers.join('\n')).toContain('production review apply evidence triggerSmokePendingPoiCount must be 0')
  })

  test('fails closed when POI source coverage evidence still has uncovered POIs', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const sourceCoveragePath = await writeSourceCoverageEvidenceFile(rootDir, {
      ok: false,
      status: 'SOURCE_COVERAGE_REVIEW_REQUIRED',
      summary: {
        coveredPoiCount: 79,
        uncoveredPoiCount: 1,
        uncoveredPoiCodes: ['xicheng-baitasi']
      },
      checks: [
        { name: 'source-review-file', ok: true },
        { name: 'source-pages', ok: true },
        { name: 'poi-source-coverage', ok: false },
        { name: 'secret-redaction', ok: true }
      ],
      blockers: ['1 POI names are not found in their assigned source pages']
    })
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-source-coverage-evidence', sourceCoveragePath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.blockers.join('\n')).toContain('source coverage evidence status must be SOURCE_COVERAGE_READY')
    expect(report.blockers.join('\n')).toContain('source coverage evidence uncoveredPoiCount must be 0')
    expect(report.blockers.join('\n')).toContain('source coverage evidence check poi-source-coverage must be ok')
  })

  test('fails closed when workbook evidence does not match manifest workbook provenance', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const otherWorkbookFile = path.join(rootDir, 'workbench/xicheng-other-review-workbook.csv')
    const otherWorkbookText = 'poiCode,name\nxicheng-other,Other workbook\n'
    await writeFile(otherWorkbookFile, otherWorkbookText)
    const workbookPath = await writeWorkbookEvidenceFile(rootDir, {
      summary: {
        workbookFile: otherWorkbookFile,
        workbookSha256: sha256(otherWorkbookText)
      }
    })

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-workbook-evidence', workbookPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.blockers.join('\n')).toContain('workbook and manifest sourceWorkbookFile must match')
    expect(report.blockers.join('\n')).toContain('workbook and manifest sourceWorkbookSha256 must match')
  })

  test('fails closed when workbook evidence lacks reviewed row and placeholder metrics', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const workbookPath = await writeWorkbookEvidenceFile(rootDir, {
      summary: {
        workbookRows: undefined,
        minPoiCount: undefined,
        categoryCount: 7,
        placeholderCount: 1
      }
    })
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-workbook-evidence', workbookPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.blockers.join('\n')).toContain('workbook evidence must prove at least 80 reviewed POI rows')
    expect(report.blockers.join('\n')).toContain('workbook evidence must prove at least 8 POI categories')
    expect(report.blockers.join('\n')).toContain('workbook evidence placeholderCount must be 0')
  })

  test('fails closed when workbook evidence lacks row-level ready POI progress', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const workbookPath = await writeWorkbookEvidenceFile(rootDir, {
      summary: {
        workbookReadyPoiCount: undefined,
        workbookPendingPoiCount: undefined,
        pendingPoiCodes: undefined
      }
    })
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-workbook-evidence', workbookPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.blockers.join('\n')).toContain('workbook evidence must prove 80 ready POI rows')
    expect(report.blockers.join('\n')).toContain('workbook evidence must prove there are no pending POI rows')
  })

  test('fails closed when workbook evidence lacks pending task proof', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const workbookPath = await writeWorkbookEvidenceFile(rootDir, {
      summary: {
        pendingPoiTasks: undefined
      }
    })
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-workbook-evidence', workbookPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.blockers.join('\n')).toContain('workbook evidence must prove there are no pending POI tasks')
  })

  test('fails closed when POI evidence was generated before field evidence gates existed', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir, {
      checks: [
        { name: 'manifest-shape', ok: true },
        { name: 'manifest-production-flags', ok: true },
        { name: 'poi-count', ok: true },
        { name: 'poi-identity', ok: true },
        { name: 'poi-coordinates', ok: true },
        { name: 'poi-triggers', ok: true },
        { name: 'poi-source-license', ok: true },
        { name: 'poi-content', ok: true },
        { name: 'poi-audit', ok: true }
      ]
    })
    const seedPath = await writeSeedEvidenceFile(rootDir, {
      checks: [
        { name: 'sql-file', ok: true },
        { name: 'seed-shape', ok: true },
        { name: 'poi-count', ok: true },
        { name: 'poi-approval', ok: true },
        { name: 'production-metrics', ok: true },
        { name: 'source-documents', ok: true }
      ]
    })
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('manifest evidence must include poi-field-evidence')
    expect(evidence.blockers.join('\n')).toContain('seed evidence must include seed-preconditions')
    expect(evidence.blockers.join('\n')).toContain('seed evidence must include field-evidence')
    expect(evidence.blockers.join('\n')).toContain('seed evidence must include source-license-evidence')
  })

  test('fails closed when POI evidence was generated before review batch gates existed', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir, {
      summary: {
        reviewBatchCode: undefined,
        reviewBatchEvidencePackageRef: undefined
      },
      checks: [
        { name: 'manifest-shape', ok: true },
        { name: 'manifest-production-flags', ok: true },
        { name: 'poi-count', ok: true },
        { name: 'poi-identity', ok: true },
        { name: 'poi-coordinates', ok: true },
        { name: 'poi-triggers', ok: true },
        { name: 'poi-source-license', ok: true },
        { name: 'poi-field-evidence', ok: true },
        { name: 'poi-content', ok: true },
        { name: 'poi-audit', ok: true }
      ]
    })
    const seedPath = await writeSeedEvidenceFile(rootDir, {
      summary: {
        reviewBatchCode: undefined,
        reviewBatchEvidencePackageRef: undefined
      },
      checks: [
        { name: 'sql-file', ok: true },
        { name: 'seed-shape', ok: true },
        { name: 'seed-preconditions', ok: true },
        { name: 'poi-count', ok: true },
        { name: 'poi-approval', ok: true },
        { name: 'production-metrics', ok: true },
        { name: 'field-evidence', ok: true },
        { name: 'source-license-evidence', ok: true },
        { name: 'source-documents', ok: true }
      ]
    })
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('manifest evidence must include manifest-review-batch')
    expect(evidence.blockers.join('\n')).toContain('manifest evidence reviewBatchCode is required')
    expect(evidence.blockers.join('\n')).toContain('manifest evidence reviewBatchEvidencePackageRef must be a non-local evidence package reference')
    expect(evidence.blockers.join('\n')).toContain('seed evidence must include review-batch-metrics')
    expect(evidence.blockers.join('\n')).toContain('seed evidence reviewBatchCode is required')
    expect(evidence.blockers.join('\n')).toContain('seed evidence reviewBatchEvidencePackageRef must be a non-local evidence package reference')
  })

  test('fails closed when manifest evidence does not expose source workbook provenance', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir, {
      summary: {
        sourceWorkbookFile: undefined,
        sourceWorkbookSha256: undefined
      }
    })
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('manifest source workbook evidence sourceWorkbookFile is required')
  })

  test('fails closed when release evidence was generated before vector embedding gate existed', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      summary: {
        totalChecks: 10,
        passedChecks: 10
      },
      checks: [
        { name: 'runtime-env', ok: true },
        { name: 'https-app-api-domain', ok: true },
        { name: 'real-wechat-app', ok: true },
        { name: 'real-ai-provider', ok: true },
        { name: 'vision-ocr-service', ok: true },
        { name: 'object-storage', ok: true },
        { name: 'full-yudao-baseline', ok: true },
        { name: 'xicheng-production-poi-evidence', ok: true },
        { name: 'xicheng-production-poi', ok: true },
        { name: 'xicheng-source-license', ok: true }
      ]
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.blockers.join('\n')).toContain('release evidence must include vector-embedding-runtime')
  })

  test('fails closed when release evidence lacks deployable Yudao server jar metadata', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      summary: {
        yudaoServerJarFile: undefined,
        yudaoServerJarSha256: undefined,
        yudaoServerJarSizeBytes: undefined
      },
      checks: [
        { name: 'runtime-env', ok: true },
        { name: 'vector-embedding-runtime', ok: true },
        { name: 'https-app-api-domain', ok: true },
        { name: 'real-wechat-app', ok: true },
        { name: 'real-ai-provider', ok: true },
        { name: 'vision-ocr-service', ok: true },
        { name: 'object-storage', ok: true },
        { name: 'full-yudao-baseline', ok: true },
        { name: 'xicheng-production-poi-evidence', ok: true },
        { name: 'xicheng-production-poi', ok: true },
        { name: 'xicheng-source-license', ok: true }
      ]
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.blockers.join('\n')).toContain('release evidence must include yudao-server-artifact')
    expect(report.blockers.join('\n')).toContain('release evidence yudaoServerJarSha256 must be a sha256 hex digest')
    expect(report.blockers.join('\n')).toContain('release evidence yudaoServerJarFile is required')
  })

  test('fails closed when release evidence lacks Yudao server build evidence metadata', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      summary: {
        yudaoServerBuildEvidenceFile: undefined,
        yudaoServerBuildMethod: undefined,
        yudaoServerBuildJarFile: undefined,
        yudaoServerBuildJarSha256: undefined,
        yudaoServerBuildJarSizeBytes: undefined
      },
      checks: releaseEvidence().checks.filter((check) => check.name !== 'yudao-server-build-evidence')
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.blockers.join('\n')).toContain('release evidence must include yudao-server-build-evidence')
    expect(report.blockers.join('\n')).toContain('release evidence yudaoServerBuildEvidenceFile is required')
    expect(report.blockers.join('\n')).toContain('release evidence yudaoServerBuildJarSha256 must match yudaoServerJarSha256')
  })

  test('fails closed when Yudao server build evidence file is missing from final package inputs', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    await rm(path.join(rootDir, 'qa/xicheng-yudao-server-build-evidence.json'), { force: true })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.blockers.join('\n')).toContain('Yudao server build evidence cannot be read')
  })

  test('fails closed when APP, manifest and seed evidence do not describe the same Xicheng batch', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir, {
      summary: {
        reviewBatchCode: 'xicheng-p0-poi-review-20260628',
        reviewBatchEvidencePackageRef: 'oss://xunjing-review/xicheng/review-batches/xicheng-p0-poi-review-20260628.zip'
      }
    })
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.checks.map((check) => check.name)).toContain('evidence-consistency')
    expect(evidence.blockers.join('\n')).toContain(
      'manifest and seed evidence reviewBatchCode must match'
    )
  })

  test('fails closed when release evidence does not identify the POI evidence files it gated', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      summary: {
        manifestEvidenceFile: undefined,
        workbookEvidenceFile: undefined,
        seedEvidenceFile: undefined
      }
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.blockers.join('\n')).toContain('release evidence manifestEvidenceFile is required')
    expect(report.blockers.join('\n')).toContain('release evidence workbookEvidenceFile is required')
    expect(report.blockers.join('\n')).toContain('release evidence seedEvidenceFile is required')
  })

  test('fails closed when release evidence omits AI embedding OCR and object storage smoke summaries', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      summary: {
        aiBootstrapEvidenceFile: undefined,
        aiBootstrapModel: undefined,
        aiBootstrapProviderSmokeHost: undefined,
        embeddingEvidenceFile: undefined,
        embeddingProviderSmokeHost: undefined,
        embeddingProviderSmokeEndpointPath: undefined,
        embeddingProviderSmokeModel: undefined,
        embeddingProviderSmokeHttpStatus: undefined,
        embeddingVectorDimensions: undefined,
        embeddingFiniteValueCount: undefined,
        visionOcrEvidenceFile: undefined,
        visionOcrModel: undefined,
        visionOcrProviderSmokeHost: undefined,
        objectStorageEvidenceFile: undefined,
        objectStorageBucket: undefined,
        objectStorageProviderSmokeHost: undefined,
        objectStoragePutHttpStatus: undefined,
        objectStorageGetHttpStatus: undefined,
        objectStorageDeleteHttpStatus: undefined,
        objectStorageReadBackMatches: undefined,
        objectStorageDeleted: undefined
      }
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.blockers.join('\n')).toContain('release evidence aiBootstrapEvidenceFile is required')
    expect(report.blockers.join('\n')).toContain('release evidence embeddingEvidenceFile is required')
    expect(report.blockers.join('\n')).toContain('release evidence embeddingProviderSmokeHttpStatus must be 200')
    expect(report.blockers.join('\n')).toContain('release evidence embeddingVectorDimensions must be greater than 0')
    expect(report.blockers.join('\n')).toContain('release evidence visionOcrEvidenceFile is required')
    expect(report.blockers.join('\n')).toContain('release evidence objectStorageEvidenceFile is required')
    expect(report.blockers.join('\n')).toContain('release evidence objectStoragePutHttpStatus must be 2xx')
    expect(report.blockers.join('\n')).toContain('release evidence objectStorageReadBackMatches must be true')
  })

  test('fails closed when release evidence omits runtime seed summary', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      summary: {
        runtimeSeedEvidenceFile: undefined,
        runtimeSeedReadinessMode: undefined,
        runtimeSeedProductionReady: undefined,
        runtimeSeedLocalCandidateReady: undefined,
        runtimeSeedPoiTotal: undefined,
        runtimeSeedPoiApprovedPublished: undefined,
        runtimeSeedKnowledgeDocuments: undefined,
        runtimeSeedMapPoints: undefined,
        runtimeSeedGeoReviewRequired: undefined,
        runtimeSeedLicenseReviewRequired: undefined,
        runtimeSeedProductionBlockerCount: undefined
      },
      checks: releaseEvidence().checks.filter((check) => check.name !== 'xicheng-runtime-seed-evidence')
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.blockers.join('\n')).toContain('release evidence must include xicheng-runtime-seed-evidence')
    expect(report.blockers.join('\n')).toContain('release evidence runtimeSeedEvidenceFile is required')
    expect(report.blockers.join('\n')).toContain('release evidence runtimeSeedProductionReady must be true')
  })

  test('fails closed when release evidence references different POI evidence files than the package inputs', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      summary: {
        manifestEvidenceFile: path.join(rootDir, 'qa/other-xicheng-poi-manifest-evidence.json'),
        workbookEvidenceFile: path.join(rootDir, 'qa/other-xicheng-poi-review-workbook-evidence.json'),
        seedEvidenceFile: path.join(rootDir, 'qa/other-xicheng-poi-production-seed-evidence.json')
      }
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.blockers.join('\n')).toContain('release and package manifest evidence file must match')
    expect(report.blockers.join('\n')).toContain('release and package workbook evidence file must match')
    expect(report.blockers.join('\n')).toContain('release and package seed evidence file must match')
  })

  test('fails closed when release evidence POI source hashes do not match package inputs', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      summary: {
        poiManifestFile: path.join(rootDir, 'workbench/xicheng-production-pois.json'),
        poiManifestSha256: 'b'.repeat(64),
        sourceWorkbookFile: path.join(rootDir, 'workbench/xicheng-production-pois.review-workbook.csv'),
        sourceWorkbookSha256: 'c'.repeat(64),
        poiSeedSqlFile: path.join(rootDir, 'workbench/xicheng-poi-production-seed.sql'),
        poiSeedSqlSha256: 'd'.repeat(64)
      }
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('NOT_READY')
    expect(report.blockers.join('\n')).toContain('release and package poiManifestSha256 must match')
    expect(report.blockers.join('\n')).toContain('release and package sourceWorkbookSha256 must match')
    expect(report.blockers.join('\n')).toContain('release and package poiSeedSqlSha256 must match')
  })

  test('fails closed when release evidence lacks Yudao baseline hash metadata', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      summary: {
        yudaoBaselineSqlFile: undefined,
        yudaoBaselineSqlSha256: undefined
      }
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('release evidence yudaoBaselineSqlSha256 must be a sha256 hex digest')
    expect(evidence.blockers.join('\n')).toContain('release evidence yudaoBaselineSqlFile is required')
  })

  test('fails closed when release evidence lacks git source revision metadata', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      summary: {
        gitAvailable: undefined,
        gitBranch: undefined,
        gitCommit: undefined,
        gitDirty: undefined,
        gitDirtyFileCount: undefined
      },
      checks: releaseEvidence().checks.filter((check) => check.name !== 'release-source-revision')
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('release evidence must include release-source-revision')
    expect(evidence.blockers.join('\n')).toContain('release evidence summary.gitCommit must be a 40-character git commit SHA')
  })

  test('fails closed when release evidence lacks runtime env fingerprint metadata', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      summary: {
        runtimeEnvFingerprintMode: undefined,
        runtimeEnvRequiredKeyCount: undefined,
        runtimeEnvPresentKeyCount: undefined,
        runtimeEnvNonSecretSha256: undefined,
        runtimeEnvSecretPresenceSha256: undefined
      }
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.blockers.join('\n')).toContain('release evidence runtimeEnvFingerprintMode must be redacted-runtime-env-v1')
    expect(evidence.blockers.join('\n')).toContain('release evidence runtimeEnvNonSecretSha256 must be a sha256 hex digest')
    expect(evidence.blockers.join('\n')).toContain('release evidence runtimeEnvSecretPresenceSha256 must be a sha256 hex digest')
  })

  test('fails closed when release evidence git commit does not match the package checkout', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      summary: {
        gitCommit: '0'.repeat(40)
      }
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const currentGitCommit = initCleanGitRepo(rootDir)
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    const revisionCheck = evidence.checks.find((check) => check.name === 'package-source-revision')
    expect(evidence.status).toBe('NOT_READY')
    expect(revisionCheck).toMatchObject({
      ok: false,
      summary: {
        packageGitCommit: currentGitCommit,
        releaseGitCommit: '0'.repeat(40)
      }
    })
    expect(evidence.blockers.join('\n')).toContain('release evidence summary.gitCommit must match current package checkout commit')
  })

  test('fails closed when POI source hash metadata is missing from package inputs', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir, {
      summary: {
        sqlSha256: undefined
      }
    })
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('seed evidence sqlSha256 must be a sha256 hex digest')
  })

  test('fails closed when POI evidence source hash does not match package input source file', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir, {
      summary: {
        manifestSha256: '0'.repeat(64)
      }
    })
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('manifest evidence manifestSha256 must match manifestFile content')
  })

  test('fails closed when production APP readiness evidence comes from a local HTTP server', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence({
      summary: {
        baseUrl: 'http://127.0.0.1:48080',
        tenantId: '1'
      }
    }))
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence baseUrl must be a non-local HTTPS URL for production')
  })

  test('fails closed when production APP readiness evidence uses a placeholder HTTPS domain', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      summary: {
        appApiBaseUrl: 'https://replace-with-production-api.example.com'
      }
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence({
      summary: {
        baseUrl: 'https://replace-with-production-api.example.com',
        tenantId: '1'
      }
    }))
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain(
      'app readiness evidence baseUrl must be a real non-placeholder HTTPS URL for production'
    )
  })

  test('fails closed when production APP readiness evidence uses a local HTTPS hostname', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      summary: {
        appApiBaseUrl: 'https://xunjing.local'
      }
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence({
      summary: {
        baseUrl: 'https://xunjing.local',
        tenantId: '1'
      }
    }))
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('release evidence appApiBaseUrl must be a non-local HTTPS URL')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence baseUrl must be a non-local HTTPS URL for production')
  })

  test('fails closed when APP readiness evidence lacks platform artifact type or tenant id', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence({
      artifactType: undefined,
      summary: {
        tenantId: undefined
      }
    }))
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence artifactType must be xunjing-platform-readiness')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence tenantId is required')
  })

  test('fails closed when app readiness evidence targets a different backend domain than release evidence', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      summary: {
        appApiBaseUrl: 'https://xunjing-api.xingheai.net'
      }
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence({
      summary: {
        baseUrl: 'https://xunjing-staging-api.xingheai.net'
      }
    }))
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain(
      'app readiness evidence baseUrl must match release evidence appApiBaseUrl'
    )
  })

  test('fails closed when APP readiness evidence was not generated with live Xicheng checks', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence({
      summary: {
        staticOnly: true,
        includeXichengAppCheck: false,
        includeXichengTriggerCheck: false
      }
    }))
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence staticOnly must be false')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence includeXichengAppCheck must be true')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence includeXichengTriggerCheck must be true')
  })

  test('fails closed when APP readiness evidence lacks live check audit summaries', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence({
      checks: [
        { name: 'live-xicheng-scan-resolve', ok: true },
        { name: 'live-xicheng-error-feedback', ok: true },
        { name: 'live-xicheng-ai-chat-sourced', ok: true },
        { name: 'live-xicheng-ai-chat-blocked', ok: true },
        { name: 'live-xicheng-trigger-baitasi', ok: true },
        { name: 'live-xicheng-trigger-gongwangfu', ok: true },
        { name: 'live-xicheng-trigger-planetarium', ok: true }
      ]
    }))
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-scan-resolve summary is required')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-ai-chat-sourced summary.logId is required')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-trigger-baitasi summary.confidence must be at least 0.85')
  })

  test('fails closed when APP trigger readiness summaries lack package context', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const workbookPath = path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json')
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appEvidence = appReadinessEvidence()
    for (const check of appEvidence.checks.filter((item) => item.name.startsWith('live-xicheng-trigger-'))) {
      delete check.summary.packageCode
      delete check.summary.targetPath
    }
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appEvidence)
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-workbook-evidence', workbookPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-trigger-baitasi summary.packageCode must be XICHENG-MAP-001')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-trigger-baitasi summary.targetPath must include packageCode=XICHENG-MAP-001')
  })

  test('fails closed when APP AI readiness summaries lack POI names', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const workbookPath = path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json')
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appEvidence = appReadinessEvidence()
    for (const check of appEvidence.checks.filter((item) => item.name.startsWith('live-xicheng-ai-chat-'))) {
      delete check.summary.poiName
    }
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appEvidence)
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-workbook-evidence', workbookPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-ai-chat-sourced summary.poiName must be 妙应寺白塔')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-ai-chat-blocked summary.poiName must be 来源门禁测试点位')
  })

  test('fails closed when APP AI readiness summaries do not prove context echo', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const workbookPath = path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json')
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appEvidence = appReadinessEvidence()
    for (const check of appEvidence.checks.filter((item) => item.name.startsWith('live-xicheng-ai-chat-'))) {
      delete check.summary.contextEcho
    }
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appEvidence)
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-workbook-evidence', workbookPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-ai-chat-sourced summary.contextEcho must be true')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-ai-chat-blocked summary.contextEcho must be true')
  })

  test('fails closed when APP AI readiness summaries do not use Xicheng AI guide scene', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const workbookPath = path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json')
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appEvidence = appReadinessEvidence()
    for (const check of appEvidence.checks.filter((item) => item.name.startsWith('live-xicheng-ai-chat-'))) {
      check.summary.sceneCode = 'wrong-scene'
    }
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appEvidence)
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-workbook-evidence', workbookPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-ai-chat-sourced summary.sceneCode must be xicheng-ai-guide')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-ai-chat-blocked summary.sceneCode must be xicheng-ai-guide')
  })

  test('fails closed when APP AI readiness summaries do not prove tenant context', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const workbookPath = path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json')
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appEvidence = appReadinessEvidence()
    for (const check of appEvidence.checks.filter((item) => item.name.startsWith('live-xicheng-ai-chat-'))) {
      delete check.summary.tenantId
    }
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appEvidence)
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-workbook-evidence', workbookPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-ai-chat-sourced summary.tenantId must be 1')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-ai-chat-blocked summary.tenantId must be 1')
  })

  test('fails closed when APP route readiness summaries do not prove tenant context', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const workbookPath = path.join(rootDir, 'qa/xicheng-poi-review-workbook-evidence.json')
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appEvidence = appReadinessEvidence()
    for (const check of appEvidence.checks.filter((item) => {
      return item.name === 'live-xicheng-scan-resolve' ||
        item.name === 'live-xicheng-error-feedback' ||
        item.name.startsWith('live-xicheng-trigger-')
    })) {
      delete check.summary.tenantId
    }
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appEvidence)
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-workbook-evidence', workbookPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-scan-resolve summary.tenantId must be 1')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-error-feedback summary.tenantId must be 1')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence check live-xicheng-trigger-baitasi summary.tenantId must be 1')
  })

  test('fails closed when package input evidence is missing checkedAt timestamp', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir, {
      checkedAt: undefined
    })
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('seed evidence checkedAt must be a valid timestamp')
  })

  test('fails closed when package input evidence is older than the allowed freshness window', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir, {
      checkedAt: staleCheckedAt()
    })
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--stage', 'production',
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('manifest evidence checkedAt must be within the last 24 hours')
  })

  test('does not treat secret environment variable names as raw secret values', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      diagnostics: {
        requiredEnvNames: [
          'OSS_SECRET_KEY',
          'WX_MP_SECRET',
          'INTERNAL_AUTH_TOKEN',
          'QWEN_API_KEY'
        ]
      }
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath
    ])

    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report.status).toBe('XICHENG_RELEASE_EVIDENCE_PACKAGE_READY')
    expect(report.checks.find((check) => check.name === 'secret-safety')).toMatchObject({
      ok: true
    })
  })

  test('fails closed for incomplete APP evidence or raw secret-like values', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir, {
      leakedConfig: {
        MYSQL_PASSWORD: 'prod-db-password'
      }
    })
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence({
      checks: [
        { name: 'live-xicheng-scan-resolve', ok: true },
        { name: 'live-xicheng-ai-chat-sourced', ok: true }
      ]
    }))
    const outputPath = path.join(rootDir, 'tmp/xicheng-release-evidence-package.json')

    const result = runPackageGate([
      '--root', rootDir,
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'tmp/xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    const evidence = JSON.parse(await readFile(outputPath, 'utf8'))
    expect(evidence.status).toBe('NOT_READY')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence must include live-xicheng-error-feedback')
    expect(evidence.blockers.join('\n')).toContain('app readiness evidence must include live-xicheng-trigger-baitasi')
    expect(evidence.blockers.join('\n')).toContain('release evidence contains raw secret-like value')
  })

  test('rejects package evidence output paths outside qa tmp or workbench', async () => {
    const rootDir = await createTempRoot()
    const releasePath = await writeReleaseEvidenceFile(rootDir)
    const manifestPath = await writeManifestEvidenceFile(rootDir)
    const seedPath = await writeSeedEvidenceFile(rootDir)
    const appPath = await writeJson(rootDir, 'qa/xicheng-app-readiness-evidence.json', appReadinessEvidence())

    const result = runPackageGate([
      '--root', rootDir,
      '--release-evidence', releasePath,
      '--poi-manifest-evidence', manifestPath,
      '--poi-seed-evidence', seedPath,
      '--app-readiness-evidence', appPath,
      '--evidence-file', 'xicheng-release-evidence-package.json'
    ])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('evidence file must be under qa/, tmp/ or workbench/')
  })

  test('exposes the release evidence package gate through npm scripts and deployment docs', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
    const deployDoc = await readFile('docs/02_开发规划/星河寻境业务平台部署说明.md', 'utf8')

    expect(packageJson.scripts['xunjing:xicheng:release:evidence:package']).toBe(
      'node scripts/verify-xicheng-release-evidence-package.mjs'
    )
    expect(deployDoc).toContain('npm run xunjing:xicheng:release:evidence:package')
    expect(deployDoc).toContain('XICHENG_RELEASE_EVIDENCE_PACKAGE_READY')
    expect(deployDoc).toContain('xunjing-platform-readiness')
    expect(deployDoc).toContain('summary.tenantId')
    expect(deployDoc).toContain('summary.baseUrl')
    expect(deployDoc).toContain('summary.appApiBaseUrl')
    expect(deployDoc).toContain('summary.staticOnly=false')
    expect(deployDoc).toContain('summary.includeXichengAppCheck=true')
    expect(deployDoc).toContain('summary.includeXichengTriggerCheck=true')
    expect(deployDoc).toContain('check.summary.logId')
    expect(deployDoc).toContain('check.summary.sourceCount')
    expect(deployDoc).toContain('check.summary.poiName')
    expect(deployDoc).toContain('check.summary.contextEcho')
    expect(deployDoc).toContain('check.summary.sceneCode')
    expect(deployDoc).toContain('check.summary.tenantId')
    expect(deployDoc).toContain('check.summary.confidence')
    expect(deployDoc).toContain('check.summary.packageCode')
    expect(deployDoc).toContain('check.summary.targetPath')
    expect(deployDoc).toContain('packageCode=XICHENG-MAP-001')
    expect(deployDoc).toContain('evidenceFileSha256')
    expect(deployDoc).toContain('summary.poiWorkbookEvidenceFile')
    expect(deployDoc).toContain('summary.poiSourceCoverageEvidenceFile')
    expect(deployDoc).toContain('workbookReadyPoiCount')
    expect(deployDoc).toContain('workbookPendingPoiCount')
    expect(deployDoc).toContain('sourceCoverageUncoveredPoiCount')
    expect(deployDoc).toContain('pendingPoiTasks')
    expect(deployDoc).toContain('release-source-revision')
    expect(deployDoc).toContain('summary.gitCommit')
    expect(deployDoc).toContain('package-source-revision')
    expect(deployDoc).toContain('summary.packageGitCommit')
    expect(deployDoc).toContain('APP API 域名一致性')
    expect(deployDoc).toContain('runtimeEnvFingerprintMode')
    expect(deployDoc).toContain('runtimeEnvNonSecretSha256')
    expect(deployDoc).toContain('summary.aiBootstrapEvidenceFile')
    expect(deployDoc).toContain('summary.visionOcrEvidenceFile')
    expect(deployDoc).toContain('summary.objectStorageEvidenceFile')
    expect(deployDoc).toContain('summary.objectStoragePutHttpStatus')
    expect(deployDoc).toContain('summary.objectStorageReadBackMatches')
  })
})
