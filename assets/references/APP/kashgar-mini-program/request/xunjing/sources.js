export const normalizeXichengReviewedSource = (source = {}) => {
	if (!source || typeof source !== 'object') {
		return null
	}
	const title = source.title || source.name || source.sourceTitle || '审核来源'
	const sourceUrl = source.sourceUrl || source.url || ''
	const contentDigest = source.contentDigest || source.excerpt || source.summary || ''
	const sourceId = source.sourceId !== undefined && source.sourceId !== null ? source.sourceId : source.id
	const sourceType = source.sourceType || source.type || ''
	return {
		id: source.id !== undefined && source.id !== null ? source.id : sourceId,
		sourceId,
		title,
		name: source.name || title,
		sourceTitle: source.sourceTitle || title,
		sourceUrl,
		url: source.url || sourceUrl,
		contentDigest,
		excerpt: source.excerpt || contentDigest || sourceUrl,
		summary: source.summary || contentDigest || source.excerpt || '',
		sourceType,
		type: source.type || sourceType,
		score: source.score,
		poiCode: source.poiCode || '',
		poiName: source.poiName || ''
	}
}

export const normalizeXichengReviewedSources = (sources = []) => {
	if (!Array.isArray(sources)) {
		return []
	}
	return sources
		.map(normalizeXichengReviewedSource)
		.filter(Boolean)
}
