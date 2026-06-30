<template>
	<view class="xicheng-inspiration xicheng-designed-page xicheng-bottom-safe xicheng-inspiration-shell">
		<view class="hero xicheng-paper-card xicheng-inspiration-hero">
			<view class="inspiration-hero-main">
				<view class="inspiration-hero-copy">
					<text class="eyebrow">一键抄作业</text>
					<text class="title">导入灵感</text>
					<text class="subtitle">粘贴攻略文字、地点清单或上传攻略图片，先做本地 AI提取地点，再匹配官方 POI 生成可走路线。</text>
				</view>
				<view class="inspiration-companion">
					<image class="inspiration-companion-avatar" :src="region.companionAvatar" mode="aspectFit" />
					<view class="inspiration-companion-bubble xicheng-companion-bubble">
						<text class="companion-name">{{ region.companionName }}</text>
						<text class="companion-line">我帮你把灵感变成可走路线</text>
					</view>
				</view>
			</view>
		</view>

		<view class="section-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">粘贴攻略文字</text>
				<button class="tiny-button xicheng-secondary-action" @click="fillExample">示例</button>
			</view>
			<textarea
				class="input-area"
				v-model="rawText"
				maxlength="1200"
				placeholder="例如：白塔寺看建筑，历代帝王庙听礼制故事，最后去什刹海散步。"
			/>
			<view class="upload-row" @click="chooseInspirationImage">
				<text class="upload-title">上传攻略图片</text>
				<text class="upload-desc">{{ imagePath ? '已添加图片素材' : '图片进入素材盒，地点以文字匹配结果为准' }}</text>
			</view>
			<button class="primary-button xicheng-primary-action" @click="runExtraction">AI提取地点</button>
		</view>

		<view class="section-card xicheng-paper-card">
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

		<view class="section-card xicheng-paper-card">
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
			<view class="action-row xicheng-inspiration-actions">
				<button class="primary-button xicheng-primary-action" @click="saveInspirationRoute">加入路线护照</button>
				<button class="ghost-button xicheng-secondary-action" @click="openTravelogue">打开素材盒</button>
			</view>
		</view>
	</view>
</template>

<script>
import {
	XICHENG_OFFICIAL_POIS,
	XICHENG_REGION_CONFIG
} from '@/config/regions/xicheng.js'
import { createXichengOfficialPoiSources } from '@/request/xunjing/officialPoi.js'
import { createXichengRouteOutputValue } from '@/request/xunjing/routeParams.js'
import { isXunjingUserCancelled } from '@/request/xunjing/userCancel.js'

const encodeRouteValue = (value = '') => createXichengRouteOutputValue(value, { platform: process.env.UNI_PLATFORM })

export const extractXichengPoiMatches = (text = '') => {
	const normalized = String(text || '').toLowerCase()
	return XICHENG_OFFICIAL_POIS
		.map(poi => {
			const matchIndex = poi.aliases.reduce((aliasIndex, alias) => {
				const index = normalized.indexOf(String(alias).toLowerCase())
				if (index < 0) return aliasIndex
				return Math.min(aliasIndex, index)
			}, Number.MAX_SAFE_INTEGER)
			return {
				poi,
				matchIndex
			}
		})
		.filter(item => item.matchIndex !== Number.MAX_SAFE_INTEGER)
		.sort((left, right) => left.matchIndex - right.matchIndex)
		.map(item => item.poi)
}

