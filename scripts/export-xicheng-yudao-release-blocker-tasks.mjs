import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const artifactType = 'xicheng-yudao-release-blocker-tasks'
const releaseArtifactType = 'xicheng-yudao-release-readiness'
const readyStatus = 'RELEASE_TASKS_READY'
const requiredStatus = 'RELEASE_TASKS_REQUIRED'

const envKeyOwnerLane = [
  [/^WX_/, 'app-ops'],
  [/^(QWEN_|DASHSCOPE_|SPRING_AI_|QDRANT_)/, 'ai-platform'],
  [/^XUNJING_VISION_/, 'vision-ocr'],
  [/^OSS_/, 'storage-ops'],
  [/^(MYSQL_|REDIS_|SPRING_PROFILES_ACTIVE$|INTERNAL_AUTH_TOKEN$|XUNJING_APP_API_BASE_URL$)/, 'platform-ops']
]

const checkOwnerLane = {
  'release-source-revision': 'release-manager',
  'runtime-env': 'platform-ops',
  'vector-embedding-runtime': 'ai-platform',
  'https-app-api-domain': 'platform-ops',
  'real-wechat-app': 'app-ops',
  'real-ai-provider': 'ai-platform',
  'vision-ocr-service': 'vision-ocr',
  'object-storage': 'storage-ops',
  'full-yudao-baseline': 'yudao-deploy',
  'yudao-server-artifact': 'yudao-deploy',
  'xicheng-production-poi-evidence': 'poi-data',
  'xicheng-production-poi': 'poi-data',
  'xicheng-source-license': 'poi-data'
}

const releaseGateCommand = 'npm run xunjing:yudao:release:gate -- --stage production --expected-branch feature/xicheng-p0 --env-file /secure/path/production.env --evidence-file qa/xicheng-yudao-release-evidence.json'

const envTaskInstructions = [
  [/^XUNJING_APP_API_BASE_URL$/, {
    taskDetail: 'Configure a non-local HTTPS APP API backend domain in the production env.',
    requiredEvidence: 'Release evidence records a non-local HTTPS appApiBaseUrl from production env.',
    verificationCommand: releaseGateCommand
  }],
  [/^(MYSQL_|REDIS_|SPRING_PROFILES_ACTIVE$|INTERNAL_AUTH_TOKEN$)/, {
    taskDetail: 'Configure production MySQL host credentials and profile settings.',
    requiredEvidence: 'Release gate runtime-env check passes without local host or placeholder database values.',
    verificationCommand: releaseGateCommand
  }],
  [/^WX_/, {
    taskDetail: 'Configure real WeChat MP and Mini Program credentials outside Git.',
    requiredEvidence: 'Release gate real-wechat-app check passes using production secret store values.',
    verificationCommand: releaseGateCommand
  }],
  [/^(QWEN_|DASHSCOPE_|SPRING_AI_|QDRANT_)/, {
    taskDetail: 'Configure real AI provider embedding and Qdrant runtime settings.',
    requiredEvidence: 'Release gate AI and vector checks pass with real provider and Qdrant values.',
    verificationCommand: releaseGateCommand
  }],
  [/^XUNJING_VISION_/, {
    taskDetail: 'Configure real OCR and vision recognition endpoint key and model.',
    requiredEvidence: 'Release gate vision-ocr-service check passes with non-local HTTPS service values.',
    verificationCommand: releaseGateCommand
  }],
  [/^OSS_/, {
    taskDetail: 'Configure production object storage endpoint bucket prefix and credentials.',
    requiredEvidence: 'Release gate object-storage check passes without local or placeholder values.',
    verificationCommand: releaseGateCommand
  }]
]

