import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-poi-source-coverage'
const readyStatus = 'SOURCE_COVERAGE_READY'
const notReadyStatus = 'SOURCE_COVERAGE_REVIEW_REQUIRED'
const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])
const requiredSourceReviewFields = [
  'sourceTitle',
  'sourceUrl',
  'sourceType',
  'poiCount',
  'poiCodes',
  'poiNames'
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
  return createHash('sha256').update(String(value)).digest('hex')
}

function resolveInputFile(rootDir, filePath, optionName) {
  if (!filePath) {
    throw new Error(`${optionName} is required`)
  }
  return path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(rootDir, filePath)
}

function resolveOptionalInputFile(rootDir, filePath) {
  if (!hasText(filePath)) {
    return undefined
  }
  return path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(rootDir, filePath)
}

function resolveEvidenceFile(rootDir, evidenceFile) {
  if (!evidenceFile) {
    throw new Error('--evidence-file is required')
  }
  const resolvedRoot = path.resolve(rootDir)
  const resolvedFile = path.isAbsolute(evidenceFile)
    ? path.resolve(evidenceFile)
    : path.resolve(resolvedRoot, evidenceFile)
  const relativePath = path.relative(resolvedRoot, resolvedFile)
  const [topLevelDir] = relativePath.split(path.sep)
  if (
    !relativePath ||
    relativePath.startsWith('..') ||
    path.isAbsolute(relativePath) ||
    !allowedEvidenceDirs.has(topLevelDir)
  ) {
    throw new Error('evidence file must be under qa/, tmp/ or workbench/')
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

function parseRows(text) {
  const rows = parseCsv(text, 'source review CSV')
  if (rows.length === 0) {
    throw new Error('source review CSV is empty')
  }
  const header = rows[0].map(normalizeHeaderCell)
  const missing = requiredSourceReviewFields.filter((field) => !header.includes(field))
  if (missing.length > 0) {
    throw new Error(`source review CSV missing required columns: ${missing.join(', ')}`)
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

function decodeBasicEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_match, code) => String.fromCodePoint(Number.parseInt(code, 10)))
}

function visibleTextFromPage(value) {
  return decodeBasicEntities(String(value || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
}

function normalizeForCoverage(value) {
  return visibleTextFromPage(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

function groupPois(row) {
  const poiCodes = splitList(row.poiCodes)
  const poiNames = splitList(row.poiNames)
  const count = Math.max(poiCodes.length, poiNames.length, Number(row.poiCount || 0))
  return Array.from({ length: count }, (_item, index) => ({
    poiCode: poiCodes[index] || '',
    poiName: poiNames[index] || poiCodes[index] || ''
  })).filter((poi) => hasText(poi.poiCode) || hasText(poi.poiName))
}

async function loadSourcePageCache(rootDir, cacheFile) {
  const resolvedFile = resolveOptionalInputFile(rootDir, cacheFile)
  if (!resolvedFile) {
    return { cacheFile: undefined, pages: new Map() }
  }
  const parsed = JSON.parse(await readFile(resolvedFile, 'utf8'))
  return {
    cacheFile: resolvedFile,
    pages: new Map(Object.entries(parsed).map(([url, value]) => [
      url,
      typeof value === 'string' ? value : String(value?.text || value?.body || '')
    ]))
  }
}

async function fetchSourcePage(url, { timeoutMs = 15000, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('global fetch is unavailable; pass --source-page-cache for offline audit')
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'xinghexunjing-source-coverage-audit/1.0'
      }
    })
    const text = await response.text()
    return {
      text,
      httpStatus: response.status,
      ok: response.ok
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function loadSourcePages(rows, {
  cache,
  timeoutMs,
  fetchImpl
}) {
  const pages = new Map()
  for (const row of rows) {
    const sourceUrl = row.sourceUrl
    if (!hasText(sourceUrl) || pages.has(sourceUrl)) {
      continue
    }
    if (cache.pages.has(sourceUrl)) {
      const text = cache.pages.get(sourceUrl)
      pages.set(sourceUrl, {
        sourceUrl,
        fetchMode: 'cache',
        ok: hasText(text),
        text,
        httpStatus: undefined,
        error: hasText(text) ? undefined : 'cached source page is empty'
      })
      continue
    }
    try {
      const fetched = await fetchSourcePage(sourceUrl, { timeoutMs, fetchImpl })
      pages.set(sourceUrl, {
        sourceUrl,
        fetchMode: 'live',
        ok: fetched.ok,
        text: fetched.text,
        httpStatus: fetched.httpStatus,
        error: fetched.ok ? undefined : `source page returned HTTP ${fetched.httpStatus}`
      })
    } catch (error) {
      pages.set(sourceUrl, {
        sourceUrl,
        fetchMode: 'live',
        ok: false,
        text: '',
        httpStatus: undefined,
        error: error.message
      })
    }
  }
  return pages
}

function sourcePageFetchMode(pages) {
  const modes = new Set(Array.from(pages.values()).map((page) => page.fetchMode))
  if (modes.size === 1) {
    return Array.from(modes)[0]
  }
  return modes.size === 0 ? 'none' : 'mixed'
}

function buildSourcePageSummary(page) {
  const text = visibleTextFromPage(page.text)
  return {
    sourceUrl: page.sourceUrl,
    fetchMode: page.fetchMode,
    ok: page.ok,
    httpStatus: page.httpStatus,
    sourceTextLength: text.length,
    sourceTextSha256: sha256(text),
    ...(page.error ? { error: page.error } : {})
  }
}

function auditSourceGroup(row, page) {
  const pois = groupPois(row)
  const normalizedPageText = page?.ok ? normalizeForCoverage(page.text) : ''
  const covered = []
  const uncovered = []
  for (const poi of pois) {
    const normalizedPoiName = normalizeForCoverage(poi.poiName)
    const isCovered = hasText(normalizedPoiName) && normalizedPageText.includes(normalizedPoiName)
    ;(isCovered ? covered : uncovered).push(poi)
  }
  return {
    sourceTitle: row.sourceTitle,
    sourceUrl: row.sourceUrl,
    sourceType: row.sourceType,
    poiCount: pois.length,
    coveredPoiCount: covered.length,
    uncoveredPoiCount: uncovered.length,
    coveredPoiCodes: covered.map((poi) => poi.poiCode).filter(Boolean),
    uncoveredPoiCodes: uncovered.map((poi) => poi.poiCode).filter(Boolean),
    uncoveredPoiNames: uncovered.map((poi) => poi.poiName).filter(Boolean)
  }
}

function buildReport({
  sourceReviewFile,
  evidenceFile,
  cacheFile,
  rows,
  pages,
  groups,
  checkedAt
}) {
  const uncoveredPoiCodes = groups.flatMap((group) => group.uncoveredPoiCodes)
  const pageFailures = Array.from(pages.values()).filter((page) => page.ok !== true)
  const blockers = []
  if (uncoveredPoiCodes.length > 0) {
    blockers.push(`${uncoveredPoiCodes.length} POI names are not found in their assigned source pages`)
  }
  pageFailures.forEach((page) => {
    blockers.push(`${page.sourceUrl} could not be audited: ${page.error || 'source page unavailable'}`)
  })
  const ok = blockers.length === 0
  return {
    artifactType,
    ok,
    status: ok ? readyStatus : notReadyStatus,
    checkedAt,
    summary: {
      sourceReviewFile,
      evidenceFile,
      ...(cacheFile ? { sourcePageCacheFile: cacheFile } : {}),
      sourceReviewRows: rows.length,
      sourceGroupCount: groups.length,
      poiCount: groups.reduce((sum, group) => sum + group.poiCount, 0),
      coveredPoiCount: groups.reduce((sum, group) => sum + group.coveredPoiCount, 0),
      uncoveredPoiCount: uncoveredPoiCodes.length,
      uncoveredPoiCodes,
      sourcePageFetchMode: sourcePageFetchMode(pages),
      sourcePages: Array.from(pages.values()).map(buildSourcePageSummary),
      sourceGroups: groups
    },
    checks: [
      {
        name: 'source-review-file',
        ok: true,
        detail: 'Source review CSV was parsed',
        blockers: []
      },
      {
        name: 'source-pages',
        ok: pageFailures.length === 0,
        detail: pageFailures.length === 0
          ? 'All source pages were available for coverage audit'
          : `${pageFailures.length} source pages could not be audited`,
        blockers: pageFailures.map((page) => `${page.sourceUrl}: ${page.error || 'source page unavailable'}`)
      },
      {
        name: 'poi-source-coverage',
        ok: uncoveredPoiCodes.length === 0,
        detail: uncoveredPoiCodes.length === 0
          ? 'All POI names are found in their assigned source pages'
          : `${uncoveredPoiCodes.length} POI names are not found in their assigned source pages`,
        blockers: uncoveredPoiCodes
      },
      {
        name: 'secret-redaction',
        ok: true,
        detail: 'Evidence stores source page hashes and lengths, not full source page text',
        blockers: []
      }
    ],
    blockers,
    note: 'This coverage audit only checks whether POI names appear on assigned source pages. It is not source license approval or production evidence by itself.'
  }
}

export async function verifyXichengPoiSourceCoverage({
  rootDir = process.cwd(),
  sourceReviewFile,
  sourcePageCacheFile,
  evidenceFile,
  fetchImpl = globalThis.fetch,
  timeoutMs = 15000,
  checkedAt = new Date().toISOString()
} = {}) {
  const resolvedRoot = path.resolve(rootDir)
  const resolvedSourceReviewFile = resolveInputFile(resolvedRoot, sourceReviewFile, '--source-review')
  const resolvedEvidenceFile = resolveEvidenceFile(resolvedRoot, evidenceFile)
  const sourceReviewText = await readFile(resolvedSourceReviewFile, 'utf8')
  const rows = parseRows(sourceReviewText)
  const cache = await loadSourcePageCache(resolvedRoot, sourcePageCacheFile)
  const pages = await loadSourcePages(rows, {
    cache,
    timeoutMs,
    fetchImpl
  })
  const groups = rows.map((row) => auditSourceGroup(row, pages.get(row.sourceUrl)))
  const report = buildReport({
    sourceReviewFile: resolvedSourceReviewFile,
    evidenceFile: resolvedEvidenceFile,
    cacheFile: cache.cacheFile,
    rows,
    pages,
    groups,
    checkedAt
  })
  await mkdir(path.dirname(resolvedEvidenceFile), { recursive: true })
  await writeFile(resolvedEvidenceFile, `${JSON.stringify(report, null, 2)}\n`)
  return report
}

async function runCli() {
  const args = process.argv.slice(2)
  const timeoutMs = Number(readArgValue(args, '--timeout-ms') || 15000)
  const report = await verifyXichengPoiSourceCoverage({
    rootDir: path.resolve(readArgValue(args, '--root') || process.cwd()),
    sourceReviewFile: readArgValue(args, '--source-review'),
    sourcePageCacheFile: readArgValue(args, '--source-page-cache'),
    evidenceFile: readArgValue(args, '--evidence-file'),
    timeoutMs
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
