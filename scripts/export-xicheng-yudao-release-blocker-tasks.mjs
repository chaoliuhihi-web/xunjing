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
  'yudao-ai-model-bootstrap': 'ai-platform',
  'embedding-provider-smoke': 'ai-platform',
  'qdrant-vector-store': 'ai-platform',
  'vision-ocr-service': 'vision-ocr',
  'object-storage': 'storage-ops',
  'full-yudao-baseline': 'yudao-deploy',
  'yudao-server-artifact': 'yudao-deploy',
  'yudao-server-build-evidence': 'yudao-deploy',
  'yudao-server-smoke': 'yudao-deploy',
  'xicheng-production-poi-evidence': 'poi-data',
  'xicheng-runtime-seed-evidence': 'poi-data',
  'xicheng-production-seed-apply': 'poi-data',
  'xicheng-production-poi': 'poi-data',
  'xicheng-source-license': 'poi-data'
}

const releaseGateEvidenceArgs = [
  '--yudao-baseline-sql /secure/path/ruoyi-vue-pro.sql',
  '--yudao-server-jar /secure/path/yudao-server.jar',
  '--yudao-server-build-evidence qa/xicheng-yudao-server-build-evidence.json',
  '--yudao-server-smoke-evidence qa/xicheng-yudao-server-smoke-evidence.json',
  '--ai-bootstrap-evidence qa/xicheng-yudao-ai-bootstrap-evidence.json',
  '--qdrant-evidence qa/xicheng-qdrant-smoke-evidence.json',
  '--embedding-evidence qa/xicheng-embedding-smoke-evidence.json',
  '--vision-ocr-evidence qa/xicheng-vision-ocr-smoke-evidence.json',
  '--object-storage-evidence qa/xicheng-object-storage-smoke-evidence.json',
  '--runtime-seed-evidence qa/xicheng-yudao-runtime-seed-production-evidence.json',
  '--production-seed-apply-evidence qa/xicheng-yudao-production-seed-apply-evidence.json',
  '--poi-workbook-evidence qa/xicheng-poi-review-workbook-evidence.json',
  '--poi-manifest-evidence qa/xicheng-poi-manifest-evidence.json',
  '--poi-seed-evidence qa/xicheng-poi-production-seed-evidence.json',
  '--poi-source-coverage-evidence qa/xicheng-poi-source-coverage-evidence.json',
  '--poi-source-review-apply-evidence qa/xicheng-poi-source-review-apply-evidence.json',
  '--poi-production-review-apply-evidence qa/xicheng-poi-production-review-apply-evidence.json'
]
const releaseGateCommand = `npm run xunjing:yudao:release:gate -- --stage production --expected-branch feature/xicheng-p0 --env-file /secure/path/production.env ${releaseGateEvidenceArgs.join(' ')} --evidence-file qa/xicheng-yudao-release-evidence.json`
const productionSeedApplyCommand = 'npm run xunjing:yudao:production-seed:apply -- --env-file /secure/path/production.env --seed-sql workbench/xicheng-poi-production-seed.sql --seed-evidence qa/xicheng-poi-production-seed-evidence.json --runtime-evidence-file qa/xicheng-yudao-runtime-seed-production-evidence.json --apply-evidence-file qa/xicheng-yudao-production-seed-apply-evidence.json --confirm-apply-xicheng-production-seed'
const sourceReviewApplyCommand = 'npm run xunjing:xicheng:poi:source-review:apply -- --workbook workbench/xicheng-production-pois.review-workbook.csv --source-review workbench/xicheng-poi-source-review-summary.csv --source-coverage-evidence qa/xicheng-poi-source-coverage-evidence.json --output workbench/xicheng-production-pois.review-workbook.source-applied.csv --evidence-file qa/xicheng-poi-source-review-apply-evidence.json'
const productionReviewApplyCommand = 'npm run xunjing:xicheng:poi:production-review:apply -- --workbook workbench/xicheng-production-pois.review-workbook.source-applied.csv --production-review workbench/xicheng-poi-production-review-summary.csv --source-review-apply-evidence qa/xicheng-poi-source-review-apply-evidence.json --trigger-smoke-apply-evidence qa/xicheng-poi-trigger-smoke-apply-evidence.json --output workbench/xicheng-production-pois.review-workbook.production-applied.csv --evidence-file qa/xicheng-poi-production-review-apply-evidence.json'

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
    verificationCommand: releaseGateCommand
  },
  'yudao-server-artifact': {
    taskDetail: 'Build and provide the deployable Yudao server jar for release gate.',
    requiredEvidence: 'Yudao server build evidence records yudao-server.jar size and SHA-256.',
    verificationCommand: 'npm run xunjing:yudao:server:build -- --evidence-file qa/xicheng-yudao-server-build-evidence.json'
  },
  'yudao-server-build-evidence': {
    taskDetail: 'Run the controlled Yudao server build command and provide its evidence file.',
    requiredEvidence: 'Release evidence records yudaoServerBuildEvidenceFile and jar hash from YUDAO_SERVER_JAR_BUILT evidence.',
    verificationCommand: 'npm run xunjing:yudao:server:build -- --evidence-file qa/xicheng-yudao-server-build-evidence.json'
  },
  'yudao-server-smoke': {
    taskDetail: 'Run the deployed Yudao server HTTP smoke against the production APP API domain.',
    requiredEvidence: 'Release evidence records yudaoServerSmokeEvidenceFile and XICHENG_YUDAO_SERVER_SMOKE_READY public endpoint results.',
    verificationCommand: 'npm run xunjing:yudao:server:smoke -- --env-file /secure/path/production.env --evidence-file qa/xicheng-yudao-server-smoke-evidence.json'
  },
  'yudao-ai-model-bootstrap': {
    taskDetail: 'Run the Yudao AI model bootstrap against production or preprod MySQL and provide its secret-safe evidence file.',
    requiredEvidence: 'Release evidence records aiBootstrapEvidenceFile and aiBootstrapModel from YUDAO_AI_MODEL_BOOTSTRAPPED evidence.',
    verificationCommand: 'npm run xunjing:ai:bootstrap -- --env-file /secure/path/production.env --evidence-file qa/xicheng-yudao-ai-bootstrap-evidence.json'
  },
  'qdrant-vector-store': {
    taskDetail: 'Run the Xicheng Qdrant collection smoke and provide its secret-safe evidence file.',
    requiredEvidence: 'Release evidence records qdrantEvidenceFile text and image collection metadata from XICHENG_QDRANT_SMOKE_READY evidence.',
    verificationCommand: 'npm run xunjing:qdrant:smoke -- --env-file /secure/path/production.env --evidence-file qa/xicheng-qdrant-smoke-evidence.json'
  },
  'embedding-provider-smoke': {
    taskDetail: 'Run the Xicheng embedding provider smoke and provide its secret-safe evidence file.',
    requiredEvidence: 'Release evidence records embeddingEvidenceFile model endpoint and vector dimensions from XICHENG_EMBEDDING_SMOKE_READY evidence.',
    verificationCommand: 'npm run xunjing:embedding:smoke -- --env-file /secure/path/production.env --evidence-file qa/xicheng-embedding-smoke-evidence.json'
  },
  'object-storage': {
    taskDetail: 'Run the Xicheng object storage write/read/delete smoke and provide its secret-safe evidence file.',
    requiredEvidence: 'Release evidence records objectStorageEvidenceFile and write/read/delete metadata from XICHENG_OBJECT_STORAGE_SMOKE_READY evidence.',
    verificationCommand: 'npm run xunjing:storage:smoke -- --env-file /secure/path/production.env --evidence-file qa/xicheng-object-storage-smoke-evidence.json'
  },
  'vision-ocr-service': {
    taskDetail: 'Run the Xicheng OCR/vision provider smoke and provide its secret-safe evidence file.',
    requiredEvidence: 'Release evidence records visionOcrEvidenceFile and provider smoke metadata from XICHENG_VISION_OCR_SMOKE_READY evidence.',
    verificationCommand: 'npm run xunjing:vision:smoke -- --env-file /secure/path/production.env --image-url https://your-cdn.example.com/xicheng/smoke/baitasi-test-card.jpg --evidence-file qa/xicheng-vision-ocr-smoke-evidence.json'
  },
  'xicheng-production-poi-evidence': {
    taskDetail: 'Generate reviewed POI workbook manifest and seed evidence from 80 approved Xicheng POIs.',
    requiredEvidence: 'Workbook manifest and seed gates output READY evidence with matching source hashes.',
    verificationCommand: 'npm run xunjing:xicheng:poi:review:pack'
  },
  'xicheng-runtime-seed-evidence': {
    taskDetail: 'Apply the approved Xicheng production seed to the target Yudao database and provide runtime seed evidence.',
    requiredEvidence: 'Production seed apply outputs YUDAO_XICHENG_PRODUCTION_SEED_APPLIED and writes YUDAO_XICHENG_PRODUCTION_SEED_READY runtime evidence.',
    verificationCommand: productionSeedApplyCommand
  },
  'xicheng-production-seed-apply': {
    taskDetail: 'Run the controlled production seed apply command and provide apply evidence tied to the runtime seed evidence.',
    requiredEvidence: 'Release evidence records productionSeedApplyEvidenceFile with YUDAO_XICHENG_PRODUCTION_SEED_APPLIED and matching runtimeEvidenceFile.',
    verificationCommand: productionSeedApplyCommand
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

const poiEvidenceTaskInstructions = [
  [/(source review apply|pendingSourcePoiCount|source license review)/i, {
    taskDetail: 'Apply approved source review groups back into the 80-row Xicheng POI workbook.',
    requiredEvidence: 'Source review apply outputs SOURCE_REVIEW_APPLIED with pendingSourcePoiCount=0.',
    verificationCommand: sourceReviewApplyCommand
  }],
  [/(production review apply|pendingProductionReviewPoiCount)/i, {
    taskDetail: 'Apply approved field evidence geo review trigger smoke and content review back into the Xicheng POI workbook.',
    requiredEvidence: 'Production review apply outputs PRODUCTION_REVIEW_APPLIED with pendingProductionReviewPoiCount=0.',
    verificationCommand: productionReviewApplyCommand
  }],
  [/manifest/i, {
    taskDetail: 'Generate production POI manifest evidence from the reviewed 80-row workbook.',
    requiredEvidence: 'Manifest gate outputs PRODUCTION_POI_MANIFEST_READY with review batch and source workbook hashes.',
    verificationCommand: 'npm run xunjing:xicheng:poi:manifest:gate -- --manifest workbench/xicheng-production-pois.json --evidence-file qa/xicheng-poi-manifest-evidence.json'
  }],
  [/workbook/i, {
    taskDetail: 'Generate reviewed POI workbook evidence from 80 approved Xicheng POIs.',
    requiredEvidence: 'Workbook gate outputs XICHENG_POI_REVIEW_WORKBOOK_READY with pendingPoiTasks empty.',
    verificationCommand: 'npm run xunjing:xicheng:poi:workbook:gate -- --workbook workbench/xicheng-production-pois.review-workbook.csv --evidence-file qa/xicheng-poi-review-workbook-evidence.json'
  }],
  [/seed/i, {
    taskDetail: 'Generate and verify production POI seed SQL from the approved manifest.',
    requiredEvidence: 'Seed verify outputs PRODUCTION_POI_SEED_READY with sqlFile and sqlSha256.',
    verificationCommand: 'npm run xunjing:xicheng:poi:seed:verify -- --sql workbench/xicheng-poi-production-seed.sql --evidence-file qa/xicheng-poi-production-seed-evidence.json'
  }],
  [/source coverage/i, {
    taskDetail: 'Generate POI source coverage evidence from the source review summary.',
    requiredEvidence: 'Source coverage audit outputs SOURCE_COVERAGE_READY with uncoveredPoiCount=0.',
    verificationCommand: 'npm run xunjing:xicheng:poi:source-coverage:audit -- --source-review workbench/xicheng-poi-source-review-summary.csv --evidence-file qa/xicheng-poi-source-coverage-evidence.json'
  }]
]

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
  if (checkName === 'xicheng-production-poi-evidence') {
    const poiEvidenceInstruction = poiEvidenceTaskInstructions.find(([pattern]) => pattern.test(String(blocker || '')))
    if (poiEvidenceInstruction) {
      return poiEvidenceInstruction[1]
    }
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
        return expandedBlockers.map((expandedBlocker, expandedIndex) => {
          const affectedPoiCodes = affectedPoiCodesFor(evidence, item.name, expandedBlocker)
          return {
            checkName: item.name,
            blockerIndex: checkTaskIndex + expandedIndex + 1,
            blocker: expandedBlocker,
            ownerLane: ownerLaneFor(item.name, expandedBlocker),
            affectedPoiCount: affectedPoiCodes.length,
            affectedPoiCodes,
            ...taskInstructionFor(item.name, expandedBlocker),
            taskStatus: 'TODO',
            sourceEvidenceFile
          }
        })
          .map((row) => {
            checkTaskIndex += 1
            return row
          })
      })
    })
}

