<template>
	<view class="xicheng-scan xicheng-designed-page xicheng-bottom-safe">
		<view class="scan-hero scan-reference-hero xicheng-paper-card">
			<view class="scan-hero-copy">
				<text class="scan-kicker">{{ region.cityName }}</text>
				<text class="scan-title">AI识境</text>
				<text class="scan-subtitle">看见什么，就能问什么。镜头、GPS、时间天气和城市知识会一起理解现场。</text>
			</view>
			<view class="scan-companion">
				<image class="scan-companion-avatar" :src="region.companionAvatar" mode="aspectFit" />
				<view class="scan-companion-bubble xicheng-companion-bubble">
					<text class="scan-companion-name">{{ routeContext.companionName }}</text>
					<text class="scan-companion-line">我会先匹配西城官方 POI</text>
				</view>
			</view>
		</view>

		<view class="scan-fusion-panel xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<view>
					<text class="section-kicker">场景融合</text>
					<text class="section-title">镜头打开前，小京已接入这些信号</text>
				</view>
				<text class="section-badge">Scene Engine</text>
			</view>
			<text class="scan-fusion-summary">{{ sceneFusionSummary }}</text>
			<view class="scan-fusion-grid">
				<view
					v-for="signal in sceneFusionSignals"
					:key="signal.key"
					class="scan-fusion-signal"
					:class="{ 'scan-fusion-signal-active': signal.active }"
				>
					<text class="scan-fusion-signal-label">{{ signal.label }}</text>
					<text class="scan-fusion-signal-status">{{ signal.statusText }}</text>
				</view>
			</view>
		</view>

		<view class="scan-agent-preview-panel xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<view>
					<text class="section-kicker">Agent 预判</text>
					<text class="section-title">AI识境预判动作</text>
				</view>
				<text class="section-badge">Decision</text>
			</view>
			<text class="scan-agent-preview-summary">{{ agentDecisionPreviewSummary }}</text>
			<view class="scan-agent-action-grid">
				<view
					class="scan-agent-action"
					v-for="action in sceneAgentActionPreviews"
					:key="action.key"
					:class="{ 'scan-agent-action-active': selectedSceneAgentActionKey === action.key }"
					@click="selectSceneAgentAction(action)"
				>
					<text class="scan-agent-action-label">{{ action.signal }}</text>
					<text class="scan-agent-action-title">{{ action.title }}</text>
					<text class="scan-agent-action-copy">{{ action.copy }}</text>
				</view>
			</view>
		</view>

		<view class="scan-world-interface-hud xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<view>
					<text class="section-kicker">世界交互入口</text>
					<text class="section-title">现实世界成为AI的交互界面</text>
				</view>
				<text class="section-badge">World Interface</text>
			</view>
			<view class="scan-world-interface-grid">
				<view
					v-for="signal in worldInterfaceSignals"
					:key="signal.key"
					class="scan-world-interface-signal"
					:class="{ 'scan-world-interface-signal-active': signal.active }"
				>
					<text class="scan-world-interface-label">{{ signal.label }}</text>
					<text class="scan-world-interface-value">{{ signal.value }}</text>
				</view>
			</view>
			<text class="scan-world-interface-summary">{{ worldInterfaceSummary }}</text>
		</view>

		<view class="scan-panel xicheng-paper-card">
			<view class="scan-frame">
				<view class="scan-frame-corner scan-frame-corner-tl"></view>
				<view class="scan-frame-corner scan-frame-corner-tr"></view>
				<view class="scan-frame-corner scan-frame-corner-bl"></view>
				<view class="scan-frame-corner scan-frame-corner-br"></view>
				<view class="scan-frame-core">
					<text class="scan-frame-title">场景理解</text>
					<text class="scan-frame-copy">建筑/文物 / 菜单/美食 / 路牌/OCR / 非遗/活动</text>
				</view>
			</view>

			<textarea
				v-model="manualText"
				class="scan-textarea"
				placeholder="可选：补充白塔寺、展牌文字、攻略片段或路线图说明"
				auto-height
			/>

			<button
				class="primary-button xicheng-primary-action scan-primary-button"
				:disabled="recognizing"
				@click="startAutoRecognition"
			>
				{{ recognizing ? '正在识别' : '开始自动识别' }}
			</button>
			<text class="scan-privacy">图片和位置仅用于本次西城 POI 识别、来源匹配和本地游记素材生成，不默认公开。</text>
		</view>

		<view class="scan-capabilities xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<view>
					<text class="section-kicker">自动判断</text>
					<text class="section-title">小京会处理这些线索</text>
				</view>
				<text class="section-badge">单入口</text>
			</view>
			<view class="capability-grid">
				<view v-for="item in capabilities" :key="item.title" class="capability-item">
					<text class="capability-title">{{ item.title }}</text>
					<text class="capability-copy">{{ item.copy }}</text>
				</view>
			</view>
		</view>

		<view v-if="lastError" class="error-line">{{ lastError }}</view>
	</view>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import {
	isXichengDevelopmentRecognitionCacheBlocked,
	requestCurrentLocationForTrigger,
	resolveXichengPhotoTrigger,
	resolveXichengTextTrigger
} from '@/request/xunjing/trigger.js'
import { createXichengRouteOutputValue, decodeXichengRouteValue } from '@/request/xunjing/routeParams.js'
import { isXichengUnsafeSafetyStatus, normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'
import { isXunjingUserCancelled } from '@/request/xunjing/userCancel.js'

const encodeRouteValue = (value = '') => createXichengRouteOutputValue(value, { platform: process.env.UNI_PLATFORM })
const decodeRouteValue = decodeXichengRouteValue

export default {
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			recognizing: false,
			lastError: '',
			manualText: '',
			currentLocation: null,
			sceneFusionSignals: [],
			sceneFusionSummary: '镜头待命，正在接入现场信号',
			worldInterfaceSignals: [],
			worldInterfaceSummary: '现实世界成为AI的交互界面，等待现场信号',
			selectedSceneAgentActionKey: '',
			sceneAgentActionUserSelected: false,
			routeContext: {
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				companionName: XICHENG_REGION_CONFIG.companionName,
				tenantId: XICHENG_REGION_CONFIG.tenantId
			},
			capabilities: [
				{ title: '二维码', copy: '读取地图、图书或展牌码并匹配官方 POI' },
				{ title: '建筑/文物', copy: '识别门头、文物、说明牌和现场照片' },
				{ title: '菜单/美食', copy: '理解菜品、口味、人数和本地特色' },
				{ title: '路牌/OCR', copy: '从图片文字或补充文本提取地点线索' },
				{ title: '非遗/活动', copy: '把演出、体验和路线图转成服务动作' }
			]
		}
	},
	computed: {
		sceneAgentActionPreviews() {
			return this.createSceneAgentActionPreviews()
		},
		agentDecisionPreviewSummary() {
			const snapshot = this.buildAgentDecisionSnapshot()
			if (snapshot.agentDecisionActionTitle) {
				return `Agent建议先${snapshot.agentDecisionActionTitle}，${snapshot.agentDecisionActionCopy}`.slice(0, 88)
			}
			return '小京会根据镜头、GPS、时间天气、记忆和城市知识图谱自动判断下一步。'
		}
	},
	onLoad(options = {}) {
		this.applyVisionAgentQueryContext(options)
		this.refreshSceneFusionPanel()
		this.routeContext = {
			regionCode: decodeRouteValue(options.regionCode) || XICHENG_REGION_CONFIG.regionCode,
			packageCode: decodeRouteValue(options.packageCode) || XICHENG_REGION_CONFIG.packageCode,
			sceneCode: decodeRouteValue(options.sceneCode) || XICHENG_REGION_CONFIG.sceneCode,
			sourceChannel: decodeRouteValue(options.sourceChannel) || XICHENG_REGION_CONFIG.sourceChannel,
			companionName: decodeRouteValue(options.companionName) || XICHENG_REGION_CONFIG.companionName,
			tenantId: XICHENG_REGION_CONFIG.tenantId
		}
	},
	methods: {
		applyVisionAgentQueryContext(options = {}) {
			this.visionAgentContext = {
				context: decodeRouteValue(options.context) || 'vision-agent',
				mode: decodeRouteValue(options.mode) || 'camera',
				sceneIntent: decodeRouteValue(options.sceneIntent) || 'scene-understanding',
				entry: decodeRouteValue(options.entry) || 'scan',
				sceneSessionId: decodeRouteValue(options.sceneSessionId),
				sourceRecognitionContext: decodeRouteValue(options.sourceRecognitionContext),
				visionCaption: decodeRouteValue(options.visionCaption),
				locationText: decodeRouteValue(options.locationText),
				localTimeText: decodeRouteValue(options.localTimeText),
				weatherText: decodeRouteValue(options.weatherText),
				headingText: decodeRouteValue(options.headingText),
				headingDegrees: decodeRouteValue(options.headingDegrees),
				activityText: decodeRouteValue(options.activityText),
				serviceText: decodeRouteValue(options.serviceText),
				knowledgeGraphText: decodeRouteValue(options.knowledgeGraphText),
				userInterestTags: decodeRouteValue(options.userInterestTags),
				memorySessionText: decodeRouteValue(options.memorySessionText),
				memorySessionSceneCount: decodeRouteValue(options.memorySessionSceneCount)
			}
		},
		formatSceneFusionTime(date = new Date()) {
			const pad = (number) => String(number).padStart(2, '0')
			return `${pad(date.getHours())}:${pad(date.getMinutes())}`
		},
		parseVisionAgentSourceContext(sourceRecognitionContext = '') {
			if (!sourceRecognitionContext) return {}
			if (typeof sourceRecognitionContext === 'object') return sourceRecognitionContext
			try {
				const parsedContext = JSON.parse(String(sourceRecognitionContext))
				return parsedContext && typeof parsedContext === 'object' ? parsedContext : {}
			} catch (error) {
				return {
					visionCaption: String(sourceRecognitionContext).slice(0, 48)
				}
			}
		},
		readVisionAgentMemoryTrail() {
			try {
				const memoryTrail = uni.getStorageSync(XICHENG_REGION_CONFIG.visionAgentMemoryStorageKey)
				return Array.isArray(memoryTrail)
					? memoryTrail.filter(item => item && typeof item === 'object')
					: []
			} catch (error) {
				return []
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
		buildSceneFusionContext() {
			const visionContext = this.visionAgentContext || {}
			const previousContext = this.parseVisionAgentSourceContext(visionContext.sourceRecognitionContext)
			const memoryTrail = this.readVisionAgentMemoryTrail()
			const memorySessionPackage = this.readVisionAgentMemorySessionPackage()
			const visionAgentMemorySessionText = visionContext.memorySessionText || this.createVisionAgentMemorySessionText(memorySessionPackage)
			const memorySessionSceneCount = Number(visionContext.memorySessionSceneCount || (memorySessionPackage && memorySessionPackage.sceneCount ? memorySessionPackage.sceneCount : 0))
			const hasLocation = Boolean(this.currentLocation || visionContext.locationText)
			return {
				...visionContext,
				previousContext,
				memoryTrail,
				visionAgentMemorySessionPackage: memorySessionPackage,
				visionAgentMemorySessionText: visionAgentMemorySessionText,
				memorySessionSceneCount,
				locationText: visionContext.locationText || (hasLocation ? 'GPS已授权' : ''),
				localTimeText: visionContext.localTimeText || this.formatSceneFusionTime(),
				weatherText: visionContext.weatherText || '',
				headingText: visionContext.headingText || '',
				headingDegrees: visionContext.headingDegrees || '',
				knowledgeGraphText: visionContext.knowledgeGraphText || '',
				serviceText: visionContext.serviceText || '',
				activityText: visionContext.activityText || ''
			}
		},
		buildSceneFusionSignals(context = this.buildSceneFusionContext()) {
			const memoryText = context.previousContext.poiName
				|| context.previousContext.visionCaption
				|| (context.memoryTrail[0] && context.memoryTrail[0].poiName)
				|| ''
			const environmentText = [context.localTimeText, context.weatherText].filter(Boolean).join(' ')
			const knowledgeText = context.knowledgeGraphText || context.activityText || context.serviceText || ''
			const memorySessionSceneCount = Number(context.memorySessionSceneCount || 0)
			const memorySessionText = context.visionAgentMemorySessionText || context.memorySessionText || ''
			return [
				{ key: 'camera', label: '镜头', statusText: this.recognizing ? '理解中' : '待拍摄', active: true },
				{ key: 'gps', label: 'GPS', statusText: context.locationText || '待授权', active: Boolean(context.locationText) },
				{ key: 'environment', label: '时间天气', statusText: environmentText || '待刷新', active: Boolean(environmentText) },
				{ key: 'heading', label: '方向', statusText: context.headingText || (context.headingDegrees ? `${context.headingDegrees}°` : '待校准'), active: Boolean(context.headingText || context.headingDegrees) },
				{ key: 'memory', label: 'Memory', statusText: memoryText || '待形成', active: Boolean(memoryText) },
				{ key: 'memory-session', label: '连续识境', statusText: memorySessionSceneCount > 0 ? `${memorySessionSceneCount}次识境` : '待形成', active: memorySessionSceneCount > 0 || Boolean(memorySessionText) },
				{ key: 'knowledge', label: '知识图谱', statusText: knowledgeText || '待连接', active: Boolean(knowledgeText) }
			]
		},
		buildSceneFusionSummary(context = this.buildSceneFusionContext(), signals = this.buildSceneFusionSignals(context)) {
			const activeCount = signals.filter(signal => signal && signal.active).length
			const subject = context.locationText || context.visionCaption || context.previousContext.poiName || this.region.cityName
			const nextCue = context.visionAgentMemorySessionText || context.knowledgeGraphText || context.serviceText || context.activityText || '拍一下后自动进入场景理解'
			return `${subject} · ${activeCount}类现场信号已接入，${nextCue}`.slice(0, 88)
		},
		createWorldInterfaceSignals(context = this.buildSceneFusionContext()) {
			const userInterestTags = String(context.userInterestTags || '').split(/[、,\s]+/).filter(Boolean)
			const memoryTrail = Array.isArray(context.memoryTrail) ? context.memoryTrail : []
			const knowledgeGraphText = String(context.knowledgeGraphText || context.activityText || context.serviceText || '')
			const localTimeText = String(context.localTimeText || '')
			const weatherText = String(context.weatherText || '')
			const headingText = String(context.headingText || '')
			const headingDegrees = String(context.headingDegrees || '')
			const locationText = String(context.locationText || '')
			const historyText = context.visionAgentMemorySessionText
				|| (memoryTrail[0] && (memoryTrail[0].poiName || memoryTrail[0].sourceLabel))
				|| ''
			const environmentText = [localTimeText, weatherText].filter(Boolean).join(' ')
			const directionText = [locationText, headingText || (headingDegrees ? `${headingDegrees}°` : '')].filter(Boolean).join(' · ')
			return [
				{
					key: 'camera',
					label: '镜头入口',
					value: this.recognizing ? '正在理解现场' : '拍一下即提问',
					active: true
				},
				{
					key: 'location-direction',
					label: '位置方向',
					value: directionText || 'GPS和方向待接入',
					active: Boolean(directionText)
				},
				{
					key: 'profile',
					label: '用户画像',
					value: userInterestTags.length ? userInterestTags.slice(0, 3).join(' / ') : '兴趣待学习',
					active: userInterestTags.length > 0
				},
				{
					key: 'history',
					label: '历史记录',
					value: historyText || '首次识境',
					active: Boolean(historyText)
				},
				{
					key: 'city-knowledge',
					label: '城市知识库',
					value: knowledgeGraphText || '等待POI匹配',
					active: Boolean(knowledgeGraphText)
				},
				{
					key: 'live-environment',
					label: '实时环境',
					value: environmentText || '时间天气待刷新',
					active: Boolean(environmentText)
				}
			]
		},
		createWorldInterfaceSummary(context = this.buildSceneFusionContext(), signals = this.createWorldInterfaceSignals(context)) {
			const activeLabels = signals.filter(signal => signal && signal.active).map(signal => signal.label)
			const subject = context.locationText || context.previousContext.poiName || context.visionCaption || this.region.cityName
			const fusedText = activeLabels.length ? activeLabels.join('、') : '镜头、GPS、知识库'
			return `${subject} · ${fusedText}正在融合，拍一下后直接触发讲解、路线、服务和连续对话。`.slice(0, 92)
		},
		buildWorldInterfaceSnapshot(context = this.buildSceneFusionContext()) {
			const signals = this.createWorldInterfaceSignals(context)
			return {
				signals,
				summary: this.createWorldInterfaceSummary(context, signals)
			}
		},
		refreshSceneFusionPanel() {
			const context = this.buildSceneFusionContext()
			const worldInterfaceSnapshot = this.buildWorldInterfaceSnapshot(context)
			this.worldInterfaceSignals = worldInterfaceSnapshot.signals
			this.worldInterfaceSummary = worldInterfaceSnapshot.summary
			this.sceneFusionSignals = this.buildSceneFusionSignals(context)
			this.sceneFusionSummary = this.buildSceneFusionSummary(context, this.sceneFusionSignals)
			const previews = this.createSceneAgentActionPreviews()
			if (!this.sceneAgentActionUserSelected && previews[0]) {
				this.selectedSceneAgentActionKey = previews[0].key
			}
		},
		buildVisionAgentSceneContext(source = '', trigger = {}) {
			const agentDecisionSnapshot = this.buildAgentDecisionSnapshot()
			const worldInterfaceSnapshot = this.buildWorldInterfaceSnapshot()
			return {
				...this.visionAgentContext,
				sceneFusionSummary: this.sceneFusionSummary,
				sceneFusionSignals: this.sceneFusionSignals,
				worldInterfaceSnapshot,
				worldInterfaceSummary: worldInterfaceSnapshot.summary,
				worldInterfaceSignals: worldInterfaceSnapshot.signals,
				source,
				poiCode: trigger.poiCode || '',
				poiName: trigger.poiName || '',
				sourceLabel: trigger.sourceLabel || '',
				confidence: trigger.confidence || '',
				safetyStatus: trigger.safetyStatus || '',
				visionAgentMemorySessionPackage: agentDecisionSnapshot.visionAgentMemorySessionPackage,
				visionAgentMemorySessionText: agentDecisionSnapshot.visionAgentMemorySessionText,
				memorySessionSceneCount: agentDecisionSnapshot.memorySessionSceneCount,
				agentDecisionActionKey: agentDecisionSnapshot.selectedSceneAgentActionKey,
				agentDecisionActionTitle: agentDecisionSnapshot.agentDecisionActionTitle,
				agentDecisionPreviewSummary: agentDecisionSnapshot.agentDecisionPreviewSummary,
				sceneAgentActionPreviews: agentDecisionSnapshot.sceneAgentActionPreviews
			}
		},
		createSceneAgentActionPreviews() {
			const context = this.buildSceneFusionContext()
			const localTimeText = String(context.localTimeText || '')
			const weatherText = String(context.weatherText || '')
			const knowledgeGraphText = String(context.knowledgeGraphText || '')
			const serviceText = String(context.serviceText || context.activityText || '')
			const memoryTrail = Array.isArray(context.memoryTrail) ? context.memoryTrail : []
			const memorySessionPackage = context.visionAgentMemorySessionPackage || null
			const memorySessionSceneCount = Number(context.memorySessionSceneCount || (memorySessionPackage && memorySessionPackage.sceneCount ? memorySessionPackage.sceneCount : 0))
			const memorySessionText = context.visionAgentMemorySessionText || ''
			const environmentText = `${localTimeText} ${weatherText}`
			const hasGoldenHourCue = /17|18|19|日落|黄昏|傍晚|晚霞|晴/.test(environmentText)
			const hasWeatherCue = Boolean(weatherText)
			const hasKnowledgeCue = Boolean(knowledgeGraphText)
			const hasServiceCue = /美食|商家|餐|活动|演出|票|badge|coupon|service/i.test(serviceText)
			const hasMemoryCue = memoryTrail.length > 0 || memorySessionSceneCount > 0
			const actions = [
				{
					key: 'photo-spot',
					signal: hasGoldenHourCue ? '光线优先' : '镜头优先',
					title: '拍最佳角度',
					copy: hasGoldenHourCue ? '先判断夕阳、门楼和人流，再讲历史。' : '先用镜头确认建筑、文物或展牌细节。',
					score: hasGoldenHourCue ? 48 : 24
				},
				{
					key: 'deep-history',
					signal: hasKnowledgeCue ? '知识图谱' : '讲解',
					title: '深入讲解',
					copy: hasKnowledgeCue ? `沿着${knowledgeGraphText}继续讲。` : '匹配官方 POI 后展开故事和建筑看点。',
					score: hasKnowledgeCue ? 42 : 26
				},
				{
					key: 'next-service',
					signal: hasServiceCue ? '城市服务' : '路线服务',
					title: '接后续服务',
					copy: hasServiceCue ? `识别后优先接入${serviceText}。` : '识别后推荐下一站、打卡或游记动作。',
					score: hasServiceCue ? 40 : 22
				},
				{
					key: 'continue-memory',
					signal: hasMemoryCue ? '连续识境' : '连续理解',
					title: '延续上次场景',
					copy: hasMemoryCue ? (memorySessionText || '会记住上一处 POI，不重新开始讲解。').slice(0, 40) : '形成连续识境记忆，下一次可接着问。',
					score: hasMemoryCue ? 46 : 18
				},
				{
					key: 'weather-route',
					signal: hasWeatherCue ? '时间天气' : '环境',
					title: '调整路线节奏',
					copy: hasWeatherCue ? '结合天气判断室内、夜景或避暑路线。' : '拍摄后按当前环境给出下一步。',
					score: hasWeatherCue ? 34 : 16
				}
			]
			return actions
				.sort((left, right) => right.score - left.score)
				.slice(0, 3)
				.map(({ score, ...action }) => action)
		},
		selectSceneAgentAction(action = {}) {
			if (!action.key) return
			this.selectedSceneAgentActionKey = action.key
			this.sceneAgentActionUserSelected = true
		},
		buildAgentDecisionSnapshot() {
			const context = this.buildSceneFusionContext()
			const sceneAgentActionPreviews = this.sceneAgentActionPreviews
			const selectedAction = sceneAgentActionPreviews.find(action => action.key === this.selectedSceneAgentActionKey)
				|| sceneAgentActionPreviews[0]
				|| {}
			return {
				selectedSceneAgentActionKey: selectedAction.key || '',
				agentDecisionPreviewSummary: selectedAction.title
					? `Agent建议先${selectedAction.title}，${selectedAction.copy}`.slice(0, 88)
					: '',
				sceneAgentActionPreviews,
				agentDecisionActionTitle: selectedAction.title || '',
				agentDecisionActionCopy: selectedAction.copy || '',
				visionAgentMemorySessionPackage: context.visionAgentMemorySessionPackage,
				visionAgentMemorySessionText: context.visionAgentMemorySessionText,
				memorySessionSceneCount: context.memorySessionSceneCount
			}
		},
		startAutoRecognition() {
			if (this.recognizing) return
			this.lastError = ''
			const manualText = this.manualText.trim()
			if (manualText) {
				this.resolveTextAndOpenResult(manualText, 'text')
				return
			}
			const shouldTryNativeScan = process.env.UNI_PLATFORM !== 'h5' && uni.scanCode
			if (shouldTryNativeScan) {
				uni.scanCode({
					success: async (res) => {
						if (res.result || res.path) {
							this.resolveTextAndOpenResult(res.result || res.path || '', 'scan')
							return
						}
						this.chooseAutoRecognitionImage()
					},
					fail: (err) => {
						if (isXunjingUserCancelled(err)) return
						this.chooseAutoRecognitionImage()
					}
				})
				return
			}
			this.chooseAutoRecognitionImage()
		},
		chooseAutoRecognitionImage() {
			if (!uni.chooseImage) {
				this.resolveNearbyLocation()
				return
			}
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['camera', 'album'],
				success: async (res) => {
					const filePath = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : ''
					if (!filePath) {
						this.resolveNearbyLocation()
						return
					}
					this.recognizing = true
					this.lastError = ''
					this.refreshSceneFusionPanel()
					try {
						const text = this.manualText.trim()
						const trigger = await resolveXichengPhotoTrigger({
							filePath,
							text,
							ocrText: text,
							imageLabels: ['照片', '建筑/文物', '菜单/美食', '路牌/OCR', '非遗/活动', 'OCR文字', '地点线索', '路线图']
						})
						this.openScanResult(trigger, 'photo')
					} catch (error) {
						this.handleRecognitionServiceFailure('photo', error)
					} finally {
						this.recognizing = false
					}
				},
				fail: (err) => {
					if (isXunjingUserCancelled(err)) return
					this.resolveNearbyLocation()
				}
			})
		},
		async resolveNearbyLocation() {
			if (this.recognizing) return
			this.recognizing = true
			this.lastError = ''
			try {
				const location = await requestCurrentLocationForTrigger()
				this.currentLocation = location
				this.refreshSceneFusionPanel()
				const text = this.manualText.trim() || '当前位置附近西城文化点'
				const trigger = await resolveXichengTextTrigger({
					text,
					ocrText: text,
					location,
					source: location ? 'gps' : 'text'
				})
				this.openScanResult(trigger, location ? 'gps' : 'text')
			} catch (error) {
				this.handleRecognitionServiceFailure('gps', error)
			} finally {
				this.recognizing = false
			}
		},
		async resolveTextAndOpenResult(text = '', source = 'scan') {
			if (this.recognizing) return
			this.recognizing = true
			this.lastError = ''
			this.refreshSceneFusionPanel()
			try {
				const trigger = await resolveXichengTextTrigger({
					text,
					ocrText: this.manualText.trim() || text,
					location: this.currentLocation,
					source
				})
				this.openScanResult(trigger, source)
			} catch (error) {
				this.handleRecognitionServiceFailure(source, error)
			} finally {
				this.recognizing = false
			}
		},
		openScanResult(trigger = {}, source = '') {
			if (isXichengDevelopmentRecognitionCacheBlocked(trigger)) {
				this.handleRecognitionUnavailable(source || 'scan')
				return
			}
			const result = {
				...trigger,
				source,
				regionCode: trigger.regionCode || this.routeContext.regionCode,
				packageCode: trigger.packageCode || this.routeContext.packageCode,
				sceneCode: trigger.sceneCode || this.routeContext.sceneCode,
				sourceChannel: trigger.sourceChannel || this.routeContext.sourceChannel,
				companionName: trigger.companionName || this.routeContext.companionName,
				tenantId: this.routeContext.tenantId,
				visionAgentContext: this.buildVisionAgentSceneContext(source, trigger)
			}
			const unsafeSafetyStatus = isXichengUnsafeSafetyStatus(normalizeXichengSafetyStatus(result.safetyStatus))
			if (unsafeSafetyStatus) {
				uni.removeStorageSync(this.region.storageKey)
			} else {
				uni.setStorageSync(this.region.storageKey, result)
			}
			uni.navigateTo({
				url: `/pages/xicheng/scan-result/scan-result?source=${encodeRouteValue(source)}&regionCode=${encodeRouteValue(result.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(result.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(result.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(result.sourceChannel || this.region.sourceChannel)}&poiCode=${encodeRouteValue(result.poiCode || '')}&poiName=${encodeRouteValue(result.poiName || '')}&companionName=${encodeRouteValue(result.companionName || this.region.companionName)}&safetyStatus=${encodeRouteValue(result.safetyStatus || '')}`
			})
		},
		handleRecognitionUnavailable(source = 'scan') {
			const message = source === 'photo'
				? '未获得可识别图片，请重新拍摄或补充文字线索'
				: source === 'gps'
					? '无法获取当前位置，请开启定位权限后重试'
					: '未获得可识别线索，请补充文字或重新识别'
			this.lastError = message
			uni.showToast({
				icon: 'none',
				title: message
			})
		},
		handleRecognitionServiceFailure(source = 'scan', error = null) {
			const message = source === 'photo'
				? '图片识别服务暂不可用，请补充文字线索或稍后重试'
				: source === 'gps'
					? '定位识别服务暂不可用，请稍后重试'
					: '西城识别服务暂不可用，请改用文字线索或稍后重试'
			this.lastError = message
			uni.showToast({
				icon: 'none',
				title: message
			})
		}
	}
}
</script>

