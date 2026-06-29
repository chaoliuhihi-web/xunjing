<template>
	<view class="xicheng-home xicheng-designed-page xicheng-bottom-safe">
		<view class="hero xicheng-paper-card xicheng-immersive-hero">
			<view class="hero-atmosphere"></view>
			<view class="hero-main">
				<view class="hero-copy">
					<text class="eyebrow">{{ region.cityName }}</text>
					<text class="title">小京 AI旅伴</text>
					<text class="subtitle">拍照、OCR、定位识别后，直接进入讲解、路线和游记草稿。</text>
					<view class="hero-actions">
						<button class="primary-button xicheng-primary-action" :disabled="recognizing" @click="startPhotoRecognition">拍照识别</button>
						<button class="ghost-button xicheng-secondary-action" :disabled="recognizing" @click="askXiaojing">问问小京</button>
					</view>
				</view>
				<view class="companion-visual">
					<image class="xiaojing-avatar" :src="region.companionAvatar" mode="aspectFit" />
					<view class="companion-bubble xicheng-companion-bubble">
						<text class="companion-name">{{ region.companionName }}</text>
						<text class="companion-line">我陪你看懂西城</text>
					</view>
				</view>
			</view>
		</view>

		<view class="inspiration-panel xicheng-paper-card" @click="openXichengInspiration">
			<view>
				<text class="inspiration-title">一键导入灵感</text>
				<text class="inspiration-desc">粘贴攻略文字或地点清单，AI 提取地点并匹配官方 POI。</text>
			</view>
			<text class="inspiration-action">生成路线</text>
		</view>

		<view v-if="recentRecognition" class="recent-panel xicheng-paper-card">
			<view class="recent-copy">
				<text class="recent-kicker">最近识别</text>
				<text class="recent-title">{{ recentRecognition.poiName || '西城文化点' }}</text>
				<text class="recent-desc">
					{{ recentRecognition.sourceLabel || '识别结果' }} · 置信度 {{ recentRecognitionConfidence }}%
				</text>
				<text class="recent-status">{{ recentRecognitionStatusCopy }}</text>
			</view>
			<view class="recent-actions">
				<button class="primary-button xicheng-primary-action" :disabled="recentRecognitionActionBlocked" @click="continueRecentRecognitionWithXiaojing">继续问小京</button>
				<button class="ghost-button xicheng-secondary-action" @click="openRecentRecognition">查看识别结果</button>
			</view>
		</view>

		<view class="quick-grid">
			<view class="quick-card xicheng-paper-card quick-card-featured quick-card-scan" @click="startScanRecognition">
				<text class="quick-title">扫一扫</text>
				<text class="quick-desc">识别二维码、展牌和门票</text>
			</view>
			<view class="quick-card xicheng-paper-card quick-card-featured quick-card-ask" @click="askXiaojing">
				<text class="quick-title">问问小京</text>
				<text class="quick-desc">继续咨询路线和讲解</text>
			</view>
			<view class="quick-card xicheng-paper-card quick-card-photo" @click="startPhotoRecognition">
				<text class="quick-title">拍照识别</text>
				<text class="quick-desc">识别门头、文物和说明牌</text>
			</view>
			<view class="quick-card xicheng-paper-card" @click="startGpsRecognition">
				<text class="quick-title">GPS定位</text>
				<text class="quick-desc">用当前位置识别附近文化点</text>
			</view>
			<view class="quick-card xicheng-paper-card" @click="startOcrRecognition">
				<text class="quick-title">OCR识别</text>
				<text class="quick-desc">从图片文字提取地点线索</text>
			</view>
			<view class="quick-card xicheng-paper-card" @click="startTextRecognition">
				<text class="quick-title">文本识别</text>
				<text class="quick-desc">粘贴地点、展牌或攻略文字</text>
			</view>
		</view>

		<view
			v-if="textRecognitionPanelExpanded"
			id="xicheng-text-recognition-panel"
			class="text-recognition-panel xicheng-paper-card"
		>
			<textarea
				v-model="textRecognitionInput"
				class="text-recognition-input"
				placeholder="输入白塔寺、什刹海，或粘贴展牌/攻略文字"
				auto-height
			/>
			<button class="primary-button xicheng-primary-action" :disabled="recognizing" @click="startTextRecognition">文本识别</button>
		</view>

		<view class="flow-strip">
			<text>小京讲解</text>
			<text>推荐路线</text>
			<text>开始记录</text>
			<text>生成游记草稿</text>
		</view>

		<view id="xicheng-route-section" class="route-recommendation-section xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<view>
					<text class="section-kicker">官方路线</text>
					<text class="section-title">路线推荐</text>
				</view>
				<text class="section-link" @click="openXichengInspiration">导入灵感</text>
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
			<view
				v-for="route in filteredRecommendedRoutes.slice(0, 3)"
				:key="route.routeCode"
				class="recommended-route-card xicheng-paper-card"
				@click="openRecommendedRouteDetail(route)"
			>
				<view class="route-card-header">
					<view>
						<text class="route-title">{{ route.title }}</text>
						<text class="route-desc">{{ route.summary }}</text>
					</view>
					<text class="route-theme">{{ route.theme }}</text>
				</view>
				<view class="route-meta">
					<text>{{ route.durationText }}</text>
					<text>{{ route.distanceText || '步行路线' }}</text>
					<text>路线护照 {{ route.passportTaskCount }} 点</text>
					<text>研学任务 {{ route.studyTaskCount }} 个</text>
				</view>
				<view v-if="route.keywords && route.keywords.length > 0" class="route-keywords">
					<text
						v-for="keyword in route.keywords"
						:key="`${route.routeCode}-${keyword}`"
						class="route-keyword"
					>
						{{ keyword }}
					</text>
				</view>
				<view class="route-stops">
					<text
						v-for="(stop, index) in route.stops"
						:key="`${route.routeCode}-${stop.poiCode}`"
						class="route-stop"
					>
						{{ index + 1 }}. {{ stop.poiName }}
					</text>
				</view>
				<view class="route-card-action">
					<button class="mini-button xicheng-primary-action" @click.stop="openRecommendedRouteDetail(route)">查看路线</button>
					<button class="mini-button xicheng-secondary-action" @click.stop="openRecommendedRoute(route)">加入路线护照</button>
				</view>
			</view>
		</view>

		<view class="journey-panel xicheng-paper-card">
			<view>
				<text class="journey-title">西城 Citywalk 记录</text>
				<text class="journey-desc">把识别点、照片、备注和任务沉淀为旅行素材盒。</text>
			</view>
			<view class="journey-actions">
				<button class="primary-button xicheng-primary-action" @click="openXichengTravelogue('record')">开始记录 Citywalk</button>
				<button class="ghost-button xicheng-secondary-action" @click="openXichengTravelogue('draft')">生成游记草稿</button>
			</view>
		</view>

		<view class="ops-section">
			<view class="ops-card xicheng-paper-card">
				<text class="ops-title">{{ routePassport.title }}</text>
				<text class="ops-desc">{{ routePassport.thresholdText }}</text>
			</view>
			<view class="ops-card xicheng-paper-card">
				<text class="ops-title">亲子研学任务</text>
				<text class="ops-desc">{{ parentChildTasks[0] }}</text>
			</view>
			<view class="ops-card xicheng-paper-card">
				<text class="ops-title">分享海报</text>
				<text class="ops-desc">{{ sharePoster.subtitle }}</text>
			</view>
		</view>

		<view v-if="lastError" class="error-line">{{ lastError }}</view>

		<view class="xicheng-home-bottom-nav">
			<view
				v-for="item in xichengHomeNavItems"
				:key="item.key"
				class="xicheng-home-bottom-nav-item"
				:class="{ 'xicheng-home-bottom-nav-item-active': item.key === 'explore' }"
				@click="handleXichengHomeNav(item.key)"
			>
				<view class="xicheng-home-bottom-nav-icon" :class="`xicheng-home-bottom-nav-icon-${item.key}`"></view>
				<text class="xicheng-home-bottom-nav-text">{{ item.title }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import {
	XICHENG_ROUTE_RECOMMENDATION_FILTERS,
	XICHENG_RECOMMENDED_ROUTES,
	XICHENG_REGION_CONFIG
} from '@/config/regions/xicheng.js'
import {
	isXichengDevelopmentFallbackAllowed,
	requestCurrentLocationForTrigger,
	resolveXichengOcrImageTrigger,
	resolveXichengPhotoTrigger,
	resolveXichengTextTrigger
} from '@/request/xunjing/trigger.js'
import { createXichengOfficialPoiSources } from '@/request/xunjing/officialPoi.js'
import { normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'

const XICHENG_EMPTY_RECOGNITION_POI_NAME = '待确认西城文化点'

export default {
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			recommendedRoutes: XICHENG_RECOMMENDED_ROUTES,
			routeRecommendationFilters: XICHENG_ROUTE_RECOMMENDATION_FILTERS,
			activeRouteFilter: XICHENG_ROUTE_RECOMMENDATION_FILTERS[0] ? XICHENG_ROUTE_RECOMMENDATION_FILTERS[0].key : '',
			routePassport: XICHENG_REGION_CONFIG.routePassport,
			parentChildTasks: XICHENG_REGION_CONFIG.parentChildTasks,
			sharePoster: XICHENG_REGION_CONFIG.sharePoster,
			xichengHomeNavItems: [
				{ key: 'explore', title: '探索' },
				{ key: 'routes', title: '地图' },
				{ key: 'travelogue', title: '收藏' },
				{ key: 'mine', title: '我的' }
			],
			currentLocation: null,
			textRecognitionInput: '',
			textRecognitionPanelExpanded: false,
			recognizing: false,
			lastError: '',
			recentRecognition: null
		}
	},
	computed: {
		recentRecognitionConfidence() {
			return Math.round(Number(this.recentRecognition && this.recentRecognition.confidence ? this.recentRecognition.confidence : 0) * 100)
		},
		recentRecognitionStatusCopy() {
			if (!this.recentRecognition) return ''
			if (this.recentRecognitionNeedsCandidateConfirmation()) return '待选择官方 POI'
			if (this.recentRecognitionMissingOfficialPoi()) return '暂无官方 POI'
			if (this.recentRecognitionUnsafeSafetyStatus()) return '无已审核来源'
			return '可继续问小京'
		},
		recentRecognitionActionBlocked() {
			return this.recentRecognitionNeedsCandidateConfirmation()
				|| this.recentRecognitionMissingOfficialPoi()
				|| this.recentRecognitionUnsafeSafetyStatus()
		},
		filteredRecommendedRoutes() {
			if (!this.activeRouteFilter) return this.recommendedRoutes
			const filteredRoutes = this.recommendedRoutes.filter(route => {
				const filterKeys = Array.isArray(route.recommendedFilterKeys) ? route.recommendedFilterKeys : []
				return filterKeys.includes(this.activeRouteFilter)
			})
			return filteredRoutes.length > 0 ? filteredRoutes : this.recommendedRoutes
		}
	},
	onLoad() {
		this.loadRecentRecognition()
	},
	onShow() {
		this.loadRecentRecognition()
	},
	methods: {
		isBlockedDevelopmentRecognitionCache(recognition = {}) {
			const developmentRecognition = Boolean(
				recognition && (
					recognition.developmentOnly || recognition.notForProduction || recognition.triggerType === 'development-fixture'
				)
			)
			return developmentRecognition && !isXichengDevelopmentFallbackAllowed()
		},
		loadRecentRecognition() {
			const cached = uni.getStorageSync(XICHENG_REGION_CONFIG.storageKey)
			if (this.isBlockedDevelopmentRecognitionCache(cached)) {
				uni.removeStorageSync(XICHENG_REGION_CONFIG.storageKey)
				this.recentRecognition = null
				return
			}
			this.recentRecognition = cached && typeof cached === 'object' && (cached.poiCode || cached.poiName)
				? cached
				: null
		},
		confirmImageRecognitionPurpose(actionLabel = '图片识别') {
			return new Promise(resolve => {
				uni.showModal({
					title: `${actionLabel}用途说明`,
					content: '照片或图片仅用于本次西城 POI 识别和本地游记素材生成，不默认公开；不会用于模型评估或运营纠错，除非你另行授权。',
					confirmText: '继续',
					cancelText: '取消',
					success: (res) => {
						resolve(Boolean(res.confirm))
					},
					fail: () => {
						resolve(false)
					}
				})
			})
		},
		async resolveTextAndOpenResult(text = '', source = 'ocr') {
			if (this.recognizing) return
			this.recognizing = true
			this.lastError = ''
			try {
				const location = this.currentLocation
				const trigger = await resolveXichengTextTrigger({
					text,
					ocrText: text,
					location,
					source
				})
				this.openScanResult(trigger, source)
			} catch (error) {
				this.lastError = error && (error.errMsg || error.message) ? (error.errMsg || error.message) : '识别失败'
			} finally {
				this.recognizing = false
			}
		},
		startScanRecognition() {
			if (!uni.scanCode) {
				this.handleRecognitionUnavailable('scan')
				return
			}
			uni.scanCode({
				success: (res) => {
					const scannedText = res.result || res.path || ''
					if (!scannedText) {
						this.handleRecognitionUnavailable('scan')
						return
					}
					this.resolveTextAndOpenResult(scannedText, 'scan')
				},
				fail: () => {
					this.handleRecognitionUnavailable('scan')
				}
			})
		},
		async startOcrRecognition() {
			if (this.recognizing) return
			const confirmed = await this.confirmImageRecognitionPurpose('OCR识别')
			if (!confirmed) return
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['camera', 'album'],
				success: async (res) => {
					const filePath = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : ''
					if (!filePath) {
						this.handleRecognitionUnavailable('ocr')
						return
					}
					this.recognizing = true
					this.lastError = ''
					try {
						const trigger = await resolveXichengOcrImageTrigger({
							filePath,
							ocrText: this.textRecognitionInput.trim()
						})
						this.openScanResult(trigger, 'ocr')
					} catch (error) {
						this.lastError = error && (error.errMsg || error.message) ? (error.errMsg || error.message) : 'OCR识别失败'
					} finally {
						this.recognizing = false
					}
				},
				fail: () => {
					this.handleRecognitionUnavailable('ocr')
				}
			})
		},
		async startGpsRecognition() {
			if (this.recognizing) return
			this.recognizing = true
			this.lastError = ''
			try {
				const location = await requestCurrentLocationForTrigger()
				this.currentLocation = location
				if (!location) {
					this.handleRecognitionUnavailable('gps')
					return
				}
				const trigger = await resolveXichengTextTrigger({
					text: '当前位置附近西城文化点',
					ocrText: '',
					source: 'gps',
					location
				})
				this.openScanResult(trigger, 'gps')
			} catch (error) {
				this.lastError = error && (error.errMsg || error.message) ? (error.errMsg || error.message) : '定位识别失败'
			} finally {
				this.recognizing = false
			}
		},
		openTextRecognitionPanel() {
			this.textRecognitionPanelExpanded = true
			this.$nextTick(() => {
				uni.pageScrollTo({
					selector: '#xicheng-text-recognition-panel',
					duration: 220
				})
			})
		},
		startTextRecognition() {
			const text = this.textRecognitionInput.trim()
			if (!text) {
				if (!this.textRecognitionPanelExpanded) {
					this.openTextRecognitionPanel()
					return
				}
				uni.showToast({
					icon: 'none',
					title: '请输入地点线索'
				})
				return
			}
			this.resolveTextAndOpenResult(text, 'text')
		},
		async startPhotoRecognition() {
			if (this.recognizing) return
			const confirmed = await this.confirmImageRecognitionPurpose('拍照识别')
			if (!confirmed) return
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['camera', 'album'],
				success: async (res) => {
					const filePath = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : ''
					if (!filePath) {
						this.handleRecognitionUnavailable('photo')
						return
					}
					this.recognizing = true
					this.lastError = ''
					try {
						const trigger = await resolveXichengPhotoTrigger({ filePath })
						this.openScanResult(trigger, 'photo')
					} catch (error) {
						this.lastError = error && (error.errMsg || error.message) ? (error.errMsg || error.message) : '照片识别失败'
					} finally {
						this.recognizing = false
					}
				},
				fail: () => {
					this.handleRecognitionUnavailable('photo')
				}
			})
		},
		handleRecognitionUnavailable(source = 'scan') {
			const message = source === 'gps'
				? '无法获取当前位置，请开启定位权限后重试'
				: source === 'photo'
					? '未获得可识别照片，请重新拍照或从相册选择'
					: source === 'ocr'
						? '未获得可识别图片，请补充图片或粘贴展牌文字'
						: '扫码未完成，请改用文本识别输入展牌或地点线索'
			this.lastError = message
			uni.showToast({
				icon: 'none',
				title: message
			})
		},
		openScanResult(trigger = {}, source = '') {
			if (this.isBlockedDevelopmentRecognitionCache(trigger)) {
				this.handleRecognitionUnavailable(source || 'text')
				return
			}
			const result = {
				...trigger,
				source,
				regionCode: this.region.regionCode,
				packageCode: this.region.packageCode,
				sceneCode: trigger.sceneCode || this.region.sceneCode,
				sourceChannel: trigger.sourceChannel || this.region.sourceChannel,
				companionName: this.region.companionName
			}
			uni.setStorageSync(this.region.storageKey, result)
			this.recentRecognition = result
			uni.navigateTo({
				url: `/pages/xicheng/scan-result/scan-result?source=${encodeURIComponent(source)}&regionCode=${encodeURIComponent(result.regionCode || this.region.regionCode)}&packageCode=${encodeURIComponent(result.packageCode || this.region.packageCode)}&sceneCode=${encodeURIComponent(result.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeURIComponent(result.sourceChannel || this.region.sourceChannel)}&poiCode=${encodeURIComponent(result.poiCode || '')}&poiName=${encodeURIComponent(result.poiName || '')}&companionName=${encodeURIComponent(result.companionName || this.region.companionName)}&safetyStatus=${encodeURIComponent(result.safetyStatus || '')}`
			})
		},
		openRecentRecognition() {
			if (!this.recentRecognition) return
			uni.navigateTo({
				url: `/pages/xicheng/scan-result/scan-result?source=${encodeURIComponent(this.recentRecognition.source || '')}&regionCode=${encodeURIComponent(this.recentRecognition.regionCode || this.region.regionCode)}&packageCode=${encodeURIComponent(this.recentRecognition.packageCode || this.region.packageCode)}&sceneCode=${encodeURIComponent(this.recentRecognition.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeURIComponent(this.recentRecognition.sourceChannel || this.region.sourceChannel)}&poiCode=${encodeURIComponent(this.recentRecognition.poiCode || '')}&poiName=${encodeURIComponent(this.recentRecognition.poiName || '')}&companionName=${encodeURIComponent(this.recentRecognition.companionName || this.region.companionName)}&safetyStatus=${encodeURIComponent(this.recentRecognition.safetyStatus || '')}`
			})
		},
		recentRecognitionNeedsCandidateConfirmation() {
			const candidates = this.recentRecognition && Array.isArray(this.recentRecognition.candidates)
				? this.recentRecognition.candidates
				: []
			return Boolean(this.recentRecognition && this.recentRecognition.requiresUserConfirm && candidates.length > 0)
		},
		recentRecognitionMissingOfficialPoi() {
			const recognition = this.recentRecognition || {}
			const hasMissingPoi = !recognition.poiCode || !recognition.poiName || recognition.poiName === XICHENG_EMPTY_RECOGNITION_POI_NAME
			const hasOfficialPoiMatch = Boolean(recognition.officialPoiMatched)
			const hasReviewedSources = Array.isArray(recognition.sources) && recognition.sources.length > 0
			return hasMissingPoi || (!hasOfficialPoiMatch && !hasReviewedSources)
		},
		recentRecognitionUnsafeSafetyStatus() {
			const status = normalizeXichengSafetyStatus(this.recentRecognition && this.recentRecognition.safetyStatus)
			return ['BLOCKED', 'UNAVAILABLE'].includes(status)
		},
		continueRecentRecognitionWithXiaojing() {
			if (!this.recentRecognition) return
			if (this.recentRecognitionNeedsCandidateConfirmation()) {
				uni.showToast({
					icon: 'none',
					title: '请先查看识别结果并选择官方 POI'
				})
				return
			}
			if (this.recentRecognitionMissingOfficialPoi()) {
				uni.showToast({
					icon: 'none',
					title: '暂无官方 POI 匹配，不能问小京'
				})
				return
			}
			if (this.recentRecognitionUnsafeSafetyStatus()) {
				uni.showToast({
					icon: 'none',
					title: '无已审核来源，不能问小京'
				})
				return
			}
			const prompt = this.recentRecognition.poiName ? `讲讲${this.recentRecognition.poiName}` : '讲讲这个西城文化点'
			const query = [
				`question=${encodeURIComponent(prompt)}`,
				`regionCode=${encodeURIComponent(this.recentRecognition.regionCode || this.region.regionCode)}`,
				`packageCode=${encodeURIComponent(this.recentRecognition.packageCode || this.region.packageCode)}`,
				`sceneCode=${encodeURIComponent(this.recentRecognition.sceneCode || this.region.sceneCode)}`,
				`sourceChannel=${encodeURIComponent(this.recentRecognition.sourceChannel || this.region.sourceChannel)}`,
				`poiCode=${encodeURIComponent(this.recentRecognition.poiCode || '')}`,
				`poiName=${encodeURIComponent(this.recentRecognition.poiName || '')}`,
				`companionName=${encodeURIComponent(this.recentRecognition.companionName || this.region.companionName)}`,
				`confidence=${encodeURIComponent(String(this.recentRecognition.confidence || ''))}`,
				`safetyStatus=${encodeURIComponent(this.recentRecognition.safetyStatus || '')}`
			].join('&')
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?${query}`
			})
		},
		askXiaojing() {
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?regionCode=${encodeURIComponent(this.region.regionCode)}&packageCode=${encodeURIComponent(this.region.packageCode)}&sceneCode=${encodeURIComponent(this.region.aiSceneCode || this.region.sceneCode)}&sourceChannel=${encodeURIComponent(this.region.sourceChannel)}&companionName=${encodeURIComponent(this.region.companionName)}`
			})
		},
		handleXichengHomeNav(key = 'explore') {
			switch (key) {
				case 'explore':
					uni.pageScrollTo({
						scrollTop: 0,
						duration: 220
					})
					break
				case 'routes':
					uni.pageScrollTo({
						selector: '#xicheng-route-section',
						duration: 220
					})
					break
				case 'travelogue':
					this.openXichengTravelogue('draft')
					break
				case 'mine':
					this.openXichengTravelogue('record')
					break
				default:
					uni.pageScrollTo({
						scrollTop: 0,
						duration: 220
					})
			}
		},
		openRecommendedRouteDetail(route = {}) {
			uni.navigateTo({
				url: `/pages/xicheng/route-detail/route-detail?routeCode=${encodeURIComponent(route.routeCode || '')}&regionCode=${encodeURIComponent(this.region.regionCode)}&packageCode=${encodeURIComponent(this.region.packageCode)}&sceneCode=${encodeURIComponent(this.region.sceneCode)}&sourceChannel=${encodeURIComponent(this.region.sourceChannel)}&companionName=${encodeURIComponent(this.region.companionName)}`
			})
		},
		openRecommendedRoute(route = {}) {
			const updatedAt = new Date().toISOString()
			const stops = Array.isArray(route.stops)
				? route.stops.map(stop => ({ ...stop }))
				: []
			const routePayload = {
				...route,
				stops,
				regionCode: this.region.regionCode,
				packageCode: this.region.packageCode,
				sceneCode: this.region.sceneCode,
				sourceChannel: this.region.sourceChannel,
				routeSource: 'home-recommendation',
				sourceLabel: '官方推荐路线',
				updatedAt
			}
			const existingMaterials = uni.getStorageSync(this.region.materialsStorageKey)
			const materials = Array.isArray(existingMaterials) ? existingMaterials : []
			const routeMaterials = stops.map(stop => {
				const sources = createXichengOfficialPoiSources(stop)
				return {
					type: 'official-route-poi',
					regionCode: this.region.regionCode,
					packageCode: this.region.packageCode,
					sceneCode: this.region.sceneCode,
					sourceChannel: this.region.sourceChannel,
					poiCode: stop.poiCode,
					poiName: stop.poiName,
					routeCode: route.routeCode,
					routeTitle: route.title,
					sourceLabel: '官方推荐路线',
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
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?mode=route&regionCode=${encodeURIComponent(this.region.regionCode)}&packageCode=${encodeURIComponent(this.region.packageCode)}&sceneCode=${encodeURIComponent(this.region.sceneCode)}&sourceChannel=${encodeURIComponent(this.region.sourceChannel)}&routeCode=${encodeURIComponent(route.routeCode || '')}&companionName=${encodeURIComponent(this.region.companionName)}`
			})
		},
		openXichengTravelogue(mode = 'record') {
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?mode=${encodeURIComponent(mode)}&autoStart=${encodeURIComponent(mode === 'record' ? '1' : '')}&regionCode=${encodeURIComponent(this.region.regionCode)}&packageCode=${encodeURIComponent(this.region.packageCode)}&sceneCode=${encodeURIComponent(this.region.sceneCode)}&sourceChannel=${encodeURIComponent(this.region.sourceChannel)}&companionName=${encodeURIComponent(this.region.companionName)}`
			})
		},
		openXichengInspiration() {
			uni.navigateTo({
				url: `/pages/xicheng/inspiration/inspiration?regionCode=${encodeURIComponent(this.region.regionCode)}&packageCode=${encodeURIComponent(this.region.packageCode)}&sceneCode=${encodeURIComponent(this.region.sceneCode)}&sourceChannel=${encodeURIComponent(this.region.sourceChannel)}&companionName=${encodeURIComponent(this.region.companionName)}`
			})
		}
	}
}
</script>

