package cn.iocoder.yudao.module.xunjing.dal.dataobject.globe;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

@TableName("xunjing_globe_model")
@KeySequence("xunjing_globe_model_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingGlobeModelDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long packageId;
    private String title;
    private String modelUrl;
    private String coverUrl;
    private String dataVersion;
    private String status;

}