<style scoped>
.xicheng-scan {
	min-height: 100vh;
	padding: 28rpx 28rpx 170rpx;
	box-sizing: border-box;
	color: #102F29;
}

.scan-hero {
	position: relative;
	overflow: hidden;
	display: flex;
	justify-content: space-between;
	gap: 22rpx;
	padding: 34rpx 30rpx;
	background:
		linear-gradient(135deg, rgba(247, 239, 222, 0.96), rgba(230, 241, 230, 0.94)),
		linear-gradient(180deg, rgba(184, 129, 43, 0.16), rgba(16, 47, 41, 0.05));
}

.scan-hero-copy {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
	min-width: 0;
}

.scan-kicker,
.section-kicker {
	font-size: 22rpx;
	color: #B8812B;
	font-weight: 700;
}

.scan-title {
	font-size: 44rpx;
	font-weight: 800;
	color: #102F29;
	line-height: 1.1;
}

.scan-subtitle {
	max-width: 420rpx;
	font-size: 25rpx;
	line-height: 1.55;
	color: rgba(16, 47, 41, 0.72);
}

.scan-companion {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 184rpx;
	flex: 0 0 184rpx;
}

.scan-companion-avatar {
	width: 138rpx;
	height: 168rpx;
}

.scan-companion-bubble {
	margin-top: -8rpx;
	padding: 14rpx 18rpx;
}

