package cn.iocoder.yudao.module.xunjing.dal.mysql.qrcode;

import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.qrcode.XunjingQrCodeDO;
import org.apache.ibatis.annotations.Mapper;

import java.util.Collection;

@Mapper
public interface XunjingQrCodeMapper extends BaseMapperX<XunjingQrCodeDO> {

    default PageResult<XunjingQrCodeDO> selectPage(ConsolePageReqVO reqVO) {
        return selectPage(reqVO, new LambdaQueryWrapperX<XunjingQrCodeDO>()
                .eqIfPresent(XunjingQrCodeDO::getPackageId, reqVO.getPackageId())
                .eqIfPresent(XunjingQrCodeDO::getStatus, reqVO.getStatus())
                .likeIfPresent(XunjingQrCodeDO::getSceneCode, reqVO.getSceneCode())
                .likeIfPresent(XunjingQrCodeDO::getName, reqVO.getKeyword())
                .orderByDesc(XunjingQrCodeDO::getId));
    }

    default XunjingQrCodeDO selectBySceneCodeAndStatus(String sceneCode, String status) {
        return selectOne(new LambdaQueryWrapperX<XunjingQrCodeDO>()
                .eq(XunjingQrCodeDO::getSceneCode, sceneCode)
                .eq(XunjingQrCodeDO::getStatus, status));
    }

    default Long selectCountByPackageIds(Collection<Long> packageIds) {
        if (packageIds == null || packageIds.isEmpty()) {
            return 0L;
        }
        return selectCount(new LambdaQueryWrapperX<XunjingQrCodeDO>()
                .in(XunjingQrCodeDO::getPackageId, packageIds));
    }

    default Long selectScanCountByPackageIds(Collection<Long> packageIds) {
        if (packageIds == null || packageIds.isEmpty()) {
            return 0L;
        }
        return selectList(new LambdaQueryWrapperX<XunjingQrCodeDO>()
                .in(XunjingQrCodeDO::getPackageId, packageIds))
                .stream()
                .map(XunjingQrCodeDO::getScanCount)
                .filter(scanCount -> scanCount != null)
                .reduce(0L, Long::sum);
    }

}
