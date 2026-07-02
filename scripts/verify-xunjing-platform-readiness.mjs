import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const allowedEvidenceDirs = new Set(['qa', 'tmp', 'workbench'])

const requiredEnvKeys = [
  'SPRING_PROFILES_ACTIVE',
  'XUNJING_TENANT_ID',
  'MYSQL_HOST',
  'MYSQL_PORT',
  'MYSQL_DATABASE',
  'MYSQL_USERNAME',
  'MYSQL_PASSWORD',
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_DATABASE',
  'REDIS_PASSWORD',
  'OSS_ENDPOINT',
  'OSS_BUCKET',
  'OSS_PREFIX',
  'OSS_ACCESS_KEY',
  'OSS_SECRET_KEY',
  'QDRANT_URL',
  'QDRANT_HOST',
  'QDRANT_GRPC_PORT',
  'QDRANT_TEXT_COLLECTION',
  'QDRANT_IMAGE_COLLECTION',
  'QWEN_API_KEY',
  'QWEN_BASE_URL',
  'QWEN_MODEL',
  'INTERNAL_AUTH_TOKEN'
]

const xichengTriggerSmokeCases = [
  {
    name: 'live-xicheng-trigger-baitasi',
    detail: 'Xicheng DB trigger resolves Miaoying Temple White Pagoda',
    poiCode: 'xicheng-baitasi',
    poiName: '妙应寺白塔',
    payload: {
      packageCode: 'XICHENG-MAP-001',
      regionCode: 'beijing-xicheng',
      ocrText: '妙应寺白塔入口',
      text: '我在白塔寺附近，想听讲解',
      location: {
        latitude: 39.9231,
        longitude: 116.35726,
        coordType: 'GCJ02',
        accuracyMeters: 20
      },
      imageLabels: ['white_pagoda', 'temple'],
      userTraceId: 'platform-readiness-xicheng-baitasi'
    }
  },
  {
    name: 'live-xicheng-trigger-gongwangfu',
    detail: 'Xicheng DB trigger resolves Prince Kung Mansion',
    poiCode: 'xicheng-gongwangfu',
    poiName: '恭王府',
    payload: {
      packageCode: 'XICHENG-MAP-001',
      regionCode: 'beijing-xicheng',
      ocrText: '恭王府博物馆入口',
      text: '我在恭王府，开始讲解',
      location: {
        latitude: 39.93705,
        longitude: 116.38677,
        coordType: 'GCJ02',
        accuracyMeters: 20
      },
      imageLabels: ['palace', 'courtyard'],
      userTraceId: 'platform-readiness-xicheng-gongwangfu'
    }
  },
  {
    name: 'live-xicheng-trigger-planetarium',
    detail: 'Xicheng DB trigger resolves Beijing Planetarium',
    poiCode: 'xicheng-planetarium',
    poiName: '北京天文馆',
    payload: {
      packageCode: 'XICHENG-MAP-001',
      regionCode: 'beijing-xicheng',
      ocrText: '北京天文馆',
      text: '孩子想看天文馆讲解',
      location: {
        latitude: 39.9388,
        longitude: 116.34398,
        coordType: 'GCJ02',
        accuracyMeters: 20
      },
      imageLabels: ['planetarium', 'science', 'dome'],
      userTraceId: 'platform-readiness-xicheng-planetarium'
    }
  }
]

const xichengLocalCandidatePoiFloor = 24
const xichengProductionPoiTarget = 80

function pass(name, detail, summary) {
  return summary === undefined ? { name, ok: true, detail } : { name, ok: true, detail, summary }
}

function requireValue(env, key) {
  if (!env[key]) {
    throw new Error(`${key} is required for Xinghe Xunjing platform readiness`)
  }
}

function rejectUpstreamReuse(env) {
  const guardedValues = [
    ['MYSQL_DATABASE', env.MYSQL_DATABASE],
    ['QDRANT_TEXT_COLLECTION', env.QDRANT_TEXT_COLLECTION],
    ['QDRANT_IMAGE_COLLECTION', env.QDRANT_IMAGE_COLLECTION],
    ['OSS_BUCKET', env.OSS_BUCKET],
    ['OSS_PREFIX', env.OSS_PREFIX]
  ]

  for (const [key, value] of guardedValues) {
    if (String(value || '').toLowerCase().includes('xingheai')) {
      throw new Error(`${key} must not reuse the upstream XingheAI runtime`)
    }
  }
}

async function readText(rootDir, relativePath) {
  return await readFile(path.join(rootDir, relativePath), 'utf8')
}

function assertFiles(rootDir, files, label) {
  for (const file of files) {
    if (!existsSync(path.join(rootDir, file))) {
      throw new Error(`Missing ${label}: ${file}`)
    }
  }
}

function assertContains(text, snippet, label) {
  if (!text.includes(snippet)) {
    throw new Error(`${label} missing ${snippet}`)
  }
}

function extractCreateTableBlock(sql, tableName) {
  const marker = `CREATE TABLE IF NOT EXISTS \`${tableName}\``
  const start = sql.indexOf(marker)
  if (start === -1) {
    throw new Error(`xunjing-module.sql missing ${tableName}`)
  }
  const end = sql.indexOf('\n) ENGINE=', start)
  if (end === -1) {
    throw new Error(`xunjing-module.sql ${tableName} is missing table terminator`)
  }
  return sql.slice(start, end)
}

function assertTableContains(sql, tableName, snippets) {
  const tableSql = extractCreateTableBlock(sql, tableName)
  for (const snippet of snippets) {
    assertContains(tableSql, snippet, `xunjing-module.sql ${tableName}`)
  }
}

async function checkStaticFiles(rootDir) {
  assertFiles(rootDir, [
    'backend/yudao/pom.xml',
    'backend/yudao/yudao-module-xunjing/pom.xml',
    'backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xunjing/console/index.ts',
    'backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xunjing/console/index.vue',
    'backend/yudao/sql/mysql/yudao-ai-module.sql',
    'ops/xunjing-platform.compose.yml',
    'ops/xunjing-platform.env.example'
  ], 'platform file')
  return pass('static-files', 'Yudao backend module and admin console files exist')
}

