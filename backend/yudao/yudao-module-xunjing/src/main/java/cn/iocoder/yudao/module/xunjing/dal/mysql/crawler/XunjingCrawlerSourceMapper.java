package cn.iocoder.yudao.module.xunjing.dal.mysql.crawler;

import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.crawler.XunjingCrawlerSourceDO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface XunjingCrawlerSourceMapper extends BaseMapperX<XunjingCrawlerSourceDO> {

    default PageResult<XunjingCrawlerSourceDO> selectPage(ConsolePageReqVO reqVO) {
        return selectPage(reqVO, new LambdaQueryWrapperX<XunjingCrawlerSourceDO>()
                .eqIfPresent(XunjingCrawlerSourceDO::getProjectId, reqVO.getProjectId())
                .eqIfPresent(XunjingCrawlerSourceDO::getPackageId, reqVO.getPackageId())
                .eqIfPresent(XunjingCrawlerSourceDO::getConnector, reqVO.getSourceType())
                .eqIfPresent(XunjingCrawlerSourceDO::getStatus, reqVO.getStatus())
                .likeIfPresent(XunjingCrawlerSourceDO::getSourceUrl, reqVO.getKeyword())
                .orderByDesc(XunjingCrawlerSourceDO::getId));
    }

}
