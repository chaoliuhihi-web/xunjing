import {
	buildYudaoAppApiUrl,
	getXunjingUserTraceId,
	getYudaoCommonResultPayload
} from '@/request/xunjingMultimodal.js'
import {
	XICHENG_DEFAULT_ROUTE,
	XICHENG_MATERIAL_TIMELINE,
	XICHENG_REGION_CONFIG
} from '@/config/regions/xicheng.js'

export const XICHENG_TRACK_SESSION_API_PATH = 'app-api/xunjing/tracks/sessions'
export const XICHENG_TRACK_POINTS_API_PATH = 'app-api/xunjing/tracks/{trackSessionId}/points/batch'
export const XICHENG_ACTIVE_TRACK_STORAGE_KEY = 'xicheng:activeTrackSession'
export const XICHENG_MATERIAL_TIMELINE_STORAGE_KEY = 'xicheng:materialTimeline'

const nowIso = () => new Date().toISOString()

const getStoredTimeline = () => {
	const stored = uni.getStorageSync(XICHENG_MATERIAL_TIMELINE_STORAGE_KEY)
	return Array.isArray(stored) && stored.length > 0 ? stored : [...XICHENG_MATERIAL_TIMELINE]
}

const saveStoredTimeline = (timeline = []) => {
	uni.setStorageSync(XICHENG_MATERIAL_TIMELINE_STORAGE_KEY, timeline)
	return timeline
}

const requestXichengTrack = ({ apiPath, method = 'POST', data = {} }) => new Promise((resolve, reject) => {
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
				reject(new Error(`西城轨迹接口异常:${res.statusCode}`))
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

export const startXichengTrackSession = async ({ routeId = XICHENG_DEFAULT_ROUTE.routeId, startPoiCode = XICHENG_DEFAULT_ROUTE.startPoiCode } = {}) => {
	const localSession = {
		trackSessionId: `xicheng_track_${Date.now()}`,
		routeId,
		startPoiCode,
		status: 'recording',
		startedAt: nowIso(),
		pausedAt: '',
		endedAt: ''
	}
	try {
		const result = await requestXichengTrack({
			apiPath: XICHENG_TRACK_SESSION_API_PATH,
			data: localSession
		})
		const session = { ...localSession, ...(result || {}) }
		uni.setStorageSync(XICHENG_ACTIVE_TRACK_STORAGE_KEY, session)
		return session
	} catch (error) {
		const session = {
			...localSession,
			developmentOnly: true,
			notForProduction: true,
			fallbackReason: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : ''
		}
		uni.setStorageSync(XICHENG_ACTIVE_TRACK_STORAGE_KEY, session)
		return session
	}
}

export const pauseXichengTrackSession = () => {
	const session = uni.getStorageSync(XICHENG_ACTIVE_TRACK_STORAGE_KEY) || {}
	const next = { ...session, status: 'paused', pausedAt: nowIso() }
	uni.setStorageSync(XICHENG_ACTIVE_TRACK_STORAGE_KEY, next)
	return next
}

export const resumeXichengTrackSession = () => {
	const session = uni.getStorageSync(XICHENG_ACTIVE_TRACK_STORAGE_KEY) || {}
	const next = { ...session, status: 'recording', pausedAt: '' }
	uni.setStorageSync(XICHENG_ACTIVE_TRACK_STORAGE_KEY, next)
	return next
}

export const endXichengTrackSession = () => {
	const session = uni.getStorageSync(XICHENG_ACTIVE_TRACK_STORAGE_KEY) || {}
	const next = { ...session, status: 'ended', endedAt: nowIso() }
	uni.setStorageSync(XICHENG_ACTIVE_TRACK_STORAGE_KEY, next)
	return next
}

export const batchUploadXichengTrackPoints = async ({ trackSessionId = '', points = [] } = {}) => {
	const apiPath = XICHENG_TRACK_POINTS_API_PATH.replace('{trackSessionId}', encodeURIComponent(trackSessionId))
	return requestXichengTrack({
		apiPath,
		data: { trackSessionId, points }
	})
}

export const appendXichengMaterialEvent = (event = {}) => {
	const timeline = getStoredTimeline()
	const nextEvent = {
		eventId: event.eventId || `material_${Date.now()}`,
		eventType: event.eventType || 'remark',
		title: event.title || '用户备注',
		poiCode: event.poiCode || '',
		poiName: event.poiName || '',
		recordedAt: event.recordedAt || nowIso(),
		summary: event.summary || ''
	}
	const next = [nextEvent, ...timeline]
	saveStoredTimeline(next)
	return nextEvent
}

export const getXichengMaterialTimeline = () => getStoredTimeline()
