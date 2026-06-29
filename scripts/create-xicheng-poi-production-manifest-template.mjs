import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-poi-production-manifest-template'
const reviewPacketArtifactType = 'xicheng-poi-production-review-packet'
const allowedOutputDirs = new Set(['qa', 'tmp', 'workbench'])
const defaultPoiSlotCount = 80

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

function normalizeSlotCount(value) {
  const parsed = Number(value || defaultPoiSlotCount)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('--count must be a positive integer')
  }
  return parsed
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

function sqlStringValue(token) {
  const trimmed = String(token || '').trim()
  if (!trimmed.startsWith("'") || !trimmed.endsWith("'")) {
    return trimmed
  }
  return trimmed.slice(1, -1).replaceAll("''", "'")
}

function parseJsonString(token, fallback) {
  try {
    return JSON.parse(sqlStringValue(token))
  } catch {
    return fallback
  }
}

function splitSqlTopLevelValues(row) {
  const text = row.trim().replace(/^\(/, '').replace(/\)$/, '')
  const values = []
  let current = ''
  let depth = 0
  let inString = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]
    if (char === "'") {
      current += char
      if (inString && next === "'") {
        current += next
        index += 1
      } else {
        inString = !inString
      }
      continue
    }
    if (!inString) {
      if (char === '(') {
        depth += 1
      } else if (char === ')') {
        depth -= 1
      } else if (char === ',' && depth === 0) {
        values.push(current.trim())
        current = ''
        continue
      }
    }
    current += char
  }
  if (current.trim()) {
    values.push(current.trim())
  }
  return values
}

function splitSqlRows(valuesSql) {
  const rows = []
  let rowStart = -1
  let depth = 0
  let inString = false
  for (let index = 0; index < valuesSql.length; index += 1) {
    const char = valuesSql[index]
    const next = valuesSql[index + 1]
    if (char === "'") {
      if (inString && next === "'") {
        index += 1
      } else {
        inString = !inString
      }
      continue
    }
    if (inString) {
      continue
    }
    if (char === '(') {
      if (depth === 0) {
        rowStart = index
      }
      depth += 1
    } else if (char === ')') {
      depth -= 1
      if (depth === 0 && rowStart >= 0) {
        rows.push(valuesSql.slice(rowStart, index + 1))
        rowStart = -1
      }
    } else if (char === ';' && depth === 0) {
      break
    }
  }
  return rows
}

function extractPoiValuesSql(sql) {
  const insertIndex = sql.indexOf('INSERT INTO `xunjing_poi`')
  if (insertIndex < 0) {
    return ''
  }
  const valuesIndex = sql.indexOf('VALUES', insertIndex)
  if (valuesIndex < 0) {
    return ''
  }
  return sql.slice(valuesIndex + 'VALUES'.length)
}

function extractSqlVariables(sql) {
  const variables = new Map()
  const pattern = /SET\s+@([a-zA-Z0-9_]+)\s*:=\s*'((?:''|[^'])*)'/gi
  let match = pattern.exec(sql)
  while (match) {
    variables.set(match[1], match[2].replaceAll("''", "'"))
    match = pattern.exec(sql)
  }
  return variables
}

function resolveSqlValueToken(token, variables) {
  const trimmed = String(token || '').trim()
  if (trimmed.startsWith('@')) {
    return variables.get(trimmed.slice(1)) || ''
  }
  return sqlStringValue(trimmed)
}

function parseMysqlJsonObject(token, variables) {
  const trimmed = String(token || '').trim()
  if (!trimmed.toUpperCase().startsWith('JSON_OBJECT(') || !trimmed.endsWith(')')) {
    return {}
  }
  const inner = trimmed.slice(trimmed.indexOf('(') + 1, -1)
  const values = splitSqlTopLevelValues(`(${inner})`)
  const object = {}
  for (let index = 0; index < values.length - 1; index += 2) {
    const key = sqlStringValue(values[index])
    object[key] = resolveSqlValueToken(values[index + 1], variables)
  }
  return object
}

