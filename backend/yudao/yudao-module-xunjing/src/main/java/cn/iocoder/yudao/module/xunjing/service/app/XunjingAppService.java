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
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.TravelRecordMaterialFeedRespVO;

public interface XunjingAppService {

    ScanResolveRespVO resolveScan(ScanResolveReqVO reqVO);

    AppPackageDetailRespVO getPublicPackageDetail(String packageCode);

    RagChatRespVO answer(RagChatReqVO reqVO);

    RagChatRespVO answerForResourceType(RagChatReqVO reqVO, String expectedResourceType);

    Long recordEvent(AppInteractionEventReqVO reqVO);

    MultimodalTriggerRespVO resolveMultimodalTrigger(MultimodalTriggerReqVO reqVO);

    TravelRecordMaterialFeedRespVO listTravelRecordMaterials(String packageCode, String userTraceId, Integer limit);

    PublicReportSummaryRespVO getPublicReportSummary(String packageCode);

}
