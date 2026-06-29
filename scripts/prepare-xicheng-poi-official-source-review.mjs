import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-poi-official-source-review-prepare'
const readyStatus = 'OFFICIAL_SOURCE_REVIEW_PREPARED'
const remainsStatus = 'OFFICIAL_SOURCE_REVIEW_REMAINS'
const sourceCoverageArtifactType = 'xicheng-poi-source-coverage'
const sourceCoverageReadyStatus = 'SOURCE_COVERAGE_READY'
const allowedOutputDirs = new Set(['qa', 'tmp', 'workbench'])
const defaultReviewedBy = 'xicheng-official-public-source-review'

const requiredSourceReviewFields = [
  'sourceTitle',
  'sourceUrl',
  'sourceType',
  'poiCount',
  'poiCodes',
  'licenseStatus',
  'licenseEvidenceRef',
  'licenseReviewedBy',
  'licenseReviewedAt',
  'nextAction'
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

function normalizeType(value) {
  return String(value || '').trim().toUpperCase()
}

function splitList(value) {
  return String(value || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
}

function rowPoiCount(row) {
  const codes = splitList(row.poiCodes)
  if (codes.length > 0) {
    return codes.length
  }
  const count = Number(row.poiCount)
  return Number.isFinite(count) && count > 0 ? count : 0
}

function sourceGroupKey(row) {
  return [
    String(row.sourceUrl || '').trim(),
    normalizeType(row.sourceType)
  ].join('\n')
}

function isHttpsEvidenceRef(value) {
  try {
    const url = new URL(String(value || '').trim())
    return url.protocol.toLowerCase() === 'https:' && hasText(url.hostname)
  } catch {
    return false
  }
}

function reviewedAtDate(evidence, explicitReviewedAt) {
  if (hasText(explicitReviewedAt)) {
    return String(explicitReviewedAt).trim()
  }
  const checkedAt = String(evidence?.checkedAt || '').trim()
  const match = checkedAt.match(/^\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : new Date().toISOString().slice(0, 10)
}

function validateCoverageEvidence(evidence, sourceReviewFile) {
  const blockers = []
  const summary = evidence?.summary || {}
  if (evidence?.artifactType !== sourceCoverageArtifactType) {
    blockers.push(`source coverage evidence artifactType must be ${sourceCoverageArtifactType}`)
  }
  if (evidence?.ok !== true || evidence?.status !== sourceCoverageReadyStatus) {
    blockers.push(`source coverage evidence status must be ${sourceCoverageReadyStatus}`)
  }
  if (path.resolve(summary.sourceReviewFile || '') !== path.resolve(sourceReviewFile)) {
    blockers.push('source coverage evidence must reference the same source review CSV')
  }
  if (Number(summary.uncoveredPoiCount) !== 0) {
    blockers.push('source coverage evidence must have uncoveredPoiCount=0')
  }
  const checks = Array.isArray(evidence?.checks) ? evidence.checks : []
  const coverageCheck = checks.find((check) => check?.name === 'poi-source-coverage')
  if (!coverageCheck || coverageCheck.ok !== true) {
    blockers.push('source coverage evidence check poi-source-coverage must be ok')
  }
  return blockers
}

function coveredOfficialGroup(row, coverageGroup) {
  if (normalizeType(row.sourceType) !== 'OFFICIAL_PUBLIC') {
    return false
  }
  if (!coverageGroup) {
    return false
  }
  if (Number(coverageGroup.uncoveredPoiCount) !== 0) {
    return false
  }
  if (Number(coverageGroup.coveredPoiCount) < rowPoiCount(row)) {
    return false
  }
  return isHttpsEvidenceRef(row.sourceUrl)
}

async function main() {
  const args = process.argv.slice(2)
  const rootDir = path.resolve(readArgValue(args, '--root') || process.cwd())
  const sourceReviewFile = resolveInputFile(rootDir, readArgValue(args, '--source-review'), '--source-review')
  const sourceCoverageEvidenceFile = resolveInputFile(rootDir, readArgValue(args, '--source-coverage-evidence'), '--source-coverage-evidence')
  const outputFile = resolveSafeOutputFile(rootDir, readArgValue(args, '--output'), '--output')
  const evidenceFile = resolveSafeOutputFile(rootDir, readArgValue(args, '--evidence-file'), '--evidence-file')
  const reviewedBy = String(readArgValue(args, '--reviewed-by') || defaultReviewedBy).trim()

  const sourceReviewText = await readFile(sourceReviewFile, 'utf8')
  const sourceCoverageEvidence = JSON.parse(await readFile(sourceCoverageEvidenceFile, 'utf8'))
  const coverageBlockers = validateCoverageEvidence(sourceCoverageEvidence, sourceReviewFile)
  if (coverageBlockers.length > 0) {
    throw new Error(coverageBlockers.join('\n'))
  }
  const reviewedAt = reviewedAtDate(sourceCoverageEvidence, readArgValue(args, '--reviewed-at'))
  const { header, rows } = parseRows(sourceReviewText, requiredSourceReviewFields, 'source review CSV')
  const sourceGroups = Array.isArray(sourceCoverageEvidence.summary?.sourceGroups)
    ? sourceCoverageEvidence.summary.sourceGroups
    : []
  const coverageByKey = new Map(sourceGroups.map((group) => [sourceGroupKey(group), group]))

  let approvedSourceGroupCount = 0
  let appliedPoiCount = 0
  let pendingSourceGroupCount = 0
  let pendingPoiCount = 0
  const approvedSourceGroups = []
  const pendingSourceGroups = []
  const outputRows = rows.map((row) => {
    const coverageGroup = coverageByKey.get(sourceGroupKey(row))
    if (coveredOfficialGroup(row, coverageGroup)) {
      approvedSourceGroupCount += 1
      appliedPoiCount += rowPoiCount(row)
      approvedSourceGroups.push({
        sourceUrl: row.sourceUrl,
        sourceType: normalizeType(row.sourceType),
        poiCount: rowPoiCount(row),
        licenseEvidenceRef: row.sourceUrl
      })
      return {
        ...row,
        licenseStatus: 'APPROVED',
        licenseEvidenceRef: row.sourceUrl,
        licenseReviewedBy: reviewedBy,
        licenseReviewedAt: reviewedAt,
        nextAction: 'Official public source coverage verified; run source-review:apply.'
      }
    }
    pendingSourceGroupCount += 1
    pendingPoiCount += rowPoiCount(row)
    pendingSourceGroups.push({
      sourceUrl: row.sourceUrl,
      sourceType: normalizeType(row.sourceType),
      poiCount: rowPoiCount(row)
    })
    return row
  })

  const outputText = stringifyCsv(header, outputRows)
  await mkdir(path.dirname(outputFile), { recursive: true })
  await writeFile(outputFile, outputText)
  const report = {
    artifactType,
    ok: pendingSourceGroupCount === 0,
    status: pendingSourceGroupCount === 0 ? readyStatus : remainsStatus,
    checkedAt: new Date().toISOString(),
    summary: {
      sourceReviewFile,
      sourceCoverageEvidenceFile,
      outputFile,
      evidenceFile,
      reviewedBy,
      reviewedAt,
      sourceReviewRows: rows.length,
      approvedSourceGroupCount,
      pendingSourceGroupCount,
      appliedPoiCount,
      pendingPoiCount,
      approvedSourceGroups,
      pendingSourceGroups,
      outputSha256: sha256(outputText)
    },
    checks: [
      {
        name: 'source-coverage-evidence',
        ok: true,
        detail: 'source coverage evidence is ready and references the same source review CSV'
      },
      {
        name: 'official-public-source-review',
        ok: pendingSourceGroupCount === 0,
        detail: pendingSourceGroupCount === 0
          ? `Prepared ${approvedSourceGroupCount} official public source groups`
          : `${pendingSourceGroupCount} non-official or uncovered source groups still require manual license review`
      },
      {
        name: 'secret-redaction',
        ok: true,
        detail: 'Evidence contains source URLs and hashes only; no secrets are recorded'
      }
    ],
    blockers: pendingSourceGroupCount === 0
      ? []
      : [`${pendingSourceGroupCount} source groups still require manual source license review`],
    note: 'This prepares source review rows from official public source coverage; source-review:apply must still generate the workbook apply evidence.'
  }
  const reportText = JSON.stringify(report, null, 2) + '\n'
  await mkdir(path.dirname(evidenceFile), { recursive: true })
  await writeFile(evidenceFile, reportText)
  process.stdout.write(reportText)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}
