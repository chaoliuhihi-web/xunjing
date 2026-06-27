# 西城 APP H5 移动预验收记录

日期：2026-06-27

分支：`feature/xicheng-app-complete-flow`

范围：`assets/references/APP/kashgar-mini-program/` 西城前端页面。

## 当前结论

本轮完成的是 H5 移动视口预验收，不等同于 HBuilderX/真机验收。

- HBuilderX：本机未发现 `HBuilderX.app`。
- Android 真机：`adb devices` 未发现已连接设备。
- iOS 真机/模拟器：未发现可用真机或已启动模拟器。
- H5 预览：`http://127.0.0.1:5173/`，移动视口约 390x844。

## 页面巡检

以下 8 个西城页面均已在 H5 移动视口直接打开，检查关键文案、非空白、无错误覆盖层、无相关 console error、无横向溢出：

- `pages/xicheng/home/home`
- `pages/xicheng/scan-result/scan-result`
- `pages/xicheng/route-detail/route-detail`
- `pages/xicheng/inspiration/inspiration`
- `pages/xicheng/material-box/material-box`
- `pages/xicheng/travelogue/travelogue`
- `pages/xicheng/passport/passport`
- `pages/xicheng/ops-report/ops-report`

## 主链路点击

H5 预验收已覆盖：

`西城首页 -> 一键抄作业 -> AI 提取地点 -> 匹配官方 POI -> 生成可走路线 -> 路线详情 -> 开始记录 -> 旅行素材盒 -> 生成游记草稿 -> 分享海报 -> PDF纪念册 -> 提交审核 -> 作品审核/路线护照 -> 城市运营报告`

检查结果：

- 每一步目标页面 URL 和标题符合预期。
- 每一步关键文案均存在。
- 每一步无相关 console error。
- 每一步无横向溢出。

## 本轮发现并修复

问题：导入灵感页 AI 提取后，开发兜底 POI 默认显示为“待确认”，导致直接点击“生成可走路线”不能继续。

修复：

- `pages/xicheng/inspiration/inspiration.vue` 增加 `normalizeMatchedPoiForConfirmation`。
- 匹配到的官方 POI 默认选中为“已确认”，用户仍可点击取消。
- AI 提取成功后收起输入卡片，让 POI 确认和“生成可走路线”在移动视口更容易触达。

对应测试：

- `tests/xicheng-inspiration-import-flow.test.mjs`

## 验证命令

已通过：

```bash
node tests/xicheng-inspiration-import-flow.test.mjs
for test_file in tests/*.test.mjs; do node "$test_file" || exit 1; done
npm run build
npm run build:h5
npm run test:run -- scripts/project-structure-contract.test.mjs
```

构建警告：仍有既有 Sass legacy/import/color-function deprecation warnings，未阻塞构建。

## 未完成项

目标中的“真机/HBuilderX 逐页点击视觉验收”尚未完成。完成该项需要：

1. 安装或提供可启动的 HBuilderX。
2. 连接 Android/iOS 真机，或提供可用模拟器。
3. 在 HBuilderX 导入 `assets/references/APP/kashgar-mini-program/`。
4. 运行到设备后逐页点击上述 8 个页面和主链路。
5. 将真机截图和问题清单补充到 `qa/app-xicheng/`。
