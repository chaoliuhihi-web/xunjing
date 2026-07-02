<template>
	<view class="xicheng-scan scan-reference-page xicheng-designed-page xicheng-bottom-safe">
		<view class="scan-reference-topbar">
			<button class="scan-topbar-button" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</button>
			<text class="scan-page-title">扫一扫</text>
			<view class="scan-topbar-spacer"></view>
		</view>

		<view class="scan-hero scan-reference-hero">
			<image class="scan-hero-avatar" :src="region.companionAvatar" mode="aspectFit" />
			<view class="scan-hero-bubble xicheng-companion-bubble">
				<text class="scan-hero-bubble-copy">对准二维码、展牌、建筑或路线图，</text>
				<text class="scan-hero-bubble-copy">我会自动识别</text>
			</view>
		</view>

		<view class="scan-reference-camera xicheng-paper-card">
			<image class="scan-camera-image" src="/static/xicheng/scene-baitasi-waterfront.jpg" mode="aspectFill" />
			<view class="scan-camera-dim"></view>
			<view class="scan-camera-grid scan-camera-grid-vertical-a"></view>
			<view class="scan-camera-grid scan-camera-grid-vertical-b"></view>
			<view class="scan-camera-grid scan-camera-grid-horizontal-a"></view>
			<view class="scan-camera-grid scan-camera-grid-horizontal-b"></view>
			<view class="scan-reference-viewfinder">
				<view class="scan-viewfinder-corner scan-viewfinder-corner-tl"></view>
				<view class="scan-viewfinder-corner scan-viewfinder-corner-tr"></view>
				<view class="scan-viewfinder-corner scan-viewfinder-corner-bl"></view>
				<view class="scan-viewfinder-corner scan-viewfinder-corner-br"></view>
			</view>
			<view class="scene-domain-grid">
				<view
					v-for="domain in sceneDomainCapabilities"
					:key="domain.domainKey"
					class="scene-domain-item"
					:class="{ 'scene-domain-item-active': selectedSceneDomainKey === domain.domainKey }"
					@click="selectSceneDomain(domain)"
				>
					<text class="scene-domain-label">{{ domain.label }}</text>
					<text class="scene-domain-title">{{ domain.title }}</text>
					<text class="scene-domain-copy">{{ domain.copy }}</text>
				</view>
			</view>
			<view class="scan-album-pill">
				<xicheng-icon name="photo" variant="plain" :size="18" />
				<text>相册</text>
			</view>
		</view>

		<view class="scan-reference-auto-card xicheng-paper-card">
			<view class="scan-auto-icon">
				<xicheng-icon name="scan" variant="primary" active :size="22" />
			</view>
			<view class="scan-auto-content">
				<view class="scan-auto-title-row">
					<text class="scan-auto-title">自动识别中：</text>
					<view class="scan-mode-list">
						<text
							v-for="mode in scanRecognitionModes"
							:key="mode"
							class="scan-reference-mode-chip"
						>{{ mode }}</text>
					</view>
				</view>
				<text class="scan-auto-copy">无需手动选择类型，系统将为你智能识别内容</text>
			</view>
		</view>

		<textarea
			v-model="manualText"
			class="scan-textarea"
			placeholder="可选：粘贴展牌文字、攻略片段或路线图说明"
			auto-height
		/>

		<button
			class="primary-button xicheng-primary-action scan-primary-button"
			:disabled="recognizing"
			@click="startAutoRecognition"
		>
			<view class="scan-primary-inner">
				<xicheng-icon name="scan" variant="primary" active :size="24" />
				<text>{{ recognizing ? '正在识别' : '开始识别' }}</text>
			</view>
		</button>

		<view class="scan-reference-nearby-card xicheng-paper-card" @click="resolveNearbyLocation">
			<xicheng-icon name="location" variant="plain" :size="24" />
			<view class="scan-nearby-copy">
				<text class="scan-nearby-label">附近可能是：</text>
				<text class="scan-nearby-name">白塔寺片区</text>
			</view>
			<xicheng-icon name="next" variant="plain" :size="18" />
		</view>

		<view class="scan-privacy">
			<xicheng-icon name="locked" variant="plain" :size="15" />
			<text>识别结果会匹配官方 POI 与已审核来源</text>
		</view>

		<view v-if="lastError" class="error-line">{{ lastError }}</view>

		<xicheng-scan-advanced-context-panel
			v-if="showAdvancedScanContext"
			:scene-fusion-summary="sceneFusionSummary"
			:scene-fusion-signals="sceneFusionSignals"
			:agent-decision-preview-summary="agentDecisionPreviewSummary"
			:scene-agent-action-previews="sceneAgentActionPreviews"
			:selected-scene-agent-action-key="selectedSceneAgentActionKey"
			:memory-session-continuation="memorySessionContinuation"
			:memory-session-action-items="memorySessionActionItems"
			:world-interface-signals="worldInterfaceSignals"
			:world-interface-summary="worldInterfaceSummary"
			:capabilities="capabilities"
			:scene-domain-capabilities="sceneDomainCapabilities"
			@select-scene-agent-action="selectSceneAgentAction"
			@handle-memory-session-action="handleMemorySessionAction"
		/>
	</view>
