package cn.iocoder.yudao.module.xunjing.dal.mysql.poi;

import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.poi.XunjingPoiDO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface XunjingPoiMapper extends BaseMapperX<XunjingPoiDO> {

    default List<XunjingPoiDO> selectPublishedListByRegionCode(
            String regionCode, String status, String reviewStatus) {
        return selectList(new LambdaQueryWrapperX<XunjingPoiDO>()
                .eq(XunjingPoiDO::getRegionCode, regionCode)
                .eq(XunjingPoiDO::getStatus, status)
                .eq(XunjingPoiDO::getReviewStatus, reviewStatus)
                .orderByAsc(XunjingPoiDO::getPoiLevel)
                .orderByAsc(XunjingPoiDO::getId));
    }

}