async function checkSqlSchema(rootDir) {
  const sql = await readText(rootDir, 'backend/yudao/sql/mysql/xunjing-module.sql')
  const aiSql = await readText(rootDir, 'backend/yudao/sql/mysql/yudao-ai-module.sql')
  for (const snippet of [
    'xunjing_resource_package',
    'xunjing_knowledge_document',
    'xunjing_media_asset',
    'xunjing_poi',
    'xunjing_ai_generation_log',
    'xunjing:readiness:query'
  ]) {
    assertContains(sql, snippet, 'xunjing-module.sql')
  }
  assertTableContains(sql, 'xunjing_media_usage_log', [
    '`media_id`',
    '`package_id`',
    '`scene_code`',
    '`usage_type`',
    '`caller`',
    '`payload_json`',
    'idx_xunjing_media_usage_package'
  ])
  assertTableContains(sql, 'xunjing_interaction_event', [
    '`package_id`',
    '`event_type`',
    '`source_channel`',
    '`user_trace_id`',
    '`payload_json`',
    'idx_xunjing_event_package'
  ])
  assertTableContains(sql, 'xunjing_ai_generation_log', [
    '`package_id`',
    '`scene_code`',
    '`user_trace_id`',
    '`source_json`',
    '`token_count`',
    '`safety_status`',
    'idx_xunjing_ai_log_scene'
  ])
  for (const snippet of ['ai_api_key', 'ai_model', 'ai_knowledge', 'ai_knowledge_segment']) {
    assertContains(aiSql, snippet, 'yudao-ai-module.sql')
  }
  return pass('sql-schema', 'Xunjing MySQL schema includes P0 operating, source usage, interaction and AI audit fields')
}

async function checkSeedData(rootDir) {
  const seed = await readText(rootDir, 'backend/yudao/sql/mysql/xunjing-seed-kashgar-p0.sql')
  for (const snippet of [
    'KASHGAR-BOOK-001',
    'KASHGAR-MAP-001',
    'KASHGAR-GLOBE-001',
    'QR-KASHGAR-BOOK-001',
    '喀什古城研学地图',
    'QR-KASHGAR-MAP-001',
    'QR-KASHGAR-GLOBE-001',
    '"p0Ready":true',
    '"quotaRuleCount":5'
  ]) {
    assertContains(seed, snippet, 'xunjing-seed-kashgar-p0.sql')
  }
  return pass('seed-data', 'Kashgar P0 seed data is present')
}

async function checkXichengSeedData(rootDir) {
  const seed = await readText(rootDir, 'backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql')
  for (const snippet of [
    'XICHENG-2026-P0',
    'XICHENG-MAP-001',
    'QR-XICHENG-MAP-001',
    'beijing-xicheng',
    '"regionCode":"beijing-xicheng"',
    '"reviewStatus":"APPROVED"',
    '"geoStatus":"REVIEW_REQUIRED"',
    '"licenseStatus":"REVIEW_REQUIRED"',
    '"poiId":"xicheng-baitasi"',
    '"poiId":"xicheng-emperors-temple"',
    '"poiId":"xicheng-beihai-park"',
    '"poiId":"xicheng-shichahai"',
    '"poiId":"xicheng-dashilar"',
    '西城 AI 旅伴 P0 固定评测集',
    '"p0LocalCandidate":true',
    '"productionReady":false'
  ]) {
    assertContains(seed, snippet, 'xunjing-seed-xicheng-p0.sql')
  }
  const poiCount = seed.match(/"poiId":"xicheng-/g)?.length ?? 0
  if (poiCount < xichengLocalCandidatePoiFloor) {
    throw new Error(
      `xunjing-seed-xicheng-p0.sql must include at least ${xichengLocalCandidatePoiFloor} local-candidate POIs; found ${poiCount}`
    )
  }
  return pass('xicheng-seed-data', 'Xicheng P0 local-candidate POI, source and gate seed data is present')
}

function extractXichengPoiSeedRows(seed) {
  return seed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("(@map_package_id, 'xicheng-"))
}

function assertXichengPoiSeedRow(row) {
  const poiCode = row.match(/'(?<poiCode>xicheng-[^']+)'/)?.groups?.poiCode
  if (!poiCode) {
    throw new Error(`Xicheng POI seed row is missing poi_code: ${row}`)
  }

  const aliasesMatch = row.match(/'(?<aliases>\[[^']+\])',\s*'(?<category>[^']+)',\s*'P0'/)
  if (!aliasesMatch) {
    throw new Error(`Xicheng POI seed row ${poiCode} is missing aliases_json, category or P0 level`)
  }

  let aliases
  try {
    aliases = JSON.parse(aliasesMatch.groups.aliases)
  } catch {
    throw new Error(`Xicheng POI seed row ${poiCode} has invalid aliases_json`)
  }
  if (!Array.isArray(aliases) || aliases.length < 2) {
    throw new Error(`Xicheng POI seed row ${poiCode} must include at least two aliases`)
  }

  const coordMatch = row.match(/,\s*(?<latitude>\d{2}\.\d+),\s*(?<longitude>\d{3}\.\d+),\s*'GCJ02'/)
  const latitude = Number(coordMatch?.groups?.latitude)
  const longitude = Number(coordMatch?.groups?.longitude)
  if (!coordMatch || latitude < 39 || latitude > 41 || longitude < 115 || longitude > 117) {
    throw new Error(`Xicheng POI seed row ${poiCode} must include Beijing GCJ02 coordinates`)
  }

  for (const snippet of [
    "'beijing-xicheng'",
    "'licenseStatus','REVIEW_REQUIRED'",
    '"gpsRadiusMeters":',
    '"ocrKeywords":[',
    '"photoLabels":[',
    '"minConfidence":0.85',
    `"poiId":"${poiCode}"`,
    '"regionCode":"beijing-xicheng"',
    '"packageCode":"XICHENG-MAP-001"',
    '"reviewStatus":"APPROVED"',
    '"geoStatus":"REVIEW_REQUIRED"',
    '"licenseStatus":"REVIEW_REQUIRED"',
    '"shortIntro":"',
    '"recommendedQuestions":[',
    "'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED'"
  ]) {
    assertContains(row, snippet, `xunjing-seed-xicheng-p0.sql ${poiCode}`)
  }
  if (!/'sourceUrl',@xicheng_[a-z0-9_]*source_url/.test(row)) {
    throw new Error(`Xicheng POI seed row ${poiCode} must reference a tracked official source URL`)
  }

  return {
    poiCode,
    category: aliasesMatch.groups.category
  }
}

