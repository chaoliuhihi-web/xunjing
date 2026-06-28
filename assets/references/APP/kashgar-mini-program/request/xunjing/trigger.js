import {
	buildPhotoMetaForTrigger,
	buildYudaoAppApiUrl,
	getXunjingUserTraceId,
	getYudaoCommonResultPayload,
	inferImageLabelsFromLocalHints,
	normalizeLocationForTrigger,
	readLocalImageBase64ForTrigger,
	requestCurrentLocationForTrigger,
	requestImageInfoForTrigger
} from '@/request/xunjingMultimodal.js'
import { normalizeXichengReviewedSources } from '@/request/xunjing/sources.js'
import {
	XICHENG_REGION_CONFIG,
	XICHENG_DEVELOPMENT_TRIGGER_FIXTURE,
	XICHENG_SUGGESTED_QUESTIONS
} from '@/config/regions/xicheng.js'

export const XICHENG_TRIGGER_API_PATH = 'app-api/xunjing/triggers/resolve'

export const XICHENG_SOURCE_LABELS = Object.freeze({
	photo: '拍照识别',
	scan: '扫码识别',
	ocr: 'OCR识别',
	gps: 'GPS定位',
	text: '文本识别'
})

export const resolveXichengSourceLabel = (source = '') => XICHENG_SOURCE_LABELS[source] || 'OCR识别'

export const isXichengDevelopmentFallbackAllowed = () => {
	const runtimeEnv = import.meta && import.meta.env ? import.meta.env : {}
	const nodeEnv = typeof process !== 'undefined' && process.env ? process.env.NODE_ENV : ''
	if (runtimeEnv.PROD === true || runtimeEnv.MODE === 'production' || nodeEnv === 'production') {
		return false
	}
	const explicitFixtureFlag = runtimeEnv.VITE_XICHENG_ALLOW_DEVELOPMENT_FIXTURE === 'true'
	const knownDevelopmentRuntime = runtimeEnv.DEV === true
		|| runtimeEnv.MODE === 'development'
		|| nodeEnv === 'development'
	return explicitFixtureFlag || knownDevelopmentRuntime
}

const normalizeSuggestedQuestions = (result = {}) => {
	if (Array.isArray(result.suggestedQuestions) && result.suggestedQuestions.length > 0) {
		return result.suggestedQuestions
	}
	if (Array.isArray(result.recommendedQuestions) && result.recommendedQuestions.length > 0) {
		return result.recommendedQuestions
	}
	return XICHENG_SUGGESTED_QUESTIONS
}

const normalizeConfidence = (result = {}) => {
	const hasConfidence = result.confidence !== undefined && result.confidence !== null && result.confidence !== ''
	const rawConfidence = hasConfidence
		? Number(result.confidence)
		: Number(result.confidencePercent || 0) / 100
	if (!Number.isFinite(rawConfidence)) {
		return 0
	}
	return rawConfidence > 1 ? rawConfidence / 100 : rawConfidence
}

export const normalizeXichengTriggerResult = (result = {}, source = '') => {
	const confidence = normalizeConfidence(result)
	const suggestedQuestions = normalizeSuggestedQuestions(result)
	const sources = normalizeXichengReviewedSources(result.sources)
	return {
		...result,
		regionCode: result.regionCode || XICHENG_REGION_CONFIG.regionCode,
		packageCode: result.packageCode || XICHENG_REGION_CONFIG.packageCode,
		sceneCode: result.sceneCode || XICHENG_REGION_CONFIG.sceneCode,
		poiCode: result.poiCode || '',
		poiName: result.poiName || '西城文化点',
		intent: result.intent || 'guide',
		action: result.action || 'open_ai_guide',
		triggerType: result.triggerType || source || 'unknown',
		source,
		sourceLabel: result.sourceLabel || resolveXichengSourceLabel(source),
		confidence,
		confidencePercent: result.confidencePercent !== undefined && result.confidencePercent !== null && result.confidencePercent !== ''
			? Math.round(Number(result.confidencePercent))
			: Math.round(confidence * 100),
		requiresUserConfirm: result.requiresUserConfirm !== false,
		suggestedQuestions,
		recommendedQuestions: suggestedQuestions,
		routeRecommendation: result.routeRecommendation || result.recommendedRoute || null,
		recommendedRoute: result.routeRecommendation || result.recommendedRoute || null,
		sources,
		safetyStatus: result.safetyStatus || ''
	}
}