function normalizeExtraTaskRows(extraTaskRows, sourceEvidenceFile) {
  return (Array.isArray(extraTaskRows) ? extraTaskRows : [])
    .filter(Boolean)
    .map((row, index) => {
      const affectedPoiCodes = Array.isArray(row.affectedPoiCodes) ? row.affectedPoiCodes : []
      return {
        checkName: row.checkName || 'external-release-task',
        blockerIndex: row.blockerIndex || index + 1,
        blocker: row.blocker || '',
        ownerLane: row.ownerLane || 'release-manager',
        taskDetail: row.taskDetail || 'Resolve external release blocker.',
        requiredEvidence: row.requiredEvidence || 'External release evidence is ready.',
        verificationCommand: row.verificationCommand || releaseGateCommand,
        taskStatus: row.taskStatus || 'TODO',
        sourceEvidenceFile: row.sourceEvidenceFile || sourceEvidenceFile,
        affectedPoiCount: row.affectedPoiCount ?? affectedPoiCodes.length,
        affectedPoiCodes
      }
    })
}

function summarizeOwnerLanes(taskRows) {
  return taskRows.reduce((counts, row) => {
    counts[row.ownerLane] = (counts[row.ownerLane] || 0) + 1
    return counts
  }, {})
}

function sortedUnique(values) {
  return [...new Set(values.filter((value) => String(value || '').trim().length > 0))]
    .sort((left, right) => String(left).localeCompare(String(right)))
}

