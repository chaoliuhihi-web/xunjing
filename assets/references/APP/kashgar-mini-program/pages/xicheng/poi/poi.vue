<template>
	<view class="xicheng-poi-detail xicheng-designed-page xicheng-bottom-safe">
		<view class="poi-nav">
			<button class="nav-icon" @click="goBack">‹</button>
			<text class="nav-title">{{ activePoi.poiName || '地点详情' }}</text>
			<button class="nav-icon share-icon" @click="addPoiToTravelogue">存</button>
		</view>

		<view class="poi-hero xicheng-paper-card">
			<image class="poi-hero-image" :src="poiHeroImage" mode="aspectFill" />
			<view class="identified-pill">
				<text class="identified-dot">✓</text>
				<text>已识别地点</text>
			</view>
			<view class="image-count">1/6</view>
		</view>

		<view class="poi-title-block">
			<text class="poi-title">{{ activePoi.poiName || '西城文化点' }}</text>
			<text class="poi-subtitle">{{ activePoi.summary || activePoi.theme || '西城官方 POI 资料' }}</text>
		</view>

		<view class="xiaojing-player xicheng-paper-card">
			<image class="xiaojing-avatar" :src="region.companionAvatar" mode="aspectFit" />
			<view class="player-copy">
				<text class="player-bubble">我用 1 分钟讲给你听</text>
				<button class="play-button xicheng-primary-action" :disabled="blockedBySafety" @click="askXiaojing(playQuestion)">
					<text class="play-dot">▶</text>
					<text>播放讲解</text>
				</button>
			</view>
		</view>

		<view class="poi-action-grid">
			<button class="poi-action-card xicheng-paper-card" :disabled="blockedBySafety" @click="askXiaojing()">
				<text class="action-icon">问</text>
				<view>
					<text class="action-title">问问小京</text>
					<text class="action-desc">有问题随时问</text>
				</view>
				<text class="action-arrow">›</text>
			</button>
			<button class="poi-action-card xicheng-paper-card" :disabled="blockedBySafety" @click="addPoiToTravelogue">
				<text class="action-icon">记</text>
				<view>
					<text class="action-title">加入游记</text>
					<text class="action-desc">记录你的西城故事</text>
				</view>
				<text class="action-arrow">›</text>
			</button>
		</view>

		<view class="insight-grid">
			<view
				v-for="card in insightCards"
				:key="card.title"
				class="insight-card xicheng-paper-card"
				@click="askXiaojing(card.question)"
			>
				<image class="insight-image" :src="card.image" mode="aspectFill" />
				<text class="insight-title">{{ card.title }}</text>
				<text class="insight-desc">{{ card.desc }}</text>
			</view>
		</view>

		<view class="source-list-card xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<text class="section-title">已审核来源</text>
				<text class="section-badge">{{ sourceList.length }} 条</text>
			</view>
			<view
				v-for="(source, index) in sourceList"
				:key="source.id || source.title || index"
				class="source-row"
			>
				<text class="source-title">{{ source.title || source.sourceTitle || '西城官方资料' }}</text>
				<text class="source-desc">{{ source.excerpt || source.summary || '官方 POI 审核来源' }}</text>
			</view>
		</view>

		<view v-if="nearbyRecommendation" class="nearby-card xicheng-paper-card">
			<view>
				<text class="nearby-label">附近推荐</text>
				<text class="nearby-title">{{ nearbyRecommendation.poiName }}</text>
				<text class="nearby-desc">{{ nearbyRecommendation.summary }}</text>
			</view>
			<button class="nearby-button xicheng-primary-action" @click="openNearbyPoi">›</button>
		</view>
	</view>
</template>

