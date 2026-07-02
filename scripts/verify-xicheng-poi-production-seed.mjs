import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-poi-production-seed-readiness'
const defaultMinPoiCount = 80
const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])

function check(name, blockers) {
  return {
    name,
    ok: blockers.length === 0,
    detail: blockers.length === 0 ? `${name} passed` : blockers.join('; '),
    blockers
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
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

function resolveEvidenceFile(rootDir, evidenceFile) {
  if (!evidenceFile) {
    return undefined
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

async function writeEvidence({ rootDir, evidenceFile, report }) {
  const resolvedFile = resolveEvidenceFile(rootDir, evidenceFile)
  if (!resolvedFile) {
    return
  }
  await mkdir(path.dirname(resolvedFile), { recursive: true })
  await writeFile(resolvedFile, `${JSON.stringify(report, null, 2)}\n`)
}

function countMatches(sql, pattern) {
  return Array.from(sql.matchAll(pattern)).length
}

function hasText(value) {
  return String(value || '').trim().length > 0
}

function extractPoiCodes(sql) {
  return Array.from(sql.matchAll(/\(@map_package_id,\s*'((?:''|[^'])*)'/g))
    .map((match) => match[1].replaceAll("''", "'"))
    .filter((value) => value.startsWith('xicheng-'))
}

function extractNumberMetric(sql, name) {
  const match = sql.match(new RegExp(`"${name}"\\s*:\\s*(\\d+)`))
  return match ? Number(match[1]) : undefined
}

function extractStringMetric(sql, name) {
  const match = sql.match(new RegExp(`"${name}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`))
  if (!match) {
    return undefined
  }
  try {
    return JSON.parse(`"${match[1]}"`)
  } catch {
    return match[1]
  }
}

function decodeJsonString(value) {
  try {
    return JSON.parse(`"${value}"`)
  } catch {
    return value
  }
}

function extractJsonStringValues(sql, key) {
  return Array.from(sql.matchAll(new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, 'g')))
    .map((match) => decodeJsonString(match[1]))
}

function extractJsonArrayStringValues(sql, key) {
  const values = []
  for (const match of sql.matchAll(new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]`, 'g'))) {
    for (const stringMatch of match[1].matchAll(/"((?:\\.|[^"\\])*)"/g)) {
      values.push(decodeJsonString(stringMatch[1]))
    }
  }
  return values
}

function extractInsertRows(sql, tableName) {
  const match = sql.match(new RegExp(`INSERT INTO \`${tableName}\`[\\s\\S]*?VALUES\\s*([\\s\\S]*?);`, 'm'))
  if (!match) {
    return []
  }
  const values = match[1]
  const rows = []
  let depth = 0
  let inString = false
  let rowStart = -1
  for (let index = 0; index < values.length; index += 1) {
    const char = values[index]
    const next = values[index + 1]
    if (inString) {
      if (char === "'" && next === "'") {
        index += 1
      } else if (char === "'") {
        inString = false
      }
      continue
    }
    if (char === "'") {
      inString = true
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
        rows.push(values.slice(rowStart, index + 1))
        rowStart = -1
      }
    }
  }
  return rows
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
      return !['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(url.hostname.toLowerCase())
    }
    if (['oss:', 'cos:', 's3:'].includes(protocol)) {
      return hasText(url.hostname) && hasText(url.pathname.replaceAll('/', ''))
    }
  } catch {
    return false
  }
  return false
}

function isAllowedPublicMediaFile(value) {
  const normalized = String(value || '').trim()
  if (/^\/static\/xicheng\/[A-Za-z0-9._/-]+\.(?:jpg|jpeg|png|webp)$/i.test(normalized)) {
    return true
  }
  return isNonLocalEvidenceRef(normalized)
}

function extractSingleQuotedValues(row) {
  const values = []
  for (let index = 0; index < row.length; index += 1) {
    if (row[index] !== "'") {
      continue
    }
    let value = ''
    index += 1
    for (; index < row.length; index += 1) {
      const char = row[index]
      const next = row[index + 1]
      if (char === "'" && next === "'") {
        value += "'"
        index += 1
      } else if (char === "'") {
        break
      } else {
        value += char
      }
    }
    values.push(value)
  }
  return values
}

