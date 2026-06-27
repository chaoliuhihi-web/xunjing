import {
	buildYudaoAppApiUrl,
	getXunjingUserTraceId,
	getYudaoCommonResultPayload
} from '@/request/xunjingMultimodal.js'
import {
	XICHENG_DEFAULT_ROUTE,
	XICHENG_REGION_CONFIG
} from '@/config/regions/xicheng.js'

export const XICHENG_ROUTE_RECOMMEND_API_PATH = 'app-api/xunjing/routes/recommend'
export const XICHENG_ROUTE_PASSPORT_API_PATH = 'app-api/xunjing/routes/{routeId}/passport'
export const XICHENG_ROUTE_CHECKIN_API_PATH = 'app-api/xunjing/routes/{routeId}/checkins'

export const createXichengRouteDevelopmentFallback = (overrides = {}) => ({
	developmentOnly: true,
	notForProduction: true,
	...XICHENG_DEFAULT_ROUTE,
	...overrides,
	regionCode: XICHENG_REGION_CONFIG.regionCode,
	packageCode: XICHENG_REGION_CONFIG.packageCode
})

const requestXichengRoute = ({ apiPath, method = 'GET', data = {} }) => new Promise((resolve, reject) => {
	uni.request({
		url: buildYudaoAppApiUrl(apiPath),
		method,
		timeout: 10000,
		header: {
			'Content-Type': 'application/json',
			'tenant-id': XICHENG_REGION_CONFIG.tenantId
		},
		data: {
			regionCode: XICHENG_REGION_CONFIG.regionCode,
			packageCode: XICHENG_REGION_CONFIG.packageCode,
			sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
			userTraceId: getXunjingUserTraceId(),
			...data
		},
		success: (res) => {
			if (res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
				reject(new Error(`西城路线接口异常:${res.statusCode}`))
				return
			}
			try {
				resolve(getYudaoCommonResultPayload(res))
			} catch (error) {
				reject(error)
			}
		},
		fail: reject
	})
})

export const getXichengRouteRecommendation = async ({ poiCode = '', poiName = '' } = {}) => {
	try {
		const result = await requestXichengRoute({
			apiPath: XICHENG_ROUTE_RECOMMEND_API_PATH,
			method: 'POST',
			data: { poiCode, poiName }
		})
		return result && result.routeId ? result : createXichengRouteDevelopmentFallback(result || {})
	} catch (error) {
		return createXichengRouteDevelopmentFallback({
			startPoiCode: poiCode || XICHENG_DEFAULT_ROUTE.startPoiCode,
			fallbackReason: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : ''
		})
	}
}

export const getXichengRoutePassport = async ({ routeId = XICHENG_DEFAULT_ROUTE.routeId } = {}) => {
	try {
		const apiPath = XICHENG_ROUTE_PASSPORT_API_PATH.replace('{routeId}', encodeURIComponent(routeId))
		const result = await requestXichengRoute({
			apiPath,
			method: 'GET',
			data: { routeId }
		})
		return result && result.routeId ? result : createXichengRouteDevelopmentFallback(result || {})
	} catch (error) {
		return createXichengRouteDevelopmentFallback({
			routeId,
			fallbackReason: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : ''
		})
	}
}

export const submitXichengCheckin = async ({
	routeId = XICHENG_DEFAULT_ROUTE.routeId,
	poiCode = '',
	taskId = '',
	payload = {}
} = {}) => {
	try {
		const apiPath = XICHENG_ROUTE_CHECKIN_API_PATH.replace('{routeId}', encodeURIComponent(routeId))
		const result = await requestXichengRoute({
			apiPath,
			method: 'POST',
			data: { routeId, poiCode, taskId, payload }
		})
		return result && typeof result === 'object' ? result : { success: true, routeId, poiCode, taskId }
	} catch (error) {
		return {
			developmentOnly: true,
			notForProduction: true,
			success: true,
			routeId,
			poiCode,
			taskId,
			fallbackReason: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : ''
		}
	}
}