export const buildXichengWalkRoute = (pois = []) => {
	if (pois.length === 0) {
		return {
			title: '待匹配官方 POI',
			stops: [],
			durationText: '待匹配',
			summary: '先匹配西城官方 POI 后再生成可走路线，避免把未确认地点加入路线护照。'
		}
	}
	const stops = pois
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
		const rawText = ''
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
		confirmInspirationImagePurpose(actionLabel = '上传攻略图片') {
			return new Promise((resolve) => {
				uni.showModal({
					title: `${actionLabel}用途说明`,
					content: '图片仅用于本次西城灵感路线素材，不默认公开；系统只保存短摘和匹配结果，不保存第三方平台原文；不会用于模型评估或运营纠错，除非你另行授权。',
					confirmText: '继续',
					cancelText: '取消',
					success: (res) => resolve(Boolean(res.confirm)),
					fail: () => resolve(false)
				})
			})
		},
		showInspirationImageUnavailable() {
			uni.showToast({
				title: '未获得可用攻略图片，请重新选择',
				icon: 'none'
			})
		},
		showInspirationRouteUnavailable() {
			uni.showToast({
				title: '请先输入并匹配官方 POI',
				icon: 'none'
			})
		},
		async chooseInspirationImage() {
			const confirmed = await this.confirmInspirationImagePurpose('上传攻略图片')
			if (!confirmed) return
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const filePath = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : ''
					if (!filePath) {
						this.showInspirationImageUnavailable()
						return
					}
					this.imagePath = filePath
					this.saveInspirationRoute({ silent: true, includeImageOnly: true })
				},
				fail: (err) => {
					if (isXunjingUserCancelled(err)) {
						return
					}
					this.showInspirationImageUnavailable()
				}
			})
		},
		saveInspirationRoute({ silent = false, includeImageOnly = false } = {}) {
			if (!includeImageOnly) {
				this.matchedPois = extractXichengPoiMatches(this.rawText)
				if (this.matchedPois.length === 0) {
					this.showInspirationRouteUnavailable()
					return false
				}
				this.route = buildXichengWalkRoute(this.matchedPois)
			}
			const route = {
				...this.route,
				rawTextExcerpt: this.createInspirationTextExcerpt(this.rawText),
				imagePath: this.imagePath,
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
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
				: route.stops.map(stop => {
					const sources = createXichengOfficialPoiSources(stop)
					return {
						type: 'inspiration-poi',
						regionCode: XICHENG_REGION_CONFIG.regionCode,
						packageCode: XICHENG_REGION_CONFIG.packageCode,
						sceneCode: XICHENG_REGION_CONFIG.sceneCode,
						sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
						poiCode: stop.poiCode,
						poiName: stop.poiName,
						sourceLabel: '灵感导入路线',
						sources,
						sourceCount: sources.length,
						reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
						publishStatus: 'private',
						capturedAt: route.updatedAt
					}
				})
			const imageMaterial = this.imagePath
				? [{
					type: 'inspiration-image',
					regionCode: XICHENG_REGION_CONFIG.regionCode,
					packageCode: XICHENG_REGION_CONFIG.packageCode,
					sceneCode: XICHENG_REGION_CONFIG.sceneCode,
					sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
					poiCode: '',
					poiName: '攻略图片',
					imagePath: this.imagePath,
					sourceLabel: '上传攻略图片',
					sources: [],
					reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
					publishStatus: 'private',
					capturedAt: route.updatedAt
				}]
				: []
			if (!includeImageOnly) {
				uni.setStorageSync(XICHENG_REGION_CONFIG.inspirationStorageKey, route)
			}
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
			return true
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
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				rawTextExcerpt: includeImageOnly ? '' : this.createInspirationTextExcerpt(this.rawText),
				rawTextLength: includeImageOnly ? 0 : String(this.rawText || '').length,
				extractedPlaceNames: includeImageOnly ? [] : this.matchedPois.map(poi => poi.poiName),
				matchedPoiCodes: includeImageOnly ? [] : this.matchedPois.map(poi => poi.poiCode),
				confirmedPois: includeImageOnly ? [] : route.stops,
				imageIncluded: !!this.imagePath,
				includeImageOnly,
				routeTitle: includeImageOnly ? '攻略图片待提取' : route.title,
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
			const saved = this.saveInspirationRoute({ silent: true })
			if (!saved) return
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?mode=route&regionCode=${encodeRouteValue(this.region.regionCode)}&packageCode=${encodeRouteValue(this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.region.sourceChannel)}&companionName=${encodeRouteValue(this.region.companionName)}`
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
	color: #102F29;
}

.xicheng-inspiration-shell {
	position: relative;
}

.hero,
.section-card {
	border: 1rpx solid rgba(255, 255, 255, 0.78);
	border-radius: 34rpx;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(250, 246, 237, 0.88));
	box-shadow: 0 18rpx 46rpx rgba(28, 35, 32, 0.10);
	overflow: hidden;
}

.hero {
	padding: 36rpx 32rpx;
}

.inspiration-hero-main {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
}

.inspiration-hero-copy {
	flex: 1;
	min-width: 0;
}

.inspiration-companion {
	width: 228rpx;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.inspiration-companion-avatar {
	width: 208rpx;
	height: 268rpx;
	border-radius: 30rpx;
	background: #E7EFE8;
}

.inspiration-companion-bubble {
	width: 100%;
	margin-top: 14rpx;
	padding: 14rpx 12rpx;
	border-radius: 26rpx;
	box-sizing: border-box;
}

.companion-name,
.companion-line {
	display: block;
	text-align: center;
}

.companion-name {
	font-size: 24rpx;
	font-weight: 700;
	color: #173F35;
}

.companion-line {
	margin-top: 4rpx;
	font-size: 22rpx;
	line-height: 1.4;
	color: #746F68;
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
	color: #102F29;
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
	display: flex;
	align-items: center;
	gap: 12rpx;
	font-size: 30rpx;
	font-weight: 700;
	color: #102F29;
}

.section-title::before {
	content: '';
	width: 8rpx;
	height: 34rpx;
	border-radius: 999rpx;
	background: #B5945E;
}

.section-badge,
.poi-status {
	flex-shrink: 0;
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.12);
	font-size: 22rpx;
	color: #173F35;
}

.tiny-button {
	width: 108rpx;
	height: 56rpx;
	line-height: 56rpx;
	border-radius: 18rpx;
	background: rgba(255, 252, 246, 0.86);
	font-size: 22rpx;
	color: #173F35;
}

.input-area {
	width: 100%;
	min-height: 260rpx;
	margin-top: 20rpx;
	padding: 22rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.14);
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.84);
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
	border: 1rpx solid rgba(181, 148, 94, 0.14);
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.76);
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
	border-radius: 22rpx;
	background: rgba(255, 252, 246, 0.82);
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
	border-radius: 28rpx;
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

.xicheng-inspiration-actions .primary-button {
	margin-top: 0;
}
</style>
