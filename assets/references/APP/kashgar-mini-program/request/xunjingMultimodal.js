import config from './config.js'

export const XUNJING_MULTIMODAL_TRIGGER_CONFIG = {
	apiPath: 'app-api/xunjing/triggers/resolve',
	regionCode: 'beijing-xicheng',
	packageCode: 'XICHENG-MAP-001',
	sceneCode: 'xicheng-multimodal-trigger',
	sourceChannel: 'APP_UNIAPP',
	tenantId: config.XunjingTenantId || '1'
}

export const MAX_VISION_IMAGE_BASE64_CHARS = 4000000

export const buildYudaoAppApiUrl = (path) => {
	const base = String(config.UrlYudaoAppRequest || config.UrlRequest || '').replace(/\/+$/, '')
	const normalizedPath = String(path || '').replace(/^\/+/, '')
	return `${base}/${normalizedPath}`
}

export const getXunjingUserTraceId = () => {
	const openid = uni.getStorageSync('openid') || uni.getStorageSync('openId') || uni.getStorageSync('OPENID')
	if (openid) {
		return `openid_${openid}`
	}
	const userId = uni.getStorageSync('userId')
	if (userId) {
		return `user_${userId}`
	}
	return 'guest'
}

export const getYudaoCommonResultPayload = (res) => {
	if (res && res.data && res.data.code !== undefined && Number(res.data.code) !== 0) {
		throw new Error(res.data.msg || res.data.message || `星河寻境接口异常:${res.data.code}`)
	}
	const body = res && res.data ? res.data : {}
	return body && body.data && typeof body.data === 'object' ? body.data : body
}

export const normalizeLocationForTrigger = (location = null) => {
	if (!location || location.latitude === undefined || location.longitude === undefined) {
		return null
	}
	return {
		latitude: Number(location.latitude),
		longitude: Number(location.longitude),
		coordType: location.coordType || location.type || 'gcj02',
		accuracyMeters: Math.round(Number(location.accuracy || location.accuracyMeters || 0))
	}
}

export const requestCurrentLocationForTrigger = ({ timeout = 6000 } = {}) => {
	return new Promise((resolve) => {
		if (!uni.getLocation) {
			resolve(null)
			return
		}
		uni.getLocation({
			type: 'gcj02',
			isHighAccuracy: true,
			highAccuracyExpireTime: timeout,
			success: (location) => {
				resolve(normalizeLocationForTrigger({
					...location,
					coordType: 'gcj02'
				}))
			},
			fail: () => {
				resolve(null)
			}
		})
	})
}

export const toImageMimeType = (filePath = '', imageInfo = {}) => {
	const type = String(imageInfo.type || imageInfo.mimeType || '').toLowerCase()
	if (type.startsWith('image/')) {
		return type
	}
	const source = String(filePath || imageInfo.path || '').toLowerCase()
	if (source.endsWith('.png')) {
		return 'image/png'
	}
	if (source.endsWith('.webp')) {
		return 'image/webp'
	}
	if (source.endsWith('.heic') || source.endsWith('.heif')) {
		return 'image/heic'
	}
	return 'image/jpeg'
}

export const requestImageInfoForTrigger = (filePath = '') => {
	return new Promise((resolve) => {
		if (!filePath || !uni.getImageInfo) {
			resolve(null)
			return
		}
		uni.getImageInfo({
			src: filePath,
			success: (imageInfo) => {
				resolve({
					width: Number(imageInfo.width || 0),
					height: Number(imageInfo.height || 0),
					type: toImageMimeType(filePath, imageInfo)
				})
			},
			fail: () => {
				resolve(null)
			}
		})
	})
}

export const readLocalImageBase64ForTrigger = (filePath = '') => {
	return new Promise((resolve) => {
		if (!filePath || !uni.getFileSystemManager) {
			resolve(null)
			return
		}
		const fileSystemManager = uni.getFileSystemManager()
		if (!fileSystemManager || !fileSystemManager.readFile) {
			resolve(null)
			return
		}
		fileSystemManager.readFile({
			filePath,
			encoding: 'base64',
			success: (res) => {
				const imageBase64 = String(res && res.data ? res.data : '')
				resolve(imageBase64.length <= MAX_VISION_IMAGE_BASE64_CHARS ? imageBase64 : null)
			},
			fail: () => {
				resolve(null)
			}
		})
	})
}

