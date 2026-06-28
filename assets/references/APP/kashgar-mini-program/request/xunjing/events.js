import {
	buildYudaoAppApiUrl,
	getXunjingUserTraceId,
	getYudaoCommonResultPayload
} from '@/request/xunjingMultimodal.js'
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'

export const XICHENG_RESOURCE_EVENT_API_PATH = 'app-api/xunjing/resource/events'

export const buildXichengRecognitionFeedbackEventPayload = (feedback = {}) => ({
	packageCode: feedback.packageCode || XICHENG_REGION_CONFIG.packageCode,
	sceneCode: feedback.sceneCode || XICHENG_REGION_CONFIG.sceneCode,
	eventType: 'ERROR_FEEDBACK',
	sourceChannel: feedback.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
	userTraceId: getXunjingUserTraceId(),
	payloadJson: JSON.stringify({
		category: feedback.misTrigger ? 'recognition_wrong' : 'recognition_confirmed',
		feedbackId: feedback.feedbackId || '',
		feedbackType: feedback.feedbackType || '',
		message: String(feedback.feedbackNote || '').slice(0, 240),
		poiCode: feedback.poiCode || '',
		poiName: feedback.poiName || '',
		confidence: feedback.confidence || 0,
		safetyStatus: feedback.safetyStatus || '',
		sourceLabel: feedback.sourceLabel || '',
		sourceCount: Array.isArray(feedback.sources) ? feedback.sources.length : 0,
		severity: feedback.misTrigger ? 'WARN' : 'INFO'
	})
})

export const submitXichengRecognitionFeedbackEvent = (feedback = {}) => {
	return new Promise((resolve, reject) => {
		uni.request({
			url: buildYudaoAppApiUrl(XICHENG_RESOURCE_EVENT_API_PATH),
			method: 'POST',
			timeout: 10000,
			header: {
				'Content-Type': 'application/json',
				'tenant-id': XICHENG_REGION_CONFIG.tenantId
			},
			data: buildXichengRecognitionFeedbackEventPayload(feedback),
			success: (res) => {
				if (res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
					reject(new Error(`西城反馈事件接口异常:${res.statusCode}`))
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
