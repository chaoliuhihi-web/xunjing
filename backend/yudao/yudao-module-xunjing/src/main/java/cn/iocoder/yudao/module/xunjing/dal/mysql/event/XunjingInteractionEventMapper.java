package cn.iocoder.yudao.module.xunjing.dal.mysql.event;

import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.event.XunjingInteractionEventDO;
import org.apache.ibatis.annotations.Mapper;

import java.util.Collection;

@Mapper
public interface XunjingInteractionEventMapper extends BaseMapperX<XunjingInteractionEventDO> {

    default Long selectCountByPackageIds(Collection<Long> packageIds) {
        if (packageIds == null || packageIds.isEmpty()) {
            return 0L;
        }
        return selectCount(new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                .in(XunjingInteractionEventDO::getPackageId, packageIds));
    }

    default Long selectCountByPackageIdsAndEventType(Collection<Long> packageIds, String eventType) {
        if (packageIds == null || packageIds.isEmpty()) {
            return 0L;
        }
        return selectCount(new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                .in(XunjingInteractionEventDO::getPackageId, packageIds)
                .eq(XunjingInteractionEventDO::getEventType, eventType));
    }

}
