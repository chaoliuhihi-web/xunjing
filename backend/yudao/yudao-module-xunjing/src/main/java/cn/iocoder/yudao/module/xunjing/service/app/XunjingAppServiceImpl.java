package cn.iocoder.yudao.module.xunjing.service.app;

import cn.iocoder.yudao.framework.tenant.core.context.TenantContextHolder;
import cn.iocoder.yudao.framework.common.util.json.JsonUtils;
import cn.iocoder.yudao.framework.common.util.object.BeanUtils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import cn.iocoder.yudao.module.ai.dal.dataobject.model.AiModelDO;
import cn.iocoder.yudao.module.ai.enums.model.AiModelTypeEnum;
import cn.iocoder.yudao.module.ai.enums.model.AiPlatformEnum;
import cn.iocoder.yudao.module.ai.service.knowledge.AiKnowledgeSegmentService;
import cn.iocoder.yudao.module.ai.service.knowledge.bo.AiKnowledgeSegmentSearchReqBO;
import cn.iocoder.yudao.module.ai.service.knowledge.bo.AiKnowledgeSegmentSearchRespBO;
import cn.iocoder.yudao.module.ai.service.model.AiModelService;
import cn.iocoder.yudao.module.ai.util.AiUtils;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.RagChatReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.RagChatRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.AppInteractionEventReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.AppGlobeModelRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.AppKnowledgeDocumentRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.AppMapPointRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.AppMediaAssetRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.AppPackageDetailRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.LocationPointReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.MultimodalTriggerReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.MultimodalTriggerRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.PhotoMetaReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.PublicReportSummaryRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.ScanResolveReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.ScanResolveRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.SourceRespVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.ai.XunjingAiGenerationLogDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.ai.XunjingAiQuotaRuleDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.event.XunjingInteractionEventDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.knowledge.XunjingKnowledgeDocumentDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.media.XunjingMediaAssetDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.media.XunjingMediaUsageLogDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.packagepkg.XunjingResourcePackageDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.qrcode.XunjingQrCodeDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.report.XunjingPublicReportDO;
import cn.iocoder.yudao.module.xunjing.dal.mysql.ai.XunjingAiGenerationLogMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.ai.XunjingAiQuotaRuleMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.event.XunjingInteractionEventMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.globe.XunjingGlobeModelMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.knowledge.XunjingKnowledgeDocumentMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.map.XunjingMapPointMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.media.XunjingMediaAssetMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.media.XunjingMediaUsageLogMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.packagepkg.XunjingResourcePackageMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.poi.XunjingPoiMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.qrcode.XunjingQrCodeMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.report.XunjingPublicReportMapper;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.AiSafetyStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.AiQuotaStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.CopyrightStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.EventType;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.PackageStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.QrCodeStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.ResourceType;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.ReviewStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.VectorStatus;
import cn.iocoder.yudao.module.xunjing.service.app.trigger.XunjingMultimodalTriggerEngine;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@Validated
public class XunjingAppServiceImpl implements XunjingAppService {

    private static final int TOP_K = 3;
    private static final String DEFAULT_CHAT_SCENE_CODE = "xunjing-rag-chat";
    private static final String USER_TRACE_ANONYMOUS = "anonymous";
    private static final String QUOTA_SCOPE_PROJECT = "PROJECT";
    private static final String QUOTA_SCOPE_SCHOOL = "SCHOOL";
    private static final String QUOTA_SCOPE_PACKAGE = "PACKAGE";
    private static final String QUOTA_SCOPE_QRCODE = "QRCODE";
    private static final String QUOTA_SCOPE_USER = "USER";
    private static final int TRIGGER_SCENE_SIGNAL_TEXT_MAX_LENGTH = 200;
    private static final int CHAT_CONTEXT_TEXT_MAX_LENGTH = 200;
    private static final List<String> TRIGGER_SCENE_SIGNAL_TEXT_KEYS = List.of(
            "sceneFusionSummary",
            "worldInterfaceSummary",
            "localTimeText",
            "weatherText",
            "headingText",
            "sceneDomainIntentKey",
            "sceneDomainIntentLabel",
            "sceneDomainIntentTitle",
            "sceneDomainIntentCopy",
            "agentDecisionActionTitle",
            "agentDecisionReasonSummary",
            "visionRecognitionStatus",
            "visionRecognitionModel"
    );

    @Resource
    private XunjingResourcePackageMapper resourcePackageMapper;
    @Resource
    private XunjingKnowledgeDocumentMapper knowledgeDocumentMapper;
    @Resource
    private XunjingInteractionEventMapper interactionEventMapper;
    @Resource
    private XunjingQrCodeMapper qrCodeMapper;
    @Resource
    private XunjingAiGenerationLogMapper aiGenerationLogMapper;
    @Resource
    private XunjingAiQuotaRuleMapper aiQuotaRuleMapper;
    @Resource
    private XunjingPublicReportMapper publicReportMapper;
    @Resource
    private XunjingMediaAssetMapper mediaAssetMapper;
    @Resource
    private XunjingMediaUsageLogMapper mediaUsageLogMapper;
    @Resource
    private XunjingMapPointMapper mapPointMapper;
    @Resource
    private XunjingGlobeModelMapper globeModelMapper;
    @Resource
    private XunjingPoiMapper poiMapper;
    @Resource
    private XunjingMultimodalTriggerEngine multimodalTriggerEngine;
    @Autowired(required = false)
    private AiKnowledgeSegmentService aiKnowledgeSegmentService;
    @Autowired(required = false)
    private AiModelService aiModelService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ScanResolveRespVO resolveScan(ScanResolveReqVO reqVO) {
        XunjingQrCodeDO qrCode = resolveQrCode(reqVO);
        XunjingResourcePackageDO resourcePackage = resolvePublicPackage(reqVO, qrCode);
        recordScanEvent(resourcePackage, reqVO, qrCode);
        incrementScanCount(qrCode);

        ScanResolveRespVO respVO = new ScanResolveRespVO();
        respVO.setPackageCode(resourcePackage.getPackageCode());
        respVO.setSceneCode(qrCode == null ? reqVO.getSceneCode() : qrCode.getSceneCode());
        respVO.setTitle(resourcePackage.getTitle());
        respVO.setResourceType(resourcePackage.getResourceType());
        respVO.setTargetPath(buildTargetPath(resourcePackage, qrCode));
        return respVO;
    }

    @Override
    public AppPackageDetailRespVO getPublicPackageDetail(String packageCode) {
        XunjingResourcePackageDO resourcePackage = validatePublicPackage(packageCode);
        Long packageId = resourcePackage.getId();

        AppPackageDetailRespVO respVO = BeanUtils.toBean(resourcePackage, AppPackageDetailRespVO.class);
        respVO.setRegionCode(resolvePackageRegionCode(packageId));
        respVO.setKnowledgeDocuments(BeanUtils.toBean(knowledgeDocumentMapper.selectPublicListByPackageId(
                packageId, ReviewStatus.APPROVED.getStatus(), VectorStatus.INDEXED.getStatus()),
                AppKnowledgeDocumentRespVO.class));
        respVO.setMediaAssets(BeanUtils.toBean(mediaAssetMapper.selectPublicListByPackageId(
                packageId, ReviewStatus.APPROVED.getStatus(), CopyrightStatus.AUTHORIZED.getStatus()),
                AppMediaAssetRespVO.class));
        respVO.setMapPoints(BeanUtils.toBean(mapPointMapper.selectPublicListByPackageId(
                packageId, PackageStatus.PUBLISHED.getStatus()), AppMapPointRespVO.class));
        respVO.setGlobeModels(BeanUtils.toBean(globeModelMapper.selectPublicListByPackageId(
                packageId, PackageStatus.PUBLISHED.getStatus()), AppGlobeModelRespVO.class));
        return respVO;
    }

