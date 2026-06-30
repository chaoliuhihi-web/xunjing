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

		<view class="hero xicheng-reference-hero">
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

		<view class="home-action-duo">
			<view class="home-action-card home-scan-card" :class="{ 'home-action-disabled': recognizing }" @click="startScanRecognition">
				<view class="home-action-icon">
					<xicheng-icon name="scan" variant="plain" active :size="28" />
				</view>
				<view class="home-action-copy">
					<text class="home-action-title">扫一扫</text>
					<text class="home-action-desc">拍照识别 · 文字识别 · 附近触发</text>
				</view>
				<xicheng-icon name="next" variant="plain" active :size="22" />
			</view>
			<view class="home-action-card home-ask-card" :class="{ 'home-action-disabled': recognizing }" @click="askXiaojing">
				<view class="home-action-icon">
					<xicheng-icon name="qa" variant="plain" :size="28" />
				</view>
				<view class="home-action-copy">
					<text class="home-action-title">问问小京</text>
					<text class="home-action-desc">故事、路线和建筑</text>
				</view>
				<xicheng-icon name="next" variant="plain" :size="22" />
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

		<view id="xicheng-route-section" class="route-recommendation-section">
			<view class="section-head route-reference-head">
				<view class="route-reference-title-wrap">
					<xicheng-icon name="route" variant="plain" :size="24" />
					<text class="section-title">路线推荐</text>
				</view>
				<text class="section-link" @click="handleXichengHomeNav('routes')">查看全部</text>
			</view>
			<view class="route-reference-grid">
				<view
					v-for="route in filteredRecommendedRoutes.slice(0, 3)"
					:key="route.routeCode"
					class="route-reference-card"
					@click="openRecommendedRouteDetail(route)"
				>
					<view class="route-reference-image-wrap">
						<image
							v-if="getRouteThumbnail(route)"
							class="route-reference-image"
							:src="getRouteThumbnail(route)"
							mode="aspectFill"
						/>
						<view class="route-reference-badge">
							<xicheng-icon :name="route.routeCode === 'beihai-shichahai-waterfront' ? 'layer' : route.routeCode === 'dashilar-old-brand-walk' ? 'routes' : 'passport'" variant="primary" :size="18" />
						</view>
					</view>
					<text class="route-reference-name">{{ getDisplayRouteTitle(route) }}</text>
					<text class="route-reference-desc">{{ getRouteKeywordLine(route) }}</text>
				</view>
			</view>
		</view>

		<view class="home-memory-grid">
			<view class="travelogue-teaser-card xicheng-paper-card" @click="openXichengTravelogue('draft')">
				<view class="travelogue-teaser-head">
					<xicheng-icon name="edit" variant="plain" :size="24" />
					<text class="travelogue-teaser-title">生成我的西城游记</text>
				</view>
				<text class="travelogue-teaser-desc">AI 帮你记录行程，生成专属游记</text>
				<xicheng-icon class="travelogue-teaser-arrow" name="next" variant="primary" :size="22" />
			</view>

			<view
				class="recent-panel recent-compact-card xicheng-paper-card"
				:class="{ 'recent-panel-empty': !recentRecognition }"
				@click="recentRecognition ? openRecentRecognition() : startScanRecognition()"
			>
				<image
					v-if="recentRecognition"
					class="recent-compact-image"
					:src="recentRecognitionVisual"
					mode="aspectFill"
				/>
				<view class="recent-copy">
					<text class="recent-kicker">最近识别：</text>
					<text class="recent-title">{{ recentRecognition ? (recentRecognition.poiName || '西城文化点') : '待开始' }}</text>
					<text class="recent-desc">
						{{ recentRecognition ? `${recentRecognition.sourceLabel || '识别结果'} · 置信度 ${recentRecognitionConfidence}%` : '完成扫一扫后显示在这里' }}
					</text>
					<text v-if="recentRecognition" class="recent-status">{{ recentRecognitionStatusCopy }}</text>
					<view
						v-if="recentRecognition"
						class="recent-compact-action"
						:class="{ 'recent-compact-action-disabled': recentRecognitionActionBlocked }"
						@click.stop="continueRecentRecognitionWithXiaojing"
					>
						<text>开始讲解</text>
						<xicheng-icon name="play" variant="plain" active :size="18" />
					</view>
					<view v-else class="recent-compact-action recent-compact-action-empty" @click.stop="startScanRecognition">
						<text>去识别</text>
						<xicheng-icon name="scan" variant="plain" active :size="18" />
					</view>
				</view>
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
				<button class="primary-button xicheng-primary-action" @click="openXichengRecording">开始记录 Citywalk</button>
				<button class="ghost-button xicheng-secondary-action" @click="openXichengTravelogue('draft')">生成游记草稿</button>
			</view>
		</view>

		<view class="ops-section">
			<view class="ops-card xicheng-paper-card" @click="openXichengPassport">
				<text class="ops-title">{{ routePassport.title }}</text>
				<text class="ops-desc">{{ routePassport.thresholdText }}</text>
			</view>
			<view class="ops-card xicheng-paper-card">
				<text class="ops-title">亲子研学任务</text>
				<text class="ops-desc">{{ parentChildTasks[0] }}</text>
			</view>
			<view class="ops-card xicheng-paper-card" @click="openXichengShare">
				<text class="ops-title">分享海报</text>
				<text class="ops-desc">{{ sharePoster.subtitle }}</text>
			</view>
			<view class="ops-card xicheng-paper-card" @click="openXichengOpsReport">
				<text class="ops-title">运营报告</text>
				<text class="ops-desc">查看识别、路线、分享和审核安全汇总</text>
			</view>
		</view>

		<view v-if="lastError" class="error-line">{{ lastError }}</view>

		<xicheng-bottom-nav
			:items="xichengHomeNavItems"
			active-key="explore"
			@navigate="handleXichengHomeNav"
		/>
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
import XichengBottomNav from '@/components/xicheng-bottom-nav/xicheng-bottom-nav.vue'

