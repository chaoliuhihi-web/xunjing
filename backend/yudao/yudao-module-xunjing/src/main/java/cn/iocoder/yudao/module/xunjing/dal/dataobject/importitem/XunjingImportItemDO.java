package cn.iocoder.yudao.module.xunjing.dal.dataobject.importitem;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

@TableName("xunjing_import_item")
@KeySequence("xunjing_import_item_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingImportItemDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long sourceId;
    private Long projectId;
    private Long packageId;
    private String itemType;
    private String itemTitle;
    private String originalUrl;
    private String fileUrl;
    private String sourceProvider;
    private String evidenceText;
    private String targetType;
    private Long targetId;
    private String reviewStatus;
    private String status;

}
