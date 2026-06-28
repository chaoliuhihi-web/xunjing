import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { exportXichengYudaoReleaseBlockerTasks } from './export-xicheng-yudao-release-blocker-tasks.mjs'

const artifactType = 'xicheng-yudao-release-preflight'
const defaultReleaseEvidenceFile = 'qa/xicheng-yudao-release-evidence.json'
const defaultTasksOutputFile = 'workbench/xicheng-yudao-release-blocker-tasks.csv'
const defaultPoiTasksOutputFile = 'workbench/xicheng-yudao-release-poi-blocker-tasks.csv'
const defaultStage = 'production'
const defaultExpectedBranch = 'feature/xicheng-p0'
const defaultEnvFile = 'ops/xunjing-platform.env.example'

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
  return path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(rootDir, filePath)
}

function optionalArg(args, name) {
  const value = readArgValue(args, name)
  return value ? [name, value] : []
}

function buildReleaseGateArgs({
  rootDir,
  args,
  stage,
  envFile,
  expectedBranch,
  releaseEvidenceFile
}) {
  return [
    '--root', rootDir,
    '--stage', stage,
    '--expected-branch', expectedBranch,
    '--env-file', envFile,
    '--evidence-file', releaseEvidenceFile,
    ...optionalArg(args, '--yudao-baseline-sql'),
    ...optionalArg(args, '--yudao-server-jar'),
    ...optionalArg(args, '--ai-bootstrap-evidence'),
    ...optionalArg(args, '--vision-ocr-evidence'),
    ...optionalArg(args, '--object-storage-evidence'),
    ...optionalArg(args, '--runtime-seed-evidence'),
    ...optionalArg(args, '--production-seed-apply-evidence'),
    ...optionalArg(args, '--seed-apply-evidence'),
    ...optionalArg(args, '--poi-workbook-evidence'),
    ...optionalArg(args, '--poi-manifest-evidence'),
    ...optionalArg(args, '--poi-seed-evidence'),
    ...optionalArg(args, '--max-evidence-age-hours')
  ]
}

export async function runXichengYudaoReleasePreflight({
  rootDir = process.cwd(),
  args = []
} = {}) {
  const resolvedRoot = path.resolve(rootDir)
  const stage = readArgValue(args, '--stage') || defaultStage
  const envFile = readArgValue(args, '--env-file') || defaultEnvFile
  const expectedBranch = readArgValue(args, '--expected-branch') || defaultExpectedBranch
  const releaseEvidenceFile = readArgValue(args, '--release-evidence') ||
    readArgValue(args, '--evidence-file') ||
    defaultReleaseEvidenceFile
  const tasksOutputFile = readArgValue(args, '--tasks-output') ||
    readArgValue(args, '--output') ||
    defaultTasksOutputFile
  const poiTasksOutputFile = readArgValue(args, '--poi-tasks-output') ||
    readArgValue(args, '--poi-output') ||
    defaultPoiTasksOutputFile
  const resolvedReleaseEvidenceFile = resolveRootFile(resolvedRoot, releaseEvidenceFile)
  const resolvedTasksOutputFile = resolveRootFile(resolvedRoot, tasksOutputFile)
  const resolvedPoiTasksOutputFile = resolveRootFile(resolvedRoot, poiTasksOutputFile)
  const scriptDir = path.dirname(fileURLToPath(import.meta.url))
  const releaseGateScript = path.join(scriptDir, 'verify-xicheng-yudao-release-readiness.mjs')

  const gateResult = spawnSync(process.execPath, [
    releaseGateScript,
    ...buildReleaseGateArgs({
      rootDir: resolvedRoot,
      args,
      stage,
      envFile,
      expectedBranch,
      releaseEvidenceFile
    })
  ], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })

  if (!existsSync(resolvedReleaseEvidenceFile)) {
    throw new Error(gateResult.stderr.trim() || 'release gate did not write evidence')
  }

  const releaseEvidence = JSON.parse(await readFile(resolvedReleaseEvidenceFile, 'utf8'))
  const taskReport = await exportXichengYudaoReleaseBlockerTasks({
    rootDir: resolvedRoot,
    releaseEvidenceFile,
    outputFile: tasksOutputFile,
    poiOutputFile: poiTasksOutputFile
  })
  const ok = releaseEvidence.ok === true && taskReport.ok === true

  return {
    artifactType,
    ok,
    status: releaseEvidence.status,
    checkedAt: new Date().toISOString(),
    summary: {
      stage,
      releaseStatus: releaseEvidence.status,
      releaseEvidenceFile: resolvedReleaseEvidenceFile,
      tasksOutputFile: resolvedTasksOutputFile,
      poiTasksOutputFile: resolvedPoiTasksOutputFile,
      failedCheckCount: releaseEvidence.summary?.failedChecks,
      blockerCount: releaseEvidence.summary?.blockerCount,
      taskCount: taskReport.summary.taskCount,
      poiTaskCount: taskReport.summary.poiTaskCount,
      ownerLaneCounts: taskReport.summary.ownerLaneCounts,
      ownerLaneBreakdown: taskReport.summary.ownerLaneBreakdown
    },
    release: {
      ok: releaseEvidence.ok === true,
      status: releaseEvidence.status
    },
    taskExport: {
      ok: taskReport.ok === true,
      status: taskReport.status
    },
    blockers: ok ? [] : taskReport.blockers
  }
}

async function runCli() {
  const args = process.argv.slice(2)
  const report = await runXichengYudaoReleasePreflight({
    rootDir: path.resolve(readArgValue(args, '--root') || process.cwd()),
    args
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