function createPoiTemplateFromSeedRow(row, index, variables) {
  const values = splitSqlTopLevelValues(row)
  const source = parseMysqlJsonObject(values[12], variables)
  const content = parseJsonString(values[14], {})
  const sourceTitle = content.sourceTitle || source.sourceTitle || `${sqlStringValue(values[3])} 公开来源待复核`
  const sourceUrl = content.sourceUrl || source.sourceUrl || ''
  return {
    ...createPoiTemplate(index),
    poiCode: sqlStringValue(values[1]),
    regionCode: sqlStringValue(values[2]),
    packageCode: 'XICHENG-MAP-001',
    name: sqlStringValue(values[3]),
    displayName: sqlStringValue(values[4]),
    aliases: parseJsonString(values[5], []),
    category: sqlStringValue(values[6]),
    priority: sqlStringValue(values[7]),
    address: sqlStringValue(values[8]),
    latitude: Number(values[9]),
    longitude: Number(values[10]),
    coordType: sqlStringValue(values[11]),
    source: {
      sourceTitle,
      sourceUrl,
      sourceType: 'OFFICIAL_PUBLIC',
      licenseStatus: 'REVIEW_REQUIRED',
      licenseEvidenceRef: '',
      licenseReviewedBy: '',
      licenseReviewedAt: ''
    },
    trigger: parseJsonString(values[13], createPoiTemplate(index).trigger),
    content: {
      shortIntro: String(content.shortIntro || ''),
      recommendedQuestions: Array.isArray(content.recommendedQuestions)
        ? content.recommendedQuestions
        : []
    },
    audit: {
      reviewStatus: 'REVIEW_REQUIRED',
      geoStatus: 'REVIEW_REQUIRED',
      licenseStatus: 'REVIEW_REQUIRED',
      status: 'DRAFT',
      reviewedBy: '',
      reviewedAt: ''
    }
  }
}

export function importPoiTemplatesFromLocalSeedSql(sql) {
  const variables = extractSqlVariables(sql)
  return splitSqlRows(extractPoiValuesSql(sql))
    .map((row, index) => createPoiTemplateFromSeedRow(row, index, variables))
    .filter((poi) => poi.poiCode.startsWith('xicheng-'))
}

function hasText(value) {
  return String(value || '').trim().length > 0
}

function isStatus(value, expected) {
  return String(value || '').trim().toUpperCase() === expected
}

