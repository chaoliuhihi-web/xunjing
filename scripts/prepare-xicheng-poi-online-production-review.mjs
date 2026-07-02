import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-poi-online-production-review-prepare'
const readyStatus = 'ONLINE_PRODUCTION_REVIEW_PREPARED'
const remainsStatus = 'ONLINE_PRODUCTION_REVIEW_REMAINS'
const sourceCoverageArtifactType = 'xicheng-poi-source-coverage'
const sourceCoverageReadyStatus = 'SOURCE_COVERAGE_READY'
const sourceReviewApplyArtifactType = 'xicheng-poi-source-review-apply'
const sourceReviewApplyReadyStatus = 'SOURCE_REVIEW_APPLIED'
const triggerSmokeApplyArtifactType = 'xicheng-poi-trigger-smoke-apply'
const triggerSmokeApplyReadyStatus = 'TRIGGER_SMOKE_APPLIED'
const allowedOutputDirs = new Set(['qa', 'tmp', 'workbench'])
const defaultReviewedBy = 'xicheng-online-official-public-source-review'
const approved = 'APPROVED'
const passed = 'PASSED'
const published = 'PUBLISHED'
const nextActionAfterOnlineReview = 'Run production-review:apply, workbook:gate, manifest and seed gates.'

const requiredWorkbookFields = [
  'poiCode',
  'sourceTitle',
  'sourceUrl',
  'sourceType',
  'licenseStatus',
  'licenseEvidenceRef',
  'licenseReviewedBy',
  'licenseReviewedAt',
  'latitude',
  'longitude'
]

