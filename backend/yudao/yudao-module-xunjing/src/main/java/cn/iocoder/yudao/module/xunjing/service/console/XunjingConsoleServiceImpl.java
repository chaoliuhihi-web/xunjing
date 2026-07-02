package cn.iocoder.yudao.module.xunjing.service.console;

import cn.iocoder.yudao.framework.common.pojo.PageResult;
import cn.iocoder.yudao.framework.common.util.json.JsonUtils;
import cn.iocoder.yudao.framework.common.util.object.BeanUtils;
import cn.iocoder.yudao.framework.tenant.core.context.TenantContextHolder;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AgentActionMetricRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AgentActionPoiFunnelRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AgentActionTimeWindowRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AiEvalCaseCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AiEvalCaseRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.AiEvalRunCaseRespVO;
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
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.CrawlerRunItemReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.CrawlerRunReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.CrawlerRunRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ConsolePageReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.DashboardSummaryRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.GlobeModelCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ImportItemCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.ImportItemRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.InteractionEventCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.KnowledgeDocumentCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.KnowledgeDocumentRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.KnowledgeDocumentReviewReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.MapPointCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.MapPointRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.MediaAssetCreateReqVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.MediaAssetRespVO;
import cn.iocoder.yudao.module.xunjing.controller.admin.console.vo.XunjingConsoleVO.MediaAssetReviewReqVO;
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
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.RagChatReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.RagChatRespVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.ai.XunjingAiEvalCaseDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.ai.XunjingAiEvalSetDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.ai.XunjingAiGenerationLogDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.ai.XunjingAiQuotaRuleDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.crawler.XunjingCrawlerSourceDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.event.XunjingInteractionEventDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.globe.XunjingGlobeModelDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.importitem.XunjingImportItemDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.knowledge.XunjingKnowledgeDocumentDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.map.XunjingMapPointDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.media.XunjingMediaAssetDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.media.XunjingMediaUsageLogDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.packagepkg.XunjingResourcePackageDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.project.XunjingProjectDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.qrcode.XunjingQrCodeDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.report.XunjingPublicReportDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.school.XunjingSchoolDO;
import cn.iocoder.yudao.module.xunjing.dal.mysql.ai.XunjingAiEvalCaseMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.ai.XunjingAiEvalSetMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.ai.XunjingAiGenerationLogMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.ai.XunjingAiQuotaRuleMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.crawler.XunjingCrawlerSourceMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.event.XunjingInteractionEventMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.globe.XunjingGlobeModelMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.importitem.XunjingImportItemMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.knowledge.XunjingKnowledgeDocumentMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.map.XunjingMapPointMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.media.XunjingMediaAssetMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.media.XunjingMediaUsageLogMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.packagepkg.XunjingResourcePackageMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.project.XunjingProjectMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.qrcode.XunjingQrCodeMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.report.XunjingPublicReportMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.school.XunjingSchoolMapper;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.PackageStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.ProjectStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.ReportStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.ReviewStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.SchoolStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.SourceType;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.AiEvalStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.AiQuotaStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.AiSafetyStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.CopyrightStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.CrawlerStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.EventType;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.ImportStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.MediaType;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.QrCodeStatus;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.VectorStatus;
import cn.iocoder.yudao.module.xunjing.service.app.XunjingAppService;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Validated
public class XunjingConsoleServiceImpl implements XunjingConsoleService {

    private static final String DEFAULT_CHAT_SCENE_CODE = "xunjing-rag-chat";
    private static final String AI_EVAL_SOURCE_CHANNEL = "ai-eval-runner";
    private static final String TARGET_TYPE_KNOWLEDGE = "KNOWLEDGE";
    private static final String TARGET_TYPE_MEDIA = "MEDIA";
    private static final String ITEM_TYPE_WEB_PAGE = "WEB_PAGE";
    private static final String ITEM_TYPE_IMAGE_ASSET = "IMAGE_ASSET";

