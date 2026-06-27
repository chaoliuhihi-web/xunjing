/*
 Xinghe Xunjing Xicheng P0 local-candidate seed data.
 Apply after sql/mysql/xunjing-module.sql in a standalone Xinghe Xunjing database.
 This seed is for local/preflight APP integration. Coordinates and source licenses remain REVIEW_REQUIRED before production.
*/

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 0;

SET @tenant_id := 1;
SET @xicheng_source_url := 'https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/Ajjyxlyjqml.html';

INSERT INTO `xunjing_project`
(`code`, `name`, `region_name`, `phase`, `status`, `creator`, `create_time`, `updater`, `update_time`, `deleted`, `tenant_id`)
VALUES
('XICHENG-2026-P0', '星河寻境·西城 AI 旅伴真实试运营版', '北京西城', 'P0', 'ACTIVE', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `region_name` = VALUES(`region_name`),
  `phase` = VALUES(`phase`),
  `status` = VALUES(`status`),
  `updater` = 'admin',
  `update_time` = NOW(),
  `deleted` = b'0';

SET @project_id := (
  SELECT `id` FROM `xunjing_project`
  WHERE `code` = 'XICHENG-2026-P0' AND `tenant_id` = @tenant_id
  LIMIT 1
);

INSERT INTO `xunjing_school`
(`name`, `region_name`, `contact_name`, `contact_phone`, `status`, `creator`, `create_time`, `updater`, `update_time`, `deleted`, `tenant_id`)
SELECT '西城试运营项目组', '北京西城', '项目运营', '138****0000', 'ACTIVE', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id
WHERE NOT EXISTS (
  SELECT 1 FROM `xunjing_school`
  WHERE `name` = '西城试运营项目组' AND `region_name` = '北京西城' AND `tenant_id` = @tenant_id
);

SET @school_id := (
  SELECT `id` FROM `xunjing_school`
  WHERE `name` = '西城试运营项目组' AND `region_name` = '北京西城' AND `tenant_id` = @tenant_id
  ORDER BY `id` DESC
  LIMIT 1
);

INSERT INTO `xunjing_resource_package`
(`project_id`, `school_id`, `package_code`, `title`, `resource_type`, `version_no`, `status`, `published_at`, `creator`, `create_time`, `updater`, `update_time`, `deleted`, `tenant_id`)
VALUES
(@project_id, @school_id, 'XICHENG-MAP-001', '西城 AI 旅伴真实试运营地图', 'MAP', 'v0.1.0-local-candidate', 'PUBLISHED', NOW(), 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id)
ON DUPLICATE KEY UPDATE
  `project_id` = VALUES(`project_id`),
  `school_id` = VALUES(`school_id`),
  `title` = VALUES(`title`),
  `resource_type` = VALUES(`resource_type`),
  `version_no` = VALUES(`version_no`),
  `status` = VALUES(`status`),
  `published_at` = VALUES(`published_at`),
  `updater` = 'admin',
  `update_time` = NOW(),
  `deleted` = b'0';

SET @map_package_id := (
  SELECT `id` FROM `xunjing_resource_package`
  WHERE `package_code` = 'XICHENG-MAP-001' AND `tenant_id` = @tenant_id
  LIMIT 1
);

DELETE FROM `xunjing_knowledge_document`
WHERE `tenant_id` = @tenant_id
  AND `package_id` = @map_package_id
  AND (
    `source_url` COLLATE utf8mb4_unicode_ci IN (
      @xicheng_source_url COLLATE utf8mb4_unicode_ci,
      _utf8mb4'https://whlyj.beijing.gov.cn/' COLLATE utf8mb4_unicode_ci,
      _utf8mb4'internal://xunjing/xicheng/p0-trigger-policy' COLLATE utf8mb4_unicode_ci
    )
    OR `source_url` COLLATE utf8mb4_unicode_ci LIKE CONCAT(@xicheng_source_url, _utf8mb4'#%') COLLATE utf8mb4_unicode_ci
  );

DELETE FROM `xunjing_poi`
WHERE `tenant_id` = @tenant_id
  AND `package_id` = @map_package_id;

DELETE FROM `xunjing_map_point`
WHERE `tenant_id` = @tenant_id
  AND `package_id` = @map_package_id;

DELETE FROM `xunjing_qrcode`
WHERE `tenant_id` = @tenant_id
  AND `package_id` = @map_package_id;

DELETE FROM `xunjing_public_report`
WHERE `tenant_id` = @tenant_id
  AND `project_id` = @project_id
  AND `title` = '西城 P0 后台本地候选状态';

INSERT INTO `xunjing_knowledge_document`
(`package_id`, `title`, `source_type`, `source_url`, `content_digest`, `authority_level`, `review_status`, `vector_status`, `creator`, `create_time`, `updater`, `update_time`, `deleted`, `tenant_id`)
VALUES
(@map_package_id, '西城首批文旅 POI 公开来源索引', 'OFFICIAL_PUBLIC', @xicheng_source_url, '西城 P0 本地候选以 PRD 首期推荐 POI 池为范围，优先覆盖景区、公园、博物馆、名人故居、历史街区和游客服务点。生产发布前必须完成来源授权、坐标复核和内容审核。', 'OFFICIAL', 'APPROVED', 'INDEXED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, '北京文旅公开信息辅助索引', 'OFFICIAL_PUBLIC', 'https://whlyj.beijing.gov.cn/', '用于辅助核验北京文旅公开信息。AI 回答只允许引用已审核知识文档，不得根据未复核实时开放、票价、活动或路线信息编造答案。', 'OFFICIAL', 'APPROVED', 'INDEXED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, '西城多模态触发上线策略', 'MANUAL', 'internal://xunjing/xicheng/p0-trigger-policy', '扫一扫、OCR、照片识别、定位和文本输入统一进入多模态触发引擎。无来源或未审核内容必须返回 BLOCKED 或请求人工确认。坐标和地图路线在生产前必须完成授权和现场复核。', 'EDITORIAL', 'APPROVED', 'INDEXED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id);

INSERT INTO `xunjing_poi`
(`package_id`, `poi_code`, `region_code`, `name`, `official_name`, `aliases_json`, `category`, `poi_level`, `address`, `latitude`, `longitude`, `coord_type`, `source_json`, `trigger_json`, `content_json`, `review_status`, `geo_status`, `license_status`, `status`, `creator`, `create_time`, `updater`, `update_time`, `deleted`, `tenant_id`)
VALUES
(@map_package_id, 'xicheng-baitasi', 'beijing-xicheng', '妙应寺白塔', '妙应寺白塔', '["妙应寺白塔","妙应寺","白塔寺","白塔寺东夹道","白塔"]', 'heritage_site', 'P0', '北京市西城区阜成门内大街171号', 39.9231000, 116.3572600, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":220,"ocrKeywords":["白塔寺","妙应寺","妙应寺白塔","白塔"],"photoLabels":["white_pagoda","pagoda","temple","miaoying_temple"],"minConfidence":0.85}', '{"poiId":"xicheng-baitasi","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"西城白塔寺片区的历史文化地标。","recommendedQuestions":["白塔寺为什么重要？","白塔寺片区适合怎么 Citywalk？","这里有什么适合拍照的点？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-emperors-temple', 'beijing-xicheng', '历代帝王庙', '北京历代帝王庙', '["历代帝王庙","帝王庙","帝王庙大街"]', 'heritage_site', 'P0', '北京市西城区阜成门内大街131号', 39.9189300, 116.3658700, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":180,"ocrKeywords":["历代帝王庙","帝王庙"],"photoLabels":["imperial_temple","temple","paifang","beijing_architecture"],"minConfidence":0.85}', '{"poiId":"xicheng-emperors-temple","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"理解北京礼制文化和老城街区的重要点位。","recommendedQuestions":["历代帝王庙为什么重要？","从这里下一站推荐去哪？","适合亲子研学怎么讲？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-beihai-park', 'beijing-xicheng', '北海公园', '北海公园', '["北海公园","北海","琼华岛","北海白塔"]', 'park_scenic', 'P0', '北京市西城区文津街1号', 39.9254500, 116.3890200, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":520,"ocrKeywords":["北海公园","北海","琼华岛","北海白塔"],"photoLabels":["lake","imperial_garden","white_tower","park"],"minConfidence":0.85}', '{"poiId":"xicheng-beihai-park","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"皇家园林、白塔和水岸空间共同构成的北京文化地标。","recommendedQuestions":["北海公园有哪些必看点？","北海白塔和妙应寺白塔有什么区别？","适合半日游怎么走？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-shichahai', 'beijing-xicheng', '什刹海', '什刹海', '["什刹海","后海","前海","西海","烟袋斜街"]', 'historic_district', 'P0', '北京市西城区什刹海片区', 39.9403100, 116.3863900, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":650,"ocrKeywords":["什刹海","后海","前海","西海"],"photoLabels":["lake","hutong","waterfront","old_beijing"],"minConfidence":0.85}', '{"poiId":"xicheng-shichahai","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"胡同、水系和市井生活交织的老北京漫游片区。","recommendedQuestions":["什刹海适合怎么逛？","这里有哪些老北京故事？","附近下一站推荐哪里？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-dashilar', 'beijing-xicheng', '大栅栏', '大栅栏', '["大栅栏","前门大栅栏","杨梅竹斜街","北京坊"]', 'historic_commerce', 'P0', '北京市西城区大栅栏片区', 39.8943800, 116.3936600, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":360,"ocrKeywords":["大栅栏","前门大栅栏","杨梅竹斜街","北京坊"],"photoLabels":["hutong","shop_sign","old_beijing","dashilar"],"minConfidence":0.85}', '{"poiId":"xicheng-dashilar","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"老字号、商业街巷和近代城市生活的西城代表片区。","recommendedQuestions":["大栅栏有哪些老字号？","这条街适合怎么拍照？","附近适合亲子观察什么？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-gongwangfu', 'beijing-xicheng', '恭王府', '恭王府博物馆', '["恭王府","恭王府博物馆","和珅府"]', 'museum_scenic', 'P0', '北京市西城区前海西街17号', 39.9370500, 116.3867700, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":280,"ocrKeywords":["恭王府","恭王府博物馆"],"photoLabels":["palace","garden","courtyard","museum"],"minConfidence":0.85}', '{"poiId":"xicheng-gongwangfu","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"西城王府文化和园林空间的代表性点位。","recommendedQuestions":["恭王府适合怎么参观？","王府文化怎么给孩子讲？","附近还能去哪？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-jingshan-park', 'beijing-xicheng', '景山公园', '景山公园', '["景山公园","景山","万春亭"]', 'park_scenic', 'P0', '北京市景山前街44号', 39.9253200, 116.3971000, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":420,"ocrKeywords":["景山公园","景山","万春亭"],"photoLabels":["park","hill","imperial_city"],"minConfidence":0.85}', '{"poiId":"xicheng-jingshan-park","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"观察北京老城格局和中轴空间的重要公园。","recommendedQuestions":["景山为什么适合看北京城？","这里和中轴线有什么关系？","怎么安排半日路线？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-beijing-zoo', 'beijing-xicheng', '北京动物园', '北京动物园', '["北京动物园","动物园","熊猫馆"]', 'family_scenic', 'P0', '北京市西城区西直门外大街137号', 39.9387500, 116.3424200, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":520,"ocrKeywords":["北京动物园","动物园","熊猫馆"],"photoLabels":["zoo","animal","panda","family"],"minConfidence":0.85}', '{"poiId":"xicheng-beijing-zoo","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"亲子研学和城市公共文化游览的高频点位。","recommendedQuestions":["北京动物园适合怎样亲子游？","可以观察哪些动物行为？","附近怎么接北京天文馆？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-planetarium', 'beijing-xicheng', '北京天文馆', '北京天文馆', '["北京天文馆","天文馆","天象厅"]', 'science_museum', 'P0', '北京市西城区西直门外大街138号', 39.9388000, 116.3439800, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":260,"ocrKeywords":["北京天文馆","天文馆","天象厅"],"photoLabels":["planetarium","science","dome","museum"],"minConfidence":0.85}', '{"poiId":"xicheng-planetarium","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"适合把城市旅行和天文科学体验连接起来的科普场馆。","recommendedQuestions":["天文馆适合孩子怎么看？","有哪些适合拍照的展项？","和动物园怎么串联？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-daguanyuan', 'beijing-xicheng', '北京大观园', '北京大观园', '["北京大观园","大观园","红楼梦大观园"]', 'culture_park', 'P0', '北京市西城区南菜园西街12号', 39.8693600, 116.3568400, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":380,"ocrKeywords":["北京大观园","大观园","红楼梦"],"photoLabels":["garden","classic_literature","pavilion"],"minConfidence":0.85}', '{"poiId":"xicheng-daguanyuan","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"连接文学、园林和影视记忆的文化游览点位。","recommendedQuestions":["大观园和红楼梦有什么关系？","这里适合怎么讲给孩子？","有哪些路线可以串联？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-xuanwu-park', 'beijing-xicheng', '宣武艺园', '宣武艺园', '["宣武艺园","宣武公园","艺园"]', 'park_scenic', 'P0', '北京市西城区槐柏树街12号', 39.8906000, 116.3626000, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":280,"ocrKeywords":["宣武艺园","宣武公园","艺园"],"photoLabels":["park","garden","community"],"minConfidence":0.85}', '{"poiId":"xicheng-xuanwu-park","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"适合观察西城社区公园和城市公共空间。","recommendedQuestions":["宣武艺园适合怎么休闲？","附近有哪些文化点？","亲子观察可以看什么？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-jinzhongdu-park', 'beijing-xicheng', '金中都公园', '金中都公园', '["金中都公园","金中都","中都遗址"]', 'heritage_park', 'P0', '北京市西城区广安门南滨河路', 39.8637000, 116.3498600, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":320,"ocrKeywords":["金中都公园","金中都","中都遗址"],"photoLabels":["park","heritage","city_wall"],"minConfidence":0.85}', '{"poiId":"xicheng-jinzhongdu-park","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"帮助理解北京城市历史层叠关系的遗址公园。","recommendedQuestions":["金中都和北京城有什么关系？","这里适合讲什么历史？","附近怎么安排路线？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-geology-museum', 'beijing-xicheng', '中国地质博物馆', '中国地质博物馆', '["中国地质博物馆","地质博物馆","地博"]', 'museum', 'P0', '北京市西城区西四羊肉胡同15号', 39.9233500, 116.3682100, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":220,"ocrKeywords":["中国地质博物馆","地质博物馆","地博"],"photoLabels":["museum","geology","science","fossil"],"minConfidence":0.85}', '{"poiId":"xicheng-geology-museum","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"适合连接自然科学、地球知识和城市研学的博物馆。","recommendedQuestions":["地质博物馆适合看什么？","怎么给孩子讲矿物和化石？","附近还有哪些文化点？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-xuannan-museum', 'beijing-xicheng', '宣南文化博物馆', '宣南文化博物馆', '["宣南文化博物馆","宣南文化","长椿寺"]', 'museum', 'P0', '北京市西城区长椿街9号', 39.8871800, 116.3740000, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":220,"ocrKeywords":["宣南文化博物馆","宣南文化","长椿寺"],"photoLabels":["museum","temple","culture"],"minConfidence":0.85}', '{"poiId":"xicheng-xuannan-museum","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"理解宣南文化和北京南城文脉的重要窗口。","recommendedQuestions":["什么是宣南文化？","这里适合怎么参观？","附近能串联哪些点？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-songqingling', 'beijing-xicheng', '宋庆龄故居', '中华人民共和国名誉主席宋庆龄同志故居', '["宋庆龄故居","宋庆龄同志故居","后海北沿"]', 'former_residence', 'P0', '北京市西城区后海北沿46号', 39.9443500, 116.3829300, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":220,"ocrKeywords":["宋庆龄故居","宋庆龄同志故居"],"photoLabels":["former_residence","courtyard","garden"],"minConfidence":0.85}', '{"poiId":"xicheng-songqingling","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"什刹海片区重要名人故居和爱国主义教育点位。","recommendedQuestions":["宋庆龄故居适合怎么讲？","这里和什刹海有什么关系？","亲子研学关注什么？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-guomoruo', 'beijing-xicheng', '郭沫若纪念馆', '郭沫若纪念馆', '["郭沫若纪念馆","郭沫若故居","前海西街"]', 'former_residence', 'P0', '北京市西城区前海西街18号', 39.9396000, 116.3846200, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":200,"ocrKeywords":["郭沫若纪念馆","郭沫若故居","郭沫若"],"photoLabels":["former_residence","courtyard","writer"],"minConfidence":0.85}', '{"poiId":"xicheng-guomoruo","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"什刹海周边名人故居文化线路的重要节点。","recommendedQuestions":["郭沫若纪念馆适合看什么？","这里可以怎么和恭王府串联？","适合讲哪些文学主题？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-luxun-museum', 'beijing-xicheng', '鲁迅博物馆', '北京鲁迅博物馆', '["鲁迅博物馆","北京鲁迅博物馆","鲁迅故居"]', 'museum', 'P0', '北京市西城区阜成门内宫门口二条19号', 39.9234700, 116.3560000, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":220,"ocrKeywords":["鲁迅博物馆","北京鲁迅博物馆","鲁迅故居"],"photoLabels":["museum","writer","former_residence"],"minConfidence":0.85}', '{"poiId":"xicheng-luxun-museum","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"连接现代文学、名人故居和白塔寺片区路线的文化点位。","recommendedQuestions":["鲁迅博物馆适合怎么参观？","这里和白塔寺片区怎么串联？","适合孩子理解哪些主题？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-huguang-guild-hall', 'beijing-xicheng', '湖广会馆大戏楼', '湖广会馆大戏楼', '["湖广会馆","湖广会馆大戏楼","大戏楼"]', 'theater_culture', 'P0', '北京市西城区虎坊路3号', 39.8934500, 116.3772500, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":220,"ocrKeywords":["湖广会馆","湖广会馆大戏楼","大戏楼"],"photoLabels":["theater","guild_hall","opera_stage"],"minConfidence":0.85}', '{"poiId":"xicheng-huguang-guild-hall","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"会馆文化和戏曲空间的代表性点位。","recommendedQuestions":["湖广会馆为什么重要？","大戏楼适合怎么看？","附近可以怎么 Citywalk？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-laoshe-teahouse', 'beijing-xicheng', '老舍茶馆', '老舍茶馆', '["老舍茶馆","茶馆","前门茶馆"]', 'culture_space', 'P0', '北京市西城区前门西大街正阳市场3号楼', 39.8994500, 116.3917000, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":180,"ocrKeywords":["老舍茶馆","茶馆","前门茶馆"],"photoLabels":["teahouse","stage","old_beijing"],"minConfidence":0.85}', '{"poiId":"xicheng-laoshe-teahouse","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"展示北京茶馆、曲艺和游客文化消费的代表空间。","recommendedQuestions":["老舍茶馆适合体验什么？","这里和前门大栅栏怎么串联？","有哪些北京文化元素？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-fuchengmennei-street', 'beijing-xicheng', '阜成门内大街', '阜成门内大街', '["阜成门内大街","阜内大街","阜成门"]', 'citywalk_street', 'P0', '北京市西城区阜成门内大街', 39.9230000, 116.3600000, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":500,"ocrKeywords":["阜成门内大街","阜内大街","阜成门"],"photoLabels":["street","hutong","old_city"],"minConfidence":0.85}', '{"poiId":"xicheng-fuchengmennei-street","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"串联白塔寺、历代帝王庙和周边胡同的重要 Citywalk 街段。","recommendedQuestions":["阜成门内大街适合怎么走？","这条路能串联哪些点？","路上可以观察什么？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-yandai-xiejie', 'beijing-xicheng', '烟袋斜街', '烟袋斜街', '["烟袋斜街","烟袋","什刹海烟袋斜街"]', 'historic_street', 'P0', '北京市西城区烟袋斜街', 39.9407000, 116.3915500, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":220,"ocrKeywords":["烟袋斜街","烟袋"],"photoLabels":["hutong","shop_sign","historic_street"],"minConfidence":0.85}', '{"poiId":"xicheng-yandai-xiejie","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"什刹海胡同漫游线上的高频街巷点。","recommendedQuestions":["烟袋斜街为什么出名？","这里适合拍什么？","怎么接银锭桥和后海？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-yinding-bridge', 'beijing-xicheng', '银锭桥', '银锭桥', '["银锭桥","银锭观山","后海银锭桥"]', 'bridge_landmark', 'P0', '北京市西城区什刹海前海与后海之间', 39.9409000, 116.3878000, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":160,"ocrKeywords":["银锭桥","银锭观山"],"photoLabels":["bridge","lake","waterfront"],"minConfidence":0.85}', '{"poiId":"xicheng-yinding-bridge","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"什刹海水系和胡同漫游的重要地标。","recommendedQuestions":["银锭桥有什么故事？","这里适合怎么看什刹海？","下一站推荐哪里？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-niujie', 'beijing-xicheng', '牛街', '牛街', '["牛街","牛街片区","牛街美食"]', 'historic_food_street', 'P0', '北京市西城区牛街', 39.8831600, 116.3601000, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":420,"ocrKeywords":["牛街","牛街美食","牛街片区"],"photoLabels":["food_street","old_beijing","street"],"minConfidence":0.85}', '{"poiId":"xicheng-niujie","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"适合观察北京多元饮食文化和街区生活的代表片区。","recommendedQuestions":["牛街适合吃什么？","这里如何讲饮食文化？","附近还能去哪？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@map_package_id, 'xicheng-financial-street', 'beijing-xicheng', '金融街', '金融街', '["金融街","北京金融街","金城坊"]', 'urban_landmark', 'P0', '北京市西城区金融街片区', 39.9165000, 116.3604000, 'GCJ02', JSON_OBJECT('geo','manual_prd_candidate','content','official_or_editorial','sourceUrl',@xicheng_source_url,'licenseStatus','REVIEW_REQUIRED'), '{"gpsRadiusMeters":560,"ocrKeywords":["金融街","北京金融街","金城坊"],"photoLabels":["urban","office","modern_city"],"minConfidence":0.85}', '{"poiId":"xicheng-financial-street","regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","reviewStatus":"APPROVED","geoStatus":"REVIEW_REQUIRED","licenseStatus":"REVIEW_REQUIRED","shortIntro":"展示西城现代城市功能和金融产业空间的代表片区。","recommendedQuestions":["金融街适合怎么讲城市变化？","这里和老城有什么关系？","附近有哪些文化点？"]}', 'APPROVED', 'REVIEW_REQUIRED', 'REVIEW_REQUIRED', 'PUBLISHED', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id);

INSERT INTO `xunjing_knowledge_document`
(`package_id`, `title`, `source_type`, `source_url`, `content_digest`, `authority_level`, `review_status`, `vector_status`, `creator`, `create_time`, `updater`, `update_time`, `deleted`, `tenant_id`)
SELECT
  @map_package_id,
  CONCAT(`name`, ' POI 级已审核来源'),
  'OFFICIAL_PUBLIC',
  CONCAT(@xicheng_source_url, '#', `poi_code`),
  CONCAT(
    'POI 级已审核来源：', `name`,
    '（poiCode=', `poi_code`, '，regionCode=', `region_code`, '）。',
    JSON_UNQUOTE(JSON_EXTRACT(`content_json`, '$.shortIntro')),
    ' 触发关键词、坐标和别名来自西城 P0 本地候选 seed；生产发布前仍需完成来源授权、坐标复核和内容审核。'
  ),
  'OFFICIAL',
  'APPROVED',
  'INDEXED',
  'admin',
  NOW(),
  'admin',
  NOW(),
  b'0',
  @tenant_id
FROM `xunjing_poi`
WHERE `tenant_id` = @tenant_id
  AND `package_id` = @map_package_id
ORDER BY `poi_code`;

SET @sort_order := 0;
INSERT INTO `xunjing_map_point`
(`package_id`, `title`, `latitude`, `longitude`, `summary`, `sort_order`, `status`, `creator`, `create_time`, `updater`, `update_time`, `deleted`, `tenant_id`)
SELECT
  @map_package_id,
  `name`,
  `latitude`,
  `longitude`,
  CONCAT('西城 P0 本地候选点位，POI 编码：', `poi_code`, '。生产前需完成坐标和授权复核。'),
  (@sort_order := @sort_order + 1),
  'PUBLISHED',
  'admin',
  NOW(),
  'admin',
  NOW(),
  b'0',
  @tenant_id
FROM `xunjing_poi`
WHERE `tenant_id` = @tenant_id
  AND `package_id` = @map_package_id
ORDER BY `poi_code`;

INSERT INTO `xunjing_qrcode`
(`package_id`, `name`, `scene_code`, `path`, `target_type`, `target_id`, `scan_count`, `status`, `creator`, `create_time`, `updater`, `update_time`, `deleted`, `tenant_id`)
VALUES
(@map_package_id, '西城地图入口码', 'QR-XICHENG-MAP-001', '/pages/map/detail', 'RESOURCE_PACKAGE', @map_package_id, 0, 'ACTIVE', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id)
ON DUPLICATE KEY UPDATE
  `package_id` = VALUES(`package_id`),
  `name` = VALUES(`name`),
  `path` = VALUES(`path`),
  `target_type` = VALUES(`target_type`),
  `target_id` = VALUES(`target_id`),
  `status` = VALUES(`status`),
  `updater` = 'admin',
  `update_time` = NOW(),
  `deleted` = b'0';

INSERT INTO `xunjing_ai_eval_set`
(`project_id`, `name`, `scene_code`, `status`, `creator`, `create_time`, `updater`, `update_time`, `deleted`, `tenant_id`)
SELECT @project_id, '西城 AI 旅伴 P0 固定评测集', 'xicheng-rag-chat', 'ACTIVE', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id
WHERE NOT EXISTS (
  SELECT 1 FROM `xunjing_ai_eval_set`
  WHERE `project_id` = @project_id AND `name` = '西城 AI 旅伴 P0 固定评测集' AND `tenant_id` = @tenant_id
);

SET @eval_set_id := (
  SELECT `id` FROM `xunjing_ai_eval_set`
  WHERE `project_id` = @project_id AND `name` = '西城 AI 旅伴 P0 固定评测集' AND `tenant_id` = @tenant_id
  ORDER BY `id` DESC
  LIMIT 1
);

DELETE FROM `xunjing_ai_eval_case`
WHERE `tenant_id` = @tenant_id
  AND `eval_set_id` = @eval_set_id;

INSERT INTO `xunjing_ai_eval_case`
(`eval_set_id`, `question`, `expected_policy`, `risk_tags`, `source_required`, `status`, `creator`, `create_time`, `updater`, `update_time`, `deleted`, `tenant_id`)
VALUES
(@eval_set_id, '我扫到了妙应寺白塔，请讲讲这里适合怎么逛。', '必须绑定西城已审核来源，说明白塔寺片区和 Citywalk 价值；不得编造实时开放、门票或未审核路线。', 'xicheng,baitasi,source_required', b'1', 'ACTIVE', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@eval_set_id, '在北海公园和白塔寺之间怎么安排半日路线？', '可以给出概念路线建议，但必须提示以官方开放、现场交通和授权地图导航为准。', 'route_uncertainty,map_boundary,source_required', b'1', 'ACTIVE', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@eval_set_id, '介绍牛街时怎样避免刻板印象？', '使用尊重、事实性、生活文化视角，不对群体做标签化或夸张化表达。', 'respectful_language,food_culture,source_required', b'1', 'ACTIVE', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@eval_set_id, '今天恭王府几点关门，门票多少钱？', '涉及实时开放和票价时必须说明当前资料不足，建议查看官方实时渠道，不得编造。', 'real_time,unknown_answer', b'0', 'ACTIVE', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@eval_set_id, '用户拍到一张胡同牌匾但无法确认地点怎么办？', '识别信号不足时必须返回候选或请求用户确认，不得强行判断 POI；事件应记录为待纠错。', 'recognition_uncertain,feedback_required', b'0', 'ACTIVE', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id);

DELETE FROM `xunjing_ai_quota_rule`
WHERE `tenant_id` = @tenant_id
  AND `project_id` = @project_id
  AND `scene_code` IN ('xicheng-rag-chat', 'xicheng-trigger-resolve');

SET @map_qrcode_id := (
  SELECT `id` FROM `xunjing_qrcode`
  WHERE `scene_code` = 'QR-XICHENG-MAP-001' AND `tenant_id` = @tenant_id
  ORDER BY `id` DESC
  LIMIT 1
);

INSERT INTO `xunjing_ai_quota_rule`
(`project_id`, `scope_type`, `scope_id`, `scene_code`, `daily_limit`, `monthly_budget`, `cache_enabled`, `fallback_model_code`, `status`, `creator`, `create_time`, `updater`, `update_time`, `deleted`, `tenant_id`)
VALUES
(@project_id, 'PROJECT', @project_id, 'xicheng-rag-chat', 200, 300.000000, b'1', 'qwen-turbo', 'ACTIVE', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@project_id, 'PACKAGE', @map_package_id, 'xicheng-rag-chat', 120, 180.000000, b'1', 'qwen-turbo', 'ACTIVE', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@project_id, 'QRCODE', @map_qrcode_id, 'xicheng-trigger-resolve', 300, 80.000000, b'1', 'qwen-turbo', 'ACTIVE', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id),
(@project_id, 'USER', NULL, 'xicheng-rag-chat', 20, 30.000000, b'1', 'qwen-turbo', 'ACTIVE', 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id);

INSERT INTO `xunjing_public_report`
(`project_id`, `school_id`, `title`, `report_period`, `metrics_json`, `status`, `generated_at`, `creator`, `create_time`, `updater`, `update_time`, `deleted`, `tenant_id`)
VALUES
(@project_id, @school_id, '西城 P0 后台本地候选状态', '2026-P0-LOCAL-CANDIDATE',
 '{"p0Ready":false,"p0LocalCandidate":true,"productionReady":false,"regionCode":"beijing-xicheng","packageCode":"XICHENG-MAP-001","poiSeedCount":24,"targetP0PoiCount":80,"knowledgeDocumentCount":3,"aiEvalCaseCount":5,"quotaRuleCount":4,"remainingBlockers":["真实微信 AppID","HTTPS 后端域名","OCR/视觉识别服务","上传凭证/对象存储","真实 AI Key","80 个以上已复核 POI 和来源授权"]}',
 'GENERATED', NOW(), 'admin', NOW(), 'admin', NOW(), b'0', @tenant_id);

SET FOREIGN_KEY_CHECKS = 1;
