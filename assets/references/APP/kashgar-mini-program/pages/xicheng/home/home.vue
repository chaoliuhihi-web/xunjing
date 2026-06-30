<template>
	<view class="xicheng-home xicheng-designed-page xicheng-bottom-safe">
		<view class="home-location-row">
			<view class="home-location-main">
				<view class="home-location-pin"></view>
				<text>{{ region.cityName }}</text>
				<view class="home-location-caret"></view>
			</view>
			<view class="home-profile-button"></view>
		</view>

		<view class="hero xicheng-paper-card xicheng-immersive-hero">
			<image
				v-if="region.visualAssets && region.visualAssets.heroLandmark"
				class="hero-landmark-image"
				:src="region.visualAssets.heroLandmark"
				mode="aspectFill"
			/>
			<view class="hero-atmosphere"></view>
			<view class="hero-main">
				<view class="hero-copy">
					<text class="eyebrow">{{ region.cityName }}</text>
					<text class="title">西城 AI 旅伴</text>
					<text class="subtitle">星河寻境 · 知识随行</text>
					<view class="hero-actions">
						<button class="primary-button xicheng-primary-action" :disabled="recognizing" @click="startScanRecognition">扫一扫</button>
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

		<view class="quick-grid">
			<view class="quick-card xicheng-paper-card quick-card-featured quick-card-scan" :class="{ 'quick-card-disabled': recognizing }" @click="startScanRecognition">
				<text class="quick-title">扫一扫</text>
				<text class="quick-desc">拍照识别 · 文字识别 · 附近触发</text>
			</view>
			<view class="quick-card xicheng-paper-card quick-card-featured quick-card-ask" :class="{ 'quick-card-disabled': recognizing }" @click="askXiaojing">
				<text class="quick-title">问问小京</text>
				<text class="quick-desc">继续咨询路线和讲解</text>
			</view>
			<view class="quick-card xicheng-paper-card quick-card-photo" :class="{ 'quick-card-disabled': recognizing }" @click="startPhotoRecognition">
				<text class="quick-title">拍照识别</text>
				<text class="quick-desc">识别门头、文物和说明牌</text>
			</view>
			<view class="quick-card xicheng-paper-card quick-card-gps" :class="{ 'quick-card-disabled': recognizing }" @click="startGpsRecognition">
				<text class="quick-title">GPS定位</text>
				<text class="quick-desc">用当前位置识别附近文化点</text>
			</view>
			<view class="quick-card xicheng-paper-card quick-card-ocr" :class="{ 'quick-card-disabled': recognizing }" @click="startOcrRecognition">
				<text class="quick-title">OCR识别</text>
				<text class="quick-desc">从图片文字提取地点线索</text>
			</view>
			<view class="quick-card xicheng-paper-card quick-card-text" :class="{ 'quick-card-disabled': recognizing }" @click="startTextRecognition">
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
			<scroll-view scroll-x class="route-card-scroll" enable-flex>
				<view class="route-card-strip">
					<view
						v-for="route in filteredRecommendedRoutes.slice(0, 3)"
						:key="route.routeCode"
						class="recommended-route-card xicheng-paper-card"
						@click="openRecommendedRouteDetail(route)"
					>
						<image
							v-if="getRouteThumbnail(route)"
							class="route-thumbnail"
							:src="getRouteThumbnail(route)"
							mode="aspectFill"
						/>
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
			</scroll-view>
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

		<view class="inspiration-panel xicheng-paper-card" @click="openXichengInspiration">
			<view>
				<text class="inspiration-title">一键抄作业</text>
				<text class="inspiration-desc">一键导入灵感：粘贴攻略文字或地点清单，AI 提取地点并匹配官方 POI。</text>
			</view>
			<text class="inspiration-action">生成路线</text>
		</view>

		<view class="flow-strip">
			<button
				v-for="item in xichengP0FlowActions"
				:key="item.key"
				class="flow-step"
				@click="handleXichengP0FlowAction(item.key)"
			>
				{{ item.title }}
			</button>
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
	isXichengDevelopmentRecognitionCacheBlocked,
	requestCurrentLocationForTrigger,
	resolveXichengOcrImageTrigger,
	resolveXichengPhotoTrigger,
	resolveXichengTextTrigger
} from '@/request/xunjing/trigger.js'
import { createXichengOfficialPoiSources } from '@/request/xunjing/officialPoi.js'
import { createXichengRouteOutputValue } from '@/request/xunjing/routeParams.js'
import { isXichengUnsafeSafetyStatus, normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'
import { isXunjingUserCancelled } from '@/request/xunjing/userCancel.js'

const XICHENG_EMPTY_RECOGNITION_POI_NAME = '待确认西城文化点'
const encodeRouteValue = (value = '') => createXichengRouteOutputValue(value, { platform: process.env.UNI_PLATFORM })

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
			xichengP0FlowActions: [
				{ key: 'guide', title: '小京讲解' },
				{ key: 'routes', title: '推荐路线' },
				{ key: 'record', title: '开始记录' },
				{ key: 'draft', title: '生成游记草稿' }
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
		getRouteThumbnail(route = {}) {
			const thumbnails = this.region && this.region.visualAssets && this.region.visualAssets.routeThumbnails
				? this.region.visualAssets.routeThumbnails
				: {}
			return thumbnails[route.routeCode] || ''
		},
		isBlockedDevelopmentRecognitionCache(recognition = {}) {
			return isXichengDevelopmentRecognitionCacheBlocked(recognition)
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
				this.handleRecognitionServiceFailure(source, error)
			} finally {
				this.recognizing = false
			}
		},
		startScanRecognition() {
			if (this.recognizing) return
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
				fail: (err) => {
					if (isXunjingUserCancelled(err)) {
						return
					}
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
						this.handleRecognitionServiceFailure('ocr', error)
					} finally {
						this.recognizing = false
					}
				},
				fail: (err) => {
					if (isXunjingUserCancelled(err)) {
						return
					}
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
				this.handleRecognitionServiceFailure('gps', error)
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
			if (this.recognizing) return
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
						this.handleRecognitionServiceFailure('photo', error)
					} finally {
						this.recognizing = false
					}
				},
				fail: (err) => {
					if (isXunjingUserCancelled(err)) {
						return
					}
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
		handleRecognitionServiceFailure(source = 'scan', error = null) {
			const message = source === 'gps'
				? '定位识别服务暂不可用，请稍后重试'
				: source === 'photo'
					? '拍照识别服务暂不可用，请改用文本识别或稍后重试'
					: source === 'ocr'
						? 'OCR识别服务暂不可用，请粘贴展牌文字或稍后重试'
						: '西城识别服务暂不可用，请改用文本输入或稍后重试'
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
				url: `/pages/xicheng/scan-result/scan-result?source=${encodeRouteValue(source)}&regionCode=${encodeRouteValue(result.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(result.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(result.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(result.sourceChannel || this.region.sourceChannel)}&poiCode=${encodeRouteValue(result.poiCode || '')}&poiName=${encodeRouteValue(result.poiName || '')}&companionName=${encodeRouteValue(result.companionName || this.region.companionName)}&safetyStatus=${encodeRouteValue(result.safetyStatus || '')}`
			})
		},
		openRecentRecognition() {
			if (!this.recentRecognition) return
			uni.navigateTo({
				url: `/pages/xicheng/scan-result/scan-result?source=${encodeRouteValue(this.recentRecognition.source || '')}&regionCode=${encodeRouteValue(this.recentRecognition.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(this.recentRecognition.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(this.recentRecognition.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.recentRecognition.sourceChannel || this.region.sourceChannel)}&poiCode=${encodeRouteValue(this.recentRecognition.poiCode || '')}&poiName=${encodeRouteValue(this.recentRecognition.poiName || '')}&companionName=${encodeRouteValue(this.recentRecognition.companionName || this.region.companionName)}&safetyStatus=${encodeRouteValue(this.recentRecognition.safetyStatus || '')}`
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
			return isXichengUnsafeSafetyStatus(status)
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
				`question=${encodeRouteValue(prompt)}`,
				`regionCode=${encodeRouteValue(this.recentRecognition.regionCode || this.region.regionCode)}`,
				`packageCode=${encodeRouteValue(this.recentRecognition.packageCode || this.region.packageCode)}`,
				`sceneCode=${encodeRouteValue(this.recentRecognition.sceneCode || this.region.sceneCode)}`,
				`sourceChannel=${encodeRouteValue(this.recentRecognition.sourceChannel || this.region.sourceChannel)}`,
				`poiCode=${encodeRouteValue(this.recentRecognition.poiCode || '')}`,
				`poiName=${encodeRouteValue(this.recentRecognition.poiName || '')}`,
				`companionName=${encodeRouteValue(this.recentRecognition.companionName || this.region.companionName)}`,
				`confidence=${encodeRouteValue(String(this.recentRecognition.confidence || ''))}`,
				`safetyStatus=${encodeRouteValue(this.recentRecognition.safetyStatus || '')}`
			].join('&')
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?${query}`
			})
		},
		askXiaojing() {
			if (this.recognizing) return
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?regionCode=${encodeRouteValue(this.region.regionCode)}&packageCode=${encodeRouteValue(this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.aiSceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.region.sourceChannel)}&companionName=${encodeRouteValue(this.region.companionName)}`
			})
		},
		handleXichengP0FlowAction(key = 'guide') {
			switch (key) {
				case 'guide':
					this.askXiaojing()
					break
				case 'routes':
					uni.pageScrollTo({
						selector: '#xicheng-route-section',
						duration: 220
					})
					break
				case 'record':
					this.openXichengTravelogue('record')
					break
				case 'draft':
					this.openXichengTravelogue('draft')
					break
				default:
					this.askXiaojing()
			}
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
				url: `/pages/xicheng/route-detail/route-detail?routeCode=${encodeRouteValue(route.routeCode || '')}&regionCode=${encodeRouteValue(this.region.regionCode)}&packageCode=${encodeRouteValue(this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.region.sourceChannel)}&companionName=${encodeRouteValue(this.region.companionName)}`
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
				url: `/pages/xicheng/travelogue/travelogue?mode=route&regionCode=${encodeRouteValue(this.region.regionCode)}&packageCode=${encodeRouteValue(this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.region.sourceChannel)}&routeCode=${encodeRouteValue(route.routeCode || '')}&companionName=${encodeRouteValue(this.region.companionName)}`
			})
		},
		openXichengTravelogue(mode = 'record') {
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?mode=${encodeRouteValue(mode)}&autoStart=${encodeRouteValue(mode === 'record' ? '1' : '')}&regionCode=${encodeRouteValue(this.region.regionCode)}&packageCode=${encodeRouteValue(this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.region.sourceChannel)}&companionName=${encodeRouteValue(this.region.companionName)}`
			})
		},
		openXichengInspiration() {
			uni.navigateTo({
				url: `/pages/xicheng/inspiration/inspiration?regionCode=${encodeRouteValue(this.region.regionCode)}&packageCode=${encodeRouteValue(this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.region.sourceChannel)}&companionName=${encodeRouteValue(this.region.companionName)}`
			})
		}
	}
}
</script>

<style scoped>
.xicheng-home {
	min-height: 100vh;
	padding: 28rpx 28rpx 190rpx;
	box-sizing: border-box;
	color: #102F29;
}

.home-location-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	margin-bottom: 22rpx;
	color: #102F29;
}

.home-location-main {
	display: flex;
	align-items: center;
	gap: 14rpx;
	min-width: 0;
	font-size: 32rpx;
	font-weight: 700;
	line-height: 1.25;
}

.home-location-pin {
	position: relative;
	width: 26rpx;
	height: 32rpx;
	border: 4rpx solid currentColor;
	border-radius: 999rpx 999rpx 999rpx 0;
	transform: rotate(-45deg);
	box-sizing: border-box;
}

.home-location-pin::after {
	content: '';
	position: absolute;
	left: 6rpx;
	top: 6rpx;
	width: 6rpx;
	height: 6rpx;
	border-radius: 999rpx;
	background: currentColor;
}

.home-location-caret {
	width: 0;
	height: 0;
	border-left: 8rpx solid transparent;
	border-right: 8rpx solid transparent;
	border-top: 10rpx solid currentColor;
}

.home-profile-button {
	position: relative;
	width: 64rpx;
	height: 64rpx;
	border: 2rpx solid rgba(23, 63, 53, 0.16);
	border-radius: 999rpx;
	background: rgba(255, 253, 248, 0.88);
	box-shadow: 0 10rpx 24rpx rgba(16, 47, 41, 0.08);
	box-sizing: border-box;
}

.home-profile-button::before,
.home-profile-button::after {
	content: '';
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	border: 4rpx solid #173F35;
	box-sizing: border-box;
}

.home-profile-button::before {
	top: 14rpx;
	width: 18rpx;
	height: 18rpx;
	border-radius: 999rpx;
}

.home-profile-button::after {
	bottom: 12rpx;
	width: 34rpx;
	height: 20rpx;
	border-radius: 999rpx 999rpx 0 0;
	border-bottom: 0;
}

.hero {
	position: relative;
	padding: 44rpx 34rpx 34rpx;
	border-radius: 42rpx;
	background:
		linear-gradient(145deg, rgba(255, 253, 247, 0.96), rgba(239, 230, 216, 0.82));
	box-shadow: 0 20rpx 52rpx rgba(28, 35, 32, 0.12);
}

.xicheng-immersive-hero {
	min-height: 680rpx;
	overflow: hidden;
	background:
		linear-gradient(180deg, rgba(255, 253, 247, 0.42), rgba(255, 250, 241, 0.94) 68%, rgba(255, 250, 241, 0.98)),
		radial-gradient(circle at 78% 18%, rgba(181, 148, 94, 0.24), transparent 34%),
		linear-gradient(145deg, rgba(255, 253, 247, 0.98), rgba(239, 230, 216, 0.78));
}

.hero-landmark-image {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
	opacity: 0.38;
	filter: saturate(0.92) contrast(1.02);
	pointer-events: none;
}

.hero-atmosphere {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	width: 100%;
	height: 58%;
	border-radius: 999rpx;
	background:
		linear-gradient(180deg, rgba(255, 250, 241, 0), rgba(255, 250, 241, 0.92));
}

.hero-main {
	position: static;
	z-index: 1;
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 24rpx;
}

.hero-copy {
	position: relative;
	z-index: 3;
	flex: 1;
	max-width: 366rpx;
	min-width: 0;
	padding-top: 18rpx;
}

.companion-visual {
	position: absolute;
	right: 18rpx;
	bottom: 24rpx;
	z-index: 2;
	width: 340rpx;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: 0;
}

.xiaojing-avatar {
	width: 340rpx;
	height: 436rpx;
	border-radius: 38rpx;
	background: #E7EFE8;
	box-shadow: 0 24rpx 54rpx rgba(16, 47, 41, 0.16);
}

.companion-bubble {
	position: absolute;
	left: -154rpx;
	bottom: 72rpx;
	width: 262rpx;
	margin-top: 0;
	padding: 22rpx 18rpx;
	border-radius: 34rpx;
	background: rgba(255, 253, 248, 0.92);
	box-shadow: 0 14rpx 32rpx rgba(16, 47, 41, 0.12);
	box-sizing: border-box;
}

.companion-bubble::after {
	content: '';
	position: absolute;
	right: -18rpx;
	top: 42rpx;
	width: 34rpx;
	height: 34rpx;
	background: rgba(255, 253, 248, 0.92);
	border-radius: 0 12rpx 0 0;
	transform: rotate(45deg);
}

.companion-name,
.companion-line {
	display: block;
	text-align: center;
}

.companion-name {
	font-size: 30rpx;
	font-weight: 700;
	color: #173F35;
}

.companion-line {
	margin-top: 8rpx;
	font-size: 26rpx;
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
	margin-top: 18rpx;
	font-size: 60rpx;
	font-weight: 700;
	line-height: 1.12;
	color: #102F29;
}

.subtitle {
	margin-top: 22rpx;
}

.hero-actions {
	display: flex;
	gap: 12rpx;
	margin-top: 34rpx;
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
	margin-top: 24rpx;
	padding: 24rpx;
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

.quick-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
	margin-top: 24rpx;
	padding-bottom: 8rpx;
}

.ops-section {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20rpx;
	margin-top: 28rpx;
}

.quick-card {
	min-width: 0;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	min-height: 136rpx;
	padding: 22rpx;
	border-radius: 30rpx;
	box-sizing: border-box;
}

.quick-card-disabled {
	opacity: 0.56;
	pointer-events: none;
}

.ops-card {
	min-height: 136rpx;
	padding: 22rpx;
	border-radius: 30rpx;
	box-sizing: border-box;
}

.quick-card::before {
	content: '';
	display: block;
	width: 52rpx;
	height: 52rpx;
	margin-bottom: 18rpx;
	border-radius: 18rpx;
	background: rgba(23, 63, 53, 0.10);
	box-shadow: inset 0 0 0 2rpx rgba(23, 63, 53, 0.16);
}

.quick-card-featured {
	min-height: 150rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.48);
	box-shadow: 0 18rpx 38rpx rgba(16, 47, 41, 0.12);
}

.quick-card-scan {
	background:
		linear-gradient(135deg, rgba(23, 63, 53, 0.96), rgba(16, 47, 41, 0.92));
}

.quick-card-scan::before {
	background:
		linear-gradient(#FFF9EC, #FFF9EC) 9rpx 9rpx / 18rpx 4rpx no-repeat,
		linear-gradient(#FFF9EC, #FFF9EC) 9rpx 9rpx / 4rpx 18rpx no-repeat,
		linear-gradient(#FFF9EC, #FFF9EC) right 9rpx top 9rpx / 18rpx 4rpx no-repeat,
		linear-gradient(#FFF9EC, #FFF9EC) right 9rpx top 9rpx / 4rpx 18rpx no-repeat,
		linear-gradient(#FFF9EC, #FFF9EC) left 9rpx bottom 9rpx / 18rpx 4rpx no-repeat,
		linear-gradient(#FFF9EC, #FFF9EC) left 9rpx bottom 9rpx / 4rpx 18rpx no-repeat,
		linear-gradient(#FFF9EC, #FFF9EC) right 9rpx bottom 9rpx / 18rpx 4rpx no-repeat,
		linear-gradient(#FFF9EC, #FFF9EC) right 9rpx bottom 9rpx / 4rpx 18rpx no-repeat,
		rgba(255, 249, 236, 0.12);
	box-shadow: inset 0 0 0 2rpx rgba(255, 249, 236, 0.34);
}

.quick-card-scan .quick-title,
.quick-card-scan .quick-desc {
	color: #FFF9EC;
}

.quick-card-ask {
	background:
		linear-gradient(145deg, rgba(255, 253, 248, 0.96), rgba(244, 236, 224, 0.86));
}

.quick-card-ask::before {
	border-radius: 999rpx;
	background:
		radial-gradient(circle at 35% 44%, #173F35 0 4rpx, transparent 5rpx),
		radial-gradient(circle at 62% 44%, #173F35 0 4rpx, transparent 5rpx),
		linear-gradient(135deg, rgba(181, 148, 94, 0.18), rgba(23, 63, 53, 0.10));
}

.quick-card-photo::before {
	background:
		linear-gradient(#173F35, #173F35) center 15rpx / 20rpx 5rpx no-repeat,
		radial-gradient(circle at 50% 58%, rgba(23, 63, 53, 0.26) 0 9rpx, transparent 10rpx),
		rgba(23, 63, 53, 0.10);
}

.quick-card-gps::before {
	width: 48rpx;
	height: 48rpx;
	margin-left: 4rpx;
	border-radius: 999rpx 999rpx 999rpx 10rpx;
	background:
		radial-gradient(circle at 50% 50%, rgba(255, 253, 248, 0.98) 0 7rpx, transparent 8rpx),
		linear-gradient(135deg, #B5945E, #173F35);
	transform: rotate(-45deg);
	box-shadow: 0 8rpx 18rpx rgba(16, 47, 41, 0.12);
}

.quick-card-ocr::before {
	background:
		linear-gradient(#173F35, #173F35) left 10rpx top 12rpx / 18rpx 4rpx no-repeat,
		linear-gradient(#173F35, #173F35) left 10rpx top 12rpx / 4rpx 18rpx no-repeat,
		linear-gradient(#173F35, #173F35) right 10rpx bottom 12rpx / 18rpx 4rpx no-repeat,
		linear-gradient(#173F35, #173F35) right 10rpx bottom 12rpx / 4rpx 18rpx no-repeat,
		rgba(23, 63, 53, 0.10);
}

.quick-card-text::before {
	background:
		linear-gradient(#173F35, #173F35) 14rpx 15rpx / 24rpx 4rpx no-repeat,
		linear-gradient(rgba(23, 63, 53, 0.44), rgba(23, 63, 53, 0.44)) 14rpx 26rpx / 24rpx 4rpx no-repeat,
		linear-gradient(rgba(181, 148, 94, 0.72), rgba(181, 148, 94, 0.72)) 14rpx 37rpx / 18rpx 4rpx no-repeat,
		rgba(23, 63, 53, 0.10);
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
	margin-top: 22rpx;
}

.flow-step {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 64rpx;
	padding: 8rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.15);
	font-size: 22rpx;
	line-height: 1.25;
	text-align: center;
	color: #173F35;
	box-sizing: border-box;
}

.flow-step::after {
	border: 0;
}

.route-recommendation-section {
	margin-top: 24rpx;
	padding: 26rpx;
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

.route-card-scroll {
	margin: 22rpx -26rpx 0;
	padding: 0 26rpx 8rpx;
	overflow: hidden;
	white-space: nowrap;
	box-sizing: border-box;
}

.route-card-scroll::-webkit-scrollbar {
	display: none;
}

.route-card-strip {
	display: flex;
	align-items: stretch;
	gap: 20rpx;
}

.recommended-route-card {
	flex: 0 0 336rpx;
	width: 336rpx;
	display: flex;
	flex-direction: column;
	margin-top: 0;
	padding: 20rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.18);
	border-radius: 28rpx;
	background: rgba(255, 252, 246, 0.70);
	box-sizing: border-box;
	white-space: normal;
}

.route-card-header {
	display: block;
}

.route-thumbnail {
	display: block;
	width: 100%;
	aspect-ratio: 1.25;
	height: 178rpx;
	margin-bottom: 18rpx;
	border-radius: 24rpx;
	background: rgba(181, 148, 94, 0.14);
	object-fit: cover;
	overflow: hidden;
}

.route-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	line-height: 1.35;
	color: #102F29;
}

.route-desc {
	display: block;
	margin-top: 8rpx;
	font-size: 22rpx;
	line-height: 1.5;
	color: #746F68;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	line-clamp: 3;
	-webkit-box-orient: vertical;
}

.route-theme {
	display: inline-flex;
	margin-top: 12rpx;
	padding: 8rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.16);
	font-size: 22rpx;
	color: #173F35;
}

.route-meta {
	justify-content: flex-start;
	flex-wrap: wrap;
	margin-top: 16rpx;
	gap: 10rpx;
}

.route-meta text {
	padding: 7rpx 10rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.62);
	font-size: 20rpx;
	color: #746F68;
}

.route-keywords {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 16rpx;
}

.route-keyword {
	padding: 6rpx 10rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.12);
	font-size: 20rpx;
	color: #8A6B3D;
}

.route-stops {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 18rpx;
}

.route-stop {
	padding: 8rpx 10rpx;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.08);
	font-size: 20rpx;
	color: #173F35;
}

.route-card-action {
	gap: 16rpx;
	justify-content: flex-start;
	margin-top: 20rpx;
}

.recommended-route-card .route-card-action {
	margin-top: auto;
	padding-top: 20rpx;
	gap: 10rpx;
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

.recommended-route-card .mini-button {
	flex: 1;
	min-width: 0;
	height: 58rpx;
	line-height: 58rpx;
	padding: 0 10rpx;
	font-size: 21rpx;
	white-space: nowrap;
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
