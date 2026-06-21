package cn.iocoder.yudao.module.xunjing.dal.dataobject.packagepkg;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

import java.time.LocalDateTime;

@TableName("xunjing_resource_package")
@KeySequence("xunjing_resource_package_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingResourcePackageDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long projectId;
    private Long schoolId;
    private String packageCode;
    private String title;
    private String resourceType;
    private String versionNo;
    private Long aiKnowledgeId;
    private String status;
    private LocalDateTime publishedAt;

}
