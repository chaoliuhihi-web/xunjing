<template>
	<view class="xicheng-route-detail xicheng-designed-page xicheng-bottom-safe">
		<view class="route-nav">
			<button class="nav-icon" @click="goBack">‹</button>
			<text class="nav-title">路线详情</text>
			<button class="nav-icon" @click="startRoutePassport">存</button>
		</view>

		<view class="route-hero xicheng-paper-card">
			<view class="route-hero-copy">
				<text class="route-kicker">{{ activeRoute.theme || '西城路线' }}</text>
				<text class="route-title">{{ routeHero.title }}</text>
				<text class="route-meta-line">{{ routeHero.meta }}</text>
				<view class="route-keywords">
					<text
						v-for="keyword in activeRoute.keywords"
						:key="keyword"
						class="route-keyword"
					>
						{{ keyword }}
					</text>
				</view>
			</view>
			<view class="route-map">
				<view
					v-for="(stop, index) in routeStopCards"
					:key="`${stop.poiCode}-${index}`"
					class="route-map-pin"
				>
					{{ index + 1 }}
				</view>
			</view>
		</view>

		<view class="xiaojing-card xicheng-paper-card">
			<image class="xiaojing-avatar" :src="region.companionAvatar" mode="aspectFit" />
			<view class="xiaojing-copy xicheng-companion-bubble">
				<text class="xiaojing-title">{{ region.companionName }}帮你排好了顺路走法</text>
				<text class="xiaojing-desc">{{ activeRoute.routeTips || '按顺序走完后可生成西城游记草稿。' }}</text>
			</view>
		</view>

		<view class="route-timeline">
			<view
				v-for="(stop, index) in routeStopCards"
				:key="`${stop.poiCode}-${index}`"
				class="route-stop-card xicheng-paper-card"
			>
				<view class="stop-index">{{ index + 1 }}</view>
				<view class="stop-copy">
					<text class="stop-title">{{ stop.poiName }}</text>
					<text class="stop-desc">{{ stop.summary || stop.theme }}</text>
					<text class="stop-walk">{{ stop.walkText || stop.durationText }}</text>
				</view>
				<button class="listen-button xicheng-primary-action" @click="askStopGuide(stop)">听讲解</button>
			</view>
		</view>

		<view v-if="nearbyHighlights.length > 0" class="highlight-card xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<text class="section-title">沿途看点</text>
			</view>
			<view class="highlight-grid">
				<view
					v-for="highlight in nearbyHighlights"
					:key="highlight.title"
					class="highlight-item"
				>
					<text class="highlight-title">{{ highlight.title }}</text>
					<text class="highlight-desc">{{ highlight.subtitle }}</text>
				</view>
			</view>
		</view>

		<view class="route-actions xicheng-paper-card">
			<view>
				<text class="action-title">生成这条路线的游记</text>
				<text class="action-desc">路线、景点和待审核素材会先进入本地游记草稿。</text>
			</view>
			<button class="action-button xicheng-primary-action" @click="generateRouteTravelogue">生成游记</button>
		</view>
	</view>
</template>

<script>
import {
	XICHENG_RECOMMENDED_ROUTES,
	XICHENG_REGION_CONFIG
} from '@/config/regions/xicheng.js'
import { decodeXichengRouteValue } from '@/request/xunjing/routeParams.js'

const normalizeRouteOptions = (options = {}) => ({
	routeCode: decodeXichengRouteValue(options.routeCode),
	regionCode: decodeXichengRouteValue(options.regionCode),
	packageCode: decodeXichengRouteValue(options.packageCode),
	sceneCode: decodeXichengRouteValue(options.sceneCode),
	sourceChannel: decodeXichengRouteValue(options.sourceChannel),
	companionName: decodeXichengRouteValue(options.companionName)
})

const resolveRouteByCode = (routeCode = '') => {
	const route = XICHENG_RECOMMENDED_ROUTES.find(item => item.routeCode === routeCode)
	return route || XICHENG_RECOMMENDED_ROUTES[0]
}

