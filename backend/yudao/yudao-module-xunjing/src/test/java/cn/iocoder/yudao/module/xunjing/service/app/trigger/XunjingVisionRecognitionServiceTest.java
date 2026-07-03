package cn.iocoder.yudao.module.xunjing.service.app.trigger;

import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.MultimodalTriggerReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.PhotoMetaReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.VisionProviderStatusRespVO;
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
    public void testGetProviderStatusReportsMissingConfigWithoutLeakingSecrets() {
        VisionProviderStatusRespVO status = service.getProviderStatus();

        assertFalse(status.getProviderConfigured());
        assertFalse(status.getEndpointConfigured());
        assertFalse(status.getApiKeyConfigured());
        assertEquals("qwen-vl-max", status.getModel());
        assertEquals("", status.getApiKeyFingerprint());
        assertTrue(status.getMissingConfigKeys().contains("XUNJING_VISION_API_URL"));
        assertTrue(status.getMissingConfigKeys().contains("XUNJING_VISION_API_KEY"));
        assertTrue(status.getProductionEvidenceText().contains("不会伪造视觉/OCR 识别结果"));
        assertFalse(status.toString().contains("photo-base64"));
    }

    @Test
    public void testGetProviderStatusReportsConfiguredFingerprintOnly() throws Exception {
        XunjingVisionRecognitionService configuredService = new XunjingVisionRecognitionService();
        setField(configuredService, "visionApiUrl", "https://vision.example.com/v1");
        setField(configuredService, "visionApiKey", "test-secret-key-001");
        setField(configuredService, "visionModel", "qwen-vl-max");

        VisionProviderStatusRespVO status = configuredService.getProviderStatus();

        assertTrue(status.getProviderConfigured());
        assertTrue(status.getEndpointConfigured());
        assertTrue(status.getApiKeyConfigured());
        assertEquals("qwen-vl-max", status.getModel());
        assertTrue(status.getApiKeyFingerprint().startsWith("sha256:"));
        assertTrue(status.getMissingConfigKeys().isEmpty());
        assertTrue(status.getProductionEvidenceText().contains("真实图片 smoke 证据"));
        assertFalse(status.toString().contains("test-secret-key-001"));
        assertFalse(status.toString().contains("https://vision.example.com/v1"));
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
            assertTrue(enrichedReqVO.getSceneSignals().get("recognitionEvidence") instanceof Map);
            @SuppressWarnings("unchecked")
            Map<String, Object> recognitionEvidence =
                    (Map<String, Object>) enrichedReqVO.getSceneSignals().get("recognitionEvidence");
            assertEquals("success", recognitionEvidence.get("status"));
            assertEquals("qwen-vl-max", recognitionEvidence.get("model"));
            assertEquals(1, recognitionEvidence.get("labelCount"));
            assertEquals(List.of("palace"), recognitionEvidence.get("labels"));
            assertEquals("恭王府博物馆入口", recognitionEvidence.get("ocrText"));
            assertEquals("镜头里是恭王府博物馆入口牌匾", recognitionEvidence.get("caption"));
            assertEquals("photo-001", recognitionEvidence.get("imageId"));
            assertEquals("image/jpeg", recognitionEvidence.get("imageMimeType"));
            assertEquals(true, recognitionEvidence.get("providerConfigured"));
            assertFalse(enrichedReqVO.getSceneSignals().containsKey("sourceRecognitionContext"));
            assertFalse(enrichedReqVO.getSceneSignals().toString().contains("test-key"));
            assertFalse(enrichedReqVO.getSceneSignals().toString().contains("/vision/v1"));
            assertFalse(enrichedReqVO.getSceneSignals().toString().contains("photo-base64"));
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
    public void testEnrichMergesFoodSceneSignalsFromVisionProvider() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/vision/v1/chat/completions", exchange -> {
            String response = """
                    {"choices":[{"message":{"content":"{\\"labels\\":[\\"dish\\"],\\"ocrText\\":\\"烤包子\\",\\"caption\\":\\"画面里是一份刚出炉的烤包子。\\",\\"sceneSignals\\":{\\"sceneDomainIntentKey\\":\\"food\\",\\"sceneDomainIntentLabel\\":\\"美食\\",\\"foodItemName\\":\\"烤包子\\",\\"foodOriginSummary\\":\\"新疆街头小吃\\",\\"cookingMethodSummary\\":\\"馕坑高温烤制\\",\\"eatingMethodSummary\\":\\"趁热掰开吃\\",\\"pairingSuggestionText\\":\\"适合配酸奶\\",\\"nearbyFoodRecommendationSummary\\":\\"附近可找清真老字号\\"}}"}}]}
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

            assertEquals("烤包子", enrichedReqVO.getOcrText());
            assertEquals("food", enrichedReqVO.getSceneSignals().get("sceneDomainIntentKey"));
            assertEquals("美食", enrichedReqVO.getSceneSignals().get("sceneDomainIntentLabel"));
            assertEquals("烤包子", enrichedReqVO.getSceneSignals().get("foodItemName"));
            assertEquals("新疆街头小吃", enrichedReqVO.getSceneSignals().get("foodOriginSummary"));
            assertEquals("馕坑高温烤制", enrichedReqVO.getSceneSignals().get("cookingMethodSummary"));
            assertEquals("趁热掰开吃", enrichedReqVO.getSceneSignals().get("eatingMethodSummary"));
            assertEquals("适合配酸奶", enrichedReqVO.getSceneSignals().get("pairingSuggestionText"));
            assertEquals("附近可找清真老字号",
                    enrichedReqVO.getSceneSignals().get("nearbyFoodRecommendationSummary"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    public void testEnrichMergesHeritageSceneSignalsFromVisionProvider() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/vision/v1/chat/completions", exchange -> {
            String response = """
                    {"choices":[{"message":{"content":"{\\"labels\\":[\\"instrument\\"],\\"ocrText\\":\\"热瓦普\\",\\"caption\\":\\"画面里是一把新疆弹拨乐器。\\",\\"sceneSignals\\":{\\"sceneDomainIntentKey\\":\\"intangible_heritage\\",\\"sceneDomainIntentLabel\\":\\"非遗\\",\\"heritageItemName\\":\\"热瓦普\\",\\"heritageCategoryText\\":\\"民族弹拨乐器\\",\\"craftProcessSummary\\":\\"木质琴身和皮面共鸣箱制作\\",\\"performanceMethodSummary\\":\\"右手拨弦、左手按弦演奏\\",\\"soundAssetHint\\":\\"可播放热瓦普音色样例\\",\\"nearbyExperienceSummary\\":\\"附近可推荐非遗乐器体验\\"}}"}}]}
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

            assertEquals("热瓦普", enrichedReqVO.getOcrText());
            assertEquals("intangible_heritage", enrichedReqVO.getSceneSignals().get("sceneDomainIntentKey"));
            assertEquals("非遗", enrichedReqVO.getSceneSignals().get("sceneDomainIntentLabel"));
            assertEquals("热瓦普", enrichedReqVO.getSceneSignals().get("heritageItemName"));
            assertEquals("民族弹拨乐器", enrichedReqVO.getSceneSignals().get("heritageCategoryText"));
            assertEquals("木质琴身和皮面共鸣箱制作",
                    enrichedReqVO.getSceneSignals().get("craftProcessSummary"));
            assertEquals("右手拨弦、左手按弦演奏",
                    enrichedReqVO.getSceneSignals().get("performanceMethodSummary"));
            assertEquals("可播放热瓦普音色样例", enrichedReqVO.getSceneSignals().get("soundAssetHint"));
            assertEquals("附近可推荐非遗乐器体验",
                    enrichedReqVO.getSceneSignals().get("nearbyExperienceSummary"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    public void testEnrichMergesPlantSceneSignalsFromVisionProvider() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/vision/v1/chat/completions", exchange -> {
            String response = """
                    {"choices":[{"message":{"content":"{\\"labels\\":[\\"populus\\"],\\"ocrText\\":\\"胡杨\\",\\"caption\\":\\"画面里是一棵胡杨。\\",\\"sceneSignals\\":{\\"sceneDomainIntentKey\\":\\"plant\\",\\"sceneDomainIntentLabel\\":\\"植物\\",\\"plantSpeciesName\\":\\"胡杨\\",\\"plantAgeEstimateText\\":\\"约百年树龄\\",\\"plantAdaptationSummary\\":\\"根系深、叶片可减少蒸腾，适合干旱环境\\",\\"bestViewingSeasonText\\":\\"秋季金黄时最好看\\",\\"regionalDistributionSummary\\":\\"新疆塔里木河流域分布较多\\"}}"}}]}
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

            assertEquals("胡杨", enrichedReqVO.getOcrText());
            assertEquals("plant", enrichedReqVO.getSceneSignals().get("sceneDomainIntentKey"));
            assertEquals("植物", enrichedReqVO.getSceneSignals().get("sceneDomainIntentLabel"));
            assertEquals("胡杨", enrichedReqVO.getSceneSignals().get("plantSpeciesName"));
            assertEquals("约百年树龄", enrichedReqVO.getSceneSignals().get("plantAgeEstimateText"));
            assertEquals("根系深、叶片可减少蒸腾，适合干旱环境",
                    enrichedReqVO.getSceneSignals().get("plantAdaptationSummary"));
            assertEquals("秋季金黄时最好看", enrichedReqVO.getSceneSignals().get("bestViewingSeasonText"));
            assertEquals("新疆塔里木河流域分布较多",
                    enrichedReqVO.getSceneSignals().get("regionalDistributionSummary"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    public void testEnrichMergesAnimalSceneSignalsFromVisionProvider() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/vision/v1/chat/completions", exchange -> {
            String response = """
                    {"choices":[{"message":{"content":"{\\"labels\\":[\\"snow_leopard\\"],\\"ocrText\\":\\"雪豹\\",\\"caption\\":\\"画面里是雪豹保护展示。\\",\\"sceneSignals\\":{\\"sceneDomainIntentKey\\":\\"animal\\",\\"sceneDomainIntentLabel\\":\\"动物\\",\\"animalSpeciesName\\":\\"雪豹\\",\\"conservationStatusText\\":\\"国家一级保护野生动物\\",\\"habitatSummary\\":\\"高山岩地和雪线附近活动\\",\\"dangerAssessmentText\\":\\"野外近距离接触有风险\\",\\"safetyReminderText\\":\\"不要靠近、投喂或追赶\\",\\"arDisplayHint\\":\\"可展示雪豹体型和栖息地 AR 模型\\"}}"}}]}
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

            assertEquals("雪豹", enrichedReqVO.getOcrText());
            assertEquals("animal", enrichedReqVO.getSceneSignals().get("sceneDomainIntentKey"));
            assertEquals("动物", enrichedReqVO.getSceneSignals().get("sceneDomainIntentLabel"));
            assertEquals("雪豹", enrichedReqVO.getSceneSignals().get("animalSpeciesName"));
            assertEquals("国家一级保护野生动物",
                    enrichedReqVO.getSceneSignals().get("conservationStatusText"));
            assertEquals("高山岩地和雪线附近活动", enrichedReqVO.getSceneSignals().get("habitatSummary"));
            assertEquals("野外近距离接触有风险",
                    enrichedReqVO.getSceneSignals().get("dangerAssessmentText"));
            assertEquals("不要靠近、投喂或追赶", enrichedReqVO.getSceneSignals().get("safetyReminderText"));
            assertEquals("可展示雪豹体型和栖息地 AR 模型",
                    enrichedReqVO.getSceneSignals().get("arDisplayHint"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    public void testEnrichMergesPersonSceneSignalsFromVisionProvider() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/vision/v1/chat/completions", exchange -> {
            String response = """
                    {"choices":[{"message":{"content":"{\\"labels\\":[\\"statue\\"],\\"ocrText\\":\\"香妃\\",\\"caption\\":\\"画面里是一座人物雕像。\\",\\"sceneSignals\\":{\\"sceneDomainIntentKey\\":\\"person\\",\\"sceneDomainIntentLabel\\":\\"人物\\",\\"personName\\":\\"香妃\\",\\"personStorySummary\\":\\"可沿人物传说讲到清代新疆和宫廷叙事\\",\\"statueSiteReasonSummary\\":\\"建在这里用于连接城市历史关系\\",\\"contributionSummary\\":\\"人物线索适合连接民族交流和丝路记忆\\",\\"contemporaryFigureKeywords\\":\\"乾隆 清朝新疆 丝绸之路\\"}}"}}]}
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

            assertEquals("香妃", enrichedReqVO.getOcrText());
            assertEquals("person", enrichedReqVO.getSceneSignals().get("sceneDomainIntentKey"));
            assertEquals("人物", enrichedReqVO.getSceneSignals().get("sceneDomainIntentLabel"));
            assertEquals("香妃", enrichedReqVO.getSceneSignals().get("personName"));
            assertEquals("可沿人物传说讲到清代新疆和宫廷叙事",
                    enrichedReqVO.getSceneSignals().get("personStorySummary"));
            assertEquals("建在这里用于连接城市历史关系",
                    enrichedReqVO.getSceneSignals().get("statueSiteReasonSummary"));
            assertEquals("人物线索适合连接民族交流和丝路记忆",
                    enrichedReqVO.getSceneSignals().get("contributionSummary"));
            assertEquals("乾隆 清朝新疆 丝绸之路",
                    enrichedReqVO.getSceneSignals().get("contemporaryFigureKeywords"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    public void testEnrichMergesActivitySceneSignalsFromVisionProvider() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/vision/v1/chat/completions", exchange -> {
            String response = """
                    {"choices":[{"message":{"content":"{\\"labels\\":[\\"performance\\"],\\"ocrText\\":\\"木卡姆小剧场\\",\\"caption\\":\\"画面里是演出现场。\\",\\"sceneSignals\\":{\\"sceneDomainIntentKey\\":\\"activity\\",\\"sceneDomainIntentLabel\\":\\"活动\\",\\"activityName\\":\\"木卡姆小剧场\\",\\"activityBackgroundSummary\\":\\"节目背景来自丝路音乐交流\\",\\"performerSummary\\":\\"本地青年乐团和非遗传承人联合演出\\",\\"scheduleTimeText\\":\\"今晚 20:00 开始\\",\\"ticketingHint\\":\\"买票和预约必须跳转真实票务系统确认\\",\\"venueNavigationHint\\":\\"临时舞台入口集合\\"}}"}}]}
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

            assertEquals("木卡姆小剧场", enrichedReqVO.getOcrText());
            assertEquals("activity", enrichedReqVO.getSceneSignals().get("sceneDomainIntentKey"));
            assertEquals("活动", enrichedReqVO.getSceneSignals().get("sceneDomainIntentLabel"));
            assertEquals("木卡姆小剧场", enrichedReqVO.getSceneSignals().get("activityName"));
            assertEquals("节目背景来自丝路音乐交流",
                    enrichedReqVO.getSceneSignals().get("activityBackgroundSummary"));
            assertEquals("本地青年乐团和非遗传承人联合演出",
                    enrichedReqVO.getSceneSignals().get("performerSummary"));
            assertEquals("今晚 20:00 开始", enrichedReqVO.getSceneSignals().get("scheduleTimeText"));
            assertEquals("买票和预约必须跳转真实票务系统确认",
                    enrichedReqVO.getSceneSignals().get("ticketingHint"));
            assertEquals("临时舞台入口集合",
                    enrichedReqVO.getSceneSignals().get("venueNavigationHint"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    public void testEnrichMergesTravelRecordSceneSignalsFromVisionProvider() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/vision/v1/chat/completions", exchange -> {
            String response = """
                    {"choices":[{"message":{"content":"{\\"labels\\":[\\"checkin\\"],\\"ocrText\\":\\"旅行徽章\\",\\"caption\\":\\"画面里是景点打卡徽章。\\",\\"sceneSignals\\":{\\"sceneDomainIntentKey\\":\\"record\\",\\"sceneDomainIntentLabel\\":\\"旅行记录\\",\\"checkInTaskSummary\\":\\"完成第 12 个景点打卡\\",\\"badgeRewardName\\":\\"西城晨昏观察徽章\\",\\"travelMapUpdateSummary\\":\\"今天路线已串联 12 个景点\\",\\"travelogueMaterialSummary\\":\\"50 张照片、5 小时停留和讲解线索可生成旅行故事\\",\\"photoMomentSummary\\":\\"王府入口合影可作为今日封面\\",\\"socialShareDraftHint\\":\\"可生成朋友圈和小红书文案草稿\\"}}"}}]}
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

            assertEquals("旅行徽章", enrichedReqVO.getOcrText());
            assertEquals("record", enrichedReqVO.getSceneSignals().get("sceneDomainIntentKey"));
            assertEquals("旅行记录", enrichedReqVO.getSceneSignals().get("sceneDomainIntentLabel"));
            assertEquals("完成第 12 个景点打卡",
                    enrichedReqVO.getSceneSignals().get("checkInTaskSummary"));
            assertEquals("西城晨昏观察徽章", enrichedReqVO.getSceneSignals().get("badgeRewardName"));
            assertEquals("今天路线已串联 12 个景点",
                    enrichedReqVO.getSceneSignals().get("travelMapUpdateSummary"));
            assertEquals("50 张照片、5 小时停留和讲解线索可生成旅行故事",
                    enrichedReqVO.getSceneSignals().get("travelogueMaterialSummary"));
            assertEquals("王府入口合影可作为今日封面",
                    enrichedReqVO.getSceneSignals().get("photoMomentSummary"));
            assertEquals("可生成朋友圈和小红书文案草稿",
                    enrichedReqVO.getSceneSignals().get("socialShareDraftHint"));
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
    public void testEnrichMergesInterpretationSceneSignalsFromVisionProvider() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/vision/v1/chat/completions", exchange -> {
            String response = """
                    {"choices":[{"message":{"content":"{\\"labels\\":[\\"museum_object\\"],\\"ocrText\\":\\"展柜文物\\",\\"caption\\":\\"画面里是展柜里的青铜器。\\",\\"sceneSignals\\":{\\"sceneDomainIntentKey\\":\\"artifact\\",\\"sceneDomainIntentLabel\\":\\"文物\\",\\"recognizedObjectName\\":\\"青铜礼器\\",\\"eraOrPeriodText\\":\\"西周\\",\\"structureOrCraftSummary\\":\\"兽面纹铸造工艺\\",\\"historicalStorySummary\\":\\"用于礼制场景\\",\\"hiddenDetailSummary\\":\\"器身边缘有细密云雷纹\\"}}"}}]}
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

            assertEquals("展柜文物", enrichedReqVO.getOcrText());
            assertEquals("artifact", enrichedReqVO.getSceneSignals().get("sceneDomainIntentKey"));
            assertEquals("文物", enrichedReqVO.getSceneSignals().get("sceneDomainIntentLabel"));
            assertEquals("青铜礼器", enrichedReqVO.getSceneSignals().get("recognizedObjectName"));
            assertEquals("西周", enrichedReqVO.getSceneSignals().get("eraOrPeriodText"));
            assertEquals("兽面纹铸造工艺",
                    enrichedReqVO.getSceneSignals().get("structureOrCraftSummary"));
            assertEquals("用于礼制场景", enrichedReqVO.getSceneSignals().get("historicalStorySummary"));
            assertEquals("器身边缘有细密云雷纹",
                    enrichedReqVO.getSceneSignals().get("hiddenDetailSummary"));
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