<script>
import {
	XICHENG_OFFICIAL_POIS,
	XICHENG_RECOMMENDED_ROUTES,
	XICHENG_REGION_CONFIG,
	createXichengPoiSuggestedQuestions
} from '@/config/regions/xicheng.js'
import { createXichengOfficialPoiSources } from '@/request/xunjing/officialPoi.js'
import { decodeXichengRouteValue, createXichengRouteOutputValue } from '@/request/xunjing/routeParams.js'
import { isXichengUnsafeSafetyStatus, normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'

const XICHENG_HOME_ROUTE = '/pages/xicheng/home/home'
const encodeRouteValue = (value = '') => createXichengRouteOutputValue(value, { platform: process.env.UNI_PLATFORM })

const normalizePoiRouteOptions = (options = {}) => ({
	poiCode: decodeXichengRouteValue(options.poiCode),
	poiName: decodeXichengRouteValue(options.poiName),
	regionCode: decodeXichengRouteValue(options.regionCode),
	packageCode: decodeXichengRouteValue(options.packageCode),
	sceneCode: decodeXichengRouteValue(options.sceneCode),
	sourceChannel: decodeXichengRouteValue(options.sourceChannel),
	companionName: decodeXichengRouteValue(options.companionName),
	safetyStatus: normalizeXichengSafetyStatus(decodeXichengRouteValue(options.safetyStatus))
})

const resolveOfficialPoi = (routeOptions = {}) => {
	const poiCode = String(routeOptions.poiCode || '').trim().toLowerCase()
	if (poiCode) {
		const byCode = XICHENG_OFFICIAL_POIS.find(poi => String(poi.poiCode || '').toLowerCase() === poiCode)
		if (byCode) return byCode
	}
	const poiName = String(routeOptions.poiName || '').trim()
	if (poiName) {
		const byName = XICHENG_OFFICIAL_POIS.find(poi => {
			const aliases = Array.isArray(poi.aliases) ? poi.aliases : []
			return poi.poiName === poiName || aliases.includes(poiName)
		})
		if (byName) return byName
	}
	return XICHENG_OFFICIAL_POIS[0]
}

const findRouteForPoi = (poiCode = '') => XICHENG_RECOMMENDED_ROUTES.find(route => {
	const stops = Array.isArray(route.stops) ? route.stops : []
	return stops.some(stop => stop.poiCode === poiCode)
}) || XICHENG_RECOMMENDED_ROUTES[0]

export default {
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			routeOptions: normalizePoiRouteOptions(),
			activePoi: resolveOfficialPoi(),
			sourceList: []
		}
	},
	computed: {
		blockedBySafety() {
			return isXichengUnsafeSafetyStatus(normalizeXichengSafetyStatus(this.routeOptions.safetyStatus))
		},
		poiHeroImage() {
			const route = findRouteForPoi(this.activePoi.poiCode)
			const thumbnails = this.region.visualAssets && this.region.visualAssets.routeThumbnails
				? this.region.visualAssets.routeThumbnails
				: {}
			return thumbnails[route.routeCode] || this.region.visualAssets.heroLandmark || ''
		},
		playQuestion() {
			return `讲讲${this.activePoi.poiName}的历史故事`
		},
		insightCards() {
			return [
				{
					title: '建筑看点',
					desc: `${this.activePoi.poiName}的空间格局与细部观察`,
					question: `讲讲${this.activePoi.poiName}的建筑看点`,
					image: this.poiHeroImage
				},
				{
					title: '历史故事',
					desc: this.activePoi.summary || '从历史沿革看西城文化变迁',
					question: `讲讲${this.activePoi.poiName}的历史故事`,
					image: this.region.visualAssets.heroLandmark
				},
				{
					title: '周边漫步',
					desc: '结合附近文化点生成可走路线',
					question: `从${this.activePoi.poiName}出发推荐一条亲子研学路线`,
					image: this.poiHeroImage
				}
			]
		},
		nearbyRecommendation() {
			const route = findRouteForPoi(this.activePoi.poiCode)
			const stops = Array.isArray(route.stops) ? route.stops : []
			return stops.find(stop => stop.poiCode !== this.activePoi.poiCode) || null
		}
	},
	onLoad(options = {}) {
		this.routeOptions = normalizePoiRouteOptions(options)
		this.activePoi = resolveOfficialPoi(this.routeOptions)
		this.sourceList = this.createPoiSources()
	},
	methods: {
		goBack() {
			const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
			if (!Array.isArray(pages) || pages.length <= 1) {
				uni.reLaunch({ url: XICHENG_HOME_ROUTE })
				return
			}
			uni.navigateBack({
				delta: 1,
				fail: () => uni.reLaunch({ url: XICHENG_HOME_ROUTE })
			})
		},
		createPoiSources() {
			if (this.blockedBySafety) return []
			return createXichengOfficialPoiSources(this.activePoi)
		},
		createPoiMaterial() {
			return {
				type: 'poi-guide',
				regionCode: this.routeOptions.regionCode || this.region.regionCode,
				packageCode: this.routeOptions.packageCode || this.region.packageCode,
				sceneCode: this.routeOptions.sceneCode || this.region.sceneCode,
				sourceChannel: this.routeOptions.sourceChannel || this.region.sourceChannel,
				poiCode: this.activePoi.poiCode,
				poiName: this.activePoi.poiName,
				sourceLabel: 'POI 详情',
				sources: this.sourceList,
				sourceCount: this.sourceList.length,
				reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
				publishStatus: 'private',
				capturedAt: new Date().toISOString()
			}
		},
		persistPoiGuideContext(question = '') {
			uni.setStorageSync(this.region.storageKey, {
				regionCode: this.routeOptions.regionCode || this.region.regionCode,
				packageCode: this.routeOptions.packageCode || this.region.packageCode,
				sceneCode: this.region.aiSceneCode || this.routeOptions.sceneCode || this.region.sceneCode,
				sourceChannel: this.routeOptions.sourceChannel || this.region.sourceChannel,
				poiCode: this.activePoi.poiCode,
				poiName: this.activePoi.poiName,
				confidence: 1,
				sourceLabel: 'POI 详情',
				officialPoiMatched: true,
				sources: this.sourceList,
				sourceCount: this.sourceList.length,
				suggestedQuestions: createXichengPoiSuggestedQuestions(this.activePoi.poiName),
				safetyStatus: 'PASSED',
				capturedAt: new Date().toISOString()
			})
		},
		askXiaojing(question = '') {
			if (this.blockedBySafety) {
				uni.showToast({
					title: '无已审核来源，不能回答',
					icon: 'none'
				})
				return
			}
			const prompt = question || this.playQuestion
			this.persistPoiGuideContext(prompt)
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?question=${encodeRouteValue(prompt)}&regionCode=${encodeRouteValue(this.routeOptions.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(this.routeOptions.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.aiSceneCode || this.routeOptions.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.routeOptions.sourceChannel || this.region.sourceChannel)}&poiCode=${encodeRouteValue(this.activePoi.poiCode || '')}&poiName=${encodeRouteValue(this.activePoi.poiName || '')}&safetyStatus=${encodeRouteValue('PASSED')}&companionName=${encodeRouteValue(this.routeOptions.companionName || this.region.companionName)}`
			})
		},
		addPoiToTravelogue() {
			if (this.blockedBySafety) {
				uni.showToast({
					title: '无已审核来源，不能加入游记',
					icon: 'none'
				})
				return
			}
			const existingMaterials = uni.getStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey)
			const materials = Array.isArray(existingMaterials) ? existingMaterials : []
			const material = this.createPoiMaterial()
			uni.setStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey, [
				material,
				...materials
			].slice(0, 80))
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?mode=poi&poiCode=${encodeRouteValue(this.activePoi.poiCode || '')}&poiName=${encodeRouteValue(this.activePoi.poiName || '')}&regionCode=${encodeRouteValue(this.routeOptions.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(this.routeOptions.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(this.routeOptions.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.routeOptions.sourceChannel || this.region.sourceChannel)}&companionName=${encodeRouteValue(this.routeOptions.companionName || this.region.companionName)}`
			})
		},
		openNearbyPoi() {
			const nearby = this.nearbyRecommendation
			if (!nearby) return
			uni.redirectTo({
				url: `/pages/xicheng/poi/poi?poiCode=${encodeRouteValue(nearby.poiCode || '')}&poiName=${encodeRouteValue(nearby.poiName || '')}&regionCode=${encodeRouteValue(this.routeOptions.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(this.routeOptions.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(this.routeOptions.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.routeOptions.sourceChannel || this.region.sourceChannel)}&companionName=${encodeRouteValue(this.routeOptions.companionName || this.region.companionName)}&safetyStatus=${encodeRouteValue('PASSED')}`
			})
		}
	}
}
</script>

