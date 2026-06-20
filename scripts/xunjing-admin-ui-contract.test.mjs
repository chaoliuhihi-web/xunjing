import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const apiPath =
  'backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/api/xunjing/console/index.ts'
const viewPath =
  'backend/yudao/yudao-ui/yudao-ui-admin-vue3/src/views/xunjing/console/index.vue'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function readText(path) {
  return await readFile(resolve(rootDir, path), 'utf8')
}

describe('xunjing admin ui contract', () => {
  test('exposes the Yudao admin console API client used by the operations page', async () => {
    const api = await readText(apiPath)

    expect(api).toContain("const baseUrl = '/xunjing/console'")
    expect(api).toContain('getReadiness')
    expect(api).toContain('getDashboard')
    expect(api).toContain('getResourcePackagePage')
    expect(api).toContain('updateResourcePackage')
    expect(api).toContain('getKnowledgeDocumentPage')
    expect(api).toContain('reviewKnowledgeDocument')
    expect(api).toContain('getMediaAssetPage')
    expect(api).toContain('reviewMediaAsset')
    expect(api).toContain('getQrCodePage')
    expect(api).toContain('updateQrCodeStatus')
    expect(api).toContain('getImportItemPage')
    expect(api).toContain('batchReviewImportItems')
    expect(api).toContain("url: `${baseUrl}/resource-packages/page`")
    expect(api).toContain("url: `${baseUrl}/import-items/batch-review`")
  })

  test('renders the console route wired by xunjing-module.sql', async () => {
    const view = await readText(viewPath)

    expect(view).toContain("defineOptions({ name: 'XunjingConsole' })")
    expect(view).toContain('资源包')
    expect(view).toContain('知识文档')
    expect(view).toContain('图影中华素材')
    expect(view).toContain('二维码')
    expect(view).toContain('资料导入审核')
    expect(view).toContain("v-hasPermi=\"['xunjing:resource-package:update']\"")
    expect(view).toContain("v-hasPermi=\"['xunjing:knowledge:review']\"")
    expect(view).toContain("v-hasPermi=\"['xunjing:media:review']\"")
    expect(view).toContain("v-hasPermi=\"['xunjing:qrcode:update']\"")
    expect(view).toContain("v-hasPermi=\"['xunjing:import-item:review']\"")
  })
})
