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
import { isXichengUnsafeSafetyStatus, normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'
import { normalizeXichengReviewedSources } from '@/request/xunjing/sources.js'
import {
	XICHENG_REGION_CONFIG,
	XICHENG_DEVELOPMENT_TRIGGER_FIXTURE,
	createXichengPoiSuggestedQuestions
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

export const isXichengDevelopmentRecognitionCacheBlocked = (recognition = {}) => {
	const developmentRecognition = Boolean(
		recognition && (
			recognition.developmentOnly || recognition.notForProduction || recognition.triggerType === 'development-fixture'
		)
	)
	return developmentRecognition && !isXichengDevelopmentFallbackAllowed()
}

export const shouldUseXichengDevelopmentFallback = (error = null) => {
	if (!error) return true
	if (error.yudaoCommonResultCode !== undefined || error.yudaoHttpStatusCode !== undefined) {
		return false
	}
	return true
}

const normalizeSuggestedQuestions = (result = {}) => {
	const safetyStatus = normalizeXichengSafetyStatus(result.safetyStatus)
	if (isXichengUnsafeSafetyStatus(safetyStatus)) {
		return []
	}
	if (Array.isArray(result.suggestedQuestions) && result.suggestedQuestions.length > 0) {
		return result.suggestedQuestions
	}
	if (Array.isArray(result.recommendedQuestions) && result.recommendedQuestions.length > 0) {
		return result.recommendedQuestions
	}
	return createXichengPoiSuggestedQuestions(result.poiName)
}

const normalizeReviewedSources = (result = {}) => {
	const safetyStatus = normalizeXichengSafetyStatus(result.safetyStatus)
	if (isXichengUnsafeSafetyStatus(safetyStatus)) {
		return []
	}
	return normalizeXichengReviewedSources(result.sources)
}

const normalizeRecommendedRoute = (result = {}) => {
	const safetyStatus = normalizeXichengSafetyStatus(result.safetyStatus)
	if (isXichengUnsafeSafetyStatus(safetyStatus)) {
		return null
	}
	return result.routeRecommendation || result.recommendedRoute || null
}

const normalizeSourceBackedSafetyStatus = (safetyStatus = '', sources = []) => {
	const normalizedSafetyStatus = normalizeXichengSafetyStatus(safetyStatus)
	return !normalizedSafetyStatus && Array.isArray(sources) && sources.length > 0
		? 'PASSED'
		: normalizedSafetyStatus
}

const normalizeSceneSignalText = (value = '', limit = 120) => String(value || '').trim().slice(0, limit)

const normalizeSceneSignalCount = (value = 0) => {
	const count = Number(value || 0)
	return Number.isFinite(count) && count > 0 ? count : 0
}

const normalizeHeadingDegrees = (value = '') => {
	const degrees = Number(value)
	if (!Number.isFinite(degrees)) return null
	return Math.round(((degrees % 360) + 360) % 360)
}

export const createXichengTriggerSceneSignals = ({
	sceneSignals = null,
	visionAgentContext = null
} = {}) => {
	const signals = sceneSignals && typeof sceneSignals === 'object' ? sceneSignals : {}
	const context = visionAgentContext && typeof visionAgentContext === 'object' ? visionAgentContext : {}
	const pickSignalValue = (key = '') => {
		const signalValue = signals[key]
		return signalValue === undefined || signalValue === null || signalValue === ''
			? context[key]
			: signalValue
	}
	const normalizedSignals = {
		sceneFusionSummary: normalizeSceneSignalText(pickSignalValue('sceneFusionSummary')),
		worldInterfaceSummary: normalizeSceneSignalText(pickSignalValue('worldInterfaceSummary')),
		localTimeText: normalizeSceneSignalText(pickSignalValue('localTimeText'), 40),
		weatherText: normalizeSceneSignalText(pickSignalValue('weatherText'), 40),
		headingText: normalizeSceneSignalText(pickSignalValue('headingText'), 40),
		headingDegrees: normalizeHeadingDegrees(pickSignalValue('headingDegrees')),
		sceneDomainIntentKey: normalizeSceneSignalText(pickSignalValue('sceneDomainIntentKey'), 48),
		sceneDomainIntentLabel: normalizeSceneSignalText(pickSignalValue('sceneDomainIntentLabel'), 48),
		sceneDomainIntentTitle: normalizeSceneSignalText(pickSignalValue('sceneDomainIntentTitle'), 64),
		sceneDomainIntentCopy: normalizeSceneSignalText(pickSignalValue('sceneDomainIntentCopy')),
		agentDecisionActionTitle: normalizeSceneSignalText(pickSignalValue('agentDecisionActionTitle'), 64),
		agentDecisionReasonSummary: normalizeSceneSignalText(pickSignalValue('agentDecisionReasonSummary')),
		memorySessionSceneCount: normalizeSceneSignalCount(pickSignalValue('memorySessionSceneCount'))
	}
	const hasSignals = Object.values(normalizedSignals).some(value => value !== '' && value !== 0 && value !== null)
	return hasSignals ? normalizedSignals : null
}

const clampConfidence = (value) => Math.min(1, Math.max(0, value))

const clampConfidencePercent = (value) => Math.min(100, Math.max(0, value))

const normalizeConfidence = (result = {}) => {
	const hasConfidence = result.confidence !== undefined && result.confidence !== null && result.confidence !== ''
	const numericValue = hasConfidence
		? Number(result.confidence)
		: Number(result.confidencePercent)
	const rawConfidence = hasConfidence
		? numericValue
		: numericValue / 100
	if (!Number.isFinite(rawConfidence)) {
		return 0
	}
	return clampConfidence(hasConfidence && rawConfidence > 1 ? rawConfidence / 100 : rawConfidence)
}

const normalizeConfidencePercent = (result = {}, confidence = normalizeConfidence(result)) => {
	const explicitPercent = Number(result.confidencePercent)
	if (result.confidencePercent !== undefined && result.confidencePercent !== null && result.confidencePercent !== '' && Number.isFinite(explicitPercent)) {
		return clampConfidencePercent(Math.round(explicitPercent))
	}
	return clampConfidencePercent(Math.round(confidence * 100))
}

const normalizeXichengTriggerCandidate = (candidate = {}) => ({
	...candidate,
	poiCode: candidate.poiCode || '',
	poiName: candidate.poiName || '',
	confidence: normalizeConfidence(candidate),
	safetyStatus: normalizeSourceBackedSafetyStatus(candidate.safetyStatus, normalizeReviewedSources(candidate)),
	sources: normalizeReviewedSources(candidate),
	suggestedQuestions: normalizeSuggestedQuestions(candidate),
	recommendedQuestions: normalizeSuggestedQuestions(candidate),
	routeRecommendation: normalizeRecommendedRoute(candidate),
	recommendedRoute: normalizeRecommendedRoute(candidate)
})

const normalizeXichengTriggerCandidates = (candidates = []) => Array.isArray(candidates)
	? candidates.map(normalizeXichengTriggerCandidate)
	: []

export const normalizeXichengTriggerResult = (result = {}, source = '') => {
	const confidence = normalizeConfidence(result)
	const suggestedQuestions = normalizeSuggestedQuestions(result)
	const sources = normalizeReviewedSources(result)
	const safetyStatus = normalizeSourceBackedSafetyStatus(result.safetyStatus, sources)
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
		confidencePercent: normalizeConfidencePercent(result, confidence),
		requiresUserConfirm: result.requiresUserConfirm !== false,
		suggestedQuestions,
		recommendedQuestions: suggestedQuestions,
		routeRecommendation: normalizeRecommendedRoute(result),
		recommendedRoute: normalizeRecommendedRoute(result),
		sources,
		candidates: normalizeXichengTriggerCandidates(result.candidates),
		safetyStatus
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
	recentPoiCodes = [],
	sceneSignals = null,
	visionAgentContext = null
} = {}) => {
	const normalizedLocation = normalizeLocationForTrigger(location)
	const normalizedSceneSignals = createXichengTriggerSceneSignals({ sceneSignals, visionAgentContext })
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
				recentPoiCodes,
				sceneSignals: normalizedSceneSignals
			},
			success: (res) => {
				if (res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
					const error = new Error(`西城触发识别接口异常:${res.statusCode}`)
					error.yudaoHttpStatusCode = Number(res.statusCode)
					reject(error)
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
	sceneSignals = null,
	visionAgentContext = null,
	source = 'ocr',
	allowDevelopmentFallback = isXichengDevelopmentFallbackAllowed()
} = {}) => {
	try {
		const result = await requestXichengTriggerResolve({
			text,
			ocrText: ocrText || text,
			location,
			recentPoiCodes,
			sceneSignals,
			visionAgentContext,
			imageLabels: inferImageLabelsFromLocalHints({ text, ocrText })
		})
		return normalizeXichengTriggerResult(result, source)
	} catch (error) {
		if (!allowDevelopmentFallback || !shouldUseXichengDevelopmentFallback(error)) {
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
	sceneSignals = null,
	visionAgentContext = null,
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
			imageLabels: labels,
			sceneSignals,
			visionAgentContext
		})
		return normalizeXichengTriggerResult(result, 'photo')
	} catch (error) {
		if (!allowDevelopmentFallback || !shouldUseXichengDevelopmentFallback(error)) {
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
	sceneSignals = null,
	visionAgentContext = null,
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
			imageLabels: labels,
			sceneSignals,
			visionAgentContext
		})
		return normalizeXichengTriggerResult(result, 'ocr')
	} catch (error) {
		if (!allowDevelopmentFallback || !shouldUseXichengDevelopmentFallback(error)) {
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
