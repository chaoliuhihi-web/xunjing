# 西城 AI 旅伴真实试运营版 PRD v0.2

> 本 PRD 面向北京西城区真实多人试用，不再按 mock 测试版处理。产品必须以真实 POI、真实定位、真实识别事件、真实运营后台和三端发布为基础。
> 地图与 POI 原则：真实 GIS 定位置与关系，Image Gen / UI 效果图定氛围与审美。

## 1. 背景

星河寻境当前已有喀什样板和西城方向 UI 效果图。下一阶段需要把北京西城做成可给多人试用的真实版本，用于验证 AI 旅伴在城市文旅场景中的核心体验：

- 用户走到西城某个真实地点，APP 能识别当前位置并推荐讲解。
- 用户拍摄建筑、牌匾、展陈、街区或食物，APP 能给出候选识别结果。
- 用户扫到景点名、路牌、展牌、地图文字，APP 能通过 OCR 触发 POI、路线或问答。
- 用户可以问“小京”，得到基于西城真实 POI 和路线的回答。
- 用户可以把识别足迹生成游记。
- 运营人员可以在后台维护 POI、内容、路线、触发词、识别错误和用户反馈。

本版本不是喀什版本的替换，而是星河寻境从“单地区样板”升级到“多地区真实运营平台”的第一个城市试点。

## 2. 产品定位

### 2.1 产品名称

星河寻境 · 西城 AI 旅伴真实试运营版

### 2.2 AI 旅伴

- 名称：小京
- 性别气质：女性 AI 旅伴
- 视觉方向：现代北京文化气质、轻卡通、高端、亲和、不幼态
- 文化特征：可融合白塔、胡同、宫墙色、海棠花窗、北京城市漫步等轻元素
- 避免方向：廉价网红风、过度国潮、大红大金、戏曲化发髻、尖脸、星盘符号

### 2.3 一句话描述

用户在西城看到什么、走到哪里、拍到什么、扫到什么，APP 都能基于真实 POI 数据识别并触发讲解、路线、问答和游记。

## 3. 目标

### 3.1 业务目标

1. 建立北京西城真实 POI 数据底座。
2. 上线 Android、iOS、HarmonyOS 三端真实试运营版本。
3. 支持 100-500 人灰度试用。
4. 跑通定位、拍照、OCR、问答、路线、游记的完整体验闭环。
5. 沉淀可复制到其他城市的多地区配置架构。

### 3.2 产品目标

1. 首页建立“小京 AI 旅伴”心智。
2. 扫一扫不只是工具入口，而是识别触发中心。
3. 路线推荐、游记生成、最近识别形成持续使用理由。
4. 识别触发要稳，不因 AI 误判频繁打扰用户。
5. 运营后台能持续修正 POI 和识别结果。

### 3.3 MVP 成功标准

- P0 POI 不少于 80 个，覆盖西城核心文旅场景。
- P1 POI 不少于 300 个，覆盖餐饮、文创、老字号、拍照点、公共服务点等运营场景。
- 支持 GPS、OCR、拍照识别三类触发。
- Android APK 可安装试用。
- iOS TestFlight 可安装试用。
- 华为设备可通过 HarmonyOS 兼容版试用，并明确原生 HarmonyOS NEXT 路线。
- 运营后台可查看识别事件、用户反馈和 POI 纠错。

## 4. UI 设计基准

本版本 UI 参考以下设计稿目录：

```text
assets/references/APP/xicheng-multimodal/design-mockups/
```

关键页面：

