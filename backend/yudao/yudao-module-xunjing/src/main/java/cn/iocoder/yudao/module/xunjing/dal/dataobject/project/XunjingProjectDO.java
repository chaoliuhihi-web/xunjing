package cn.iocoder.yudao.module.xunjing.dal.dataobject.project;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

@TableName("xunjing_project")
@KeySequence("xunjing_project_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingProjectDO extends TenantBaseDO {

    @TableId
    private Long id;
    private String code;
    private String name;
    private String regionName;
    private String phase;
    private String status;

}
