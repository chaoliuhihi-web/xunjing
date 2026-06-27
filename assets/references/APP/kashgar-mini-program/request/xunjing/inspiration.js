import {
	buildYudaoAppApiUrl,
	getXunjingUserTraceId,
	getYudaoCommonResultPayload
} from '@/request/xunjingMultimodal.js'
import {
	XICHENG_DEFAULT_ROUTE,
	XICHENG_INSPIRATION_IMPORT_CONFIG,
	XICHENG_OFFICIAL_POI_FIXTURES,
	XICHENG_REGION_CONFIG
} from '@/config/regions/xicheng.js'

export const XICHENG_INSPIRATION_IMPORT_API_PATH = 'app-api/xunjing/inspirations/import'
export const XICHENG_INSPIRATION_CONFIRM_POIS_API_PATH = 'app-api/xunjing/inspirations/{id}/confirm-pois'
export const XICHENG_INSPIRATION_ROUTE_GENERATE_API_PATH = 'app-api/xunjing/routes/generate'
export const XICHENG_GENERATED_ROUTE_STORAGE_KEY = 'xicheng:generatedWalkableRoute'

const sanitizeThirdPartyInput = (value = '') => String(value || '')
	.replace(/https?:\/\/\S+/g, '[link removed]')
	.trim()
	.slice(0, 800)

export const extractXichengPlaceHints = (text = '') => {
	const source = String(text || '')
	const hints = new Set()
	for (const poi of XICHENG_OFFICIAL_POI_FIXTURES) {
		for (const alias of poi.aliases || []) {
			if (alias && source.includes(alias)) {
				hints.add(alias)
			}
		}
	}
	if (/白塔|妙应寺/.test(source)) hints.add('白塔寺')
	if (/帝王庙/.test(source)) hints.add('历代帝王庙')
	if (/后海|前海|什刹海/.test(source)) hints.add('什刹海')
	if (/北海|琼华岛/.test(source)) hints.add('北海公园')
	return Array.from(hints)
}

export const matchXichengOfficialPois = (placeHints = []) => {
	const source = placeHints.join(' ')
	return XICHENG_OFFICIAL_POI_FIXTURES
		.map((poi) => {
			const matchedAlias = (poi.aliases || []).find(alias => source.includes(alias) || placeHints.includes(alias))
			if (!matchedAlias && !source.includes(poi.poiName)) return null
			return {
				poiCode: poi.poiCode,
				poiName: poi.poiName,
				category: poi.category,
				confidence: matchedAlias === poi.poiName ? 0.96 : 0.88,
				matchedAlias: matchedAlias || poi.poiName,
				officialPoiOnly: true,
				confirmed: false
			}
		})
		.filter(Boolean)
}

export const createXichengInspirationDevelopmentFallback = ({
	inputText = '',
	sourceType = '文字',
	imageMeta = null,
	errorMessage = ''
} = {}) => {
	const placeHints = extractXichengPlaceHints(inputText || '白塔寺 历代帝王庙 什刹海')
	const matchedPois = matchXichengOfficialPois(placeHints)
	return {
		developmentOnly: true,
		notForProduction: true,
		doNotStoreThirdPartyRawContent: XICHENG_INSPIRATION_IMPORT_CONFIG.doNotStoreThirdPartyRawContent,
		inspirationId: `inspiration_${Date.now()}`,
		sourceType,
		rawInputPreview: sanitizeThirdPartyInput(inputText),
		imageMeta,
		extractedPlaces: placeHints,
		routeIntent: '亲子研学 Citywalk',
		matchedPois,
		fallbackReason: errorMessage
	}
}

const requestXichengInspiration = ({ apiPath, data = {} }) => new Promise((resolve, reject) => {
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
				reject(new Error(`西城灵感导入接口异常:${res.statusCode}`))
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

export const importXichengInspiration = async ({
	inputText = '',
	sourceType = '文字',
	imageMeta = null
} = {}) => {
	const sanitizedText = sanitizeThirdPartyInput(inputText)
	const localFallback = createXichengInspirationDevelopmentFallback({
		inputText: sanitizedText,
		sourceType,
		imageMeta
	})
	try {
		const result = await requestXichengInspiration({
			apiPath: XICHENG_INSPIRATION_IMPORT_API_PATH,
			data: {
				sourceType,
				inputText: sanitizedText,
				imageMeta,
				doNotStoreThirdPartyRawContent: XICHENG_INSPIRATION_IMPORT_CONFIG.doNotStoreThirdPartyRawContent
			}
		})
		const extractedPlaces = Array.isArray(result.extractedPlaces) && result.extractedPlaces.length > 0
			? result.extractedPlaces
			: localFallback.extractedPlaces
		return {
			...localFallback,
			...(result || {}),
			extractedPlaces,
			matchedPois: Array.isArray(result.matchedPois) && result.matchedPois.length > 0
				? result.matchedPois
				: matchXichengOfficialPois(extractedPlaces)
		}
	} catch (error) {
		return {
			...localFallback,
			fallbackReason: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : ''
		}
	}
}

export const confirmXichengInspirationPois = async ({
	inspirationId = '',
	matchedPois = []
} = {}) => {
	const confirmedPois = matchedPois
		.filter(poi => poi && poi.confirmed !== false)
		.map(poi => ({
			...poi,
			confirmed: true,
			officialPoiOnly: true
		}))
	try {
		const apiPath = XICHENG_INSPIRATION_CONFIRM_POIS_API_PATH.replace('{id}', encodeURIComponent(inspirationId))
		const result = await requestXichengInspiration({
			apiPath,
			data: { inspirationId, confirmedPois }
		})
		return result && Array.isArray(result.confirmedPois) ? result : { inspirationId, confirmedPois }
	} catch (error) {
		return {
			developmentOnly: true,
			notForProduction: true,
			inspirationId,
			confirmedPois,
			fallbackReason: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : ''
		}
	}
}

export const generateXichengInspirationRoute = async ({
	inspirationId = '',
	confirmedPois = []
} = {}) => {
	const poiList = confirmedPois.length > 0 ? confirmedPois : matchXichengOfficialPois(['白塔寺', '历代帝王庙', '什刹海'])
	const route = {
		...XICHENG_DEFAULT_ROUTE,
		routeId: `generated_${inspirationId || Date.now()}`,
		title: 'AI 生成西城可走路线',
		subtitle: poiList.map(poi => poi.poiName).join(' - '),
		checkinPoints: poiList.map((poi, index) => ({
			poiCode: poi.poiCode,
			poiName: poi.poiName,
			task: index === 0 ? '从这里开始讲解' : '完成一次观察或拍照任务',
			completed: false
		}))
	}
	try {
		const result = await requestXichengInspiration({
			apiPath: XICHENG_INSPIRATION_ROUTE_GENERATE_API_PATH,
			data: {
				inspirationId,
				confirmedPois: poiList,
				routePreference: 'walkable'
			}
		})
		const generatedRoute = result && result.routeId ? result : { ...route, ...(result || {}) }
		uni.setStorageSync(XICHENG_GENERATED_ROUTE_STORAGE_KEY, generatedRoute)
		return generatedRoute
	} catch (error) {
		const generatedRoute = {
			...route,
			developmentOnly: true,
			notForProduction: true,
			fallbackReason: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : ''
		}
		uni.setStorageSync(XICHENG_GENERATED_ROUTE_STORAGE_KEY, generatedRoute)
		return generatedRoute
	}
}
