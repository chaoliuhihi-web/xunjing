# 西城 APP 预发证据采集手册

更新时间：2026-06-30

## 目标

把 APP 侧“本地通过”升级为可上线证据。当前 preflight 的 APP blocker 是：`APP readiness evidence baseUrl must be a non-local HTTPS URL`。因此，最终放行必须来自生产或预发的非本地 HTTPS 后端，不得使用 localhost、fixture、mock 或开发缓存替代。

## 前置条件

- 分支必须是 `feature/xicheng-p0`，稳定主线 `product/city-companion-main` 不直接开发。
- `XUNJING_APP_API_BASE_URL` 必须是非本地 HTTPS Yudao APP API 域名。
- APP 构建必须使用同一个 HTTPS 域名：`VITE_XUNJING_YUDAO_APP_BASE_URL=$XUNJING_APP_API_BASE_URL`。
- APP 构建必须显式带租户：`VITE_XUNJING_TENANT_ID`。
- 微信生产配置必须由安全环境注入：`WX_MP_APP_ID`、`WX_MP_SECRET`、`WX_MINIAPP_APPID`、`WX_MINIAPP_SECRET`。
- Yudao 服务 smoke 必须已经生成 `qa/xicheng-yudao-server-smoke-evidence.json`。
- 所有 `/app-api/xunjing/**` 请求必须带 `tenant-id`。

## APP readiness evidence 覆盖项

采集 `qa/xicheng-app-readiness-evidence.json` 时至少覆盖：

- 西城首页进入扫一扫、拍照、OCR、GPS、文本识别。
- 识别结果页展示 `sources`，并带 `regionCode`、`poiCode`、`poiName` 进入小京。
- 有审核来源时，小京展示 AI 回答、来源和 `suggestedQuestions`。
- 无已审核来源时，服务端返回 `safetyStatus=BLOCKED`，小京显示“无已审核来源，不能回答”。
- 生产模式不得把 `XICHENG_DEVELOPMENT_TRIGGER_FIXTURE` 当真实识别结果。
- 白塔寺、恭王府、北京天文馆 trigger smoke 都要有通过记录。

## 当前本地基线

本地证据只能证明 APP/API 主链可回归，不能替代生产放行证据。当前本地验证文件是 `qa/xicheng-app-readiness-local-evidence.json`，目标结果为 20/20：

在 `assets/references/APP/kashgar-mini-program` 可直接运行：

```bash
npm run verify:yudao:local
```

等价的仓库根目录命令是：

```bash
npm run xunjing:platform:verify -- \
  --env-file ops/xunjing-platform.env.example \
  --base-url http://localhost:48082 \
  --tenant-id 1 \
  --skip-admin-check \
  --include-xicheng-app-check \
  --include-xicheng-trigger-check \
  --evidence-file qa/xicheng-app-readiness-local-evidence.json
```

浏览器主链 smoke 应覆盖：西城首页 -> 文本识别 -> 识别结果 -> 小京讲解 -> 开始记录 -> 西城游记草稿。

## 预发 APP evidence 采集

在 `assets/references/APP/kashgar-mini-program` 使用同一个非本地 HTTPS 后端采集 APP readiness evidence：

```bash
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" \
XUNJING_APP_API_BASE_URL="$XUNJING_APP_API_BASE_URL" \
XUNJING_TENANT_ID="$XUNJING_TENANT_ID" \
npm run verify:yudao:preprod
```

该命令会先执行 release 环境校验，拒绝 localhost、127.0.0.1、局域网和非 HTTPS 地址，然后调用仓库根目录 `npm run xunjing:platform:verify --`，输出 `qa/xicheng-app-readiness-evidence.json`。

## 真机证据校验

预发或上线前，必须在真实手机上安装 release 包，记录 `qa/xicheng-native-device-evidence.json`，并在 `assets/references/APP/kashgar-mini-program` 运行：

```bash
XUNJING_NATIVE_DEVICE_EVIDENCE_FILE="../../../../qa/xicheng-native-device-evidence.json" \
npm run verify:native:evidence
```

真机场景至少覆盖：

- `install-release-build`：安装 release 包并确认版本。
- `home-loads-xicheng`：打开首页并确认西城 P0 首页。
- `camera-photo-recognition`：真机拍照识别进入后端触发链路。
- `ocr-text-recognition`：OCR 或图片文字识别进入识别结果页。
- `gps-recognition-permission`：用户触发后授权定位并完成 GPS 识别失败/成功处理。
- `text-recognition-baitasi`：文本识别白塔寺。
- `scan-result-sources`：识别结果页展示已审核来源。
- `xiaojing-sourced-answer`：小京展示有来源回答。
- `xiaojing-blocked-answer`：无来源点位只显示“无已审核来源，不能回答”。
- `recording-start-stop`：开始和停止记录。
- `travelogue-draft-generated`：生成游记草稿。

## 手机端放行证据包

`qa/xicheng-app-readiness-evidence.json` 是预发证据，`qa/xicheng-native-device-evidence.json` 是真机证据。二者必须属于同一个手机端发布候选：预发证据的 `baseUrl`、`tenantId` 必须等于真机证据的 `appApiBaseUrl`、`tenantId`，真机证据的 `commit` 必须等于当前 `git HEAD`。

在 `assets/references/APP/kashgar-mini-program` 运行：

```bash
XUNJING_PREPROD_EVIDENCE_FILE="../../../../qa/xicheng-app-readiness-evidence.json" \
XUNJING_NATIVE_DEVICE_EVIDENCE_FILE="../../../../qa/xicheng-native-device-evidence.json" \
npm run verify:launch:evidence
```

该命令会复用真机证据校验，并额外确认预发后端证据包含 `live-xicheng-ai-chat-sourced`、`live-xicheng-ai-chat-blocked`、白塔寺、恭王府、北京天文馆 trigger smoke。通过后才说明 APP 包、预发后端和真机证据来自同一个候选版本。

## 放行核查命令

在仓库根目录使用安全环境文件执行，路径示例只表达位置，不代表真实密钥：

```bash
npm run xunjing:yudao:release:gate -- \
  --stage production \
  --expected-branch feature/xicheng-p0 \
  --env-file /secure/path/production.env \
  --yudao-server-smoke-evidence qa/xicheng-yudao-server-smoke-evidence.json \
  --app-readiness-evidence qa/xicheng-app-readiness-evidence.json \
  --evidence-file qa/xicheng-yudao-release-evidence.json
```

如果该命令仍提示 `APP readiness evidence baseUrl must be a non-local HTTPS URL`，说明 APP 还没有拿到可上线证据。

如果提示 `APP readiness evidence baseUrl must match release evidence appApiBaseUrl`，说明 `qa/xicheng-app-readiness-evidence.json` 和 `qa/xicheng-yudao-release-evidence.json` 不是同一个 HTTPS 后端生成，必须重新用同一个 `XUNJING_APP_API_BASE_URL` 采集。

## 本地 APP 回归

预发证据采集前后都要在 `assets/references/APP/kashgar-mini-program` 运行：

```bash
npm run build

for f in tests/*.test.mjs; do node "$f" || exit 1; done
```

预发或上线真机包必须使用 release 打包入口，避免把 localhost、局域网或旧线上默认域名打进 APP 包：

```bash
XUNJING_APP_API_BASE_URL="$XUNJING_APP_API_BASE_URL" \
XUNJING_TENANT_ID="$XUNJING_TENANT_ID" \
npm run build:app:release
```

并在仓库根目录运行：

```bash
npm run test:run
```
