import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  writeXichengPoiProductionManifestTemplate
} from './create-xicheng-poi-production-manifest-template.mjs'
import {
  verifyXichengPoiReviewWorkbook
} from './verify-xicheng-poi-review-workbook.mjs'
import {
  exportXichengPoiReviewTasks
} from './export-xicheng-poi-review-tasks.mjs'

const artifactType = 'xicheng-poi-production-review-pack'
const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])

const defaultPaths = {
  outputFile: 'workbench/xicheng-production-pois.prefilled.json',
  seedSqlFile: 'backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql',
  reviewChecklistFile: 'workbench/xicheng-production-pois.review-checklist.csv',
  reviewWorkbookFile: 'workbench/xicheng-production-pois.review-workbook.csv',
  reviewPacketFile: 'workbench/xicheng-production-pois.review-packet.json',
  workbookEvidenceFile: 'qa/xicheng-poi-review-workbook-evidence.json',
  reviewTasksFile: 'workbench/xicheng-poi-review-tasks.csv',
  sourceReviewFile: 'workbench/xicheng-poi-source-review-summary.csv',
  reviewPackEvidenceFile: 'qa/xicheng-poi-production-review-pack-evidence.json'
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

function resolveRootPath(rootDir, filePath) {
  return path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(rootDir, filePath)
}

function resolveEvidenceFile(rootDir, filePath) {
  const resolvedRoot = path.resolve(rootDir)
  const resolvedFile = resolveRootPath(resolvedRoot, filePath)
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

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function csvRow(values) {
  return values.map(csvCell).join(',')
}

function sourceReviewKey(poi) {
  const source = poi.source || {}
  return [
    String(source.sourceUrl || '').trim(),
    String(source.sourceType || '').trim()
  ].join('\n')
}

function buildSourceReviewGroups(manifest) {
  const groups = new Map()
  const pois = Array.isArray(manifest?.pois) ? manifest.pois : []
  for (const poi of pois) {
    const source = poi.source || {}
    const key = sourceReviewKey(poi)
    const group = groups.get(key) || {
      sourceTitle: String(source.sourceTitle || '').trim(),
      sourceUrl: String(source.sourceUrl || '').trim(),
      sourceType: String(source.sourceType || '').trim(),
      licenseStatuses: new Set(),
      poiCodes: [],
      poiNames: []
    }
    group.licenseStatuses.add(String(source.licenseStatus || '').trim())
    group.poiCodes.push(poi.poiCode)
    group.poiNames.push(poi.name || poi.displayName || '')
    groups.set(key, group)
  }
  return Array.from(groups.values()).map((group) => ({
    sourceTitle: group.sourceTitle,
    sourceUrl: group.sourceUrl,
    sourceType: group.sourceType,
    poiCount: group.poiCodes.length,
    poiCodes: group.poiCodes,
    poiNames: group.poiNames,
    licenseStatus: Array.from(group.licenseStatuses).filter(Boolean).join('|') || 'REVIEW_REQUIRED',
    licenseEvidenceRef: '',
    licenseReviewedBy: '',
    licenseReviewedAt: '',
    nextAction: 'Approve source license once per source group and attach non-local evidence refs to every POI row.'
  }))
}

function buildSourceReviewCsv(groups) {
  return [
    csvRow([
      'sourceTitle',
      'sourceUrl',
      'sourceType',
      'poiCount',
      'poiCodes',
      'poiNames',
      'licenseStatus',
      'licenseEvidenceRef',
      'licenseReviewedBy',
      'licenseReviewedAt',
      'nextAction'
    ]),
    ...groups.map((group) => csvRow([
      group.sourceTitle,
      group.sourceUrl,
      group.sourceType,
      group.poiCount,
      group.poiCodes.join('|'),
      group.poiNames.join('|'),
      group.licenseStatus,
      group.licenseEvidenceRef,
      group.licenseReviewedBy,
      group.licenseReviewedAt,
      group.nextAction
    ]))
  ].join('\n') + '\n'
}

function sourceReviewGroupBreakdown(groups) {
  return groups.map((group) => ({
    sourceTitle: group.sourceTitle,
    sourceUrl: group.sourceUrl,
    sourceType: group.sourceType,
    poiCount: group.poiCount,
    poiCodes: group.poiCodes
  }))
}

export async function createXichengPoiProductionReviewPack({
  rootDir = process.cwd(),
  outputFile = defaultPaths.outputFile,
  seedSqlFile = defaultPaths.seedSqlFile,
  reviewChecklistFile = defaultPaths.reviewChecklistFile,
  reviewWorkbookFile = defaultPaths.reviewWorkbookFile,
  reviewPacketFile = defaultPaths.reviewPacketFile,
  workbookEvidenceFile = defaultPaths.workbookEvidenceFile,
  reviewTasksFile = defaultPaths.reviewTasksFile,
  sourceReviewFile = defaultPaths.sourceReviewFile,
  reviewPackEvidenceFile = defaultPaths.reviewPackEvidenceFile,
  count = 80
} = {}) {
  const resolvedRootDir = path.resolve(rootDir)
  const templateReport = await writeXichengPoiProductionManifestTemplate({
    rootDir: resolvedRootDir,
    outputFile,
    count,
    seedSqlFile: path.resolve(seedSqlFile),
    reviewChecklistFile,
    reviewWorkbookFile,
    reviewPacketFile
  })
  const resolvedOutputFile = resolveRootPath(resolvedRootDir, outputFile)
  const manifest = JSON.parse(await readFile(resolvedOutputFile, 'utf8'))
  const resolvedReviewPacketFile = resolveRootPath(resolvedRootDir, reviewPacketFile)
  const reviewPacket = JSON.parse(await readFile(resolvedReviewPacketFile, 'utf8'))
  const sourceReviewGroups = buildSourceReviewGroups(manifest)
  const resolvedSourceReviewFile = resolveEvidenceFile(resolvedRootDir, sourceReviewFile)
  await mkdir(path.dirname(resolvedSourceReviewFile), { recursive: true })
  await writeFile(resolvedSourceReviewFile, buildSourceReviewCsv(sourceReviewGroups))
  const workbookGateReport = await verifyXichengPoiReviewWorkbook({
    rootDir: resolvedRootDir,
    workbookFile: reviewWorkbookFile,
    evidenceFile: workbookEvidenceFile
  })
  const reviewTaskReport = await exportXichengPoiReviewTasks({
    rootDir: resolvedRootDir,
    workbookEvidenceFile,
    outputFile: reviewTasksFile
  })
  const resolvedWorkbookEvidenceFile = resolveRootPath(resolvedRootDir, workbookEvidenceFile)
  const resolvedReviewTasksFile = resolveRootPath(resolvedRootDir, reviewTasksFile)
  const resolvedReviewPackEvidenceFile = resolveEvidenceFile(resolvedRootDir, reviewPackEvidenceFile)

  const report = {
    artifactType,
    ok: false,
    status: 'REVIEW_DATA_REQUIRED',
    checkedAt: new Date().toISOString(),
    summary: {
      ...templateReport.summary,
      reviewPacketFile: resolvedReviewPacketFile,
      reviewPacketStatus: reviewPacket.status,
      workbookEvidenceFile: resolvedWorkbookEvidenceFile,
      workbookGateStatus: workbookGateReport.status,
      workbookReadyPoiCount: workbookGateReport.summary?.workbookReadyPoiCount,
      workbookPendingPoiCount: workbookGateReport.summary?.workbookPendingPoiCount,
      reviewTasksFile: resolvedReviewTasksFile,
      reviewTaskStatus: reviewTaskReport.status,
      reviewTaskCount: reviewTaskReport.summary?.taskCount,
      reviewTaskOwnerLaneCounts: reviewTaskReport.summary?.ownerLaneCounts,
      reviewTaskOwnerLaneBreakdown: reviewTaskReport.summary?.ownerLaneBreakdown,
      sourceReviewFile: resolvedSourceReviewFile,
      sourceReviewGroupCount: sourceReviewGroups.length,
      sourceReviewGroupBreakdown: sourceReviewGroupBreakdown(sourceReviewGroups),
      reviewPackEvidenceFile: resolvedReviewPackEvidenceFile,
      nextCommandCount: Array.isArray(reviewPacket.nextCommands)
        ? reviewPacket.nextCommands.length
        : 0
    },
    nextCommands: reviewPacket.nextCommands || [],
    blockers: [
      ...(reviewPacket.blockers || [
        'review workbook still contains TODO or REVIEW_REQUIRED placeholders'
      ]),
      ...(reviewTaskReport.blockers || [])
    ],
    note: 'This review pack is a draft handoff artifact only. It is not production evidence and must fail production gates until reviewed real POI data is filled.'
  }
  await mkdir(path.dirname(resolvedReviewPackEvidenceFile), { recursive: true })
  await writeFile(resolvedReviewPackEvidenceFile, `${JSON.stringify(report, null, 2)}\n`)
  return report
}

async function runCli() {
  const args = process.argv.slice(2)
  const report = await createXichengPoiProductionReviewPack({
    rootDir: path.resolve(readArgValue(args, '--root') || process.cwd()),
    outputFile: readArgValue(args, '--output') || defaultPaths.outputFile,
    seedSqlFile: readArgValue(args, '--seed-sql') || defaultPaths.seedSqlFile,
    reviewChecklistFile: readArgValue(args, '--review-checklist') || defaultPaths.reviewChecklistFile,
    reviewWorkbookFile: readArgValue(args, '--review-workbook') || defaultPaths.reviewWorkbookFile,
    reviewPacketFile: readArgValue(args, '--review-packet') || defaultPaths.reviewPacketFile,
    workbookEvidenceFile: readArgValue(args, '--workbook-evidence') || defaultPaths.workbookEvidenceFile,
    reviewTasksFile: readArgValue(args, '--review-tasks') || defaultPaths.reviewTasksFile,
    sourceReviewFile: readArgValue(args, '--source-review') || defaultPaths.sourceReviewFile,
    reviewPackEvidenceFile: readArgValue(args, '--evidence-file') || defaultPaths.reviewPackEvidenceFile,
    count: readArgValue(args, '--count') || 80
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
