import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { verifyXichengPoiProductionManifest } from './verify-xicheng-poi-production-manifest.mjs'

const allowedOutputDirs = new Set(['qa', 'tmp', 'workbench'])

function sqlString(value) {
  return `'${String(value ?? '').replaceAll("'", "''")}'`
}

function jsonSql(value) {
  return sqlString(JSON.stringify(value))
}

function sqlDecimal(value) {
  return Number(value).toFixed(7)
}

function sourceAuthorityLevel(sourceType) {
  const normalized = String(sourceType || '').toUpperCase()
  return normalized === 'PARTNER' || normalized === 'AUTHORIZED' ? 'AUTHORIZED' : 'OFFICIAL'
}

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

function resolveOutputFile(rootDir, outputFile) {
  if (!outputFile) {
    throw new Error('--output is required')
  }
  const resolvedRoot = path.resolve(rootDir)
  const resolvedFile = path.isAbsolute(outputFile)
    ? path.resolve(outputFile)
    : path.resolve(resolvedRoot, outputFile)
  const relativePath = path.relative(resolvedRoot, resolvedFile)
  const [topLevelDir] = relativePath.split(path.sep)
  if (
    !relativePath ||
    relativePath.startsWith('..') ||
    path.isAbsolute(relativePath) ||
    !allowedOutputDirs.has(topLevelDir)
  ) {
    throw new Error('output file must be under qa/, tmp/ or workbench/')
  }
  return resolvedFile
}

function productionSourceJson(poi) {
  return {
    geo: 'field_verified',
    content: 'authorized_source',
    sourceTitle: poi.source.sourceTitle,
    sourceUrl: poi.source.sourceUrl,
    sourceType: poi.source.sourceType,
    licenseStatus: poi.source.licenseStatus,
    licenseEvidenceRef: poi.source.licenseEvidenceRef,
    licenseReviewedBy: poi.source.licenseReviewedBy,
    licenseReviewedAt: poi.source.licenseReviewedAt,
    fieldEvidenceStatus: poi.fieldEvidence.photoEvidenceStatus,
    triggerSmokeStatus: poi.fieldEvidence.triggerSmokeStatus,
    fieldEvidenceRefs: poi.fieldEvidence.evidenceRefs,
    fieldVerifiedBy: poi.fieldEvidence.verifiedBy,
    fieldVerifiedAt: poi.fieldEvidence.verifiedAt,
    reviewedBy: poi.audit.reviewedBy,
    reviewedAt: poi.audit.reviewedAt
  }
}

function productionContentJson(poi) {
  return {
    poiId: poi.poiCode,
    regionCode: poi.regionCode,
    packageCode: poi.packageCode,
    reviewStatus: poi.audit.reviewStatus,
    geoStatus: poi.audit.geoStatus,
    licenseStatus: poi.audit.licenseStatus,
    shortIntro: poi.content.shortIntro,
    recommendedQuestions: poi.content.recommendedQuestions,
    sourceTitle: poi.source.sourceTitle,
    sourceUrl: poi.source.sourceUrl,
    licenseEvidenceRef: poi.source.licenseEvidenceRef,
    licenseReviewedBy: poi.source.licenseReviewedBy,
    licenseReviewedAt: poi.source.licenseReviewedAt,
    fieldEvidenceStatus: poi.fieldEvidence.photoEvidenceStatus,
    triggerSmokeStatus: poi.fieldEvidence.triggerSmokeStatus,
    reviewedBy: poi.audit.reviewedBy,
    reviewedAt: poi.audit.reviewedAt
  }
}

