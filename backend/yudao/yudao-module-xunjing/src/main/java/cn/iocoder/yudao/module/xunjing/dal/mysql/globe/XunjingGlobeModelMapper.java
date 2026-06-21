package cn.iocoder.yudao.module.xunjing.dal.mysql.globe;

import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.globe.XunjingGlobeModelDO;
import org.apache.ibatis.annotations.Mapper;

import java.util.Collection;
import java.util.List;

@Mapper
public interface XunjingGlobeModelMapper extends BaseMapperX<XunjingGlobeModelDO> {

    default PageResult<XunjingGlobeModelDO> selectPage(ConsolePageReqVO reqVO) {
        return selectPage(reqVO, new LambdaQueryWrapperX<XunjingGlobeModelDO>()
                .eqIfPresent(XunjingGlobeModelDO::getPackageId, reqVO.getPackageId())
                .eqIfPresent(XunjingGlobeModelDO::getStatus, reqVO.getStatus())
                .likeIfPresent(XunjingGlobeModelDO::getTitle, reqVO.getKeyword())
                .orderByDesc(XunjingGlobeModelDO::getId));
    }

    default Long selectCountByPackageIds(Collection<Long> packageIds) {
        if (packageIds == null || packageIds.isEmpty()) {
            return 0L;
        }
        return selectCount(new LambdaQueryWrapperX<XunjingGlobeModelDO>()
                .in(XunjingGlobeModelDO::getPackageId, packageIds));
    }

    default List<XunjingGlobeModelDO> selectListByPackageId(Long packageId) {
        return selectList(new LambdaQueryWrapperX<XunjingGlobeModelDO>()
                .eq(XunjingGlobeModelDO::getPackageId, packageId)
                .orderByDesc(XunjingGlobeModelDO::getId));
    }

    default List<XunjingGlobeModelDO> selectPublicListByPackageId(Long packageId, String status) {
        return selectList(new LambdaQueryWrapperX<XunjingGlobeModelDO>()
                .eq(XunjingGlobeModelDO::getPackageId, packageId)
                .eq(XunjingGlobeModelDO::getStatus, status)
                .orderByDesc(XunjingGlobeModelDO::getId));
    }

}
