package cn.iocoder.yudao.module.xunjing.dal.mysql.report;

import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.report.XunjingPublicReportDO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface XunjingPublicReportMapper extends BaseMapperX<XunjingPublicReportDO> {

    default XunjingPublicReportDO selectLatestByProjectId(Long projectId) {
        return selectOne(new LambdaQueryWrapperX<XunjingPublicReportDO>()
                .eq(XunjingPublicReportDO::getProjectId, projectId)
                .orderByDesc(XunjingPublicReportDO::getGeneratedAt)
                .orderByDesc(XunjingPublicReportDO::getId)
                .last("LIMIT 1"));
    }

}