const checkTaskInstructions = {
  'release-source-revision': {
    taskDetail: 'Use a clean feature/xicheng-p0 checkout for release evidence.',
    requiredEvidence: 'Release evidence records gitDirty=false and the expected Git commit.',
    verificationCommand: releaseGateCommand
  },
  'full-yudao-baseline': {
    taskDetail: 'Provide the complete controlled Yudao baseline SQL path for release gate.',
    requiredEvidence: 'Release evidence records yudaoBaselineSqlFile and matching yudaoBaselineSqlSha256.',
    verificationCommand: 'npm run xunjing:yudao:release:gate -- --stage production --expected-branch feature/xicheng-p0 --env-file /secure/path/production.env --yudao-baseline-sql /secure/path/ruoyi-vue-pro.sql --evidence-file qa/xicheng-yudao-release-evidence.json'
  },
  'yudao-server-artifact': {
    taskDetail: 'Build and provide the deployable Yudao server jar for release gate.',
    requiredEvidence: 'Release evidence records yudaoServerJarFile size and SHA-256.',
    verificationCommand: 'npm run xunjing:yudao:release:gate -- --stage production --expected-branch feature/xicheng-p0 --env-file /secure/path/production.env --yudao-server-jar /secure/path/yudao-server.jar --evidence-file qa/xicheng-yudao-release-evidence.json'
  },
  'xicheng-production-poi-evidence': {
    taskDetail: 'Generate reviewed POI workbook manifest and seed evidence from 80 approved Xicheng POIs.',
    requiredEvidence: 'Workbook manifest and seed gates output READY evidence with matching source hashes.',
    verificationCommand: 'npm run xunjing:xicheng:poi:review:pack'
  },
  'xicheng-production-poi': {
    taskDetail: 'Complete 80 approved Xicheng POIs and production seed readiness.',
    requiredEvidence: 'Seed evidence proves at least 80 productionReady approved Xicheng POIs.',
    verificationCommand: 'npm run xunjing:xicheng:poi:seed:verify -- --sql workbench/xicheng-poi-production-seed.sql --evidence-file qa/xicheng-poi-production-seed-evidence.json'
  },
  'xicheng-source-license': {
    taskDetail: 'Approve all Xicheng POI source license geo and content review fields.',
    requiredEvidence: 'Manifest and seed evidence contain no REVIEW_REQUIRED or DRAFT POI values.',
    verificationCommand: 'npm run xunjing:xicheng:poi:manifest:gate -- --manifest workbench/xicheng-production-pois.json --evidence-file qa/xicheng-poi-manifest-evidence.json'
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

function ownerLaneForEnvKey(envKey) {
  const normalized = String(envKey || '').trim()
  const match = envKeyOwnerLane.find(([pattern]) => pattern.test(normalized))
  return match?.[1]
}

function ownerLaneFor(checkName, blocker) {
  const envKey = String(blocker || '').match(/\b[A-Z][A-Z0-9_]{2,}\b/)?.[0]
  return ownerLaneForEnvKey(envKey) ||
    checkOwnerLane[checkName] ||
    (/baseline|jar|yudao/i.test(blocker) ? 'yudao-deploy' : undefined) ||
    (/poi|workbook|manifest|seed|license/i.test(blocker) ? 'poi-data' : undefined) ||
    'release-manager'
}

function taskInstructionFor(checkName, blocker) {
  const envKey = String(blocker || '').match(/\b[A-Z][A-Z0-9_]{2,}\b/)?.[0]
  const envInstruction = envTaskInstructions.find(([pattern]) => pattern.test(String(envKey || '')))
  if (envInstruction) {
    return envInstruction[1]
  }
  return checkTaskInstructions[checkName] || {
    taskDetail: `Resolve release gate blocker for ${checkName}.`,
    requiredEvidence: 'Release gate re-run records this blocker as resolved in evidence JSON.',
    verificationCommand: releaseGateCommand
  }
}

function expandBlockers(blocker) {
  const text = String(blocker || '').trim()
  const envMatch = text.match(/^Missing or placeholder production env:\s*(.+)$/)
  if (!envMatch) {
    return [text].filter(Boolean)
  }
  return envMatch[1]
    .split(',')
    .map((envKey) => envKey.trim())
    .filter(Boolean)
    .map((envKey) => `${envKey} must be configured for production`)
}

function buildTaskRows(evidence, sourceEvidenceFile) {
  const checks = Array.isArray(evidence.checks) ? evidence.checks : []
  return checks
    .filter((item) => item?.ok !== true)
    .flatMap((item) => {
      const blockers = Array.isArray(item.blockers) ? item.blockers : []
      let checkTaskIndex = 0
      return blockers.flatMap((blocker) => {
        const expandedBlockers = expandBlockers(blocker)
        return expandedBlockers.map((expandedBlocker, expandedIndex) => ({
          checkName: item.name,
          blockerIndex: checkTaskIndex + expandedIndex + 1,
          blocker: expandedBlocker,
          ownerLane: ownerLaneFor(item.name, expandedBlocker),
          ...taskInstructionFor(item.name, expandedBlocker),
          taskStatus: 'TODO',
          sourceEvidenceFile
        }))
          .map((row) => {
            checkTaskIndex += 1
            return row
          })
      })
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
    'checkName',
    'blockerIndex',
    'blocker',
    'ownerLane',
    'taskDetail',
    'requiredEvidence',
    'verificationCommand',
    'taskStatus',
    'sourceEvidenceFile'
  ]
  const rows = taskRows.map((row) => csvRow([
    row.checkName,
    row.blockerIndex,
    row.blocker,
    row.ownerLane,
    row.taskDetail,
    row.requiredEvidence,
    row.verificationCommand,
    row.taskStatus,
    row.sourceEvidenceFile
  ]))
  return `${[header.join(','), ...rows].join('\n')}\n`
}

export async function exportXichengYudaoReleaseBlockerTasks({
  rootDir = process.cwd(),
  releaseEvidenceFile,
  outputFile = 'workbench/xicheng-yudao-release-blocker-tasks.csv'
} = {}) {
  const resolvedRoot = path.resolve(rootDir)
  const resolvedEvidenceFile = resolveRootFile(resolvedRoot, releaseEvidenceFile)
  const resolvedOutputFile = resolveRootFile(resolvedRoot, outputFile)
  if (!resolvedEvidenceFile) {
    throw new Error('--release-evidence is required')
  }
  if (!resolvedOutputFile) {
    throw new Error('--output is required')
  }

  const evidence = JSON.parse(await readFile(resolvedEvidenceFile, 'utf8'))
  if (evidence.artifactType !== releaseArtifactType) {
    throw new Error('release evidence artifactType must be xicheng-yudao-release-readiness')
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
      releaseStatus: evidence.status,
      failedCheckCount: Array.isArray(evidence.checks)
        ? evidence.checks.filter((item) => item.ok !== true).length
        : 0,
      taskCount: taskRows.length,
      ownerLaneCounts
    },
    tasks: taskRows,
    blockers: ok ? [] : [
      'Yudao release gate blockers remain; complete ownerLane CSV rows before preprod or production release'
    ]
  }
}

async function runCli() {
  const args = process.argv.slice(2)
  const report = await exportXichengYudaoReleaseBlockerTasks({
    rootDir: path.resolve(readArgValue(args, '--root') || process.cwd()),
    releaseEvidenceFile: readArgValue(args, '--release-evidence'),
    outputFile: readArgValue(args, '--output') || 'workbench/xicheng-yudao-release-blocker-tasks.csv'
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
