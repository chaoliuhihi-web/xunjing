import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve, relative, isAbsolute, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const seedSource = 'backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql'
const artifactType = 'ai-shijing-gps-scene-fusion-smoke'
const readyStatus = 'AI_SHIJING_GPS_SCENE_FUSION_SMOKE_READY'
const reviewRequiredStatus = 'AI_SHIJING_GPS_SCENE_FUSION_SMOKE_REVIEW_REQUIRED'
const autoTriggerThreshold = 0.85
const safeOutputDirs = new Set(['qa', 'tmp', 'workbench'])

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

function sqlText(value) {
  const text = String(value || '').trim()
  if (text.startsWith("'") && text.endsWith("'")) {
    return text.slice(1, -1).replace(/''/g, "'")
  }
  return text
}

function numberValue(value, fallback = 0) {
  const number = Number(sqlText(value))
  return Number.isFinite(number) ? number : fallback
}

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '')
}

function splitSqlTupleFields(line) {
  const trimmed = line.trim().replace(/,\s*$/, '').replace(/;\s*$/, '')
  const source = trimmed.startsWith('(') && trimmed.endsWith(')')
    ? trimmed.slice(1, -1)
    : trimmed.replace(/^\(/, '').replace(/\)$/, '')
  const fields = []
  let cell = ''
  let inQuote = false
  let depth = 0
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]
    if (inQuote) {
      cell += char
      if (char === "'" && next === "'") {
        cell += next
        index += 1
      } else if (char === "'") {
        inQuote = false
      }
      continue
    }
    if (char === "'") {
      inQuote = true
      cell += char
    } else if (char === '(') {
      depth += 1
      cell += char
    } else if (char === ')') {
      depth = Math.max(0, depth - 1)
      cell += char
    } else if (char === ',' && depth === 0) {
      fields.push(cell.trim())
      cell = ''
    } else {
      cell += char
    }
  }
  if (cell.length > 0) {
    fields.push(cell.trim())
  }
  return fields
}

function jsonValue(value, fallback) {
  try {
    return JSON.parse(sqlText(value))
  } catch {
    return fallback
  }
}

function loadXichengPois(seedText) {
  return seedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("(@map_package_id, 'xicheng-"))
    .map((line) => {
      const fields = splitSqlTupleFields(line)
      const aliases = jsonValue(fields[5], [])
      const triggerConfig = jsonValue(fields[13], {})
      const metadata = jsonValue(fields[14], {})
      return {
        poiCode: sqlText(fields[1]),
        regionCode: sqlText(fields[2]),
        name: sqlText(fields[3]),
        displayName: sqlText(fields[4]),
        aliases: Array.isArray(aliases) ? aliases : [],
        latitude: numberValue(fields[9]),
        longitude: numberValue(fields[10]),
        coordType: sqlText(fields[11]),
        gpsRadiusMeters: numberValue(triggerConfig.gpsRadiusMeters, 0),
        ocrKeywords: Array.isArray(triggerConfig.ocrKeywords) ? triggerConfig.ocrKeywords : [],
        photoLabels: Array.isArray(triggerConfig.photoLabels) ? triggerConfig.photoLabels : [],
        minConfidence: numberValue(triggerConfig.minConfidence, autoTriggerThreshold),
        summary: String(metadata.shortIntro || '')
      }
    })
}

function containsAnyAlias(text, poi) {
  if (!hasText(text)) {
    return false
  }
  const normalizedText = normalize(text)
  return [
    poi.name,
    poi.displayName,
    ...poi.aliases,
    ...poi.ocrKeywords
  ].some((alias) => hasText(alias) && normalizedText.includes(normalize(alias)))
}

function imageMatchCount(imageLabels, poi) {
  const labels = new Set((imageLabels || []).map(normalize).filter(Boolean))
  let count = 0
  for (const visualLabel of poi.photoLabels || []) {
    const normalizedVisual = normalize(visualLabel)
    for (const label of labels) {
      if (label === normalizedVisual || label.includes(normalizedVisual) || normalizedVisual.includes(label)) {
        count += 1
        break
      }
    }
  }
  return count
}

