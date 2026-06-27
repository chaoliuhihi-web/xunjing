# 新喀什后台接口联调记录

更新时间：2026-05-21

后台地址：`https://www.neoxiake.com/admin`

小程序基础地址：`https://www.neoxiake.com/`

## 浏览器状态

- 后台已登录，当前页：`/admin/index/index.html`
- 已在当前后台页和同源 iframe 注入临时网络钩子：`window.__codexNetworkLog`
- 钩子记录后续 `fetch` / `XMLHttpRequest` 的 `method`、`url`、`status`、耗时和脱敏 body
- 只做 GET/只读页面抓取，未执行新增、删除、上下架、保存等写操作

## 后台模块映射

| 后台菜单 | 列表页 | 搜索/列表字段 | 编辑/提交页 |
| --- | --- | --- | --- |
| 首页广告 | `/admin/banner_curriculum/index.html` | `title`、`img_id`、`type`、`link`、`targetid`、`detail`、`is_shelf`、`sort` | `/admin/banner_curriculum/edit/id/{id}.html` -> `/admin/banner_curriculum/editpost.html` |
| 轮播图管理 | `/Admin/banner/index.html` | `title`、`img_id`、`desc`、`type`、`link`、`detail`、`video_cover_id`、`video_id`、`targetid`、`is_shelf` | `/admin/banner/edit/id/{id}.html` -> `/admin/banner/editpost.html` |
| 品牌管理 | `/admin/brand/index.html` | `name`、`img_id`、`intro` | `/admin/brand/edit/id/{id}.html` -> `/admin/brand/editpost.html` |
| 喀什剧场 | `/admin/drama/index.html` | `type`、`brand_id`、`title`、`cover_id`、`desc_text`、`total_episodes`、`address_name`、`lng`、`lat`、`status` | `/admin/drama/edit/id/{id}.html` -> `/admin/drama/editpost.html` |
| 剧集列表 | `/admin/drama/detail/drama_id/{drama_id}.html` | `episode_no`、`title`、`cover_id`、`video_url`、`video_id`、`detail` | `/admin/drama/detail_edit/id/{id}/drama_id/{drama_id}.html` -> `/admin/drama/detail_editpost.html` |
| 地图分类 | `/admin/mapclass/index.html` | `type`、`name`、`img_id` | `/admin/mapclass/edit/id/{id}.html` -> `/admin/mapclass/editpost.html` |
| 地图锚点 | `/admin/mapmain/index.html` | `title`、`class_id`、`sub_title`、`business_hours`、`addr`、`lng`、`lat`、`img_id`、`desc` | `/admin/mapmain/edit/id/{id}.html` -> `/admin/mapmain/editpost.html` |
| 关于/协议/隐私 | 后台菜单里的 `/admin/about/inte_detail28.html`、`/admin/about/inte_detail29.html` 当前 404 | 小程序使用 `api/login/about?type=24/28/29` | 后台直达链接不可用，联调以 API 为准 |

## 小程序只读 API

| 用途 | API | 参数 | 返回结构 |
| --- | --- | --- | --- |
| 首页 | `GET /api2/Drama/getHome` | `userId` | `data.banner`、`data.bxbj`、`data.xkjc` |
| 剧场列表 | `GET /api2/Drama/getDrama` | `userId`、`type`、`page`、`page_size` | `data[]`，字段含 `id`、`type`、`brand_id`、`title`、`desc_text`、`cover_url`、`total_episodes`、`zan_num`、`share_num`、`brand` |
| 剧场详情 | `GET /api2/Drama/getDramaDetail` | `userId`、`data_id` | `data.brand`、`data.drama`、`data.list`、`data.xgtj`、`data.zhoubian` |
| 地图分类 | `GET /api2/Map/cls` | `userId`、`classId`、`mastersId` | `data[]`，字段含 `id`、`type`、`name`、`img_url` |
| 地图锚点 | `GET /api2/Map/lst` | `userId`、`classId`、`mastersId` | `data[]`，字段含 `id`、`title`、`class_id`、`img_url`、`lng`、`lat`、`addr`、`business_hours`、`class` |
| 首页广告详情 | `GET /api2/Drama/banner_detail` | `id` | 首页广告详情字段：`id`、`title`、`img_id`、`type`、`link`、`targetid`、`detail`、`img_url` |
| 关于我们 | `GET /api/login/about` | `type=24` | `data.id`、`data.title`、`data.detail` |
| 用户协议 | `GET /api/login/about` | `type=28` | `data.id`、`data.title`、`data.detail` |
| 隐私政策 | `GET /api/login/about` | `type=29` | `data.id`、`data.title`、`data.detail` |

## 已验证样例

- `GET /api2/Drama/getDrama?userId=1&type=1&page=1&page_size=5` 返回 `code=0`，样例剧目：`id=226`、`title=中国村落`
- `GET /api2/Drama/getDramaDetail?userId=1&data_id=226` 返回 `brand`、`drama`、`list`，样例剧集：`id=546`、`episode_no=第一集`
- `GET /api2/Map/cls?userId=1&classId=&mastersId=` 返回 4 个分类：`行程建议`、`特色美食`、`人文景点`、`自然风光`
- `GET /api2/Map/lst?userId=1&classId=82&mastersId=` 返回 3 个行程建议锚点
- `GET /api2/Drama/banner_detail?id=35` 正常返回；`id=676/675/684` 返回 500

## 联调注意点

- `banner_detail` 对应的是首页广告 `/admin/banner_curriculum` 的数据，不是后台“轮播图管理” `/admin/banner` 的数据；用轮播图 ID 调小程序详情接口会 500。
- 后台和小程序接口统一返回的图片/视频字段通常是 `*_url`，但上传表单保存的是 `*_id`。
- 部分剧场数据的经纬度疑似录反，例如 `lng` 可能出现 `29.x`、`lat` 出现 `121.x`；地图模块的 `Map/lst` 数据经纬度是正常的 `lng=121.x`、`lat=29.x`。
- 后台列表页中的上下架、删除、排序保存都是写操作，抓包时不要误点。
