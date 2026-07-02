package cn.iocoder.yudao.module.xunjing.controller.admin.console;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.framework.common.pojo.PageResult;
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
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.GlobeModelCreateReqVO;
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
import cn.iocoder.yudao.module.xunjing.service.console.XunjingConsoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;

@Tag(name = "管理后台 - 星河寻境工作台")
@RestController
@RequestMapping("/xunjing/console")
@Validated
public class XunjingConsoleController {

    @Resource
    private XunjingConsoleService consoleService;

    @PostMapping("/projects")
    @Operation(summary = "创建星河寻境项目")
    @PreAuthorize("@ss.hasPermission('xunjing:project:create')")
    public CommonResult<Long> createProject(@Valid @RequestBody ProjectCreateReqVO reqVO) {
        return success(consoleService.createProject(reqVO));
    }

    @PostMapping("/schools")
    @Operation(summary = "创建学校")
    @PreAuthorize("@ss.hasPermission('xunjing:school:create')")
    public CommonResult<Long> createSchool(@Valid @RequestBody SchoolCreateReqVO reqVO) {
        return success(consoleService.createSchool(reqVO));
    }

    @PostMapping("/resource-packages")
    @Operation(summary = "创建实体资源包")
    @PreAuthorize("@ss.hasPermission('xunjing:resource-package:create')")
    public CommonResult<Long> createResourcePackage(@Valid @RequestBody ResourcePackageCreateReqVO reqVO) {
        return success(consoleService.createResourcePackage(reqVO));
    }

    @GetMapping("/resource-packages/page")
    @Operation(summary = "分页查询实体资源包")
    @PreAuthorize("@ss.hasPermission('xunjing:resource-package:query')")
    public CommonResult<PageResult<ResourcePackageRespVO>> getResourcePackagePage(@Valid ConsolePageReqVO reqVO) {
        return success(consoleService.getResourcePackagePage(reqVO));
    }

    @PutMapping("/resource-packages")
    @Operation(summary = "更新实体资源包")
    @PreAuthorize("@ss.hasPermission('xunjing:resource-package:update')")
    public CommonResult<Boolean> updateResourcePackage(@Valid @RequestBody ResourcePackageUpdateReqVO reqVO) {
        consoleService.updateResourcePackage(reqVO);
        return success(true);
    }

    @PostMapping("/knowledge-documents")
    @Operation(summary = "新增知识库文档")
    @PreAuthorize("@ss.hasPermission('xunjing:knowledge:create')")
    public CommonResult<Long> addKnowledgeDocument(@Valid @RequestBody KnowledgeDocumentCreateReqVO reqVO) {
        return success(consoleService.addKnowledgeDocument(reqVO));
    }

    @PostMapping(value = "/knowledge-documents/upload",
            consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "上传文旅知识库文档")
    @PreAuthorize("@ss.hasPermission('xunjing:knowledge:create')")
    public CommonResult<Long> uploadKnowledgeDocument(@Valid KnowledgeDocumentUploadReqVO reqVO) {
        return success(consoleService.uploadKnowledgeDocument(reqVO));
    }

    @GetMapping("/knowledge-documents/page")
    @Operation(summary = "分页查询知识库文档")
    @PreAuthorize("@ss.hasPermission('xunjing:knowledge:query')")
    public CommonResult<PageResult<KnowledgeDocumentRespVO>> getKnowledgeDocumentPage(@Valid ConsolePageReqVO reqVO) {
        return success(consoleService.getKnowledgeDocumentPage(reqVO));
    }

    @PostMapping("/knowledge-documents/review")
    @Operation(summary = "审核知识库文档")
    @PreAuthorize("@ss.hasPermission('xunjing:knowledge:review')")
    public CommonResult<Boolean> reviewKnowledgeDocument(@Valid @RequestBody KnowledgeDocumentReviewReqVO reqVO) {
        consoleService.reviewKnowledgeDocument(reqVO);
        return success(true);
    }

