import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-poi-production-manifest-from-workbook'
const allowedOutputDirs = new Set(['qa', 'tmp', 'workbench'])
const expectedRegionCode = 'beijing-xicheng'
const expectedPackageCode = 'XICHENG-MAP-001'

const expectedHeader = [
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

function hasArg(args, name) {
  return args.includes(name) || args.some((arg) => arg.startsWith(`${name}=`))
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function resolveInputFile(rootDir, inputFile, optionName) {
  if (!inputFile) {
    throw new Error(`${optionName} is required`)
  }
  return path.isAbsolute(inputFile) ? path.resolve(inputFile) : path.resolve(rootDir, inputFile)
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

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') {
        inQuotes = false
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n' || char === '\r') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      if (char === '\r' && next === '\n') {
        index += 1
      }
    } else {
      cell += char
    }
  }

  if (inQuotes) {
    throw new Error('workbook CSV contains an unterminated quoted cell')
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((items) => items.some((item) => String(item || '').trim().length > 0))
}

function normalizeHeaderCell(value, index) {
  const normalized = String(value || '').trim()
  return index === 0 ? normalized.replace(/^\uFEFF/, '') : normalized
}

function assertExpectedHeader(header) {
  const normalized = header.map(normalizeHeaderCell)
  const mismatchIndex = expectedHeader.findIndex((field, index) => normalized[index] !== field)
  if (mismatchIndex >= 0 || normalized.length !== expectedHeader.length) {
    throw new Error('workbook header does not match xicheng review workbook format')
  }
}

function rowObject(header, values) {
  return Object.fromEntries(header.map((field, index) => [field, String(values[index] ?? '').trim()]))
}