<style scoped>
.xicheng-home {
	min-height: 100vh;
	padding: 40rpx 28rpx 190rpx;
	box-sizing: border-box;
	color: #102F29;
}

.hero {
	position: relative;
	padding: 44rpx 34rpx;
	border-radius: 34rpx;
	background:
		linear-gradient(145deg, rgba(255, 253, 247, 0.96), rgba(239, 230, 216, 0.82));
	box-shadow: 0 20rpx 52rpx rgba(28, 35, 32, 0.12);
}

.xicheng-immersive-hero {
	min-height: 560rpx;
	overflow: hidden;
	background:
		radial-gradient(circle at 84% 12%, rgba(181, 148, 94, 0.18), transparent 34%),
		linear-gradient(145deg, rgba(255, 253, 247, 0.98), rgba(239, 230, 216, 0.78));
}

.hero-atmosphere {
	position: absolute;
	right: -90rpx;
	bottom: -70rpx;
	width: 430rpx;
	height: 430rpx;
	border-radius: 999rpx;
	background:
		radial-gradient(circle, rgba(23, 63, 53, 0.16), rgba(23, 63, 53, 0) 68%);
}

.hero-main {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 24rpx;
}

.hero-copy {
	flex: 1;
	max-width: 408rpx;
	min-width: 0;
}

