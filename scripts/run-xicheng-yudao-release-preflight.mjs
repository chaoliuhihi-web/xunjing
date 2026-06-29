import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { exportXichengYudaoReleaseBlockerTasks } from './export-xicheng-yudao-release-blocker-tasks.mjs'
import { exportXichengPoiProductionReviewTasks } from './export-xicheng-poi-production-review-tasks.mjs'
import { loadEnvFile } from './verify-xunjing-platform-readiness.mjs'

const artifactType = 'xicheng-yudao-release-preflight'
const defaultReleaseEvidenceFile = 'qa/xicheng-yudao-release-evidence.json'
const defaultTasksOutputFile = 'workbench/xicheng-yudao-release-blocker-tasks.csv'
const defaultPoiTasksOutputFile = 'workbench/xicheng-yudao-release-poi-blocker-tasks.csv'
const defaultPoiSummaryOutputFile = 'workbench/xicheng-yudao-release-poi-summary.csv'
const defaultHandoffOutputFile = 'workbench/xicheng-yudao-release-handoff.md'
const defaultPoiWorkbookEvidenceFile = 'qa/xicheng-poi-review-workbook-evidence.json'
const defaultPoiManifestEvidenceFile = 'qa/xicheng-poi-manifest-evidence.json'
const defaultPoiSeedEvidenceFile = 'qa/xicheng-poi-production-seed-evidence.json'
const defaultPoiSourceCoverageEvidenceFile = 'qa/xicheng-poi-source-coverage-evidence.json'
const defaultPoiSourceReviewApplyEvidenceFile = 'qa/xicheng-poi-source-review-apply-evidence.json'
const defaultPoiProductionReviewApplyEvidenceFile = 'qa/xicheng-poi-production-review-apply-evidence.json'
const defaultProductionReviewFile = 'workbench/xicheng-poi-production-review-summary.csv'
const defaultProductionReviewTasksOutputFile = 'workbench/xicheng-poi-production-review-tasks.csv'
const defaultProductionReviewTasksEvidenceFile = 'qa/xicheng-poi-production-review-tasks-evidence.json'
const defaultAppReadinessEvidenceFile = 'qa/xicheng-app-readiness-evidence.json'
const defaultReleasePackageEvidenceFile = 'qa/xicheng-release-evidence-package.json'
const defaultQdrantEvidenceFile = 'qa/xicheng-qdrant-smoke-evidence.json'
const defaultEmbeddingEvidenceFile = 'qa/xicheng-embedding-smoke-evidence.json'
const defaultYudaoServerBuildEvidenceFile = 'qa/xicheng-yudao-server-build-evidence.json'
const defaultYudaoServerSmokeEvidenceFile = 'qa/xicheng-yudao-server-smoke-evidence.json'
const defaultRuntimeSeedEvidenceFile = 'qa/xicheng-yudao-runtime-seed-production-evidence.json'
const defaultProductionSeedApplyEvidenceFile = 'qa/xicheng-yudao-production-seed-apply-evidence.json'
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
  releaseEvidenceFile,
  qdrantEvidenceFile,
  embeddingEvidenceFile,
  yudaoServerBuildEvidenceFile,
  yudaoServerSmokeEvidenceFile
}) {
  return [
    '--root', rootDir,
    '--stage', stage,
    '--expected-branch', expectedBranch,
    '--env-file', envFile,
    '--evidence-file', releaseEvidenceFile,
    ...optionalArg(args, '--yudao-baseline-sql'),
    ...optionalArg(args, '--yudao-server-jar'),
    '--yudao-server-build-evidence', yudaoServerBuildEvidenceFile,
    '--yudao-server-smoke-evidence', yudaoServerSmokeEvidenceFile,
    ...optionalArg(args, '--ai-bootstrap-evidence'),
    '--qdrant-evidence', qdrantEvidenceFile,
    '--embedding-evidence', embeddingEvidenceFile,
    ...optionalArg(args, '--vision-ocr-evidence'),
    ...optionalArg(args, '--object-storage-evidence'),
    ...optionalArg(args, '--runtime-seed-evidence'),
    ...optionalArg(args, '--production-seed-apply-evidence'),
    ...optionalArg(args, '--seed-apply-evidence'),
    ...optionalArg(args, '--poi-workbook-evidence'),
    ...optionalArg(args, '--poi-manifest-evidence'),
    ...optionalArg(args, '--poi-seed-evidence'),
    ...optionalArg(args, '--poi-source-coverage-evidence'),
    ...optionalArg(args, '--poi-source-review-apply-evidence'),
    ...optionalArg(args, '--poi-production-review-apply-evidence'),
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
  yudaoServerBuildEvidenceFile,
  yudaoServerSmokeEvidenceFile,
  runtimeSeedEvidenceFile,
  productionSeedApplyEvidenceFile,
  poiWorkbookEvidenceFile,
  poiManifestEvidenceFile,
  poiSeedEvidenceFile,
  poiSourceCoverageEvidenceFile,
  poiSourceReviewApplyEvidenceFile,
  poiProductionReviewApplyEvidenceFile,
  appReadinessEvidenceFile,
  releasePackageEvidenceFile
}) {
  return [
    'npm run xunjing:xicheng:release:evidence:package --',
    '--stage', shellArg(stage),
    '--release-evidence', shellArg(releaseEvidenceFile),
    '--yudao-server-build-evidence', shellArg(yudaoServerBuildEvidenceFile),
    '--yudao-server-smoke-evidence', shellArg(yudaoServerSmokeEvidenceFile),
    '--runtime-seed-evidence', shellArg(runtimeSeedEvidenceFile),
    '--production-seed-apply-evidence', shellArg(productionSeedApplyEvidenceFile),
    '--poi-workbook-evidence', shellArg(poiWorkbookEvidenceFile),
    '--poi-manifest-evidence', shellArg(poiManifestEvidenceFile),
    '--poi-seed-evidence', shellArg(poiSeedEvidenceFile),
    '--poi-source-coverage-evidence', shellArg(poiSourceCoverageEvidenceFile),
    '--poi-source-review-apply-evidence', shellArg(poiSourceReviewApplyEvidenceFile),
    '--poi-production-review-apply-evidence', shellArg(poiProductionReviewApplyEvidenceFile),
    '--app-readiness-evidence', shellArg(appReadinessEvidenceFile),
    '--evidence-file', shellArg(releasePackageEvidenceFile)
  ].join(' ')
}

