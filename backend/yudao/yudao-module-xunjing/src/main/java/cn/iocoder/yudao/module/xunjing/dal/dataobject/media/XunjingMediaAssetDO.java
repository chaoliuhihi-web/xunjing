package cn.iocoder.yudao.module.xunjing.dal.dataobject.media;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

@TableName("xunjing_media_asset")
@KeySequence("xunjing_media_asset_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingMediaAssetDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long packageId;
    private String title;
    private String mediaType;
    private String fileUrl;
    private String objectKey;
    private String sourceProvider;
    private String sourceUrl;
    private String copyrightStatus;
    private String reviewStatus;
    private String imageTags;
    private Boolean canPublic;
    private Boolean canAiUse;
    private Boolean canPromotionUse;

}
