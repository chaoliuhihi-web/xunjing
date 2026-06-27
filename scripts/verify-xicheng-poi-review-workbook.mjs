import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  buildXichengPoiProductionManifestFromWorkbookCsv
} from './build-xicheng-poi-production-manifest-from-workbook.mjs'

const artifactType = 'xicheng-poi-review-workbook-readiness'
const readyStatus = 'XICHENG_POI_REVIEW_WORKBOOK_READY'
const defaultMinPoiCount = 80
const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])
const placeholderPattern = /\b(?:TODO|TBD|PLACEHOLDER|REVIEW_REQUIRED)\b|待补|待复核/i

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function hasText(value) {
  return String(value || '').trim().length > 0
}

function isApproved(value) {
  return String(value || '').trim().toUpperCase() === 'APPROVED'
}

function isPassed(value) {
  return String(value || '').trim().toUpperCase() === 'PASSED'
}

function isPublished(value) {
  return String(value || '').trim().toUpperCase() === 'PUBLISHED'
}

function isLoopbackHostname(hostname) {
  const normalized = String(hostname || '').trim().toLowerCase()
  return normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '0.0.0.0' ||
    normalized === 'host.docker.internal'
}

function isHttpsUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !isLoopbackHostname(url.hostname)
  } catch {
    return false
  }
}

