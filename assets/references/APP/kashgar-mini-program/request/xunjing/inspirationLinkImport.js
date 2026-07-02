import {
	buildYudaoAppApiUrl,
	getXunjingUserTraceId,
	getYudaoCommonResultPayload
} from '@/request/xunjingMultimodal.js'
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import {
	detectXichengInspirationSourcePlatforms,
	extractXichengPrimaryInspirationLink,
	isXichengLinkOnlyInspirationInput
} from '@/request/xunjing/inspirationImport.js'
import { normalizeXichengReviewedSources } from '@/request/xunjing/sources.js'

export const XICHENG_INSPIRATION_LINK_IMPORT_API_PATH = 'app-api/xunjing/inspirations/import-link'
export { extractXichengPrimaryInspirationLink, isXichengLinkOnlyInspirationInput }

const normalizeText = (value = '') => String(value || '').replace(/\s+/g, ' ').trim()
const safeArray = value => Array.isArray(value) ? value : []

export const normalizeXichengInspirationLinkImportResult = (payload = {}, fallbackLinkUrl = '') => {
	const sourceUrl = payload.sourceUrl || payload.linkUrl || payload.url || fallbackLinkUrl
	const extractedText = normalizeText(payload.extractedText || payload.contentText || payload.text || payload.summaryText || '')
	const sourcePlatforms = safeArray(payload.sourcePlatforms).length > 0
		? payload.sourcePlatforms
		: detectXichengInspirationSourcePlatforms({ rawText: `${sourceUrl} ${payload.sourceTitle || payload.title || ''}` })
	return {
		importMode: 'link',
		linkImported: true,
		linkUrl: sourceUrl,
		sourceUrl,
		sourceTitle: payload.sourceTitle || payload.title || '',
		sourcePlatform: payload.sourcePlatform || (sourcePlatforms[0] && sourcePlatforms[0].sourceKey) || '',
		sourcePlatforms,
		extractedText,
		rawTextExcerpt: extractedText.slice(0, 80),
		rawTextLength: extractedText.length,
		sources: normalizeXichengReviewedSources(payload.sources),
		safetyStatus: payload.safetyStatus || (extractedText ? 'PASSED' : 'BLOCKED'),
		sourcePolicy: payload.sourcePolicy || '不保存第三方平台原文；不抓取未授权内容',
		fetchedAt: payload.fetchedAt || new Date().toISOString()
	}
}

export const requestXichengInspirationLinkImport = ({
	linkUrl = '',
	target = ''
} = {}) => {
	const normalizedLinkUrl = extractXichengPrimaryInspirationLink(linkUrl) || normalizeText(linkUrl)
	return new Promise((resolve, reject) => {
		uni.request({
			url: buildYudaoAppApiUrl(XICHENG_INSPIRATION_LINK_IMPORT_API_PATH),
			method: 'POST',
			timeout: 15000,
			header: {
				'Content-Type': 'application/json',
				'tenant-id': XICHENG_REGION_CONFIG.tenantId
			},
			data: {
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: 'xicheng-inspiration-import',
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				userTraceId: getXunjingUserTraceId(),
				linkUrl: normalizedLinkUrl,
				target,
				sourcePlatforms: detectXichengInspirationSourcePlatforms({ rawText: normalizedLinkUrl }),
				outputMode: 'plain_text_and_place_candidates',
				sourcePolicy: '仅解析用户提交链接；不保存第三方平台原文；不抓取未授权内容'
			},
			success: (res) => {
				if (res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
					const error = new Error(`攻略链接解析接口异常:${res.statusCode}`)
					error.yudaoHttpStatusCode = Number(res.statusCode)
					reject(error)
					return
				}
				try {
					const payload = getYudaoCommonResultPayload(res)
					resolve(normalizeXichengInspirationLinkImportResult(payload, normalizedLinkUrl))
				} catch (error) {
					reject(error)
				}
			},
			fail: reject
		})
	})
}
