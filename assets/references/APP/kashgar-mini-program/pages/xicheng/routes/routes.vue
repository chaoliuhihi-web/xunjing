<template>
	<view class="xicheng-routes xicheng-designed-page xicheng-bottom-safe">
		<view class="routes-nav">
			<button class="nav-icon" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="24" />
			</button>
			<text class="nav-title">文旅地图</text>
			<button class="nav-icon nav-icon-map" @click="refreshRecommendation">
				<xicheng-icon name="layer" variant="plain" :size="23" />
			</button>
		</view>

		<view class="routes-hero xicheng-paper-card">
			<image class="routes-companion" :src="region.companionAvatar" mode="aspectFit" />
			<view class="routes-hero-copy">
				<text class="hero-kicker">{{ region.cityName }}</text>
				<text class="hero-title">西城文旅地图</text>
				<view class="hero-bubble xicheng-companion-bubble">
					<text>看官方 POI、路线推荐和 Citywalk 记录</text>
				</view>
			</view>
			<image
				v-if="region.visualAssets && region.visualAssets.heroLandmark"
				class="routes-hero-bg"
				:src="region.visualAssets.heroLandmark"
				mode="aspectFill"
			/>
		</view>

		<view class="culture-map-card xicheng-paper-card">
			<view class="culture-map-head">
				<view>
					<text class="culture-map-kicker">文旅地图</text>
					<text class="culture-map-title">{{ getDisplayRouteTitle(mapPreviewRoute) }}</text>
				</view>
				<text class="culture-map-pill">{{ mapPreviewStops.length }} 个 POI</text>
			</view>
			<view class="culture-map-canvas">
				<view class="culture-map-water"></view>
				<view class="culture-map-street culture-map-street-one"></view>
				<view class="culture-map-street culture-map-street-two"></view>
				<view class="culture-map-route-line"></view>
				<view
					v-for="(stop, index) in mapPreviewStops"
					:key="stop.poiCode || `${stop.poiName}-${index}`"
					class="culture-map-pin"
					:style="getMapPinStyle(index)"
				>
					<text>{{ index + 1 }}</text>
				</view>
			</view>
			<view class="culture-map-stop-list">
				<view
					v-for="(stop, index) in mapPreviewStops"
					:key="`stop-${stop.poiCode || stop.poiName}-${index}`"
					class="culture-map-stop"
				>
					<text class="culture-map-stop-index">{{ index + 1 }}</text>
					<text class="culture-map-stop-name">{{ stop.poiName }}</text>
				</view>
			</view>
		</view>

		<view id="xicheng-route-recommendation-bottom" class="route-recommendation-panel">
			<view class="route-recommendation-head">
				<view>
					<text class="route-panel-kicker">路线推荐</text>
					<text class="route-panel-title">官方 Citywalk</text>
				</view>
				<button class="copy-homework-button xicheng-secondary-action" @click="openInspirationImport">一键抄作业</button>
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
		</view>

		<view class="rerank-card xicheng-paper-card" @click="refreshRecommendation">
			<xicheng-icon class="rerank-icon" name="refresh" variant="plain" :size="23" />
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
import { mergeXichengOfficialRouteMaterials } from '@/request/xunjing/routeMaterials.js'
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
			activeRouteFilter: XICHENG_ROUTE_RECOMMENDATION_FILTERS[0] ? XICHENG_ROUTE_RECOMMENDATION_FILTERS[0].key : '',
			inspirationRoute: null
		}
	},
	computed: {
		filteredRoutes() {
			const filteredRoutes = this.recommendedRoutes.filter(route => {
				const filterKeys = Array.isArray(route.recommendedFilterKeys) ? route.recommendedFilterKeys : []
				return filterKeys.includes(this.activeRouteFilter)
			})
			return filteredRoutes.length > 0 ? filteredRoutes : this.recommendedRoutes
		},
		mapPreviewRoute() {
			const importedRoute = this.inspirationRoute && Array.isArray(this.inspirationRoute.stops) && this.inspirationRoute.stops.length > 0
				? this.inspirationRoute
				: null
			return importedRoute || this.filteredRoutes[0] || this.recommendedRoutes[0] || {}
		},
		mapPreviewStops() {
			const stops = Array.isArray(this.mapPreviewRoute.stops) ? this.mapPreviewRoute.stops : []
			return stops.slice(0, 5)
		}
	},
	onLoad(options = {}) {
		this.routeContext = normalizeRouteContext(options)
	},
	onShow() {
		this.loadInspirationRoute()
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
		loadInspirationRoute() {
			const cachedRoute = uni.getStorageSync(this.region.inspirationStorageKey)
			this.inspirationRoute = cachedRoute && Array.isArray(cachedRoute.stops) && cachedRoute.stops.length > 0
				? cachedRoute
				: null
		},
		getMapPinStyle(index = 0) {
			const pinPositions = [
				{ left: 18, top: 58 },
				{ left: 34, top: 36 },
				{ left: 52, top: 48 },
				{ left: 66, top: 26 },
				{ left: 78, top: 54 }
			]
			const position = pinPositions[index % pinPositions.length]
			return `left:${position.left}%;top:${position.top}%;`
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
					safetyStatus: 'PASSED',
					reviewStatus: this.region.reviewStatus.pending,
					publishStatus: 'private',
					capturedAt: updatedAt
				}
			})
			uni.setStorageSync(this.region.inspirationStorageKey, routePayload)
			uni.setStorageSync(this.region.materialsStorageKey, mergeXichengOfficialRouteMaterials(routeMaterials, materials).slice(0, 80))
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
		},
		openInspirationImport() {
			uni.navigateTo({
				url: `/pages/xicheng/inspiration/inspiration?target=map&regionCode=${encodeRouteValue(this.routeContext.regionCode)}&packageCode=${encodeRouteValue(this.routeContext.packageCode)}&sceneCode=${encodeRouteValue(this.routeContext.sceneCode)}&sourceChannel=${encodeRouteValue(this.routeContext.sourceChannel)}&companionName=${encodeRouteValue(this.routeContext.companionName)}`
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

.culture-map-card {
	margin-top: 24rpx;
	padding: 26rpx;
	border-radius: 34rpx;
	overflow: hidden;
}

.culture-map-head,
.route-recommendation-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}

.culture-map-kicker,
.route-panel-kicker {
	display: block;
	font-size: 22rpx;
	line-height: 1.35;
	font-weight: 700;
	color: #B8812B;
}

.culture-map-title,
.route-panel-title {
	display: block;
	margin-top: 8rpx;
	font-size: 36rpx;
	line-height: 1.2;
	font-weight: 800;
	color: #102F29;
}

.culture-map-pill {
	flex-shrink: 0;
	padding: 12rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.08);
	color: #173F35;
	font-size: 22rpx;
	font-weight: 800;
}

.culture-map-canvas {
	position: relative;
	height: 390rpx;
	margin-top: 24rpx;
	border-radius: 30rpx;
	overflow: hidden;
	background:
		linear-gradient(135deg, rgba(232, 242, 232, 0.92), rgba(248, 241, 226, 0.94));
	border: 1rpx solid rgba(181, 148, 94, 0.18);
	box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.42);
}