async function checkXichengPoiSeedQuality(rootDir) {
  const seed = await readText(rootDir, 'backend/yudao/sql/mysql/xunjing-seed-xicheng-p0.sql')
  const poiRows = extractXichengPoiSeedRows(seed)
  if (poiRows.length < xichengLocalCandidatePoiFloor) {
    throw new Error(
      `xunjing-seed-xicheng-p0.sql must include at least ${xichengLocalCandidatePoiFloor} maintainable POI rows; found ${poiRows.length}`
    )
  }

  const seenPoiCodes = new Set()
  const categories = new Set()
  for (const row of poiRows) {
    const { poiCode, category } = assertXichengPoiSeedRow(row)
    if (seenPoiCodes.has(poiCode)) {
      throw new Error(`xunjing-seed-xicheng-p0.sql contains duplicated POI code ${poiCode}`)
    }
    seenPoiCodes.add(poiCode)
    categories.add(category)
  }
  if (categories.size < 8) {
    throw new Error(`xunjing-seed-xicheng-p0.sql must cover at least 8 POI categories; found ${categories.size}`)
  }
  assertContains(seed, `"poiSeedCount":${poiRows.length}`, 'xunjing-seed-xicheng-p0.sql')
  assertContains(seed, `"targetP0PoiCount":${xichengProductionPoiTarget}`, 'xunjing-seed-xicheng-p0.sql')
  assertContains(seed, '"productionReady":false', 'xunjing-seed-xicheng-p0.sql')

  return pass(
    'xicheng-poi-seed-quality',
    `Xicheng seed has ${poiRows.length}/${xichengProductionPoiTarget} local-candidate POIs with aliases, coordinates, triggers, sources and audit status`
  )
}

async function checkXichengTriggerBackend(rootDir) {
  const engine = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingMultimodalTriggerEngine.java'
  )
  const poiDo = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/dal/dataobject/poi/XunjingPoiDO.java'
  )
  const mapper = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/dal/mysql/poi/XunjingPoiMapper.java'
  )
  const appService = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
  )
  const enums = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/enums/XunjingEnums.java'
  )
  const appTest = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java'
  )
  const h2Schema = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/test/resources/sql/create_tables.sql'
  )

  for (const snippet of [
    'XunjingPoiMapper',
    'XunjingResourcePackageMapper',
    'loadDatabasePoiProfiles',
    'safeReqVO.getPackageCode()',
    'resourcePackageMapper.selectByPackageCodeAndStatus',
    'selectPublishedListByRegionCodeAndPackageId',
    'selectPublishedListByRegionCode',
    'sourceProfiles',
    'buildSceneUnderstanding',
    'setSceneUnderstanding(buildSceneUnderstanding',
    'buildFallbackSceneFusionSummary(respVO, evidenceSignals)',
    'buildFallbackWorldInterfaceSummary(respVO, evidenceSignals)',
    'sceneDomainLabel(respVO.getIntent())',
    'buildCoreAgentActionPack(actions, regionCode, poiCode, packageCode)',
    '"claim_badge"',
    '"start_ai_guide".equals(action) || "confirm_ai_guide".equals(action)',
    '"开始 AI 讲解"',
    'return noMatch(regionCode, safeReqVO.getPackageCode(), safeReqVO)',
    'respVO.setSceneUnderstanding(buildSceneUnderstanding(reqVO, List.of(), respVO))',
    'databasePoiProfiles.isEmpty() ? XICHENG_POIS : databasePoiProfiles'
  ]) {
    assertContains(engine, snippet, 'XunjingMultimodalTriggerEngine.java')
  }
  const appVo = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java'
  )
  for (const snippet of [
    'class SceneUnderstandingRespVO',
    'private SceneUnderstandingRespVO sceneUnderstanding;',
    'private List<String> evidenceSignals;'
  ]) {
    assertContains(appVo, snippet, 'XunjingAppVO.java')
  }
  for (const snippet of ['@TableName("xunjing_poi")', 'private String sourceJson', 'private String triggerJson', 'private String contentJson']) {
    assertContains(poiDo, snippet, 'XunjingPoiDO.java')
  }
  for (const snippet of [
    'selectPublishedListByRegionCode',
    'selectPublishedListByRegionCodeAndPackageId',
    'XunjingPoiDO::getPackageId'
  ]) {
    assertContains(mapper, snippet, 'XunjingPoiMapper.java')
  }
  for (const snippet of [
    'recordTriggerResolveEventIfPossible',
    'buildTriggerResolveEventPayload',
    'payload.put("sceneUnderstanding", buildTriggerSceneUnderstandingPayload(respVO))',
    'buildTriggerSceneUnderstandingPayload',
    'JsonNode sceneUnderstanding = root.path("sceneUnderstanding")',
    'hydrateTriggerSceneUnderstandingText',
    'hydrateTriggerSceneCount(reqVO, sceneUnderstanding, sceneSignals)',
    'hydrateMultimodalTriggerMemoryFromPreviousAgentAction(resourcePackage, reqVO)',
    'shouldUsePreviousAgentActionForTriggerMemory(previousAgentActionEvent, previousAskEvent, previousResolveEvent)',
    'buildContinuousAgentActionSceneFusionSummary(agentAction)',
    'EventType.TRIGGER_RESOLVE'
  ]) {
    assertContains(appService, snippet, 'XunjingAppServiceImpl.java')
  }
  assertContains(enums, 'TRIGGER_RESOLVE("TRIGGER_RESOLVE")', 'XunjingEnums.java')
  assertContains(appTest, 'testResolveMultimodalTriggerUsesPublishedPoiFromDatabase', 'XunjingAppServiceImplTest.java')
  assertContains(
    appTest,
    'testResolveMultimodalTriggerBuildsCoreAgentActionPackForRecognizedPoi',
    'XunjingAppServiceImplTest.java'
  )
  assertContains(
    appTest,
    'testResolveMultimodalTriggerDoesNotUsePoiFromAnotherPackage',
    'XunjingAppServiceImplTest.java'
  )
  assertContains(
    appTest,
    'testResolveMultimodalTriggerRecordsRecognitionEventWhenPackageProvided',
    'XunjingAppServiceImplTest.java'
  )
  assertContains(
    appTest,
    'testResolveMultimodalTriggerBuildsFallbackSceneUnderstandingWithoutClientSignals',
    'XunjingAppServiceImplTest.java'
  )
  assertContains(
    appTest,
    'testResolveMultimodalTriggerNoMatchKeepsVisionEvidenceInSceneUnderstanding',
    'XunjingAppServiceImplTest.java'
  )
  assertContains(
    appTest,
    'testResolveMultimodalTriggerHydratesExecutedAgentActionIntoContinuousContext',
    'XunjingAppServiceImplTest.java'
  )
  assertContains(
    appTest,
    'testAnswerHydratesSceneUnderstandingFromPreviousTriggerEvent',
    'XunjingAppServiceImplTest.java'
  )
  assertContains(
    appTest,
    'testResolveMultimodalTriggerExposesSceneUnderstandingContract',
    'XunjingAppServiceImplTest.java'
  )
  assertContains(appTest, 'xicheng-gongwangfu', 'XunjingAppServiceImplTest.java')
  assertContains(h2Schema, 'CREATE TABLE IF NOT EXISTS "xunjing_poi"', 'create_tables.sql')
  return pass(
    'xicheng-trigger-backend',
    'Xicheng trigger resolution reads package-scoped approved xunjing_poi rows and records TRIGGER_RESOLVE events'
  )
}

