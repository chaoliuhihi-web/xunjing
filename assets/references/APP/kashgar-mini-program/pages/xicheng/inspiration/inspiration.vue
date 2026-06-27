<template>
	<view class="xicheng-inspiration">
		<view class="hero">
			<text class="eyebrow">一键抄作业</text>
			<text class="title">导入灵感</text>
			<text class="subtitle">粘贴攻略文字、地点清单或上传攻略图片，先做本地 AI提取地点，再匹配官方 POI 生成可走路线。</text>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">粘贴攻略文字</text>
				<button class="tiny-button" @click="fillExample">示例</button>
			</view>
			<textarea
				class="input-area"
				v-model="rawText"
				maxlength="1200"
				placeholder="例如：白塔寺看建筑，历代帝王庙听礼制故事，最后去什刹海散步。"
			/>
			<view class="upload-row" @click="chooseInspirationImage">
				<text class="upload-title">上传攻略图片</text>
				<text class="upload-desc">{{ imagePath ? '已添加图片素材' : '首版只保存图片素材，地点仍以文字确认结果为准' }}</text>
			</view>
			<button class="primary-button" @click="runExtraction">AI提取地点</button>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">匹配官方 POI</text>
				<text class="section-badge">{{ matchedPois.length }} 个</text>
			</view>
			<view v-if="matchedPois.length > 0">
				<view
					v-for="poi in matchedPois"
					:key="poi.poiCode"
					class="poi-row"
				>
					<view>
						<text class="poi-title">{{ poi.poiName }}</text>
						<text class="poi-meta">{{ poi.theme }} · {{ poi.durationText }}</text>
					</view>
					<text class="poi-status">已匹配</text>
				</view>
			</view>
			<text v-else class="empty-copy">请输入白塔寺、历代帝王庙、什刹海、北海或大栅栏等西城官方 POI。</text>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">生成可走路线</text>
				<text class="section-badge">{{ route.durationText }}</text>
			</view>
			<text class="route-title">{{ route.title }}</text>
			<text class="route-desc">{{ route.summary }}</text>
			<view class="route-steps">
				<text
					v-for="(stop, index) in route.stops"
					:key="stop.poiCode"
					class="route-stop"
				>
					{{ index + 1 }}. {{ stop.poiName }}
				</text>
			</view>
			<view class="action-row">
				<button class="primary-button" @click="saveInspirationRoute">加入路线护照</button>
				<button class="ghost-button" @click="openTravelogue">打开素材盒</button>
			</view>
		</view>
	</view>
</template>

<script>
import {
	XICHENG_OFFICIAL_POIS,
	XICHENG_REGION_CONFIG
} from '@/config/regions/xicheng.js'

export const extractXichengPoiMatches = (text = '') => {
	const normalized = String(text || '').toLowerCase()
	return XICHENG_OFFICIAL_POIS.filter(poi => (
		poi.aliases.some(alias => normalized.includes(String(alias).toLowerCase()))
	))
}

export const buildXichengWalkRoute = (pois = []) => {
	const stops = pois.length > 0 ? pois : XICHENG_OFFICIAL_POIS.slice(0, 3)
	const title = stops.length > 0
		? stops.map(stop => stop.poiName).join(' - ')
		: '西城 Citywalk'
	const durationMinutes = stops.reduce((total, stop) => {
		const minutes = Number(String(stop.durationText || '').replace(/\D/g, '')) || 35
		return total + minutes
	}, 0)
	return {
		title,
		stops,
		durationText: `约 ${Math.max(durationMinutes, 60)} 分钟`,
		summary: `按官方 POI 串联 ${stops.length} 个文化点，适合加入路线护照并沉淀为 Citywalk 素材。`
	}
}

