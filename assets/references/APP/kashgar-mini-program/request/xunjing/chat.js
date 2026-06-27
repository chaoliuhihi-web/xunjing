import {
	buildYudaoAppApiUrl,
	getXunjingUserTraceId,
	getYudaoCommonResultPayload
} from '@/request/xunjingMultimodal.js'
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'

export const XICHENG_AI_CHAT_API_PATH = 'app-api/xunjing/ai/chat'

export const buildXichengAiChatPayload = ({ question = '', context = {} } = {}) => ({
	packageCode: context.packageCode || XICHENG_REGION_CONFIG.packageCode,
	regionCode: context.regionCode || XICHENG_REGION_CONFIG.regionCode,
	question,
	sceneCode: context.sceneCode || XICHENG_REGION_CONFIG.aiSceneCode,
	sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
	userTraceId: getXunjingUserTraceId(),
	poiCode: context.poiCode || '',
	poiName: context.poiName || '',
	companionName: context.companionName || XICHENG_REGION_CONFIG.companionName,
	recognitionConfidence: context.confidence || null
})

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
					resolve(getYudaoCommonResultPayload(res))
				} catch (error) {
					reject(error)
				}
			},
			fail: reject
		})
	})
}
