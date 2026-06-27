/*
 Minimal Yudao runtime baseline for Xinghe Xunjing local-candidate App API checks.
 This file is not a replacement for the complete upstream Yudao baseline.

 It only creates the framework tables required for local App API readiness when
 sql/mysql/ruoyi-vue-pro.sql is not available in this repository:
 - system_tenant: validates tenant-id=1 in TenantSecurityWebFilter.
 - infra_api_access_log: stores App API access logs.
 - infra_api_error_log: stores App API error logs.

 Preproduction and production environments must import the complete Yudao
 baseline before applying the Xinghe Xunjing module schema and seed data.
*/

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `system_tenant` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '租户编号',
  `name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '租户名',
  `contact_user_id` bigint DEFAULT NULL COMMENT '联系人用户编号',
  `contact_name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系人',
  `contact_mobile` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系手机',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '状态',
  `websites` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '绑定域名或 AppID，逗号分隔',
  `package_id` bigint NOT NULL DEFAULT 0 COMMENT '租户套餐编号',
  `expire_time` datetime NOT NULL COMMENT '过期时间',
  `account_count` int NOT NULL DEFAULT 20 COMMENT '账号数量',
  `creator` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updater` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_system_tenant_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统租户';

CREATE TABLE IF NOT EXISTS `infra_api_access_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '编号',
  `trace_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '链路追踪编号',
  `user_id` bigint DEFAULT NULL COMMENT '用户编号',
  `user_type` tinyint DEFAULT NULL COMMENT '用户类型',
  `application_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '应用名',
  `request_method` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '请求方法名',
  `request_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '访问地址',
  `request_params` text COLLATE utf8mb4_unicode_ci COMMENT '请求参数',
  `response_body` text COLLATE utf8mb4_unicode_ci COMMENT '响应结果',
  `user_ip` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户 IP',
  `user_agent` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '浏览器 UA',
  `operate_module` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作模块',
  `operate_name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作名',
  `operate_type` tinyint DEFAULT NULL COMMENT '操作分类',
  `begin_time` datetime NOT NULL COMMENT '开始请求时间',
  `end_time` datetime NOT NULL COMMENT '结束请求时间',
  `duration` int NOT NULL COMMENT '执行时长',
  `result_code` int NOT NULL DEFAULT 0 COMMENT '结果码',
  `result_msg` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '结果提示',
  `creator` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updater` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  `tenant_id` bigint NOT NULL DEFAULT 0 COMMENT '租户编号',
  PRIMARY KEY (`id`),
  KEY `idx_infra_api_access_log_create_time` (`create_time`),
  KEY `idx_infra_api_access_log_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API 访问日志';

CREATE TABLE IF NOT EXISTS `infra_api_error_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '编号',
  `user_id` bigint DEFAULT NULL COMMENT '用户编号',
  `trace_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '链路追踪编号',
  `user_type` tinyint DEFAULT NULL COMMENT '用户类型',
  `application_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '应用名',
  `request_method` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '请求方法名',
  `request_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '访问地址',
  `request_params` text COLLATE utf8mb4_unicode_ci COMMENT '请求参数',
  `user_ip` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户 IP',
  `user_agent` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '浏览器 UA',
  `exception_time` datetime NOT NULL COMMENT '异常发生时间',
  `exception_name` varchar(256) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '异常名',
  `exception_message` text COLLATE utf8mb4_unicode_ci COMMENT '异常消息',
  `exception_root_cause_message` text COLLATE utf8mb4_unicode_ci COMMENT '异常根消息',
  `exception_stack_trace` mediumtext COLLATE utf8mb4_unicode_ci COMMENT '异常栈',
  `exception_class_name` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '异常类名',
  `exception_file_name` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '异常文件名',
  `exception_method_name` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '异常方法名',
  `exception_line_number` int DEFAULT NULL COMMENT '异常行号',
  `process_status` tinyint NOT NULL DEFAULT 0 COMMENT '处理状态',
  `process_time` datetime DEFAULT NULL COMMENT '处理时间',
  `process_user_id` bigint DEFAULT NULL COMMENT '处理用户编号',
  `creator` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updater` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  `tenant_id` bigint NOT NULL DEFAULT 0 COMMENT '租户编号',
  PRIMARY KEY (`id`),
  KEY `idx_infra_api_error_log_create_time` (`create_time`),
  KEY `idx_infra_api_error_log_process_status` (`process_status`),
  KEY `idx_infra_api_error_log_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API 错误日志';

INSERT INTO `system_tenant` (
  `id`, `name`, `contact_user_id`, `contact_name`, `contact_mobile`, `status`,
  `websites`, `package_id`, `expire_time`, `account_count`,
  `creator`, `create_time`, `updater`, `update_time`, `deleted`
) VALUES (
  1, '星河寻境本地联调租户', NULL, '星河寻境', NULL, 0,
  '127.0.0.1,localhost', 0, '2099-12-31 23:59:59', 20,
  'system', NOW(), 'system', NOW(), b'0'
) ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `status` = VALUES(`status`),
  `websites` = VALUES(`websites`),
  `package_id` = VALUES(`package_id`),
  `expire_time` = VALUES(`expire_time`),
  `account_count` = VALUES(`account_count`),
  `updater` = VALUES(`updater`),
  `update_time` = VALUES(`update_time`),
  `deleted` = VALUES(`deleted`);