function isEvidenceRef(value) {
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

function hasMinArray(value, minLength) {
  return Array.isArray(value) && value.filter(hasText).length >= minLength
}

function check(name, blockers) {
  return {
    name,
    ok: blockers.length === 0,
    detail: blockers.length === 0 ? `${name} passed` : blockers.join('; '),
    blockers
  }
}

function poiLabel(poi, index) {
  return hasText(poi?.poiCode) ? poi.poiCode : `poi[${index + 1}]`
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

function resolveInputFile(rootDir, inputFile) {
  if (!inputFile) {
    return undefined
  }
  return path.isAbsolute(inputFile) ? path.resolve(inputFile) : path.resolve(rootDir, inputFile)
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

function reviewBatchForWorkbookGate() {
  return {
    batchCode: 'xicheng-workbook-gate',
    dataOwner: 'xicheng-workbook-review',
    sourceCompiledBy: 'xicheng-workbook-review',
    sourceCompiledAt: '1970-01-01',
    reviewedBy: 'xicheng-workbook-review',
    reviewedAt: '1970-01-01',
    evidencePackageRef: 'oss://xunjing-review/xicheng/workbook-gate/evidence.zip'
  }
}

function checkPoiCount(pois, minPoiCount) {
  const blockers = []
  if (pois.length < minPoiCount) {
    blockers.push(`${minPoiCount} reviewed workbook rows required; found ${pois.length}/${minPoiCount}`)
  }
  return check('poi-count', blockers)
}

function checkPoiIdentity(pois) {
  const blockers = []
  const seen = new Set()
  const categories = new Set()
  pois.forEach((poi, index) => {
    const label = poiLabel(poi, index)
    if (!/^xicheng-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(poi.poiCode || ''))) {
      blockers.push(`${label} poiCode must be a stable xicheng-* slug`)
    }
    if (seen.has(poi.poiCode)) {
      blockers.push(`${label} poiCode must be unique`)
    }
    seen.add(poi.poiCode)
    for (const field of ['name', 'displayName', 'category', 'address']) {
      if (!hasText(poi[field])) {
        blockers.push(`${label} ${field} is required`)
      }
    }
    if (hasText(poi.category)) {
      categories.add(poi.category)
    }
    if (poi.priority !== 'P0') {
      blockers.push(`${label} priority must be P0`)
    }
    if (!hasMinArray(poi.aliases, 2)) {
      blockers.push(`${label} aliases must include at least two names`)
    }
  })
  if (pois.length >= defaultMinPoiCount && categories.size < 8) {
    blockers.push(`review workbook must cover at least 8 POI categories; found ${categories.size}`)
  }
  return check('poi-identity', blockers)
}

function checkPoiSourceLicense(pois) {
  const blockers = []
  pois.forEach((poi, index) => {
    const label = poiLabel(poi, index)
    const source = poi.source || {}
    if (!hasText(source.sourceTitle)) {
      blockers.push(`${label} source.sourceTitle is required`)
    }
    if (!isHttpsUrl(source.sourceUrl)) {
      blockers.push(`${label} source.sourceUrl must be a non-local HTTPS URL`)
    }
    if (!['OFFICIAL', 'OFFICIAL_PUBLIC', 'AUTHORIZED', 'PARTNER'].includes(String(source.sourceType || '').toUpperCase())) {
      blockers.push(`${label} source.sourceType must be OFFICIAL, OFFICIAL_PUBLIC, AUTHORIZED or PARTNER`)
    }
    if (!isApproved(source.licenseStatus)) {
      blockers.push(`${label} source.licenseStatus must be APPROVED`)
    }
    if (!isEvidenceRef(source.licenseEvidenceRef)) {
      blockers.push(`${label} source.licenseEvidenceRef must include a source license evidence reference`)
    }
    if (!hasText(source.licenseReviewedBy)) {
      blockers.push(`${label} source.licenseReviewedBy is required`)
    }
    if (!hasText(source.licenseReviewedAt)) {
      blockers.push(`${label} source.licenseReviewedAt is required`)
    }
  })
  return check('poi-source-license', blockers)
}

function checkPoiFieldEvidence(pois) {
  const blockers = []
  pois.forEach((poi, index) => {
    const label = poiLabel(poi, index)
    const trigger = poi.trigger || {}
    const fieldEvidence = poi.fieldEvidence || {}
    const radius = Number(trigger.gpsRadiusMeters)
    const minConfidence = Number(trigger.minConfidence)
    if (poi.coordType !== 'GCJ02') {
      blockers.push(`${label} coordType must be GCJ02`)
    }
    if (!Number.isFinite(Number(poi.latitude)) || Number(poi.latitude) < 39 || Number(poi.latitude) > 41) {
      blockers.push(`${label} latitude must be within Beijing bounds`)
    }
    if (!Number.isFinite(Number(poi.longitude)) || Number(poi.longitude) < 115 || Number(poi.longitude) > 117) {
      blockers.push(`${label} longitude must be within Beijing bounds`)
    }
    if (!Number.isFinite(radius) || radius < 50 || radius > 800) {
      blockers.push(`${label} trigger.gpsRadiusMeters must be between 50 and 800`)
    }
    if (!hasMinArray(trigger.ocrKeywords, 2)) {
      blockers.push(`${label} trigger.ocrKeywords must include at least two keywords`)
    }
    if (!hasMinArray(trigger.photoLabels, 2)) {
      blockers.push(`${label} trigger.photoLabels must include at least two labels`)
    }
    if (!Number.isFinite(minConfidence) || minConfidence < 0.8 || minConfidence > 1) {
      blockers.push(`${label} trigger.minConfidence must be between 0.8 and 1`)
    }
    if (!isApproved(fieldEvidence.photoEvidenceStatus)) {
      blockers.push(`${label} fieldEvidence.photoEvidenceStatus must be APPROVED`)
    }
    if (!isPassed(fieldEvidence.triggerSmokeStatus)) {
      blockers.push(`${label} fieldEvidence.triggerSmokeStatus must be PASSED`)
    }
    if (!Array.isArray(fieldEvidence.evidenceRefs) || fieldEvidence.evidenceRefs.length === 0 || fieldEvidence.evidenceRefs.some((ref) => !isEvidenceRef(ref))) {
      blockers.push(`${label} fieldEvidence.evidenceRefs must include object-storage or HTTPS references`)
    }
    if (!hasText(fieldEvidence.verifiedBy)) {
      blockers.push(`${label} fieldEvidence.verifiedBy is required`)
    }
    if (!hasText(fieldEvidence.verifiedAt)) {
      blockers.push(`${label} fieldEvidence.verifiedAt is required`)
    }
  })
  return check('poi-field-evidence', blockers)
}

function checkPoiContentAudit(pois) {
  const blockers = []
  pois.forEach((poi, index) => {
    const label = poiLabel(poi, index)
    const content = poi.content || {}
    const audit = poi.audit || {}
    if (String(content.shortIntro || '').trim().length < 20) {
      blockers.push(`${label} content.shortIntro must be at least 20 characters`)
    }
    if (!hasMinArray(content.recommendedQuestions, 3)) {
      blockers.push(`${label} content.recommendedQuestions must include at least three questions`)
    }
    for (const field of ['reviewStatus', 'geoStatus', 'licenseStatus']) {
      if (!isApproved(audit[field])) {
        blockers.push(`${label} audit.${field} must be APPROVED`)
      }
    }
    if (!isPublished(audit.status)) {
      blockers.push(`${label} audit.status must be PUBLISHED`)
    }
    if (!hasText(audit.reviewedBy)) {
      blockers.push(`${label} audit.reviewedBy is required`)
    }
    if (!hasText(audit.reviewedAt)) {
      blockers.push(`${label} audit.reviewedAt is required`)
    }
  })
  return check('poi-content-audit', blockers)
}

function collectStrings(value, output = []) {
  if (typeof value === 'string') {
    output.push(value)
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, output))
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, output))
  }
  return output
}

