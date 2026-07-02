package cn.iocoder.yudao.module.xunjing.service.app.trigger;

import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.MultimodalTriggerReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.PhotoMetaReqVO;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class XunjingVisionRecognitionServiceTest {

    private final XunjingVisionRecognitionService service = new XunjingVisionRecognitionService();

    @Test
    public void testExtractVisionLabelsFromJsonAndChineseCaption() {
        List<String> labels = service.extractVisionLabels("""
                ```json
                {"labels":["white-pagoda","temple_gate"],"caption":"这是一张北京妙应寺白塔照片"}
                ```
                """);

        assertTrue(labels.contains("white_pagoda"));
        assertTrue(labels.contains("temple_gate"));
        assertTrue(labels.contains("temple"));
    }

    @Test
    public void testBuildVisionRequestJsonUsesDataUrl() {
        PhotoMetaReqVO photoMeta = new PhotoMetaReqVO();
        photoMeta.setImageMimeType("image/png");
        photoMeta.setImageBase64("abc123");

        String requestJson = service.buildVisionRequestJson(photoMeta);

        assertTrue(requestJson.contains("image_url"));
        assertTrue(requestJson.contains("data:image/png;base64,abc123"));
    }

    @Test
    public void testEnrichKeepsOriginalRequestWhenVisionProviderIsNotConfigured() {
        MultimodalTriggerReqVO reqVO = new MultimodalTriggerReqVO();
        reqVO.setImageLabels(List.of("white_pagoda"));
        reqVO.setPhotoMeta(photoMeta("image/jpeg", "photo-base64"));

        MultimodalTriggerReqVO enrichedReqVO = service.enrich(reqVO);

        assertEquals(List.of("white_pagoda"), enrichedReqVO.getImageLabels());
    }

    @Test
    public void testEnrichCallsConfiguredOpenAiCompatibleVisionProviderAndMergesLabels() throws Exception {
        AtomicReference<String> requestPath = new AtomicReference<>();
        AtomicReference<String> requestAuthorization = new AtomicReference<>();
        AtomicReference<String> requestBody = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/compatible/v1/chat/completions", exchange -> {
            requestPath.set(exchange.getRequestURI().getPath());
            requestAuthorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            String response = """
                    {"choices":[{"message":{"content":"{\\"labels\\":[\\"imperial-temple\\",\\"paifang\\"],\\"caption\\":\\"历代帝王庙牌坊\\"}"}}]}
                    """;
            byte[] responseBytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, responseBytes.length);
            exchange.getResponseBody().write(responseBytes);
            exchange.close();
        });
        server.start();
        try {
            XunjingVisionRecognitionService configuredService = new XunjingVisionRecognitionService();
            setField(configuredService, "visionApiUrl",
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/compatible/v1");
            setField(configuredService, "visionApiKey", "test-key");
            setField(configuredService, "visionModel", "qwen-vl-max");

            MultimodalTriggerReqVO reqVO = new MultimodalTriggerReqVO();
            reqVO.setImageLabels(List.of("existing_label"));
            reqVO.setPhotoMeta(photoMeta("image/jpeg", "photo-base64"));

            MultimodalTriggerReqVO enrichedReqVO = configuredService.enrich(reqVO);

            assertEquals("/compatible/v1/chat/completions", requestPath.get());
            assertEquals("Bearer test-key", requestAuthorization.get());
            assertTrue(requestBody.get().contains("\"model\":\"qwen-vl-max\""));
            assertTrue(requestBody.get().contains("data:image/jpeg;base64,photo-base64"));
            assertTrue(enrichedReqVO.getImageLabels().contains("existing_label"));
            assertTrue(enrichedReqVO.getImageLabels().contains("imperial_temple"));
            assertTrue(enrichedReqVO.getImageLabels().contains("paifang"));
            assertTrue(enrichedReqVO.getImageLabels().contains("temple"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    public void testEnrichMergesProviderOcrAndSceneSignals() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/vision/v1/chat/completions", exchange -> {
            String response = """
                    {"choices":[{"message":{"content":"{\\"labels\\":[\\"palace\\"],\\"ocrText\\":\\"恭王府博物馆入口\\",\\"caption\\":\\"镜头里是恭王府博物馆入口牌匾\\",\\"sceneSignals\\":{\\"sceneFusionSummary\\":\\"视觉识别到恭王府入口牌匾。\\",\\"worldInterfaceSummary\\":\\"视觉模型读取画面文字后交给场景引擎。\\",\\"sceneDomainIntentKey\\":\\"architecture\\",\\"sceneDomainIntentLabel\\":\\"建筑\\",\\"agentDecisionReasonSummary\\":\\"先讲建筑格局，再推荐参观路线。\\",\\"sourceRecognitionContext\\":{\\"raw\\":\\"blocked\\"}}}"}}]}
                    """;
            byte[] responseBytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, responseBytes.length);
            exchange.getResponseBody().write(responseBytes);
            exchange.close();
        });
        server.start();
        try {
            XunjingVisionRecognitionService configuredService = new XunjingVisionRecognitionService();
            setField(configuredService, "visionApiUrl",
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/vision/v1");
            setField(configuredService, "visionApiKey", "test-key");
            setField(configuredService, "visionModel", "qwen-vl-max");

            MultimodalTriggerReqVO reqVO = new MultimodalTriggerReqVO();
            reqVO.setOcrText("");
            reqVO.setImageLabels(List.of("existing_label"));
            reqVO.setSceneSignals(new java.util.LinkedHashMap<>(Map.of(
                    "weatherText", "晴",
                    "agentDecisionReasonSummary", "客户端已有理由")));
            reqVO.setPhotoMeta(photoMeta("image/jpeg", "photo-base64"));

            MultimodalTriggerReqVO enrichedReqVO = configuredService.enrich(reqVO);

            assertEquals("恭王府博物馆入口", enrichedReqVO.getOcrText());
            assertTrue(enrichedReqVO.getImageLabels().contains("existing_label"));
            assertTrue(enrichedReqVO.getImageLabels().contains("palace"));
            assertEquals("晴", enrichedReqVO.getSceneSignals().get("weatherText"));
            assertEquals("客户端已有理由", enrichedReqVO.getSceneSignals().get("agentDecisionReasonSummary"));
            assertEquals("视觉识别到恭王府入口牌匾。", enrichedReqVO.getSceneSignals().get("sceneFusionSummary"));
            assertEquals("视觉模型读取画面文字后交给场景引擎。", enrichedReqVO.getSceneSignals().get("worldInterfaceSummary"));
            assertEquals("architecture", enrichedReqVO.getSceneSignals().get("sceneDomainIntentKey"));
            assertEquals("建筑", enrichedReqVO.getSceneSignals().get("sceneDomainIntentLabel"));
            assertEquals("success", enrichedReqVO.getSceneSignals().get("visionRecognitionStatus"));
            assertEquals("qwen-vl-max", enrichedReqVO.getSceneSignals().get("visionRecognitionModel"));
            assertEquals("1", enrichedReqVO.getSceneSignals().get("visionRecognitionLabelCount"));
            assertFalse(enrichedReqVO.getSceneSignals().containsKey("sourceRecognitionContext"));
            assertFalse(enrichedReqVO.getSceneSignals().toString().contains("test-key"));
            assertFalse(enrichedReqVO.getSceneSignals().toString().contains("/vision/v1"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    public void testEnrichMergesMenuSceneSignalsFromVisionProvider() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/vision/v1/chat/completions", exchange -> {
            String response = """
                    {"choices":[{"message":{"content":"{\\"labels\\":[\\"dish_menu\\"],\\"ocrText\\":\\"拉条子 烤包子\\",\\"caption\\":\\"画面里是餐厅菜单。\\",\\"sceneSignals\\":{\\"sceneDomainIntentKey\\":\\"menu\\",\\"sceneDomainIntentLabel\\":\\"菜单\\",\\"menuItemNames\\":\\"拉条子 烤包子\\",\\"spiceLevelSummary\\":\\"中辣\\",\\"halalSuitabilityText\\":\\"清真友好\\",\\"dishRecommendationSummary\\":\\"第一次来建议点拉条子和烤包子\\"}}"}}]}
                    """;
            byte[] responseBytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, responseBytes.length);
            exchange.getResponseBody().write(responseBytes);
            exchange.close();
        });
        server.start();
        try {
            XunjingVisionRecognitionService configuredService = new XunjingVisionRecognitionService();
            setField(configuredService, "visionApiUrl",
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/vision/v1");
            setField(configuredService, "visionApiKey", "test-key");

            MultimodalTriggerReqVO reqVO = new MultimodalTriggerReqVO();
            reqVO.setPhotoMeta(photoMeta("image/jpeg", "photo-base64"));

            MultimodalTriggerReqVO enrichedReqVO = configuredService.enrich(reqVO);

            assertEquals("拉条子 烤包子", enrichedReqVO.getOcrText());
            assertEquals("menu", enrichedReqVO.getSceneSignals().get("sceneDomainIntentKey"));
            assertEquals("菜单", enrichedReqVO.getSceneSignals().get("sceneDomainIntentLabel"));
            assertEquals("拉条子 烤包子", enrichedReqVO.getSceneSignals().get("menuItemNames"));
            assertEquals("中辣", enrichedReqVO.getSceneSignals().get("spiceLevelSummary"));
            assertEquals("清真友好", enrichedReqVO.getSceneSignals().get("halalSuitabilityText"));
            assertEquals("第一次来建议点拉条子和烤包子",
                    enrichedReqVO.getSceneSignals().get("dishRecommendationSummary"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    public void testEnrichMergesSignTranslationSceneSignalsFromVisionProvider() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/vision/v1/chat/completions", exchange -> {
            String response = """
                    {"choices":[{"message":{"content":"{\\"labels\\":[\\"road_sign\\"],\\"ocrText\\":\\"بازار يولى\\",\\"caption\\":\\"画面里是街道路牌。\\",\\"sceneSignals\\":{\\"sceneDomainIntentKey\\":\\"sign\\",\\"sceneDomainIntentLabel\\":\\"路牌\\",\\"signOriginalText\\":\\"بازار يولى\\",\\"signTranslationText\\":\\"市场路\\",\\"signPronunciationText\\":\\"bazaar yoli\\",\\"signNavigationHint\\":\\"可作为前往市场入口的导航线索\\"}}"}}]}
                    """;
            byte[] responseBytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, responseBytes.length);
            exchange.getResponseBody().write(responseBytes);
            exchange.close();
        });
        server.start();
        try {
            XunjingVisionRecognitionService configuredService = new XunjingVisionRecognitionService();
            setField(configuredService, "visionApiUrl",
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/vision/v1");
            setField(configuredService, "visionApiKey", "test-key");

            MultimodalTriggerReqVO reqVO = new MultimodalTriggerReqVO();
            reqVO.setPhotoMeta(photoMeta("image/jpeg", "photo-base64"));

            MultimodalTriggerReqVO enrichedReqVO = configuredService.enrich(reqVO);

            assertEquals("بازار يولى", enrichedReqVO.getOcrText());
            assertEquals("sign", enrichedReqVO.getSceneSignals().get("sceneDomainIntentKey"));
            assertEquals("路牌", enrichedReqVO.getSceneSignals().get("sceneDomainIntentLabel"));
            assertEquals("بازار يولى", enrichedReqVO.getSceneSignals().get("signOriginalText"));
            assertEquals("市场路", enrichedReqVO.getSceneSignals().get("signTranslationText"));
            assertEquals("bazaar yoli", enrichedReqVO.getSceneSignals().get("signPronunciationText"));
            assertEquals("可作为前往市场入口的导航线索",
                    enrichedReqVO.getSceneSignals().get("signNavigationHint"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    public void testEnrichInfersSceneDomainWhenProviderOnlyReturnsCaptionAndLabels() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/vision/v1/chat/completions", exchange -> {
            String response = """
                    {"choices":[{"message":{"content":"{\\"labels\\":[\\"road-sign\\",\\"street_name\\"],\\"ocrText\\":\\"买卖街路牌\\",\\"caption\\":\\"画面里是街道路牌，包含可翻译的文字。\\"}"}}]}
                    """;
            byte[] responseBytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, responseBytes.length);
            exchange.getResponseBody().write(responseBytes);
            exchange.close();
        });
        server.start();
        try {
            XunjingVisionRecognitionService configuredService = new XunjingVisionRecognitionService();
            setField(configuredService, "visionApiUrl",
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/vision/v1");
            setField(configuredService, "visionApiKey", "test-key");

            MultimodalTriggerReqVO reqVO = new MultimodalTriggerReqVO();
            reqVO.setPhotoMeta(photoMeta("image/jpeg", "photo-base64"));

            MultimodalTriggerReqVO enrichedReqVO = configuredService.enrich(reqVO);

            assertEquals("买卖街路牌", enrichedReqVO.getOcrText());
            assertEquals("sign", enrichedReqVO.getSceneSignals().get("sceneDomainIntentKey"));
            assertEquals("路牌", enrichedReqVO.getSceneSignals().get("sceneDomainIntentLabel"));
            assertEquals("路牌识境", enrichedReqVO.getSceneSignals().get("sceneDomainIntentTitle"));
            assertEquals("翻译文字、讲发音并连接导航", enrichedReqVO.getSceneSignals().get("sceneDomainIntentCopy"));
            assertEquals("画面里是街道路牌，包含可翻译的文字。", enrichedReqVO.getSceneSignals().get("sceneFusionSummary"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    public void testEnrichSkipsOversizedImagePayloadBeforeCallingProvider() throws Exception {
        XunjingVisionRecognitionService configuredService = new XunjingVisionRecognitionService();
        setField(configuredService, "visionApiUrl", "http://127.0.0.1:1/v1");
        setField(configuredService, "visionApiKey", "test-key");

        MultimodalTriggerReqVO reqVO = new MultimodalTriggerReqVO();
        reqVO.setImageLabels(List.of("white_pagoda"));
        reqVO.setPhotoMeta(photoMeta("image/jpeg", "x".repeat(4_000_001)));

        MultimodalTriggerReqVO enrichedReqVO = configuredService.enrich(reqVO);

        assertEquals(List.of("white_pagoda"), enrichedReqVO.getImageLabels());
    }

    private PhotoMetaReqVO photoMeta(String imageMimeType, String imageBase64) {
        PhotoMetaReqVO photoMeta = new PhotoMetaReqVO();
        photoMeta.setImageId("photo-001");
        photoMeta.setImageMimeType(imageMimeType);
        photoMeta.setImageBase64(imageBase64);
        return photoMeta;
    }

    private void setField(Object target, String name, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }

}
