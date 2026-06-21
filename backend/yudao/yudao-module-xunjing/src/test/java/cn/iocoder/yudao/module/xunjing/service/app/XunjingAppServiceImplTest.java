package cn.iocoder.yudao.module.xunjing.service.app;

import cn.iocoder.yudao.framework.test.core.ut.BaseDbUnitTest;
import cn.iocoder.yudao.framework.tenant.core.context.TenantContextHolder;
import cn.iocoder.yudao.framework.common.util.json.JsonUtils;
import cn.iocoder.yudao.module.ai.dal.dataobject.model.AiModelDO;
import cn.iocoder.yudao.module.ai.enums.model.AiModelTypeEnum;
import cn.iocoder.yudao.module.ai.enums.model.AiPlatformEnum;
import cn.iocoder.yudao.module.ai.service.knowledge.AiKnowledgeSegmentService;
import cn.iocoder.yudao.module.ai.service.knowledge.bo.AiKnowledgeSegmentSearchReqBO;
import cn.iocoder.yudao.module.ai.service.knowledge.bo.AiKnowledgeSegmentSearchRespBO;
import cn.iocoder.yudao.module.ai.service.model.AiModelService;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AiGenerationLogRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AiQuotaRuleCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.GlobeModelCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.KnowledgeDocumentCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.MapPointCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.MediaAssetCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ProjectCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.QrCodeCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.QrCodeRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ReadinessRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ResourcePackageCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.SchoolCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.AppPackageDetailRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.PublicReportSummaryRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.AppInteractionEventReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.RagChatReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.RagChatRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.ScanResolveReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.ScanResolveRespVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.event.XunjingInteractionEventDO;
import cn.iocoder.yudao.module.xunjing.dal.mysql.event.XunjingInteractionEventMapper;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums;
import cn.iocoder.yudao.module.xunjing.service.console.XunjingConsoleService;
import cn.iocoder.yudao.module.xunjing.service.console.XunjingConsoleServiceImpl;
import jakarta.annotation.Resource;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Import({XunjingConsoleServiceImpl.class, XunjingAppServiceImpl.class})
public class XunjingAppServiceImplTest extends BaseDbUnitTest {

    private static final Long TENANT_ID = 1L;

    @Resource
    private XunjingConsoleService consoleService;
    @Resource
    private XunjingAppService appService;
    @Resource
    private XunjingInteractionEventMapper interactionEventMapper;
    @MockBean
    private AiKnowledgeSegmentService aiKnowledgeSegmentService;
    @MockBean
    private AiModelService aiModelService;

