export const normalizeXichengReviewedSource = (source = {}) => {
	if (!source || typeof source !== 'object') {
		return null
	}
	const displayTitle = source.title || source.name || source.sourceTitle || ''
	const sourceUrl = source.sourceUrl || source.url || ''
	const contentDigest = source.contentDigest || source.excerpt || source.summary || ''
	if (!displayTitle && !sourceUrl && !contentDigest) {
		return null
	}
	const title = displayTitle || '审核来源'
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

export const getXichengDisplaySourceTitle = (source = {}) => {
	const rawTitle = String(source.title || source.name || source.sourceTitle || '').trim()
	return rawTitle
		.replace(/\s*POI\s*级已审核来源\s*$/g, '')
		.replace(/\s*已审核来源\s*$/g, '')
		.trim()
}

export const getXichengDisplaySourceDescription = (source = {}, maxLength = 72) => {
	const rawDescription = String(source.excerpt || source.summary || source.contentDigest || '').trim()
	const cleanedDescription = rawDescription
		.replace(/POI 级已审核来源：[^。]*。/g, '')
		.replace(/触发关键词、坐标和别名来自[^。]*。/g, '')
		.replace(/生产发布前仍需完成[^。]*。/g, '')
		.replace(/\s+/g, ' ')
		.trim()
	if (cleanedDescription) {
		const boundedLength = Number(maxLength) > 0 ? Number(maxLength) : 72
		return cleanedDescription.length > boundedLength ? `${cleanedDescription.slice(0, boundedLength)}...` : cleanedDescription
	}
	if (source.sourceUrl || source.url || source.sourceType || source.type) {
		return '官方公开来源'
	}
	return ''
}
