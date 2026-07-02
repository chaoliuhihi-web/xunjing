<template>
	<view class="xicheng-home xicheng-home-first-screen-density xicheng-designed-page xicheng-bottom-safe">
		<view class="home-location-row">
			<view class="home-location-main">
				<view class="home-location-pin"></view>
				<text>{{ region.cityName }}</text>
				<view class="home-location-caret"></view>
			</view>
			<view class="home-share-button" @click="openXichengShare">
				<xicheng-icon name="travelogue" variant="plain" :size="22" />
			</view>
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
					<view class="hero-ask-card xicheng-companion-bubble" :class="{ 'home-action-disabled': recognizing }" @click="askXiaojing">
						<view class="hero-ask-icon">
							<xicheng-icon name="qa" variant="plain" :size="24" />
						</view>
						<view class="hero-ask-copy">
							<text class="hero-ask-title">问问小京</text>
							<text class="hero-ask-desc">我陪你看懂西城</text>
						</view>
						<xicheng-icon name="next" variant="plain" :size="18" />
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
			<view
				id="xicheng-recent-recognition-section"
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

		<view id="xicheng-map-entry-section" class="home-light-entry-grid">
			<view class="home-light-entry home-map-entry xicheng-paper-card" @click="openXichengRoutes">
				<view class="home-light-entry-icon">
					<xicheng-icon name="routes" variant="plain" :size="25" />
				</view>
				<text class="home-light-entry-title">文旅地图</text>
				<text class="home-light-entry-copy">POI 地图 · 路线推荐</text>
			</view>
			<view class="home-light-entry home-record-entry xicheng-paper-card home-travelogue-entry" @click="openXichengTravelogue('draft')">
				<view class="home-light-entry-icon">
					<xicheng-icon name="edit" variant="plain" :size="25" />
				</view>
				<text class="home-light-entry-title">游记生成</text>
				<text class="home-light-entry-copy">AI 帮你记录行程，生成专属游记</text>
				<view class="home-travelogue-actions">
					<view class="home-start-record-button" @click.stop="openXichengRecording">开始记录</view>
					<view class="home-draft-button" @click.stop="openXichengTravelogue('draft')">游记草稿</view>
				</view>
			</view>
		</view>

		<view id="xicheng-home-route-recommendation-section" class="home-route-recommendation-section">
			<view class="home-route-head">
				<view>
					<text class="home-route-kicker">路线推荐</text>
					<text class="home-route-title">官方 Citywalk</text>
				</view>
				<button class="home-route-more xicheng-secondary-action" @click="openXichengRoutes">一键抄作业</button>
			</view>
			<view class="home-route-list">
				<view
					v-for="route in homeRouteRecommendations"
					:key="route.routeCode"
					class="home-route-card xicheng-paper-card"
					@click="openHomeRecommendedRoute(route)"
				>
					<image
						v-if="getHomeRouteThumbnail(route)"
						class="home-route-cover"
						:src="getHomeRouteThumbnail(route)"
						mode="aspectFill"
					/>
					<view class="home-route-copy">
						<text class="home-route-card-title">{{ getHomeRouteDisplayTitle(route) }}</text>
						<text class="home-route-card-desc">{{ getHomeRouteKeywordLine(route) }}</text>
						<view class="home-route-meta">
							<text>{{ route.durationText }}</text>
							<text>{{ route.distanceText || '可步行' }}</text>
							<text>{{ getHomeRouteStopCount(route) }}个景点</text>
						</view>
						<button class="home-route-button xicheng-primary-action" @click.stop="openHomeRecommendedRoute(route)">查看路线</button>
					</view>
				</view>
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
	XICHENG_OFFICIAL_POIS,
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
			xichengHomeNavItems: [
				{ key: 'explore', title: '探索', icon: 'explore' },
				{ key: 'vision', title: 'AI识境', icon: 'scan' },
				{ key: 'routes', title: '地图', icon: 'routes' },
				{ key: 'record', title: '记录', icon: 'record' },
				{ key: 'mine', title: '我的', icon: 'mine' }
			],
			currentLocation: null,
			textRecognitionInput: '',
			textRecognitionPanelExpanded: false,
			recognizing: false,
			lastError: '',
			recentRecognition: null,
			recommendedRoutes: XICHENG_RECOMMENDED_ROUTES,
			worldEntrySignals: [],
			worldEntrySummary: '镜头待命，定位后会融合现场信号'
		}
	},
	computed: {
		homeRouteRecommendations() {
			return this.recommendedRoutes.slice(0, 2)
		},
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
		}
	},
	onLoad() {
		this.loadRecentRecognition()
		this.refreshSceneVisionEntry()
	},
	onShow() {
		this.loadRecentRecognition()
		this.refreshSceneVisionEntry()
	},
	methods: {
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
				: this.createDefaultRecentRecognitionPreview()
		},
		createDefaultRecentRecognitionPreview() {
			const officialPoi = XICHENG_OFFICIAL_POIS.find(poi => poi.poiCode === 'xicheng-baitasi') || {}
			const sourceCard = {
				title: '西城文旅官方资料库',
				name: '西城文旅官方资料库',
				type: 'OFFICIAL_KNOWLEDGE_BASE',
				summary: '白塔寺官方 POI 资料、路线讲解与公开文旅说明',
				reviewStatus: 'APPROVED'
			}
			return {
				previewOnly: true,
				source: 'home-default-official-poi',
				sourceLabel: 'POI 详情',
				regionCode: this.region.regionCode,
				packageCode: this.region.packageCode,
				sceneCode: this.region.sceneCode,
				sourceChannel: this.region.sourceChannel,
				companionName: this.region.companionName,
				poiCode: officialPoi.poiCode || 'xicheng-baitasi',
				poiName: officialPoi.poiName || '白塔寺',
				theme: officialPoi.theme || '寺庙建筑',
				confidence: 1,
				safetyStatus: 'PASSED',
				sourceCount: 6,
				sources: [sourceCard],
				suggestedQuestions: [
					'白塔寺最值得看的建筑细节是什么？',
					'从白塔寺出发怎么走一条西城 Citywalk？',
					'把白塔寺写进我的游记草稿'
				],
				visionCaption: officialPoi.summary || '白塔寺官方 POI 预览'
			}
		},
		readVisionAgentMemorySessionPackage() {
			try {
				const visionAgentMemorySessionPackage = uni.getStorageSync(XICHENG_REGION_CONFIG.visionAgentMemorySessionStorageKey)
				return visionAgentMemorySessionPackage && typeof visionAgentMemorySessionPackage === 'object' && Number(visionAgentMemorySessionPackage.sceneCount || 0) > 0
					? visionAgentMemorySessionPackage
					: null
			} catch (error) {
				return null
			}
		},
		createVisionAgentMemorySessionText(visionAgentMemorySessionPackage = null) {
			if (!visionAgentMemorySessionPackage || typeof visionAgentMemorySessionPackage !== 'object') return ''
			return [
				visionAgentMemorySessionPackage.continuityCueText,
				visionAgentMemorySessionPackage.poiTrailText,
				visionAgentMemorySessionPackage.domainContinuityText,
				visionAgentMemorySessionPackage.serviceContinuityText
			].filter(Boolean).join(' ').slice(0, 96)
		},
		refreshSceneVisionEntry() {
			const context = this.buildSceneVisionContext()
			this.worldEntrySignals = this.buildSceneVisionSignals(context)
			this.worldEntrySummary = this.buildSceneVisionSummary(context, this.worldEntrySignals)
		},
		readSceneVisionStorageText(key = '') {
			try {
				const value = uni.getStorageSync(key)
				if (value === undefined || value === null) return ''
				return typeof value === 'string' ? value : String(value)
			} catch (error) {
				return ''
			}
		},
		readSceneVisionStorageNumber(key = '') {
			const value = Number(this.readSceneVisionStorageText(key))
			return Number.isFinite(value) ? value : ''
		},
		formatSceneVisionLocalTime(date = new Date()) {
			const pad = (number) => String(number).padStart(2, '0')
			return `${pad(date.getHours())}:${pad(date.getMinutes())}`
		},
		buildSceneRecognitionMemory(recognition = this.recentRecognition || {}) {
			if (!recognition || typeof recognition !== 'object' || (!recognition.poiCode && !recognition.poiName)) return ''
			return JSON.stringify({
				poiCode: recognition.poiCode || '',
				poiName: recognition.poiName || '',
				source: recognition.source || '',
				sourceLabel: recognition.sourceLabel || '',
				sceneCode: recognition.sceneCode || this.region.sceneCode,
				confidence: recognition.confidence || '',
				safetyStatus: recognition.safetyStatus || ''
			})
		},
		buildSceneVisionContext() {
			const recentRecognition = this.recentRecognition || {}
			const memorySessionPackage = this.readVisionAgentMemorySessionPackage()
			const visionAgentMemorySessionText = this.createVisionAgentMemorySessionText(memorySessionPackage)
			const memorySessionSceneCount = Number(memorySessionPackage && memorySessionPackage.sceneCount ? memorySessionPackage.sceneCount : 0)
			const localTimeText = this.readSceneVisionStorageText('xicheng_scene_local_time_text') || this.formatSceneVisionLocalTime()
			const weatherText = recentRecognition.weatherText || this.readSceneVisionStorageText('xicheng_scene_weather_text')
			const headingText = recentRecognition.headingText || this.readSceneVisionStorageText('xicheng_scene_heading_text')
			const headingDegrees = recentRecognition.headingDegrees === undefined || recentRecognition.headingDegrees === null
				? this.readSceneVisionStorageNumber('xicheng_scene_heading_degrees')
				: recentRecognition.headingDegrees
			const userInterestTags = recentRecognition.userInterestTags || this.readSceneVisionStorageText('xicheng_user_interest_tags')
			return {
				context: 'vision-agent',
				mode: 'camera',
				sceneIntent: 'scene-understanding',
				entry: 'home-world-entry',
				regionCode: this.region.regionCode,
				packageCode: this.region.packageCode,
				sceneCode: this.region.sceneCode,
				sourceChannel: this.region.sourceChannel,
				companionName: this.region.companionName,
				sceneSessionId: recentRecognition.sceneSessionId || this.readSceneVisionStorageText('xicheng_scene_session_id') || '',
				sourceRecognitionContext: recentRecognition.sourceRecognitionContext || this.buildSceneRecognitionMemory(recentRecognition),
				visionCaption: recentRecognition.visionCaption || recentRecognition.poiName || '',
				locationText: recentRecognition.locationText || this.readSceneVisionStorageText('xicheng_location_text'),
				localTimeText,
				weatherText,
				headingText,
				headingDegrees,
				activityText: recentRecognition.activityText || this.readSceneVisionStorageText('xicheng_activity_text'),
				serviceText: recentRecognition.serviceText || this.readSceneVisionStorageText('xicheng_service_text'),
				knowledgeGraphText: recentRecognition.knowledgeGraphText || this.readSceneVisionStorageText('xicheng_knowledge_graph_text'),
				userInterestTags,
				visionAgentMemorySessionPackage: memorySessionPackage,
				visionAgentMemorySessionText: visionAgentMemorySessionText,
				memorySessionSceneCount
			}
		},
		buildSceneVisionSignals(context = this.buildSceneVisionContext()) {
			const environmentText = [context.localTimeText, context.weatherText].filter(Boolean).join(' ')
			const serviceText = [context.activityText, context.serviceText].filter(Boolean).join(' · ')
			const memorySessionSceneCount = Number(context.memorySessionSceneCount || 0)
			const memorySessionText = context.visionAgentMemorySessionText || ''
			return [
				{ key: 'camera', label: '镜头', statusText: '拍一下', active: true },
				{ key: 'gps', label: 'GPS', statusText: context.locationText || '待授权', active: Boolean(context.locationText) },
				{ key: 'environment', label: '时间天气', statusText: environmentText || '待刷新', active: Boolean(environmentText) },
				{ key: 'memory-session', label: '连续识境', statusText: memorySessionSceneCount > 0 ? `${memorySessionSceneCount}次识境` : '待形成', active: memorySessionSceneCount > 0 || Boolean(memorySessionText) },
				{ key: 'service', label: '城市服务', statusText: serviceText || '待匹配', active: Boolean(serviceText) },
				{ key: 'knowledge', label: '知识图谱', statusText: context.knowledgeGraphText || '待连接', active: Boolean(context.knowledgeGraphText) }
			]
		},
		buildSceneVisionSummary(context = {}, signals = []) {
			const activeCount = signals.filter(signal => signal && signal.active).length
			const subject = context.locationText || context.visionCaption || this.region.cityName
			const service = context.visionAgentMemorySessionText || context.activityText || context.serviceText || context.knowledgeGraphText || ''
			return [
				`${subject} · ${activeCount}类现场信号已接入`,
				service ? `下一步会优先结合${service}` : '举起手机后直接进入场景理解'
			].join('，').slice(0, 88)
		},
		buildVisionAgentSceneContext(source = '', trigger = {}) {
			const context = this.buildSceneVisionContext()
			const sceneFusionSignals = this.buildSceneVisionSignals(context)
			return {
				...context,
				sceneFusionSummary: this.buildSceneVisionSummary(context, sceneFusionSignals),
				sceneFusionSignals,
				source,
				poiCode: trigger.poiCode || '',
				poiName: trigger.poiName || '',
				sourceLabel: trigger.sourceLabel || '',
				confidence: trigger.confidence || '',
				safetyStatus: trigger.safetyStatus || '',
				visionCaption: trigger.visionCaption || trigger.poiName || context.visionCaption || '',
				visionAgentMemorySessionPackage: context.visionAgentMemorySessionPackage,
				visionAgentMemorySessionText: context.visionAgentMemorySessionText,
				memorySessionSceneCount: context.memorySessionSceneCount
			}
		},
		buildTriggerSceneSignals(source = '') {
			return this.buildVisionAgentSceneContext(source, {})
		},
		buildSceneVisionEntryUrl(context = this.buildSceneVisionContext(), entry = 'home-world-entry') {
			const params = [
				['context', 'vision-agent'],
				['mode', 'camera'],
				['sceneIntent', 'scene-understanding'],
				['entry', entry],
				['regionCode', context.regionCode || this.region.regionCode],
				['packageCode', context.packageCode || this.region.packageCode],
				['sceneCode', context.sceneCode || this.region.sceneCode],
				['sourceChannel', context.sourceChannel || this.region.sourceChannel],
				['companionName', context.companionName || this.region.companionName],
				['sceneSessionId', context.sceneSessionId || ''],
				['sourceRecognitionContext', context.sourceRecognitionContext || ''],
				['visionCaption', context.visionCaption || ''],
				['locationText', context.locationText || ''],
				['localTimeText', context.localTimeText || ''],
				['weatherText', context.weatherText || ''],
				['headingText', context.headingText || ''],
				['headingDegrees', context.headingDegrees === undefined || context.headingDegrees === null ? '' : context.headingDegrees],
				['activityText', context.activityText || ''],
				['serviceText', context.serviceText || ''],
				['knowledgeGraphText', context.knowledgeGraphText || ''],
				['userInterestTags', context.userInterestTags || ''],
				['memorySessionText', context.visionAgentMemorySessionText || ''],
				['memorySessionSceneCount', context.memorySessionSceneCount || '']
			]
			return `/pages/xicheng/scan/scan?${params.map(item => `${item[0]}=${encodeRouteValue(item[1])}`).join('&')}`
		},
		startSceneVisionAgent() {
			this.refreshSceneVisionEntry()
			uni.navigateTo({
				url: this.buildSceneVisionEntryUrl(this.buildSceneVisionContext(), 'home-world-entry')
			})
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
					source,
					sceneSignals: this.buildTriggerSceneSignals(source)
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
			const entry = 'home-primary'
			uni.navigateTo({
				url: this.buildSceneVisionEntryUrl(this.buildSceneVisionContext(), entry)
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
							ocrText: this.textRecognitionInput.trim(),
							sceneSignals: this.buildTriggerSceneSignals('ocr')
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
					location,
					sceneSignals: this.buildTriggerSceneSignals('gps')
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
						const trigger = await resolveXichengPhotoTrigger({
							filePath,
							sceneSignals: this.buildTriggerSceneSignals('photo')
						})
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
				companionName: this.region.companionName,
				visionAgentContext: this.buildVisionAgentSceneContext(source, trigger)
			}
			const unsafeSafetyStatus = isXichengUnsafeSafetyStatus(normalizeXichengSafetyStatus(result.safetyStatus))
			if (unsafeSafetyStatus) {
				uni.removeStorageSync(this.region.storageKey)
				this.recentRecognition = null
			} else {
				uni.setStorageSync(this.region.storageKey, result)
				this.recentRecognition = result
			}
			uni.navigateTo({
				url: `/pages/xicheng/scan-result/scan-result?source=${encodeRouteValue(source)}&regionCode=${encodeRouteValue(result.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(result.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(result.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(result.sourceChannel || this.region.sourceChannel)}&poiCode=${encodeRouteValue(result.poiCode || '')}&poiName=${encodeRouteValue(result.poiName || '')}&companionName=${encodeRouteValue(result.companionName || this.region.companionName)}&safetyStatus=${encodeRouteValue(result.safetyStatus || '')}&visionAgentContext=${encodeRouteValue(JSON.stringify(result.visionAgentContext || {}))}&sourceRecognitionContext=${encodeRouteValue(result.visionAgentContext.sourceRecognitionContext || '')}&memorySessionSceneCount=${encodeRouteValue(result.visionAgentContext.memorySessionSceneCount || '')}`
			})
		},
		openRecentRecognition() {
			if (!this.recentRecognition) return
			const visionAgentContext = this.recentRecognition.visionAgentContext && typeof this.recentRecognition.visionAgentContext === 'object'
				? this.recentRecognition.visionAgentContext
				: this.buildVisionAgentSceneContext(this.recentRecognition.source || 'recent', this.recentRecognition)
			uni.navigateTo({
				url: `/pages/xicheng/scan-result/scan-result?source=${encodeRouteValue(this.recentRecognition.source || '')}&regionCode=${encodeRouteValue(this.recentRecognition.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(this.recentRecognition.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(this.recentRecognition.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.recentRecognition.sourceChannel || this.region.sourceChannel)}&poiCode=${encodeRouteValue(this.recentRecognition.poiCode || '')}&poiName=${encodeRouteValue(this.recentRecognition.poiName || '')}&companionName=${encodeRouteValue(this.recentRecognition.companionName || this.region.companionName)}&safetyStatus=${encodeRouteValue(this.recentRecognition.safetyStatus || '')}&visionAgentContext=${encodeRouteValue(JSON.stringify(visionAgentContext))}&sourceRecognitionContext=${encodeRouteValue(visionAgentContext.sourceRecognitionContext || '')}&memorySessionSceneCount=${encodeRouteValue(visionAgentContext.memorySessionSceneCount || '')}`
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
			const visionAgentContext = this.recentRecognition.visionAgentContext && typeof this.recentRecognition.visionAgentContext === 'object'
				? this.recentRecognition.visionAgentContext
				: this.buildVisionAgentSceneContext(this.recentRecognition.source || 'recent', this.recentRecognition)
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
				`safetyStatus=${encodeRouteValue(this.recentRecognition.safetyStatus || '')}`,
				`visionAgentContext=${encodeRouteValue(JSON.stringify(visionAgentContext))}`,
				`sourceRecognitionContext=${encodeRouteValue(visionAgentContext.sourceRecognitionContext || '')}`,
				`memorySessionSceneCount=${encodeRouteValue(visionAgentContext.memorySessionSceneCount || '')}`
			].join('&')
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?${query}`
			})
		},
		askXiaojing() {
			if (this.recognizing) return
			const visionAgentContext = this.buildVisionAgentSceneContext('home-xiaojing', this.recentRecognition || {})
			const query = [
				`regionCode=${encodeRouteValue(this.region.regionCode)}`,
				`packageCode=${encodeRouteValue(this.region.packageCode)}`,
				`sceneCode=${encodeRouteValue(this.region.aiSceneCode || this.region.sceneCode)}`,
				`sourceChannel=${encodeRouteValue(this.region.sourceChannel)}`,
				`companionName=${encodeRouteValue(this.region.companionName)}`,
				`poiCode=${encodeRouteValue(visionAgentContext.poiCode || '')}`,
				`poiName=${encodeRouteValue(visionAgentContext.poiName || '')}`,
				`visionAgentContext=${encodeRouteValue(JSON.stringify(visionAgentContext))}`,
				`sourceRecognitionContext=${encodeRouteValue(visionAgentContext.sourceRecognitionContext || '')}`,
				`memorySessionSceneCount=${encodeRouteValue(visionAgentContext.memorySessionSceneCount || '')}`
			].join('&')
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?${query}`
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
				case 'vision':
					this.startSceneVisionAgent()
					break
				case 'routes':
					this.openXichengRoutes()
					break
				case 'record':
					this.openXichengRecording()
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
		openXichengTravelogue(mode = 'record') {
			const visionAgentContext = this.buildVisionAgentSceneContext('home-travelogue', this.recentRecognition || {})
			const query = [
				`mode=${encodeRouteValue(mode)}`,
				`autoStart=${encodeRouteValue(mode === 'record' ? '1' : '')}`,
				`regionCode=${encodeRouteValue(this.region.regionCode)}`,
				`packageCode=${encodeRouteValue(this.region.packageCode)}`,
				`sceneCode=${encodeRouteValue(this.region.sceneCode)}`,
				`sourceChannel=${encodeRouteValue(this.region.sourceChannel)}`,
				`companionName=${encodeRouteValue(this.region.companionName)}`,
				`poiCode=${encodeRouteValue(visionAgentContext.poiCode || '')}`,
				`poiName=${encodeRouteValue(visionAgentContext.poiName || '')}`,
				`safetyStatus=${encodeRouteValue(visionAgentContext.safetyStatus || '')}`,
				`visionAgentContext=${encodeRouteValue(JSON.stringify(visionAgentContext))}`,
				`sourceRecognitionContext=${encodeRouteValue(visionAgentContext.sourceRecognitionContext || '')}`,
				`memorySessionSceneCount=${encodeRouteValue(visionAgentContext.memorySessionSceneCount || '')}`
			].join('&')
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?${query}`
			})
		},
		openXichengRecording() {
			uni.navigateTo({
				url: `/pages/xicheng/recording/recording?autoStart=1&regionCode=${encodeRouteValue(this.region.regionCode)}&packageCode=${encodeRouteValue(this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.region.sourceChannel)}&companionName=${encodeRouteValue(this.region.companionName)}`
			})
		},
		openXichengShare() {
			uni.navigateTo({ url: '/pages/xicheng/share/share' })
		},
		openXichengWorks() {
			uni.navigateTo({ url: '/pages/xicheng/works/works' })
		},
		openXichengRoutes() {
			uni.navigateTo({
				url: `/pages/xicheng/routes/routes?regionCode=${encodeRouteValue(this.region.regionCode)}&packageCode=${encodeRouteValue(this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.region.sourceChannel)}&companionName=${encodeRouteValue(this.region.companionName)}`
			})
		},
		getHomeRouteThumbnail(route = {}) {
			const thumbnails = this.region.visualAssets && this.region.visualAssets.routeThumbnails
				? this.region.visualAssets.routeThumbnails
				: {}
			return thumbnails[route.routeCode] || this.region.visualAssets.heroLandmark || ''
		},
		getHomeRouteStopCount(route = {}) {
			return Array.isArray(route.stops) ? route.stops.length : 0
		},
		getHomeRouteDisplayTitle(route = {}) {
			if (route.routeCode === 'baitasi-imperial-shichahai') return '白塔寺文化线'
			if (route.routeCode === 'beihai-shichahai-waterfront') return '什刹海漫步线'
			if (route.routeCode === 'dashilar-old-brand-walk') return '胡同烟火线'
			return route.title || '西城 Citywalk'
		},
		getHomeRouteKeywordLine(route = {}) {
			const keywords = Array.isArray(route.keywords) ? route.keywords : []
			return keywords.length > 0 ? keywords.join(' · ') : route.summary || route.theme || '西城官方路线'
		},
		openHomeRecommendedRoute(route = {}) {
			uni.navigateTo({
				url: `/pages/xicheng/route-detail/route-detail?routeCode=${encodeRouteValue(route.routeCode || '')}&regionCode=${encodeRouteValue(this.region.regionCode)}&packageCode=${encodeRouteValue(this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.region.sourceChannel)}&companionName=${encodeRouteValue(this.region.companionName)}`
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

.home-share-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 64rpx;
	height: 64rpx;
	border: 2rpx solid rgba(23, 63, 53, 0.16);
	border-radius: 999rpx;
	background: rgba(255, 253, 248, 0.88);
	box-shadow: 0 10rpx 24rpx rgba(16, 47, 41, 0.08);
	box-sizing: border-box;
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

.hero-ask-card {
	position: absolute;
	left: -154rpx;
	bottom: 72rpx;
	z-index: 4;
	display: grid;
	grid-template-columns: 48rpx minmax(0, 1fr) 24rpx;
	align-items: center;
	gap: 12rpx;
	width: 286rpx;
	min-height: 112rpx;
	padding: 18rpx 16rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.18);
	border-radius: 32rpx;
	background: rgba(255, 253, 248, 0.94);
	box-shadow: 0 14rpx 32rpx rgba(16, 47, 41, 0.12);
	box-sizing: border-box;
}

.hero-ask-card::after {
	content: '';
	position: absolute;
	right: -14rpx;
	top: 42rpx;
	width: 28rpx;
	height: 28rpx;
	border-radius: 0 10rpx 0 0;
	background: rgba(255, 253, 248, 0.94);
	transform: rotate(45deg);
}

.hero-ask-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48rpx;
	height: 48rpx;
	border-radius: 16rpx;
	background: rgba(231, 239, 232, 0.92);
}

.hero-ask-copy {
	min-width: 0;
}

.hero-ask-title,
.hero-ask-desc {
	display: block;
}

.hero-ask-title {
	font-size: 28rpx;
	line-height: 1.25;
	font-weight: 800;
	color: #102F29;
}

.hero-ask-desc {
	margin-top: 6rpx;
	font-size: 21rpx;
	line-height: 1.35;
	color: #746F68;
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

.home-light-entry-grid {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
	gap: 18rpx;
	margin-top: 24rpx;
}

.home-light-entry {
	position: relative;
	min-height: 170rpx;
	padding: 24rpx;
	border-radius: 32rpx;
	overflow: hidden;
	box-sizing: border-box;
}

.home-map-entry {
	background:
		linear-gradient(135deg, rgba(255, 253, 248, 0.96), rgba(226, 239, 230, 0.88));
}

.home-record-entry {
	background:
		linear-gradient(135deg, rgba(255, 249, 238, 0.98), rgba(239, 222, 190, 0.60));
}

.home-travelogue-entry {
	background:
		linear-gradient(135deg, rgba(255, 253, 248, 0.96), rgba(239, 233, 219, 0.90));
}

.home-travelogue-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 18rpx;
}

.home-start-record-button,
.home-draft-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 120rpx;
	min-height: 48rpx;
	padding: 0 18rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	line-height: 1.2;
	font-weight: 800;
	box-sizing: border-box;
}

.home-start-record-button {
	color: #FFFDF8;
	background: linear-gradient(135deg, #173F35, #102F29);
}

.home-draft-button {
	color: #173F35;
	background: rgba(23, 63, 53, 0.08);
}

.home-light-entry-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 56rpx;
	height: 56rpx;
	border-radius: 18rpx;
	background: rgba(255, 252, 246, 0.78);
}

.home-light-entry-title,
.home-light-entry-copy {
	display: block;
}

.home-light-entry-title {
	margin-top: 18rpx;
	font-size: 31rpx;
	line-height: 1.25;
	font-weight: 800;
	color: #102F29;
}

.home-light-entry-copy {
	margin-top: 10rpx;
	font-size: 23rpx;
	line-height: 1.45;
	color: #746F68;
}

.home-memory-grid {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: 18rpx;
	margin-top: 24rpx;
}

.recent-compact-card {
	min-height: 216rpx;
	padding: 24rpx;
	border-radius: 34rpx;
	box-sizing: border-box;
}

.recent-panel {
	display: grid;
	grid-template-columns: 114rpx minmax(0, 1fr);
	gap: 18rpx;
	align-items: center;
	background:
		linear-gradient(135deg, rgba(255, 249, 238, 0.98), rgba(239, 222, 190, 0.52));
}

.home-action-duo .recent-panel {
	min-height: 158rpx;
	padding: 20rpx 18rpx;
	border-radius: 30rpx;
}

.home-action-duo .recent-compact-image {
	width: 104rpx;
	height: 126rpx;
}

.home-action-duo .recent-title {
	font-size: 30rpx;
}

.home-action-duo .recent-desc {
	font-size: 22rpx;
	line-height: 1.42;
}

.home-action-duo .recent-status {
	font-size: 21rpx;
}

.home-action-duo .recent-compact-action {
	width: 148rpx;
	min-height: 52rpx;
	margin-top: 14rpx;
	padding: 0 14rpx;
	font-size: 21rpx;
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

.home-route-recommendation-section {
	margin-top: 28rpx;
}

.home-route-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
	margin-bottom: 18rpx;
}

.home-route-kicker,
.home-route-title,
.home-route-card-title,
.home-route-card-desc {
	display: block;
}

.home-route-kicker {
	font-size: 22rpx;
	line-height: 1.35;
	font-weight: 700;
	color: #B8812B;
}

.home-route-title {
	margin-top: 8rpx;
	font-size: 36rpx;
	line-height: 1.2;
	font-weight: 800;
	color: #102F29;
}

.home-route-more {
	flex-shrink: 0;
	min-width: 152rpx;
	height: 62rpx;
	line-height: 62rpx;
	padding: 0 20rpx;
	border-radius: 999rpx;
	font-size: 24rpx;
	font-weight: 800;
}

.home-route-list {
	display: flex;
	flex-direction: column;
	gap: 18rpx;
}

.home-route-card {
	display: grid;
	grid-template-columns: 170rpx minmax(0, 1fr);
	gap: 20rpx;
	align-items: center;
	padding: 20rpx;
	border-radius: 34rpx;
	box-sizing: border-box;
}

.home-route-cover {
	width: 170rpx;
	height: 170rpx;
	border-radius: 26rpx;
	object-fit: cover;
	box-shadow: 0 12rpx 26rpx rgba(16, 47, 41, 0.12);
}

.home-route-copy {
	min-width: 0;
}

.home-route-card-title {
	font-size: 32rpx;
	line-height: 1.25;
	font-weight: 800;
	color: #102F29;
}

.home-route-card-desc {
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.45;
	color: #746F68;
}

.home-route-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 10rpx;
	margin-top: 14rpx;
}

.home-route-meta text {
	padding: 8rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.08);
	color: #173F35;
	font-size: 21rpx;
	line-height: 1.2;
	font-weight: 700;
}

.home-route-button {
	width: 168rpx;
	height: 58rpx;
	line-height: 58rpx;
	margin: 18rpx 0 0;
	border-radius: 999rpx;
	font-size: 23rpx;
	font-weight: 800;
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

.xicheng-reference-hero .hero-ask-card {
	left: -230rpx;
	bottom: 136rpx;
	width: 300rpx;
}

.home-world-entry {
	margin-top: 24rpx;
	padding: 26rpx;
	border-radius: 32rpx;
	background:
		linear-gradient(135deg, rgba(16, 47, 41, 0.96), rgba(26, 80, 65, 0.94)),
		linear-gradient(180deg, rgba(241, 199, 106, 0.18), rgba(255, 255, 255, 0));
	color: #FFF9EC;
	box-shadow: 0 18rpx 38rpx rgba(16, 47, 41, 0.18);
}

.home-world-entry-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 18rpx;
}

.home-world-entry-kicker,
.home-world-entry-title,
.home-world-entry-summary,
.home-world-entry-action,
.home-world-signal-label,
.home-world-signal-status {
	display: block;
}

.home-world-entry-kicker {
	font-size: 22rpx;
	font-weight: 700;
	color: #F1C76A;
}

.home-world-entry-title {
	margin-top: 8rpx;
	font-size: 36rpx;
	font-weight: 800;
	line-height: 1.2;
}

.home-world-entry-action {
	flex-shrink: 0;
	padding: 10rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(241, 199, 106, 0.18);
	color: #FCE8A9;
	font-size: 22rpx;
	font-weight: 800;
}

.home-world-entry-summary {
	margin-top: 16rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: rgba(255, 249, 236, 0.82);
}

.home-world-signal-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 20rpx;
}

.home-world-signal {
	min-width: 0;
	padding: 16rpx;
	border-radius: 20rpx;
	background: rgba(255, 249, 236, 0.08);
	border: 1rpx solid rgba(255, 249, 236, 0.12);
}

.home-world-signal-active {
	background: rgba(241, 199, 106, 0.16);
	border-color: rgba(241, 199, 106, 0.28);
}

.home-world-signal-label {
	font-size: 21rpx;
	font-weight: 700;
	color: #FCE8A9;
}

.home-world-signal-status {
	margin-top: 6rpx;
	font-size: 21rpx;
	line-height: 1.35;
	color: rgba(255, 249, 236, 0.8);
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

.xicheng-home-first-screen-density .xicheng-reference-hero {
	min-height: 640rpx;
	padding-top: 30rpx;
}

.xicheng-home-first-screen-density {
	padding-top: 20rpx;
}

.xicheng-home-first-screen-density .home-location-row {
	margin-bottom: 14rpx;
}

.xicheng-home-first-screen-density .xicheng-reference-hero .hero-copy {
	padding-top: 28rpx;
}

.xicheng-home-first-screen-density .xicheng-reference-hero .title {
	margin-top: 18rpx;
	font-size: 62rpx;
}

.xicheng-home-first-screen-density .xicheng-reference-hero .subtitle {
	margin-top: 18rpx;
	font-size: 28rpx;
}

.xicheng-home-first-screen-density .xicheng-reference-hero .companion-visual {
	right: -10rpx;
	bottom: 10rpx;
	width: 370rpx;
}

.xicheng-home-first-screen-density .xicheng-reference-hero .xiaojing-avatar {
	width: 370rpx;
	height: 440rpx;
}

.xicheng-home-first-screen-density .xicheng-reference-hero .hero-ask-card {
	left: -214rpx;
	bottom: 126rpx;
	width: 288rpx;
	min-height: 104rpx;
}

.xicheng-home-first-screen-density .home-action-duo {
	gap: 14rpx;
	margin-top: 14rpx;
}

.xicheng-home-first-screen-density .home-action-card,
.xicheng-home-first-screen-density .home-action-duo .recent-panel {
	min-height: 136rpx;
}

.xicheng-home-first-screen-density .home-action-card {
	padding: 18rpx 20rpx;
}

.xicheng-home-first-screen-density .home-action-duo .recent-panel {
	padding: 16rpx;
}

.xicheng-home-first-screen-density .home-action-duo .recent-compact-image {
	width: 92rpx;
	height: 112rpx;
}

.xicheng-home-first-screen-density .home-action-duo .recent-compact-action {
	min-height: 46rpx;
	margin-top: 10rpx;
}

.xicheng-home-first-screen-density .home-light-entry-grid {
	gap: 14rpx;
	margin-top: 14rpx;
}

.xicheng-home-first-screen-density .home-light-entry {
	min-height: 138rpx;
	padding: 18rpx 20rpx;
}

.xicheng-home-first-screen-density .home-light-entry-title {
	margin-top: 14rpx;
}

.xicheng-home-first-screen-density .home-light-entry-copy {
	margin-top: 8rpx;
}

.xicheng-home-first-screen-density .home-travelogue-actions {
	margin-top: 10rpx;
}

.xicheng-home-first-screen-density .home-route-recommendation-section {
	margin-top: 12rpx;
}

</style>