const requiredProductionReviewFields = [
  'poiCode',
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

function readArgValue(args, name) {
  const equalPrefix = `${name}=`
  const equalArg = args.find((arg) => arg.startsWith(equalPrefix))
  if (equalArg) {
    return equalArg.slice(equalPrefix.length)
  }
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
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

function parseRows(text, requiredFields, label) {
  const rows = parseCsv(text, label)
  if (rows.length === 0) {
    throw new Error(`${label} is empty`)
  }
  const header = rows[0].map(normalizeHeaderCell)
  const missing = requiredFields.filter((field) => !header.includes(field))
  if (missing.length > 0) {
    throw new Error(`${label} missing required columns: ${missing.join(', ')}`)
  }
  return {
    header,
    rows: rows.slice(1).map((row) => Object.fromEntries(header.map((field, index) => [
      field,
      String(row[index] ?? '').trim()
    ])))
  }
}

function isLoopbackHostname(hostname) {
  const normalized = String(hostname || '').trim().toLowerCase()
  return ['localhost', '127.0.0.1', '::1', '0.0.0.0', 'host.docker.internal'].includes(normalized)
}

function isNonLocalHttpsRef(value) {
  if (!hasText(value)) {
    return false
  }
  try {
    const url = new URL(String(value).trim())
    return url.protocol.toLowerCase() === 'https:' && hasText(url.hostname) && !isLoopbackHostname(url.hostname)
  } catch {
    return false
  }
}

function finiteNumber(value) {
  const number = Number(value)
  return Number.isFinite(number)
}

function checkedAtDate(...values) {
  for (const value of values) {
    const text = String(value || '').trim()
    const match = text.match(/^\d{4}-\d{2}-\d{2}/)
    if (match) {
      return match[0]
    }
  }
  return new Date().toISOString().slice(0, 10)
}

function uniq(items) {
  return [...new Set(items.filter(hasText))]
}

function validateSourceCoverageEvidence(evidence) {
  const blockers = []
  const summary = evidence?.summary || {}
  if (evidence?.artifactType !== sourceCoverageArtifactType) {
    blockers.push(`source coverage evidence artifactType must be ${sourceCoverageArtifactType}`)
  }
  if (evidence?.ok !== true || evidence?.status !== sourceCoverageReadyStatus) {
    blockers.push(`source coverage evidence status must be ${sourceCoverageReadyStatus}`)
  }
  if (summary.sourcePageFetchMode !== 'live') {
    blockers.push('source coverage evidence sourcePageFetchMode must be live')
  }
  if (Number(summary.uncoveredPoiCount) !== 0) {
    blockers.push('source coverage evidence uncoveredPoiCount must be 0')
  }
  const sourcePages = Array.isArray(summary.sourcePages) ? summary.sourcePages : []
  if (sourcePages.length === 0) {
    blockers.push('source coverage evidence summary.sourcePages is required')
  }
  sourcePages.forEach((page) => {
    const label = page?.sourceUrl || 'source page'
    if (!isNonLocalHttpsRef(page?.sourceUrl)) {
      blockers.push(`${label} must be a non-local HTTPS source URL`)
    }
    if (page?.fetchMode !== 'live' || page?.ok !== true || Number(page?.httpStatus) < 200 || Number(page?.httpStatus) >= 300) {
      blockers.push(`${label} must be live fetched with a 2xx HTTP status`)
    }
    if (Number(page?.sourceTextLength) <= 0 || !/^[a-f0-9]{64}$/i.test(String(page?.sourceTextSha256 || ''))) {
      blockers.push(`${label} must include fetched text length and sha256`)
    }
  })
  const sourceGroups = Array.isArray(summary.sourceGroups) ? summary.sourceGroups : []
  if (sourceGroups.length === 0) {
    blockers.push('source coverage evidence summary.sourceGroups is required')
  }
  return blockers
}

function validateSourceReviewApplyEvidence(evidence, {
  workbookFile,
  workbookText,
  workbookRows
}) {
  const blockers = []
  const summary = evidence?.summary || {}
  if (evidence?.artifactType !== sourceReviewApplyArtifactType) {
    blockers.push(`source review apply evidence artifactType must be ${sourceReviewApplyArtifactType}`)
  }
  if (evidence?.ok !== true || evidence?.status !== sourceReviewApplyReadyStatus) {
    blockers.push(`source review apply evidence status must be ${sourceReviewApplyReadyStatus}`)
  }
  if (path.resolve(summary.outputFile || '') !== path.resolve(workbookFile)) {
    blockers.push('source review apply evidence outputFile must reference the same workbook CSV')
  }
  if (summary.outputSha256 !== sha256(workbookText)) {
    blockers.push('source review apply evidence outputSha256 must match workbook CSV')
  }
  if (Number(summary.pendingSourcePoiCount) !== 0) {
    blockers.push('source review apply evidence pendingSourcePoiCount must be 0')
  }
  if (Number(summary.appliedPoiCount) < workbookRows.length) {
    blockers.push(`source review apply evidence appliedPoiCount must be at least ${workbookRows.length}`)
  }
  if (summary.sourceCoverageStatus !== sourceCoverageReadyStatus || Number(summary.sourceCoverageUncoveredPoiCount) !== 0) {
    blockers.push(`source review apply evidence source coverage must be ${sourceCoverageReadyStatus} with 0 uncovered POIs`)
  }
  return blockers
}

function validateTriggerSmokeApplyEvidence(evidence, {
  productionReviewFile,
  productionReviewText,
  productionReviewRows
}) {
  const blockers = []
  const summary = evidence?.summary || {}
  if (evidence?.artifactType !== triggerSmokeApplyArtifactType) {
    blockers.push(`trigger smoke apply evidence artifactType must be ${triggerSmokeApplyArtifactType}`)
  }
  if (evidence?.ok !== true || evidence?.status !== triggerSmokeApplyReadyStatus) {
    blockers.push(`trigger smoke apply evidence status must be ${triggerSmokeApplyReadyStatus}`)
  }
  if (path.resolve(summary.outputFile || '') !== path.resolve(productionReviewFile)) {
    blockers.push('trigger smoke apply evidence outputFile must reference the same production review CSV')
  }
  if (summary.outputSha256 !== sha256(productionReviewText)) {
    blockers.push('trigger smoke apply evidence outputSha256 must match production review CSV')
  }
  if (Number(summary.pendingTriggerSmokePoiCount) !== 0) {
    blockers.push('trigger smoke apply evidence pendingTriggerSmokePoiCount must be 0')
  }
  if (Number(summary.appliedPoiCount) < productionReviewRows.length) {
    blockers.push(`trigger smoke apply evidence appliedPoiCount must be at least ${productionReviewRows.length}`)
  }
  return blockers
}

function buildSourcePageMap(sourceCoverageEvidence) {
  const sourcePages = Array.isArray(sourceCoverageEvidence?.summary?.sourcePages)
    ? sourceCoverageEvidence.summary.sourcePages
    : []
  return new Map(sourcePages.map((page) => [String(page.sourceUrl || '').trim(), page]))
}

function buildCoverageByPoiCode(sourceCoverageEvidence) {
  const groups = Array.isArray(sourceCoverageEvidence?.summary?.sourceGroups)
    ? sourceCoverageEvidence.summary.sourceGroups
    : []
  const byPoiCode = new Map()
  groups.forEach((group) => {
    const poiCodes = Array.isArray(group?.coveredPoiCodes) ? group.coveredPoiCodes : []
    poiCodes.forEach((poiCode) => {
      if (hasText(poiCode)) {
        byPoiCode.set(String(poiCode).trim(), group)
      }
    })
  })
  return byPoiCode
}

function onlineReadyReviewForPoi({
  productionReviewRow,
  workbookRow,
  coverageGroup,
  sourcePage,
  reviewedBy,
  reviewedAt,
  evidencePackageRef
}) {
  const blockers = []
  const poiCode = productionReviewRow.poiCode
  if (!workbookRow) {
    blockers.push(`${poiCode} workbook row is required`)
    return { ready: false, blockers }
  }
  if (normalizeType(productionReviewRow.triggerSmokeStatus) !== passed) {
    blockers.push(`${poiCode} triggerSmokeStatus must be PASSED`)
  }
  if (normalizeType(workbookRow.sourceType) !== 'OFFICIAL_PUBLIC') {
    blockers.push(`${poiCode} sourceType must be OFFICIAL_PUBLIC`)
  }
  if (normalizeType(workbookRow.licenseStatus) !== approved) {
    blockers.push(`${poiCode} licenseStatus must be APPROVED`)
  }
  if (!isNonLocalHttpsRef(workbookRow.sourceUrl)) {
    blockers.push(`${poiCode} sourceUrl must be non-local HTTPS`)
  }
  if (!isNonLocalHttpsRef(workbookRow.licenseEvidenceRef)) {
    blockers.push(`${poiCode} licenseEvidenceRef must be non-local HTTPS`)
  }
  if (!finiteNumber(workbookRow.latitude) || !finiteNumber(workbookRow.longitude)) {
    blockers.push(`${poiCode} latitude and longitude must be finite`)
  }
  if (!hasText(workbookRow.licenseReviewedBy) || !hasText(workbookRow.licenseReviewedAt)) {
    blockers.push(`${poiCode} source license reviewer and reviewed date are required`)
  }
  if (!coverageGroup) {
    blockers.push(`${poiCode} must be covered by live source coverage evidence`)
  } else {
    if (normalizeType(coverageGroup.sourceType) !== 'OFFICIAL_PUBLIC') {
      blockers.push(`${poiCode} coverage sourceType must be OFFICIAL_PUBLIC`)
    }
    if (String(coverageGroup.sourceUrl || '').trim() !== String(workbookRow.sourceUrl || '').trim()) {
      blockers.push(`${poiCode} coverage sourceUrl must match workbook sourceUrl`)
    }
    if (Number(coverageGroup.uncoveredPoiCount) !== 0) {
      blockers.push(`${poiCode} coverage group must have uncoveredPoiCount=0`)
    }
  }
  if (!sourcePage) {
    blockers.push(`${poiCode} source page fetch evidence is required`)
  }
  if (hasText(evidencePackageRef) && !isNonLocalHttpsRef(evidencePackageRef)) {
    blockers.push(`${poiCode} evidence package reference must be non-local HTTPS when provided`)
  }
  if (blockers.length > 0) {
    return { ready: false, blockers }
  }
  const evidenceRefs = uniq([
    workbookRow.sourceUrl,
    workbookRow.licenseEvidenceRef,
    evidencePackageRef
  ])
  return {
    ready: true,
    row: {
      ...productionReviewRow,
      photoEvidenceStatus: approved,
      triggerSmokeStatus: passed,
      fieldEvidenceRefs: evidenceRefs.join('|'),
      fieldVerifiedBy: reviewedBy,
      fieldVerifiedAt: reviewedAt,
      reviewStatus: approved,
      geoStatus: approved,
      auditLicenseStatus: approved,
      status: published,
      reviewedBy,
      reviewedAt,
      nextAction: nextActionAfterOnlineReview
    }
  }
}

function buildReport({
  workbookFile,
  productionReviewFile,
  sourceCoverageEvidenceFile,
  sourceCoverageEvidence,
  sourceReviewApplyEvidenceFile,
  sourceReviewApplyEvidence,
  triggerSmokeApplyEvidenceFile,
  triggerSmokeApplyEvidence,
  outputFile,
  evidenceFile,
  workbookRows,
  productionReviewRows,
  preparedRows,
  pendingRows,
  outputText
}) {
  const ok = pendingRows.length === 0
  return {
    artifactType,
    ok,
    status: ok ? readyStatus : remainsStatus,
    checkedAt: new Date().toISOString(),
    summary: {
      workbookFile,
      productionReviewFile,
      sourceCoverageEvidenceFile,
      sourceCoverageStatus: sourceCoverageEvidence.status,
      sourcePageFetchMode: sourceCoverageEvidence.summary?.sourcePageFetchMode,
      sourceReviewApplyEvidenceFile,
      sourceReviewApplyStatus: sourceReviewApplyEvidence.status,
      triggerSmokeApplyEvidenceFile,
      triggerSmokeApplyStatus: triggerSmokeApplyEvidence.status,
      outputFile,
      evidenceFile,
      workbookRows: workbookRows.length,
      productionReviewRows: productionReviewRows.length,
      preparedPoiCount: preparedRows.length,
      pendingOnlineReviewPoiCount: pendingRows.length,
      pendingOnlineReviewPoiCodes: pendingRows.map((row) => row.poiCode),
      onlineSourceEvidenceRefCount: preparedRows.reduce((total, row) => {
        return total + String(row.fieldEvidenceRefs || '').split('|').filter(Boolean).length
      }, 0),
      sourceGroupCount: Array.isArray(sourceCoverageEvidence.summary?.sourceGroups)
        ? sourceCoverageEvidence.summary.sourceGroups.length
        : 0,
      sourcePageCount: Array.isArray(sourceCoverageEvidence.summary?.sourcePages)
        ? sourceCoverageEvidence.summary.sourcePages.length
        : 0,
      preparedReviewRows: preparedRows.map((row) => ({
        poiCode: row.poiCode,
        fieldEvidenceRefs: row.fieldEvidenceRefs,
        reviewedBy: row.reviewedBy,
        reviewedAt: row.reviewedAt
      })),
      outputSha256: sha256(outputText)
    },
    blockers: pendingRows.length === 0
      ? []
      : pendingRows.flatMap((row) => row.blockers),
    note: 'Prepared from online official/public source evidence and trigger smoke evidence. This is online-source production review evidence, not on-site field photography.'
  }
}

export async function prepareXichengPoiOnlineProductionReview({
  rootDir = process.cwd(),
  workbookFile,
  productionReviewFile,
  sourceCoverageEvidenceFile,
  sourceReviewApplyEvidenceFile,
  triggerSmokeApplyEvidenceFile,
  outputFile,
  evidenceFile,
  reviewedBy = defaultReviewedBy,
  reviewedAt,
  evidencePackageRef
} = {}) {
  const resolvedRootDir = path.resolve(rootDir)
  const resolvedWorkbookFile = resolveInputFile(resolvedRootDir, workbookFile, '--workbook')
  const resolvedProductionReviewFile = resolveInputFile(resolvedRootDir, productionReviewFile, '--production-review')
  const resolvedSourceCoverageEvidenceFile = resolveInputFile(resolvedRootDir, sourceCoverageEvidenceFile, '--source-coverage-evidence')
  const resolvedSourceReviewApplyEvidenceFile = resolveInputFile(resolvedRootDir, sourceReviewApplyEvidenceFile, '--source-review-apply-evidence')
  const resolvedTriggerSmokeApplyEvidenceFile = resolveInputFile(resolvedRootDir, triggerSmokeApplyEvidenceFile, '--trigger-smoke-apply-evidence')
  const resolvedOutputFile = resolveSafeOutputFile(resolvedRootDir, outputFile, '--output')
  const resolvedEvidenceFile = resolveSafeOutputFile(resolvedRootDir, evidenceFile, '--evidence-file')
  const [
    workbookText,
    productionReviewText,
    sourceCoverageEvidenceText,
    sourceReviewApplyEvidenceText,
    triggerSmokeApplyEvidenceText
  ] = await Promise.all([
    readFile(resolvedWorkbookFile, 'utf8'),
    readFile(resolvedProductionReviewFile, 'utf8'),
    readFile(resolvedSourceCoverageEvidenceFile, 'utf8'),
    readFile(resolvedSourceReviewApplyEvidenceFile, 'utf8'),
    readFile(resolvedTriggerSmokeApplyEvidenceFile, 'utf8')
  ])
  const workbook = parseRows(workbookText, requiredWorkbookFields, 'workbook CSV')
  const productionReview = parseRows(productionReviewText, requiredProductionReviewFields, 'production review CSV')
  const sourceCoverageEvidence = JSON.parse(sourceCoverageEvidenceText)
  const sourceReviewApplyEvidence = JSON.parse(sourceReviewApplyEvidenceText)
  const triggerSmokeApplyEvidence = JSON.parse(triggerSmokeApplyEvidenceText)
  const validationBlockers = [
    ...validateSourceCoverageEvidence(sourceCoverageEvidence),
    ...validateSourceReviewApplyEvidence(sourceReviewApplyEvidence, {
      workbookFile: resolvedWorkbookFile,
      workbookText,
      workbookRows: workbook.rows
    }),
    ...validateTriggerSmokeApplyEvidence(triggerSmokeApplyEvidence, {
      productionReviewFile: resolvedProductionReviewFile,
      productionReviewText,
      productionReviewRows: productionReview.rows
    })
  ]
  if (validationBlockers.length > 0) {
    throw new Error(validationBlockers.join('; '))
  }
  const reviewDate = checkedAtDate(
    reviewedAt,
    sourceCoverageEvidence.checkedAt,
    sourceReviewApplyEvidence.checkedAt,
    triggerSmokeApplyEvidence.checkedAt
  )
  const coverageByPoiCode = buildCoverageByPoiCode(sourceCoverageEvidence)
  const sourcePageByUrl = buildSourcePageMap(sourceCoverageEvidence)
  const workbookByPoiCode = new Map(workbook.rows.map((row) => [row.poiCode, row]))
  const preparedRows = []
  const pendingRows = []
  const outputRows = productionReview.rows.map((productionReviewRow) => {
    const workbookRow = workbookByPoiCode.get(productionReviewRow.poiCode)
    const review = onlineReadyReviewForPoi({
      productionReviewRow,
      workbookRow,
      coverageGroup: coverageByPoiCode.get(productionReviewRow.poiCode),
      sourcePage: workbookRow ? sourcePageByUrl.get(workbookRow.sourceUrl) : undefined,
      reviewedBy: String(reviewedBy || defaultReviewedBy).trim(),
      reviewedAt: reviewDate,
      evidencePackageRef
    })
    if (!review.ready) {
      pendingRows.push({
        poiCode: productionReviewRow.poiCode,
        blockers: review.blockers
      })
      return {
        ...productionReviewRow,
        nextAction: `Online source review pending: ${review.blockers.join('; ')}`
      }
    }
    preparedRows.push(review.row)
    return review.row
  })
  const outputText = stringifyCsv(productionReview.header, outputRows)
  const report = buildReport({
    workbookFile: resolvedWorkbookFile,
    productionReviewFile: resolvedProductionReviewFile,
    sourceCoverageEvidenceFile: resolvedSourceCoverageEvidenceFile,
    sourceCoverageEvidence,
    sourceReviewApplyEvidenceFile: resolvedSourceReviewApplyEvidenceFile,
    sourceReviewApplyEvidence,
    triggerSmokeApplyEvidenceFile: resolvedTriggerSmokeApplyEvidenceFile,
    triggerSmokeApplyEvidence,
    outputFile: resolvedOutputFile,
    evidenceFile: resolvedEvidenceFile,
    workbookRows: workbook.rows,
    productionReviewRows: productionReview.rows,
    preparedRows,
    pendingRows,
    outputText
  })
  await mkdir(path.dirname(resolvedOutputFile), { recursive: true })
  await writeFile(resolvedOutputFile, outputText)
  await mkdir(path.dirname(resolvedEvidenceFile), { recursive: true })
  await writeFile(resolvedEvidenceFile, `${JSON.stringify(report, null, 2)}\n`)
  return report
}

async function runCli() {
  const args = process.argv.slice(2)
  const report = await prepareXichengPoiOnlineProductionReview({
    rootDir: path.resolve(readArgValue(args, '--root') || process.cwd()),
    workbookFile: readArgValue(args, '--workbook'),
    productionReviewFile: readArgValue(args, '--production-review'),
    sourceCoverageEvidenceFile: readArgValue(args, '--source-coverage-evidence'),
    sourceReviewApplyEvidenceFile: readArgValue(args, '--source-review-apply-evidence'),
    triggerSmokeApplyEvidenceFile: readArgValue(args, '--trigger-smoke-apply-evidence'),
    outputFile: readArgValue(args, '--output'),
    evidenceFile: readArgValue(args, '--evidence-file'),
    reviewedBy: readArgValue(args, '--reviewed-by') || defaultReviewedBy,
    reviewedAt: readArgValue(args, '--reviewed-at'),
    evidencePackageRef: readArgValue(args, '--evidence-package-ref')
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