export const createXichengDevelopmentTriggerFallback = ({
	text = '',
	ocrText = '',
	source = 'development',
	errorMessage = ''
} = {}) => normalizeXichengTriggerResult({
	...XICHENG_DEVELOPMENT_TRIGGER_FIXTURE,
	matchedText: text || ocrText,
	fallbackReason: errorMessage,
	sourceLabel: `${XICHENG_DEVELOPMENT_TRIGGER_FIXTURE.sourceLabel} / ${source}`
}, source)

export const requestXichengTriggerResolve = ({
	text = '',
	ocrText = '',
	location = null,
	photoMeta = null,
	imageLabels = [],
	recentPoiCodes = []
} = {}) => {
	const normalizedLocation = normalizeLocationForTrigger(location)
	return new Promise((resolve, reject) => {
		uni.request({
			url: buildYudaoAppApiUrl(XICHENG_TRIGGER_API_PATH),
			method: 'POST',
			timeout: 10000,
			header: {
				'Content-Type': 'application/json',
				'tenant-id': XICHENG_REGION_CONFIG.tenantId
			},
			data: {
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				userTraceId: getXunjingUserTraceId(),
				text,
				ocrText,
				location: normalizedLocation,
				photoMeta,
				imageLabels,
				recentPoiCodes
			},
			success: (res) => {
				if (res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
					reject(new Error(`西城触发识别接口异常:${res.statusCode}`))
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
}

export const resolveXichengTextTrigger = async ({
	text = '',
	ocrText = '',
	location = null,
	recentPoiCodes = [],
	source = 'ocr',
	allowDevelopmentFallback = isXichengDevelopmentFallbackAllowed()
} = {}) => {
	try {
		const result = await requestXichengTriggerResolve({
			text,
			ocrText: ocrText || text,
			location,
			recentPoiCodes,
			imageLabels: inferImageLabelsFromLocalHints({ text, ocrText })
		})
		return normalizeXichengTriggerResult(result, source)
	} catch (error) {
		if (!allowDevelopmentFallback) {
			throw error
		}
		return createXichengDevelopmentTriggerFallback({
			text,
			ocrText,
			source,
			errorMessage: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : ''
		})
	}
}

export const resolveXichengPhotoTrigger = async ({
	filePath = '',
	text = '',
	ocrText = '',
	imageLabels = [],
	allowDevelopmentFallback = isXichengDevelopmentFallbackAllowed()
} = {}) => {
	const [location, imageInfo, imageBase64] = await Promise.all([
		requestCurrentLocationForTrigger(),
		requestImageInfoForTrigger(filePath),
		readLocalImageBase64ForTrigger(filePath)
	])
	const labels = imageLabels.length > 0
		? imageLabels
		: inferImageLabelsFromLocalHints({ filePath, text, ocrText })
	try {
		const result = await requestXichengTriggerResolve({
			text,
			ocrText,
			location,
			photoMeta: buildPhotoMetaForTrigger({ filePath, location, imageInfo, imageBase64 }),
			imageLabels: labels
		})
		return normalizeXichengTriggerResult(result, 'photo')
	} catch (error) {
		if (!allowDevelopmentFallback) {
			throw error
		}
		return createXichengDevelopmentTriggerFallback({
			text,
			ocrText,
			source: 'photo',
			errorMessage: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : ''
		})
	}
}

export const resolveXichengOcrImageTrigger = async ({
	filePath = '',
	text = '',
	ocrText = '',
	imageLabels = [],
	allowDevelopmentFallback = isXichengDevelopmentFallbackAllowed()
} = {}) => {
	try {
		const [location, imageInfo, imageBase64] = await Promise.all([
			requestCurrentLocationForTrigger(),
			requestImageInfoForTrigger(filePath),
			readLocalImageBase64ForTrigger(filePath)
		])
		const labels = imageLabels.length > 0
			? imageLabels
			: inferImageLabelsFromLocalHints({ filePath, text, ocrText })
		const result = await requestXichengTriggerResolve({
			text: text || ocrText,
			ocrText,
			location,
			photoMeta: buildPhotoMetaForTrigger({ filePath, location, imageInfo, imageBase64 }),
			imageLabels: labels
		})
		return normalizeXichengTriggerResult(result, 'ocr')
	} catch (error) {
		if (!allowDevelopmentFallback) {
			throw error
		}
		return createXichengDevelopmentTriggerFallback({
			text,
			ocrText,
			source: 'ocr',
			errorMessage: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : ''
		})
	}
}

export { requestCurrentLocationForTrigger }
