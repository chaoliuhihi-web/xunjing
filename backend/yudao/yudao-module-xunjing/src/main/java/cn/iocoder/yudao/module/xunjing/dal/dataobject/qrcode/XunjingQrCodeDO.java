package cn.iocoder.yudao.module.xunjing.dal.dataobject.qrcode;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@TableName("xunjing_qrcode")
@KeySequence("xunjing_qrcode_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingQrCodeDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long packageId;
    private String name;
    private String sceneCode;
    private String path;
    private String targetType;
    private Long targetId;
    private Long scanCount;
    private String status;

}