async function checkXichengAiSourceGuardBackend(rootDir) {
  const appService = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
  )
  const appTest = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java'
  )
  for (const snippet of [
    'filterSourcesByPoiContext',
    'hasPoiSourceConstraint',
    'sourceMatchesPoiContext',
    'buildNoSourceBlockedResponse',
    'recordNoSourceBlockedAiGeneration'
  ]) {
    assertContains(appService, snippet, 'XunjingAppServiceImpl.java')
  }
  assertContains(
    appTest,
    'testAnswerBlocksWhenReviewedSourcesDoNotMatchXichengPoiContext',
    'XunjingAppServiceImplTest.java'
  )
  return pass(
    'xicheng-ai-source-guard-backend',
    'Xicheng AI chat blocks when reviewed sources do not match the requested POI context'
  )
}

async function checkXichengAppEventBackend(rootDir) {
  const appService = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
  )
  const consoleVo = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/admin/console/vo/XunjingConsoleVO.java'
  )
  const consoleService = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/console/XunjingConsoleServiceImpl.java'
  )
  const consoleTest = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/console/XunjingConsoleServiceImplTest.java'
  )
  const enums = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/enums/XunjingEnums.java'
  )
  const appTest = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java'
  )
  for (const snippet of [
    'resolveAppEventQrCode(reqVO, hasText(reqVO.getPackageCode()))',
    'buildAppEventPayload',
    'EventType.AGENT_ACTION',
    'buildAgentActionEventPayload',
    'sanitizeAgentActionClientPayload',
    'payload.put("agentAction", buildAgentActionEventPayload(clientPayloadObject))',
    'hydrateVisionAgentContextFromPreviousAgentAction(resourcePackage, reqVO, explicitChatTargetContext)',
    'shouldUsePreviousAgentActionForChatContext(previousAgentActionEvent, previousAskEvent, previousTriggerEvent)',
    'hasExplicitChatTargetContext(reqVO)',
    'EventType.AGENT_ACTION.getType()',
    'JsonNode agentAction = root.path("agentAction")',
    'buildAgentActionServiceHandoffSummary(agentAction)'
  ]) {
    assertContains(appService, snippet, 'XunjingAppServiceImpl.java')
  }
  for (const snippet of [
    'private Long triggerResolveCount;',
    'private Long agentActionCount;',
    'private BigDecimal agentActionConversionRate;',
    'private Long totalTriggerResolveCount;',
    'private Long totalAgentActionCount;',
    'class AgentActionMetricRespVO',
    'private List<AgentActionMetricRespVO> topAgentActions;',
    'class AgentActionPoiFunnelRespVO',
    'private List<AgentActionPoiFunnelRespVO> agentActionPoiFunnels;',
    'private BigDecimal conversionRate;',
    'class AgentActionTimeWindowRespVO',
    'private List<AgentActionTimeWindowRespVO> agentActionTimeWindows;',
    'private String windowKey;',
    'private String windowLabel;',
    'private Long executionCount;',
    'private BigDecimal shareRate;'
  ]) {
    assertContains(consoleVo, snippet, 'XunjingConsoleVO.java')
  }
  for (const snippet of [
    'calculateAgentActionConversionRate',
    'buildTopAgentActionMetrics',
    'buildAgentActionPoiFunnels',
    'buildAgentActionTimeWindows',
    'agentActionWindow',
    'eventInWindow',
    'recordPoiFunnelTriggerResolve',
    'recordPoiFunnelAgentAction',
    'selectListByPackageIdsAndEventType',
    'agentActionText',
    'EventType.TRIGGER_RESOLVE.getType()',
    'EventType.AGENT_ACTION.getType()',
    '\\"triggerResolveCount\\":',
    '\\"agentActionCount\\":',
    '\\"agentActionConversionRate\\":'
  ]) {
    assertContains(consoleService, snippet, 'XunjingConsoleServiceImpl.java')
  }
  assertContains(enums, 'ERROR_FEEDBACK("ERROR_FEEDBACK")', 'XunjingEnums.java')
  assertContains(enums, 'AGENT_ACTION("AGENT_ACTION")', 'XunjingEnums.java')
  assertContains(appTest, 'testRecordAppErrorFeedbackEventKeepsXichengContext', 'XunjingAppServiceImplTest.java')
  assertContains(
    appTest,
    'testRecordAgentActionEventStoresStructuredTelemetryWithoutRawImagePayload',
    'XunjingAppServiceImplTest.java'
  )
  assertContains(
    appTest,
    'testAnswerHydratesExecutedAgentActionFromPreviousAgentActionEvent',
    'XunjingAppServiceImplTest.java'
  )
  assertContains(
    appTest,
    'testAnswerDoesNotLetOlderAgentActionOverrideNewerTriggerContext',
    'XunjingAppServiceImplTest.java'
  )
  assertContains(
    appTest,
    'testAnswerKeepsExplicitPoiContextAheadOfPreviousTriggerAndAgentAction',
    'XunjingAppServiceImplTest.java'
  )
  assertContains(
    consoleTest,
    'testReadinessDashboardAndReportExposeAgentActionConversionMetrics',
    'XunjingConsoleServiceImplTest.java'
  )
  assertContains(
    consoleTest,
    'testDashboardRanksAgentActionExecutionsByActionIntentAndPoi',
    'XunjingConsoleServiceImplTest.java'
  )
  assertContains(
    consoleTest,
    'testDashboardBuildsPoiAgentActionFunnelFromTriggerAndActionEvents',
    'XunjingConsoleServiceImplTest.java'
  )
  assertContains(
    consoleTest,
    'testDashboardBuildsAgentActionTimeWindowFunnels',
    'XunjingConsoleServiceImplTest.java'
  )
  return pass(
    'xicheng-app-event-backend',
    'Xicheng APP events accept package-bound feedback and expose structured Agent action telemetry metrics'
  )
}

