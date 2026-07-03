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

export const createXichengShareSystemConfirmModalOptions = ({ channelKey = '', assetType = 'poster', assetLabel = '' } = {}) => {
	const publishChannel = normalizeXichengSharePublishChannel(channelKey, assetType)
	const resolvedAssetType = assetType || getXichengShareChannelAssetType(publishChannel)
	const resolvedAssetLabel = assetLabel || getXichengShareChannelAssetLabel(publishChannel, resolvedAssetType)
	const confirmText = publishChannel === 'xiaohongshu' ? '打开小红书' : publishChannel === 'moments' ? '打开朋友圈' : '继续确认'
	return {
		title: '系统分享确认',
		content: `${resolvedAssetLabel}已生成。下一步会由用户确认后继续，不会静默发布；朋友圈、小红书按系统分享或平台 SDK 唤起确认。`,
		confirmText,
		cancelText: '稍后'
	}
}

export const createXichengPdfPrintArtifact = ({
	title = '在白塔下遇见西城',
	pageCount = 6,
	materialCount = 0,
	reviewedSourceCount = 0,
	routeStops = [],
	printSettings = [],
	region = {}
} = {}) => {
	const createdAt = new Date().toISOString()
	return {
		artifactId: `pdf-print-${Date.now()}`,
		assetType: 'pdf',
		assetLabel: getXichengShareChannelAssetLabel('pdf', 'pdf'),
		templateCode: getXichengShareChannelTemplateCode('pdf', 'pdf'),
		publishChannel: 'pdf',
		title,
		description: `A4 PDF纪念册 · ${pageCount}页 · 可打印`,
		pageCount,
		reviewedSourceCount,
		materialCount,
		routeStops: Array.isArray(routeStops) ? routeStops.slice(0, 8) : [],
		printSettings: Array.isArray(printSettings) ? printSettings : [],
		regionCode: region.regionCode || '',
		packageCode: region.packageCode || '',
		sceneCode: region.sceneCode || '',
		sourceChannel: region.sourceChannel || '',
		companionName: region.companionName || '',
		reviewEvidencePolicy: {
			rawEvidenceUse: 'local-print-preview-only',
			exactLocationPolicy: 'hidden-by-default',
			auditRequired: true,
			publishStatus: 'private'
		},
		auditRequired: true,
		reviewStatus: region.reviewStatus && region.reviewStatus.pending ? region.reviewStatus.pending : 'PENDING_REVIEW',
		publishStatus: 'private',
		visibilityLabel: '本机保存 · 未发布',
		pdfExportStatus: 'local_saved',
		createdAt
	}
}
