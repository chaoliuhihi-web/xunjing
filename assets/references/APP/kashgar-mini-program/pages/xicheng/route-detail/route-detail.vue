<template>
	<view class="xicheng-route-detail xicheng-designed-page xicheng-bottom-safe">
		<xicheng-route-detail-panel
			:route="activeRoute"
			:route-hero="routeHero"
			:route-stops="routeStopCards"
			:nearby-highlights="nearbyHighlights"
			:route-hero-image="routeHeroImage"
			:companion-avatar="region.companionAvatar"
			@back="goBack"
			@passport="startRoutePassport"
			@ask-stop="askStopGuide"
			@open-poi-detail="openStopPoiDetail"
			@navigate-stop="navigateStopPoi"
			@start-recording="startRouteRecording"
			@generate-travelogue="generateRouteTravelogue"
		/>
	</view>
</template>

<script>
import {
	XICHENG_RECOMMENDED_ROUTES,
	XICHENG_REGION_CONFIG,
	normalizeXichengRouteCode
} from '@/config/regions/xicheng.js'
import XichengRouteDetailPanel from '@/components/xicheng/XichengRouteDetailPanel.vue'
import { createXichengOfficialPoiSources } from '@/request/xunjing/officialPoi.js'
import { mergeXichengOfficialRouteMaterials } from '@/request/xunjing/routeMaterials.js'
import { decodeXichengRouteValue, createXichengRouteOutputValue } from '@/request/xunjing/routeParams.js'

const XICHENG_HOME_ROUTE = '/pages/xicheng/home/home'
const encodeRouteValue = (value = '') => createXichengRouteOutputValue(value, { platform: process.env.UNI_PLATFORM })

const normalizeRouteOptions = (options = {}) => ({
	routeCode: normalizeXichengRouteCode(decodeXichengRouteValue(options.routeCode || options.routeId)),
	regionCode: decodeXichengRouteValue(options.regionCode),
	packageCode: decodeXichengRouteValue(options.packageCode),
	sceneCode: decodeXichengRouteValue(options.sceneCode),
	sourceChannel: decodeXichengRouteValue(options.sourceChannel),
	companionName: decodeXichengRouteValue(options.companionName)
})

const resolveRouteByCode = (routeCode = '') => {
	const normalizedRouteCode = normalizeXichengRouteCode(routeCode)
	const route = XICHENG_RECOMMENDED_ROUTES.find(item => item.routeCode === normalizedRouteCode)
	return route || XICHENG_RECOMMENDED_ROUTES[0]
}

