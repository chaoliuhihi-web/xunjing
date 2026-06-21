package cn.iocoder.yudao.module.xunjing.dal.dataobject.ai;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

@TableName("xunjing_ai_eval_set")
@KeySequence("xunjing_ai_eval_set_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingAiEvalSetDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long projectId;
    private String name;
    private String sceneCode;
    private String status;

}
