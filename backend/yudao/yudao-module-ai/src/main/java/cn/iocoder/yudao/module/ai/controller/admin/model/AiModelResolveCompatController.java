package cn.iocoder.yudao.module.ai.controller.admin.model;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.module.ai.dal.dataobject.model.AiApiKeyDO;
import cn.iocoder.yudao.module.ai.dal.dataobject.model.AiModelDO;
import cn.iocoder.yudao.module.ai.enums.model.AiModelTypeEnum;
import cn.iocoder.yudao.module.ai.service.model.AiApiKeyService;
import cn.iocoder.yudao.module.ai.service.model.AiModelService;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Tag(name = "管理后台 - AI 模型解析（兼容接口）")
@RestController
@RequestMapping("/ai/model")
@Validated
public class AiModelResolveCompatController {

    @Resource
    private AiModelService modelService;
    @Resource
    private AiApiKeyService apiKeyService;

    @PostMapping("/resolve")
    @Operation(summary = "兼容 XingheAI 的模型解析接口")
    public CommonResult<Map<String, Object>> resolve(@Valid @RequestBody ResolveReqVO reqVO) {
        Integer modelType = toModelType(reqVO.getModelType());
        if (modelType == null) {
            return CommonResult.error(400, "unsupported model_type: " + reqVO.getModelType());
        }

        AiModelDO model = modelService.getRequiredDefaultModel(modelType);
        AiApiKeyDO apiKey = apiKeyService.validateApiKey(model.getKeyId());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("model_type", reqVO.getModelType());
        data.put("tenant_id", reqVO.getTenantId());
        data.put("project_id", reqVO.getProjectId());
        data.put("platform", apiKey.getPlatform());
        data.put("provider", apiKey.getPlatform());
        data.put("model", model.getModel());
        data.put("model_id", model.getId());
        data.put("key_id", apiKey.getId());
        data.put("api_base_url", apiKey.getUrl());
        data.put("api_key", apiKey.getApiKey());
        data.put("type", model.getType());
        data.put("temperature", model.getTemperature());
        data.put("max_tokens", model.getMaxTokens());
        data.put("max_contexts", model.getMaxContexts());
        return CommonResult.success(data);
    }

    private static Integer toModelType(String raw) {
        String normalized = raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
        if ("llm".equals(normalized) || "llm_generate".equals(normalized) || "chat".equals(normalized)) {
            return AiModelTypeEnum.CHAT.getType();
        }
        if ("embedding".equals(normalized) || "embed".equals(normalized) || "llm_embed".equals(normalized)) {
            return AiModelTypeEnum.EMBEDDING.getType();
        }
        return null;
    }

    @Schema(description = "模型解析请求")
    @Data
    public static class ResolveReqVO {
        @Schema(description = "模型类型", requiredMode = Schema.RequiredMode.REQUIRED, example = "llm")
        @NotBlank(message = "model_type is required")
        @JsonProperty("model_type")
        @JsonAlias({"modelType"})
        private String modelType;

        @Schema(description = "租户编号", example = "1")
        @JsonProperty("tenant_id")
        @JsonAlias({"tenantId"})
        private String tenantId;

        @Schema(description = "项目编号", example = "project-demo")
        @JsonProperty("project_id")
        @JsonAlias({"projectId"})
        private String projectId;
    }
}