    @Resource
    private XunjingProjectMapper projectMapper;
    @Resource
    private XunjingSchoolMapper schoolMapper;
    @Resource
    private XunjingResourcePackageMapper resourcePackageMapper;
    @Resource
    private XunjingKnowledgeDocumentMapper knowledgeDocumentMapper;
    @Resource
    private XunjingMediaAssetMapper mediaAssetMapper;
    @Resource
    private XunjingMediaUsageLogMapper mediaUsageLogMapper;
    @Resource
    private XunjingMapPointMapper mapPointMapper;
    @Resource
    private XunjingGlobeModelMapper globeModelMapper;
    @Resource
    private XunjingInteractionEventMapper interactionEventMapper;
    @Resource
    private XunjingQrCodeMapper qrCodeMapper;
    @Resource
    private XunjingCrawlerSourceMapper crawlerSourceMapper;
    @Resource
    private XunjingImportItemMapper importItemMapper;
    @Resource
    private XunjingAiEvalSetMapper aiEvalSetMapper;
    @Resource
    private XunjingAiEvalCaseMapper aiEvalCaseMapper;
    @Resource
    private XunjingAiQuotaRuleMapper aiQuotaRuleMapper;
    @Resource
    private XunjingAiGenerationLogMapper aiGenerationLogMapper;
    @Resource
    private XunjingPublicReportMapper publicReportMapper;
    @Autowired(required = false)
    private XunjingAppService appService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createProject(ProjectCreateReqVO reqVO) {
        XunjingProjectDO project = BeanUtils.toBean(reqVO, XunjingProjectDO.class);
        project.setId(null);
        project.setTenantId(TenantContextHolder.getRequiredTenantId());
        project.setStatus(ProjectStatus.ACTIVE.getStatus());
        projectMapper.insert(project);
        return project.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createSchool(SchoolCreateReqVO reqVO) {
        XunjingSchoolDO school = BeanUtils.toBean(reqVO, XunjingSchoolDO.class);
        school.setId(null);
        school.setTenantId(TenantContextHolder.getRequiredTenantId());
        school.setStatus(SchoolStatus.ACTIVE.getStatus());
        schoolMapper.insert(school);
        return school.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createResourcePackage(ResourcePackageCreateReqVO reqVO) {
        validateProjectExists(reqVO.getProjectId());
        validateSchoolExists(reqVO.getSchoolId());
        XunjingResourcePackageDO resourcePackage = BeanUtils.toBean(reqVO, XunjingResourcePackageDO.class);
        resourcePackage.setId(null);
        resourcePackage.setTenantId(TenantContextHolder.getRequiredTenantId());
        resourcePackage.setStatus(PackageStatus.PUBLISHED.getStatus());
        resourcePackage.setPublishedAt(LocalDateTime.now());
        resourcePackageMapper.insert(resourcePackage);
        return resourcePackage.getId();
    }

    @Override
    public PageResult<ResourcePackageRespVO> getResourcePackagePage(ConsolePageReqVO reqVO) {
        return BeanUtils.toBean(resourcePackageMapper.selectPage(reqVO), ResourcePackageRespVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateResourcePackage(ResourcePackageUpdateReqVO reqVO) {
        XunjingResourcePackageDO resourcePackage = resourcePackageMapper.selectById(reqVO.getId());
        if (resourcePackage == null) {
            throw new IllegalArgumentException("xunjing resource package not exists: " + reqVO.getId());
        }
        if (reqVO.getTitle() != null) {
            resourcePackage.setTitle(reqVO.getTitle());
        }
        if (reqVO.getVersionNo() != null) {
            resourcePackage.setVersionNo(reqVO.getVersionNo());
        }
        if (reqVO.getAiKnowledgeId() != null) {
            resourcePackage.setAiKnowledgeId(reqVO.getAiKnowledgeId());
        }
        if (reqVO.getStatus() != null) {
            resourcePackage.setStatus(reqVO.getStatus());
            if (PackageStatus.PUBLISHED.getStatus().equals(reqVO.getStatus())) {
                resourcePackage.setPublishedAt(LocalDateTime.now());
            }
        }
        resourcePackageMapper.updateById(resourcePackage);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long addKnowledgeDocument(KnowledgeDocumentCreateReqVO reqVO) {
        validatePackageExists(reqVO.getPackageId());
        XunjingKnowledgeDocumentDO document = BeanUtils.toBean(reqVO, XunjingKnowledgeDocumentDO.class);
        document.setId(null);
        document.setTenantId(TenantContextHolder.getRequiredTenantId());
        knowledgeDocumentMapper.insert(document);
        return document.getId();
    }

    @Override
    public PageResult<KnowledgeDocumentRespVO> getKnowledgeDocumentPage(ConsolePageReqVO reqVO) {
        return BeanUtils.toBean(knowledgeDocumentMapper.selectPage(reqVO), KnowledgeDocumentRespVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void reviewKnowledgeDocument(KnowledgeDocumentReviewReqVO reqVO) {
        XunjingKnowledgeDocumentDO document = knowledgeDocumentMapper.selectById(reqVO.getId());
        if (document == null) {
            throw new IllegalArgumentException("xunjing knowledge document not exists: " + reqVO.getId());
        }
        if (reqVO.getAuthorityLevel() != null) {
            document.setAuthorityLevel(reqVO.getAuthorityLevel());
        }
        if (reqVO.getReviewStatus() != null) {
            document.setReviewStatus(reqVO.getReviewStatus());
        }
        if (reqVO.getVectorStatus() != null) {
            document.setVectorStatus(reqVO.getVectorStatus());
        }
        knowledgeDocumentMapper.updateById(document);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long addMediaAsset(MediaAssetCreateReqVO reqVO) {
        validatePackageExists(reqVO.getPackageId());
        XunjingMediaAssetDO mediaAsset = BeanUtils.toBean(reqVO, XunjingMediaAssetDO.class);
        mediaAsset.setId(null);
        mediaAsset.setTenantId(TenantContextHolder.getRequiredTenantId());
        mediaAsset.setCanPublic(!Boolean.FALSE.equals(reqVO.getCanPublic()));
        mediaAsset.setCanAiUse(!Boolean.FALSE.equals(reqVO.getCanAiUse()));
        mediaAsset.setCanPromotionUse(Boolean.TRUE.equals(reqVO.getCanPromotionUse()));
        mediaAssetMapper.insert(mediaAsset);
        return mediaAsset.getId();
    }

    @Override
    public PageResult<MediaAssetRespVO> getMediaAssetPage(ConsolePageReqVO reqVO) {
        return BeanUtils.toBean(mediaAssetMapper.selectPage(reqVO), MediaAssetRespVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void reviewMediaAsset(MediaAssetReviewReqVO reqVO) {
        XunjingMediaAssetDO mediaAsset = mediaAssetMapper.selectById(reqVO.getId());
        if (mediaAsset == null) {
            throw new IllegalArgumentException("xunjing media asset not exists: " + reqVO.getId());
        }
        if (reqVO.getCopyrightStatus() != null) {
            mediaAsset.setCopyrightStatus(reqVO.getCopyrightStatus());
        }
        if (reqVO.getReviewStatus() != null) {
            mediaAsset.setReviewStatus(reqVO.getReviewStatus());
        }
        if (reqVO.getCanPublic() != null) {
            mediaAsset.setCanPublic(reqVO.getCanPublic());
        }
        if (reqVO.getCanAiUse() != null) {
            mediaAsset.setCanAiUse(reqVO.getCanAiUse());
        }
        if (reqVO.getCanPromotionUse() != null) {
            mediaAsset.setCanPromotionUse(reqVO.getCanPromotionUse());
        }
        mediaAssetMapper.updateById(mediaAsset);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long addMapPoint(MapPointCreateReqVO reqVO) {
        validatePackageExists(reqVO.getPackageId());
        XunjingMapPointDO mapPoint = BeanUtils.toBean(reqVO, XunjingMapPointDO.class);
        mapPoint.setId(null);
        mapPoint.setTenantId(TenantContextHolder.getRequiredTenantId());
        mapPoint.setStatus(PackageStatus.PUBLISHED.getStatus());
        mapPointMapper.insert(mapPoint);
        return mapPoint.getId();
    }

    @Override
    public PageResult<MapPointRespVO> getMapPointPage(ConsolePageReqVO reqVO) {
        return BeanUtils.toBean(mapPointMapper.selectPage(reqVO), MapPointRespVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long addGlobeModel(GlobeModelCreateReqVO reqVO) {
        validatePackageExists(reqVO.getPackageId());
        XunjingGlobeModelDO globeModel = BeanUtils.toBean(reqVO, XunjingGlobeModelDO.class);
        globeModel.setId(null);
        globeModel.setTenantId(TenantContextHolder.getRequiredTenantId());
        globeModel.setStatus(PackageStatus.PUBLISHED.getStatus());
        globeModelMapper.insert(globeModel);
        return globeModel.getId();
    }

    @Override
    public PageResult<GlobeModelRespVO> getGlobeModelPage(ConsolePageReqVO reqVO) {
        return BeanUtils.toBean(globeModelMapper.selectPage(reqVO), GlobeModelRespVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long recordInteraction(InteractionEventCreateReqVO reqVO) {
        validatePackageExists(reqVO.getPackageId());
        XunjingInteractionEventDO interactionEvent = BeanUtils.toBean(reqVO, XunjingInteractionEventDO.class);
        interactionEvent.setId(null);
        interactionEvent.setTenantId(TenantContextHolder.getRequiredTenantId());
        interactionEventMapper.insert(interactionEvent);
        return interactionEvent.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createQrCode(QrCodeCreateReqVO reqVO) {
        validatePackageExists(reqVO.getPackageId());
        XunjingQrCodeDO qrCode = BeanUtils.toBean(reqVO, XunjingQrCodeDO.class);
        qrCode.setId(null);
        qrCode.setTenantId(TenantContextHolder.getRequiredTenantId());
        qrCode.setScanCount(0L);
        qrCode.setStatus(QrCodeStatus.ACTIVE.getStatus());
        qrCodeMapper.insert(qrCode);
        return qrCode.getId();
    }

    @Override
    public QrCodeRespVO getQrCode(Long id) {
        XunjingQrCodeDO qrCode = qrCodeMapper.selectById(id);
        if (qrCode == null) {
            throw new IllegalArgumentException("xunjing qr code not exists: " + id);
        }
        return BeanUtils.toBean(qrCode, QrCodeRespVO.class);
    }

    @Override
    public PageResult<QrCodeRespVO> getQrCodePage(ConsolePageReqVO reqVO) {
        return BeanUtils.toBean(qrCodeMapper.selectPage(reqVO), QrCodeRespVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateQrCodeStatus(QrCodeStatusUpdateReqVO reqVO) {
        XunjingQrCodeDO qrCode = qrCodeMapper.selectById(reqVO.getId());
        if (qrCode == null) {
            throw new IllegalArgumentException("xunjing qr code not exists: " + reqVO.getId());
        }
        qrCode.setStatus(reqVO.getStatus());
        qrCodeMapper.updateById(qrCode);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createCrawlerSource(CrawlerSourceCreateReqVO reqVO) {
        validateProjectExists(reqVO.getProjectId());
        validatePackageExists(reqVO.getPackageId());
        XunjingCrawlerSourceDO crawlerSource = BeanUtils.toBean(reqVO, XunjingCrawlerSourceDO.class);
        crawlerSource.setId(null);
        crawlerSource.setTenantId(TenantContextHolder.getRequiredTenantId());
        crawlerSource.setHost(parseHost(reqVO.getSourceUrl()));
        crawlerSource.setSourceKind(defaultIfBlank(reqVO.getSourceKind(), "web"));
        crawlerSource.setConnector(defaultIfBlank(reqVO.getConnector(), "web_generic"));
        crawlerSource.setSourceLane("official_or_verified");
        crawlerSource.setCaptureProfile(Boolean.TRUE.equals(reqVO.getCaptureAssets()) ? "html_plus_assets" : "html_text");
        crawlerSource.setFactSourcePolicy("official_first_with_manual_review");
        crawlerSource.setCaptureAssets(Boolean.TRUE.equals(reqVO.getCaptureAssets()));
        crawlerSource.setMetadataOnly(Boolean.TRUE.equals(reqVO.getMetadataOnly()));
        crawlerSource.setStatus(CrawlerStatus.PENDING.getStatus());
        crawlerSourceMapper.insert(crawlerSource);
        return crawlerSource.getId();
    }

    @Override
    public CrawlerSourceRespVO getCrawlerSource(Long id) {
        XunjingCrawlerSourceDO crawlerSource = crawlerSourceMapper.selectById(id);
        if (crawlerSource == null) {
            throw new IllegalArgumentException("xunjing crawler source not exists: " + id);
        }
        return BeanUtils.toBean(crawlerSource, CrawlerSourceRespVO.class);
    }

    @Override
    public PageResult<CrawlerSourceRespVO> getCrawlerSourcePage(ConsolePageReqVO reqVO) {
        return BeanUtils.toBean(crawlerSourceMapper.selectPage(reqVO), CrawlerSourceRespVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CrawlerRunRespVO runCrawlerSourceImport(CrawlerRunReqVO reqVO) {
        XunjingCrawlerSourceDO crawlerSource = crawlerSourceMapper.selectById(reqVO.getSourceId());
        if (crawlerSource == null) {
            throw new IllegalArgumentException("xunjing crawler source not exists: " + reqVO.getSourceId());
        }
        List<CrawlerRunItemReqVO> runItems = reqVO.getItems();
        if (runItems == null || runItems.isEmpty()) {
            runItems = buildDefaultCrawlerRunItems(crawlerSource);
        }

        List<Long> importItemIds = new ArrayList<>();
        int knowledgeItemCount = 0;
        int mediaItemCount = 0;
        for (CrawlerRunItemReqVO runItem : runItems) {
            XunjingImportItemDO importItem = buildCrawlerImportItem(crawlerSource, runItem);
            importItemMapper.insert(importItem);
            importItemIds.add(importItem.getId());
            if (TARGET_TYPE_MEDIA.equals(importItem.getTargetType())) {
                mediaItemCount++;
            } else {
                knowledgeItemCount++;
            }
        }

        crawlerSource.setStatus(CrawlerStatus.APPROVED.getStatus());
        crawlerSourceMapper.updateById(crawlerSource);

        CrawlerRunRespVO respVO = new CrawlerRunRespVO();
        respVO.setSourceId(crawlerSource.getId());
        respVO.setStatus(crawlerSource.getStatus());
        respVO.setCreatedCount(importItemIds.size());
        respVO.setKnowledgeItemCount(knowledgeItemCount);
        respVO.setMediaItemCount(mediaItemCount);
        respVO.setImportItemIds(importItemIds);
        return respVO;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createImportItem(ImportItemCreateReqVO reqVO) {
        validateProjectExists(reqVO.getProjectId());
        validatePackageExists(reqVO.getPackageId());
        if (reqVO.getSourceId() != null) {
            validateCrawlerSourceExists(reqVO.getSourceId());
        }
        XunjingImportItemDO importItem = BeanUtils.toBean(reqVO, XunjingImportItemDO.class);
        importItem.setId(null);
        importItem.setTenantId(TenantContextHolder.getRequiredTenantId());
        importItem.setReviewStatus(ReviewStatus.PENDING.getStatus());
        importItem.setStatus(ImportStatus.PENDING_REVIEW.getStatus());
        importItemMapper.insert(importItem);
        return importItem.getId();
    }

    @Override
    public ImportItemRespVO getImportItem(Long id) {
        XunjingImportItemDO importItem = importItemMapper.selectById(id);
        if (importItem == null) {
            throw new IllegalArgumentException("xunjing import item not exists: " + id);
        }
        return BeanUtils.toBean(importItem, ImportItemRespVO.class);
    }

    @Override
    public PageResult<ImportItemRespVO> getImportItemPage(ConsolePageReqVO reqVO) {
        return BeanUtils.toBean(importItemMapper.selectPage(reqVO), ImportItemRespVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long reviewImportItem(ReviewImportItemReqVO reqVO) {
        XunjingImportItemDO importItem = importItemMapper.selectById(reqVO.getId());
        if (importItem == null) {
            throw new IllegalArgumentException("xunjing import item not exists: " + reqVO.getId());
        }
        if (ReviewStatus.REJECTED.getStatus().equals(reqVO.getReviewStatus())) {
            importItem.setReviewStatus(ReviewStatus.REJECTED.getStatus());
            importItem.setStatus(ImportStatus.REJECTED.getStatus());
            importItemMapper.updateById(importItem);
            return null;
        }
        if (!ReviewStatus.APPROVED.getStatus().equals(reqVO.getReviewStatus())) {
            throw new IllegalArgumentException("unsupported xunjing import review status: " + reqVO.getReviewStatus());
        }
        if (isMediaImportItem(importItem)) {
            return publishMediaImportItem(importItem);
        }
        XunjingKnowledgeDocumentDO document = new XunjingKnowledgeDocumentDO();
        document.setPackageId(importItem.getPackageId());
        document.setTitle(importItem.getItemTitle());
        document.setSourceType(SourceType.IMPORT.getType());
        document.setSourceUrl(defaultIfBlank(importItem.getOriginalUrl(), importItem.getFileUrl()));
        document.setContentDigest(importItem.getEvidenceText());
        document.setAuthorityLevel(defaultIfBlank(reqVO.getAuthorityLevel(), "VERIFIED"));
        document.setReviewStatus(ReviewStatus.APPROVED.getStatus());
        document.setVectorStatus(defaultIfBlank(reqVO.getVectorStatus(), VectorStatus.INDEXED.getStatus()));
        document.setTenantId(TenantContextHolder.getRequiredTenantId());
        knowledgeDocumentMapper.insert(document);

        importItem.setReviewStatus(ReviewStatus.APPROVED.getStatus());
        importItem.setStatus(ImportStatus.IMPORTED.getStatus());
        importItem.setTargetType(TARGET_TYPE_KNOWLEDGE);
        importItem.setTargetId(document.getId());
        importItemMapper.updateById(importItem);
        return document.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<Long> batchReviewImportItems(BatchReviewImportItemReqVO reqVO) {
        List<Long> result = new ArrayList<>();
        if (reqVO.getIds() == null || reqVO.getIds().isEmpty()) {
            return result;
        }
        for (Long id : reqVO.getIds()) {
            ReviewImportItemReqVO singleReqVO = new ReviewImportItemReqVO();
            singleReqVO.setId(id);
            singleReqVO.setReviewStatus(reqVO.getReviewStatus());
            singleReqVO.setAuthorityLevel(reqVO.getAuthorityLevel());
            singleReqVO.setVectorStatus(reqVO.getVectorStatus());
            singleReqVO.setRejectReason(reqVO.getRejectReason());
            Long targetId = reviewImportItem(singleReqVO);
            if (targetId != null) {
                result.add(targetId);
            }
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long recordMediaUsage(MediaUsageCreateReqVO reqVO) {
        validatePackageExists(reqVO.getPackageId());
        validateMediaAssetExists(reqVO.getMediaId());
        XunjingMediaUsageLogDO usageLog = BeanUtils.toBean(reqVO, XunjingMediaUsageLogDO.class);
        usageLog.setId(null);
        usageLog.setTenantId(TenantContextHolder.getRequiredTenantId());
        mediaUsageLogMapper.insert(usageLog);
        return usageLog.getId();
    }

    @Override
    public MediaUsageRespVO getMediaUsage(Long id) {
        XunjingMediaUsageLogDO usageLog = mediaUsageLogMapper.selectById(id);
        if (usageLog == null) {
            throw new IllegalArgumentException("xunjing media usage not exists: " + id);
        }
        return BeanUtils.toBean(usageLog, MediaUsageRespVO.class);
    }

    @Override
    public PageResult<MediaUsageRespVO> getMediaUsagePage(ConsolePageReqVO reqVO) {
        return BeanUtils.toBean(mediaUsageLogMapper.selectPage(reqVO), MediaUsageRespVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createAiEvalSet(AiEvalSetCreateReqVO reqVO) {
        validateProjectExists(reqVO.getProjectId());
        XunjingAiEvalSetDO evalSet = BeanUtils.toBean(reqVO, XunjingAiEvalSetDO.class);
        evalSet.setId(null);
        evalSet.setTenantId(TenantContextHolder.getRequiredTenantId());
        evalSet.setStatus(AiEvalStatus.ACTIVE.getStatus());
        aiEvalSetMapper.insert(evalSet);
        return evalSet.getId();
    }

    @Override
    public AiEvalSetRespVO getAiEvalSet(Long id) {
        XunjingAiEvalSetDO evalSet = aiEvalSetMapper.selectById(id);
        if (evalSet == null) {
            throw new IllegalArgumentException("xunjing ai eval set not exists: " + id);
        }
        return BeanUtils.toBean(evalSet, AiEvalSetRespVO.class);
    }

    @Override
    public PageResult<AiEvalSetRespVO> getAiEvalSetPage(ConsolePageReqVO reqVO) {
        return BeanUtils.toBean(aiEvalSetMapper.selectPage(reqVO), AiEvalSetRespVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long addAiEvalCase(AiEvalCaseCreateReqVO reqVO) {
        validateAiEvalSetExists(reqVO.getEvalSetId());
        XunjingAiEvalCaseDO evalCase = BeanUtils.toBean(reqVO, XunjingAiEvalCaseDO.class);
        evalCase.setId(null);
        evalCase.setTenantId(TenantContextHolder.getRequiredTenantId());
        evalCase.setSourceRequired(!Boolean.FALSE.equals(reqVO.getSourceRequired()));
        evalCase.setStatus(AiEvalStatus.ACTIVE.getStatus());
        aiEvalCaseMapper.insert(evalCase);
        return evalCase.getId();
    }

    @Override
    public AiEvalCaseRespVO getAiEvalCase(Long id) {
        XunjingAiEvalCaseDO evalCase = aiEvalCaseMapper.selectById(id);
        if (evalCase == null) {
            throw new IllegalArgumentException("xunjing ai eval case not exists: " + id);
        }
        return BeanUtils.toBean(evalCase, AiEvalCaseRespVO.class);
    }

    @Override
    public PageResult<AiEvalCaseRespVO> getAiEvalCasePage(ConsolePageReqVO reqVO) {
        return BeanUtils.toBean(aiEvalCaseMapper.selectPage(reqVO), AiEvalCaseRespVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AiEvalRunRespVO runAiEvalSet(AiEvalRunReqVO reqVO) {
        XunjingAiEvalSetDO evalSet = aiEvalSetMapper.selectById(reqVO.getEvalSetId());
        if (evalSet == null) {
            throw new IllegalArgumentException("xunjing ai eval set not exists: " + reqVO.getEvalSetId());
        }
        if (appService == null) {
            throw new IllegalStateException("xunjing app service required to run ai eval set");
        }

        String sceneCode = defaultIfBlank(evalSet.getSceneCode(), DEFAULT_CHAT_SCENE_CODE);
        List<XunjingAiEvalCaseDO> evalCases = aiEvalCaseMapper.selectListByEvalSetIdAndStatus(
                evalSet.getId(), AiEvalStatus.ACTIVE.getStatus());
        List<AiEvalRunCaseRespVO> results = new ArrayList<>();
        for (XunjingAiEvalCaseDO evalCase : evalCases) {
            RagChatReqVO chatReqVO = new RagChatReqVO();
            chatReqVO.setPackageCode(reqVO.getPackageCode());
            chatReqVO.setQuestion(evalCase.getQuestion());
            chatReqVO.setSceneCode(sceneCode);
            chatReqVO.setQrSceneCode(reqVO.getQrSceneCode());
            chatReqVO.setSourceChannel(AI_EVAL_SOURCE_CHANNEL);
            chatReqVO.setUserTraceId(defaultIfBlank(reqVO.getUserTraceId(), "ai-eval-" + evalSet.getId()));

            RagChatRespVO answer = appService.answer(chatReqVO);
            results.add(buildAiEvalRunCaseResult(evalCase, answer));
        }

        int passedCount = (int) results.stream().filter(result -> Boolean.TRUE.equals(result.getPassed())).count();
        int failedCount = results.size() - passedCount;
        AiEvalRunRespVO respVO = new AiEvalRunRespVO();
        respVO.setEvalSetId(evalSet.getId());
        respVO.setProjectId(evalSet.getProjectId());
        respVO.setSceneCode(sceneCode);
        respVO.setTotalCount(results.size());
        respVO.setPassedCount(passedCount);
        respVO.setFailedCount(failedCount);
        respVO.setPassed(failedCount == 0);
        respVO.setResults(results);
        return respVO;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createAiQuotaRule(AiQuotaRuleCreateReqVO reqVO) {
        validateProjectExists(reqVO.getProjectId());
        XunjingAiQuotaRuleDO quotaRule = BeanUtils.toBean(reqVO, XunjingAiQuotaRuleDO.class);
        quotaRule.setId(null);
        quotaRule.setTenantId(TenantContextHolder.getRequiredTenantId());
        quotaRule.setCacheEnabled(!Boolean.FALSE.equals(reqVO.getCacheEnabled()));
        quotaRule.setStatus(AiQuotaStatus.ACTIVE.getStatus());
        aiQuotaRuleMapper.insert(quotaRule);
        return quotaRule.getId();
    }

    @Override
    public AiQuotaRuleRespVO getAiQuotaRule(Long id) {
        XunjingAiQuotaRuleDO quotaRule = aiQuotaRuleMapper.selectById(id);
        if (quotaRule == null) {
            throw new IllegalArgumentException("xunjing ai quota rule not exists: " + id);
        }
        return BeanUtils.toBean(quotaRule, AiQuotaRuleRespVO.class);
    }

    @Override
    public PageResult<AiQuotaRuleRespVO> getAiQuotaRulePage(ConsolePageReqVO reqVO) {
        return BeanUtils.toBean(aiQuotaRuleMapper.selectPage(reqVO), AiQuotaRuleRespVO.class);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long recordAiGeneration(AiGenerationLogCreateReqVO reqVO) {
        validatePackageExists(reqVO.getPackageId());
        XunjingResourcePackageDO resourcePackage = resourcePackageMapper.selectById(reqVO.getPackageId());
        XunjingAiGenerationLogDO aiLog = BeanUtils.toBean(reqVO, XunjingAiGenerationLogDO.class);
        aiLog.setId(null);
        aiLog.setProjectId(reqVO.getProjectId() == null ? resourcePackage.getProjectId() : reqVO.getProjectId());
        aiLog.setSchoolId(reqVO.getSchoolId() == null ? resourcePackage.getSchoolId() : reqVO.getSchoolId());
        aiLog.setTenantId(TenantContextHolder.getRequiredTenantId());
        aiLog.setTokenCount(reqVO.getTokenCount() == null ? 0L : reqVO.getTokenCount());
        aiLog.setCostAmount(reqVO.getCostAmount() == null ? java.math.BigDecimal.ZERO : reqVO.getCostAmount());
        aiLog.setSafetyStatus(defaultIfBlank(reqVO.getSafetyStatus(), AiSafetyStatus.REVIEW_REQUIRED.getStatus()));
        aiLog.setCacheHit(Boolean.TRUE.equals(reqVO.getCacheHit()));
        aiGenerationLogMapper.insert(aiLog);
        return aiLog.getId();
    }

    @Override
    public AiGenerationLogRespVO getAiGenerationLog(Long id) {
        XunjingAiGenerationLogDO aiLog = aiGenerationLogMapper.selectById(id);
        if (aiLog == null) {
            throw new IllegalArgumentException("xunjing ai generation log not exists: " + id);
        }
        return BeanUtils.toBean(aiLog, AiGenerationLogRespVO.class);
    }

    @Override
    public PageResult<AiGenerationLogRespVO> getAiGenerationLogPage(ConsolePageReqVO reqVO) {
        return BeanUtils.toBean(aiGenerationLogMapper.selectPage(reqVO), AiGenerationLogRespVO.class);
    }

    @Override
    public ReadinessRespVO getReadiness(Long projectId) {
        validateProjectExists(projectId);
        List<XunjingResourcePackageDO> packages = resourcePackageMapper.selectListByProjectId(projectId);
        return buildReadiness(projectId, packages);
    }

    private ReadinessRespVO getReadiness(Long projectId, Long schoolId) {
        validateProjectExists(projectId);
        if (schoolId == null) {
            return buildReadiness(projectId, resourcePackageMapper.selectListByProjectId(projectId));
        }
        validateSchoolExists(schoolId);
        return buildReadiness(projectId, resourcePackageMapper.selectListByProjectIdAndSchoolId(projectId, schoolId));
    }

    private ReadinessRespVO buildReadiness(Long projectId, List<XunjingResourcePackageDO> packages) {
        List<Long> packageIds = packages.stream().map(XunjingResourcePackageDO::getId).toList();
        List<XunjingAiEvalSetDO> evalSets = aiEvalSetMapper.selectListByProjectId(projectId);
        List<Long> evalSetIds = evalSets.stream().map(XunjingAiEvalSetDO::getId).toList();
        Long packageCount = (long) packages.size();
        Long reviewedKnowledgeCount = knowledgeDocumentMapper.selectCountByPackageIdsAndReviewStatus(
                packageIds, ReviewStatus.APPROVED.getStatus());
        Long reviewedMediaCount = mediaAssetMapper.selectCountByPackageIdsAndReviewStatus(
                packageIds, ReviewStatus.APPROVED.getStatus());
        Long mapPointCount = mapPointMapper.selectCountByPackageIds(packageIds);
        Long globeModelCount = globeModelMapper.selectCountByPackageIds(packageIds);
        Long qrCodeCount = qrCodeMapper.selectCountByPackageIds(packageIds);
        Long interactionCount = interactionEventMapper.selectCountByPackageIds(packageIds);
        Long triggerResolveCount = interactionEventMapper.selectCountByPackageIdsAndEventType(
                packageIds, EventType.TRIGGER_RESOLVE.getType());
        Long agentActionCount = interactionEventMapper.selectCountByPackageIdsAndEventType(
                packageIds, EventType.AGENT_ACTION.getType());
        Long mediaUsageCount = mediaUsageLogMapper.selectCountByPackageIds(packageIds);
        Long aiEvalCaseCount = aiEvalCaseMapper.selectCountByEvalSetIds(evalSetIds);
        Long quotaRuleCount = aiQuotaRuleMapper.selectCountByProjectId(projectId);
        Long aiGenerationCount = aiGenerationLogMapper.selectCountByPackageIds(packageIds);
        Long pendingImportItemCount = importItemMapper.selectCountByPackageIdsAndReviewStatus(
                packageIds, ReviewStatus.PENDING.getStatus());

        ReadinessRespVO respVO = new ReadinessRespVO();
        respVO.setPackageCount(packageCount);
        respVO.setReviewedKnowledgeCount(reviewedKnowledgeCount);
        respVO.setReviewedMediaCount(reviewedMediaCount);
        respVO.setMapPointCount(mapPointCount);
        respVO.setGlobeModelCount(globeModelCount);
        respVO.setQrCodeCount(qrCodeCount);
        respVO.setInteractionCount(interactionCount);
        respVO.setTriggerResolveCount(triggerResolveCount);
        respVO.setAgentActionCount(agentActionCount);
        respVO.setAgentActionConversionRate(calculateAgentActionConversionRate(agentActionCount, triggerResolveCount));
        respVO.setMediaUsageCount(mediaUsageCount);
        respVO.setAiEvalCaseCount(aiEvalCaseCount);
        respVO.setQuotaRuleCount(quotaRuleCount);
        respVO.setAiGenerationCount(aiGenerationCount);
        respVO.setPendingImportItemCount(pendingImportItemCount);
        respVO.setP0Ready(packageCount > 0 && reviewedKnowledgeCount > 0 && reviewedMediaCount > 0
                && mapPointCount > 0 && globeModelCount > 0 && qrCodeCount > 0
                && aiEvalCaseCount > 0 && quotaRuleCount > 0);
        return respVO;
    }

    @Override
    public DashboardSummaryRespVO getDashboard(Long projectId) {
        ReadinessRespVO readiness = getReadiness(projectId);
        List<XunjingResourcePackageDO> packages = resourcePackageMapper.selectListByProjectId(projectId);
        List<Long> packageIds = packages.stream().map(XunjingResourcePackageDO::getId).toList();
        XunjingPublicReportDO latestReport = publicReportMapper.selectLatestByProjectId(projectId);

        DashboardSummaryRespVO respVO = new DashboardSummaryRespVO();
        respVO.setProjectId(projectId);
        respVO.setPackageCount(readiness.getPackageCount());
        respVO.setReviewedKnowledgeCount(readiness.getReviewedKnowledgeCount());
        respVO.setReviewedMediaCount(readiness.getReviewedMediaCount());
        respVO.setMapPointCount(readiness.getMapPointCount());
        respVO.setGlobeModelCount(readiness.getGlobeModelCount());
        respVO.setQrCodeCount(readiness.getQrCodeCount());
        respVO.setTotalScanCount(interactionEventMapper.selectCountByPackageIdsAndEventType(
                packageIds, EventType.SCAN.getType()));
        respVO.setTotalAskCount(interactionEventMapper.selectCountByPackageIdsAndEventType(
                packageIds, EventType.ASK.getType()));
        respVO.setTotalTriggerResolveCount(readiness.getTriggerResolveCount());
        respVO.setTotalAgentActionCount(readiness.getAgentActionCount());
        respVO.setAgentActionConversionRate(readiness.getAgentActionConversionRate());
        respVO.setTopAgentActions(buildTopAgentActionMetrics(packageIds, readiness.getAgentActionCount()));
        respVO.setAgentActionPoiFunnels(buildAgentActionPoiFunnels(packageIds));
        respVO.setAgentActionTimeWindows(buildAgentActionTimeWindows(packageIds));
        respVO.setMediaUsageCount(readiness.getMediaUsageCount());
        respVO.setAiGenerationCount(readiness.getAiGenerationCount());
        respVO.setPendingImportItemCount(readiness.getPendingImportItemCount());
        respVO.setP0Ready(readiness.getP0Ready());
        if (latestReport != null) {
            respVO.setLatestReportId(latestReport.getId());
            respVO.setLatestReportTitle(latestReport.getTitle());
            respVO.setLatestReportPeriod(latestReport.getReportPeriod());
        }
        return respVO;
    }

    @Override
    public PackageDetailRespVO getPackageDetailByCode(String packageCode) {
        XunjingResourcePackageDO resourcePackage = resourcePackageMapper.selectByPackageCode(packageCode);
        if (resourcePackage == null) {
            throw new IllegalArgumentException("xunjing resource package not exists: " + packageCode);
        }
        return buildPackageDetail(resourcePackage, false);
    }

    @Override
    public PackageDetailRespVO getPublicPackageDetailByCode(String packageCode) {
        XunjingResourcePackageDO resourcePackage = resourcePackageMapper.selectByPackageCodeAndStatus(
                packageCode, PackageStatus.PUBLISHED.getStatus());
        if (resourcePackage == null) {
            throw new IllegalArgumentException("xunjing public resource package not exists: " + packageCode);
        }
        return buildPackageDetail(resourcePackage, true);
    }

    private PackageDetailRespVO buildPackageDetail(XunjingResourcePackageDO resourcePackage, boolean publicOnly) {
        PackageDetailRespVO respVO = BeanUtils.toBean(resourcePackage, PackageDetailRespVO.class);
        Long packageId = resourcePackage.getId();
        if (publicOnly) {
            respVO.setKnowledgeDocuments(BeanUtils.toBean(knowledgeDocumentMapper.selectPublicListByPackageId(
                    packageId, ReviewStatus.APPROVED.getStatus(), VectorStatus.INDEXED.getStatus()),
                    KnowledgeDocumentRespVO.class));
            respVO.setMediaAssets(BeanUtils.toBean(mediaAssetMapper.selectPublicListByPackageId(
                    packageId, ReviewStatus.APPROVED.getStatus(), CopyrightStatus.AUTHORIZED.getStatus()),
                    MediaAssetRespVO.class));
            respVO.setMapPoints(BeanUtils.toBean(mapPointMapper.selectPublicListByPackageId(
                    packageId, PackageStatus.PUBLISHED.getStatus()), MapPointRespVO.class));
            respVO.setGlobeModels(BeanUtils.toBean(globeModelMapper.selectPublicListByPackageId(
                    packageId, PackageStatus.PUBLISHED.getStatus()), GlobeModelRespVO.class));
        } else {
            respVO.setKnowledgeDocuments(BeanUtils.toBean(knowledgeDocumentMapper.selectListByPackageId(packageId),
                    KnowledgeDocumentRespVO.class));
            respVO.setMediaAssets(BeanUtils.toBean(mediaAssetMapper.selectListByPackageId(packageId),
                    MediaAssetRespVO.class));
            respVO.setMapPoints(BeanUtils.toBean(mapPointMapper.selectListByPackageId(packageId),
                    MapPointRespVO.class));
            respVO.setGlobeModels(BeanUtils.toBean(globeModelMapper.selectListByPackageId(packageId),
                    GlobeModelRespVO.class));
        }
        return respVO;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long generatePublicReport(PublicReportGenerateReqVO reqVO) {
        validateProjectExists(reqVO.getProjectId());
        if (reqVO.getSchoolId() != null) {
            validateSchoolExists(reqVO.getSchoolId());
        }
        ReadinessRespVO readiness = getReadiness(reqVO.getProjectId(), reqVO.getSchoolId());
        XunjingPublicReportDO publicReport = new XunjingPublicReportDO();
        publicReport.setTenantId(TenantContextHolder.getRequiredTenantId());
        publicReport.setProjectId(reqVO.getProjectId());
        publicReport.setSchoolId(reqVO.getSchoolId());
        publicReport.setTitle(reqVO.getTitle());
        publicReport.setReportPeriod(reqVO.getReportPeriod());
        publicReport.setMetricsJson(buildMetricsJson(readiness));
        publicReport.setStatus(ReportStatus.GENERATED.getStatus());
        publicReport.setGeneratedAt(LocalDateTime.now());
        publicReportMapper.insert(publicReport);
        return publicReport.getId();
    }

    private String buildMetricsJson(ReadinessRespVO readiness) {
        return "{" +
                "\"packageCount\":" + readiness.getPackageCount() + "," +
                "\"reviewedKnowledgeCount\":" + readiness.getReviewedKnowledgeCount() + "," +
                "\"reviewedMediaCount\":" + readiness.getReviewedMediaCount() + "," +
                "\"mapPointCount\":" + readiness.getMapPointCount() + "," +
                "\"globeModelCount\":" + readiness.getGlobeModelCount() + "," +
                "\"qrCodeCount\":" + readiness.getQrCodeCount() + "," +
                "\"interactionCount\":" + readiness.getInteractionCount() + "," +
                "\"triggerResolveCount\":" + readiness.getTriggerResolveCount() + "," +
                "\"agentActionCount\":" + readiness.getAgentActionCount() + "," +
                "\"agentActionConversionRate\":" + readiness.getAgentActionConversionRate() + "," +
                "\"mediaUsageCount\":" + readiness.getMediaUsageCount() + "," +
                "\"aiEvalCaseCount\":" + readiness.getAiEvalCaseCount() + "," +
                "\"quotaRuleCount\":" + readiness.getQuotaRuleCount() + "," +
                "\"aiGenerationCount\":" + readiness.getAiGenerationCount() + "," +
                "\"pendingImportItemCount\":" + readiness.getPendingImportItemCount() + "," +
                "\"p0Ready\":" + readiness.getP0Ready() +
                "}";
    }

    private BigDecimal calculateAgentActionConversionRate(Long agentActionCount, Long triggerResolveCount) {
        if (triggerResolveCount == null || triggerResolveCount <= 0L) {
            return BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(agentActionCount == null ? 0L : agentActionCount)
                .divide(BigDecimal.valueOf(triggerResolveCount), 4, RoundingMode.HALF_UP);
    }

    private List<AgentActionTimeWindowRespVO> buildAgentActionTimeWindows(List<Long> packageIds) {
        LocalDate today = LocalDate.now();
        List<XunjingInteractionEventDO> triggerEvents = interactionEventMapper.selectListByPackageIdsAndEventType(
                packageIds, EventType.TRIGGER_RESOLVE.getType());
        List<XunjingInteractionEventDO> agentActionEvents = interactionEventMapper.selectListByPackageIdsAndEventType(
                packageIds, EventType.AGENT_ACTION.getType());
        return List.of(
                agentActionWindow("today", "今天", today.atStartOfDay(), triggerEvents, agentActionEvents),
                agentActionWindow("last7d", "近7天", today.minusDays(6).atStartOfDay(),
                        triggerEvents, agentActionEvents),
                agentActionWindow("last30d", "近30天", today.minusDays(29).atStartOfDay(),
                        triggerEvents, agentActionEvents));
    }

    private AgentActionTimeWindowRespVO agentActionWindow(
            String windowKey, String windowLabel, LocalDateTime startAt,
            List<XunjingInteractionEventDO> triggerEvents, List<XunjingInteractionEventDO> agentActionEvents) {
        long triggerResolveCount = triggerEvents.stream().filter(event -> eventInWindow(event, startAt)).count();
        long agentActionCount = agentActionEvents.stream().filter(event -> eventInWindow(event, startAt)).count();
        AgentActionTimeWindowRespVO respVO = new AgentActionTimeWindowRespVO();
        respVO.setWindowKey(windowKey);
        respVO.setWindowLabel(windowLabel);
        respVO.setTriggerResolveCount(triggerResolveCount);
        respVO.setAgentActionCount(agentActionCount);
        respVO.setConversionRate(calculateAgentActionConversionRate(agentActionCount, triggerResolveCount));
        return respVO;
    }

    private boolean eventInWindow(XunjingInteractionEventDO event, LocalDateTime startAt) {
        return event != null && event.getCreateTime() != null && !event.getCreateTime().isBefore(startAt);
    }

    private List<AgentActionMetricRespVO> buildTopAgentActionMetrics(
            List<Long> packageIds, Long totalAgentActionCount) {
        Map<String, AgentActionMetricRespVO> metrics = new LinkedHashMap<>();
        for (XunjingInteractionEventDO event : interactionEventMapper.selectListByPackageIdsAndEventType(
                packageIds, EventType.AGENT_ACTION.getType())) {
            Map<String, Object> root = JsonUtils.parseObjectQuietly(
                    defaultIfBlank(event.getPayloadJson(), "{}"), new TypeReference<>() {});
            Map<String, Object> agentAction = agentActionPayload(root);
            String actionKey = agentActionText(agentAction, "actionKey");
            String title = agentActionText(agentAction, "title");
            String intent = agentActionText(agentAction, "intent");
            String poiCode = agentActionText(agentAction, "poiCode");
            String poiName = agentActionText(agentAction, "poiName");
            if (actionKey.isBlank() && intent.isBlank() && poiCode.isBlank()) {
                continue;
            }
            String groupKey = actionKey + "|" + intent + "|" + poiCode;
            AgentActionMetricRespVO metric = metrics.computeIfAbsent(groupKey, key -> {
                AgentActionMetricRespVO value = new AgentActionMetricRespVO();
                value.setActionKey(actionKey);
                value.setTitle(title);
                value.setIntent(intent);
                value.setPoiCode(poiCode);
                value.setPoiName(poiName);
                value.setExecutionCount(0L);
                return value;
            });
            if (defaultIfBlank(metric.getTitle(), "").isBlank() && !title.isBlank()) {
                metric.setTitle(title);
            }
            if (defaultIfBlank(metric.getPoiName(), "").isBlank() && !poiName.isBlank()) {
                metric.setPoiName(poiName);
            }
            metric.setExecutionCount(metric.getExecutionCount() + 1L);
        }
        return metrics.values().stream()
                .sorted((left, right) -> {
                    int byExecutionCount = Long.compare(right.getExecutionCount(), left.getExecutionCount());
                    if (byExecutionCount != 0) {
                        return byExecutionCount;
                    }
                    int byActionKey = defaultIfBlank(left.getActionKey(), "")
                            .compareTo(defaultIfBlank(right.getActionKey(), ""));
                    if (byActionKey != 0) {
                        return byActionKey;
                    }
                    int byIntent = defaultIfBlank(left.getIntent(), "")
                            .compareTo(defaultIfBlank(right.getIntent(), ""));
                    if (byIntent != 0) {
                        return byIntent;
                    }
                    return defaultIfBlank(left.getPoiCode(), "")
                            .compareTo(defaultIfBlank(right.getPoiCode(), ""));
                })
                .limit(5)
                .peek(metric -> metric.setShareRate(calculateAgentActionConversionRate(
                        metric.getExecutionCount(), totalAgentActionCount)))
                .toList();
    }

    private List<AgentActionPoiFunnelRespVO> buildAgentActionPoiFunnels(List<Long> packageIds) {
        Map<String, AgentActionPoiFunnelRespVO> funnels = new LinkedHashMap<>();
        for (XunjingInteractionEventDO event : interactionEventMapper.selectListByPackageIdsAndEventType(
                packageIds, EventType.TRIGGER_RESOLVE.getType())) {
            recordPoiFunnelTriggerResolve(funnels, eventPayload(event));
        }
        for (XunjingInteractionEventDO event : interactionEventMapper.selectListByPackageIdsAndEventType(
                packageIds, EventType.AGENT_ACTION.getType())) {
            recordPoiFunnelAgentAction(funnels, agentActionPayload(eventPayload(event)));
        }
        return funnels.values().stream()
                .peek(funnel -> funnel.setConversionRate(calculateAgentActionConversionRate(
                        funnel.getAgentActionCount(), funnel.getTriggerResolveCount())))
                .sorted((left, right) -> {
                    int byTriggerCount = Long.compare(right.getTriggerResolveCount(), left.getTriggerResolveCount());
                    if (byTriggerCount != 0) {
                        return byTriggerCount;
                    }
                    int byActionCount = Long.compare(right.getAgentActionCount(), left.getAgentActionCount());
                    if (byActionCount != 0) {
                        return byActionCount;
                    }
                    return defaultIfBlank(left.getPoiCode(), "").compareTo(defaultIfBlank(right.getPoiCode(), ""));
                })
                .limit(10)
                .toList();
    }

    private void recordPoiFunnelTriggerResolve(
            Map<String, AgentActionPoiFunnelRespVO> funnels, Map<String, Object> payload) {
        AgentActionPoiFunnelRespVO funnel = poiFunnel(funnels,
                agentActionText(payload, "poiCode"), agentActionText(payload, "poiName"));
        if (funnel != null) {
            funnel.setTriggerResolveCount(funnel.getTriggerResolveCount() + 1L);
        }
    }

    private void recordPoiFunnelAgentAction(
            Map<String, AgentActionPoiFunnelRespVO> funnels, Map<String, Object> payload) {
        AgentActionPoiFunnelRespVO funnel = poiFunnel(funnels,
                agentActionText(payload, "poiCode"), agentActionText(payload, "poiName"));
        if (funnel != null) {
            funnel.setAgentActionCount(funnel.getAgentActionCount() + 1L);
        }
    }

    private AgentActionPoiFunnelRespVO poiFunnel(
            Map<String, AgentActionPoiFunnelRespVO> funnels, String poiCode, String poiName) {
        if (poiCode.isBlank()) {
            return null;
        }
        AgentActionPoiFunnelRespVO funnel = funnels.computeIfAbsent(poiCode, key -> {
            AgentActionPoiFunnelRespVO value = new AgentActionPoiFunnelRespVO();
            value.setPoiCode(poiCode);
            value.setPoiName(poiName);
            value.setTriggerResolveCount(0L);
            value.setAgentActionCount(0L);
            return value;
        });
        if (defaultIfBlank(funnel.getPoiName(), "").isBlank() && !poiName.isBlank()) {
            funnel.setPoiName(poiName);
        }
        return funnel;
    }

    private Map<String, Object> eventPayload(XunjingInteractionEventDO event) {
        return JsonUtils.parseObjectQuietly(
                defaultIfBlank(event.getPayloadJson(), "{}"), new TypeReference<>() {});
    }

    private Map<String, Object> agentActionPayload(Map<String, Object> root) {
        if (root == null || !(root.get("agentAction") instanceof Map<?, ?> rawAgentAction)) {
            return Map.of();
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        rawAgentAction.forEach((key, value) -> {
            if (key != null) {
                payload.put(String.valueOf(key), value);
            }
        });
        return payload;
    }

    private String agentActionText(Map<String, Object> agentAction, String fieldName) {
        if (agentAction == null || agentAction.get(fieldName) == null) {
            return "";
        }
        return defaultIfBlank(String.valueOf(agentAction.get(fieldName)), "").trim();
    }

    private String parseHost(String sourceUrl) {
        if (sourceUrl == null || sourceUrl.isBlank()) {
            return null;
        }
        try {
            return new URI(sourceUrl).getHost();
        } catch (URISyntaxException ex) {
            return null;
        }
    }

    private String defaultIfBlank(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value;
    }

    private List<CrawlerRunItemReqVO> buildDefaultCrawlerRunItems(XunjingCrawlerSourceDO crawlerSource) {
        List<CrawlerRunItemReqVO> runItems = new ArrayList<>();
        CrawlerRunItemReqVO knowledgeItem = new CrawlerRunItemReqVO();
        knowledgeItem.setItemType(ITEM_TYPE_WEB_PAGE);
        knowledgeItem.setItemTitle("采集资料：" + defaultIfBlank(crawlerSource.getHost(), crawlerSource.getSourceUrl()));
        knowledgeItem.setOriginalUrl(crawlerSource.getSourceUrl());
        knowledgeItem.setSourceProvider(defaultSourceProvider(crawlerSource));
        knowledgeItem.setEvidenceText(buildCrawlerEvidenceText(crawlerSource, null));
        knowledgeItem.setTargetType(TARGET_TYPE_KNOWLEDGE);
        runItems.add(knowledgeItem);
        if (Boolean.TRUE.equals(crawlerSource.getCaptureAssets()) && !Boolean.TRUE.equals(crawlerSource.getMetadataOnly())) {
            CrawlerRunItemReqVO mediaItem = new CrawlerRunItemReqVO();
            mediaItem.setItemType(ITEM_TYPE_IMAGE_ASSET);
            mediaItem.setItemTitle(defaultSourceProvider(crawlerSource) + "图片候选："
                    + defaultIfBlank(crawlerSource.getHost(), crawlerSource.getSourceUrl()));
            mediaItem.setOriginalUrl(crawlerSource.getSourceUrl());
            mediaItem.setSourceProvider(defaultSourceProvider(crawlerSource));
            mediaItem.setEvidenceText(buildCrawlerEvidenceText(crawlerSource, null));
            mediaItem.setTargetType(TARGET_TYPE_MEDIA);
            runItems.add(mediaItem);
        }
        return runItems;
    }

    private XunjingImportItemDO buildCrawlerImportItem(
            XunjingCrawlerSourceDO crawlerSource, CrawlerRunItemReqVO runItem) {
        String targetType = defaultIfBlank(runItem.getTargetType(), targetTypeByItemType(runItem.getItemType()));
        String itemType = defaultIfBlank(runItem.getItemType(),
                TARGET_TYPE_MEDIA.equals(targetType) ? ITEM_TYPE_IMAGE_ASSET : ITEM_TYPE_WEB_PAGE);
        XunjingImportItemDO importItem = new XunjingImportItemDO();
        importItem.setId(null);
        importItem.setSourceId(crawlerSource.getId());
        importItem.setProjectId(crawlerSource.getProjectId());
        importItem.setPackageId(crawlerSource.getPackageId());
        importItem.setItemType(itemType);
        importItem.setItemTitle(defaultIfBlank(runItem.getItemTitle(), defaultCrawlerItemTitle(crawlerSource, targetType)));
        importItem.setOriginalUrl(defaultIfBlank(runItem.getOriginalUrl(), crawlerSource.getSourceUrl()));
        importItem.setFileUrl(runItem.getFileUrl());
        importItem.setSourceProvider(defaultIfBlank(runItem.getSourceProvider(), defaultSourceProvider(crawlerSource)));
        importItem.setEvidenceText(defaultIfBlank(runItem.getEvidenceText(), buildCrawlerEvidenceText(crawlerSource, runItem)));
        importItem.setTargetType(targetType);
        importItem.setReviewStatus(ReviewStatus.PENDING.getStatus());
        importItem.setStatus(ImportStatus.PENDING_REVIEW.getStatus());
        importItem.setTenantId(TenantContextHolder.getRequiredTenantId());
        return importItem;
    }

    private String targetTypeByItemType(String itemType) {
        String value = defaultIfBlank(itemType, ITEM_TYPE_WEB_PAGE).toUpperCase();
        if (value.contains("IMAGE") || value.contains("VIDEO") || value.contains("MODEL")) {
            return TARGET_TYPE_MEDIA;
        }
        return TARGET_TYPE_KNOWLEDGE;
    }

    private String defaultCrawlerItemTitle(XunjingCrawlerSourceDO crawlerSource, String targetType) {
        String sourceName = defaultSourceProvider(crawlerSource);
        String host = defaultIfBlank(crawlerSource.getHost(), crawlerSource.getSourceUrl());
        if (TARGET_TYPE_MEDIA.equals(targetType)) {
            return sourceName + "素材候选：" + host;
        }
        return "采集资料：" + host;
    }

    private String defaultSourceProvider(XunjingCrawlerSourceDO crawlerSource) {
        if ("tuyingzhonghua".equalsIgnoreCase(crawlerSource.getConnector())) {
            return "图影中华";
        }
        return defaultIfBlank(crawlerSource.getConnector(), "项目方授权资料");
    }

    private String buildCrawlerEvidenceText(XunjingCrawlerSourceDO crawlerSource, CrawlerRunItemReqVO runItem) {
        String sourceUrl = runItem == null ? crawlerSource.getSourceUrl()
                : defaultIfBlank(runItem.getOriginalUrl(), crawlerSource.getSourceUrl());
        return "采集来源：" + defaultIfBlank(sourceUrl, "")
                + "；采集器：" + defaultSourceProvider(crawlerSource)
                + "；来源策略：" + defaultIfBlank(crawlerSource.getFactSourcePolicy(),
                "official_first_with_manual_review")
                + "；说明：" + defaultIfBlank(crawlerSource.getNotes(), "待后台人工审核。");
    }

    private boolean isMediaImportItem(XunjingImportItemDO importItem) {
        return TARGET_TYPE_MEDIA.equals(importItem.getTargetType())
                || TARGET_TYPE_MEDIA.equals(targetTypeByItemType(importItem.getItemType()));
    }

    private Long publishMediaImportItem(XunjingImportItemDO importItem) {
        XunjingMediaAssetDO mediaAsset = new XunjingMediaAssetDO();
        mediaAsset.setPackageId(importItem.getPackageId());
        mediaAsset.setTitle(importItem.getItemTitle());
        mediaAsset.setMediaType(mediaTypeByItemType(importItem.getItemType()));
        mediaAsset.setFileUrl(defaultIfBlank(importItem.getFileUrl(), importItem.getOriginalUrl()));
        mediaAsset.setSourceProvider(defaultIfBlank(importItem.getSourceProvider(), "项目方授权资料"));
        mediaAsset.setSourceUrl(defaultIfBlank(importItem.getOriginalUrl(), importItem.getFileUrl()));
        mediaAsset.setCopyrightStatus(CopyrightStatus.AUTHORIZED.getStatus());
        mediaAsset.setReviewStatus(ReviewStatus.APPROVED.getStatus());
        mediaAsset.setImageTags(importItem.getEvidenceText());
        mediaAsset.setCanPublic(true);
        mediaAsset.setCanAiUse(true);
        mediaAsset.setCanPromotionUse(false);
        mediaAsset.setTenantId(TenantContextHolder.getRequiredTenantId());
        mediaAssetMapper.insert(mediaAsset);

        importItem.setReviewStatus(ReviewStatus.APPROVED.getStatus());
        importItem.setStatus(ImportStatus.IMPORTED.getStatus());
        importItem.setTargetType(TARGET_TYPE_MEDIA);
        importItem.setTargetId(mediaAsset.getId());
        importItemMapper.updateById(importItem);
        return mediaAsset.getId();
    }

    private String mediaTypeByItemType(String itemType) {
        String value = defaultIfBlank(itemType, ITEM_TYPE_IMAGE_ASSET).toUpperCase();
        if (value.contains("VIDEO")) {
            return MediaType.VIDEO.getType();
        }
        if (value.contains("MODEL")) {
            return MediaType.MODEL.getType();
        }
        return MediaType.IMAGE.getType();
    }

    private AiEvalRunCaseRespVO buildAiEvalRunCaseResult(XunjingAiEvalCaseDO evalCase, RagChatRespVO answer) {
        AiEvalRunCaseRespVO result = new AiEvalRunCaseRespVO();
        result.setCaseId(evalCase.getId());
        result.setQuestion(evalCase.getQuestion());
        result.setSafetyStatus(answer.getSafetyStatus());
        result.setSourceCount(answer.getSources() == null ? 0 : answer.getSources().size());
        result.setLogId(answer.getLogId());
        result.setAnswer(answer.getAnswer());

        String failureReason = null;
        if (!AiSafetyStatus.PASSED.getStatus().equals(answer.getSafetyStatus())) {
            failureReason = "SAFETY_STATUS_" + defaultIfBlank(answer.getSafetyStatus(), "UNKNOWN");
        } else if (Boolean.TRUE.equals(evalCase.getSourceRequired()) && result.getSourceCount() == 0) {
            failureReason = "SOURCE_REQUIRED_BUT_EMPTY";
        } else if (answer.getAnswer() == null || answer.getAnswer().isBlank()) {
            failureReason = "ANSWER_EMPTY";
        } else if (requiresUnknownAnswerDecline(evalCase) && !hasUnknownAnswerDecline(answer.getAnswer())) {
            failureReason = "UNKNOWN_ANSWER_POLICY_NOT_MET";
        }
        result.setPassed(failureReason == null);
        result.setFailureReason(failureReason);
        return result;
    }

    private boolean requiresUnknownAnswerDecline(XunjingAiEvalCaseDO evalCase) {
        String riskTags = defaultIfBlank(evalCase.getRiskTags(), "").toLowerCase();
        return riskTags.contains("unknown_answer")
                || riskTags.contains("unknown-answer")
                || riskTags.contains("insufficient_source")
                || riskTags.contains("real_time");
    }

    private boolean hasUnknownAnswerDecline(String answer) {
        return containsAny(answer, List.of("暂时没有", "资料不足", "无法确认", "不能直接回答", "没有找到", "未找到",
                "暂无法", "不能确认", "不确定"));
    }

    private boolean containsAny(String text, List<String> candidates) {
        if (text == null || text.isBlank()) {
            return false;
        }
        return candidates.stream().anyMatch(text::contains);
    }

    private void validateProjectExists(Long projectId) {
        if (projectMapper.selectById(projectId) == null) {
            throw new IllegalArgumentException("xunjing project not exists: " + projectId);
        }
    }

    private void validateSchoolExists(Long schoolId) {
        if (schoolMapper.selectById(schoolId) == null) {
            throw new IllegalArgumentException("xunjing school not exists: " + schoolId);
        }
    }

    private void validatePackageExists(Long packageId) {
        if (resourcePackageMapper.selectById(packageId) == null) {
            throw new IllegalArgumentException("xunjing resource package not exists: " + packageId);
        }
    }

    private void validateCrawlerSourceExists(Long sourceId) {
        if (crawlerSourceMapper.selectById(sourceId) == null) {
            throw new IllegalArgumentException("xunjing crawler source not exists: " + sourceId);
        }
    }

    private void validateMediaAssetExists(Long mediaId) {
        if (mediaAssetMapper.selectById(mediaId) == null) {
            throw new IllegalArgumentException("xunjing media asset not exists: " + mediaId);
        }
    }

    private void validateAiEvalSetExists(Long evalSetId) {
        if (aiEvalSetMapper.selectById(evalSetId) == null) {
            throw new IllegalArgumentException("xunjing ai eval set not exists: " + evalSetId);
        }
    }

}
