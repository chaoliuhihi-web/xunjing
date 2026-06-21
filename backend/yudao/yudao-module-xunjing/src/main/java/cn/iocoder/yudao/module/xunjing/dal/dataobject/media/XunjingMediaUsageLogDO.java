package cn.iocoder.yudao.module.xunjing.dal.dataobject.media;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

@TableName("xunjing_media_usage_log")
@KeySequence("xunjing_media_usage_log_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingMediaUsageLogDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long mediaId;
    private Long packageId;
    private String sceneCode;
    private String usageType;
    private String caller;
    private String payloadJson;

}
