package cn.iocoder.yudao.module.xunjing.dal.dataobject.school;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

@TableName("xunjing_school")
@KeySequence("xunjing_school_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingSchoolDO extends TenantBaseDO {

    @TableId
    private Long id;
    private String name;
    private String regionName;
    private String contactName;
    private String contactPhone;
    private String status;

}
