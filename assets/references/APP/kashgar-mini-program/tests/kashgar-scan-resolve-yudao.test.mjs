import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const indexPage = fs.readFileSync(path.join(root, 'pages', 'index', 'index.vue'), 'utf8')
const pagesJson = fs.readFileSync(path.join(root, 'pages.json'), 'utf8')

for (const required of [
  "apiPath: 'app-api/xunjing/scan/resolve'",
  "packageCode: 'KASHGAR-MAP-001'",
  "sourceChannel: 'APP_UNIAPP'",
  "tenantId: config.XunjingTenantId || '1'",
  'buildYudaoAppApiUrl(XUNJING_SCAN_CONFIG.apiPath)',
  "'tenant-id': XUNJING_SCAN_CONFIG.tenantId",
  'packageCode: scan.packageCode',
  'sceneCode: scan.sceneCode',
  'userTraceId: this.getXunjingUserTraceId()',
]) {
  assert.ok(indexPage.includes(required), `Index page should wire scan resolve through Yudao APP API: ${required}`)
}

assert.match(
  indexPage,
  /const buildYudaoAppApiUrl\s*=\s*\(path\)[\s\S]*config\.UrlYudaoAppRequest[\s\S]*config\.UrlRequest/,
  'Index page should reuse the online Yudao APP base with UrlRequest fallback'
)

assert.match(
  indexPage,
  /onLoad\(options = \{\}\)\s*\{[\s\S]*this\.resolveKashgarHomeMode\(options\)[\s\S]*this\.applyKashgarHomeContent\(\)[\s\S]*this\.resolveXunjingScanLaunch\(options\)/,
  'Index onLoad should keep local home rendering and then resolve launch scene without blocking it'
)

assert.match(
  indexPage,
  /safeDecodeXunjingText\(value = ''\)\s*\{[\s\S]*decodeURIComponent[\s\S]*resolveXunjingLaunchScene\(options = \{\}\)\s*\{[\s\S]*options\.scene[\s\S]*options\.sceneCode[\s\S]*options\.packageCode/,
  'Index page should extract scan scene from WeChat scene, sceneCode, and packageCode route params'
)

assert.match(
  indexPage,
  /startKashgarManualScan\(\)\s*\{[\s\S]*uni\.scanCode\(\{[\s\S]*onlyFromCamera:\s*true[\s\S]*resolveXunjingScanLaunch/,
  'Manual scan action should use UniApp native scanCode and reuse the same Yudao resolver'
)

assert.ok(
  indexPage.includes("import { isXunjingUserCancelled } from '@/request/xunjing/userCancel.js'"),
  'Manual scan cancel handling should reuse the shared UniApp user-cancel helper'
)

assert.match(
  indexPage,
  /fail:\s*\(error\) => \{[\s\S]*if\s*\(isXunjingUserCancelled\(error\)\)\s*return[\s\S]*console\.warn\('星河寻境扫码调用失败:'/,
  'Manual scan action should ignore Chinese and English user cancellation before logging or falling back'
)

const manualScanSource = indexPage.match(/startKashgarManualScan\(\)\s*\{[\s\S]*?\n\t\t\},\n\t\tenterKashgarExperience/)?.[0] || ''
assert.ok(
  !/\/cancel\/i\.test\(errMsg\)/.test(manualScanSource),
  'Manual scan action should not hand-roll English-only cancel detection'
)

assert.match(
  indexPage,
  /handleKashgarAction\(action\)[\s\S]*action\.target === 'map'[\s\S]*this\.startKashgarManualScan\(\)/,
  'The existing "扫一扫" card should open scan instead of bypassing to the old map link'
)

assert.match(
  indexPage,
  /requestXunjingScanResolve\(scan = \{\}\)\s*\{[\s\S]*uni\.request\(\{[\s\S]*method:\s*'POST'[\s\S]*timeout:\s*8000[\s\S]*getYudaoCommonResultPayload/,
  'Scan resolve should POST to Yudao with timeout and CommonResult parsing'
)

assert.match(
  indexPage,
  /normalizeXunjingTargetPath\(targetPath = '', scan = \{\}\)\s*\{[\s\S]*\/pages\/map\/detail[\s\S]*\/subPackages\/feature\/map\/map\?[\s\S]*packageCode[\s\S]*sceneCode/,
  'Backend map targetPath should be mapped to the existing UniApp map page'
)

assert.match(
  indexPage,
  /resolveXunjingScanLaunch\(options = \{\}[\s\S]*\.catch\(\(error\) => \{[\s\S]*console\.warn\('星河寻境扫码解析失败:'[\s\S]*return false/,
  'Scan resolve failures should be silent and keep the local front-end fallback available'
)

assert.ok(
  !pagesJson.includes('/pages/map/detail'),
  'The original backend target /pages/map/detail is not a UniApp route and must be normalized by the index page'
)
