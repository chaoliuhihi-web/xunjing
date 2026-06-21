package cn.iocoder.yudao.module.xunjing.dal.dataobject.crawler;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

@TableName("xunjing_crawler_source")
@KeySequence("xunjing_crawler_source_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingCrawlerSourceDO extends TenantBaseDO {

    @TableId
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