    @PostMapping("/media-assets")
    @Operation(summary = "新增图片/视频/模型素材")
    @PreAuthorize("@ss.hasPermission('xunjing:media:create')")
    public CommonResult<Long> addMediaAsset(@Valid @RequestBody MediaAssetCreateReqVO reqVO) {
        return success(consoleService.addMediaAsset(reqVO));
    }

    @PostMapping(value = "/media-assets/upload",
            consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "上传文旅图片素材")
    @PreAuthorize("@ss.hasPermission('xunjing:media:create')")
    public CommonResult<Long> uploadMediaAsset(@Valid MediaAssetUploadReqVO reqVO) {
        return success(consoleService.uploadMediaAsset(reqVO));
    }

    @GetMapping("/media-assets/page")
    @Operation(summary = "分页查询图片/视频/模型素材")
    @PreAuthorize("@ss.hasPermission('xunjing:media:query')")
    public CommonResult<PageResult<MediaAssetRespVO>> getMediaAssetPage(@Valid ConsolePageReqVO reqVO) {
        return success(consoleService.getMediaAssetPage(reqVO));
    }

    @PostMapping("/media-assets/review")
    @Operation(summary = "审核图片/视频/模型素材")
    @PreAuthorize("@ss.hasPermission('xunjing:media:review')")
    public CommonResult<Boolean> reviewMediaAsset(@Valid @RequestBody MediaAssetReviewReqVO reqVO) {
        consoleService.reviewMediaAsset(reqVO);
        return success(true);
    }

    @PostMapping("/map-points")
    @Operation(summary = "新增地图点位")
    @PreAuthorize("@ss.hasPermission('xunjing:map-point:create')")
    public CommonResult<Long> addMapPoint(@Valid @RequestBody MapPointCreateReqVO reqVO) {
        return success(consoleService.addMapPoint(reqVO));
    }

    @GetMapping("/map-points/page")
    @Operation(summary = "分页查询地图点位")
    @PreAuthorize("@ss.hasPermission('xunjing:map-point:query')")
    public CommonResult<PageResult<MapPointRespVO>> getMapPointPage(@Valid ConsolePageReqVO reqVO) {
        return success(consoleService.getMapPointPage(reqVO));
    }

    @PostMapping("/globe-models")
    @Operation(summary = "新增地球仪模型")
    @PreAuthorize("@ss.hasPermission('xunjing:globe-model:create')")
    public CommonResult<Long> addGlobeModel(@Valid @RequestBody GlobeModelCreateReqVO reqVO) {
        return success(consoleService.addGlobeModel(reqVO));
    }

    @GetMapping("/globe-models/page")
    @Operation(summary = "分页查询地球仪模型")
    @PreAuthorize("@ss.hasPermission('xunjing:globe-model:query')")
    public CommonResult<PageResult<GlobeModelRespVO>> getGlobeModelPage(@Valid ConsolePageReqVO reqVO) {
        return success(consoleService.getGlobeModelPage(reqVO));
    }

    @PostMapping("/interaction-events")
    @Operation(summary = "记录访问/扫码/问答事件")
    @PreAuthorize("@ss.hasPermission('xunjing:event:create')")
    public CommonResult<Long> recordInteraction(@Valid @RequestBody InteractionEventCreateReqVO reqVO) {
        return success(consoleService.recordInteraction(reqVO));
    }

    @PostMapping("/qrcodes")
    @Operation(summary = "创建二维码")
    @PreAuthorize("@ss.hasPermission('xunjing:qrcode:create')")
    public CommonResult<Long> createQrCode(@Valid @RequestBody QrCodeCreateReqVO reqVO) {
        return success(consoleService.createQrCode(reqVO));
    }

    @GetMapping("/qrcodes")
    @Operation(summary = "获得二维码")
    @PreAuthorize("@ss.hasPermission('xunjing:qrcode:query')")
    public CommonResult<QrCodeRespVO> getQrCode(@RequestParam("id") Long id) {
        return success(consoleService.getQrCode(id));
    }