.companion-visual {
	width: 276rpx;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: -8rpx;
}

.xiaojing-avatar {
	width: 260rpx;
	height: 334rpx;
	border-radius: 34rpx;
	background: #E7EFE8;
	box-shadow: 0 18rpx 42rpx rgba(16, 47, 41, 0.15);
}

.companion-bubble {
	width: 100%;
	margin-top: 14rpx;
	padding: 14rpx 12rpx;
	border-radius: 26rpx;
	background: rgba(255, 253, 248, 0.92);
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
.quick-desc,
.ops-desc,
.error-line {
	display: block;
	font-size: 24rpx;
	line-height: 1.6;
	color: #746F68;
}

.title {
	display: block;
	margin-top: 12rpx;
	font-size: 48rpx;
	font-weight: 700;
	color: #102F29;
}

.subtitle {
	margin-top: 16rpx;
}

.hero-actions {
	display: flex;
	gap: 12rpx;
	margin-top: 28rpx;
}

.hero-actions .primary-button,
.hero-actions .ghost-button {
	min-width: 0;
	padding: 0 4rpx;
	font-size: 26rpx;
	white-space: nowrap;
}

.primary-button,
.ghost-button {
	flex: 1;
	height: 84rpx;
	line-height: 84rpx;
	border-radius: 28rpx;
	font-size: 28rpx;
}

.primary-button {
	background: #1F6E5A;
	color: #FFFFFF;
}

.ghost-button {
	background: #EEF5F1;
	color: #1F6E5A;
}

.inspiration-panel {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	margin-top: 28rpx;
	padding: 28rpx;
	border-radius: 32rpx;
	background:
		linear-gradient(135deg, #173F35 0%, #102F29 100%);
	color: #FFF9EC;
	box-shadow: 0 18rpx 44rpx rgba(16, 47, 41, 0.18);
}

.inspiration-title {
	display: block;
	font-size: 32rpx;
	font-weight: 700;
}

.inspiration-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: rgba(255, 249, 236, 0.76);
}

.inspiration-action {
	flex-shrink: 0;
	padding: 12rpx 18rpx;
	border-radius: 999rpx;
	background: #B5945E;
	font-size: 24rpx;
	font-weight: 700;
	color: #FFF9EC;
}

.text-recognition-panel {
	margin-top: 28rpx;
	padding: 24rpx;
	border-radius: 32rpx;
}

.text-recognition-input {
	width: 100%;
	min-height: 112rpx;
	padding: 20rpx;
	box-sizing: border-box;
	border: 2rpx solid rgba(181, 148, 94, 0.22);
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.76);
	font-size: 26rpx;
	line-height: 1.5;
	color: #102F29;
}

