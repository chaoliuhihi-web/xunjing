import {
	buildYudaoAppApiUrl,
	getXunjingUserTraceId,
	getYudaoCommonResultPayload
} from '@/request/xunjingMultimodal.js'
import { normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'
import { normalizeXichengReviewedSources } from '@/request/xunjing/sources.js'
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'

export const XICHENG_AI_CHAT_API_PATH = 'app-api/xunjing/ai/chat'
const XICHENG_BLOCKED_ANSWER = '无已审核来源，不能回答'

export const buildXichengAiChatPayload = ({ question = '', context = {} } = {}) => ({
	packageCode: context.packageCode || XICHENG_REGION_CONFIG.packageCode,
	regionCode: context.regionCode || XICHENG_REGION_CONFIG.regionCode,
	question,
	sceneCode: context.sceneCode || XICHENG_REGION_CONFIG.aiSceneCode,
	sourceChannel: context.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
	userTraceId: getXunjingUserTraceId(),
	poiCode: context.poiCode || '',
	poiName: context.poiName || '',
	companionName: context.companionName || XICHENG_REGION_CONFIG.companionName,
	recognitionConfidence: context.confidence || null,
	safetyStatus: normalizeXichengSafetyStatus(context.safetyStatus)
})

export const normalizeXichengAiChatResponse = (payload = {}) => {
	const suggestedQuestions = Array.isArray(payload.suggestedQuestions)
		? payload.suggestedQuestions
		: Array.isArray(payload.recommendedQuestions)
			? payload.recommendedQuestions
			: []
	const safetyStatus = normalizeXichengSafetyStatus(payload.safetyStatus)
	const safeSuggestedQuestions = safetyStatus === 'BLOCKED' ? [] : suggestedQuestions
	return {
		answer: safetyStatus === 'BLOCKED' ? XICHENG_BLOCKED_ANSWER : payload.answer ? String(payload.answer) : '',
		suggestedQuestions: safeSuggestedQuestions,
		followUps: safeSuggestedQuestions,
		sources: safetyStatus === 'BLOCKED' ? [] : normalizeXichengReviewedSources(payload.sources),
		safetyStatus,
		logId: payload.logId || ''
	}
}

export const requestXichengAiChat = ({ question = '', context = {} } = {}) => {
	return new Promise((resolve, reject) => {
		uni.request({
			url: buildYudaoAppApiUrl(XICHENG_AI_CHAT_API_PATH),
			method: 'POST',
			timeout: 60000,
			header: {
				'Content-Type': 'application/json',
				'tenant-id': XICHENG_REGION_CONFIG.tenantId
			},
			data: buildXichengAiChatPayload({ question, context }),
			success: (res) => {
				if (res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
					reject(new Error(`西城小京接口异常:${res.statusCode}`))
					return
				}
				try {
					resolve(normalizeXichengAiChatResponse(getYudaoCommonResultPayload(res)))
				} catch (error) {
					reject(error)
				}
			},
			fail: reject
		})
	})
}
