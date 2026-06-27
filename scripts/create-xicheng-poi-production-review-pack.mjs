import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  writeXichengPoiProductionManifestTemplate
} from './create-xicheng-poi-production-manifest-template.mjs'

const artifactType = 'xicheng-poi-production-review-pack'

const defaultPaths = {
  outputFile: 'workbench/xicheng-production-pois.prefilled.json',
  seedSqlFile: 'backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql',
  reviewChecklistFile: 'workbench/xicheng-production-pois.review-checklist.csv',
  reviewWorkbookFile: 'workbench/xicheng-production-pois.review-workbook.csv',
  reviewPacketFile: 'workbench/xicheng-production-pois.review-packet.json'
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

export async function createXichengPoiProductionReviewPack({
  rootDir = process.cwd(),
  outputFile = defaultPaths.outputFile,
  seedSqlFile = defaultPaths.seedSqlFile,
  reviewChecklistFile = defaultPaths.reviewChecklistFile,
  reviewWorkbookFile = defaultPaths.reviewWorkbookFile,
  reviewPacketFile = defaultPaths.reviewPacketFile,
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
  const resolvedReviewPacketFile = resolveRootPath(resolvedRootDir, reviewPacketFile)
  const reviewPacket = JSON.parse(await readFile(resolvedReviewPacketFile, 'utf8'))

  return {
    artifactType,
    ok: false,
    status: 'REVIEW_DATA_REQUIRED',
    checkedAt: new Date().toISOString(),
    summary: {
      ...templateReport.summary,
      reviewPacketFile: resolvedReviewPacketFile,
      reviewPacketStatus: reviewPacket.status,
      nextCommandCount: Array.isArray(reviewPacket.nextCommands)
        ? reviewPacket.nextCommands.length
        : 0
    },
    nextCommands: reviewPacket.nextCommands || [],
    blockers: reviewPacket.blockers || [
      'review workbook still contains TODO or REVIEW_REQUIRED placeholders'
    ],
    note: 'This review pack is a draft handoff artifact only. It is not production evidence and must fail production gates until reviewed real POI data is filled.'
  }
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
