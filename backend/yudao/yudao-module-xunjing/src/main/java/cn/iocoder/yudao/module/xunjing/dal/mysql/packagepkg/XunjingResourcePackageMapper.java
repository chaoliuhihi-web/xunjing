package cn.iocoder.yudao.module.xunjing.dal.mysql.packagepkg;

import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.packagepkg.XunjingResourcePackageDO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface XunjingResourcePackageMapper extends BaseMapperX<XunjingResourcePackageDO> {

    default PageResult<XunjingResourcePackageDO> selectPage(ConsolePageReqVO reqVO) {
        return selectPage(reqVO, new LambdaQueryWrapperX<XunjingResourcePackageDO>()
                .eqIfPresent(XunjingResourcePackageDO::getProjectId, reqVO.getProjectId())
                .eqIfPresent(XunjingResourcePackageDO::getSchoolId, reqVO.getSchoolId())
                .eqIfPresent(XunjingResourcePackageDO::getResourceType, reqVO.getResourceType())
                .eqIfPresent(XunjingResourcePackageDO::getStatus, reqVO.getStatus())
                .likeIfPresent(XunjingResourcePackageDO::getTitle, reqVO.getKeyword())
                .orderByDesc(XunjingResourcePackageDO::getId));
    }

    default List<XunjingResourcePackageDO> selectListByProjectId(Long projectId) {
        return selectList(new LambdaQueryWrapperX<XunjingResourcePackageDO>()
                .eq(XunjingResourcePackageDO::getProjectId, projectId)
                .orderByDesc(XunjingResourcePackageDO::getId));
    }

    default List<XunjingResourcePackageDO> selectListByProjectIdAndSchoolId(Long projectId, Long schoolId) {
        return selectList(new LambdaQueryWrapperX<XunjingResourcePackageDO>()
                .eq(XunjingResourcePackageDO::getProjectId, projectId)
                .eq(XunjingResourcePackageDO::getSchoolId, schoolId)
                .orderByDesc(XunjingResourcePackageDO::getId));
    }

    default XunjingResourcePackageDO selectByPackageCode(String packageCode) {
        return selectOne(XunjingResourcePackageDO::getPackageCode, packageCode);
    }

    default XunjingResourcePackageDO selectByPackageCodeAndStatus(String packageCode, String status) {
        return selectOne(new LambdaQueryWrapperX<XunjingResourcePackageDO>()
                .eq(XunjingResourcePackageDO::getPackageCode, packageCode)
                .eq(XunjingResourcePackageDO::getStatus, status));
    }

    default XunjingResourcePackageDO selectByIdAndStatus(Long id, String status) {
        return selectOne(new LambdaQueryWrapperX<XunjingResourcePackageDO>()
                .eq(XunjingResourcePackageDO::getId, id)
                .eq(XunjingResourcePackageDO::getStatus, status));
    }

}
