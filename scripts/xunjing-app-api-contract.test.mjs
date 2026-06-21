import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function readText(path) {
  return await readFile(resolve(rootDir, path), 'utf8')
}

describe('xunjing app API contract', () => {
  test('public resource package endpoint uses app DTOs and service boundary', async () => {
    const controller = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/resource/AppXunjingResourceController.java'
    )
    const appVo = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/vo/XunjingAppVO.java'
    )
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppService.java'
    )

    expect(controller).toContain('AppPackageDetailRespVO')
    expect(controller).toContain('appService.getPublicPackageDetail(packageCode)')
    expect(controller).not.toContain('XunjingConsoleService')
    expect(controller).not.toContain('controller.admin.console.vo')

    expect(appVo).toContain('class AppPackageDetailRespVO')
    expect(appVo).toContain('class AppKnowledgeDocumentRespVO')
    expect(appVo).toContain('class AppMediaAssetRespVO')
    expect(appVo).toContain('class AppMapPointRespVO')
    expect(appVo).toContain('class AppGlobeModelRespVO')

    expect(appService).toContain('AppPackageDetailRespVO getPublicPackageDetail(String packageCode)')
  })

  test('dedicated app explanation endpoints enforce resource type boundaries', async () => {
    const controller = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/controller/app/AppXunjingController.java'
    )
    const appService = await readText(
      'backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/XunjingAppService.java'
    )

    expect(controller).toContain('answerWithScene(reqVO, "reading-ask", ResourceType.BOOK.getType())')
    expect(controller).toContain('answerWithScene(reqVO, "map-explain", ResourceType.MAP.getType())')
    expect(controller).toContain('answerWithScene(reqVO, "globe-explain", ResourceType.GLOBE.getType())')
    expect(controller).toContain('appService.answerForResourceType(reqVO, expectedResourceType)')
    expect(appService).toContain('RagChatRespVO answerForResourceType(RagChatReqVO reqVO, String expectedResourceType)')
  })
})
