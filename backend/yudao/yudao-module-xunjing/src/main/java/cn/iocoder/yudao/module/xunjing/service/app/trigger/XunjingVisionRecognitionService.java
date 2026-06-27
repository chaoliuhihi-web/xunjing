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
        List<String> labels = recognizeImageLabels(reqVO);
        if (labels.isEmpty()) {
            return reqVO;
        }
        Set<String> mergedLabels = new LinkedHashSet<>();
        if (reqVO.getImageLabels() != null) {
            mergedLabels.addAll(reqVO.getImageLabels());
        }
        mergedLabels.addAll(labels);
        reqVO.setImageLabels(new ArrayList<>(mergedLabels));
        return reqVO;
    }

    private List<String> recognizeImageLabels(MultimodalTriggerReqVO reqVO) {
        PhotoMetaReqVO photoMeta = reqVO.getPhotoMeta();
        String imageBase64 = photoMeta == null ? "" : photoMeta.getImageBase64();
        if (photoMeta == null || !hasText(imageBase64) || !isConfigured()) {
            return List.of();
        }
        if (imageBase64.length() > MAX_IMAGE_BASE64_CHARS) {
            log.warn("[recognizeImageLabels][图片 base64 超过服务端上限，跳过视觉识别 imageId={}]", photoMeta.getImageId());
            return List.of();
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
                log.warn("[recognizeImageLabels][视觉识别调用失败 status={} imageId={}]", response.statusCode(),
                        photoMeta.getImageId());
                return List.of();
            }
            return extractVisionLabels(extractChatContent(response.body()));
        } catch (Exception ex) {
            log.warn("[recognizeImageLabels][视觉识别异常 imageId={} message={}]", photoMeta.getImageId(), ex.getMessage());
            return List.of();
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
                                                + "格式为 {\"labels\":[\"white_pagoda\"],\"caption\":\"一句中文描述\"}。"
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
        if (!hasText(content)) {
            return List.of();
        }
        Set<String> labels = new LinkedHashSet<>();
        extractJsonLabels(content, labels);
        addKeywordLabels(content, labels);
        return new ArrayList<>(labels);
    }

    private void extractJsonLabels(String content, Set<String> labels) {
        String json = unwrapJson(content);
        try {
            JsonNode root = JsonUtils.getObjectMapper().readTree(json);
            appendLabels(root.path("labels"), labels);
            appendLabels(root.path("imageLabels"), labels);
            appendLabels(root.path("objects"), labels);
            addKeywordLabels(root.path("caption").asText(""), labels);
        } catch (IOException ignored) {
            // 允许模型返回纯文本，继续走关键词兜底。
        }
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

}