| 页面 | 参考图 |
| --- | --- |
| 首页，小京形象与功能入口 | [01-home-xiaojing-xicheng.png](../../assets/references/APP/xicheng-multimodal/design-mockups/01-home-xiaojing-xicheng.png) |
| 识别结果，白塔寺示例 | [02-recognition-result-baitasi.png](../../assets/references/APP/xicheng-multimodal/design-mockups/02-recognition-result-baitasi.png) |
| 问问小京 | [03-ask-xiaojing-chat.png](../../assets/references/APP/xicheng-multimodal/design-mockups/03-ask-xiaojing-chat.png) |
| 路线详情 | [04-route-detail-baitasi-culture.png](../../assets/references/APP/xicheng-multimodal/design-mockups/04-route-detail-baitasi-culture.png) |
| 游记生成 | [05-travelogue-generation.png](../../assets/references/APP/xicheng-multimodal/design-mockups/05-travelogue-generation.png) |
| 扫一扫入口 | [06-scan-entry.png](../../assets/references/APP/xicheng-multimodal/design-mockups/06-scan-entry.png) |
| 路线列表 | [07-route-list.png](../../assets/references/APP/xicheng-multimodal/design-mockups/07-route-list.png) |
| POI 讲解页 | [08-poi-guide-baitasi.png](../../assets/references/APP/xicheng-multimodal/design-mockups/08-poi-guide-baitasi.png) |
| AI 讲解播放 | [09-ai-guide-playback.png](../../assets/references/APP/xicheng-multimodal/design-mockups/09-ai-guide-playback.png) |
| 最近识别 / 足迹 | [10-xicheng-footprint.png](../../assets/references/APP/xicheng-multimodal/design-mockups/10-xicheng-footprint.png) |
| 游记编辑分享 | [11-travelogue-editor-share.png](../../assets/references/APP/xicheng-multimodal/design-mockups/11-travelogue-editor-share.png) |

### 4.1 首页信息架构

首页必须包含：

- 小京形象展示
- 问问小京
- 扫一扫入口
- 路线推荐
- 游记生成
- 最近识别卡

首页优先级：

1. 小京形象和城市旅伴心智
2. 问问小京
3. 扫一扫
4. 路线推荐
5. 游记生成
6. 最近识别

扫一扫是高频工具，但不能占据整个首页；首页必须让用户知道这是 AI 旅伴，而不是单一扫码工具。

## 5. 用户与试用范围

### 5.1 目标用户

- 西城游客
- 北京本地 Citywalk 用户
- 文博爱好者
- 亲子研学家庭
- 西城文旅试点人员
- 内部产品、运营和内容团队

### 5.2 灰度规模

| 阶段 | 人数 | 目标 |
| --- | ---: | --- |
| 内部 Alpha | 20-50 | 验证主流程、定位、OCR、POI 数据准确性 |
| 小范围 Beta | 100-500 | 验证多人试用、反馈、后台纠错、AI 成本 |
| 扩大灰度 | 1000-5000 | 验证稳定性、内容质量、推荐转化 |

## 6. 平台范围

本版本必须规划三端：

1. Android
2. iOS
3. Huawei HarmonyOS

三端共享同一套后端、POI 数据、AI 问答、识别触发、游记生成和运营后台。

### 6.1 Android

首期目标：

- 支持 APK 内测分发。
- 支持国内主流安卓设备。
- 支持定位、相机、OCR、地图、分享。
- 目标发布到国内安卓应用市场；Google Play 视海外测试需要决定。

合规注意：

- 新应用和更新如提交 Google Play，应满足当前 target API 要求。Google 官方说明新应用和更新需 target Android 15 / API 35 或更高。
- 不申请读取通讯录、短信、通话记录、后台常驻定位、设备敏感标识等高风险权限。

### 6.2 iOS

首期目标：

- 通过 TestFlight 内测。
- 适配主流 iPhone 尺寸。
- 支持定位、相机、OCR、问答、游记。
- 为 App Store 正式审核准备隐私说明。

合规注意：

- 必须提供清晰的定位、相机、相册、麦克风权限说明。
- 必须提供隐私政策、用户协议、AI 内容说明和数据删除/反馈入口。
- Apple 要求应用遵守 App Review Guidelines，并准确披露数据收集与隐私实践。

### 6.3 HarmonyOS

首期分两步：

1. HarmonyOS 兼容试用版：优先覆盖华为手机试用，快速验证现场体验。
2. 原生 HarmonyOS NEXT 规划版：基于 ArkTS / ArkUI 规划专版，面向长期正式发布。

