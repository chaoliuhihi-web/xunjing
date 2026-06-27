import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-poi-production-manifest-readiness'
const expectedRegionCode = 'beijing-xicheng'
const expectedPackageCode = 'XICHENG-MAP-001'
const defaultMinPoiCount = 80
const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])

function hasText(value) {
  return String(value || '').trim().length > 0
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
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

function isHttpsUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' &&
      !['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(url.hostname.toLowerCase())
  } catch {
    return false
  }
}

function isFieldEvidenceRef(value) {
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

function check(name, blockers) {
  return {
    name,
    ok: blockers.length === 0,
    detail: blockers.length === 0 ? `${name} passed` : blockers.join('; '),
    blockers
  }
}

function poiLabel(poi, index) {
  return hasText(poi?.poiCode) ? poi.poiCode : `poi[${index}]`
}

function hasMinArray(value, minLength) {
  return Array.isArray(value) && value.filter(hasText).length >= minLength
}

function checkManifestShape(manifest) {
  const blockers = []
  if (!isObject(manifest)) {
    blockers.push('manifest must be a JSON object')
    return check('manifest-shape', blockers)
  }
  if (manifest.regionCode !== expectedRegionCode) {
    blockers.push(`manifest.regionCode must be ${expectedRegionCode}`)
  }
  if (manifest.packageCode !== expectedPackageCode) {
    blockers.push(`manifest.packageCode must be ${expectedPackageCode}`)
  }
  if (!Array.isArray(manifest.pois)) {
    blockers.push('manifest.pois must be an array')
  }
  return check('manifest-shape', blockers)
}

function checkManifestProductionFlags(manifest, minPoiCount) {
  const blockers = []
  if (manifest.productionReady !== true) {
    blockers.push('manifest.productionReady must be true before production seed merge')
  }
  const targetCount = Number(manifest.targetP0PoiCount)
  if (!Number.isFinite(targetCount) || targetCount < minPoiCount) {
    blockers.push(`manifest.targetP0PoiCount must be at least ${minPoiCount}`)
  }
  return check('manifest-production-flags', blockers)
}

function checkPoiCount(pois, minPoiCount) {
  const blockers = []
  if (pois.length < minPoiCount) {
    blockers.push(`${minPoiCount} production-ready POIs required; found ${pois.length}/${minPoiCount}`)
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
    if (poi.regionCode !== expectedRegionCode) {
      blockers.push(`${label} regionCode must be ${expectedRegionCode}`)
    }
    if (poi.packageCode !== expectedPackageCode) {
      blockers.push(`${label} packageCode must be ${expectedPackageCode}`)
    }
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
    blockers.push(`production manifest must cover at least 8 POI categories; found ${categories.size}`)
  }
  return check('poi-identity', blockers)
}

function checkPoiCoordinates(pois) {
  const blockers = []
  pois.forEach((poi, index) => {
    const label = poiLabel(poi, index)
    const latitude = Number(poi.latitude)
    const longitude = Number(poi.longitude)
    if (poi.coordType !== 'GCJ02') {
      blockers.push(`${label} coordType must be GCJ02`)
    }
    if (!Number.isFinite(latitude) || latitude < 39 || latitude > 41) {
      blockers.push(`${label} latitude must be within Beijing bounds`)
    }
    if (!Number.isFinite(longitude) || longitude < 115 || longitude > 117) {
      blockers.push(`${label} longitude must be within Beijing bounds`)
    }
  })
  return check('poi-coordinates', blockers)
}

function checkPoiTriggers(pois) {
  const blockers = []
  pois.forEach((poi, index) => {
    const label = poiLabel(poi, index)
    const trigger = isObject(poi.trigger) ? poi.trigger : {}
    const radius = Number(trigger.gpsRadiusMeters)
    const minConfidence = Number(trigger.minConfidence)
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
  })
  return check('poi-triggers', blockers)
}

function checkPoiSourceLicense(pois) {
  const blockers = []
  pois.forEach((poi, index) => {
    const label = poiLabel(poi, index)
    const source = isObject(poi.source) ? poi.source : {}
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
  })
  return check('poi-source-license', blockers)
}

function checkPoiFieldEvidence(pois) {
  const blockers = []
  pois.forEach((poi, index) => {
    const label = poiLabel(poi, index)
    const fieldEvidence = isObject(poi.fieldEvidence) ? poi.fieldEvidence : {}
    if (!isApproved(fieldEvidence.photoEvidenceStatus)) {
      blockers.push(`${label} fieldEvidence.photoEvidenceStatus must be APPROVED`)
    }
    if (!isPassed(fieldEvidence.triggerSmokeStatus)) {
      blockers.push(`${label} fieldEvidence.triggerSmokeStatus must be PASSED`)
    }
    if (!Array.isArray(fieldEvidence.evidenceRefs) || fieldEvidence.evidenceRefs.length === 0) {
      blockers.push(`${label} fieldEvidence.evidenceRefs must include at least one object-storage or HTTPS reference`)
    } else {
      const invalidRefs = fieldEvidence.evidenceRefs.filter((ref) => !isFieldEvidenceRef(ref))
      if (invalidRefs.length > 0) {
        blockers.push(`${label} fieldEvidence.evidenceRefs must include at least one object-storage or HTTPS reference`)
      }
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

function checkPoiContent(pois) {
  const blockers = []
  pois.forEach((poi, index) => {
    const label = poiLabel(poi, index)
    const content = isObject(poi.content) ? poi.content : {}
    if (String(content.shortIntro || '').trim().length < 20) {
      blockers.push(`${label} content.shortIntro must be at least 20 characters`)
    }
    if (!hasMinArray(content.recommendedQuestions, 3)) {
      blockers.push(`${label} content.recommendedQuestions must include at least three questions`)
    }
  })
  return check('poi-content', blockers)
}

function checkPoiAudit(pois) {
  const blockers = []
  pois.forEach((poi, index) => {
    const label = poiLabel(poi, index)
    const audit = isObject(poi.audit) ? poi.audit : {}
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
  return check('poi-audit', blockers)
}

export async function verifyXichengPoiProductionManifest({
  manifestPath,
  minPoiCount = defaultMinPoiCount
} = {}) {
  if (!manifestPath) {
    throw new Error('--manifest is required')
  }
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const pois = Array.isArray(manifest.pois) ? manifest.pois : []
  const normalizedMinPoiCount = Number(minPoiCount) || defaultMinPoiCount
  const checks = [
    checkManifestShape(manifest),
    checkManifestProductionFlags(manifest, normalizedMinPoiCount),
    checkPoiCount(pois, normalizedMinPoiCount),
    checkPoiIdentity(pois),
    checkPoiCoordinates(pois),
    checkPoiTriggers(pois),
    checkPoiSourceLicense(pois),
    checkPoiFieldEvidence(pois),
    checkPoiContent(pois),
    checkPoiAudit(pois)
  ]
  const blockers = checks.flatMap((item) => item.blockers)
  const ok = checks.every((item) => item.ok)
  const categories = new Set(pois.map((poi) => poi.category).filter(hasText))

  return {
    artifactType,
    ok,
    status: ok ? 'PRODUCTION_POI_MANIFEST_READY' : 'NOT_READY',
    checkedAt: new Date().toISOString(),
    summary: {
      regionCode: manifest.regionCode,
      packageCode: manifest.packageCode,
      totalPoiCount: pois.length,
      targetPoiCount: Number(manifest.targetP0PoiCount) || normalizedMinPoiCount,
      minPoiCount: normalizedMinPoiCount,
      productionReady: manifest.productionReady === true,
      categoryCount: categories.size
    },
    checks,
    blockers
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

async function runCli() {
  const args = process.argv.slice(2)
  const rootDir = path.resolve(readArgValue(args, '--root') || process.cwd())
  const manifestPath = readArgValue(args, '--manifest') || process.env.XICHENG_POI_MANIFEST
  const report = await verifyXichengPoiProductionManifest({
    manifestPath,
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