    @GetMapping("/qrcodes/page")
    @Operation(summary = "分页查询二维码")
    @PreAuthorize("@ss.hasPermission('xunjing:qrcode:query')")
    public CommonResult<PageResult<QrCodeRespVO>> getQrCodePage(@Valid ConsolePageReqVO reqVO) {
        return success(consoleService.getQrCodePage(reqVO));
    }

    @PutMapping("/qrcodes/status")
    @Operation(summary = "更新二维码状态")
    @PreAuthorize("@ss.hasPermission('xunjing:qrcode:update')")
    public CommonResult<Boolean> updateQrCodeStatus(@Valid @RequestBody QrCodeStatusUpdateReqVO reqVO) {
        consoleService.updateQrCodeStatus(reqVO);
        return success(true);
    }

    @PostMapping("/crawler-sources")
    @Operation(summary = "新增采集来源计划")
    @PreAuthorize("@ss.hasPermission('xunjing:crawler-source:create')")
    public CommonResult<Long> createCrawlerSource(@Valid @RequestBody CrawlerSourceCreateReqVO reqVO) {
        return success(consoleService.createCrawlerSource(reqVO));
    }

    @GetMapping("/crawler-sources")
    @Operation(summary = "获得采集来源计划")
    @PreAuthorize("@ss.hasPermission('xunjing:crawler-source:query')")
    public CommonResult<CrawlerSourceRespVO> getCrawlerSource(@RequestParam("id") Long id) {
        return success(consoleService.getCrawlerSource(id));
    }

    @GetMapping("/crawler-sources/page")
    @Operation(summary = "分页查询采集来源计划")
    @PreAuthorize("@ss.hasPermission('xunjing:crawler-source:query')")
    public CommonResult<PageResult<CrawlerSourceRespVO>> getCrawlerSourcePage(@Valid ConsolePageReqVO reqVO) {
        return success(consoleService.getCrawlerSourcePage(reqVO));
    }

    @PostMapping("/crawler-sources/run")
    @Operation(summary = "运行采集来源并生成待审核资料")
    @PreAuthorize("@ss.hasPermission('xunjing:crawler-source:run')")
    public CommonResult<CrawlerRunRespVO> runCrawlerSourceImport(@Valid @RequestBody CrawlerRunReqVO reqVO) {
        return success(consoleService.runCrawlerSourceImport(reqVO));
    }

    @PostMapping("/import-items")
    @Operation(summary = "新增资料导入待审核项")
    @PreAuthorize("@ss.hasPermission('xunjing:import-item:create')")
    public CommonResult<Long> createImportItem(@Valid @RequestBody ImportItemCreateReqVO reqVO) {
        return success(consoleService.createImportItem(reqVO));
    }

    @GetMapping("/import-items")
    @Operation(summary = "获得资料导入待审核项")
    @PreAuthorize("@ss.hasPermission('xunjing:import-item:query')")
    public CommonResult<ImportItemRespVO> getImportItem(@RequestParam("id") Long id) {
        return success(consoleService.getImportItem(id));
    }

    @GetMapping("/import-items/page")
    @Operation(summary = "分页查询资料导入待审核项")
    @PreAuthorize("@ss.hasPermission('xunjing:import-item:query')")
    public CommonResult<PageResult<ImportItemRespVO>> getImportItemPage(@Valid ConsolePageReqVO reqVO) {
        return success(consoleService.getImportItemPage(reqVO));
    }

    @PostMapping("/import-items/review")
    @Operation(summary = "审核资料导入项")
    @PreAuthorize("@ss.hasPermission('xunjing:import-item:review')")
    public CommonResult<Long> reviewImportItem(@Valid @RequestBody ReviewImportItemReqVO reqVO) {
        return success(consoleService.reviewImportItem(reqVO));
    }