合规注意：

- 华为 AppGallery Connect 需要单独完成开发者、证书、包体、隐私与审核材料。
- 原生 HarmonyOS 版本不能只把 Android APK 兼容包当作长期方案。

## 7. 真实 POI 数据策略

完整真实 POI 不能靠手写少量样例，也不能无授权批量爬取。西城 POI 数据分三层建设。

### 7.1 L1 权威文旅 POI

用于核心讲解、路线、内容推荐和官方可信展示。

来源：

- 西城区政府公开文旅信息
- 北京市文化和旅游局公开信息
- 北京市公共数据开放平台
- 景区、博物馆、公园、文保单位官网
- 经过授权的文旅数据或合作方数据

首期覆盖：

- A 级景区
- 博物馆
- 公园
- 名人故居
- 文保单位
- 历史文化街区
- 游客咨询站
- 剧场、会馆、老字号文化空间

### 7.2 L2 地图运营 POI

用于定位、附近推荐、导航、搜索和路线。

候选数据服务：

- 高德开放平台
- 腾讯位置服务
- 百度地图
- 天地图 / 授权测绘数据，用于更正式的公共展示或政企交付

注意：

- 高德 / 腾讯常用坐标为 GCJ-02。
- 百度常用坐标为 BD-09。
- OSM 常用坐标为 WGS84。
- 不允许混用坐标系统后靠手工偏移修正。
- 地图服务的 POI、路线、地址和缓存必须遵守对应平台服务协议。

### 7.3 L3 星河寻境运营增强 POI

这是产品壁垒层，由运营和用户反馈持续沉淀：

- 小京推荐语
- 讲解摘要
- 年龄分层讲解
- OCR 关键词
- 图片识别别名
- 适合拍照角度
- 适合路线
- 游记素材
- 用户纠错
- 现场测试照片
- 内容审核状态

## 8. POI 覆盖标准

### 8.1 P0 核心 POI

数量：80-120 个。

必须包含字段：

- POI ID
- 名称
- 官方名称
- 别名
- 分类
- 等级
- 地址
- 经纬度
- 坐标系
- 来源
- 简介
- 讲解摘要
- OCR 关键词
- GPS 触发半径
- 推荐问题
- 内容审核状态

### 8.2 P1 运营 POI

数量：300-500 个。

覆盖：

- 特色餐饮
- 老字号
- 咖啡茶馆
- 文创店
- 书店
- 剧场
- 拍照点
- 亲子点位
- 夜游点位
- 公共服务点

### 8.3 P2 动态 POI

不默认沉淀为自有库，通过地图 API 动态查询：

- 普通餐厅
- 酒店
- 停车场
- 临时活动
- 商超便利店

## 9. 首期推荐 POI 池

首期 P0 应至少覆盖以下类型和代表点位，最终以数据授权、坐标校验和运营确认结果为准。

### 9.1 核心景区与公园

- 北海公园
- 景山公园
- 什刹海
- 恭王府
- 北京动物园
- 北京天文馆
- 北京大观园
- 宣武艺园
- 金中都公园

### 9.2 博物馆与文化场馆

- 中国地质博物馆
- 宣南文化博物馆
- 宋庆龄故居
- 郭沫若纪念馆
- 鲁迅博物馆
- 历代帝王庙
- 湖广会馆大戏楼
- 老舍茶馆

### 9.3 历史街区与 Citywalk

- 白塔寺片区
- 阜成门内大街
- 烟袋斜街
- 银锭桥
- 牛街
- 大栅栏
- 西单
- 金融街
- 后海
- 前海

### 9.4 游客服务与公共服务

- 北海游客咨询站
- 景山公园游客咨询站
- 恭王府游客咨询站
- 老舍茶馆咨询站
- 重要地铁站出入口
- 公厕
- 休息点
- 急救点

## 10. 数据结构

### 10.1 POI

