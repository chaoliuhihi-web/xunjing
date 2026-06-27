package cn.iocoder.yudao.module.xunjing.service.app.trigger;

import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.PhotoMetaReqVO;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class XunjingVisionRecognitionServiceTest {

    private final XunjingVisionRecognitionService service = new XunjingVisionRecognitionService();

    @Test
    public void testExtractVisionLabelsFromJsonAndChineseCaption() {
        List<String> labels = service.extractVisionLabels("""
                ```json
                {"labels":["white-pagoda","temple_gate"],"caption":"这是一张北京妙应寺白塔照片"}
                ```
                """);

        assertTrue(labels.contains("white_pagoda"));
        assertTrue(labels.contains("temple_gate"));
        assertTrue(labels.contains("temple"));
    }

    @Test
    public void testBuildVisionRequestJsonUsesDataUrl() {
        PhotoMetaReqVO photoMeta = new PhotoMetaReqVO();
        photoMeta.setImageMimeType("image/png");
        photoMeta.setImageBase64("abc123");

        String requestJson = service.buildVisionRequestJson(photoMeta);

        assertTrue(requestJson.contains("image_url"));
        assertTrue(requestJson.contains("data:image/png;base64,abc123"));
    }

}