function checkSqlFile(sql) {
  const blockers = []
  if (!sql.trim()) {
    blockers.push('seed SQL file must not be empty')
  }
  return check('sql-file', blockers)
}

function checkSeedShape(sql) {
  const blockers = []
  const requiredSnippets = [
    'Generated from reviewed Xicheng POI production manifest',
    'INSERT INTO `xunjing_poi`',
    'INSERT INTO `xunjing_knowledge_document`',
    'INSERT INTO `xunjing_media_asset`',
    'INSERT INTO `xunjing_map_point`',
    'INSERT INTO `xunjing_public_report`',
    'SET @map_package_id :='
  ]
  requiredSnippets.forEach((snippet) => {
    if (!sql.includes(snippet)) {
      blockers.push(`seed SQL must include ${snippet}`)
    }
  })
  return check('seed-shape', blockers)
}

function checkSeedPreconditions(sql) {
  const blockers = []
  const requiredSnippets = [
    'xunjing_assert_xicheng_production_seed_ready',
    "SIGNAL SQLSTATE '45000'",
    'XICHENG-MAP-001 resource package is required before production POI seed',
    'CALL `xunjing_assert_xicheng_production_seed_ready`()'
  ]
  const missingGuard = requiredSnippets.some((snippet) => !sql.includes(snippet))
  if (missingGuard) {
    blockers.push('seed SQL must fail fast when XICHENG-MAP-001 package is missing')
  }
  return check('seed-preconditions', blockers)
}

function checkPoiCount(sql, minPoiCount) {
  const blockers = []
  const poiCodes = extractPoiCodes(sql)
  const uniquePoiCodes = new Set(poiCodes)
  if (poiCodes.length < minPoiCount) {
    blockers.push(`${minPoiCount} production POI seed rows required; found ${poiCodes.length}/${minPoiCount}`)
  }
  if (uniquePoiCodes.size !== poiCodes.length) {
    blockers.push('production POI seed rows must have unique poi_code values')
  }
  return check('poi-count', blockers)
}

function checkPoiApproval(sql) {
  const blockers = []
  if (/\b(?:REVIEW_REQUIRED|DRAFT)\b/.test(sql)) {
    blockers.push('seed SQL must not contain REVIEW_REQUIRED or DRAFT')
  }
  const poiCount = extractPoiCodes(sql).length
  const approvedRowCount = countMatches(sql, /'APPROVED',\s*'APPROVED',\s*'APPROVED',\s*'PUBLISHED'/g)
  if (poiCount > 0 && approvedRowCount < poiCount) {
    blockers.push(`each production POI row must be APPROVED/APPROVED/APPROVED/PUBLISHED; found ${approvedRowCount}/${poiCount}`)
  }
  return check('poi-approval', blockers)
}

function checkProductionMetrics(sql, minPoiCount) {
  const blockers = []
  const poiSeedCount = extractNumberMetric(sql, 'poiSeedCount')
  const targetP0PoiCount = extractNumberMetric(sql, 'targetP0PoiCount')
  const reviewedMediaCount = extractNumberMetric(sql, 'reviewedMediaCount')
  const targetMediaAssetCount = extractNumberMetric(sql, 'targetMediaAssetCount')
  const regionCode = extractStringMetric(sql, 'regionCode')
  const packageCode = extractStringMetric(sql, 'packageCode')
  if (!sql.includes('"productionReady":true')) {
    blockers.push('production metrics must include "productionReady":true')
  }
  if (regionCode !== 'beijing-xicheng') {
    blockers.push('production metrics must include regionCode=beijing-xicheng')
  }
  if (packageCode !== 'XICHENG-MAP-001') {
    blockers.push('production metrics must include packageCode=XICHENG-MAP-001')
  }
  if (!Number.isFinite(poiSeedCount) || poiSeedCount < minPoiCount) {
    blockers.push(`production metrics must include "poiSeedCount" >= ${minPoiCount}`)
  }
  if (!Number.isFinite(targetP0PoiCount) || targetP0PoiCount < minPoiCount) {
    blockers.push(`production metrics must include "targetP0PoiCount" >= ${minPoiCount}`)
  }
  if (!Number.isFinite(reviewedMediaCount) || reviewedMediaCount < 4) {
    blockers.push('production metrics must include "reviewedMediaCount" >= 4')
  }
  if (!Number.isFinite(targetMediaAssetCount) || targetMediaAssetCount < 4) {
    blockers.push('production metrics must include "targetMediaAssetCount" >= 4')
  }
  return check('production-metrics', blockers)
}