.scan-companion-name,
.scan-companion-line {
	display: block;
	font-size: 22rpx;
	line-height: 1.35;
	color: #102F29;
}

.scan-companion-name {
	font-weight: 800;
}

.scan-panel,
.scan-fusion-panel,
.scan-agent-preview-panel,
.scan-world-interface-hud,
.scan-capabilities {
	margin-top: 24rpx;
	padding: 28rpx;
}

.scan-fusion-panel {
	background:
		linear-gradient(135deg, rgba(255, 253, 248, 0.96), rgba(232, 241, 233, 0.94));
}

.scan-fusion-summary {
	display: block;
	margin-top: 18rpx;
	font-size: 25rpx;
	line-height: 1.55;
	color: rgba(16, 47, 41, 0.74);
}

.scan-agent-preview-panel {
	background:
		linear-gradient(135deg, rgba(23, 63, 53, 0.96), rgba(31, 110, 90, 0.92));
	color: #FFFFFF;
}

.scan-agent-preview-panel .section-kicker,
.scan-agent-preview-panel .section-title,
.scan-agent-preview-panel .section-badge {
	color: #FFFFFF;
}

.scan-agent-preview-panel .section-badge {
	background: rgba(255, 255, 255, 0.14);
}

.scan-agent-preview-summary {
	display: block;
	margin-top: 18rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: rgba(255, 255, 255, 0.78);
}

