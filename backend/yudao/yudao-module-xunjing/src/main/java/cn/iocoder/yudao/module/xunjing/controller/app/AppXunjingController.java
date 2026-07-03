package cn.iocoder.yudao.module.xunjing.controller.app;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.PublicReportSummaryRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.RagChatReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.RagChatRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.MultimodalTriggerReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.MultimodalTriggerRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.ScanResolveReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.ScanResolveRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.TravelRecordMaterialFeedRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.VisionAgentKnowledgeGraphRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.VisionAgentMemorySessionRespVO;
import cn.iocoder.yudao.module.xunjing.enums.XunjingEnums.ResourceType;
import cn.iocoder.yudao.module.xunjing.service.app.XunjingAppService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.annotation.security.PermitAll;
import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;

@Tag(name = "用户 App - 星河寻境 P0 闭环")
@RestController
@RequestMapping("/xunjing")
@Validated
public class AppXunjingController {

    @Resource
    private XunjingAppService appService;

    @PostMapping("/scan/resolve")
    @Operation(summary = "扫码解析资源包")
    @PermitAll
    public CommonResult<ScanResolveRespVO> resolveScan(@Valid @RequestBody ScanResolveReqVO reqVO) {
        return success(appService.resolveScan(reqVO));
    }

    @PostMapping("/ai/chat")
    @Operation(summary = "AI 问答，返回来源")
    @PermitAll
    public CommonResult<RagChatRespVO> chat(@Valid @RequestBody RagChatReqVO reqVO) {
        return success(appService.answer(reqVO));
    }

    @PostMapping("/triggers/resolve")
    @Operation(summary = "多模态触发识别")
    @PermitAll
    public CommonResult<MultimodalTriggerRespVO> resolveTrigger(
            @Valid @RequestBody MultimodalTriggerReqVO reqVO) {
        return success(appService.resolveMultimodalTrigger(reqVO));
    }

    @GetMapping("/travel-record/materials")
    @Operation(summary = "查询旅行记录素材流")
    @PermitAll
    public CommonResult<TravelRecordMaterialFeedRespVO> listTravelRecordMaterials(
            @RequestParam("packageCode") String packageCode,
            @RequestParam("userTraceId") String userTraceId,
            @RequestParam(value = "limit", required = false) Integer limit) {
        return success(appService.listTravelRecordMaterials(packageCode, userTraceId, limit));
    }

    @GetMapping("/memory/session")
    @Operation(summary = "查询 AI 识境连续记忆")
    @PermitAll
    public CommonResult<VisionAgentMemorySessionRespVO> getVisionAgentMemorySession(
            @RequestParam("packageCode") String packageCode,
            @RequestParam("userTraceId") String userTraceId,
            @RequestParam(value = "limit", required = false) Integer limit) {
        return success(appService.getVisionAgentMemorySession(packageCode, userTraceId, limit));
    }

    @GetMapping("/knowledge/graph")
    @Operation(summary = "查询 AI 识境城市知识图谱")
    @PermitAll
    public CommonResult<VisionAgentKnowledgeGraphRespVO> getVisionAgentKnowledgeGraph(
            @RequestParam("packageCode") String packageCode,
            @RequestParam(value = "regionCode", required = false) String regionCode,
            @RequestParam("poiCode") String poiCode,
            @RequestParam(value = "limit", required = false) Integer limit) {
        return success(appService.getVisionAgentKnowledgeGraph(packageCode, regionCode, poiCode, limit));
    }

    @PostMapping("/reading/ask")
    @Operation(summary = "图书伴读问答")
    @PermitAll
    public CommonResult<RagChatRespVO> readingAsk(@Valid @RequestBody RagChatReqVO reqVO) {
        return success(answerWithScene(reqVO, "reading-ask", ResourceType.BOOK.getType()));
    }

    @PostMapping("/map/explain")
    @Operation(summary = "地图扫码讲解")
    @PermitAll
    public CommonResult<RagChatRespVO> mapExplain(@Valid @RequestBody RagChatReqVO reqVO) {
        return success(answerWithScene(reqVO, "map-explain", ResourceType.MAP.getType()));
    }

    @PostMapping("/globe/explain")
    @Operation(summary = "地球仪扫码讲解")
    @PermitAll
    public CommonResult<RagChatRespVO> globeExplain(@Valid @RequestBody RagChatReqVO reqVO) {
        return success(answerWithScene(reqVO, "globe-explain", ResourceType.GLOBE.getType()));
    }

    @GetMapping("/public-report/summary")
    @Operation(summary = "公益报告公开摘要")
    @PermitAll
    public CommonResult<PublicReportSummaryRespVO> getPublicReportSummary(
            @RequestParam("packageCode") String packageCode) {
        return success(appService.getPublicReportSummary(packageCode));
    }

    private RagChatRespVO answerWithScene(RagChatReqVO reqVO, String sceneCode, String expectedResourceType) {
        if (reqVO.getSceneCode() == null || reqVO.getSceneCode().isBlank()) {
            reqVO.setSceneCode(sceneCode);
        }
        return appService.answerForResourceType(reqVO, expectedResourceType);
    }

}