export default {
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			routeOptions: normalizeRouteOptions(),
			activeRoute: resolveRouteByCode()
		}
	},
	computed: {
		routeHero() {
			return {
				title: this.activeRoute.title || '西城 Citywalk',
				meta: [
					this.activeRoute.durationText,
					this.activeRoute.distanceText,
					this.activeRoute.bestTimeText
				].filter(Boolean).join(' · ')
			}
		},
		routeStopCards() {
			return Array.isArray(this.activeRoute.stops) ? this.activeRoute.stops : []
		},
		nearbyHighlights() {
			return Array.isArray(this.activeRoute.nearbyHighlights) ? this.activeRoute.nearbyHighlights : []
		}
	},
	onLoad(options = {}) {
		this.routeOptions = normalizeRouteOptions(options)
		this.activeRoute = resolveRouteByCode(this.routeOptions.routeCode)
	},
	methods: {
		goBack() {
			uni.navigateBack({ delta: 1 })
		},
		createRoutePayload() {
			return {
				...this.activeRoute,
				regionCode: this.routeOptions.regionCode || this.region.regionCode,
				packageCode: this.routeOptions.packageCode || this.region.packageCode,
				sceneCode: this.routeOptions.sceneCode || this.region.sceneCode,
				sourceChannel: this.routeOptions.sourceChannel || this.region.sourceChannel,
				routeSource: 'route-detail',
				sourceLabel: '官方路线详情',
				updatedAt: new Date().toISOString()
			}
		},
		createRouteMaterials(capturedAt) {
			return this.routeStopCards.map(stop => ({
				type: 'official-route-poi',
				regionCode: this.routeOptions.regionCode || this.region.regionCode,
				packageCode: this.routeOptions.packageCode || this.region.packageCode,
				sceneCode: this.routeOptions.sceneCode || this.region.sceneCode,
				sourceChannel: this.routeOptions.sourceChannel || this.region.sourceChannel,
				poiCode: stop.poiCode,
				poiName: stop.poiName,
				routeCode: this.activeRoute.routeCode,
				routeTitle: this.activeRoute.title,
				sourceLabel: '官方路线详情',
				sources: [],
				reviewStatus: this.region.reviewStatus.pending,
				publishStatus: 'private',
				capturedAt
			}))
		},
		persistRoutePassport() {
			const routePayload = this.createRoutePayload()
			const existingMaterials = uni.getStorageSync(this.region.materialsStorageKey)
			const materials = Array.isArray(existingMaterials) ? existingMaterials : []
			const routeMaterials = this.createRouteMaterials(routePayload.updatedAt)
			uni.setStorageSync(this.region.inspirationStorageKey, routePayload)
			uni.setStorageSync(this.region.materialsStorageKey, [
				...routeMaterials,
				...materials
			].slice(0, 80))
		},
		startRoutePassport() {
			this.persistRoutePassport()
			uni.showToast({
				title: '已加入路线护照',
				icon: 'none'
			})
		},
		generateRouteTravelogue() {
			this.persistRoutePassport()
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?mode=route&regionCode=${encodeURIComponent(this.routeOptions.regionCode || this.region.regionCode)}&packageCode=${encodeURIComponent(this.routeOptions.packageCode || this.region.packageCode)}&sceneCode=${encodeURIComponent(this.routeOptions.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeURIComponent(this.routeOptions.sourceChannel || this.region.sourceChannel)}&routeCode=${encodeURIComponent(this.activeRoute.routeCode || '')}&companionName=${encodeURIComponent(this.routeOptions.companionName || this.region.companionName)}`
			})
		},
		askStopGuide(stop = {}) {
			if (!stop.poiCode || !stop.poiName) {
				uni.showToast({
					title: '暂无官方 POI，不能问小京',
					icon: 'none'
				})
				return
			}
			const question = stop.guidePrompt || `讲讲${stop.poiName}`
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?question=${encodeURIComponent(question)}&regionCode=${encodeURIComponent(this.routeOptions.regionCode || this.region.regionCode)}&packageCode=${encodeURIComponent(this.routeOptions.packageCode || this.region.packageCode)}&sceneCode=${encodeURIComponent(this.region.aiSceneCode || this.routeOptions.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeURIComponent(this.routeOptions.sourceChannel || this.region.sourceChannel)}&poiCode=${encodeURIComponent(stop.poiCode || '')}&poiName=${encodeURIComponent(stop.poiName || '')}&companionName=${encodeURIComponent(this.routeOptions.companionName || this.region.companionName)}`
			})
		}
	}
}
</script>

<style scoped>
.xicheng-route-detail {
	min-height: 100vh;
	padding: 34rpx 28rpx 56rpx;
	box-sizing: border-box;
	color: #102F29;
}