.scan-agent-action-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 22rpx;
}

.scan-agent-action {
	min-width: 0;
	min-height: 166rpx;
	padding: 18rpx;
	border-radius: 22rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.14);
	background: rgba(255, 255, 255, 0.09);
	box-sizing: border-box;
}

.scan-agent-action-active {
	border-color: rgba(241, 199, 106, 0.82);
	background: rgba(241, 199, 106, 0.16);
}

.scan-agent-action-label,
.scan-agent-action-title,
.scan-agent-action-copy {
	display: block;
	line-height: 1.4;
}

.scan-agent-action-label {
	font-size: 20rpx;
	font-weight: 800;
	color: rgba(255, 255, 255, 0.66);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.scan-agent-action-title {
	margin-top: 8rpx;
	font-size: 25rpx;
	font-weight: 800;
	color: #FFFFFF;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.scan-agent-action-copy {
	margin-top: 8rpx;
	font-size: 21rpx;
	color: rgba(255, 255, 255, 0.72);
}

.scan-world-interface-hud {
	background:
		linear-gradient(135deg, rgba(255, 252, 244, 0.98), rgba(239, 247, 240, 0.94));
}

.scan-world-interface-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 22rpx;
}

.scan-world-interface-signal {
	min-width: 0;
	min-height: 132rpx;
	padding: 16rpx;
	border-radius: 20rpx;
	border: 1rpx solid rgba(16, 47, 41, 0.08);
	background: rgba(255, 255, 255, 0.58);
	box-sizing: border-box;
}

