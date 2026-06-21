package cn.iocoder.yudao.module.xunjing.dal.mysql.media;

import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.media.XunjingMediaUsageLogDO;
import org.apache.ibatis.annotations.Mapper;

import java.util.Collection;

@Mapper
public interface XunjingMediaUsageLogMapper extends BaseMapperX<XunjingMediaUsageLogDO> {

    default PageResult<XunjingMediaUsageLogDO> selectPage(ConsolePageReqVO reqVO) {
        return selectPage(reqVO, new LambdaQueryWrapperX<XunjingMediaUsageLogDO>()
                .eqIfPresent(XunjingMediaUsageLogDO::getPackageId, reqVO.getPackageId())
                .eqIfPresent(XunjingMediaUsageLogDO::getSceneCode, reqVO.getSceneCode())
                .orderByDesc(XunjingMediaUsageLogDO::getId));
    }

    default Long selectCountByPackageIds(Collection<Long> packageIds) {
        if (packageIds == null || packageIds.isEmpty()) {
            return 0L;
        }
        return selectCount(new LambdaQueryWrapperX<XunjingMediaUsageLogDO>()
                .in(XunjingMediaUsageLogDO::getPackageId, packageIds));
    }

}