function buildPoiEvidenceBootstrapCommand() {
  return [
    'npm run xunjing:xicheng:poi:review:pack --',
    '--evidence-file', shellArg('qa/xicheng-poi-production-review-pack-evidence.json'),
    '--workbook-evidence', shellArg('qa/xicheng-poi-review-workbook-evidence.json'),
    '--review-tasks', shellArg('workbench/xicheng-poi-review-tasks.csv'),
    '--source-review', shellArg('workbench/xicheng-poi-source-review-summary.csv'),
    '--production-review', shellArg('workbench/xicheng-poi-production-review-summary.csv')
  ].join(' ')
}

function buildProductionReviewTasksCommand({
  productionReviewFile,
  productionReviewTasksOutputFile,
  productionReviewTasksEvidenceFile
}) {
  return [
    'npm run xunjing:xicheng:poi:production-review:tasks:export --',
    '--production-review', shellArg(productionReviewFile),
    '--output', shellArg(productionReviewTasksOutputFile),
    '--evidence-file', shellArg(productionReviewTasksEvidenceFile)
  ].join(' ')
}

function buildAppReadinessCommand({
  envFile,
  commandEnv,
  releaseEvidence,
  appReadinessEvidenceFile
}) {
  const summary = releaseEvidence?.summary || {}
  const baseUrl = String(
    summary.appApiBaseUrl ||
    commandEnv.XUNJING_BASE_URL ||
    commandEnv.XUNJING_APP_API_BASE_URL ||
    'https://your-production-domain/'
  ).trim()
  const tenantId = String(commandEnv.XUNJING_TENANT_ID || '1').trim()

  return [
    'npm run xunjing:platform:verify --',
    '--env-file', shellArg(envFile),
    '--base-url', shellArg(baseUrl),
    '--tenant-id', shellArg(tenantId),
    '--skip-admin-check',
    '--include-xicheng-app-check',
    '--include-xicheng-trigger-check',
    '--evidence-file', shellArg(appReadinessEvidenceFile)
  ].join(' ')
}

function isNonLocalHttpsUrl(value) {
  try {
    const url = new URL(String(value || ''))
    const hostname = url.hostname.toLowerCase()
    return url.protocol === 'https:' &&
      !['localhost', '127.0.0.1', '0.0.0.0', '::1', 'host.docker.internal'].includes(hostname) &&
      !hostname.endsWith('.local')
  } catch {
    return false
  }
}

