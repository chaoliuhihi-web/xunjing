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
import static org.junit.jupiter.api.Assertions.assertNotNull;
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
    public void testRecordAgentActionEventStoresStructuredTelemetryWithoutRawImagePayload() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));

        AppInteractionEventReqVO reqVO = new AppInteractionEventReqVO();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneCode("xicheng-agent-action");
        reqVO.setEventType(XunjingEnums.EventType.AGENT_ACTION.getType());
        reqVO.setSourceChannel("xicheng-app");
        reqVO.setUserTraceId("trace-xicheng-agent-action-001");
        reqVO.setPayloadJson("""
                {
                  "actionKey":"generate_travelogue",
                  "title":"生成游记",
                  "intent":"record",
                  "targetPath":"/pages/travel-note/edit?regionCode=beijing-xicheng&poiCode=xicheng-gongwangfu&packageCode=XICHENG-MAP-001&confirm=1",
                  "sourceTriggerTraceId":"trace-xicheng-travel-record-actions-001",
                  "requiresRealSystem":false,
                  "executionStatus":"started",
                  "poiCode":"xicheng-gongwangfu",
                  "poiName":"恭王府",
                  "imageBase64":"blocked"
                }
                """);

        Long eventId = appService.recordEvent(reqVO);

        XunjingInteractionEventDO event = interactionEventMapper.selectById(eventId);
        assertEquals(packageId, event.getPackageId());
        assertEquals(schoolId, event.getSchoolId());
        assertEquals(XunjingEnums.EventType.AGENT_ACTION.getType(), event.getEventType());
        assertEquals("xicheng-app", event.getSourceChannel());
        assertEquals("trace-xicheng-agent-action-001", event.getUserTraceId());
        JsonNode payload = JsonUtils.parseTree(event.getPayloadJson());
        JsonNode agentAction = payload.get("agentAction");
        assertEquals("generate_travelogue", agentAction.get("actionKey").asText());
        assertEquals("生成游记", agentAction.get("title").asText());
        assertEquals("record", agentAction.get("intent").asText());
        assertEquals("started", agentAction.get("executionStatus").asText());
        assertEquals("trace-xicheng-travel-record-actions-001", agentAction.get("sourceTriggerTraceId").asText());
        assertFalse(agentAction.get("requiresRealSystem").asBoolean());
        assertEquals("xicheng-gongwangfu", agentAction.get("poiCode").asText());
        assertEquals("恭王府", agentAction.get("poiName").asText());
        assertTrue(agentAction.get("targetPath").asText().contains("packageCode=XICHENG-MAP-001"));
        JsonNode travelRecordMaterial = payload.get("travelRecordMaterial");
        assertEquals("travel_record", travelRecordMaterial.get("artifactType").asText());
        assertEquals("XICHENG-MAP-001", travelRecordMaterial.get("packageCode").asText());
        assertEquals("xicheng-agent-action", travelRecordMaterial.get("sceneCode").asText());
        assertEquals("beijing-xicheng", travelRecordMaterial.get("regionCode").asText());
        assertEquals("xicheng-gongwangfu", travelRecordMaterial.get("poiCode").asText());
        assertEquals("恭王府", travelRecordMaterial.get("poiName").asText());
        assertEquals("generate_travelogue", travelRecordMaterial.get("actionKey").asText());
        assertEquals("started", travelRecordMaterial.get("executionStatus").asText());
        assertEquals("trace-xicheng-travel-record-actions-001",
                travelRecordMaterial.get("sourceTriggerTraceId").asText());
        assertTrue(travelRecordMaterial.get("generateTravelogue").asBoolean());
        assertFalse(travelRecordMaterial.get("requiresRealSystem").asBoolean());
        assertFalse(event.getPayloadJson().contains("imageBase64"));
        assertFalse(event.getPayloadJson().contains("blocked"));
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
    public void testResolveMultimodalTriggerBuildsCoreAgentActionPackForRecognizedPoi() {
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

        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertTrue(respVO.getAgentActions().stream()
                .anyMatch(action -> "start_ai_guide".equals(action.getActionKey())
                        && "开始 AI 讲解".equals(action.getTitle())));
        assertTrue(respVO.getAgentActions().stream()
                .anyMatch(action -> "recommend_next_stop".equals(action.getActionKey())
                        && "推荐下一站".equals(action.getTitle())
                        && Boolean.FALSE.equals(action.getRequiresRealSystem())));
        assertTrue(respVO.getAgentActions().stream()
                .anyMatch(action -> "nearby_food".equals(action.getActionKey())
                        && "附近美食".equals(action.getTitle())
                        && Boolean.TRUE.equals(action.getRequiresRealSystem())));
        assertTrue(respVO.getAgentActions().stream()
                .anyMatch(action -> "complete_check_in".equals(action.getActionKey())
                        && "完成打卡".equals(action.getTitle())));
        assertTrue(respVO.getAgentActions().stream()
                .anyMatch(action -> "claim_badge".equals(action.getActionKey())
                        && "领取徽章".equals(action.getTitle())));
        assertTrue(respVO.getAgentActions().stream()
                .anyMatch(action -> "add_to_travel_map".equals(action.getActionKey())
                        && "加入旅行地图".equals(action.getTitle())));
        assertTrue(respVO.getAgentActions().stream()
                .anyMatch(action -> "generate_travelogue".equals(action.getActionKey())
                        && "生成游记".equals(action.getTitle())));
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
    public void testResolveMultimodalTriggerUsesOperationSignalsForContextMatch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneDomainIntentKey", "activity");
        sceneSignals.put("sceneDomainIntentLabel", "活动");
        sceneSignals.put("sceneFusionSummary", "用户举起手机等待识境建议。");
        sceneSignals.put("worldInterfaceSummary", "相机融合城市知识库后等待运营系统接力。");
        sceneSignals.put("nearbyActivitySummary", "恭王府夜场演出 19:30 开始，适合查看预约和票务。");
        sceneSignals.put("routeRecommendationSummary", "建议从当前位置步行到恭王府入口集合点。");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setText("");
        reqVO.setOcrText("");
        reqVO.setImageLabels(List.of());
        reqVO.setLocation(null);
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("activity", respVO.getIntent());
        assertEquals("confirm_activity_handoff", respVO.getAction());
        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));
    }

    @Test
    public void testResolveMultimodalTriggerUsesMenuSignalsForIntentAndContextMatch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机等待识境建议。");
        sceneSignals.put("worldInterfaceSummary", "相机融合菜单 OCR 和城市知识库后等待场景引擎判断。");
        sceneSignals.put("menuItemNames", "拉条子 烤包子");
        sceneSignals.put("spiceLevelSummary", "中辣");
        sceneSignals.put("halalSuitabilityText", "清真友好");
        sceneSignals.put("dishRecommendationSummary", "恭王府门口餐厅第一次来建议点拉条子和烤包子。");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneCode("xicheng-multimodal-trigger");
        reqVO.setUserTraceId("trace-xicheng-travel-record-actions-001");
        reqVO.setText("");
        reqVO.setOcrText("");
        reqVO.setImageLabels(List.of());
        reqVO.setLocation(null);
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("food", respVO.getIntent());
        assertEquals("confirm_food_recommendation", respVO.getAction());
        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));
    }

    @Test
    public void testResolveMultimodalTriggerUsesFoodSignalsForIntentAndContextMatch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机拍到刚出炉的小吃。");
        sceneSignals.put("worldInterfaceSummary", "相机融合美食识别和城市知识库后等待场景引擎判断。");
        sceneSignals.put("sceneDomainIntentKey", "food");
        sceneSignals.put("sceneDomainIntentLabel", "美食");
        sceneSignals.put("foodItemName", "烤包子");
        sceneSignals.put("foodOriginSummary", "新疆街头小吃。");
        sceneSignals.put("cookingMethodSummary", "馕坑高温烤制。");
        sceneSignals.put("eatingMethodSummary", "趁热掰开吃。");
        sceneSignals.put("pairingSuggestionText", "适合配酸奶。");
        sceneSignals.put("nearbyFoodRecommendationSummary", "恭王府附近可找清真老字号。");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setText("");
        reqVO.setOcrText("");
        reqVO.setImageLabels(List.of());
        reqVO.setLocation(null);
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("food", respVO.getIntent());
        assertEquals("confirm_food_recommendation", respVO.getAction());
        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));
    }

    @Test
    public void testResolveMultimodalTriggerUsesSignTranslationSignalsForIntentAndContextMatch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机等待识境判断。");
        sceneSignals.put("worldInterfaceSummary", "相机融合 OCR、路牌翻译和城市知识库后等待场景引擎判断。");
        sceneSignals.put("sceneDomainIntentKey", "sign");
        sceneSignals.put("sceneDomainIntentLabel", "路牌");
        sceneSignals.put("signOriginalText", "گۇڭ ۋاڭفۇ كىرىش ئېغىزى");
        sceneSignals.put("signTranslationText", "恭王府入口");
        sceneSignals.put("signPronunciationText", "gong wang fu kirish eghizi");
        sceneSignals.put("signNavigationHint", "可作为前往恭王府入口的导航线索。");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setText("");
        reqVO.setOcrText("");
        reqVO.setImageLabels(List.of());
        reqVO.setLocation(null);
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("translate", respVO.getIntent());
        assertEquals("confirm_sign_translation", respVO.getAction());
        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));
    }

    @Test
    public void testResolveMultimodalTriggerUsesInterpretationSignalsForIntentAndContextMatch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机等待识境讲解。");
        sceneSignals.put("worldInterfaceSummary", "相机融合建筑细节、城市知识库和连续记忆后等待场景引擎判断。");
        sceneSignals.put("sceneDomainIntentKey", "architecture");
        sceneSignals.put("sceneDomainIntentLabel", "建筑");
        sceneSignals.put("agentDecisionReasonSummary", "适合深入讲解年代、结构、隐藏细节和历史故事。");
        sceneSignals.put("recognizedObjectName", "恭王府彩画木梁");
        sceneSignals.put("eraOrPeriodText", "清代王府建筑");
        sceneSignals.put("structureOrCraftSummary", "榫卯木梁结构");
        sceneSignals.put("historicalStorySummary", "修缮时保留原有梁架和王府格局。");
        sceneSignals.put("hiddenDetailSummary", "抬头能看到不用钉子的咬合节点。");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setText("");
        reqVO.setOcrText("");
        reqVO.setImageLabels(List.of());
        reqVO.setLocation(null);
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("interpret", respVO.getIntent());
        assertEquals("confirm_scene_interpretation", respVO.getAction());
        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));
    }

    @Test
    public void testResolveMultimodalTriggerUsesHeritageSignalsForIntentAndContextMatch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机拍到一把民族弹拨乐器。");
        sceneSignals.put("worldInterfaceSummary", "相机融合非遗乐器识别和城市知识库后等待场景引擎判断。");
        sceneSignals.put("sceneDomainIntentKey", "intangible_heritage");
        sceneSignals.put("sceneDomainIntentLabel", "非遗");
        sceneSignals.put("agentDecisionReasonSummary", "适合讲制作过程、演奏方式、声音线索和附近体验。");
        sceneSignals.put("heritageItemName", "热瓦普");
        sceneSignals.put("heritageCategoryText", "民族弹拨乐器");
        sceneSignals.put("craftProcessSummary", "木质琴身和皮面共鸣箱制作。");
        sceneSignals.put("performanceMethodSummary", "右手拨弦、左手按弦演奏。");
        sceneSignals.put("soundAssetHint", "可播放热瓦普音色样例。");
        sceneSignals.put("nearbyExperienceSummary", "恭王府附近可推荐非遗乐器体验。");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setText("");
        reqVO.setOcrText("");
        reqVO.setImageLabels(List.of());
        reqVO.setLocation(null);
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("interpret", respVO.getIntent());
        assertEquals("confirm_scene_interpretation", respVO.getAction());
        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));
    }

    @Test
    public void testResolveMultimodalTriggerUsesPlantSignalsForIntentAndContextMatch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机拍到一棵胡杨。");
        sceneSignals.put("worldInterfaceSummary", "相机融合植物识别和城市知识库后等待场景引擎判断。");
        sceneSignals.put("sceneDomainIntentKey", "plant");
        sceneSignals.put("sceneDomainIntentLabel", "植物");
        sceneSignals.put("agentDecisionReasonSummary", "适合讲树龄、耐旱原因、最佳观赏季和分布。");
        sceneSignals.put("plantSpeciesName", "胡杨");
        sceneSignals.put("plantAgeEstimateText", "约百年树龄");
        sceneSignals.put("plantAdaptationSummary", "根系深、叶片可减少蒸腾，适合干旱环境。");
        sceneSignals.put("bestViewingSeasonText", "秋季金黄时最好看。");
        sceneSignals.put("regionalDistributionSummary", "恭王府附近园林讲解可延展到新疆塔里木河流域分布。");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setText("");
        reqVO.setOcrText("");
        reqVO.setImageLabels(List.of());
        reqVO.setLocation(null);
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("interpret", respVO.getIntent());
        assertEquals("confirm_scene_interpretation", respVO.getAction());
        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));
    }

    @Test
    public void testResolveMultimodalTriggerUsesAnimalSignalsForSafetyIntentAndContextMatch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户拍到一块雪豹临时展板。");
        sceneSignals.put("worldInterfaceSummary", "相机融合动物识别、保护知识和城市知识库后等待场景引擎判断。");
        sceneSignals.put("sceneDomainIntentKey", "animal");
        sceneSignals.put("sceneDomainIntentLabel", "动物");
        sceneSignals.put("agentDecisionReasonSummary", "先说明保护情况、栖息地和是否危险，提醒不要靠近或投喂。");
        sceneSignals.put("animalSpeciesName", "雪豹");
        sceneSignals.put("conservationStatusText", "国家一级保护野生动物");
        sceneSignals.put("habitatSummary", "高山岩地和雪线附近活动，恭王府附近展板适合做保护教育。");
        sceneSignals.put("dangerAssessmentText", "野外近距离接触有风险。");
        sceneSignals.put("safetyReminderText", "不要靠近、投喂或追赶。");
        sceneSignals.put("arDisplayHint", "可展示雪豹体型和栖息地 AR 模型。");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setText("");
        reqVO.setOcrText("");
        reqVO.setImageLabels(List.of());
        reqVO.setLocation(null);
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("safety", respVO.getIntent());
        assertEquals("confirm_safety_advisory", respVO.getAction());
        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));
    }

    @Test
    public void testResolveMultimodalTriggerUsesPersonSignalsForIntentAndContextMatch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机拍到一座人物雕像。");
        sceneSignals.put("worldInterfaceSummary", "相机融合人物识别和城市知识库后等待场景引擎判断。");
        sceneSignals.put("sceneDomainIntentKey", "person");
        sceneSignals.put("sceneDomainIntentLabel", "人物");
        sceneSignals.put("agentDecisionReasonSummary", "适合讲人物故事、为什么建在这里、贡献和同时期人物。");
        sceneSignals.put("personName", "香妃");
        sceneSignals.put("personStorySummary", "可沿人物传说讲到清代新疆和宫廷叙事。");
        sceneSignals.put("statueSiteReasonSummary", "恭王府附近讲人物雕像时可延展到城市历史关系。");
        sceneSignals.put("contributionSummary", "人物线索适合连接民族交流和丝路记忆。");
        sceneSignals.put("contemporaryFigureKeywords", "乾隆 清朝新疆 丝绸之路");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setText("");
        reqVO.setOcrText("");
        reqVO.setImageLabels(List.of());
        reqVO.setLocation(null);
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("interpret", respVO.getIntent());
        assertEquals("confirm_scene_interpretation", respVO.getAction());
        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));
    }

    @Test
    public void testResolveMultimodalTriggerUsesActivitySignalsForIntentAndContextMatch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机拍到一处演出现场。");
        sceneSignals.put("worldInterfaceSummary", "相机融合演出识别、时间和城市知识库后等待场景引擎判断。");
        sceneSignals.put("sceneDomainIntentKey", "activity");
        sceneSignals.put("sceneDomainIntentLabel", "活动");
        sceneSignals.put("agentDecisionReasonSummary", "适合讲节目背景、演员、开始时间、票务和场地导航。");
        sceneSignals.put("activityName", "木卡姆小剧场");
        sceneSignals.put("activityBackgroundSummary", "节目背景来自丝路音乐交流。");
        sceneSignals.put("performerSummary", "本地青年乐团和非遗传承人联合演出。");
        sceneSignals.put("scheduleTimeText", "今晚 20:00 开始。");
        sceneSignals.put("ticketingHint", "买票和预约必须跳转真实票务系统确认。");
        sceneSignals.put("venueNavigationHint", "恭王府附近临时舞台入口集合。");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setText("");
        reqVO.setOcrText("");
        reqVO.setImageLabels(List.of());
        reqVO.setLocation(null);
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("activity", respVO.getIntent());
        assertEquals("confirm_activity_handoff", respVO.getAction());
        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));
    }

    @Test
    public void testResolveMultimodalTriggerUsesTravelRecordSignalsForIntentAndContextMatch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户完成当前识境任务，适合沉淀旅行记录。");
        sceneSignals.put("worldInterfaceSummary", "相机融合位置、照片和连续记忆后生成游记任务包。");
        sceneSignals.put("sceneDomainIntentKey", "record");
        sceneSignals.put("sceneDomainIntentLabel", "旅行记录");
        sceneSignals.put("agentDecisionReasonSummary", "适合完成打卡、领取徽章、加入旅行地图并生成游记素材。");
        sceneSignals.put("checkInTaskSummary", "完成恭王府入口打卡。");
        sceneSignals.put("badgeRewardName", "西城王府探索徽章");
        sceneSignals.put("travelMapUpdateSummary", "已加入今天的旅行地图。");
        sceneSignals.put("travelogueMaterialSummary", "保留照片、停留时长和讲解线索。");
        sceneSignals.put("photoMomentSummary", "王府入口合影可作为今日封面。");
        sceneSignals.put("socialShareDraftHint", "可生成朋友圈和小红书文案草稿。");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setUserTraceId("trace-xicheng-travel-record-actions-001");
        reqVO.setText("");
        reqVO.setOcrText("");
        reqVO.setImageLabels(List.of());
        reqVO.setLocation(null);
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("record", respVO.getIntent());
        assertEquals("confirm_travel_note", respVO.getAction());
        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertTrue(respVO.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));
        assertTrue(respVO.getAgentActions().stream()
                .anyMatch(action -> "complete_check_in".equals(action.getActionKey())
                        && "完成打卡".equals(action.getTitle())));
        assertTrue(respVO.getAgentActions().stream()
                .anyMatch(action -> "add_to_travel_map".equals(action.getActionKey())
                        && "加入旅行地图".equals(action.getTitle())));
        assertTrue(respVO.getAgentActions().stream()
                .anyMatch(action -> "generate_travelogue".equals(action.getActionKey())
                        && "生成游记".equals(action.getTitle())));

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.TRIGGER_RESOLVE.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId,
                                "trace-xicheng-travel-record-actions-001"));
        assertEquals(1, events.size());
        JsonNode payload = JsonUtils.parseTree(events.get(0).getPayloadJson());
        JsonNode agentActions = payload.get("agentActions");
        assertTrue(agentActions.toString().contains("complete_check_in"));
        assertTrue(agentActions.toString().contains("add_to_travel_map"));
        assertTrue(agentActions.toString().contains("generate_travelogue"));
        assertTrue(agentActions.toString().contains("\"packageCode\":\"XICHENG-MAP-001\""));
        assertTrue(agentActions.toString().contains("\"regionCode\":\"beijing-xicheng\""));
        assertTrue(agentActions.toString().contains("\"poiCode\":\"xicheng-gongwangfu\""));
        assertTrue(agentActions.toString().contains("\"poiName\":\"恭王府\""));
        assertFalse(events.get(0).getPayloadJson().contains("imageBase64"));
    }

    @Test
    public void testResolveMultimodalTriggerUsesPhotoAdviceIntent() {
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

        assertEquals("photo", respVO.getIntent());
        assertEquals("confirm_photo_advice", respVO.getAction());
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
        JsonNode payload = JsonUtils.parseTree(event.getPayloadJson());
        JsonNode matchedSignals = payload.get("matchedSignals");
        assertEquals(3, matchedSignals.size());
        assertTrue(matchedSignals.toString().contains("gps_radius"));
        assertTrue(matchedSignals.toString().contains("ocr_alias"));
        assertTrue(matchedSignals.toString().contains("image_label"));
        assertFalse(payload.has("candidates"));
        assertFalse(event.getPayloadJson().contains("imageBase64"));
    }

    @Test
    public void testResolveMultimodalTriggerBuildsFallbackSceneUnderstandingWithoutClientSignals() {
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
        reqVO.setSceneSignals(null);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("xicheng-gongwangfu", respVO.getPoiCode());
        assertNotNull(respVO.getSceneUnderstanding());
        assertTrue(respVO.getSceneUnderstanding().getSceneFusionSummary().contains("恭王府"),
                respVO.getSceneUnderstanding().getSceneFusionSummary());
        assertTrue(respVO.getSceneUnderstanding().getSceneFusionSummary().contains("OCR文字"),
                respVO.getSceneUnderstanding().getSceneFusionSummary());
        assertTrue(respVO.getSceneUnderstanding().getWorldInterfaceSummary().contains("城市知识库"));
        assertEquals("guide", respVO.getSceneUnderstanding().getPrimarySceneDomainKey());
        assertEquals("AI讲解", respVO.getSceneUnderstanding().getPrimarySceneDomainLabel());
        assertEquals("开始 AI 讲解", respVO.getSceneUnderstanding().getAgentDecisionActionTitle());
        assertTrue(respVO.getSceneUnderstanding().getAgentDecisionReasonSummary().contains("定位"));
        assertTrue(respVO.getSceneUnderstanding().getServiceHandoffSummary().contains("start_ai_guide"));
        assertTrue(respVO.getSceneUnderstanding().getEvidenceSignals().contains("gps_radius"));
        assertTrue(respVO.getSceneUnderstanding().getEvidenceSignals().contains("ocr_alias"));
    }

    @Test
    public void testResolveMultimodalTriggerRecordsServiceHandoffContractForMerchantScene() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneDomainIntentKey", "menu");
        sceneSignals.put("sceneDomainIntentLabel", "菜单");
        sceneSignals.put("sceneFusionSummary", "用户正在恭王府附近拍菜单，想知道推荐菜、优惠和是否清真。");
        sceneSignals.put("worldInterfaceSummary", "相机融合当前位置、时间和城市知识库后判断为餐饮服务场景。");
        sceneSignals.put("merchantServiceSummary", "附近餐饮商户支持优惠券、排队和预约但必须由真实商家系统确认。");
        sceneSignals.put("dishRecommendationSummary", "第一次来建议点招牌套餐。");
        sceneSignals.put("halalSuitabilityText", "清真信息需要商家实时确认。");
        sceneSignals.put("agentDecisionReasonSummary", "涉及商家推荐、优惠或排队时必须等待真实系统确认。");
        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneCode("xicheng-multimodal-trigger");
        reqVO.setUserTraceId("trace-xicheng-merchant-handoff-contract-001");
        reqVO.setSceneSignals(sceneSignals);
        reqVO.setLocation(location("39.937050", "116.386770", 20));

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("food", respVO.getIntent());
        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.TRIGGER_RESOLVE.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId,
                                "trace-xicheng-merchant-handoff-contract-001"));
        assertEquals(1, events.size());
        JsonNode payload = JsonUtils.parseTree(events.get(0).getPayloadJson());
        assertTrue(payload.has("serviceHandoff"));
        JsonNode handoff = payload.get("serviceHandoff");
        assertEquals(respVO.getAction(), handoff.get("actionKey").asText());
        assertEquals("food", handoff.get("intent").asText());
        assertEquals("美食推荐", handoff.get("intentText").asText());
        assertEquals("需要用户确认", handoff.get("stepText").asText());
        assertTrue(handoff.get("requiresRealSystem").asBoolean());
        assertEquals("附近餐饮商户支持优惠券、排队和预约但必须由真实商家系统确认。",
                handoff.get("merchantServiceSummary").asText());
        assertEquals("第一次来建议点招牌套餐。", handoff.get("dishRecommendationSummary").asText());
        assertEquals("清真信息需要商家实时确认。", handoff.get("halalSuitabilityText").asText());
        assertTrue(handoff.get("summary").asText().contains("优惠券"));
        assertTrue(handoff.get("summary").asText().contains("真实系统确认=true"));
        assertFalse(events.get(0).getPayloadJson().contains("imageBase64"));
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
            assertEquals("success", sceneSignals.get("visionRecognitionStatus").asText());
            assertEquals("qwen-vl-max", sceneSignals.get("visionRecognitionModel").asText());
            assertEquals(0, sceneSignals.get("visionRecognitionLabelCount").asInt());
            assertFalse(sceneSignals.has("sourceRecognitionContext"));
            assertFalse(events.get(0).getPayloadJson().contains("test-key"));
            assertFalse(events.get(0).getPayloadJson().contains("/vision/v1"));
            assertFalse(events.get(0).getPayloadJson().contains("imageBase64"));
        } finally {
            setField(visionRecognitionService, "visionApiUrl", "");
            setField(visionRecognitionService, "visionApiKey", "");
            server.stop(0);
        }
    }

    @Test
    public void testResolveMultimodalTriggerNoMatchKeepsVisionEvidenceInSceneUnderstanding() throws Exception {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        setField(visionRecognitionService, "visionApiUrl", "");
        setField(visionRecognitionService, "visionApiKey", "");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneCode("xicheng-multimodal-trigger");
        reqVO.setUserTraceId("trace-xicheng-no-match-vision-evidence-001");
        reqVO.setOcrText("");
        reqVO.setImageLabels(List.of());
        PhotoMetaReqVO photoMeta = new PhotoMetaReqVO();
        photoMeta.setImageId("photo-provider-missing-001");
        photoMeta.setImageMimeType("image/jpeg");
        photoMeta.setImageBase64("photo-base64");
        reqVO.setPhotoMeta(photoMeta);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("ask", respVO.getIntent());
        assertEquals("ask_ai_companion", respVO.getAction());
        assertNotNull(respVO.getSceneUnderstanding());
        assertEquals("provider_not_configured", respVO.getSceneUnderstanding().getVisionRecognitionStatus());
        assertEquals("qwen-vl-max", respVO.getSceneUnderstanding().getVisionRecognitionModel());
        assertEquals(0, respVO.getSceneUnderstanding().getVisionRecognitionLabelCount());
        assertTrue(respVO.getSceneUnderstanding().getServiceHandoffSummary().contains("ask_ai_companion"));

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType,
                                XunjingEnums.EventType.TRIGGER_RESOLVE.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId,
                                "trace-xicheng-no-match-vision-evidence-001"));
        assertEquals(1, events.size());
        JsonNode payload = JsonUtils.parseTree(events.get(0).getPayloadJson());
        JsonNode sceneSignals = payload.get("sceneSignals");
        assertEquals("provider_not_configured", sceneSignals.get("visionRecognitionStatus").asText());
        JsonNode sceneUnderstanding = payload.get("sceneUnderstanding");
        assertEquals("provider_not_configured",
                sceneUnderstanding.get("visionRecognitionStatus").asText());
        assertEquals("qwen-vl-max", sceneUnderstanding.get("visionRecognitionModel").asText());
        assertEquals(0, sceneUnderstanding.get("visionRecognitionLabelCount").asInt());
        assertFalse(events.get(0).getPayloadJson().contains("imageBase64"));
        assertFalse(events.get(0).getPayloadJson().contains("photo-base64"));
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
    public void testResolveMultimodalTriggerExposesSceneUnderstandingContract() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "晴天 18:40，夕阳照到恭王府门楼，建议先拍照再讲历史。");
        sceneSignals.put("worldInterfaceSummary", "相机融合 GPS、OCR、时间、天气和城市知识库后判断当前世界。");
        sceneSignals.put("localTimeText", "18:40");
        sceneSignals.put("weatherText", "晴");
        sceneSignals.put("headingText", "向西");
        sceneSignals.put("sceneDomainIntentKey", "architecture");
        sceneSignals.put("sceneDomainIntentLabel", "建筑");
        sceneSignals.put("agentDecisionActionTitle", "先拍照");
        sceneSignals.put("agentDecisionReasonSummary", "马上日落，门楼光线适合先拍照。");
        sceneSignals.put("memorySessionSceneCount", 4);
        sceneSignals.put("visionRecognitionStatus", "success");
        sceneSignals.put("visionRecognitionModel", "qwen-vl-max");
        sceneSignals.put("visionRecognitionLabelCount", 2);

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneCode("xicheng-multimodal-trigger");
        reqVO.setUserTraceId("trace-xicheng-scene-understanding-001");
        reqVO.setOcrText("恭王府博物馆入口");
        reqVO.setImageLabels(List.of("palace", "courtyard"));
        reqVO.setLocation(location("39.937050", "116.386770", 20));
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertNotNull(respVO.getSceneUnderstanding());
        assertEquals("晴天 18:40，夕阳照到恭王府门楼，建议先拍照再讲历史。",
                respVO.getSceneUnderstanding().getSceneFusionSummary());
        assertEquals("相机融合 GPS、OCR、时间、天气和城市知识库后判断当前世界。",
                respVO.getSceneUnderstanding().getWorldInterfaceSummary());
        assertEquals("architecture", respVO.getSceneUnderstanding().getPrimarySceneDomainKey());
        assertEquals("建筑", respVO.getSceneUnderstanding().getPrimarySceneDomainLabel());
        assertEquals("18:40", respVO.getSceneUnderstanding().getLocalTimeText());
        assertEquals("晴", respVO.getSceneUnderstanding().getWeatherText());
        assertEquals("向西", respVO.getSceneUnderstanding().getHeadingText());
        assertEquals(4, respVO.getSceneUnderstanding().getMemorySessionSceneCount());
        assertEquals("success", respVO.getSceneUnderstanding().getVisionRecognitionStatus());
        assertEquals("先拍照", respVO.getSceneUnderstanding().getAgentDecisionActionTitle());
        assertTrue(respVO.getSceneUnderstanding().getAgentDecisionReasonSummary().contains("马上日落"));
        assertTrue(respVO.getSceneUnderstanding().getEvidenceSignals().contains("gps_radius"));
        assertTrue(respVO.getSceneUnderstanding().getEvidenceSignals().contains("ocr_alias"));
        assertTrue(respVO.getSceneUnderstanding().getEvidenceSignals().contains("image_label"));
        assertTrue(respVO.getSceneUnderstanding().getServiceHandoffSummary().contains(respVO.getAction()));

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.TRIGGER_RESOLVE.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId,
                                "trace-xicheng-scene-understanding-001"));
        assertEquals(1, events.size());
        JsonNode payload = JsonUtils.parseTree(events.get(0).getPayloadJson());
        JsonNode sceneUnderstanding = payload.get("sceneUnderstanding");
        assertEquals("晴天 18:40，夕阳照到恭王府门楼，建议先拍照再讲历史。",
                sceneUnderstanding.get("sceneFusionSummary").asText());
        assertEquals("architecture", sceneUnderstanding.get("primarySceneDomainKey").asText());
        assertEquals(4, sceneUnderstanding.get("memorySessionSceneCount").asInt());
        assertTrue(sceneUnderstanding.get("evidenceSignals").toString().contains("gps_radius"));
        assertTrue(sceneUnderstanding.get("serviceHandoffSummary").asText().contains(respVO.getAction()));
        assertFalse(sceneUnderstanding.toString().contains("imageBase64"));
    }

    @Test
    public void testResolveMultimodalTriggerUsesRealtimeEnvironmentForRouteIntent() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "现在下雨且已经入夜，适合优先推荐室内路线。");
        sceneSignals.put("weatherText", "小雨");
        sceneSignals.put("localTimeText", "21:10");
        sceneSignals.put("sceneDomainIntentKey", "architecture");
        sceneSignals.put("sceneDomainIntentLabel", "建筑");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneCode("xicheng-multimodal-trigger");
        reqVO.setOcrText("恭王府博物馆入口");
        reqVO.setLocation(location("39.937050", "116.386770", 20));
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("route", respVO.getIntent());
        assertEquals("confirm_route_recommendation", respVO.getAction());
        assertTrue(respVO.getTargetPath().startsWith("/pages/routes/recommend"));
        assertTrue(respVO.getReason().contains("实时环境"));

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.TRIGGER_RESOLVE.getType()));
        assertEquals(1, events.size());
        JsonNode persistedSignals = JsonUtils.parseTree(events.get(0).getPayloadJson()).get("sceneSignals");
        assertEquals("小雨", persistedSignals.get("weatherText").asText());
        assertEquals("21:10", persistedSignals.get("localTimeText").asText());
    }

    @Test
    public void testResolveMultimodalTriggerUsesAgentDecisionForRecordIntent() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户已经到达恭王府入口，可以完成打卡并加入今天的旅行地图。");
        sceneSignals.put("sceneDomainIntentKey", "architecture");
        sceneSignals.put("sceneDomainIntentLabel", "建筑");
        sceneSignals.put("agentDecisionActionTitle", "领取徽章");
        sceneSignals.put("agentDecisionReasonSummary", "已经识别到当前位置，适合完成打卡、收集徽章并生成游记素材。");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneCode("xicheng-multimodal-trigger");
        reqVO.setOcrText("恭王府博物馆入口");
        reqVO.setLocation(location("39.937050", "116.386770", 20));
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("record", respVO.getIntent());
        assertEquals("confirm_travel_note", respVO.getAction());
        assertTrue(respVO.getTargetPath().startsWith("/pages/travel-note/edit"));
        assertTrue(respVO.getReason().contains("Agent决策"));

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.TRIGGER_RESOLVE.getType()));
        assertEquals(1, events.size());
        JsonNode persistedSignals = JsonUtils.parseTree(events.get(0).getPayloadJson()).get("sceneSignals");
        assertEquals("领取徽章", persistedSignals.get("agentDecisionActionTitle").asText());
        assertTrue(persistedSignals.get("agentDecisionReasonSummary").asText().contains("生成游记素材"));
    }

    @Test
    public void testResolveMultimodalTriggerUsesActivitySceneForTicketHandoff() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户拍到恭王府夜间演出现场，想知道节目时间和票务入口。");
        sceneSignals.put("sceneDomainIntentKey", "activity");
        sceneSignals.put("sceneDomainIntentLabel", "活动");
        sceneSignals.put("sceneDomainIntentTitle", "活动识境");
        sceneSignals.put("agentDecisionActionTitle", "查看票务");
        sceneSignals.put("agentDecisionReasonSummary", "演出现场涉及节目开始时间、买票和预约，必须等待真实票务系统确认。");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneCode("xicheng-multimodal-trigger");
        reqVO.setOcrText("恭王府博物馆入口");
        reqVO.setLocation(location("39.937050", "116.386770", 20));
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("activity", respVO.getIntent());
        assertEquals("confirm_activity_handoff", respVO.getAction());
        assertTrue(respVO.getTargetPath().startsWith("/pages/activity/recommend"));
        assertTrue(respVO.getReason().contains("Agent决策"));

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.TRIGGER_RESOLVE.getType()));
        assertEquals(1, events.size());
        JsonNode payload = JsonUtils.parseTree(events.get(0).getPayloadJson());
        assertEquals("activity", payload.get("intent").asText());
        JsonNode persistedSignals = payload.get("sceneSignals");
        assertEquals("activity", persistedSignals.get("sceneDomainIntentKey").asText());
        assertEquals("查看票务", persistedSignals.get("agentDecisionActionTitle").asText());
    }

    @Test
    public void testResolveMultimodalTriggerUsesSignSceneForTranslationIntent() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户拍到恭王府入口路牌，画面文字需要翻译并讲发音。");
        sceneSignals.put("sceneDomainIntentKey", "sign");
        sceneSignals.put("sceneDomainIntentLabel", "路牌");
        sceneSignals.put("sceneDomainIntentTitle", "路牌识境");
        sceneSignals.put("agentDecisionActionTitle", "翻译路牌");
        sceneSignals.put("agentDecisionReasonSummary", "先翻译画面文字，讲发音和含义，再连接导航。");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneCode("xicheng-multimodal-trigger");
        reqVO.setOcrText("恭王府 入口");
        reqVO.setLocation(location("39.937050", "116.386770", 20));
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("translate", respVO.getIntent());
        assertEquals("confirm_sign_translation", respVO.getAction());
        assertTrue(respVO.getTargetPath().startsWith("/pages/ai-guide/detail"));
        assertTrue(respVO.getReason().contains("Agent决策"));

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.TRIGGER_RESOLVE.getType()));
        assertEquals(1, events.size());
        JsonNode payload = JsonUtils.parseTree(events.get(0).getPayloadJson());
        assertEquals("translate", payload.get("intent").asText());
        JsonNode persistedSignals = payload.get("sceneSignals");
        assertEquals("sign", persistedSignals.get("sceneDomainIntentKey").asText());
        assertEquals("翻译路牌", persistedSignals.get("agentDecisionActionTitle").asText());
    }

    @Test
    public void testResolveMultimodalTriggerUsesAnimalSceneForSafetyIntent() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户拍到野生动物，需要先判断是否危险并提醒保持距离。");
        sceneSignals.put("sceneDomainIntentKey", "animal");
        sceneSignals.put("sceneDomainIntentLabel", "动物");
        sceneSignals.put("sceneDomainIntentTitle", "动物识境");
        sceneSignals.put("agentDecisionActionTitle", "安全提醒");
        sceneSignals.put("agentDecisionReasonSummary", "先说明保护情况、栖息地和是否危险，提醒不要靠近或投喂。");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneCode("xicheng-multimodal-trigger");
        reqVO.setText("这是什么动物，会不会危险？");
        reqVO.setOcrText("恭王府博物馆入口");
        reqVO.setLocation(location("39.937050", "116.386770", 20));
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("safety", respVO.getIntent());
        assertEquals("confirm_safety_advisory", respVO.getAction());
        assertTrue(respVO.getTargetPath().startsWith("/pages/ai-guide/detail"));
        assertTrue(respVO.getReason().contains("Agent决策"));

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.TRIGGER_RESOLVE.getType()));
        assertEquals(1, events.size());
        JsonNode payload = JsonUtils.parseTree(events.get(0).getPayloadJson());
        assertEquals("safety", payload.get("intent").asText());
        JsonNode persistedSignals = payload.get("sceneSignals");
        assertEquals("animal", persistedSignals.get("sceneDomainIntentKey").asText());
        assertEquals("安全提醒", persistedSignals.get("agentDecisionActionTitle").asText());
    }

    @Test
    public void testResolveMultimodalTriggerUsesArtifactSceneForInterpretIntent() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户拍到展柜里的文物，想了解年代、工艺和用途。");
        sceneSignals.put("sceneDomainIntentKey", "artifact");
        sceneSignals.put("sceneDomainIntentLabel", "文物");
        sceneSignals.put("sceneDomainIntentTitle", "文物识境");
        sceneSignals.put("agentDecisionActionTitle", "深入讲解");
        sceneSignals.put("agentDecisionReasonSummary", "先讲年代、工艺、用途和同时代背景，再引导继续比较。");

        MultimodalTriggerReqVO reqVO = multimodalReq();
        reqVO.setPackageCode("XICHENG-MAP-001");
        reqVO.setSceneCode("xicheng-multimodal-trigger");
        reqVO.setText("这件文物是什么年代的？");
        reqVO.setOcrText("恭王府博物馆入口");
        reqVO.setLocation(location("39.937050", "116.386770", 20));
        reqVO.setSceneSignals(sceneSignals);

        MultimodalTriggerRespVO respVO = appService.resolveMultimodalTrigger(reqVO);

        assertEquals("interpret", respVO.getIntent());
        assertEquals("confirm_scene_interpretation", respVO.getAction());
        assertTrue(respVO.getTargetPath().startsWith("/pages/ai-guide/detail"));
        assertTrue(respVO.getReason().contains("Agent决策"));

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.TRIGGER_RESOLVE.getType()));
        assertEquals(1, events.size());
        JsonNode payload = JsonUtils.parseTree(events.get(0).getPayloadJson());
        assertEquals("interpret", payload.get("intent").asText());
        JsonNode persistedSignals = payload.get("sceneSignals");
        assertEquals("artifact", persistedSignals.get("sceneDomainIntentKey").asText());
        assertEquals("深入讲解", persistedSignals.get("agentDecisionActionTitle").asText());
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
    public void testResolveMultimodalTriggerHydratesExecutedAgentActionIntoContinuousContext() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);

        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-agent-action-trigger-001");
        triggerReq.setOcrText("恭王府博物馆入口");
        triggerReq.setImageLabels(List.of("palace", "courtyard"));
        triggerReq.setLocation(location("39.937050", "116.386770", 20));
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("xicheng-gongwangfu", triggerResp.getPoiCode());

        AppInteractionEventReqVO actionReq = new AppInteractionEventReqVO();
        actionReq.setPackageCode("XICHENG-MAP-001");
        actionReq.setSceneCode("xicheng-agent-action");
        actionReq.setEventType(XunjingEnums.EventType.AGENT_ACTION.getType());
        actionReq.setSourceChannel("xicheng-app");
        actionReq.setUserTraceId("trace-xicheng-agent-action-trigger-001");
        actionReq.setPayloadJson("""
                {
                  "actionKey":"generate_travelogue",
                  "title":"生成游记",
                  "intent":"record",
                  "sourceTriggerTraceId":"trace-xicheng-agent-action-trigger-001",
                  "executionStatus":"clicked",
                  "poiCode":"xicheng-gongwangfu",
                  "poiName":"恭王府",
                  "requiresUserConfirm":true,
                  "requiresRealSystem":false,
                  "reason":"用户已经点击生成游记，需要继续整理刚才识境素材。"
                }
                """);
        appService.recordEvent(actionReq);

        MultimodalTriggerReqVO followUpReq = multimodalReq();
        followUpReq.setPackageCode("XICHENG-MAP-001");
        followUpReq.setSceneCode("xicheng-multimodal-trigger");
        followUpReq.setUserTraceId("trace-xicheng-agent-action-trigger-001");
        followUpReq.setText("继续刚才的动作");
        followUpReq.setOcrText("");
        followUpReq.setImageLabels(List.of());
        followUpReq.setLocation(null);

        MultimodalTriggerRespVO followUpResp = appService.resolveMultimodalTrigger(followUpReq);

        assertEquals("record", followUpResp.getIntent());
        assertEquals("confirm_travel_note", followUpResp.getAction());
        assertEquals("xicheng-gongwangfu", followUpResp.getPoiCode());
        assertEquals("恭王府", followUpResp.getPoiName());
        assertTrue(followUpResp.getRequiresUserConfirm());
        assertTrue(followUpResp.getCandidates().get(0).getMatchedSignals().contains("context_poi"));
        assertTrue(followUpResp.getCandidates().get(0).getMatchedSignals().contains("scene_context_alias"));

        List<XunjingInteractionEventDO> events = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.TRIGGER_RESOLVE.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId,
                                "trace-xicheng-agent-action-trigger-001"));
        assertEquals(2, events.size());
        XunjingInteractionEventDO latestEvent = events.stream()
                .max((left, right) -> left.getId().compareTo(right.getId()))
                .orElseThrow();
        JsonNode payload = JsonUtils.parseTree(latestEvent.getPayloadJson());
        JsonNode sceneSignals = payload.get("sceneSignals");
        assertEquals("record", sceneSignals.get("sceneDomainIntentKey").asText());
        assertEquals("旅行记录", sceneSignals.get("sceneDomainIntentLabel").asText());
        assertEquals("生成游记", sceneSignals.get("agentDecisionActionTitle").asText());
        assertTrue(sceneSignals.get("sceneFusionSummary").asText().contains("已执行Agent动作=生成游记"));
        assertTrue(sceneSignals.get("agentDecisionReasonSummary").asText().contains("用户已经点击生成游记"));
        assertEquals(2, sceneSignals.get("memorySessionSceneCount").asInt());
        JsonNode sceneUnderstanding = payload.get("sceneUnderstanding");
        assertEquals("record", sceneUnderstanding.get("primarySceneDomainKey").asText());
        assertTrue(sceneUnderstanding.get("sceneFusionSummary").asText().contains("已执行Agent动作=生成游记"));
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
    public void testAnswerHydratesExecutedAgentActionFromPreviousAgentActionEvent() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);
        consoleService.addKnowledgeDocument(xichengGongwangfuKnowledgeReq(packageId));
        ChatModel chatModel = mock(ChatModel.class);
        when(aiModelService.getRequiredDefaultModel(AiModelTypeEnum.CHAT.getType())).thenReturn(defaultChatModel());
        when(aiModelService.getChatModel(6601L)).thenReturn(chatModel);
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse("模型生成：已开始整理刚才的游记素材。"));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户正在恭王府准备生成游记。");
        sceneSignals.put("worldInterfaceSummary", "相机融合定位和城市知识库后判断为恭王府。");
        sceneSignals.put("sceneDomainIntentKey", "architecture");
        sceneSignals.put("sceneDomainIntentLabel", "建筑");
        sceneSignals.put("travelogueMaterialSummary", "恭王府门楼、夕阳和参观路线可作为游记素材。");
        sceneSignals.put("agentDecisionReasonSummary", "适合把刚才识境内容接力成游记。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-agent-action-chat-001");
        triggerReq.setOcrText("恭王府博物馆入口");
        triggerReq.setImageLabels(List.of("palace", "courtyard"));
        triggerReq.setLocation(location("39.937050", "116.386770", 20));
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("xicheng-gongwangfu", triggerResp.getPoiCode());

        AppInteractionEventReqVO actionReq = new AppInteractionEventReqVO();
        actionReq.setPackageCode("XICHENG-MAP-001");
        actionReq.setSceneCode("xicheng-agent-action");
        actionReq.setEventType(XunjingEnums.EventType.AGENT_ACTION.getType());
        actionReq.setSourceChannel("xicheng-app");
        actionReq.setUserTraceId("trace-xicheng-agent-action-chat-001");
        actionReq.setPayloadJson("""
                {
                  "actionKey":"generate_travelogue",
                  "title":"生成游记",
                  "intent":"record",
                  "targetPath":"/pages/travel-note/edit?regionCode=beijing-xicheng&poiCode=xicheng-gongwangfu&packageCode=XICHENG-MAP-001",
                  "sourceTriggerTraceId":"trace-xicheng-agent-action-chat-001",
                  "executionStatus":"clicked",
                  "poiCode":"xicheng-gongwangfu",
                  "poiName":"恭王府",
                  "requiresUserConfirm":true,
                  "requiresRealSystem":false,
                  "reason":"用户点击生成游记，继续整理刚才识境素材。"
                }
                """);
        appService.recordEvent(actionReq);

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-agent-action-chat-001");
        followUpReq.setQuestion("继续把刚才点击的动作做下去。");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertEquals("beijing-xicheng", followUpAnswer.getRegionCode());
        assertEquals("xicheng-gongwangfu", followUpAnswer.getPoiCode());
        assertEquals("恭王府", followUpAnswer.getPoiName());
        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        verify(chatModel).call(promptCaptor.capture());
        String prompt = promptCaptor.getValue().getContents();
        assertTrue(prompt.contains("服务动作=generate_travelogue"));
        assertTrue(prompt.contains("服务任务=AGENT_ACTION"));
        assertTrue(prompt.contains("服务意图=record/旅行记录"));
        assertTrue(prompt.contains("服务步骤=用户已执行"));
        assertTrue(prompt.contains("服务承接=已执行Agent动作=生成游记"));
        assertTrue(prompt.contains("执行状态=clicked"));
        assertTrue(prompt.contains("用户点击生成游记"));
        assertTrue(prompt.contains("真实系统确认=false"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId,
                                "trace-xicheng-agent-action-chat-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertEquals("generate_travelogue", visionAgentContext.get("serviceHandoffActionKey").asText());
        assertEquals("AGENT_ACTION", visionAgentContext.get("serviceHandoffTaskType").asText());
        assertEquals("record", visionAgentContext.get("serviceHandoffIntent").asText());
        assertEquals("旅行记录", visionAgentContext.get("serviceHandoffIntentText").asText());
        assertEquals("用户已执行", visionAgentContext.get("serviceHandoffStepText").asText());
        assertFalse(visionAgentContext.get("serviceHandoffRequiresRealSystem").asBoolean());
        assertEquals("生成游记", visionAgentContext.get("decisionActionTitle").asText());
        assertTrue(visionAgentContext.get("serviceHandoffSummary").asText().contains("generate_travelogue"));
        assertTrue(visionAgentContext.get("serviceHandoffSummary").asText().contains("clicked"));
        assertTrue(visionAgentContext.get("serviceHandoffSummary").asText().contains("用户点击生成游记"));
    }

    @Test
    public void testAnswerDoesNotLetOlderAgentActionOverrideNewerTriggerContext() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);
        consoleService.addKnowledgeDocument(xichengGongwangfuKnowledgeReq(packageId));

        AppInteractionEventReqVO oldActionReq = new AppInteractionEventReqVO();
        oldActionReq.setPackageCode("XICHENG-MAP-001");
        oldActionReq.setSceneCode("xicheng-agent-action");
        oldActionReq.setEventType(XunjingEnums.EventType.AGENT_ACTION.getType());
        oldActionReq.setSourceChannel("xicheng-app");
        oldActionReq.setUserTraceId("trace-xicheng-chat-latest-trigger-001");
        oldActionReq.setPayloadJson("""
                {
                  "actionKey":"generate_travelogue",
                  "title":"生成游记",
                  "intent":"record",
                  "executionStatus":"clicked",
                  "poiCode":"xicheng-gongwangfu",
                  "poiName":"恭王府",
                  "requiresUserConfirm":true,
                  "requiresRealSystem":false,
                  "reason":"这是较早的一次游记动作，不应覆盖后续识境。"
                }
                """);
        appService.recordEvent(oldActionReq);

        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-chat-latest-trigger-001");
        triggerReq.setOcrText("恭王府博物馆入口");
        triggerReq.setImageLabels(List.of("palace", "courtyard"));
        triggerReq.setLocation(location("39.937050", "116.386770", 20));
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("start_ai_guide", triggerResp.getAction());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-chat-latest-trigger-001");
        followUpReq.setQuestion("继续讲这个入口。");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertEquals("xicheng-gongwangfu", followUpAnswer.getPoiCode());
        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId,
                                "trace-xicheng-chat-latest-trigger-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertEquals("start_ai_guide", visionAgentContext.get("serviceHandoffActionKey").asText());
        assertEquals("guide", visionAgentContext.get("serviceHandoffIntent").asText());
        assertEquals("开始 AI 讲解", visionAgentContext.get("decisionActionTitle").asText());
        assertFalse(visionAgentContext.get("serviceHandoffSummary").asText().contains("generate_travelogue"));
        assertFalse(visionAgentContext.get("serviceHandoffSummary").asText().contains("较早的一次游记动作"));
    }

    @Test
    public void testAnswerKeepsExplicitPoiContextAheadOfPreviousTriggerAndAgentAction() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);
        insertXichengBaitasiPoi(packageId);
        consoleService.addKnowledgeDocument(xichengGongwangfuKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengBaitasiKnowledgeReq(packageId));

        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-chat-explicit-poi-001");
        triggerReq.setOcrText("恭王府博物馆入口");
        triggerReq.setImageLabels(List.of("palace", "courtyard"));
        triggerReq.setLocation(location("39.937050", "116.386770", 20));
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("xicheng-gongwangfu", triggerResp.getPoiCode());

        AppInteractionEventReqVO actionReq = new AppInteractionEventReqVO();
        actionReq.setPackageCode("XICHENG-MAP-001");
        actionReq.setSceneCode("xicheng-agent-action");
        actionReq.setEventType(XunjingEnums.EventType.AGENT_ACTION.getType());
        actionReq.setSourceChannel("xicheng-app");
        actionReq.setUserTraceId("trace-xicheng-chat-explicit-poi-001");
        actionReq.setPayloadJson("""
                {
                  "actionKey":"generate_travelogue",
                  "title":"生成游记",
                  "intent":"record",
                  "executionStatus":"clicked",
                  "poiCode":"xicheng-gongwangfu",
                  "poiName":"恭王府",
                  "requiresUserConfirm":true,
                  "requiresRealSystem":false,
                  "reason":"用户上一轮点击了恭王府游记动作。"
                }
                """);
        appService.recordEvent(actionReq);

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-chat-explicit-poi-001");
        followUpReq.setQuestion("妙应寺白塔有什么看点？");
        followUpReq.setRegionCode("beijing-xicheng");
        followUpReq.setPoiCode("xicheng-baitasi");
        followUpReq.setPoiName("妙应寺白塔");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertEquals("xicheng-baitasi", followUpAnswer.getPoiCode());
        assertEquals("妙应寺白塔", followUpAnswer.getPoiName());
        assertEquals("妙应寺白塔权威讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("妙应寺白塔"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId,
                                "trace-xicheng-chat-explicit-poi-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        assertEquals("xicheng-baitasi", askPayload.get("poiCode").asText());
        assertEquals("妙应寺白塔", askPayload.get("poiName").asText());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertFalse(visionAgentContext.has("memorySessionText"));
        assertFalse(visionAgentContext.has("serviceHandoffActionKey"));
        assertFalse(visionAgentContext.toString().contains("恭王府"));
        assertFalse(visionAgentContext.toString().contains("generate_travelogue"));
    }

    @Test
    public void testAnswerHydratesSceneUnderstandingFromPreviousTriggerEvent() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);
        consoleService.addKnowledgeDocument(xichengGongwangfuKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "晴天 18:40，夕阳照到恭王府门楼，建议先拍照再讲历史。");
        sceneSignals.put("worldInterfaceSummary", "相机融合 GPS、OCR、时间、天气和城市知识库后判断当前世界。");
        sceneSignals.put("sceneDomainIntentKey", "architecture");
        sceneSignals.put("sceneDomainIntentLabel", "建筑");
        sceneSignals.put("agentDecisionActionTitle", "先拍照");
        sceneSignals.put("agentDecisionReasonSummary", "马上日落，门楼光线适合先拍照。");
        sceneSignals.put("localTimeText", "18:40");
        sceneSignals.put("weatherText", "晴");
        sceneSignals.put("headingText", "向西");
        sceneSignals.put("memorySessionSceneCount", 4);
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-scene-understanding-chat-001");
        triggerReq.setOcrText("恭王府博物馆入口");
        triggerReq.setImageLabels(List.of("palace", "courtyard"));
        triggerReq.setLocation(location("39.937050", "116.386770", 20));
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("photo", triggerResp.getIntent());

        List<XunjingInteractionEventDO> triggerEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType,
                                XunjingEnums.EventType.TRIGGER_RESOLVE.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId,
                                "trace-xicheng-scene-understanding-chat-001"));
        assertEquals(1, triggerEvents.size());
        JsonNode triggerPayload = JsonUtils.parseTree(triggerEvents.get(0).getPayloadJson());
        JsonNode sceneUnderstanding = triggerPayload.get("sceneUnderstanding");
        assertEquals("晴天 18:40，夕阳照到恭王府门楼，建议先拍照再讲历史。",
                sceneUnderstanding.get("sceneFusionSummary").asText());

        Map<String, Object> canonicalPayload = new LinkedHashMap<>();
        canonicalPayload.put("regionCode", triggerPayload.get("regionCode").asText());
        canonicalPayload.put("poiCode", triggerPayload.get("poiCode").asText());
        canonicalPayload.put("poiName", triggerPayload.get("poiName").asText());
        canonicalPayload.put("action", triggerPayload.get("action").asText());
        canonicalPayload.put("intent", triggerPayload.get("intent").asText());
        canonicalPayload.put("triggerType", triggerPayload.get("triggerType").asText());
        canonicalPayload.put("requiresUserConfirm", triggerPayload.get("requiresUserConfirm").asBoolean());
        canonicalPayload.put("reason", triggerPayload.get("reason").asText());
        canonicalPayload.put("sceneSignals", Map.of());
        Map<String, Object> canonicalSceneUnderstanding = new LinkedHashMap<>();
        canonicalSceneUnderstanding.put("sceneFusionSummary",
                sceneUnderstanding.get("sceneFusionSummary").asText());
        canonicalSceneUnderstanding.put("worldInterfaceSummary",
                sceneUnderstanding.get("worldInterfaceSummary").asText());
        canonicalSceneUnderstanding.put("primarySceneDomainKey",
                sceneUnderstanding.get("primarySceneDomainKey").asText());
        canonicalSceneUnderstanding.put("primarySceneDomainLabel",
                sceneUnderstanding.get("primarySceneDomainLabel").asText());
        canonicalSceneUnderstanding.put("agentDecisionActionTitle",
                sceneUnderstanding.get("agentDecisionActionTitle").asText());
        canonicalSceneUnderstanding.put("agentDecisionReasonSummary",
                sceneUnderstanding.get("agentDecisionReasonSummary").asText());
        canonicalSceneUnderstanding.put("localTimeText", sceneUnderstanding.get("localTimeText").asText());
        canonicalSceneUnderstanding.put("weatherText", sceneUnderstanding.get("weatherText").asText());
        canonicalSceneUnderstanding.put("headingText", sceneUnderstanding.get("headingText").asText());
        canonicalSceneUnderstanding.put("memorySessionSceneCount",
                sceneUnderstanding.get("memorySessionSceneCount").asInt());
        canonicalSceneUnderstanding.put("serviceHandoffSummary",
                sceneUnderstanding.get("serviceHandoffSummary").asText());
        canonicalPayload.put("sceneUnderstanding", canonicalSceneUnderstanding);
        new JdbcTemplate(dataSource).update("""
                UPDATE "xunjing_interaction_event"
                SET "payload_json" = ?
                WHERE "id" = ?
                """, JsonUtils.toJsonString(canonicalPayload), triggerEvents.get(0).getId());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-scene-understanding-chat-001");
        followUpReq.setQuestion("现在适合先做什么？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertEquals("xicheng-gongwangfu", followUpAnswer.getPoiCode());
        assertEquals("恭王府权威讲解稿", followUpAnswer.getSources().get(0).getTitle());

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId,
                                "trace-xicheng-scene-understanding-chat-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertEquals("晴天 18:40，夕阳照到恭王府门楼，建议先拍照再讲历史。",
                visionAgentContext.get("sceneFusionSummary").asText());
        assertEquals("相机融合 GPS、OCR、时间、天气和城市知识库后判断当前世界。",
                visionAgentContext.get("worldInterfaceSummary").asText());
        assertEquals("architecture", visionAgentContext.get("primarySceneDomainKey").asText());
        assertEquals("建筑", visionAgentContext.get("primarySceneDomainLabel").asText());
        assertEquals("先拍照", visionAgentContext.get("decisionActionTitle").asText());
        assertTrue(visionAgentContext.get("decisionReasonSummary").asText().contains("马上日落"));
        assertEquals("18:40", visionAgentContext.get("localTimeText").asText());
        assertEquals("晴", visionAgentContext.get("weatherText").asText());
        assertEquals("向西", visionAgentContext.get("headingText").asText());
        assertEquals(4, visionAgentContext.get("memorySessionSceneCount").asInt());
        assertEquals(sceneUnderstanding.get("serviceHandoffSummary").asText(),
                visionAgentContext.get("serviceHandoffSummary").asText());
    }

    @Test
    public void testAnswerUsesKnowledgeGraphSignalsFromPreviousTriggerForSourceSearch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengXiangfeiGraphKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户拍到一处人物纪念点，想继续了解背后的关系网络。");
        sceneSignals.put("worldInterfaceSummary", "相机融合视觉识别和城市知识库后抽取出城市知识图谱线索。");
        sceneSignals.put("sceneDomainIntentKey", "person");
        sceneSignals.put("sceneDomainIntentLabel", "人物");
        sceneSignals.put("agentDecisionReasonSummary", "适合沿着人物、时代和丝路关系继续讲。");
        sceneSignals.put("knowledgeGraphKeywords", "香妃墓 乾隆 清朝新疆 丝绸之路");
        sceneSignals.put("relatedTopicKeywords", "香妃 乾隆 西域 丝路");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-graph-search-001");
        triggerReq.setText("先记住这个人物线索");
        triggerReq.setOcrText("");
        triggerReq.setImageLabels(List.of());
        triggerReq.setLocation(null);
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("ask", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-graph-search-001");
        followUpReq.setQuestion("继续讲这个线索");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("香妃墓城市知识图谱讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("香妃墓"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-graph-search-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("乾隆"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("丝绸之路"));
    }

    @Test
    public void testAnswerUsesVisitorProfileSignalsFromPreviousTriggerForSourceSearch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengFamilyStudyKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户正在准备继续了解当前场景。");
        sceneSignals.put("worldInterfaceSummary", "相机融合城市知识库后等待下一轮讲解。");
        sceneSignals.put("sceneDomainIntentKey", "architecture");
        sceneSignals.put("sceneDomainIntentLabel", "建筑");
        sceneSignals.put("agentDecisionReasonSummary", "适合根据用户偏好决定下一步讲解方式。");
        sceneSignals.put("visitorProfileSummary", "首次来西城，带孩子，需要儿童版讲解。");
        sceneSignals.put("visitorGroup", "亲子家庭");
        sceneSignals.put("interestTags", "亲子研学 儿童版 互动观察");
        sceneSignals.put("preferredLanguageText", "中文");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-profile-search-001");
        triggerReq.setText("先记住这个游客画像");
        triggerReq.setOcrText("");
        triggerReq.setImageLabels(List.of());
        triggerReq.setLocation(null);
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("ask", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-profile-search-001");
        followUpReq.setQuestion("接下来怎么讲？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("西城亲子研学讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("亲子研学")
                || followUpAnswer.getAnswer().contains("儿童版"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-profile-search-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("带孩子"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("亲子研学"));
    }

    @Test
    public void testAnswerUsesRealtimeEnvironmentSignalsFromPreviousTriggerForSourceSearch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengNightRainRouteKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机等待下一步建议。");
        sceneSignals.put("worldInterfaceSummary", "相机融合定位和城市知识库后进入连续对话。");
        sceneSignals.put("sceneDomainIntentKey", "architecture");
        sceneSignals.put("sceneDomainIntentLabel", "建筑");
        sceneSignals.put("agentDecisionReasonSummary", "适合根据实时环境调整下一站。");
        sceneSignals.put("localTimeText", "21:10");
        sceneSignals.put("weatherText", "小雨");
        sceneSignals.put("headingText", "西");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-environment-search-001");
        triggerReq.setText("先记住这个环境");
        triggerReq.setOcrText("");
        triggerReq.setImageLabels(List.of());
        triggerReq.setLocation(null);
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("ask", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-environment-search-001");
        followUpReq.setQuestion("接下来怎么安排？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("西城夜雨室内路线讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("小雨")
                || followUpAnswer.getAnswer().contains("21:10")
                || followUpAnswer.getAnswer().contains("室内"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-environment-search-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("小雨"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("21:10"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("西"));
    }

    @Test
    public void testAnswerUsesOperationSignalsFromPreviousTriggerForSourceSearch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengNightLectureKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机等待下一步建议。");
        sceneSignals.put("worldInterfaceSummary", "相机融合城市知识库后等待运营系统接力。");
        sceneSignals.put("sceneDomainIntentKey", "activity");
        sceneSignals.put("sceneDomainIntentLabel", "活动");
        sceneSignals.put("agentDecisionReasonSummary", "适合根据文旅运营信号决定下一步服务。");
        sceneSignals.put("nearbyActivitySummary", "白塔夜游讲堂 19:30 西城图书馆集合。");
        sceneSignals.put("merchantServiceSummary", "周边纪念章兑换点需要以真实商家系统确认为准。");
        sceneSignals.put("routeRecommendationSummary", "建议先前往西城图书馆室内集合点。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-operation-search-001");
        triggerReq.setText("先记住这个运营信号");
        triggerReq.setOcrText("");
        triggerReq.setImageLabels(List.of());
        triggerReq.setLocation(null);
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("ask", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-operation-search-001");
        followUpReq.setQuestion("接下来怎么处理？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("白塔夜游讲堂运营讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("白塔夜游讲堂")
                || followUpAnswer.getAnswer().contains("19:30")
                || followUpAnswer.getAnswer().contains("西城图书馆"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-operation-search-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("白塔夜游讲堂"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("纪念章兑换点"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("西城图书馆"));
    }

    @Test
    public void testAnswerUsesMenuSignalsFromPreviousTriggerForSourceSearch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengHalalDishKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机等待下一步建议。");
        sceneSignals.put("worldInterfaceSummary", "相机融合 OCR 和城市知识库后等待点单建议。");
        sceneSignals.put("sceneDomainIntentKey", "menu");
        sceneSignals.put("sceneDomainIntentLabel", "菜单");
        sceneSignals.put("agentDecisionReasonSummary", "适合根据菜品、辣度和清真信息推荐点单。");
        sceneSignals.put("menuItemNames", "拉条子 烤包子");
        sceneSignals.put("spiceLevelSummary", "中辣");
        sceneSignals.put("halalSuitabilityText", "清真友好");
        sceneSignals.put("dishRecommendationSummary", "第一次来建议点拉条子和烤包子。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-menu-search-001");
        triggerReq.setText("先记住这个点单线索");
        triggerReq.setOcrText("");
        triggerReq.setImageLabels(List.of());
        triggerReq.setLocation(null);
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("ask", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-menu-search-001");
        followUpReq.setQuestion("怎么点？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("西城清真点单讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("拉条子")
                || followUpAnswer.getAnswer().contains("烤包子")
                || followUpAnswer.getAnswer().contains("清真"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-menu-search-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("拉条子"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("中辣"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("清真友好"));
    }

    @Test
    public void testAnswerUsesFoodSignalsFromPreviousTriggerForSourceSearch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengFoodKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机拍到一份地方小吃。");
        sceneSignals.put("worldInterfaceSummary", "相机融合美食识别和城市知识库后等待连续问答。");
        sceneSignals.put("sceneDomainIntentKey", "food");
        sceneSignals.put("sceneDomainIntentLabel", "美食");
        sceneSignals.put("agentDecisionReasonSummary", "适合讲来源、做法、吃法、搭配和附近推荐。");
        sceneSignals.put("foodItemName", "烤包子");
        sceneSignals.put("foodOriginSummary", "新疆街头小吃。");
        sceneSignals.put("cookingMethodSummary", "馕坑高温烤制。");
        sceneSignals.put("eatingMethodSummary", "趁热掰开吃。");
        sceneSignals.put("pairingSuggestionText", "适合配酸奶。");
        sceneSignals.put("nearbyFoodRecommendationSummary", "附近可找清真老字号。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-food-search-001");
        triggerReq.setText("先记住这份小吃线索");
        triggerReq.setOcrText("");
        triggerReq.setImageLabels(List.of());
        triggerReq.setLocation(null);
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("ask", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-food-search-001");
        followUpReq.setQuestion("这个怎么吃？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("西城烤包子美食讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("烤包子")
                || followUpAnswer.getAnswer().contains("馕坑")
                || followUpAnswer.getAnswer().contains("酸奶"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-food-search-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("烤包子"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("馕坑高温烤制"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("适合配酸奶"));
    }

    @Test
    public void testAnswerUsesSignTranslationSignalsFromPreviousTriggerForSourceSearch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengSignTranslationKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机等待翻译路牌。");
        sceneSignals.put("worldInterfaceSummary", "相机融合 OCR、路牌翻译和城市知识库后等待连续问答。");
        sceneSignals.put("sceneDomainIntentKey", "sign");
        sceneSignals.put("sceneDomainIntentLabel", "路牌");
        sceneSignals.put("agentDecisionReasonSummary", "适合翻译原文、补充发音并连接导航。");
        sceneSignals.put("signOriginalText", "بازار يولى");
        sceneSignals.put("signTranslationText", "市场路");
        sceneSignals.put("signPronunciationText", "bazaar yoli");
        sceneSignals.put("signNavigationHint", "可作为前往市场入口的导航线索。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-sign-search-001");
        triggerReq.setText("先记住这块路牌");
        triggerReq.setOcrText("");
        triggerReq.setImageLabels(List.of());
        triggerReq.setLocation(null);
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("ask", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-sign-search-001");
        followUpReq.setQuestion("这是什么意思？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("西城路牌翻译讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("市场路")
                || followUpAnswer.getAnswer().contains("bazaar yoli")
                || followUpAnswer.getAnswer().contains("导航线索"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-sign-search-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("بازار يولى"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("市场路"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("bazaar yoli"));
    }

    @Test
    public void testAnswerUsesInterpretationSignalsFromPreviousTriggerForSourceSearch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengArchitectureInterpretKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机等待建筑细节讲解。");
        sceneSignals.put("worldInterfaceSummary", "相机融合建筑细节和城市知识库后等待连续问答。");
        sceneSignals.put("sceneDomainIntentKey", "architecture");
        sceneSignals.put("sceneDomainIntentLabel", "建筑");
        sceneSignals.put("agentDecisionReasonSummary", "适合深入讲解。");
        sceneSignals.put("recognizedObjectName", "无钉木梁");
        sceneSignals.put("eraOrPeriodText", "清代");
        sceneSignals.put("structureOrCraftSummary", "榫卯木梁结构");
        sceneSignals.put("historicalStorySummary", "修缮时保留原有梁架。");
        sceneSignals.put("hiddenDetailSummary", "抬头能看到不用钉子的咬合节点。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-interpret-search-001");
        triggerReq.setText("先记住这个建筑细节");
        triggerReq.setOcrText("");
        triggerReq.setImageLabels(List.of());
        triggerReq.setLocation(null);
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("ask", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-interpret-search-001");
        followUpReq.setQuestion("这个细节怎么讲？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("西城建筑榫卯细节讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("无钉木梁")
                || followUpAnswer.getAnswer().contains("榫卯")
                || followUpAnswer.getAnswer().contains("咬合节点"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-interpret-search-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("无钉木梁"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("榫卯木梁结构"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("咬合节点"));
    }

    @Test
    public void testAnswerUsesHeritageSignalsFromPreviousTriggerForSourceSearch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengHeritageInstrumentKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机拍到一把民族弹拨乐器。");
        sceneSignals.put("worldInterfaceSummary", "相机融合非遗乐器识别和城市知识库后等待连续问答。");
        sceneSignals.put("sceneDomainIntentKey", "intangible_heritage");
        sceneSignals.put("sceneDomainIntentLabel", "非遗");
        sceneSignals.put("agentDecisionReasonSummary", "适合讲制作、演奏、声音和附近体验。");
        sceneSignals.put("heritageItemName", "热瓦普");
        sceneSignals.put("heritageCategoryText", "民族弹拨乐器");
        sceneSignals.put("craftProcessSummary", "木质琴身和皮面共鸣箱制作。");
        sceneSignals.put("performanceMethodSummary", "右手拨弦、左手按弦演奏。");
        sceneSignals.put("soundAssetHint", "可播放热瓦普音色样例。");
        sceneSignals.put("nearbyExperienceSummary", "附近可推荐非遗乐器体验。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-heritage-search-001");
        triggerReq.setText("先记住这个非遗乐器线索");
        triggerReq.setOcrText("");
        triggerReq.setImageLabels(List.of());
        triggerReq.setLocation(null);
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("ask", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-heritage-search-001");
        followUpReq.setQuestion("这个乐器怎么体验？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("西城非遗乐器体验讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("热瓦普")
                || followUpAnswer.getAnswer().contains("拨弦")
                || followUpAnswer.getAnswer().contains("非遗乐器体验"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-heritage-search-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("热瓦普"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("右手拨弦"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("热瓦普音色样例"));
    }

    @Test
    public void testAnswerUsesPlantSignalsFromPreviousTriggerForSourceSearch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengPlantKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机拍到一棵胡杨。");
        sceneSignals.put("worldInterfaceSummary", "相机融合植物识别和城市知识库后等待连续问答。");
        sceneSignals.put("sceneDomainIntentKey", "plant");
        sceneSignals.put("sceneDomainIntentLabel", "植物");
        sceneSignals.put("agentDecisionReasonSummary", "适合讲树龄、耐旱原因、最佳观赏季和分布。");
        sceneSignals.put("plantSpeciesName", "胡杨");
        sceneSignals.put("plantAgeEstimateText", "约百年树龄");
        sceneSignals.put("plantAdaptationSummary", "根系深、叶片可减少蒸腾，适合干旱环境。");
        sceneSignals.put("bestViewingSeasonText", "秋季金黄时最好看。");
        sceneSignals.put("regionalDistributionSummary", "新疆塔里木河流域分布较多。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-plant-search-001");
        triggerReq.setText("先记住这棵树");
        triggerReq.setOcrText("");
        triggerReq.setImageLabels(List.of());
        triggerReq.setLocation(null);
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("ask", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-plant-search-001");
        followUpReq.setQuestion("这个树怎么讲？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("西城胡杨植物识境讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("胡杨")
                || followUpAnswer.getAnswer().contains("塔里木")
                || followUpAnswer.getAnswer().contains("秋季金黄"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-plant-search-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("胡杨"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("约百年树龄"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("秋季金黄"));
    }

    @Test
    public void testAnswerUsesAnimalSignalsFromPreviousTriggerForSourceSearch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengAnimalSafetyKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机拍到雪豹保护展示。");
        sceneSignals.put("worldInterfaceSummary", "相机融合动物识别、保护知识和城市知识库后等待连续问答。");
        sceneSignals.put("sceneDomainIntentKey", "animal");
        sceneSignals.put("sceneDomainIntentLabel", "动物");
        sceneSignals.put("agentDecisionReasonSummary", "先说明保护情况、栖息地和是否危险，提醒不要靠近或投喂。");
        sceneSignals.put("animalSpeciesName", "雪豹");
        sceneSignals.put("conservationStatusText", "国家一级保护野生动物");
        sceneSignals.put("habitatSummary", "高山岩地和雪线附近活动。");
        sceneSignals.put("dangerAssessmentText", "野外近距离接触有风险。");
        sceneSignals.put("safetyReminderText", "不要靠近、投喂或追赶。");
        sceneSignals.put("arDisplayHint", "可展示雪豹体型和栖息地 AR 模型。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-animal-search-001");
        triggerReq.setText("先记住这个动物");
        triggerReq.setOcrText("");
        triggerReq.setImageLabels(List.of());
        triggerReq.setLocation(null);
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("ask", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-animal-search-001");
        followUpReq.setQuestion("它危险吗？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("西城雪豹动物识境讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("雪豹")
                || followUpAnswer.getAnswer().contains("国家一级保护")
                || followUpAnswer.getAnswer().contains("不要靠近"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-animal-search-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("雪豹"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("国家一级保护"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("不要靠近"));
    }

    @Test
    public void testAnswerUsesPersonSignalsFromPreviousTriggerForSourceSearch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengPersonKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机拍到一座人物雕像。");
        sceneSignals.put("worldInterfaceSummary", "相机融合人物识别和城市知识库后等待连续问答。");
        sceneSignals.put("sceneDomainIntentKey", "person");
        sceneSignals.put("sceneDomainIntentLabel", "人物");
        sceneSignals.put("agentDecisionReasonSummary", "适合讲人物故事、为什么建在这里、贡献和同时期人物。");
        sceneSignals.put("personName", "香妃");
        sceneSignals.put("personStorySummary", "可沿人物传说讲到清代新疆和宫廷叙事。");
        sceneSignals.put("statueSiteReasonSummary", "雕像建址可连接城市历史关系。");
        sceneSignals.put("contributionSummary", "人物线索适合连接民族交流和丝路记忆。");
        sceneSignals.put("contemporaryFigureKeywords", "乾隆 清朝新疆 丝绸之路");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-person-search-001");
        triggerReq.setText("先记住这个人物");
        triggerReq.setOcrText("");
        triggerReq.setImageLabels(List.of());
        triggerReq.setLocation(null);
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("ask", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-person-search-001");
        followUpReq.setQuestion("这个人物怎么讲？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("西城人物雕像识境讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("香妃")
                || followUpAnswer.getAnswer().contains("乾隆")
                || followUpAnswer.getAnswer().contains("丝绸之路"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-person-search-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("香妃"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("乾隆"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("丝绸之路"));
    }

    @Test
    public void testAnswerUsesActivitySignalsFromPreviousTriggerForSourceSearch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengActivityKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户举起手机拍到木卡姆演出现场。");
        sceneSignals.put("worldInterfaceSummary", "相机融合演出识别、时间和城市知识库后等待连续问答。");
        sceneSignals.put("sceneDomainIntentKey", "activity");
        sceneSignals.put("sceneDomainIntentLabel", "活动");
        sceneSignals.put("agentDecisionReasonSummary", "适合讲节目背景、演员、开始时间、票务和场地导航。");
        sceneSignals.put("activityName", "木卡姆小剧场");
        sceneSignals.put("activityBackgroundSummary", "节目背景来自丝路音乐交流。");
        sceneSignals.put("performerSummary", "本地青年乐团和非遗传承人联合演出。");
        sceneSignals.put("scheduleTimeText", "今晚 20:00 开始。");
        sceneSignals.put("ticketingHint", "买票和预约必须跳转真实票务系统确认。");
        sceneSignals.put("venueNavigationHint", "临时舞台入口集合。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-activity-search-001");
        triggerReq.setText("先记住这个节目");
        triggerReq.setOcrText("");
        triggerReq.setImageLabels(List.of());
        triggerReq.setLocation(null);
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("ask", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-activity-search-001");
        followUpReq.setQuestion("这个节目怎么安排？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("西城木卡姆演出识境讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("木卡姆")
                || followUpAnswer.getAnswer().contains("20:00")
                || followUpAnswer.getAnswer().contains("真实票务系统"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-activity-search-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("木卡姆小剧场"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("20:00"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("真实票务系统"));
    }

    @Test
    public void testAnswerUsesTravelRecordSignalsFromPreviousTriggerForSourceSearch() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        consoleService.addKnowledgeDocument(xichengUnrelatedKnowledgeReq(packageId));
        consoleService.addKnowledgeDocument(xichengTravelRecordKnowledgeReq(packageId));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneFusionSummary", "用户完成一天识境任务，准备自动生成游记。");
        sceneSignals.put("worldInterfaceSummary", "相机融合照片、路线、停留时长和连续记忆后生成旅行故事。");
        sceneSignals.put("sceneDomainIntentKey", "record");
        sceneSignals.put("sceneDomainIntentLabel", "旅行记录");
        sceneSignals.put("agentDecisionReasonSummary", "适合完成打卡、领取徽章、加入旅行地图并生成游记素材。");
        sceneSignals.put("checkInTaskSummary", "完成第 12 个景点打卡。");
        sceneSignals.put("badgeRewardName", "西城晨昏观察徽章");
        sceneSignals.put("travelMapUpdateSummary", "今天路线已串联 12 个景点。");
        sceneSignals.put("travelogueMaterialSummary", "50 张照片、5 小时停留和讲解线索可生成旅行故事。");
        sceneSignals.put("photoMomentSummary", "王府入口合影可作为今日封面。");
        sceneSignals.put("socialShareDraftHint", "可生成朋友圈和小红书文案草稿。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-travel-record-search-001");
        triggerReq.setText("先记住今天的游记任务包");
        triggerReq.setOcrText("");
        triggerReq.setImageLabels(List.of());
        triggerReq.setLocation(null);
        triggerReq.setSceneSignals(sceneSignals);
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("ask", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-travel-record-search-001");
        followUpReq.setQuestion("今天怎么整理？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO followUpAnswer = appService.answer(followUpReq);

        assertEquals("PASSED", followUpAnswer.getSafetyStatus());
        assertFalse(followUpAnswer.getSources().isEmpty());
        assertEquals("西城自动游记任务包讲解稿", followUpAnswer.getSources().get(0).getTitle());
        assertTrue(followUpAnswer.getAnswer().contains("12 个景点")
                || followUpAnswer.getAnswer().contains("50 张照片")
                || followUpAnswer.getAnswer().contains("小红书"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-travel-record-search-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("西城晨昏观察徽章"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("50 张照片"));
        assertTrue(visionAgentContext.get("memorySessionText").asText().contains("小红书文案草稿"));
    }

    @Test
    public void testAnswerHydratesPhotoAdviceHandoffFromTrigger() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);
        consoleService.addKnowledgeDocument(xichengGongwangfuKnowledgeReq(packageId));
        ChatModel chatModel = mock(ChatModel.class);
        when(aiModelService.getRequiredDefaultModel(AiModelTypeEnum.CHAT.getType())).thenReturn(defaultChatModel());
        when(aiModelService.getChatModel(6601L)).thenReturn(chatModel);
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse("模型生成：现在先拍门楼，之后再讲历史。"));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneDomainIntentKey", "architecture");
        sceneSignals.put("sceneDomainIntentLabel", "建筑");
        sceneSignals.put("sceneFusionSummary", "恭王府当前接近日落，建议先拍照再听历史讲解。");
        sceneSignals.put("worldInterfaceSummary", "相机融合时间、天气、方向和城市知识库后判断为最佳拍摄时间。");
        sceneSignals.put("agentDecisionActionTitle", "先拍照");
        sceneSignals.put("agentDecisionReasonSummary", "夕阳适合拍门楼，先给机位和构图建议。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-photo-advice-001");
        triggerReq.setSceneSignals(sceneSignals);
        triggerReq.setLocation(location("39.937050", "116.386770", 20));
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("photo", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-photo-advice-001");
        followUpReq.setQuestion("我应该从哪里拍？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO answer = appService.answer(followUpReq);

        assertEquals("PASSED", answer.getSafetyStatus());
        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        verify(chatModel).call(promptCaptor.capture());
        String prompt = promptCaptor.getValue().getContents();
        assertTrue(prompt.contains("服务意图=photo/拍照建议"));
        assertTrue(prompt.contains("真实系统确认=false"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-photo-advice-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertEquals("photo", visionAgentContext.get("serviceHandoffIntent").asText());
        assertFalse(visionAgentContext.get("serviceHandoffRequiresRealSystem").asBoolean());
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
    public void testAnswerMarksActivityTicketTriggerHandoffAsRealSystemRequired() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);
        consoleService.addKnowledgeDocument(xichengGongwangfuKnowledgeReq(packageId));
        ChatModel chatModel = mock(ChatModel.class);
        when(aiModelService.getRequiredDefaultModel(AiModelTypeEnum.CHAT.getType())).thenReturn(defaultChatModel());
        when(aiModelService.getChatModel(6601L)).thenReturn(chatModel);
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse("模型生成：活动票务要以真实系统确认为准。"));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneDomainIntentKey", "activity");
        sceneSignals.put("sceneDomainIntentLabel", "活动");
        sceneSignals.put("sceneFusionSummary", "用户正在恭王府附近拍演出现场，想知道节目时间和哪里买票。");
        sceneSignals.put("worldInterfaceSummary", "相机融合当前位置、时间和城市知识库后判断为活动票务场景。");
        sceneSignals.put("agentDecisionActionTitle", "查看票务");
        sceneSignals.put("agentDecisionReasonSummary", "涉及演出时间、票务和预约时必须等待真实系统确认。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-activity-handoff-001");
        triggerReq.setSceneSignals(sceneSignals);
        triggerReq.setLocation(location("39.937050", "116.386770", 20));
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("activity", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-activity-handoff-001");
        followUpReq.setQuestion("这场演出什么时候开始，哪里买票？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO answer = appService.answer(followUpReq);

        assertEquals("PASSED", answer.getSafetyStatus());
        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        verify(chatModel).call(promptCaptor.capture());
        String prompt = promptCaptor.getValue().getContents();
        assertTrue(prompt.contains("服务意图=activity/活动票务"));
        assertTrue(prompt.contains("真实系统确认=true"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-activity-handoff-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertEquals("activity", visionAgentContext.get("serviceHandoffIntent").asText());
        assertTrue(visionAgentContext.get("serviceHandoffRequiresRealSystem").asBoolean());
    }

    @Test
    public void testAnswerHydratesSignTranslationHandoffFromTrigger() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);
        consoleService.addKnowledgeDocument(xichengGongwangfuKnowledgeReq(packageId));
        ChatModel chatModel = mock(ChatModel.class);
        when(aiModelService.getRequiredDefaultModel(AiModelTypeEnum.CHAT.getType())).thenReturn(defaultChatModel());
        when(aiModelService.getChatModel(6601L)).thenReturn(chatModel);
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse("模型生成：这块路牌可以先翻译文字，再讲发音。"));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneDomainIntentKey", "sign");
        sceneSignals.put("sceneDomainIntentLabel", "路牌");
        sceneSignals.put("sceneFusionSummary", "用户正在恭王府入口拍路牌，想知道文字含义和发音。");
        sceneSignals.put("worldInterfaceSummary", "相机融合 OCR、定位和城市知识库后判断为路牌翻译场景。");
        sceneSignals.put("agentDecisionActionTitle", "翻译路牌");
        sceneSignals.put("agentDecisionReasonSummary", "先翻译画面文字，讲发音和含义，再连接导航。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-sign-translation-001");
        triggerReq.setOcrText("恭王府 入口");
        triggerReq.setSceneSignals(sceneSignals);
        triggerReq.setLocation(location("39.937050", "116.386770", 20));
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("translate", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-sign-translation-001");
        followUpReq.setQuestion("这个路牌怎么读，是什么意思？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO answer = appService.answer(followUpReq);

        assertEquals("PASSED", answer.getSafetyStatus());
        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        verify(chatModel).call(promptCaptor.capture());
        String prompt = promptCaptor.getValue().getContents();
        assertTrue(prompt.contains("服务意图=translate/路牌翻译"));
        assertTrue(prompt.contains("真实系统确认=false"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-sign-translation-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertEquals("translate", visionAgentContext.get("serviceHandoffIntent").asText());
        assertFalse(visionAgentContext.get("serviceHandoffRequiresRealSystem").asBoolean());
    }

    @Test
    public void testAnswerHydratesAnimalSafetyHandoffFromTrigger() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);
        consoleService.addKnowledgeDocument(xichengGongwangfuKnowledgeReq(packageId));
        ChatModel chatModel = mock(ChatModel.class);
        when(aiModelService.getRequiredDefaultModel(AiModelTypeEnum.CHAT.getType())).thenReturn(defaultChatModel());
        when(aiModelService.getChatModel(6601L)).thenReturn(chatModel);
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse("模型生成：请先保持距离，不要投喂。"));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneDomainIntentKey", "animal");
        sceneSignals.put("sceneDomainIntentLabel", "动物");
        sceneSignals.put("sceneFusionSummary", "用户拍到野生动物，想知道是否危险。");
        sceneSignals.put("worldInterfaceSummary", "相机融合视觉识别和城市知识库后判断为动物安全提醒场景。");
        sceneSignals.put("agentDecisionActionTitle", "安全提醒");
        sceneSignals.put("agentDecisionReasonSummary", "先说明保护情况、栖息地和是否危险，提醒不要靠近或投喂。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-animal-safety-001");
        triggerReq.setText("这是什么动物，会不会危险？");
        triggerReq.setOcrText("恭王府博物馆入口");
        triggerReq.setSceneSignals(sceneSignals);
        triggerReq.setLocation(location("39.937050", "116.386770", 20));
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("safety", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-animal-safety-001");
        followUpReq.setQuestion("我现在该怎么做？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO answer = appService.answer(followUpReq);

        assertEquals("PASSED", answer.getSafetyStatus());
        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        verify(chatModel).call(promptCaptor.capture());
        String prompt = promptCaptor.getValue().getContents();
        assertTrue(prompt.contains("服务意图=safety/安全提醒"));
        assertTrue(prompt.contains("真实系统确认=false"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-animal-safety-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertEquals("safety", visionAgentContext.get("serviceHandoffIntent").asText());
        assertFalse(visionAgentContext.get("serviceHandoffRequiresRealSystem").asBoolean());
    }

    @Test
    public void testAnswerHydratesArtifactInterpretHandoffFromTrigger() {
        Long projectId = consoleService.createProject(xichengProjectReq());
        Long schoolId = consoleService.createSchool(xichengSchoolReq());
        Long packageId = consoleService.createResourcePackage(xichengPackageReq(projectId, schoolId));
        insertXichengPoi(packageId);
        consoleService.addKnowledgeDocument(xichengGongwangfuKnowledgeReq(packageId));
        ChatModel chatModel = mock(ChatModel.class);
        when(aiModelService.getRequiredDefaultModel(AiModelTypeEnum.CHAT.getType())).thenReturn(defaultChatModel());
        when(aiModelService.getChatModel(6601L)).thenReturn(chatModel);
        when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse("模型生成：先讲年代、工艺和用途。"));

        Map<String, Object> sceneSignals = new LinkedHashMap<>();
        sceneSignals.put("sceneDomainIntentKey", "artifact");
        sceneSignals.put("sceneDomainIntentLabel", "文物");
        sceneSignals.put("sceneFusionSummary", "用户拍到展柜里的文物，想了解年代、工艺和用途。");
        sceneSignals.put("worldInterfaceSummary", "相机融合视觉识别和城市知识库后判断为文物深度识境场景。");
        sceneSignals.put("agentDecisionActionTitle", "深入讲解");
        sceneSignals.put("agentDecisionReasonSummary", "先讲年代、工艺、用途和同时代背景，再引导继续比较。");
        MultimodalTriggerReqVO triggerReq = multimodalReq();
        triggerReq.setPackageCode("XICHENG-MAP-001");
        triggerReq.setSceneCode("xicheng-multimodal-trigger");
        triggerReq.setUserTraceId("trace-xicheng-artifact-interpret-001");
        triggerReq.setText("这件文物是什么年代的？");
        triggerReq.setOcrText("恭王府博物馆入口");
        triggerReq.setSceneSignals(sceneSignals);
        triggerReq.setLocation(location("39.937050", "116.386770", 20));
        MultimodalTriggerRespVO triggerResp = appService.resolveMultimodalTrigger(triggerReq);
        assertEquals("interpret", triggerResp.getIntent());

        RagChatReqVO followUpReq = xichengRagReq();
        followUpReq.setUserTraceId("trace-xicheng-artifact-interpret-001");
        followUpReq.setQuestion("和同时代其他器物有什么区别？");
        followUpReq.setRegionCode("");
        followUpReq.setPoiCode("");
        followUpReq.setPoiName("");
        RagChatRespVO answer = appService.answer(followUpReq);

        assertEquals("PASSED", answer.getSafetyStatus());
        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        verify(chatModel).call(promptCaptor.capture());
        String prompt = promptCaptor.getValue().getContents();
        assertTrue(prompt.contains("服务意图=interpret/深度识境"));
        assertTrue(prompt.contains("真实系统确认=false"));

        List<XunjingInteractionEventDO> askEvents = interactionEventMapper.selectList(
                new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                        .eq(XunjingInteractionEventDO::getPackageId, packageId)
                        .eq(XunjingInteractionEventDO::getEventType, XunjingEnums.EventType.ASK.getType())
                        .eq(XunjingInteractionEventDO::getUserTraceId, "trace-xicheng-artifact-interpret-001"));
        assertEquals(1, askEvents.size());
        JsonNode askPayload = JsonUtils.parseTree(askEvents.get(0).getPayloadJson());
        JsonNode visionAgentContext = askPayload.get("visionAgentContext");
        assertEquals("interpret", visionAgentContext.get("serviceHandoffIntent").asText());
        assertFalse(visionAgentContext.get("serviceHandoffRequiresRealSystem").asBoolean());
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

    private KnowledgeDocumentCreateReqVO xichengXiangfeiGraphKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("香妃墓城市知识图谱讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/xiangfei-graph");
        reqVO.setContentDigest("香妃墓可以沿乾隆、清朝新疆、西域交流和丝绸之路展开城市知识图谱讲解。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO xichengFamilyStudyKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("西城亲子研学讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/family-study");
        reqVO.setContentDigest("西城亲子研学适合用儿童版、互动观察和中小学生家庭游客视角展开讲解。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO xichengNightRainRouteKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("西城夜雨室内路线讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/night-rain-route");
        reqVO.setContentDigest("21:10 小雨时建议优先切换到西城室内路线，选择博物馆、展厅和夜间可达空间。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO xichengNightLectureKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("白塔夜游讲堂运营讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/night-lecture");
        reqVO.setContentDigest("白塔夜游讲堂 19:30 在西城图书馆集合，可接续运营讲解、预约提醒和室内集合路线。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO xichengHalalDishKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("西城清真点单讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/halal-dish");
        reqVO.setContentDigest("拉条子和烤包子适合第一次来时组合点单，整体中辣，清真友好。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO xichengSignTranslationKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("西城路牌翻译讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/sign-translation");
        reqVO.setContentDigest("市场路可读作 bazaar yoli，可作为前往市场入口的导航线索。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO xichengFoodKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("西城烤包子美食讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/food-snack");
        reqVO.setContentDigest("烤包子是新疆街头小吃，常用馕坑高温烤制，趁热掰开吃，适合配酸奶，附近可找清真老字号。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO xichengArchitectureInterpretKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("西城建筑榫卯细节讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/architecture-detail");
        reqVO.setContentDigest("无钉木梁常通过榫卯木梁结构完成受力和咬合，抬头可观察不用钉子的咬合节点。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO xichengHeritageInstrumentKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("西城非遗乐器体验讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/heritage-instrument");
        reqVO.setContentDigest("热瓦普是民族弹拨乐器，可讲木质琴身和皮面共鸣箱制作，右手拨弦、左手按弦演奏，并推荐非遗乐器体验。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO xichengPlantKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("西城胡杨植物识境讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/plant-populus");
        reqVO.setContentDigest("胡杨可讲约百年树龄、深根和减少蒸腾的耐旱机制，秋季金黄时最好看，新疆塔里木河流域分布较多。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO xichengAnimalSafetyKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("西城雪豹动物识境讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/animal-snow-leopard");
        reqVO.setContentDigest("雪豹是国家一级保护野生动物，常在高山岩地和雪线附近活动；野外近距离接触有风险，应保持距离，不要靠近、投喂或追赶。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO xichengPersonKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("西城人物雕像识境讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/person-statue");
        reqVO.setContentDigest("香妃人物线索可连接乾隆、清朝新疆和丝绸之路，讲人物故事、建址原因、民族交流和同时期人物关系。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO xichengActivityKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("西城木卡姆演出识境讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/activity-muqam");
        reqVO.setContentDigest("木卡姆小剧场节目背景来自丝路音乐交流，今晚 20:00 开始，本地青年乐团和非遗传承人联合演出，买票和预约必须跳转真实票务系统确认。");
        reqVO.setAuthorityLevel(XunjingEnums.AuthorityLevel.OFFICIAL.getLevel());
        reqVO.setReviewStatus(XunjingEnums.ReviewStatus.APPROVED.getStatus());
        reqVO.setVectorStatus(XunjingEnums.VectorStatus.INDEXED.getStatus());
        return reqVO;
    }

    private KnowledgeDocumentCreateReqVO xichengTravelRecordKnowledgeReq(Long packageId) {
        KnowledgeDocumentCreateReqVO reqVO = new KnowledgeDocumentCreateReqVO();
        reqVO.setPackageId(packageId);
        reqVO.setTitle("西城自动游记任务包讲解稿");
        reqVO.setSourceType(XunjingEnums.SourceType.MANUAL.getType());
        reqVO.setSourceUrl("https://www.bjxch.gov.cn/example/travel-record-package");
        reqVO.setContentDigest("自动游记任务包可把 12 个景点、50 张照片、5 小时停留、徽章和旅行地图整理为旅行故事，并生成朋友圈和小红书文案草稿。");
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
