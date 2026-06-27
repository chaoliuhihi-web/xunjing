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
import {
	XICHENG_REGION_CONFIG,
	XICHENG_DEVELOPMENT_TRIGGER_FIXTURE,
	XICHENG_RECOMMENDED_QUESTIONS
} from '@/config/regions/xicheng.js'

export const XICHENG_TRIGGER_API_PATH = 'app-api/xunjing/triggers/resolve'

export const normalizeXichengTriggerResult = (result = {}, source = '') => {
	const confidence = Number(result.confidence || 0)
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
		sourceLabel: result.sourceLabel || (source === 'photo' ? '拍照识别' : source === 'scan' ? '扫码识别' : 'OCR识别'),
		confidence,
		confidencePercent: Math.round(confidence * 100),
		requiresUserConfirm: result.requiresUserConfirm !== false,
		recommendedQuestions: Array.isArray(result.recommendedQuestions) && result.recommendedQuestions.length > 0
			? result.recommendedQuestions
			: XICHENG_RECOMMENDED_QUESTIONS
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
	allowDevelopmentFallback = true
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
	allowDevelopmentFallback = true
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

export { requestCurrentLocationForTrigger }