function isPlaceholderUrl(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) {
    return true
  }
  return [
    'replace-with',
    'placeholder',
    'your-',
    'example.com',
    'local-or-staging',
    'xunjing_local'
  ].some((token) => normalized.includes(token))
}

async function summarizeProductionReviewTasks({
  rootDir,
  productionReviewFile,
  productionReviewTasksOutputFile,
  productionReviewTasksEvidenceFile
}) {
  const resolvedProductionReviewFile = resolveRootFile(rootDir, productionReviewFile)
  const resolvedOutputFile = resolveRootFile(rootDir, productionReviewTasksOutputFile)
  const resolvedEvidenceFile = resolveRootFile(rootDir, productionReviewTasksEvidenceFile)

  if (!existsSync(resolvedProductionReviewFile)) {
    return {
      ok: false,
      status: 'MISSING',
      summary: {
        productionReviewFile: resolvedProductionReviewFile,
        outputFile: resolvedOutputFile,
        evidenceFile: resolvedEvidenceFile,
        taskCount: 0,
        pendingPoiCount: 0,
        ownerLaneBreakdown: []
      },
      blockers: [
        'production review summary is missing; run POI review pack before exporting field-level production review tasks'
      ]
    }
  }

  try {
    return await exportXichengPoiProductionReviewTasks({
      rootDir,
      productionReviewFile,
      outputFile: productionReviewTasksOutputFile,
      evidenceFile: productionReviewTasksEvidenceFile
    })
  } catch (error) {
    return {
      ok: false,
      status: 'ERROR',
      summary: {
        productionReviewFile: resolvedProductionReviewFile,
        outputFile: resolvedOutputFile,
        evidenceFile: resolvedEvidenceFile,
        taskCount: 0,
        pendingPoiCount: 0,
        ownerLaneBreakdown: []
      },
      blockers: [
        `production review task export failed: ${error.message}`
      ]
    }
  }
}

async function summarizeAppReadinessEvidence({
  rootDir,
  releaseEvidence,
  appReadinessEvidenceFile
}) {
  const resolvedFile = resolveRootFile(rootDir, appReadinessEvidenceFile)
  if (!existsSync(resolvedFile)) {
    return {
      ok: false,
      status: 'MISSING',
      evidenceFile: resolvedFile,
      blockers: [
        'APP readiness evidence is missing; run summary.appReadinessCommand before final evidence package'
      ]
    }
  }

  let evidence
  try {
    evidence = JSON.parse(await readFile(resolvedFile, 'utf8'))
  } catch (error) {
    return {
      ok: false,
      status: 'INVALID_JSON',
      evidenceFile: resolvedFile,
      blockers: [`APP readiness evidence is not valid JSON: ${error.message}`]
    }
  }

  const blockers = []
  const summary = evidence.summary || {}
  const baseUrl = String(summary.baseUrl || evidence.baseUrl || '').trim()
  const tenantId = String(summary.tenantId || evidence.tenantId || '').trim()
  const releaseBaseUrl = String(releaseEvidence?.summary?.appApiBaseUrl || '').trim()

  if (evidence.artifactType !== 'xunjing-platform-readiness') {
    blockers.push('APP readiness evidence artifactType must be xunjing-platform-readiness')
  }
  if (evidence.ok !== true) {
    blockers.push('APP readiness evidence ok must be true')
  }
  if (!tenantId) {
    blockers.push('APP readiness evidence tenantId is required')
  }
  if (!isNonLocalHttpsUrl(baseUrl)) {
    blockers.push('APP readiness evidence baseUrl must be a non-local HTTPS URL')
  } else if (isPlaceholderUrl(baseUrl)) {
    blockers.push('APP readiness evidence baseUrl must be a real non-placeholder HTTPS URL')
  }
  if (releaseBaseUrl && baseUrl && releaseBaseUrl !== baseUrl) {
    blockers.push('APP readiness evidence baseUrl must match release evidence appApiBaseUrl')
  }
  if (summary.staticOnly !== false) {
    blockers.push('APP readiness evidence staticOnly must be false')
  }
  if (summary.includeXichengAppCheck !== true) {
    blockers.push('APP readiness evidence includeXichengAppCheck must be true')
  }
  if (summary.includeXichengTriggerCheck !== true) {
    blockers.push('APP readiness evidence includeXichengTriggerCheck must be true')
  }
  if (summary.xichengRegionCode !== 'beijing-xicheng') {
    blockers.push('APP readiness evidence xichengRegionCode must be beijing-xicheng')
  }
  if (summary.xichengPackageCode !== 'XICHENG-MAP-001') {
    blockers.push('APP readiness evidence xichengPackageCode must be XICHENG-MAP-001')
  }

  const failedChecks = Array.isArray(evidence.checks)
    ? evidence.checks.filter((item) => item?.ok !== true)
    : []
  if (failedChecks.length > 0) {
    blockers.push(`APP readiness evidence has failed checks: ${failedChecks.map((item) => item.name).join(', ')}`)
  }

  return {
    ok: blockers.length === 0,
    status: blockers.length === 0 ? 'READY' : 'REVIEW_REQUIRED',
    evidenceFile: resolvedFile,
    checkedAt: evidence.checkedAt,
    summary: {
      baseUrl,
      tenantId,
      staticOnly: summary.staticOnly,
      includeXichengAppCheck: summary.includeXichengAppCheck,
      includeXichengTriggerCheck: summary.includeXichengTriggerCheck,
      xichengRegionCode: summary.xichengRegionCode,
      xichengPackageCode: summary.xichengPackageCode,
      failedCheckCount: failedChecks.length
    },
    blockers
  }
}