```json
{
  "poiId": "xicheng-baitasi",
  "regionCode": "XICHENG",
  "packageCode": "XICHENG-MAP-001",
  "name": "白塔寺",
  "officialName": "妙应寺白塔",
  "aliases": ["白塔寺", "妙应寺", "妙应寺白塔"],
  "category": "heritage_site",
  "level": "P0",
  "address": "北京市西城区阜成门内大街171号",
  "location": {
    "lng": 116.357,
    "lat": 39.923,
    "coordType": "GCJ02"
  },
  "source": {
    "geo": "licensed_map_provider",
    "content": "official_or_editorial",
    "sourceUrl": "",
    "licenseStatus": "review_required"
  },
  "trigger": {
    "gpsRadiusMeters": 180,
    "ocrKeywords": ["白塔寺", "妙应寺", "白塔"],
    "photoLabels": ["pagoda", "temple", "white pagoda"],
    "minConfidence": 0.85
  },
  "content": {
    "shortIntro": "西城重要历史文化地标。",
    "guideText": "适合讲元代白塔、胡同肌理和老城更新。",
    "recommendedQuestions": [
      "白塔寺为什么重要？",
      "附近适合怎么逛？",
      "这里有什么适合拍照的点？"
    ]
  },
  "audit": {
    "contentStatus": "draft | reviewed | published | rejected",
    "geoStatus": "unchecked | verified | disputed",
    "updatedAt": "2026-06-26"
  }
}
```

### 10.2 Route

```json
{
  "routeId": "xicheng-shichahai-walk",
  "regionCode": "XICHENG",
  "packageCode": "XICHENG-MAP-001",
  "name": "什刹海胡同漫游线",
  "theme": "胡同、水系、王府文化",
  "durationMinutes": 150,
  "distanceMeters": 3600,
  "poiIds": ["shichahai", "yandai-xiejie", "yindingqiao", "gongwangfu"],
  "routeType": "visit_sequence",
  "description": "适合半日步行，串联西城水系、胡同和王府文化。",
  "source": {
    "path": "editorial",
    "routing": "map_provider_required_for_turn_by_turn"
  }
}
```

### 10.3 Recognition Event

```json
{
  "eventId": "rec_20260626_0001",
  "userId": "anonymous_or_bound_user",
  "regionCode": "XICHENG",
  "source": "gps | ocr | camera | text",
  "inputText": "白塔寺",
  "location": {
    "lng": 116.357,
    "lat": 39.923,
    "coordType": "GCJ02"
  },
  "candidates": [
    {
      "poiId": "xicheng-baitasi",
      "confidence": 0.92,
      "reason": "OCR 命中别名，当前位置接近 POI"
    }
  ],
  "finalAction": "start_ai_guide",
  "userConfirmed": true,
  "createdAt": "2026-06-26T10:00:00+08:00"
}
```

## 11. 核心功能

### 11.1 首页

功能：

- 小京问候
- 当前区域：北京西城
- 附近推荐 POI
- 扫一扫入口
- 问问小京入口
- 路线推荐
- 游记生成
- 最近识别

数据：

- `regionCode = XICHENG`
- `packageCode = XICHENG-MAP-001`
- 当前定位，用户授权后可用
- 最近识别事件
- 推荐路线

### 11.2 扫一扫

能力：

- 拍照识别
- OCR 文字识别
- 附近定位触发

策略：

- 单一视觉模型命中不自动跳转。
- OCR + GPS 同时命中可强触发。
- GPS 半径命中但用户未停留，只显示轻提示。
- 置信度低于 0.85 时展示候选确认。

### 11.3 问问小京

输入上下文：

- regionCode
- poiId
- routeId
- 用户当前位置
- 最近识别记录
- 用户问题

输出：

- 直接回答
- 推荐追问
- 推荐路线
- 推荐附近 POI
- 游记素材建议

必须有兜底：

- 不知道时明确说明。
- 对未审核内容不编造。
- 对开放时间、票价、预约等高时效信息提示用户以官方渠道为准。

### 11.4 路线推荐

首期路线：

- 白塔寺文化半日线
- 什刹海胡同漫游线
- 中轴西侧文化线
- 牛街烟火美食线
- 金融街城市更新线
- 亲子博物馆线
- 皇家园林与水系线

