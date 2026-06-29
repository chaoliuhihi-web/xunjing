import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-poi-trigger-smoke'
const readyStatus = 'XICHENG_POI_TRIGGER_SMOKE_READY'
const reviewRequiredStatus = 'XICHENG_POI_TRIGGER_SMOKE_REVIEW_REQUIRED'
const allowedOutputDirs = new Set(['qa', 'tmp', 'workbench'])

const requiredWorkbookFields = [
  'poiCode',
  'name',
  'latitude',
  'longitude',
  'coordType',
  'ocrKeywords',
  'photoLabels'
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
  return rows.slice(1).map((row) => Object.fromEntries(header.map((field, index) => [
    field,
    String(row[index] ?? '').trim()
  ])))
}

function splitList(value) {
  return String(value || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
}

function firstText(values, fallback) {
  return values.find((value) => hasText(value)) || fallback
}

function numberValue(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function buildPayload(row, index) {
  const name = firstText([row.displayName, row.name], row.poiCode)
  const ocrText = firstText(splitList(row.ocrKeywords), name)
  const imageLabels = splitList(row.photoLabels)
  return {
    packageCode: 'XICHENG-MAP-001',
    regionCode: 'beijing-xicheng',
    ocrText,
    text: `我在${name}，想听讲解`,
    location: {
      latitude: numberValue(row.latitude),
      longitude: numberValue(row.longitude),
      coordType: row.coordType || 'GCJ02',
      accuracyMeters: 20
    },
    imageLabels,
    userTraceId: `xicheng-poi-trigger-smoke-${index + 1}-${row.poiCode}`
  }
}

async function fetchTrigger(baseUrl, tenantId, payload) {
  const response = await fetch(new URL('/app-api/xunjing/triggers/resolve', baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'tenant-id': String(tenantId),
      Connection: 'close'
    },
    body: JSON.stringify(payload)
  })
  const body = await response.text()
  let json
  try {
    json = JSON.parse(body)
  } catch {
    throw new Error(`trigger API returned non-JSON response with HTTP ${response.status}`)
  }
  return {
    httpStatus: response.status,
    json
  }
}

function validateTriggerResult(row, apiResult, minConfidence) {
  const data = apiResult.json?.data
  const blockers = []
  if (apiResult.json?.code !== 0 || !data) {
    blockers.push(`${row.poiCode} trigger API did not return code=0 data`)
  }
  if (data?.packageCode !== 'XICHENG-MAP-001') {
    blockers.push(`${row.poiCode} trigger smoke did not return packageCode=XICHENG-MAP-001`)
  }
  if (data?.regionCode !== 'beijing-xicheng') {
    blockers.push(`${row.poiCode} trigger smoke did not return regionCode=beijing-xicheng`)
  }
  if (data?.poiCode !== row.poiCode) {
    blockers.push(`${row.poiCode} trigger smoke did not resolve expected POI`)
  }
  if (Number(data?.confidence || 0) < minConfidence) {
    blockers.push(`${row.poiCode} trigger smoke confidence below ${minConfidence}`)
  }
  if (data?.requiresUserConfirm !== false) {
    blockers.push(`${row.poiCode} trigger smoke requires user confirmation`)
  }
  const targetPath = String(data?.targetPath || '')
  if (!targetPath.includes(`poiCode=${row.poiCode}`) || !targetPath.includes('packageCode=XICHENG-MAP-001')) {
    blockers.push(`${row.poiCode} trigger smoke targetPath does not preserve poiCode/packageCode`)
  }
  if (!Array.isArray(data?.sources) || data.sources.length === 0) {
    blockers.push(`${row.poiCode} trigger smoke did not return sources`)
  }
  return blockers
}

async function main() {
  const args = process.argv.slice(2)
  const rootDir = path.resolve(readArgValue(args, '--root') || process.cwd())
  const workbookFile = resolveInputFile(rootDir, readArgValue(args, '--workbook'), '--workbook')
  const evidenceFile = resolveSafeOutputFile(rootDir, readArgValue(args, '--evidence-file'), '--evidence-file')
  const baseUrl = readArgValue(args, '--base-url')
  const tenantId = String(readArgValue(args, '--tenant-id') || '1')
  if (!baseUrl) {
    throw new Error('--base-url is required')
  }
  const workbookText = await readFile(workbookFile, 'utf8')
  const rows = parseRows(workbookText, requiredWorkbookFields, 'workbook CSV')
  const results = []
  const blockers = []
  for (const [index, row] of rows.entries()) {
    const minConfidence = numberValue(row.minConfidence, 0.85)
    const payload = buildPayload(row, index)
    try {
      const apiResult = await fetchTrigger(baseUrl, tenantId, payload)
      const rowBlockers = validateTriggerResult(row, apiResult, minConfidence)
      if (rowBlockers.length > 0) {
        blockers.push(...rowBlockers)
      }
      const data = apiResult.json?.data || {}
      results.push({
        poiCode: row.poiCode,
        poiName: row.displayName || row.name,
        smokeStatus: rowBlockers.length === 0 ? 'PASSED' : 'FAILED',
        httpStatus: apiResult.httpStatus,
        resolvedPoiCode: data.poiCode,
        confidence: Number(data.confidence || 0),
        requiresUserConfirm: data.requiresUserConfirm,
        sourceCount: Array.isArray(data.sources) ? data.sources.length : 0,
        targetPath: data.targetPath,
        error: rowBlockers.join('; ') || undefined
      })
    } catch (error) {
      const message = `${row.poiCode} trigger smoke failed: ${error.message}`
      blockers.push(message)
      results.push({
        poiCode: row.poiCode,
        poiName: row.displayName || row.name,
        smokeStatus: 'FAILED',
        error: message
      })
    }
  }
  const passedPoiCodes = results.filter((result) => result.smokeStatus === 'PASSED').map((result) => result.poiCode)
  const failedPoiCodes = results.filter((result) => result.smokeStatus !== 'PASSED').map((result) => result.poiCode)
  const report = {
    artifactType,
    ok: failedPoiCodes.length === 0,
    status: failedPoiCodes.length === 0 ? readyStatus : reviewRequiredStatus,
    checkedAt: new Date().toISOString(),
    summary: {
      workbookFile,
      workbookSha256: sha256(workbookText),
      evidenceFile,
      baseUrl,
      tenantId,
      workbookRows: rows.length,
      passedPoiCount: passedPoiCodes.length,
      failedPoiCount: failedPoiCodes.length,
      passedPoiCodes,
      failedPoiCodes,
      results
    },
    blockers,
    note: 'This evidence proves trigger resolve smoke only; it does not approve photo, geo, content or field evidence review.'
  }
  const reportText = JSON.stringify(report, null, 2) + '\n'
  await mkdir(path.dirname(evidenceFile), { recursive: true })
  await writeFile(evidenceFile, reportText)
  process.stdout.write(reportText)
  if (!report.ok) {
    process.exitCode = 1
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}