function containsPlaceholderValue(value) {
  return collectStrings(value).some((item) => placeholderPattern.test(item))
}

function checkNoPlaceholderCells(pois) {
  const placeholderCount = collectStrings(pois).filter((value) => placeholderPattern.test(value)).length
  const blockers = placeholderCount > 0
    ? [`workbook contains placeholder review values (${placeholderCount})`]
    : []
  return {
    ...check('no-placeholder-cells', blockers),
    summary: { placeholderCount }
  }
}

function isWorkbookPoiRowReady(poi) {
  const source = poi.source || {}
  const trigger = poi.trigger || {}
  const fieldEvidence = poi.fieldEvidence || {}
  const content = poi.content || {}
  const audit = poi.audit || {}
  const radius = Number(trigger.gpsRadiusMeters)
  const minConfidence = Number(trigger.minConfidence)

  return /^xicheng-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(poi.poiCode || '')) &&
    ['name', 'displayName', 'category', 'address'].every((field) => hasText(poi[field])) &&
    poi.priority === 'P0' &&
    hasMinArray(poi.aliases, 2) &&
    hasText(source.sourceTitle) &&
    isHttpsUrl(source.sourceUrl) &&
    ['OFFICIAL', 'OFFICIAL_PUBLIC', 'AUTHORIZED', 'PARTNER'].includes(String(source.sourceType || '').toUpperCase()) &&
    isApproved(source.licenseStatus) &&
    isEvidenceRef(source.licenseEvidenceRef) &&
    hasText(source.licenseReviewedBy) &&
    hasText(source.licenseReviewedAt) &&
    poi.coordType === 'GCJ02' &&
    Number.isFinite(Number(poi.latitude)) &&
    Number(poi.latitude) >= 39 &&
    Number(poi.latitude) <= 41 &&
    Number.isFinite(Number(poi.longitude)) &&
    Number(poi.longitude) >= 115 &&
    Number(poi.longitude) <= 117 &&
    Number.isFinite(radius) &&
    radius >= 50 &&
    radius <= 800 &&
    hasMinArray(trigger.ocrKeywords, 2) &&
    hasMinArray(trigger.photoLabels, 2) &&
    Number.isFinite(minConfidence) &&
    minConfidence >= 0.8 &&
    minConfidence <= 1 &&
    isApproved(fieldEvidence.photoEvidenceStatus) &&
    isPassed(fieldEvidence.triggerSmokeStatus) &&
    Array.isArray(fieldEvidence.evidenceRefs) &&
    fieldEvidence.evidenceRefs.length > 0 &&
    fieldEvidence.evidenceRefs.every((ref) => isEvidenceRef(ref)) &&
    hasText(fieldEvidence.verifiedBy) &&
    hasText(fieldEvidence.verifiedAt) &&
    String(content.shortIntro || '').trim().length >= 20 &&
    hasMinArray(content.recommendedQuestions, 3) &&
    ['reviewStatus', 'geoStatus', 'licenseStatus'].every((field) => isApproved(audit[field])) &&
    isPublished(audit.status) &&
    hasText(audit.reviewedBy) &&
    hasText(audit.reviewedAt) &&
    !containsPlaceholderValue(poi)
}

function summarizeWorkbookPoiRows(pois) {
  const pendingPoiCodes = []
  let workbookReadyPoiCount = 0
  pois.forEach((poi, index) => {
    if (isWorkbookPoiRowReady(poi)) {
      workbookReadyPoiCount += 1
    } else {
      pendingPoiCodes.push(poiLabel(poi, index))
    }
  })
  return {
    workbookReadyPoiCount,
    workbookPendingPoiCount: pendingPoiCodes.length,
    pendingPoiCodes
  }
}