function codeList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : []
}

function runtimeSeedPendingPoiCodes(evidence) {
  const summary = evidence.summary || {}
  const geoCodes = codeList(summary.runtimeSeedGeoReviewRequiredPoiCodes)
  const licenseCodes = codeList(summary.runtimeSeedLicenseReviewRequiredPoiCodes)
  const sourceReviewCodes = codeList(summary.sourceReviewPendingSourcePoiCodes)
  const productionReviewCodes = codeList(summary.productionReviewPendingPoiCodes)
  return {
    geoCodes,
    licenseCodes,
    sourceReviewCodes,
    productionReviewCodes,
    allCodes: sortedUnique([...geoCodes, ...licenseCodes])
  }
}

function affectedPoiCodesFor(evidence, checkName, blocker) {
  if (![
    'xicheng-production-poi-evidence',
    'xicheng-runtime-seed-evidence',
    'xicheng-production-poi',
    'xicheng-source-license'
  ].includes(checkName)) {
    return []
  }
  const { geoCodes, licenseCodes, sourceReviewCodes, productionReviewCodes, allCodes } = runtimeSeedPendingPoiCodes(evidence)
  const blockerText = String(blocker || '').toLowerCase()
  const mentionsGeo = /geo|coordinate/.test(blockerText)
  const mentionsLicense = /license/.test(blockerText)
  const mentionsPoiReviewApply = checkName === 'xicheng-production-poi-evidence'
  const mentionsSourceReviewApply = mentionsPoiReviewApply &&
    /pendingsourcepoicount/.test(blockerText)
  const mentionsProductionReviewApply = mentionsPoiReviewApply &&
    /production review apply|pendingproductionreviewpoicount/.test(blockerText)

  if (mentionsSourceReviewApply && mentionsProductionReviewApply) {
    return sortedUnique([...sourceReviewCodes, ...productionReviewCodes])
  }
  if (mentionsSourceReviewApply) {
    return sourceReviewCodes
  }
  if (mentionsProductionReviewApply) {
    return productionReviewCodes
  }
  if (mentionsGeo && mentionsLicense) {
    return allCodes
  }
  if (mentionsGeo) {
    return geoCodes
  }
  if (mentionsLicense) {
    return licenseCodes
  }
  if (/review_required|contains blockers/.test(blockerText)) {
    return allCodes
  }
  if ([
    'xicheng-production-poi-evidence',
    'xicheng-production-poi',
    'xicheng-source-license'
  ].includes(checkName)) {
    return allCodes
  }
  return []
}

