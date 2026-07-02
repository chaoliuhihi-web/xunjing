package cn.iocoder.yudao.module.xunjing.controller.admin.console.vo;

import cn.iocoder.yudao.framework.common.pojo.PageParam;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

public class XunjingConsoleVO {

    @Data
    public static class ConsolePageReqVO extends PageParam {
        private Long projectId;
        private Long schoolId;
        private Long packageId;
        private Long evalSetId;
        private Long qrCodeId;
        private String keyword;
        private String resourceType;
        private String mediaType;
        private String sourceType;
        private String scopeType;
        private String status;
        private String reviewStatus;
        private String vectorStatus;
        private String copyrightStatus;
        private String sceneCode;
        private String userTraceId;
        private String safetyStatus;
    }

    @Data
    public static class ProjectCreateReqVO {
        private String code;
        private String name;
        private String regionName;
        private String phase;
    }

    @Data
    public static class SchoolCreateReqVO {
        private String name;
        private String regionName;
        private String contactName;
        private String contactPhone;
    }

    @Data
    public static class ResourcePackageCreateReqVO {
        private Long projectId;
        private Long schoolId;
        private String packageCode;
        private String title;
        private String resourceType;
        private String versionNo;
        private Long aiKnowledgeId;
    }

    @Data
    public static class ResourcePackageRespVO {
        private Long id;
        private Long projectId;
        private Long schoolId;
        private String packageCode;
        private String title;
        private String resourceType;
        private String versionNo;
        private Long aiKnowledgeId;
        private String status;
    }

    @Data
    public static class ResourcePackageUpdateReqVO {
        private Long id;
        private String title;
        private String versionNo;
        private Long aiKnowledgeId;
        private String status;
    }

    @Data
    public static class KnowledgeDocumentCreateReqVO {
        private Long packageId;
        private String title;
        private String sourceType;
        private String sourceUrl;
        private String contentDigest;
        private String authorityLevel;
        private String reviewStatus;
        private String vectorStatus;
    }

    @Data
    public static class KnowledgeDocumentReviewReqVO {
        private Long id;
        private String authorityLevel;
        private String reviewStatus;
        private String vectorStatus;
    }

    @Data
    public static class MediaAssetCreateReqVO {
        private Long packageId;
        private String title;
        private String mediaType;
        private String fileUrl;
        private String objectKey;
        private String sourceProvider;
        private String sourceUrl;
        private String copyrightStatus;
        private String reviewStatus;
        private String imageTags;
        private Boolean canPublic;
        private Boolean canAiUse;
        private Boolean canPromotionUse;
    }

    @Data
    public static class MediaAssetReviewReqVO {
        private Long id;
        private String copyrightStatus;
        private String reviewStatus;
        private Boolean canPublic;
        private Boolean canAiUse;
        private Boolean canPromotionUse;
    }

    @Data
    public static class MapPointCreateReqVO {
        private Long packageId;
        private String title;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private String summary;
        private Integer sortOrder;
    }

    @Data
    public static class GlobeModelCreateReqVO {
        private Long packageId;
        private String title;
        private String modelUrl;
        private String coverUrl;
        private String dataVersion;
    }

    @Data
    public static class InteractionEventCreateReqVO {
        private Long packageId;
        private Long schoolId;
        private String eventType;
        private String sourceChannel;
        private String userTraceId;
        private String payloadJson;
    }

    @Data
    public static class QrCodeCreateReqVO {
        private Long packageId;
        private String name;
        private String sceneCode;
        private String path;
        private String targetType;
        private Long targetId;
    }

    @Data
    public static class QrCodeRespVO {
        private Long id;
        private Long packageId;
        private String name;
        private String sceneCode;
        private String path;
        private String targetType;
        private Long targetId;
        private Long scanCount;
        private String status;
    }

    @Data
    public static class QrCodeStatusUpdateReqVO {
        private Long id;
        private String status;
    }

    @Data
    public static class CrawlerSourceCreateReqVO {
        private Long projectId;
        private Long packageId;
        private String sourceUrl;
        private String sourceKind;
        private String connector;
        private Boolean captureAssets;
        private Boolean metadataOnly;
        private String notes;
    }

    @Data
    public static class CrawlerSourceRespVO {
        private Long id;
        private Long projectId;
        private Long packageId;
        private String sourceUrl;
        private String host;
        private String sourceKind;
        private String connector;
        private String sourceLane;
        private String captureProfile;
        private String factSourcePolicy;
        private Boolean captureAssets;
        private Boolean metadataOnly;
        private String status;
        private String blockedReasonHint;
        private String notes;
    }