function buildAppReadinessTaskRows({
  appReadiness,
  appReadinessCommand
}) {
  if (appReadiness.ok === true) {
    return []
  }
  return appReadiness.blockers.map((blocker, index) => ({
    checkName: 'app-readiness-evidence',
    blockerIndex: index + 1,
    blocker,
    ownerLane: 'app-ops',
    taskDetail: 'Generate Xicheng APP live readiness evidence against the release backend.',
    requiredEvidence: 'APP readiness evidence outputs xunjing-platform-readiness with live Xicheng APP and trigger checks.',
    verificationCommand: appReadinessCommand,
    taskStatus: 'TODO',
    sourceEvidenceFile: appReadiness.evidenceFile,
    affectedPoiCount: 0,
    affectedPoiCodes: []
  }))
}

function needsPoiEvidenceBootstrap(releaseEvidence, taskReport) {
  if (Number(taskReport?.summary?.poiTaskCount || 0) > 0) {
    return false
  }
  const checks = Array.isArray(releaseEvidence?.checks) ? releaseEvidence.checks : []
  return checks.some((check) => check?.name === 'xicheng-production-poi-evidence' && check.ok !== true)
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
  poiSummaryOutputFile,
  poiEvidenceBootstrapCommand,
  productionReviewTasks,
  productionReviewTasksCommand,
  appReadiness,
  appReadinessCommand,
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
  const productionReviewSummary = productionReviewTasks.summary || {}
  const productionReviewLaneSections = (productionReviewSummary.ownerLaneBreakdown || [])
    .map((lane) => [
      `### ${lane.ownerLane}`,
      '',
      `Task count: ${lane.taskCount}`,
      `POI count: ${lane.poiCount}`,
      '',
      'Fields:',
      formatList(lane.fields),
      '',
      'POI codes:',
      formatList(lane.poiCodes)
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
    `POI summary CSV: \`${poiSummaryOutputFile}\``,
    '',
    '## Owner Lanes',
    '',
    ownerLaneSections || 'No owner-lane blockers.',
    '',
    ...(poiEvidenceBootstrapCommand ? [
      '## POI Evidence Bootstrap',
      '',
      'Run this first when POI tasks are empty because production POI workbook, manifest, or seed evidence has not been generated yet:',
      '',
      '```bash',
      poiEvidenceBootstrapCommand,
      '```',
      ''
    ] : []),
    '',
    '## Production Review Field Tasks',
    '',
    `Status: \`${productionReviewTasks.status}\``,
    `Production review summary: \`${productionReviewSummary.productionReviewFile || 'unknown'}\``,
    `Task CSV: \`${productionReviewSummary.outputFile || 'unknown'}\``,
    `Task evidence: \`${productionReviewSummary.evidenceFile || 'unknown'}\``,
    `Task count: ${productionReviewSummary.taskCount ?? 0}`,
    `Pending POIs: ${productionReviewSummary.pendingPoiCount ?? 0}`,
    '',
    'Blockers:',
    formatList(productionReviewTasks.blockers),
    '',
    'Run this after source review and trigger smoke have updated `workbench/xicheng-poi-production-review-summary.csv`:',
    '',
    '```bash',
    productionReviewTasksCommand,
    '```',
    '',
    productionReviewLaneSections || 'No field-level production review tasks exported yet.',
    '',
    '## APP Readiness Evidence',
    '',
    `Status: \`${appReadiness.status}\``,
    `Evidence: \`${appReadiness.evidenceFile}\``,
    '',
    'Blockers:',
    formatList(appReadiness.blockers),
    '',
    'Run this against the same non-local HTTPS backend recorded in release evidence before building the final evidence package:',
    '',
    '```bash',
    appReadinessCommand,
    '```',
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
  const poiSummaryOutputFile = readArgValue(args, '--poi-summary-output') ||
    defaultPoiSummaryOutputFile
  const handoffOutputFile = readArgValue(args, '--handoff-output') ||
    defaultHandoffOutputFile
  const poiWorkbookEvidenceFile = readArgValue(args, '--poi-workbook-evidence') || defaultPoiWorkbookEvidenceFile
  const poiManifestEvidenceFile = readArgValue(args, '--poi-manifest-evidence') || defaultPoiManifestEvidenceFile
  const poiSeedEvidenceFile = readArgValue(args, '--poi-seed-evidence') || defaultPoiSeedEvidenceFile
  const poiSourceCoverageEvidenceFile = readArgValue(args, '--poi-source-coverage-evidence') ||
    defaultPoiSourceCoverageEvidenceFile
  const poiSourceReviewApplyEvidenceFile = readArgValue(args, '--poi-source-review-apply-evidence') ||
    defaultPoiSourceReviewApplyEvidenceFile
  const poiProductionReviewApplyEvidenceFile = readArgValue(args, '--poi-production-review-apply-evidence') ||
    defaultPoiProductionReviewApplyEvidenceFile
  const productionReviewFile = readArgValue(args, '--production-review') ||
    readArgValue(args, '--production-review-file') ||
    defaultProductionReviewFile
  const productionReviewTasksOutputFile = readArgValue(args, '--production-review-tasks-output') ||
    defaultProductionReviewTasksOutputFile
  const productionReviewTasksEvidenceFile = readArgValue(args, '--production-review-tasks-evidence') ||
    defaultProductionReviewTasksEvidenceFile
  const appReadinessEvidenceFile = readArgValue(args, '--app-readiness-evidence') || defaultAppReadinessEvidenceFile
  const qdrantEvidenceFile = readArgValue(args, '--qdrant-evidence') || defaultQdrantEvidenceFile
  const embeddingEvidenceFile = readArgValue(args, '--embedding-evidence') || defaultEmbeddingEvidenceFile
  const yudaoServerBuildEvidenceFile = readArgValue(args, '--yudao-server-build-evidence') ||
    readArgValue(args, '--server-build-evidence') ||
    defaultYudaoServerBuildEvidenceFile
  const yudaoServerSmokeEvidenceFile = readArgValue(args, '--yudao-server-smoke-evidence') ||
    readArgValue(args, '--server-smoke-evidence') ||
    defaultYudaoServerSmokeEvidenceFile
  const runtimeSeedEvidenceFile = readArgValue(args, '--runtime-seed-evidence') || defaultRuntimeSeedEvidenceFile
  const productionSeedApplyEvidenceFile = readArgValue(args, '--production-seed-apply-evidence') ||
    readArgValue(args, '--seed-apply-evidence') ||
    defaultProductionSeedApplyEvidenceFile
  const releasePackageEvidenceFile = readArgValue(args, '--release-package-evidence') ||
    readArgValue(args, '--package-evidence') ||
    defaultReleasePackageEvidenceFile
  const resolvedReleaseEvidenceFile = resolveRootFile(resolvedRoot, releaseEvidenceFile)
  const resolvedTasksOutputFile = resolveRootFile(resolvedRoot, tasksOutputFile)
  const resolvedPoiTasksOutputFile = resolveRootFile(resolvedRoot, poiTasksOutputFile)
  const resolvedPoiSummaryOutputFile = resolveRootFile(resolvedRoot, poiSummaryOutputFile)
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
      releaseEvidenceFile,
      qdrantEvidenceFile,
      embeddingEvidenceFile,
      yudaoServerBuildEvidenceFile,
      yudaoServerSmokeEvidenceFile
    })
  ], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })

  if (!existsSync(resolvedReleaseEvidenceFile)) {
    throw new Error(gateResult.stderr.trim() || 'release gate did not write evidence')
  }

  const releaseEvidence = JSON.parse(await readFile(resolvedReleaseEvidenceFile, 'utf8'))
  const commandEnv = envFile ? await loadEnvFile(envFile).catch(() => ({})) : {}
  const appReadinessCommand = buildAppReadinessCommand({
    envFile,
    commandEnv,
    releaseEvidence,
    appReadinessEvidenceFile
  })
  const appReadiness = await summarizeAppReadinessEvidence({
    rootDir: resolvedRoot,
    releaseEvidence,
    appReadinessEvidenceFile
  })
  const productionReviewTasksCommand = buildProductionReviewTasksCommand({
    productionReviewFile,
    productionReviewTasksOutputFile,
    productionReviewTasksEvidenceFile
  })
  const productionReviewTasks = await summarizeProductionReviewTasks({
    rootDir: resolvedRoot,
    productionReviewFile,
    productionReviewTasksOutputFile,
    productionReviewTasksEvidenceFile
  })
  const taskReport = await exportXichengYudaoReleaseBlockerTasks({
    rootDir: resolvedRoot,
    releaseEvidenceFile,
    outputFile: tasksOutputFile,
    poiOutputFile: poiTasksOutputFile,
    poiSummaryOutputFile,
    extraTaskRows: buildAppReadinessTaskRows({
      appReadiness,
      appReadinessCommand
    })
  })
  const finalEvidencePackageCommand = buildFinalEvidencePackageCommand({
    stage,
    releaseEvidenceFile,
    yudaoServerBuildEvidenceFile,
    yudaoServerSmokeEvidenceFile,
    runtimeSeedEvidenceFile,
    productionSeedApplyEvidenceFile,
    poiWorkbookEvidenceFile,
    poiManifestEvidenceFile,
    poiSeedEvidenceFile,
    poiSourceCoverageEvidenceFile,
    poiSourceReviewApplyEvidenceFile,
    poiProductionReviewApplyEvidenceFile,
    appReadinessEvidenceFile,
    releasePackageEvidenceFile
  })
  const poiEvidenceBootstrapCommand = needsPoiEvidenceBootstrap(releaseEvidence, taskReport)
    ? buildPoiEvidenceBootstrapCommand()
    : undefined
  await mkdir(path.dirname(resolvedHandoffOutputFile), { recursive: true })
  await writeFile(resolvedHandoffOutputFile, buildHandoffMarkdown({
    stage,
    releaseEvidence,
    taskReport,
    releaseEvidenceFile: resolvedReleaseEvidenceFile,
    tasksOutputFile: resolvedTasksOutputFile,
    poiTasksOutputFile: resolvedPoiTasksOutputFile,
    poiSummaryOutputFile: resolvedPoiSummaryOutputFile,
    poiEvidenceBootstrapCommand,
    productionReviewTasks,
    productionReviewTasksCommand,
    appReadiness,
    appReadinessCommand,
    finalEvidencePackageCommand
  }))
  const ok = releaseEvidence.ok === true && taskReport.ok === true && appReadiness.ok === true

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
      poiSummaryOutputFile: resolvedPoiSummaryOutputFile,
      handoffOutputFile: resolvedHandoffOutputFile,
      appReadinessEvidenceFile: appReadiness.evidenceFile,
      appReadinessStatus: appReadiness.status,
      appReadinessBlockerCount: appReadiness.blockers.length,
      productionReviewTasksStatus: productionReviewTasks.status,
      productionReviewTasksOutputFile: productionReviewTasks.summary?.outputFile,
      productionReviewTasksEvidenceFile: productionReviewTasks.summary?.evidenceFile,
      productionReviewTaskCount: productionReviewTasks.summary?.taskCount,
      productionReviewPendingPoiCount: productionReviewTasks.summary?.pendingPoiCount,
      failedCheckCount: releaseEvidence.summary?.failedChecks,
      blockerCount: releaseEvidence.summary?.blockerCount,
      taskCount: taskReport.summary.taskCount,
      poiTaskCount: taskReport.summary.poiTaskCount,
      poiSummaryCount: taskReport.summary.poiSummaryCount,
      ownerLaneCounts: taskReport.summary.ownerLaneCounts,
      ownerLaneBreakdown: taskReport.summary.ownerLaneBreakdown,
      poiEvidenceBootstrapCommand,
      productionReviewTasksCommand,
      appReadinessCommand,
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
    appReadiness,
    productionReviewTasks,
    blockers: ok ? [] : [
      ...taskReport.blockers,
      ...appReadiness.blockers
    ]
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
    process.exitCode = 1
  }
}

const executedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === executedPath) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
