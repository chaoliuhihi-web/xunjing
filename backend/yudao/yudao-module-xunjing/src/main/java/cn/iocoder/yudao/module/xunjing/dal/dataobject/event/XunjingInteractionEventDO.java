package cn.iocoder.yudao.module.xunjing.dal.dataobject.event;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

@TableName("xunjing_interaction_event")
@KeySequence("xunjing_interaction_event_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingInteractionEventDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long packageId;
    private Long schoolId;
    private String eventType;
    private String sourceChannel;
    private String userTraceId;
    private String payloadJson;

}
