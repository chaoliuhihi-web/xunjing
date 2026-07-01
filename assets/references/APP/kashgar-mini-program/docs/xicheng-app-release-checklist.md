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
XUNJING_RELEASE_ENV_FILE="/secure/path/app-release.env" \
npm run doctor:release:prereqs

XUNJING_RELEASE_ENV_FILE="/secure/path/app-release.env" \
XUNJING_PLATFORM_ENV_FILE="/secure/path/platform-preprod.env" \
npm run verify:yudao:preprod
```

`npm run doctor:release:prereqs` 不会触发真实云打包，用于提前诊断 release env、预发 API DNS、`/app-api/xunjing/scan/resolve` API 可达性、native cloud pack dry-run 和 HBuilderX 发布账号登录态；它通过后仍必须继续执行预发 evidence、签名包和真机证据门禁。

`XUNJING_RELEASE_ENV_FILE` 可以集中保存预发/生产网关、租户和签名配置；该文件不得提交到仓库。脚本会从该文件加载缺失的 `XUNJING_APP_API_BASE_URL`、`XUNJING_TENANT_ID`、`XUNJING_RELEASE_TARGETS` 和签名相关变量，命令行显式传入的变量优先。`XUNJING_PLATFORM_ENV_FILE` 用于传给根目录 `npm run xunjing:platform:verify -- --env-file`，相对路径按仓库根目录解析；该文件必须包含平台 readiness 所需的 `SPRING_PROFILES_ACTIVE`、数据库、Redis、OSS、Qdrant、Qwen 和内部鉴权变量。如果不设置，脚本会回退使用 `XUNJING_RELEASE_ENV_FILE`，因此单独的 APP 打包 env 不能直接替代完整平台 env。

`XUNJING_TENANT_ID` 必须是 Yudao 租户正整数编号，不能使用 `0`、负数或环境名占位符。

`qa/xicheng-app-readiness-evidence.json` 的 `checkedAt` 必须是 72 小时内的预发或生产实测时间；过期证据不能作为上线放行依据，`npm run audit:release:candidate` 会直接输出 `preprod-evidence-stale`。预发证据的 `summary.baseUrl` 必须是非本地 HTTPS 网关，否则审计会输出 `preprod-evidence-invalid-base-url`。预发证据的 `summary.tenantId` 必须是 Yudao 租户正整数，否则审计会输出 `preprod-evidence-invalid-tenant-id`；预发证据必须包含 sourced AI、BLOCKED AI、trigger 和 scan resolve 必需 checks，否则审计会输出 `preprod-evidence-missing-required-check`。预发证据的 `summary.xichengRegionCode` 必须是 `beijing-xicheng`，`summary.xichengPackageCode` 必须是 `XICHENG-MAP-001`，避免把其它城市或其它资源包的接口回归误当成本次西城手机端候选。

真机证据必须记录在 `qa/xicheng-native-device-evidence.json` 并通过 APP 侧校验：

```bash
XUNJING_RELEASE_ARTIFACT="/absolute/path/to/signed-release.apk" \
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" \
XUNJING_NATIVE_DEVICE_EVIDENCE_FILE="../../../../qa/xicheng-native-device-evidence.json" \
npm run prepare:native:evidence
```

`npm run prepare:native:evidence` 根据 `XUNJING_RELEASE_ARTIFACT` 和 `XUNJING_RELEASE_ENV_FILE` 初始化真机证据模板，自动写入当前 commit、`createdAt`、release 包路径、`artifactSha256`、`artifactSizeBytes`、`appApiBaseUrl`、`tenantId` 和 `releaseTargets`。`XUNJING_RELEASE_ARTIFACT` 必须是手机安装包文件：Android APK/AAB 或 iOS IPA。模板里的设备记录必须补齐 `installer` 安装渠道，场景状态全部是 `TODO`，`evidenceRef` 默认指向 `qa/native/<scenario>.jpg`；不得把模板当成通过证据，必须在真实手机完成验证并补齐设备信息、安装渠道、截图或录屏引用 `evidenceRef` 后，才能把对应场景改成 `PASS`。

`XUNJING_RELEASE_TARGETS` 或 `--platform` 只允许手机端发布目标：`android`、`ios`。不要把 H5、web 或小程序目标写入手机端上线证据。

每个 `qa/xicheng-native-device-evidence.json` 只描述一个手机平台的一个 release 包：Android 证据必须使用 `.apk` 或 `.aab`，iOS 证据必须使用 `.ipa`。如果同一版本同时发 Android 和 iOS，需要分别生成和校验两份真机证据文件。

```bash
XUNJING_NATIVE_DEVICE_EVIDENCE_FILE="../../../../qa/xicheng-native-device-evidence.json" \
npm run verify:native:evidence
```

真机证据至少覆盖 `camera-photo-recognition`、`ocr-text-recognition`、`gps-recognition-permission`、`scan-entry-map-detail`、`xiaojing-sourced-answer`、`xiaojing-blocked-answer`、`recording-start-stop` 和 `travelogue-draft-generated`。每个场景的 `evidenceRef` 必须指向仓库 `qa/` 下真实存在且非空的截图或录屏文件，软链接的真实路径也必须留在 `qa/` 下，建议使用 `qa/native/` 归档；只接受 `jpg`、`jpeg`、`png`、`webp`、`mp4`、`mov` 这类截图/录屏格式，并校验文件头媒体签名，不能把纯文本说明改成图片或视频后缀。`scan-entry-map-detail` 必须在真实手机扫码后落到 `/pages/map/detail`，并在备注中记录 `XICHENG-MAP-001`。正式真机证据不得残留 `templateNotice`、`TODO` 或 template/placeholder 占位内容。

真机证据的 `build.artifact` 必须指向真实手机安装包 release 文件，只接受 `.apk`、`.aab` 或 `.ipa`，并记录 `artifactSha256` 和 `artifactSizeBytes`。`npm run verify:native:evidence` 会读取该 release 包文件，校验 SHA256、大小和平台包结构：Android APK 必须包含根部 `AndroidManifest.xml`，Android AAB 必须包含 `base/manifest/AndroidManifest.xml`，iOS IPA 必须包含 `Payload/*.app`；普通 ZIP 改名成安装包不能放行。

真机证据的 `releaseTargets` 只允许 `android` 或 `ios`；每个目标都必须有真实设备记录，且设备记录必须包含 `installer` 安装渠道。

预发证据和真机证据必须属于同一个手机端发布候选。`qa/xicheng-app-readiness-evidence.json` 里的 `baseUrl`、`tenantId` 必须和 `qa/xicheng-native-device-evidence.json` 里的 `appApiBaseUrl`、`tenantId` 一致，预发证据汇总必须包含 `summary.xichengRegionCode=beijing-xicheng` 和 `summary.xichengPackageCode=XICHENG-MAP-001`，真机证据里的 `commit` 必须等于当前 `git HEAD`；预发证据 `checkedAt` 和真机证据 `createdAt` 都必须在 72 小时内；预发证据必须包含扫码入口解析 `live-xicheng-scan-resolve`，且 `targetPath` 指向 `/pages/map/detail`、`packageCode` 为 `XICHENG-MAP-001`、`tenantId` 和预发汇总一致；预发证据里的 `live-xicheng-ai-chat-sourced` 与 `live-xicheng-ai-chat-blocked` 必须来自 `/app-api/xunjing/ai/chat`，并包含 `contextEcho`、`logId`、`poiCode`、`poiName`、`regionCode`、`packageCode`、`sceneCode` 和租户归因，证明小京回答使用西城正式 POI 上下文而不是本地编造；最终 `verify:launch:evidence` 会复用 `verify:release:artifact` 扫描真机证据里的安装包本体 `build.artifact`，拒绝 localhost、局域网、fixture 或真实 token 进入最终手机包：

```bash
XUNJING_PREPROD_EVIDENCE_FILE="../../../../qa/xicheng-app-readiness-evidence.json" \
XUNJING_NATIVE_DEVICE_EVIDENCE_FILE="../../../../qa/xicheng-native-device-evidence.json" \
npm run verify:launch:evidence
```

如果 `audit:release:candidate` 显式传入 `--release-artifact` 或设置 `XUNJING_RELEASE_ARTIFACT`，它必须和真机证据 `build.artifact` 指向同一个签名 APK/AAB/IPA；不能用一个包做扫描，再用另一个包的真机截图或录屏证据放行。

预发或上线真机包必须使用带网关校验的 release 构建入口：

```bash
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" npm run build:app:release
```

`build:app:release` 会自动执行 `npm run verify:release:artifact` 对 `dist/build/app-release` 做 release 构建产物扫描；同一脚本也可扫描 APK/AAB/IPA/ZIP 安装包内部文本资源。门禁拒绝 `localhost`、`127.0.0.1`、局域网地址、IPv4/IPv6 链路本地地址、IPv6 私网地址、CGNAT、benchmark 保留网段、组播或其它保留网段、URL 内嵌账号密码、`XICHENG_DEVELOPMENT_TRIGGER_FIXTURE`、H5 proxy 配置、`sk-`、`pat_`、`AKIA` 和真实 token 进入手机包。包内必须能扫描到 `XUNJING_APP_API_BASE_URL` 指定的 Yudao APP API 网关，以及和 `XUNJING_TENANT_ID` 一致的租户配置；旧 `api2/*`、图片和静态资源仍可保留原线上域名，但不得替代 `/app-api/xunjing/**` 的 release 网关。

生成 signed APK/AAB 或 iOS IPA 前，先跑手机原生打包就绪门禁：

```bash
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" npm run verify:native:package:ready
```

该命令检查 HBuilderX CLI、APP 名称、appid、versionName、versionCode、Android package name、签名 keystore、key alias、密码是否已注入，并用 keytool 验证 keystore 可读且 alias 存在；同时确认 Android 权限仍限定在 `ACCESS_NETWORK_STATE`、`CAMERA`、`ACCESS_COARSE_LOCATION`、`ACCESS_FINE_LOCATION`。Android package name 必须是真实发布包名，不能使用 `example`、`test`、`demo`、`placeholder`、`xinxiake`、`uni-app` 等示例或脚手架标记。它不会生成安装包，也不会输出密钥内容；通过后再用 HBuilderX 原生发布流程生成 `signed APK/AAB`，再进入 `npm run prepare:native:evidence`。

就绪门禁通过后，先生成一份脱敏的 HBuilderX 云打包命令预览：

```bash
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" npm run pack:native:cloud:dry-run
```

确认 `run_native_cloud_pack.mjs` 输出的 `--android.packagename`、`--android.certfile`、release 网关、租户和目标平台都正确后，才允许触发真实云打包：

```bash
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" XUNJING_NATIVE_PACK_CONFIRM=cloud-pack npm run pack:native:cloud
```

真实打包会先用 HBuilderX `project open --path` 自动导入即将传给 `pack` 的同一个项目路径，再调用 HBuilderX `pack`，并把签名密码作为进程参数传入；脚本输出会脱敏 `--android.certpassword`、`--android.storepassword` 和 iOS 证书密码。如果 HBuilderX 输出“项目不存在，请先导入”、project-not-imported 或 `user not login` 类提示，即使 CLI exit code 为 0 也不能算打包成功；项目导入问题需要确认 HBuilderX CLI 工作区，未登录问题需要先用发布账号完成 HBuilderX CLI 登录后重跑。打包完成后，把 HBuilderX 生成的 signed APK/AAB 或 IPA 路径写入 `XUNJING_RELEASE_ARTIFACT`，再执行 `npm run prepare:native:evidence`。

Android env 文件至少包含：

```bash
XUNJING_APP_API_BASE_URL=https://api.xingheai.net
XUNJING_TENANT_ID=1
XUNJING_RELEASE_TARGETS=android
XUNJING_ANDROID_PACKAGE_NAME=com.xinghe.xunjing
XUNJING_ANDROID_KEYSTORE=/secure/path/xicheng-release.keystore
XUNJING_ANDROID_KEY_ALIAS=xicheng-release
XUNJING_ANDROID_KEYSTORE_PASSWORD=...
XUNJING_ANDROID_KEY_PASSWORD=...
```

## 发布候选审计

在补齐预发证据、真机证据和签名安装包后，可以先跑只读审计命令汇总当前候选状态：

```bash
XUNJING_RELEASE_ARTIFACT="/absolute/path/to/signed-release.apk" \
XUNJING_RELEASE_ENV_FILE="/secure/path/preprod.env" \
npm run audit:release:candidate
```

该命令只输出 `GO` 或 `NO_GO`、`blockers` 和 `nextActions`，不会把模板或本地结果当成上线证据。`NO_GO` 代表还缺干净工作树、`qa/xicheng-app-readiness-evidence.json`、`qa/xicheng-native-device-evidence.json`、签名安装包、双远端同步或 `verify:launch:evidence` 中的某一项；`GO` 只代表工作树干净、预发证据、真机证据、安装包扫描和双远端一致性已经同时通过。

正式候选审计必须先让 `git status --short` 为空。未提交源码、文档、证据文件或未追踪文件都会触发 `git-worktree-dirty`，不能得到 `GO`。

不要在正式发布审计里使用 `--skip-remote-parity` 或 `XUNJING_SKIP_REMOTE_PARITY=1`。跳过 GitHub/Gitee 双远端一致性只能用于本地测试夹具；正式候选会被 `git-remote-parity-skipped` 阻断，不能得到 `GO`。测试夹具内部使用的 `XUNJING_RELEASE_AUDIT_ALLOW_TEST_BYPASS=1` 必须同时带 `XUNJING_RELEASE_AUDIT_TEST_MODE=1` 才会生效；正式环境单独设置 bypass 会被 `release-audit-test-bypass-without-test-mode` 阻断。

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
- `XUNJING_TENANT_ID` 必须是生产或预发 Yudao 租户正整数编号。
- 微信配置必须是生产真实值：`WX_MP_APP_ID`、`WX_MP_SECRET`、`WX_MINIAPP_APPID`、`WX_MINIAPP_SECRET`。
- Yudao 服务 smoke 必须产出 `qa/xicheng-yudao-server-smoke-evidence.json`。
- 如果这些配置或证据缺失，APP 不得因为本地 fixture、mock 或开发环境通过而判定可上线。

## 禁止提交

不得提交 `node_modules`、`dist`、`unpackage`、`tmp`、密钥、真实 token 或任何第三方真实凭证。
