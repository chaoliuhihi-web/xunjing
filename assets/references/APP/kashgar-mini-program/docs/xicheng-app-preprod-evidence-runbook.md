# 西城 APP 预发证据采集手册

更新时间：2026-06-30

## 目标

把 APP 侧“本地通过”升级为可上线证据。当前 preflight 的 APP blocker 是：`APP readiness evidence baseUrl must be a non-local HTTPS URL`。因此，最终放行必须来自生产或预发的非本地 HTTPS 后端，不得使用 localhost、fixture、mock 或开发缓存替代。

## 前置条件

- 分支必须是 `feature/xicheng-p0`，稳定主线 `product/city-companion-main` 不直接开发。
- `XUNJING_APP_API_BASE_URL` 必须是非本地 HTTPS Yudao APP API 域名。
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

## 本地 APP 回归

预发证据采集前后都要在 `assets/references/APP/kashgar-mini-program` 运行：

```bash
for f in tests/*.test.mjs; do node "$f" || exit 1; done
npm run build
```

并在仓库根目录运行：

```bash
npm run test:run
```
