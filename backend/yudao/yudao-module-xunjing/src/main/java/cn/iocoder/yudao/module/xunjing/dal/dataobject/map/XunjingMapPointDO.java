package cn.iocoder.yudao.module.xunjing.dal.dataobject.map;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

import java.math.BigDecimal;

@TableName("xunjing_map_point")
@KeySequence("xunjing_map_point_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingMapPointDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long packageId;
    private String title;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String summary;
    private Integer sortOrder;
    private String status;

}