async function checkXunjingUploadBackend(rootDir) {
  const controller = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/admin/console/XunjingConsoleController.java'
  )
  const consoleVo = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/admin/console/vo/XunjingConsoleVO.java'
  )
  const service = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/console/XunjingConsoleService.java'
  )
  const serviceImpl = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/console/XunjingConsoleServiceImpl.java'
  )
  const consoleTest = await readText(
    rootDir,
    'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/console/XunjingConsoleServiceImplTest.java'
  )

  for (const snippet of [
    '@PostMapping(value = "/knowledge-documents/upload"',
    '@PostMapping(value = "/media-assets/upload"',
    'MediaType.MULTIPART_FORM_DATA_VALUE',
    'consoleService.uploadKnowledgeDocument(reqVO)',
    'consoleService.uploadMediaAsset(reqVO)'
  ]) {
    assertContains(controller, snippet, 'XunjingConsoleController.java')
  }
  for (const snippet of [
    'class KnowledgeDocumentUploadReqVO',
    'class MediaAssetUploadReqVO',
    'private MultipartFile file;'
  ]) {
    assertContains(consoleVo, snippet, 'XunjingConsoleVO.java')
  }
  for (const snippet of [
    'Long uploadKnowledgeDocument(KnowledgeDocumentUploadReqVO reqVO);',
    'Long uploadMediaAsset(MediaAssetUploadReqVO reqVO);'
  ]) {
    assertContains(service, snippet, 'XunjingConsoleService.java')
  }
  for (const snippet of [
    'private FileApi fileApi;',
    'requireFileApi().createFile(content, fileName, directory, file.getContentType())',
    'uploadDirectory("xunjing/tourism-knowledge", reqVO.getPackageId())',
    'uploadDirectory("xunjing/tourism-media", reqVO.getPackageId())',
    'buildKnowledgeUploadDigest(file, content)',
    'ReviewStatus.PENDING.getStatus()',
    'VectorStatus.PENDING.getStatus()',
    'CopyrightStatus.PENDING.getStatus()'
  ]) {
    assertContains(serviceImpl, snippet, 'XunjingConsoleServiceImpl.java')
  }
  for (const snippet of [
    'testUploadKnowledgeDocumentStoresFileAndCreatesPendingTourismDocument',
    'testUploadMediaAssetStoresFileAndCreatesPendingImageMaterial',
    'fileApi.createFile'
  ]) {
    assertContains(consoleTest, snippet, 'XunjingConsoleServiceImplTest.java')
  }
  return pass(
    'xunjing-upload-backend',
    'Tourism knowledge documents and media assets can enter the backend through FileApi-backed upload endpoints'
  )
}

async function checkAdminUiContract(rootDir) {
  const api = await readText(
    rootDir,
    'backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xunjing/console/index.ts'
  )
  const view = await readText(
    rootDir,
    'backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xunjing/console/index.vue'
  )
  for (const snippet of [
    'getReadiness',
    'getDashboard',
    'getAiGenerationLogPage',
    'createKnowledgeDocument',
    'uploadKnowledgeDocument',
    'createMediaAsset',
    'uploadMediaAsset'
  ]) {
    assertContains(api, snippet, 'xunjing console API')
  }
  for (const snippet of [
    'XunjingConsole',
    '资料导入审核',
    '图影中华素材',
    '新增文旅资料',
    '新增图片素材',
    '上传文旅资料文件',
    '上传图片素材文件'
  ]) {
    assertContains(view, snippet, 'xunjing console view')
  }
  return pass('admin-ui-contract', 'Yudao admin console route and API contract are present')
}

function checkEnvironment(env) {
  for (const key of requiredEnvKeys) {
    requireValue(env, key)
  }
  rejectUpstreamReuse(env)
  return pass('environment', 'staging environment is isolated and complete')
}

