package cn.iocoder.yudao.module.xunjing.dal.mysql.ai;

import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.ai.XunjingAiQuotaRuleDO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface XunjingAiQuotaRuleMapper extends BaseMapperX<XunjingAiQuotaRuleDO> {

    default PageResult<XunjingAiQuotaRuleDO> selectPage(ConsolePageReqVO reqVO) {
        return selectPage(reqVO, new LambdaQueryWrapperX<XunjingAiQuotaRuleDO>()
                .eqIfPresent(XunjingAiQuotaRuleDO::getProjectId, reqVO.getProjectId())
                .eqIfPresent(XunjingAiQuotaRuleDO::getScopeType, reqVO.getScopeType())
                .eqIfPresent(XunjingAiQuotaRuleDO::getSceneCode, reqVO.getSceneCode())
                .eqIfPresent(XunjingAiQuotaRuleDO::getStatus, reqVO.getStatus())
                .orderByDesc(XunjingAiQuotaRuleDO::getId));
    }

    default Long selectCountByProjectId(Long projectId) {
        return selectCount(new LambdaQueryWrapperX<XunjingAiQuotaRuleDO>()
                .eq(XunjingAiQuotaRuleDO::getProjectId, projectId));
    }

    default XunjingAiQuotaRuleDO selectByProjectIdAndSceneCodeAndStatus(
            Long projectId, String sceneCode, String status) {
        return selectOne(new LambdaQueryWrapperX<XunjingAiQuotaRuleDO>()
                .eq(XunjingAiQuotaRuleDO::getProjectId, projectId)
                .eq(XunjingAiQuotaRuleDO::getSceneCode, sceneCode)
                .eq(XunjingAiQuotaRuleDO::getStatus, status)
                .orderByDesc(XunjingAiQuotaRuleDO::getId)
                .last("LIMIT 1"));
    }

    default List<XunjingAiQuotaRuleDO> selectListByProjectIdAndSceneCodeAndStatus(
            Long projectId, String sceneCode, String status) {
        return selectList(new LambdaQueryWrapperX<XunjingAiQuotaRuleDO>()
                .eq(XunjingAiQuotaRuleDO::getProjectId, projectId)
                .eq(XunjingAiQuotaRuleDO::getSceneCode, sceneCode)
                .eq(XunjingAiQuotaRuleDO::getStatus, status)
                .orderByAsc(XunjingAiQuotaRuleDO::getId));
    }

}