.scan-world-interface-signal-active {
	border-color: rgba(184, 129, 43, 0.28);
	background: rgba(255, 247, 226, 0.86);
}

.scan-world-interface-label,
.scan-world-interface-value,
.scan-world-interface-summary {
	display: block;
	line-height: 1.4;
}

.scan-world-interface-label {
	font-size: 20rpx;
	font-weight: 800;
	color: rgba(16, 47, 41, 0.56);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.scan-world-interface-value {
	margin-top: 10rpx;
	font-size: 23rpx;
	font-weight: 800;
	color: #102F29;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.scan-world-interface-summary {
	margin-top: 18rpx;
	font-size: 24rpx;
	color: rgba(16, 47, 41, 0.68);
}

.scan-fusion-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 22rpx;
}

.scan-fusion-signal {
	min-width: 0;
	min-height: 100rpx;
	padding: 18rpx;
	border-radius: 22rpx;
	border: 1rpx solid rgba(16, 47, 41, 0.08);
	background: rgba(255, 252, 244, 0.72);
	box-sizing: border-box;
}

.scan-fusion-signal-active {
	border-color: rgba(31, 110, 90, 0.24);
	background: rgba(31, 110, 90, 0.10);
}

.scan-fusion-signal-label,
.scan-fusion-signal-status {
	display: block;
	line-height: 1.4;
}

