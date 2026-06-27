# APP 前端接口边界

本项目当前阶段坚持线上接口优先，APP 前端尽最大可能复用原小程序已有代码、接口和登录态逻辑。只有确认线上接口无法覆盖新增能力、返回结构不满足 APP 上线需求，或接口稳定性不能支撑生产链路时，才新增 Yudao 侧接口。

## 继续复用的线上接口

- 基础服务域名：`https://kashi.weiapp.net/`
- 微信登录和注册链路：`uni.login` 获取 code 后调用 `api2/user/get_user`
- 用户资料保存：`api2/user/user_save`
- 首页、地图、剧场、收藏、点赞、分享等内容接口：继续走现有 `api2/*`
- 扫码场景解析走 Yudao APP 代理：`/app-api/xunjing/scan/resolve`
- 资源包公开读取走 Yudao APP 代理：`/app-api/xunjing/resource/package`
- 访问与 AI 提问事件回传走 Yudao APP 代理：`/app-api/xunjing/resource/events`
- AI 对话走 Yudao APP 代理：`/app-api/xunjing/ai/chat`
- 如果线上域名暂未路由 `/app-api/xunjing/scan/resolve`，首页启动参数不会阻塞本地喀什首页；用户手动扫一扫失败时回到现有导览地图。
- 如果线上域名暂未路由 `/app-api/xunjing/resource/package`，AI 旅伴首页继续使用本地喀什打卡地和图片，不影响原小程序页面。
- 如果线上域名暂未路由 `/app-api/xunjing/resource/events`，前端静默跳过事件回传，不能阻塞页面进入或 AI 回复。
- 如果线上域名暂未路由 `/app-api/xunjing/ai/chat`，前端必须渲染喀什本地导览兜底答复，不能把用户留在发送失败状态。
- AI 语音与图片能力：等待后端代理能力后再打开，客户端不保存 Coze Token，也不直接上传到第三方文件接口

## Yudao 承接边界

Yudao 只承接线上接口无法覆盖的能力，例如星河寻境扫码场景解析、资源包公开读取、访问与 AI 提问事件归因、AI 对话服务端代理、后续 APP 自有账号体系、运营后台配置、内容审核、订单支付、复杂行程生成持久化、AI 结果归档等原小程序接口没有的能力。新增前必须先确认现有 `api2/*` 或已上线服务不能满足，并在调用侧保留清晰的接口边界。当前线上网关需要补充 `/app-api/xunjing/**` 路由后，前端会自动使用真实 Yudao 返回。

## 原生 APP 微信登录边界

小程序端继续复用原 `uni.login` + `api2/user/get_user` 链路。原生 APP 微信登录在前端侧必须启用 DCloud `OAuth(登录鉴权)` 模块，并通过 `uni.getProvider({ service: 'oauth' })` 确认当前包包含 `weixin` provider 后再调用 `uni.login({ provider: 'weixin' })`。正式上架包还需要在微信开放平台配置移动应用，并把微信开放平台 AppID、Universal Links 等 SDK 信息配置到 APP 打包环境。

如果线上 `api2/user/get_user` 不能识别原生 APP 微信开放平台 code，不在星河寻境模块自建完整登录系统，优先复用 Yudao 会员模块的 `/member/auth/social-login`，社交类型使用 `WECHAT_OPEN`。只有当 Yudao 会员社交登录不能满足喀什 APP 的兼容字段、老用户迁移或 openid 归一化需求时，才在 `/app-api/xunjing/**` 增加薄代理。

## 前端上线约束

- 不把 APP runtime 调用切到 `localhost`、`127.0.0.1` 或临时后台地址。
- 不在前端用 Yudao 接口替换已有可用线上接口。
- 登录态仍以原小程序返回的 token、userId、openid 和 userInfo 为准。
- 新增喀什本地演示内容先作为前端可视化分支存在，不阻塞线上接口链路。
- `/app-api/xunjing/**` 请求必须带 `tenant-id`，当前喀什 P0 配置为 `1`。
- APP 构建时可用 `VITE_XUNJING_YUDAO_APP_BASE_URL` 指定已部署的 Yudao APP API HTTPS 基址；未指定时默认仍走 `https://kashi.weiapp.net/`。
- APP 构建时可用 `VITE_XUNJING_TENANT_ID` 覆盖租户编号；未指定时默认 `1`。

## 2026-06-21 线上探测结论

- `POST https://kashi.weiapp.net/api2/user/user_save` 可以返回 `code=0`，用户资料保存链路继续复用原接口。
- `GET https://kashi.weiapp.net/api2/Drama/getHome?userId=1` 可以返回 `code=0` 和首页 banner/剧场数据，首页内容链路继续复用原接口。
- `GET https://kashi.weiapp.net/api2/Map/cls?page=1&page_size=10&userId=1` 可以返回 `code=0` 和地图分类数据，原地图分类链路继续复用原接口。
- `GET https://kashi.weiapp.net/api2/user/get_user?code=<invalid-code>` 会进入微信 code 换 openid 逻辑；无真实小程序 code 时返回后端错误，不能据此判定真实微信登录失败。
- 当前线上错误页会暴露 ThinkPHP 调试堆栈和配置痕迹。APP 前端仍复用该接口，但生产环境必须关闭后端 debug 和 trace 输出。
- `https://kashi.weiapp.net/app-api/xunjing/scan/resolve`、`https://kashi.weiapp.net/app-api/xunjing/resource/package` 和 `https://kashi.weiapp.net/app-api/xunjing/ai/chat` 当前返回 nginx 404，说明公网网关还没有把 `/app-api/` 转发到 Yudao。前端已经支持该路由，剩余动作在部署和 nginx 代理层。
