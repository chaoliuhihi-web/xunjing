package cn.iocoder.yudao.module.xunjing.service.app;

import cn.iocoder.yudao.framework.tenant.core.context.TenantContextHolder;
import cn.iocoder.yudao.framework.common.util.json.JsonUtils;
import cn.iocoder.yudao.framework.common.util.object.BeanUtils;
import com.fasterxml.jackson.core.type.TypeReference;
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
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.PublicReportSummaryRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.ScanResolveReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.ScanResolveRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.SourceRespVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.ai.XunjingAiGenerationLogDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.ai.XunjingAiQuotaRuleDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.event.XunjingInteractionEventDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.knowledge.XunjingKnowledgeDocumentDO;
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
import cn.iocoder.yudao.module.xunjing.dal.mysql.packagepkg.XunjingResourcePackageMapper;
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
    private XunjingMapPointMapper mapPointMapper;
    @Resource
    private XunjingGlobeModelMapper globeModelMapper;
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
        recordAskEvent(resourcePackage, reqVO);

        RagChatRespVO quotaBlocked = buildQuotaBlockedIfNeeded(resourcePackage, qrCode, reqVO);
        if (quotaBlocked != null) {
            return quotaBlocked;
        }

        CachedAnswer cachedAnswer = getCachedAnswerIfEnabled(resourcePackage, qrCode, reqVO);
        if (cachedAnswer != null) {
            Long logId = recordCachedAiGeneration(resourcePackage, qrCode, reqVO, cachedAnswer);
            RagChatRespVO respVO = new RagChatRespVO();
            respVO.setAnswer(cachedAnswer.answer());
            respVO.setSafetyStatus(AiSafetyStatus.PASSED.getStatus());
            respVO.setLogId(logId);
            respVO.setSources(cachedAnswer.sources());
            return respVO;
        }

        List<SourceRespVO> sources = searchPublicSources(resourcePackage.getId(), reqVO.getQuestion());
        AnswerGenerationResult answer = generateAnswer(reqVO.getQuestion(), sources);

        Long logId = recordAiGeneration(resourcePackage, qrCode, reqVO, answer, sources);

        RagChatRespVO respVO = new RagChatRespVO();
        respVO.setAnswer(answer.answer());
        respVO.setSafetyStatus(AiSafetyStatus.PASSED.getStatus());
        respVO.setLogId(logId);
        respVO.setSources(sources);
        return respVO;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long recordEvent(AppInteractionEventReqVO reqVO) {
        XunjingQrCodeDO qrCode = resolveAppEventQrCode(reqVO);
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
        return event.getId();
    }

    @Override
    public PublicReportSummaryRespVO getPublicReportSummary(String packageCode) {
        XunjingResourcePackageDO resourcePackage = validatePublicPackage(packageCode);
        XunjingPublicReportDO report = publicReportMapper.selectLatestByProjectId(resourcePackage.getProjectId());
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

    private XunjingQrCodeDO resolveAppEventQrCode(AppInteractionEventReqVO reqVO) {
        if (!hasText(reqVO.getSceneCode())) {
            return null;
        }
        XunjingQrCodeDO qrCode = qrCodeMapper.selectBySceneCodeAndStatus(
                reqVO.getSceneCode(), QrCodeStatus.ACTIVE.getStatus());
        if (qrCode == null) {
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

    private List<SourceRespVO> searchPublicSources(Long packageId, String question) {
        XunjingResourcePackageDO resourcePackage = resourcePackageMapper.selectById(packageId);
        List<SourceRespVO> yudaoAiSources = searchYudaoAiKnowledgeSources(resourcePackage, question);
        if (!yudaoAiSources.isEmpty()) {
            return yudaoAiSources;
        }
        return knowledgeDocumentMapper.selectPublicListByPackageId(
                        packageId, ReviewStatus.APPROVED.getStatus(), VectorStatus.INDEXED.getStatus())
                .stream()
                .map(document -> toSource(document, question))
                .sorted(Comparator.comparing(SourceRespVO::getScore).reversed())
                .limit(TOP_K)
                .toList();
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

    private double score(XunjingKnowledgeDocumentDO document, String question) {
        double score = 0.60D;
        String text = (document.getTitle() == null ? "" : document.getTitle())
                + (document.getContentDigest() == null ? "" : document.getContentDigest());
        if (question != null && !question.isBlank()) {
            for (String keyword : List.of("喀什", "古城", "新疆", "地图", "地球仪", "图书", "孩子", "研学")) {
                if (question.contains(keyword) && text.contains(keyword)) {
                    score += 0.05D;
                }
            }
        }
        return Math.min(score, 0.95D);
    }

    private AnswerGenerationResult generateAnswer(String question, List<SourceRespVO> sources) {
        if (sources.isEmpty()) {
            return new AnswerGenerationResult("我暂时没有找到已审核且可公开引用的资料来源，不能直接回答这个问题。",
                    "xunjing-rag-facade", "p0-rag-no-source-2026-06-21");
        }
        AnswerGenerationResult aiGenerated = tryGenerateAnswerByYudaoAi(question, sources);
        if (aiGenerated != null) {
            return aiGenerated;
        }
        SourceRespVO first = sources.get(0);
        return new AnswerGenerationResult("根据已审核资料《" + first.getTitle() + "》：" + first.getContentDigest()
                + " 这个回答基于当前资源包的公开知识来源，可继续追问更具体的问题。",
                "xunjing-rag-facade", "p0-rag-facade-2026-06-21");
    }

    private AnswerGenerationResult tryGenerateAnswerByYudaoAi(String question, List<SourceRespVO> sources) {
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
            ChatResponse response = chatModel.call(buildRagPrompt(question, sources, model));
            String content = AiUtils.getChatResponseContent(response);
            if (!hasText(content)) {
                return null;
            }
            return new AnswerGenerationResult(content, defaultIfBlank(model.getModel(), "yudao-ai-chat"),
                    "p0-rag-yudao-ai-2026-06-21");
        } catch (Exception ex) {
            log.warn("[tryGenerateAnswerByYudaoAi][question({}) sourceCount({}) fallback]", question, sources.size(), ex);
            return null;
        }
    }

    private Prompt buildRagPrompt(String question, List<SourceRespVO> sources, AiModelDO model) {
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
        String user = "用户问题：\n" + question
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
        event.setPayloadJson("{\"sceneCode\":\"" + jsonEscape(defaultIfBlank(reqVO.getSceneCode(), "xunjing-rag-chat"))
                + "\",\"question\":\"" + jsonEscape(reqVO.getQuestion()) + "\"}");
        event.setTenantId(TenantContextHolder.getRequiredTenantId());
        interactionEventMapper.insert(event);
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
        aiLog.setInputSummary(reqVO.getQuestion());
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
                sceneCode, reqVO.getQuestion(), LocalDate.now().atStartOfDay(), AiSafetyStatus.PASSED.getStatus());
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
        aiLog.setInputSummary(reqVO.getQuestion());
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
        RagChatRespVO respVO = new RagChatRespVO();
        respVO.setAnswer(answer);
        respVO.setSafetyStatus(AiSafetyStatus.BLOCKED.getStatus());
        respVO.setLogId(logId);
        respVO.setSources(List.of());
        return respVO;
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
        aiLog.setInputSummary(reqVO.getQuestion());
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
        long dailyCount = aiGenerationLogMapper.selectListByQuotaScope(
                packageIds, qrCodeId, userTraceId, sceneCode, today.atStartOfDay(),
                AiSafetyStatus.PASSED.getStatus()).size();
        BigDecimal monthlyCost = aiGenerationLogMapper.selectCostSumByQuotaScope(
                packageIds, qrCodeId, userTraceId, sceneCode, today.withDayOfMonth(1).atStartOfDay(),
                AiSafetyStatus.PASSED.getStatus());
        return new QuotaUsage(dailyCount, monthlyCost);
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

    private String buildSourceJson(List<SourceRespVO> sources) {
        return JsonUtils.toJsonString(sources);
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