    @BeforeEach
    public void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    public void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    public void testResolveScanAndAnswerWithReviewedSourcesOnly() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        Long packageId = consoleService.createResourcePackage(packageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(approvedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(pendingKnowledgeReq(packageId));

        ScanResolveRespVO scan = appService.resolveScan(scanReq());
        assertEquals("KASHGAR-MAP-001", scan.getPackageCode());
        assertEquals(XunjingEnums.ResourceType.MAP.getType(), scan.getResourceType());
        assertEquals("/pages/map/detail?packageCode=KASHGAR-MAP-001", scan.getTargetPath());

        RagChatRespVO answer = appService.answer(ragReq());
        assertEquals("PASSED", answer.getSafetyStatus());
        assertEquals(1, answer.getSources().size());
        assertEquals("喀什古城权威讲解稿", answer.getSources().get(0).getTitle());
        assertTrue(answer.getAnswer().contains("喀什古城历史、街巷、非遗和研学讲解要点"));
        assertFalse(answer.getAnswer().contains("待审核讲解稿"));

        ReadinessRespVO readiness = consoleService.getReadiness(projectId);
        assertEquals(2, readiness.getInteractionCount());
        assertEquals(1, readiness.getAiGenerationCount());
    }

    @Test
    public void testResolveScanByQrSceneCodeRecordsScanAndReturnsReportSummary() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        Long packageId = consoleService.createResourcePackage(packageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(approvedKnowledgeReq(packageId));
        Long reportId = consoleService.generatePublicReport(reportReq(projectId, schoolId));
        Long qrCodeId = consoleService.createQrCode(qrCodeReq(packageId));

        ScanResolveReqVO reqVO = new ScanResolveReqVO();
        reqVO.setSceneCode("QR-KASHGAR-MAP-001");
        reqVO.setUserTraceId("trace-scan-001");
        ScanResolveRespVO scan = appService.resolveScan(reqVO);

        assertEquals("KASHGAR-MAP-001", scan.getPackageCode());
        assertEquals("QR-KASHGAR-MAP-001", scan.getSceneCode());
        assertEquals("/pages/map/detail?packageCode=KASHGAR-MAP-001&sceneCode=QR-KASHGAR-MAP-001", scan.getTargetPath());
        QrCodeRespVO qrCode = consoleService.getQrCode(qrCodeId);
        assertEquals(1L, qrCode.getScanCount());

        ReadinessRespVO readiness = consoleService.getReadiness(projectId);
        assertEquals(1, readiness.getInteractionCount());
        assertEquals(1, readiness.getQrCodeCount());

        PublicReportSummaryRespVO report = appService.getPublicReportSummary("KASHGAR-MAP-001");
        assertEquals(reportId, report.getReportId());
        assertEquals("2026-Q2 喀什公益研学报告", report.getTitle());
        assertEquals(1L, report.getPackageCount());
        assertEquals(1L, report.getReviewedKnowledgeCount());
    }

    @Test
    public void testRecordAppEventResolvesQrSceneAndKeepsPayload() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        Long packageId = consoleService.createResourcePackage(packageReq(projectId, schoolId));
        Long qrCodeId = consoleService.createQrCode(qrCodeReq(packageId));

        AppInteractionEventReqVO reqVO = new AppInteractionEventReqVO();
        reqVO.setSceneCode("QR-KASHGAR-MAP-001");
        reqVO.setEventType(XunjingEnums.EventType.VIEW.getType());
        reqVO.setSourceChannel("mini-program");
        reqVO.setUserTraceId("trace-event-001");
        reqVO.setPayloadJson("{\"page\":\"map-detail\",\"duration\":12}");
        Long eventId = appService.recordEvent(reqVO);

        XunjingInteractionEventDO event = interactionEventMapper.selectById(eventId);
        assertEquals(packageId, event.getPackageId());
        assertEquals(schoolId, event.getSchoolId());
        assertEquals(XunjingEnums.EventType.VIEW.getType(), event.getEventType());
        assertEquals("mini-program", event.getSourceChannel());
        assertEquals("trace-event-001", event.getUserTraceId());
        assertTrue(event.getPayloadJson().contains("\"sceneCode\":\"QR-KASHGAR-MAP-001\""));
        assertTrue(event.getPayloadJson().contains("\"qrCodeId\":" + qrCodeId));
        assertTrue(event.getPayloadJson().contains("\"page\":\"map-detail\""));

        ReadinessRespVO readiness = consoleService.getReadiness(projectId);
        assertEquals(1, readiness.getInteractionCount());
    }

    @Test
    public void testRecordAppEventStoresMalformedClientPayloadAsString() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        consoleService.createResourcePackage(packageReq(projectId, schoolId));

        AppInteractionEventReqVO reqVO = new AppInteractionEventReqVO();
        reqVO.setPackageCode("KASHGAR-MAP-001");
        reqVO.setEventType(XunjingEnums.EventType.VIEW.getType());
        reqVO.setPayloadJson("{\"page\":}");
        Long eventId = appService.recordEvent(reqVO);