function buildPoiRow(poi) {
  return [
    '@map_package_id',
    sqlString(poi.poiCode),
    sqlString(poi.regionCode),
    sqlString(poi.name),
    sqlString(poi.displayName),
    jsonSql(poi.aliases),
    sqlString(poi.category),
    sqlString(poi.priority),
    sqlString(poi.address),
    sqlDecimal(poi.latitude),
    sqlDecimal(poi.longitude),
    sqlString(poi.coordType),
    jsonSql(productionSourceJson(poi)),
    jsonSql(poi.trigger),
    jsonSql(productionContentJson(poi)),
    sqlString(poi.audit.reviewStatus),
    sqlString(poi.audit.geoStatus),
    sqlString(poi.audit.licenseStatus),
    sqlString(poi.audit.status),
    sqlString('admin'),
    'NOW()',
    sqlString('admin'),
    'NOW()',
    "b'0'",
    '@tenant_id'
  ].join(', ')
}

function buildKnowledgeRow(poi) {
  const digest = [
    `POI 级生产来源：${poi.name}（poiCode=${poi.poiCode}，regionCode=${poi.regionCode}）。`,
    poi.content.shortIntro,
    `来源：${poi.source.sourceTitle}；审核人：${poi.audit.reviewedBy}；审核时间：${poi.audit.reviewedAt}。`
  ].join('')
  return [
    '@map_package_id',
    sqlString(`${poi.name} POI 级生产来源`),
    sqlString(poi.source.sourceType),
    sqlString(poi.source.sourceUrl),
    sqlString(digest),
    sqlString(sourceAuthorityLevel(poi.source.sourceType)),
    sqlString('APPROVED'),
    sqlString('INDEXED'),
    sqlString('admin'),
    'NOW()',
    sqlString('admin'),
    'NOW()',
    "b'0'",
    '@tenant_id'
  ].join(', ')
}

function buildMetrics(manifest) {
  return {
    p0Ready: true,
    productionReady: true,
    regionCode: manifest.regionCode,
    packageCode: manifest.packageCode,
    poiSeedCount: manifest.pois.length,
    targetP0PoiCount: Number(manifest.targetP0PoiCount),
    sourceLicenseStatus: 'APPROVED',
    geoStatus: 'APPROVED',
    reviewStatus: 'APPROVED',
    fieldEvidenceStatus: 'APPROVED',
    triggerSmokeStatus: 'PASSED'
  }
}