路线分两种：

- 游览顺序路线：编辑推荐，不承诺导航精度。
- 导航路线：必须由地图服务或授权路网数据计算。

### 11.5 游记生成

输入：

- 用户选择的识别足迹
- 图片
- POI 名称
- 路线
- 用户补充文字
- 游记风格

输出：

- 标题
- 行程摘要
- 正文
- 小京点评
- 可编辑段落
- 分享图文

风格：

- 城市漫步
- 文化随笔
- 亲子研学
- 朋友圈短文
- 小红书风格，但视觉不网红化

### 11.6 照片与轨迹素材

照片素材必须保存为游记可用事件，而不是只作为一次性识别输入。

照片事件字段：

- `photoId`
- `localFileId / objectKey`
- `takenAt`
- `exifLatitude / exifLongitude`
- `captureLatitude / captureLongitude`
- `coordType`
- `accuracyMeters`
- `poiCode`
- `triggerConfidence`
- `userTraceId`
- `travelogueDraftId`

轨迹采集用于后续类似“六只脚”的实时行走记录：

- 用户显式开启后才采集。
- 前台采集优先，后台持续定位必须单独申请权限并说明用途。
- 采样策略首期可按 `5-10 秒` 或 `10-30 米` 变化写入一次。
- 轨迹点字段至少包含 `trackSessionId`、`latitude`、`longitude`、`coordType`、`accuracyMeters`、`speed`、`heading`、`altitude`、`recordedAt`、`batteryState`。
- 游记生成时可把轨迹点压缩成路线摘要、停留 POI、照片时间线和步行距离。

## 12. 后端与 Yudao 能力

### 12.1 资源包

```text
XICHENG-MAP-001
```

包含：

- POI package
- Route package
- Content package
- Trigger package
- UI profile
- AI prompt profile

### 12.2 APP API

```http
GET /app-api/xunjing/profile/current?regionCode=XICHENG
GET /app-api/xunjing/packages/XICHENG-MAP-001
GET /app-api/xunjing/pois?regionCode=XICHENG
GET /app-api/xunjing/pois/{poiId}
GET /app-api/xunjing/routes?regionCode=XICHENG
GET /app-api/xunjing/routes/{routeId}
POST /app-api/xunjing/triggers/resolve
POST /app-api/xunjing/events/recognition
POST /app-api/xunjing/ai/chat
POST /app-api/xunjing/travelogues/generate
POST /app-api/xunjing/feedback
```

所有 `/app-api/xunjing/**` 调用必须带 `tenant-id`。

### 12.3 运营后台

必须支持：

- POI 管理
- POI 来源管理
- POI 坐标审核
- POI 别名管理
- OCR 关键词管理
- 路线管理
- 讲解内容管理
- AI prompt 配置
- 识别事件查看
- 用户反馈查看
- 误触发标记
- 热门 POI 统计
- 试用用户管理
- 内容审核流转

## 13. 多模态触发引擎

### 13.1 输入

```json
{
  "regionCode": "beijing-xicheng",
  "packageCode": "XICHENG-MAP-001",
  "sceneCode": "xicheng-multimodal-trigger",
  "sourceChannel": "APP_UNIAPP",
  "userTraceId": "guest",
  "text": "白塔寺",
  "ocrText": "妙应寺白塔入口",
  "imageLabels": ["white_pagoda", "temple_gate"],
  "location": {
    "latitude": 39.9231,
    "longitude": 116.35726,
    "coordType": "gcj02",
    "accuracyMeters": 18
  },
  "photoMeta": {
    "imageId": "local-photo-id",
    "imageUrl": "local-temp-file-path",
    "takenAt": "2026-06-27T10:00:00.000Z",
    "imageMimeType": "image/jpeg",
    "imageWidth": 1440,
    "imageHeight": 1080,
    "imageBase64": "bounded-base64-for-server-vision",
    "exifLocation": {
      "latitude": 39.9231,
      "longitude": 116.35726,
      "coordType": "gcj02",
      "accuracyMeters": 18
    }
  },
  "recentPoiCodes": ["xicheng-shichahai"]
}
```