.culture-map-water {
	position: absolute;
	right: -70rpx;
	top: -40rpx;
	width: 260rpx;
	height: 520rpx;
	border-radius: 999rpx;
	background: rgba(129, 182, 187, 0.34);
	transform: rotate(18deg);
}

.culture-map-street {
	position: absolute;
	left: -30rpx;
	width: 820rpx;
	height: 20rpx;
	border-radius: 999rpx;
	background: rgba(255, 253, 248, 0.76);
	box-shadow: 0 8rpx 18rpx rgba(16, 47, 41, 0.06);
}

.culture-map-street-one {
	top: 150rpx;
	transform: rotate(-12deg);
}

.culture-map-street-two {
	top: 260rpx;
	transform: rotate(9deg);
}

.culture-map-route-line {
	position: absolute;
	left: 20%;
	top: 56%;
	width: 62%;
	height: 12rpx;
	border-radius: 999rpx;
	background: linear-gradient(90deg, #173F35, #B8812B);
	transform: rotate(-13deg);
	box-shadow: 0 10rpx 22rpx rgba(16, 47, 41, 0.16);
}

.culture-map-pin {
	position: absolute;
	z-index: 2;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48rpx;
	height: 48rpx;
	border-radius: 999rpx 999rpx 999rpx 8rpx;
	background: #173F35;
	color: #FFF9EC;
	font-size: 22rpx;
	font-weight: 900;
	transform: translate(-50%, -50%) rotate(-45deg);
	box-shadow: 0 12rpx 24rpx rgba(16, 47, 41, 0.22);
}

.culture-map-pin text {
	transform: rotate(45deg);
}

.culture-map-stop-list {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 18rpx;
}

.culture-map-stop {
	display: flex;
	align-items: center;
	gap: 10rpx;
	min-width: 0;
	padding: 14rpx 16rpx;
	border-radius: 18rpx;
	background: rgba(255, 252, 246, 0.76);
}

.culture-map-stop-index {
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 34rpx;
	width: 34rpx;
	height: 34rpx;
	border-radius: 999rpx;
	background: #B8812B;
	color: #FFF9EC;
	font-size: 20rpx;
	font-weight: 800;
}

.culture-map-stop-name {
	min-width: 0;
	font-size: 24rpx;
	line-height: 1.35;
	font-weight: 700;
	color: #102F29;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.route-recommendation-panel {
	margin-top: 30rpx;
}

.copy-homework-button {
	flex-shrink: 0;
	min-width: 176rpx;
	height: 62rpx;
	line-height: 62rpx;
	padding: 0 22rpx;
	border-radius: 999rpx;
	font-size: 24rpx;
	font-weight: 800;
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