export const inferImageLabelsFromLocalHints = ({ filePath = '', text = '', ocrText = '' } = {}) => {
	const source = `${filePath} ${text} ${ocrText}`.toLowerCase()
	const labels = new Set()
	if (/白塔寺|妙应寺|白塔|baitasi|pagoda/.test(source)) {
		labels.add('white_pagoda')
		labels.add('temple')
	}
	if (/北海|琼华岛|湖|lake|garden/.test(source)) {
		labels.add('lake')
		labels.add('imperial_garden')
		labels.add('white_tower')
	}
	if (/历代帝王庙|帝王庙|imperial/.test(source)) {
		labels.add('imperial_temple')
		labels.add('temple')
	}
	if (/什刹海|后海|胡同|hutong/.test(source)) {
		labels.add('lake')
		labels.add('hutong')
	}
	if (/大栅栏|前门|dashilar|qianmen/.test(source)) {
		labels.add('hutong')
		labels.add('shop_sign')
	}
	return Array.from(labels)
}

export const buildPhotoMetaForTrigger = ({
	filePath = '',
	location = null,
	imageInfo = null,
	imageBase64 = null
} = {}) => ({
	imageId: filePath ? String(filePath).split('/').pop() : '',
	imageUrl: filePath,
	takenAt: new Date().toISOString(),
	imageMimeType: toImageMimeType(filePath, imageInfo || {}),
	imageWidth: imageInfo && imageInfo.width ? Number(imageInfo.width) : null,
	imageHeight: imageInfo && imageInfo.height ? Number(imageInfo.height) : null,
	imageBase64: imageBase64 || null,
	exifLocation: normalizeLocationForTrigger(location)
})

export const resolveXunjingMultimodalTrigger = ({
	text = '',
	ocrText = '',
	location = null,
	photoMeta = null,
	imageLabels = [],
	recentPoiCodes = [],
	packageCode = XUNJING_MULTIMODAL_TRIGGER_CONFIG.packageCode,
	sceneCode = XUNJING_MULTIMODAL_TRIGGER_CONFIG.sceneCode,
	regionCode = XUNJING_MULTIMODAL_TRIGGER_CONFIG.regionCode
} = {}) => {
	const normalizedLocation = normalizeLocationForTrigger(location)
	return new Promise((resolve, reject) => {
		uni.request({
			url: buildYudaoAppApiUrl(XUNJING_MULTIMODAL_TRIGGER_CONFIG.apiPath),
			method: 'POST',
			timeout: 10000,
			header: {
				'Content-Type': 'application/json',
				'tenant-id': XUNJING_MULTIMODAL_TRIGGER_CONFIG.tenantId
			},
			data: {
				regionCode,
				packageCode,
				sceneCode,
				sourceChannel: XUNJING_MULTIMODAL_TRIGGER_CONFIG.sourceChannel,
				userTraceId: getXunjingUserTraceId(),
				text,
				ocrText,
				location: normalizedLocation,
				photoMeta,
				imageLabels,
				recentPoiCodes
			},
			success: (res) => {
				if (res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
					reject(new Error(`星河寻境多模态触发接口异常:${res.statusCode}`))
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
}

export const resolveXunjingPhotoTrigger = async ({
	filePath = '',
	text = '',
	ocrText = '',
	imageLabels = []
} = {}) => {
	const [location, imageInfo, imageBase64] = await Promise.all([
		requestCurrentLocationForTrigger(),
		requestImageInfoForTrigger(filePath),
		readLocalImageBase64ForTrigger(filePath)
	])
	const labels = imageLabels.length > 0
		? imageLabels
		: inferImageLabelsFromLocalHints({ filePath, text, ocrText })
	return resolveXunjingMultimodalTrigger({
		text,
		ocrText,
		location,
		photoMeta: buildPhotoMetaForTrigger({ filePath, location, imageInfo, imageBase64 }),
		imageLabels: labels
	})
}
