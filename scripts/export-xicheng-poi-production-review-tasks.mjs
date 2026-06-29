import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-poi-production-review-tasks'
const readyStatus = 'PRODUCTION_REVIEW_TASKS_READY'
const requiredStatus = 'PRODUCTION_REVIEW_TASKS_REQUIRED'
const allowedOutputDirs = new Set(['qa', 'tmp', 'workbench'])

const requiredFields = [
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

const fieldRequirements = {
  photoEvidenceStatus: {
    ownerLane: 'field-review',
    expectedValue: 'APPROVED',
    taskDetail: 'Approve the POI photo or field evidence after real non-local evidence is attached.',
    requiredEvidence: 'photoEvidenceStatus=APPROVED with fieldEvidenceRefs pointing to non-local evidence.'
  },
  triggerSmokeStatus: {
    ownerLane: 'trigger-smoke',
    expectedValue: 'PASSED',
    taskDetail: 'Run real Xicheng trigger smoke and apply the passed result to production review.',
    requiredEvidence: 'triggerSmokeStatus=PASSED from xicheng-poi-trigger-smoke-apply evidence.'
  },
  fieldEvidenceRefs: {
    ownerLane: 'field-review',
    expectedValue: 'non-local https/oss/cos/s3 evidence ref',
    taskDetail: 'Attach one or more non-local field evidence references for the POI.',
    requiredEvidence: 'At least one https://, oss://, cos:// or s3:// evidence reference; no local files or base64.'
  },
  fieldVerifiedBy: {
    ownerLane: 'field-review',
    expectedValue: 'non-empty verifier',
    taskDetail: 'Record the field reviewer who verified the POI evidence.',
    requiredEvidence: 'fieldVerifiedBy contains a stable reviewer or team id.'
  },
  fieldVerifiedAt: {
    ownerLane: 'field-review',
    expectedValue: 'YYYY-MM-DD',
    taskDetail: 'Record the date when field evidence was verified.',
    requiredEvidence: 'fieldVerifiedAt contains the production review date.'
  },
  reviewStatus: {
    ownerLane: 'content-audit',
    expectedValue: 'APPROVED',
    taskDetail: 'Approve the source-bound content review for the POI.',
    requiredEvidence: 'reviewStatus=APPROVED after intro and recommended questions are reviewed.'
  },
  geoStatus: {
    ownerLane: 'geo-audit',
    expectedValue: 'APPROVED',
    taskDetail: 'Approve the POI coordinate and trigger radius review.',
    requiredEvidence: 'geoStatus=APPROVED after coordinates and radius are verified.'
  },
  auditLicenseStatus: {
    ownerLane: 'source-license',
    expectedValue: 'APPROVED',
    taskDetail: 'Approve the production audit license status for this POI row.',
    requiredEvidence: 'auditLicenseStatus=APPROVED after source review apply has approved source licensing.'
  },
  status: {
    ownerLane: 'content-audit',
    expectedValue: 'PUBLISHED',
    taskDetail: 'Mark the POI production row publishable only after all review fields pass.',
    requiredEvidence: 'status=PUBLISHED for the approved production POI row.'
  },
  reviewedBy: {
    ownerLane: 'content-audit',
    expectedValue: 'non-empty reviewer',
    taskDetail: 'Record the production content reviewer.',
    requiredEvidence: 'reviewedBy contains a stable reviewer or team id.'
  },
  reviewedAt: {
    ownerLane: 'content-audit',
    expectedValue: 'YYYY-MM-DD',
    taskDetail: 'Record the production content review date.',
    requiredEvidence: 'reviewedAt contains the production review date.'
  }
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

function hasText(value) {
  return String(value || '').trim().length > 0
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

function normalizeHeaderCell(value, index) {
  const normalized = String(value || '').trim()
  return index === 0 ? normalized.replace(/^\uFEFF/, '') : normalized
}

function parseRows(text, label) {
  const parsed = parseCsv(text, label)
  if (parsed.length === 0) {
    throw new Error(`${label} is empty`)
  }
  const header = parsed[0].map(normalizeHeaderCell)
  const missing = requiredFields.filter((field) => !header.includes(field))
  if (missing.length > 0) {
    throw new Error(`${label} missing required columns: ${missing.join(', ')}`)
  }
  return parsed.slice(1).map((row) => Object.fromEntries(header.map((field, index) => [
    field,
    String(row[index] ?? '').trim()
  ])))
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function csvRow(values) {
  return values.map(csvCell).join(',')
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

function evidenceRefSummary(value) {
  const refs = splitList(value)
  if (refs.length === 0) {
    return 'EMPTY'
  }
  const invalidCount = refs.filter((ref) => !isNonLocalEvidenceRef(ref)).length
  return invalidCount === 0
    ? `VALID_REFS:${refs.length}`
    : `INVALID_REFS:${invalidCount}/${refs.length}`
}

function currentValueSummary(fieldName, value) {
  if (fieldName === 'fieldEvidenceRefs') {
    return evidenceRefSummary(value)
  }
  return hasText(value) ? String(value).trim() : 'EMPTY'
}

function fieldNeedsTask(fieldName, value) {
  if (fieldName === 'fieldEvidenceRefs') {
    const refs = splitList(value)
    return refs.length === 0 || refs.some((ref) => !isNonLocalEvidenceRef(ref))
  }
  if (['photoEvidenceStatus', 'reviewStatus', 'geoStatus', 'auditLicenseStatus'].includes(fieldName)) {
    return normalizeType(value) !== 'APPROVED'
  }
  if (fieldName === 'triggerSmokeStatus') {
    return normalizeType(value) !== 'PASSED'
  }
  if (fieldName === 'status') {
    return normalizeType(value) !== 'PUBLISHED'
  }
  return !hasText(value)
}

function buildTaskRows(rows, productionReviewFile) {
  return rows.flatMap((row) => Object.entries(fieldRequirements)
    .filter(([fieldName]) => fieldNeedsTask(fieldName, row[fieldName]))
    .map(([fieldName, requirement]) => ({
      poiCode: row.poiCode,
      fieldName,
      ownerLane: requirement.ownerLane,
      currentValue: currentValueSummary(fieldName, row[fieldName]),
      expectedValue: requirement.expectedValue,
      taskDetail: requirement.taskDetail,
      requiredEvidence: requirement.requiredEvidence,
      taskStatus: 'TODO',
      productionReviewFile
    })))
}

function sortedUnique(values) {
  return [...new Set(values.filter((value) => String(value || '').trim().length > 0))]
    .sort((left, right) => String(left).localeCompare(String(right)))
}

function summarizeOwnerLanes(taskRows) {
  return taskRows.reduce((counts, row) => {
    counts[row.ownerLane] = (counts[row.ownerLane] || 0) + 1
    return counts
  }, {})
}

function summarizeOwnerLaneBreakdown(taskRows) {
  const byLane = new Map()
  for (const row of taskRows) {
    const ownerLane = row.ownerLane || 'manual-review'
    if (!byLane.has(ownerLane)) {
      byLane.set(ownerLane, [])
    }
    byLane.get(ownerLane).push(row)
  }
  return [...byLane.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([ownerLane, rows]) => ({
      ownerLane,
      taskCount: rows.length,
      poiCount: sortedUnique(rows.map((row) => row.poiCode)).length,
      poiCodes: sortedUnique(rows.map((row) => row.poiCode)),
      fields: sortedUnique(rows.map((row) => row.fieldName))
    }))
}

function summarizeFieldBreakdown(taskRows) {
  const byField = new Map()
  for (const row of taskRows) {
    if (!byField.has(row.fieldName)) {
      byField.set(row.fieldName, [])
    }
    byField.get(row.fieldName).push(row)
  }
  return [...byField.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([fieldName, rows]) => ({
      fieldName,
      taskCount: rows.length,
      ownerLane: rows[0]?.ownerLane || 'manual-review',
      poiCodes: sortedUnique(rows.map((row) => row.poiCode))
    }))
}

function buildCsv(taskRows) {
  const header = [
    'poiCode',
    'fieldName',
    'ownerLane',
    'currentValue',
    'expectedValue',
    'taskDetail',
    'requiredEvidence',
    'taskStatus',
    'productionReviewFile'
  ]
  return `${[
    header.join(','),
    ...taskRows.map((row) => csvRow(header.map((field) => row[field])))
  ].join('\n')}\n`
}

function buildOwnerLaneCsv(ownerLaneBreakdown, taskCsvFile, productionReviewFile) {
  const header = [
    'ownerLane',
    'taskCount',
    'poiCount',
    'fields',
    'poiCodes',
    'taskCsvFile',
    'productionReviewFile',
    'nextAction'
  ]
  return `${[
    header.join(','),
    ...ownerLaneBreakdown.map((lane) => csvRow([
      lane.ownerLane,
      lane.taskCount,
      lane.poiCount,
      (lane.fields || []).join('|'),
      (lane.poiCodes || []).join('|'),
      taskCsvFile,
      productionReviewFile,
      `Filter the task CSV by ownerLane=${lane.ownerLane}, update the production review summary fields, then rerun production-review:tasks:export and production-review:apply.`
    ]))
  ].join('\n')}\n`
}

export async function exportXichengPoiProductionReviewTasks({
  rootDir = process.cwd(),
  productionReviewFile,
  outputFile = 'workbench/xicheng-poi-production-review-tasks.csv',
  ownerLaneOutputFile = 'workbench/xicheng-poi-production-review-owner-lanes.csv',
  evidenceFile = 'qa/xicheng-poi-production-review-tasks-evidence.json'
} = {}) {
  const resolvedRootDir = path.resolve(rootDir)
  const resolvedProductionReviewFile = resolveInputFile(resolvedRootDir, productionReviewFile, '--production-review')
  const resolvedOutputFile = resolveSafeOutputFile(resolvedRootDir, outputFile, '--output')
  const resolvedOwnerLaneOutputFile = resolveSafeOutputFile(resolvedRootDir, ownerLaneOutputFile, '--owner-lane-output')
  const resolvedEvidenceFile = resolveSafeOutputFile(resolvedRootDir, evidenceFile, '--evidence-file')
  const rows = parseRows(await readFile(resolvedProductionReviewFile, 'utf8'), 'production review CSV')
  const taskRows = buildTaskRows(rows, resolvedProductionReviewFile)
  const pendingPoiCodes = sortedUnique(taskRows.map((row) => row.poiCode))
  const readyPoiCount = rows.filter((row) => !pendingPoiCodes.includes(row.poiCode)).length
  const ownerLaneCounts = summarizeOwnerLanes(taskRows)
  const ownerLaneBreakdown = summarizeOwnerLaneBreakdown(taskRows)
  const fieldBreakdown = summarizeFieldBreakdown(taskRows)
  const ok = taskRows.length === 0

  const report = {
    artifactType,
    ok,
    status: ok ? readyStatus : requiredStatus,
    checkedAt: new Date().toISOString(),
    summary: {
      productionReviewFile: resolvedProductionReviewFile,
      outputFile: resolvedOutputFile,
      ownerLaneOutputFile: resolvedOwnerLaneOutputFile,
      evidenceFile: resolvedEvidenceFile,
      productionReviewRows: rows.length,
      readyPoiCount,
      pendingPoiCount: pendingPoiCodes.length,
      pendingPoiCodes,
      taskCount: taskRows.length,
      ownerLaneCounts,
      ownerLaneBreakdown,
      fieldBreakdown
    },
    tasks: taskRows,
    blockers: ok ? [] : [
      'production review field tasks remain; complete field-level CSV rows before production review apply'
    ]
  }

  await mkdir(path.dirname(resolvedOutputFile), { recursive: true })
  await writeFile(resolvedOutputFile, buildCsv(taskRows))
  await mkdir(path.dirname(resolvedOwnerLaneOutputFile), { recursive: true })
  await writeFile(resolvedOwnerLaneOutputFile, buildOwnerLaneCsv(
    ownerLaneBreakdown,
    resolvedOutputFile,
    resolvedProductionReviewFile
  ))
  await mkdir(path.dirname(resolvedEvidenceFile), { recursive: true })
  await writeFile(resolvedEvidenceFile, `${JSON.stringify(report, null, 2)}\n`)

  return report
}

async function runCli() {
  const args = process.argv.slice(2)
  const report = await exportXichengPoiProductionReviewTasks({
    rootDir: path.resolve(readArgValue(args, '--root') || process.cwd()),
    productionReviewFile: readArgValue(args, '--production-review'),
    outputFile: readArgValue(args, '--output') || 'workbench/xicheng-poi-production-review-tasks.csv',
    ownerLaneOutputFile: readArgValue(args, '--owner-lane-output') ||
      'workbench/xicheng-poi-production-review-owner-lanes.csv',
    evidenceFile: readArgValue(args, '--evidence-file') || 'qa/xicheng-poi-production-review-tasks-evidence.json'
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
