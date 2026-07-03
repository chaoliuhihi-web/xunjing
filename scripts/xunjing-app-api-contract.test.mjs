import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function readText(path) {
  return await readFile(resolve(rootDir, path), 'utf8')
}

describe('xunjing app API contract', () => {
  test('public resource package endpoint uses app DTOs and service boundary', async () => {
    const controller = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/resource/AppXunjingResourceController.java'
    )
    const appVo = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java'
    )
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppService.java'
    )

    expect(controller).toContain('AppPackageDetailRespVO')
    expect(controller).toContain('appService.getPublicPackageDetail(packageCode)')
    expect(controller).not.toContain('XunjingConsoleService')
    expect(controller).not.toContain('controller.admin.console.vo')

    expect(appVo).toContain('class AppPackageDetailRespVO')
    expect(appVo).toContain('class AppKnowledgeDocumentRespVO')
    expect(appVo).toContain('class AppMediaAssetRespVO')
    expect(appVo).toContain('class AppMapPointRespVO')
    expect(appVo).toContain('class AppGlobeModelRespVO')

    expect(appService).toContain('AppPackageDetailRespVO getPublicPackageDetail(String packageCode)')
  })

  test('dedicated app explanation endpoints enforce resource type boundaries', async () => {
    const controller = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/AppXunjingController.java'
    )
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppService.java'
    )

    expect(controller).toContain('answerWithScene(reqVO, "reading-ask", ResourceType.BOOK.getType())')
    expect(controller).toContain('answerWithScene(reqVO, "map-explain", ResourceType.MAP.getType())')
    expect(controller).toContain('answerWithScene(reqVO, "globe-explain", ResourceType.GLOBE.getType())')
    expect(controller).toContain('appService.answerForResourceType(reqVO, expectedResourceType)')
    expect(appService).toContain('RagChatRespVO answerForResourceType(RagChatReqVO reqVO, String expectedResourceType)')
  })

  test('multimodal trigger endpoint exposes Xicheng field-test contract', async () => {
    const controller = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/AppXunjingController.java'
    )
    const appVo = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java'
    )
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppService.java'
    )
    const appServiceImpl = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
    )
    const triggerEngine = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingMultimodalTriggerEngine.java'
    )
    const visionService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingVisionRecognitionService.java'
    )

    expect(controller).toContain('@PostMapping("/triggers/resolve")')
    expect(controller).toContain('MultimodalTriggerReqVO')
    expect(controller).toContain('appService.resolveMultimodalTrigger(reqVO)')
    expect(appVo).toContain('class MultimodalTriggerReqVO')
    expect(appVo).toContain('class LocationPointReqVO')
    expect(appVo).toContain('class PhotoMetaReqVO')
    expect(appVo).toContain('imageMimeType')
    expect(appVo).toContain('imageWidth')
    expect(appVo).toContain('imageHeight')
    expect(appVo).toContain('imageBase64')
    expect(appVo).toContain('class MultimodalTriggerRespVO')
    expect(appVo).toContain('private String packageCode;')
    expect(appVo).toContain('private List<String> suggestedQuestions;')
    expect(appVo).toContain('private List<SourceRespVO> sources;')
    expect(appVo).toContain('private List<MultimodalAgentActionRespVO> agentActions;')
    expect(appVo).toContain('class MultimodalAgentActionRespVO')
    expect(appVo).toContain('private Integer priorityRank;')
    expect(appVo).toContain('private Double decisionScore;')
    expect(appVo).toContain('private String recommendationLevel;')
    expect(appVo).toContain('private String realSystemStatus;')
    expect(appVo).toContain('private String productionEvidenceText;')
    expect(appVo).toContain('class MultimodalCandidateRespVO')
    expect(appVo).toContain('imageLabels')
    expect(appVo).toContain('ocrText')
    expect(appVo).toContain('requiresUserConfirm')
    expect(appService).toContain('MultimodalTriggerRespVO resolveMultimodalTrigger(MultimodalTriggerReqVO reqVO)')
    expect(triggerEngine).toContain('XunjingVisionRecognitionService')
    expect(triggerEngine).toContain('visionRecognitionService.enrich')
    expect(triggerEngine).toContain('REGION_XICHENG')
    expect(triggerEngine).toContain('AUTO_TRIGGER_THRESHOLD = 0.85D')
    expect(triggerEngine).toContain('xicheng-baitasi')
    expect(triggerEngine).toContain('xicheng-emperors-temple')
    expect(triggerEngine).toContain('gps_radius')
    expect(triggerEngine).toContain('ocr_alias')
    expect(triggerEngine).toContain('image_label')
    expect(triggerEngine).toContain('buildContextQuery(regionCode, poiCode, packageCode, confirm)')
    expect(triggerEngine).toContain('buildAgentActions(')
    expect(triggerEngine).toContain('addAgentAction(')
    expect(triggerEngine).toContain('rankAgentActions(')
    expect(triggerEngine).toContain('applyAgentActionDecisionMetadata(')
    expect(triggerEngine).toContain('"handoff_required"')
    expect(triggerEngine).toContain('"ready_for_local_state"')
    expect(visionService).toContain('XUNJING_VISION_API_URL')
    expect(visionService).toContain('XUNJING_VISION_API_KEY')
    expect(visionService).toContain('XUNJING_VISION_MODEL')
    expect(visionService).toContain('imageBase64')
    expect(visionService).toContain('chat/completions')
    expect(visionService).toContain('extractVisionLabels')
    expect(visionService).toContain('"recognitionEvidence"')
    expect(visionService).toContain('"providerConfigured"')
    expect(appServiceImpl).toContain('payload.put("recognitionEvidence", buildTriggerRecognitionEvidencePayload(reqVO))')
    expect(appServiceImpl).toContain('payload.put("sceneSnapshot", buildTriggerSceneSnapshotPayload(reqVO, respVO))')
    expect(appServiceImpl).toContain('payload.put("priorityRank", action.getPriorityRank())')
    expect(appServiceImpl).toContain('payload.put("decisionScore", action.getDecisionScore())')
    expect(appServiceImpl).toContain('payload.put("recommendationLevel", truncateForEvent(action.getRecommendationLevel(), 50))')
    expect(appServiceImpl).toContain('payload.put("realSystemStatus", truncateForEvent(action.getRealSystemStatus(), 50))')
    expect(appServiceImpl).toContain('payload.put("productionEvidenceText", truncateForEvent(')
  })

  test('multimodal trigger agent actions expose decision queue metadata', async () => {
    const appVo = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java'
    )
    const triggerEngine = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingMultimodalTriggerEngine.java'
    )
    const appTest = await readText(
      'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java'
    )

    expect(appVo).toMatch(/class MultimodalAgentActionRespVO[\s\S]*private Integer priorityRank;/)
    expect(appVo).toMatch(/class MultimodalAgentActionRespVO[\s\S]*private Double decisionScore;/)
    expect(appVo).toMatch(/class MultimodalAgentActionRespVO[\s\S]*private String recommendationLevel;/)
    expect(appVo).toMatch(/class MultimodalAgentActionRespVO[\s\S]*private String realSystemStatus;/)
    expect(appVo).toMatch(/class MultimodalAgentActionRespVO[\s\S]*private String productionEvidenceText;/)
    expect(triggerEngine).toContain('rankAgentActions(actions, primaryAction, intent, sceneSignals)')
    expect(triggerEngine).toContain('applyAgentActionDecisionMetadata(action, rank, primaryAction, intent, sceneSignals)')
    expect(triggerEngine).toContain('calculateAgentActionDecisionScore(')
    expect(triggerEngine).toContain('resolveAgentActionRecommendationLevel(')
    expect(triggerEngine).toContain('resolveAgentActionRealSystemStatus(')
    expect(triggerEngine).toContain('buildAgentActionProductionEvidenceText(')
    expect(appTest).toContain('testResolveMultimodalTriggerRanksAgentActionDecisionQueue')
    expect(appTest).toContain('getPriorityRank()')
    expect(appTest).toContain('getDecisionScore()')
    expect(appTest).toContain('getRecommendationLevel()')
    expect(appTest).toContain('getRealSystemStatus()')
    expect(appTest).toContain('getProductionEvidenceText()')
  })

  test('agent action app event contract is backend telemetry and sanitizes raw media payloads', async () => {
    const enums = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/enums/XunjingEnums.java'
    )
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
    )
    const appTest = await readText(
      'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java'
    )

    expect(enums).toContain('AGENT_ACTION("AGENT_ACTION")')
    expect(appService).toContain('EventType.AGENT_ACTION')
    expect(appService).toContain('buildAgentActionEventPayload')
    expect(appService).toContain('sanitizeAgentActionClientPayload')
    expect(appService).toContain('Map<String, Object> agentAction = buildAgentActionEventPayload(clientPayloadObject)')
    expect(appService).toContain('payload.put("agentAction", agentAction)')
    expect(appService).toContain('payload.put("travelRecordMaterial", travelRecordMaterial)')
    expect(appService).toContain('buildAgentActionTravelRecordMaterialPayload(')
    expect(appService).toContain('"sourceTriggerTraceId"')
    expect(appService).toContain('"executionStatus"')
    expect(appService).not.toContain('payload.put("imageBase64"')
    expect(appTest).toContain('testRecordAgentActionEventStoresStructuredTelemetryWithoutRawImagePayload')
    expect(appTest).toContain('travelRecordMaterial.get("generateTravelogue").asBoolean()')
  })

  test('travel record material feed exposes backend-only scene material API', async () => {
    const controller = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/AppXunjingController.java'
    )
    const appVo = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java'
    )
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppService.java'
    )
    const appServiceImpl = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
    )
    const mapper = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/dal/mysql/event/XunjingInteractionEventMapper.java'
    )
    const appTest = await readText(
      'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java'
    )

    expect(controller).toContain('@GetMapping("/travel-record/materials")')
    expect(controller).toContain('TravelRecordMaterialFeedRespVO')
    expect(controller).toContain('appService.listTravelRecordMaterials(packageCode, userTraceId, limit)')
    expect(appVo).toContain('class TravelRecordMaterialFeedRespVO')
    expect(appVo).toContain('private Long materialCount;')
    expect(appVo).toContain('private List<TravelRecordMaterialRespVO> materials;')
    expect(appVo).toContain('class TravelRecordMaterialRespVO')
    expect(appVo).toContain('private Long eventId;')
    expect(appVo).toContain('private String actionKey;')
    expect(appVo).toContain('private String photoTakenAt;')
    expect(appVo).toContain('private Map<String, Object> photoExifLocation;')
    expect(appVo).toContain('private Map<String, Object> sourceSceneSnapshot;')
    expect(appService).toContain('TravelRecordMaterialFeedRespVO listTravelRecordMaterials(String packageCode, String userTraceId, Integer limit)')
    expect(mapper).toContain('selectListByPackageIdAndUserTraceIdAndEventType')
    expect(mapper).toContain('orderByAsc(XunjingInteractionEventDO::getId)')
    expect(appServiceImpl).toContain('buildTravelRecordMaterialFeed(resourcePackage, userTraceId, limit)')
    expect(appServiceImpl).toContain('buildTravelRecordMaterialItem(event)')
    expect(appServiceImpl).toContain('root.path("travelRecordMaterial")')
    expect(appServiceImpl).toContain('EventType.AGENT_ACTION.getType()')
    expect(appServiceImpl).toContain('normalizeTravelRecordMaterialLimit(limit)')
    expect(appServiceImpl).toContain('buildTravelRecordMaterialSimpleList')
    expect(appServiceImpl).not.toContain('payload.put("imageBase64"')
    expect(appTest).toContain('testListTravelRecordMaterialsReturnsSceneSnapshotPhotoAndPoiTimeline')
    expect(appTest).toContain('listTravelRecordMaterials("XICHENG-MAP-001"')
    expect(appTest).toContain('getMaterials().get(0).getSourceSceneSnapshot()')
    expect(appTest).toContain('getSourceSceneSnapshot().get("matchedSignals")')
    expect(appTest).toContain('getPhotoExifLocation()')
  })

  test('travel record draft exposes backend-only generated story packet', async () => {
    const controller = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/AppXunjingController.java'
    )
    const appVo = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java'
    )
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppService.java'
    )
    const appServiceImpl = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
    )
    const appTest = await readText(
      'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java'
    )

    expect(controller).toContain('@GetMapping("/travel-record/draft")')
    expect(controller).toContain('TravelRecordDraftRespVO')
    expect(controller).toContain('appService.generateTravelRecordDraft(packageCode, userTraceId, limit)')
    expect(appVo).toContain('class TravelRecordDraftRespVO')
    expect(appVo).toContain('private String draftTitle;')
    expect(appVo).toContain('private String draftSummary;')
    expect(appVo).toContain('private String routeText;')
    expect(appVo).toContain('private String photoTimelineText;')
    expect(appVo).toContain('private Boolean generatedFromRealMaterials;')
    expect(appVo).toContain('private Boolean containsSyntheticMedia;')
    expect(appVo).toContain('private List<TravelRecordDraftSectionRespVO> sections;')
    expect(appVo).toContain('class TravelRecordDraftSectionRespVO')
    expect(appVo).toContain('private List<TravelRecordMaterialRespVO> sourceMaterials;')
    expect(appService).toContain('TravelRecordDraftRespVO generateTravelRecordDraft(String packageCode, String userTraceId, Integer limit)')
    expect(appServiceImpl).toContain('buildTravelRecordDraft(resourcePackage, userTraceId, limit)')
    expect(appServiceImpl).toContain('buildTravelRecordDraftSections(materials)')
    expect(appServiceImpl).toContain('buildTravelRecordDraftRouteText(materials)')
    expect(appServiceImpl).toContain('buildTravelRecordDraftPhotoTimelineText(materials)')
    expect(appServiceImpl).toContain('containsSyntheticMedia')
    expect(appServiceImpl).not.toContain('draft.put("imageBase64"')
    expect(appTest).toContain('testGenerateTravelRecordDraftBuildsStoryFromRealSceneMaterials')
    expect(appTest).toContain('generateTravelRecordDraft("XICHENG-MAP-001"')
    expect(appTest).toContain('getGeneratedFromRealMaterials()')
    expect(appTest).toContain('getContainsSyntheticMedia()')
  })

  test('vision agent memory session exposes backend-only continuity API', async () => {
    const controller = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/AppXunjingController.java'
    )
    const appVo = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java'
    )
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppService.java'
    )
    const appServiceImpl = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
    )
    const mapper = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/dal/mysql/event/XunjingInteractionEventMapper.java'
    )
    const appTest = await readText(
      'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java'
    )

    expect(controller).toContain('@GetMapping("/memory/session")')
    expect(controller).toContain('VisionAgentMemorySessionRespVO')
    expect(controller).toContain('appService.getVisionAgentMemorySession(packageCode, userTraceId, limit)')
    expect(appVo).toContain('class VisionAgentMemorySessionRespVO')
    expect(appVo).toContain('private Integer sceneCount;')
    expect(appVo).toContain('private String poiTrailText;')
    expect(appVo).toContain('private String continuityCueText;')
    expect(appVo).toContain('private String domainContinuityText;')
    expect(appVo).toContain('private String serviceContinuityText;')
    expect(appVo).toContain('private List<VisionAgentMemorySceneRespVO> scenes;')
    expect(appVo).toContain('class VisionAgentMemorySceneRespVO')
    expect(appVo).toContain('private String eventType;')
    expect(appVo).toContain('private String primarySceneDomainKey;')
    expect(appVo).toContain('private String sceneFusionSummary;')
    expect(appVo).toContain('private String serviceHandoffSummary;')
    expect(appVo).toContain('private Map<String, Object> sceneSnapshot;')
    expect(appService).toContain('VisionAgentMemorySessionRespVO getVisionAgentMemorySession(String packageCode, String userTraceId, Integer limit)')
    expect(mapper).toContain('selectListByPackageIdAndUserTraceIdAndEventTypes')
    expect(mapper).toContain('orderByAsc(XunjingInteractionEventDO::getId)')
    expect(appServiceImpl).toContain('buildVisionAgentMemorySession(resourcePackage, userTraceId, limit)')
    expect(appServiceImpl).toContain('buildVisionAgentMemorySceneItem(event)')
    expect(appServiceImpl).toContain('EventType.TRIGGER_RESOLVE.getType()')
    expect(appServiceImpl).toContain('EventType.ASK.getType()')
    expect(appServiceImpl).toContain('EventType.AGENT_ACTION.getType()')
    expect(appServiceImpl).toContain('buildVisionAgentMemoryPoiTrailText')
    expect(appServiceImpl).toContain('buildVisionAgentMemoryContinuityCueText')
    expect(appServiceImpl).not.toContain('payload.put("imageBase64"')
    expect(appTest).toContain('testGetVisionAgentMemorySessionBuildsContinuousSceneTimeline')
    expect(appTest).toContain('getVisionAgentMemorySession("XICHENG-MAP-001"')
    expect(appTest).toContain('getPoiTrailText()')
    expect(appTest).toContain('getContinuityCueText()')
    expect(appTest).toContain('getScenes().get(0).getSceneSnapshot()')
  })

  test('city knowledge graph exposes backend-only scene graph API', async () => {
    const controller = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/AppXunjingController.java'
    )
    const appVo = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java'
    )
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppService.java'
    )
    const appServiceImpl = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
    )
    const poiMapper = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/dal/mysql/poi/XunjingPoiMapper.java'
    )
    const appTest = await readText(
      'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java'
    )

    expect(controller).toContain('@GetMapping("/knowledge/graph")')
    expect(controller).toContain('VisionAgentKnowledgeGraphRespVO')
    expect(controller).toContain('appService.getVisionAgentKnowledgeGraph(packageCode, regionCode, poiCode, limit)')
    expect(appVo).toContain('class VisionAgentKnowledgeGraphRespVO')
    expect(appVo).toContain('private String anchorPoiCode;')
    expect(appVo).toContain('private String anchorPoiName;')
    expect(appVo).toContain('private List<VisionAgentKnowledgeGraphNodeRespVO> nodes;')
    expect(appVo).toContain('private List<VisionAgentKnowledgeGraphEdgeRespVO> edges;')
    expect(appVo).toContain('private List<SourceRespVO> sources;')
    expect(appVo).toContain('class VisionAgentKnowledgeGraphNodeRespVO')
    expect(appVo).toContain('private String nodeType;')
    expect(appVo).toContain('private String prompt;')
    expect(appVo).toContain('class VisionAgentKnowledgeGraphEdgeRespVO')
    expect(appVo).toContain('private String relationType;')
    expect(appService).toContain('VisionAgentKnowledgeGraphRespVO getVisionAgentKnowledgeGraph(String packageCode, String regionCode, String poiCode, Integer limit)')
    expect(poiMapper).toContain('selectByPackageIdAndPoiCode')
    expect(appServiceImpl).toContain('buildVisionAgentKnowledgeGraph(resourcePackage, regionCode, poiCode, limit)')
    expect(appServiceImpl).toContain('buildKnowledgeGraphAnchorNode')
    expect(appServiceImpl).toContain('buildKnowledgeGraphRelatedPoiNodes')
    expect(appServiceImpl).toContain('buildKnowledgeGraphTopicNodes')
    expect(appServiceImpl).toContain('buildKnowledgeGraphEdges')
    expect(appServiceImpl).toContain('buildKnowledgeGraphSources')
    expect(appServiceImpl).toContain('extractKnowledgeGraphRecommendedQuestions')
    expect(appTest).toContain('testGetVisionAgentKnowledgeGraphBuildsSourceBackedPoiTopicNetwork')
    expect(appTest).toContain('getVisionAgentKnowledgeGraph("XICHENG-MAP-001"')
    expect(appTest).toContain('getAnchorPoiCode()')
    expect(appTest).toContain('getNodes()')
    expect(appTest).toContain('getEdges()')
    expect(appTest).toContain('getSources()')
  })

  test('service handoff tasks expose backend-only agent action boundary API', async () => {
    const controller = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/AppXunjingController.java'
    )
    const appVo = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java'
    )
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppService.java'
    )
    const appServiceImpl = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
    )
    const mapper = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/dal/mysql/event/XunjingInteractionEventMapper.java'
    )
    const appTest = await readText(
      'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java'
    )

    expect(controller).toContain('@GetMapping("/service-handoff/tasks")')
    expect(controller).toContain('VisionAgentServiceHandoffTaskFeedRespVO')
    expect(controller).toContain('appService.listVisionAgentServiceHandoffTasks(packageCode, userTraceId, limit)')
    expect(appVo).toContain('class VisionAgentServiceHandoffTaskFeedRespVO')
    expect(appVo).toContain('private Long taskCount;')
    expect(appVo).toContain('private Long realSystemRequiredTaskCount;')
    expect(appVo).toContain('private String realSystemBoundaryText;')
    expect(appVo).toContain('private List<VisionAgentServiceHandoffTaskRespVO> tasks;')
    expect(appVo).toContain('class VisionAgentServiceHandoffTaskRespVO')
    expect(appVo).toContain('private String taskType;')
    expect(appVo).toContain('private String realSystemStatus;')
    expect(appVo).toContain('private String handoffSummary;')
    expect(appVo).toContain('private Map<String, Object> sourceSceneSnapshot;')
    expect(appService).toContain('VisionAgentServiceHandoffTaskFeedRespVO listVisionAgentServiceHandoffTasks(String packageCode, String userTraceId, Integer limit)')
    expect(mapper).toContain('selectListByPackageIdAndUserTraceIdAndEventType')
    expect(appServiceImpl).toContain('buildVisionAgentServiceHandoffTaskFeed(resourcePackage, userTraceId, limit)')
    expect(appServiceImpl).toContain('buildVisionAgentServiceHandoffTaskItem(event)')
    expect(appServiceImpl).toContain('resolveServiceHandoffRealSystemStatus')
    expect(appServiceImpl).toContain('SERVICE_HANDOFF_REAL_SYSTEM_BOUNDARY_TEXT')
    expect(appServiceImpl).not.toContain('couponCode')
    expect(appServiceImpl).not.toContain('ticketOrderNo')
    expect(appTest).toContain('testListVisionAgentServiceHandoffTasksExposesRealSystemBoundary')
    expect(appTest).toContain('getRealSystemRequiredTaskCount()')
    expect(appTest).toContain('getRealSystemStatus()')
  })

  test('scene engine context exposes backend-only fused context packet API', async () => {
    const controller = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/AppXunjingController.java'
    )
    const appVo = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java'
    )
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppService.java'
    )
    const appServiceImpl = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
    )
    const appTest = await readText(
      'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImplTest.java'
    )

    expect(controller).toContain('@GetMapping("/scene/context")')
    expect(controller).toContain('VisionAgentSceneContextRespVO')
    expect(controller).toContain('appService.getVisionAgentSceneContext(packageCode, userTraceId, regionCode, poiCode, limit)')
    expect(appVo).toContain('class VisionAgentSceneContextRespVO')
    expect(appVo).toContain('private Boolean contextReady;')
    expect(appVo).toContain('private Long latestEventId;')
    expect(appVo).toContain('private String currentPoiCode;')
    expect(appVo).toContain('private String currentPoiName;')
    expect(appVo).toContain('private String serviceContinuityText;')
    expect(appVo).toContain('private Boolean knowledgeGraphAvailable;')
    expect(appVo).toContain('private Long serviceHandoffTaskCount;')
    expect(appVo).toContain('private Long realSystemRequiredTaskCount;')
    expect(appVo).toContain('private Map<String, Object> latestSceneSnapshot;')
    expect(appVo).toContain('private String actionDecisionSummary;')
    expect(appVo).toContain('private List<MultimodalAgentActionRespVO> actionDecisionQueue;')
    expect(appVo).toContain('private VisionAgentMemorySessionRespVO memorySession;')
    expect(appVo).toContain('private VisionAgentServiceHandoffTaskFeedRespVO serviceHandoff;')
    expect(appVo).toContain('private VisionAgentKnowledgeGraphRespVO knowledgeGraph;')
    expect(appService).toContain('VisionAgentSceneContextRespVO getVisionAgentSceneContext(String packageCode, String userTraceId, String regionCode, String poiCode, Integer limit)')
    expect(appServiceImpl).toContain('buildVisionAgentSceneContext(resourcePackage, userTraceId, regionCode, poiCode, limit)')
    expect(appServiceImpl).toContain('resolveSceneContextLatestScene')
    expect(appServiceImpl).toContain('buildSceneContextActionDecisionQueue(memorySession, latestScene)')
    expect(appServiceImpl).toContain('buildSceneContextActionDecisionSummary(actionDecisionQueue)')
    expect(appServiceImpl).toContain('toSceneContextAgentAction(action)')
    expect(appServiceImpl).toContain('resolveSceneContextKnowledgeGraph')
    expect(appServiceImpl).toContain('buildSceneContextReady')
    expect(appTest).toContain('testGetVisionAgentSceneContextBuildsSceneEngineContextPacket')
    expect(appTest).toContain('getActionDecisionQueue()')
    expect(appTest).toContain('getActionDecisionSummary()')
    expect(appTest).toContain('getKnowledgeGraphAvailable()')
    expect(appTest).toContain('getServiceHandoffTaskCount()')
  })

  test('vision provider status exposes production evidence without leaking secrets', async () => {
    const controller = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/AppXunjingController.java'
    )
    const appVo = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java'
    )
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppService.java'
    )
    const appServiceImpl = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
    )
    const visionService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingVisionRecognitionService.java'
    )
    const visionTest = await readText(
      'backend/yudao/yudao-module-xunjing/src/test/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingVisionRecognitionServiceTest.java'
    )

    expect(controller).toContain('@GetMapping("/vision/provider/status")')
    expect(controller).toContain('VisionProviderStatusRespVO')
    expect(controller).toContain('appService.getVisionProviderStatus()')
    expect(appVo).toContain('class VisionProviderStatusRespVO')
    expect(appVo).toContain('private Boolean providerConfigured;')
    expect(appVo).toContain('private Boolean endpointConfigured;')
    expect(appVo).toContain('private Boolean apiKeyConfigured;')
    expect(appVo).toContain('private String model;')
    expect(appVo).toContain('private String apiKeyFingerprint;')
    expect(appVo).toContain('private List<String> missingConfigKeys;')
    expect(appVo).toContain('private String productionEvidenceText;')
    expect(appService).toContain('VisionProviderStatusRespVO getVisionProviderStatus()')
    expect(appServiceImpl).toContain('visionRecognitionService.getProviderStatus()')
    expect(visionService).toContain('VisionProviderStatusRespVO getProviderStatus()')
    expect(visionService).toContain('fingerprintSecret')
    expect(visionService).toContain('missingConfigKeys')
    expect(visionService).not.toContain('setApiKey(')
    expect(visionTest).toContain('testGetProviderStatusReportsMissingConfigWithoutLeakingSecrets')
    expect(visionTest).toContain('testGetProviderStatusReportsConfiguredFingerprintOnly')
  })

  test('xicheng AI chat contract carries POI context and blocks no-source answers', async () => {
    const appVo = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java'
    )
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppServiceImpl.java'
    )

    expect(appVo).toMatch(/class RagChatReqVO[\s\S]*private String regionCode;/)
    expect(appVo).toMatch(/class RagChatReqVO[\s\S]*private String poiCode;/)
    expect(appVo).toMatch(/class RagChatReqVO[\s\S]*private String poiName;/)
    expect(appVo).toMatch(/class RagChatReqVO[\s\S]*private String routeId;/)
    expect(appVo).toMatch(/class RagChatReqVO[\s\S]*private Boolean visionAgentContextAvailable;/)
    expect(appVo).toMatch(/class RagChatReqVO[\s\S]*private String visionAgentSceneFusionSummary;/)
    expect(appVo).toMatch(/class RagChatReqVO[\s\S]*private String visionAgentWorldInterfaceSummary;/)
    expect(appVo).toMatch(/class RagChatReqVO[\s\S]*private String visionAgentMemorySessionText;/)
    expect(appVo).toMatch(/class RagChatReqVO[\s\S]*private Integer visionAgentMemorySessionSceneCount;/)
    expect(appVo).toMatch(/class RagChatReqVO[\s\S]*private String visionAgentPrimarySceneDomainKey;/)
    expect(appVo).toMatch(/class RagChatReqVO[\s\S]*private String visionAgentDecisionReasonSummary;/)
    expect(appVo).toMatch(/class RagChatReqVO[\s\S]*private Map<String, Object> visionAgentSceneSnapshot;/)
    expect(appVo).toMatch(/class RagChatReqVO[\s\S]*private String serviceHandoffSummary;/)
    expect(appService).toContain('buildNoSourceBlockedResponse')
    expect(appService).toContain('AiSafetyStatus.BLOCKED.getStatus()')
    expect(appService).toContain('buildSourceSearchText(reqVO)')
    expect(appService).toContain('buildChatInputSummary(reqVO)')
    expect(appService).toContain('buildVisionAgentSourceSearchText(reqVO)')
    expect(appService).toContain('hydrateVisionAgentMemoryFromPreviousAsk(resourcePackage, reqVO, explicitChatTargetContext)')
    expect(appService).toContain('hydrateVisionAgentContextFromPreviousTrigger(resourcePackage, reqVO, explicitChatTargetContext)')
    expect(appService).toContain('reqVO.setVisionAgentSceneSnapshot(buildPreviousTriggerSceneSnapshotPayload(root.path("sceneSnapshot")))')
    expect(appService).toContain('hydrateTriggerServiceHandoff(reqVO, root)')
    expect(appService).toContain('payload.put("agentActions", buildTriggerAgentActionsPayload(respVO))')
    expect(appService).toContain('putPreviousAgentActionsMemoryPart(parts, root.get("agentActions"))')
    expect(appService).toContain('selectLatestByPackageIdAndUserTraceIdAndEventType')
    expect(appService).toContain('buildServiceHandoffContextText(reqVO)')
    expect(appService).toContain('buildVisionAgentChatContextPayload(reqVO)')
    expect(appService).toContain('buildVisionAgentChatContextText(reqVO)')
    expect(appService).toContain('buildVisionAgentSceneSnapshotContextText(reqVO.getVisionAgentSceneSnapshot())')
    expect(appService).toContain('payload.put("visionAgentContext", buildVisionAgentChatContextPayload(reqVO))')
    expect(appService).toContain('payload.put("sceneSnapshot", reqVO.getVisionAgentSceneSnapshot())')
    expect(appService).not.toContain('payload.put("visionAgentContext", reqVO')
    expect(appService).toContain('reqVO.getPoiCode()')
    expect(appService).toContain('reqVO.getRegionCode()')
  })
})
