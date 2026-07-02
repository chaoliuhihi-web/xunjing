import {
	XICHENG_OFFICIAL_POIS,
	XICHENG_REGION_CONFIG
} from '../../config/regions/xicheng.js'
import { createXichengOfficialPoiSources } from './officialPoi.js'

const XICHENG_COPY_HOMEWORK_SOURCE_PLATFORMS = Object.freeze([
	{
		sourceKey: 'xiaohongshu',
		title: '小红书',
		sourceType: 'social-note',
		matchers: ['xiaohongshu.com', 'xhslink.com', '小红书']
	},
	{
		sourceKey: 'wechat-official-account',
		title: '公众号',
		sourceType: 'official-account',
		matchers: ['mp.weixin.qq.com', 'weixin.qq.com', '公众号', '微信']
	},
	{
		sourceKey: 'mafengwo',
		title: '马蜂窝',
		sourceType: 'travel-guide',
		matchers: ['mafengwo.cn', 'mafengwo.com', '马蜂窝']
	}
])

const XICHENG_INSPIRATION_TEXT_SOURCE = Object.freeze({
	sourceKey: 'pasted-text',
	title: '图片/文字',
	sourceType: 'user-pasted-text',
	sourcePolicy: '不保存第三方平台原文；不抓取第三方链接原文'
})

const XICHENG_INSPIRATION_IMAGE_SOURCE = Object.freeze({
	sourceKey: 'guide-image',
	title: '攻略图片',
	sourceType: 'user-selected-image',
	sourcePolicy: '图片仅用于本次路线素材，不默认公开'
})

const normalizeText = (value = '') => String(value || '').replace(/\s+/g, ' ').trim()
const normalizeComparableText = (value = '') => normalizeText(value).toLowerCase()
const safeArray = value => Array.isArray(value) ? value : []
const uniqueBy = (items = [], getKey = item => item) => {
	const seen = new Set()
	return safeArray(items).filter(item => {
		const key = getKey(item)
		if (!key || seen.has(key)) return false
		seen.add(key)
		return true
	})
}

export const extractXichengGuideInput = ({ rawText = '', imagePath = '' } = {}) => {
	const normalizedText = normalizeText(rawText)
	const links = normalizedText.match(/https?:\/\/[^\s，。；、)）]+/g) || []
	return {
		normalizedText,
		rawTextLength: String(rawText || '').length,
		rawTextExcerpt: normalizedText.slice(0, 80),
		hasImage: Boolean(imagePath),
		imagePath,
		links
	}
}

export const detectXichengInspirationSourcePlatforms = ({ rawText = '', imagePath = '' } = {}) => {
	const normalized = normalizeComparableText(rawText)
	const matchedPlatforms = XICHENG_COPY_HOMEWORK_SOURCE_PLATFORMS
		.filter(platform => platform.matchers.some(matcher => normalized.includes(String(matcher).toLowerCase())))
		.map(platform => ({
			sourceKey: platform.sourceKey,
			title: platform.title,
			sourceType: platform.sourceType,
			sourcePolicy: '不保存第三方平台原文；不抓取第三方链接原文'
		}))
	const fallbackSources = []
	if (normalizeText(rawText)) fallbackSources.push(XICHENG_INSPIRATION_TEXT_SOURCE)
	if (imagePath) fallbackSources.push(XICHENG_INSPIRATION_IMAGE_SOURCE)
	return uniqueBy([...matchedPlatforms, ...fallbackSources], source => source.sourceKey)
}

export const extractXichengPoiMatches = (text = '') => {
	const normalized = normalizeComparableText(text)
	const matchedAliasesByPoiCode = new Map()
	XICHENG_OFFICIAL_POIS.forEach(poi => {
		safeArray(poi.aliases).forEach(alias => {
			const normalizedAlias = normalizeComparableText(alias)
			if (!normalizedAlias) return
			let matchIndex = normalized.indexOf(normalizedAlias)
			while (matchIndex >= 0) {
				const existingMatch = matchedAliasesByPoiCode.get(poi.poiCode)
				if (!existingMatch || matchIndex < existingMatch.matchIndex) {
					matchedAliasesByPoiCode.set(poi.poiCode, {
						poi,
						matchAlias: alias,
						matchIndex,
						matchConfidence: alias === poi.poiName ? 1 : 0.88
					})
				}
				matchIndex = normalized.indexOf(normalizedAlias, matchIndex + normalizedAlias.length)
			}
		})
	})
	return Array.from(matchedAliasesByPoiCode.values())
		.sort((left, right) => left.matchIndex - right.matchIndex)
		.map(match => ({
			...match.poi,
			matchAlias: match.matchAlias,
			matchIndex: match.matchIndex,
			matchConfidence: match.matchConfidence,
			sources: createXichengOfficialPoiSources(match.poi)
		}))
}