async function writeEvidence({ rootDir, evidenceFile, report }) {
  const resolvedFile = resolveEvidenceFile(rootDir, evidenceFile)
  if (!resolvedFile) {
    return
  }
  await mkdir(path.dirname(resolvedFile), { recursive: true })
  await writeFile(resolvedFile, `${JSON.stringify(report, null, 2)}\n`)
}

export async function verifyXichengPoiReviewWorkbook({
  rootDir = process.cwd(),
  workbookFile,
  minPoiCount = defaultMinPoiCount,
  evidenceFile
} = {}) {
  const resolvedRoot = path.resolve(rootDir)
  const resolvedWorkbookFile = resolveInputFile(resolvedRoot, workbookFile)
  const fileBlockers = []
  let workbookText = ''
  if (!resolvedWorkbookFile) {
    fileBlockers.push('--workbook is required')
  } else {
    try {
      workbookText = await readFile(resolvedWorkbookFile, 'utf8')
    } catch (error) {
      fileBlockers.push(`workbook cannot be read: ${error.message}`)
    }
  }
  const fileCheck = check('workbook-file', fileBlockers)

  const shapeBlockers = []
  let manifest = { pois: [], sourceWorkbook: { rowCount: 0 } }
  if (fileCheck.ok) {
    try {
      manifest = buildXichengPoiProductionManifestFromWorkbookCsv(workbookText, {
        productionReady: true,
        reviewBatch: reviewBatchForWorkbookGate(),
        targetP0PoiCount: minPoiCount,
        workbookFile: resolvedWorkbookFile
      })
    } catch (error) {
      shapeBlockers.push(error.message)
    }
  } else {
    shapeBlockers.push('workbook CSV could not be parsed')
  }
  const shapeCheck = check('workbook-shape', shapeBlockers)
  const pois = shapeCheck.ok ? manifest.pois : []
  const normalizedMinPoiCount = Number(minPoiCount) || defaultMinPoiCount
  const placeholderCheck = checkNoPlaceholderCells(pois)
  const checks = [
    fileCheck,
    shapeCheck,
    checkPoiCount(pois, normalizedMinPoiCount),
    checkPoiIdentity(pois),
    checkPoiSourceLicense(pois),
    checkPoiFieldEvidence(pois),
    checkPoiContentAudit(pois),
    placeholderCheck
  ]
  const blockers = checks.flatMap((item) => item.blockers || [])
  const ok = checks.every((item) => item.ok)
  const categories = new Set(pois.map((poi) => poi.category).filter(hasText))
  const poiRowSummary = summarizeWorkbookPoiRows(pois)
  const blockerBreakdown = checks.map((item) => ({
    name: item.name,
    ok: item.ok,
    blockerCount: Array.isArray(item.blockers) ? item.blockers.length : 0
  }))

  const report = {
    artifactType,
    ok,
    status: ok ? readyStatus : 'NOT_READY',
    checkedAt: new Date().toISOString(),
    summary: {
      workbookFile: resolvedWorkbookFile,
      workbookSha256: workbookText ? sha256(workbookText) : undefined,
      workbookRows: pois.length,
      minPoiCount: normalizedMinPoiCount,
      categoryCount: categories.size,
      placeholderCount: placeholderCheck.summary.placeholderCount,
      totalCheckCount: checks.length,
      passedCheckCount: checks.filter((item) => item.ok).length,
      failedCheckCount: checks.filter((item) => !item.ok).length,
      blockerCount: blockers.length,
      ...poiRowSummary,
      blockerBreakdown
    },
    checks,
    blockers
  }
  await writeEvidence({ rootDir: resolvedRoot, evidenceFile, report })
  return report
}

async function runCli() {
  const args = process.argv.slice(2)
  const rootDir = path.resolve(readArgValue(args, '--root') || process.cwd())
  const report = await verifyXichengPoiReviewWorkbook({
    rootDir,
    workbookFile: readArgValue(args, '--workbook'),
    minPoiCount: readArgValue(args, '--min-poi-count'),
    evidenceFile: readArgValue(args, '--evidence-file')
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