export function generateXichengPoiProductionSeedSql(manifest, { tenantId = 1 } = {}) {
  const poiRows = manifest.pois.map((poi) => `(${buildPoiRow(poi)})`).join(',\n')
  const sourceRows = manifest.pois.map((poi) => `(${buildKnowledgeRow(poi)})`).join(',\n')
  const metricsJson = JSON.stringify(buildMetrics(manifest))

  return `/*
 Generated from reviewed Xicheng POI production manifest.
 Apply after backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql and after the manifest gate outputs PRODUCTION_POI_MANIFEST_READY.
*/

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 0;

SET @tenant_id := ${Number(tenantId)};
SET @map_package_id := (
  SELECT \`id\` FROM \`xunjing_resource_package\`
  WHERE \`package_code\` = 'XICHENG-MAP-001' AND \`tenant_id\` = @tenant_id
  LIMIT 1
);
SET @project_id := (
  SELECT \`project_id\` FROM \`xunjing_resource_package\`
  WHERE \`id\` = @map_package_id AND \`tenant_id\` = @tenant_id
  LIMIT 1
);
SET @school_id := (
  SELECT \`school_id\` FROM \`xunjing_resource_package\`
  WHERE \`id\` = @map_package_id AND \`tenant_id\` = @tenant_id
  LIMIT 1
);

DELETE FROM \`xunjing_knowledge_document\`
WHERE \`tenant_id\` = @tenant_id
  AND \`package_id\` = @map_package_id
  AND \`title\` LIKE '% POI 级生产来源';

DELETE FROM \`xunjing_poi\`
WHERE \`tenant_id\` = @tenant_id
  AND \`package_id\` = @map_package_id;

DELETE FROM \`xunjing_map_point\`
WHERE \`tenant_id\` = @tenant_id
  AND \`package_id\` = @map_package_id;

INSERT INTO \`xunjing_poi\`
(\`package_id\`, \`poi_code\`, \`region_code\`, \`name\`, \`official_name\`, \`aliases_json\`, \`category\`, \`poi_level\`, \`address\`, \`latitude\`, \`longitude\`, \`coord_type\`, \`source_json\`, \`trigger_json\`, \`content_json\`, \`review_status\`, \`geo_status\`, \`license_status\`, \`status\`, \`creator\`, \`create_time\`, \`updater\`, \`update_time\`, \`deleted\`, \`tenant_id\`)
VALUES
${poiRows};

INSERT INTO \`xunjing_knowledge_document\`
(\`package_id\`, \`title\`, \`source_type\`, \`source_url\`, \`content_digest\`, \`authority_level\`, \`review_status\`, \`vector_status\`, \`creator\`, \`create_time\`, \`updater\`, \`update_time\`, \`deleted\`, \`tenant_id\`)
VALUES
${sourceRows};

SET @sort_order := 0;
INSERT INTO \`xunjing_map_point\`
(\`package_id\`, \`title\`, \`latitude\`, \`longitude\`, \`summary\`, \`sort_order\`, \`status\`, \`creator\`, \`create_time\`, \`updater\`, \`update_time\`, \`deleted\`, \`tenant_id\`)
SELECT
  @map_package_id,
  \`name\`,
  \`latitude\`,
  \`longitude\`,
  CONCAT('西城 P0 生产点位，POI 编码：', \`poi_code\`, '。来源、坐标和内容审核均已通过。'),
  (@sort_order := @sort_order + 1),
  'PUBLISHED',
  'admin',
  NOW(),
  'admin',
  NOW(),
  b'0',
  @tenant_id
FROM \`xunjing_poi\`
WHERE \`tenant_id\` = @tenant_id
  AND \`package_id\` = @map_package_id
ORDER BY \`poi_code\`;

DELETE FROM \`xunjing_public_report\`
WHERE \`tenant_id\` = @tenant_id
  AND \`project_id\` = @project_id
  AND \`title\` = '西城 P0 后台生产 POI 状态';

INSERT INTO \`xunjing_public_report\`
(\`project_id\`, \`school_id\`, \`title\`, \`report_period\`, \`metrics_json\`, \`status\`, \`generated_at\`, \`creator\`, \`create_time\`, \`updater\`, \`update_time\`, \`deleted\`, \`tenant_id\`)
VALUES
(@project_id, @school_id, '西城 P0 后台生产 POI 状态', '2026-P0-PRODUCTION-POI', ${sqlString(metricsJson)}, 'GENERATED', NOW(), 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id);

SET FOREIGN_KEY_CHECKS = 1;
`
}

async function runCli() {
  const args = process.argv.slice(2)
  const rootDir = path.resolve(readArgValue(args, '--root') || process.cwd())
  const manifestPath = readArgValue(args, '--manifest') || process.env.XICHENG_POI_MANIFEST
  const outputFile = resolveOutputFile(rootDir, readArgValue(args, '--output'))
  const minPoiCount = readArgValue(args, '--min-pois') || process.env.XICHENG_POI_MIN_COUNT || 80
  const report = await verifyXichengPoiProductionManifest({ manifestPath, minPoiCount })
  if (!report.ok) {
    throw new Error(`manifest is not production-ready: ${report.blockers.join('; ')}`)
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const sql = generateXichengPoiProductionSeedSql(manifest, {
    tenantId: readArgValue(args, '--tenant-id') || process.env.XUNJING_TENANT_ID || 1
  })
  await mkdir(path.dirname(outputFile), { recursive: true })
  await writeFile(outputFile, sql)
  console.log(JSON.stringify({
    artifactType: 'xicheng-poi-production-seed',
    ok: true,
    status: 'PRODUCTION_POI_SEED_GENERATED',
    checkedAt: new Date().toISOString(),
    summary: {
      totalPoiCount: manifest.pois.length,
      targetPoiCount: Number(manifest.targetP0PoiCount),
      outputFile
    }
  }, null, 2))
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
