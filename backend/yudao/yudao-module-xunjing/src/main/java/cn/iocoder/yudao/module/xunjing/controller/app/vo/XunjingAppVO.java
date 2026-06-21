package cn.iocoder.yudao.module.xunjing.controller.app.vo;

import lombok.Data;

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