.route-nav {
	display: grid;
	grid-template-columns: 76rpx 1fr 76rpx;
	align-items: center;
	gap: 18rpx;
	margin-bottom: 24rpx;
}

.nav-icon {
	width: 76rpx;
	height: 76rpx;
	line-height: 76rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.86);
	color: #173F35;
	font-size: 34rpx;
}

.nav-title {
	text-align: center;
	font-size: 34rpx;
	font-weight: 700;
	color: #102F29;
}

.route-hero {
	min-height: 330rpx;
	padding: 34rpx;
	border-radius: 34rpx;
	box-sizing: border-box;
	background:
		linear-gradient(112deg, rgba(255, 253, 248, 0.96) 0%, rgba(255, 253, 248, 0.82) 58%, rgba(181, 148, 94, 0.16) 100%);
}

.route-hero-copy {
	position: relative;
	z-index: 1;
}

.route-kicker {
	display: block;
	font-size: 24rpx;
	color: #B5945E;
}

.route-title {
	display: block;
	margin-top: 12rpx;
	font-size: 48rpx;
	font-weight: 700;
	line-height: 1.22;
	color: #102F29;
}

.route-meta-line {
	display: block;
	margin-top: 16rpx;
	font-size: 26rpx;
	line-height: 1.45;
	color: #746F68;
}

.route-keywords {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 22rpx;
}

.route-keyword {
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.16);
	font-size: 22rpx;
	color: #8A6B3D;
}

.route-map {
	position: absolute;
	right: 28rpx;
	bottom: 34rpx;
	display: flex;
	align-items: flex-end;
	gap: 18rpx;
	padding: 28rpx;
	border-radius: 30rpx;
	background: rgba(23, 63, 53, 0.08);
}

.route-map-pin {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48rpx;
	height: 48rpx;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF9EC;
	font-size: 24rpx;
	font-weight: 700;
}

.route-map-pin:nth-child(2) {
	margin-bottom: 34rpx;
}

.route-map-pin:nth-child(3) {
	margin-bottom: 66rpx;
}

.xiaojing-card {
	display: grid;
	grid-template-columns: 132rpx 1fr;
	align-items: center;
	gap: 18rpx;
	margin-top: 28rpx;
	padding: 24rpx;
	border-radius: 34rpx;
}

.xiaojing-avatar {
	width: 132rpx;
	height: 150rpx;
}

.xiaojing-copy {
	padding: 22rpx 24rpx;
	border-radius: 28rpx;
}

.xiaojing-title,
.xiaojing-desc {
	display: block;
}

.xiaojing-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #102F29;
}

.xiaojing-desc {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #746F68;
}

.route-timeline {
	display: grid;
	gap: 22rpx;
	margin-top: 30rpx;
}

.route-stop-card {
	display: grid;
	grid-template-columns: 64rpx 1fr 132rpx;
	align-items: center;
	gap: 18rpx;
	padding: 24rpx;
	border-radius: 30rpx;
}

.stop-index {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 56rpx;
	height: 56rpx;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF9EC;
	font-size: 26rpx;
	font-weight: 700;
}

.stop-copy {
	min-width: 0;
}

.stop-title {
	display: block;
	font-size: 34rpx;
	font-weight: 700;
	color: #102F29;
}

.stop-desc,
.stop-walk {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.5;
	color: #746F68;
}

.stop-walk {
	color: #8A6B3D;
}

.listen-button {
	width: 132rpx;
	height: 66rpx;
	line-height: 66rpx;
	border-radius: 999rpx;
	font-size: 24rpx;
}

.highlight-card,
.route-actions {
	margin-top: 28rpx;
	padding: 30rpx;
	border-radius: 34rpx;
}

.section-title {
	display: block;
	font-size: 34rpx;
	font-weight: 700;
	color: #102F29;
}

.highlight-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
	margin-top: 22rpx;
}

.highlight-item {
	padding: 20rpx;
	border-radius: 24rpx;
	background: rgba(23, 63, 53, 0.07);
}

.highlight-title,
.highlight-desc,
.action-title,
.action-desc {
	display: block;
}

.highlight-title,
.action-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #102F29;
}

.highlight-desc,
.action-desc {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #746F68;
}

.route-actions {
	display: grid;
	grid-template-columns: 1fr 190rpx;
	align-items: center;
	gap: 20rpx;
}

.action-button {
	height: 74rpx;
	line-height: 74rpx;
	border-radius: 999rpx;
	font-size: 26rpx;
}
</style>