const XICHENG_EMPTY_RECOGNITION_POI_NAME = '待确认西城文化点'
const encodeRouteValue = (value = '') => createXichengRouteOutputValue(value, { platform: process.env.UNI_PLATFORM })

export default {
	components: {
		XichengBottomNav
	},
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
				{ key: 'explore', title: '探索', icon: 'explore' },
				{ key: 'routes', title: '地图', icon: 'routes' },
				{ key: 'footprint', title: '收藏', icon: 'favorite' },
				{ key: 'mine', title: '我的', icon: 'mine' }
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
		recentRecognitionVisual() {
			const visualAssets = this.region && this.region.visualAssets ? this.region.visualAssets : {}
			const poiCards = visualAssets.poiCards || {}
			const poiCode = this.recentRecognition && this.recentRecognition.poiCode
			return poiCards[poiCode] || visualAssets.heroLandmark || ''
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
		getDisplayRouteTitle(route = {}) {
			if (route.routeCode === 'baitasi-imperial-shichahai') return '白塔寺文化线'
			if (route.routeCode === 'beihai-shichahai-waterfront') return '什刹海漫步线'
			if (route.routeCode === 'dashilar-old-brand-walk') return '胡同烟火线'
			return route.title || '西城 Citywalk'
		},
		getRouteKeywordLine(route = {}) {
			const keywords = Array.isArray(route.keywords) ? route.keywords.filter(Boolean) : []
			return keywords.length > 0 ? keywords.slice(0, 2).join(' · ') : route.theme || route.durationText || '西城文化路线'
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
			uni.navigateTo({
				url: `/pages/xicheng/scan/scan?regionCode=${encodeRouteValue(this.region.regionCode)}&packageCode=${encodeRouteValue(this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.region.sourceChannel)}&companionName=${encodeRouteValue(this.region.companionName)}`
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
					this.openXichengRoutes()
					break
				case 'record':
					this.openXichengRecording()
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
					this.openXichengRoutes()
					break
				case 'footprint':
					this.openXichengFootprint()
					break
				case 'mine':
					this.openXichengWorks()
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
		openXichengRecording() {
			uni.navigateTo({
				url: `/pages/xicheng/recording/recording?autoStart=1&regionCode=${encodeRouteValue(this.region.regionCode)}&packageCode=${encodeRouteValue(this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.region.sourceChannel)}&companionName=${encodeRouteValue(this.region.companionName)}`
			})
		},
		openXichengFootprint() {
			uni.navigateTo({ url: '/pages/xicheng/footprint/footprint' })
		},
		openXichengPassport() {
			uni.navigateTo({ url: '/pages/xicheng/passport/passport' })
		},
		openXichengShare() {
			uni.navigateTo({ url: '/pages/xicheng/share/share' })
		},
		openXichengWorks() {
			uni.navigateTo({ url: '/pages/xicheng/works/works' })
		},
		openXichengOpsReport() {
			uni.navigateTo({ url: '/pages/xicheng/ops-report/ops-report' })
		},
		openXichengInspiration() {
			uni.navigateTo({
				url: `/pages/xicheng/inspiration/inspiration?regionCode=${encodeRouteValue(this.region.regionCode)}&packageCode=${encodeRouteValue(this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.region.sourceChannel)}&companionName=${encodeRouteValue(this.region.companionName)}`
			})
		},
		openXichengRoutes() {
			uni.navigateTo({
				url: `/pages/xicheng/routes/routes?regionCode=${encodeRouteValue(this.region.regionCode)}&packageCode=${encodeRouteValue(this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.region.sourceChannel)}&companionName=${encodeRouteValue(this.region.companionName)}`
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
	padding: 26rpx;
	border-radius: 34rpx;
	background:
		linear-gradient(135deg, rgba(255, 253, 248, 0.96), rgba(246, 239, 226, 0.92));
	color: #102F29;
	box-shadow: 0 16rpx 38rpx rgba(35, 42, 34, 0.08);
}

.inspiration-title {
	display: block;
	font-size: 31rpx;
	font-weight: 700;
	color: #173F35;
}

.inspiration-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #746F68;
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

.home-memory-grid {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
	gap: 18rpx;
	margin-top: 24rpx;
}

.travelogue-teaser-card,
.recent-compact-card {
	min-height: 216rpx;
	padding: 24rpx;
	border-radius: 34rpx;
	box-sizing: border-box;
}

.travelogue-teaser-card {
	position: relative;
	background:
		linear-gradient(135deg, rgba(255, 253, 248, 0.96), rgba(239, 233, 219, 0.90));
}

.travelogue-teaser-head {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.travelogue-teaser-title {
	font-size: 31rpx;
	line-height: 1.25;
	font-weight: 700;
	color: #102F29;
}

.travelogue-teaser-desc {
	display: block;
	margin-top: 18rpx;
	max-width: 230rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #746F68;
}

.travelogue-teaser-arrow {
	position: absolute;
	right: 22rpx;
	bottom: 22rpx;
}

.recent-panel {
	display: grid;
	grid-template-columns: 114rpx minmax(0, 1fr);
	gap: 18rpx;
	align-items: center;
	background:
		linear-gradient(135deg, rgba(255, 249, 238, 0.98), rgba(239, 222, 190, 0.52));
}

.recent-copy {
	min-width: 0;
}

.recent-compact-image {
	width: 114rpx;
	height: 146rpx;
	border-radius: 22rpx;
	object-fit: cover;
	box-shadow: 0 10rpx 22rpx rgba(16, 47, 41, 0.10);
}

.recent-panel-empty {
	grid-template-columns: minmax(0, 1fr);
	background:
		linear-gradient(135deg, rgba(255, 253, 248, 0.96), rgba(245, 238, 225, 0.82));
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
	margin-top: 6rpx;
	font-size: 22rpx;
	line-height: 1.4;
	color: #173F35;
}

.recent-actions,
.recent-compact-action {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	margin-top: 24rpx;
}

.recent-compact-action {
	width: 168rpx;
	min-height: 58rpx;
	padding: 0 18rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #B5945E, #967440);
	color: #FFF9EC;
	font-size: 23rpx;
	font-weight: 700;
	box-shadow: 0 10rpx 22rpx rgba(150, 116, 64, 0.22);
}

.recent-compact-action-disabled {
	background: #B8B4A9;
	box-shadow: none;
	opacity: 0.72;
}

.recent-compact-action-empty {
	background: linear-gradient(135deg, #173F35, #102F29);
}

.ops-section {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20rpx;
	margin-top: 28rpx;
}

.ops-card {
	min-height: 136rpx;
	padding: 22rpx;
	border-radius: 30rpx;
	box-sizing: border-box;
}

.ops-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #173F35;
}

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

.section-head {
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

.xicheng-reference-hero {
	min-height: 640rpx;
	padding: 44rpx 40rpx 28rpx;
	border-radius: 38rpx;
	overflow: hidden;
	background:
		linear-gradient(180deg, rgba(255, 253, 247, 0.10) 0%, rgba(255, 250, 241, 0.36) 54%, rgba(255, 250, 241, 0.96) 100%),
		#F8F2E8;
	box-shadow: 0 24rpx 56rpx rgba(35, 42, 34, 0.12);
}

.xicheng-reference-hero .hero-landmark-image {
	opacity: 0.72;
	filter: saturate(0.98) contrast(1.04);
}

.xicheng-reference-hero .hero-atmosphere {
	height: 46%;
	background:
		linear-gradient(180deg, rgba(255, 250, 241, 0), rgba(255, 250, 241, 0.82));
}

.xicheng-reference-hero .hero-copy {
	max-width: 460rpx;
	padding-top: 42rpx;
}

.xicheng-reference-hero .eyebrow {
	font-size: 25rpx;
	color: #173F35;
}

.xicheng-reference-hero .title {
	margin-top: 24rpx;
	font-size: 66rpx;
	letter-spacing: 0;
}

.xicheng-reference-hero .subtitle {
	margin-top: 24rpx;
	font-size: 30rpx;
	letter-spacing: 6rpx;
	color: rgba(16, 47, 41, 0.78);
}

.xicheng-reference-hero .companion-visual {
	right: -8rpx;
	bottom: 18rpx;
	width: 386rpx;
}

.xicheng-reference-hero .xiaojing-avatar {
	width: 386rpx;
	height: 462rpx;
	border-radius: 0;
	background: transparent;
	box-shadow: none;
}

.xicheng-reference-hero .companion-bubble {
	left: -230rpx;
	bottom: 136rpx;
	width: 278rpx;
	padding: 24rpx 22rpx;
	border-radius: 34rpx;
	background: rgba(255, 253, 248, 0.94);
}

.home-action-duo {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 18rpx;
	margin-top: 26rpx;
}

.home-action-card {
	min-height: 158rpx;
	padding: 20rpx 22rpx;
	border-radius: 30rpx;
	box-sizing: border-box;
	box-shadow: 0 16rpx 34rpx rgba(35, 42, 34, 0.10);
}

.home-action-disabled {
	opacity: 0.56;
	pointer-events: none;
}

.home-scan-card {
	display: grid;
	grid-template-columns: 58rpx 1fr 38rpx;
	align-items: center;
	gap: 18rpx;
	background: linear-gradient(135deg, #173F35, #0F332D);
	color: #FFF9EC;
}

.home-ask-card {
	display: grid;
	grid-template-columns: 58rpx 1fr 38rpx;
	align-items: center;
	gap: 18rpx;
	background: rgba(255, 253, 248, 0.94);
	color: #102F29;
	border: 1rpx solid rgba(181, 148, 94, 0.18);
}

.home-action-icon {
	display: flex;
	align-items: center;
	justify-content: center;
}

.home-action-copy {
	min-width: 0;
}

.home-action-title,
.home-action-desc {
	display: block;
}

.home-action-title {
	font-size: 34rpx;
	font-weight: 700;
	line-height: 1.25;
}

.home-action-desc {
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.35;
	color: currentColor;
	opacity: 0.76;
}

.route-recommendation-section {
	margin-top: 40rpx;
	padding: 0 8rpx;
}

.route-reference-head {
	align-items: center;
	margin-bottom: 22rpx;
}

.route-reference-title-wrap {
	display: flex;
	align-items: center;
	gap: 14rpx;
}

.route-reference-title-wrap .section-title {
	margin-top: 0;
	font-size: 38rpx;
}

.route-reference-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14rpx;
}

.route-reference-card {
	min-width: 0;
	padding: 12rpx;
	border-radius: 24rpx;
	background: rgba(255, 253, 248, 0.90);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
	box-shadow: 0 14rpx 34rpx rgba(35, 42, 34, 0.08);
	box-sizing: border-box;
}

.route-reference-image-wrap {
	position: relative;
	height: 126rpx;
	border-radius: 20rpx;
	overflow: hidden;
	background: rgba(181, 148, 94, 0.12);
}

.route-reference-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.route-reference-badge {
	position: absolute;
	left: 10rpx;
	top: 10rpx;
}

.route-reference-name,
.route-reference-desc {
	display: block;
}

.route-reference-name {
	margin-top: 14rpx;
	font-size: 25rpx;
	line-height: 1.25;
	font-weight: 700;
	color: #102F29;
}

.route-reference-desc {
	margin-top: 8rpx;
	font-size: 20rpx;
	line-height: 1.35;
	color: #746F68;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
