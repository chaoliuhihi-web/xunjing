# 西城 APP 发版核查清单

更新时间：2026-06-30

最近发版基线以当前分支实时命令为准，不在文档里写死短 SHA：

```bash
git rev-parse --short HEAD
git rev-list --left-right --count HEAD...github/feature/xicheng-p0
git rev-list --left-right --count HEAD...origin/feature/xicheng-p0
```

两个 ahead/behind 结果必须都是 `0 0` 后再发布。

## 分支边界

- 只在 `feature/xicheng-p0` 开发西城 P0。
- `product/city-companion-main` 是稳定主线，不直接开发。
- 提交后同步推 GitHub 和 Gitee，并确认两个远端同一 commit。

## APP 本地门禁

在 `assets/references/APP/kashgar-mini-program` 运行：

```bash
for f in tests/*.test.mjs; do node "$f" || exit 1; done
npm run build
npm run verify:yudao:local
```

预发或生产 APP readiness evidence 必须从非本地 HTTPS 后端采集：

```bash
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" \
XUNJING_APP_API_BASE_URL="$XUNJING_APP_API_BASE_URL" \
XUNJING_TENANT_ID="$XUNJING_TENANT_ID" \
npm run verify:yudao:preprod
```

真机证据必须记录在 `qa/xicheng-native-device-evidence.json` 并通过 APP 侧校验：

```bash
XUNJING_NATIVE_DEVICE_EVIDENCE_FILE="../../../../qa/xicheng-native-device-evidence.json" \
npm run verify:native:evidence
```

真机证据至少覆盖 `camera-photo-recognition`、`ocr-text-recognition`、`gps-recognition-permission`、`xiaojing-sourced-answer`、`xiaojing-blocked-answer`、`recording-start-stop` 和 `travelogue-draft-generated`。

真机证据的 `build` 必须指向真实 release 包，并记录 `artifactSha256` 和 `artifactSizeBytes`。`npm run verify:native:evidence` 会读取该 release 包文件，校验 SHA256 和大小，避免证据里只写路径但没有对应安装包。

预发证据和真机证据必须属于同一个手机端发布候选。`qa/xicheng-app-readiness-evidence.json` 里的 `baseUrl`、`tenantId` 必须和 `qa/xicheng-native-device-evidence.json` 里的 `appApiBaseUrl`、`tenantId` 一致，真机证据里的 `commit` 必须等于当前 `git HEAD`：

```bash
XUNJING_PREPROD_EVIDENCE_FILE="../../../../qa/xicheng-app-readiness-evidence.json" \
XUNJING_NATIVE_DEVICE_EVIDENCE_FILE="../../../../qa/xicheng-native-device-evidence.json" \
npm run verify:launch:evidence
```

预发或上线真机包必须使用带网关校验的 release 构建入口：

```bash
XUNJING_APP_API_BASE_URL="$XUNJING_APP_API_BASE_URL" \
XUNJING_TENANT_ID="$XUNJING_TENANT_ID" \
npm run build:app:release
```

`build:app:release` 会自动执行 `npm run verify:release:artifact` 对 `dist/build/app-release` 做 release 构建产物扫描；同一脚本也可扫描 APK/ZIP 安装包内部文本资源。门禁拒绝 `localhost`、`127.0.0.1`、局域网地址、`XICHENG_DEVELOPMENT_TRIGGER_FIXTURE`、H5 proxy 配置、`sk-`、`pat_`、`AKIA` 和真实 token 进入手机包。

在仓库根目录运行：

```bash
npm run test:run
```

`xicheng-app-page-size-budget.test.mjs` 必须通过；如果页面接近预算，先拆组件，不再向大页面追加功能。

## 主链接口契约

- 所有 `/app-api/xunjing/**` 请求必须带 `tenant-id`。
- 识别结果进入小京时必须保留 `regionCode`、`poiCode`、`poiName`、`packageCode`。
- 后端字段必须按契约展示和传递：`suggestedQuestions`、`sources`、`safetyStatus=BLOCKED`。
- 小京遇到 `safetyStatus=BLOCKED` 时显示“无已审核来源，不能回答”，不得本地编造。
- 生产模式不得把 `XICHENG_DEVELOPMENT_TRIGGER_FIXTURE` 当真实识别结果。

## 上线证据

本地 20/20 APP readiness 只能证明链路可用，不能作为生产放行证据。最终必须使用非本地 HTTPS 后端生成 `APP readiness evidence`，并覆盖：

- 西城扫码解析。
- 错误反馈事件。
- 有审核来源的 AI 回答。
- 无匹配来源时 `safetyStatus=BLOCKED`。
- 白塔寺、恭王府、北京天文馆 trigger smoke。

如果 preflight 仍提示 `APP readiness evidence baseUrl must be a non-local HTTPS URL`，说明需要生产或预发网关，不要伪造 evidence。

预发证据采集步骤见 `xicheng-app-preprod-evidence-runbook.md`。

## 生产配置硬门槛

上线前必须由生产或预发环境提供真实配置和证据：

- `XUNJING_APP_API_BASE_URL` 必须是非本地 HTTPS 后端域名。
- 微信配置必须是生产真实值：`WX_MP_APP_ID`、`WX_MP_SECRET`、`WX_MINIAPP_APPID`、`WX_MINIAPP_SECRET`。
- Yudao 服务 smoke 必须产出 `qa/xicheng-yudao-server-smoke-evidence.json`。
- 如果这些配置或证据缺失，APP 不得因为本地 fixture、mock 或开发环境通过而判定可上线。

## 禁止提交

不得提交 `node_modules`、`dist`、`unpackage`、`tmp`、密钥、真实 token 或任何第三方真实凭证。
