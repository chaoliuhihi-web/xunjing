package cn.iocoder.yudao.module.xunjing.dal.mysql.event;

import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.event.XunjingInteractionEventDO;
import org.apache.ibatis.annotations.Mapper;

import java.util.Collection;
import java.util.List;

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

    default List<XunjingInteractionEventDO> selectListByPackageIdsAndEventType(
            Collection<Long> packageIds, String eventType) {
        if (packageIds == null || packageIds.isEmpty()) {
            return List.of();
        }
        return selectList(new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                .in(XunjingInteractionEventDO::getPackageId, packageIds)
                .eq(XunjingInteractionEventDO::getEventType, eventType)
                .orderByDesc(XunjingInteractionEventDO::getId));
    }

    default XunjingInteractionEventDO selectLatestByPackageIdAndUserTraceIdAndEventType(
            Long packageId, String userTraceId, String eventType) {
        if (packageId == null || userTraceId == null || userTraceId.isBlank()
                || eventType == null || eventType.isBlank()) {
            return null;
        }
        return selectOne(new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                .eq(XunjingInteractionEventDO::getPackageId, packageId)
                .eq(XunjingInteractionEventDO::getUserTraceId, userTraceId)
                .eq(XunjingInteractionEventDO::getEventType, eventType)
                .orderByDesc(XunjingInteractionEventDO::getId)
                .last("LIMIT 1"));
    }

    default List<XunjingInteractionEventDO> selectListByPackageIdAndUserTraceIdAndEventType(
            Long packageId, String userTraceId, String eventType) {
        if (packageId == null || userTraceId == null || userTraceId.isBlank()
                || eventType == null || eventType.isBlank()) {
            return List.of();
        }
        return selectList(new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                .eq(XunjingInteractionEventDO::getPackageId, packageId)
                .eq(XunjingInteractionEventDO::getUserTraceId, userTraceId)
                .eq(XunjingInteractionEventDO::getEventType, eventType)
                .orderByAsc(XunjingInteractionEventDO::getId));
    }

    default List<XunjingInteractionEventDO> selectListByPackageIdAndUserTraceIdAndEventTypes(
            Long packageId, String userTraceId, Collection<String> eventTypes) {
        if (packageId == null || userTraceId == null || userTraceId.isBlank()
                || eventTypes == null || eventTypes.isEmpty()) {
            return List.of();
        }
        return selectList(new LambdaQueryWrapperX<XunjingInteractionEventDO>()
                .eq(XunjingInteractionEventDO::getPackageId, packageId)
                .eq(XunjingInteractionEventDO::getUserTraceId, userTraceId)
                .in(XunjingInteractionEventDO::getEventType, eventTypes)
                .orderByAsc(XunjingInteractionEventDO::getId));
    }

}