export default {
	components: {
		XichengRouteDetailPanel
	},
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
		},
		routeHeroImage() {
			const thumbnails = this.region.visualAssets && this.region.visualAssets.routeThumbnails
				? this.region.visualAssets.routeThumbnails
				: {}
			return thumbnails[this.activeRoute.routeCode] || this.region.visualAssets.heroLandmark || ''
		}
	},
	onLoad(options = {}) {
		this.routeOptions = normalizeRouteOptions(options)
		this.activeRoute = resolveRouteByCode(this.routeOptions.routeCode)
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
			return this.routeStopCards.map(stop => {
				const sources = createXichengOfficialPoiSources(stop)
				return {
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
					sources,
					sourceCount: sources.length,
					safetyStatus: 'PASSED',
					reviewStatus: this.region.reviewStatus.pending,
					publishStatus: 'private',
					capturedAt
				}
			})
		},
		persistRoutePassport() {
			const routePayload = this.createRoutePayload()
			const existingMaterials = uni.getStorageSync(this.region.materialsStorageKey)
			const materials = Array.isArray(existingMaterials) ? existingMaterials : []
			const routeMaterials = this.createRouteMaterials(routePayload.updatedAt)
			uni.setStorageSync(this.region.inspirationStorageKey, routePayload)
			uni.setStorageSync(this.region.materialsStorageKey, mergeXichengOfficialRouteMaterials(routeMaterials, materials).slice(0, 80))
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
				url: `/pages/xicheng/travelogue/travelogue?mode=route&regionCode=${encodeRouteValue(this.routeOptions.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(this.routeOptions.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(this.routeOptions.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.routeOptions.sourceChannel || this.region.sourceChannel)}&routeCode=${encodeRouteValue(this.activeRoute.routeCode || '')}&companionName=${encodeRouteValue(this.routeOptions.companionName || this.region.companionName)}`
			})
		},
		startRouteRecording() {
			this.persistRoutePassport()
			uni.navigateTo({
				url: `/pages/xicheng/recording/recording?autoStart=1&routeCode=${encodeRouteValue(this.activeRoute.routeCode || '')}&regionCode=${encodeRouteValue(this.routeOptions.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(this.routeOptions.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(this.routeOptions.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.routeOptions.sourceChannel || this.region.sourceChannel)}&companionName=${encodeRouteValue(this.routeOptions.companionName || this.region.companionName)}`
			})
		},
		openRouteStopPoi(stop = {}, entryMode = 'detail') {
			if (!stop.poiCode || !stop.poiName) {
				uni.showToast({
					title: '暂无官方 POI，不能打开地点详情',
					icon: 'none'
				})
				return
			}
			this.persistStopGuideContext(stop, entryMode === 'navigation' ? `导航去${stop.poiName}` : `讲讲${stop.poiName}`)
			uni.navigateTo({
				url: `/pages/xicheng/poi/poi?entryMode=${encodeRouteValue(entryMode)}&poiCode=${encodeRouteValue(stop.poiCode || '')}&poiName=${encodeRouteValue(stop.poiName || '')}&regionCode=${encodeRouteValue(this.routeOptions.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(this.routeOptions.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(this.routeOptions.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.routeOptions.sourceChannel || this.region.sourceChannel)}&companionName=${encodeRouteValue(this.routeOptions.companionName || this.region.companionName)}&safetyStatus=${encodeRouteValue('PASSED')}`
			})
		},
		openStopPoiDetail(stop = {}) {
			this.openRouteStopPoi(stop, 'detail')
		},
		navigateStopPoi(stop = {}) {
			this.openRouteStopPoi(stop, 'navigation')
		},
		getStopThumbnail(stop = {}, index = 0) {
			return this.routeHeroImage
		},
		persistStopGuideContext(stop = {}, question = '') {
			const sources = createXichengOfficialPoiSources(stop)
			uni.setStorageSync(this.region.storageKey, {
				regionCode: this.routeOptions.regionCode || this.region.regionCode,
				packageCode: this.routeOptions.packageCode || this.region.packageCode,
				sceneCode: this.region.aiSceneCode || this.routeOptions.sceneCode || this.region.sceneCode,
				sourceChannel: this.routeOptions.sourceChannel || this.region.sourceChannel,
				poiCode: stop.poiCode,
				poiName: stop.poiName,
				confidence: 1,
				sourceLabel: '官方路线详情',
				officialPoiMatched: true,
				routeCode: this.activeRoute.routeCode,
				routeTitle: this.activeRoute.title,
				sources,
				sourceCount: sources.length,
				suggestedQuestions: question ? [question] : [],
				safetyStatus: 'PASSED',
				capturedAt: new Date().toISOString()
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
			this.persistStopGuideContext(stop, question)
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?question=${encodeRouteValue(question)}&regionCode=${encodeRouteValue(this.routeOptions.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(this.routeOptions.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.aiSceneCode || this.routeOptions.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.routeOptions.sourceChannel || this.region.sourceChannel)}&poiCode=${encodeRouteValue(stop.poiCode || '')}&poiName=${encodeRouteValue(stop.poiName || '')}&safetyStatus=${encodeRouteValue('PASSED')}&companionName=${encodeRouteValue(this.routeOptions.companionName || this.region.companionName)}`
			})
		}
	}
}
</script>

<style scoped>
.xicheng-route-detail {
	min-height: 100vh;
	padding: 0;
	box-sizing: border-box;
	color: #102F29;
}
</style>