export default {
	data() {
		const rawText = '白塔寺看建筑，历代帝王庙听礼制故事，最后去什刹海散步。'
		const matchedPois = extractXichengPoiMatches(rawText)
		return {
			region: XICHENG_REGION_CONFIG,
			rawText,
			imagePath: '',
			inspirationImports: [],
			matchedPois,
			route: buildXichengWalkRoute(matchedPois)
		}
	},
	methods: {
		fillExample() {
			this.rawText = '白塔寺看建筑，历代帝王庙听礼制故事，最后去什刹海散步。'
			this.runExtraction()
		},
		runExtraction() {
			this.matchedPois = extractXichengPoiMatches(this.rawText)
			this.route = buildXichengWalkRoute(this.matchedPois)
		},
		chooseInspirationImage() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					this.imagePath = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : ''
					this.saveInspirationRoute({ silent: true, includeImageOnly: true })
				}
			})
		},
		saveInspirationRoute({ silent = false, includeImageOnly = false } = {}) {
			const route = {
				...this.route,
				rawTextExcerpt: this.createInspirationTextExcerpt(this.rawText),
				imagePath: this.imagePath,
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				sourceLabel: '灵感导入路线',
				updatedAt: new Date().toISOString()
			}
			const importRecord = this.createInspirationImportRecord(route, includeImageOnly)
			this.persistInspirationImportRecord(importRecord)
			const existingMaterials = uni.getStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey)
			const materials = Array.isArray(existingMaterials) ? existingMaterials : []
			const routeMaterials = includeImageOnly
				? []
				: route.stops.map(stop => ({
					type: 'inspiration-poi',
					regionCode: XICHENG_REGION_CONFIG.regionCode,
					packageCode: XICHENG_REGION_CONFIG.packageCode,
					poiCode: stop.poiCode,
					poiName: stop.poiName,
					sourceLabel: '灵感导入路线',
					sources: [],
					capturedAt: route.updatedAt
				}))
			const imageMaterial = this.imagePath
				? [{
					type: 'inspiration-image',
					regionCode: XICHENG_REGION_CONFIG.regionCode,
					packageCode: XICHENG_REGION_CONFIG.packageCode,
					poiCode: '',
					poiName: '攻略图片',
					imagePath: this.imagePath,
					sourceLabel: '上传攻略图片',
					sources: [],
					capturedAt: route.updatedAt
				}]
				: []
			uni.setStorageSync(XICHENG_REGION_CONFIG.inspirationStorageKey, route)
			uni.setStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey, [
				...imageMaterial,
				...routeMaterials,
				...materials
			].slice(0, 80))
			if (!silent) {
				uni.showToast({
					title: '已加入路线护照',
					icon: 'none'
				})
			}
		},
		createInspirationTextExcerpt(text = '') {
			return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 80)
		},
		createInspirationImportRecord(route, includeImageOnly = false) {
			const importedAt = new Date().toISOString()
			return {
				importId: `inspiration-${Date.now()}`,
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				rawTextExcerpt: this.createInspirationTextExcerpt(this.rawText),
				rawTextLength: String(this.rawText || '').length,
				extractedPlaceNames: this.matchedPois.map(poi => poi.poiName),
				matchedPoiCodes: this.matchedPois.map(poi => poi.poiCode),
				confirmedPois: route.stops,
				imageIncluded: !!this.imagePath,
				includeImageOnly,
				routeTitle: route.title,
				sourcePolicy: '不保存第三方平台原文',
				reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
				publishStatus: 'private',
				importedAt
			}
		},
		persistInspirationImportRecord(importRecord) {
			const existingImports = uni.getStorageSync(XICHENG_REGION_CONFIG.inspirationImportStorageKey)
			const imports = Array.isArray(existingImports) ? existingImports : []
			this.inspirationImports = [
				importRecord,
				...imports
			].slice(0, 20)
			uni.setStorageSync(XICHENG_REGION_CONFIG.inspirationImportStorageKey, this.inspirationImports)
		},
		openTravelogue() {
			this.saveInspirationRoute({ silent: true })
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?mode=route&regionCode=${encodeURIComponent(this.region.regionCode)}&packageCode=${encodeURIComponent(this.region.packageCode)}&companionName=${encodeURIComponent(this.region.companionName)}`
			})
		}
	}
}
</script>

<style scoped>
.xicheng-inspiration {
	min-height: 100vh;
	padding: 36rpx 28rpx 56rpx;
	box-sizing: border-box;
	background: #F7F5EE;
	color: #172B4D;
}

.hero,
.section-card {
	border-radius: 8rpx;
	background: #FFFFFF;
	box-shadow: 0 12rpx 36rpx rgba(31, 41, 51, 0.08);
}

.hero {
	padding: 36rpx 32rpx;
}

.eyebrow,
.subtitle,
.empty-copy,
.poi-meta,
.route-desc,
.upload-desc {
	display: block;
	font-size: 24rpx;
	line-height: 1.6;
	color: #667085;
}

.title {
	display: block;
	margin-top: 12rpx;
	font-size: 44rpx;
	font-weight: 700;
	color: #122033;
}

.subtitle {
	margin-top: 14rpx;
}

.section-card {
	margin-top: 24rpx;
	padding: 30rpx;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.section-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #122033;
}

.section-badge,
.poi-status {
	flex-shrink: 0;
	padding: 8rpx 14rpx;
	border-radius: 8rpx;
	background: #EEF5F1;
	font-size: 22rpx;
	color: #1F6E5A;
}

.tiny-button {
	width: 108rpx;
	height: 56rpx;
	line-height: 56rpx;
	border-radius: 8rpx;
	background: #EEF5F1;
	font-size: 22rpx;
	color: #1F6E5A;
}

.input-area {
	width: 100%;
	min-height: 260rpx;
	margin-top: 20rpx;
	padding: 22rpx;
	border-radius: 8rpx;
	background: #F9FAFB;
	box-sizing: border-box;
	font-size: 26rpx;
	line-height: 1.7;
	color: #1F2933;
}

.upload-row,
.poi-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	margin-top: 18rpx;
	padding: 20rpx;
	border-radius: 8rpx;
	background: #F2F4F7;
}

.upload-title,
.poi-title,
.route-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: #1F2933;
}

.route-title {
	margin-top: 18rpx;
}

.route-desc {
	margin-top: 10rpx;
}

.route-steps {
	margin-top: 18rpx;
}

.route-stop {
	display: block;
	margin-top: 12rpx;
	padding: 18rpx;
	border-radius: 8rpx;
	background: #F2F4F7;
	font-size: 26rpx;
	color: #344054;
}

.action-row {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 24rpx;
}

.primary-button,
.ghost-button {
	height: 84rpx;
	line-height: 84rpx;
	border-radius: 8rpx;
	font-size: 28rpx;
}

.primary-button {
	margin-top: 22rpx;
	background: #1F6E5A;
	color: #FFFFFF;
}

.ghost-button {
	background: #E8ECE7;
	color: #1F6E5A;
}
</style>
