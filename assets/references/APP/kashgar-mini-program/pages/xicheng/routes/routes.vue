<template>
	<view class="xicheng-routes xicheng-designed-page xicheng-bottom-safe">
		<view class="routes-nav">
			<button class="nav-icon" @click="goBack">‹</button>
			<text class="nav-title">路线推荐</text>
			<button class="nav-icon nav-icon-map" @click="refreshRecommendation">
				<view class="map-icon"></view>
			</button>
		</view>

		<view class="routes-hero xicheng-paper-card">
			<image class="routes-companion" :src="region.companionAvatar" mode="aspectFit" />
			<view class="routes-hero-copy">
				<text class="hero-kicker">{{ region.cityName }}</text>
				<text class="hero-title">路线推荐</text>
				<view class="hero-bubble xicheng-companion-bubble">
					<text>我按时间和兴趣帮你选路线</text>
				</view>
			</view>
			<image
				v-if="region.visualAssets && region.visualAssets.heroLandmark"
				class="routes-hero-bg"
				:src="region.visualAssets.heroLandmark"
				mode="aspectFill"
			/>
		</view>

		<view class="route-filter-bar">
			<text
				v-for="filter in routeRecommendationFilters"
				:key="filter.key"
				class="route-filter-chip"
				:class="{ 'route-filter-chip-active': activeRouteFilter === filter.key }"
				@click="activeRouteFilter = filter.key"
			>
				{{ filter.title }}
			</text>
		</view>

		<view class="route-list">
			<view
				v-for="route in filteredRoutes"
				:key="route.routeCode"
				class="route-list-card xicheng-paper-card"
			>
				<image
					v-if="getRouteThumbnail(route)"
					class="route-cover"
					:src="getRouteThumbnail(route)"
					mode="aspectFill"
				/>
				<view class="route-card-copy">
					<text class="route-title">{{ getDisplayRouteTitle(route) }}</text>
					<text class="route-desc">{{ getRouteKeywordLine(route) }}</text>
					<view class="route-meta">
						<text>{{ route.durationText }}</text>
						<text>{{ route.distanceText || '可步行' }}</text>
						<text>{{ route.passportTaskCount || getRouteStopCount(route) }}个景点</text>
					</view>
					<view class="route-actions">
						<button class="route-button route-button-main xicheng-primary-action" @click="openRouteDetail(route)">查看路线</button>
						<button class="route-button route-button-secondary xicheng-secondary-action" @click="startRoutePassport(route)">路线护照</button>
						<button class="route-button route-button-secondary xicheng-secondary-action" @click="generateRouteTravelogue(route)">游记</button>
					</view>
				</view>
			</view>
		</view>

		<view class="rerank-card xicheng-paper-card" @click="refreshRecommendation">
			<text class="rerank-icon">↻</text>
			<text class="rerank-title">让小京重新推荐</text>
		</view>
	</view>
</template>

<script>
import {
	XICHENG_RECOMMENDED_ROUTES,
	XICHENG_REGION_CONFIG,
	XICHENG_ROUTE_RECOMMENDATION_FILTERS
} from '@/config/regions/xicheng.js'
import { createXichengOfficialPoiSources } from '@/request/xunjing/officialPoi.js'
import { createXichengRouteOutputValue, decodeXichengRouteValue } from '@/request/xunjing/routeParams.js'

const XICHENG_HOME_ROUTE = '/pages/xicheng/home/home'
const encodeRouteValue = (value = '') => createXichengRouteOutputValue(value, { platform: process.env.UNI_PLATFORM })
const decodeRouteValue = decodeXichengRouteValue

const normalizeRouteContext = (options = {}) => ({
	regionCode: decodeRouteValue(options.regionCode) || XICHENG_REGION_CONFIG.regionCode,
	packageCode: decodeRouteValue(options.packageCode) || XICHENG_REGION_CONFIG.packageCode,
	sceneCode: decodeRouteValue(options.sceneCode) || XICHENG_REGION_CONFIG.sceneCode,
	sourceChannel: decodeRouteValue(options.sourceChannel) || XICHENG_REGION_CONFIG.sourceChannel,
	companionName: decodeRouteValue(options.companionName) || XICHENG_REGION_CONFIG.companionName
})