function summarizeOwnerLaneBreakdown(taskRows) {
  const byLane = new Map()
  taskRows.forEach((row) => {
    const ownerLane = row.ownerLane || 'release-manager'
    if (!byLane.has(ownerLane)) {
      byLane.set(ownerLane, {
        ownerLane,
        rows: []
      })
    }
    byLane.get(ownerLane).rows.push(row)
  })

  return [...byLane.values()]
    .sort((left, right) => left.ownerLane.localeCompare(right.ownerLane))
    .map((item) => ({
      ownerLane: item.ownerLane,
      taskCount: item.rows.length,
      checkNames: sortedUnique(item.rows.map((row) => row.checkName)),
      verificationCommands: sortedUnique(item.rows.map((row) => row.verificationCommand))
    }))
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
    'sourceEvidenceFile',
    'affectedPoiCount',
    'affectedPoiCodes'
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
    row.sourceEvidenceFile,
    row.affectedPoiCount || 0,
    Array.isArray(row.affectedPoiCodes) ? row.affectedPoiCodes.join('|') : ''
  ]))
  return `${[header.join(','), ...rows].join('\n')}\n`
}

function buildPoiTaskRows(taskRows) {
  return taskRows.flatMap((row) => {
    const poiCodes = Array.isArray(row.affectedPoiCodes) ? row.affectedPoiCodes : []
    return poiCodes.map((poiCode) => ({
      poiTaskKey: `${row.checkName}:${row.blockerIndex}:${poiCode}`,
      poiCode,
      checkName: row.checkName,
      blockerIndex: row.blockerIndex,
      blocker: row.blocker,
      ownerLane: row.ownerLane,
      taskDetail: row.taskDetail,
      requiredEvidence: row.requiredEvidence,
      verificationCommand: row.verificationCommand,
      taskStatus: row.taskStatus,
      sourceEvidenceFile: row.sourceEvidenceFile
    }))
  })
}

