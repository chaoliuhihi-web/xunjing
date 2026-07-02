package cn.iocoder.yudao.module.xunjing.service.app.trigger;

import cn.iocoder.yudao.framework.common.util.json.JsonUtils;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.MultimodalTriggerReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.PhotoMetaReqVO;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Slf4j
@Component
public class XunjingVisionRecognitionService {

    private static final int MAX_IMAGE_BASE64_CHARS = 4_000_000;
    private static final String DEFAULT_MODEL = "qwen-vl-max";
    private static final List<String> VISION_SCENE_SIGNAL_TEXT_KEYS = List.of(
            "sceneFusionSummary",
            "worldInterfaceSummary",
            "sceneDomainIntentKey",
            "sceneDomainIntentLabel",
            "sceneDomainIntentTitle",
            "sceneDomainIntentCopy",
            "agentDecisionActionTitle",
            "agentDecisionReasonSummary",
            "knowledgeGraphKeywords",
            "relatedTopicKeywords",
            "menuItemNames",
            "spiceLevelSummary",
            "halalSuitabilityText",
            "dishRecommendationSummary",
            "signOriginalText",
            "signTranslationText",
            "signPronunciationText",
            "signNavigationHint"
    );
    private static final List<SceneDomainRule> VISION_SCENE_DOMAIN_RULES = List.of(
            new SceneDomainRule("architecture", "建筑", "建筑识境", "讲解年代、结构、故事和拍照角度",
                    List.of("architecture", "building", "palace", "courtyard", "temple", "pagoda", "tower",
                            "gate", "bridge", "pavilion", "建筑", "古城门", "城门", "塔楼", "桥", "亭", "宫殿", "王府")),
            new SceneDomainRule("artifact", "文物", "文物识境", "讲解年代、工艺、用途和同时代背景",
                    List.of("artifact", "relic", "bronze", "museum_object", "vessel", "sword", "文物", "青铜",
                            "博物馆藏品", "器物", "古剑")),
            new SceneDomainRule("menu", "菜单", "菜单识境", "识别菜品、辣度、清真信息和推荐点单",
                    List.of("menu", "dish_menu", "菜单", "菜品", "菜名", "价目")),
            new SceneDomainRule("food", "美食", "美食识境", "讲来源、吃法、搭配和附近推荐",
                    List.of("food", "dish", "snack", "restaurant", "cuisine", "美食", "餐厅", "小吃", "烤包子",
                            "清真")),
            new SceneDomainRule("sign", "路牌", "路牌识境", "翻译文字、讲发音并连接导航",
                    List.of("sign", "road_sign", "street_name", "shop_sign", "路牌", "街牌", "指示牌", "招牌")),
            new SceneDomainRule("intangible_heritage", "非遗", "非遗识境", "讲制作、演奏、传承和附近体验",
                    List.of("intangible_heritage", "heritage_craft", "instrument", "music", "dance", "非遗",
                            "乐器", "热瓦普", "工艺", "传承", "演奏")),
            new SceneDomainRule("plant", "植物", "植物识境", "讲树龄、习性、分布和最佳观赏季",
                    List.of("plant", "tree", "flower", "populus", "胡杨", "植物", "树", "花", "园林")),
            new SceneDomainRule("animal", "动物", "动物识境", "讲保护情况、栖息地和安全提醒",
                    List.of("animal", "wildlife", "bird", "snow_leopard", "动物", "鸟", "雪豹", "野生动物")),
            new SceneDomainRule("person", "人物", "人物识境", "讲人物故事、贡献和同时期关系",
                    List.of("person", "statue", "portrait", "人物", "雕像", "塑像", "画像", "名人")),
            new SceneDomainRule("activity", "活动", "活动识境", "讲节目背景、时间、票务和参与方式",
                    List.of("activity", "performance", "show", "festival", "event", "活动", "演出", "节目",
                            "节庆", "表演"))
    );

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    @Value("${xunjing.vision.api-url:${XUNJING_VISION_API_URL:}}")
    private String visionApiUrl;
    @Value("${xunjing.vision.api-key:${XUNJING_VISION_API_KEY:}}")
    private String visionApiKey;
    @Value("${xunjing.vision.model:${XUNJING_VISION_MODEL:}}")
    private String visionModel;