export default {
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			routeContext: normalizeRouteContext(),
			recommendedRoutes: XICHENG_RECOMMENDED_ROUTES,
			routeRecommendationFilters: XICHENG_ROUTE_RECOMMENDATION_FILTERS,
			activeRouteFilter: XICHENG_ROUTE_RECOMMENDATION_FILTERS[0] ? XICHENG_ROUTE_RECOMMENDATION_FILTERS[0].key : ''
		}
	},
	computed: {
		filteredRoutes() {
			const filteredRoutes = this.recommendedRoutes.filter(route => {
				const filterKeys = Array.isArray(route.recommendedFilterKeys) ? route.recommendedFilterKeys : []
				return filterKeys.includes(this.activeRouteFilter)
			})
			return filteredRoutes.length > 0 ? filteredRoutes : this.recommendedRoutes
		}
	},
	onLoad(options = {}) {
		this.routeContext = normalizeRouteContext(options)
	},
	methods: {
		goBack() {
			const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
			if (!Array.isArray(pages) || pages.length <= 1) {
				uni.reLaunch({
					url: XICHENG_HOME_ROUTE
				})
				return
			}
			uni.navigateBack({
				delta: 1,
				fail: () => uni.reLaunch({
					url: XICHENG_HOME_ROUTE
				})
			})
		},
		refreshRecommendation() {
			const currentIndex = this.routeRecommendationFilters.findIndex(filter => filter.key === this.activeRouteFilter)
			const nextIndex = currentIndex >= 0
				? (currentIndex + 1) % this.routeRecommendationFilters.length
				: 0
			const nextFilter = this.routeRecommendationFilters[nextIndex]
			this.activeRouteFilter = nextFilter ? nextFilter.key : this.activeRouteFilter
		},
		getRouteThumbnail(route = {}) {
			const thumbnails = this.region.visualAssets && this.region.visualAssets.routeThumbnails
				? this.region.visualAssets.routeThumbnails
				: {}
			return thumbnails[route.routeCode] || this.region.visualAssets.heroLandmark || ''
		},
		getRouteStopCount(route = {}) {
			return Array.isArray(route.stops) ? route.stops.length : 0
		},
		getDisplayRouteTitle(route = {}) {
			if (route.routeCode === 'baitasi-imperial-shichahai') return '白塔寺文化线'
			if (route.routeCode === 'beihai-shichahai-waterfront') return '什刹海漫步线'
			if (route.routeCode === 'dashilar-old-brand-walk') return '胡同烟火线'
			return route.title || '西城 Citywalk'
		},
		getRouteKeywordLine(route = {}) {
			const keywords = Array.isArray(route.keywords) ? route.keywords : []
			return keywords.length > 0 ? keywords.join(' · ') : route.summary || route.theme || '西城官方路线'
		},
		openRouteDetail(route = {}) {
			uni.navigateTo({
				url: `/pages/xicheng/route-detail/route-detail?routeCode=${encodeRouteValue(route.routeCode || '')}&regionCode=${encodeRouteValue(this.routeContext.regionCode)}&packageCode=${encodeRouteValue(this.routeContext.packageCode)}&sceneCode=${encodeRouteValue(this.routeContext.sceneCode)}&sourceChannel=${encodeRouteValue(this.routeContext.sourceChannel)}&companionName=${encodeRouteValue(this.routeContext.companionName)}`
			})
		},
		persistRoutePassport(route = {}) {
			const updatedAt = new Date().toISOString()
			const stops = Array.isArray(route.stops) ? route.stops.map(stop => ({ ...stop })) : []
			const routePayload = {
				...route,
				stops,
				regionCode: this.routeContext.regionCode,
				packageCode: this.routeContext.packageCode,
				sceneCode: this.routeContext.sceneCode,
				sourceChannel: this.routeContext.sourceChannel,
				routeSource: 'route-list',
				sourceLabel: '官方路线列表',
				updatedAt
			}
			const existingMaterials = uni.getStorageSync(this.region.materialsStorageKey)
			const materials = Array.isArray(existingMaterials) ? existingMaterials : []
			const routeMaterials = stops.map(stop => {
				const sources = createXichengOfficialPoiSources(stop)
				return {
					type: 'official-route-poi',
					regionCode: this.routeContext.regionCode,
					packageCode: this.routeContext.packageCode,
					sceneCode: this.routeContext.sceneCode,
					sourceChannel: this.routeContext.sourceChannel,
					poiCode: stop.poiCode,
					poiName: stop.poiName,
					routeCode: route.routeCode,
					routeTitle: route.title,
					sourceLabel: '官方路线列表',
					sources,
					sourceCount: sources.length,
					reviewStatus: this.region.reviewStatus.pending,
					publishStatus: 'private',
					capturedAt: updatedAt
				}
			})
			uni.setStorageSync(this.region.inspirationStorageKey, routePayload)
			uni.setStorageSync(this.region.materialsStorageKey, [
				...routeMaterials,
				...materials
			].slice(0, 80))
		},
		startRoutePassport(route = {}) {
			this.persistRoutePassport(route)
			uni.showToast({
				icon: 'none',
				title: '已加入路线护照'
			})
		},
		generateRouteTravelogue(route = {}) {
			this.persistRoutePassport(route)
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?mode=route&regionCode=${encodeRouteValue(this.routeContext.regionCode)}&packageCode=${encodeRouteValue(this.routeContext.packageCode)}&sceneCode=${encodeRouteValue(this.routeContext.sceneCode)}&sourceChannel=${encodeRouteValue(this.routeContext.sourceChannel)}&routeCode=${encodeRouteValue(route.routeCode || '')}&companionName=${encodeRouteValue(this.routeContext.companionName)}`
			})
		}
	}
}
</script>

<style scoped>
.xicheng-routes {
	min-height: 100vh;
	padding: 34rpx 28rpx 170rpx;
	box-sizing: border-box;
	color: #102F29;
}

.routes-nav {
	display: grid;
	grid-template-columns: 76rpx 1fr 76rpx;
	align-items: center;
	gap: 18rpx;
	margin-bottom: 22rpx;
}

.nav-icon {
	width: 76rpx;
	height: 76rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.9);
	color: #173F35;
	font-size: 42rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	box-shadow: 0 12rpx 28rpx rgba(26, 48, 39, 0.08);
}

.nav-title {
	text-align: center;
	font-size: 40rpx;
	font-weight: 800;
	color: #102F29;
}

.map-icon {
	width: 34rpx;
	height: 30rpx;
	border: 4rpx solid currentColor;
	border-top: 0;
	transform: skewY(-12deg);
}

.routes-hero {
	position: relative;
	overflow: hidden;
	min-height: 330rpx;
	display: flex;
	align-items: flex-end;
	gap: 22rpx;
	padding: 28rpx 30rpx;
	background:
		linear-gradient(120deg, rgba(250, 244, 232, 0.97), rgba(240, 246, 238, 0.9));
}

.routes-hero-bg {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	opacity: 0.18;
}

.routes-companion,
.routes-hero-copy {
	position: relative;
	z-index: 1;
}

.routes-companion {
	width: 214rpx;
	height: 260rpx;
	flex: 0 0 214rpx;
}

.routes-hero-copy {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
	min-width: 0;
}

.hero-kicker {
	font-size: 22rpx;
	color: #B8812B;
	font-weight: 700;
}

.hero-title {
	font-size: 44rpx;
	line-height: 1.1;
	font-weight: 800;
	color: #102F29;
}

.hero-bubble {
	max-width: 420rpx;
	padding: 20rpx 24rpx;
	font-size: 28rpx;
	color: #102F29;
}

.route-filter-bar {
	display: flex;
	gap: 18rpx;
	margin: 26rpx 0;
	overflow-x: auto;
	padding-bottom: 2rpx;
}

.route-filter-chip {
	flex: 0 0 auto;
	min-width: 132rpx;
	padding: 20rpx 28rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.9);
	color: rgba(16, 47, 41, 0.68);
	border: 1rpx solid rgba(184, 129, 43, 0.14);
	text-align: center;
	font-size: 28rpx;
	font-weight: 700;
	box-shadow: 0 10rpx 24rpx rgba(26, 48, 39, 0.06);
}

.route-filter-chip-active {
	background: linear-gradient(135deg, #173F35, #0E2E28);
	color: #FFF7E6;
	box-shadow: 0 16rpx 34rpx rgba(14, 46, 40, 0.18);
}

.route-list {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.route-list-card {
	display: grid;
	grid-template-columns: 250rpx minmax(0, 1fr);
	gap: 26rpx;
	padding: 24rpx;
	align-items: stretch;
}

.route-cover {
	width: 250rpx;
	height: 270rpx;
	border-radius: 24rpx;
	object-fit: cover;
	background: rgba(16, 47, 41, 0.08);
}

.route-card-copy {
	min-width: 0;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: 14rpx;
}

.route-title,
.route-desc {
	display: block;
}

.route-title {
	font-size: 36rpx;
	font-weight: 800;
	color: #102F29;
	line-height: 1.2;
}

.route-desc {
	font-size: 25rpx;
	line-height: 1.45;
	color: rgba(16, 47, 41, 0.62);
}

.route-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx 16rpx;
	padding-top: 14rpx;
	border-top: 1rpx dashed rgba(184, 129, 43, 0.22);
	color: rgba(75, 60, 43, 0.76);
	font-size: 23rpx;
}

.route-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12rpx;
}

.route-button {
	min-width: 0;
	height: 68rpx;
	line-height: 68rpx;
	border-radius: 20rpx;
	font-size: 25rpx;
	font-weight: 700;
	padding: 0 12rpx;
}

.route-button-main {
	grid-column: 1 / -1;
}

.route-button-secondary {
	background: rgba(255, 252, 246, 0.9);
}

.rerank-card {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16rpx;
	margin-top: 28rpx;
	padding: 24rpx;
}

.rerank-icon {
	font-size: 34rpx;
	color: #B8812B;
}

.rerank-title {
	font-size: 30rpx;
	font-weight: 800;
	color: #102F29;
}
</style>
