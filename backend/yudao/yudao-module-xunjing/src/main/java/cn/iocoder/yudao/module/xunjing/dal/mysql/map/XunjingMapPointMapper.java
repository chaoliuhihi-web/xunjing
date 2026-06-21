package cn.iocoder.yudao.module.xunjing.dal.mysql.map;

import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.map.XunjingMapPointDO;
import org.apache.ibatis.annotations.Mapper;

import java.util.Collection;
import java.util.List;

@Mapper
public interface XunjingMapPointMapper extends BaseMapperX<XunjingMapPointDO> {

    default PageResult<XunjingMapPointDO> selectPage(ConsolePageReqVO reqVO) {
        return selectPage(reqVO, new LambdaQueryWrapperX<XunjingMapPointDO>()
                .eqIfPresent(XunjingMapPointDO::getPackageId, reqVO.getPackageId())
                .eqIfPresent(XunjingMapPointDO::getStatus, reqVO.getStatus())
                .likeIfPresent(XunjingMapPointDO::getTitle, reqVO.getKeyword())
                .orderByAsc(XunjingMapPointDO::getSortOrder)
                .orderByDesc(XunjingMapPointDO::getId));
    }

    default Long selectCountByPackageIds(Collection<Long> packageIds) {
        if (packageIds == null || packageIds.isEmpty()) {
            return 0L;
        }
        return selectCount(new LambdaQueryWrapperX<XunjingMapPointDO>()
                .in(XunjingMapPointDO::getPackageId, packageIds));
    }

    default List<XunjingMapPointDO> selectListByPackageId(Long packageId) {
        return selectList(new LambdaQueryWrapperX<XunjingMapPointDO>()
                .eq(XunjingMapPointDO::getPackageId, packageId)
                .orderByAsc(XunjingMapPointDO::getSortOrder)
                .orderByDesc(XunjingMapPointDO::getId));
    }

    default List<XunjingMapPointDO> selectPublicListByPackageId(Long packageId, String status) {
        return selectList(new LambdaQueryWrapperX<XunjingMapPointDO>()
                .eq(XunjingMapPointDO::getPackageId, packageId)
                .eq(XunjingMapPointDO::getStatus, status)
                .orderByAsc(XunjingMapPointDO::getSortOrder)
                .orderByDesc(XunjingMapPointDO::getId));
    }

}