    @PostMapping("/import-items/batch-review")
    @Operation(summary = "批量审核资料导入项")
    @PreAuthorize("@ss.hasPermission('xunjing:import-item:review')")
    public CommonResult<List<Long>> batchReviewImportItems(@Valid @RequestBody BatchReviewImportItemReqVO reqVO) {
        return success(consoleService.batchReviewImportItems(reqVO));
    }

    @PostMapping("/media-usages")
    @Operation(summary = "记录素材调用")
    @PreAuthorize("@ss.hasPermission('xunjing:media-usage:create')")
    public CommonResult<Long> recordMediaUsage(@Valid @RequestBody MediaUsageCreateReqVO reqVO) {
        return success(consoleService.recordMediaUsage(reqVO));
    }

    @GetMapping("/media-usages")
    @Operation(summary = "获得素材调用记录")
    @PreAuthorize("@ss.hasPermission('xunjing:media-usage:query')")
    public CommonResult<MediaUsageRespVO> getMediaUsage(@RequestParam("id") Long id) {
        return success(consoleService.getMediaUsage(id));
    }

    @GetMapping("/media-usages/page")
    @Operation(summary = "分页查询素材调用")
    @PreAuthorize("@ss.hasPermission('xunjing:media-usage:query')")
    public CommonResult<PageResult<MediaUsageRespVO>> getMediaUsagePage(@Valid ConsolePageReqVO reqVO) {
        return success(consoleService.getMediaUsagePage(reqVO));
    }

    @PostMapping("/ai-eval-sets")
    @Operation(summary = "创建 AI 评测集")
    @PreAuthorize("@ss.hasPermission('xunjing:ai-eval:create')")
    public CommonResult<Long> createAiEvalSet(@Valid @RequestBody AiEvalSetCreateReqVO reqVO) {
        return success(consoleService.createAiEvalSet(reqVO));
    }

    @GetMapping("/ai-eval-sets")
    @Operation(summary = "获得 AI 评测集")
    @PreAuthorize("@ss.hasPermission('xunjing:ai-eval:query')")
    public CommonResult<AiEvalSetRespVO> getAiEvalSet(@RequestParam("id") Long id) {
        return success(consoleService.getAiEvalSet(id));
    }

    @GetMapping("/ai-eval-sets/page")
    @Operation(summary = "分页查询 AI 评测集")
    @PreAuthorize("@ss.hasPermission('xunjing:ai-eval:query')")
    public CommonResult<PageResult<AiEvalSetRespVO>> getAiEvalSetPage(@Valid ConsolePageReqVO reqVO) {
        return success(consoleService.getAiEvalSetPage(reqVO));
    }

    @PostMapping("/ai-eval-cases")
    @Operation(summary = "新增 AI 评测问题")
    @PreAuthorize("@ss.hasPermission('xunjing:ai-eval:create')")
    public CommonResult<Long> addAiEvalCase(@Valid @RequestBody AiEvalCaseCreateReqVO reqVO) {
        return success(consoleService.addAiEvalCase(reqVO));
    }

    @GetMapping("/ai-eval-cases")
    @Operation(summary = "获得 AI 评测问题")
    @PreAuthorize("@ss.hasPermission('xunjing:ai-eval:query')")
    public CommonResult<AiEvalCaseRespVO> getAiEvalCase(@RequestParam("id") Long id) {
        return success(consoleService.getAiEvalCase(id));
    }

    @GetMapping("/ai-eval-cases/page")
    @Operation(summary = "分页查询 AI 评测问题")
    @PreAuthorize("@ss.hasPermission('xunjing:ai-eval:query')")
    public CommonResult<PageResult<AiEvalCaseRespVO>> getAiEvalCasePage(@Valid ConsolePageReqVO reqVO) {
        return success(consoleService.getAiEvalCasePage(reqVO));
    }

    @PostMapping("/ai-eval-sets/run")
    @Operation(summary = "运行 AI 评测集")
    @PreAuthorize("@ss.hasPermission('xunjing:ai-eval:run')")
    public CommonResult<AiEvalRunRespVO> runAiEvalSet(@Valid @RequestBody AiEvalRunReqVO reqVO) {
        return success(consoleService.runAiEvalSet(reqVO));
    }