    @Data
    public static class CrawlerRunReqVO {
        private Long sourceId;
        private List<CrawlerRunItemReqVO> items;
    }

    @Data
    public static class CrawlerRunItemReqVO {
        private String itemType;
        private String itemTitle;
        private String originalUrl;
        private String fileUrl;
        private String sourceProvider;
        private String evidenceText;
        private String targetType;
    }

    @Data
    public static class CrawlerRunRespVO {
        private Long sourceId;
        private String status;
        private Integer createdCount;
        private Integer knowledgeItemCount;
        private Integer mediaItemCount;
        private List<Long> importItemIds;
    }

    @Data
    public static class ImportItemCreateReqVO {
        private Long sourceId;
        private Long projectId;
        private Long packageId;
        private String itemType;
        private String itemTitle;
        private String originalUrl;
        private String fileUrl;
        private String sourceProvider;
        private String evidenceText;
        private String targetType;
        private Long targetId;
    }

    @Data
    public static class ImportItemRespVO {
        private Long id;
        private Long sourceId;
        private Long projectId;
        private Long packageId;
        private String itemType;
        private String itemTitle;
        private String originalUrl;
        private String fileUrl;
        private String sourceProvider;
        private String evidenceText;
        private String targetType;
        private Long targetId;
        private String reviewStatus;
        private String status;
    }

    @Data
    public static class ReviewImportItemReqVO {
        private Long id;
        private String reviewStatus;
        private String authorityLevel;
        private String vectorStatus;
        private String rejectReason;
    }

    @Data
    public static class BatchReviewImportItemReqVO {
        private List<Long> ids;
        private String reviewStatus;
        private String authorityLevel;
        private String vectorStatus;
        private String rejectReason;
    }

    @Data
    public static class MediaUsageCreateReqVO {
        private Long mediaId;
        private Long packageId;
        private String sceneCode;
        private String usageType;
        private String caller;
        private String payloadJson;
    }

    @Data
    public static class MediaUsageRespVO {
        private Long id;
        private Long mediaId;
        private Long packageId;
        private String sceneCode;
        private String usageType;
        private String caller;
        private String payloadJson;
    }

    @Data
    public static class AiEvalSetCreateReqVO {
        private Long projectId;
        private String name;
        private String sceneCode;
    }

    @Data
    public static class AiEvalSetRespVO {
        private Long id;
        private Long projectId;
        private String name;
        private String sceneCode;
        private String status;
    }

    @Data
    public static class AiEvalCaseCreateReqVO {
        private Long evalSetId;
        private String question;
        private String expectedPolicy;
        private String riskTags;
        private Boolean sourceRequired;
    }

    @Data
    public static class AiEvalCaseRespVO {
        private Long id;
        private Long evalSetId;
        private String question;
        private String expectedPolicy;
        private String riskTags;
        private Boolean sourceRequired;
        private String status;
    }

    @Data
    public static class AiEvalRunReqVO {
        private Long evalSetId;
        private String packageCode;
        private String qrSceneCode;
        private String userTraceId;
    }

    @Data
    public static class AiEvalRunRespVO {
        private Long evalSetId;
        private Long projectId;
        private String sceneCode;
        private Integer totalCount;
        private Integer passedCount;
        private Integer failedCount;
        private Boolean passed;
        private List<AiEvalRunCaseRespVO> results;
    }

    @Data
    public static class AiEvalRunCaseRespVO {
        private Long caseId;
        private String question;
        private Boolean passed;
        private String safetyStatus;
        private Integer sourceCount;
        private Long logId;
        private String answer;
        private String failureReason;
    }

    @Data
    public static class AiQuotaRuleCreateReqVO {
        private Long projectId;
        private String scopeType;
        private Long scopeId;
        private String sceneCode;
        private Integer dailyLimit;
        private BigDecimal monthlyBudget;
        private Boolean cacheEnabled;
        private String fallbackModelCode;
    }

    @Data
    public static class AiQuotaRuleRespVO {
        private Long id;
        private Long projectId;
        private String scopeType;
        private Long scopeId;
        private String sceneCode;
        private Integer dailyLimit;
        private BigDecimal monthlyBudget;
        private Boolean cacheEnabled;
        private String fallbackModelCode;
        private String status;
    }

    @Data
    public static class AiGenerationLogCreateReqVO {
        private Long projectId;
        private Long schoolId;
        private Long packageId;
        private Long qrCodeId;
        private String sceneCode;
        private String userTraceId;
        private String modelCode;
        private String promptVersion;
        private String inputSummary;
        private String outputSummary;
        private String sourceJson;
        private Long tokenCount;
        private BigDecimal costAmount;
        private String safetyStatus;
        private Boolean cacheHit;
    }