### 13.2 输出

```json
{
  "intent": "guide",
  "action": "start_ai_guide",
  "triggerType": "ocr",
  "regionCode": "beijing-xicheng",
  "poiCode": "xicheng-baitasi",
  "poiName": "妙应寺白塔",
  "confidence": 0.92,
  "requiresUserConfirm": false,
  "reason": "OCR文字+定位已达到自动触发阈值。",
  "targetPath": "/pages/ai-guide/detail?regionCode=beijing-xicheng&poiCode=xicheng-baitasi",
  "candidates": [
    {
      "poiCode": "xicheng-baitasi",
      "poiName": "妙应寺白塔",
      "confidence": 0.92,
      "distanceMeters": 32.5,
      "matchedSignals": ["gps_radius", "ocr_alias", "image_label"]
    }
  ]
}
```

### 13.2.1 MVP 当前实现口径

- 当前后端已落地 `/app-api/xunjing/triggers/resolve`，Yudao Controller 内部路径为 `/xunjing/triggers/resolve`。
- APP 调用必须带 `tenant-id`。
- MVP 先用西城 seed POI 做现场测试，已覆盖白塔寺/妙应寺白塔、历代帝王庙、北海公园、什刹海、大栅栏。
- APP 拍照触发会读取图片 MIME、宽高和受限 base64；后端通过 `XunjingVisionRecognitionService` 调用服务端视觉模型适配器生成/合并 `imageLabels`。
- 视觉模型通过服务端环境变量启用：`XUNJING_VISION_API_URL`、`XUNJING_VISION_API_KEY`、`XUNJING_VISION_MODEL`。前端禁止保存模型密钥。
- 后续生产化时，POI seed 必须迁移到后台可维护 POI 表，识别事件要落表并支持运营纠错。
- 真实 OCR 只需要把结果写入 `ocrText`；图片视觉模型已通过后端适配器接入同一契约，不要重写触发接口。

### 13.3 触发规则

| 条件 | 动作 |
| --- | --- |
| GPS 距离 P0 POI 小于 150-200 米，停留超过 30 秒 | 轻提示附近讲解 |
| OCR 命中 POI 名称或别名，置信度大于 0.85 | 进入识别结果页 |
| OCR + GPS 同时命中 | 可直接推荐 AI 讲解 |
| 拍照识别命中建筑 / 牌匾 / 地标 | 展示候选 POI |
| 用户连续识别 2 个以上 POI | 推荐生成游记 |
| 置信度低于 0.85 | 不自动触发，展示候选确认 |

## 14. 隐私与合规

### 14.1 定位

- 只在用户授权后使用定位。
- 默认不做后台持续定位。
- 附近触发、路线、识别时仅采集必要位置。
- 识别事件用于优化时必须脱敏或匿名化。

### 14.2 相机与图片

- 拍照识别前说明用途。
- 用户图片不默认公开。
- 用于模型评估或运营纠错时需要明确授权。

### 14.3 AI 内容

- AI 讲解和问答必须标明为 AI 生成或 AI 辅助。
- 开放时间、票价、预约、交通管制等高时效信息要提示以官方渠道为准。
- 文化、历史、宗教内容需要审核机制。

### 14.4 地图与 POI 授权

- 原型可使用公开数据和地图 API 做验证。
- 多人真实试运营需要确认地图 API、POI 缓存、二次展示、路线使用的授权边界。
- 对外宣传、政府汇报、出版或公共地图展示，需要使用标准地图或授权测绘数据，不得把普通 API 数据或 AI 绘图包装成合规地图成果。

## 15. 验收标准

### 15.1 数据验收

- P0 POI 不少于 80 个。
- P1 POI 不少于 300 个。
- 每个 P0 POI 有坐标、地址、来源、别名、分类、摘要、触发关键词和审核状态。
- 坐标系统字段完整。
- 坐标偏移经过校验。
- 每条路线至少 3 个 POI。
- 数据来源可追溯。