async function fetchJson(url, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(url, options)
  const body = await response.text()
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`)
  }
  return JSON.parse(body)
}

function tenantHeaders(tenantId, extraHeaders = {}) {
  return {
    ...extraHeaders,
    'tenant-id': String(tenantId)
  }
}

async function checkLiveAdmin(baseUrl, fetchImpl) {
  const response = await fetchImpl(new URL('/admin/', baseUrl))
  const body = await response.text()
  if (!response.ok || !body.includes('星河寻境')) {
    throw new Error('/admin/ does not expose the Xinghe Xunjing admin console')
  }
  return pass('live-admin', 'admin console is reachable')
}

async function checkLiveResourcePackage(baseUrl, fetchImpl, tenantId) {
  await fetchLiveResourcePackageData(baseUrl, fetchImpl, tenantId)
  return pass('live-resource-package', 'Kashgar resource package endpoint is reachable')
}

async function checkLiveScanResolve(baseUrl, fetchImpl, tenantId) {
  const json = await fetchJson(
    new URL('/app-api/xunjing/scan/resolve', baseUrl),
    {
      method: 'POST',
      headers: tenantHeaders(tenantId, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        sceneCode: 'QR-KASHGAR-MAP-001',
        userTraceId: 'platform-readiness-scan-check'
      })
    },
    fetchImpl
  )
  if (
    json.code !== 0 ||
    json.data?.packageCode !== 'KASHGAR-MAP-001' ||
    json.data?.sceneCode !== 'QR-KASHGAR-MAP-001' ||
    !String(json.data?.targetPath || '').includes('packageCode=KASHGAR-MAP-001')
  ) {
    throw new Error('scan resolve endpoint did not return the Kashgar map target')
  }
  return pass('live-scan-resolve', 'Kashgar QR scene resolves to the APP target path')
}

async function checkLiveXichengScanResolve(baseUrl, fetchImpl, tenantId) {
  const json = await fetchJson(
    new URL('/app-api/xunjing/scan/resolve', baseUrl),
    {
      method: 'POST',
      headers: tenantHeaders(tenantId, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        sceneCode: 'QR-XICHENG-MAP-001',
        userTraceId: 'platform-readiness-xicheng-scan-check'
      })
    },
    fetchImpl
  )
  if (
    json.code !== 0 ||
    json.data?.packageCode !== 'XICHENG-MAP-001' ||
    json.data?.sceneCode !== 'QR-XICHENG-MAP-001' ||
    !String(json.data?.targetPath || '').includes('packageCode=XICHENG-MAP-001') ||
    !String(json.data?.targetPath || '').includes('sceneCode=QR-XICHENG-MAP-001')
  ) {
    throw new Error('scan resolve endpoint did not return the Xicheng map target')
  }
  return pass('live-xicheng-scan-resolve', 'Xicheng QR scene resolves to the APP target path', {
    endpoint: '/app-api/xunjing/scan/resolve',
    tenantId: String(tenantId),
    packageCode: json.data.packageCode,
    sceneCode: json.data.sceneCode,
    targetPath: json.data.targetPath
  })
}

async function checkLiveXichengErrorFeedback(baseUrl, fetchImpl, tenantId) {
  const json = await fetchJson(
    new URL('/app-api/xunjing/resource/events', baseUrl),
    {
      method: 'POST',
      headers: tenantHeaders(tenantId, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        packageCode: 'XICHENG-MAP-001',
        sceneCode: 'xicheng-ai-guide',
        eventType: 'ERROR_FEEDBACK',
        sourceChannel: 'platform-readiness',
        userTraceId: 'platform-readiness-xicheng-error-feedback',
        payloadJson: JSON.stringify({
          category: 'ocr_no_match',
          message: '无法识别当前位置',
          poiCode: 'xicheng-unknown',
          severity: 'WARN'
        })
      })
    },
    fetchImpl
  )
  if (json.code !== 0 || !json.data) {
    throw new Error('/app-api/xunjing/resource/events did not record Xicheng ERROR_FEEDBACK')
  }
  return pass('live-xicheng-error-feedback', 'Xicheng APP error feedback event is accepted with package attribution', {
    endpoint: '/app-api/xunjing/resource/events',
    tenantId: String(tenantId),
    packageCode: 'XICHENG-MAP-001',
    sceneCode: 'xicheng-ai-guide',
    eventType: 'ERROR_FEEDBACK',
    eventId: json.data
  })
}

async function checkLiveXichengTrigger(baseUrl, fetchImpl, tenantId, smokeCase) {
  const json = await fetchJson(
    new URL('/app-api/xunjing/triggers/resolve', baseUrl),
    {
      method: 'POST',
      headers: tenantHeaders(tenantId, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(smokeCase.payload)
    },
    fetchImpl
  )
  if (
    json.code !== 0 ||
    json.data?.packageCode !== 'XICHENG-MAP-001' ||
    json.data?.regionCode !== 'beijing-xicheng' ||
    json.data?.poiCode !== smokeCase.poiCode ||
    json.data?.poiName !== smokeCase.poiName ||
    Number(json.data?.confidence || 0) < 0.85 ||
    json.data?.requiresUserConfirm !== false ||
    !String(json.data?.targetPath || '').includes(`poiCode=${smokeCase.poiCode}`) ||
    !String(json.data?.targetPath || '').includes('packageCode=XICHENG-MAP-001')
  ) {
    throw new Error(`/app-api/xunjing/triggers/resolve did not resolve ${smokeCase.poiCode}`)
  }
  if (!Array.isArray(json.data.sources) || json.data.sources.length === 0) {
    throw new Error(`/app-api/xunjing/triggers/resolve did not return sources for ${smokeCase.poiCode}`)
  }
  return pass(smokeCase.name, smokeCase.detail, {
    endpoint: '/app-api/xunjing/triggers/resolve',
    tenantId: String(tenantId),
    packageCode: json.data.packageCode,
    regionCode: json.data.regionCode,
    poiCode: json.data.poiCode,
    poiName: json.data.poiName,
    confidence: Number(json.data.confidence),
    requiresUserConfirm: json.data.requiresUserConfirm,
    sourceCount: json.data.sources.length,
    targetPath: json.data.targetPath
  })
}

function assertXichengAiChatContextEcho(data, expected) {
  if (
    data?.packageCode !== expected.packageCode ||
    data?.sceneCode !== expected.sceneCode ||
    data?.regionCode !== expected.regionCode ||
    data?.poiCode !== expected.poiCode ||
    data?.poiName !== expected.poiName
  ) {
    throw new Error('/app-api/xunjing/ai/chat did not echo Xicheng POI context')
  }
}

async function checkLiveXichengAiChatSourced(baseUrl, fetchImpl, tenantId) {
  const expectedContext = {
    packageCode: 'XICHENG-MAP-001',
    sceneCode: 'xicheng-ai-guide',
    regionCode: 'beijing-xicheng',
    poiCode: 'xicheng-baitasi',
    poiName: '妙应寺白塔'
  }
  const json = await fetchJson(
    new URL('/app-api/xunjing/ai/chat', baseUrl),
    {
      method: 'POST',
      headers: tenantHeaders(tenantId, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        ...expectedContext,
        question: '白塔寺为什么重要？',
        userTraceId: 'platform-readiness-xicheng-ai-sourced'
      })
    },
    fetchImpl
  )
  const passedSafetyStatuses = new Set(['PASS', 'PASSED'])
  if (json.code !== 0 || !json.data?.answer || !passedSafetyStatuses.has(json.data?.safetyStatus)) {
    throw new Error('/app-api/xunjing/ai/chat did not return a sourced Xicheng POI answer')
  }
  assertXichengAiChatContextEcho(json.data, expectedContext)
  if (!Array.isArray(json.data.sources) || json.data.sources.length === 0) {
    throw new Error('/app-api/xunjing/ai/chat did not return sources for Xicheng POI answer')
  }
  const sourceText = json.data.sources
    .map((source) => `${source.title || ''}\n${source.contentDigest || ''}\n${source.sourceUrl || ''}`)
    .join('\n')
  if (!sourceText.includes('妙应寺白塔') && !sourceText.includes('xicheng-baitasi')) {
    throw new Error('/app-api/xunjing/ai/chat returned sources that do not match xicheng-baitasi')
  }
  if (!json.data.logId) {
    throw new Error('/app-api/xunjing/ai/chat did not return logId for Xicheng POI answer')
  }
  return pass('live-xicheng-ai-chat-sourced', 'Xicheng AI chat returns a safe answer with matching POI sources', {
    endpoint: '/app-api/xunjing/ai/chat',
    tenantId: String(tenantId),
    packageCode: json.data.packageCode,
    sceneCode: json.data.sceneCode,
    regionCode: json.data.regionCode,
    poiCode: json.data.poiCode,
    poiName: json.data.poiName,
    contextEcho: true,
    safetyStatus: json.data.safetyStatus,
    sourceCount: json.data.sources.length,
    logId: json.data.logId
  })
}

async function checkLiveXichengAiChatBlocked(baseUrl, fetchImpl, tenantId) {
  const expectedContext = {
    packageCode: 'XICHENG-MAP-001',
    sceneCode: 'xicheng-ai-guide',
    regionCode: 'beijing-xicheng',
    poiCode: 'xicheng-source-guard-negative',
    poiName: '来源门禁测试点位'
  }
  const json = await fetchJson(
    new URL('/app-api/xunjing/ai/chat', baseUrl),
    {
      method: 'POST',
      headers: tenantHeaders(tenantId, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        ...expectedContext,
        question: '请讲讲这个测试点位。',
        userTraceId: 'platform-readiness-xicheng-ai-blocked'
      })
    },
    fetchImpl
  )
  if (
    json.code !== 0 ||
    json.data?.safetyStatus !== 'BLOCKED' ||
    !json.data?.answer ||
    (Array.isArray(json.data?.sources) && json.data.sources.length > 0) ||
    !json.data?.logId
  ) {
    throw new Error('/app-api/xunjing/ai/chat did not block Xicheng POI answer without matching sources')
  }
  assertXichengAiChatContextEcho(json.data, expectedContext)
  return pass('live-xicheng-ai-chat-blocked', 'Xicheng AI chat blocks when no matching POI source is available', {
    endpoint: '/app-api/xunjing/ai/chat',
    tenantId: String(tenantId),
    packageCode: json.data.packageCode,
    sceneCode: json.data.sceneCode,
    regionCode: json.data.regionCode,
    poiCode: json.data.poiCode,
    poiName: json.data.poiName,
    contextEcho: true,
    safetyStatus: json.data.safetyStatus,
    sourceCount: Array.isArray(json.data.sources) ? json.data.sources.length : 0,
    logId: json.data.logId
  })
}

async function fetchLiveResourcePackageData(baseUrl, fetchImpl, tenantId) {
  const json = await fetchJson(
    new URL('/app-api/xunjing/resource/package?packageCode=KASHGAR-MAP-001', baseUrl),
    { headers: tenantHeaders(tenantId) },
    fetchImpl
  )
  if (json.code !== 0 || json.data?.packageCode !== 'KASHGAR-MAP-001') {
    throw new Error('resource package endpoint did not return KASHGAR-MAP-001')
  }
  return json.data
}

async function checkLivePublicReport(baseUrl, fetchImpl, tenantId) {
  const json = await fetchJson(
    new URL('/app-api/xunjing/public-report/summary?packageCode=KASHGAR-MAP-001', baseUrl),
    { headers: tenantHeaders(tenantId) },
    fetchImpl
  )
  if (json.code !== 0 || json.data?.p0Ready !== true) {
    throw new Error('public report endpoint is not P0 ready')
  }
  return pass('live-public-report', 'public report summary is P0 ready')
}

async function checkLiveResourceEvent(baseUrl, fetchImpl, tenantId) {
  const json = await fetchJson(
    new URL('/app-api/xunjing/resource/events', baseUrl),
    {
      method: 'POST',
      headers: tenantHeaders(tenantId, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        packageCode: 'KASHGAR-MAP-001',
        sceneCode: 'QR-KASHGAR-MAP-001',
        eventType: 'VIEW',
        sourceChannel: 'platform-readiness',
        userTraceId: 'platform-readiness-check',
        payloadJson: JSON.stringify({ check: 'resource-event' })
      })
    },
    fetchImpl
  )
  if (json.code !== 0 || !json.data) {
    throw new Error('resource event endpoint did not create an event')
  }
  return pass('live-resource-event', 'resource event endpoint accepts packageCode or sceneCode attribution')
}

async function checkLiveMediaUsage(baseUrl, fetchImpl, tenantId) {
  const resourcePackage = await fetchLiveResourcePackageData(baseUrl, fetchImpl, tenantId)
  const mediaId = resourcePackage.mediaAssets?.[0]?.id
  if (!mediaId) {
    throw new Error('resource package endpoint did not return a public media asset for MEDIA_USE check')
  }
  const json = await fetchJson(
    new URL('/app-api/xunjing/resource/events', baseUrl),
    {
      method: 'POST',
      headers: tenantHeaders(tenantId, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        packageCode: 'KASHGAR-MAP-001',
        sceneCode: 'QR-KASHGAR-MAP-001',
        eventType: 'MEDIA_USE',
        sourceChannel: 'platform-readiness',
        userTraceId: 'platform-readiness-media-check',
        payloadJson: JSON.stringify({
          mediaId,
          usageType: 'READINESS_CHECK',
          placement: 'platform-readiness'
        })
      })
    },
    fetchImpl
  )
  if (json.code !== 0 || !json.data) {
    throw new Error('resource media usage event did not create a usage log')
  }
  return pass('live-media-usage', 'MEDIA_USE event accepts a public media asset and records usage')
}

async function checkLiveAiChat(baseUrl, fetchImpl, tenantId) {
  return await checkLiveSourcedQuestion(baseUrl, fetchImpl, tenantId, {
    path: '/app-api/xunjing/ai/chat',
    packageCode: 'KASHGAR-MAP-001',
    question: '喀什古城适合如何研学讲解？',
    name: 'live-ai-chat',
    detail: 'AI chat endpoint returns a safe sourced answer'
  })
}

async function checkLiveReadingAsk(baseUrl, fetchImpl, tenantId) {
  return await checkLiveSourcedQuestion(baseUrl, fetchImpl, tenantId, {
    path: '/app-api/xunjing/reading/ask',
    packageCode: 'KASHGAR-BOOK-001',
    qrSceneCode: 'QR-KASHGAR-BOOK-001',
    sceneCode: 'reading-ask',
    question: '这本喀什古城少年读本适合怎样伴读？',
    name: 'live-reading-ask',
    detail: 'reading companion endpoint returns a safe sourced answer'
  })
}

async function checkLiveMapExplain(baseUrl, fetchImpl, tenantId) {
  return await checkLiveSourcedQuestion(baseUrl, fetchImpl, tenantId, {
    path: '/app-api/xunjing/map/explain',
    packageCode: 'KASHGAR-MAP-001',
    qrSceneCode: 'QR-KASHGAR-MAP-001',
    sceneCode: 'map-explain',
    question: '请用研学地图讲解喀什古城入口。',
    name: 'live-map-explain',
    detail: 'map explanation endpoint returns a safe sourced answer'
  })
}

async function checkLiveGlobeExplain(baseUrl, fetchImpl, tenantId) {
  return await checkLiveSourcedQuestion(baseUrl, fetchImpl, tenantId, {
    path: '/app-api/xunjing/globe/explain',
    packageCode: 'KASHGAR-GLOBE-001',
    qrSceneCode: 'QR-KASHGAR-GLOBE-001',
    sceneCode: 'globe-explain',
    question: '请用地球仪节点解释喀什的丝路位置。',
    name: 'live-globe-explain',
    detail: 'globe explanation endpoint returns a safe sourced answer'
  })
}

async function checkLiveSourcedQuestion(baseUrl, fetchImpl, tenantId, {
  path: requestPath,
  packageCode,
  qrSceneCode,
  sceneCode,
  question,
  name,
  detail
}) {
  const json = await fetchJson(
    new URL(requestPath, baseUrl),
    {
      method: 'POST',
      headers: tenantHeaders(tenantId, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        packageCode,
        qrSceneCode,
        sceneCode,
        question
      })
    },
    fetchImpl
  )
  const passedSafetyStatuses = new Set(['PASS', 'PASSED'])
  if (json.code !== 0 || !json.data?.answer || !passedSafetyStatuses.has(json.data?.safetyStatus)) {
    throw new Error(`${requestPath} did not return a safe sourced answer`)
  }
  if (!Array.isArray(json.data.sources) || json.data.sources.length === 0) {
    throw new Error(`${requestPath} did not return sources`)
  }
  return pass(name, detail)
}

export async function loadEnvFile(envPath) {
  const text = await readFile(envPath, 'utf8')
  const env = {}

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const equalIndex = line.indexOf('=')
    if (equalIndex === -1) {
      continue
    }

    const key = line.slice(0, equalIndex).trim()
    let value = line.slice(equalIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }

  return env
}

export async function verifyXunjingPlatformReadiness({
  env = process.env,
  baseUrl,
  includeAiCheck = false,
  includeXichengAppCheck = false,
  includeXichengTriggerCheck = false,
  includeWriteCheck = false,
  skipAdminCheck = false,
  staticOnly = false,
  tenantId,
  rootDir = process.cwd(),
  fetchImpl = fetch
} = {}) {
  const checks = []

  checks.push(await checkStaticFiles(rootDir))
  checks.push(await checkSqlSchema(rootDir))
  checks.push(await checkSeedData(rootDir))
  checks.push(await checkXichengSeedData(rootDir))
  checks.push(await checkXichengPoiSeedQuality(rootDir))
  checks.push(await checkXichengTriggerBackend(rootDir))
  checks.push(await checkXichengAiSourceGuardBackend(rootDir))
  checks.push(await checkXichengAppEventBackend(rootDir))
  checks.push(await checkXunjingUploadBackend(rootDir))
  checks.push(await checkAdminUiContract(rootDir))
  if (!staticOnly) {
    checks.push(checkEnvironment(env))
  }

  if (baseUrl && !staticOnly) {
    const liveTenantId = tenantId || env.XUNJING_TENANT_ID || '1'
    if (!skipAdminCheck) {
      checks.push(await checkLiveAdmin(baseUrl, fetchImpl))
    }
    checks.push(await checkLiveResourcePackage(baseUrl, fetchImpl, liveTenantId))
    checks.push(await checkLiveScanResolve(baseUrl, fetchImpl, liveTenantId))
    if (includeXichengAppCheck) {
      checks.push(await checkLiveXichengScanResolve(baseUrl, fetchImpl, liveTenantId))
      checks.push(await checkLiveXichengErrorFeedback(baseUrl, fetchImpl, liveTenantId))
      checks.push(await checkLiveXichengAiChatSourced(baseUrl, fetchImpl, liveTenantId))
      checks.push(await checkLiveXichengAiChatBlocked(baseUrl, fetchImpl, liveTenantId))
    }
    if (includeXichengTriggerCheck) {
      for (const smokeCase of xichengTriggerSmokeCases) {
        checks.push(await checkLiveXichengTrigger(baseUrl, fetchImpl, liveTenantId, smokeCase))
      }
    }
    checks.push(await checkLivePublicReport(baseUrl, fetchImpl, liveTenantId))
    if (includeWriteCheck) {
      checks.push(await checkLiveResourceEvent(baseUrl, fetchImpl, liveTenantId))
      checks.push(await checkLiveMediaUsage(baseUrl, fetchImpl, liveTenantId))
    }
    if (includeAiCheck) {
      checks.push(await checkLiveAiChat(baseUrl, fetchImpl, liveTenantId))
      checks.push(await checkLiveReadingAsk(baseUrl, fetchImpl, liveTenantId))
      checks.push(await checkLiveMapExplain(baseUrl, fetchImpl, liveTenantId))
      checks.push(await checkLiveGlobeExplain(baseUrl, fetchImpl, liveTenantId))
    }
  }

  return {
    artifactType: 'xunjing-platform-readiness',
    ok: checks.every((check) => check.ok),
    checkedAt: new Date().toISOString(),
    summary: {
      baseUrl,
      tenantId: tenantId || env.XUNJING_TENANT_ID || undefined,
      staticOnly,
      skipAdminCheck,
      includeAiCheck,
      includeXichengAppCheck,
      includeXichengTriggerCheck,
      ...(includeXichengAppCheck || includeXichengTriggerCheck
        ? {
            xichengRegionCode: 'beijing-xicheng',
            xichengPackageCode: 'XICHENG-MAP-001'
          }
        : {}),
      includeWriteCheck,
      totalChecks: checks.length,
      passedChecks: checks.filter((check) => check.ok).length,
      failedChecks: checks.filter((check) => !check.ok).length
    },
    checks
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
  const envFile = readArgValue(args, '--env-file') || process.env.XUNJING_ENV_FILE
  const env = envFile
    ? { ...process.env, ...await loadEnvFile(envFile) }
    : process.env
  const staticOnly = args.includes('--static') || process.env.XUNJING_STATIC_ONLY === '1'
  const rootDir = path.resolve(readArgValue(args, '--root') || process.cwd())
  const result = await verifyXunjingPlatformReadiness({
    env,
    baseUrl: readArgValue(args, '--base-url') || process.env.XUNJING_BASE_URL || undefined,
    includeAiCheck: args.includes('--include-ai-check') || process.env.XUNJING_INCLUDE_AI_CHECK === '1',
    includeXichengAppCheck: args.includes('--include-xicheng-app-check')
      || process.env.XUNJING_INCLUDE_XICHENG_APP_CHECK === '1',
    includeXichengTriggerCheck: args.includes('--include-xicheng-trigger-check')
      || process.env.XUNJING_INCLUDE_XICHENG_TRIGGER_CHECK === '1',
    includeWriteCheck: args.includes('--include-write-check') || process.env.XUNJING_INCLUDE_WRITE_CHECK === '1',
    skipAdminCheck: args.includes('--skip-admin-check') || process.env.XUNJING_SKIP_ADMIN_CHECK === '1',
    staticOnly,
    tenantId: readArgValue(args, '--tenant-id') || env.XUNJING_TENANT_ID || undefined,
    rootDir
  })
  await writeEvidence({
    rootDir,
    evidenceFile: readArgValue(args, '--evidence-file') || readArgValue(args, '--output'),
    report: result
  })
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) {
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
