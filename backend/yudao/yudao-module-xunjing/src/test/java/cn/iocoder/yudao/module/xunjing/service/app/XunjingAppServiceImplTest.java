package cn.iocoder.yudao.module.xunjing.service.app;

import cn.iocoder.yudao.framework.test.core.ut.BaseDbUnitTest;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.framework.tenant.core.context.TenantContextHolder;
import cn.iocoder.yudao.framework.common.pojo.PageResult;
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
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
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
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.LocationPointReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.MultimodalTriggerReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.MultimodalTriggerRespVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.media.XunjingMediaUsageLogDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.event.XunjingInteractionEventDO;
import cn.iocoder.yudao.module.xunjing.dal.mysql.event.XunjingInteractionEventMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.media.XunjingMediaUsageLogMapper;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums;
import cn.iocoder.yudao.module.xunjing.service.app.trigger.XunjingMultimodalTriggerEngine;
import cn.iocoder.yudao.module.xunjing.service.app.trigger.XunjingVisionRecognitionService;
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
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Import({XunjingConsoleServiceImpl.class, XunjingAppServiceImpl.class, XunjingMultimodalTriggerEngine.class,
        XunjingVisionRecognitionService.class})
public class XunjingAppServiceImplTest extends BaseDbUnitTest {

    private static final Long TENANT_ID = 1L;

    @Resource
    private XunjingConsoleService consoleService;
    @Resource
    private XunjingAppService appService;
    @Resource
    private XunjingInteractionEventMapper interactionEventMapper;
    @Resource
    private XunjingMediaUsageLogMapper mediaUsageLogMapper;
    @Resource
    private DataSource dataSource;
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
    public void testGetPublicReportSummaryScopesToPackageSchool() {
        Long projectId = consoleService.createProject(projectReq());
        Long firstSchoolId = consoleService.createSchool(schoolReq());
        Long secondSchoolId = consoleService.createSchool(schoolReq("喀什第二示范学校"));
        Long firstPackageId = consoleService.createResourcePackage(packageReq(projectId, firstSchoolId));
        Long secondPackageId = consoleService.createResourcePackage(packageReq(
                projectId, secondSchoolId, "KASHGAR-MAP-002", "喀什第二学校研学地图",
                XunjingEnums.ResourceType.MAP.getType()));
        consoleService.addKnowledgeDocument(approvedKnowledgeReq(firstPackageId));
        consoleService.addKnowledgeDocument(approvedKnowledgeReq(secondPackageId));

        Long firstReportId = consoleService.generatePublicReport(reportReq(
                projectId, firstSchoolId, "2026-Q2 喀什第一学校公益报告"));
        Long secondReportId = consoleService.generatePublicReport(reportReq(
                projectId, secondSchoolId, "2026-Q2 喀什第二学校公益报告"));

        PublicReportSummaryRespVO firstSummary = appService.getPublicReportSummary("KASHGAR-MAP-001");

        assertEquals(firstReportId, firstSummary.getReportId());
        assertEquals(firstSchoolId, firstSummary.getSchoolId());
        assertEquals("2026-Q2 喀什第一学校公益报告", firstSummary.getTitle());
        assertEquals(1L, firstSummary.getPackageCount());
        assertEquals(1L, firstSummary.getReviewedKnowledgeCount());
        assertFalse(firstSummary.getReportId().equals(secondReportId));
    }

    @Test
    public void testResolveScanKeepsExistingQrPathQueryParameters() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        Long packageId = consoleService.createResourcePackage(packageReq(projectId, schoolId));
        QrCodeCreateReqVO qrReqVO = qrCodeReq(packageId);
        qrReqVO.setPath("/pages/map/detail?source=offline-card");
        consoleService.createQrCode(qrReqVO);

        ScanResolveReqVO reqVO = new ScanResolveReqVO();
        reqVO.setSceneCode("QR-KASHGAR-MAP-001");
        ScanResolveRespVO scan = appService.resolveScan(reqVO);

