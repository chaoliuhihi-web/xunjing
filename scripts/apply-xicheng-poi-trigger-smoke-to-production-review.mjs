import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-poi-trigger-smoke-apply'
const readyStatus = 'TRIGGER_SMOKE_APPLIED'
const remainsStatus = 'TRIGGER_SMOKE_APPLY_REMAINS'
const triggerSmokeArtifactType = 'xicheng-poi-trigger-smoke'
const allowedOutputDirs = new Set(['qa', 'tmp', 'workbench'])
const afterTriggerSmokeNextAction = 'Attach field evidence, approve geo/content/license audit, and keep evidence refs non-local.'

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

function validateTriggerEvidence(evidence) {
  const blockers = []
  if (evidence?.artifactType !== triggerSmokeArtifactType) {
    blockers.push(`trigger smoke evidence artifactType must be ${triggerSmokeArtifactType}`)
  }
  const results = Array.isArray(evidence?.summary?.results) ? evidence.summary.results : []
  if (results.length === 0) {
    blockers.push('trigger smoke evidence summary.results is required')
  }
  return blockers
}

async function main() {
  const args = process.argv.slice(2)
  const rootDir = path.resolve(readArgValue(args, '--root') || process.cwd())
  const productionReviewFile = resolveInputFile(rootDir, readArgValue(args, '--production-review'), '--production-review')
  const triggerSmokeEvidenceFile = resolveInputFile(rootDir, readArgValue(args, '--trigger-smoke-evidence'), '--trigger-smoke-evidence')
  const outputFile = resolveSafeOutputFile(rootDir, readArgValue(args, '--output'), '--output')
  const evidenceFile = resolveSafeOutputFile(rootDir, readArgValue(args, '--evidence-file'), '--evidence-file')

  const productionReviewText = await readFile(productionReviewFile, 'utf8')
  const triggerSmokeEvidence = JSON.parse(await readFile(triggerSmokeEvidenceFile, 'utf8'))
  const evidenceBlockers = validateTriggerEvidence(triggerSmokeEvidence)
  if (evidenceBlockers.length > 0) {
    throw new Error(evidenceBlockers.join('\n'))
  }
  const { header, rows } = parseRows(productionReviewText, requiredProductionReviewFields, 'production review CSV')
  const passedPoiCodes = new Set(
    triggerSmokeEvidence.summary.results
      .filter((result) => result?.smokeStatus === 'PASSED')
      .map((result) => result.poiCode)
      .filter(Boolean)
  )
  const appliedPoiCodes = []
  const outputRows = rows.map((row) => {
    if (!passedPoiCodes.has(row.poiCode)) {
      return row
    }
    appliedPoiCodes.push(row.poiCode)
    return {
      ...row,
      triggerSmokeStatus: 'PASSED',
      nextAction: afterTriggerSmokeNextAction
    }
  })
  const pendingTriggerSmokePoiCodes = outputRows
    .filter((row) => String(row.triggerSmokeStatus || '').trim().toUpperCase() !== 'PASSED')
    .map((row) => row.poiCode)
  const outputText = stringifyCsv(header, outputRows)
  await mkdir(path.dirname(outputFile), { recursive: true })
  await writeFile(outputFile, outputText)
  const report = {
    artifactType,
    ok: pendingTriggerSmokePoiCodes.length === 0,
    status: pendingTriggerSmokePoiCodes.length === 0 ? readyStatus : remainsStatus,
    checkedAt: new Date().toISOString(),
    summary: {
      productionReviewFile,
      triggerSmokeEvidenceFile,
      outputFile,
      evidenceFile,
      productionReviewRows: rows.length,
      appliedPoiCount: appliedPoiCodes.length,
      appliedPoiCodes,
      pendingTriggerSmokePoiCount: pendingTriggerSmokePoiCodes.length,
      pendingTriggerSmokePoiCodes,
      outputSha256: sha256(outputText)
    },
    blockers: pendingTriggerSmokePoiCodes.length === 0
      ? []
      : [`${pendingTriggerSmokePoiCodes.length} POIs still require trigger smoke`],
    note: 'This applies trigger smoke status only. Photo evidence, geo review, content review and audit license review remain separate production review steps.'
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