function buildPoiCsv(poiTaskRows) {
  const header = [
    'poiTaskKey',
    'poiCode',
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
  const rows = poiTaskRows.map((row) => csvRow([
    row.poiTaskKey,
    row.poiCode,
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

function buildPoiSummaryRows(poiTaskRows) {
  const byPoiCode = new Map()
  poiTaskRows.forEach((row) => {
    if (!byPoiCode.has(row.poiCode)) {
      byPoiCode.set(row.poiCode, [])
    }
    byPoiCode.get(row.poiCode).push(row)
  })

  return [...byPoiCode.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([poiCode, rows]) => ({
      poiCode,
      ownerLanes: sortedUnique(rows.map((row) => row.ownerLane)),
      blockerCount: rows.length,
      checkNames: sortedUnique(rows.map((row) => row.checkName)),
      blockers: sortedUnique(rows.map((row) => row.blocker)),
      taskDetails: sortedUnique(rows.map((row) => row.taskDetail)),
      requiredEvidence: sortedUnique(rows.map((row) => row.requiredEvidence)),
      verificationCommands: sortedUnique(rows.map((row) => row.verificationCommand)),
      taskStatus: sortedUnique(rows.map((row) => row.taskStatus)),
      sourceEvidenceFiles: sortedUnique(rows.map((row) => row.sourceEvidenceFile))
    }))
}

function buildPoiSummaryCsv(poiSummaryRows) {
  const header = [
    'poiCode',
    'ownerLanes',
    'blockerCount',
    'checkNames',
    'blockers',
    'taskDetails',
    'requiredEvidence',
    'verificationCommands',
    'taskStatus',
    'sourceEvidenceFiles'
  ]
  const rows = poiSummaryRows.map((row) => csvRow([
    row.poiCode,
    row.ownerLanes.join('|'),
    row.blockerCount,
    row.checkNames.join('|'),
    row.blockers.join('|'),
    row.taskDetails.join('|'),
    row.requiredEvidence.join('|'),
    row.verificationCommands.join('|'),
    row.taskStatus.join('|'),
    row.sourceEvidenceFiles.join('|')
  ]))
  return `${[header.join(','), ...rows].join('\n')}\n`
}

export async function exportXichengYudaoReleaseBlockerTasks({
  rootDir = process.cwd(),
  releaseEvidenceFile,
  outputFile = 'workbench/xicheng-yudao-release-blocker-tasks.csv',
  poiOutputFile,
  poiSummaryOutputFile,
  extraTaskRows = []
} = {}) {
  const resolvedRoot = path.resolve(rootDir)
  const resolvedEvidenceFile = resolveRootFile(resolvedRoot, releaseEvidenceFile)
  const resolvedOutputFile = resolveRootFile(resolvedRoot, outputFile)
  const resolvedPoiOutputFile = poiOutputFile ? resolveRootFile(resolvedRoot, poiOutputFile) : undefined
  const resolvedPoiSummaryOutputFile = poiSummaryOutputFile
    ? resolveRootFile(resolvedRoot, poiSummaryOutputFile)
    : undefined
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

  const taskRows = [
    ...buildTaskRows(evidence, resolvedEvidenceFile),
    ...normalizeExtraTaskRows(extraTaskRows, resolvedEvidenceFile)
  ]
  const poiTaskRows = buildPoiTaskRows(taskRows)
  const poiSummaryRows = buildPoiSummaryRows(poiTaskRows)
  const ownerLaneCounts = summarizeOwnerLanes(taskRows)
  const ownerLaneBreakdown = summarizeOwnerLaneBreakdown(taskRows)
  await mkdir(path.dirname(resolvedOutputFile), { recursive: true })
  await writeFile(resolvedOutputFile, buildCsv(taskRows))
  if (resolvedPoiOutputFile) {
    await mkdir(path.dirname(resolvedPoiOutputFile), { recursive: true })
    await writeFile(resolvedPoiOutputFile, buildPoiCsv(poiTaskRows))
  }
  if (resolvedPoiSummaryOutputFile) {
    await mkdir(path.dirname(resolvedPoiSummaryOutputFile), { recursive: true })
    await writeFile(resolvedPoiSummaryOutputFile, buildPoiSummaryCsv(poiSummaryRows))
  }

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
      poiOutputFile: resolvedPoiOutputFile,
      poiTaskCount: poiTaskRows.length,
      poiSummaryOutputFile: resolvedPoiSummaryOutputFile,
      poiSummaryCount: poiSummaryRows.length,
      ownerLaneCounts,
      ownerLaneBreakdown
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
    outputFile: readArgValue(args, '--output') || 'workbench/xicheng-yudao-release-blocker-tasks.csv',
    poiOutputFile: readArgValue(args, '--poi-output') || readArgValue(args, '--poi-tasks-output'),
    poiSummaryOutputFile: readArgValue(args, '--poi-summary-output')
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
