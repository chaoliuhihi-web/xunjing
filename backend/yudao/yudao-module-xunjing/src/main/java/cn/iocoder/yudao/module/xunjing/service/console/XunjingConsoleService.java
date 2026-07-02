package cn.iocoder.yudao.module.xunjing.service.console;

import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.GlobeModelCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AiEvalCaseCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AiEvalCaseRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AiEvalRunReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AiEvalRunRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AiEvalSetCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AiEvalSetRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AiGenerationLogCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AiGenerationLogRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AiQuotaRuleCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AiQuotaRuleRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.BatchReviewImportItemReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.CrawlerSourceCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.CrawlerSourceRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.CrawlerRunReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.CrawlerRunRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.DashboardSummaryRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ImportItemCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ImportItemRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.InteractionEventCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.KnowledgeDocumentCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.KnowledgeDocumentReviewReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.KnowledgeDocumentRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.KnowledgeDocumentUploadReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.MapPointCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.MapPointRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.MediaAssetCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.MediaAssetReviewReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.MediaAssetRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.MediaAssetUploadReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.MediaUsageCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.MediaUsageRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.GlobeModelRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.PackageDetailRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ProjectCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.PublicReportGenerateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.QrCodeCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.QrCodeRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.QrCodeStatusUpdateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ReadinessRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ReviewImportItemReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ResourcePackageCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ResourcePackageRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ResourcePackageUpdateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.SchoolCreateReqVO;

import java.util.List;

public interface XunjingConsoleService {

    Long createProject(ProjectCreateReqVO reqVO);

    Long createSchool(SchoolCreateReqVO reqVO);

    Long createResourcePackage(ResourcePackageCreateReqVO reqVO);

    PageResult<ResourcePackageRespVO> getResourcePackagePage(ConsolePageReqVO reqVO);

    void updateResourcePackage(ResourcePackageUpdateReqVO reqVO);

    Long addKnowledgeDocument(KnowledgeDocumentCreateReqVO reqVO);

    Long uploadKnowledgeDocument(KnowledgeDocumentUploadReqVO reqVO);

    PageResult<KnowledgeDocumentRespVO> getKnowledgeDocumentPage(ConsolePageReqVO reqVO);

    void reviewKnowledgeDocument(KnowledgeDocumentReviewReqVO reqVO);

    Long addMediaAsset(MediaAssetCreateReqVO reqVO);

    Long uploadMediaAsset(MediaAssetUploadReqVO reqVO);

    PageResult<MediaAssetRespVO> getMediaAssetPage(ConsolePageReqVO reqVO);

    void reviewMediaAsset(MediaAssetReviewReqVO reqVO);

    Long addMapPoint(MapPointCreateReqVO reqVO);

    PageResult<MapPointRespVO> getMapPointPage(ConsolePageReqVO reqVO);

    Long addGlobeModel(GlobeModelCreateReqVO reqVO);

    PageResult<GlobeModelRespVO> getGlobeModelPage(ConsolePageReqVO reqVO);

    Long recordInteraction(InteractionEventCreateReqVO reqVO);

    Long createQrCode(QrCodeCreateReqVO reqVO);

    QrCodeRespVO getQrCode(Long id);

    PageResult<QrCodeRespVO> getQrCodePage(ConsolePageReqVO reqVO);

    void updateQrCodeStatus(QrCodeStatusUpdateReqVO reqVO);

    Long createCrawlerSource(CrawlerSourceCreateReqVO reqVO);

    CrawlerSourceRespVO getCrawlerSource(Long id);

    PageResult<CrawlerSourceRespVO> getCrawlerSourcePage(ConsolePageReqVO reqVO);

    CrawlerRunRespVO runCrawlerSourceImport(CrawlerRunReqVO reqVO);

    Long createImportItem(ImportItemCreateReqVO reqVO);

    ImportItemRespVO getImportItem(Long id);

    PageResult<ImportItemRespVO> getImportItemPage(ConsolePageReqVO reqVO);

    Long reviewImportItem(ReviewImportItemReqVO reqVO);

    List<Long> batchReviewImportItems(BatchReviewImportItemReqVO reqVO);

    Long recordMediaUsage(MediaUsageCreateReqVO reqVO);

    MediaUsageRespVO getMediaUsage(Long id);

    PageResult<MediaUsageRespVO> getMediaUsagePage(ConsolePageReqVO reqVO);

    Long createAiEvalSet(AiEvalSetCreateReqVO reqVO);

    AiEvalSetRespVO getAiEvalSet(Long id);

    PageResult<AiEvalSetRespVO> getAiEvalSetPage(ConsolePageReqVO reqVO);

    Long addAiEvalCase(AiEvalCaseCreateReqVO reqVO);

    AiEvalCaseRespVO getAiEvalCase(Long id);

    PageResult<AiEvalCaseRespVO> getAiEvalCasePage(ConsolePageReqVO reqVO);

    AiEvalRunRespVO runAiEvalSet(AiEvalRunReqVO reqVO);

    Long createAiQuotaRule(AiQuotaRuleCreateReqVO reqVO);

    AiQuotaRuleRespVO getAiQuotaRule(Long id);

    PageResult<AiQuotaRuleRespVO> getAiQuotaRulePage(ConsolePageReqVO reqVO);

    Long recordAiGeneration(AiGenerationLogCreateReqVO reqVO);

    AiGenerationLogRespVO getAiGenerationLog(Long id);

    PageResult<AiGenerationLogRespVO> getAiGenerationLogPage(ConsolePageReqVO reqVO);

    ReadinessRespVO getReadiness(Long projectId);

    DashboardSummaryRespVO getDashboard(Long projectId);

    PackageDetailRespVO getPackageDetailByCode(String packageCode);

    PackageDetailRespVO getPublicPackageDetailByCode(String packageCode);

    Long generatePublicReport(PublicReportGenerateReqVO reqVO);

}
