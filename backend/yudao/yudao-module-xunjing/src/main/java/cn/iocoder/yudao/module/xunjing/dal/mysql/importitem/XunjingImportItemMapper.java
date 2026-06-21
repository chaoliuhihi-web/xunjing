package cn.iocoder.yudao.module.xunjing.dal.mysql.importitem;

import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.importitem.XunjingImportItemDO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface XunjingImportItemMapper extends BaseMapperX<XunjingImportItemDO> {

    default PageResult<XunjingImportItemDO> selectPage(ConsolePageReqVO reqVO) {
        return selectPage(reqVO, new LambdaQueryWrapperX<XunjingImportItemDO>()
                .eqIfPresent(XunjingImportItemDO::getProjectId, reqVO.getProjectId())
                .eqIfPresent(XunjingImportItemDO::getPackageId, reqVO.getPackageId())
                .eqIfPresent(XunjingImportItemDO::getReviewStatus, reqVO.getReviewStatus())
                .eqIfPresent(XunjingImportItemDO::getStatus, reqVO.getStatus())
                .likeIfPresent(XunjingImportItemDO::getItemTitle, reqVO.getKeyword())
                .orderByDesc(XunjingImportItemDO::getId));
    }

    default Long selectCountByProjectIdAndReviewStatus(Long projectId, String reviewStatus) {
        return selectCount(new LambdaQueryWrapperX<XunjingImportItemDO>()
                .eq(XunjingImportItemDO::getProjectId, projectId)
                .eq(XunjingImportItemDO::getReviewStatus, reviewStatus));
    }

}