function checkReviewBatchMetrics(sql) {
  const blockers = []
  const reviewBatchCode = extractStringMetric(sql, 'reviewBatchCode')
  const evidencePackageRef = extractStringMetric(sql, 'reviewBatchEvidencePackageRef')
  if (!/^xicheng-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(reviewBatchCode || ''))) {
    blockers.push('production metrics must include reviewBatchCode')
  }
  if (!isNonLocalEvidenceRef(evidencePackageRef)) {
    blockers.push('production metrics must include reviewBatchEvidencePackageRef')
  }
  return check('review-batch-metrics', blockers)
}

function checkFieldEvidence(sql) {
  const blockers = []
  const poiCount = extractPoiCodes(sql).length
  const fieldEvidenceStatusCount = countMatches(sql, /"fieldEvidenceStatus"\s*:\s*"APPROVED"/g)
  const triggerSmokeStatusCount = countMatches(sql, /"triggerSmokeStatus"\s*:\s*"PASSED"/g)
  const fieldEvidenceRefsCount = countMatches(sql, /"fieldEvidenceRefs"\s*:\s*\[/g)
  const fieldEvidenceRefs = extractJsonArrayStringValues(sql, 'fieldEvidenceRefs')
  if (
    poiCount > 0 &&
    (fieldEvidenceStatusCount < poiCount || triggerSmokeStatusCount < poiCount || fieldEvidenceRefsCount < poiCount)
  ) {
    blockers.push('seed SQL must include approved field evidence for each production POI')
  }
  if (fieldEvidenceRefs.length < poiCount || fieldEvidenceRefs.some((ref) => !isNonLocalEvidenceRef(ref))) {
    blockers.push('seed SQL field evidence refs must use non-local HTTPS or object-storage references')
  }
  if (/(?:data:image|imageBase64|file:\/\/)/i.test(sql)) {
    blockers.push('seed SQL must not contain raw image data or local field evidence file paths')
  }
  return check('field-evidence', blockers)
}

function checkSourceLicenseEvidence(sql) {
  const blockers = []
  const poiCount = extractPoiCodes(sql).length
  const licenseEvidenceRefs = extractJsonStringValues(sql, 'licenseEvidenceRef')
  const licenseEvidenceRefCount = licenseEvidenceRefs.length
  const licenseReviewedByCount = countMatches(sql, /"licenseReviewedBy"\s*:\s*"[^"]+"/g)
  const licenseReviewedAtCount = countMatches(sql, /"licenseReviewedAt"\s*:\s*"[^"]+"/g)
  if (
    poiCount > 0 &&
    (
      licenseEvidenceRefCount < poiCount ||
      licenseReviewedByCount < poiCount ||
      licenseReviewedAtCount < poiCount
    )
  ) {
    blockers.push('seed SQL must include approved source license evidence for each production POI')
  }
  if (licenseEvidenceRefs.length < poiCount || licenseEvidenceRefs.some((ref) => !isNonLocalEvidenceRef(ref))) {
    blockers.push('seed SQL source license evidence refs must use non-local HTTPS or object-storage references')
  }
  if (/(?:data:|file:\/\/|localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(sql)) {
    blockers.push('seed SQL must not contain raw or local source license evidence references')
  }
  return check('source-license-evidence', blockers)
}

function checkSourceDocuments(sql) {
  const blockers = []
  const poiCount = extractPoiCodes(sql).length
  const sourceDocMentions = countMatches(sql, /POI 级生产来源/g)
  if (sourceDocMentions < poiCount) {
    blockers.push(`seed SQL must include POI-level production source documents; found ${sourceDocMentions}/${poiCount}`)
  }
  return check('source-documents', blockers)
}

function checkMediaAssets(sql) {
  const blockers = []
  const rows = extractInsertRows(sql, 'xunjing_media_asset')
  const publicApprovedRows = rows.filter((row) => {
    const values = extractSingleQuotedValues(row)
    const mediaType = values[1]
    const fileUrl = values[2]
    const copyrightStatus = values[6]
    const reviewStatus = values[7]
    return mediaType === 'IMAGE' &&
      isAllowedPublicMediaFile(fileUrl) &&
      copyrightStatus === 'AUTHORIZED' &&
      reviewStatus === 'APPROVED' &&
      row.includes("b'1', b'1'")
  })
  const targetMediaAssetCount = extractNumberMetric(sql, 'targetMediaAssetCount') || 4
  const minMediaCount = Math.max(4, targetMediaAssetCount)
  if (publicApprovedRows.length < minMediaCount) {
    blockers.push('seed SQL must include approved public xunjing_media_asset rows')
  }
  if (/(?:data:image|imageBase64|file:\/\/|localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(rows.join('\n'))) {
    blockers.push('seed SQL media assets must not use raw image data or local URLs')
  }
  return check('media-assets', blockers)
}

export async function verifyXichengPoiProductionSeed({
  sqlPath,
  minPoiCount = defaultMinPoiCount
} = {}) {
  if (!sqlPath) {
    throw new Error('--sql is required')
  }
  const resolvedSqlPath = path.resolve(sqlPath)
  const sql = await readFile(resolvedSqlPath, 'utf8')
  const normalizedMinPoiCount = Number(minPoiCount) || defaultMinPoiCount
  const checks = [
    checkSqlFile(sql),
    checkSeedShape(sql),
    checkSeedPreconditions(sql),
    checkPoiCount(sql, normalizedMinPoiCount),
    checkPoiApproval(sql),
    checkProductionMetrics(sql, normalizedMinPoiCount),
    checkReviewBatchMetrics(sql),
    checkMediaAssets(sql),
    checkFieldEvidence(sql),
    checkSourceLicenseEvidence(sql),
    checkSourceDocuments(sql)
  ]
  const blockers = checks.flatMap((item) => item.blockers)
  const ok = checks.every((item) => item.ok)

  return {
    artifactType,
    ok,
    status: ok ? 'PRODUCTION_POI_SEED_READY' : 'NOT_READY',
    checkedAt: new Date().toISOString(),
    summary: {
      sqlFile: resolvedSqlPath,
      sqlSha256: sha256(sql),
      poiCount: extractPoiCodes(sql).length,
      minPoiCount: normalizedMinPoiCount,
      productionReady: sql.includes('"productionReady":true'),
      regionCode: extractStringMetric(sql, 'regionCode'),
      packageCode: extractStringMetric(sql, 'packageCode'),
      poiSeedCount: extractNumberMetric(sql, 'poiSeedCount'),
      targetP0PoiCount: extractNumberMetric(sql, 'targetP0PoiCount'),
      reviewedMediaCount: extractNumberMetric(sql, 'reviewedMediaCount'),
      targetMediaAssetCount: extractNumberMetric(sql, 'targetMediaAssetCount'),
      reviewBatchCode: extractStringMetric(sql, 'reviewBatchCode'),
      reviewBatchEvidencePackageRef: extractStringMetric(sql, 'reviewBatchEvidencePackageRef')
    },
    checks,
    blockers
  }
}

async function runCli() {
  const args = process.argv.slice(2)
  const rootDir = path.resolve(readArgValue(args, '--root') || process.cwd())
  const report = await verifyXichengPoiProductionSeed({
    sqlPath: readArgValue(args, '--sql') || process.env.XICHENG_POI_PRODUCTION_SEED_SQL,
    minPoiCount: readArgValue(args, '--min-pois') || process.env.XICHENG_POI_MIN_COUNT || defaultMinPoiCount
  })
  await writeEvidence({
    rootDir,
    evidenceFile: readArgValue(args, '--evidence-file') || readArgValue(args, '--output'),
    report
  })
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) {
    process.exit(1)
  }
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
