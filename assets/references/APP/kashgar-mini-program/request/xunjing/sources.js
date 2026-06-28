export const normalizeXichengReviewedSource = (source = {}) => {
	if (!source || typeof source !== 'object') {
		return null
	}
	const title = source.title || source.name || source.sourceTitle || '审核来源'
	const sourceUrl = source.sourceUrl || source.url || ''
	const contentDigest = source.contentDigest || source.excerpt || source.summary || ''
	return {
		...source,
		title,
		name: source.name || title,
		sourceUrl,
		url: source.url || sourceUrl,
		contentDigest,
		excerpt: source.excerpt || contentDigest || sourceUrl,
		summary: source.summary || contentDigest || source.excerpt || '',
		sourceType: source.sourceType || source.type || '',
		score: source.score
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