<style scoped>
.xicheng-poi-detail {
	min-height: 100vh;
	padding: 34rpx 28rpx 56rpx;
	box-sizing: border-box;
	color: #102F29;
}

.poi-nav {
	display: grid;
	grid-template-columns: 76rpx 1fr 76rpx;
	align-items: center;
	gap: 18rpx;
	margin-bottom: 24rpx;
}

.nav-icon {
	width: 76rpx;
	height: 76rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.9);
	color: #173F35;
	font-size: 34rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	box-shadow: 0 12rpx 30rpx rgba(35, 42, 34, 0.08);
}

.share-icon {
	font-size: 25rpx;
	font-weight: 700;
}

.nav-title {
	text-align: center;
	font-size: 36rpx;
	font-weight: 700;
	color: #173F35;
}

.poi-hero {
	position: relative;
	height: 430rpx;
	border-radius: 34rpx;
	overflow: hidden;
}

.poi-hero-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.identified-pill,
.image-count {
	position: absolute;
	display: flex;
	align-items: center;
	background: rgba(23, 63, 53, 0.92);
	color: #FFF9EC;
}

.identified-pill {
	left: 24rpx;
	top: 24rpx;
	gap: 10rpx;
	padding: 12rpx 20rpx;
	border-radius: 999rpx;
	font-size: 25rpx;
}

.identified-dot {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32rpx;
	height: 32rpx;
	border-radius: 999rpx;
	background: rgba(255, 249, 236, 0.92);
	color: #173F35;
	font-size: 22rpx;
}

