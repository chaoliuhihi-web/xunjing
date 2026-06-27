# 西城多模态触发 MVP 交接

更新时间：2026-06-27

## 当前已落地

本分支已把西城多模态触发 MVP 接入主工程：

- 后端新增 `/app-api/xunjing/triggers/resolve`，Controller 实际路径为 `AppXunjingController @PostMapping("/triggers/resolve")`。
- 请求契约支持 `regionCode`、`text`、`ocrText`、`location`、`photoMeta`、`imageLabels`、`recentPoiCodes`；`photoMeta` 已包含图片 MIME、宽高和受限 `imageBase64`。
- 响应契约返回 `intent`、`action`、`poiCode`、`poiName`、`confidence`、`requiresUserConfirm`、`targetPath`、`candidates`。
- 后端独立触发引擎：`backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingMultimodalTriggerEngine.java`。
- 西城现场 MVP seed POI：白塔寺/妙应寺白塔、历代帝王庙、北海公园、什刹海、大栅栏。
- 自动触发阈值：`confidence >= 0.85`；低于阈值返回确认动作。
- APP 源码已纳入主仓：`assets/references/APP/kashgar-mini-program/`。
- APP 新增共享模块：`assets/references/APP/kashgar-mini-program/request/xunjingMultimodal.js`。
- AI 旅伴拍照入口会调用多模态触发接口，并把照片元数据、当前位置、OCR/文本提示、图片标签和受限图片 base64 传给后端。
- 后端新增视觉模型适配器：`backend/yudao/yudao-module-xunjing/src/main/java/cn/iocoder/yudao/module/xunjing/service/app/trigger/XunjingVisionRecognitionService.java`，可通过 OpenAI-compatible `/chat/completions` 网关接 Qwen-VL、GPT Vision 或自建视觉服务。
- 首页“扫一扫”保持二维码解析，同时对非标准二维码/普通文本做多模态兜底。

## 重要边界

当前 MVP 已打通“接口 + 规则引擎 + APP 调用 + 后端视觉模型适配器 + 西城现场可测 POI seed”，但不是完整生产级运营平台。

- OCR：APP 当前把可获得的文字提示作为 `ocrText` 传入；后续接微信 OCR、PaddleOCR、本地插件或云端 OCR 时，仍写入同一字段。
- 图片识别：APP 会读取本地图片尺寸、MIME 和受限 base64；后端 `XunjingVisionRecognitionService` 在配置 `XUNJING_VISION_API_URL`、`XUNJING_VISION_API_KEY`、`XUNJING_VISION_MODEL` 后调用视觉模型并合并 `imageLabels`。未配置模型时不报错，继续走 GPS/OCR/文本和西城 deterministic hint 兜底。
- POI：当前是内置西城 seed，便于快速现场测试；生产应迁到后台 POI 表，支持别名、半径、图片标签、路线和内容审核。
- 路由：后端返回产品语义路径；APP 会把不存在的详情页映射到现有 AI 旅伴、地图和游记页。

## 下一位 AI 优先任务

1. 把 `XunjingMultimodalTriggerEngine` 的内置 POI seed 迁移成后台可维护 POI 表。
2. 增加 POI 字段：`poiCode`、`regionCode`、`name`、`aliases`、`latitude`、`longitude`、`radiusMeters`、`visualLabels`、`guidePackageCode`、`routeIds`、`status`。
3. 增加 Admin 页维护 POI 别名、半径、图片标签和触发错误反馈。
4. 接入真实 OCR 能力，输出 `ocrText` 后调用 `resolveXunjingMultimodalTrigger`。
5. 给测试/生产环境配置视觉模型网关：`XUNJING_VISION_API_URL`、`XUNJING_VISION_API_KEY`、`XUNJING_VISION_MODEL`；如改用 Yudao AI 模型管理，也要保持密钥只在服务端。
6. 增加识别事件表，记录触发输入摘要、候选 POI、用户确认/纠错，不保存原始敏感图片。
7. 把游记素材表接上 `photoMeta.exifLocation`、拍摄时间和识别出的 `poiCode`。

## 验证命令

```bash
cd /Users/bruce/Developer/work/AI文旅/01_星河寻境
npm run test:run
npm run xunjing:platform:verify:static
cd backend/yudao
mvn -pl yudao-module-xunjing -am test -DskipITs
cd ../../assets/references/APP/kashgar-mini-program
for f in tests/*.test.mjs; do node "$f" || exit 1; done
npm run build
```

## 给下一位 AI 的提示词

```text
请从 /Users/bruce/Developer/work/AI文旅/01_星河寻境 接手。
先同步 GitHub 最新代码，并确认推送时 GitHub 和 Gitee 都要同步。
重点阅读 AGENTS.md、docs/01_产品规划/西城AI旅伴真实试运营版_PRD_v0.2.md、docs/04_AI交接任务书/西城多模态触发MVP交接.md。
当前已落地 /app-api/xunjing/triggers/resolve，多模态契约不要重写；后续只把 OCR、POI 数据表和识别事件表接到现有契约上。图片视觉已有服务端适配器，配置 XUNJING_VISION_API_URL、XUNJING_VISION_API_KEY、XUNJING_VISION_MODEL 后即可调用模型网关。
APP 源码在 assets/references/APP/kashgar-mini-program/，不要提交 node_modules、dist、unpackage。
所有 /app-api/xunjing/** 调用必须带 tenant-id。
真实模型密钥只放服务端 Secret、Yudao AI 管理或未提交 env，禁止写入前端源码。
```