function haversineMeters(latitude1, longitude1, latitude2, longitude2) {
  const earthRadiusMeters = 6371000
  const dLat = toRadians(latitude2 - latitude1)
  const dLon = toRadians(longitude2 - longitude1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRadians(latitude1)) * Math.cos(toRadians(latitude2))
    * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRadians(value) {
  return value * Math.PI / 180
}

function round2(value) {
  return Math.round(value * 100) / 100
}

function scorePoi(poi, payload) {
  let score = 0
  const signals = []
  let distanceMeters = null
  const location = payload.location
  if (location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
    distanceMeters = haversineMeters(location.latitude, location.longitude, poi.latitude, poi.longitude)
    if (distanceMeters <= poi.gpsRadiusMeters) {
      score += 0.38
      signals.push('gps_radius')
    } else if (distanceMeters <= poi.gpsRadiusMeters * 2) {
      score += 0.18
      signals.push('gps_nearby')
    }
  }
  if (containsAnyAlias(payload.ocrText, poi)) {
    score += 0.45
    signals.push('ocr_alias')
  }
  if (signals.includes('gps_radius') && signals.includes('ocr_alias')) {
    score += 0.04
    signals.push('gps_ocr_fused')
  }
  if (containsAnyAlias(payload.text, poi)) {
    score += 0.34
    signals.push('text_alias')
  }
  if (containsAnyAlias(payload.sceneSignalContextText, poi)) {
    score += 0.24
    signals.push('scene_context_alias')
  }
  if ((payload.recentPoiCodes || []).includes(poi.poiCode)) {
    score += 0.08
    signals.push('context_poi')
  }
  const matches = imageMatchCount(payload.imageLabels, poi)
  if (matches > 0) {
    score += Math.min(0.38, 0.22 + (matches - 1) * 0.08)
    signals.push('image_label')
  }
  return {
    poi,
    confidence: round2(Math.min(score, 0.99)),
    distanceMeters: distanceMeters == null ? null : round2(distanceMeters),
    matchedSignals: signals
  }
}

function resolveTriggerType(signals) {
  if (signals.includes('gps_ocr_fused')) {
    return 'scene_fusion'
  }
  if (signals.includes('ocr_alias')) {
    return 'ocr'
  }
  if (signals.includes('gps_radius') || signals.includes('gps_nearby')) {
    return 'location'
  }
  if (signals.includes('image_label')) {
    return 'image'
  }
  if (signals.includes('text_alias')) {
    return 'text'
  }
  return 'context'
}

function resolveScene(pois, payload) {
  const candidates = pois
    .map((poi) => scorePoi(poi, payload))
    .filter((candidate) => candidate.confidence > 0)
    .sort((left, right) => {
      if (right.confidence !== left.confidence) {
        return right.confidence - left.confidence
      }
      const leftDistance = left.distanceMeters == null ? Number.POSITIVE_INFINITY : left.distanceMeters
      const rightDistance = right.distanceMeters == null ? Number.POSITIVE_INFINITY : right.distanceMeters
      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance
      }
      return left.poi.gpsRadiusMeters - right.poi.gpsRadiusMeters
    })
    .slice(0, 3)
  const best = candidates[0]
  if (!best) {
    return {
      resolvedPoiCode: '',
      resolvedPoiName: '',
      confidence: 0,
      requiresUserConfirm: true,
      autoTriggered: false,
      triggerType: 'context',
      matchedSignals: [],
      candidatePoiCodes: []
    }
  }
  const autoTriggered = best.confidence >= autoTriggerThreshold
  return {
    resolvedPoiCode: best.poi.poiCode,
    resolvedPoiName: best.poi.displayName || best.poi.name,
    confidence: best.confidence,
    requiresUserConfirm: !autoTriggered,
    autoTriggered,
    triggerType: resolveTriggerType(best.matchedSignals),
    matchedSignals: best.matchedSignals,
    distanceMeters: best.distanceMeters,
    candidatePoiCodes: candidates.map((candidate) => candidate.poi.poiCode)
  }
}