        XunjingInteractionEventDO event = interactionEventMapper.selectById(eventId);
        assertEquals("{\"page\":}", JsonUtils.parseTree(event.getPayloadJson()).get("clientPayload").asText());
    }

    @Test
    public void testRecordAppEventDefaultsBlankTypeAndRejectsInvalidType() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        Long packageId = consoleService.createResourcePackage(packageReq(projectId, schoolId));

        AppInteractionEventReqVO defaultReqVO = new AppInteractionEventReqVO();
        defaultReqVO.setPackageCode("KASHGAR-MAP-001");
        Long eventId = appService.recordEvent(defaultReqVO);

        XunjingInteractionEventDO event = interactionEventMapper.selectById(eventId);
        assertEquals(XunjingEnums.EventType.VIEW.getType(), event.getEventType());

        AppInteractionEventReqVO invalidReqVO = new AppInteractionEventReqVO();
        invalidReqVO.setPackageCode("KASHGAR-MAP-001");
        invalidReqVO.setEventType("PLAYED");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> appService.recordEvent(invalidReqVO));
        assertTrue(ex.getMessage().contains("event type invalid"));
        assertEquals(1, interactionEventMapper.selectCountByPackageIds(List.of(packageId)));
    }

    @Test
    public void testGetPublicPackageDetailUsesAppDtoAndPublicFilters() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        Long packageId = consoleService.createResourcePackage(packageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(approvedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(pendingKnowledgeReq(packageId));
        consoleService.addMediaAsset(mediaReq(packageId));
        consoleService.addMediaAsset(unapprovedMediaReq(packageId));
        consoleService.addMapPoint(mapPointReq(packageId));
        consoleService.addGlobeModel(globeModelReq(packageId));

        AppPackageDetailRespVO detail = appService.getPublicPackageDetail("KASHGAR-MAP-001");

        assertEquals("KASHGAR-MAP-001", detail.getPackageCode());
        assertEquals("喀什古城研学地图", detail.getTitle());
        assertEquals(XunjingEnums.ResourceType.MAP.getType(), detail.getResourceType());
        assertEquals(1, detail.getKnowledgeDocuments().size());
        assertEquals("喀什古城权威讲解稿", detail.getKnowledgeDocuments().get(0).getTitle());
        assertEquals(1, detail.getMediaAssets().size());
        assertEquals("图影中华喀什古城图片", detail.getMediaAssets().get(0).getTitle());
        assertEquals(1, detail.getMapPoints().size());
        assertEquals("喀什古城入口", detail.getMapPoints().get(0).getTitle());
        assertEquals(1, detail.getGlobeModels().size());
        assertEquals("丝路地球仪喀什节点", detail.getGlobeModels().get(0).getTitle());
    }

    @Test
    public void testAnswerBlocksWhenDailyQuotaExceeded() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        Long packageId = consoleService.createResourcePackage(packageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(approvedKnowledgeReq(packageId));
        consoleService.createAiQuotaRule(aiQuotaRuleReq(projectId));

        RagChatRespVO first = appService.answer(ragReq());
        RagChatRespVO second = appService.answer(ragReq());

        assertEquals("PASSED", first.getSafetyStatus());
        assertEquals("BLOCKED", second.getSafetyStatus());
        assertTrue(second.getAnswer().contains("今日 AI 问答次数已达上限"));
        assertTrue(second.getSources().isEmpty());
        assertEquals(2, consoleService.getReadiness(projectId).getAiGenerationCount());
    }

    @Test
    public void testAnswerBlocksByUserQuotaWithinProject() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        Long packageId = consoleService.createResourcePackage(packageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(approvedKnowledgeReq(packageId));
        consoleService.createAiQuotaRule(aiQuotaRuleReq(projectId, "USER", null, 1));

        RagChatRespVO first = appService.answer(ragReq());
        RagChatRespVO second = appService.answer(ragReq());

        assertEquals("PASSED", first.getSafetyStatus());
        assertEquals("BLOCKED", second.getSafetyStatus());
        assertTrue(second.getAnswer().contains("今日 AI 问答次数已达上限"));
    }

    @Test
    public void testAnswerBlocksBySchoolQuotaAcrossPackages() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        Long mapPackageId = consoleService.createResourcePackage(packageReq(projectId, schoolId));
        Long bookPackageId = consoleService.createResourcePackage(packageReq(
                projectId, schoolId, "KASHGAR-BOOK-001", "喀什古城伴读图书", XunjingEnums.ResourceType.BOOK.getType()));
        consoleService.addKnowledgeDocument(approvedKnowledgeReq(mapPackageId));
        consoleService.addKnowledgeDocument(approvedKnowledgeReq(bookPackageId));
        consoleService.createAiQuotaRule(aiQuotaRuleReq(projectId, "SCHOOL", schoolId, 1));

        RagChatRespVO first = appService.answer(ragReq("KASHGAR-MAP-001", "trace-school-001"));
        RagChatRespVO second = appService.answer(ragReq("KASHGAR-BOOK-001", "trace-school-002"));

        assertEquals("PASSED", first.getSafetyStatus());
        assertEquals("BLOCKED", second.getSafetyStatus());
        assertTrue(second.getAnswer().contains("今日 AI 问答次数已达上限"));
    }

    @Test
    public void testAnswerBlocksByQrCodeQuota() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        Long packageId = consoleService.createResourcePackage(packageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(approvedKnowledgeReq(packageId));
        Long qrCodeId = consoleService.createQrCode(qrCodeReq(packageId));
        consoleService.createAiQuotaRule(aiQuotaRuleReq(projectId, "QRCODE", qrCodeId, 1));

        RagChatRespVO first = appService.answer(ragReqWithQrScene("QR-KASHGAR-MAP-001"));
        RagChatRespVO second = appService.answer(ragReqWithQrScene("QR-KASHGAR-MAP-001"));

        assertEquals("PASSED", first.getSafetyStatus());
        assertEquals("BLOCKED", second.getSafetyStatus());
        assertTrue(second.getAnswer().contains("今日 AI 问答次数已达上限"));
    }

    @Test
    public void testAnswerUsesYudaoAiKnowledgeSegmentsWhenPackageBound() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        Long packageId = consoleService.createResourcePackage(packageReqWithAiKnowledge(projectId, schoolId));
        consoleService.addKnowledgeDocument(approvedKnowledgeReq(packageId));
        when(aiKnowledgeSegmentService.searchKnowledgeSegment(any())).thenReturn(List.of(aiSegmentResp()));

        RagChatRespVO answer = appService.answer(ragReq());

        assertEquals("PASSED", answer.getSafetyStatus());
        assertEquals(1, answer.getSources().size());
        assertEquals("Yudao AI 知识库段落 9001", answer.getSources().get(0).getTitle());
        assertEquals("yudao-ai://knowledge/7001/segment/9001", answer.getSources().get(0).getSourceUrl());
        assertTrue(answer.getAnswer().contains("艾提尕尔广场和喀什古城街巷"));

        ArgumentCaptor<AiKnowledgeSegmentSearchReqBO> captor =
                ArgumentCaptor.forClass(AiKnowledgeSegmentSearchReqBO.class);
        verify(aiKnowledgeSegmentService).searchKnowledgeSegment(captor.capture());
        assertEquals(7001L, captor.getValue().getKnowledgeId());
        assertEquals("给孩子讲讲喀什古城是什么。", captor.getValue().getContent());
        assertEquals(3, captor.getValue().getTopK());
    }

    @Test
    public void testAnswerUsesYudaoAiChatModelWhenDefaultModelAvailable() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        Long packageId = consoleService.createResourcePackage(packageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(approvedKnowledgeReq(packageId));
        ChatModel chatModel = mock(ChatModel.class);
        when(aiModelService.getRequiredDefaultModel(AiModelTypeEnum.CHAT.getType())).thenReturn(defaultChatModel());
        when(aiModelService.getChatModel(6601L)).thenReturn(chatModel);
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse("模型生成：喀什古城适合用街巷、非遗和地图任务给孩子讲。"));

        RagChatRespVO answer = appService.answer(ragReq());

        assertEquals("PASSED", answer.getSafetyStatus());
        assertEquals("模型生成：喀什古城适合用街巷、非遗和地图任务给孩子讲。", answer.getAnswer());
        assertEquals(1, answer.getSources().size());

        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        verify(chatModel).call(promptCaptor.capture());
        String prompt = promptCaptor.getValue().getContents();
        assertTrue(prompt.contains("必须基于后台提供的资料来源回答"));
        assertTrue(prompt.contains("喀什古城历史、街巷、非遗和研学讲解要点"));
        assertTrue(prompt.contains("给孩子讲讲喀什古城是什么。"));
    }

    @Test
    public void testAnswerUsesCacheWhenQuotaRuleEnablesCacheForSameQuestion() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        Long packageId = consoleService.createResourcePackage(packageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(approvedKnowledgeReq(packageId));
        consoleService.createAiQuotaRule(aiQuotaRuleReq(projectId, "PROJECT", projectId, 10));
        ChatModel chatModel = mock(ChatModel.class);
        when(aiModelService.getRequiredDefaultModel(AiModelTypeEnum.CHAT.getType())).thenReturn(defaultChatModel());
        when(aiModelService.getChatModel(6601L)).thenReturn(chatModel);
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse("模型生成：喀什古城缓存回答。"));

        RagChatRespVO first = appService.answer(ragReq());
        RagChatRespVO second = appService.answer(ragReq());

        assertEquals("模型生成：喀什古城缓存回答。", first.getAnswer());
        assertEquals(first.getAnswer(), second.getAnswer());
        assertEquals(1, second.getSources().size());
        verify(chatModel, times(1)).call(any(Prompt.class));

        AiGenerationLogRespVO firstLog = consoleService.getAiGenerationLog(first.getLogId());
        AiGenerationLogRespVO secondLog = consoleService.getAiGenerationLog(second.getLogId());
        assertFalse(firstLog.getCacheHit());
        assertTrue(secondLog.getCacheHit());
        assertEquals("xunjing-rag-cache", secondLog.getModelCode());
        assertEquals(0L, secondLog.getTokenCount());
        assertEquals(2, consoleService.getReadiness(projectId).getAiGenerationCount());
    }

    private ProjectCreateReqVO projectReq() {
        ProjectCreateReqVO reqVO = new ProjectCreateReqVO();
        reqVO.setCode("KASHGAR-2026-P0");
        reqVO.setName("图秀中华公益行动·新疆首站");
        reqVO.setRegionName("新疆喀什");
        reqVO.setPhase("P0");
        return reqVO;
    }

    private SchoolCreateReqVO schoolReq() {
        SchoolCreateReqVO reqVO = new SchoolCreateReqVO();
        reqVO.setName("喀什示范学校");
        reqVO.setRegionName("新疆喀什");
        return reqVO;
    }

    private ResourcePackageCreateReqVO packageReq(Long projectId, Long schoolId) {
        return packageReq(projectId, schoolId, "KASHGAR-MAP-001", "喀什古城研学地图",
                XunjingEnums.ResourceType.MAP.getType());
    }

    private ResourcePackageCreateReqVO packageReq(
            Long projectId, Long schoolId, String packageCode, String title, String resourceType) {
        ResourcePackageCreateReqVO reqVO = new ResourcePackageCreateReqVO();
        reqVO.setProjectId(projectId);
        reqVO.setSchoolId(schoolId);
        reqVO.setPackageCode(packageCode);
        reqVO.setTitle(title);
        reqVO.setResourceType(resourceType);
        reqVO.setVersionNo("v1.0.0");
        return reqVO;
    }

    private ResourcePackageCreateReqVO packageReqWithAiKnowledge(Long projectId, Long schoolId) {
        ResourcePackageCreateReqVO reqVO = packageReq(projectId, schoolId);
        reqVO.setAiKnowledgeId(7001L);
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO approvedKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("喀什古城权威讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://example.com/kashgar");
        reqVO.setContentDigest("喀什古城历史、街巷、非遗和研学讲解要点。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO pendingKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = approvedKnowledgeReq(packageId);
        reqVO.setTitle("待审核讲解稿");
        reqVO.setContentDigest("这段内容不应该进入公开问答。");
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.PENDING.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.PENDING.getStatus());
        return reqVO;
    }

    private MediaAssetCreateReqVO mediaReq(Long packageId) {
        MediaAssetCreateReqVO reqVO = new MediaAssetCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("图影中华喀什古城图片");
        reqVO.setMediaType(XunjingEnums.MediaType.IMAGE.getType());
        reqVO.setFileUrl("https://cdn.example.com/kashgar.jpg");
        reqVO.setObjectKey("assets/kashgar/kashgar.jpg");
        reqVO.setSourceProvider("图影中华");
        reqVO.setSourceUrl("https://example.com/image/kashgar");
        reqVO.setCopyrightStatus(XunjingEnums.CopyrightStatus.AUTHORIZED.getStatus());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setImageTags("[\"喀什古城\",\"研学\"]");
        return reqVO;
    }

    private MediaAssetCreateReqVO unapprovedMediaReq(Long packageId) {
        MediaAssetCreateReqVO reqVO = mediaReq(packageId);
        reqVO.setTitle("待授权图片");
        reqVO.setCopyrightStatus(XunjingEnums.CopyrightStatus.PENDING.getStatus());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.PENDING.getStatus());
        return reqVO;
    }

    private MapPointCreateReqVO mapPointReq(Long packageId) {
        MapPointCreateReqVO reqVO = new MapPointCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("喀什古城入口");
        reqVO.setLatitude(new BigDecimal("39.4709000"));
        reqVO.setLongitude(new BigDecimal("75.9898000"));
        reqVO.setSummary("扫码后进入喀什古城权威讲解和 AI 问答。");
        reqVO.setSortOrder(1);
        return reqVO;
    }

    private GlobeModelCreateReqVO globeModelReq(Long packageId) {
        GlobeModelCreateReqVO reqVO = new GlobeModelCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("丝路地球仪喀什节点");
        reqVO.setModelUrl("https://cdn.example.com/globe/kashgar.glb");
        reqVO.setCoverUrl("https://cdn.example.com/globe/kashgar.png");
        reqVO.setDataVersion("2026.06");
        return reqVO;
    }

    private ScanResolveReqVO scanReq() {
        ScanResolveReqVO reqVO = new ScanResolveReqVO();
        reqVO.setPackageCode("KASHGAR-MAP-001");
        reqVO.setSceneCode("map-entry");
        return reqVO;
    }

    private RagChatReqVO ragReq() {
        return ragReq("KASHGAR-MAP-001", "trace-app-001");
    }

    private RagChatReqVO ragReq(String packageCode, String userTraceId) {
        RagChatReqVO reqVO = new RagChatReqVO();
        reqVO.setPackageCode(packageCode);
        reqVO.setQuestion("给孩子讲讲喀什古城是什么。");
        reqVO.setSceneCode("xunjing-rag-chat");
        reqVO.setSourceChannel("mini-program");
        reqVO.setUserTraceId(userTraceId);
        return reqVO;
    }

    private RagChatReqVO ragReqWithQrScene(String qrSceneCode) {
        RagChatReqVO reqVO = ragReq();
        reqVO.setQrSceneCode(qrSceneCode);
        return reqVO;
    }

    private QrCodeCreateReqVO qrCodeReq(Long packageId) {
        QrCodeCreateReqVO reqVO = new QrCodeCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setName("喀什古城地图入口二维码");
        reqVO.setSceneCode("QR-KASHGAR-MAP-001");
        reqVO.setPath("/pages/map/detail");
        reqVO.setTargetType("RESOURCE_PACKAGE");
        reqVO.setTargetId(packageId);
        return reqVO;
    }

    private AiQuotaRuleCreateReqVO aiQuotaRuleReq(Long projectId) {
        return aiQuotaRuleReq(projectId, "PROJECT", projectId, 1);
    }

    private AiQuotaRuleCreateReqVO aiQuotaRuleReq(Long projectId, String scopeType, Long scopeId, Integer dailyLimit) {
        AiQuotaRuleCreateReqVO reqVO = new AiQuotaRuleCreateReqVO();
        reqVO.setProjectId(projectId);
        reqVO.setScopeType(scopeType);
        reqVO.setScopeId(scopeId);
        reqVO.setSceneCode("xunjing-rag-chat");
        reqVO.setDailyLimit(dailyLimit);
        reqVO.setMonthlyBudget(new BigDecimal("10.000000"));
        reqVO.setCacheEnabled(true);
        reqVO.setFallbackModelCode("qwen-turbo");
        return reqVO;
    }

    private AiKnowledgeSegmentSearchRespBO aiSegmentResp() {
        AiKnowledgeSegmentSearchRespBO respBO = new AiKnowledgeSegmentSearchRespBO();
        respBO.setId(9001L);
        respBO.setDocumentId(8001L);
        respBO.setKnowledgeId(7001L);
        respBO.setContent("艾提尕尔广场和喀什古城街巷是喀什研学讲解的重要观察点。");
        respBO.setScore(0.88D);
        respBO.setTokens(64);
        respBO.setContentLength(32);
        return respBO;
    }

    private AiModelDO defaultChatModel() {
        return AiModelDO.builder()
                .id(6601L)
                .name("星河寻境默认对话模型")
                .model("gpt-4o-mini")
                .platform(AiPlatformEnum.OPENAI.getPlatform())
                .type(AiModelTypeEnum.CHAT.getType())
                .temperature(0.2D)
                .maxTokens(800)
                .build();
    }

    private ChatResponse chatResponse(String content) {
        return new ChatResponse(List.of(new Generation(new AssistantMessage(content))));
    }

    private cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.PublicReportGenerateReqVO reportReq(
            Long projectId, Long schoolId) {
        cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.PublicReportGenerateReqVO reqVO =
                new cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.PublicReportGenerateReqVO();
        reqVO.setProjectId(projectId);
        reqVO.setSchoolId(schoolId);
        reqVO.setReportPeriod("2026-Q2");
        reqVO.setTitle("2026-Q2 喀什公益研学报告");
        return reqVO;
    }

}
