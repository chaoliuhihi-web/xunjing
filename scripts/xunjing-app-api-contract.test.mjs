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
    expect(visionService).toContain('XUNJING_VISION_API_URL')
    expect(visionService).toContain('XUNJING_VISION_API_KEY')
    expect(visionService).toContain('XUNJING_VISION_MODEL')
    expect(visionService).toContain('imageBase64')
    expect(visionService).toContain('chat/completions')
    expect(visionService).toContain('extractVisionLabels')
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
    expect(appVo).toMatch(/class RagChatReqVO[\s\S]*private String serviceHandoffSummary;/)
    expect(appService).toContain('buildNoSourceBlockedResponse')
    expect(appService).toContain('AiSafetyStatus.BLOCKED.getStatus()')
    expect(appService).toContain('buildSourceSearchText(reqVO)')
    expect(appService).toContain('buildChatInputSummary(reqVO)')
    expect(appService).toContain('buildVisionAgentSourceSearchText(reqVO)')
    expect(appService).toContain('hydrateVisionAgentMemoryFromPreviousAsk(resourcePackage, reqVO, explicitChatTargetContext)')
    expect(appService).toContain('hydrateVisionAgentContextFromPreviousTrigger(resourcePackage, reqVO, explicitChatTargetContext)')
    expect(appService).toContain('hydrateTriggerServiceHandoff(reqVO, root)')
    expect(appService).toContain('payload.put("agentActions", buildTriggerAgentActionsPayload(respVO))')
    expect(appService).toContain('putPreviousAgentActionsMemoryPart(parts, root.get("agentActions"))')
    expect(appService).toContain('selectLatestByPackageIdAndUserTraceIdAndEventType')
    expect(appService).toContain('buildServiceHandoffContextText(reqVO)')
    expect(appService).toContain('buildVisionAgentChatContextPayload(reqVO)')
    expect(appService).toContain('buildVisionAgentChatContextText(reqVO)')
    expect(appService).toContain('payload.put("visionAgentContext", buildVisionAgentChatContextPayload(reqVO))')
    expect(appService).not.toContain('payload.put("visionAgentContext", reqVO')
    expect(appService).toContain('reqVO.getPoiCode()')
    expect(appService).toContain('reqVO.getRegionCode()')
  })
})
