import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const backendOnlyPaths = [
  'package.json',
  'scripts/verify-ai-shijing-p0-backend-loop.mjs',
  'scripts/xunjing-app-api-contract.test.mjs',
  'scripts/xicheng-backend-launch-readiness.test.mjs',
  'scripts/verify-xunjing-platform-readiness.mjs',
  'scripts/verify-xicheng-yudao-release-readiness.mjs',
  'scripts/verify-xicheng-vision-ocr-smoke.mjs',
  'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/AppXunjingController.java',
  'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java',
  'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppService.java',
  'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java',
  'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingMultimodalTriggerEngine.java',
  'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingVisionRecognitionService.java',
  'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/dal/mysql/event/XunjingInteractionEventMapper.java',
  'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/dal/mysql/poi/XunjingPoiMapper.java',
  'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java',
  'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingVisionRecognitionServiceTest.java'
]

const uiPathPrefixes = [
  'src/',
  'app/',
  'apps/',
  'frontend/',
  'miniapp/',
  'web/',
  'product/'
]

async function readText(path) {
  return await readFile(resolve(rootDir, path), 'utf8')
}

function readGitValue(args) {
  try {
    return execFileSync('git', args, { cwd: rootDir, encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

function hasAll(text, snippets) {
  return snippets.filter((snippet) => !text.includes(snippet))
}

function verifyBackendLoop(files) {
  const requirements = [
    {
      requirementId: 'vision-ocr-status',
      title: '真实 Vision/OCR 接入状态可查询且不泄露密钥',
      evidence: [
        checkSnippets(files.controller, 'AppXunjingController.java', [
          '@GetMapping("/vision/provider/status")',
          'appService.getVisionProviderStatus()'
        ]),
        checkSnippets(files.appVo, 'XunjingAppVO.java', [
          'class VisionProviderStatusRespVO',
          'private Boolean providerConfigured;',
          'private Boolean endpointConfigured;',
          'private Boolean apiKeyConfigured;',
          'private String apiKeyFingerprint;',
          'private List<String> missingConfigKeys;',
          'private String productionEvidenceText;'
        ]),
        checkSnippets(files.visionService, 'XunjingVisionRecognitionService.java', [
          'VisionProviderStatusRespVO getProviderStatus()',
          'XUNJING_VISION_API_URL',
          'XUNJING_VISION_API_KEY',
          'fingerprintSecret',
          'missingConfigKeys',
          'provider_not_configured',
          'provider_http_error',
          'provider_error'
        ]),
        checkAbsent(files.visionService, 'XunjingVisionRecognitionService.java', [
          'setApiKey('
        ]),
        checkSnippets(files.visionSmoke, 'verify-xicheng-vision-ocr-smoke.mjs', [
          'artifactType: \'xicheng-vision-ocr-smoke\'',
          'XUNJING_VISION_API_URL',
          'XUNJING_VISION_API_KEY'
        ]),
        checkSnippets(files.visionTest, 'XunjingVisionRecognitionServiceTest.java', [
          'testGetProviderStatusReportsMissingConfigWithoutLeakingSecrets',
          'testGetProviderStatusReportsConfiguredFingerprintOnly'
        ])
      ]
    },
    {
      requirementId: 'scene-engine-context',
      title: 'Scene Engine 融合上下文可查询',
      evidence: [
        checkSnippets(files.controller, 'AppXunjingController.java', [
          '@GetMapping("/scene/context")',
          'appService.getVisionAgentSceneContext(packageCode, userTraceId, regionCode, poiCode, limit)'
        ]),
        checkSnippets(files.appVo, 'XunjingAppVO.java', [
          'class VisionAgentSceneContextRespVO',
          'private Boolean contextReady;',
          'private Map<String, Object> latestSceneSnapshot;',
          'private String actionDecisionSummary;',
          'private List<MultimodalAgentActionRespVO> actionDecisionQueue;',
          'private VisionAgentMemorySessionRespVO memorySession;',
          'private VisionAgentServiceHandoffTaskFeedRespVO serviceHandoff;',
          'private VisionAgentKnowledgeGraphRespVO knowledgeGraph;'
        ]),
        checkSnippets(files.appServiceImpl, 'XunjingAppServiceImpl.java', [
          'buildVisionAgentSceneContext(resourcePackage, userTraceId, regionCode, poiCode, limit)',
          'resolveSceneContextLatestScene',
          'buildSceneContextActionDecisionQueue(memorySession, latestScene)',
          'resolveSceneContextKnowledgeGraph',
          'buildSceneContextReady'
        ]),
        checkSnippets(files.triggerEngine, 'XunjingMultimodalTriggerEngine.java', [
          'gps_ocr_fused',
          'signals.contains("gps_radius") && signals.contains("ocr_alias")'
        ]),
        checkSnippets(files.appTest, 'XunjingAppServiceImplTest.java', [
          'testGetVisionAgentSceneContextBuildsSceneEngineContextPacket',
          'testResolveMultimodalTriggerAutoStartsWhenGpsAndOcrAgreeWithoutImageSignal',
          'getMatchedSignals().contains("gps_ocr_fused")'
        ])
      ]
    },
    {
      requirementId: 'server-memory-hydration',
      title: '下一次识境解析前由服务端按 userTraceId 回填连续记忆',
      evidence: [
        checkSnippets(files.appServiceImpl, 'XunjingAppServiceImpl.java', [
          'hydrateMultimodalTriggerMemoryFromPreviousResolve(reqVO)',
          'selectLatestVisionAgentMemoryEvent(resourcePackage, reqVO, EventType.TRIGGER_RESOLVE.getType())',
          'selectLatestVisionAgentMemoryEvent(resourcePackage, reqVO, EventType.ASK.getType())',
          'selectLatestVisionAgentMemoryEvent(resourcePackage, reqVO, EventType.AGENT_ACTION.getType())',
          'hydratePreviousTriggerRecentPoi(reqVO, poiCode)',
          'hydratePreviousTriggerSceneSignals(reqVO, root)',
          'hydratePreviousAskSceneSignals(reqVO, root, visionAgentContext)',
          'hydratePreviousAgentActionSceneSignals(reqVO, agentAction)',
          'hasFreshMultimodalTriggerSignal(reqVO)'
        ]),
        checkSnippets(files.eventMapper, 'XunjingInteractionEventMapper.java', [
          'selectLatestByPackageIdAndUserTraceIdAndEventType',
          'orderByDesc(XunjingInteractionEventDO::getId)',
          'last("LIMIT 1")'
        ]),
        checkSnippets(files.appTest, 'XunjingAppServiceImplTest.java', [
          'testResolveMultimodalTriggerHydratesContinuousContextFromPreviousTriggerEvent',
          'testResolveMultimodalTriggerHydratesContinuousContextFromPreviousAskEvent',
          'testResolveMultimodalTriggerHydratesExecutedAgentActionIntoContinuousContext',
          'testResolveMultimodalTriggerUsesLatestAskWhenItIsNewerThanPreviousTrigger',
          'getMatchedSignals().contains("context_poi")'
        ])
      ]
    },
    {
      requirementId: 'continuous-memory',
      title: '连续记忆按 userTraceId 汇总触发、问答和 Agent 事件',
      evidence: [
        checkSnippets(files.controller, 'AppXunjingController.java', [
          '@GetMapping("/memory/session")',
          'appService.getVisionAgentMemorySession(packageCode, userTraceId, limit)'
        ]),
        checkSnippets(files.appVo, 'XunjingAppVO.java', [
          'class VisionAgentMemorySessionRespVO',
          'private Integer sceneCount;',
          'private String poiTrailText;',
          'private String continuityCueText;',
          'private List<VisionAgentMemorySceneRespVO> scenes;'
        ]),
        checkSnippets(files.appServiceImpl, 'XunjingAppServiceImpl.java', [
          'buildVisionAgentMemorySession(resourcePackage, userTraceId, limit)',
          'EventType.TRIGGER_RESOLVE.getType()',
          'EventType.ASK.getType()',
          'EventType.AGENT_ACTION.getType()',
          'buildVisionAgentMemoryPoiTrailText',
          'buildVisionAgentMemoryContinuityCueText'
        ]),
        checkSnippets(files.eventMapper, 'XunjingInteractionEventMapper.java', [
          'selectListByPackageIdAndUserTraceIdAndEventTypes',
          'orderByAsc(XunjingInteractionEventDO::getId)'
        ]),
        checkSnippets(files.appTest, 'XunjingAppServiceImplTest.java', [
          'testGetVisionAgentMemorySessionBuildsContinuousSceneTimeline'
        ])
      ]
    },
    {
      requirementId: 'agent-decision-queue',
      title: 'Agent 决策队列包含排序、评分、推荐级别和真实系统边界',
      evidence: [
        checkSnippets(files.appVo, 'XunjingAppVO.java', [
          'class MultimodalAgentActionRespVO',
          'private Integer priorityRank;',
          'private Double decisionScore;',
          'private String recommendationLevel;',
          'private String realSystemStatus;',
          'private String productionEvidenceText;'
        ]),
        checkSnippets(files.triggerEngine, 'XunjingMultimodalTriggerEngine.java', [
          'rankAgentActions(actions, primaryAction, intent, sceneSignals)',
          'applyAgentActionDecisionMetadata(action, rank, primaryAction, intent, sceneSignals)',
          'calculateAgentActionDecisionScore(',
          'resolveAgentActionRecommendationLevel(',
          'resolveAgentActionRealSystemStatus(',
          'buildAgentActionProductionEvidenceText('
        ]),
        checkSnippets(files.appServiceImpl, 'XunjingAppServiceImpl.java', [
          'payload.put("priorityRank", action.getPriorityRank())',
          'payload.put("decisionScore", action.getDecisionScore())',
          'payload.put("recommendationLevel", truncateForEvent(action.getRecommendationLevel(), 50))',
          'payload.put("realSystemStatus", truncateForEvent(action.getRealSystemStatus(), 50))'
        ]),
        checkSnippets(files.appTest, 'XunjingAppServiceImplTest.java', [
          'testResolveMultimodalTriggerRanksAgentActionDecisionQueue',
          'getActionDecisionQueue()'
        ])
      ]
    },
    {
      requirementId: 'knowledge-graph',
      title: '知识图谱由城市 POI、话题和来源构成',
      evidence: [
        checkSnippets(files.controller, 'AppXunjingController.java', [
          '@GetMapping("/knowledge/graph")',
          'appService.getVisionAgentKnowledgeGraph(packageCode, regionCode, poiCode, limit)'
        ]),
        checkSnippets(files.appVo, 'XunjingAppVO.java', [
          'class VisionAgentKnowledgeGraphRespVO',
          'private List<VisionAgentKnowledgeGraphNodeRespVO> nodes;',
          'private List<VisionAgentKnowledgeGraphEdgeRespVO> edges;',
          'private List<SourceRespVO> sources;'
        ]),
        checkSnippets(files.appServiceImpl, 'XunjingAppServiceImpl.java', [
          'buildVisionAgentKnowledgeGraph(resourcePackage, regionCode, poiCode, limit)',
          'buildKnowledgeGraphAnchorNode',
          'buildKnowledgeGraphRelatedPoiNodes',
          'buildKnowledgeGraphTopicNodes',
          'buildKnowledgeGraphEdges',
          'buildKnowledgeGraphSources'
        ]),
        checkSnippets(files.poiMapper, 'XunjingPoiMapper.java', [
          'selectByPackageIdAndPoiCode'
        ]),
        checkSnippets(files.appTest, 'XunjingAppServiceImplTest.java', [
          'testGetVisionAgentKnowledgeGraphBuildsSourceBackedPoiTopicNetwork'
        ])
      ]
    },
    {
      requirementId: 'service-handoff-tasks',
      title: '服务交接任务只暴露真实系统边界，不伪造商家或票务结果',
      evidence: [
        checkSnippets(files.controller, 'AppXunjingController.java', [
          '@GetMapping("/service-handoff/tasks")',
          'appService.listVisionAgentServiceHandoffTasks(packageCode, userTraceId, limit)'
        ]),
        checkSnippets(files.appVo, 'XunjingAppVO.java', [
          'class VisionAgentServiceHandoffTaskFeedRespVO',
          'private Long realSystemRequiredTaskCount;',
          'private String realSystemBoundaryText;',
          'class VisionAgentServiceHandoffTaskRespVO',
          'private String realSystemStatus;',
          'private String handoffSummary;'
        ]),
        checkSnippets(files.appServiceImpl, 'XunjingAppServiceImpl.java', [
          'buildVisionAgentServiceHandoffTaskFeed(resourcePackage, userTraceId, limit)',
          'buildVisionAgentServiceHandoffTaskItem(event)',
          'resolveServiceHandoffRealSystemStatus',
          'SERVICE_HANDOFF_REAL_SYSTEM_BOUNDARY_TEXT'
        ]),
        checkAbsent(files.appServiceImpl, 'XunjingAppServiceImpl.java', [
          'couponCode',
          'ticketOrderNo'
        ]),
        checkSnippets(files.appTest, 'XunjingAppServiceImplTest.java', [
          'testListVisionAgentServiceHandoffTasksExposesRealSystemBoundary'
        ])
      ]
    },
    {
      requirementId: 'no-ui-scope',
      title: '本 verifier 只验证后端和门禁文件，不依赖 UI 文件',
      evidence: [
        checkBackendOnlyPaths()
      ]
    },
    {
      requirementId: 'no-fake-production-evidence',
      title: '生产证据只允许来自 release gate/smoke evidence，不用静态通过冒充上线',
      evidence: [
        checkSnippets(files.releaseReadiness, 'verify-xicheng-yudao-release-readiness.mjs', [
          'vision-ocr-service',
          'artifactType !== \'xicheng-vision-ocr-smoke\'',
          'PRODUCTION_READY_CANDIDATE',
          'NOT_READY'
        ]),
        checkSnippets(files.appServiceImpl, 'XunjingAppServiceImpl.java', [
          'buildNoSourceBlockedResponse',
          'AiSafetyStatus.BLOCKED.getStatus()',
          'SERVICE_HANDOFF_REAL_SYSTEM_BOUNDARY_TEXT'
        ]),
        checkAbsent(files.appServiceImpl, 'XunjingAppServiceImpl.java', [
          'payload.put("imageBase64"',
          'draft.put("imageBase64"'
        ])
      ]
    }
  ]

  return requirements.map((requirement) => {
    const missing = requirement.evidence.flatMap((item) => item.missing.map((snippet) => ({
      file: item.file,
      snippet
    })))
    return {
      requirementId: requirement.requirementId,
      title: requirement.title,
      ok: missing.length === 0,
      evidenceFiles: [...new Set(requirement.evidence.map((item) => item.file))],
      missing
    }
  })
}

function checkSnippets(text, file, snippets) {
  return {
    file,
    missing: hasAll(text, snippets)
  }
}

function checkAbsent(text, file, forbiddenSnippets) {
  return {
    file,
    missing: forbiddenSnippets
      .filter((snippet) => text.includes(snippet))
      .map((snippet) => `forbidden snippet present: ${snippet}`)
  }
}

function checkBackendOnlyPaths() {
  return {
    file: 'scripts/verify-ai-shijing-p0-backend-loop.mjs',
    missing: backendOnlyPaths
      .filter((path) => uiPathPrefixes.some((prefix) => path.startsWith(prefix)))
      .map((path) => `UI path is in backend verifier scope: ${path}`)
  }
}

async function loadFiles() {
  return {
    packageJson: await readText('package.json'),
    controller: await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/AppXunjingController.java'
    ),
    appVo: await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java'
    ),
    appService: await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppService.java'
    ),
    appServiceImpl: await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
    ),
    triggerEngine: await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingMultimodalTriggerEngine.java'
    ),
    visionService: await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingVisionRecognitionService.java'
    ),
    eventMapper: await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/dal/mysql/event/XunjingInteractionEventMapper.java'
    ),
    poiMapper: await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/dal/mysql/poi/XunjingPoiMapper.java'
    ),
    appTest: await readText(
      'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java'
    ),
    visionTest: await readText(
      'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingVisionRecognitionServiceTest.java'
    ),
    releaseReadiness: await readText('scripts/verify-xicheng-yudao-release-readiness.mjs'),
    visionSmoke: await readText('scripts/verify-xicheng-vision-ocr-smoke.mjs')
  }
}

async function main() {
  const files = await loadFiles()
  const requirements = verifyBackendLoop(files)
  const passedRequirements = requirements.filter((item) => item.ok).length
  const failedRequirements = requirements.length - passedRequirements
  const workingTreeStatus = readGitValue(['status', '--short'])
  const ok = failedRequirements === 0
  const result = {
    artifactType: 'ai-shijing-p0-backend-loop',
    ok,
    checkedAt: new Date().toISOString(),
    summary: {
      gitCommit: readGitValue(['rev-parse', 'HEAD']),
      branch: readGitValue(['branch', '--show-current']),
      workingTreeClean: workingTreeStatus.length === 0,
      workingTreeStatus: workingTreeStatus ? workingTreeStatus.split('\n') : [],
      backendOnly: true,
      productionEvidencePolicy: 'status and smoke evidence only; release gate remains authoritative',
      requirementCount: requirements.length,
      passedRequirements,
      failedRequirements
    },
    sourceFiles: backendOnlyPaths,
    requirements
  }
  console.log(JSON.stringify(result, null, 2))
  if (!ok) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    artifactType: 'ai-shijing-p0-backend-loop',
    ok: false,
    error: error.message
  }, null, 2))
  process.exitCode = 1
})