</template>

<script>
import XichengScanAdvancedContextPanel from '@/components/xicheng/XichengScanAdvancedContextPanel.vue'
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import {
	isXichengDevelopmentRecognitionCacheBlocked,
	requestCurrentLocationForTrigger,
	resolveXichengOcrImageTrigger,
	resolveXichengPhotoTrigger,
	resolveXichengTextTrigger
} from '@/request/xunjing/trigger.js'
import { createXichengRouteOutputValue, decodeXichengRouteValue } from '@/request/xunjing/routeParams.js'
import { isXichengUnsafeSafetyStatus, normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'
import { isXunjingUserCancelled } from '@/request/xunjing/userCancel.js'

const encodeRouteValue = (value = '') => createXichengRouteOutputValue(value, { platform: process.env.UNI_PLATFORM })
const decodeRouteValue = decodeXichengRouteValue

export default {
	components: {
		XichengScanAdvancedContextPanel
	},
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			recognizing: false,
			lastError: '',
			manualText: '',
			showAdvancedScanContext: false,
			scanRecognitionModes: ['扫码', '文字', '地点', '路线'],
			currentLocation: null,
			sceneFusionSignals: [],
			sceneFusionSummary: '镜头待命，正在接入现场信号',
			worldInterfaceSignals: [],
			worldInterfaceSummary: '现实世界成为AI的交互界面，等待现场信号',
			selectedSceneDomainKey: 'architecture',
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
			],
			sceneDomainCapabilities: [
				{ domainKey: 'architecture', label: '建筑', title: '建筑/空间', copy: '年代、结构、修复和拍照角度。' },
				{ domainKey: 'artifact', label: '文物', title: '文物/展陈', copy: '用途、工艺、年代和同时代事件。' },
				{ domainKey: 'menu', label: '菜单', title: '菜单理解', copy: '辣度、清真、推荐菜和人数建议。' },
				{ domainKey: 'food', label: '食物', title: '食物讲解', copy: '来源、吃法、搭配和附近推荐。' },
				{ domainKey: 'sign-ocr', label: '路牌/OCR', title: '文字与导航', copy: '翻译、发音、意义和怎么走。' },
				{ domainKey: 'heritage', label: '非遗', title: '非遗体验', copy: '器物、技艺、演奏和附近体验。' },
				{ domainKey: 'plant', label: '植物', title: '植物观察', copy: '树龄、分布、季节和生态知识。' },
				{ domainKey: 'animal', label: '动物', title: '动物保护', copy: '习性、栖息地、保护和安全距离。' },
				{ domainKey: 'person', label: '人物', title: '人物故事', copy: '雕像、人物贡献和时代关系。' },
				{ domainKey: 'event', label: '活动', title: '活动/演出', copy: '节目、时间、票务和下一步服务。' }
			]
		}
	},
	computed: {
		sceneDomainImageLabels() {
			const selectedSceneDomain = this.getSelectedSceneDomainCapability()
			const domainLabels = this.sceneDomainCapabilities
				.flatMap(domain => [domain.label, domain.title])
				.filter(Boolean)
			return Array.from(new Set([
				selectedSceneDomain.domainKey ? `sceneDomainIntent:${selectedSceneDomain.domainKey}` : '',
				selectedSceneDomain.label,
				selectedSceneDomain.title,
				selectedSceneDomain.copy,
				...domainLabels,
				'照片',
				'OCR文字',
				'地点线索',
				'路线图'
			].filter(Boolean)))
		},
		sceneAgentActionPreviews() {
			return this.createSceneAgentActionPreviews()
		},
		memorySessionContinuation() {
			const context = this.buildSceneFusionContext()
			const memorySessionPackage = context.visionAgentMemorySessionPackage
			if (!memorySessionPackage || Number(memorySessionPackage.sceneCount || 0) <= 0) return null
			return {
				packageName: memorySessionPackage.packageName || 'AI识境连续会话包',
				sceneCount: Number(memorySessionPackage.sceneCount || context.memorySessionSceneCount || 0),
				poiTrailText: memorySessionPackage.poiTrailText || context.visionAgentMemorySessionText || '连续识境路线正在形成。',
				continuityCueText: memorySessionPackage.continuityCueText || '小京会按上一段识境继续理解，不重新开始讲解。',
				domainContinuityText: memorySessionPackage.domainContinuityText || '连续关注的场景领域正在形成。',
				serviceContinuityText: memorySessionPackage.serviceContinuityText || '后续服务保持在讲解、路线和游记上接力。'
			}
		},
		memorySessionActionItems() {
			const continuation = this.memorySessionContinuation
			if (!continuation) return []
			return [
				{
					key: 'continue-memory-guide',
					title: '继续问小京',
					copy: '带着上一段路线、场景和服务意图继续对话。'
				},
				{
					key: 'travelogue-memory-draft',
					title: '生成今日游记',
					copy: '把连续识境路线写成今日故事草稿。'
				}
			]
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
		this.showAdvancedScanContext = this.shouldShowAdvancedScanContext(options)
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
		goBack() {
			const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
			if (pages && pages.length > 1) {
				uni.navigateBack({ delta: 1 })
				return
			}
			uni.reLaunch({ url: '/pages/xicheng/home/home' })
		},
		shouldShowAdvancedScanContext(options = {}) {
			const rawFlag = decodeRouteValue(options.showAdvancedScanContext)
				|| decodeRouteValue(options.debugSceneContext)
				|| ''
			return ['1', 'true', 'yes'].includes(String(rawFlag).toLowerCase())
		},
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
			const selectedSceneDomain = this.getSelectedSceneDomainCapability()
			return {
				...this.visionAgentContext,
				sourceRecognitionContext: this.createSceneDomainSourceRecognitionContext(source, trigger, selectedSceneDomain),
				sceneFusionSummary: this.sceneFusionSummary,
				sceneFusionSignals: this.sceneFusionSignals,
				worldInterfaceSnapshot,
				worldInterfaceSummary: worldInterfaceSnapshot.summary,
				worldInterfaceSignals: worldInterfaceSnapshot.signals,
				source,
				sceneDomainIntentKey: selectedSceneDomain.domainKey || '',
				sceneDomainIntentLabel: selectedSceneDomain.label || '',
				sceneDomainIntentTitle: selectedSceneDomain.title || '',
				sceneDomainIntentCopy: selectedSceneDomain.copy || '',
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
				agentDecisionReasonCards: agentDecisionSnapshot.agentDecisionReasonCards,
				agentDecisionReasonSummary: agentDecisionSnapshot.agentDecisionReasonSummary,
				sceneAgentActionPreviews: agentDecisionSnapshot.sceneAgentActionPreviews
			}
		},
		buildTriggerSceneSignals(source = '') {
			const fusionContext = this.buildSceneFusionContext()
			const fusionSignals = this.buildSceneFusionSignals(fusionContext)
			const worldInterfaceSnapshot = this.buildWorldInterfaceSnapshot(fusionContext)
			const selectedSceneDomain = this.getSelectedSceneDomainCapability()
			const agentDecisionSnapshot = this.buildAgentDecisionSnapshot()
			return {
				source,
				sceneFusionSummary: this.buildSceneFusionSummary(fusionContext, fusionSignals),
				worldInterfaceSummary: worldInterfaceSnapshot.summary,
				localTimeText: fusionContext.localTimeText || '',
				weatherText: fusionContext.weatherText || '',
				headingText: fusionContext.headingText || '',
				headingDegrees: fusionContext.headingDegrees || '',
				sceneDomainIntentKey: selectedSceneDomain.domainKey || '',
				sceneDomainIntentLabel: selectedSceneDomain.label || '',
				sceneDomainIntentTitle: selectedSceneDomain.title || '',
				sceneDomainIntentCopy: selectedSceneDomain.copy || '',
				agentDecisionActionTitle: agentDecisionSnapshot.agentDecisionActionTitle || '',
				agentDecisionReasonSummary: agentDecisionSnapshot.agentDecisionReasonSummary || '',
				memorySessionSceneCount: agentDecisionSnapshot.memorySessionSceneCount || fusionContext.memorySessionSceneCount || 0
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
		createAgentDecisionReasonCards(context = {}, selectedAction = {}) {
			const actionTitle = selectedAction.title || '下一步动作'
			const localTimeText = String(context.localTimeText || '').trim()
			const weatherText = String(context.weatherText || '').trim()
			const locationText = String(context.locationText || '').trim()
			const headingText = String(context.headingText || '').trim()
			const knowledgeGraphText = String(context.knowledgeGraphText || '').trim()
			const serviceText = String(context.serviceText || context.activityText || '').trim()
			const memoryText = String(context.visionAgentMemorySessionText || '').trim()
			const memoryTrail = Array.isArray(context.memoryTrail) ? context.memoryTrail : []
			const worldInterfaceSnapshot = this.buildWorldInterfaceSnapshot(context)
			const environmentText = [localTimeText, weatherText].filter(Boolean).join(' / ')
			const placeText = [locationText, headingText].filter(Boolean).join(' / ')
			const reasonCards = [
				{
					key: 'environment',
					label: '时间天气',
					title: '先看当下时机',
					copy: environmentText ? `${environmentText}，所以先${actionTitle}。` : `结合时间天气判断是否先${actionTitle}。`,
					weight: environmentText ? 42 : 14
				},
				{
					key: 'world-interface',
					label: '世界交互',
					title: '镜头不是孤立识别',
					copy: worldInterfaceSnapshot.summary || `把镜头、GPS和城市知识一起交给 Agent 决策。`,
					weight: worldInterfaceSnapshot.summary ? 38 : 20
				},
				{
					key: 'knowledge-service',
					label: serviceText ? '城市服务' : '知识图谱',
					title: serviceText ? '接后续服务' : '沿知识网络追问',
					copy: serviceText || knowledgeGraphText
						? `结合${serviceText || knowledgeGraphText}，识别后直接接下一步。`
						: '识别后可继续讲历史、路线、打卡和游记。',
					weight: serviceText || knowledgeGraphText ? 36 : 18
				},
				{
					key: 'memory',
					label: '连续记忆',
					title: '不从零开始',
					copy: memoryText || (memoryTrail.length > 0 ? '沿上一处识境继续理解现场。' : '本次识境会写入连续会话，下一次可接着问。'),
					weight: memoryText || memoryTrail.length > 0 ? 34 : 12
				},
				{
					key: 'position',
					label: '位置方向',
					title: '确认现场方位',
					copy: placeText ? `${placeText}，用来判断你正看向哪里。` : '结合定位和朝向判断当前世界。',
					weight: placeText ? 32 : 10
				}
			]
			return reasonCards
				.sort((left, right) => right.weight - left.weight)
				.slice(0, 3)
				.map(({ weight, ...reason }) => reason)
		},
		selectSceneAgentAction(action = {}) {
			if (!action.key) return
			this.selectedSceneAgentActionKey = action.key
			this.sceneAgentActionUserSelected = true
		},
		selectSceneDomain(domain = {}) {
			if (!domain.domainKey) return
			this.selectedSceneDomainKey = domain.domainKey
		},
		getSelectedSceneDomainCapability() {
			return this.sceneDomainCapabilities.find(domain => domain.domainKey === this.selectedSceneDomainKey)
				|| this.sceneDomainCapabilities[0]
				|| {}
		},
		shouldUseOcrImageRecognition() {
			return ['sign-ocr', 'menu'].includes(this.selectedSceneDomainKey)
		},
		createSceneDomainSourceRecognitionContext(source = '', trigger = {}, selectedSceneDomain = this.getSelectedSceneDomainCapability()) {
			const previousContext = this.parseVisionAgentSourceContext((this.visionAgentContext || {}).sourceRecognitionContext)
			return JSON.stringify({
				...previousContext,
				source,
				poiCode: trigger.poiCode || previousContext.poiCode || '',
				poiName: trigger.poiName || previousContext.poiName || '',
				sourceLabel: trigger.sourceLabel || previousContext.sourceLabel || '',
				sceneDomainIntentKey: selectedSceneDomain.domainKey || '',
				sceneDomainIntentLabel: selectedSceneDomain.label || '',
				sceneDomainIntentTitle: selectedSceneDomain.title || '',
				sceneDomainIntentCopy: selectedSceneDomain.copy || ''
			})
		},
		buildAgentDecisionSnapshot() {
			const context = this.buildSceneFusionContext()
			const sceneAgentActionPreviews = this.sceneAgentActionPreviews
			const selectedAction = sceneAgentActionPreviews.find(action => action.key === this.selectedSceneAgentActionKey)
				|| sceneAgentActionPreviews[0]
				|| {}
			const agentDecisionReasonCards = this.createAgentDecisionReasonCards(context, selectedAction)
			const agentDecisionReasonSummary = agentDecisionReasonCards
				.map(card => `${card.label}：${card.copy}`)
				.join('；')
				.slice(0, 180)
			return {
				selectedSceneAgentActionKey: selectedAction.key || '',
				agentDecisionPreviewSummary: selectedAction.title
					? `Agent建议先${selectedAction.title}，${selectedAction.copy}`.slice(0, 88)
					: '',
				sceneAgentActionPreviews,
				agentDecisionReasonCards,
				agentDecisionReasonSummary,
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
					const source = this.shouldUseOcrImageRecognition() ? 'ocr' : 'photo'
					try {
						const text = this.manualText.trim()
						const sceneSignals = this.buildTriggerSceneSignals(source)
						const trigger = await (source === 'ocr'
							? resolveXichengOcrImageTrigger({
								filePath,
								text,
								ocrText: text,
								imageLabels: this.sceneDomainImageLabels,
								sceneSignals
							})
							: resolveXichengPhotoTrigger({
								filePath,
								text,
								ocrText: text,
								imageLabels: this.sceneDomainImageLabels,
								sceneSignals
							}))
						this.openScanResult(trigger, source)
					} catch (error) {
						this.handleRecognitionServiceFailure(source, error)
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
				const source = location ? 'gps' : 'text'
				const sceneSignals = this.buildTriggerSceneSignals(source)
				const trigger = await resolveXichengTextTrigger({
					text,
					ocrText: text,
					location,
					source,
					sceneSignals
				})
				this.openScanResult(trigger, source)
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
				const sceneSignals = this.buildTriggerSceneSignals(source)
				const trigger = await resolveXichengTextTrigger({
					text,
					ocrText: this.manualText.trim() || text,
					location: this.currentLocation,
					source,
					sceneSignals
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
			const visionAgentContext = result.visionAgentContext || {}
			uni.navigateTo({
				url: `/pages/xicheng/scan-result/scan-result?source=${encodeRouteValue(source)}&regionCode=${encodeRouteValue(result.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(result.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(result.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(result.sourceChannel || this.region.sourceChannel)}&poiCode=${encodeRouteValue(result.poiCode || '')}&poiName=${encodeRouteValue(result.poiName || '')}&companionName=${encodeRouteValue(result.companionName || this.region.companionName)}&safetyStatus=${encodeRouteValue(result.safetyStatus || '')}&visionAgentContext=${encodeRouteValue(JSON.stringify(visionAgentContext || {}))}&sourceRecognitionContext=${encodeRouteValue(visionAgentContext.sourceRecognitionContext || '')}&memorySessionSceneCount=${encodeRouteValue(visionAgentContext.memorySessionSceneCount || '')}`
			})
		},
		handleMemorySessionAction(action = {}) {
			if (action.key === 'continue-memory-guide') {
				this.continueMemorySessionWithXiaojing()
				return
			}
			if (action.key === 'travelogue-memory-draft') {
				this.openMemorySessionTravelogue()
			}
		},
		createMemorySessionContinuationContext() {
			const continuation = this.memorySessionContinuation || {}
			const visionAgentContext = this.buildVisionAgentSceneContext('memory-session', {
				sourceLabel: 'AI识境连续会话包',
				poiName: continuation.poiTrailText || ''
			})
			return {
				...visionAgentContext,
				entry: 'scan-memory-session',
				sourceRecognitionContext: visionAgentContext.sourceRecognitionContext || JSON.stringify({
					sourceLabel: 'AI识境连续会话包',
					poiTrailText: continuation.poiTrailText || '',
					sceneCount: continuation.sceneCount || ''
				})
			}
		},
		continueMemorySessionWithXiaojing() {
			const visionAgentContext = this.createMemorySessionContinuationContext()
			const question = visionAgentContext.visionAgentMemorySessionText || '沿着刚才的连续识境继续讲，先告诉我下一步最值得做什么。'
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?question=${encodeRouteValue(question)}&regionCode=${encodeRouteValue(this.routeContext.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(this.routeContext.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(this.routeContext.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.routeContext.sourceChannel || this.region.sourceChannel)}&companionName=${encodeRouteValue(this.routeContext.companionName || this.region.companionName)}&visionAgentContext=${encodeRouteValue(JSON.stringify(visionAgentContext))}&sourceRecognitionContext=${encodeRouteValue(visionAgentContext.sourceRecognitionContext || '')}`
			})
		},
		openMemorySessionTravelogue() {
			const visionAgentContext = this.createMemorySessionContinuationContext()
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?regionCode=${encodeRouteValue(this.routeContext.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(this.routeContext.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(this.routeContext.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.routeContext.sourceChannel || this.region.sourceChannel)}&visionAgentContext=${encodeRouteValue(JSON.stringify(visionAgentContext))}&memorySessionSceneCount=${encodeRouteValue(visionAgentContext.memorySessionSceneCount || '')}`
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

.scan-panel {
	margin-top: 24rpx;
	padding: 28rpx;
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

.scene-domain-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 24rpx;
}

.scene-domain-item {
	min-width: 0;
	min-height: 136rpx;
	padding: 18rpx;
	border-radius: 20rpx;
	background: rgba(255, 252, 244, 0.78);
	border: 1rpx solid rgba(31, 110, 90, 0.10);
	box-sizing: border-box;
}

.scene-domain-item-active {
	background: rgba(239, 248, 239, 0.96);
	border-color: rgba(31, 110, 90, 0.34);
}

.scene-domain-label,
.scene-domain-title,
.scene-domain-copy {
	display: block;
	line-height: 1.35;
}

.scene-domain-label {
	font-size: 20rpx;
	font-weight: 800;
	color: #B8812B;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.scene-domain-title {
	margin-top: 8rpx;
	font-size: 24rpx;
	font-weight: 800;
	color: #102F29;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.scene-domain-copy {
	margin-top: 8rpx;
	font-size: 21rpx;
	color: rgba(16, 47, 41, 0.62);
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
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

.scan-reference-page {
	padding: 34rpx 32rpx 78rpx;
	background:
		radial-gradient(circle at 86% 4%, rgba(225, 209, 176, 0.24), transparent 30%),
		linear-gradient(180deg, #FFFCF6 0%, #F7F0E4 100%);
}

.scan-reference-topbar {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 86rpx;
}

.scan-topbar-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 72rpx;
	height: 72rpx;
	padding: 0;
	margin: 0;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.88);
	box-shadow: 0 10rpx 26rpx rgba(50, 37, 24, 0.10);
}

.scan-topbar-button::after,
.scan-primary-button::after {
	border: 0;
}

.scan-topbar-spacer {
	width: 72rpx;
	height: 72rpx;
}

.scan-page-title {
	position: absolute;
	left: 112rpx;
	right: 112rpx;
	top: 50%;
	transform: translateY(-50%);
	text-align: center;
	font-size: 40rpx;
	font-weight: 900;
	color: #102F29;
	letter-spacing: 0;
}

.scan-reference-page .scan-hero {
	display: grid;
	grid-template-columns: 200rpx minmax(0, 1fr);
	align-items: end;
	gap: 22rpx;
	margin-top: 20rpx;
	padding: 0;
	background: transparent;
	border: 0;
	box-shadow: none;
	overflow: visible;
}

.scan-hero-avatar {
	width: 200rpx;
	height: 228rpx;
	object-fit: contain;
	filter: drop-shadow(0 16rpx 24rpx rgba(50, 37, 24, 0.10));
}

.scan-hero-bubble {
	position: relative;
	min-height: 124rpx;
	margin-bottom: 22rpx;
	padding: 28rpx 30rpx;
	border-radius: 26rpx;
	background: rgba(255, 252, 246, 0.88);
	border: 1rpx solid rgba(16, 47, 41, 0.10);
	box-shadow: 0 12rpx 30rpx rgba(50, 37, 24, 0.08);
	box-sizing: border-box;
}

.scan-hero-bubble::before {
	content: "";
	position: absolute;
	left: -20rpx;
	top: 54rpx;
	width: 38rpx;
	height: 28rpx;
	background: rgba(255, 252, 246, 0.88);
	border-left: 1rpx solid rgba(16, 47, 41, 0.10);
	border-bottom: 1rpx solid rgba(16, 47, 41, 0.10);
	transform: rotate(28deg);
}

.scan-hero-bubble-copy {
	display: block;
	font-size: 32rpx;
	line-height: 1.5;
	font-weight: 700;
	color: #102F29;
}

.scan-reference-camera {
	position: relative;
	height: 780rpx;
	margin-top: 14rpx;
	padding: 0;
	border-radius: 36rpx;
	overflow: hidden;
	background: #E5D7C1;
	box-shadow: 0 18rpx 42rpx rgba(50, 37, 24, 0.14);
}

.scan-camera-image,
.scan-camera-dim,
.scan-reference-viewfinder {
	position: absolute;
	inset: 0;
}

.scan-camera-image {
	width: 100%;
	height: 100%;
}

.scan-camera-dim {
	background: linear-gradient(180deg, rgba(16, 47, 41, 0.06), rgba(16, 47, 41, 0.08));
}

.scan-camera-grid {
	position: absolute;
	background: rgba(255, 255, 255, 0.56);
}

.scan-camera-grid-vertical-a,
.scan-camera-grid-vertical-b {
	top: 0;
	bottom: 0;
	width: 2rpx;
}

.scan-camera-grid-vertical-a {
	left: 33.33%;
}

.scan-camera-grid-vertical-b {
	left: 66.66%;
}

.scan-camera-grid-horizontal-a,
.scan-camera-grid-horizontal-b {
	left: 0;
	right: 0;
	height: 2rpx;
}

.scan-camera-grid-horizontal-a {
	top: 33.33%;
}

.scan-camera-grid-horizontal-b {
	top: 66.66%;
}

.scan-viewfinder-corner {
	position: absolute;
	width: 70rpx;
	height: 70rpx;
	border-color: rgba(255, 255, 255, 0.96);
}

.scan-viewfinder-corner-tl {
	left: 42rpx;
	top: 42rpx;
	border-left: 7rpx solid;
	border-top: 7rpx solid;
	border-radius: 18rpx 0 0 0;
}

.scan-viewfinder-corner-tr {
	right: 42rpx;
	top: 42rpx;
	border-right: 7rpx solid;
	border-top: 7rpx solid;
	border-radius: 0 18rpx 0 0;
}

.scan-viewfinder-corner-bl {
	left: 42rpx;
	bottom: 42rpx;
	border-left: 7rpx solid;
	border-bottom: 7rpx solid;
	border-radius: 0 0 0 18rpx;
}

.scan-viewfinder-corner-br {
	right: 42rpx;
	bottom: 42rpx;
	border-right: 7rpx solid;
	border-bottom: 7rpx solid;
	border-radius: 0 0 18rpx 0;
}

.scan-album-pill {
	position: absolute;
	top: 126rpx;
	right: 32rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	padding: 18rpx 14rpx;
	min-width: 74rpx;
	border-radius: 24rpx;
	background: rgba(16, 47, 41, 0.72);
	color: #FFFFFF;
	box-shadow: 0 12rpx 24rpx rgba(16, 47, 41, 0.18);
	box-sizing: border-box;
}

.scan-album-pill text {
	font-size: 22rpx;
	font-weight: 700;
	color: #FFFFFF;
}

.scan-reference-auto-card {
	display: grid;
	grid-template-columns: 74rpx minmax(0, 1fr);
	gap: 20rpx;
	align-items: center;
	margin-top: 34rpx;
	padding: 26rpx 28rpx;
	border-radius: 32rpx;
	background: rgba(255, 252, 246, 0.94);
}

.scan-auto-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 68rpx;
	height: 68rpx;
	border-radius: 50%;
	background: #173F35;
}

.scan-auto-content {
	min-width: 0;
}

.scan-auto-title-row,
.scan-mode-list {
	display: flex;
	align-items: center;
	min-width: 0;
}

.scan-auto-title-row {
	gap: 12rpx;
	flex-wrap: wrap;
}

.scan-auto-title {
	font-size: 30rpx;
	font-weight: 800;
	color: #102F29;
}

.scan-mode-list {
	gap: 10rpx;
	flex-wrap: wrap;
}

.scan-reference-mode-chip {
	padding: 10rpx 22rpx;
	border-radius: 999rpx;
	background: rgba(247, 240, 230, 0.96);
	color: rgba(16, 47, 41, 0.70);
	font-size: 24rpx;
	font-weight: 700;
	line-height: 1.1;
}

.scan-auto-copy {
	display: block;
	margin-top: 16rpx;
	font-size: 25rpx;
	line-height: 1.5;
	color: rgba(16, 47, 41, 0.58);
}

.scan-reference-page .scan-textarea {
	min-height: 86rpx;
	margin-top: 20rpx;
	padding: 22rpx 26rpx;
	border-radius: 26rpx;
	background: rgba(255, 252, 246, 0.86);
	box-shadow: 0 10rpx 24rpx rgba(50, 37, 24, 0.06);
}

.scan-reference-page .scan-primary-button {
	height: 96rpx;
	margin-top: 26rpx;
	border-radius: 999rpx;
	box-shadow: 0 16rpx 28rpx rgba(16, 47, 41, 0.20);
}

.scan-primary-inner {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 18rpx;
	width: 100%;
	height: 100%;
}

.scan-primary-inner text {
	font-size: 34rpx;
	font-weight: 900;
	color: #FFFFFF;
}

.scan-reference-nearby-card {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin-top: 28rpx;
	padding: 26rpx 28rpx;
	border-radius: 30rpx;
	background: rgba(255, 252, 246, 0.94);
}

.scan-nearby-copy {
	display: flex;
	align-items: baseline;
	gap: 12rpx;
	min-width: 0;
	flex: 1;
}

.scan-nearby-label {
	font-size: 28rpx;
	color: rgba(16, 47, 41, 0.72);
	white-space: nowrap;
}

.scan-nearby-name {
	min-width: 0;
	font-size: 34rpx;
	font-weight: 900;
	color: #102F29;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.scan-reference-page .scan-privacy {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	margin-top: 28rpx;
	font-size: 24rpx;
	color: rgba(16, 47, 41, 0.52);
	text-align: center;
}

.scan-reference-page .scan-privacy text {
	font-size: 24rpx;
	line-height: 1.45;
	color: rgba(16, 47, 41, 0.52);
}

</style>