.text-recognition-panel .primary-button {
	margin-top: 20rpx;
	width: 100%;
}

.recent-panel {
	margin-top: 28rpx;
	padding: 28rpx;
	border-radius: 32rpx;
}

.recent-copy {
	min-width: 0;
}

.recent-kicker {
	display: block;
	font-size: 24rpx;
	line-height: 1.5;
	color: #B5945E;
}

.recent-title {
	display: block;
	margin-top: 8rpx;
	font-size: 34rpx;
	font-weight: 700;
	color: #102F29;
}

.recent-desc {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #746F68;
}

.recent-status {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.4;
	color: #173F35;
}

.recent-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 24rpx;
}

.quick-grid,
.ops-section {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20rpx;
	margin-top: 28rpx;
}

.quick-card,
.ops-card {
	min-height: 150rpx;
	padding: 24rpx;
	border-radius: 30rpx;
	box-sizing: border-box;
}

.quick-card-featured {
	min-height: 174rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.48);
	box-shadow: 0 18rpx 38rpx rgba(16, 47, 41, 0.12);
}

.quick-card-scan {
	background:
		linear-gradient(135deg, rgba(23, 63, 53, 0.96), rgba(16, 47, 41, 0.92));
}

.quick-card-scan .quick-title,
.quick-card-scan .quick-desc {
	color: #FFF9EC;
}

