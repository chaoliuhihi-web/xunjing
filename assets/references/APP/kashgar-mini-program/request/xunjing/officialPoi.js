import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import { normalizeXichengReviewedSources } from '@/request/xunjing/sources.js'

export const createXichengOfficialPoiSources = (officialPoi = {}) => normalizeXichengReviewedSources([
	{
		id: `official-poi-${officialPoi.poiCode || officialPoi.poiName || 'xicheng'}`,
		sourceId: `official-poi-${officialPoi.poiCode || officialPoi.poiName || 'xicheng'}`,
		title: `西城官方 POI：${officialPoi.poiName || '文化点'}`,
		name: `西城官方 POI：${officialPoi.poiName || '文化点'}`,
		excerpt: officialPoi.summary || officialPoi.theme || '西城官方 POI 配置资料。',
		summary: officialPoi.summary || '',
		sourceType: 'official-poi-config',
		type: 'official-poi-config',
		reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.approved,
		poiCode: officialPoi.poiCode || '',
		poiName: officialPoi.poiName || ''
	}
])
