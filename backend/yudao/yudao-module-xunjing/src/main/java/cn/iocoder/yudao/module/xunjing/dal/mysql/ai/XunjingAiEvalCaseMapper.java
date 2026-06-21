package cn.iocoder.yudao.module.xunjing.dal.mysql.ai;

import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.ai.XunjingAiEvalCaseDO;
import org.apache.ibatis.annotations.Mapper;

import java.util.Collection;
import java.util.List;

@Mapper
public interface XunjingAiEvalCaseMapper extends BaseMapperX<XunjingAiEvalCaseDO> {

    default PageResult<XunjingAiEvalCaseDO> selectPage(ConsolePageReqVO reqVO) {
        return selectPage(reqVO, new LambdaQueryWrapperX<XunjingAiEvalCaseDO>()
                .eqIfPresent(XunjingAiEvalCaseDO::getEvalSetId, reqVO.getEvalSetId())
                .eqIfPresent(XunjingAiEvalCaseDO::getStatus, reqVO.getStatus())
                .likeIfPresent(XunjingAiEvalCaseDO::getQuestion, reqVO.getKeyword())
                .orderByAsc(XunjingAiEvalCaseDO::getId));
    }

    default Long selectCountByEvalSetIds(Collection<Long> evalSetIds) {
        if (evalSetIds == null || evalSetIds.isEmpty()) {
            return 0L;
        }
        return selectCount(new LambdaQueryWrapperX<XunjingAiEvalCaseDO>()
                .in(XunjingAiEvalCaseDO::getEvalSetId, evalSetIds));
    }

    default List<XunjingAiEvalCaseDO> selectListByEvalSetIdAndStatus(Long evalSetId, String status) {
        return selectList(new LambdaQueryWrapperX<XunjingAiEvalCaseDO>()
                .eq(XunjingAiEvalCaseDO::getEvalSetId, evalSetId)
                .eq(XunjingAiEvalCaseDO::getStatus, status)
                .orderByAsc(XunjingAiEvalCaseDO::getId));
    }

}
