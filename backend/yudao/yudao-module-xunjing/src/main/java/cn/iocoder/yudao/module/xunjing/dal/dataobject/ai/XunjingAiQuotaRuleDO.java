package cn.iocoder.yudao.module.xunjing.dal.dataobject.ai;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

import java.math.BigDecimal;

@TableName("xunjing_ai_quota_rule")
@KeySequence("xunjing_ai_quota_rule_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingAiQuotaRuleDO extends TenantBaseDO {

    @TableId
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
