package cn.iocoder.yudao.module.xunjing.controller.app.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

public class XunjingAppVO {

    @Data
    public static class ScanResolveReqVO {
        private String packageCode;
        private String sceneCode;
        private String userTraceId;
    }

    @Data
    public static class ScanResolveRespVO {
        private String packageCode;
        private String sceneCode;
        private String title;
        private String resourceType;
        private String targetPath;
    }

    @Data
    public static class RagChatReqVO {
        private String packageCode;
        private String question;
        private String sceneCode;
        private String qrSceneCode;
        private String sourceChannel;
        private String userTraceId;
    }

    @Data
    public static class AppInteractionEventReqVO {
        private String packageCode;
        private String sceneCode;
        private String eventType;
        private String sourceChannel;
        private String userTraceId;
        private String payloadJson;
    }

    @Data
    public static class MultimodalTriggerReqVO {
        private String regionCode;
        private String packageCode;
        private String sceneCode;
        private String sourceChannel;
        private String userTraceId;
        private String text;
        private String ocrText;
        private LocationPointReqVO location;
        private PhotoMetaReqVO photoMeta;
        private List<String> imageLabels;
        private List<String> recentPoiCodes;
    }

    @Data
    public static class LocationPointReqVO {
        private BigDecimal latitude;
        private BigDecimal longitude;
        private String coordType;
        private Integer accuracyMeters;
    }

    @Data
    public static class PhotoMetaReqVO {
        private String imageId;
        private String imageUrl;
        private String takenAt;
        private LocationPointReqVO exifLocation;
    }

    @Data
    public static class MultimodalTriggerRespVO {
        private String intent;
        private String action;
        private String triggerType;
        private String regionCode;
        private String poiCode;
        private String poiName;
        private Double confidence;
        private Boolean requiresUserConfirm;
        private String reason;
        private String targetPath;
        private List<MultimodalCandidateRespVO> candidates;
    }

    @Data
    public static class MultimodalCandidateRespVO {
        private String poiCode;
        private String poiName;
        private Double confidence;
        private Double distanceMeters;
        private String summary;
        private String targetPath;
        private List<String> matchedSignals;
    }

    @Data
    public static class AppPackageDetailRespVO {
        private Long id;
        private String packageCode;
        private String title;
        private String resourceType;
        private String versionNo;
        private List<AppKnowledgeDocumentRespVO> knowledgeDocuments;
        private List<AppMediaAssetRespVO> mediaAssets;
        private List<AppMapPointRespVO> mapPoints;
        private List<AppGlobeModelRespVO> globeModels;
    }

    @Data
    public static class AppKnowledgeDocumentRespVO {
        private Long id;
        private String title;
        private String sourceType;
        private String sourceUrl;
        private String contentDigest;
        private String authorityLevel;
    }

    @Data
    public static class AppMediaAssetRespVO {
        private Long id;
        private String title;
        private String mediaType;
        private String fileUrl;
        private String sourceProvider;
        private String sourceUrl;
        private String imageTags;
        private Boolean canPublic;
        private Boolean canAiUse;
        private Boolean canPromotionUse;
    }

    @Data
    public static class AppMapPointRespVO {
        private Long id;
        private String title;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private String summary;
        private Integer sortOrder;
    }

    @Data
    public static class AppGlobeModelRespVO {
        private Long id;
        private String title;
        private String modelUrl;
        private String coverUrl;
        private String dataVersion;
    }

    @Data
    public static class RagChatRespVO {
        private String answer;
        private String safetyStatus;
        private Long logId;
        private List<SourceRespVO> sources;
    }

    @Data
    public static class SourceRespVO {
        private Long id;
        private String title;
        private String sourceType;
        private String sourceUrl;
        private String contentDigest;
        private Double score;
    }

    @Data
    public static class PublicReportSummaryRespVO {
        private Long reportId;
        private Long projectId;
        private Long schoolId;
        private String title;
        private String reportPeriod;
        private String status;
        private Long packageCount;
        private Long reviewedKnowledgeCount;
        private Long reviewedMediaCount;
        private Long mapPointCount;
        private Long globeModelCount;
        private Long qrCodeCount;
        private Long interactionCount;
        private Long mediaUsageCount;
        private Long aiGenerationCount;
        private Boolean p0Ready;
    }

}
