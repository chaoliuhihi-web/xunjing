package cn.iocoder.yudao.module.xunjing.dal.dataobject.poi;

import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;
import com.baomidou.mybatisplus.annotation.KeySequence;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@TableName("xunjing_poi")
@KeySequence("xunjing_poi_seq")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XunjingPoiDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long packageId;
    private String poiCode;
    private String regionCode;
    private String name;
    private String officialName;
    private String aliasesJson;
    private String category;
    private String poiLevel;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String coordType;
    private String sourceJson;
    private String triggerJson;
    private String contentJson;
    private String reviewStatus;
    private String geoStatus;
    private String licenseStatus;
    private String status;

}
