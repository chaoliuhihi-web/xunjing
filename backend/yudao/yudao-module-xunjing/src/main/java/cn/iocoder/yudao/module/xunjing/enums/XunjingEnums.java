package cn.iocoder.yudao.module.xunjing.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

public final class XunjingEnums {

    private XunjingEnums() {
    }

    @Getter
    @AllArgsConstructor
    public enum ProjectStatus {
        ACTIVE("ACTIVE"),
        ARCHIVED("ARCHIVED");

        private final String status;
    }

    @Getter
    @AllArgsConstructor
    public enum SchoolStatus {
        ACTIVE("ACTIVE"),
        PAUSED("PAUSED");

        private final String status;
    }

    @Getter
    @AllArgsConstructor
    public enum ResourceType {
        BOOK("BOOK"),
        MAP("MAP"),
        GLOBE("GLOBE");

        private final String type;
    }

    @Getter
    @AllArgsConstructor
    public enum PackageStatus {
        DRAFT("DRAFT"),
        PUBLISHED("PUBLISHED"),
        OFFLINE("OFFLINE");

        private final String status;
    }

    @Getter
    @AllArgsConstructor
    public enum SourceType {
        MANUAL("MANUAL"),
        CRAWLER("CRAWLER"),
        IMPORT("IMPORT");

        private final String type;
    }

    @Getter
    @AllArgsConstructor
    public enum AuthorityLevel {
        OFFICIAL("OFFICIAL"),
        VERIFIED("VERIFIED"),
        REFERENCE("REFERENCE");

        private final String level;
    }

    @Getter
    @AllArgsConstructor
    public enum ReviewStatus {
        PENDING("PENDING"),
        APPROVED("APPROVED"),
        REJECTED("REJECTED");

        private final String status;
    }

    @Getter
    @AllArgsConstructor
    public enum VectorStatus {
        PENDING("PENDING"),
        INDEXED("INDEXED"),
        FAILED("FAILED");

        private final String status;
    }

    @Getter
    @AllArgsConstructor
    public enum MediaType {
        IMAGE("IMAGE"),
        VIDEO("VIDEO"),
        MODEL("MODEL");

        private final String type;
    }

    @Getter
    @AllArgsConstructor
    public enum CopyrightStatus {
        AUTHORIZED("AUTHORIZED"),
        PENDING("PENDING"),
        RESTRICTED("RESTRICTED");

        private final String status;
    }

    @Getter
    @AllArgsConstructor
    public enum EventType {
        SCAN("SCAN"),
        VIEW("VIEW"),
        ASK("ASK"),
        TRIGGER_RESOLVE("TRIGGER_RESOLVE"),
        ERROR_FEEDBACK("ERROR_FEEDBACK"),
        SHARE("SHARE"),
        MEDIA_USE("MEDIA_USE");

        private final String type;
    }

    @Getter
    @AllArgsConstructor
    public enum QrCodeStatus {
        ACTIVE("ACTIVE"),
        DISABLED("DISABLED");

        private final String status;
    }

    @Getter
    @AllArgsConstructor
    public enum ReportStatus {
        GENERATED("GENERATED"),
        PUBLISHED("PUBLISHED");

        private final String status;
    }

    @Getter
    @AllArgsConstructor
    public enum CrawlerStatus {
        PENDING("PENDING"),
        APPROVED("APPROVED"),
        BLOCKED("BLOCKED");

        private final String status;
    }

    @Getter
    @AllArgsConstructor
    public enum ImportStatus {
        PENDING_REVIEW("PENDING_REVIEW"),
        IMPORTED("IMPORTED"),
        REJECTED("REJECTED");

        private final String status;
    }

    @Getter
    @AllArgsConstructor
    public enum AiEvalStatus {
        ACTIVE("ACTIVE"),
        ARCHIVED("ARCHIVED");

        private final String status;
    }

    @Getter
    @AllArgsConstructor
    public enum AiQuotaStatus {
        ACTIVE("ACTIVE"),
        PAUSED("PAUSED");

        private final String status;
    }

    @Getter
    @AllArgsConstructor
    public enum AiSafetyStatus {
        PASSED("PASSED"),
        REVIEW_REQUIRED("REVIEW_REQUIRED"),
        BLOCKED("BLOCKED");

        private final String status;
    }

}
