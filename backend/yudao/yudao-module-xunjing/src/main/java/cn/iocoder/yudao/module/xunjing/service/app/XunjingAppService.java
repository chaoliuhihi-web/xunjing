package cn.iocoder.yudao.module.xunjing.service.app;

import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.RagChatReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.RagChatRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.AppInteractionEventReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.AppPackageDetailRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.MultimodalTriggerReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.MultimodalTriggerRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.PublicReportSummaryRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.ScanResolveReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.ScanResolveRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.TravelRecordDraftRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.TravelRecordMaterialFeedRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.VisionAgentKnowledgeGraphRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.VisionAgentMemorySessionRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.VisionAgentSceneContextRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.VisionAgentServiceHandoffTaskFeedRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.VisionProviderStatusRespVO;

public interface XunjingAppService {

    ScanResolveRespVO resolveScan(ScanResolveReqVO reqVO);

    AppPackageDetailRespVO getPublicPackageDetail(String packageCode);

    RagChatRespVO answer(RagChatReqVO reqVO);

    RagChatRespVO answerForResourceType(RagChatReqVO reqVO, String expectedResourceType);

    Long recordEvent(AppInteractionEventReqVO reqVO);

    MultimodalTriggerRespVO resolveMultimodalTrigger(MultimodalTriggerReqVO reqVO);

    TravelRecordMaterialFeedRespVO listTravelRecordMaterials(String packageCode, String userTraceId, Integer limit);

    TravelRecordDraftRespVO generateTravelRecordDraft(String packageCode, String userTraceId, Integer limit);

    VisionAgentMemorySessionRespVO getVisionAgentMemorySession(String packageCode, String userTraceId, Integer limit);

    VisionAgentServiceHandoffTaskFeedRespVO listVisionAgentServiceHandoffTasks(String packageCode, String userTraceId, Integer limit);

    VisionAgentSceneContextRespVO getVisionAgentSceneContext(String packageCode, String userTraceId, String regionCode, String poiCode, Integer limit);

    VisionProviderStatusRespVO getVisionProviderStatus();

    VisionAgentKnowledgeGraphRespVO getVisionAgentKnowledgeGraph(String packageCode, String regionCode, String poiCode, Integer limit);

    PublicReportSummaryRespVO getPublicReportSummary(String packageCode);

}
