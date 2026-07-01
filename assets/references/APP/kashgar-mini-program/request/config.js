// 配置服务器相关信息
//生产
// export default {

// }
//测试
const runtimeEnv = import.meta.env || {}
const buildTimeYudaoAppBaseUrl = typeof __XUNJING_BUILD_YUDAO_APP_BASE_URL__ !== 'undefined' ? __XUNJING_BUILD_YUDAO_APP_BASE_URL__ : ''
const buildTimeTenantId = typeof __XUNJING_BUILD_TENANT_ID__ !== 'undefined' ? __XUNJING_BUILD_TENANT_ID__ : ''
const normalizeApiBaseUrl = (value) => {
	const base = String(value || '').replace(/\/+$/, '')
	return `${base}/`
}

export default {
	UrlImg:"https://kashi.weiapp.net",
	UrlServer:"https://kashi.weiapp.net",
	UrlRequest:"https://kashi.weiapp.net/",
	UrlRequest2:"https://kashi.weiapp.net/",
	UrlYudaoAppRequest: normalizeApiBaseUrl(buildTimeYudaoAppBaseUrl || runtimeEnv.VITE_XUNJING_YUDAO_APP_BASE_URL || "https://kashi.weiapp.net/"),
	XunjingTenantId: String(buildTimeTenantId || runtimeEnv.VITE_XUNJING_TENANT_ID || "1"),
}