function buildCases(pois) {
  const byCode = new Map(pois.map((poi) => [poi.poiCode, poi]))
  const baitasi = byCode.get('xicheng-baitasi')
  const gongwangfu = byCode.get('xicheng-gongwangfu')
  const planetarium = byCode.get('xicheng-planetarium')
  if (!baitasi || !gongwangfu || !planetarium) {
    throw new Error('required Xicheng GPS smoke POIs are missing from seed')
  }
  return [
    {
      caseId: 'baitasi-gps-ocr-photo',
      expectedPoiCode: 'xicheng-baitasi',
      expectedTriggerType: 'scene_fusion',
      expectAutoTriggered: true,
      expectedSignals: ['gps_radius', 'ocr_alias', 'gps_ocr_fused', 'image_label'],
      payload: {
        location: locationOf(baitasi),
        ocrText: '妙应寺白塔入口',
        imageLabels: ['white_pagoda', 'temple'],
        text: '我想听讲解'
      }
    },
    {
      caseId: 'gongwangfu-gps-ocr-photo',
      expectedPoiCode: 'xicheng-gongwangfu',
      expectedTriggerType: 'scene_fusion',
      expectAutoTriggered: true,
      expectedSignals: ['gps_radius', 'ocr_alias', 'gps_ocr_fused', 'image_label'],
      payload: {
        location: locationOf(gongwangfu),
        ocrText: '恭王府博物馆入口',
        imageLabels: ['palace', 'courtyard'],
        text: '我想听讲解'
      }
    },
    {
      caseId: 'planetarium-near-zoo-disambiguation',
      expectedPoiCode: 'xicheng-planetarium',
      expectedTriggerType: 'scene_fusion',
      expectAutoTriggered: true,
      expectedCandidatePoiCodes: ['xicheng-beijing-zoo'],
      expectedSignals: ['gps_radius', 'ocr_alias', 'gps_ocr_fused', 'image_label'],
      payload: {
        location: locationOf(planetarium),
        ocrText: '北京天文馆天象厅',
        imageLabels: ['planetarium', 'dome'],
        text: '我想听讲解'
      }
    },
    {
      caseId: 'gps-only-baitasi-needs-confirmation',
      expectedPoiCode: 'xicheng-baitasi',
      expectedTriggerType: 'location',
      expectAutoTriggered: false,
      expectedSignals: ['gps_radius'],
      payload: {
        location: locationOf(baitasi),
        ocrText: '',
        imageLabels: [],
        text: ''
      }
    },
    {
      caseId: 'wrong-area-ocr-photo-needs-confirmation',
      expectedPoiCode: 'xicheng-planetarium',
      expectedTriggerType: 'ocr',
      expectAutoTriggered: false,
      expectedAbsentSignals: ['gps_ocr_fused'],
      payload: {
        location: locationOf(baitasi),
        ocrText: '北京天文馆天象厅',
        imageLabels: ['planetarium', 'dome'],
        text: ''
      }
    },
    {
      caseId: 'baitasi-memory-continuation',
      expectedPoiCode: 'xicheng-baitasi',
      expectedTriggerType: 'context',
      expectAutoTriggered: false,
      expectedSignals: ['context_poi', 'scene_context_alias'],
      payload: {
        location: null,
        ocrText: '',
        imageLabels: [],
        text: '继续看这个屋顶结构',
        recentPoiCodes: ['xicheng-baitasi'],
        sceneSignalContextText: '连续识境：上一轮识别到妙应寺白塔，继续白塔寺片区。'
      }
    }
  ]
}

function locationOf(poi) {
  return {
    latitude: poi.latitude,
    longitude: poi.longitude,
    coordType: poi.coordType || 'GCJ02',
    accuracyMeters: 20
  }
}

