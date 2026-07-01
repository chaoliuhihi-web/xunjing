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
XUNJING_RELEASE_ENV_FILE="/secure/path/app-release.env" \
XUNJING_PLATFORM_ENV_FILE="/secure/path/platform-preprod.env" \
npm run doctor:release:prereqs

XUNJING_RELEASE_ENV_FILE="/secure/path/app-release.env" \
XUNJING_PLATFORM_ENV_FILE="/secure/path/platform-preprod.env" \
npm run verify:yudao:preprod
```

`npm run doctor:release:prereqs` 是预发证据前的只读诊断，不会触发真实云打包；它会从 `XUNJING_RELEASE_ENV_FILE` 加载 APP release env，并检查 release env、预发 API DNS、`/app-api/xunjing/scan/resolve` API 可达性、native cloud pack dry-run 和 HBuilderX 发布账号登录态。

`npm run verify:yudao:preprod` 会先从 `XUNJING_RELEASE_ENV_FILE` 加载缺失的 release 变量，再执行 release 环境校验，拒绝 localhost、127.0.0.1、局域网和非 HTTPS 地址，然后调用仓库根目录 `npm run xunjing:platform:verify --`，输出 `qa/xicheng-app-readiness-evidence.json`。`XUNJING_PLATFORM_ENV_FILE` 会作为根平台验证器的 `--env-file`，相对路径按仓库根目录解析；该文件必须包含 `SPRING_PROFILES_ACTIVE`、数据库、Redis、OSS、Qdrant、Qwen 和内部鉴权变量。如果不设置会回退使用 `XUNJING_RELEASE_ENV_FILE`，所以只包含 APP 网关、租户或签名变量的 release env 不能替代完整平台 env。命令行显式传入的环境变量优先，安全 env 文件不得提交到仓库。

`XUNJING_TENANT_ID` 不能使用 `0`、负数或 `tenant-prod` 这类环境占位符；预发证据和真机证据中的 `tenantId` 必须保持同一个正整数编号。

`qa/xicheng-app-readiness-evidence.json` 的 `checkedAt` 必须是 72 小时内的预发或生产实测时间；旧证据需要重新采集，`npm run audit:release:candidate` 会把过期预发证据标记为 `preprod-evidence-stale`。预发证据的 `summary.baseUrl` 必须是非本地 HTTPS 网关，否则会被标记为 `preprod-evidence-invalid-base-url`。预发证据的 `summary.xichengRegionCode` 必须是 `beijing-xicheng`，`summary.xichengPackageCode` 必须是 `XICHENG-MAP-001`，不能用其它城市、其它资源包或本地临时回归结果替代西城手机端候选证据。

## 真机证据校验

预发或上线前，必须在真实手机上安装 release 包，记录 `qa/xicheng-native-device-evidence.json`，并在 `assets/references/APP/kashgar-mini-program` 运行：

```bash
XUNJING_RELEASE_ARTIFACT="/absolute/path/to/signed-release.apk" \
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" \
XUNJING_NATIVE_DEVICE_EVIDENCE_FILE="../../../../qa/xicheng-native-device-evidence.json" \
npm run prepare:native:evidence
```

`npm run prepare:native:evidence` 使用 `XUNJING_RELEASE_ARTIFACT` 和 `XUNJING_RELEASE_ENV_FILE` 初始化真机证据模板，自动填入当前 commit、`createdAt`、release 包路径、`artifactSha256`、`artifactSizeBytes`、`appApiBaseUrl`、`tenantId` 和 `releaseTargets`。`XUNJING_RELEASE_ARTIFACT` 必须是手机安装包文件：Android APK/AAB 或 iOS IPA。模板中的设备记录必须补齐 `installer` 安装渠道，场景状态都是 `TODO`，`evidenceRef` 默认指向 `qa/native/<scenario>.jpg`；不得把模板当成通过证据，必须完成真机验证并补齐设备信息、安装渠道、截图或录屏引用 `evidenceRef` 后，才能把场景状态改成 `PASS`。

`XUNJING_RELEASE_TARGETS` 或 `--platform` 只允许手机端发布目标：`android`、`ios`。H5、web、小程序等目标不能写入本轮手机端上线证据。

每个 `qa/xicheng-native-device-evidence.json` 只描述一个手机平台的一个 release 包：Android 证据必须使用 `.apk` 或 `.aab`，iOS 证据必须使用 `.ipa`。如果同一版本同时发 Android 和 iOS，需要分别生成和校验两份真机证据文件。

```bash
XUNJING_NATIVE_DEVICE_EVIDENCE_FILE="../../../../qa/xicheng-native-device-evidence.json" \
npm run verify:native:evidence
```

真机证据的 `build.artifact` 必须记录真实手机安装包 release 路径，只接受 `.apk`、`.aab` 或 `.ipa`，并记录 `artifactSha256` 和 `artifactSizeBytes`。校验命令会读取该 release 包并比对 SHA256、大小和平台包结构；Android APK 必须包含根部 `AndroidManifest.xml`，Android AAB 必须包含 `base/manifest/AndroidManifest.xml`，iOS IPA 必须包含 `Payload/*.app`。如果 release 包不存在、大小不一致、哈希不一致、不是可解包手机安装包，或只是普通 ZIP 改名，不能放行。

真机证据的 `releaseTargets` 只允许 `android` 或 `ios`；每个目标都必须有真实设备记录，且设备记录必须包含 `installer` 安装渠道。

正式真机证据不得残留 `templateNotice`、`TODO` 或 template/placeholder 占位内容；设备型号、系统版本、安装版本、安装渠道和每个场景备注都必须替换成真实手机验证信息。

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

每个真机场景的 `evidenceRef` 必须指向仓库 `qa/` 下真实存在且非空的截图或录屏文件，建议归档到 `qa/native/`；只接受 `jpg`、`jpeg`、`png`、`webp`、`mp4`、`mov` 这类截图/录屏格式，并校验文件头媒体签名。只写文件名、空文件、不存在的路径、临时目录文件、纯文本说明或把文本改成图片/视频后缀都不能放行。

## 手机端放行证据包

`qa/xicheng-app-readiness-evidence.json` 是预发证据，`qa/xicheng-native-device-evidence.json` 是真机证据。二者必须属于同一个手机端发布候选：预发证据的 `baseUrl`、`tenantId` 必须等于真机证据的 `appApiBaseUrl`、`tenantId`，预发证据汇总必须包含 `summary.xichengRegionCode=beijing-xicheng` 和 `summary.xichengPackageCode=XICHENG-MAP-001`，真机证据的 `commit` 必须等于当前 `git HEAD`，预发证据 `checkedAt` 和真机证据 `createdAt` 都必须在 72 小时内。

最终 `verify:launch:evidence` 会复用 `verify:release:artifact` 扫描真机证据里的安装包本体 `build.artifact`。如果签名后的 APK/ZIP 内部包含 localhost、局域网、fixture、H5 proxy 标记或真实 token，不能放行。

如果运行 `npm run audit:release:candidate` 时显式传入 `--release-artifact` 或 `XUNJING_RELEASE_ARTIFACT`，该路径必须和真机证据 `build.artifact` 指向同一个签名 APK/AAB/IPA；不能扫描一个包、拿另一个包的真机证据放行。

在 `assets/references/APP/kashgar-mini-program` 运行：

```bash
XUNJING_PREPROD_EVIDENCE_FILE="../../../../qa/xicheng-app-readiness-evidence.json" \
XUNJING_NATIVE_DEVICE_EVIDENCE_FILE="../../../../qa/xicheng-native-device-evidence.json" \
npm run verify:launch:evidence
```

该命令会复用真机证据校验，并额外确认预发后端证据包含 `live-xicheng-ai-chat-sourced`、`live-xicheng-ai-chat-blocked`、白塔寺、恭王府、北京天文馆 trigger smoke，以及扫码入口解析 `live-xicheng-scan-resolve`。扫码入口证据的 `targetPath` 必须指向 `/pages/map/detail`，`packageCode` 必须为 `XICHENG-MAP-001`，`tenantId` 必须和预发汇总一致。小京问答证据必须来自 `/app-api/xunjing/ai/chat`，并包含 `contextEcho`、`logId`、`poiCode`、`poiName`、`regionCode`、`packageCode`、`sceneCode` 和租户归因，证明 sourced/BLOCKED 两条链路都使用西城正式 POI 上下文而不是本地编造。通过后才说明 APP 包、预发后端和真机证据来自同一个候选版本。

如果需要给运营或测试同事快速判断当前候选还差什么，在同一目录运行只读审计：

```bash
XUNJING_APP_API_BASE_URL="$XUNJING_APP_API_BASE_URL" \
XUNJING_TENANT_ID="$XUNJING_TENANT_ID" \
XUNJING_RELEASE_ARTIFACT="/absolute/path/to/signed-release.apk" \
npm run audit:release:candidate
```

审计结果只输出 `GO` / `NO_GO`、`blockers` 和 `nextActions`。`NO_GO` 不代表 APP 主链不可用，只代表手机端上线证据还没闭环；`GO` 必须同时证明工作树干净、预发证据、真机证据、签名安装包扫描、双远端 commit 一致和 `verify:launch:evidence` 均通过。

正式审计前必须确认 `git status --short` 为空。只要存在未提交源码、文档、证据文件或其它未追踪文件，`audit:release:candidate` 必须输出 `NO_GO` 和 `git-worktree-dirty` blocker，避免用不可追溯的本地改动生成手机端候选。

`--skip-remote-parity` 和 `XUNJING_SKIP_REMOTE_PARITY=1` 只能用于本地测试夹具或离线排查；正式发布审计不能跳过 GitHub/Gitee 双远端一致性。只要远端一致性被跳过，`audit:release:candidate` 必须输出 `NO_GO` 和 `git-remote-parity-skipped` blocker。测试夹具内部使用的 `XUNJING_RELEASE_AUDIT_ALLOW_TEST_BYPASS=1` 必须同时带 `XUNJING_RELEASE_AUDIT_TEST_MODE=1` 才会生效；正式环境单独设置 bypass 会被 `release-audit-test-bypass-without-test-mode` 阻断。

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

该 release 构建会自动执行 `npm run verify:release:artifact` 扫描 `dist/build/app-release`；同一脚本也可扫描 APK/ZIP 安装包内部文本资源。release 构建产物不得包含 `localhost`、`127.0.0.1`、局域网地址、`XICHENG_DEVELOPMENT_TRIGGER_FIXTURE`、H5 proxy 标记、`sk-`、`pat_`、`AKIA`、真实 token、与 `XUNJING_APP_API_BASE_URL` 不一致的 Yudao APP API 网关，或与 `XUNJING_TENANT_ID` 不一致的租户配置。包内必须能扫描到 `XUNJING_APP_API_BASE_URL` 指定的 Yudao APP API 网关，以及和 `XUNJING_TENANT_ID` 一致的租户配置；旧 `api2/*`、图片和静态资源仍可保留原线上域名，但不得替代 `/app-api/xunjing/**` 的 release 网关。

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

该命令会检查 HBuilderX CLI 是否可用、release 网关和租户是否有效、Android package name 和签名配置是否齐全，并用 keytool 验证 keystore 可读且 alias 存在；同时确认 Android 权限仍只包含 `ACCESS_NETWORK_STATE`、`CAMERA`、`ACCESS_COARSE_LOCATION`、`ACCESS_FINE_LOCATION`。Android package name 必须是真实发布包名，不能使用 `example`、`test`、`demo`、`placeholder`、`xinxiake`、`uni-app` 等示例或脚手架标记。门禁通过不等于已经生成安装包；它只是说明当前配置可以进入 HBuilderX signed APK/AAB 原生打包，然后再用 `XUNJING_RELEASE_ARTIFACT` 生成真机 evidence 模板。

先 dry-run 检查 HBuilderX 云打包命令是否正确，脚本不会执行真实打包，也不会输出签名密码：

```bash
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" npm run pack:native:cloud:dry-run
```

确认 `run_native_cloud_pack.mjs` 输出的 `--android.packagename`、`--android.certfile`、平台和 release 网关无误后，再显式确认执行：

```bash
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" XUNJING_NATIVE_PACK_CONFIRM=cloud-pack npm run pack:native:cloud
```

真实执行会先用 HBuilderX `project open --path` 自动导入即将传给 `pack` 的同一个项目路径，再调用 HBuilderX `pack` 并向 CLI 传入签名参数；输出会脱敏 `--android.certpassword`、`--android.storepassword` 和 iOS 证书密码。如果 HBuilderX 输出“项目不存在，请先导入”、project-not-imported 或 `user not login` 类提示，即使 CLI exit code 为 0 也不能算打包成功；项目导入问题需要确认 HBuilderX CLI 工作区，未登录问题需要先用发布账号完成 HBuilderX CLI 登录后重跑。云打包产物生成后，把 signed APK/AAB 或 IPA 路径写入 `XUNJING_RELEASE_ARTIFACT`，再继续生成真机证据。

并在仓库根目录运行：

```bash
npm run test:run
```
