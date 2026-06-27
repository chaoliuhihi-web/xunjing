import {
	buildYudaoAppApiUrl,
	getXunjingUserTraceId,
	getYudaoCommonResultPayload
} from '@/request/xunjingMultimodal.js'
import {
	XICHENG_CITY_OPS_REPORT,
	XICHENG_REGION_CONFIG,
	XICHENG_TRAVELOGUE_TEMPLATE
} from '@/config/regions/xicheng.js'

export const XICHENG_TRAVELOGUE_GENERATE_API_PATH = 'app-api/xunjing/travelogues/generate'
export const XICHENG_POSTER_GENERATE_API_PATH = 'app-api/xunjing/posters/generate'
export const XICHENG_MEMORIAL_PDF_API_PATH = 'app-api/xunjing/memorials/pdf'
export const XICHENG_WORK_REVIEW_API_PATH = 'app-api/xunjing/works/{workId}/submit-review'

const requestXichengTravelogue = ({ apiPath, data = {} }) => new Promise((resolve, reject) => {
	uni.request({
		url: buildYudaoAppApiUrl(apiPath),
		method: 'POST',
		timeout: 15000,
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
				reject(new Error(`西城游记接口异常:${res.statusCode}`))
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

const withDevelopmentFallback = (payload = {}) => ({
	developmentOnly: true,
	notForProduction: true,
	...payload
})

export const generateXichengTravelogueDraft = async ({ timeline = [], style = '城市漫步' } = {}) => {
	try {
		const result = await requestXichengTravelogue({
			apiPath: XICHENG_TRAVELOGUE_GENERATE_API_PATH,
			data: { timeline, style }
		})
		return result && result.draftId ? result : withDevelopmentFallback({ ...XICHENG_TRAVELOGUE_TEMPLATE, ...(result || {}), style })
	} catch (error) {
		return withDevelopmentFallback({
			...XICHENG_TRAVELOGUE_TEMPLATE,
			style,
			fallbackReason: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : ''
		})
	}
}

export const generateXichengSharePoster = async ({ draftId = XICHENG_TRAVELOGUE_TEMPLATE.draftId } = {}) => {
	try {
		const result = await requestXichengTravelogue({
			apiPath: XICHENG_POSTER_GENERATE_API_PATH,
			data: { draftId, hidePreciseLocation: true }
		})
		return result && result.posterId ? result : withDevelopmentFallback({
			posterId: `poster_${draftId}`,
			title: XICHENG_TRAVELOGUE_TEMPLATE.sharePoster.title,
			status: 'ready',
			hidePreciseLocation: true
		})
	} catch (error) {
		return withDevelopmentFallback({
			posterId: `poster_${draftId}`,
			title: XICHENG_TRAVELOGUE_TEMPLATE.sharePoster.title,
			status: 'ready',
			hidePreciseLocation: true,
			fallbackReason: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : ''
		})
	}
}

export const generateXichengMemorialPdf = async ({ draftId = XICHENG_TRAVELOGUE_TEMPLATE.draftId } = {}) => {
	try {
		const result = await requestXichengTravelogue({
			apiPath: XICHENG_MEMORIAL_PDF_API_PATH,
			data: { draftId, templateCode: 'xicheng-fixed-v1' }
		})
		return result && result.pdfId ? result : withDevelopmentFallback({
			pdfId: `pdf_${draftId}`,
			title: XICHENG_TRAVELOGUE_TEMPLATE.memorialPdf.title,
			status: 'ready'
		})
	} catch (error) {
		return withDevelopmentFallback({
			pdfId: `pdf_${draftId}`,
			title: XICHENG_TRAVELOGUE_TEMPLATE.memorialPdf.title,
			status: 'ready',
			fallbackReason: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : ''
		})
	}
}

export const submitXichengWorkReview = async ({ workId = XICHENG_TRAVELOGUE_TEMPLATE.draftId, workType = 'travelogue' } = {}) => {
	try {
		const apiPath = XICHENG_WORK_REVIEW_API_PATH.replace('{workId}', encodeURIComponent(workId))
		const result = await requestXichengTravelogue({
			apiPath,
			data: { workId, workType }
		})
		return result && result.reviewStatus ? result : withDevelopmentFallback({ workId, workType, reviewStatus: 'pending' })
	} catch (error) {
		return withDevelopmentFallback({
			workId,
			workType,
			reviewStatus: 'pending',
			fallbackReason: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : ''
		})
	}
}

export const getXichengCityOpsReportPreview = () => XICHENG_CITY_OPS_REPORT