.image-count {
	right: 24rpx;
	bottom: 24rpx;
	padding: 10rpx 18rpx;
	border-radius: 20rpx;
	font-size: 24rpx;
}

.poi-title-block {
	padding: 34rpx 14rpx 24rpx;
}

.poi-title,
.poi-subtitle {
	display: block;
}

.poi-title {
	font-size: 56rpx;
	line-height: 1.18;
	font-weight: 700;
	color: #102F29;
}

.poi-subtitle {
	margin-top: 14rpx;
	font-size: 27rpx;
	line-height: 1.5;
	color: #746F68;
}

.xiaojing-player {
	display: grid;
	grid-template-columns: 178rpx 1fr;
	align-items: end;
	gap: 18rpx;
	padding: 24rpx;
	border-radius: 34rpx;
}

.xiaojing-avatar {
	width: 178rpx;
	height: 210rpx;
}

.player-copy {
	min-width: 0;
}

.player-bubble {
	display: inline-flex;
	max-width: 100%;
	margin-bottom: 20rpx;
	padding: 16rpx 26rpx;
	border-radius: 999rpx;
	background: #FFFDF8;
	color: #102F29;
	font-size: 27rpx;
	box-sizing: border-box;
}

.play-button {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 18rpx;
	width: 100%;
	min-height: 96rpx;
	border-radius: 999rpx;
	font-size: 33rpx;
	font-weight: 700;
}

.play-dot {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 56rpx;
	height: 56rpx;
	border-radius: 999rpx;
	background: rgba(255, 249, 236, 0.95);
	color: #173F35;
	font-size: 24rpx;
}

.poi-action-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20rpx;
	margin-top: 26rpx;
}

.poi-action-card {
	display: grid;
	grid-template-columns: 56rpx 1fr 24rpx;
	align-items: center;
	gap: 14rpx;
	min-height: 126rpx;
	padding: 20rpx;
	border-radius: 28rpx;
	text-align: left;
}

.action-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 56rpx;
	height: 56rpx;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF9EC;
	font-size: 24rpx;
	font-weight: 700;
}

.action-title,
.action-desc {
	display: block;
}

.action-title {
	font-size: 29rpx;
	font-weight: 700;
	color: #102F29;
}

.action-desc {
	margin-top: 6rpx;
	font-size: 22rpx;
	line-height: 1.35;
	color: #746F68;
}

.action-arrow {
	font-size: 36rpx;
	color: #8A6B3D;
}

.insight-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 18rpx;
	margin-top: 28rpx;
}

.insight-card {
	overflow: hidden;
	border-radius: 26rpx;
}

.insight-image {
	width: 100%;
	height: 168rpx;
	object-fit: cover;
	background: #E6EAE2;
}

.insight-title,
.insight-desc {
	display: block;
	padding: 0 18rpx;
}

.insight-title {
	margin-top: 18rpx;
	font-size: 29rpx;
	font-weight: 700;
	color: #102F29;
}

.insight-desc {
	margin: 10rpx 0 20rpx;
	font-size: 22rpx;
	line-height: 1.45;
	color: #746F68;
}

.source-list-card,
.nearby-card {
	margin-top: 28rpx;
	padding: 26rpx;
	border-radius: 32rpx;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	margin-bottom: 18rpx;
}

.section-title {
	font-size: 31rpx;
	font-weight: 700;
	color: #102F29;
}

.section-badge {
	font-size: 23rpx;
	color: #8A6B3D;
}

.source-row {
	padding: 18rpx 0;
	border-top: 1rpx solid rgba(23, 63, 53, 0.1);
}

.source-title,
.source-desc,
.nearby-label,
.nearby-title,
.nearby-desc {
	display: block;
}

.source-title {
	font-size: 27rpx;
	font-weight: 700;
	color: #102F29;
}

.source-desc,
.nearby-desc {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.5;
	color: #746F68;
}

.nearby-card {
	display: grid;
	grid-template-columns: 1fr 84rpx;
	align-items: center;
	gap: 18rpx;
	background:
		linear-gradient(100deg, rgba(255, 253, 248, 0.96) 0%, rgba(255, 253, 248, 0.8) 66%, rgba(23, 63, 53, 0.12) 100%);
}

.nearby-label {
	font-size: 24rpx;
	color: #8A6B3D;
}

.nearby-title {
	margin-top: 8rpx;
	font-size: 35rpx;
	font-weight: 700;
	color: #102F29;
}

.nearby-button {
	width: 84rpx;
	height: 84rpx;
	border-radius: 999rpx;
	font-size: 46rpx;
	padding: 0;
}
</style>