.quick-card-ask {
	background:
		linear-gradient(145deg, rgba(255, 253, 248, 0.96), rgba(244, 236, 224, 0.86));
}

.quick-title,
.ops-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #173F35;
}

.quick-desc,
.ops-desc {
	margin-top: 10rpx;
}

.flow-strip {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 28rpx;
}

.flow-strip text {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 76rpx;
	padding: 8rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.15);
	font-size: 22rpx;
	text-align: center;
	color: #173F35;
	box-sizing: border-box;
}

.route-recommendation-section {
	margin-top: 28rpx;
	padding: 30rpx;
	border-radius: 34rpx;
}

.section-head,
.route-card-header,
.route-meta,
.route-card-action {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}

.section-head.xicheng-section-label {
	justify-content: flex-start;
}

.section-head.xicheng-section-label .section-link {
	margin-left: auto;
}

.section-kicker {
	display: block;
	font-size: 22rpx;
	line-height: 1.4;
	color: #B5945E;
}

.section-title {
	display: block;
	margin-top: 6rpx;
	font-size: 34rpx;
	font-weight: 700;
	color: #102F29;
}

.section-link {
	flex-shrink: 0;
	font-size: 24rpx;
	font-weight: 700;
	color: #173F35;
}

.route-filter-bar {
	display: flex;
	gap: 14rpx;
	margin-top: 24rpx;
	padding: 10rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.72);
	overflow-x: auto;
	white-space: nowrap;
}

