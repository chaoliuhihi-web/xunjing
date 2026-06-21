package cn.iocoder.yudao.module.xunjing.dal.dataobject.ai;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

import java.math.BigDecimal;

@TableName("xunjing_ai_generation_log")
@KeySequence("xunjing_ai_generation_log_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingAiGenerationLogDO extends TenantBaseDO {

    @TableId
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
