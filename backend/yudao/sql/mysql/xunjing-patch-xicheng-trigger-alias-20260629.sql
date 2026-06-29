-- Xicheng P0 trigger alias hotfix.
-- Purpose: keep 烟袋斜街 as an independent POI trigger instead of a 什刹海 alias.
-- Safe to rerun. It only updates xicheng-shichahai when the stale alias is present.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET @tenant_id := COALESCE(@tenant_id, 1);

UPDATE xunjing_poi
SET aliases_json = JSON_ARRAY('什刹海', '后海', '前海', '西海'),
    updater = 'xicheng-trigger-alias-patch',
    update_time = NOW()
WHERE tenant_id = @tenant_id
  AND poi_code = 'xicheng-shichahai'
  AND region_code = 'beijing-xicheng'
  AND deleted = b'0'
  AND JSON_CONTAINS(aliases_json, JSON_QUOTE('烟袋斜街'));

SELECT 'changedRows' AS metric, ROW_COUNT() AS value;

SELECT 'shichahaiHasYandaiAlias' AS metric, COUNT(*) AS value
FROM xunjing_poi
WHERE tenant_id = @tenant_id
  AND poi_code = 'xicheng-shichahai'
  AND region_code = 'beijing-xicheng'
  AND deleted = b'0'
  AND JSON_CONTAINS(aliases_json, JSON_QUOTE('烟袋斜街'))
UNION ALL
SELECT 'yandaiHasAlias' AS metric, COUNT(*) AS value
FROM xunjing_poi
WHERE tenant_id = @tenant_id
  AND poi_code = 'xicheng-yandai-xiejie'
  AND region_code = 'beijing-xicheng'
  AND deleted = b'0'
  AND JSON_CONTAINS(aliases_json, JSON_QUOTE('烟袋斜街'))
UNION ALL
SELECT 'yandaiHasTriggerKeyword' AS metric, COUNT(*) AS value
FROM xunjing_poi
WHERE tenant_id = @tenant_id
  AND poi_code = 'xicheng-yandai-xiejie'
  AND region_code = 'beijing-xicheng'
  AND deleted = b'0'
  AND JSON_CONTAINS(JSON_EXTRACT(trigger_json, '$.ocrKeywords'), JSON_QUOTE('烟袋斜街'));
