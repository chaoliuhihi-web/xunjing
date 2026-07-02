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
            "agentDecisionReasonSummary"
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
        if (photoMeta == null || !hasText(imageBase64) || !isConfigured()) {
            return VisionRecognitionResult.empty();
        }
        if (imageBase64.length() > MAX_IMAGE_BASE64_CHARS) {
            log.warn("[recognizeImage][图片 base64 超过服务端上限，跳过视觉识别 imageId={}]", photoMeta.getImageId());
            return VisionRecognitionResult.empty();
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
                return VisionRecognitionResult.empty();
            }
            return extractVisionResult(extractChatContent(response.body()));
        } catch (Exception ex) {
            log.warn("[recognizeImage][视觉识别异常 imageId={} message={}]", photoMeta.getImageId(), ex.getMessage());
            return VisionRecognitionResult.empty();
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
                                                + "\"sceneDomainIntentLabel\":\"建筑\"}}。"
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
        Map<String, String> sceneSignals = new LinkedHashMap<>();
        try {
            JsonNode root = JsonUtils.getObjectMapper().readTree(json);
            appendLabels(root.path("labels"), labels);
            appendLabels(root.path("imageLabels"), labels);
            appendLabels(root.path("objects"), labels);
            String caption = firstText(root, "caption", "description", "summary");
            ocrText = firstText(root, "ocrText", "ocr", "detectedText", "text");
            addKeywordLabels(caption, labels);
            addKeywordLabels(ocrText, labels);
            sceneSignals.putAll(extractVisionSceneSignals(root, caption));
        } catch (IOException ignored) {
            addKeywordLabels(content, labels);
        }
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

        private static boolean hasText(String value) {
            return value != null && !value.isBlank();
        }

    }

}