### 15.2 APP 验收

- Android 可安装试用。
- iOS TestFlight 可安装试用。
- 华为设备可安装试用。
- 首页符合 UI 参考图方向。
- 首页完整展示小京、扫一扫、问答、路线、游记、最近识别。
- 识别结果页可展示真实 POI。
- 路线页可展示真实路线。
- 游记生成页可基于真实足迹生成草稿。

### 15.3 后端验收

- 能查询 `XICHENG-MAP-001`。
- 能查询西城 POI。
- 能查询西城路线。
- 能写入识别事件。
- 能记录用户反馈。
- 触发接口能基于 OCR 命中 POI。
- 触发接口能基于 GPS 返回附近 POI。
- AI 问答支持 regionCode、poiId、routeId 上下文。

### 15.4 试运营验收

- 支持 100-500 人灰度试用。
- API 有限流和错误兜底。
- 后台能看到识别事件和误触发。
- 后台能修正 POI 和内容。
- 用户可以提交错误反馈。
- 有隐私政策、用户协议、AI 内容说明。

## 16. 推进计划

### Phase 0：UI 与产品口径锁定

产出：

- UI 参考图归档
- 小京形象说明
- 首页信息架构
- 三端范围确认

### Phase 1：真实 POI 数据底座

产出：

- POI schema
- 数据来源清单
- P0 80-120 个 POI
- P1 300-500 个 POI
- 坐标系统规范
- POI 审核表

### Phase 2：APP 三端试用版

产出：

- Android APK
- iOS TestFlight
- HarmonyOS 兼容试用包
- XICHENG profile
- 首页、识别、问答、路线、游记、最近识别页面

### Phase 3：Yudao 资源包与后台

产出：

- `XICHENG-MAP-001`
- POI 管理
- 路线管理
- 内容管理
- 触发词管理
- 识别事件管理
- 用户反馈管理

### Phase 4：多模态触发 MVP

产出：

- GPS 触发
- OCR 触发
- 拍照识别候选
- 多信号置信度融合
- 用户确认机制
- 误触发反馈

### Phase 5：多人灰度试运营

产出：

- 试用邀请码
- 试用数据看板
- 每周运营复盘
- POI 修正清单
- 识别准确率统计
- 下一版优化列表

## 17. 风险与对策

| 风险 | 对策 |
| --- | --- |
| POI 数据授权不清 | 数据源分层，核心数据走官方公开或授权路径 |
| 坐标偏移 | 明确 WGS84 / GCJ-02 / BD-09，统一转换 |
| 视觉识别误判 | 第一版以 GPS + OCR 为主，视觉只给候选；模型密钥只在服务端，图片 base64 做长度限制 |
| 用户被频繁打扰 | 置信度阈值、停留判断、用户确认 |
| AI 讲解胡编 | RAG 绑定审核内容，不知道就兜底 |
| iOS 审核卡住 | 提前准备隐私政策、权限说明、AI 说明 |
| HarmonyOS 长期依赖 APK | 兼容版先试用，原生 ArkTS / ArkUI 同步规划 |
| 多人试用成本升高 | 限流、缓存、模型分级、灰度邀请码 |

## 18. 参考资料

- [西城区 3A 及以下旅游景区名录](https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html)
- [北京市文化和旅游局游客咨询站列表](https://whlyj.beijing.gov.cn/ggfw/ly/202110/t20211011_2509962.html)
- [北京市公共数据开放平台](https://data.beijing.gov.cn/)
- [高德开放平台](https://lbs.amap.com/)
- [腾讯位置服务 WebService API](https://lbs.qq.com/webservice_v1/index.html)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
- [Google Play target API level requirements](https://developer.android.com/google/play/requirements/target-sdk)
- [Huawei AppGallery Connect Getting Started](https://developer.huawei.com/consumer/en/doc/app/agc-help-getstarted-0000001100316670)
- [Huawei ArkTS Documentation](https://developer.huawei.com/consumer/en/doc/harmonyos-guides/arkts)