    private String resolvePackageRegionCode(Long packageId) {
        List<String> regionCodes = poiMapper.selectPublishedListByPackageId(
                        packageId, PackageStatus.PUBLISHED.getStatus(), ReviewStatus.APPROVED.getStatus())
                .stream()
                .map(poi -> defaultIfBlank(poi.getRegionCode(), "").trim())
                .filter(this::hasText)
                .distinct()
                .toList();
        return regionCodes.size() == 1 ? regionCodes.get(0) : null;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public RagChatRespVO answer(RagChatReqVO reqVO) {
        return answer(reqVO, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public RagChatRespVO answerForResourceType(RagChatReqVO reqVO, String expectedResourceType) {
        return answer(reqVO, expectedResourceType);
    }

    private RagChatRespVO answer(RagChatReqVO reqVO, String expectedResourceType) {
        XunjingResourcePackageDO resourcePackage = validatePublicPackage(reqVO.getPackageCode());
        validateExpectedResourceType(resourcePackage, expectedResourceType);
        XunjingQrCodeDO qrCode = resolveAnswerQrCode(reqVO, resourcePackage);
        hydrateVisionAgentMemoryFromPreviousAsk(resourcePackage, reqVO);
        hydrateVisionAgentContextFromPreviousTrigger(resourcePackage, reqVO);
        recordAskEvent(resourcePackage, reqVO);

        RagChatRespVO quotaBlocked = buildQuotaBlockedIfNeeded(resourcePackage, qrCode, reqVO);
        if (quotaBlocked != null) {
            return quotaBlocked;
        }

        List<SourceRespVO> sources = searchPublicSources(resourcePackage, reqVO);
        if (sources.isEmpty()) {
            return buildNoSourceBlockedResponse(resourcePackage, qrCode, reqVO);
        }

        CachedAnswer cachedAnswer = getCachedAnswerIfEnabled(resourcePackage, qrCode, reqVO);
        if (cachedAnswer != null && !cachedAnswer.sources().isEmpty()) {
            Long logId = recordCachedAiGeneration(resourcePackage, qrCode, reqVO, cachedAnswer);
            RagChatRespVO respVO = buildRagChatResponse(resourcePackage, reqVO);
            respVO.setAnswer(cachedAnswer.answer());
            respVO.setSafetyStatus(AiSafetyStatus.PASSED.getStatus());
            respVO.setLogId(logId);
            respVO.setSources(cachedAnswer.sources());
            return respVO;
        }

        AnswerGenerationResult answer = generateAnswer(reqVO, sources);

        Long logId = recordAiGeneration(resourcePackage, qrCode, reqVO, answer, sources);

        RagChatRespVO respVO = buildRagChatResponse(resourcePackage, reqVO);
        respVO.setAnswer(answer.answer());
        respVO.setSafetyStatus(AiSafetyStatus.PASSED.getStatus());
        respVO.setLogId(logId);
        respVO.setSources(sources);
        return respVO;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long recordEvent(AppInteractionEventReqVO reqVO) {
        XunjingQrCodeDO qrCode = resolveAppEventQrCode(reqVO, hasText(reqVO.getPackageCode()));
        XunjingResourcePackageDO resourcePackage = resolveAppEventPackage(reqVO, qrCode);

        XunjingInteractionEventDO event = new XunjingInteractionEventDO();
        event.setPackageId(resourcePackage.getId());
        event.setSchoolId(resourcePackage.getSchoolId());
        event.setEventType(normalizeAppEventType(reqVO.getEventType()));
        event.setSourceChannel(defaultIfBlank(reqVO.getSourceChannel(), "mini-program"));
        event.setUserTraceId(reqVO.getUserTraceId());
        event.setPayloadJson(buildAppEventPayload(resourcePackage, qrCode, reqVO));
        event.setTenantId(TenantContextHolder.getRequiredTenantId());
        interactionEventMapper.insert(event);

        if (EventType.SCAN.getType().equals(event.getEventType()) && qrCode != null) {
            incrementScanCount(qrCode);
        }
        if (EventType.MEDIA_USE.getType().equals(event.getEventType())) {
            recordAppMediaUsage(resourcePackage, qrCode, event, reqVO);
        }
        return event.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MultimodalTriggerRespVO resolveMultimodalTrigger(MultimodalTriggerReqVO reqVO) {
        hydrateMultimodalTriggerMemoryFromPreviousResolve(reqVO);
        MultimodalTriggerReqVO safeReqVO = reqVO == null ? new MultimodalTriggerReqVO() : reqVO;
        MultimodalTriggerRespVO respVO = multimodalTriggerEngine.resolve(safeReqVO);
        recordTriggerResolveEventIfPossible(safeReqVO, respVO);
        return respVO;
    }

    private void hydrateMultimodalTriggerMemoryFromPreviousResolve(MultimodalTriggerReqVO reqVO) {
        if (reqVO == null || !hasText(reqVO.getPackageCode()) || !hasText(reqVO.getUserTraceId())) {
            return;
        }
        XunjingResourcePackageDO resourcePackage = resourcePackageMapper.selectByPackageCodeAndStatus(
                reqVO.getPackageCode(), PackageStatus.PUBLISHED.getStatus());
        if (resourcePackage == null || resourcePackage.getId() == null) {
            return;
        }
        XunjingInteractionEventDO previousResolveEvent =
                selectLatestVisionAgentMemoryEvent(resourcePackage, reqVO, EventType.TRIGGER_RESOLVE.getType());
        XunjingInteractionEventDO previousAskEvent =
                selectLatestVisionAgentMemoryEvent(resourcePackage, reqVO, EventType.ASK.getType());
        if (shouldUsePreviousAskForTriggerMemory(previousAskEvent, previousResolveEvent)
                && hydrateMultimodalTriggerMemoryFromPreviousAsk(reqVO, previousAskEvent)) {
            return;
        }
        if (hydrateMultimodalTriggerMemoryFromPreviousResolve(resourcePackage, reqVO)) {
            return;
        }
        hydrateMultimodalTriggerMemoryFromPreviousAsk(resourcePackage, reqVO);
    }

    private XunjingInteractionEventDO selectLatestVisionAgentMemoryEvent(
            XunjingResourcePackageDO resourcePackage, MultimodalTriggerReqVO reqVO, String eventType) {
        return interactionEventMapper.selectLatestByPackageIdAndUserTraceIdAndEventType(
                resourcePackage.getId(), reqVO.getUserTraceId(), eventType);
    }

    private boolean shouldUsePreviousAskForTriggerMemory(
            XunjingInteractionEventDO previousAskEvent, XunjingInteractionEventDO previousResolveEvent) {
        if (previousAskEvent == null || previousAskEvent.getId() == null) {
            return false;
        }
        return previousResolveEvent == null || previousResolveEvent.getId() == null
                || previousAskEvent.getId() > previousResolveEvent.getId();
    }

    private boolean hydrateMultimodalTriggerMemoryFromPreviousResolve(
            XunjingResourcePackageDO resourcePackage, MultimodalTriggerReqVO reqVO) {
        XunjingInteractionEventDO previousEvent =
                selectLatestVisionAgentMemoryEvent(resourcePackage, reqVO, EventType.TRIGGER_RESOLVE.getType());
        if (previousEvent == null || !hasText(previousEvent.getPayloadJson())) {
            return false;
        }
        try {
            JsonNode root = JsonUtils.parseTree(previousEvent.getPayloadJson());
            if (root == null || root.isNull() || root.isMissingNode()) {
                return false;
            }
            String poiCode = visionAgentContextText(root, "poiCode");
            String poiName = visionAgentContextText(root, "poiName");
            if (!hasText(poiCode) && !hasText(poiName)) {
                return false;
            }
            hydratePreviousTriggerRecentPoi(reqVO, poiCode);
            if (!hasFreshMultimodalTriggerSignal(reqVO)) {
                hydratePreviousTriggerSceneSignals(reqVO, root);
            }
            return true;
        } catch (RuntimeException ex) {
            log.warn("[hydrateMultimodalTriggerMemoryFromPreviousResolve][eventId({}) parse failed]",
                    previousEvent.getId(), ex);
            return false;
        }
    }

    private void hydrateMultimodalTriggerMemoryFromPreviousAsk(
            XunjingResourcePackageDO resourcePackage, MultimodalTriggerReqVO reqVO) {
        XunjingInteractionEventDO previousEvent =
                selectLatestVisionAgentMemoryEvent(resourcePackage, reqVO, EventType.ASK.getType());
        hydrateMultimodalTriggerMemoryFromPreviousAsk(reqVO, previousEvent);
    }

    private boolean hydrateMultimodalTriggerMemoryFromPreviousAsk(
            MultimodalTriggerReqVO reqVO, XunjingInteractionEventDO previousEvent) {
        if (previousEvent == null || !hasText(previousEvent.getPayloadJson())) {
            return false;
        }
        try {
            JsonNode root = JsonUtils.parseTree(previousEvent.getPayloadJson());
            if (root == null || root.isNull() || root.isMissingNode()) {
                return false;
            }
            JsonNode visionAgentContext = root.path("visionAgentContext");
            String poiCode = visionAgentContextText(root, "poiCode");
            String poiName = visionAgentContextText(root, "poiName");
            if (!hasText(poiCode) && !hasText(poiName)) {
                return false;
            }
            hydratePreviousTriggerRecentPoi(reqVO, poiCode);
            if (!hasFreshMultimodalTriggerSignal(reqVO)) {
                hydratePreviousAskSceneSignals(reqVO, root, visionAgentContext);
            }
            return true;
        } catch (RuntimeException ex) {
            log.warn("[hydrateMultimodalTriggerMemoryFromPreviousAsk][eventId({}) parse failed]",
                    previousEvent.getId(), ex);
            return false;
        }
    }

    private boolean hasFreshMultimodalTriggerSignal(MultimodalTriggerReqVO reqVO) {
        return hasText(reqVO.getOcrText())
                || hasTriggerCoordinate(reqVO.getLocation())
                || (reqVO.getPhotoMeta() != null && hasTriggerCoordinate(reqVO.getPhotoMeta().getExifLocation()));
    }

    private boolean hasTriggerCoordinate(LocationPointReqVO location) {
        return location != null && location.getLatitude() != null && location.getLongitude() != null;
    }

    private void hydratePreviousTriggerRecentPoi(MultimodalTriggerReqVO reqVO, String poiCode) {
        if (!hasText(poiCode)) {
            return;
        }
        List<String> recentPoiCodes = new ArrayList<>();
        if (reqVO.getRecentPoiCodes() != null) {
            recentPoiCodes.addAll(reqVO.getRecentPoiCodes());
        }
        if (!recentPoiCodes.contains(poiCode)) {
            recentPoiCodes.add(0, poiCode);
        }
        reqVO.setRecentPoiCodes(recentPoiCodes);
    }

    private void hydratePreviousTriggerSceneSignals(MultimodalTriggerReqVO reqVO, JsonNode root) {
        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        if (reqVO.getSceneSignals() != null) {
            sceneSignals.putAll(reqVO.getSceneSignals());
        }
        JsonNode previousSignals = root.path("sceneSignals");
        putSceneSignalIfAbsent(sceneSignals, "sceneFusionSummary",
                buildContinuousTriggerSceneFusionSummary(root));
        putSceneSignalIfAbsent(sceneSignals, "worldInterfaceSummary",
                buildContinuousTriggerWorldInterfaceSummary(previousSignals));
        putSceneSignalIfAbsent(sceneSignals, "sceneDomainIntentKey",
                visionAgentContextText(previousSignals, "sceneDomainIntentKey"));
        putSceneSignalIfAbsent(sceneSignals, "sceneDomainIntentLabel",
                visionAgentContextText(previousSignals, "sceneDomainIntentLabel"));
        putSceneSignalIfAbsent(sceneSignals, "agentDecisionReasonSummary",
                buildContinuousTriggerDecisionReasonSummary(root, previousSignals));
        if (!sceneSignals.containsKey("memorySessionSceneCount")) {
            int previousCount = previousSignals.path("memorySessionSceneCount").asInt(1);
            sceneSignals.put("memorySessionSceneCount", Math.max(previousCount, 1) + 1);
        }
        reqVO.setSceneSignals(sceneSignals);
    }

    private void hydratePreviousAskSceneSignals(
            MultimodalTriggerReqVO reqVO, JsonNode root, JsonNode visionAgentContext) {
        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        if (reqVO.getSceneSignals() != null) {
            sceneSignals.putAll(reqVO.getSceneSignals());
        }
        putSceneSignalIfAbsent(sceneSignals, "sceneFusionSummary",
                buildContinuousAskSceneFusionSummary(root, visionAgentContext));
        putSceneSignalIfAbsent(sceneSignals, "worldInterfaceSummary",
                buildContinuousAskWorldInterfaceSummary(visionAgentContext));
        putSceneSignalIfAbsent(sceneSignals, "sceneDomainIntentKey",
                visionAgentContextText(visionAgentContext, "primarySceneDomainKey"));
        putSceneSignalIfAbsent(sceneSignals, "sceneDomainIntentLabel",
                visionAgentContextText(visionAgentContext, "primarySceneDomainLabel"));
        putSceneSignalIfAbsent(sceneSignals, "agentDecisionReasonSummary",
                buildContinuousAskDecisionReasonSummary(visionAgentContext));
        if (!sceneSignals.containsKey("memorySessionSceneCount")) {
            int previousCount = visionAgentContext.path("memorySessionSceneCount").asInt(1);
            sceneSignals.put("memorySessionSceneCount", Math.max(previousCount, 1) + 1);
        }
        reqVO.setSceneSignals(sceneSignals);
    }

    private String buildContinuousTriggerSceneFusionSummary(JsonNode root) {
        String poiName = visionAgentContextText(root, "poiName");
        String poiCode = visionAgentContextText(root, "poiCode");
        String reason = visionAgentContextText(root, "reason");
        List<String> parts = new ArrayList<>();
        if (hasText(poiName)) {
            parts.add("上一轮识别到" + poiName);
        } else if (hasText(poiCode)) {
            parts.add("上一轮识别到" + poiCode);
        }
        if (hasText(reason)) {
            parts.add(reason);
        }
        return parts.isEmpty() ? "" : truncateForEvent("连续识境：" + String.join("；", parts),
                TRIGGER_SCENE_SIGNAL_TEXT_MAX_LENGTH);
    }

    private String buildContinuousAskSceneFusionSummary(JsonNode root, JsonNode visionAgentContext) {
        String previousScene = visionAgentContextText(visionAgentContext, "sceneFusionSummary");
        if (hasText(previousScene)) {
            return truncateForEvent("连续识境：" + previousScene, TRIGGER_SCENE_SIGNAL_TEXT_MAX_LENGTH);
        }
        String poiName = visionAgentContextText(root, "poiName");
        String question = visionAgentContextText(root, "question");
        List<String> parts = new ArrayList<>();
        if (hasText(poiName)) {
            parts.add("上一轮问答对象=" + poiName);
        }
        if (hasText(question)) {
            parts.add("上一轮问题=" + question);
        }
        return parts.isEmpty() ? "" : truncateForEvent("连续识境：" + String.join("；", parts),
                TRIGGER_SCENE_SIGNAL_TEXT_MAX_LENGTH);
    }

    private String buildContinuousTriggerWorldInterfaceSummary(JsonNode previousSignals) {
        String previousWorld = visionAgentContextText(previousSignals, "worldInterfaceSummary");
        if (hasText(previousWorld)) {
            return truncateForEvent("连续识境：" + previousWorld, TRIGGER_SCENE_SIGNAL_TEXT_MAX_LENGTH);
        }
        return "相机沿用上一轮识境上下文，等待用户确认是否继续当前场景。";
    }

    private String buildContinuousAskWorldInterfaceSummary(JsonNode visionAgentContext) {
        String previousWorld = visionAgentContextText(visionAgentContext, "worldInterfaceSummary");
        if (hasText(previousWorld)) {
            return truncateForEvent("连续识境：" + previousWorld, TRIGGER_SCENE_SIGNAL_TEXT_MAX_LENGTH);
        }
        return "相机沿用上一轮问答上下文，等待用户确认是否继续当前场景。";
    }

    private String buildContinuousTriggerDecisionReasonSummary(JsonNode root, JsonNode previousSignals) {
        String previousReason = visionAgentContextText(previousSignals, "agentDecisionReasonSummary");
        if (hasText(previousReason)) {
            return previousReason;
        }
        String reason = visionAgentContextText(root, "reason");
        return hasText(reason) ? "上一轮触发理由：" + reason : "";
    }

    private String buildContinuousAskDecisionReasonSummary(JsonNode visionAgentContext) {
        String previousReason = visionAgentContextText(visionAgentContext, "decisionReasonSummary");
        if (hasText(previousReason)) {
            return previousReason;
        }
        String previousAction = visionAgentContextText(visionAgentContext, "decisionActionTitle");
        return hasText(previousAction) ? "上一轮 Agent 建议：" + previousAction : "";
    }

    private void putSceneSignalIfAbsent(Map<String, Object> sceneSignals, String key, String value) {
        if (!sceneSignals.containsKey(key) && hasText(value)) {
            sceneSignals.put(key, truncateForEvent(value.trim(), TRIGGER_SCENE_SIGNAL_TEXT_MAX_LENGTH));
        }
    }

    @Override
    public PublicReportSummaryRespVO getPublicReportSummary(String packageCode) {
        XunjingResourcePackageDO resourcePackage = validatePublicPackage(packageCode);
        XunjingPublicReportDO report = publicReportMapper.selectLatestByProjectIdAndSchoolId(
                resourcePackage.getProjectId(), resourcePackage.getSchoolId());
        if (report == null) {
            report = publicReportMapper.selectLatestByProjectIdAndSchoolId(resourcePackage.getProjectId(), null);
        }
        if (report == null) {
            throw new IllegalArgumentException("xunjing public report not exists for package: " + packageCode);
        }
        PublicReportSummaryRespVO respVO = new PublicReportSummaryRespVO();
        respVO.setReportId(report.getId());
        respVO.setProjectId(report.getProjectId());
        respVO.setSchoolId(report.getSchoolId());
        respVO.setTitle(report.getTitle());
        respVO.setReportPeriod(report.getReportPeriod());
        respVO.setStatus(report.getStatus());
        respVO.setPackageCount(metricLong(report.getMetricsJson(), "packageCount"));
        respVO.setReviewedKnowledgeCount(metricLong(report.getMetricsJson(), "reviewedKnowledgeCount"));
        respVO.setReviewedMediaCount(metricLong(report.getMetricsJson(), "reviewedMediaCount"));
        respVO.setMapPointCount(metricLong(report.getMetricsJson(), "mapPointCount"));
        respVO.setGlobeModelCount(metricLong(report.getMetricsJson(), "globeModelCount"));
        respVO.setQrCodeCount(metricLong(report.getMetricsJson(), "qrCodeCount"));
        respVO.setInteractionCount(metricLong(report.getMetricsJson(), "interactionCount"));
        respVO.setMediaUsageCount(metricLong(report.getMetricsJson(), "mediaUsageCount"));
        respVO.setAiGenerationCount(metricLong(report.getMetricsJson(), "aiGenerationCount"));
        respVO.setP0Ready(metricBoolean(report.getMetricsJson(), "p0Ready"));
        return respVO;
    }

    private XunjingQrCodeDO resolveAppEventQrCode(AppInteractionEventReqVO reqVO, boolean packageCodeProvided) {
        if (!hasText(reqVO.getSceneCode())) {
            return null;
        }
        XunjingQrCodeDO qrCode = qrCodeMapper.selectBySceneCodeAndStatus(
                reqVO.getSceneCode(), QrCodeStatus.ACTIVE.getStatus());
        if (qrCode == null && !packageCodeProvided) {
            throw new IllegalArgumentException("xunjing qr code not exists: " + reqVO.getSceneCode());
        }
        return qrCode;
    }

    private XunjingResourcePackageDO resolveAppEventPackage(AppInteractionEventReqVO reqVO, XunjingQrCodeDO qrCode) {
        if (hasText(reqVO.getPackageCode())) {
            XunjingResourcePackageDO resourcePackage = validatePublicPackage(reqVO.getPackageCode());
            if (qrCode != null && !resourcePackage.getId().equals(qrCode.getPackageId())) {
                throw new IllegalArgumentException("xunjing qr code does not match package: " + reqVO.getSceneCode());
            }
            return resourcePackage;
        }
        if (qrCode == null) {
            throw new IllegalArgumentException("xunjing app event packageCode or sceneCode is required");
        }
        XunjingResourcePackageDO resourcePackage = resourcePackageMapper.selectByIdAndStatus(
                qrCode.getPackageId(), PackageStatus.PUBLISHED.getStatus());
        if (resourcePackage == null) {
            throw new IllegalArgumentException("xunjing public resource package not exists: " + qrCode.getPackageId());
        }
        return resourcePackage;
    }

    private String normalizeAppEventType(String eventType) {
        String normalized = defaultIfBlank(eventType, EventType.VIEW.getType()).trim().toUpperCase(Locale.ROOT);
        for (EventType value : EventType.values()) {
            if (value.getType().equals(normalized)) {
                return normalized;
            }
        }
        throw new IllegalArgumentException("xunjing app event type invalid: " + eventType);
    }

    private void validateExpectedResourceType(XunjingResourcePackageDO resourcePackage, String expectedResourceType) {
        if (!hasText(expectedResourceType)) {
            return;
        }
        if (!expectedResourceType.equals(resourcePackage.getResourceType())) {
            throw new IllegalArgumentException("xunjing resource type mismatch: expected "
                    + expectedResourceType + ", actual " + resourcePackage.getResourceType());
        }
    }

    private XunjingQrCodeDO resolveQrCode(ScanResolveReqVO reqVO) {
        if (!hasText(reqVO.getSceneCode())) {
            return null;
        }
        return qrCodeMapper.selectBySceneCodeAndStatus(reqVO.getSceneCode(), QrCodeStatus.ACTIVE.getStatus());
    }

    private XunjingQrCodeDO resolveAnswerQrCode(RagChatReqVO reqVO, XunjingResourcePackageDO resourcePackage) {
        if (!hasText(reqVO.getQrSceneCode())) {
            return null;
        }
        XunjingQrCodeDO qrCode = qrCodeMapper.selectBySceneCodeAndStatus(
                reqVO.getQrSceneCode(), QrCodeStatus.ACTIVE.getStatus());
        if (qrCode == null) {
            throw new IllegalArgumentException("xunjing qr code not exists: " + reqVO.getQrSceneCode());
        }
        if (!resourcePackage.getId().equals(qrCode.getPackageId())) {
            throw new IllegalArgumentException("xunjing qr code does not match package: " + reqVO.getQrSceneCode());
        }
        return qrCode;
    }

    private XunjingResourcePackageDO resolvePublicPackage(ScanResolveReqVO reqVO, XunjingQrCodeDO qrCode) {
        if (hasText(reqVO.getPackageCode())) {
            XunjingResourcePackageDO resourcePackage = validatePublicPackage(reqVO.getPackageCode());
            if (qrCode != null && !resourcePackage.getId().equals(qrCode.getPackageId())) {
                throw new IllegalArgumentException("xunjing qr code does not match package: " + reqVO.getSceneCode());
            }
            return resourcePackage;
        }
        if (qrCode == null) {
            throw new IllegalArgumentException("xunjing qr code not exists: " + reqVO.getSceneCode());
        }
        XunjingResourcePackageDO resourcePackage = resourcePackageMapper.selectByIdAndStatus(
                qrCode.getPackageId(), PackageStatus.PUBLISHED.getStatus());
        if (resourcePackage == null) {
            throw new IllegalArgumentException("xunjing public resource package not exists: " + qrCode.getPackageId());
        }
        return resourcePackage;
    }

    private XunjingResourcePackageDO validatePublicPackage(String packageCode) {
        XunjingResourcePackageDO resourcePackage = resourcePackageMapper.selectByPackageCodeAndStatus(
                packageCode, PackageStatus.PUBLISHED.getStatus());
        if (resourcePackage == null) {
            throw new IllegalArgumentException("xunjing public resource package not exists: " + packageCode);
        }
        return resourcePackage;
    }

    private List<SourceRespVO> searchPublicSources(XunjingResourcePackageDO resourcePackage, RagChatReqVO reqVO) {
        String question = buildSourceSearchText(reqVO);
        List<SourceRespVO> yudaoAiSources = filterSourcesByPoiContext(
                searchYudaoAiKnowledgeSources(resourcePackage, question), reqVO);
        if (!yudaoAiSources.isEmpty()) {
            return yudaoAiSources;
        }
        List<SourceRespVO> knowledgeSources = knowledgeDocumentMapper.selectPublicListByPackageId(
                        resourcePackage.getId(), ReviewStatus.APPROVED.getStatus(), VectorStatus.INDEXED.getStatus())
                .stream()
                .map(document -> toSource(document, question))
                .sorted(Comparator.comparing(SourceRespVO::getScore).reversed())
                .limit(TOP_K)
                .toList();
        return filterSourcesByPoiContext(knowledgeSources, reqVO);
    }

    private List<SourceRespVO> searchYudaoAiKnowledgeSources(XunjingResourcePackageDO resourcePackage, String question) {
        if (resourcePackage == null || resourcePackage.getAiKnowledgeId() == null || aiKnowledgeSegmentService == null) {
            return List.of();
        }
        AiKnowledgeSegmentSearchReqBO reqBO = new AiKnowledgeSegmentSearchReqBO();
        reqBO.setKnowledgeId(resourcePackage.getAiKnowledgeId());
        reqBO.setContent(question);
        reqBO.setTopK(TOP_K);
        reqBO.setSimilarityThreshold(0.30D);
        List<AiKnowledgeSegmentSearchRespBO> segments = aiKnowledgeSegmentService.searchKnowledgeSegment(reqBO);
        if (segments == null || segments.isEmpty()) {
            return List.of();
        }
        return segments.stream()
                .map(this::toSource)
                .sorted(Comparator.comparing(SourceRespVO::getScore).reversed())
                .limit(TOP_K)
                .toList();
    }

    private SourceRespVO toSource(XunjingKnowledgeDocumentDO document, String question) {
        SourceRespVO source = new SourceRespVO();
        source.setId(document.getId());
        source.setTitle(document.getTitle());
        source.setSourceType(document.getSourceType());
        source.setSourceUrl(document.getSourceUrl());
        source.setContentDigest(document.getContentDigest());
        source.setScore(score(document, question));
        return source;
    }

    private SourceRespVO toSource(AiKnowledgeSegmentSearchRespBO segment) {
        SourceRespVO source = new SourceRespVO();
        source.setId(segment.getId());
        source.setTitle("Yudao AI 知识库段落 " + segment.getId());
        source.setSourceType("YudaoAI");
        source.setSourceUrl("yudao-ai://knowledge/" + segment.getKnowledgeId() + "/segment/" + segment.getId());
        source.setContentDigest(segment.getContent());
        source.setScore(segment.getScore() == null ? 0.60D : segment.getScore());
        return source;
    }

    private List<SourceRespVO> filterSourcesByPoiContext(List<SourceRespVO> sources, RagChatReqVO reqVO) {
        if (!hasPoiSourceConstraint(reqVO)) {
            return sources;
        }
        return sources.stream()
                .filter(source -> sourceMatchesPoiContext(source, reqVO))
                .toList();
    }

    private boolean hasPoiSourceConstraint(RagChatReqVO reqVO) {
        return hasText(reqVO.getPoiCode()) || hasText(reqVO.getPoiName());
    }

    private boolean sourceMatchesPoiContext(SourceRespVO source, RagChatReqVO reqVO) {
        String sourceText = normalizeSearchText(defaultIfBlank(source.getTitle(), "")
                + "\n" + defaultIfBlank(source.getContentDigest(), "")
                + "\n" + defaultIfBlank(source.getSourceUrl(), ""));
        if (hasText(reqVO.getPoiCode()) && sourceText.contains(normalizeSearchText(reqVO.getPoiCode()))) {
            return true;
        }
        if (hasText(reqVO.getPoiName()) && sourceText.contains(normalizeSearchText(reqVO.getPoiName()))) {
            return true;
        }
        return searchTokens(reqVO.getPoiName()).stream()
                .map(this::normalizeSearchText)
                .anyMatch(sourceText::contains);
    }

    private double score(XunjingKnowledgeDocumentDO document, String question) {
        double score = 0.60D;
        String text = normalizeSearchText((document.getTitle() == null ? "" : document.getTitle())
                + (document.getContentDigest() == null ? "" : document.getContentDigest()));
        if (question != null && !question.isBlank()) {
            for (String keyword : List.of("喀什", "古城", "新疆", "地图", "地球仪", "图书", "孩子", "研学")) {
                if (question.contains(keyword) && text.contains(keyword)) {
                    score += 0.05D;
                }
            }
            for (String token : searchTokens(question)) {
                if (text.contains(token)) {
                    score += 0.08D;
                }
            }
        }
        return Math.min(score, 0.95D);
    }

    private List<String> searchTokens(String query) {
        Matcher matcher = Pattern.compile("[\\p{IsHan}\\p{Alnum}-]{2,}").matcher(normalizeSearchText(query));
        List<String> tokens = new java.util.ArrayList<>();
        while (matcher.find() && tokens.size() < 20) {
            String token = matcher.group();
            if (!tokens.contains(token)) {
                tokens.add(token);
            }
        }
        return tokens;
    }

    private String normalizeSearchText(String value) {
        return defaultIfBlank(value, "").toLowerCase(Locale.ROOT);
    }

    private AnswerGenerationResult generateAnswer(RagChatReqVO reqVO, List<SourceRespVO> sources) {
        AnswerGenerationResult aiGenerated = tryGenerateAnswerByYudaoAi(reqVO, sources);
        if (aiGenerated != null) {
            return aiGenerated;
        }
        SourceRespVO first = sources.get(0);
        return new AnswerGenerationResult("根据已审核资料《" + first.getTitle() + "》：" + first.getContentDigest()
                + " 这个回答基于当前资源包的公开知识来源，可继续追问更具体的问题。",
                "xunjing-rag-facade", "p0-rag-facade-2026-06-21");
    }

    private AnswerGenerationResult tryGenerateAnswerByYudaoAi(RagChatReqVO reqVO, List<SourceRespVO> sources) {
        if (aiModelService == null) {
            return null;
        }
        try {
            AiModelDO model = aiModelService.getRequiredDefaultModel(AiModelTypeEnum.CHAT.getType());
            if (model == null || model.getId() == null) {
                return null;
            }
            ChatModel chatModel = aiModelService.getChatModel(model.getId());
            if (chatModel == null) {
                return null;
            }
            ChatResponse response = chatModel.call(buildRagPrompt(reqVO, sources, model));
            String content = AiUtils.getChatResponseContent(response);
            if (!hasText(content)) {
                return null;
            }
            return new AnswerGenerationResult(content, defaultIfBlank(model.getModel(), "yudao-ai-chat"),
                    "p0-rag-yudao-ai-2026-06-21");
        } catch (Exception ex) {
            log.warn("[tryGenerateAnswerByYudaoAi][question({}) sourceCount({}) fallback]",
                    reqVO.getQuestion(), sources.size(), ex);
            return null;
        }
    }

    private Prompt buildRagPrompt(RagChatReqVO reqVO, List<SourceRespVO> sources, AiModelDO model) {
        String system = """
                你是星河寻境文旅研学 AI 讲解员。必须基于后台提供的资料来源回答，不允许编造未给出的史实、机构、人物、价格、开放时间或路线。
                如果资料不足，需要明确说明资料不足，并引导用户换一个更具体的问题。
                回答要面向中小学生和亲子研学场景，语言清晰、准确、温和。
                """;
        String references = sources.stream()
                .map(source -> "[" + source.getId() + "] " + defaultIfBlank(source.getTitle(), "未命名资料")
                        + "\n来源：" + defaultIfBlank(source.getSourceUrl(), source.getSourceType())
                        + "\n内容：" + defaultIfBlank(source.getContentDigest(), ""))
                .collect(Collectors.joining("\n\n"));
        String user = "用户问题：\n" + reqVO.getQuestion()
                + "\n\n上下文：\n" + buildChatContextText(reqVO)
                + "\n\n后台资料来源：\n" + references
                + "\n\n请直接给出回答，并在回答末尾用一句话说明“本回答基于已审核资料”。";
        ChatOptions options = AiUtils.buildChatOptions(AiPlatformEnum.validatePlatform(model.getPlatform()),
                model.getModel(), model.getTemperature(), model.getMaxTokens());
        return new Prompt(List.of(new SystemMessage(system), new UserMessage(user)), options);
    }

    private void recordAskEvent(XunjingResourcePackageDO resourcePackage, RagChatReqVO reqVO) {
        XunjingInteractionEventDO event = new XunjingInteractionEventDO();
        event.setPackageId(resourcePackage.getId());
        event.setSchoolId(resourcePackage.getSchoolId());
        event.setEventType(EventType.ASK.getType());
        event.setSourceChannel(defaultIfBlank(reqVO.getSourceChannel(), "mini-program"));
        event.setUserTraceId(reqVO.getUserTraceId());
        event.setPayloadJson(buildAskEventPayload(reqVO));
        event.setTenantId(TenantContextHolder.getRequiredTenantId());
        interactionEventMapper.insert(event);
    }

    private String buildAskEventPayload(RagChatReqVO reqVO) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sceneCode", defaultIfBlank(reqVO.getSceneCode(), DEFAULT_CHAT_SCENE_CODE));
        payload.put("question", reqVO.getQuestion());
        payload.put("regionCode", defaultIfBlank(reqVO.getRegionCode(), ""));
        payload.put("poiCode", defaultIfBlank(reqVO.getPoiCode(), ""));
        payload.put("poiName", defaultIfBlank(reqVO.getPoiName(), ""));
        payload.put("routeId", defaultIfBlank(reqVO.getRouteId(), ""));
        payload.put("visionAgentContext", buildVisionAgentChatContextPayload(reqVO));
        return JsonUtils.toJsonString(payload);
    }

    private void hydrateVisionAgentMemoryFromPreviousAsk(XunjingResourcePackageDO resourcePackage, RagChatReqVO reqVO) {
        if (hasText(reqVO.getVisionAgentMemorySessionText()) || !hasText(reqVO.getUserTraceId())) {
            return;
        }
        XunjingInteractionEventDO previousEvent =
                interactionEventMapper.selectLatestByPackageIdAndUserTraceIdAndEventType(
                        resourcePackage.getId(), reqVO.getUserTraceId(), EventType.ASK.getType());
        if (previousEvent == null || !hasText(previousEvent.getPayloadJson())) {
            return;
        }
        try {
            JsonNode root = JsonUtils.parseTree(previousEvent.getPayloadJson());
            JsonNode visionAgentContext = root == null ? null : root.get("visionAgentContext");
            String memoryText = buildPreviousVisionAgentMemoryText(visionAgentContext);
            if (!hasText(memoryText)) {
                return;
            }
            reqVO.setVisionAgentMemorySessionText(memoryText);
            if (reqVO.getVisionAgentMemorySessionSceneCount() == null
                    || reqVO.getVisionAgentMemorySessionSceneCount() <= 0) {
                int previousSceneCount = visionAgentContext.path("memorySessionSceneCount").asInt(0);
                reqVO.setVisionAgentMemorySessionSceneCount(previousSceneCount > 0 ? previousSceneCount : 1);
            }
            if (!Boolean.TRUE.equals(reqVO.getVisionAgentContextAvailable())) {
                reqVO.setVisionAgentContextAvailable(true);
            }
        } catch (RuntimeException ex) {
            log.warn("[hydrateVisionAgentMemoryFromPreviousAsk][eventId({}) parse failed]",
                    previousEvent.getId(), ex);
        }
    }

    private void hydrateVisionAgentContextFromPreviousTrigger(
            XunjingResourcePackageDO resourcePackage, RagChatReqVO reqVO) {
        if (!hasText(reqVO.getUserTraceId()) || hasCompleteSceneContext(reqVO)) {
            return;
        }
        XunjingInteractionEventDO previousEvent =
                interactionEventMapper.selectLatestByPackageIdAndUserTraceIdAndEventType(
                        resourcePackage.getId(), reqVO.getUserTraceId(), EventType.TRIGGER_RESOLVE.getType());
        if (previousEvent == null || !hasText(previousEvent.getPayloadJson())) {
            return;
        }
        try {
            JsonNode root = JsonUtils.parseTree(previousEvent.getPayloadJson());
            if (root == null || root.isNull() || root.isMissingNode()) {
                return;
            }
            hydrateTriggerPoiContext(reqVO, root);
            JsonNode sceneSignals = root.path("sceneSignals");
            if (!hasText(reqVO.getVisionAgentMemorySessionText())) {
                String memoryText = buildPreviousTriggerMemoryText(root, sceneSignals);
                if (hasText(memoryText)) {
                    reqVO.setVisionAgentMemorySessionText(memoryText);
                }
            }
            hydrateTriggerSceneSignalText(reqVO, sceneSignals);
            hydrateTriggerSceneCount(reqVO, sceneSignals);
            hydrateTriggerServiceHandoff(reqVO, root);
            if (!Boolean.TRUE.equals(reqVO.getVisionAgentContextAvailable())
                    && (hasText(reqVO.getVisionAgentMemorySessionText()) || hasText(reqVO.getPoiName()))) {
                reqVO.setVisionAgentContextAvailable(true);
            }
        } catch (RuntimeException ex) {
            log.warn("[hydrateVisionAgentContextFromPreviousTrigger][eventId({}) parse failed]",
                    previousEvent.getId(), ex);
        }
    }

    private boolean hasCompleteSceneContext(RagChatReqVO reqVO) {
        return hasText(reqVO.getVisionAgentMemorySessionText())
                && hasText(reqVO.getRegionCode())
                && hasText(reqVO.getPoiCode())
                && hasText(reqVO.getPoiName());
    }

    private void hydrateTriggerPoiContext(RagChatReqVO reqVO, JsonNode root) {
        putReqTextIfBlank(reqVO::getRegionCode, reqVO::setRegionCode, root, "regionCode");
        putReqTextIfBlank(reqVO::getPoiCode, reqVO::setPoiCode, root, "poiCode");
        putReqTextIfBlank(reqVO::getPoiName, reqVO::setPoiName, root, "poiName");
    }

    private String buildPreviousTriggerMemoryText(JsonNode root, JsonNode sceneSignals) {
        List<String> parts = new ArrayList<>();
        putPreviousJsonMemoryPart(parts, "识别对象", root, "poiName");
        putPreviousJsonMemoryPart(parts, "识别原因", root, "reason");
        putPreviousJsonMemoryPart(parts, "上次识境", sceneSignals, "sceneFusionSummary");
        putPreviousJsonMemoryPart(parts, "上次世界入口", sceneSignals, "worldInterfaceSummary");
        String domain = previousTriggerDomainText(sceneSignals);
        if (hasText(domain)) {
            parts.add("场景域=" + domain);
        }
        putPreviousJsonMemoryPart(parts, "Agent理由", sceneSignals, "agentDecisionReasonSummary");
        putPreviousJsonMemoryPart(parts, "OCR", root, "ocrText");
        return String.join("；", parts);
    }

    private void hydrateTriggerSceneSignalText(RagChatReqVO reqVO, JsonNode sceneSignals) {
        putReqTextIfBlank(reqVO::getVisionAgentSceneFusionSummary, reqVO::setVisionAgentSceneFusionSummary,
                sceneSignals, "sceneFusionSummary");
        putReqTextIfBlank(reqVO::getVisionAgentWorldInterfaceSummary, reqVO::setVisionAgentWorldInterfaceSummary,
                sceneSignals, "worldInterfaceSummary");
        putReqTextIfBlank(reqVO::getVisionAgentPrimarySceneDomainKey, reqVO::setVisionAgentPrimarySceneDomainKey,
                sceneSignals, "sceneDomainIntentKey");
        putReqTextIfBlank(reqVO::getVisionAgentPrimarySceneDomainLabel, reqVO::setVisionAgentPrimarySceneDomainLabel,
                sceneSignals, "sceneDomainIntentLabel");
        putReqTextIfBlank(reqVO::getVisionAgentDecisionActionTitle, reqVO::setVisionAgentDecisionActionTitle,
                sceneSignals, "agentDecisionActionTitle");
        putReqTextIfBlank(reqVO::getVisionAgentDecisionReasonSummary, reqVO::setVisionAgentDecisionReasonSummary,
                sceneSignals, "agentDecisionReasonSummary");
        putReqTextIfBlank(reqVO::getVisionAgentLocalTimeText, reqVO::setVisionAgentLocalTimeText,
                sceneSignals, "localTimeText");
        putReqTextIfBlank(reqVO::getVisionAgentWeatherText, reqVO::setVisionAgentWeatherText,
                sceneSignals, "weatherText");
        putReqTextIfBlank(reqVO::getVisionAgentHeadingText, reqVO::setVisionAgentHeadingText,
                sceneSignals, "headingText");
    }

    private void hydrateTriggerServiceHandoff(RagChatReqVO reqVO, JsonNode root) {
        String action = visionAgentContextText(root, "action");
        String intent = visionAgentContextText(root, "intent");
        String triggerType = visionAgentContextText(root, "triggerType");
        if (!hasText(action) && !hasText(intent)) {
            return;
        }
        putTextIfBlank(reqVO::getServiceHandoffActionKey, reqVO::setServiceHandoffActionKey, action);
        putTextIfBlank(reqVO::getServiceHandoffTaskType, reqVO::setServiceHandoffTaskType, triggerType);
        putTextIfBlank(reqVO::getServiceHandoffIntent, reqVO::setServiceHandoffIntent, intent);
        putTextIfBlank(reqVO::getServiceHandoffIntentText, reqVO::setServiceHandoffIntentText,
                triggerIntentText(intent));
        putTextIfBlank(reqVO::getServiceHandoffStepText, reqVO::setServiceHandoffStepText,
                triggerConfirmText(root.path("requiresUserConfirm").asBoolean(false)));
        putTextIfBlank(reqVO::getServiceHandoffSummary, reqVO::setServiceHandoffSummary,
                buildTriggerServiceHandoffSummary(action, intent, root));
        if (reqVO.getServiceHandoffRequiresRealSystem() == null) {
            reqVO.setServiceHandoffRequiresRealSystem(triggerRequiresRealSystem(action, intent));
        }
        putTextIfBlank(reqVO::getVisionAgentDecisionActionTitle, reqVO::setVisionAgentDecisionActionTitle,
                triggerActionTitle(action, intent));
    }

    private String buildTriggerServiceHandoffSummary(String action, String intent, JsonNode root) {
        List<String> parts = new ArrayList<>();
        if (hasText(action)) {
            parts.add("上一轮识境动作=" + action);
        }
        if (hasText(intent)) {
            parts.add("意图=" + intent);
        }
        parts.add("需用户确认=" + root.path("requiresUserConfirm").asBoolean(false));
        putPreviousJsonMemoryPart(parts, "触发理由", root, "reason");
        return String.join("；", parts);
    }

    private String triggerActionTitle(String action, String intent) {
        if ("open_route_recommendation".equals(action) || "confirm_route_recommendation".equals(action)) {
            return "推荐下一站路线";
        }
        if ("open_food_recommendation".equals(action) || "confirm_food_recommendation".equals(action)) {
            return "推荐附近美食";
        }
        if ("start_travel_note".equals(action) || "confirm_travel_note".equals(action)) {
            return "生成旅行记录";
        }
        if ("open_activity_handoff".equals(action) || "confirm_activity_handoff".equals(action)) {
            return "活动票务";
        }
        if ("start_sign_translation".equals(action) || "confirm_sign_translation".equals(action)) {
            return "路牌翻译";
        }
        if ("start_safety_advisory".equals(action) || "confirm_safety_advisory".equals(action)) {
            return "安全提醒";
        }
        if ("start_ai_guide".equals(action) || "confirm_ai_guide".equals(action)) {
            return "开始 AI 讲解";
        }
        if ("ask_ai_companion".equals(action)) {
            return "继续问 AI 旅伴";
        }
        if ("route".equals(intent)) {
            return "推荐下一站路线";
        }
        if ("food".equals(intent)) {
            return "推荐附近美食";
        }
        if ("record".equals(intent)) {
            return "生成旅行记录";
        }
        if ("activity".equals(intent)) {
            return "活动票务";
        }
        if ("translate".equals(intent)) {
            return "路牌翻译";
        }
        if ("safety".equals(intent)) {
            return "安全提醒";
        }
        return hasText(action) ? action : intent;
    }

    private boolean triggerRequiresRealSystem(String action, String intent) {
        return "food".equals(intent)
                || "activity".equals(intent)
                || "open_food_recommendation".equals(action)
                || "confirm_food_recommendation".equals(action)
                || "open_activity_handoff".equals(action)
                || "confirm_activity_handoff".equals(action);
    }

    private String triggerIntentText(String intent) {
        if ("route".equals(intent)) {
            return "路线推荐";
        }
        if ("food".equals(intent)) {
            return "美食推荐";
        }
        if ("record".equals(intent)) {
            return "旅行记录";
        }
        if ("activity".equals(intent)) {
            return "活动票务";
        }
        if ("translate".equals(intent)) {
            return "路牌翻译";
        }
        if ("safety".equals(intent)) {
            return "安全提醒";
        }
        if ("guide".equals(intent)) {
            return "AI 讲解";
        }
        return intent;
    }

    private String triggerConfirmText(boolean requiresUserConfirm) {
        return requiresUserConfirm ? "需要用户确认" : "无需用户确认";
    }

    private void hydrateTriggerSceneCount(RagChatReqVO reqVO, JsonNode sceneSignals) {
        if (reqVO.getVisionAgentMemorySessionSceneCount() != null
                && reqVO.getVisionAgentMemorySessionSceneCount() > 0) {
            return;
        }
        int previousSceneCount = sceneSignals.path("memorySessionSceneCount").asInt(0);
        reqVO.setVisionAgentMemorySessionSceneCount(previousSceneCount > 0 ? previousSceneCount : 1);
    }

    private String previousTriggerDomainText(JsonNode sceneSignals) {
        String key = visionAgentContextText(sceneSignals, "sceneDomainIntentKey");
        String label = visionAgentContextText(sceneSignals, "sceneDomainIntentLabel");
        if (hasText(key) && hasText(label)) {
            return key + "/" + label;
        }
        return hasText(key) ? key : label;
    }

    private void putPreviousJsonMemoryPart(List<String> parts, String label, JsonNode context, String key) {
        String text = visionAgentContextText(context, key);
        if (hasText(text)) {
            parts.add(label + "=" + text);
        }
    }

    private void putReqTextIfBlank(
            java.util.function.Supplier<String> getter, java.util.function.Consumer<String> setter,
            JsonNode context, String key) {
        if (hasText(getter.get())) {
            return;
        }
        String text = visionAgentContextText(context, key);
        if (hasText(text)) {
            setter.accept(text);
        }
    }

    private void putTextIfBlank(
            java.util.function.Supplier<String> getter, java.util.function.Consumer<String> setter, String text) {
        if (!hasText(getter.get()) && hasText(text)) {
            setter.accept(truncateForEvent(text.trim(), CHAT_CONTEXT_TEXT_MAX_LENGTH));
        }
    }

    private String buildPreviousVisionAgentMemoryText(JsonNode visionAgentContext) {
        if (visionAgentContext == null || visionAgentContext.isNull() || visionAgentContext.isMissingNode()) {
            return "";
        }
        List<String> parts = new ArrayList<>();
        putPreviousVisionMemoryPart(parts, "上次识境", visionAgentContext, "sceneFusionSummary");
        putPreviousVisionMemoryPart(parts, "上次世界入口", visionAgentContext, "worldInterfaceSummary");
        String domain = previousVisionAgentDomainText(visionAgentContext);
        if (hasText(domain)) {
            parts.add("场景域=" + domain);
        }
        putPreviousVisionMemoryPart(parts, "场景理解", visionAgentContext, "sceneUnderstandingSummary");
        putPreviousVisionMemoryPart(parts, "Agent理由", visionAgentContext, "decisionReasonSummary");
        putPreviousVisionMemoryPart(parts, "服务承接", visionAgentContext, "serviceHandoffSummary");
        return String.join("；", parts);
    }

    private void putPreviousVisionMemoryPart(List<String> parts, String label, JsonNode context, String key) {
        String text = visionAgentContextText(context, key);
        if (hasText(text)) {
            parts.add(label + "=" + text);
        }
    }

    private String previousVisionAgentDomainText(JsonNode context) {
        String key = visionAgentContextText(context, "primarySceneDomainKey");
        String label = visionAgentContextText(context, "primarySceneDomainLabel");
        if (hasText(key) && hasText(label)) {
            return key + "/" + label;
        }
        return hasText(key) ? key : label;
    }

    private String visionAgentContextText(JsonNode context, String key) {
        if (context == null || context.get(key) == null || context.get(key).isNull()) {
            return "";
        }
        String text = context.get(key).asText("").trim();
        return hasText(text) ? truncateForEvent(text, CHAT_CONTEXT_TEXT_MAX_LENGTH) : "";
    }

    private void recordTriggerResolveEventIfPossible(MultimodalTriggerReqVO reqVO, MultimodalTriggerRespVO respVO) {
        if (!hasText(reqVO.getPackageCode())) {
            return;
        }
        XunjingResourcePackageDO resourcePackage = validatePublicPackage(reqVO.getPackageCode());

        XunjingInteractionEventDO event = new XunjingInteractionEventDO();
        event.setPackageId(resourcePackage.getId());
        event.setSchoolId(resourcePackage.getSchoolId());
        event.setEventType(EventType.TRIGGER_RESOLVE.getType());
        event.setSourceChannel(defaultIfBlank(reqVO.getSourceChannel(), "mini-program"));
        event.setUserTraceId(reqVO.getUserTraceId());
        event.setPayloadJson(buildTriggerResolveEventPayload(reqVO, respVO));
        event.setTenantId(TenantContextHolder.getRequiredTenantId());
        interactionEventMapper.insert(event);
    }

    private String buildTriggerResolveEventPayload(MultimodalTriggerReqVO reqVO, MultimodalTriggerRespVO respVO) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("packageCode", defaultIfBlank(reqVO.getPackageCode(), ""));
        payload.put("sceneCode", defaultIfBlank(reqVO.getSceneCode(), ""));
        payload.put("regionCode", defaultIfBlank(respVO.getRegionCode(), defaultIfBlank(reqVO.getRegionCode(), "")));
        payload.put("intent", defaultIfBlank(respVO.getIntent(), ""));
        payload.put("action", defaultIfBlank(respVO.getAction(), ""));
        payload.put("triggerType", defaultIfBlank(respVO.getTriggerType(), ""));
        payload.put("poiCode", defaultIfBlank(respVO.getPoiCode(), ""));
        payload.put("poiName", defaultIfBlank(respVO.getPoiName(), ""));
        payload.put("confidence", respVO.getConfidence());
        payload.put("requiresUserConfirm", respVO.getRequiresUserConfirm());
        payload.put("reason", defaultIfBlank(respVO.getReason(), ""));
        payload.put("text", truncateForEvent(reqVO.getText(), 200));
        payload.put("ocrText", truncateForEvent(reqVO.getOcrText(), 200));
        payload.put("imageLabelCount", reqVO.getImageLabels() == null ? 0 : reqVO.getImageLabels().size());
        payload.put("recentPoiCount", reqVO.getRecentPoiCodes() == null ? 0 : reqVO.getRecentPoiCodes().size());
        payload.put("sceneSignals", buildTriggerSceneSignalsPayload(reqVO.getSceneSignals()));
        payload.put("location", buildTriggerLocationPayload(reqVO.getLocation()));
        payload.put("photoMeta", buildTriggerPhotoMetaPayload(reqVO.getPhotoMeta()));
        payload.put("matchedSignals", buildTriggerMatchedSignalsPayload(respVO));
        payload.put("candidateCount", respVO.getCandidates() == null ? 0 : respVO.getCandidates().size());
        payload.put("sourceCount", respVO.getSources() == null ? 0 : respVO.getSources().size());
        return JsonUtils.toJsonString(payload);
    }

    private List<String> buildTriggerMatchedSignalsPayload(MultimodalTriggerRespVO respVO) {
        if (respVO == null || respVO.getCandidates() == null || respVO.getCandidates().isEmpty()
                || respVO.getCandidates().get(0).getMatchedSignals() == null) {
            return List.of();
        }
        return respVO.getCandidates().get(0).getMatchedSignals().stream()
                .filter(this::hasText)
                .map(signal -> truncateForEvent(signal.trim(), 50))
                .distinct()
                .limit(12)
                .toList();
    }

    private Map<String, Object> buildTriggerSceneSignalsPayload(Map<String, Object> sceneSignals) {
        if (sceneSignals == null || sceneSignals.isEmpty()) {
            return Map.of();
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        for (String key : TRIGGER_SCENE_SIGNAL_TEXT_KEYS) {
            putTriggerSceneSignalText(payload, sceneSignals, key);
        }
        putTriggerSceneSignalNumber(payload, sceneSignals, "headingDegrees", true);
        putTriggerSceneSignalNumber(payload, sceneSignals, "memorySessionSceneCount", false);
        putTriggerSceneSignalNumber(payload, sceneSignals, "visionRecognitionLabelCount", false);
        return payload;
    }

    private void putTriggerSceneSignalText(Map<String, Object> payload, Map<String, Object> sceneSignals, String key) {
        Object value = sceneSignals.get(key);
        if (value == null) {
            return;
        }
        String text = String.valueOf(value).trim();
        if (hasText(text)) {
            payload.put(key, truncateForEvent(text, TRIGGER_SCENE_SIGNAL_TEXT_MAX_LENGTH));
        }
    }

    private void putTriggerSceneSignalNumber(
            Map<String, Object> payload, Map<String, Object> sceneSignals, String key, boolean normalizeHeading) {
        Double value = triggerSceneSignalNumber(sceneSignals.get(key));
        if (value == null || !Double.isFinite(value)) {
            return;
        }
        long rounded = Math.round(value);
        if (normalizeHeading) {
            payload.put(key, (int) (((rounded % 360) + 360) % 360));
            return;
        }
        if (rounded >= 0) {
            payload.put(key, rounded);
        }
    }

    private Double triggerSceneSignalNumber(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value instanceof String text && hasText(text)) {
            try {
                return Double.valueOf(text.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private Map<String, Object> buildTriggerLocationPayload(LocationPointReqVO location) {
        if (location == null) {
            return Map.of();
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("latitude", location.getLatitude());
        payload.put("longitude", location.getLongitude());
        payload.put("coordType", defaultIfBlank(location.getCoordType(), ""));
        payload.put("accuracyMeters", location.getAccuracyMeters());
        return payload;
    }

    private Map<String, Object> buildTriggerPhotoMetaPayload(PhotoMetaReqVO photoMeta) {
        if (photoMeta == null) {
            return Map.of();
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("imageId", defaultIfBlank(photoMeta.getImageId(), ""));
        payload.put("takenAt", defaultIfBlank(photoMeta.getTakenAt(), ""));
        payload.put("imageMimeType", defaultIfBlank(photoMeta.getImageMimeType(), ""));
        payload.put("imageWidth", photoMeta.getImageWidth());
        payload.put("imageHeight", photoMeta.getImageHeight());
        payload.put("exifLocation", buildTriggerLocationPayload(photoMeta.getExifLocation()));
        return payload;
    }

    private void recordScanEvent(XunjingResourcePackageDO resourcePackage, ScanResolveReqVO reqVO, XunjingQrCodeDO qrCode) {
        XunjingInteractionEventDO event = new XunjingInteractionEventDO();
        event.setPackageId(resourcePackage.getId());
        event.setSchoolId(resourcePackage.getSchoolId());
        event.setEventType(EventType.SCAN.getType());
        event.setSourceChannel("mini-program");
        event.setUserTraceId(reqVO.getUserTraceId());
        event.setPayloadJson("{\"sceneCode\":\"" + jsonEscape(defaultIfBlank(reqVO.getSceneCode(), ""))
                + "\",\"qrCodeId\":" + (qrCode == null ? "null" : qrCode.getId()) + "}");
        event.setTenantId(TenantContextHolder.getRequiredTenantId());
        interactionEventMapper.insert(event);
    }

    private Long recordAiGeneration(
            XunjingResourcePackageDO resourcePackage, XunjingQrCodeDO qrCode, RagChatReqVO reqVO,
            AnswerGenerationResult answer,
            List<SourceRespVO> sources) {
        XunjingAiGenerationLogDO aiLog = new XunjingAiGenerationLogDO();
        aiLog.setProjectId(resourcePackage.getProjectId());
        aiLog.setSchoolId(resourcePackage.getSchoolId());
        aiLog.setPackageId(resourcePackage.getId());
        aiLog.setQrCodeId(qrCode == null ? null : qrCode.getId());
        aiLog.setSceneCode(defaultIfBlank(reqVO.getSceneCode(), DEFAULT_CHAT_SCENE_CODE));
        aiLog.setUserTraceId(effectiveUserTraceId(reqVO));
        aiLog.setModelCode(answer.modelCode());
        aiLog.setPromptVersion(answer.promptVersion());
        aiLog.setInputSummary(buildChatInputSummary(reqVO));
        aiLog.setOutputSummary(answer.answer());
        aiLog.setSourceJson(buildSourceJson(sources));
        aiLog.setTokenCount((long) (defaultIfBlank(reqVO.getQuestion(), "").length() + answer.answer().length()));
        aiLog.setCostAmount(BigDecimal.ZERO);
        aiLog.setSafetyStatus(AiSafetyStatus.PASSED.getStatus());
        aiLog.setCacheHit(false);
        aiLog.setTenantId(TenantContextHolder.getRequiredTenantId());
        aiGenerationLogMapper.insert(aiLog);
        return aiLog.getId();
    }

    private CachedAnswer getCachedAnswerIfEnabled(
            XunjingResourcePackageDO resourcePackage, XunjingQrCodeDO qrCode, RagChatReqVO reqVO) {
        String sceneCode = defaultIfBlank(reqVO.getSceneCode(), DEFAULT_CHAT_SCENE_CODE);
        if (!isCacheEnabled(resourcePackage, qrCode, sceneCode)) {
            return null;
        }
        XunjingAiGenerationLogDO cachedLog = aiGenerationLogMapper.selectLatestCacheCandidate(
                resourcePackage.getId(), qrCode == null ? null : qrCode.getId(), effectiveUserTraceId(reqVO),
                sceneCode, buildChatInputSummary(reqVO), LocalDate.now().atStartOfDay(),
                AiSafetyStatus.PASSED.getStatus());
        if (cachedLog == null || !hasText(cachedLog.getOutputSummary())) {
            return null;
        }
        List<SourceRespVO> sources = parseCachedSources(cachedLog.getSourceJson());
        return new CachedAnswer(cachedLog.getOutputSummary(), sources, cachedLog.getSourceJson());
    }

    private boolean isCacheEnabled(
            XunjingResourcePackageDO resourcePackage, XunjingQrCodeDO qrCode, String sceneCode) {
        List<XunjingAiQuotaRuleDO> quotaRules = aiQuotaRuleMapper.selectListByProjectIdAndSceneCodeAndStatus(
                resourcePackage.getProjectId(), sceneCode, AiQuotaStatus.ACTIVE.getStatus());
        return quotaRules.stream()
                .filter(quotaRule -> quotaRuleApplies(quotaRule, resourcePackage, qrCode))
                .anyMatch(quotaRule -> Boolean.TRUE.equals(quotaRule.getCacheEnabled()));
    }

    private List<SourceRespVO> parseCachedSources(String sourceJson) {
        if (!hasText(sourceJson)) {
            return List.of();
        }
        try {
            return JsonUtils.parseArray(sourceJson, SourceRespVO.class);
        } catch (RuntimeException ex) {
            log.warn("[parseCachedSources][sourceJson({}) parse failed]", sourceJson, ex);
            return List.of();
        }
    }

    private Long recordCachedAiGeneration(
            XunjingResourcePackageDO resourcePackage, XunjingQrCodeDO qrCode, RagChatReqVO reqVO,
            CachedAnswer cachedAnswer) {
        XunjingAiGenerationLogDO aiLog = new XunjingAiGenerationLogDO();
        aiLog.setProjectId(resourcePackage.getProjectId());
        aiLog.setSchoolId(resourcePackage.getSchoolId());
        aiLog.setPackageId(resourcePackage.getId());
        aiLog.setQrCodeId(qrCode == null ? null : qrCode.getId());
        aiLog.setSceneCode(defaultIfBlank(reqVO.getSceneCode(), DEFAULT_CHAT_SCENE_CODE));
        aiLog.setUserTraceId(effectiveUserTraceId(reqVO));
        aiLog.setModelCode("xunjing-rag-cache");
        aiLog.setPromptVersion("p0-rag-cache-2026-06-21");
        aiLog.setInputSummary(buildChatInputSummary(reqVO));
        aiLog.setOutputSummary(cachedAnswer.answer());
        aiLog.setSourceJson(defaultIfBlank(cachedAnswer.sourceJson(), buildSourceJson(cachedAnswer.sources())));
        aiLog.setTokenCount(0L);
        aiLog.setCostAmount(BigDecimal.ZERO);
        aiLog.setSafetyStatus(AiSafetyStatus.PASSED.getStatus());
        aiLog.setCacheHit(true);
        aiLog.setTenantId(TenantContextHolder.getRequiredTenantId());
        aiGenerationLogMapper.insert(aiLog);
        return aiLog.getId();
    }

    private RagChatRespVO buildQuotaBlockedIfNeeded(
            XunjingResourcePackageDO resourcePackage, XunjingQrCodeDO qrCode, RagChatReqVO reqVO) {
        String sceneCode = defaultIfBlank(reqVO.getSceneCode(), DEFAULT_CHAT_SCENE_CODE);
        List<XunjingAiQuotaRuleDO> quotaRules = aiQuotaRuleMapper.selectListByProjectIdAndSceneCodeAndStatus(
                resourcePackage.getProjectId(), sceneCode, AiQuotaStatus.ACTIVE.getStatus());
        for (XunjingAiQuotaRuleDO quotaRule : quotaRules) {
            if (!quotaRuleApplies(quotaRule, resourcePackage, qrCode)) {
                continue;
            }
            QuotaUsage usage = quotaUsage(resourcePackage, qrCode, reqVO, quotaRule, sceneCode);
            if (quotaRule.getDailyLimit() != null && quotaRule.getDailyLimit() > 0
                    && usage.dailyCount() >= quotaRule.getDailyLimit()) {
                return buildQuotaBlockedResponse(resourcePackage, qrCode, reqVO,
                        "今日 AI 问答次数已达上限，请稍后再试，或联系项目管理员调整配额。", quotaRule);
            }
            if (quotaRule.getMonthlyBudget() != null && quotaRule.getMonthlyBudget().compareTo(BigDecimal.ZERO) > 0
                    && usage.monthlyCost().compareTo(quotaRule.getMonthlyBudget()) >= 0) {
                return buildQuotaBlockedResponse(resourcePackage, qrCode, reqVO,
                        "本月 AI 预算已达上限，请稍后再试，或联系项目管理员调整预算。", quotaRule);
            }
        }
        return null;
    }

    private RagChatRespVO buildQuotaBlockedResponse(
            XunjingResourcePackageDO resourcePackage, XunjingQrCodeDO qrCode, RagChatReqVO reqVO, String answer,
            XunjingAiQuotaRuleDO quotaRule) {
        Long logId = recordBlockedAiGeneration(resourcePackage, qrCode, reqVO, answer, quotaRule);
        RagChatRespVO respVO = buildRagChatResponse(resourcePackage, reqVO);
        respVO.setAnswer(answer);
        respVO.setSafetyStatus(AiSafetyStatus.BLOCKED.getStatus());
        respVO.setLogId(logId);
        respVO.setSources(List.of());
        return respVO;
    }

    private RagChatRespVO buildNoSourceBlockedResponse(
            XunjingResourcePackageDO resourcePackage, XunjingQrCodeDO qrCode, RagChatReqVO reqVO) {
        String answer = "没有找到已审核且可公开引用的资料来源，不能直接回答这个问题。请先在后台补充并审核该地点的讲解资料。";
        Long logId = recordNoSourceBlockedAiGeneration(resourcePackage, qrCode, reqVO, answer);
        RagChatRespVO respVO = buildRagChatResponse(resourcePackage, reqVO);
        respVO.setAnswer(answer);
        respVO.setSafetyStatus(AiSafetyStatus.BLOCKED.getStatus());
        respVO.setLogId(logId);
        respVO.setSources(List.of());
        return respVO;
    }

    private RagChatRespVO buildRagChatResponse(XunjingResourcePackageDO resourcePackage, RagChatReqVO reqVO) {
        RagChatRespVO respVO = new RagChatRespVO();
        respVO.setPackageCode(resourcePackage.getPackageCode());
        respVO.setSceneCode(defaultIfBlank(reqVO.getSceneCode(), DEFAULT_CHAT_SCENE_CODE));
        respVO.setRegionCode(defaultIfBlank(reqVO.getRegionCode(), ""));
        respVO.setPoiCode(defaultIfBlank(reqVO.getPoiCode(), ""));
        respVO.setPoiName(defaultIfBlank(reqVO.getPoiName(), ""));
        return respVO;
    }

    private Long recordNoSourceBlockedAiGeneration(
            XunjingResourcePackageDO resourcePackage, XunjingQrCodeDO qrCode, RagChatReqVO reqVO, String answer) {
        Map<String, Object> sourceGuard = new LinkedHashMap<>();
        sourceGuard.put("reason", "NO_REVIEWED_SOURCE");
        sourceGuard.put("regionCode", defaultIfBlank(reqVO.getRegionCode(), ""));
        sourceGuard.put("poiCode", defaultIfBlank(reqVO.getPoiCode(), ""));
        sourceGuard.put("poiName", defaultIfBlank(reqVO.getPoiName(), ""));
        sourceGuard.put("routeId", defaultIfBlank(reqVO.getRouteId(), ""));

        XunjingAiGenerationLogDO aiLog = new XunjingAiGenerationLogDO();
        aiLog.setProjectId(resourcePackage.getProjectId());
        aiLog.setSchoolId(resourcePackage.getSchoolId());
        aiLog.setPackageId(resourcePackage.getId());
        aiLog.setQrCodeId(qrCode == null ? null : qrCode.getId());
        aiLog.setSceneCode(defaultIfBlank(reqVO.getSceneCode(), DEFAULT_CHAT_SCENE_CODE));
        aiLog.setUserTraceId(effectiveUserTraceId(reqVO));
        aiLog.setModelCode("xunjing-source-guard");
        aiLog.setPromptVersion("p0-source-guard-2026-06-27");
        aiLog.setInputSummary(buildChatInputSummary(reqVO));
        aiLog.setOutputSummary(answer);
        aiLog.setSourceJson(JsonUtils.toJsonString(sourceGuard));
        aiLog.setTokenCount(0L);
        aiLog.setCostAmount(BigDecimal.ZERO);
        aiLog.setSafetyStatus(AiSafetyStatus.BLOCKED.getStatus());
        aiLog.setCacheHit(false);
        aiLog.setTenantId(TenantContextHolder.getRequiredTenantId());
        aiGenerationLogMapper.insert(aiLog);
        return aiLog.getId();
    }

    private Long recordBlockedAiGeneration(
            XunjingResourcePackageDO resourcePackage, XunjingQrCodeDO qrCode, RagChatReqVO reqVO, String answer,
            XunjingAiQuotaRuleDO quotaRule) {
        XunjingAiGenerationLogDO aiLog = new XunjingAiGenerationLogDO();
        aiLog.setProjectId(resourcePackage.getProjectId());
        aiLog.setSchoolId(resourcePackage.getSchoolId());
        aiLog.setPackageId(resourcePackage.getId());
        aiLog.setQrCodeId(qrCode == null ? null : qrCode.getId());
        aiLog.setSceneCode(defaultIfBlank(reqVO.getSceneCode(), DEFAULT_CHAT_SCENE_CODE));
        aiLog.setUserTraceId(effectiveUserTraceId(reqVO));
        aiLog.setModelCode("xunjing-quota-guard");
        aiLog.setPromptVersion("p0-quota-guard-2026-06-21");
        aiLog.setInputSummary(buildChatInputSummary(reqVO));
        aiLog.setOutputSummary(answer);
        aiLog.setSourceJson("{\"quotaRuleId\":" + quotaRule.getId()
                + ",\"scopeType\":\"" + jsonEscape(quotaRule.getScopeType())
                + "\",\"scopeId\":" + (quotaRule.getScopeId() == null ? "null" : quotaRule.getScopeId())
                + ",\"dailyLimit\":" + quotaRule.getDailyLimit()
                + ",\"monthlyBudget\":\"" + (quotaRule.getMonthlyBudget() == null ? "" : quotaRule.getMonthlyBudget())
                + "\"}");
        aiLog.setTokenCount(0L);
        aiLog.setCostAmount(BigDecimal.ZERO);
        aiLog.setSafetyStatus(AiSafetyStatus.BLOCKED.getStatus());
        aiLog.setCacheHit(false);
        aiLog.setTenantId(TenantContextHolder.getRequiredTenantId());
        aiGenerationLogMapper.insert(aiLog);
        return aiLog.getId();
    }

    private boolean quotaRuleApplies(
            XunjingAiQuotaRuleDO quotaRule, XunjingResourcePackageDO resourcePackage, XunjingQrCodeDO qrCode) {
        String scopeType = defaultIfBlank(quotaRule.getScopeType(), QUOTA_SCOPE_PROJECT);
        Long scopeId = quotaRule.getScopeId();
        if (QUOTA_SCOPE_PROJECT.equals(scopeType)) {
            return scopeId == null || resourcePackage.getProjectId().equals(scopeId);
        }
        if (QUOTA_SCOPE_SCHOOL.equals(scopeType)) {
            return resourcePackage.getSchoolId() != null
                    && (scopeId == null || resourcePackage.getSchoolId().equals(scopeId));
        }
        if (QUOTA_SCOPE_PACKAGE.equals(scopeType)) {
            return scopeId == null || resourcePackage.getId().equals(scopeId);
        }
        if (QUOTA_SCOPE_QRCODE.equals(scopeType)) {
            return qrCode != null && (scopeId == null || qrCode.getId().equals(scopeId));
        }
        return QUOTA_SCOPE_USER.equals(scopeType);
    }

    private QuotaUsage quotaUsage(
            XunjingResourcePackageDO resourcePackage, XunjingQrCodeDO qrCode, RagChatReqVO reqVO,
            XunjingAiQuotaRuleDO quotaRule, String sceneCode) {
        List<Long> packageIds = quotaPackageIds(resourcePackage, quotaRule);
        Long qrCodeId = QUOTA_SCOPE_QRCODE.equals(quotaRule.getScopeType()) && qrCode != null ? qrCode.getId() : null;
        String userTraceId = QUOTA_SCOPE_USER.equals(quotaRule.getScopeType()) ? effectiveUserTraceId(reqVO) : null;
        LocalDate today = LocalDate.now();
        Long tenantId = TenantContextHolder.getRequiredTenantId();
        Long dailyCount = aiGenerationLogMapper.selectQuotaUsageCount(
                packageIds, qrCodeId, userTraceId, sceneCode, today.atStartOfDay(),
                AiSafetyStatus.PASSED.getStatus(), tenantId);
        BigDecimal monthlyCost = aiGenerationLogMapper.selectQuotaUsageCostSum(
                packageIds, qrCodeId, userTraceId, sceneCode, today.withDayOfMonth(1).atStartOfDay(),
                AiSafetyStatus.PASSED.getStatus(), tenantId);
        return new QuotaUsage(dailyCount == null ? 0L : dailyCount,
                monthlyCost == null ? BigDecimal.ZERO : monthlyCost);
    }

    private List<Long> quotaPackageIds(XunjingResourcePackageDO resourcePackage, XunjingAiQuotaRuleDO quotaRule) {
        String scopeType = defaultIfBlank(quotaRule.getScopeType(), QUOTA_SCOPE_PROJECT);
        if (QUOTA_SCOPE_PROJECT.equals(scopeType) || QUOTA_SCOPE_USER.equals(scopeType)) {
            return resourcePackageMapper.selectListByProjectId(resourcePackage.getProjectId())
                    .stream()
                    .map(XunjingResourcePackageDO::getId)
                    .toList();
        }
        if (QUOTA_SCOPE_SCHOOL.equals(scopeType) && resourcePackage.getSchoolId() != null) {
            return resourcePackageMapper.selectListByProjectIdAndSchoolId(
                            resourcePackage.getProjectId(), resourcePackage.getSchoolId())
                    .stream()
                    .map(XunjingResourcePackageDO::getId)
                    .toList();
        }
        if (QUOTA_SCOPE_PACKAGE.equals(scopeType) && quotaRule.getScopeId() != null) {
            return List.of(quotaRule.getScopeId());
        }
        return List.of(resourcePackage.getId());
    }

    private void incrementScanCount(XunjingQrCodeDO qrCode) {
        if (qrCode == null) {
            return;
        }
        qrCode.setScanCount((qrCode.getScanCount() == null ? 0L : qrCode.getScanCount()) + 1);
        qrCodeMapper.updateById(qrCode);
    }

    private String buildTargetPath(XunjingResourcePackageDO resourcePackage, XunjingQrCodeDO qrCode) {
        String packageCode = resourcePackage.getPackageCode();
        if (qrCode != null && hasText(qrCode.getPath())) {
            String separator = qrCode.getPath().contains("?") ? "&" : "?";
            return qrCode.getPath() + separator + "packageCode=" + packageCode + "&sceneCode=" + qrCode.getSceneCode();
        }
        if (ResourceType.BOOK.getType().equals(resourcePackage.getResourceType())) {
            return "/pages/reading/index?packageCode=" + packageCode;
        }
        if (ResourceType.MAP.getType().equals(resourcePackage.getResourceType())) {
            return "/pages/map/detail?packageCode=" + packageCode;
        }
        if (ResourceType.GLOBE.getType().equals(resourcePackage.getResourceType())) {
            return "/pages/globe/detail?packageCode=" + packageCode;
        }
        return "/pages/package/detail?packageCode=" + packageCode;
    }

    private Long metricLong(String metricsJson, String name) {
        Matcher matcher = Pattern.compile("\\\"" + Pattern.quote(name) + "\\\"\\s*:\\s*(\\d+)").matcher(
                defaultIfBlank(metricsJson, ""));
        return matcher.find() ? Long.valueOf(matcher.group(1)) : 0L;
    }

    private Boolean metricBoolean(String metricsJson, String name) {
        Matcher matcher = Pattern.compile("\\\"" + Pattern.quote(name) + "\\\"\\s*:\\s*(true|false)").matcher(
                defaultIfBlank(metricsJson, ""));
        return matcher.find() && Boolean.parseBoolean(matcher.group(1));
    }

    private String buildAppEventPayload(
            XunjingResourcePackageDO resourcePackage, XunjingQrCodeDO qrCode, AppInteractionEventReqVO reqVO) {
        String clientPayload = defaultIfBlank(reqVO.getPayloadJson(), "{}").trim();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("packageCode", resourcePackage.getPackageCode());
        payload.put("sceneCode", defaultIfBlank(reqVO.getSceneCode(), ""));
        payload.put("qrCodeId", qrCode == null ? null : qrCode.getId());
        Map<String, Object> clientPayloadObject = JsonUtils.parseObjectQuietly(
                clientPayload, new TypeReference<Map<String, Object>>() {});
        payload.put("clientPayload", clientPayloadObject == null ? clientPayload : clientPayloadObject);
        return JsonUtils.toJsonString(payload);
    }

    private void recordAppMediaUsage(
            XunjingResourcePackageDO resourcePackage, XunjingQrCodeDO qrCode,
            XunjingInteractionEventDO event, AppInteractionEventReqVO reqVO) {
        Map<String, Object> clientPayload = parseClientPayloadObject(reqVO.getPayloadJson());
        Long mediaId = mediaIdFromPayload(clientPayload);
        XunjingMediaAssetDO mediaAsset = mediaAssetMapper.selectById(mediaId);
        if (mediaAsset == null || !resourcePackage.getId().equals(mediaAsset.getPackageId())) {
            throw new IllegalArgumentException("xunjing public media asset not exists: " + mediaId);
        }
        if (!ReviewStatus.APPROVED.getStatus().equals(mediaAsset.getReviewStatus())
                || !CopyrightStatus.AUTHORIZED.getStatus().equals(mediaAsset.getCopyrightStatus())
                || !Boolean.TRUE.equals(mediaAsset.getCanPublic())) {
            throw new IllegalArgumentException("xunjing media asset is not public usable: " + mediaId);
        }

        XunjingMediaUsageLogDO usageLog = new XunjingMediaUsageLogDO();
        usageLog.setMediaId(mediaId);
        usageLog.setPackageId(resourcePackage.getId());
        usageLog.setSceneCode(defaultIfBlank(reqVO.getSceneCode(), "app-media-use"));
        usageLog.setUsageType(defaultIfBlank(stringValue(clientPayload.get("usageType")), "APP_MEDIA_USE"));
        usageLog.setCaller(defaultIfBlank(reqVO.getSourceChannel(), "mini-program"));
        usageLog.setPayloadJson(buildAppMediaUsagePayload(resourcePackage, qrCode, event, reqVO, clientPayload));
        usageLog.setTenantId(TenantContextHolder.getRequiredTenantId());
        mediaUsageLogMapper.insert(usageLog);
    }

    private Map<String, Object> parseClientPayloadObject(String payloadJson) {
        Map<String, Object> clientPayload = JsonUtils.parseObjectQuietly(
                defaultIfBlank(payloadJson, "{}").trim(), new TypeReference<Map<String, Object>>() {});
        return clientPayload == null ? Map.of() : clientPayload;
    }

    private Long mediaIdFromPayload(Map<String, Object> clientPayload) {
        Object mediaIdValue = clientPayload.get("mediaId");
        if (mediaIdValue == null) {
            throw new IllegalArgumentException("xunjing mediaId is required for MEDIA_USE event");
        }
        if (mediaIdValue instanceof Number number) {
            return number.longValue();
        }
        if (mediaIdValue instanceof String value && hasText(value)) {
            try {
                return Long.valueOf(value.trim());
            } catch (NumberFormatException ex) {
                throw new IllegalArgumentException("xunjing mediaId is invalid for MEDIA_USE event: " + value, ex);
            }
        }
        throw new IllegalArgumentException("xunjing mediaId is invalid for MEDIA_USE event: " + mediaIdValue);
    }

    private String buildAppMediaUsagePayload(
            XunjingResourcePackageDO resourcePackage, XunjingQrCodeDO qrCode, XunjingInteractionEventDO event,
            AppInteractionEventReqVO reqVO, Map<String, Object> clientPayload) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventId", event.getId());
        payload.put("packageCode", resourcePackage.getPackageCode());
        payload.put("sceneCode", defaultIfBlank(reqVO.getSceneCode(), ""));
        payload.put("qrCodeId", qrCode == null ? null : qrCode.getId());
        payload.put("userTraceId", reqVO.getUserTraceId());
        payload.put("clientPayload", clientPayload);
        return JsonUtils.toJsonString(payload);
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String buildSourceJson(List<SourceRespVO> sources) {
        return JsonUtils.toJsonString(sources);
    }

    private String buildChatContextText(RagChatReqVO reqVO) {
        List<String> parts = new ArrayList<>();
        parts.add("regionCode=" + defaultIfBlank(reqVO.getRegionCode(), ""));
        parts.add("poiCode=" + defaultIfBlank(reqVO.getPoiCode(), ""));
        parts.add("poiName=" + defaultIfBlank(reqVO.getPoiName(), ""));
        parts.add("routeId=" + defaultIfBlank(reqVO.getRouteId(), ""));
        parts.add(buildVisionAgentChatContextText(reqVO));
        return parts.stream()
                .filter(part -> !part.endsWith("="))
                .filter(this::hasText)
                .collect(Collectors.joining("\n"));
    }

    private String buildVisionAgentChatContextText(RagChatReqVO reqVO) {
        List<String> parts = new ArrayList<>();
        putChatContextPart(parts, "AI识境现场", reqVO.getVisionAgentSceneFusionSummary());
        putChatContextPart(parts, "世界交互入口", reqVO.getVisionAgentWorldInterfaceSummary());
        putChatContextPart(parts, "连续记忆", reqVO.getVisionAgentMemorySessionText());
        if (reqVO.getVisionAgentMemorySessionSceneCount() != null
                && reqVO.getVisionAgentMemorySessionSceneCount() > 0) {
            parts.add("记忆场景数=" + reqVO.getVisionAgentMemorySessionSceneCount());
        }
        String domain = buildVisionAgentDomainText(reqVO);
        if (hasText(domain)) {
            parts.add("场景域=" + domain);
        }
        putChatContextPart(parts, "场景理解", reqVO.getVisionAgentSceneUnderstandingSummary());
        putChatContextPart(parts, "Agent建议", reqVO.getVisionAgentDecisionActionTitle());
        putChatContextPart(parts, "Agent理由", reqVO.getVisionAgentDecisionReasonSummary());
        String environment = buildVisionAgentEnvironmentText(reqVO);
        if (hasText(environment)) {
            parts.add("实时环境=" + environment);
        }
        String serviceHandoff = buildServiceHandoffContextText(reqVO);
        if (hasText(serviceHandoff)) {
            parts.add(serviceHandoff);
        }
        putChatContextPart(parts, "服务承接", reqVO.getServiceHandoffSummary());
        if (reqVO.getServiceHandoffRequiresRealSystem() != null) {
            parts.add("真实系统确认=" + reqVO.getServiceHandoffRequiresRealSystem());
        }
        return String.join("\n", parts);
    }

    private String buildServiceHandoffContextText(RagChatReqVO reqVO) {
        List<String> parts = new ArrayList<>();
        putChatContextPart(parts, "服务动作", reqVO.getServiceHandoffActionKey());
        putChatContextPart(parts, "服务任务", reqVO.getServiceHandoffTaskType());
        String intent = buildServiceHandoffIntentText(reqVO);
        if (hasText(intent)) {
            parts.add("服务意图=" + intent);
        }
        putChatContextPart(parts, "服务步骤", reqVO.getServiceHandoffStepText());
        return String.join("\n", parts);
    }

    private String buildServiceHandoffIntentText(RagChatReqVO reqVO) {
        String intent = truncateForEvent(defaultIfBlank(reqVO.getServiceHandoffIntent(), ""),
                CHAT_CONTEXT_TEXT_MAX_LENGTH);
        String text = truncateForEvent(defaultIfBlank(reqVO.getServiceHandoffIntentText(), ""),
                CHAT_CONTEXT_TEXT_MAX_LENGTH);
        if (hasText(intent) && hasText(text)) {
            return intent + "/" + text;
        }
        return hasText(intent) ? intent : text;
    }

    private Map<String, Object> buildVisionAgentChatContextPayload(RagChatReqVO reqVO) {
        Map<String, Object> payload = new LinkedHashMap<>();
        putChatContextPayloadText(payload, "sceneFusionSummary", reqVO.getVisionAgentSceneFusionSummary());
        putChatContextPayloadText(payload, "worldInterfaceSummary", reqVO.getVisionAgentWorldInterfaceSummary());
        putChatContextPayloadText(payload, "memorySessionText", reqVO.getVisionAgentMemorySessionText());
        if (reqVO.getVisionAgentMemorySessionSceneCount() != null
                && reqVO.getVisionAgentMemorySessionSceneCount() > 0) {
            payload.put("memorySessionSceneCount", reqVO.getVisionAgentMemorySessionSceneCount());
        }
        putChatContextPayloadText(payload, "primarySceneDomainKey", reqVO.getVisionAgentPrimarySceneDomainKey());
        putChatContextPayloadText(payload, "primarySceneDomainLabel", reqVO.getVisionAgentPrimarySceneDomainLabel());
        putChatContextPayloadText(payload, "sceneUnderstandingSummary", reqVO.getVisionAgentSceneUnderstandingSummary());
        putChatContextPayloadText(payload, "decisionActionTitle", reqVO.getVisionAgentDecisionActionTitle());
        putChatContextPayloadText(payload, "decisionReasonSummary", reqVO.getVisionAgentDecisionReasonSummary());
        putChatContextPayloadText(payload, "localTimeText", reqVO.getVisionAgentLocalTimeText());
        putChatContextPayloadText(payload, "weatherText", reqVO.getVisionAgentWeatherText());
        putChatContextPayloadText(payload, "headingText", reqVO.getVisionAgentHeadingText());
        putChatContextPayloadText(payload, "serviceHandoffActionKey", reqVO.getServiceHandoffActionKey());
        putChatContextPayloadText(payload, "serviceHandoffTaskType", reqVO.getServiceHandoffTaskType());
        putChatContextPayloadText(payload, "serviceHandoffIntent", reqVO.getServiceHandoffIntent());
        putChatContextPayloadText(payload, "serviceHandoffIntentText", reqVO.getServiceHandoffIntentText());
        putChatContextPayloadText(payload, "serviceHandoffStepText", reqVO.getServiceHandoffStepText());
        putChatContextPayloadText(payload, "serviceHandoffSummary", reqVO.getServiceHandoffSummary());
        if (reqVO.getServiceHandoffRequiresRealSystem() != null) {
            payload.put("serviceHandoffRequiresRealSystem", reqVO.getServiceHandoffRequiresRealSystem());
        }
        return payload;
    }

    private void putChatContextPart(List<String> parts, String label, String value) {
        if (hasText(value)) {
            parts.add(label + "=" + truncateForEvent(value.trim(), CHAT_CONTEXT_TEXT_MAX_LENGTH));
        }
    }

    private void putChatContextPayloadText(Map<String, Object> payload, String key, String value) {
        if (hasText(value)) {
            payload.put(key, truncateForEvent(value.trim(), CHAT_CONTEXT_TEXT_MAX_LENGTH));
        }
    }

    private String buildVisionAgentDomainText(RagChatReqVO reqVO) {
        String key = truncateForEvent(defaultIfBlank(reqVO.getVisionAgentPrimarySceneDomainKey(), ""),
                CHAT_CONTEXT_TEXT_MAX_LENGTH);
        String label = truncateForEvent(defaultIfBlank(reqVO.getVisionAgentPrimarySceneDomainLabel(), ""),
                CHAT_CONTEXT_TEXT_MAX_LENGTH);
        if (hasText(key) && hasText(label)) {
            return key + "/" + label;
        }
        return hasText(key) ? key : label;
    }

    private String buildVisionAgentEnvironmentText(RagChatReqVO reqVO) {
        return java.util.stream.Stream.of(
                        reqVO.getVisionAgentLocalTimeText(),
                        reqVO.getVisionAgentWeatherText(),
                        reqVO.getVisionAgentHeadingText())
                .filter(this::hasText)
                .map(value -> truncateForEvent(value.trim(), CHAT_CONTEXT_TEXT_MAX_LENGTH))
                .collect(Collectors.joining(" "));
    }

    private String buildChatInputSummary(RagChatReqVO reqVO) {
        String context = buildChatContextText(reqVO);
        if (!hasText(context)) {
            return reqVO.getQuestion();
        }
        return reqVO.getQuestion() + "\n" + context;
    }

    private String buildSourceSearchText(RagChatReqVO reqVO) {
        return java.util.stream.Stream.of(
                        reqVO.getQuestion(),
                        reqVO.getPoiName(),
                        reqVO.getPoiCode(),
                        reqVO.getRegionCode(),
                        reqVO.getRouteId(),
                        buildVisionAgentSourceSearchText(reqVO))
                .filter(this::hasText)
                .distinct()
                .collect(Collectors.joining("\n"));
    }

    private String buildVisionAgentSourceSearchText(RagChatReqVO reqVO) {
        return java.util.stream.Stream.of(
                        reqVO.getVisionAgentSceneFusionSummary(),
                        reqVO.getVisionAgentWorldInterfaceSummary(),
                        reqVO.getVisionAgentMemorySessionText(),
                        reqVO.getVisionAgentPrimarySceneDomainKey(),
                        reqVO.getVisionAgentPrimarySceneDomainLabel(),
                        reqVO.getVisionAgentSceneUnderstandingSummary(),
                        reqVO.getVisionAgentDecisionReasonSummary(),
                        reqVO.getServiceHandoffIntentText(),
                        reqVO.getServiceHandoffSummary())
                .filter(this::hasText)
                .map(value -> truncateForEvent(value.trim(), CHAT_CONTEXT_TEXT_MAX_LENGTH))
                .distinct()
                .collect(Collectors.joining("\n"));
    }

    private String jsonEscape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String defaultIfBlank(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value;
    }

    private String truncateForEvent(String value, int maxLength) {
        if (!hasText(value)) {
            return "";
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private String effectiveUserTraceId(RagChatReqVO reqVO) {
        return defaultIfBlank(reqVO.getUserTraceId(), USER_TRACE_ANONYMOUS);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private record AnswerGenerationResult(String answer, String modelCode, String promptVersion) {
    }

    private record CachedAnswer(String answer, List<SourceRespVO> sources, String sourceJson) {
    }

    private record QuotaUsage(long dailyCount, BigDecimal monthlyCost) {
    }

}