function validateCase(caseDef, result) {
  const blockers = []
  if (result.resolvedPoiCode !== caseDef.expectedPoiCode) {
    blockers.push(`${caseDef.caseId} resolved ${result.resolvedPoiCode || '(none)'} instead of ${caseDef.expectedPoiCode}`)
  }
  if (caseDef.expectedTriggerType && result.triggerType !== caseDef.expectedTriggerType) {
    blockers.push(`${caseDef.caseId} triggerType ${result.triggerType} instead of ${caseDef.expectedTriggerType}`)
  }
  if (typeof caseDef.expectAutoTriggered === 'boolean' && result.autoTriggered !== caseDef.expectAutoTriggered) {
    blockers.push(`${caseDef.caseId} autoTriggered=${result.autoTriggered} instead of ${caseDef.expectAutoTriggered}`)
  }
  for (const signal of caseDef.expectedSignals || []) {
    if (!result.matchedSignals.includes(signal)) {
      blockers.push(`${caseDef.caseId} missing signal ${signal}`)
    }
  }
  for (const signal of caseDef.expectedAbsentSignals || []) {
    if (result.matchedSignals.includes(signal)) {
      blockers.push(`${caseDef.caseId} should not include signal ${signal}`)
    }
  }
  for (const poiCode of caseDef.expectedCandidatePoiCodes || []) {
    if (!result.candidatePoiCodes.includes(poiCode)) {
      blockers.push(`${caseDef.caseId} candidate list missing ${poiCode}`)
    }
  }
  return blockers
}

function resolveSafeOutputFile(outputFile) {
  if (!hasText(outputFile)) {
    return null
  }
  const resolvedRoot = resolve(rootDir)
  const resolvedFile = isAbsolute(outputFile) ? resolve(outputFile) : resolve(resolvedRoot, outputFile)
  const relativePath = relative(resolvedRoot, resolvedFile)
  const [topLevelDir] = relativePath.split(sep)
  if (
    !relativePath ||
    relativePath.startsWith('..') ||
    isAbsolute(relativePath) ||
    !safeOutputDirs.has(topLevelDir)
  ) {
    throw new Error('--evidence-file must be under qa/, tmp/ or workbench/')
  }
  return resolvedFile
}

async function main() {
  const args = process.argv.slice(2)
  const evidenceFile = resolveSafeOutputFile(readArgValue(args, '--evidence-file'))
  const seedText = await readFile(resolve(rootDir, seedSource), 'utf8')
  const pois = loadXichengPois(seedText)
  const cases = []
  const blockers = []
  for (const caseDef of buildCases(pois)) {
    const result = resolveScene(pois, caseDef.payload)
    const caseBlockers = validateCase(caseDef, result)
    blockers.push(...caseBlockers)
    cases.push({
      caseId: caseDef.caseId,
      ok: caseBlockers.length === 0,
      expectedPoiCode: caseDef.expectedPoiCode,
      resolvedPoiCode: result.resolvedPoiCode,
      resolvedPoiName: result.resolvedPoiName,
      confidence: result.confidence,
      requiresUserConfirm: result.requiresUserConfirm,
      autoTriggered: result.autoTriggered,
      triggerType: result.triggerType,
      distanceMeters: result.distanceMeters,
      matchedSignals: result.matchedSignals,
      candidatePoiCodes: result.candidatePoiCodes,
      blockers: caseBlockers
    })
  }
  const report = {
    artifactType,
    ok: blockers.length === 0,
    status: blockers.length === 0 ? readyStatus : reviewRequiredStatus,
    checkedAt: new Date().toISOString(),
    summary: {
      seedSource,
      poiCount: pois.length,
      caseCount: cases.length,
      passedCaseCount: cases.filter((item) => item.ok).length,
      failedCaseCount: cases.filter((item) => !item.ok).length,
      wrongAreaAutoTriggerCount: cases.filter((item) => item.caseId.includes('wrong-area') && item.autoTriggered).length,
      evidenceScope: 'local_simulation_not_production'
    },
    cases,
    blockers
  }
  if (evidenceFile) {
    await mkdir(dirname(evidenceFile), { recursive: true })
    await writeFile(evidenceFile, JSON.stringify(report, null, 2) + '\n')
  }
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    artifactType,
    ok: false,
    status: reviewRequiredStatus,
    error: error.message
  }, null, 2))
  process.exitCode = 1
})
