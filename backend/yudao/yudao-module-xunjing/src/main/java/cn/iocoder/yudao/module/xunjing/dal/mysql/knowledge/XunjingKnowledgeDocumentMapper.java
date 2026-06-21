package cn.iocoder.yudao.module.xunjing.dal.mysql.knowledge;

import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.knowledge.XunjingKnowledgeDocumentDO;
import org.apache.ibatis.annotations.Mapper;

import java.util.Collection;
import java.util.List;

@Mapper
public interface XunjingKnowledgeDocumentMapper extends BaseMapperX<XunjingKnowledgeDocumentDO> {

    default PageResult<XunjingKnowledgeDocumentDO> selectPage(ConsolePageReqVO reqVO) {
        return selectPage(reqVO, new LambdaQueryWrapperX<XunjingKnowledgeDocumentDO>()
                .eqIfPresent(XunjingKnowledgeDocumentDO::getPackageId, reqVO.getPackageId())
                .eqIfPresent(XunjingKnowledgeDocumentDO::getSourceType, reqVO.getSourceType())
                .eqIfPresent(XunjingKnowledgeDocumentDO::getReviewStatus, reqVO.getReviewStatus())
                .eqIfPresent(XunjingKnowledgeDocumentDO::getVectorStatus, reqVO.getVectorStatus())
                .likeIfPresent(XunjingKnowledgeDocumentDO::getTitle, reqVO.getKeyword())
                .orderByDesc(XunjingKnowledgeDocumentDO::getId));
    }

    default Long selectCountByPackageIdsAndReviewStatus(Collection<Long> packageIds, String reviewStatus) {
        if (packageIds == null || packageIds.isEmpty()) {
            return 0L;
        }
        return selectCount(new LambdaQueryWrapperX<XunjingKnowledgeDocumentDO>()
                .in(XunjingKnowledgeDocumentDO::getPackageId, packageIds)
                .eq(XunjingKnowledgeDocumentDO::getReviewStatus, reviewStatus));
    }

    default List<XunjingKnowledgeDocumentDO> selectListByPackageId(Long packageId) {
        return selectList(new LambdaQueryWrapperX<XunjingKnowledgeDocumentDO>()
                .eq(XunjingKnowledgeDocumentDO::getPackageId, packageId)
                .orderByDesc(XunjingKnowledgeDocumentDO::getId));
    }

    default List<XunjingKnowledgeDocumentDO> selectPublicListByPackageId(
            Long packageId, String reviewStatus, String vectorStatus) {
        return selectList(new LambdaQueryWrapperX<XunjingKnowledgeDocumentDO>()
                .eq(XunjingKnowledgeDocumentDO::getPackageId, packageId)
                .eq(XunjingKnowledgeDocumentDO::getReviewStatus, reviewStatus)
                .eq(XunjingKnowledgeDocumentDO::getVectorStatus, vectorStatus)
                .orderByDesc(XunjingKnowledgeDocumentDO::getId));
    }

}
