import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-poi-review-tasks'
const workbookArtifactType = 'xicheng-poi-review-workbook-readiness'
const readyStatus = 'REVIEW_TASKS_READY'
const requiredStatus = 'REVIEW_TASKS_REQUIRED'

const ownerLaneByBlockerGroup = {
  'poi-identity': 'data-review',
  'poi-source-license': 'source-license',
  'poi-field-evidence': 'field-review',
  'poi-content-audit': 'content-audit',
  'no-placeholder-cells': 'cleanup'
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

function resolveRootFile(rootDir, filePath) {
  if (!filePath) {
    return undefined
  }
  return path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(rootDir, filePath)
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function csvRow(values) {
  return values.map(csvCell).join(',')
}

function ownerLaneFor(blockerGroup) {
  return ownerLaneByBlockerGroup[blockerGroup] || 'manual-review'
}

function buildTaskRows(evidence, sourceEvidenceFile) {
  const summary = evidence.summary || {}
  if (!Array.isArray(summary.pendingPoiTasks)) {
    throw new Error('workbook evidence summary.pendingPoiTasks is required; regenerate workbook evidence with the current gate')
  }

  return summary.pendingPoiTasks.flatMap((task) => {
    const blockerGroups = Array.isArray(task.blockerGroups) ? task.blockerGroups : []
    return blockerGroups.map((blockerGroup) => ({
      workbookRowNumber: task.workbookRowNumber,
      poiIndex: task.poiIndex,
      poiCode: task.poiCode,
      blockerGroup,
      ownerLane: ownerLaneFor(blockerGroup),
      taskStatus: 'TODO',
      sourceEvidenceFile
    }))
  })
}

function summarizeOwnerLanes(taskRows) {
  return taskRows.reduce((counts, row) => {
    counts[row.ownerLane] = (counts[row.ownerLane] || 0) + 1
    return counts
  }, {})
}

function buildCsv(taskRows) {
  const header = [
    'workbookRowNumber',
    'poiIndex',
    'poiCode',
    'blockerGroup',
    'ownerLane',
    'taskStatus',
    'sourceEvidenceFile'
  ]
  const rows = taskRows.map((row) => csvRow([
    row.workbookRowNumber,
    row.poiIndex,
    row.poiCode,
    row.blockerGroup,
    row.ownerLane,
    row.taskStatus,
    row.sourceEvidenceFile
  ]))
  return `${[header.join(','), ...rows].join('\n')}\n`
}

export async function exportXichengPoiReviewTasks({
  rootDir = process.cwd(),
  workbookEvidenceFile,
  outputFile = 'workbench/xicheng-poi-review-tasks.csv'
} = {}) {
  const resolvedRoot = path.resolve(rootDir)
  const resolvedEvidenceFile = resolveRootFile(resolvedRoot, workbookEvidenceFile)
  const resolvedOutputFile = resolveRootFile(resolvedRoot, outputFile)
  if (!resolvedEvidenceFile) {
    throw new Error('--workbook-evidence is required')
  }
  if (!resolvedOutputFile) {
    throw new Error('--output is required')
  }

  const evidence = JSON.parse(await readFile(resolvedEvidenceFile, 'utf8'))
  if (evidence.artifactType !== workbookArtifactType) {
    throw new Error('workbook evidence artifactType must be xicheng-poi-review-workbook-readiness')
  }

  const taskRows = buildTaskRows(evidence, resolvedEvidenceFile)
  const ownerLaneCounts = summarizeOwnerLanes(taskRows)
  await mkdir(path.dirname(resolvedOutputFile), { recursive: true })
  await writeFile(resolvedOutputFile, buildCsv(taskRows))

  const ok = taskRows.length === 0 && evidence.ok === true
  return {
    artifactType,
    ok,
    status: ok ? readyStatus : requiredStatus,
    checkedAt: new Date().toISOString(),
    summary: {
      sourceEvidenceFile: resolvedEvidenceFile,
      outputFile: resolvedOutputFile,
      pendingPoiCount: Number(evidence.summary?.workbookPendingPoiCount || 0),
      taskCount: taskRows.length,
      ownerLaneCounts
    },
    tasks: taskRows,
    blockers: ok ? [] : [
      'workbook review tasks remain; complete ownerLane CSV rows before production release'
    ]
  }
}

async function runCli() {
  const args = process.argv.slice(2)
  const report = await exportXichengPoiReviewTasks({
    rootDir: path.resolve(readArgValue(args, '--root') || process.cwd()),
    workbookEvidenceFile: readArgValue(args, '--workbook-evidence'),
    outputFile: readArgValue(args, '--output') || 'workbench/xicheng-poi-review-tasks.csv'
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