.route-filter-chip {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 118rpx;
	height: 62rpx;
	padding: 0 22rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.10);
	box-sizing: border-box;
	font-size: 24rpx;
	color: #173F35;
}

.route-filter-chip-active {
	background: #173F35;
	color: #FFF9EC;
	box-shadow: 0 12rpx 24rpx rgba(16, 47, 41, 0.18);
}

.recommended-route-card {
	margin-top: 22rpx;
	padding: 24rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.18);
	border-radius: 28rpx;
	background: rgba(255, 252, 246, 0.70);
	box-sizing: border-box;
}

.route-card-header {
	align-items: flex-start;
}

.route-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	line-height: 1.35;
	color: #102F29;
}

.route-desc {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #746F68;
}

.route-theme {
	flex-shrink: 0;
	padding: 8rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.16);
	font-size: 22rpx;
	color: #173F35;
}

.route-meta {
	justify-content: flex-start;
	flex-wrap: wrap;
	margin-top: 18rpx;
}

.route-meta text {
	padding: 8rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.62);
	font-size: 22rpx;
	color: #746F68;
}

.route-keywords {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 16rpx;
}

.route-keyword {
	padding: 6rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.12);
	font-size: 22rpx;
	color: #8A6B3D;
}

.route-stops {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 18rpx;
}