function collectMissingReviewFields(poi) {
  const missing = []
  const source = poi.source || {}
  const trigger = poi.trigger || {}
  const fieldEvidence = poi.fieldEvidence || {}
  const content = poi.content || {}
  const audit = poi.audit || {}

  for (const field of ['poiCode', 'name', 'displayName', 'category', 'address']) {
    if (!hasText(poi[field])) {
      missing.push(field)
    }
  }
  if (!Array.isArray(poi.aliases) || poi.aliases.filter(hasText).length < 2) {
    missing.push('aliases>=2')
  }
  if (!Number.isFinite(Number(poi.latitude))) {
    missing.push('latitude')
  }
  if (!Number.isFinite(Number(poi.longitude))) {
    missing.push('longitude')
  }
  if (!hasText(source.sourceUrl)) {
    missing.push('source.sourceUrl')
  }
  if (!hasText(source.licenseEvidenceRef)) {
    missing.push('source.licenseEvidenceRef')
  }
  if (!hasText(source.licenseReviewedBy)) {
    missing.push('source.licenseReviewedBy')
  }
  if (!hasText(source.licenseReviewedAt)) {
    missing.push('source.licenseReviewedAt')
  }
  if (!Array.isArray(trigger.ocrKeywords) || trigger.ocrKeywords.filter(hasText).length < 2) {
    missing.push('trigger.ocrKeywords>=2')
  }
  if (!Array.isArray(trigger.photoLabels) || trigger.photoLabels.filter(hasText).length < 2) {
    missing.push('trigger.photoLabels>=2')
  }
  if (!Array.isArray(fieldEvidence.evidenceRefs) || fieldEvidence.evidenceRefs.filter(hasText).length < 1) {
    missing.push('fieldEvidence.evidenceRefs')
  }
  if (!hasText(fieldEvidence.verifiedBy)) {
    missing.push('fieldEvidence.verifiedBy')
  }
  if (!hasText(fieldEvidence.verifiedAt)) {
    missing.push('fieldEvidence.verifiedAt')
  }
  if (!hasText(content.shortIntro)) {
    missing.push('content.shortIntro')
  }
  if (!Array.isArray(content.recommendedQuestions) || content.recommendedQuestions.filter(hasText).length < 3) {
    missing.push('content.recommendedQuestions>=3')
  }
  if (!isStatus(audit.reviewStatus, 'APPROVED')) {
    missing.push('audit.reviewStatus=APPROVED')
  }
  if (!isStatus(audit.geoStatus, 'APPROVED')) {
    missing.push('audit.geoStatus=APPROVED')
  }
  if (!isStatus(audit.licenseStatus, 'APPROVED')) {
    missing.push('audit.licenseStatus=APPROVED')
  }
  if (!isStatus(audit.status, 'PUBLISHED')) {
    missing.push('audit.status=PUBLISHED')
  }
  if (!hasText(audit.reviewedBy)) {
    missing.push('audit.reviewedBy')
  }
  if (!hasText(audit.reviewedAt)) {
    missing.push('audit.reviewedAt')
  }
  return missing
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function buildPoiReviewChecklistCsv(manifest) {
  const header = [
    'poiCode',
    'name',
    'category',
    'sourceUrl',
    'reviewStatus',
    'geoStatus',
    'licenseStatus',
    'photoEvidenceStatus',
    'triggerSmokeStatus',
    'missingFields'
  ]
  const rows = (Array.isArray(manifest.pois) ? manifest.pois : []).map((poi) => {
    const source = poi.source || {}
    const fieldEvidence = poi.fieldEvidence || {}
    const audit = poi.audit || {}
    return [
      poi.poiCode,
      poi.name,
      poi.category,
      source.sourceUrl,
      audit.reviewStatus,
      audit.geoStatus,
      audit.licenseStatus,
      fieldEvidence.photoEvidenceStatus,
      fieldEvidence.triggerSmokeStatus,
      collectMissingReviewFields(poi).join('|')
    ].map(csvCell).join(',')
  })
  return `${[header.join(','), ...rows].join('\n')}\n`
}

function listCell(values) {
  return Array.isArray(values) ? values.filter(hasText).join('|') : ''
}

export function buildPoiReviewWorkbookCsv(manifest) {
  const header = [
    'poiCode',
    'name',
    'displayName',
    'aliases',
    'category',
    'priority',
    'address',
    'latitude',
    'longitude',
    'coordType',
    'sourceTitle',
    'sourceUrl',
    'sourceType',
    'licenseStatus',
    'licenseEvidenceRef',
    'licenseReviewedBy',
    'licenseReviewedAt',
    'gpsRadiusMeters',
    'ocrKeywords',
    'photoLabels',
    'minConfidence',
    'photoEvidenceStatus',
    'triggerSmokeStatus',
    'fieldEvidenceRefs',
    'fieldVerifiedBy',
    'fieldVerifiedAt',
    'shortIntro',
    'recommendedQuestions',
    'reviewStatus',
    'geoStatus',
    'auditLicenseStatus',
    'status',
    'reviewedBy',
    'reviewedAt'
  ]
  const rows = (Array.isArray(manifest.pois) ? manifest.pois : []).map((poi) => {
    const source = poi.source || {}
    const trigger = poi.trigger || {}
    const fieldEvidence = poi.fieldEvidence || {}
    const content = poi.content || {}
    const audit = poi.audit || {}
    return [
      poi.poiCode,
      poi.name,
      poi.displayName,
      listCell(poi.aliases),
      poi.category,
      poi.priority,
      poi.address,
      poi.latitude ?? '',
      poi.longitude ?? '',
      poi.coordType,
      source.sourceTitle,
      source.sourceUrl,
      source.sourceType,
      source.licenseStatus,
      source.licenseEvidenceRef,
      source.licenseReviewedBy,
      source.licenseReviewedAt,
      trigger.gpsRadiusMeters ?? '',
      listCell(trigger.ocrKeywords),
      listCell(trigger.photoLabels),
      trigger.minConfidence ?? '',
      fieldEvidence.photoEvidenceStatus,
      fieldEvidence.triggerSmokeStatus,
      listCell(fieldEvidence.evidenceRefs),
      fieldEvidence.verifiedBy,
      fieldEvidence.verifiedAt,
      content.shortIntro,
      listCell(content.recommendedQuestions),
      audit.reviewStatus,
      audit.geoStatus,
      audit.licenseStatus,
      audit.status,
      audit.reviewedBy,
      audit.reviewedAt
    ].map(csvCell).join(',')
  })
  return `${[header.join(','), ...rows].join('\n')}\n`
}

function relativePathForCommand(rootDir, resolvedFile) {
  if (!resolvedFile) {
    return undefined
  }
  const relativePath = path.relative(path.resolve(rootDir), path.resolve(resolvedFile))
  return relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
    ? relativePath.split(path.sep).join('/')
    : path.resolve(resolvedFile)
}

function buildReviewPacket({
  rootDir,
  manifest,
  outputFile,
  reviewChecklistFile,
  reviewWorkbookFile
}) {
  const manifestPath = relativePathForCommand(rootDir, outputFile)
  const checklistPath = relativePathForCommand(rootDir, reviewChecklistFile)
  const workbookPath = relativePathForCommand(rootDir, reviewWorkbookFile)
  const productionManifestPath = 'workbench/xicheng-production-pois.json'
  const productionSeedPath = 'workbench/xicheng-poi-production-seed.sql'
  const sourceReviewPath = 'workbench/xicheng-poi-source-review-summary.csv'
  const productionReviewPath = 'workbench/xicheng-poi-production-review-summary.csv'
  const sourceCoverageEvidencePath = 'qa/xicheng-poi-source-coverage-evidence.json'
  const sourceReviewApplyEvidencePath = 'qa/xicheng-poi-source-review-apply-evidence.json'
  const productionReviewApplyEvidencePath = 'qa/xicheng-poi-production-review-apply-evidence.json'
  const sourceAppliedWorkbookPath = 'workbench/xicheng-production-pois.review-workbook.source-applied.csv'
  const productionAppliedWorkbookPath = 'workbench/xicheng-production-pois.review-workbook.production-applied.csv'

  return {
    artifactType: reviewPacketArtifactType,
    ok: false,
    status: 'REVIEW_DATA_REQUIRED',
    checkedAt: new Date().toISOString(),
    summary: {
      poiSlots: manifest.pois.length,
      importedPoiCount: manifest.seedSource?.importedPoiCount || 0,
      todoPoiSlots: manifest.pois.filter((poi) => String(poi.poiCode || '').startsWith('TODO-')).length,
      productionReady: manifest.productionReady === true,
      manifestFile: outputFile,
      ...(reviewChecklistFile ? { reviewChecklistFile } : {}),
      ...(reviewWorkbookFile ? { reviewWorkbookFile } : {})
    },
    draftFiles: {
      manifestFile: manifestPath,
      reviewChecklistFile: checklistPath,
      reviewWorkbookFile: workbookPath
    },
    requiredEvidenceFiles: {
      workbookEvidenceFile: 'qa/xicheng-poi-review-workbook-evidence.json',
      sourceCoverageEvidenceFile: sourceCoverageEvidencePath,
      sourceReviewApplyEvidenceFile: sourceReviewApplyEvidencePath,
      productionReviewApplyEvidenceFile: productionReviewApplyEvidencePath,
      manifestEvidenceFile: 'qa/xicheng-poi-manifest-evidence.json',
      seedGenerationEvidenceFile: 'qa/xicheng-poi-production-seed-generation-evidence.json',
      seedEvidenceFile: 'qa/xicheng-poi-production-seed-evidence.json'
    },
    nextCommands: [
      `npm run xunjing:xicheng:poi:workbook:gate -- --workbook ${workbookPath || 'workbench/xicheng-production-pois.review-workbook.csv'} --evidence-file qa/xicheng-poi-review-workbook-evidence.json`,
      'npm run xunjing:xicheng:poi:tasks:export -- --workbook-evidence qa/xicheng-poi-review-workbook-evidence.json --output workbench/xicheng-poi-review-tasks.csv',
      `npm run xunjing:xicheng:poi:source-coverage:audit -- --source-review ${sourceReviewPath} --evidence-file ${sourceCoverageEvidencePath}`,
      `npm run xunjing:xicheng:poi:source-review:apply -- --workbook ${workbookPath || 'workbench/xicheng-production-pois.review-workbook.csv'} --source-review ${sourceReviewPath} --source-coverage-evidence ${sourceCoverageEvidencePath} --output ${sourceAppliedWorkbookPath} --evidence-file ${sourceReviewApplyEvidencePath}`,
      `npm run xunjing:xicheng:poi:production-review:apply -- --workbook ${sourceAppliedWorkbookPath} --production-review ${productionReviewPath} --source-review-apply-evidence ${sourceReviewApplyEvidencePath} --output ${productionAppliedWorkbookPath} --evidence-file ${productionReviewApplyEvidencePath}`,
      `npm run xunjing:xicheng:poi:manifest:from-workbook -- --workbook ${productionAppliedWorkbookPath} --output ${productionManifestPath} --production-ready --batch-code xicheng-p0-poi-review-YYYYMMDD --data-owner xicheng-cultural-tourism-review-team --source-compiled-by xicheng-source-compiler --source-compiled-at YYYY-MM-DD --reviewed-by xicheng-production-reviewer --reviewed-at YYYY-MM-DD --evidence-package-ref oss://xunjing-review/xicheng/review-batches/xicheng-p0-poi-review-YYYYMMDD.zip`,
      `npm run xunjing:xicheng:poi:manifest:gate -- --manifest ${productionManifestPath} --evidence-file qa/xicheng-poi-manifest-evidence.json`,
      `npm run xunjing:xicheng:poi:seed:generate -- --manifest ${productionManifestPath} --output ${productionSeedPath} --evidence-file qa/xicheng-poi-production-seed-generation-evidence.json`,
      `npm run xunjing:xicheng:poi:seed:verify -- --sql ${productionSeedPath} --evidence-file qa/xicheng-poi-production-seed-evidence.json`
    ],
    blockers: [
      'review workbook still contains TODO or REVIEW_REQUIRED placeholders',
      'production manifest must pass xunjing:xicheng:poi:manifest:gate',
      'production seed SQL must pass xunjing:xicheng:poi:seed:verify'
    ]
  }
}

function slotId(index) {
  return String(index + 1).padStart(3, '0')
}

function createPoiTemplate(index) {
  const id = slotId(index)
  return {
    poiCode: `TODO-xicheng-poi-${id}`,
    regionCode: 'beijing-xicheng',
    packageCode: 'XICHENG-MAP-001',
    name: '',
    displayName: '',
    aliases: [],
    category: '',
    priority: 'P0',
    address: '',
    latitude: null,
    longitude: null,
    coordType: 'GCJ02',
    source: {
      sourceTitle: '',
      sourceUrl: '',
      sourceType: 'OFFICIAL',
      licenseStatus: 'REVIEW_REQUIRED',
      licenseEvidenceRef: '',
      licenseReviewedBy: '',
      licenseReviewedAt: ''
    },
    trigger: {
      gpsRadiusMeters: 180,
      ocrKeywords: [],
      photoLabels: [],
      minConfidence: 0.85
    },
    fieldEvidence: {
      photoEvidenceStatus: 'REVIEW_REQUIRED',
      triggerSmokeStatus: 'NOT_RUN',
      evidenceRefs: [],
      verifiedBy: '',
      verifiedAt: ''
    },
    content: {
      shortIntro: '',
      recommendedQuestions: []
    },
    audit: {
      reviewStatus: 'REVIEW_REQUIRED',
      geoStatus: 'REVIEW_REQUIRED',
      licenseStatus: 'REVIEW_REQUIRED',
      status: 'DRAFT',
      reviewedBy: '',
      reviewedAt: ''
    }
  }
}

export function createXichengPoiProductionManifestTemplate({
  count = defaultPoiSlotCount,
  seedPois = [],
  seedSqlFile
} = {}) {
  const importedSeedPois = Array.isArray(seedPois) ? seedPois : []
  const poiSlotCount = Math.max(normalizeSlotCount(count), importedSeedPois.length)
  const todoPois = Array.from(
    { length: poiSlotCount - importedSeedPois.length },
    (_, index) => createPoiTemplate(importedSeedPois.length + index)
  )
  return {
    regionCode: 'beijing-xicheng',
    packageCode: 'XICHENG-MAP-001',
    targetP0PoiCount: poiSlotCount,
    productionReady: false,
    reviewBatch: {
      batchCode: '',
      dataOwner: '',
      sourceCompiledBy: '',
      sourceCompiledAt: '',
      reviewedBy: '',
      reviewedAt: '',
      evidencePackageRef: ''
    },
    ...(importedSeedPois.length > 0
      ? {
          seedSource: {
            sqlFile: seedSqlFile,
            localCandidateOnly: true,
            importedPoiCount: importedSeedPois.length
          }
        }
      : {}),
    templateNotice: importedSeedPois.length > 0
      ? 'Prefilled from local-candidate seed for review workflow only; fill the remaining POIs and replace all review placeholders before production.'
      : 'Fill with reviewed real POI data; this template must not be used as production evidence.',
    pois: [...importedSeedPois, ...todoPois]
  }
}

export async function writeXichengPoiProductionManifestTemplate({
  rootDir = process.cwd(),
  outputFile,
  count = defaultPoiSlotCount,
  seedSqlFile,
  reviewChecklistFile,
  reviewWorkbookFile,
  reviewPacketFile
} = {}) {
  const resolvedOutputFile = resolveOutputFile(rootDir, outputFile)
  const resolvedReviewChecklistFile = reviewChecklistFile
    ? resolveOutputFile(rootDir, reviewChecklistFile)
    : undefined
  const resolvedReviewWorkbookFile = reviewWorkbookFile
    ? resolveOutputFile(rootDir, reviewWorkbookFile)
    : undefined
  const resolvedReviewPacketFile = reviewPacketFile
    ? resolveOutputFile(rootDir, reviewPacketFile)
    : undefined
  const resolvedSeedSqlFile = seedSqlFile ? path.resolve(seedSqlFile) : undefined
  const seedPois = resolvedSeedSqlFile
    ? importPoiTemplatesFromLocalSeedSql(await readFile(resolvedSeedSqlFile, 'utf8'))
    : []
  const manifest = createXichengPoiProductionManifestTemplate({
    count,
    seedPois,
    seedSqlFile: resolvedSeedSqlFile
  })
  await mkdir(path.dirname(resolvedOutputFile), { recursive: true })
  await writeFile(resolvedOutputFile, `${JSON.stringify(manifest, null, 2)}\n`)
  if (resolvedReviewChecklistFile) {
    await mkdir(path.dirname(resolvedReviewChecklistFile), { recursive: true })
    await writeFile(resolvedReviewChecklistFile, buildPoiReviewChecklistCsv(manifest))
  }
  if (resolvedReviewWorkbookFile) {
    await mkdir(path.dirname(resolvedReviewWorkbookFile), { recursive: true })
    await writeFile(resolvedReviewWorkbookFile, buildPoiReviewWorkbookCsv(manifest))
  }
  if (resolvedReviewPacketFile) {
    await mkdir(path.dirname(resolvedReviewPacketFile), { recursive: true })
    await writeFile(resolvedReviewPacketFile, `${JSON.stringify(buildReviewPacket({
      rootDir,
      manifest,
      outputFile: resolvedOutputFile,
      reviewChecklistFile: resolvedReviewChecklistFile,
      reviewWorkbookFile: resolvedReviewWorkbookFile
    }), null, 2)}\n`)
  }
  return {
    artifactType,
    ok: true,
    status: 'TEMPLATE_GENERATED',
    checkedAt: new Date().toISOString(),
    summary: {
      outputFile: resolvedOutputFile,
      ...(resolvedReviewChecklistFile
        ? {
            reviewChecklistFile: resolvedReviewChecklistFile,
            checklistRows: manifest.pois.length
          }
        : {}),
      ...(resolvedReviewWorkbookFile
        ? {
            reviewWorkbookFile: resolvedReviewWorkbookFile,
            workbookRows: manifest.pois.length
          }
        : {}),
      ...(resolvedReviewPacketFile
        ? {
            reviewPacketFile: resolvedReviewPacketFile
          }
        : {}),
      poiSlots: manifest.pois.length,
      importedPoiCount: seedPois.length,
      todoPoiSlots: manifest.pois.length - seedPois.length,
      productionReady: manifest.productionReady,
      warning: 'Template contains TODO placeholders and must fail production manifest gate until reviewed real data is filled.'
    }
  }
}

async function runCli() {
  const args = process.argv.slice(2)
  const report = await writeXichengPoiProductionManifestTemplate({
    rootDir: path.resolve(readArgValue(args, '--root') || process.cwd()),
    outputFile: readArgValue(args, '--output'),
    count: readArgValue(args, '--count') || defaultPoiSlotCount,
    seedSqlFile: readArgValue(args, '--seed-sql'),
    reviewChecklistFile: readArgValue(args, '--review-checklist'),
    reviewWorkbookFile: readArgValue(args, '--review-workbook'),
    reviewPacketFile: readArgValue(args, '--review-packet')
  })
  console.log(JSON.stringify(report, null, 2))
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
