import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-poi-source-review-apply'
const readyStatus = 'SOURCE_REVIEW_APPLIED'
const notReadyStatus = 'SOURCE_REVIEW_DATA_REMAINS'
const allowedOutputDirs = new Set(['qa', 'tmp', 'workbench'])

const requiredWorkbookFields = [
  'poiCode',
  'sourceUrl',
  'sourceType',
  'licenseStatus',
  'licenseEvidenceRef',
  'licenseReviewedBy',
  'licenseReviewedAt'
]

const requiredSourceReviewFields = [
  'sourceUrl',
  'sourceType',
  'licenseStatus',
  'licenseEvidenceRef',
  'licenseReviewedBy',
  'licenseReviewedAt'
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

function normalizeType(value) {
  return String(value || '').trim().toUpperCase()
}

function isApproved(value) {
  return normalizeType(value) === 'APPROVED'
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

function sourceGroupKey(row) {
  return [
    String(row.sourceUrl || '').trim(),
    normalizeType(row.sourceType)
  ].join('\n')
}

function approvedSourceGroups(sourceRows) {
  return sourceRows.filter((row) => isApproved(row.licenseStatus))
}

function validateApprovedSourceGroups(groups) {
  const blockers = []
  groups.forEach((group) => {
    const label = `${group.sourceType || 'source'} ${group.sourceUrl || ''}`.trim()
    if (!isNonLocalEvidenceRef(group.licenseEvidenceRef)) {
      blockers.push(`${label} licenseEvidenceRef must be a non-local HTTPS/object-storage reference`)
    }
    if (!hasText(group.licenseReviewedBy)) {
      blockers.push(`${label} licenseReviewedBy is required`)
    }
    if (!hasText(group.licenseReviewedAt)) {
      blockers.push(`${label} licenseReviewedAt is required`)
    }
  })
  return blockers
}

function sourceGroupMatchesWorkbookRow(sourceGroup, workbookRow) {
  if (sourceGroupKey(sourceGroup) !== sourceGroupKey(workbookRow)) {
    return false
  }
  const scopedPoiCodes = new Set(splitList(sourceGroup.poiCodes))
  return scopedPoiCodes.size === 0 || scopedPoiCodes.has(workbookRow.poiCode)
}

function applySourceGroupsToWorkbookRows(workbookRows, sourceGroups) {
  const appliedPoiCodes = new Set()
  const appliedSourceGroups = []
  sourceGroups.forEach((sourceGroup) => {
    let poiCount = 0
    workbookRows.forEach((row) => {
      if (!sourceGroupMatchesWorkbookRow(sourceGroup, row)) {
        return
      }
      row.licenseStatus = 'APPROVED'
      row.licenseEvidenceRef = sourceGroup.licenseEvidenceRef
      row.licenseReviewedBy = sourceGroup.licenseReviewedBy
      row.licenseReviewedAt = sourceGroup.licenseReviewedAt
      appliedPoiCodes.add(row.poiCode)
      poiCount += 1
    })
    appliedSourceGroups.push({
      sourceUrl: sourceGroup.sourceUrl,
      sourceType: sourceGroup.sourceType,
      poiCount,
      licenseEvidenceRef: sourceGroup.licenseEvidenceRef
    })
  })
  return { appliedPoiCodes, appliedSourceGroups }
}

function sourceLicenseReady(row) {
  return isApproved(row.licenseStatus) &&
    isNonLocalEvidenceRef(row.licenseEvidenceRef) &&
    hasText(row.licenseReviewedBy) &&
    hasText(row.licenseReviewedAt)
}

function buildReport({
  workbookFile,
  sourceReviewFile,
  outputFile,
  evidenceFile,
  workbookRows,
  sourceRows,
  approvedGroups,
  appliedPoiCodes,
  appliedSourceGroups,
  outputCsv
}) {
  const pendingSourcePoiCodes = workbookRows
    .filter((row) => !sourceLicenseReady(row))
    .map((row) => row.poiCode)
  const blockers = pendingSourcePoiCodes.length > 0
    ? [
        `${pendingSourcePoiCodes.length} workbook POIs still require source license review`,
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
      sourceReviewFile,
      outputFile,
      evidenceFile,
      workbookRows: workbookRows.length,
      sourceReviewRows: sourceRows.length,
      approvedSourceGroupCount: approvedGroups.length,
      appliedPoiCount: appliedPoiCodes.size,
      pendingSourcePoiCount: pendingSourcePoiCodes.length,
      pendingSourcePoiCodes,
      appliedSourceGroups,
      outputSha256: sha256(outputCsv)
    },
    blockers,
    note: 'This source review apply evidence is not production evidence. Run workbook, manifest and seed gates after all POI fields are reviewed.'
  }
}

export async function applyXichengPoiSourceReviewToWorkbook({
  rootDir = process.cwd(),
  workbookFile,
  sourceReviewFile,
  outputFile,
  evidenceFile
} = {}) {
  const resolvedRootDir = path.resolve(rootDir)
  const resolvedWorkbookFile = resolveInputFile(resolvedRootDir, workbookFile, '--workbook')
  const resolvedSourceReviewFile = resolveInputFile(resolvedRootDir, sourceReviewFile, '--source-review')
  const resolvedOutputFile = resolveSafeOutputFile(resolvedRootDir, outputFile, '--output')
  const resolvedEvidenceFile = resolveSafeOutputFile(resolvedRootDir, evidenceFile, '--evidence-file')
  const [workbookText, sourceReviewText] = await Promise.all([
    readFile(resolvedWorkbookFile, 'utf8'),
    readFile(resolvedSourceReviewFile, 'utf8')
  ])
  const workbook = parseRows(workbookText, requiredWorkbookFields, 'workbook CSV')
  const sourceReview = parseRows(sourceReviewText, requiredSourceReviewFields, 'source review CSV')
  const approvedGroups = approvedSourceGroups(sourceReview.rows)
  const validationBlockers = validateApprovedSourceGroups(approvedGroups)
  if (validationBlockers.length > 0) {
    throw new Error(validationBlockers.join('; '))
  }
  const { appliedPoiCodes, appliedSourceGroups } = applySourceGroupsToWorkbookRows(workbook.rows, approvedGroups)
  const outputCsv = stringifyCsv(workbook.header, workbook.rows)
  const report = buildReport({
    workbookFile: resolvedWorkbookFile,
    sourceReviewFile: resolvedSourceReviewFile,
    outputFile: resolvedOutputFile,
    evidenceFile: resolvedEvidenceFile,
    workbookRows: workbook.rows,
    sourceRows: sourceReview.rows,
    approvedGroups,
    appliedPoiCodes,
    appliedSourceGroups,
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
  const report = await applyXichengPoiSourceReviewToWorkbook({
    rootDir: path.resolve(readArgValue(args, '--root') || process.cwd()),
    workbookFile: readArgValue(args, '--workbook'),
    sourceReviewFile: readArgValue(args, '--source-review'),
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
