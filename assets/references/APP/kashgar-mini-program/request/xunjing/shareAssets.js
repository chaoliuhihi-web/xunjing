const channelAssetLabelMap = Object.freeze({
	xinghe: '公开游记素材',
	moments: '朋友圈素材',
	xiaohongshu: '小红书笔记',
	pdf: 'PDF 纪念册'
})

const channelTemplateCodeMap = Object.freeze({
	xinghe: 'xicheng-public-travelogue-v1',
	moments: 'xicheng-moments-share-v1',
	xiaohongshu: 'xicheng-xiaohongshu-note-v1',
	pdf: 'xicheng-memorial-pdf-v1'
})

const channelAssetTypeMap = Object.freeze({
	xinghe: 'poster',
	moments: 'poster',
	xiaohongshu: 'poster',
	pdf: 'pdf'
})

export const normalizeXichengSharePublishChannel = (channelKey = '', assetType = 'poster') => {
	const normalizedKey = String(channelKey || '').trim()
	if (Object.prototype.hasOwnProperty.call(channelAssetLabelMap, normalizedKey)) return normalizedKey
	return assetType === 'pdf' ? 'pdf' : 'xinghe'
}

export const getXichengShareChannelAssetType = channelKey => {
	const publishChannel = normalizeXichengSharePublishChannel(channelKey)
	return channelAssetTypeMap[publishChannel] || 'poster'
}

export const getXichengShareChannelAssetLabel = (channelKey = '', assetType = 'poster') => {
	const publishChannel = normalizeXichengSharePublishChannel(channelKey, assetType)
	if (assetType === 'pdf') return channelAssetLabelMap.pdf
	return channelAssetLabelMap[publishChannel] || '游记发布素材'
}

export const getXichengShareChannelTemplateCode = (channelKey = '', assetType = 'poster') => {
	const publishChannel = normalizeXichengSharePublishChannel(channelKey, assetType)
	if (assetType === 'pdf') return channelTemplateCodeMap.pdf
	return channelTemplateCodeMap[publishChannel] || 'xicheng-travelogue-share-v1'
}
