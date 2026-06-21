package cn.iocoder.yudao.module.xunjing.dal.dataobject.ai;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

@TableName("xunjing_ai_eval_case")
@KeySequence("xunjing_ai_eval_case_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingAiEvalCaseDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long evalSetId;
    private String question;
    private String expectedPolicy;
    private String riskTags;
    private Boolean sourceRequired;
    private String status;

}
