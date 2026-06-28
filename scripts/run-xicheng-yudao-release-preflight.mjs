import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { exportXichengYudaoReleaseBlockerTasks } from './export-xicheng-yudao-release-blocker-tasks.mjs'

const artifactType = 'xicheng-yudao-release-preflight'
const defaultReleaseEvidenceFile = 'qa/xicheng-yudao-release-evidence.json'
const defaultTasksOutputFile = 'workbench/xicheng-yudao-release-blocker-tasks.csv'
const defaultPoiTasksOutputFile = 'workbench/xicheng-yudao-release-poi-blocker-tasks.csv'
const defaultHandoffOutputFile = 'workbench/xicheng-yudao-release-handoff.md'
const defaultPoiWorkbookEvidenceFile = 'qa/xicheng-poi-review-workbook-evidence.json'
const defaultPoiManifestEvidenceFile = 'qa/xicheng-poi-manifest-evidence.json'
const defaultPoiSeedEvidenceFile = 'qa/xicheng-poi-production-seed-evidence.json'
const defaultAppReadinessEvidenceFile = 'qa/xicheng-app-readiness-evidence.json'
const defaultReleasePackageEvidenceFile = 'qa/xicheng-release-evidence-package.json'
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

function shellArg(value) {
  const text = String(value || '')
  return /^[A-Za-z0-9_./:=@+-]+$/.test(text) ? text : `'${text.replaceAll("'", "'\\''")}'`
}

function buildFinalEvidencePackageCommand({
  stage,
  releaseEvidenceFile,
  poiWorkbookEvidenceFile,
  poiManifestEvidenceFile,
  poiSeedEvidenceFile,
  appReadinessEvidenceFile,
  releasePackageEvidenceFile
}) {
  return [
    'npm run xunjing:xicheng:release:evidence:package --',
    '--stage', shellArg(stage),
    '--release-evidence', shellArg(releaseEvidenceFile),
    '--poi-workbook-evidence', shellArg(poiWorkbookEvidenceFile),
    '--poi-manifest-evidence', shellArg(poiManifestEvidenceFile),
    '--poi-seed-evidence', shellArg(poiSeedEvidenceFile),
    '--app-readiness-evidence', shellArg(appReadinessEvidenceFile),
    '--evidence-file', shellArg(releasePackageEvidenceFile)
  ].join(' ')
}

function formatList(values) {
  const items = Array.isArray(values) ? values.filter(Boolean) : []
  if (items.length === 0) {
    return '- None'
  }
  return items.map((value) => `- \`${value}\``).join('\n')
}

function buildHandoffMarkdown({
  stage,
  releaseEvidence,
  taskReport,
  releaseEvidenceFile,
  tasksOutputFile,
  poiTasksOutputFile,
  finalEvidencePackageCommand
}) {
  const summary = releaseEvidence.summary || {}
  const ownerLaneSections = (taskReport.summary.ownerLaneBreakdown || [])
    .map((lane) => [
      `### ${lane.ownerLane}`,
      '',
      `Task count: ${lane.taskCount}`,
      '',
      'Checks:',
      formatList(lane.checkNames),
      '',
      'Verification commands:',
      formatList(lane.verificationCommands)
    ].join('\n'))
    .join('\n\n')

  return [
    '# Xicheng Yudao Release Handoff',
    '',
    `Status: \`${releaseEvidence.status}\``,
    `Stage: \`${stage}\``,
    `Git commit: \`${summary.gitCommit || 'unknown'}\``,
    `Git dirty: \`${summary.gitDirty === true ? 'true' : summary.gitDirty === false ? 'false' : 'unknown'}\``,
    '',
    `Failed checks: ${summary.failedChecks ?? 'unknown'}`,
    `Blockers: ${summary.blockerCount ?? 'unknown'}`,
    `Owner-lane tasks: ${taskReport.summary.taskCount ?? 0}`,
    `POI tasks: ${taskReport.summary.poiTaskCount ?? 0}`,
    '',
    `Release evidence: \`${releaseEvidenceFile}\``,
    `Blocker tasks CSV: \`${tasksOutputFile}\``,
    `POI tasks CSV: \`${poiTasksOutputFile}\``,
    '',
    '## Owner Lanes',
    '',
    ownerLaneSections || 'No owner-lane blockers.',
    '',
    '## Final Evidence Package',
    '',
    'Run only after release gate, POI evidence, APP readiness, and production runtime seed evidence are all ready:',
    '',
    '```bash',
    finalEvidencePackageCommand,
    '```',
    '',
    'Do not mark production ready until release gate outputs `PRODUCTION_READY_CANDIDATE` and the final evidence package outputs `XICHENG_RELEASE_EVIDENCE_PACKAGE_READY`.',
    ''
  ].join('\n')
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
  const handoffOutputFile = readArgValue(args, '--handoff-output') ||
    defaultHandoffOutputFile
  const poiWorkbookEvidenceFile = readArgValue(args, '--poi-workbook-evidence') || defaultPoiWorkbookEvidenceFile
  const poiManifestEvidenceFile = readArgValue(args, '--poi-manifest-evidence') || defaultPoiManifestEvidenceFile
  const poiSeedEvidenceFile = readArgValue(args, '--poi-seed-evidence') || defaultPoiSeedEvidenceFile
  const appReadinessEvidenceFile = readArgValue(args, '--app-readiness-evidence') || defaultAppReadinessEvidenceFile
  const releasePackageEvidenceFile = readArgValue(args, '--release-package-evidence') ||
    readArgValue(args, '--package-evidence') ||
    defaultReleasePackageEvidenceFile
  const resolvedReleaseEvidenceFile = resolveRootFile(resolvedRoot, releaseEvidenceFile)
  const resolvedTasksOutputFile = resolveRootFile(resolvedRoot, tasksOutputFile)
  const resolvedPoiTasksOutputFile = resolveRootFile(resolvedRoot, poiTasksOutputFile)
  const resolvedHandoffOutputFile = resolveRootFile(resolvedRoot, handoffOutputFile)
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
  const finalEvidencePackageCommand = buildFinalEvidencePackageCommand({
    stage,
    releaseEvidenceFile,
    poiWorkbookEvidenceFile,
    poiManifestEvidenceFile,
    poiSeedEvidenceFile,
    appReadinessEvidenceFile,
    releasePackageEvidenceFile
  })
  await mkdir(path.dirname(resolvedHandoffOutputFile), { recursive: true })
  await writeFile(resolvedHandoffOutputFile, buildHandoffMarkdown({
    stage,
    releaseEvidence,
    taskReport,
    releaseEvidenceFile: resolvedReleaseEvidenceFile,
    tasksOutputFile: resolvedTasksOutputFile,
    poiTasksOutputFile: resolvedPoiTasksOutputFile,
    finalEvidencePackageCommand
  }))
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
      handoffOutputFile: resolvedHandoffOutputFile,
      failedCheckCount: releaseEvidence.summary?.failedChecks,
      blockerCount: releaseEvidence.summary?.blockerCount,
      taskCount: taskReport.summary.taskCount,
      poiTaskCount: taskReport.summary.poiTaskCount,
      ownerLaneCounts: taskReport.summary.ownerLaneCounts,
      ownerLaneBreakdown: taskReport.summary.ownerLaneBreakdown,
      finalEvidencePackageCommand
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
