package cn.iocoder.yudao.module.xunjing.controller.app.resource;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.AppPackageDetailRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.AppInteractionEventReqVO;
import cn.iocoder.yudao.module.xunjing.service.app.XunjingAppService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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

@Tag(name = "用户 App - 星河寻境资源")
@RestController
@RequestMapping("/xunjing/resource")
@Validated
public class AppXunjingResourceController {

    @Resource
    private XunjingAppService appService;

    @GetMapping("/package")
    @Operation(summary = "按资源包编码获取公开资源包")
    @Parameter(name = "packageCode", description = "资源包编码", required = true)
    @PermitAll
    public CommonResult<AppPackageDetailRespVO> getPackage(@RequestParam("packageCode") String packageCode) {
        return success(appService.getPublicPackageDetail(packageCode));
    }

    @PostMapping("/events")
    @Operation(summary = "公开回传资源访问事件")
    @PermitAll
    public CommonResult<Long> recordEvent(@Valid @RequestBody AppInteractionEventReqVO reqVO) {
        return success(appService.recordEvent(reqVO));
    }

}
