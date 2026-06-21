package cn.iocoder.yudao.module.xunjing.service.app;

import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.RagChatReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.RagChatRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.PublicReportSummaryRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.ScanResolveReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.ScanResolveRespVO;

public interface XunjingAppService {

    ScanResolveRespVO resolveScan(ScanResolveReqVO reqVO);

    RagChatRespVO answer(RagChatReqVO reqVO);

    PublicReportSummaryRespVO getPublicReportSummary(String packageCode);

}