    @PostMapping("/ai-quota-rules")
    @Operation(summary = "创建 AI 配额规则")
    @PreAuthorize("@ss.hasPermission('xunjing:ai-quota:create')")
    public CommonResult<Long> createAiQuotaRule(@Valid @RequestBody AiQuotaRuleCreateReqVO reqVO) {
        return success(consoleService.createAiQuotaRule(reqVO));
    }

    @GetMapping("/ai-quota-rules")
    @Operation(summary = "获得 AI 配额规则")
    @PreAuthorize("@ss.hasPermission('xunjing:ai-quota:query')")
    public CommonResult<AiQuotaRuleRespVO> getAiQuotaRule(@RequestParam("id") Long id) {
        return success(consoleService.getAiQuotaRule(id));
    }

    @GetMapping("/ai-quota-rules/page")
    @Operation(summary = "分页查询 AI 配额规则")
    @PreAuthorize("@ss.hasPermission('xunjing:ai-quota:query')")
    public CommonResult<PageResult<AiQuotaRuleRespVO>> getAiQuotaRulePage(@Valid ConsolePageReqVO reqVO) {
        return success(consoleService.getAiQuotaRulePage(reqVO));
    }

    @PostMapping("/ai-generation-logs")
    @Operation(summary = "记录 AI 调用和成本")
    @PreAuthorize("@ss.hasPermission('xunjing:ai-log:create')")
    public CommonResult<Long> recordAiGeneration(@Valid @RequestBody AiGenerationLogCreateReqVO reqVO) {
        return success(consoleService.recordAiGeneration(reqVO));
    }

    @GetMapping("/ai-generation-logs")
    @Operation(summary = "获得 AI 调用和成本记录")
    @PreAuthorize("@ss.hasPermission('xunjing:ai-log:query')")
    public CommonResult<AiGenerationLogRespVO> getAiGenerationLog(@RequestParam("id") Long id) {
        return success(consoleService.getAiGenerationLog(id));
    }

    @GetMapping("/ai-generation-logs/page")
    @Operation(summary = "分页查询 AI 调用和成本")
    @PreAuthorize("@ss.hasPermission('xunjing:ai-log:query')")
    public CommonResult<PageResult<AiGenerationLogRespVO>> getAiGenerationLogPage(@Valid ConsolePageReqVO reqVO) {
        return success(consoleService.getAiGenerationLogPage(reqVO));
    }

    @GetMapping("/resource-package-detail")
    @Operation(summary = "按资源包编码获得资源包详情")
    @PreAuthorize("@ss.hasPermission('xunjing:resource-package:query')")
    public CommonResult<PackageDetailRespVO> getPackageDetail(@RequestParam("packageCode") String packageCode) {
        return success(consoleService.getPackageDetailByCode(packageCode));
    }

    @GetMapping("/readiness")
    @Operation(summary = "获得一期上线就绪度")
    @PreAuthorize("@ss.hasPermission('xunjing:readiness:query')")
    public CommonResult<ReadinessRespVO> getReadiness(@RequestParam("projectId") Long projectId) {
        return success(consoleService.getReadiness(projectId));
    }

    @GetMapping("/dashboard")
    @Operation(summary = "获得一期后台看板汇总")
    @PreAuthorize("@ss.hasPermission('xunjing:dashboard:query')")
    public CommonResult<DashboardSummaryRespVO> getDashboard(@RequestParam("projectId") Long projectId) {
        return success(consoleService.getDashboard(projectId));
    }

    @PostMapping("/public-reports")
    @Operation(summary = "生成公益报告")
    @PreAuthorize("@ss.hasPermission('xunjing:public-report:create')")
    public CommonResult<Long> generatePublicReport(@Valid @RequestBody PublicReportGenerateReqVO reqVO) {
        return success(consoleService.generatePublicReport(reqVO));
    }

}
