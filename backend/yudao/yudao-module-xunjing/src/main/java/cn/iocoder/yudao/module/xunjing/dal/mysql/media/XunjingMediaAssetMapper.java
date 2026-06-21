package cn.iocoder.yudao.module.xunjing.dal.mysql.media;

import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.media.XunjingMediaAssetDO;
import org.apache.ibatis.annotations.Mapper;

import java.util.Collection;
import java.util.List;

@Mapper
public interface XunjingMediaAssetMapper extends BaseMapperX<XunjingMediaAssetDO> {

    default PageResult<XunjingMediaAssetDO> selectPage(ConsolePageReqVO reqVO) {
        return selectPage(reqVO, new LambdaQueryWrapperX<XunjingMediaAssetDO>()
                .eqIfPresent(XunjingMediaAssetDO::getPackageId, reqVO.getPackageId())
                .eqIfPresent(XunjingMediaAssetDO::getMediaType, reqVO.getMediaType())
                .eqIfPresent(XunjingMediaAssetDO::getReviewStatus, reqVO.getReviewStatus())
                .eqIfPresent(XunjingMediaAssetDO::getCopyrightStatus, reqVO.getCopyrightStatus())
                .likeIfPresent(XunjingMediaAssetDO::getTitle, reqVO.getKeyword())
                .orderByDesc(XunjingMediaAssetDO::getId));
    }

    default Long selectCountByPackageIdsAndReviewStatus(Collection<Long> packageIds, String reviewStatus) {
        if (packageIds == null || packageIds.isEmpty()) {
            return 0L;
        }
        return selectCount(new LambdaQueryWrapperX<XunjingMediaAssetDO>()
                .in(XunjingMediaAssetDO::getPackageId, packageIds)
                .eq(XunjingMediaAssetDO::getReviewStatus, reviewStatus));
    }

    default List<XunjingMediaAssetDO> selectListByPackageId(Long packageId) {
        return selectList(new LambdaQueryWrapperX<XunjingMediaAssetDO>()
                .eq(XunjingMediaAssetDO::getPackageId, packageId)
                .orderByDesc(XunjingMediaAssetDO::getId));
    }

    default List<XunjingMediaAssetDO> selectPublicListByPackageId(
            Long packageId, String reviewStatus, String copyrightStatus) {
        return selectList(new LambdaQueryWrapperX<XunjingMediaAssetDO>()
                .eq(XunjingMediaAssetDO::getPackageId, packageId)
                .eq(XunjingMediaAssetDO::getReviewStatus, reviewStatus)
                .eq(XunjingMediaAssetDO::getCopyrightStatus, copyrightStatus)
                .eq(XunjingMediaAssetDO::getCanPublic, true)
                .orderByDesc(XunjingMediaAssetDO::getId));
    }

}