.route-stop {
	padding: 8rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.08);
	font-size: 22rpx;
	color: #173F35;
}

.route-card-action {
	gap: 16rpx;
	justify-content: flex-end;
	margin-top: 20rpx;
}

.mini-button {
	min-width: 180rpx;
	height: 64rpx;
	line-height: 64rpx;
	border-radius: 999rpx;
	background: #FFF9EC;
	font-size: 24rpx;
	color: #173F35;
}

.journey-panel {
	margin-top: 28rpx;
	padding: 32rpx;
	border-radius: 34rpx;
}

.journey-title {
	display: block;
	font-size: 32rpx;
	font-weight: 700;
	color: #102F29;
}

.journey-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.6;
	color: #746F68;
}

.journey-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 24rpx;
}

.ops-section {
	grid-template-columns: 1fr;
}

.error-line {
	margin-top: 24rpx;
	color: #B42318;
}

.xicheng-home-bottom-nav {
	position: fixed;
	left: 24rpx;
	right: 24rpx;
	bottom: calc(18rpx + env(safe-area-inset-bottom));
	z-index: 50;
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	min-height: 112rpx;
	padding: 14rpx 10rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.22);
	border-radius: 34rpx;
	background: rgba(255, 253, 248, 0.94);
	box-shadow: 0 -14rpx 40rpx rgba(16, 47, 41, 0.12);
	backdrop-filter: blur(18rpx);
	box-sizing: border-box;
}

