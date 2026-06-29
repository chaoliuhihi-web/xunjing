# 西城 APP 发版核查清单

更新时间：2026-06-30
最近已同步发版基线：`9864ba95`

## 分支边界

- 只在 `feature/xicheng-p0` 开发西城 P0。
- `product/city-companion-main` 是稳定主线，不直接开发。
- 提交后同步推 GitHub 和 Gitee，并确认两个远端同一 commit。

## APP 本地门禁

在 `assets/references/APP/kashgar-mini-program` 运行：

```bash
for f in tests/*.test.mjs; do node "$f" || exit 1; done
npm run build
```

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

## 禁止提交

不得提交 `node_modules`、`dist`、`unpackage`、`tmp`、密钥、真实 token 或任何第三方真实凭证。