.scan-fusion-signal-label {
	font-size: 22rpx;
	color: rgba(16, 47, 41, 0.56);
}

.scan-fusion-signal-status {
	margin-top: 8rpx;
	font-size: 25rpx;
	font-weight: 800;
	color: #102F29;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.scan-frame {
	position: relative;
	height: 390rpx;
	border-radius: 32rpx;
	background:
		radial-gradient(circle at 50% 34%, rgba(184, 129, 43, 0.16), transparent 32%),
		linear-gradient(180deg, rgba(16, 47, 41, 0.92), rgba(30, 72, 59, 0.86));
	overflow: hidden;
}

.scan-frame::after {
	content: "";
	position: absolute;
	left: 58rpx;
	right: 58rpx;
	top: 50%;
	height: 2rpx;
	background: linear-gradient(90deg, transparent, rgba(241, 199, 106, 0.96), transparent);
	box-shadow: 0 0 26rpx rgba(241, 199, 106, 0.58);
}

.scan-frame-corner {
	position: absolute;
	width: 54rpx;
	height: 54rpx;
	border-color: #F1C76A;
}

.scan-frame-corner-tl {
	left: 42rpx;
	top: 42rpx;
	border-left: 6rpx solid;
	border-top: 6rpx solid;
}

.scan-frame-corner-tr {
	right: 42rpx;
	top: 42rpx;
	border-right: 6rpx solid;
	border-top: 6rpx solid;
}

