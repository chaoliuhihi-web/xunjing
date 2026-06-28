import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-poi-production-review-apply'
const readyStatus = 'PRODUCTION_REVIEW_APPLIED'
const notReadyStatus = 'PRODUCTION_REVIEW_DATA_REMAINS'
const allowedOutputDirs = new Set(['qa', 'tmp', 'workbench'])

const productionReviewFields = [
  'photoEvidenceStatus',
  'triggerSmokeStatus',
  'fieldEvidenceRefs',
  'fieldVerifiedBy',
  'fieldVerifiedAt',
  'reviewStatus',
  'geoStatus',
  'auditLicenseStatus',
  'status',
  'reviewedBy',
  'reviewedAt'
]

const requiredWorkbookFields = [
  'poiCode',
  ...productionReviewFields
]

const requiredProductionReviewFields = [
  'poiCode',
  ...productionReviewFields
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

function hasText(value) {
  return String(value || '').trim().length > 0
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function normalizeType(value) {
  return String(value || '').trim().toUpperCase()
}

function isApproved(value) {
  return normalizeType(value) === 'APPROVED'
}

function isPassed(value) {
  return normalizeType(value) === 'PASSED'
}

function isPublished(value) {
  return normalizeType(value) === 'PUBLISHED'
}

function resolveInputFile(rootDir, inputFile, optionName) {
  if (!inputFile) {
    throw new Error(`${optionName} is required`)
  }
  return path.isAbsolute(inputFile) ? path.resolve(inputFile) : path.resolve(rootDir, inputFile)
}

function resolveSafeOutputFile(rootDir, outputFile, optionName) {
  if (!outputFile) {
    throw new Error(`${optionName} is required`)
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
    throw new Error(`${optionName} must be under qa/, tmp/ or workbench/`)
  }
  return resolvedFile
}

function parseCsv(text, label = 'CSV') {
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
    throw new Error(`${label} contains an unterminated quoted cell`)
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((items) => items.some((item) => hasText(item)))
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function stringifyCsv(header, rows) {
  return [
    header.map(csvCell).join(','),
    ...rows.map((row) => header.map((field) => csvCell(row[field])).join(','))
  ].join('\n') + '\n'
}

function normalizeHeaderCell(value, index) {
  const normalized = String(value || '').trim()
  return index === 0 ? normalized.replace(/^\uFEFF/, '') : normalized
}

function assertRequiredFields(header, requiredFields, label) {
  const missing = requiredFields.filter((field) => !header.includes(field))
  if (missing.length > 0) {
    throw new Error(`${label} missing required columns: ${missing.join(', ')}`)
  }
}

function parseRows(text, requiredFields, label) {
  const rows = parseCsv(text, label)
  if (rows.length === 0) {
    throw new Error(`${label} is empty`)
  }
  const header = rows[0].map(normalizeHeaderCell)
  assertRequiredFields(header, requiredFields, label)
  return {
    header,
    rows: rows.slice(1).map((row) => Object.fromEntries(header.map((field, index) => [
      field,
      String(row[index] ?? '').trim()
    ])))
  }
}

function splitList(value) {
  return String(value || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
}

function isLoopbackHostname(hostname) {
  const normalized = String(hostname || '').trim().toLowerCase()
  return ['localhost', '127.0.0.1', '::1', '0.0.0.0', 'host.docker.internal'].includes(normalized)
}

function isNonLocalEvidenceRef(value) {
  if (!hasText(value)) {
    return false
  }
  const normalized = String(value).trim()
  if (/^(?:data|file):/i.test(normalized) || /imageBase64/i.test(normalized)) {
    return false
  }
  try {
    const url = new URL(normalized)
    const protocol = url.protocol.toLowerCase()
    if (protocol === 'https:') {
      return !isLoopbackHostname(url.hostname)
    }
    if (['oss:', 'cos:', 's3:'].includes(protocol)) {
      return hasText(url.hostname) && hasText(url.pathname.replaceAll('/', ''))
    }
  } catch {
    return false
  }
  return false
}

function productionReviewApprovalCandidate(row) {
  return isApproved(row.photoEvidenceStatus) &&
    isPassed(row.triggerSmokeStatus) &&
    isApproved(row.reviewStatus) &&
    isApproved(row.geoStatus) &&
    isApproved(row.auditLicenseStatus) &&
    isPublished(row.status)
}

function productionReviewReady(row) {
  const evidenceRefs = splitList(row.fieldEvidenceRefs)
  return productionReviewApprovalCandidate(row) &&
    evidenceRefs.length > 0 &&
    evidenceRefs.every(isNonLocalEvidenceRef) &&
    hasText(row.fieldVerifiedBy) &&
    hasText(row.fieldVerifiedAt) &&
    hasText(row.reviewedBy) &&
    hasText(row.reviewedAt)
}

function validateApprovedReviewRows(reviewRows, workbookPoiCodes) {
  const blockers = []
  const seenPoiCodes = new Set()
  reviewRows.forEach((row) => {
    if (!productionReviewApprovalCandidate(row)) {
      return
    }
    const label = row.poiCode || 'production-review-row'
    if (!workbookPoiCodes.has(row.poiCode)) {
      blockers.push(`${label} poiCode is not present in workbook`)
    }
    if (seenPoiCodes.has(row.poiCode)) {
      blockers.push(`${label} has duplicate approved production review rows`)
    }
    seenPoiCodes.add(row.poiCode)
    const evidenceRefs = splitList(row.fieldEvidenceRefs)
    if (evidenceRefs.length === 0 || evidenceRefs.some((ref) => !isNonLocalEvidenceRef(ref))) {
      blockers.push(`${label} fieldEvidenceRefs must include non-local HTTPS/object-storage references`)
    }
    if (!hasText(row.fieldVerifiedBy)) {
      blockers.push(`${label} fieldVerifiedBy is required`)
    }
    if (!hasText(row.fieldVerifiedAt)) {
      blockers.push(`${label} fieldVerifiedAt is required`)
    }
    if (!hasText(row.reviewedBy)) {
      blockers.push(`${label} reviewedBy is required`)
    }
    if (!hasText(row.reviewedAt)) {
      blockers.push(`${label} reviewedAt is required`)
    }
  })
  return blockers
}

function applyReviewRowsToWorkbookRows(workbookRows, reviewRows) {
  const appliedPoiCodes = new Set()
  const appliedReviewRows = []
  const reviewByPoiCode = new Map(
    reviewRows
      .filter(productionReviewReady)
      .map((row) => [row.poiCode, row])
  )
  workbookRows.forEach((row) => {
    const reviewRow = reviewByPoiCode.get(row.poiCode)
    if (!reviewRow) {
      return
    }
    productionReviewFields.forEach((field) => {
      row[field] = reviewRow[field]
    })
    appliedPoiCodes.add(row.poiCode)
    appliedReviewRows.push({
      poiCode: row.poiCode,
      fieldEvidenceRefCount: splitList(reviewRow.fieldEvidenceRefs).length,
      reviewedBy: reviewRow.reviewedBy,
      reviewedAt: reviewRow.reviewedAt
    })
  })
  return { appliedPoiCodes, appliedReviewRows }
}

function buildReport({
  workbookFile,
  productionReviewFile,
  outputFile,
  evidenceFile,
  workbookRows,
  reviewRows,
  approvedRows,
  appliedPoiCodes,
  appliedReviewRows,
  outputCsv
}) {
  const pendingProductionReviewPoiCodes = workbookRows
    .filter((row) => !productionReviewReady(row))
    .map((row) => row.poiCode)
  const blockers = pendingProductionReviewPoiCodes.length > 0
    ? [
        `${pendingProductionReviewPoiCodes.length} workbook POIs still require production field/content review`,
        'workbook gate is still required before manifest generation'
      ]
    : []
  const ok = blockers.length === 0
  return {
    artifactType,
    ok,
    status: ok ? readyStatus : notReadyStatus,
    checkedAt: new Date().toISOString(),
    summary: {
      workbookFile,
      productionReviewFile,
      outputFile,
      evidenceFile,
      workbookRows: workbookRows.length,
      productionReviewRows: reviewRows.length,
      approvedReviewRowCount: approvedRows.length,
      appliedPoiCount: appliedPoiCodes.size,
      pendingProductionReviewPoiCount: pendingProductionReviewPoiCodes.length,
      pendingProductionReviewPoiCodes,
      appliedReviewRows,
      outputSha256: sha256(outputCsv)
    },
    blockers,
    note: 'This production review apply evidence is not production evidence. Run workbook, manifest and seed gates after source license and all POI fields are reviewed.'
  }
}

export async function applyXichengPoiProductionReviewToWorkbook({
  rootDir = process.cwd(),
  workbookFile,
  productionReviewFile,
  outputFile,
  evidenceFile
} = {}) {
  const resolvedRootDir = path.resolve(rootDir)
  const resolvedWorkbookFile = resolveInputFile(resolvedRootDir, workbookFile, '--workbook')
  const resolvedProductionReviewFile = resolveInputFile(resolvedRootDir, productionReviewFile, '--production-review')
  const resolvedOutputFile = resolveSafeOutputFile(resolvedRootDir, outputFile, '--output')
  const resolvedEvidenceFile = resolveSafeOutputFile(resolvedRootDir, evidenceFile, '--evidence-file')
  const [workbookText, productionReviewText] = await Promise.all([
    readFile(resolvedWorkbookFile, 'utf8'),
    readFile(resolvedProductionReviewFile, 'utf8')
  ])
  const workbook = parseRows(workbookText, requiredWorkbookFields, 'workbook CSV')
  const productionReview = parseRows(productionReviewText, requiredProductionReviewFields, 'production review CSV')
  const workbookPoiCodes = new Set(workbook.rows.map((row) => row.poiCode))
  const validationBlockers = validateApprovedReviewRows(productionReview.rows, workbookPoiCodes)
  if (validationBlockers.length > 0) {
    throw new Error(validationBlockers.join('; '))
  }
  const approvedRows = productionReview.rows.filter(productionReviewReady)
  const { appliedPoiCodes, appliedReviewRows } = applyReviewRowsToWorkbookRows(workbook.rows, approvedRows)
  const outputCsv = stringifyCsv(workbook.header, workbook.rows)
  const report = buildReport({
    workbookFile: resolvedWorkbookFile,
    productionReviewFile: resolvedProductionReviewFile,
    outputFile: resolvedOutputFile,
    evidenceFile: resolvedEvidenceFile,
    workbookRows: workbook.rows,
    reviewRows: productionReview.rows,
    approvedRows,
    appliedPoiCodes,
    appliedReviewRows,
    outputCsv
  })
  await mkdir(path.dirname(resolvedOutputFile), { recursive: true })
  await writeFile(resolvedOutputFile, outputCsv)
  await mkdir(path.dirname(resolvedEvidenceFile), { recursive: true })
  await writeFile(resolvedEvidenceFile, `${JSON.stringify(report, null, 2)}\n`)
  return report
}

async function runCli() {
  const args = process.argv.slice(2)
  const report = await applyXichengPoiProductionReviewToWorkbook({
    rootDir: path.resolve(readArgValue(args, '--root') || process.cwd()),
    workbookFile: readArgValue(args, '--workbook'),
    productionReviewFile: readArgValue(args, '--production-review'),
    outputFile: readArgValue(args, '--output'),
    evidenceFile: readArgValue(args, '--evidence-file')
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