const removeKnownPoiAliases = (text = '', matchedPois = []) => {
	let workingText = String(text || '')
	safeArray(matchedPois).forEach(poi => {
		safeArray(poi.aliases).forEach(alias => {
			if (!alias) return
			workingText = workingText.replaceAll(alias, ' ')
		})
	})
	return workingText
}

export const extractXichengUnmatchedPlaceNames = (text = '', matchedPois = []) => {
	const textWithoutUrls = normalizeText(text).replace(/https?:\/\/[^\s，。；、)）]+/g, ' ')
	const unknownText = removeKnownPoiAliases(textWithoutUrls, matchedPois)
	const stopWords = ['小红书', '公众号', '马蜂窝', '攻略', '路线', '北京', '西城', '然后', '最后', '适合', '推荐']
	const candidates = unknownText.match(/[\u4e00-\u9fa5A-Za-z0-9·]{2,18}(?:寺|庙|海|公园|街|胡同|门|桥|馆|园|塔|巷|楼|坊|店)/g) || []
	return uniqueBy(candidates
		.map(candidate => normalizeText(candidate).replace(/^(去|到|逛|看|游|在)/, ''))
		.filter(candidate => candidate.length >= 2)
		.filter(candidate => !stopWords.some(word => candidate.includes(word))))
		.slice(0, 8)
}

export const createXichengCopyHomeworkRouteCode = (stops = []) => {
	const poiCodePart = safeArray(stops)
		.map(stop => stop && stop.poiCode ? stop.poiCode.replace(/^xicheng-/, '') : '')
		.filter(Boolean)
		.join('-')
	return `copy-homework-${poiCodePart || 'pending'}`
}

const parseDurationMinutes = (durationText = '') => {
	const numericValue = Number(String(durationText || '').replace(/\D/g, ''))
	return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 35
}

const formatDurationText = (minutes = 0) => {
	const boundedMinutes = Math.max(Number(minutes) || 0, 0)
	if (boundedMinutes >= 120) {
		const hours = Math.round((boundedMinutes / 60) * 10) / 10
		return `约 ${hours} 小时`
	}
	return `约 ${Math.max(Math.round(boundedMinutes), 40)} 分钟`
}

const estimateDistanceText = (stopCount = 0) => {
	if (stopCount <= 0) return '待匹配'
	if (stopCount === 1) return '约 0.8 公里'
	return `约 ${Math.round((0.9 + (stopCount - 1) * 1.15) * 10) / 10} 公里`
}

export const buildXichengWalkRoute = (pois = [], { sourcePlatforms = [] } = {}) => {
	if (!Array.isArray(pois) || pois.length === 0) {
		return {
			routeCode: createXichengCopyHomeworkRouteCode([]),
			title: '待匹配官方 POI',
			stops: [],
			durationText: '待匹配',
			distanceText: '待匹配',
			routeSource: 'copy-homework',
			sourceLabel: '一键抄作业导入',
			sourcePlatforms,
			summary: '先匹配西城官方 POI 后再生成可走路线，避免把未确认地点加入路线护照。'
		}
	}
	const stops = pois.map((poi, index) => ({
		...poi,
		sequence: index + 1,
		sources: safeArray(poi.sources).length > 0 ? poi.sources : createXichengOfficialPoiSources(poi)
	}))
	const durationMinutes = stops.reduce((total, stop) => total + parseDurationMinutes(stop.durationText), 0) + Math.max(stops.length - 1, 0) * 18
	return {
		routeCode: createXichengCopyHomeworkRouteCode(stops),
		title: stops.map(stop => stop.poiName).join(' - '),
		stops,
		durationText: formatDurationText(durationMinutes),
		distanceText: estimateDistanceText(stops.length),
		routeSource: 'copy-homework',
		sourceLabel: '一键抄作业导入',
		sourcePlatforms,
		summary: `已从攻略灵感中匹配 ${stops.length} 个西城官方 POI，按出现顺序生成可走 Citywalk。`
	}
}

