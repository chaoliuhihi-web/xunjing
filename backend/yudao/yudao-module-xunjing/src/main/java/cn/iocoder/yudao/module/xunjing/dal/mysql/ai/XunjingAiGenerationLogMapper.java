package cn.iocoder.yudao.module.xunjing.dal.mysql.ai;

import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.ai.XunjingAiGenerationLogDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Mapper
public interface XunjingAiGenerationLogMapper extends BaseMapperX<XunjingAiGenerationLogDO> {

    default PageResult<XunjingAiGenerationLogDO> selectPage(ConsolePageReqVO reqVO) {
        return selectPage(reqVO, new LambdaQueryWrapperX<XunjingAiGenerationLogDO>()
                .eqIfPresent(XunjingAiGenerationLogDO::getProjectId, reqVO.getProjectId())
                .eqIfPresent(XunjingAiGenerationLogDO::getSchoolId, reqVO.getSchoolId())
                .eqIfPresent(XunjingAiGenerationLogDO::getPackageId, reqVO.getPackageId())
                .eqIfPresent(XunjingAiGenerationLogDO::getQrCodeId, reqVO.getQrCodeId())
                .eqIfPresent(XunjingAiGenerationLogDO::getSceneCode, reqVO.getSceneCode())
                .eqIfPresent(XunjingAiGenerationLogDO::getUserTraceId, reqVO.getUserTraceId())
                .eqIfPresent(XunjingAiGenerationLogDO::getSafetyStatus, reqVO.getSafetyStatus())
                .likeIfPresent(XunjingAiGenerationLogDO::getInputSummary, reqVO.getKeyword())
                .orderByDesc(XunjingAiGenerationLogDO::getId));
    }

    default Long selectCountByPackageIds(Collection<Long> packageIds) {
        if (packageIds == null || packageIds.isEmpty()) {
            return 0L;
        }
        return selectCount(new LambdaQueryWrapperX<XunjingAiGenerationLogDO>()
                .in(XunjingAiGenerationLogDO::getPackageId, packageIds));
    }

    default Long selectCountByPackageIdsAndSceneSinceAndSafetyStatus(
            Collection<Long> packageIds, String sceneCode, LocalDateTime beginTime, String safetyStatus) {
        if (packageIds == null || packageIds.isEmpty()) {
            return 0L;
        }
        return selectCount(new LambdaQueryWrapperX<XunjingAiGenerationLogDO>()
                .in(XunjingAiGenerationLogDO::getPackageId, packageIds)
                .eq(XunjingAiGenerationLogDO::getSceneCode, sceneCode)
                .ge(XunjingAiGenerationLogDO::getCreateTime, beginTime)
                .eq(XunjingAiGenerationLogDO::getSafetyStatus, safetyStatus));
    }

    default List<XunjingAiGenerationLogDO> selectListByQuotaScope(
            Collection<Long> packageIds, Long qrCodeId, String userTraceId, String sceneCode,
            LocalDateTime beginTime, String safetyStatus) {
        if (packageIds == null || packageIds.isEmpty()) {
            return List.of();
        }
        return selectList(new LambdaQueryWrapperX<XunjingAiGenerationLogDO>()
                .in(XunjingAiGenerationLogDO::getPackageId, packageIds)
                .eqIfPresent(XunjingAiGenerationLogDO::getQrCodeId, qrCodeId)
                .eqIfPresent(XunjingAiGenerationLogDO::getUserTraceId, userTraceId)
                .eq(XunjingAiGenerationLogDO::getSceneCode, sceneCode)
                .ge(XunjingAiGenerationLogDO::getCreateTime, beginTime)
                .eq(XunjingAiGenerationLogDO::getSafetyStatus, safetyStatus));
    }

    default BigDecimal selectCostSumByQuotaScope(
            Collection<Long> packageIds, Long qrCodeId, String userTraceId, String sceneCode,
            LocalDateTime beginTime, String safetyStatus) {
        return selectListByQuotaScope(packageIds, qrCodeId, userTraceId, sceneCode, beginTime, safetyStatus)
                .stream()
                .map(XunjingAiGenerationLogDO::getCostAmount)
                .filter(cost -> cost != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Select("""
            <script>
            SELECT COUNT(*)
            FROM xunjing_ai_generation_log
            WHERE deleted = 0
              AND tenant_id = #{tenantId}
              AND package_id IN
              <foreach collection="packageIds" item="packageId" open="(" separator="," close=")">
                #{packageId}
              </foreach>
              <if test="qrCodeId != null">
                AND qr_code_id = #{qrCodeId}
              </if>
              <if test="userTraceId != null and userTraceId != ''">
                AND user_trace_id = #{userTraceId}
              </if>
              AND scene_code = #{sceneCode}
              AND create_time &gt;= #{beginTime}
              AND safety_status = #{safetyStatus}
            </script>
            """)
    Long selectQuotaUsageCount(@Param("packageIds") Collection<Long> packageIds,
                               @Param("qrCodeId") Long qrCodeId,
                               @Param("userTraceId") String userTraceId,
                               @Param("sceneCode") String sceneCode,
                               @Param("beginTime") LocalDateTime beginTime,
                               @Param("safetyStatus") String safetyStatus,
                               @Param("tenantId") Long tenantId);

    @Select("""
            <script>
            SELECT COALESCE(SUM(cost_amount), 0)
            FROM xunjing_ai_generation_log
            WHERE deleted = 0
              AND tenant_id = #{tenantId}
              AND package_id IN
              <foreach collection="packageIds" item="packageId" open="(" separator="," close=")">
                #{packageId}
              </foreach>
              <if test="qrCodeId != null">
                AND qr_code_id = #{qrCodeId}
              </if>
              <if test="userTraceId != null and userTraceId != ''">
                AND user_trace_id = #{userTraceId}
              </if>
              AND scene_code = #{sceneCode}
              AND create_time &gt;= #{beginTime}
              AND safety_status = #{safetyStatus}
            </script>
            """)
    BigDecimal selectQuotaUsageCostSum(@Param("packageIds") Collection<Long> packageIds,
                                       @Param("qrCodeId") Long qrCodeId,
                                       @Param("userTraceId") String userTraceId,
                                       @Param("sceneCode") String sceneCode,
                                       @Param("beginTime") LocalDateTime beginTime,
                                       @Param("safetyStatus") String safetyStatus,
                                       @Param("tenantId") Long tenantId);

    default XunjingAiGenerationLogDO selectLatestCacheCandidate(
            Long packageId, Long qrCodeId, String userTraceId, String sceneCode, String inputSummary,
            LocalDateTime beginTime, String safetyStatus) {
        LambdaQueryWrapperX<XunjingAiGenerationLogDO> query = new LambdaQueryWrapperX<>();
        query.eq(XunjingAiGenerationLogDO::getPackageId, packageId)
                .eq(XunjingAiGenerationLogDO::getUserTraceId, userTraceId)
                .eq(XunjingAiGenerationLogDO::getSceneCode, sceneCode)
                .eq(XunjingAiGenerationLogDO::getInputSummary, inputSummary)
                .ge(XunjingAiGenerationLogDO::getCreateTime, beginTime)
                .eq(XunjingAiGenerationLogDO::getSafetyStatus, safetyStatus)
                .orderByDesc(XunjingAiGenerationLogDO::getId)
                .last("LIMIT 1");
        if (qrCodeId == null) {
            query.isNull(XunjingAiGenerationLogDO::getQrCodeId);
        } else {
            query.eq(XunjingAiGenerationLogDO::getQrCodeId, qrCodeId);
        }
        return selectOne(query);
    }

}