function splitList(value) {
  return String(value || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
}

function numberValue(value, fallback = null) {
  const normalized = String(value ?? '').trim()
  if (!normalized) {
    return fallback
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : fallback
}

function buildPoi(row) {
  return {
    poiCode: row.poiCode,
    regionCode: expectedRegionCode,
    packageCode: expectedPackageCode,
    name: row.name,
    displayName: row.displayName,
    aliases: splitList(row.aliases),
    category: row.category,
    priority: row.priority || 'P0',
    address: row.address,
    latitude: numberValue(row.latitude),
    longitude: numberValue(row.longitude),
    coordType: row.coordType || 'GCJ02',
    source: {
      sourceTitle: row.sourceTitle,
      sourceUrl: row.sourceUrl,
      sourceType: row.sourceType,
      licenseStatus: row.licenseStatus,
      licenseEvidenceRef: row.licenseEvidenceRef,
      licenseReviewedBy: row.licenseReviewedBy,
      licenseReviewedAt: row.licenseReviewedAt
    },
    trigger: {
      gpsRadiusMeters: numberValue(row.gpsRadiusMeters),
      ocrKeywords: splitList(row.ocrKeywords),
      photoLabels: splitList(row.photoLabels),
      minConfidence: numberValue(row.minConfidence)
    },
    fieldEvidence: {
      photoEvidenceStatus: row.photoEvidenceStatus,
      triggerSmokeStatus: row.triggerSmokeStatus,
      evidenceRefs: splitList(row.fieldEvidenceRefs),
      verifiedBy: row.fieldVerifiedBy,
      verifiedAt: row.fieldVerifiedAt
    },
    content: {
      shortIntro: row.shortIntro,
      recommendedQuestions: splitList(row.recommendedQuestions)
    },
    audit: {
      reviewStatus: row.reviewStatus,
      geoStatus: row.geoStatus,
      licenseStatus: row.auditLicenseStatus,
      status: row.status,
      reviewedBy: row.reviewedBy,
      reviewedAt: row.reviewedAt
    }
  }
}

function buildReviewBatch(reviewBatch = {}) {
  return {
    batchCode: reviewBatch.batchCode || '',
    dataOwner: reviewBatch.dataOwner || '',
    sourceCompiledBy: reviewBatch.sourceCompiledBy || '',
    sourceCompiledAt: reviewBatch.sourceCompiledAt || '',
    reviewedBy: reviewBatch.reviewedBy || '',
    reviewedAt: reviewBatch.reviewedAt || '',
    evidencePackageRef: reviewBatch.evidencePackageRef || ''
  }
}

function buildReviewBatchFromArgs(args) {
  return buildReviewBatch({
    batchCode: readArgValue(args, '--batch-code'),
    dataOwner: readArgValue(args, '--data-owner'),
    sourceCompiledBy: readArgValue(args, '--source-compiled-by'),
    sourceCompiledAt: readArgValue(args, '--source-compiled-at'),
    reviewedBy: readArgValue(args, '--reviewed-by'),
    reviewedAt: readArgValue(args, '--reviewed-at'),
    evidencePackageRef: readArgValue(args, '--evidence-package-ref')
  })
}

export function buildXichengPoiProductionManifestFromWorkbookCsv(workbookText, {
  productionReady = false,
  reviewBatch,
  targetP0PoiCount,
  workbookFile
} = {}) {
  const rows = parseCsv(workbookText)
  if (rows.length === 0) {
    throw new Error('workbook CSV is empty')
  }
  const header = rows[0].map(normalizeHeaderCell)
  assertExpectedHeader(header)
  const workbookRows = rows.slice(1).map((values) => rowObject(header, values))
  const pois = workbookRows.map(buildPoi)
  const normalizedTargetCount = Number(targetP0PoiCount) || pois.length

  return {
    regionCode: expectedRegionCode,
    packageCode: expectedPackageCode,
    targetP0PoiCount: normalizedTargetCount,
    productionReady: productionReady === true,
    reviewBatch: buildReviewBatch(reviewBatch),
    sourceWorkbook: {
      workbookFile,
      workbookSha256: sha256(workbookText),
      rowCount: workbookRows.length,
      arraySeparator: '|'
    },
    pois
  }
}

export async function writeXichengPoiProductionManifestFromWorkbook({
  rootDir = process.cwd(),
  workbookFile,
  outputFile,
  productionReady = false,
  reviewBatch,
  targetP0PoiCount
} = {}) {
  const resolvedRoot = path.resolve(rootDir)
  const resolvedWorkbookFile = resolveInputFile(resolvedRoot, workbookFile, '--workbook')
  const resolvedOutputFile = resolveOutputFile(resolvedRoot, outputFile)
  const workbookText = await readFile(resolvedWorkbookFile, 'utf8')
  const manifest = buildXichengPoiProductionManifestFromWorkbookCsv(workbookText, {
    productionReady,
    reviewBatch,
    targetP0PoiCount,
    workbookFile: resolvedWorkbookFile
  })

  await mkdir(path.dirname(resolvedOutputFile), { recursive: true })
  await writeFile(resolvedOutputFile, `${JSON.stringify(manifest, null, 2)}\n`)

  return {
    artifactType,
    ok: true,
    status: 'PRODUCTION_MANIFEST_DRAFT_GENERATED',
    checkedAt: new Date().toISOString(),
    summary: {
      workbookFile: resolvedWorkbookFile,
      workbookSha256: manifest.sourceWorkbook.workbookSha256,
      outputFile: resolvedOutputFile,
      workbookRows: manifest.pois.length,
      targetP0PoiCount: manifest.targetP0PoiCount,
      productionReady: manifest.productionReady,
      reviewBatchCode: manifest.reviewBatch.batchCode,
      warning: 'Run xicheng production manifest gate before seed generation.'
    }
  }
}

async function runCli() {
  const args = process.argv.slice(2)
  const productionReadyValue = readArgValue(args, '--production-ready')
  const report = await writeXichengPoiProductionManifestFromWorkbook({
    rootDir: path.resolve(readArgValue(args, '--root') || process.cwd()),
    workbookFile: readArgValue(args, '--workbook'),
    outputFile: readArgValue(args, '--output'),
    productionReady: productionReadyValue === 'true' || (hasArg(args, '--production-ready') && productionReadyValue !== 'false'),
    reviewBatch: buildReviewBatchFromArgs(args),
    targetP0PoiCount: readArgValue(args, '--target-pois')
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