export const createXichengInspirationImportRecord = (importPackage = {}) => ({
	importId: importPackage.importId,
	regionCode: XICHENG_REGION_CONFIG.regionCode,
	packageCode: XICHENG_REGION_CONFIG.packageCode,
	sceneCode: XICHENG_REGION_CONFIG.sceneCode,
	sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
	rawTextExcerpt: importPackage.includeImageOnly ? '' : importPackage.rawTextExcerpt,
	rawTextLength: importPackage.includeImageOnly ? 0 : importPackage.rawTextLength,
	sourcePlatforms: importPackage.sourcePlatforms,
	extractedPlaceNames: importPackage.includeImageOnly ? [] : safeArray(importPackage.matchedPois).map(poi => poi.poiName),
	unmatchedPlaceNames: importPackage.includeImageOnly ? [] : safeArray(importPackage.unmatchedPlaceNames),
	matchedPoiCodes: importPackage.includeImageOnly ? [] : safeArray(importPackage.matchedPois).map(poi => poi.poiCode),
	confirmedPois: importPackage.includeImageOnly ? [] : safeArray(importPackage.route && importPackage.route.stops),
	imageIncluded: Boolean(importPackage.imagePath),
	includeImageOnly: Boolean(importPackage.includeImageOnly),
	routeTitle: importPackage.includeImageOnly ? '攻略图片待提取' : importPackage.route.title,
	routeCode: importPackage.includeImageOnly ? '' : importPackage.route.routeCode,
	routeSource: 'copy-homework',
	sourcePolicy: '不保存第三方平台原文；不抓取第三方链接原文',
	reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
	publishStatus: 'private',
	importedAt: importPackage.importedAt
})

export const createXichengInspirationImportPackage = ({
	rawText = '',
	imagePath = '',
	target = '',
	includeImageOnly = false,
	importedAt = new Date().toISOString(),
	importId = `inspiration-${Date.now()}`
} = {}) => {
	const guideInput = extractXichengGuideInput({ rawText, imagePath })
	const sourcePlatforms = detectXichengInspirationSourcePlatforms({ rawText, imagePath })
	const matchedPois = includeImageOnly ? [] : extractXichengPoiMatches(guideInput.normalizedText)
	const unmatchedPlaceNames = includeImageOnly ? [] : extractXichengUnmatchedPlaceNames(guideInput.normalizedText, matchedPois)
	const route = buildXichengWalkRoute(matchedPois, { sourcePlatforms })
	const importPackage = {
		importId,
		importedAt,
		target,
		rawText: '',
		rawTextExcerpt: guideInput.rawTextExcerpt,
		rawTextLength: guideInput.rawTextLength,
		imagePath,
		includeImageOnly,
		sourcePlatforms,
		matchedPois,
		unmatchedPlaceNames,
		route,
		sourcePolicy: '不保存第三方平台原文；不抓取第三方链接原文'
	}
	return {
		...importPackage,
		importRecord: createXichengInspirationImportRecord(importPackage)
	}
}

export const createXichengInspirationRouteMaterials = (importPackage = {}) => {
	const route = importPackage.route || {}
	const routeMaterials = importPackage.includeImageOnly
		? []
		: safeArray(route.stops).map(stop => {
			const sources = createXichengOfficialPoiSources(stop)
			return {
				type: 'inspiration-poi',
				importId: importPackage.importId,
				routeCode: route.routeCode,
				routeTitle: route.title,
				routeSource: 'copy-homework',
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				sourcePlatforms: importPackage.sourcePlatforms,
				poiCode: stop.poiCode,
				poiName: stop.poiName,
				sourceLabel: '一键抄作业导入',
				sourcePolicy: '不保存第三方平台原文；不抓取第三方链接原文',
				sources,
				sourceCount: sources.length,
				safetyStatus: 'PASSED',
				reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
				publishStatus: 'private',
				capturedAt: importPackage.importedAt
			}
		})
	const imageMaterial = importPackage.imagePath
		? [{
			type: 'inspiration-image',
			importId: importPackage.importId,
			routeCode: importPackage.includeImageOnly ? importPackage.importId : route.routeCode,
			routeTitle: importPackage.includeImageOnly ? '攻略图片待提取' : route.title,
			regionCode: XICHENG_REGION_CONFIG.regionCode,
			packageCode: XICHENG_REGION_CONFIG.packageCode,
			sceneCode: XICHENG_REGION_CONFIG.sceneCode,
			sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
			sourcePlatforms: importPackage.sourcePlatforms,
			poiCode: '',
			poiName: '攻略图片',
			imagePath: importPackage.imagePath,
			sourceLabel: '上传攻略图片',
			sourcePolicy: '不保存第三方平台原文',
			sources: [],
			sourceCount: 0,
			reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
			publishStatus: 'private',
			capturedAt: importPackage.importedAt
		}]
		: []
	return [
		...imageMaterial,
		...routeMaterials
	]
}