    @Data
    public static class AiGenerationLogRespVO {
        private Long id;
        private Long projectId;
        private Long schoolId;
        private Long packageId;
        private Long qrCodeId;
        private String sceneCode;
        private String userTraceId;
        private String modelCode;
        private String promptVersion;
        private String inputSummary;
        private String outputSummary;
        private String sourceJson;
        private Long tokenCount;
        private BigDecimal costAmount;
        private String safetyStatus;
        private Boolean cacheHit;
    }

    @Data
    public static class PublicReportGenerateReqVO {
        private Long projectId;
        private Long schoolId;
        private String reportPeriod;
        private String title;
    }

    @Data
    public static class ReadinessRespVO {
        private Long packageCount;
        private Long reviewedKnowledgeCount;
        private Long reviewedMediaCount;
        private Long mapPointCount;
        private Long globeModelCount;
        private Long qrCodeCount;
        private Long interactionCount;
        private Long triggerResolveCount;
        private Long agentActionCount;
        private BigDecimal agentActionConversionRate;
        private Long mediaUsageCount;
        private Long aiEvalCaseCount;
        private Long quotaRuleCount;
        private Long aiGenerationCount;
        private Long pendingImportItemCount;
        private Boolean p0Ready;
    }

    @Data
    public static class AgentActionMetricRespVO {
        private String actionKey;
        private String title;
        private String intent;
        private String poiCode;
        private String poiName;
        private Long executionCount;
        private BigDecimal shareRate;
    }

    @Data
    public static class AgentActionPoiFunnelRespVO {
        private String poiCode;
        private String poiName;
        private Long triggerResolveCount;
        private Long agentActionCount;
        private BigDecimal conversionRate;
    }

    @Data
    public static class AgentActionTimeWindowRespVO {
        private String windowKey;
        private String windowLabel;
        private Long triggerResolveCount;
        private Long agentActionCount;
        private BigDecimal conversionRate;
    }

    @Data
    public static class DashboardSummaryRespVO {
        private Long projectId;
        private Long packageCount;
        private Long reviewedKnowledgeCount;
        private Long reviewedMediaCount;
        private Long mapPointCount;
        private Long globeModelCount;
        private Long qrCodeCount;
        private Long totalScanCount;
        private Long totalAskCount;
        private Long totalTriggerResolveCount;
        private Long totalAgentActionCount;
        private BigDecimal agentActionConversionRate;
        private List<AgentActionMetricRespVO> topAgentActions;
        private List<AgentActionPoiFunnelRespVO> agentActionPoiFunnels;
        private List<AgentActionTimeWindowRespVO> agentActionTimeWindows;
        private Long mediaUsageCount;
        private Long aiGenerationCount;
        private Long pendingImportItemCount;
        private Boolean p0Ready;
        private Long latestReportId;
        private String latestReportTitle;
        private String latestReportPeriod;
    }

    @Data
    public static class PackageDetailRespVO {
        private Long id;
        private Long projectId;
        private Long schoolId;
        private String packageCode;
        private String title;
        private String resourceType;
        private String versionNo;
        private Long aiKnowledgeId;
        private String status;
        private List<KnowledgeDocumentRespVO> knowledgeDocuments;
        private List<MediaAssetRespVO> mediaAssets;
        private List<MapPointRespVO> mapPoints;
        private List<GlobeModelRespVO> globeModels;
    }

    @Data
    public static class KnowledgeDocumentRespVO {
        private Long id;
        private String title;
        private String sourceType;
        private String sourceUrl;
        private String contentDigest;
        private String authorityLevel;
        private String reviewStatus;
        private String vectorStatus;
    }

    @Data
    public static class MediaAssetRespVO {
        private Long id;
        private String title;
        private String mediaType;
        private String fileUrl;
        private String objectKey;
        private String sourceProvider;
        private String sourceUrl;
        private String copyrightStatus;
        private String reviewStatus;
        private String imageTags;
        private Boolean canPublic;
        private Boolean canAiUse;
        private Boolean canPromotionUse;
    }

    @Data
    public static class MapPointRespVO {
        private Long id;
        private String title;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private String summary;
        private Integer sortOrder;
        private String status;
    }

    @Data
    public static class GlobeModelRespVO {
        private Long id;
        private String title;
        private String modelUrl;
        private String coverUrl;
        private String dataVersion;
        private String status;
    }

}
