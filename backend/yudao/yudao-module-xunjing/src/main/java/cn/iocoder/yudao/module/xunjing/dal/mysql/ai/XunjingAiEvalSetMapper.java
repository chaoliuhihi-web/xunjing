package cn.iocoder.yudao.module.xunjing.dal.mysql.ai;

import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.ai.XunjingAiEvalSetDO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface XunjingAiEvalSetMapper extends BaseMapperX<XunjingAiEvalSetDO> {

    default PageResult<XunjingAiEvalSetDO> selectPage(ConsolePageReqVO reqVO) {
        return selectPage(reqVO, new LambdaQueryWrapperX<XunjingAiEvalSetDO>()
                .eqIfPresent(XunjingAiEvalSetDO::getProjectId, reqVO.getProjectId())
                .eqIfPresent(XunjingAiEvalSetDO::getSceneCode, reqVO.getSceneCode())
                .eqIfPresent(XunjingAiEvalSetDO::getStatus, reqVO.getStatus())
                .likeIfPresent(XunjingAiEvalSetDO::getName, reqVO.getKeyword())
                .orderByDesc(XunjingAiEvalSetDO::getId));
    }

    default List<XunjingAiEvalSetDO> selectListByProjectId(Long projectId) {
        return selectList(new LambdaQueryWrapperX<XunjingAiEvalSetDO>()
                .eq(XunjingAiEvalSetDO::getProjectId, projectId));
    }

}