        assertEquals("/pages/map/detail?source=offline-card&packageCode=KASHGAR-MAP-001&sceneCode=QR-KASHGAR-MAP-001",
                scan.getTargetPath());
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
    public void testRecordAppErrorFeedbackEventKeepsXichengContext() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));

        AppInteractionEventReqVO reqVO = new AppInteractionEventReqVO();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneCode("xicheng-ai-guide");
        reqVO.setEventType(XunjingEnums.EventType.ERROR_FEEDBACK.getType());
        reqVO.setSourceChannel("xicheng-app");
        reqVO.setUserTraceId("trace-xicheng-error-001");
        reqVO.setPayloadJson("""
                {"category":"ocr_no_match","message":"无法识别当前位置","poiCode":"xicheng-unknown","severity":"WARN"}
                """);

        Long eventId = appService.recordEvent(reqVO);

        XunjingInteractionEventDO event = interactionEventMapper.selectById(eventId);
        assertEquals(packageId, event.getPackageId());
        assertEquals(schoolId, event.getSchoolId());
        assertEquals(XunjingEnums.EventType.ERROR_FEEDBACK.getType(), event.getEventType());
        assertEquals("xicheng-app", event.getSourceChannel());
        assertEquals("trace-xicheng-error-001", event.getUserTraceId());
        assertTrue(event.getPayloadJson().contains("\"packageCode\":\"XICHENG-MAP-001\""));
        assertTrue(event.getPayloadJson().contains("\"sceneCode\":\"xicheng-ai-guide\""));
        assertTrue(event.getPayloadJson().contains("\"category\":\"ocr_no_match\""));
        assertTrue(event.getPayloadJson().contains("\"message\":\"无法识别当前位置\""));
        assertTrue(event.getPayloadJson().contains("\"poiCode\":\"xicheng-unknown\""));
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
    public void testRecordMediaUseEventCreatesPublicMediaUsageLog() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        Long packageId = consoleService.createResourcePackage(packageReq(projectId, schoolId));
        Long mediaId = consoleService.addMediaAsset(mediaReq(packageId));
        consoleService.createQrCode(qrCodeReq(packageId));

        AppInteractionEventReqVO reqVO = new AppInteractionEventReqVO();
        reqVO.setPackageCode("KASHGAR-MAP-001");
        reqVO.setSceneCode("QR-KASHGAR-MAP-001");
        reqVO.setEventType(XunjingEnums.EventType.MEDIA_USE.getType());
        reqVO.setSourceChannel("mini-program");
        reqVO.setUserTraceId("trace-media-001");
        reqVO.setPayloadJson("{\"mediaId\":" + mediaId
                + ",\"usageType\":\"DETAIL_CARD\",\"placement\":\"story-hero\"}");
        appService.recordEvent(reqVO);

        ConsolePageReqVO pageReqVO = new ConsolePageReqVO();
        pageReqVO.setPackageId(packageId);
        PageResult<XunjingMediaUsageLogDO> usagePage = mediaUsageLogMapper.selectPage(pageReqVO);
        assertEquals(1, usagePage.getTotal());
        XunjingMediaUsageLogDO usageLog = usagePage.getList().get(0);
        assertEquals(mediaId, usageLog.getMediaId());
        assertEquals(packageId, usageLog.getPackageId());
        assertEquals("QR-KASHGAR-MAP-001", usageLog.getSceneCode());
        assertEquals("DETAIL_CARD", usageLog.getUsageType());
        assertEquals("mini-program", usageLog.getCaller());
        assertTrue(usageLog.getPayloadJson().contains("\"userTraceId\":\"trace-media-001\""));
        assertEquals(1, consoleService.getReadiness(projectId).getMediaUsageCount());
    }

    @Test
    public void testResolveMultimodalTriggerStartsGuideWhenGpsAndOcrMatchXichengPoi() {
        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setOcrText("妙应寺白塔入口");
        reqVO.setImageLabels(List.of("white_pagoda", "temple_gate"));
        reqVO.setLocation(location("39.923100", "116.357260", 18));

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("guide", respVO.getIntent());
        assertEquals("start_ai_guide", respVO.getAction());
        assertEquals("xicheng-baitasi", respVO.getPoiCode());
        assertEquals("妙应寺白塔", respVO.getPoiName());
        assertTrue(respVO.getConfidence() >= 0.85D);
        assertFalse(respVO.getRequiresUserConfirm());
        assertTrue(respVO.getTargetPath().contains("poiCode=xicheng-baitasi"));
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("gps_radius"));
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("ocr_alias"));
    }

    @Test
    public void testResolveMultimodalTriggerAcceptsXichengAliasAndReturnsSourcesAndQuestions() {
        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setRegionCode("XICHENG");
        reqVO.setOcrText("妙应寺白塔入口");
        reqVO.setLocation(location("39.923100", "116.357260", 18));

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("beijing-xicheng", respVO.getRegionCode());
        assertEquals("xicheng-baitasi", respVO.getPoiCode());
        assertEquals("妙应寺白塔", respVO.getPoiName());
        assertFalse(respVO.getSuggestedQuestions().isEmpty());
        assertTrue(respVO.getSuggestedQuestions().contains("给我讲讲妙应寺白塔的来历。"));
        assertFalse(respVO.getSources().isEmpty());
        assertEquals("妙应寺白塔", respVO.getSources().get(0).getTitle());
        assertTrue(respVO.getSources().get(0).getSourceUrl().contains("bjxch.gov.cn"));
        assertFalse(respVO.getCandidates().get(0).getSuggestedQuestions().isEmpty());
        assertFalse(respVO.getCandidates().get(0).getSources().isEmpty());
    }

    @Test
    public void testResolveMultimodalTriggerUsesAliasAndRadiusForXichengRouteIntent() {
        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setText("我在历代帝王庙，下一站去哪");
        reqVO.setOcrText("帝王庙");
        reqVO.setLocation(location("39.918930", "116.365870", 35));

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("route", respVO.getIntent());
        assertEquals("open_route_recommendation", respVO.getAction());
        assertEquals("xicheng-emperors-temple", respVO.getPoiCode());
        assertTrue(respVO.getConfidence() >= 0.85D);
        assertFalse(respVO.getRequiresUserConfirm());
    }

    @Test
    public void testResolveMultimodalTriggerUsesPublishedPoiFromDatabase() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setOcrText("恭王府博物馆入口");
        reqVO.setImageLabels(List.of("palace", "courtyard"));
        reqVO.setLocation(location("39.937050", "116.386770", 20));

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertEquals("恭王府", respVO.getPoiName());
        assertEquals("start_ai_guide", respVO.getAction());
        assertTrue(respVO.getConfidence() >= 0.85D);
        assertFalse(respVO.getRequiresUserConfirm());
        assertTrue(respVO.getSuggestedQuestions().contains("恭王府适合怎么参观？"));
        assertFalse(respVO.getSources().isEmpty());
        assertEquals("恭王府", respVO.getSources().get(0).getTitle());
        assertTrue(respVO.getSources().get(0).getSourceUrl().contains("bjxch.gov.cn"));
    }

    @Test
    public void testResolveMultimodalTriggerDoesNotUsePoiFromAnotherPackage() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        Long otherPackageId = consoleService.createResourcePackage(packageReq(
                projectId, schoolId, "XICHENG-MAP-ALT", "西城 AI 旅伴备选地图",
                XunjingEnums.ResourceType.MAP.getType()));
        insertXichengPoi(otherPackageId);

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneCode("xicheng-multimodal-trigger");
        reqVO.setOcrText("恭王府博物馆入口");
        reqVO.setImageLabels(List.of("palace", "courtyard"));
        reqVO.setLocation(location("39.937050", "116.386770", 20));

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("XICHENG-MAP-001", respVO.getPackageCode());
        assertEquals("ask_ai_companion", respVO.getAction());
        assertEquals("beijing-xicheng", respVO.getRegionCode());
        assertNull(respVO.getPoiCode());
        assertTrue(respVO.getCandidates().isEmpty());
        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.TRIGGER_RESOLVE.getType()));
        assertEquals(1, events.size());
        assertTrue(events.get(0).getPayloadJson().contains("\"packageCode\":\"XICHENG-MAP-001\""));
        assertTrue(events.get(0).getPayloadJson().contains("\"poiCode\":\"\""));
    }

    @Test
    public void testResolveMultimodalTriggerRecordsRecognitionEventWhenPackageProvided() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneCode("xicheng-multimodal-trigger");
        reqVO.setOcrText("恭王府博物馆入口");
        reqVO.setImageLabels(List.of("palace", "courtyard"));
        reqVO.setLocation(location("39.937050", "116.386770", 20));

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("XICHENG-MAP-001", respVO.getPackageCode());
        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertTrue(respVO.getTargetPath().contains("packageCode=XICHENG-MAP-001"));
        assertTrue(respVO.getCandidates().get(0).getTargetPath().contains("packageCode=XICHENG-MAP-001"));
        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.TRIGGER_RESOLVE.getType()));
        assertEquals(1, events.size());
        XunjingInteractionEventDO event = events.get(0);
        assertEquals(schoolId, event.getSchoolId());
        assertEquals("xicheng-app", event.getSourceChannel());
        assertEquals("trace-xicheng-multimodal-001", event.getUserTraceId());
        assertTrue(event.getPayloadJson().contains("\"sceneCode\":\"xicheng-multimodal-trigger\""));
        assertTrue(event.getPayloadJson().contains("\"regionCode\":\"beijing-xicheng\""));
        assertTrue(event.getPayloadJson().contains("\"poiCode\":\"xicheng-gongwangfu\""));
        assertTrue(event.getPayloadJson().contains("\"poiName\":\"恭王府\""));
        assertTrue(event.getPayloadJson().contains("\"requiresUserConfirm\":false"));
        assertTrue(event.getPayloadJson().contains("\"ocrText\":\"恭王府博物馆入口\""));
        assertTrue(event.getPayloadJson().contains("\"imageLabelCount\":2"));
        assertFalse(event.getPayloadJson().contains("imageBase64"));
    }

    @Test
    public void testResolveMultimodalTriggerRequiresConfirmWhenOnlyImageSignalMatches() {
        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setImageLabels(List.of("lake", "imperial_garden", "white_tower"));

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("guide", respVO.getIntent());
        assertEquals("confirm_ai_guide", respVO.getAction());
        assertEquals("xicheng-beihai-park", respVO.getPoiCode());
        assertTrue(respVO.getConfidence() < 0.85D);
        assertTrue(respVO.getRequiresUserConfirm());
        assertTrue(respVO.getReason().contains("图片"));
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
    public void testAnswerForResourceTypeRejectsDedicatedEndpointMismatch() {
        Long projectId = consoleService.createProject(projectReq());
        Long schoolId = consoleService.createSchool(schoolReq());
        Long mapPackageId = consoleService.createResourcePackage(packageReq(projectId, schoolId));
        Long bookPackageId = consoleService.createResourcePackage(packageReq(
                projectId, schoolId, "KASHGAR-BOOK-001", "喀什古城伴读图书", XunjingEnums.ResourceType.BOOK.getType()));
        consoleService.addKnowledgeDocument(approvedKnowledgeReq(mapPackageId));
        consoleService.addKnowledgeDocument(approvedKnowledgeReq(bookPackageId));

        RagChatRespVO bookAnswer = appService.answerForResourceType(
                ragReq("KASHGAR-BOOK-001", "trace-book-001"), XunjingEnums.ResourceType.BOOK.getType());
        assertEquals("PASSED", bookAnswer.getSafetyStatus());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> appService.answerForResourceType(
                        ragReq("KASHGAR-MAP-001", "trace-map-001"), XunjingEnums.ResourceType.BOOK.getType()));
        assertTrue(ex.getMessage().contains("resource type mismatch"));
        assertEquals(1, consoleService.getReadiness(projectId).getAiGenerationCount());
    }

    @Test
    public void testAnswerRecordsXichengPoiContextAndUsesReviewedSources() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengBaitasiKnowledgeReq(packageId));

        RagChatReqVO reqVO = xichengRagReq();
        reqVO.setRegionCode("beijing-xicheng");
        reqVO.setPoiCode("xicheng-baitasi");
        reqVO.setPoiName("妙应寺白塔");
        RagChatRespVO answer = appService.answer(reqVO);

        assertEquals("PASSED", answer.getSafetyStatus());
        assertEquals("XICHENG-MAP-001", answer.getPackageCode());
        assertEquals("beijing-xicheng", answer.getRegionCode());
        assertEquals("xicheng-baitasi", answer.getPoiCode());
        assertEquals("妙应寺白塔", answer.getPoiName());
        assertFalse(answer.getSources().isEmpty());
        assertEquals("妙应寺白塔权威讲解稿", answer.getSources().get(0).getTitle());
        assertTrue(answer.getAnswer().contains("妙应寺白塔"));

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType()));
        assertEquals(1, events.size());
        assertTrue(events.get(0).getPayloadJson().contains("\"regionCode\":\"beijing-xicheng\""));
        assertTrue(events.get(0).getPayloadJson().contains("\"poiCode\":\"xicheng-baitasi\""));
        assertTrue(events.get(0).getPayloadJson().contains("\"poiName\":\"妙应寺白塔\""));
    }

    @Test
    public void testAnswerBlocksWhenNoReviewedSourcesForXichengPoi() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));

        RagChatRespVO answer = appService.answer(xichengRagReq());

        assertEquals("BLOCKED", answer.getSafetyStatus());
        assertEquals("XICHENG-MAP-001", answer.getPackageCode());
        assertEquals("beijing-xicheng", answer.getRegionCode());
        assertEquals("xicheng-baitasi", answer.getPoiCode());
        assertEquals("妙应寺白塔", answer.getPoiName());
        assertTrue(answer.getAnswer().contains("没有找到已审核"));
        assertTrue(answer.getSources().isEmpty());
    }

    @Test
    public void testAnswerBlocksWhenReviewedSourcesDoNotMatchXichengPoiContext() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));

        RagChatReqVO reqVO = xichengRagReq();
        reqVO.setRegionCode("beijing-xicheng");
        reqVO.setPoiCode("xicheng-baitasi");
        reqVO.setPoiName("妙应寺白塔");
        RagChatRespVO answer = appService.answer(reqVO);

        assertEquals("BLOCKED", answer.getSafetyStatus());
        assertTrue(answer.getAnswer().contains("没有找到已审核"));
        assertTrue(answer.getSources().isEmpty());
    }

    @Test
    public void testAnswerSupportsXichengRagChatSceneWithQuotaCacheRules() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengBaitasiKnowledgeReq(packageId));
        consoleService.createAiQuotaRule(aiQuotaRuleReq(projectId, "PROJECT", projectId, 200, "xicheng-rag-chat"));
        consoleService.createAiQuotaRule(aiQuotaRuleReq(projectId, "PACKAGE", packageId, 120, "xicheng-rag-chat"));
        consoleService.createAiQuotaRule(aiQuotaRuleReq(projectId, "USER", null, 20, "xicheng-rag-chat"));

        RagChatReqVO reqVO = xichengRagReq();
        reqVO.setSceneCode("xicheng-rag-chat");
        reqVO.setUserTraceId("trace-xicheng-rag-chat-001");
        RagChatRespVO answer = appService.answer(reqVO);

        assertEquals("PASSED", answer.getSafetyStatus());
        assertEquals("xicheng-rag-chat", answer.getSceneCode());
        assertEquals("XICHENG-MAP-001", answer.getPackageCode());
        assertEquals("xicheng-baitasi", answer.getPoiCode());
        assertFalse(answer.getSources().isEmpty());
        assertTrue(answer.getAnswer().contains("妙应寺白塔"));
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
        return schoolReq("喀什示范学校");
    }

    private SchoolCreateReqVO schoolReq(String name) {
        SchoolCreateReqVO reqVO = new SchoolCreateReqVO();
        reqVO.setName(name);
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

    private ProjectCreateReqVO xichengProjectReq() {
        ProjectCreateReqVO reqVO = new ProjectCreateReqVO();
        reqVO.setCode("XICHENG-2026-P0");
        reqVO.setName("星河寻境·西城 AI 旅伴真实试运营版");
        reqVO.setRegionName("北京西城");
        reqVO.setPhase("P0");
        return reqVO;
    }

    private SchoolCreateReqVO xichengSchoolReq() {
        SchoolCreateReqVO reqVO = new SchoolCreateReqVO();
        reqVO.setName("西城试运营样板");
        reqVO.setRegionName("北京西城");
        return reqVO;
    }

    private ResourcePackageCreateReqVO xichengPackageReq(Long projectId, Long schoolId) {
        return packageReq(projectId, schoolId, "XICHENG-MAP-001", "西城 AI 旅伴地图",
                XunjingEnums.ResourceType.MAP.getType());
    }

    private RagChatReqVO xichengRagReq() {
        RagChatReqVO reqVO = new RagChatReqVO();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setQuestion("给我讲讲妙应寺白塔为什么值得看。");
        reqVO.setSceneCode("xicheng-ai-guide");
        reqVO.setSourceChannel("xicheng-app");
        reqVO.setUserTraceId("trace-xicheng-chat-001");
        reqVO.setRegionCode("beijing-xicheng");
        reqVO.setPoiCode("xicheng-baitasi");
        reqVO.setPoiName("妙应寺白塔");
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

    private KnowledgeDocumentCreateReqVO xichengBaitasiKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("妙应寺白塔权威讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/baitasi");
        reqVO.setContentDigest("妙应寺白塔是北京西城重要的历史文化地标，适合作为白塔寺片区 Citywalk 的讲解起点。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO xichengUnrelatedKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("北海公园权威讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/beihai");
        reqVO.setContentDigest("北海公园是北京西城重要的皇家园林，适合进行半日游览。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
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

    private MultimodalTriggerReqVO multimodalReq() {
        MultimodalTriggerReqVO reqVO = new MultimodalTriggerReqVO();
        reqVO.setRegionCode("beijing-xicheng");
        reqVO.setSourceChannel("xicheng-app");
        reqVO.setUserTraceId("trace-xicheng-multimodal-001");
        return reqVO;
    }

    private LocationPointReqVO location(String latitude, String longitude, Integer accuracyMeters) {
        LocationPointReqVO location = new LocationPointReqVO();
        location.setLatitude(new BigDecimal(latitude));
        location.setLongitude(new BigDecimal(longitude));
        location.setAccuracyMeters(accuracyMeters);
        location.setCoordType("gcj02");
        return location;
    }

    private void insertXichengPoi(Long packageId) {
        new JdbcTemplate(dataSource).update("""
                INSERT INTO "xunjing_poi"
                ("package_id", "poi_code", "region_code", "name", "official_name", "aliases_json",
                 "category", "poi_level", "address", "latitude", "longitude", "coord_type",
                 "source_json", "trigger_json", "content_json", "review_status", "geo_status",
                 "license_status", "status", "tenant_id")
                VALUES (?, 'xicheng-gongwangfu', 'beijing-xicheng', '恭王府', '恭王府博物馆',
                 '["恭王府","恭王府博物馆","和珅府"]',
                 'museum_scenic', 'P0', '北京市西城区前海西街17号', 39.9370500, 116.3867700, 'GCJ02',
                 '{"sourceType":"OFFICIAL_PUBLIC","sourceUrl":"https://www.bjxch.gov.cn/example/gongwangfu","contentDigest":"恭王府是西城王府文化和园林空间的代表性点位。"}',
                 '{"gpsRadiusMeters":280,"ocrKeywords":["恭王府","恭王府博物馆"],"photoLabels":["palace","garden","courtyard","museum"],"minConfidence":0.85}',
                 '{"shortIntro":"西城王府文化和园林空间的代表性点位。","recommendedQuestions":["恭王府适合怎么参观？","王府文化怎么给孩子讲？","附近还能去哪？"]}',
                 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', ?)
                """, packageId, TENANT_ID);
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
        return aiQuotaRuleReq(projectId, scopeType, scopeId, dailyLimit, "xunjing-rag-chat");
    }

    private AiQuotaRuleCreateReqVO aiQuotaRuleReq(
            Long projectId, String scopeType, Long scopeId, Integer dailyLimit, String sceneCode) {
        AiQuotaRuleCreateReqVO reqVO = new AiQuotaRuleCreateReqVO();
        reqVO.setProjectId(projectId);
        reqVO.setScopeType(scopeType);
        reqVO.setScopeId(scopeId);
        reqVO.setSceneCode(sceneCode);
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
        return reportReq(projectId, schoolId, "2026-Q2 喀什公益研学报告");
    }

    private cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.PublicReportGenerateReqVO reportReq(
            Long projectId, Long schoolId, String title) {
        cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.PublicReportGenerateReqVO reqVO =
                new cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.PublicReportGenerateReqVO();
        reqVO.setProjectId(projectId);
        reqVO.setSchoolId(schoolId);
        reqVO.setReportPeriod("2026-Q2");
        reqVO.setTitle(title);
        return reqVO;
    }

}