.scan-frame-corner-bl {
	left: 42rpx;
	bottom: 42rpx;
	border-left: 6rpx solid;
	border-bottom: 6rpx solid;
}

.scan-frame-corner-br {
	right: 42rpx;
	bottom: 42rpx;
	border-right: 6rpx solid;
	border-bottom: 6rpx solid;
}

.scan-frame-core {
	position: absolute;
	left: 72rpx;
	right: 72rpx;
	top: 118rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14rpx;
	text-align: center;
	color: #FFF7E6;
}

.scan-frame-title {
	font-size: 40rpx;
	font-weight: 800;
}

.scan-frame-copy {
	font-size: 24rpx;
	line-height: 1.5;
	color: rgba(255, 247, 230, 0.84);
}

.scan-textarea {
	width: 100%;
	min-height: 120rpx;
	margin-top: 24rpx;
	padding: 22rpx 24rpx;
	border-radius: 24rpx;
	box-sizing: border-box;
	background: rgba(255, 252, 244, 0.92);
	border: 1rpx solid rgba(184, 129, 43, 0.18);
	color: #102F29;
	font-size: 26rpx;
	line-height: 1.5;
}

.scan-primary-button {
	width: 100%;
	margin-top: 24rpx;
}

.scan-privacy {
	display: block;
	margin-top: 18rpx;
	font-size: 22rpx;
	line-height: 1.5;
	color: rgba(16, 47, 41, 0.58);
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
}

.section-title {
	display: block;
	margin-top: 6rpx;
	font-size: 32rpx;
	font-weight: 800;
	color: #102F29;
}

.section-badge {
	padding: 8rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(184, 129, 43, 0.14);
	color: #8A5B1E;
	font-size: 22rpx;
	font-weight: 700;
	white-space: nowrap;
}

.capability-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 24rpx;
}

.capability-item {
	min-width: 0;
	padding: 20rpx;
	border-radius: 22rpx;
	background: rgba(255, 252, 244, 0.72);
	border: 1rpx solid rgba(184, 129, 43, 0.14);
}

.capability-title,
.capability-copy {
	display: block;
}

.capability-title {
	font-size: 25rpx;
	font-weight: 800;
	color: #102F29;
}

.capability-copy {
	margin-top: 8rpx;
	font-size: 22rpx;
	line-height: 1.45;
	color: rgba(16, 47, 41, 0.62);
}

.error-line {
	margin-top: 20rpx;
	padding: 18rpx 20rpx;
	border-radius: 18rpx;
	background: rgba(162, 62, 42, 0.1);
	color: #8B2D21;
	font-size: 24rpx;
	line-height: 1.45;
}
</style>
