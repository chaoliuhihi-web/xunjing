package cn.iocoder.yudao.module.xunjing.service.app;

import cn.iocoder.yudao.framework.test.core.ut.BaseDbUnitTest;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.framework.tenant.core.context.TenantContextHolder;
import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.framework.common.util.json.JsonUtils;
import com.fasterxml.jackson.databind.JsonNode;
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
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.PhotoMetaReqVO;
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
import com.sun.net.httpserver.HttpServer;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
    @Resource
    private XunjingVisionRecognitionService visionRecognitionService;
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
    public void testResolveMultimodalTriggerUsesSceneSignalsForIntentAndContextMatch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneDomainIntentKey", "menu");
        sceneSignals.put("sceneDomainIntentLabel", "菜单");
        sceneSignals.put("sceneFusionSummary", "用户正在恭王府附近拍菜单，想知道推荐菜、辣度和是否清真");
        sceneSignals.put("worldInterfaceSummary", "相机融合当前位置、时间和城市知识库后判断为餐饮服务场景");
        sceneSignals.put("agentDecisionReasonSummary", "先推荐附近适合游客第一次点的菜");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneSignals(sceneSignals);
        reqVO.setLocation(location("39.937050", "116.386770", 20));

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("food", respVO.getIntent());
        assertEquals("confirm_food_recommendation", respVO.getAction());
        assertTrue(respVO.getTargetPath().contains("/pages/food/recommend"));
        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertTrue(respVO.getConfidence() < 0.85D);
        assertTrue(respVO.getRequiresUserConfirm());
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("gps_radius"));
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));
        assertTrue(respVO.getReason().contains("场景理解"));
    }

    @Test
    public void testResolveMultimodalTriggerDoesNotTreatPhotoAdviceSceneSignalAsRecordIntent() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneDomainIntentKey", "architecture");
        sceneSignals.put("sceneDomainIntentLabel", "建筑");
        sceneSignals.put("sceneFusionSummary", "恭王府当前接近日落，建议先拍照再听历史讲解");
        sceneSignals.put("agentDecisionActionTitle", "先拍照");
        sceneSignals.put("agentDecisionReasonSummary", "夕阳适合拍门楼");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneSignals(sceneSignals);
        reqVO.setLocation(location("39.937050", "116.386770", 20));

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("guide", respVO.getIntent());
        assertEquals("confirm_ai_guide", respVO.getAction());
        assertTrue(respVO.getTargetPath().contains("/pages/ai-guide/detail"));
        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));
    }

    @Test
    public void testResolveMultimodalTriggerPrefersPreciseStreetPoiOverNearbyDistrictAlias() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertShichahaiAndYandaiPoi(packageId);

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setOcrText("烟袋斜街");
        reqVO.setText("我在烟袋斜街，想听讲解");
        reqVO.setImageLabels(List.of("hutong", "shop_sign", "historic_street"));
        reqVO.setLocation(location("39.940700", "116.391550", 20));

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("xicheng-yandai-xiejie", respVO.getPoiCode());
        assertEquals("烟袋斜街", respVO.getPoiName());
        assertEquals("start_ai_guide", respVO.getAction());
        assertTrue(respVO.getConfidence() >= 0.85D);
        assertFalse(respVO.getRequiresUserConfirm());
        assertTrue(respVO.getTargetPath().contains("poiCode=xicheng-yandai-xiejie"));
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
    public void testResolveMultimodalTriggerUsesVisionProviderOcrWhenClientOnlySendsPhoto() throws Exception {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/vision/v1/chat/completions", exchange -> {
            String response = """
                    {"choices":[{"message":{"content":"{\\"labels\\":[],\\"ocrText\\":\\"恭王府博物馆入口\\",\\"caption\\":\\"镜头里是恭王府博物馆入口牌匾\\",\\"sceneSignals\\":{\\"sceneFusionSummary\\":\\"视觉识别到恭王府入口牌匾。\\",\\"worldInterfaceSummary\\":\\"视觉模型读取画面文字后交给场景引擎。\\",\\"sceneDomainIntentKey\\":\\"architecture\\",\\"sceneDomainIntentLabel\\":\\"建筑\\",\\"sourceRecognitionContext\\":{\\"raw\\":\\"blocked\\"}}}"}}]}
                    """;
            byte[] responseBytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, responseBytes.length);
            exchange.getResponseBody().write(responseBytes);
            exchange.close();
        });
        server.start();
        try {
            setField(visionRecognitionService, "visionApiUrl",
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/vision/v1");
            setField(visionRecognitionService, "visionApiKey", "test-key");

            MultimodalTriggerReqVO reqVO = multimodalReq();
            reqVO.setPackageCode("XICHENG-MAP-001");
            reqVO.setSceneCode("xicheng-multimodal-trigger");
            reqVO.setOcrText("");
            reqVO.setImageLabels(List.of());
            PhotoMetaReqVO photoMeta = new PhotoMetaReqVO();
            photoMeta.setImageId("photo-vision-ocr-001");
            photoMeta.setImageMimeType("image/jpeg");
            photoMeta.setImageBase64("photo-base64");
            reqVO.setPhotoMeta(photoMeta);

            MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

            assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
            assertEquals("恭王府", respVO.getPoiName());
            assertEquals("confirm_ai_guide", respVO.getAction());
            assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("ocr_alias"));

            List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                    new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                            .eq(XunjingInteractionEventDO::getPackageId, packageId)
                            .eq(XunjingInteractionEventDO::getEventType,
                                    XunjingEnums.EventType.TRIGGER_RESOLVE.getType()));
            assertEquals(1, events.size());
            JsonNode payload = JsonUtils.parseTree(events.get(0).getPayloadJson());
            assertEquals("恭王府博物馆入口", payload.get("ocrText").asText());
            JsonNode sceneSignals = payload.get("sceneSignals");
            assertEquals("视觉识别到恭王府入口牌匾。", sceneSignals.get("sceneFusionSummary").asText());
            assertEquals("视觉模型读取画面文字后交给场景引擎。", sceneSignals.get("worldInterfaceSummary").asText());
            assertEquals("architecture", sceneSignals.get("sceneDomainIntentKey").asText());
            assertFalse(sceneSignals.has("sourceRecognitionContext"));
            assertFalse(events.get(0).getPayloadJson().contains("imageBase64"));
        } finally {
            setField(visionRecognitionService, "visionApiUrl", "");
            setField(visionRecognitionService, "visionApiKey", "");
            server.stop(0);
        }
    }

    @Test
    public void testResolveMultimodalTriggerRecordsSceneSignalsWithoutRawRecognitionContext() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "晴天 18:40 先拍门楼再讲历史");
        sceneSignals.put("worldInterfaceSummary", "相机融合定位、时间和城市知识库");
        sceneSignals.put("localTimeText", "18:40");
        sceneSignals.put("weatherText", "晴");
        sceneSignals.put("headingText", "西");
        sceneSignals.put("headingDegrees", 270);
        sceneSignals.put("sceneDomainIntentKey", "architecture");
        sceneSignals.put("sceneDomainIntentLabel", "建筑");
        sceneSignals.put("sceneDomainIntentTitle", "建筑识境");
        sceneSignals.put("sceneDomainIntentCopy", "讲解建筑结构和拍照角度");
        sceneSignals.put("agentDecisionActionTitle", "先拍照");
        sceneSignals.put("agentDecisionReasonSummary", "日落前适合拍摄");
        sceneSignals.put("memorySessionSceneCount", 3);
        sceneSignals.put("sourceRecognitionContext", Map.of("raw", "blocked"));
        sceneSignals.put("photoPath", "/tmp/raw.jpg");
        sceneSignals.put("imagePath", "/tmp/raw-image.jpg");
        sceneSignals.put("latitude", "39.937050");
        sceneSignals.put("longitude", "116.386770");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneCode("xicheng-multimodal-trigger");
        reqVO.setOcrText("恭王府博物馆入口");
        reqVO.setSceneSignals(sceneSignals);

        appService.resolveMultimodalTrigger(reqVO);

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.TRIGGER_RESOLVE.getType()));
        assertEquals(1, events.size());
        JsonNode payload = JsonUtils.parseTree(events.get(0).getPayloadJson());
        JsonNode persistedSignals = payload.get("sceneSignals");
        assertEquals("architecture", persistedSignals.get("sceneDomainIntentKey").asText());
        assertEquals("18:40", persistedSignals.get("localTimeText").asText());
        assertEquals("晴", persistedSignals.get("weatherText").asText());
        assertEquals(270, persistedSignals.get("headingDegrees").asInt());
        assertEquals(3, persistedSignals.get("memorySessionSceneCount").asInt());
        assertFalse(persistedSignals.has("sourceRecognitionContext"));
        assertFalse(persistedSignals.has("photoPath"));
        assertFalse(persistedSignals.has("imagePath"));
        assertFalse(persistedSignals.has("latitude"));
        assertFalse(persistedSignals.has("longitude"));
        assertFalse(persistedSignals.toString().contains("/tmp/raw.jpg"));
    }

    @Test
    public void testResolveMultimodalTriggerHydratesContinuousContextFromPreviousTriggerEvent() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> firstSceneSignals = new LinkedHashMap<>();
        firstSceneSignals.put("sceneFusionSummary", "用户举起手机看到恭王府博物馆入口。");
        firstSceneSignals.put("worldInterfaceSummary", "相机融合 GPS、OCR 和城市知识库，判断当前位置是恭王府。");
        firstSceneSignals.put("sceneDomainIntentKey", "architecture");
        firstSceneSignals.put("sceneDomainIntentLabel", "建筑");
        firstSceneSignals.put("agentDecisionReasonSummary", "适合先讲王府格局，再推荐参观路线。");
        firstSceneSignals.put("memorySessionSceneCount", 1);
        MultimodalTriggerReqVO firstReq = multimodalReq();
        firstReq.setPackageCode("XICHENG-MAP-001");
        firstReq.setSceneCode("xicheng-multimodal-trigger");
        firstReq.setUserTraceId("trace-xicheng-continuous-trigger-001");
        firstReq.setOcrText("恭王府博物馆入口");
        firstReq.setImageLabels(List.of("palace", "courtyard"));
        firstReq.setLocation(location("39.937050", "116.386770", 20));
        firstReq.setSceneSignals(firstSceneSignals);
        MultimodalTriggerRespVO firstResp = appService.resolveMultimodalTrigger(firstReq);
        assertEquals("xicheng-gongwangfu", firstResp.getPoiCode());

        MultimodalTriggerReqVO followUpReq = multimodalReq();
        followUpReq.setPackageCode("XICHENG-MAP-001");
        followUpReq.setSceneCode("xicheng-multimodal-trigger");
        followUpReq.setUserTraceId("trace-xicheng-continuous-trigger-001");
        followUpReq.setText("继续看这个屋顶结构");
        followUpReq.setOcrText("");
        followUpReq.setImageLabels(List.of());
        followUpReq.setLocation(null);

        MultimodalTriggerRespVO followUpResp = appService.resolveMultimodalTrigger(followUpReq);

        assertEquals("xicheng-gongwangfu", followUpResp.getPoiCode());
        assertEquals("恭王府", followUpResp.getPoiName());
        assertEquals("confirm_ai_guide", followUpResp.getAction());
        assertTrue(followUpResp.getRequiresUserConfirm());
        assertTrue(followUpResp.getCandidates().get(0).getMatchedSignals().contains("context_poi"));
        assertTrue(followUpResp.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.TRIGGER_RESOLVE.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-continuous-trigger-001"));
        assertEquals(2, events.size());
        XunjingInteractionEventDO latestEvent = events.stream()
                .max((left, right) -> left.getId().compareTo(right.getId()))
                .orElseThrow();
        JsonNode payload = JsonUtils.parseTree(latestEvent.getPayloadJson());
        assertEquals("xicheng-gongwangfu", payload.get("poiCode").asText());
        assertEquals("", payload.get("ocrText").asText());
        JsonNode sceneSignals = payload.get("sceneSignals");
        assertTrue(sceneSignals.get("sceneFusionSummary").asText().contains("恭王府"));
        assertEquals(2, sceneSignals.get("memorySessionSceneCount").asInt());
    }

    @Test
    public void testResolveMultimodalTriggerDoesNotReusePreviousSceneIntentWhenFreshOcrExists() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> firstSceneSignals = new LinkedHashMap<>();
        firstSceneSignals.put("sceneDomainIntentKey", "menu");
        firstSceneSignals.put("sceneDomainIntentLabel", "菜单");
        firstSceneSignals.put("sceneFusionSummary", "用户正在恭王府附近拍菜单，想知道推荐菜。");
        MultimodalTriggerReqVO firstReq = multimodalReq();
        firstReq.setPackageCode("XICHENG-MAP-001");
        firstReq.setSceneCode("xicheng-multimodal-trigger");
        firstReq.setUserTraceId("trace-xicheng-fresh-ocr-001");
        firstReq.setOcrText("恭王府菜单");
        firstReq.setLocation(location("39.937050", "116.386770", 20));
        firstReq.setSceneSignals(firstSceneSignals);
        MultimodalTriggerRespVO firstResp = appService.resolveMultimodalTrigger(firstReq);
        assertEquals("food", firstResp.getIntent());

        MultimodalTriggerReqVO freshReq = multimodalReq();
        freshReq.setPackageCode("XICHENG-MAP-001");
        freshReq.setSceneCode("xicheng-multimodal-trigger");
        freshReq.setUserTraceId("trace-xicheng-fresh-ocr-001");
        freshReq.setOcrText("恭王府博物馆入口");
        freshReq.setImageLabels(List.of("palace", "courtyard"));
        freshReq.setLocation(location("39.937050", "116.386770", 20));

        MultimodalTriggerRespVO freshResp = appService.resolveMultimodalTrigger(freshReq);

        assertEquals("guide", freshResp.getIntent());
        assertEquals("start_ai_guide", freshResp.getAction());
        assertEquals("xicheng-gongwangfu", freshResp.getPoiCode());
        assertFalse(freshResp.getRequiresUserConfirm());
    }

    @Test
    public void testResolveMultimodalTriggerHydratesContinuousContextFromPreviousAskEvent() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);
        consoleService.addKnowledgeDocument(xichengGongwangfuKnowledgeReq(packageId));

        RagChatReqVO askReq = xichengRagReq();
        askReq.setUserTraceId("trace-xicheng-ask-trigger-001");
        askReq.setQuestion("恭王府屋顶结构有什么看点？");
        askReq.setRegionCode("beijing-xicheng");
        askReq.setPoiCode("xicheng-gongwangfu");
        askReq.setPoiName("恭王府");
        askReq.setVisionAgentSceneFusionSummary("用户正在看恭王府博物馆入口和屋顶结构。");
        askReq.setVisionAgentWorldInterfaceSummary("相机融合城市知识库，判断当前位置是恭王府。");
        askReq.setVisionAgentPrimarySceneDomainKey("architecture");
        askReq.setVisionAgentPrimarySceneDomainLabel("建筑");
        askReq.setVisionAgentDecisionReasonSummary("适合继续讲王府格局和建筑细节。");
        askReq.setVisionAgentMemorySessionSceneCount(1);
        RagChatRespVO askAnswer = appService.answer(askReq);
        assertEquals("PASSED", askAnswer.getSafetyStatus());

        MultimodalTriggerReqVO followUpReq = multimodalReq();
        followUpReq.setPackageCode("XICHENG-MAP-001");
        followUpReq.setSceneCode("xicheng-multimodal-trigger");
        followUpReq.setUserTraceId("trace-xicheng-ask-trigger-001");
        followUpReq.setText("继续看这个屋顶结构");
        followUpReq.setOcrText("");
        followUpReq.setImageLabels(List.of());
        followUpReq.setLocation(null);

        MultimodalTriggerRespVO followUpResp = appService.resolveMultimodalTrigger(followUpReq);

        assertEquals("xicheng-gongwangfu", followUpResp.getPoiCode());
        assertEquals("恭王府", followUpResp.getPoiName());
        assertEquals("confirm_ai_guide", followUpResp.getAction());
        assertTrue(followUpResp.getRequiresUserConfirm());
        assertTrue(followUpResp.getCandidates().get(0).getMatchedSignals().contains("context_poi"));
        assertTrue(followUpResp.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.TRIGGER_RESOLVE.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-ask-trigger-001"));
        assertEquals(1, events.size());
        JsonNode payload = JsonUtils.parseTree(events.get(0).getPayloadJson());
        assertEquals("xicheng-gongwangfu", payload.get("poiCode").asText());
        assertEquals("", payload.get("ocrText").asText());
        JsonNode sceneSignals = payload.get("sceneSignals");
        assertTrue(sceneSignals.get("sceneFusionSummary").asText().contains("恭王府"));
        assertEquals(2, sceneSignals.get("memorySessionSceneCount").asInt());
    }

    @Test
    public void testResolveMultimodalTriggerUsesLatestAskWhenItIsNewerThanPreviousTrigger() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);
        insertXichengBaitasiPoi(packageId);
        consoleService.addKnowledgeDocument(xichengBaitasiKnowledgeReq(packageId));

        MultimodalTriggerReqVO firstTriggerReq = multimodalReq();
        firstTriggerReq.setPackageCode("XICHENG-MAP-001");
        firstTriggerReq.setSceneCode("xicheng-multimodal-trigger");
        firstTriggerReq.setUserTraceId("trace-xicheng-latest-memory-001");
        firstTriggerReq.setOcrText("恭王府博物馆入口");
        firstTriggerReq.setImageLabels(List.of("palace", "courtyard"));
        firstTriggerReq.setLocation(location("39.937050", "116.386770", 20));
        MultimodalTriggerRespVO firstTriggerResp = appService.resolveMultimodalTrigger(firstTriggerReq);
        assertEquals("xicheng-gongwangfu", firstTriggerResp.getPoiCode());

        RagChatReqVO askReq = xichengRagReq();
        askReq.setUserTraceId("trace-xicheng-latest-memory-001");
        askReq.setQuestion("妙应寺白塔屋顶结构有什么看点？");
        askReq.setPoiCode("xicheng-baitasi");
        askReq.setPoiName("妙应寺白塔");
        askReq.setVisionAgentSceneFusionSummary("用户转到妙应寺白塔，正在观察白塔和屋顶结构。");
        askReq.setVisionAgentWorldInterfaceSummary("相机融合城市知识库，判断当前位置是妙应寺白塔。");
        askReq.setVisionAgentPrimarySceneDomainKey("architecture");
        askReq.setVisionAgentPrimarySceneDomainLabel("建筑");
        askReq.setVisionAgentDecisionReasonSummary("适合继续讲白塔结构和白塔寺片区。");
        askReq.setVisionAgentMemorySessionSceneCount(1);
        RagChatRespVO askAnswer = appService.answer(askReq);
        assertEquals("PASSED", askAnswer.getSafetyStatus());

        MultimodalTriggerReqVO followUpReq = multimodalReq();
        followUpReq.setPackageCode("XICHENG-MAP-001");
        followUpReq.setSceneCode("xicheng-multimodal-trigger");
        followUpReq.setUserTraceId("trace-xicheng-latest-memory-001");
        followUpReq.setText("继续看这个屋顶结构");
        followUpReq.setOcrText("");
        followUpReq.setImageLabels(List.of());
        followUpReq.setLocation(null);

        MultimodalTriggerRespVO followUpResp = appService.resolveMultimodalTrigger(followUpReq);

        assertEquals("xicheng-baitasi", followUpResp.getPoiCode());
        assertEquals("妙应寺白塔", followUpResp.getPoiName());
        assertEquals("confirm_ai_guide", followUpResp.getAction());
        assertTrue(followUpResp.getCandidates().get(0).getMatchedSignals().contains("context_poi"));
        assertTrue(followUpResp.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));
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
    public void testGetPublicPackageDetailReturnsRegionCodeFromPublishedPoi() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        AppPackageDetailRespVO detail = appService.getPublicPackageDetail("XICHENG-MAP-001");

        assertEquals("XICHENG-MAP-001", detail.getPackageCode());
        assertEquals("beijing-xicheng", detail.getRegionCode());
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
    public void testAnswerCarriesVisionAgentContextIntoPromptAndAskEvent() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengBaitasiKnowledgeReq(packageId));
        ChatModel chatModel = mock(ChatModel.class);
        when(aiModelService.getRequiredDefaultModel(AiModelTypeEnum.CHAT.getType())).thenReturn(defaultChatModel());
        when(aiModelService.getChatModel(6601L)).thenReturn(chatModel);
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse("模型生成：现在适合先拍照，再讲白塔历史。"));

        RagChatReqVO reqVO = xichengRagReq();
        reqVO.setVisionAgentContextAvailable(true);
        reqVO.setVisionAgentSceneFusionSummary("晴天 18:40，夕阳适合先拍门楼。");
        reqVO.setVisionAgentWorldInterfaceSummary("相机融合定位、天气、方向和城市知识库。");
        reqVO.setVisionAgentMemorySessionText("用户刚识别过妙应寺白塔和白塔寺片区。");
        reqVO.setVisionAgentMemorySessionSceneCount(2);
        reqVO.setVisionAgentPrimarySceneDomainKey("architecture");
        reqVO.setVisionAgentPrimarySceneDomainLabel("建筑");
        reqVO.setVisionAgentSceneUnderstandingSummary("现场判断为建筑讲解和拍照建议。");
        reqVO.setVisionAgentDecisionActionTitle("先拍照");
        reqVO.setVisionAgentDecisionReasonSummary("马上日落，光线适合拍门楼。");
        reqVO.setVisionAgentLocalTimeText("18:40");
        reqVO.setVisionAgentWeatherText("晴");
        reqVO.setVisionAgentHeadingText("向西");
        reqVO.setServiceHandoffActionKey("start_ai_guide");
        reqVO.setServiceHandoffTaskType("auto");
        reqVO.setServiceHandoffIntent("guide");
        reqVO.setServiceHandoffIntentText("AI 讲解");
        reqVO.setServiceHandoffStepText("无需用户确认");
        reqVO.setServiceHandoffSummary("涉及商家、票务或优惠时必须说明需要真实系统确认。");
        reqVO.setServiceHandoffRequiresRealSystem(true);

        RagChatRespVO answer = appService.answer(reqVO);

        assertEquals("PASSED", answer.getSafetyStatus());
        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        verify(chatModel).call(promptCaptor.capture());
        String prompt = promptCaptor.getValue().getContents();
        assertTrue(prompt.contains("AI识境现场=晴天 18:40，夕阳适合先拍门楼。"));
        assertTrue(prompt.contains("世界交互入口=相机融合定位、天气、方向和城市知识库。"));
        assertTrue(prompt.contains("连续记忆=用户刚识别过妙应寺白塔和白塔寺片区。"));
        assertTrue(prompt.contains("记忆场景数=2"));
        assertTrue(prompt.contains("场景域=architecture/建筑"));
        assertTrue(prompt.contains("Agent建议=先拍照"));
        assertTrue(prompt.contains("Agent理由=马上日落，光线适合拍门楼。"));
        assertTrue(prompt.contains("实时环境=18:40 晴 向西"));
        assertTrue(prompt.contains("服务动作=start_ai_guide"));
        assertTrue(prompt.contains("服务任务=auto"));
        assertTrue(prompt.contains("服务意图=guide/AI 讲解"));
        assertTrue(prompt.contains("服务步骤=无需用户确认"));
        assertTrue(prompt.contains("服务承接=涉及商家、票务或优惠时必须说明需要真实系统确认。"));
        assertTrue(prompt.contains("真实系统确认=true"));
        assertFalse(prompt.contains("sourceRecognitionContext"));
        assertFalse(prompt.contains("/tmp/raw.jpg"));

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType()));
        assertEquals(1, events.size());
        JsonNode payload = JsonUtils.parseTree(events.get(0).getPayloadJson());
        JsonNode visionAgentContext = payload.get("visionAgentContext");
        assertEquals("晴天 18:40，夕阳适合先拍门楼。", visionAgentContext.get("sceneFusionSummary").asText());
        assertEquals("architecture", visionAgentContext.get("primarySceneDomainKey").asText());
        assertEquals(2, visionAgentContext.get("memorySessionSceneCount").asInt());
        assertEquals("start_ai_guide", visionAgentContext.get("serviceHandoffActionKey").asText());
        assertEquals("guide", visionAgentContext.get("serviceHandoffIntent").asText());
        assertEquals("无需用户确认", visionAgentContext.get("serviceHandoffStepText").asText());
        assertEquals("涉及商家、票务或优惠时必须说明需要真实系统确认。",
                visionAgentContext.get("serviceHandoffSummary").asText());
        assertFalse(visionAgentContext.has("sourceRecognitionContext"));
    }

    @Test
    public void testAnswerUsesVisionAgentContextForSourceSearchWhenQuestionIsGeneric() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengBaitasiKnowledgeReq(packageId));

        RagChatReqVO reqVO = xichengRagReq();
        reqVO.setQuestion("现在适合先做什么？");
        reqVO.setPoiCode("");
        reqVO.setPoiName("");
        reqVO.setVisionAgentSceneFusionSummary("妙应寺白塔。夕阳照到门楼。");
        reqVO.setVisionAgentWorldInterfaceSummary("白塔寺片区。相机融合定位和城市知识库。");
        reqVO.setVisionAgentSceneUnderstandingSummary("妙应寺白塔。现场主体是建筑。");

        RagChatRespVO answer = appService.answer(reqVO);

        assertEquals("PASSED", answer.getSafetyStatus());
        assertFalse(answer.getSources().isEmpty());
        assertEquals("妙应寺白塔权威讲解稿", answer.getSources().get(0).getTitle());
        assertTrue(answer.getAnswer().contains("妙应寺白塔"));
    }

    @Test
    public void testAnswerHydratesVisionAgentMemoryFromPreviousAskEvent() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengBaitasiKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));

        RagChatReqVO firstReq = xichengRagReq();
        firstReq.setUserTraceId("trace-xicheng-memory-001");
        firstReq.setVisionAgentSceneFusionSummary("用户举起手机看到妙应寺白塔，夕阳照到门楼。");
        firstReq.setVisionAgentWorldInterfaceSummary("相机融合定位和城市知识库，判断当前位置在白塔寺片区。");
        firstReq.setVisionAgentPrimarySceneDomainKey("architecture");
        firstReq.setVisionAgentPrimarySceneDomainLabel("建筑");
        firstReq.setVisionAgentSceneUnderstandingSummary("现场主体是妙应寺白塔。");
        firstReq.setVisionAgentDecisionReasonSummary("马上日落，光线适合先拍照。");
        firstReq.setVisionAgentMemorySessionSceneCount(1);
        RagChatRespVO firstAnswer = appService.answer(firstReq);
        assertEquals("PASSED", firstAnswer.getSafetyStatus());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-memory-001");
        followUpReq.setQuestion("它为什么值得看？");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("妙应寺白塔权威讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("妙应寺白塔"));

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-memory-001"));
        assertEquals(2, events.size());
        XunjingInteractionEventDO latestEvent = events.stream()
                .max((left, right) -> left.getId().compareTo(right.getId()))
                .orElseThrow();
        JsonNode payload = JsonUtils.parseTree(latestEvent.getPayloadJson());
        JsonNode visionAgentContext = payload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("妙应寺白塔"));
        assertEquals(1, visionAgentContext.get("memorySessionSceneCount").asInt());
    }

    @Test
    public void testAnswerHydratesVisionAgentContextFromPreviousTriggerEvent() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);
        consoleService.addKnowledgeDocument(xichengGongwangfuKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengBaitasiKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机看到恭王府博物馆入口。");
        sceneSignals.put("worldInterfaceSummary", "相机融合 GPS、OCR 和城市知识库，判断当前位置是恭王府。");
        sceneSignals.put("sceneDomainIntentKey", "architecture");
        sceneSignals.put("sceneDomainIntentLabel", "建筑");
        sceneSignals.put("agentDecisionReasonSummary", "适合先讲王府格局，再推荐参观路线。");
        sceneSignals.put("memorySessionSceneCount", 1);
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-trigger-chat-001");
        triggerReq.setOcrText("恭王府博物馆入口");
        triggerReq.setImageLabels(List.of("palace", "courtyard"));
        triggerReq.setLocation(location("39.937050", "116.386770", 20));
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("xicheng-gongwangfu", triggerResp.getPoiCode());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-trigger-chat-001");
        followUpReq.setQuestion("它有什么看点？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertEquals("beijing-xicheng", followUpAnswer.getRegionCode());
        assertEquals("xicheng-gongwangfu", followUpAnswer.getPoiCode());
        assertEquals("恭王府", followUpAnswer.getPoiName());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("恭王府权威讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("恭王府"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-trigger-chat-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        assertEquals("xicheng-gongwangfu", askPayload.get("poiCode").asText());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("恭王府"));
        assertEquals("开始 AI 讲解", visionAgentContext.get("decisionActionTitle").asText());
        assertEquals("start_ai_guide", visionAgentContext.get("serviceHandoffActionKey").asText());
        assertEquals("guide", visionAgentContext.get("serviceHandoffIntent").asText());
        assertEquals("无需用户确认", visionAgentContext.get("serviceHandoffStepText").asText());
        assertTrue(visionAgentContext.get("serviceHandoffSummary").asText().contains("start_ai_guide"));
    }

    @Test
    public void testAnswerMarksMerchantTriggerHandoffAsRealSystemRequired() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);
        consoleService.addKnowledgeDocument(xichengGongwangfuKnowledgeReq(packageId));
        ChatModel chatModel = mock(ChatModel.class);
        when(aiModelService.getRequiredDefaultModel(AiModelTypeEnum.CHAT.getType())).thenReturn(defaultChatModel());
        when(aiModelService.getChatModel(6601L)).thenReturn(chatModel);
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse("模型生成：附近餐饮要以真实系统确认为准。"));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneDomainIntentKey", "menu");
        sceneSignals.put("sceneDomainIntentLabel", "菜单");
        sceneSignals.put("sceneFusionSummary", "用户正在恭王府附近拍菜单，想知道推荐菜、优惠和是否清真。");
        sceneSignals.put("worldInterfaceSummary", "相机融合当前位置、时间和城市知识库后判断为餐饮服务场景。");
        sceneSignals.put("agentDecisionReasonSummary", "涉及商家推荐、优惠或排队时必须等待真实系统确认。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-merchant-handoff-001");
        triggerReq.setSceneSignals(sceneSignals);
        triggerReq.setLocation(location("39.937050", "116.386770", 20));
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("food", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-merchant-handoff-001");
        followUpReq.setQuestion("附近有什么适合第一次来的游客点？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO answer = appService.answer(followUpReq);

        assertEquals("PASSED", answer.getSafetyStatus());
        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        verify(chatModel).call(promptCaptor.capture());
        String prompt = promptCaptor.getValue().getContents();
        assertTrue(prompt.contains("服务意图=food/美食推荐"));
        assertTrue(prompt.contains("真实系统确认=true"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-merchant-handoff-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertEquals("food", visionAgentContext.get("serviceHandoffIntent").asText());
        assertTrue(visionAgentContext.get("serviceHandoffRequiresRealSystem").asBoolean());
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

    private KnowledgeDocumentCreateReqVO xichengGongwangfuKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("恭王府权威讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/gongwangfu");
        reqVO.setContentDigest("恭王府是北京西城王府文化和园林空间的代表性点位，适合讲王府格局、历史人物和亲子参观路线。");
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

    private void insertXichengBaitasiPoi(Long packageId) {
        new JdbcTemplate(dataSource).update("""
                INSERT INTO "xunjing_poi"
                ("package_id", "poi_code", "region_code", "name", "official_name", "aliases_json",
                 "category", "poi_level", "address", "latitude", "longitude", "coord_type",
                 "source_json", "trigger_json", "content_json", "review_status", "geo_status",
                 "license_status", "status", "tenant_id")
                VALUES (?, 'xicheng-baitasi', 'beijing-xicheng', '妙应寺白塔', '妙应寺白塔',
                 '["妙应寺白塔","妙应寺","白塔寺","白塔"]',
                 'historic_site', 'P0', '北京市西城区阜成门内大街171号', 39.9231000, 116.3572600, 'GCJ02',
                 '{"sourceType":"OFFICIAL_PUBLIC","sourceUrl":"https://www.bjxch.gov.cn/example/baitasi","contentDigest":"妙应寺白塔是白塔寺片区的重要历史文化地标。"}',
                 '{"gpsRadiusMeters":220,"ocrKeywords":["妙应寺白塔","白塔寺","妙应寺"],"photoLabels":["white_pagoda","pagoda","temple"],"minConfidence":0.85}',
                 '{"shortIntro":"白塔寺片区的重要历史文化地标。","recommendedQuestions":["妙应寺白塔为什么重要？","白塔寺片区适合怎么逛？","这里适合拍什么？"]}',
                 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', ?)
                """, packageId, TENANT_ID);
    }

    private void insertShichahaiAndYandaiPoi(Long packageId) {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        jdbcTemplate.update("""
                INSERT INTO "xunjing_poi"
                ("package_id", "poi_code", "region_code", "name", "official_name", "aliases_json",
                 "category", "poi_level", "address", "latitude", "longitude", "coord_type",
                 "source_json", "trigger_json", "content_json", "review_status", "geo_status",
                 "license_status", "status", "tenant_id")
                VALUES (?, 'xicheng-shichahai', 'beijing-xicheng', '什刹海', '什刹海',
                 '["什刹海","后海","前海","西海","烟袋斜街"]',
                 'historic_district', 'P0', '北京市西城区什刹海片区', 39.9403100, 116.3863900, 'GCJ02',
                 '{"sourceType":"OFFICIAL_PUBLIC","sourceUrl":"https://www.bjxch.gov.cn/example/shichahai","contentDigest":"什刹海是胡同、水系和城市漫步结合的代表片区。"}',
                 '{"gpsRadiusMeters":650,"ocrKeywords":["什刹海","后海","前海","西海"],"photoLabels":["lake","hutong","waterfront","old_beijing"],"minConfidence":0.85}',
                 '{"shortIntro":"胡同、水系和市井生活交织的老北京漫游片区。","recommendedQuestions":["什刹海适合怎么逛？","这里有哪些老北京故事？","附近下一站推荐哪里？"]}',
                 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', ?)
                """, packageId, TENANT_ID);
        jdbcTemplate.update("""
                INSERT INTO "xunjing_poi"
                ("package_id", "poi_code", "region_code", "name", "official_name", "aliases_json",
                 "category", "poi_level", "address", "latitude", "longitude", "coord_type",
                 "source_json", "trigger_json", "content_json", "review_status", "geo_status",
                 "license_status", "status", "tenant_id")
                VALUES (?, 'xicheng-yandai-xiejie', 'beijing-xicheng', '烟袋斜街', '烟袋斜街',
                 '["烟袋斜街","烟袋","什刹海烟袋斜街"]',
                 'historic_street', 'P0', '北京市西城区烟袋斜街', 39.9407000, 116.3915500, 'GCJ02',
                 '{"sourceType":"OFFICIAL_PUBLIC","sourceUrl":"https://www.visitbeijing.com.cn/article/47Qs8CSbNMv","contentDigest":"烟袋斜街是什刹海胡同漫游线上的高频街巷点。"}',
                 '{"gpsRadiusMeters":220,"ocrKeywords":["烟袋斜街","烟袋"],"photoLabels":["hutong","shop_sign","historic_street"],"minConfidence":0.85}',
                 '{"shortIntro":"什刹海胡同漫游线上的高频街巷点。","recommendedQuestions":["烟袋斜街为什么出名？","这里适合拍什么？","怎么接银锭桥和后海？"]}',
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

    private void setField(Object target, String name, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }

}
