# 西城 APP 预发证据采集手册

更新时间：2026-06-30

## 目标

把 APP 侧“本地通过”升级为可上线证据。当前 preflight 的 APP blocker 是：`APP readiness evidence baseUrl must be a non-local HTTPS URL`。因此，最终放行必须来自生产或预发的非本地 HTTPS 后端，不得使用 localhost、fixture、mock 或开发缓存替代。

## 前置条件

- 分支必须是 `feature/xicheng-p0`，稳定主线 `product/city-companion-main` 不直接开发。
- `XUNJING_APP_API_BASE_URL` 必须是非本地 HTTPS Yudao APP API 域名。
- APP 构建必须使用同一个 HTTPS 域名：`VITE_XUNJING_YUDAO_APP_BASE_URL=$XUNJING_APP_API_BASE_URL`。
- APP 构建必须显式带租户：`VITE_XUNJING_TENANT_ID`，且租户必须是 Yudao 正整数编号。
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
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" npm run verify:yudao:preprod
```

该命令会先从 `XUNJING_RELEASE_ENV_FILE` 加载缺失的 release 变量，再执行 release 环境校验，拒绝 localhost、127.0.0.1、局域网和非 HTTPS 地址，然后调用仓库根目录 `npm run xunjing:platform:verify --`，输出 `qa/xicheng-app-readiness-evidence.json`。命令行显式传入的环境变量优先，安全 env 文件不得提交到仓库。

`XUNJING_TENANT_ID` 不能使用 `0`、负数或 `tenant-prod` 这类环境占位符；预发证据和真机证据中的 `tenantId` 必须保持同一个正整数编号。

`qa/xicheng-app-readiness-evidence.json` 的 `checkedAt` 必须是 72 小时内的预发或生产实测时间；旧证据需要重新采集。

## 真机证据校验

预发或上线前，必须在真实手机上安装 release 包，记录 `qa/xicheng-native-device-evidence.json`，并在 `assets/references/APP/kashgar-mini-program` 运行：

```bash
XUNJING_RELEASE_ARTIFACT="/absolute/path/to/signed-release.apk" \
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" \
XUNJING_NATIVE_DEVICE_EVIDENCE_FILE="../../../../qa/xicheng-native-device-evidence.json" \
npm run prepare:native:evidence
```

`npm run prepare:native:evidence` 使用 `XUNJING_RELEASE_ARTIFACT` 和 `XUNJING_RELEASE_ENV_FILE` 初始化真机证据模板，自动填入当前 commit、`createdAt`、release 包路径、`artifactSha256`、`artifactSizeBytes`、`appApiBaseUrl`、`tenantId` 和 `releaseTargets`。`XUNJING_RELEASE_ARTIFACT` 必须是手机安装包文件：Android APK/AAB 或 iOS IPA。模板中的场景状态都是 `TODO`，`evidenceRef` 默认指向 `qa/native/<scenario>.jpg`；不得把模板当成通过证据，必须完成真机验证并补齐设备信息、截图或录屏引用 `evidenceRef` 后，才能把场景状态改成 `PASS`。

`XUNJING_RELEASE_TARGETS` 或 `--platform` 只允许手机端发布目标：`android`、`ios`。H5、web、小程序等目标不能写入本轮手机端上线证据。

每个 `qa/xicheng-native-device-evidence.json` 只描述一个手机平台的一个 release 包：Android 证据必须使用 `.apk` 或 `.aab`，iOS 证据必须使用 `.ipa`。如果同一版本同时发 Android 和 iOS，需要分别生成和校验两份真机证据文件。

```bash
XUNJING_NATIVE_DEVICE_EVIDENCE_FILE="../../../../qa/xicheng-native-device-evidence.json" \
npm run verify:native:evidence
```

真机证据的 `build.artifact` 必须记录真实手机安装包 release 路径，只接受 `.apk`、`.aab` 或 `.ipa`，并记录 `artifactSha256` 和 `artifactSizeBytes`。校验命令会读取该 release 包并比对 SHA256/大小；如果 release 包不存在、大小不一致、哈希不一致或不是手机安装包，不能放行。

真机证据的 `releaseTargets` 只允许 `android` 或 `ios`；每个目标都必须有真实设备记录。

真机场景至少覆盖：

- `install-release-build`：安装 release 包并确认版本。
- `home-loads-xicheng`：打开首页并确认西城 P0 首页。
- `camera-photo-recognition`：真机拍照识别进入后端触发链路。
- `ocr-text-recognition`：OCR 或图片文字识别进入识别结果页。
- `gps-recognition-permission`：用户触发后授权定位并完成 GPS 识别失败/成功处理。
- `text-recognition-baitasi`：文本识别白塔寺。
- `scan-entry-map-detail`：真实手机扫码 `QR-XICHENG-MAP-001` 后落到 `/pages/map/detail`，备注记录 `XICHENG-MAP-001`。
- `scan-result-sources`：识别结果页展示已审核来源。
- `xiaojing-sourced-answer`：小京展示有来源回答。
- `xiaojing-blocked-answer`：无来源点位只显示“无已审核来源，不能回答”。
- `recording-start-stop`：开始和停止记录。
- `travelogue-draft-generated`：生成游记草稿。

每个真机场景的 `evidenceRef` 必须指向仓库 `qa/` 下真实存在且非空的截图或录屏文件，建议归档到 `qa/native/`；只写文件名、空文件、不存在的路径或临时目录文件都不能放行。

## 手机端放行证据包

`qa/xicheng-app-readiness-evidence.json` 是预发证据，`qa/xicheng-native-device-evidence.json` 是真机证据。二者必须属于同一个手机端发布候选：预发证据的 `baseUrl`、`tenantId` 必须等于真机证据的 `appApiBaseUrl`、`tenantId`，真机证据的 `commit` 必须等于当前 `git HEAD`，预发证据 `checkedAt` 和真机证据 `createdAt` 都必须在 72 小时内。

最终 `verify:launch:evidence` 会复用 `verify:release:artifact` 扫描真机证据里的安装包本体 `build.artifact`。如果签名后的 APK/ZIP 内部包含 localhost、局域网、fixture、H5 proxy 标记或真实 token，不能放行。

在 `assets/references/APP/kashgar-mini-program` 运行：

```bash
XUNJING_PREPROD_EVIDENCE_FILE="../../../../qa/xicheng-app-readiness-evidence.json" \
XUNJING_NATIVE_DEVICE_EVIDENCE_FILE="../../../../qa/xicheng-native-device-evidence.json" \
npm run verify:launch:evidence
```

该命令会复用真机证据校验，并额外确认预发后端证据包含 `live-xicheng-ai-chat-sourced`、`live-xicheng-ai-chat-blocked`、白塔寺、恭王府、北京天文馆 trigger smoke，以及扫码入口解析 `live-xicheng-scan-resolve`。扫码入口证据的 `targetPath` 必须指向 `/pages/map/detail`，`packageCode` 必须为 `XICHENG-MAP-001`，`tenantId` 必须和预发汇总一致。通过后才说明 APP 包、预发后端和真机证据来自同一个候选版本。

如果需要给运营或测试同事快速判断当前候选还差什么，在同一目录运行只读审计：

```bash
XUNJING_APP_API_BASE_URL="$XUNJING_APP_API_BASE_URL" \
XUNJING_TENANT_ID="$XUNJING_TENANT_ID" \
XUNJING_RELEASE_ARTIFACT="/absolute/path/to/signed-release.apk" \
npm run audit:release:candidate
```

审计结果只输出 `GO` / `NO_GO`、`blockers` 和 `nextActions`。`NO_GO` 不代表 APP 主链不可用，只代表手机端上线证据还没闭环；`GO` 必须同时证明预发证据、真机证据、签名安装包扫描、双远端 commit 一致和 `verify:launch:evidence` 均通过。

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

预发或上线真机包必须使用 release 打包入口，避免把 localhost、局域网或旧 Yudao 默认域名打进 APP 包：

```bash
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" npm run build:app:release
```

该 release 构建会自动执行 `npm run verify:release:artifact` 扫描 `dist/build/app-release`；同一脚本也可扫描 APK/ZIP 安装包内部文本资源。release 构建产物不得包含 `localhost`、`127.0.0.1`、局域网地址、`XICHENG_DEVELOPMENT_TRIGGER_FIXTURE`、H5 proxy 标记、`sk-`、`pat_`、`AKIA`、真实 token 或与 `XUNJING_APP_API_BASE_URL` 不一致的 Yudao APP API 网关。包内必须能扫描到 `XUNJING_APP_API_BASE_URL` 指定的 Yudao APP API 网关；旧 `api2/*`、图片和静态资源仍可保留原线上域名，但不得替代 `/app-api/xunjing/**` 的 release 网关。

生成 signed APK/AAB 或 iOS IPA 前，先检查手机原生打包前置条件：

```bash
XUNJING_RELEASE_TARGETS="android" \
XUNJING_APP_API_BASE_URL="$XUNJING_APP_API_BASE_URL" \
XUNJING_TENANT_ID="$XUNJING_TENANT_ID" \
XUNJING_ANDROID_PACKAGE_NAME="com.xinghe.xunjing" \
XUNJING_ANDROID_KEYSTORE="/secure/path/xicheng-release.keystore" \
XUNJING_ANDROID_KEY_ALIAS="xicheng-release" \
XUNJING_ANDROID_KEYSTORE_PASSWORD="$XUNJING_ANDROID_KEYSTORE_PASSWORD" \
XUNJING_ANDROID_KEY_PASSWORD="$XUNJING_ANDROID_KEY_PASSWORD" \
npm run verify:native:package:ready
```

该命令会检查 HBuilderX CLI 是否可用、release 网关和租户是否有效、Android package name 和签名配置是否齐全，并确认 Android 权限仍只包含 `ACCESS_NETWORK_STATE`、`CAMERA`、`ACCESS_COARSE_LOCATION`、`ACCESS_FINE_LOCATION`。门禁通过不等于已经生成安装包；它只是说明当前配置可以进入 HBuilderX signed APK/AAB 原生打包，然后再用 `XUNJING_RELEASE_ARTIFACT` 生成真机 evidence 模板。

先 dry-run 检查 HBuilderX 云打包命令是否正确，脚本不会执行真实打包，也不会输出签名密码：

```bash
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" npm run pack:native:cloud:dry-run
```

确认 `run_native_cloud_pack.mjs` 输出的 `--android.packagename`、`--android.certfile`、平台和 release 网关无误后，再显式确认执行：

```bash
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" XUNJING_NATIVE_PACK_CONFIRM=cloud-pack npm run pack:native:cloud
```

真实执行会调用 HBuilderX `pack` 并向 CLI 传入签名参数；输出会脱敏 `--android.certpassword`、`--android.storepassword` 和 iOS 证书密码。云打包产物生成后，把 signed APK/AAB 或 IPA 路径写入 `XUNJING_RELEASE_ARTIFACT`，再继续生成真机证据。

并在仓库根目录运行：

```bash
npm run test:run
```
