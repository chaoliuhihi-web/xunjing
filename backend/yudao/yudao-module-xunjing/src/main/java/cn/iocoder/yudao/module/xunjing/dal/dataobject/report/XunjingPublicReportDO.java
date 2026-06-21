package cn.iocoder.yudao.module.xunjing.dal.dataobject.report;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

import java.time.LocalDateTime;

@TableName("xunjing_public_report")
@KeySequence("xunjing_public_report_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingPublicReportDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long projectId;
    private Long schoolId;
    private String title;
    private String reportPeriod;
    private String metricsJson;
    private String status;
    private LocalDateTime generatedAt;

}