    public MultimodalTriggerReqVO enrich(MultimodalTriggerReqVO reqVO) {
        if (reqVO == null) {
            return new MultimodalTriggerReqVO();
        }
        VisionRecognitionResult recognition = recognizeImage(reqVO);
        if (recognition.isEmpty()) {
            return reqVO;
        }
        mergeVisionLabels(reqVO, recognition.labels());
        if (!hasText(reqVO.getOcrText()) && hasText(recognition.ocrText())) {
            reqVO.setOcrText(recognition.ocrText());
        }
        mergeVisionSceneSignals(reqVO, recognition);
        return reqVO;
    }

    private VisionRecognitionResult recognizeImage(MultimodalTriggerReqVO reqVO) {
        PhotoMetaReqVO photoMeta = reqVO.getPhotoMeta();
        String imageBase64 = photoMeta == null ? "" : photoMeta.getImageBase64();
        if (photoMeta == null || !hasText(imageBase64)) {
            return VisionRecognitionResult.empty();
        }
        if (!isConfigured()) {
            return VisionRecognitionResult.evidenceOnly(buildVisionRecognitionEvidence("provider_not_configured", 0));
        }
        if (imageBase64.length() > MAX_IMAGE_BASE64_CHARS) {
            log.warn("[recognizeImage][图片 base64 超过服务端上限，跳过视觉识别 imageId={}]", photoMeta.getImageId());
            return VisionRecognitionResult.evidenceOnly(buildVisionRecognitionEvidence("skipped_oversized_image", 0));
        }
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(resolveChatCompletionsUrl(visionApiUrl)))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + visionApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(buildVisionRequestJson(photoMeta)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("[recognizeImage][视觉识别调用失败 status={} imageId={}]", response.statusCode(),
                        photoMeta.getImageId());
                return VisionRecognitionResult.evidenceOnly(buildVisionRecognitionEvidence("provider_http_error", 0));
            }
            VisionRecognitionResult recognition = extractVisionResult(extractChatContent(response.body()));
            return recognition.withEvidence(buildVisionRecognitionEvidence("success", recognition.labels().size()));
        } catch (Exception ex) {
            log.warn("[recognizeImage][视觉识别异常 imageId={} message={}]", photoMeta.getImageId(), ex.getMessage());
            return VisionRecognitionResult.evidenceOnly(buildVisionRecognitionEvidence("provider_error", 0));
        }
    }

    String buildVisionRequestJson(PhotoMetaReqVO photoMeta) {
        String imageMimeType = hasText(photoMeta.getImageMimeType()) ? photoMeta.getImageMimeType() : "image/jpeg";
        String imageUrl = "data:" + imageMimeType + ";base64," + photoMeta.getImageBase64();
        Map<String, Object> payload = Map.of(
                "model", hasText(visionModel) ? visionModel : DEFAULT_MODEL,
                "temperature", 0,
                "max_tokens", 256,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(
                                Map.of("type", "text", "text",
                                        "你是北京西城区文旅图片识别器。只输出 JSON，不要解释。"
                                                + "格式为 {\"labels\":[\"white_pagoda\"],\"ocrText\":\"画面文字\","
                                                + "\"caption\":\"一句中文描述\",\"sceneSignals\":{\"sceneFusionSummary\":\"场景摘要\","
                                                + "\"worldInterfaceSummary\":\"视觉如何参与判断\","
                                                + "\"sceneDomainIntentKey\":\"architecture\","
                                                + "\"sceneDomainIntentLabel\":\"建筑\","
                                                + "\"knowledgeGraphKeywords\":\"相关人物、朝代、地点\","
                                                + "\"relatedTopicKeywords\":\"关联话题\","
                                                + "\"menuItemNames\":\"菜单菜品\","
                                                + "\"spiceLevelSummary\":\"辣度\","
                                                + "\"halalSuitabilityText\":\"清真信息\","
                                                + "\"dishRecommendationSummary\":\"推荐点单\","
                                                + "\"signOriginalText\":\"路牌或招牌原文\","
                                                + "\"signTranslationText\":\"中文翻译\","
                                                + "\"signPronunciationText\":\"发音或转写\","
                                                + "\"signNavigationHint\":\"导航提示\"}}。"
                                                + "sceneDomainIntentKey 可选 architecture, artifact, menu, food, sign, "
                                                + "intangible_heritage, plant, animal, person, activity。"
                                                + "可用 labels 包括 white_pagoda, pagoda, temple, temple_gate, "
                                                + "imperial_temple, paifang, beijing_architecture, lake, "
                                                + "imperial_garden, white_tower, park, hutong, waterfront, "
                                                + "old_beijing, shop_sign, qianmen, dashilar。"),
                                Map.of("type", "image_url", "image_url", Map.of("url", imageUrl))
                        )
                ))
        );
        return JsonUtils.toJsonString(payload);
    }

    List<String> extractVisionLabels(String content) {
        return extractVisionResult(content).labels();
    }

    private VisionRecognitionResult extractVisionResult(String content) {
        if (!hasText(content)) {
            return VisionRecognitionResult.empty();
        }
        Set<String> labels = new LinkedHashSet<>();
        String json = unwrapJson(content);
        String ocrText = "";
        String caption = "";
        Map<String, String> sceneSignals = new LinkedHashMap<>();
        try {
            JsonNode root = JsonUtils.getObjectMapper().readTree(json);
            appendLabels(root.path("labels"), labels);
            appendLabels(root.path("imageLabels"), labels);
            appendLabels(root.path("objects"), labels);
            caption = firstText(root, "caption", "description", "summary");
            ocrText = firstText(root, "ocrText", "ocr", "detectedText", "text");
            addKeywordLabels(caption, labels);
            addKeywordLabels(ocrText, labels);
            sceneSignals.putAll(extractVisionSceneSignals(root, caption));
        } catch (IOException ignored) {
            addKeywordLabels(content, labels);
            caption = content;
        }
        inferVisionSceneDomain(labels, caption, ocrText, sceneSignals);
        return new VisionRecognitionResult(new ArrayList<>(labels), ocrText, sceneSignals);
    }

    private void mergeVisionLabels(MultimodalTriggerReqVO reqVO, List<String> labels) {
        if (labels == null || labels.isEmpty()) {
            return;
        }
        Set<String> mergedLabels = new LinkedHashSet<>();
        if (reqVO.getImageLabels() != null) {
            mergedLabels.addAll(reqVO.getImageLabels());
        }
        mergedLabels.addAll(labels);
        reqVO.setImageLabels(new ArrayList<>(mergedLabels));
    }

    private void mergeVisionSceneSignals(MultimodalTriggerReqVO reqVO, VisionRecognitionResult recognition) {
        if (recognition.sceneSignals().isEmpty()) {
            return;
        }
        Map<String, Object> mergedSceneSignals = new LinkedHashMap<>();
        if (reqVO.getSceneSignals() != null) {
            mergedSceneSignals.putAll(reqVO.getSceneSignals());
        }
        for (Map.Entry<String, String> entry : recognition.sceneSignals().entrySet()) {
            mergedSceneSignals.putIfAbsent(entry.getKey(), entry.getValue());
        }
        reqVO.setSceneSignals(mergedSceneSignals);
    }

    private Map<String, String> buildVisionRecognitionEvidence(String status, int labelCount) {
        Map<String, String> evidence = new LinkedHashMap<>();
        evidence.put("visionRecognitionStatus", status);
        evidence.put("visionRecognitionModel", resolvedVisionModel());
        evidence.put("visionRecognitionLabelCount", String.valueOf(Math.max(labelCount, 0)));
        return evidence;
    }

    private String resolvedVisionModel() {
        return hasText(visionModel) ? visionModel : DEFAULT_MODEL;
    }

    private Map<String, String> extractVisionSceneSignals(JsonNode root, String caption) {
        Map<String, String> sceneSignals = new LinkedHashMap<>();
        JsonNode node = root.path("sceneSignals");
        for (String key : VISION_SCENE_SIGNAL_TEXT_KEYS) {
            putVisionSceneSignal(sceneSignals, node, key);
            putVisionSceneSignal(sceneSignals, root, key);
        }
        if (!sceneSignals.containsKey("sceneFusionSummary") && hasText(caption)) {
            sceneSignals.put("sceneFusionSummary", caption.trim());
        }
        return sceneSignals;
    }

    private void inferVisionSceneDomain(
            Set<String> labels, String caption, String ocrText, Map<String, String> sceneSignals) {
        if (sceneSignals.containsKey("sceneDomainIntentKey")) {
            return;
        }
        String text = normalizeDomainText(labels, caption, ocrText);
        for (SceneDomainRule rule : VISION_SCENE_DOMAIN_RULES) {
            if (containsAny(text, rule.keywords())) {
                sceneSignals.put("sceneDomainIntentKey", rule.key());
                sceneSignals.put("sceneDomainIntentLabel", rule.label());
                sceneSignals.put("sceneDomainIntentTitle", rule.title());
                sceneSignals.put("sceneDomainIntentCopy", rule.copy());
                return;
            }
        }
    }

    private String normalizeDomainText(Set<String> labels, String caption, String ocrText) {
        List<String> parts = new ArrayList<>();
        if (labels != null) {
            parts.addAll(labels);
        }
        if (hasText(caption)) {
            parts.add(caption);
        }
        if (hasText(ocrText)) {
            parts.add(ocrText);
        }
        return String.join(" ", parts).toLowerCase(Locale.ROOT);
    }

    private void putVisionSceneSignal(Map<String, String> sceneSignals, JsonNode node, String key) {
        if (node == null || node.isMissingNode() || node.isNull() || sceneSignals.containsKey(key)) {
            return;
        }
        String text = node.path(key).asText("").trim();
        if (hasText(text)) {
            sceneSignals.put(key, text);
        }
    }

    private String firstText(JsonNode root, String... keys) {
        for (String key : keys) {
            String text = root.path(key).asText("").trim();
            if (hasText(text)) {
                return text;
            }
        }
        return "";
    }

    private void appendLabels(JsonNode node, Set<String> labels) {
        if (node == null || !node.isArray()) {
            return;
        }
        for (JsonNode item : node) {
            String normalized = normalizeLabel(item.asText(""));
            if (hasText(normalized)) {
                labels.add(normalized);
            }
        }
    }

    private void addKeywordLabels(String content, Set<String> labels) {
        String normalized = content.toLowerCase(Locale.ROOT);
        if (containsAny(normalized, List.of("白塔", "妙应寺", "白塔寺", "white pagoda", "pagoda"))) {
            labels.add("white_pagoda");
            labels.add("temple");
        }
        if (containsAny(normalized, List.of("北海", "琼华岛", "皇家园林", "湖", "lake", "garden"))) {
            labels.add("lake");
            labels.add("imperial_garden");
        }
        if (containsAny(normalized, List.of("历代帝王庙", "帝王庙", "牌坊", "imperial temple"))) {
            labels.add("imperial_temple");
            labels.add("temple");
        }
        if (containsAny(normalized, List.of("什刹海", "后海", "前海", "胡同", "hutong"))) {
            labels.add("lake");
            labels.add("hutong");
        }
        if (containsAny(normalized, List.of("大栅栏", "前门", "老字号", "招牌", "dashilar", "qianmen"))) {
            labels.add("hutong");
            labels.add("shop_sign");
        }
    }

    private String extractChatContent(String responseBody) throws IOException {
        JsonNode root = JsonUtils.getObjectMapper().readTree(responseBody);
        return root.path("choices").path(0).path("message").path("content").asText("");
    }

    private String resolveChatCompletionsUrl(String apiUrl) {
        String trimmed = apiUrl == null ? "" : apiUrl.trim().replaceAll("/+$", "");
        return trimmed.endsWith("/chat/completions") ? trimmed : trimmed + "/chat/completions";
    }

    private String unwrapJson(String content) {
        String trimmed = content.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```[a-zA-Z]*\\s*", "");
            trimmed = trimmed.replaceFirst("\\s*```$", "");
        }
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        return start >= 0 && end > start ? trimmed.substring(start, end + 1) : trimmed;
    }

    private String normalizeLabel(String label) {
        return label == null ? "" : label.trim().toLowerCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
    }

    private boolean containsAny(String text, List<String> keywords) {
        return keywords.stream().anyMatch(text::contains);
    }

    private boolean isConfigured() {
        return hasText(visionApiUrl) && hasText(visionApiKey);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private record VisionRecognitionResult(List<String> labels, String ocrText, Map<String, String> sceneSignals) {

        private boolean isEmpty() {
            return labels.isEmpty() && !hasText(ocrText) && sceneSignals.isEmpty();
        }

        private static VisionRecognitionResult empty() {
            return new VisionRecognitionResult(List.of(), "", Map.of());
        }

        private static VisionRecognitionResult evidenceOnly(Map<String, String> evidence) {
            return new VisionRecognitionResult(List.of(), "", evidence);
        }

        private VisionRecognitionResult withEvidence(Map<String, String> evidence) {
            Map<String, String> mergedSceneSignals = new LinkedHashMap<>(sceneSignals);
            mergedSceneSignals.putAll(evidence);
            return new VisionRecognitionResult(labels, ocrText, mergedSceneSignals);
        }

        private static boolean hasText(String value) {
            return value != null && !value.isBlank();
        }

    }

    private record SceneDomainRule(String key, String label, String title, String copy, List<String> keywords) {
    }

}