.xicheng-home-bottom-nav-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	min-width: 0;
	color: #746F68;
}

.xicheng-home-bottom-nav-item-active {
	color: #173F35;
}

.xicheng-home-bottom-nav-icon {
	position: relative;
	width: 40rpx;
	height: 40rpx;
	box-sizing: border-box;
}

.xicheng-home-bottom-nav-icon-explore {
	border-bottom: 14rpx solid #173F35;
	border-left: 18rpx solid transparent;
	border-right: 18rpx solid transparent;
}

.xicheng-home-bottom-nav-icon-explore::after {
	content: '';
	position: absolute;
	left: -8rpx;
	top: 14rpx;
	width: 16rpx;
	height: 16rpx;
	background: #173F35;
}

.xicheng-home-bottom-nav-icon-routes {
	border: 4rpx solid currentColor;
	border-radius: 10rpx;
}

.xicheng-home-bottom-nav-icon-routes::before,
.xicheng-home-bottom-nav-icon-routes::after {
	content: '';
	position: absolute;
	top: 8rpx;
	width: 8rpx;
	height: 8rpx;
	border-radius: 999rpx;
	background: currentColor;
}

.xicheng-home-bottom-nav-icon-routes::before {
	left: 7rpx;
}

.xicheng-home-bottom-nav-icon-routes::after {
	right: 7rpx;
}

.xicheng-home-bottom-nav-icon-travelogue {
	border: 4rpx solid currentColor;
	border-radius: 999rpx;
}

.xicheng-home-bottom-nav-icon-travelogue::before {
	content: '';
	position: absolute;
	left: 10rpx;
	top: 10rpx;
	width: 12rpx;
	height: 12rpx;
	border-radius: 999rpx;
	background: currentColor;
}

.xicheng-home-bottom-nav-icon-mine {
	border: 4rpx solid currentColor;
	border-radius: 999rpx 999rpx 46rpx 46rpx;
}

.xicheng-home-bottom-nav-icon-mine::before {
	content: '';
	position: absolute;
	left: 10rpx;
	top: -16rpx;
	width: 14rpx;
	height: 14rpx;
	border: 4rpx solid currentColor;
	border-radius: 999rpx;
	background: rgba(255, 253, 248, 0.94);
}

.xicheng-home-bottom-nav-text {
	font-size: 22rpx;
	line-height: 1.2;
	font-weight: 700;
	white-space: nowrap;
}
</style>
