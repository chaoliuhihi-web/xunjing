<template>
	<view class="container" :class="isXichengChatMode ? ['xicheng-designed-page', 'xicheng-chat-container'] : []">
		<view v-if="showKashgarDiaryGenerator" class="kashgar-diary-generator">
			<view class="kashgar-diary-bg"></view>
			<view class="kashgar-diary-topbar">
				<view class="kashgar-diary-brand">
					<view class="kashgar-diary-logo">✦</view>
					<view class="kashgar-diary-brand-copy">
						<text class="kashgar-diary-brand-name">星河寻境</text>
						<text class="kashgar-diary-brand-sub">喀什旅行小助手</text>
					</view>
				</view>
				<view class="kashgar-diary-capsule">
					<text>•••</text>
					<view class="kashgar-diary-capsule-line"></view>
					<text class="kashgar-diary-ring">◎</text>
				</view>
			</view>

			<view class="kashgar-diary-heading">
				<text class="kashgar-diary-title">生成我的喀什游记</text>
				<text class="kashgar-diary-subtitle">AI 帮你记录喀什，留下独一无二的旅程回忆</text>
			</view>

			<view class="kashgar-diary-hero">
				<image class="kashgar-diary-hero-image" src="/static/kashgar/diary-generator-hero.png" mode="aspectFill"></image>
			</view>

			<view class="kashgar-diary-elements">
				<view class="kashgar-diary-elements-head">
					<text class="kashgar-diary-spark">✧</text>
					<text>AI识别到的喀什元素</text>
				</view>
				<view
					v-for="element in kashgarDiaryElements"
					:key="element.name"
					class="kashgar-diary-element"
				>
					<text class="kashgar-diary-element-icon">{{ element.icon }}</text>
					<text>{{ element.name }}</text>
				</view>
			</view>

			<view class="kashgar-diary-mode-tabs">
				<view
					v-for="mode in kashgarDiaryModes"
					:key="mode.key"
					:class="['kashgar-diary-mode', activeKashgarDiaryMode === mode.key ? 'kashgar-diary-mode-active' : '']"
					@click="activeKashgarDiaryMode = mode.key"
				>
					<text class="kashgar-diary-mode-icon">{{ mode.icon }}</text>
					<text>{{ mode.title }}</text>
				</view>
			</view>

			<view class="kashgar-diary-content-grid">
				<view class="kashgar-diary-preview">
					<view class="kashgar-diary-preview-kicker">
						<text>AI 预览</text>
						<text>以下为 AI 生成预览内容</text>
					</view>
					<text class="kashgar-diary-preview-title">沿着石巷，把喀什写进今天</text>
					<text class="kashgar-diary-preview-copy">
						在喀什古城的阳光里，我们放慢了脚步。穿过土砖巷弄，听老人讲茶馆里的故事，看鸽子从广场上空掠过，也尝到了刚出炉的烤包子。这是一场有温度的亲子旅行，把喀什的烟火气，悄悄藏进了记忆里。
					</text>
					<view class="kashgar-diary-preview-line"></view>
					<view class="kashgar-diary-stats">
						<view v-for="stat in kashgarDiaryStats" :key="stat.label" class="kashgar-diary-stat">
							<text class="kashgar-diary-stat-icon">{{ stat.icon }}</text>
							<text>{{ stat.value }}</text>
							<text>{{ stat.label }}</text>
						</view>
					</view>
				</view>

				<view class="kashgar-diary-complete">
					<text class="kashgar-diary-complete-title">AI 已为你整理完成 ✦</text>
					<view class="kashgar-diary-check-list">
						<view v-for="item in kashgarDiaryChecklist" :key="item" class="kashgar-diary-check">
							<text class="kashgar-diary-check-dot">✓</text>
							<text>{{ item }}</text>
						</view>
					</view>
					<image class="kashgar-diary-mascot" src="/static/kashgar/diary-generator-mascot.png" mode="aspectFill"></image>
				</view>
			</view>

			<view class="kashgar-diary-actions">
				<view class="kashgar-diary-action kashgar-diary-action-secondary" @click="optimizeKashgarDiary">
					<text>✦</text>
					<text>继续优化</text>
				</view>
				<view class="kashgar-diary-action kashgar-diary-action-primary" @click="generateKashgarDiary">
					<text>✦</text>
					<text>一键生成</text>
				</view>
			</view>
			<text class="kashgar-diary-footnote">✧ 生成后可自由编辑与分享 ✧</text>
		</view>

		<view v-else-if="showAiCompanionHome" class="kashgar-ai-home">
			<view class="kashgar-ai-topbar">
				<text class="kashgar-ai-clock">9:41</text>
				<view class="kashgar-ai-capsule">
					<text class="kashgar-ai-dot">•••</text>
					<view class="kashgar-ai-capsule-line"></view>
					<view class="kashgar-ai-circle"></view>
				</view>
			</view>

			<view class="kashgar-ai-title-row">
				<view class="kashgar-ai-mountain"></view>
				<text class="kashgar-ai-title">喀小寻 AI旅伴</text>
			</view>

			<view class="kashgar-ai-hero">
				<image class="kashgar-ai-hero-image" src="/static/kashgar/ai-companion-hero.png" mode="aspectFill"></image>
				<view class="kashgar-ai-hero-button" @click="openAiCompanionChat()">
					<view class="kashgar-ai-chat-icon"></view>
					<text>问问喀小寻~</text>
				</view>
			</view>

			<view class="kashgar-ai-action-panel">
				<view
					v-for="action in aiCompanionActions"
					:key="action.key"
					class="kashgar-ai-action"
					@click="handleAiCompanionAction(action)"
				>
					<view class="kashgar-ai-action-icon" :class="action.iconClass"></view>
					<text>{{ action.title }}</text>
				</view>
			</view>

			<view class="kashgar-ai-card kashgar-ai-question-card">
				<view class="kashgar-ai-section-head">
					<text class="kashgar-ai-section-title">热门问题</text>
					<text class="kashgar-ai-refresh">换一换</text>
				</view>
				<view
					v-for="question in aiCompanionQuestions"
					:key="question"
					class="kashgar-ai-question"
					@click="openAiCompanionChat(question)"
				>
					<view class="kashgar-ai-question-dot"></view>
					<text>{{ question }}</text>
				</view>
			</view>

			<view class="kashgar-ai-card kashgar-ai-place-section">
				<view class="kashgar-ai-section-head">
					<text class="kashgar-ai-section-title">精选打卡地</text>
					<text class="kashgar-ai-more" @click="goAiCompanionMap">更多 ></text>
				</view>
				<view class="kashgar-ai-place-grid">
					<view
						v-for="place in aiCompanionPlaces"
						:key="place.title"
						class="kashgar-ai-place-card"
						@click="openAiCompanionChat(place.question)"
					>
						<image :src="place.cover" class="kashgar-ai-place-image" mode="aspectFill"></image>
						<text class="kashgar-ai-place-badge">{{ place.badge }}</text>
						<view class="kashgar-ai-place-body">
							<text class="kashgar-ai-place-title">{{ place.title }}</text>
							<text class="kashgar-ai-place-desc">{{ place.desc }}</text>
						</view>
					</view>
				</view>
				<view class="kashgar-ai-join" @click="joinAiCompanionTrip">
					<view class="kashgar-ai-join-icon"></view>
					<text>加入旅行</text>
				</view>
			</view>

			<tab-bar :current="1" />
		</view>

		<view v-else class="ai-chat-shell" :class="{ 'xicheng-chat-shell': isXichengChatMode }">
		<!-- 背景图 -->
		<image class="bg-image" :class="{ 'xicheng-chat-bg-image': isXichengChatMode }" :src="BG_IMAGE" mode="aspectFill"></image>

		<!-- 自定义导航栏 -->
		<custom-nav
			:title="chatNavTitle"
			:left-icon="UrlImg + '/baidu_map/weatch/images/left.png'"
			:background-color="isXichengChatMode ? '#FFF8EC' : '#FFFFFF'"
			@leftClick="goBack"
			@navHeight="handleNavHeight"
		/>

		<view v-if="isXichengChatMode" class="xicheng-chat-more-btn" @click="showXichengChatMenu">
			<text class="xicheng-chat-more-dot">•••</text>
		</view>

		<!-- 清空历史按钮 -->
		<view v-else class="clear-history-btn" @click="clearChatHistory">
			<text class="clear-icon">🗑️</text>
		</view>

		<!-- 页面内容 -->
		<view class="content">
			<!-- 聊天消息列表 -->
			<view
				class="chat-list"
				:style="{ paddingTop: chatListPaddingTop }"
			>
				<view v-if="isXichengChatMode" class="xicheng-chat-hero-card">
					<image
						class="xicheng-chat-hero-landmark"
						:src="XICHENG_REGION_CONFIG.visualAssets.heroLandmark"
						mode="aspectFill"
					></image>
					<view class="xicheng-chat-hero-overlay"></view>
					<view class="xicheng-chat-hero-head">
						<text class="xicheng-chat-hero-kicker">{{ xichengAiContext.poiName || XICHENG_REGION_CONFIG.cityName }}</text>
						<text class="xicheng-chat-hero-title">{{ isXichengPlaybackMode ? 'AI 讲解' : '问问小京' }}</text>
					</view>
					<view class="xicheng-chat-companion-row">
						<image
							class="xicheng-chat-companion-avatar"
							:src="XICHENG_REGION_CONFIG.companionAvatar"
							mode="aspectFit"
						></image>
						<view class="xicheng-chat-companion-bubble xicheng-companion-bubble">
							<text class="xicheng-chat-companion-title">你想了解西城的哪一面？</text>
							<text class="xicheng-chat-companion-desc">{{ xichengHeroSubtitle }}</text>
						</view>
					</view>
						<view v-if="xichengVisionAgentContextChips.length > 0" class="xicheng-vision-agent-strip">
							<text class="xicheng-vision-agent-strip-title">AI识境已接入</text>
							<view class="xicheng-vision-agent-chip-row">
								<text
									v-for="chip in xichengVisionAgentContextChips"
									:key="chip.key"
									class="xicheng-vision-agent-chip"
								>
									{{ chip.label }} {{ chip.value }}
								</text>
							</view>
						</view>
						<view v-if="xichengServiceHandoffContext" class="xicheng-service-handoff-strip">
							<text class="xicheng-service-handoff-kicker">AI识境服务承接</text>
							<text class="xicheng-service-handoff-title">{{ xichengServiceHandoffContext.title }}</text>
							<view class="xicheng-service-handoff-row"><text class="xicheng-service-handoff-pill">{{ xichengServiceHandoffContext.intentText }}</text><text class="xicheng-service-handoff-next">{{ xichengServiceHandoffContext.stepText }}</text></view>
						</view>
						<view v-if="!isXichengPlaybackMode" class="xicheng-chat-prompt-row">
							<button
								v-for="question in xichengHeroQuestions"
								:key="question"
								class="xicheng-chat-prompt-chip"
								@click="handleFollowUpClick(question)"
							>
							{{ question }}
						</button>
					</view>
				</view>
				<view v-if="isXichengPlaybackMode" class="xicheng-playback-card">
					<view class="xicheng-playback-head">
						<text class="xicheng-playback-kicker">AI 讲解播放</text>
						<text class="xicheng-playback-title">{{ xichengPlaybackTitle }}</text>
						<text class="xicheng-playback-desc">{{ xichengPlaybackSourceSummary }}</text>
					</view>
					<view class="xicheng-playback-console">
						<view class="xicheng-playback-ring">
							<text class="xicheng-playback-time">00:32</text>
							<text class="xicheng-playback-duration">/ {{ xichengPlaybackDuration }}</text>
						</view>
						<view class="xicheng-playback-wave" aria-label="小京 AI 讲解波形">
							<view
								v-for="(bar, barIndex) in XICHENG_PLAYBACK_WAVE_BARS"
								:key="barIndex"
								class="xicheng-playback-wave-bar"
								:class="{ 'xicheng-playback-wave-bar-active': barIndex >= 5 && barIndex <= 9 }"
								:style="{ height: bar + 'rpx' }"
							></view>
						</view>
						<view class="xicheng-playback-controls">
							<button class="xicheng-playback-control" @click="seekXichengPlayback(-15)">15 秒前</button>
							<button class="xicheng-playback-main-control" @click="toggleXichengPlayback">
								{{ xichengPlaybackPaused ? '继续' : '暂停' }}
							</button>
							<button class="xicheng-playback-control" @click="seekXichengPlayback(15)">15 秒后</button>
						</view>
					</view>
					<view class="xicheng-playback-source-row">
						<view
							v-for="(source, sourceIndex) in xichengPlaybackSources"
							:key="source.id || source.title || sourceIndex"
							class="xicheng-playback-source-pill"
							@click="handleFollowUpClick(getDisplaySourceFollowUp(source))"
						>
							<text class="xicheng-playback-source-title">{{ getDisplaySourceTitle(source) || '审核来源' }}</text>
						</view>
						<view v-if="xichengPlaybackSources.length === 0" class="xicheng-playback-source-pill xicheng-playback-source-empty">
							<text class="xicheng-playback-source-title">无已审核来源</text>
						</view>
					</view>
				</view>
				<view class="message-item" v-for="(msg, index) in messages" :key="msg.id || index">
					<!-- 用户消息 -->
					<view v-if="msg.role === 'user'" class="message-user">
						<view class="message-content-wrapper">
							<!-- 文字内容 -->
							<view v-if="msg.content" class="message-content user-content">
								{{ msg.content }}
							</view>
							<!-- 图片内容 -->
							<view v-if="msg.images && msg.images.length > 0" class="message-images">
								<image
									v-for="(img, imgIndex) in msg.images"
									:key="imgIndex"
									:src="img"
									class="message-image"
									mode="aspectFill"
								></image>
							</view>
						</view>
						<view class="message-avatar user-avatar">
							<text class="avatar-text">我</text>
						</view>
					</view>

					<!-- AI消息 -->
					<view v-else class="message-ai-wrapper">
						<view v-if="msg.isPending || msg.content" class="message-ai">
							<view class="message-avatar ai-avatar">
								<image class="ai-avatar-image" :src="activeAiAvatar" mode="aspectFill"></image>
							</view>
							<!-- 内容为空时显示加载动画 -->
							<view v-if="msg.isPending && !msg.content" class="message-content ai-content loading-content">
								<view class="loading-dots">
									<text class="loading-dot">·</text><text class="loading-dot">·</text><text class="loading-dot">·</text>
								</view>
								<text class="loading-status-text">正在检索已审核来源</text>
							</view>
							<!-- 有内容时显示内容 -->
							<view v-else-if="msg.content" class="message-content ai-content">
								<rich-text :nodes="renderMarkdownNodes(msg.content)"></rich-text>
							</view>
						</view>
						<text v-if="msg.interrupted" class="message-status">已打断</text>
						<view v-if="msg.sources && msg.sources.length > 0" class="message-source-list">
							<text class="message-source-heading">已审核来源</text>
							<view
								v-for="(source, sourceIndex) in msg.sources"
								:key="source.id || source.url || source.title || sourceIndex"
								class="message-source-item"
							>
								<text class="message-source-title">{{ getDisplaySourceTitle(source) || '审核来源' }}</text>
								<text v-if="getDisplaySourceDescription(source)" class="message-source-desc">
									{{ getDisplaySourceDescription(source) }}
								</text>
							</view>
						</view>

						<!-- 跟进问题列表 -->
						<view v-if="msg.followUps && msg.followUps.length > 0" class="follow-up-list">
							<view
								v-for="(followUp, fIndex) in msg.followUps"
								:key="fIndex"
								class="follow-up-item"
								@click="handleFollowUpClick(followUp)"
							>
								<text class="follow-up-icon">💡</text>
								<text class="follow-up-text">{{ followUp }}</text>
							</view>
						</view>
					</view>
				</view>
				<view id="chat-bottom-anchor" class="chat-bottom-spacer"></view>
			</view>

			<!-- 输入框 -->
			<view class="input-area">
				<view class="input-wrapper">
					<!-- 图片上传按钮 -->
					<view class="upload-btn" @click="chooseImage" :class="{ 'upload-btn-disabled': historyLoading || imageUploading }">
						<text class="upload-icon">📷</text>
					</view>

					<input
						class="message-input"
						v-model="inputText"
						placeholder="请输入您的问题..."
						:disabled="historyLoading || imageUploading"
						@confirm="sendMessage"
					/>
					<button
						class="send-btn"
						:class="{ 'send-btn-active': inputText.trim() && !(historyLoading || imageUploading) }"
						:disabled="!inputText.trim() || historyLoading || imageUploading"
						@click="sendMessage"
					>
						发送
					</button>
				</view>
			</view>
		</view>

		<!-- 自定义TabBar -->
		</view>
	</view>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { onShow, onUnload, onLoad, onReady } from '@dcloudio/uni-app'
import CustomNav from '@/components/custom-nav/custom-nav.vue'
import TabBar from '@/components/tab-bar/tab-bar.vue'
import config from '@/request/config.js'
import { resolveXichengPhotoTrigger } from '@/request/xunjing/trigger.js'
import { createXichengVisionAgentChatContextFields, normalizeXichengAiChatResponse } from '@/request/xunjing/chat.js'
import { normalizeXichengCachedMessages } from '@/request/xunjing/messageCache.js'
import {
	hasCompletedInitialQuestionInMessages as hasCompletedInitialQuestionInMessageList,
	hasPendingInitialQuestionInMessages as hasPendingInitialQuestionInMessageList
} from '@/request/xunjing/initialQuestion.js'
import { createXichengRouteSignature, decodeXichengRouteValue } from '@/request/xunjing/routeParams.js'
import { isXichengUnsafeSafetyStatus, normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'
import {
	getXichengDisplaySourceDescription,
	getXichengDisplaySourceTitle,
	normalizeXichengReviewedSources
} from '@/request/xunjing/sources.js'
import { buildXichengServiceHandoffPromptPrefix, createXichengServiceHandoffEvidenceFields, createXichengServiceHandoffRouteContext, createXichengServiceHandoffViewContext } from '@/request/xunjing/serviceHandoff.js'
import { createXichengOfficialPoiSources } from '@/request/xunjing/officialPoi.js'
import { isXunjingUserCancelled } from '@/request/xunjing/userCancel.js'
import {
	createXichengPoiSuggestedQuestions,
	XICHENG_OFFICIAL_POIS,
	XICHENG_REGION_CONFIG
} from '@/config/regions/xicheng.js'
import {
	KASHGAR_AI_COMPANION_ACTIONS,
	KASHGAR_AI_COMPANION_PLACES,
	KASHGAR_AI_COMPANION_QUESTIONS,
	KASHGAR_DIARY_CHECKLIST,
	KASHGAR_DIARY_ELEMENTS,
	KASHGAR_DIARY_MODES,
	KASHGAR_DIARY_STATS
} from './kashgar-ai-content.js'

const UrlImg = config.UrlImg
const BG_IMAGE = 'https://www.neoxiake.com//upload/admin/20260527/f0405d5a04cbe38494795727956523d4.png'
const AI_AVATAR = 'https://www.neoxiake.com//upload/admin/20260526/e32b5647748751716be8f7eca54ef57f.png'
const KASHGAR_AI_COMPANION_HOME_ENABLED = true
const KASHGAR_DIARY_GENERATOR_ENABLED = true
const XICHENG_BLOCKED_ANSWER = '无已审核来源，不能回答'
const XICHENG_UNAVAILABLE_ANSWER = '小京暂时无法获取已审核来源，请稍后再试'
const XICHENG_HOME_ROUTE = '/pages/xicheng/home/home'
const KASHGAR_HOME_ROUTE = '/pages/index/index?city=kashgar'

const XUNJING_AI_CONFIG = {
	packageCode: 'KASHGAR-MAP-001',
	sceneCode: 'kashgar-ai-guide',
	sourceChannel: 'APP_UNIAPP',
	apiPath: 'app-api/xunjing/ai/chat',
	tenantId: config.XunjingTenantId || '1'
}

const XUNJING_RESOURCE_CONFIG = {
	apiPath: 'app-api/xunjing/resource/package',
	packageCode: XUNJING_AI_CONFIG.packageCode,
	tenantId: XUNJING_AI_CONFIG.tenantId
}

const XUNJING_EVENT_CONFIG = {
	apiPath: 'app-api/xunjing/resource/events',
	packageCode: XUNJING_AI_CONFIG.packageCode,
	sceneCode: XUNJING_AI_CONFIG.sceneCode,
	sourceChannel: XUNJING_AI_CONFIG.sourceChannel,
	tenantId: XUNJING_AI_CONFIG.tenantId
}

const AI_SPEECH_CONFIG = {
	enabled: false,
	responseFormat: 'mp3',
	maxTextLength: 1200,
	chunkLength: 110
}

const isAiSpeechEnabled = () => false

// 本地存储 key
const CONVERSATION_KEY = 'ai_guide_conversation_id'
const CHAT_CACHE_KEY = 'ai_guide_messages_cache'
const STREAM_RENDER_INTERVAL = 40
const STREAM_TYPEWRITER_CHARS_PER_TICK = 2
const SCROLL_UPDATE_INTERVAL = 80
const HISTORY_SCROLL_DELAY = 300
const AI_RESPONSE_TIMEOUT_MS = 60000
const AI_SPEECH_RENDER_DELAY_MS = 50
const STREAM_SPEECH_MIN_LENGTH = 12
const STREAM_SPEECH_FIRST_CHUNK_LENGTH = 36
const STREAM_SPEECH_CHUNK_LENGTH = 110
const XICHENG_PLAYBACK_WAVE_BARS = Object.freeze([28, 42, 62, 34, 50, 76, 96, 66, 88, 58, 44, 72, 38, 54, 30])
const cloneContentList = (list) => list.map(item => ({ ...item }))

// 响应式数据
const showKashgarDiaryGenerator = ref(false)
const showAiCompanionHome = ref(KASHGAR_AI_COMPANION_HOME_ENABLED)
const activeKashgarDiaryMode = ref('family')
const kashgarDiaryElements = cloneContentList(KASHGAR_DIARY_ELEMENTS)
const kashgarDiaryModes = cloneContentList(KASHGAR_DIARY_MODES)
const kashgarDiaryStats = cloneContentList(KASHGAR_DIARY_STATS)
const kashgarDiaryChecklist = [...KASHGAR_DIARY_CHECKLIST]
const aiCompanionActions = cloneContentList(KASHGAR_AI_COMPANION_ACTIONS)
const aiCompanionQuestions = [...KASHGAR_AI_COMPANION_QUESTIONS]
const defaultAiCompanionPlaces = cloneContentList(KASHGAR_AI_COMPANION_PLACES)
const aiCompanionPlaces = ref(cloneContentList(defaultAiCompanionPlaces))
const messages = ref([])
const inputText = ref('')
const historyLoading = ref(false)
const imageUploading = ref(false)
const conversationId = ref('')
const isStreaming = ref(false)
const navBarHeight = ref(44)
const chatListPaddingTop = computed(() => `${navBarHeight.value + 10}px`)
const xichengAiGuideMode = ref('chat')
const xichengPlaybackPaused = ref(false)
const xichengAiContext = ref({
	regionCode: '',
	packageCode: '',
	sceneCode: '',
	sourceChannel: '',
	poiCode: '',
	poiName: '',
	companionName: '',
	confidence: '',
	sourceLabel: '',
	safetyStatus: '',
	visionAgentContext: {},
	sourceRecognitionContext: '',
	sceneFusionSummary: '',
	sceneFusionSignals: [],
	worldInterfaceSummary: '',
	worldInterfaceSignals: [],
	visionAgentMemorySessionText: '',
	memorySessionSceneCount: '',
	localTimeText: '',
	weatherText: '',
	headingText: '',
	serviceText: '',
	knowledgeGraphText: '',
	sceneUnderstandingPackage: {},
	primarySceneDomainKey: '',
	primarySceneDomainLabel: '',
	sceneUnderstandingSummary: '',
	agentDecisionActionTitle: '',
	agentDecisionReasonSummary: '',
	agentDecisionReasonCards: [],
	sources: []
})

const handleNavHeight = (height) => {
	if (height && Number(height) > 0) {
		navBarHeight.value = Number(height)
	}
}

let messageSeed = 0
let streamSeed = 0
let scrollTimer = null
let lastScrollAt = 0
let historyScrollTimer = null
let shouldStartNewConversationAfterInterrupt = false
let initialQuestionHandled = false
let initialQuestionHandledText = ''
let lastAppliedXichengRouteSignature = ''
let speechAudioContext = null
let speechRequestSeed = 0
let speechFileSeed = 0
let speechQueue = []
let speechQueuePlaying = false
const activeStream = ref(null)

const createMessageId = () => `msg_${Date.now()}_${messageSeed++}`
const getXichengWelcomeContent = () => {
	const context = xichengAiContext.value || {}
	const safetyStatus = normalizeXichengSafetyStatus(context.safetyStatus)
	if (safetyStatus === 'BLOCKED') {
		return XICHENG_BLOCKED_ANSWER
	}
	if (safetyStatus === 'UNAVAILABLE') {
		return XICHENG_UNAVAILABLE_ANSWER
	}
	const visionAgentCue = context.agentDecisionReasonSummary || context.sceneUnderstandingSummary || context.worldInterfaceSummary || context.sceneFusionSummary || context.visionAgentMemorySessionText
	if (visionAgentCue) {
		return `我已接上AI识境：${visionAgentCue} 可以继续帮你讲解、推荐路线或生成游记草稿。`.slice(0, 110)
	}
	return `你好，我是${context.companionName || XICHENG_REGION_CONFIG.companionName}，可以继续帮你讲解西城文化点、推荐路线或生成游记草稿。`
}
const createWelcomeMessage = () => ({
	id: createMessageId(),
	role: 'assistant',
	content: hasXichengAiContext()
		? getXichengWelcomeContent()
		: '您好！我是AI小导游，有什么可以帮助您的吗？',
	images: [],
	followUps: [],
	sources: hasXichengAiContext() ? getXichengContextSources() : [],
	safetyStatus: hasXichengAiContext() ? normalizeXichengSafetyStatus(xichengAiContext.value.safetyStatus) : '',
	isPending: false,
	interrupted: false,
	hasSpoken: false
})
const isCurrentXichengWelcomeOnlyConversation = () => {
	if (!hasXichengAiContext()) return false
	if (messages.value.length !== 1) return false
	const [message] = messages.value
	if (!message || message.role !== 'assistant') return false
	if (String(message.content || '') !== getXichengWelcomeContent()) return false
	return true
}
const createUserMessage = ({ content = '', images = [] } = {}) => ({
	id: createMessageId(),
	role: 'user',
	content,
	images,
	followUps: [],
	sources: [],
	safetyStatus: '',
	isPending: false,
	interrupted: false
})
const createAssistantMessage = () => ({
	id: createMessageId(),
	role: 'assistant',
	content: '',
	images: [],
	followUps: [],
	sources: [],
	safetyStatus: '',
	isPending: true,
	interrupted: false,
	hasSpoken: false
})

const commitAssistantMessage = (message, fields = {}) => {
	if (!message || !message.id) {
		return message
	}
	Object.assign(message, fields)
	const index = messages.value.findIndex(item => item && item.id === message.id)
	if (index >= 0) {
		const nextMessage = {
			...messages.value[index],
			...message
		}
		messages.value.splice(index, 1, nextMessage)
		Object.assign(message, nextMessage)
		messages.value = [
			...messages.value
		]
	}
	return message
}

const normalizeCachedMessages = (list) => normalizeXichengCachedMessages(list, { createMessageId })

const getActiveXichengCacheScope = () => {
	const context = xichengAiContext.value || {}
	if (
		context.regionCode !== XICHENG_REGION_CONFIG.regionCode
		&& !context.poiCode
		&& !context.poiName
	) {
		return ''
	}
	const regionCode = context.regionCode || XICHENG_REGION_CONFIG.regionCode
	const packageCode = context.packageCode || XICHENG_REGION_CONFIG.packageCode
	const poiCode = context.poiCode || ''
	const poiScope = poiCode || context.poiName || 'general'
	const safetyStatus = normalizeXichengSafetyStatus(context.safetyStatus)
	const safetyScope = safetyStatus ? `:${encodeURIComponent(safetyStatus)}` : ''
	return `${encodeURIComponent(regionCode)}:${encodeURIComponent(packageCode)}:${encodeURIComponent(poiScope)}${safetyScope}`
}

const getActiveChatCacheKey = () => {
	const scope = getActiveXichengCacheScope()
	return scope ? `${CHAT_CACHE_KEY}:xicheng:${scope}` : CHAT_CACHE_KEY
}

const getActiveConversationKey = () => {
	const scope = getActiveXichengCacheScope()
	return scope ? `${CONVERSATION_KEY}:xicheng:${scope}` : CONVERSATION_KEY
}

const saveMessagesCache = () => {
	uni.setStorageSync(getActiveChatCacheKey(), normalizeCachedMessages(messages.value))
}

const loadMessagesCache = () => normalizeCachedMessages(uni.getStorageSync(getActiveChatCacheKey()) || [])

const hasCompletedInitialQuestionInMessages = (question = '') => hasCompletedInitialQuestionInMessageList(messages.value, question)
const hasPendingInitialQuestionInMessages = (question = '') => hasPendingInitialQuestionInMessageList(messages.value, question)
const persistXichengAiGuideMaterial = ({ question = '', result = {}, assistantMessage = null } = {}) => {
	const context = xichengAiContext.value || {}
	if (!hasXichengAiContext(context)) return null
	const assistantMessageContent = assistantMessage && assistantMessage.content ? assistantMessage.content : ''
	const materialSafetyStatus = normalizeXichengSafetyStatus(result.safetyStatus)
	const unsafeMaterialSafetyStatus = isXichengUnsafeSafetyStatus(materialSafetyStatus)
	const sources = unsafeMaterialSafetyStatus ? [] : normalizeXichengReviewedSources(result.sources)
	const suggestedQuestions = unsafeMaterialSafetyStatus ? []
		: Array.isArray(result.followUps)
			? result.followUps
			: Array.isArray(result.suggestedQuestions) ? result.suggestedQuestions : []
	const answerText = String(result.answer || assistantMessageContent || '')
	const existingMaterials = uni.getStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey)
	const materials = Array.isArray(existingMaterials) ? existingMaterials : []
	const material = {
		materialId: `ai-guide-${Date.now()}`,
		type: 'ai-guide',
		regionCode: context.regionCode || XICHENG_REGION_CONFIG.regionCode,
		packageCode: context.packageCode || XICHENG_REGION_CONFIG.packageCode,
		sceneCode: XICHENG_REGION_CONFIG.aiSceneCode,
		sourceChannel: context.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
		poiCode: context.poiCode || '',
		poiName: context.poiName || '小京讲解',
		sourceLabel: '小京讲解',
		questionLength: String(question || '').length,
		aiAnswerExcerpt: String(result.answer || assistantMessageContent || '').slice(0, 180),
		answerLength: answerText.length,
		sourceCount: sources.length,
		sources,
		suggestedQuestions,
		safetyStatus: materialSafetyStatus,
		fallback: Boolean(result.fallback),
		...createXichengVisionAgentChatContextFields(context),
		...createXichengServiceHandoffEvidenceFields(context),
		reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
		publishStatus: 'private',
		capturedAt: new Date().toISOString()
	}
	if (!material.aiAnswerExcerpt && !material.safetyStatus) {
		return null
	}
	uni.setStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey, [
		material,
		...materials
	].slice(0, 50))
	return material
}

const setWelcomeMessage = () => {
	const welcomeMessage = createWelcomeMessage()
	messages.value = [welcomeMessage]
	saveMessagesCache()
	if (isCurrentXichengWelcomeOnlyConversation()) {
		scrollXichengWelcomeToTop()
	} else {
		scrollToBottom({ immediate: true })
	}
	speakWelcomeMessage(welcomeMessage)
}

// 获取用户ID（使用本地存储的userId）
const getUserId = () => {
	const userId = uni.getStorageSync('userId')
	return userId ? `user_${userId}` : 'guest_user'
}

const getUserTraceId = () => {
	const openid = uni.getStorageSync('openid') || uni.getStorageSync('openId')
	if (openid) {
		return `openid_${openid}`
	}
	return getUserId()
}

const decodeRouteValue = decodeXichengRouteValue

const getCurrentXichengAiRouteOptions = () => {
	const options = {}
	try {
		if (typeof getCurrentPages === 'function') {
			const pages = getCurrentPages()
			const currentPage = Array.isArray(pages) && pages.length > 0 ? pages[pages.length - 1] : null
			if (currentPage && currentPage.options && typeof currentPage.options === 'object') {
				Object.assign(options, currentPage.options)
			}
		}
	} catch (error) {
		// H5 and native runtimes expose route options differently; hash parsing below is the fallback.
	}
	try {
		const currentHash = typeof location !== 'undefined' && location.hash ? String(location.hash) : ''
		const queryIndex = currentHash.indexOf('?')
		if (queryIndex >= 0 && typeof URLSearchParams !== 'undefined') {
			const params = new URLSearchParams(currentHash.slice(queryIndex + 1))
			params.forEach((value, key) => {
				options[key] = decodeRouteValue(value)
			})
		}
	} catch (error) {
		return options
	}
	if (options.safetyStatus) {
		options.safetyStatus = normalizeXichengSafetyStatus(decodeRouteValue(options.safetyStatus))
	}
	return options
}

const mergeXichengAiRouteOptions = (routeOptions = {}) => {
	const h5RouteOptions = getCurrentXichengAiRouteOptions()
	const mergedOptions = {
		...h5RouteOptions
	}
	Object.keys(routeOptions || {}).forEach(key => {
		const value = routeOptions[key]
		if (value !== undefined && value !== null && value !== '') {
			mergedOptions[key] = value
		}
	})
	return {
		...mergedOptions,
		safetyStatus: normalizeXichengSafetyStatus(routeOptions.safetyStatus || h5RouteOptions.safetyStatus)
	}
}

const parseXichengVisionAgentContext = (value = '') => {
	if (value && typeof value === 'object') {
		return value
	}
	const decodedValue = decodeRouteValue(value)
	if (!decodedValue) return {}
	try {
		const parsed = JSON.parse(decodedValue)
		return parsed && typeof parsed === 'object' ? parsed : {}
	} catch (error) {
		return {
			sourceRecognitionContext: decodedValue
		}
	}
}

const normalizeXichengAiContext = (options = {}) => ({
	regionCode: decodeRouteValue(options.regionCode),
	packageCode: decodeRouteValue(options.packageCode),
	sceneCode: decodeRouteValue(options.sceneCode),
	sourceChannel: decodeRouteValue(options.sourceChannel),
	poiCode: decodeRouteValue(options.poiCode),
	poiName: decodeRouteValue(options.poiName),
	companionName: decodeRouteValue(options.companionName),
	confidence: decodeRouteValue(options.confidence),
	safetyStatus: normalizeXichengSafetyStatus(decodeRouteValue(options.safetyStatus)),
	visionAgentContext: parseXichengVisionAgentContext(options.visionAgentContext),
	sourceRecognitionContext: decodeRouteValue(options.sourceRecognitionContext) || parseXichengVisionAgentContext(options.visionAgentContext).sourceRecognitionContext || '',
	sceneFusionSummary: parseXichengVisionAgentContext(options.visionAgentContext).sceneFusionSummary || '',
	sceneFusionSignals: Array.isArray(parseXichengVisionAgentContext(options.visionAgentContext).sceneFusionSignals)
		? parseXichengVisionAgentContext(options.visionAgentContext).sceneFusionSignals
		: [],
	worldInterfaceSummary: parseXichengVisionAgentContext(options.visionAgentContext).worldInterfaceSummary || (parseXichengVisionAgentContext(options.visionAgentContext).worldInterfaceSnapshot && parseXichengVisionAgentContext(options.visionAgentContext).worldInterfaceSnapshot.summary) || '',
	worldInterfaceSignals: Array.isArray(parseXichengVisionAgentContext(options.visionAgentContext).worldInterfaceSignals)
		? parseXichengVisionAgentContext(options.visionAgentContext).worldInterfaceSignals
		: parseXichengVisionAgentContext(options.visionAgentContext).worldInterfaceSnapshot && Array.isArray(parseXichengVisionAgentContext(options.visionAgentContext).worldInterfaceSnapshot.signals)
			? parseXichengVisionAgentContext(options.visionAgentContext).worldInterfaceSnapshot.signals
			: [],
	visionAgentMemorySessionText: parseXichengVisionAgentContext(options.visionAgentContext).visionAgentMemorySessionText || parseXichengVisionAgentContext(options.visionAgentContext).memorySessionText || '',
	memorySessionSceneCount: parseXichengVisionAgentContext(options.visionAgentContext).memorySessionSceneCount || decodeRouteValue(options.memorySessionSceneCount) || '',
	localTimeText: parseXichengVisionAgentContext(options.visionAgentContext).localTimeText || '',
	weatherText: parseXichengVisionAgentContext(options.visionAgentContext).weatherText || '',
	headingText: parseXichengVisionAgentContext(options.visionAgentContext).headingText || '',
	serviceText: parseXichengVisionAgentContext(options.visionAgentContext).serviceText || '',
	knowledgeGraphText: parseXichengVisionAgentContext(options.visionAgentContext).knowledgeGraphText || '',
	sceneUnderstandingPackage: parseXichengVisionAgentContext(options.visionAgentContext).sceneUnderstandingPackage || {},
	primarySceneDomainKey: parseXichengVisionAgentContext(options.visionAgentContext).primarySceneDomainKey || (parseXichengVisionAgentContext(options.visionAgentContext).sceneUnderstandingPackage && parseXichengVisionAgentContext(options.visionAgentContext).sceneUnderstandingPackage.primaryDomainKey) || '',
	primarySceneDomainLabel: parseXichengVisionAgentContext(options.visionAgentContext).primarySceneDomainLabel || (parseXichengVisionAgentContext(options.visionAgentContext).sceneUnderstandingPackage && parseXichengVisionAgentContext(options.visionAgentContext).sceneUnderstandingPackage.primaryDomainLabel) || '',
	sceneUnderstandingSummary: parseXichengVisionAgentContext(options.visionAgentContext).sceneUnderstandingSummary || (parseXichengVisionAgentContext(options.visionAgentContext).sceneUnderstandingPackage && parseXichengVisionAgentContext(options.visionAgentContext).sceneUnderstandingPackage.sceneUnderstandingSummary) || '',
	agentDecisionActionTitle: parseXichengVisionAgentContext(options.visionAgentContext).agentDecisionActionTitle || '',
	agentDecisionReasonSummary: parseXichengVisionAgentContext(options.visionAgentContext).agentDecisionReasonSummary || '',
	agentDecisionReasonCards: Array.isArray(parseXichengVisionAgentContext(options.visionAgentContext).agentDecisionReasonCards)
		? parseXichengVisionAgentContext(options.visionAgentContext).agentDecisionReasonCards
		: [],
	...createXichengServiceHandoffRouteContext(options.serviceHandoffContext)
})

const createEmptyXichengRecognitionContext = () => ({
	sceneCode: '',
	sourceChannel: '',
	poiCode: '',
	poiName: '',
	confidence: '',
	sourceLabel: '',
	safetyStatus: '',
	sources: []
})

const normalizeXichengPoiCodeKey = (value = '') => String(value || '').trim().toLowerCase()
const normalizeXichengPoiNameKey = (value = '') => String(value || '').trim()

const findXichengOfficialPoiForAiContext = (context = {}) => {
	const poiCodeKey = normalizeXichengPoiCodeKey(context.poiCode)
	if (poiCodeKey) {
		const officialPoiByCode = XICHENG_OFFICIAL_POIS.find(poi => normalizeXichengPoiCodeKey(poi.poiCode) === poiCodeKey)
		if (officialPoiByCode) {
			return officialPoiByCode
		}
	}
	const poiNameKey = normalizeXichengPoiNameKey(context.poiName)
	if (!poiNameKey) {
		return null
	}
	return XICHENG_OFFICIAL_POIS.find(poi => {
		const aliases = Array.isArray(poi.aliases) ? poi.aliases : []
		return poi.poiName === poiNameKey || aliases.includes(poiNameKey)
	}) || null
}

const loadCachedXichengRecognitionContext = (context = {}) => {
	const cached = uni.getStorageSync(XICHENG_REGION_CONFIG.storageKey)
	if (!cached || typeof cached !== 'object') {
		return createEmptyXichengRecognitionContext()
	}
	const matchesPoiCode = Boolean(context.poiCode) && cached.poiCode === context.poiCode
	const matchesPoiName = Boolean(context.poiName) && cached.poiName === context.poiName
	if (!matchesPoiCode && !matchesPoiName) {
		return createEmptyXichengRecognitionContext()
	}
	const matchesRegionCode = !context.regionCode || !cached.regionCode || cached.regionCode === context.regionCode
	const matchesPackageCode = !context.packageCode || !cached.packageCode || cached.packageCode === context.packageCode
	if (!matchesRegionCode || !matchesPackageCode) {
		return createEmptyXichengRecognitionContext()
	}
	const safetyStatus = normalizeXichengSafetyStatus(cached.safetyStatus)
	const unsafeSafetyStatus = isXichengUnsafeSafetyStatus(safetyStatus)
	return {
		sceneCode: cached.sceneCode || '',
		sourceChannel: cached.sourceChannel || '',
		poiCode: cached.poiCode || '',
		poiName: cached.poiName || '',
		confidence: cached.confidence || '',
		sourceLabel: cached.sourceLabel || '',
		safetyStatus,
		sources: unsafeSafetyStatus ? [] : normalizeXichengReviewedSources(cached.sources)
	}
}

const createRouteOnlyXichengRecognitionContext = (context = {}) => {
	const safetyStatus = normalizeXichengSafetyStatus(context.safetyStatus)
	if (isXichengUnsafeSafetyStatus(safetyStatus)) {
		return createEmptyXichengRecognitionContext()
	}
	const officialPoi = findXichengOfficialPoiForAiContext(context)
	if (!officialPoi) {
		return createEmptyXichengRecognitionContext()
	}
	const sources = createXichengOfficialPoiSources(officialPoi)
	return {
		sceneCode: context.sceneCode || XICHENG_REGION_CONFIG.aiSceneCode,
		sourceChannel: context.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
		poiCode: context.poiCode || officialPoi.poiCode,
		poiName: context.poiName || officialPoi.poiName,
		confidence: context.confidence || '',
		sourceLabel: '西城官方 POI',
		safetyStatus: safetyStatus || (sources.length > 0 ? 'PASSED' : ''),
		sources
	}
}

const applyXichengAiContext = (options = {}) => {
	const context = normalizeXichengAiContext(options)
	if (context.regionCode && context.regionCode !== XICHENG_REGION_CONFIG.regionCode && !context.poiCode && !context.poiName) {
		xichengAiContext.value = {
			regionCode: '',
			packageCode: '',
			sceneCode: '',
			sourceChannel: '',
			poiCode: '',
			poiName: '',
			companionName: '',
			confidence: '',
			sourceLabel: '',
			safetyStatus: '',
			visionAgentContext: {},
			sourceRecognitionContext: '',
			sceneFusionSummary: '',
			sceneFusionSignals: [],
			worldInterfaceSummary: '',
			worldInterfaceSignals: [],
			visionAgentMemorySessionText: '',
			memorySessionSceneCount: '',
			localTimeText: '',
			weatherText: '',
			headingText: '',
			serviceText: '',
			knowledgeGraphText: '',
			sceneUnderstandingPackage: {},
			primarySceneDomainKey: '',
			primarySceneDomainLabel: '',
			sceneUnderstandingSummary: '',
			agentDecisionActionTitle: '',
			agentDecisionReasonSummary: '',
			agentDecisionReasonCards: [],
			sources: []
		}
		return xichengAiContext.value
	}
	const cachedRecognition = loadCachedXichengRecognitionContext(context)
	const routeOnlyRecognition = cachedRecognition.sources.length > 0
		? createEmptyXichengRecognitionContext()
		: createRouteOnlyXichengRecognitionContext(context)
	const mergedSafetyStatus = normalizeXichengSafetyStatus(context.safetyStatus || cachedRecognition.safetyStatus || routeOnlyRecognition.safetyStatus)
	const unsafeMergedSafetyStatus = isXichengUnsafeSafetyStatus(mergedSafetyStatus)
	xichengAiContext.value = {
		regionCode: context.regionCode || XICHENG_REGION_CONFIG.regionCode,
		packageCode: context.packageCode || XICHENG_REGION_CONFIG.packageCode,
		sceneCode: context.sceneCode || cachedRecognition.sceneCode || routeOnlyRecognition.sceneCode || XICHENG_REGION_CONFIG.aiSceneCode,
		sourceChannel: context.sourceChannel || cachedRecognition.sourceChannel || routeOnlyRecognition.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
		poiCode: context.poiCode || cachedRecognition.poiCode || routeOnlyRecognition.poiCode,
		poiName: context.poiName || cachedRecognition.poiName || routeOnlyRecognition.poiName,
		companionName: context.companionName || XICHENG_REGION_CONFIG.companionName,
		confidence: context.confidence || cachedRecognition.confidence || routeOnlyRecognition.confidence,
		sourceLabel: unsafeMergedSafetyStatus ? '' : (cachedRecognition.sourceLabel || routeOnlyRecognition.sourceLabel),
		safetyStatus: mergedSafetyStatus,
		visionAgentContext: context.visionAgentContext,
		sourceRecognitionContext: context.sourceRecognitionContext,
		sceneFusionSummary: context.sceneFusionSummary,
		sceneFusionSignals: context.sceneFusionSignals,
		worldInterfaceSummary: context.worldInterfaceSummary,
		worldInterfaceSignals: context.worldInterfaceSignals,
		visionAgentMemorySessionText: context.visionAgentMemorySessionText,
		memorySessionSceneCount: context.memorySessionSceneCount,
		localTimeText: context.localTimeText,
		weatherText: context.weatherText,
		headingText: context.headingText,
		serviceText: context.serviceText,
		knowledgeGraphText: context.knowledgeGraphText,
		sceneUnderstandingPackage: context.sceneUnderstandingPackage,
		primarySceneDomainKey: context.primarySceneDomainKey,
		primarySceneDomainLabel: context.primarySceneDomainLabel,
		sceneUnderstandingSummary: context.sceneUnderstandingSummary,
		agentDecisionActionTitle: context.agentDecisionActionTitle,
		agentDecisionReasonSummary: context.agentDecisionReasonSummary,
		agentDecisionReasonCards: context.agentDecisionReasonCards,
		serviceHandoffContext: context.serviceHandoffContext,
		serviceHandoffTitle: context.serviceHandoffTitle,
		serviceHandoffIntentText: context.serviceHandoffIntentText,
		serviceHandoffStepText: context.serviceHandoffStepText,
		serviceHandoffSummary: context.serviceHandoffSummary,
		sources: unsafeMergedSafetyStatus ? [] : (cachedRecognition.sources.length > 0 ? cachedRecognition.sources : routeOnlyRecognition.sources)
	}
	return xichengAiContext.value
}

const hasXichengAiContext = (context = xichengAiContext.value) => (
	context && (
		context.regionCode === XICHENG_REGION_CONFIG.regionCode
		|| Boolean(context.poiCode)
		|| Boolean(context.poiName)
	)
)

const isXichengChatMode = computed(() => hasXichengAiContext())
const isXichengRoutePlaybackMode = () => normalizeXichengAiGuideMode(getCurrentXichengAiRouteOptions().mode) === 'playback'
const isXichengPlaybackMode = computed(() => (
	isXichengChatMode.value
	&& (xichengAiGuideMode.value === 'playback' || isXichengRoutePlaybackMode())
	&& !isXichengUnsafeSafetyStatus(normalizeXichengSafetyStatus(xichengAiContext.value.safetyStatus))
	&& getXichengContextSources().length > 0
))

const chatNavTitle = computed(() => {
	const context = xichengAiContext.value || {}
	if (!hasXichengAiContext(context)) {
		return 'AI小导游'
	}
	if (isXichengPlaybackMode.value) {
		return 'AI 讲解'
	}
	return context.poiName ? `${context.poiName} · 小京` : '小京 AI讲解'
})

const activeAiAvatar = computed(() => (
	isXichengChatMode.value ? XICHENG_REGION_CONFIG.companionAvatar : AI_AVATAR
))

const xichengHeroSubtitle = computed(() => {
	const context = xichengAiContext.value || {}
	const safetyStatus = normalizeXichengSafetyStatus(context.safetyStatus)
	if (safetyStatus === 'BLOCKED') {
		return XICHENG_BLOCKED_ANSWER
	}
	if (safetyStatus === 'UNAVAILABLE') {
		return XICHENG_UNAVAILABLE_ANSWER
	}
	if (isXichengPlaybackMode.value) {
		return `正在讲解${context.poiName || '西城文化点'}，播放内容基于已审核来源。`
	}
	const agentDecisionReasonSummary = context.agentDecisionReasonSummary || ''
	const sceneUnderstandingSummary = context.sceneUnderstandingSummary || ''
	const worldInterfaceSummary = context.worldInterfaceSummary || ''
	const sceneFusionSummary = context.sceneFusionSummary || ''
	if (agentDecisionReasonSummary || sceneUnderstandingSummary || worldInterfaceSummary || sceneFusionSummary || context.visionAgentMemorySessionText) {
		return `AI识境已接入${agentDecisionReasonSummary || sceneUnderstandingSummary || worldInterfaceSummary || sceneFusionSummary || context.visionAgentMemorySessionText}，可以接着问。`.slice(0, 88)
	}
	const poiName = context.poiName || '西城文化点'
	return `围绕${poiName}继续追问，答案优先使用已审核来源。`
})

const xichengVisionAgentContextChips = computed(() => {
	const context = xichengAiContext.value || {}
	const chips = []
	const appendChip = (key, label, value) => {
		const text = String(value || '').trim()
		if (!text) return
		chips.push({
			key,
			label,
			value: text.slice(0, 32)
		})
	}
	appendChip('domain', '场景', context.primarySceneDomainLabel)
	appendChip('reason', '依据', context.agentDecisionReasonSummary)
	appendChip('world', '识境', context.worldInterfaceSummary)
	appendChip('scene', '现场', context.sceneFusionSummary)
	appendChip('memory', '连续', context.visionAgentMemorySessionText)
	appendChip('time', '时间', context.localTimeText)
	appendChip('weather', '天气', context.weatherText)
	appendChip('heading', '方向', context.headingText)
	return chips.slice(0, 6)
})

const xichengServiceHandoffContext = computed(() => createXichengServiceHandoffViewContext(xichengAiContext.value || {}))
const xichengHeroQuestions = computed(() => {
	const context = xichengAiContext.value || {}
	const safetyStatus = normalizeXichengSafetyStatus(context.safetyStatus)
	if (isXichengUnsafeSafetyStatus(safetyStatus)) {
		return []
	}
	return createXichengPoiSuggestedQuestions(context.poiName || '')
		.slice(0, 3)
})

const xichengPlaybackTitle = computed(() => {
	const context = xichengAiContext.value || {}
	return `正在讲解：${context.poiName || XICHENG_REGION_CONFIG.cityName}`
})

const xichengPlaybackDuration = computed(() => {
	const sources = getXichengContextSources()
	return sources.length > 1 ? '01:40' : '01:20'
})

const xichengPlaybackSources = computed(() => getXichengContextSources().slice(0, 2))

const xichengPlaybackSourceSummary = computed(() => {
	if (!isXichengPlaybackMode.value) {
		return XICHENG_BLOCKED_ANSWER
	}
	const sources = xichengPlaybackSources.value
	if (sources.length === 0) {
		return XICHENG_BLOCKED_ANSWER
	}
	return `基于 ${sources.length} 条已审核来源生成，播放内容可追溯。`
})

const normalizeXichengAiGuideMode = (mode = '') => (
	String(mode || '').trim().toLowerCase() === 'playback' ? 'playback' : 'chat'
)

const getXichengContextSources = (context = xichengAiContext.value) => {
	context = context || {}
	const safetyStatus = normalizeXichengSafetyStatus(context.safetyStatus)
	if (isXichengUnsafeSafetyStatus(safetyStatus)) {
		return []
	}
	return normalizeXichengReviewedSources(context.sources)
}

const applyXichengPhotoTriggerContext = (trigger = {}) => {
	const safetyStatus = normalizeXichengSafetyStatus(trigger.safetyStatus)
	const unsafeSafetyStatus = isXichengUnsafeSafetyStatus(safetyStatus)
	const recognitionContext = {
		...trigger,
		regionCode: trigger.regionCode || XICHENG_REGION_CONFIG.regionCode,
		packageCode: trigger.packageCode || XICHENG_REGION_CONFIG.packageCode,
		sceneCode: trigger.sceneCode || XICHENG_REGION_CONFIG.sceneCode,
		sourceChannel: trigger.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
		poiCode: trigger.poiCode || '',
		poiName: trigger.poiName || '',
		companionName: trigger.companionName || XICHENG_REGION_CONFIG.companionName,
		confidence: trigger.confidence || '',
		sourceLabel: trigger.sourceLabel || '',
		safetyStatus,
		sources: unsafeSafetyStatus ? [] : normalizeXichengReviewedSources(trigger.sources),
		suggestedQuestions: unsafeSafetyStatus ? [] : Array.isArray(trigger.suggestedQuestions) ? trigger.suggestedQuestions : []
	}
	if (unsafeSafetyStatus) {
		uni.removeStorageSync(XICHENG_REGION_CONFIG.storageKey)
	} else {
		uni.setStorageSync(XICHENG_REGION_CONFIG.storageKey, recognitionContext)
	}
	xichengAiContext.value = {
		...xichengAiContext.value,
		...recognitionContext
	}
	return recognitionContext
}

const getActiveXunjingResourceConfig = (context = xichengAiContext.value) => {
	if (hasXichengAiContext(context)) {
		return {
			...XUNJING_RESOURCE_CONFIG,
			packageCode: context.packageCode || XICHENG_REGION_CONFIG.packageCode,
			tenantId: XICHENG_REGION_CONFIG.tenantId,
			sourceChannel: XICHENG_REGION_CONFIG.sourceChannel
		}
	}
	return XUNJING_RESOURCE_CONFIG
}

const getActiveXunjingEventConfig = (context = xichengAiContext.value) => {
	if (hasXichengAiContext(context)) {
		return {
			...XUNJING_EVENT_CONFIG,
			packageCode: context.packageCode || XICHENG_REGION_CONFIG.packageCode,
			sceneCode: context.sceneCode || XICHENG_REGION_CONFIG.aiSceneCode,
			tenantId: XICHENG_REGION_CONFIG.tenantId,
			sourceChannel: XICHENG_REGION_CONFIG.sourceChannel
		}
	}
	return XUNJING_EVENT_CONFIG
}

const getActiveXunjingAiConfig = (context = xichengAiContext.value) => {
	if (hasXichengAiContext(context)) {
		return {
			...XUNJING_AI_CONFIG,
			packageCode: context.packageCode || XICHENG_REGION_CONFIG.packageCode,
			sceneCode: XICHENG_REGION_CONFIG.aiSceneCode,
			tenantId: XICHENG_REGION_CONFIG.tenantId,
			sourceChannel: XICHENG_REGION_CONFIG.sourceChannel
		}
	}
	return XUNJING_AI_CONFIG
}

const getXunjingPackageDetailScope = (context = xichengAiContext.value) => {
	const resourceConfig = getActiveXunjingResourceConfig(context)
	return `${resourceConfig.tenantId}:${resourceConfig.packageCode}`
}

const buildXichengContextQuestion = (question = '', context = xichengAiContext.value) => {
	if (!hasXichengAiContext(context)) {
		return question
	}
	const poiText = context.poiName ? `识别地点：${context.poiName}。` : ''
	const confidenceText = context.confidence ? `识别置信度：${context.confidence}。` : ''
	const worldInterfaceSummary = context.worldInterfaceSummary ? `世界交互入口：${context.worldInterfaceSummary}。` : ''
	const sceneUnderstandingSummary = context.sceneUnderstandingSummary ? `Agent识别场景：${context.sceneUnderstandingSummary}。` : ''
	const sceneFusionSummary = context.sceneFusionSummary ? `AI识境现场判断：${context.sceneFusionSummary}。` : ''
	const agentDecisionReasonSummary = context.agentDecisionReasonSummary ? `Agent决策依据：${context.agentDecisionReasonSummary}。` : ''
	const memorySessionText = context.visionAgentMemorySessionText ? `连续识境：${context.visionAgentMemorySessionText}。` : ''
	const liveSignalText = [context.localTimeText, context.weatherText, context.headingText].filter(Boolean).join(' ')
	const liveSignals = liveSignalText ? `现场信号：${liveSignalText}。` : ''
	const serviceHandoffText = buildXichengServiceHandoffPromptPrefix(context)
	return `你是${context.companionName || XICHENG_REGION_CONFIG.companionName}，服务北京西城试运营路线。${poiText}${confidenceText}${sceneUnderstandingSummary}${worldInterfaceSummary}${sceneFusionSummary}${agentDecisionReasonSummary}${memorySessionText}${liveSignals}${serviceHandoffText}用户问题：${question}`
}

const buildYudaoAppApiUrl = (path) => {
	const base = String(config.UrlYudaoAppRequest || config.UrlRequest || '').replace(/\/+$/, '')
	const normalizedPath = String(path || '').replace(/^\/+/, '')
	return `${base}/${normalizedPath}`
}

const getYudaoCommonResultPayload = (res) => {
	if (res && res.data && res.data.code !== undefined && Number(res.data.code) !== 0) {
		throw new Error(res.data.msg || res.data.message || `星河寻境接口异常:${res.data.code}`)
	}
	const body = res && res.data ? res.data : {}
	return body && body.data && typeof body.data === 'object' ? body.data : body
}

const requestXunjingPackageDetail = (context = xichengAiContext.value) => {
	const resourceConfig = getActiveXunjingResourceConfig(context)
	return new Promise((resolve, reject) => {
		uni.request({
			url: buildYudaoAppApiUrl(resourceConfig.apiPath),
			method: 'GET',
			data: {
				packageCode: resourceConfig.packageCode
			},
			header: {
				'tenant-id': resourceConfig.tenantId
			},
			success: (res) => {
				if (res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
					reject(new Error(`星河寻境资源包接口异常:${res.statusCode}`))
					return
				}
				try {
					resolve(getYudaoCommonResultPayload(res))
				} catch (error) {
					reject(error)
				}
			},
			fail: reject
		})
	})
}

const buildXunjingResourceEventPayload = ({ payload = {}, context = {}, eventConfig = {} } = {}) => {
	const basePayload = {
		packageCode: eventConfig.packageCode || payload.packageCode || '',
		sourceChannel: eventConfig.sourceChannel || payload.sourceChannel || '',
		...payload
	}
	if (!hasXichengAiContext(context)) {
		return basePayload
	}
	return {
		...basePayload,
		regionCode: payload.regionCode || context.regionCode || XICHENG_REGION_CONFIG.regionCode,
		packageCode: payload.packageCode || context.packageCode || eventConfig.packageCode || XICHENG_REGION_CONFIG.packageCode,
		sceneCode: payload.sceneCode || context.sceneCode || XICHENG_REGION_CONFIG.aiSceneCode,
		sourceChannel: payload.sourceChannel || context.sourceChannel || eventConfig.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
		poiCode: payload.poiCode || context.poiCode || '',
		poiName: payload.poiName || context.poiName || '',
		...createXichengVisionAgentChatContextFields(context),
		...createXichengServiceHandoffEvidenceFields(context),
		companionName: payload.companionName || context.companionName || XICHENG_REGION_CONFIG.companionName,
		safetyStatus: normalizeXichengSafetyStatus(payload.safetyStatus || context.safetyStatus || '')
	}
}
const requestXunjingResourceEvent = ({ eventType = 'VIEW', payload = {}, context = xichengAiContext.value } = {}) => {
	const eventConfig = getActiveXunjingEventConfig(context)
	const eventPayload = buildXunjingResourceEventPayload({ payload, context, eventConfig })
	return new Promise((resolve, reject) => {
		uni.request({
			url: buildYudaoAppApiUrl(eventConfig.apiPath),
			method: 'POST',
			header: {
				'Content-Type': 'application/json',
				'tenant-id': eventConfig.tenantId
			},
			data: {
				packageCode: eventConfig.packageCode,
				sceneCode: eventConfig.sceneCode,
				eventType,
				sourceChannel: eventConfig.sourceChannel,
				userTraceId: getUserTraceId(),
				payloadJson: JSON.stringify(eventPayload)
			},
			success: (res) => {
				if (res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
					reject(new Error(`星河寻境事件接口异常:${res.statusCode}`))
					return
				}
				try {
					resolve(getYudaoCommonResultPayload(res))
				} catch (error) {
					reject(error)
				}
			},
			fail: reject
		})
	})
}

const recordXunjingResourceEvent = (options) => {
	requestXunjingResourceEvent(options).catch(() => {})
}

const resolvePackageMediaCover = (mediaAssets, index) => {
	if (!Array.isArray(mediaAssets) || mediaAssets.length === 0) {
		return ''
	}
	const asset = mediaAssets[index] || mediaAssets.find(item => item && item.fileUrl)
	return asset && asset.fileUrl ? asset.fileUrl : ''
}

const applyXunjingPackageDetail = (detail) => {
	const mapPoints = detail && Array.isArray(detail.mapPoints)
		? detail.mapPoints.filter(point => point && point.title).slice(0, 3)
		: []
	const mediaAssets = detail && Array.isArray(detail.mediaAssets) ? detail.mediaAssets : []
	if (mapPoints.length === 0) {
		return false
	}
	aiCompanionPlaces.value = mapPoints.map((point, index) => {
		const fallback = defaultAiCompanionPlaces[index] || defaultAiCompanionPlaces[0]
		const cover = resolvePackageMediaCover(mediaAssets, index) || fallback.cover
		return {
			badge: `TOP${index + 1}`,
			title: point.title,
			desc: point.summary || fallback.desc,
			cover,
			question: `${point.title}怎么玩最值得？`
		}
	})
	return true
}

let xunjingPackageDetailRequestedScope = ''
const loadXunjingPackageDetail = async (context = xichengAiContext.value) => {
	const packageScope = getXunjingPackageDetailScope(context)
	if (xunjingPackageDetailRequestedScope === packageScope) {
		return
	}
	xunjingPackageDetailRequestedScope = packageScope
	try {
		const detail = await requestXunjingPackageDetail(context)
		applyXunjingPackageDetail(detail)
	} catch (_) {
	}
}

const normalizeXunjingAiResponse = (res) => {
	if (res && res.data && res.data.code !== undefined && Number(res.data.code) !== 0) {
		const error = new Error(res.data.msg || res.data.message || `星河寻境AI接口异常:${res.data.code}`)
		error.yudaoCommonResultCode = Number(res.data.code)
		throw error
	}
	const body = res && res.data ? res.data : {}
	const payload = body && body.data && typeof body.data === 'object' ? body.data : body
	if (hasXichengAiContext()) {
		const normalizedXichengResponse = normalizeXichengAiChatResponse(payload)
		if (!normalizedXichengResponse.answer) {
			throw new Error('AI返回为空')
		}
		return normalizedXichengResponse
	}
	const sources = payload && Array.isArray(payload.sources) ? payload.sources : []
	const suggestedQuestions = payload && Array.isArray(payload.suggestedQuestions)
		? payload.suggestedQuestions
		: payload && Array.isArray(payload.recommendedQuestions)
			? payload.recommendedQuestions
			: []
	const safetyStatus = normalizeXichengSafetyStatus(payload && payload.safetyStatus ? payload.safetyStatus : '')
	const answer = safetyStatus === 'BLOCKED'
		? XICHENG_BLOCKED_ANSWER
		: payload && payload.answer
			? String(payload.answer)
			: ''
	if (!answer) {
		throw new Error('AI返回为空')
	}
	return {
		answer,
		sources,
		suggestedQuestions,
		safetyStatus,
		logId: payload.logId || ''
	}
}

const createLocalKashgarAiFallback = (question = '') => {
	const normalizedQuestion = String(question || '').trim()
	const topic = normalizedQuestion.includes('美食')
		? '喀什美食'
		: normalizedQuestion.includes('路线') || normalizedQuestion.includes('攻略')
			? '喀什游览路线'
			: normalizedQuestion.includes('拍照') || normalizedQuestion.includes('打卡')
				? '喀什打卡地'
				: '喀什古城'
	return {
		fallback: true,
		answer: `我先按喀什本地导览资料为你回答：${topic}最适合慢慢走、边看边听。建议从喀什古城入口进入，沿着老街巷看土陶、铜器、花帽和木雕作坊，再去老茶馆体验当地茶点与歌舞。如果时间充裕，可以把高台民居、艾提尕尔周边街区和夜市串成半日路线，白天看建筑和手作，傍晚体验烟火气。`,
		sources: [],
		followUps: [
			'推荐一条喀什古城半日路线',
			'喀什有哪些特色美食？',
			'喀什适合拍照的地方有哪些？'
		]
	}
}

const createLocalXichengAiFallback = (question = '', context = {}) => {
	const sources = getXichengContextSources(context)
	if (sources.length === 0) {
		return {
			fallback: true,
			answer: XICHENG_UNAVAILABLE_ANSWER,
			sources: [],
			followUps: [],
			safetyStatus: 'UNAVAILABLE'
		}
	}
	const sourceNames = sources
		.map(getXichengDisplaySourceTitle)
		.filter(Boolean)
		.slice(0, 2)
	const sourceSummary = sources
		.map(getXichengDisplaySourceDescription)
		.filter(Boolean)
		.slice(0, 2)
		.join('；')
	const sourceLabel = sourceNames.length > 0 ? `「${sourceNames.join('、')}」` : '当前文化点'
	const fallbackAnswer = `小京暂时没有拿到在线 AI 回答，但已匹配到${sourceLabel}的已审核来源。${sourceSummary ? `可先参考：${sourceSummary}` : '你可以先查看下方来源卡，或稍后继续追问。'}`
	return {
		fallback: true,
		answer: fallbackAnswer,
		sources,
		followUps: createSourceFollowUps(sources),
		safetyStatus: 'PASSED'
	}
}

const createXichengAiGuardFailureFallback = ({ error = null, statusCode = null } = {}) => {
	const yudaoCommonResultCode = error && error.yudaoCommonResultCode !== undefined ? error.yudaoCommonResultCode : undefined
	return { answer: XICHENG_UNAVAILABLE_ANSWER, sources: [], followUps: [], safetyStatus: 'UNAVAILABLE', fallback: true, statusCode, errorMessage: error && error.message ? error.message : '', yudaoCommonResultCode }
}

const createLocalXunjingAiFallback = (question = '', context = xichengAiContext.value) => {
	return hasXichengAiContext(context) ? createLocalXichengAiFallback(question, context) : createLocalKashgarAiFallback(question)
}

const createGuardedXunjingAiFallback = ({ question = '', context = {}, error = null, statusCode = null } = {}) => {
	if (hasXichengAiContext(context) && (error && (error.yudaoCommonResultCode !== undefined || error.yudaoHttpStatusCode !== undefined))) {
		return createXichengAiGuardFailureFallback({ error, statusCode })
	}
	return { ...createLocalXunjingAiFallback(question, context), statusCode, errorMessage: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : '', fallback: true }
}

const getDisplaySourceTitle = getXichengDisplaySourceTitle

const getDisplaySourceFollowUp = (source = {}) => {
	const sourceTitle = getDisplaySourceTitle(source)
	if (!sourceTitle) return ''
	return `继续了解${sourceTitle}`
}

const seekXichengPlayback = (seconds = 0) => {
	if (!isXichengPlaybackMode.value) return
	uni.showToast({
		icon: 'none',
		title: seconds < 0 ? '已回退 15 秒' : '已前进 15 秒'
	})
}

const toggleXichengPlayback = () => {
	if (!isXichengPlaybackMode.value) return
	xichengPlaybackPaused.value = !xichengPlaybackPaused.value
	uni.showToast({
		icon: 'none',
		title: xichengPlaybackPaused.value ? '讲解已暂停' : '继续播放讲解'
	})
}

const createSourceFollowUps = (sources = []) => sources
	.map(getDisplaySourceFollowUp)
	.filter(Boolean)
	.slice(0, 3)

const createXunjingResultFollowUps = (result = {}) => {
	const suggestedQuestions = result && Array.isArray(result.suggestedQuestions) ? result.suggestedQuestions : []
	if (suggestedQuestions.length > 0) {
		return suggestedQuestions.slice(0, 3)
	}
	return createSourceFollowUps(result && result.sources ? result.sources : [])
}

const getDisplaySourceDescription = getXichengDisplaySourceDescription
const requestXunjingAiChat = (question) => {
	let requestTask = null
	const context = xichengAiContext.value || {}
	const contextSafetyStatus = normalizeXichengSafetyStatus(context.safetyStatus)
	if (hasXichengAiContext(context) && isXichengUnsafeSafetyStatus(contextSafetyStatus)) {
		const unsafeRequest = Promise.resolve({
			answer: contextSafetyStatus === 'BLOCKED' ? XICHENG_BLOCKED_ANSWER : XICHENG_UNAVAILABLE_ANSWER,
			sources: [],
			suggestedQuestions: [],
			safetyStatus: contextSafetyStatus
		})
		unsafeRequest.abort = () => {}
		return unsafeRequest
	}
	const aiConfig = getActiveXunjingAiConfig(context)
	const requestQuestion = buildXichengContextQuestion(question, context)
	const requestPayload = {
		packageCode: aiConfig.packageCode,
		question: requestQuestion,
		sceneCode: aiConfig.sceneCode,
		sourceChannel: aiConfig.sourceChannel,
		userTraceId: getUserTraceId()
	}
	if (hasXichengAiContext(context)) {
		requestPayload.regionCode = context.regionCode || XICHENG_REGION_CONFIG.regionCode
		requestPayload.poiCode = context.poiCode
		requestPayload.poiName = context.poiName
		requestPayload.companionName = context.companionName || XICHENG_REGION_CONFIG.companionName
		requestPayload.recognitionConfidence = context.confidence || ''
		requestPayload.safetyStatus = normalizeXichengSafetyStatus(context.safetyStatus)
		Object.assign(requestPayload, createXichengVisionAgentChatContextFields(context))
		Object.assign(requestPayload, createXichengServiceHandoffEvidenceFields(context))
	}
	const pendingRequest = new Promise((resolve, reject) => {
		requestTask = uni.request({
			url: buildYudaoAppApiUrl(aiConfig.apiPath),
			method: 'POST',
			timeout: AI_RESPONSE_TIMEOUT_MS,
			header: {
				'Content-Type': 'application/json',
				'tenant-id': aiConfig.tenantId
			},
			data: requestPayload,
			success: (res) => {
				if (res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
					const error = new Error(`西城小京接口异常:${res.statusCode}`)
					error.yudaoHttpStatusCode = Number(res.statusCode)
					resolve(createGuardedXunjingAiFallback({ question, context, error, statusCode: res && res.statusCode }))
					return
				}
				try {
					resolve(normalizeXunjingAiResponse(res))
				} catch (error) {
					resolve(createGuardedXunjingAiFallback({ question, context, error }))
				}
			},
			fail: (error) => {
				if (isAbortError(error)) {
					reject(error)
					return
				}
				resolve(createGuardedXunjingAiFallback({ question, context, error }))
			}
		})
	})
	pendingRequest.abort = () => {
		if (requestTask && typeof requestTask.abort === 'function') {
			requestTask.abort()
		}
	}
	return pendingRequest
}

const escapeHtml = (value = '') => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;')

const renderInlineMarkdown = (text = '') => {
	let html = escapeHtml(text)
	html = html.replace(/`([^`]+)`/g, '<span class="md-inline-code">$1</span>')
	html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
	html = html.replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
	html = html.replace(/(^|[^\*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
	return html
}

const renderMarkdownNodes = (content = '') => {
	const lines = String(content || '').replace(/\r\n/g, '\n').split('\n')
	const html = lines.map((line) => {
		const trimmed = line.trim()
		if (!trimmed) {
			return '<p class="md-p md-empty">&nbsp;</p>'
		}
		const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)
		if (heading) {
			return `<p class="md-heading md-heading-${heading[1].length}">${renderInlineMarkdown(heading[2])}</p>`
		}
		const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/)
		if (ordered) {
			return `<p class="md-p md-list">• ${renderInlineMarkdown(ordered[1])}</p>`
		}
		const unordered = trimmed.match(/^[-*+]\s+(.+)$/)
		if (unordered) {
			return `<p class="md-p md-list">• ${renderInlineMarkdown(unordered[1])}</p>`
		}
		return `<p class="md-p">${renderInlineMarkdown(line)}</p>`
	}).join('')
	return html
}

const isAbortError = (error) => {
	const message = String(error && (error.errMsg || error.message || '') || '')
	return message.toLowerCase().includes('abort')
}

const clearActiveStreamIfMatch = (streamId) => {
	if (activeStream.value && activeStream.value.id === streamId) {
		activeStream.value = null
		isStreaming.value = false
	}
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const cleanSpeechText = (content = '') => String(content || '')
	.replace(/```[\s\S]*?```/g, ' ')
	.replace(/`([^`]*)`/g, '$1')
	.replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
	.replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
	.replace(/^\s*#{1,6}\s+/gm, '')
	.replace(/^\s*[-+*]\s+/gm, '')
	.replace(/^\s*\d+[.)]\s+/gm, '')
	.replace(/[*_~>|#]/g, ' ')
	.replace(/\s+/g, ' ')
	.trim()
	.slice(0, AI_SPEECH_CONFIG.maxTextLength)

const splitSpeechText = (content = '') => {
	const speechText = cleanSpeechText(content)
	if (!speechText) {
		return []
	}
	const chunks = []
	let restText = speechText
	while (restText.length > AI_SPEECH_CONFIG.chunkLength) {
		const preview = restText.slice(0, AI_SPEECH_CONFIG.chunkLength)
		const punctuationIndex = Math.max(
			preview.lastIndexOf('。'),
			preview.lastIndexOf('！'),
			preview.lastIndexOf('？'),
			preview.lastIndexOf('；'),
			preview.lastIndexOf('，')
		)
		const splitAt = punctuationIndex >= Math.floor(AI_SPEECH_CONFIG.chunkLength * 0.45)
			? punctuationIndex + 1
			: AI_SPEECH_CONFIG.chunkLength
		chunks.push(restText.slice(0, splitAt).trim())
		restText = restText.slice(splitAt).trim()
	}
	if (restText) {
		chunks.push(restText)
	}
	return chunks
}

const getFileSystemManager = () => {
	if (typeof uni !== 'undefined' && typeof uni.getFileSystemManager === 'function') {
		return uni.getFileSystemManager()
	}
	if (typeof wx !== 'undefined' && typeof wx.getFileSystemManager === 'function') {
		return wx.getFileSystemManager()
	}
	return null
}

const getUserDataPath = () => {
	if (typeof wx !== 'undefined' && wx.env && wx.env.USER_DATA_PATH) {
		return wx.env.USER_DATA_PATH
	}
	if (typeof uni !== 'undefined' && uni.env && uni.env.USER_DATA_PATH) {
		return uni.env.USER_DATA_PATH
	}
	return ''
}

const stopAiSpeech = ({ cancelPending = true } = {}) => {
	if (cancelPending) {
		speechRequestSeed += 1
		speechQueue = []
		speechQueuePlaying = false
	}
	if (speechAudioContext) {
		try {
			speechAudioContext.stop()
		} catch (error) {
			console.warn('停止AI语音失败:', error)
		}
	}
}

const destroyAiSpeech = () => {
	stopAiSpeech()
	if (speechAudioContext && typeof speechAudioContext.destroy === 'function') {
		try {
			speechAudioContext.destroy()
		} catch (error) {
			console.warn('销毁AI语音失败:', error)
		}
	}
	speechAudioContext = null
}

const requestAiSpeech = () => Promise.reject(new Error('AI语音代理未启用'))

const saveSpeechAudioFile = (audioBuffer) => {
	return new Promise((resolve, reject) => {
		const fileSystemManager = getFileSystemManager()
		const userDataPath = getUserDataPath()
		if (!fileSystemManager || !userDataPath) {
			reject(new Error('当前环境不支持保存语音文件'))
			return
		}
		const filePath = `${userDataPath}/xunjing_ai_reply_${Date.now()}_${speechFileSeed++}.${AI_SPEECH_CONFIG.responseFormat}`
		fileSystemManager.writeFile({
			filePath,
			data: audioBuffer,
			success: () => resolve(filePath),
			fail: reject
		})
	})
}

const playAiSpeechFile = (filePath, requestId) => {
	return new Promise((resolve) => {
		if (requestId !== speechRequestSeed) {
			resolve()
			return
		}
		if (!speechAudioContext) {
			speechAudioContext = uni.createInnerAudioContext()
			speechAudioContext.obeyMuteSwitch = false
		}
		const cleanup = () => {
			if (speechAudioContext && typeof speechAudioContext.offEnded === 'function') {
				speechAudioContext.offEnded(cleanup)
			}
			if (speechAudioContext && typeof speechAudioContext.offError === 'function') {
				speechAudioContext.offError(cleanup)
			}
			resolve()
		}
		if (typeof speechAudioContext.onEnded === 'function') {
			speechAudioContext.onEnded(cleanup)
		}
		if (typeof speechAudioContext.onError === 'function') {
			speechAudioContext.onError(cleanup)
		}
		try {
			speechAudioContext.stop()
			speechAudioContext.src = filePath
			speechAudioContext.play()
		} catch (error) {
			console.warn('播放AI语音失败:', error)
			cleanup()
		}
	})
}

const createSpeechQueueItem = (text) => ({
	text,
	filePathPromise: null
})

const prepareSpeechQueueItem = (item) => {
	if (!item.filePathPromise) {
		item.filePathPromise = requestAiSpeech(item.text).then(saveSpeechAudioFile)
	}
	return item.filePathPromise
}

const prefetchNextSpeechItem = () => {
	if (speechQueue.length > 0) {
		prepareSpeechQueueItem(speechQueue[0]).catch((error) => {
			console.warn('AI speech prefetch failed:', error)
		})
	}
}

const processSpeechQueue = async (requestId) => {
	if (speechQueuePlaying) {
		return
	}
	speechQueuePlaying = true
	try {
		while (requestId === speechRequestSeed && speechQueue.length > 0) {
			const speechItem = speechQueue.shift()
			const filePath = await prepareSpeechQueueItem(speechItem)
			if (requestId !== speechRequestSeed) {
				return
			}
			prefetchNextSpeechItem()
			await playAiSpeechFile(filePath, requestId)
		}
	} catch (error) {
		console.warn('AI speech playback failed:', error)
	} finally {
		speechQueuePlaying = false
	}
}

const enqueueAiSpeech = (content, { reset = false } = {}) => {
	if (!isAiSpeechEnabled()) {
		return
	}
	const speechChunks = splitSpeechText(content)
	if (speechChunks.length === 0) {
		return
	}
	if (reset) {
		stopAiSpeech()
	}
	const requestId = speechRequestSeed
	speechQueue.push(...speechChunks.map(createSpeechQueueItem))
	if (speechQueuePlaying) {
		prefetchNextSpeechItem()
	}
	processSpeechQueue(requestId)
}

const findStreamSpeechCutIndex = (text, force = false, isFirstSpeechChunk = false) => {
	const pendingText = String(text || '')
	if (!pendingText) {
		return 0
	}
	if (force) {
		return pendingText.length
	}
	const targetLength = isFirstSpeechChunk ? STREAM_SPEECH_FIRST_CHUNK_LENGTH : STREAM_SPEECH_CHUNK_LENGTH
	const preview = pendingText.slice(0, targetLength)
	const punctuationMatches = [...preview.matchAll(/[\u3002\uff01\uff1f\uff1b\uff0c\u3001\n]/g)]
	const punctuationIndex = punctuationMatches.length > 0
		? punctuationMatches[punctuationMatches.length - 1].index
		: -1
	if (punctuationIndex >= STREAM_SPEECH_MIN_LENGTH) {
		return punctuationIndex + 1
	}
	if (pendingText.length >= targetLength) {
		return targetLength
	}
	return 0
}

const queueStreamSpeech = (state, { force = false } = {}) => {
	if (!state || state.cancelled || !isAiSpeechEnabled()) {
		return
	}
	const spokenLength = state.spokenLength || 0
	const pendingText = state.fullContent.slice(spokenLength)
	const isFirstSpeechChunk = spokenLength === 0
	const cutIndex = findStreamSpeechCutIndex(pendingText, force, isFirstSpeechChunk)
	if (!cutIndex) {
		return
	}
	const speakableText = pendingText.slice(0, cutIndex).trim()
	state.spokenLength = spokenLength + cutIndex
	if (!cleanSpeechText(speakableText)) {
		return
	}
	if (state.message && !state.message.hasSpoken) {
		commitAssistantMessage(state.message, { hasSpoken: true })
	}
	enqueueAiSpeech(speakableText)
}

const speakAiReply = async (content) => {
	enqueueAiSpeech(content, { reset: true })
}

const speakVisibleAssistantReply = async (assistantMessage, answer) => {
	if (!assistantMessage) {
		return
	}
	if (assistantMessage.hasSpoken) {
		return
	}
	const content = assistantMessage.content || answer || ''
	commitAssistantMessage(assistantMessage, {
		content,
		isPending: false
	})
	saveMessagesCache()
	await nextTick()
	await wait(AI_SPEECH_RENDER_DELAY_MS)
	const visibleMessage = messages.value.find(item => item && item.id === assistantMessage.id)
	if (!visibleMessage || visibleMessage.isPending || !visibleMessage.content || visibleMessage.hasSpoken) {
		return
	}
	commitAssistantMessage(visibleMessage, { hasSpoken: true })
	speakAiReply(visibleMessage.content)
}

const speakWelcomeMessage = async (welcomeMessage) => {
	if (!welcomeMessage || !welcomeMessage.content) {
		return
	}
	await nextTick()
	speakVisibleAssistantReply(welcomeMessage, welcomeMessage.content)
}

const clearScrollTimer = () => {
	if (scrollTimer) {
		clearTimeout(scrollTimer)
		scrollTimer = null
	}
}

const clearHistoryScrollTimer = () => {
	if (historyScrollTimer) {
		clearTimeout(historyScrollTimer)
		historyScrollTimer = null
	}
}

const clearPendingUiTimers = () => {
	clearScrollTimer()
	clearHistoryScrollTimer()
}

// 滚动到底部：使用页面级滚动，避开真机 scroll-view 内部滚动失效问题。
const runScrollToBottom = () => {
	scrollTimer = null
	lastScrollAt = Date.now()
	nextTick(() => {
		uni.pageScrollTo({
			selector: '#chat-bottom-anchor',
			duration: 0
		})
	})
}

const scrollXichengWelcomeToTop = () => {
	clearScrollTimer()
	nextTick(() => {
		uni.pageScrollTo({
			selector: '.xicheng-chat-container',
			scrollTop: 0,
			duration: 0
		})
	})
}

const scrollToBottom = ({ immediate = false } = {}) => {
	if (immediate) {
		clearScrollTimer()
		runScrollToBottom()
		return
	}
	if (scrollTimer) {
		return
	}
	const delay = Math.max(SCROLL_UPDATE_INTERVAL - (Date.now() - lastScrollAt), 0)
	scrollTimer = setTimeout(runScrollToBottom, delay)
}

const scheduleHistoryScrollToBottom = () => {
	if (isCurrentXichengWelcomeOnlyConversation()) {
		scrollXichengWelcomeToTop()
		return
	}
	clearHistoryScrollTimer()
	let attempts = 0
	const maxAttempts = 4
	const runHistoryScroll = () => {
		scrollToBottom({ immediate: true })
		attempts += 1
		if (attempts < maxAttempts) {
			historyScrollTimer = setTimeout(runHistoryScroll, HISTORY_SCROLL_DELAY)
		} else {
			historyScrollTimer = null
		}
	}
	historyScrollTimer = setTimeout(runHistoryScroll, HISTORY_SCROLL_DELAY)
}

const clearStreamRenderTimer = (state) => {
	if (state && state.renderTimer) {
		clearTimeout(state.renderTimer)
		state.renderTimer = null
	}
}

const renderStreamContent = (state) => {
	if (!state || state.cancelled || state.displayContent === state.fullContent) {
		return
	}
	const nextLength = Math.min(
		state.fullContent.length,
		state.displayContent.length + STREAM_TYPEWRITER_CHARS_PER_TICK
	)
	state.displayContent = state.fullContent.slice(0, nextLength)
	state.lastRenderAt = Date.now()
	commitAssistantMessage(state.message, {
		content: state.displayContent
	})
	scrollToBottom()
	if (state.displayContent.length < state.fullContent.length) {
		scheduleStreamContentRender(state)
		return
	}
	if (state.streamFinished && !state.cacheSavedAfterTypewriter) {
		state.cacheSavedAfterTypewriter = true
		saveMessagesCache()
	}
}

const flushStreamContent = (state) => {
	if (!state) {
		return
	}
	clearStreamRenderTimer(state)
	renderStreamContent(state)
}

const scheduleStreamContentRender = (state) => {
	if (!state || state.cancelled) {
		return
	}
	const elapsed = Date.now() - state.lastRenderAt
	if (!state.message.content || elapsed >= STREAM_RENDER_INTERVAL) {
		flushStreamContent(state)
		return
	}
	if (state.renderTimer) {
		return
	}
	state.renderTimer = setTimeout(() => {
		state.renderTimer = null
		renderStreamContent(state)
	}, STREAM_RENDER_INTERVAL - elapsed)
}

const cancelStreamContentRender = (state) => {
	if (!state) {
		return
	}
	clearStreamRenderTimer(state)
	state.cancelled = true
}

const interruptCurrentResponse = ({ showStatus = true } = {}) => {
	const current = activeStream.value
	if (!current) {
		clearPendingUiTimers()
		return false
	}

	clearPendingUiTimers()
	current.interrupted = true
	if (showStatus) {
		flushStreamContent(current.state)
	}
	cancelStreamContentRender(current.state)
	if (current.message) {
		const fields = {
			isPending: false,
			followUps: []
		}
		if (showStatus) {
			fields.interrupted = true
			shouldStartNewConversationAfterInterrupt = true
		}
		commitAssistantMessage(current.message, fields)
		saveMessagesCache()
	}

	activeStream.value = null
	isStreaming.value = false

	if (current.task && typeof current.task.abort === 'function') {
		try {
			current.task.abort()
		} catch (error) {
			console.error('中断流式请求失败:', error)
		}
	}

	return true
}

const prepareNextRequestAfterInterrupt = async (wasInterrupted) => {
	if (!wasInterrupted) {
		return
	}
	// 给小程序网络层一点时间完成 abort，避免旧流的 fail 回调和新请求交错。
	await wait(250)
}

const appendAnswerContent = (state, content) => {
	if (!content) {
		return
	}
	state.fullContent += content
	scheduleStreamContentRender(state)
	queueStreamSpeech(state)
}

const startXunjingAiRequest = ({ question, assistantMessage }) => {
	return new Promise((resolve, reject) => {
		const state = {
			message: assistantMessage,
			fullContent: '',
			displayContent: '',
			followUps: [],
			sources: [],
			safetyStatus: '',
			renderTimer: null,
			lastRenderAt: 0,
			spokenLength: 0,
			streamFinished: false,
			cacheSavedAfterTypewriter: false,
			cancelled: false
		}
		if (shouldStartNewConversationAfterInterrupt) {
			shouldStartNewConversationAfterInterrupt = false
			conversationId.value = ''
			uni.removeStorageSync(getActiveConversationKey())
		}
		const requestController = {
			id: ++streamSeed,
			task: null,
			message: assistantMessage,
			state,
			interrupted: false
		}
		let requestSettled = false
		let responseTimeoutTimer = null

		const clearResponseTimeout = () => {
			if (responseTimeoutTimer) {
				clearTimeout(responseTimeoutTimer)
				responseTimeoutTimer = null
			}
		}

		const settleRequest = (callback) => {
			if (requestSettled) {
				return
			}
			requestSettled = true
			clearResponseTimeout()
			callback()
		}

		activeStream.value = requestController
		isStreaming.value = true

		const requestTask = requestXunjingAiChat(question)
		requestController.task = requestTask

		requestTask.then((result) => {
				if (requestController.interrupted) {
					commitAssistantMessage(assistantMessage, { isPending: false })
					cancelStreamContentRender(state)
					saveMessagesCache()
					clearActiveStreamIfMatch(requestController.id)
					settleRequest(() => reject({ type: 'INTERRUPTED' }))
					return
				}
				if (result && normalizeXichengSafetyStatus(result.safetyStatus) === 'BLOCKED') {
					appendAnswerContent(state, XICHENG_BLOCKED_ANSWER)
					state.followUps = []
					state.sources = []
					state.safetyStatus = 'BLOCKED'
					state.streamFinished = true
					flushStreamContent(state)
					commitAssistantMessage(assistantMessage, {
						isPending: false,
						followUps: [],
						sources: [],
						safetyStatus: 'BLOCKED'
					})
					saveMessagesCache()
					clearActiveStreamIfMatch(requestController.id)
					settleRequest(() => resolve({
						answer: state.fullContent,
						followUps: [],
						sources: [],
						safetyStatus: 'BLOCKED'
					}))
					return
				}
				if (result && result.fallback) {
					appendAnswerContent(state, result.answer)
					state.followUps = result.followUps || []
					state.sources = result.sources || []
					state.safetyStatus = result.safetyStatus || ''
					state.streamFinished = true
					flushStreamContent(state)
					commitAssistantMessage(assistantMessage, {
						isPending: false,
						followUps: result.followUps || [],
						sources: result.sources || [],
						safetyStatus: state.safetyStatus
					})
					saveMessagesCache()
					clearActiveStreamIfMatch(requestController.id)
					settleRequest(() => resolve({ answer: state.fullContent, followUps: state.followUps, sources: state.sources, safetyStatus: state.safetyStatus, fallback: true }))
					return
				}
				appendAnswerContent(state, result.answer)
				state.followUps = createXunjingResultFollowUps(result)
				state.sources = result.sources || []
				state.safetyStatus = result.safetyStatus || ''
				state.streamFinished = true
				flushStreamContent(state)
				queueStreamSpeech(state, { force: true })
				commitAssistantMessage(assistantMessage, {
					isPending: false,
					sources: result.sources || [],
					safetyStatus: result.safetyStatus || ''
				})
				if (!state.fullContent) {
					cancelStreamContentRender(state)
					saveMessagesCache()
					clearActiveStreamIfMatch(requestController.id)
					settleRequest(() => reject(new Error('AI返回为空')))
					return
				}
				if (state.followUps.length > 0) {
					commitAssistantMessage(assistantMessage, { followUps: state.followUps })
				}
				saveMessagesCache()
				clearActiveStreamIfMatch(requestController.id)
				settleRequest(() => resolve({ answer: state.fullContent, followUps: state.followUps, sources: result.sources, safetyStatus: result.safetyStatus || '' }))
			})
			.catch((err) => {
				if (requestSettled) {
					return
				}
				commitAssistantMessage(assistantMessage, { isPending: false })
				cancelStreamContentRender(state)
				saveMessagesCache()
				if (requestController.interrupted || isAbortError(err)) {
					clearActiveStreamIfMatch(requestController.id)
					settleRequest(() => reject({ type: 'INTERRUPTED' }))
					return
				}
				clearActiveStreamIfMatch(requestController.id)
				settleRequest(() => reject(err))
			})

		responseTimeoutTimer = setTimeout(() => {
			if (requestSettled || requestController.interrupted) {
				return
			}
			if (hasXichengAiContext(xichengAiContext.value)) {
				const timeoutFallback = createLocalXichengAiFallback(question, xichengAiContext.value)
				appendAnswerContent(state, timeoutFallback.answer)
				state.followUps = timeoutFallback.followUps || []
				state.sources = timeoutFallback.sources || []
				state.safetyStatus = timeoutFallback.safetyStatus || 'UNAVAILABLE'
				state.streamFinished = true
				flushStreamContent(state)
				commitAssistantMessage(assistantMessage, {
					isPending: false,
					followUps: timeoutFallback.followUps || [],
					sources: timeoutFallback.sources || [],
					safetyStatus: state.safetyStatus
				})
				saveMessagesCache()
				clearActiveStreamIfMatch(requestController.id)
				settleRequest(() => resolve({
					answer: state.fullContent,
					followUps: timeoutFallback.followUps || [],
					sources: timeoutFallback.sources || [],
					safetyStatus: state.safetyStatus,
					fallback: true,
					timeout: true
				}))
			} else {
				commitAssistantMessage(assistantMessage, { isPending: false })
				cancelStreamContentRender(state)
				saveMessagesCache()
				clearActiveStreamIfMatch(requestController.id)
				settleRequest(() => reject(new Error('AI响应超时')))
			}
			if (requestTask && typeof requestTask.abort === 'function') {
				try {
					requestTask.abort()
				} catch (error) {
					console.error('AI响应超时后中断请求失败:', error)
				}
			}
		}, AI_RESPONSE_TIMEOUT_MS)
	})
}

const shouldSkipXichengUnsafeMessageCache = () => {
	const safetyStatus = normalizeXichengSafetyStatus(xichengAiContext.value.safetyStatus)
	return hasXichengAiContext() && isXichengUnsafeSafetyStatus(safetyStatus)
}

// 加载历史对话记录
const loadChatHistory = async ({ preferCache = false } = {}) => {
	if (shouldSkipXichengUnsafeMessageCache()) {
		setWelcomeMessage()
		return
	}
	const cachedMessages = loadMessagesCache()
	if (preferCache && cachedMessages.length > 0) {
		messages.value = cachedMessages
		scheduleHistoryScrollToBottom()
		return
	}

	if (cachedMessages.length > 0) {
		messages.value = cachedMessages
		scheduleHistoryScrollToBottom()
		return
	}

	setWelcomeMessage()
}

// 清空对话历史
const clearChatHistory = () => {
	uni.showModal({
		title: '提示',
		content: '确定要清空所有对话记录吗？',
		success: (res) => {
			if (res.confirm) {
				interruptCurrentResponse({ showStatus: false })
				stopAiSpeech()
				clearPendingUiTimers()
				uni.removeStorageSync(getActiveConversationKey())
				uni.removeStorageSync(getActiveChatCacheKey())
				conversationId.value = ''
				setWelcomeMessage()
				uni.showToast({
					title: '已清空',
					icon: 'success'
				})
			}
		}
	})
}

const showXichengChatMenu = () => {
	uni.showActionSheet({
		itemList: ['清空对话', '返回西城首页'],
		success: ({ tapIndex }) => {
			if (tapIndex === 0) {
				clearChatHistory()
				return
			}
			if (tapIndex === 1) {
				clearPendingUiTimers()
				stopAiSpeech()
				uni.reLaunch({
					url: XICHENG_HOME_ROUTE
				})
			}
		}
	})
}

// 返回上一页
const goBack = () => {
	if (showKashgarDiaryGenerator.value) {
		showKashgarDiaryGenerator.value = false
		showAiCompanionHome.value = true
		return
	}
	if (isXichengChatMode.value) {
		clearPendingUiTimers()
		stopAiSpeech()
		const pages = getCurrentPages()
		if (pages.length === 1) {
			uni.reLaunch({
				url: XICHENG_HOME_ROUTE
			})
		} else {
			uni.navigateBack()
		}
		return
	}
	if (showAiCompanionHome.value === false && KASHGAR_AI_COMPANION_HOME_ENABLED) {
		showAiCompanionHome.value = true
		return
	}
	clearPendingUiTimers()
	stopAiSpeech()
	const pages = getCurrentPages()
	if (pages.length === 1) {
		uni.reLaunch({
			url: KASHGAR_HOME_ROUTE
		})
	} else {
		uni.navigateBack()
	}
}

const openKashgarDiaryGenerator = () => {
	if (!KASHGAR_DIARY_GENERATOR_ENABLED) return
	showKashgarDiaryGenerator.value = true
	showAiCompanionHome.value = false
	stopAiSpeech()
	clearPendingUiTimers()
}

const openAiCompanionChat = (question = '') => {
	showKashgarDiaryGenerator.value = false
	showAiCompanionHome.value = false
	inputText.value = question
	nextTick(() => {
		scheduleHistoryScrollToBottom()
	})
}

const goAiCompanionMap = () => {
	uni.navigateTo({
		url: '/subPackages/feature/map/map'
	})
}

const handleAiCompanionAction = (action) => {
	if (!action) return
	if (action.target === 'map') {
		goAiCompanionMap()
		return
	}
	if (action.key === 'diary' || action.target === 'diary') {
		openKashgarDiaryGenerator()
		return
	}
	openAiCompanionChat(action.question || '')
}

const joinAiCompanionTrip = () => {
	uni.showToast({
		title: '已加入旅行',
		icon: 'success'
	})
}

const optimizeKashgarDiary = () => {
	uni.showToast({
		title: '喀小寻正在优化文案',
		icon: 'none'
	})
}

const generateKashgarDiary = () => {
	uni.showToast({
		title: '喀小寻正在生成游记',
		icon: 'none'
	})
}

const buildXunjingTriggerAssistantContent = (trigger) => {
	if (!trigger || !trigger.poiName) {
		return '我已经收到这张照片，并尝试结合当前位置、OCR文字和图片识别信号判断。当前没有稳定匹配到西城文化点，你可以补一句“这是哪里”或拍到更完整的门头/说明牌，我会继续识别。'
	}
	const safetyStatus = normalizeXichengSafetyStatus(trigger.safetyStatus)
	if (safetyStatus === 'BLOCKED') {
		return XICHENG_BLOCKED_ANSWER
	}
	if (safetyStatus === 'UNAVAILABLE') {
		return XICHENG_UNAVAILABLE_ANSWER
	}
	const confidence = Math.round(Number(trigger.confidence || 0) * 100)
	const confirmCopy = trigger.requiresUserConfirm ? '我还需要你确认一下。' : '已达到自动触发阈值。'
	if (trigger.intent === 'route') {
		return `我识别到你可能在「${trigger.poiName}」，置信度约 ${confidence}%。${confirmCopy}可以基于这里继续推荐下一站路线。`
	}
	if (trigger.intent === 'food') {
		return `我识别到当前位置和图片线索关联到「${trigger.poiName}」，置信度约 ${confidence}%。${confirmCopy}可以继续帮你找附近小吃和餐厅。`
	}
	if (trigger.intent === 'record') {
		return `我识别到这张照片关联「${trigger.poiName}」，置信度约 ${confidence}%。${confirmCopy}可以把它加入游记素材，连同经纬度和拍摄时间一起整理。`
	}
	return `我识别到你可能在「${trigger.poiName}」，置信度约 ${confidence}%。${confirmCopy}要不要听一段 30 秒讲解？`
}

const createXunjingTriggerFollowUps = (trigger) => {
	const safetyStatus = normalizeXichengSafetyStatus(trigger && trigger.safetyStatus)
	if (isXichengUnsafeSafetyStatus(safetyStatus)) {
		return []
	}
	if (!trigger || !trigger.poiName) {
		return ['帮我识别这张照片', '我在西城，附近有什么文化点？', '生成一段照片游记']
	}
	if (Array.isArray(trigger.suggestedQuestions) && trigger.suggestedQuestions.length > 0) {
		return trigger.suggestedQuestions.slice(0, 3)
	}
	return [
		`讲讲${trigger.poiName}`,
		`从${trigger.poiName}出发推荐路线`,
		`把${trigger.poiName}写进游记`
	]
}

// 处理跟进问题点击
const handleFollowUpClick = (followUpText) => {
	// 将跟进问题设置为输入框内容
	inputText.value = followUpText
	// 自动发送
	sendMessage()
}

// 发送图片消息
const uploadAndSendImage = async (filePath) => {
	if (historyLoading.value || imageUploading.value) return
	const wasInterrupted = interruptCurrentResponse()
	stopAiSpeech()
	await prepareNextRequestAfterInterrupt(wasInterrupted)
	imageUploading.value = true

	try {
		messages.value.push(createUserMessage({
			content: '',
			images: [filePath]
		}))
		saveMessagesCache()
		scrollToBottom({ immediate: true })

		const assistantMessage = createAssistantMessage()
		messages.value.push(assistantMessage)
		scrollToBottom({ immediate: true })

		let trigger = null
		let content = ''
		let activeRecognitionContext = createEmptyXichengRecognitionContext()
		try {
			trigger = await resolveXichengPhotoTrigger({
				filePath,
				text: inputText.value,
				ocrText: inputText.value
			})
			activeRecognitionContext = applyXichengPhotoTriggerContext(trigger)
			loadXunjingPackageDetail(activeRecognitionContext)
			content = buildXunjingTriggerAssistantContent(trigger)
			recordXunjingResourceEvent({
				eventType: 'MEDIA_USE',
				payload: {
					page: 'ai-guide',
					triggerType: trigger && trigger.triggerType,
					intent: trigger && trigger.intent,
					action: trigger && trigger.action,
					poiCode: trigger && trigger.poiCode,
					poiName: trigger && trigger.poiName,
					confidence: trigger && trigger.confidence,
					sourceCount: activeRecognitionContext.sources.length,
					safetyStatus: activeRecognitionContext.safetyStatus,
					requiresUserConfirm: trigger && trigger.requiresUserConfirm
				}
			})
		} catch (error) {
			console.warn('星河寻境多模态照片识别暂不可用:', error && (error.errMsg || error.message) ? (error.errMsg || error.message) : error)
			activeRecognitionContext = {
				...activeRecognitionContext,
				safetyStatus: 'UNAVAILABLE',
				sources: []
			}
			content = XICHENG_UNAVAILABLE_ANSWER
		}
		commitAssistantMessage(assistantMessage, {
			isPending: false,
			content,
			followUps: createXunjingTriggerFollowUps(trigger),
			sources: activeRecognitionContext.sources,
			safetyStatus: activeRecognitionContext.safetyStatus
		})
		saveMessagesCache()
		uni.showToast({
			title: trigger && trigger.poiName ? '已完成识别' : '已记录照片',
			icon: 'none'
		})
		scrollToBottom({ immediate: true })
	} finally {
		imageUploading.value = false
	}
}

// 选择图片并立即发送
const chooseImage = () => {
	if (historyLoading.value || imageUploading.value) return

	uni.chooseImage({
		count: 1, // 一次只选一张
		sizeType: ['compressed'], // 压缩图
		sourceType: ['album', 'camera'], // 可以从相册选择或拍照
		success: (res) => {
			const filePath = res.tempFilePaths[0]
			uploadAndSendImage(filePath)
		},
		fail: (err) => {
			if (isXunjingUserCancelled(err)) {
				return
			}
			console.error('❌ 选择图片失败:', err)
			uni.showToast({
				title: '选择图片失败',
				icon: 'none'
			})
		}
	})
}

// 发送消息
const sendMessage = async () => {
	// 必须有文字才能发送
	if (!inputText.value.trim() || historyLoading.value || imageUploading.value) return
	const wasInterrupted = interruptCurrentResponse()
	stopAiSpeech()

	const userMessage = inputText.value.trim()

	// 添加用户消息到列表
	messages.value.push(createUserMessage({
		content: userMessage,
		images: []
	}))
	// 清空输入框
	inputText.value = ''
	// 滚动到底部
	scrollToBottom({ immediate: true })
	await prepareNextRequestAfterInterrupt(wasInterrupted)
	// 添加一个空的 AI 消息，用于流式填充
	const assistantMessage = createAssistantMessage()
	messages.value.push(assistantMessage)
	saveMessagesCache()
	scrollToBottom({ immediate: true })

	try {
		const aiResult = await startXunjingAiRequest({
			question: userMessage,
			assistantMessage
		})
		persistXichengAiGuideMaterial({
			question: userMessage,
			result: aiResult,
			assistantMessage
		})
		const askSafetyStatus = normalizeXichengSafetyStatus(aiResult && aiResult.safetyStatus ? aiResult.safetyStatus : xichengAiContext.value.safetyStatus || '')
		recordXunjingResourceEvent({
			eventType: 'ASK',
			payload: {
				page: 'ai-guide',
				questionLength: userMessage.length,
				fallback: Boolean(aiResult && aiResult.fallback),
				sourceCount: aiResult && Array.isArray(aiResult.sources) ? aiResult.sources.length : 0,
				followUpCount: aiResult && Array.isArray(aiResult.followUps) ? aiResult.followUps.length : 0,
				answerLength: aiResult && aiResult.answer ? String(aiResult.answer).length : 0,
				packageCode: xichengAiContext.value.packageCode || XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.aiSceneCode,
				sourceChannel: xichengAiContext.value.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
				regionCode: xichengAiContext.value.regionCode || '',
				poiCode: xichengAiContext.value.poiCode || '',
				poiName: xichengAiContext.value.poiName || '',
				safetyStatus: askSafetyStatus,
				blocked: askSafetyStatus === 'BLOCKED',
				unavailable: askSafetyStatus === 'UNAVAILABLE'
			}
		})
		speakVisibleAssistantReply(assistantMessage, aiResult.answer)
	} catch (error) {
		if (error && error.type === 'INTERRUPTED') {
			return
		}
		console.error('调用 AI 失败:', error)
		recordXunjingResourceEvent({
			eventType: 'ERROR_FEEDBACK',
			payload: {
				page: 'ai-guide',
				category: 'ai_request_failed',
				severity: 'ERROR',
				questionLength: userMessage.length,
				packageCode: xichengAiContext.value.packageCode || XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.aiSceneCode,
				sourceChannel: xichengAiContext.value.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
				regionCode: xichengAiContext.value.regionCode || '',
				poiCode: xichengAiContext.value.poiCode || '',
				poiName: xichengAiContext.value.poiName || '',
				safetyStatus: xichengAiContext.value.safetyStatus || ''
			}
		})

		// 更新错误提示
		commitAssistantMessage(assistantMessage, {
			isPending: false,
			content: '抱歉，我遇到了一些问题，请稍后再试。'
		})
		saveMessagesCache()

		uni.showToast({
			title: '发送失败',
			icon: 'none'
		})
	}
}

const sendInitialQuestion = async (questionText) => {
	const question = String(questionText || '').trim()
	if (!question) return
	if (initialQuestionHandled && initialQuestionHandledText === question) return
	if (hasPendingInitialQuestionInMessages(question)) {
		initialQuestionHandled = true
		initialQuestionHandledText = question
		scheduleHistoryScrollToBottom()
		return
	}
	initialQuestionHandled = true
	initialQuestionHandledText = question
	await loadChatHistory({ preferCache: true })
	if (hasCompletedInitialQuestionInMessages(question)) {
		scheduleHistoryScrollToBottom()
		return
	}
	inputText.value = question
	await nextTick()
	sendMessage()
}

const refreshXichengAiRouteContext = ({ routeOptions: rawRouteOptions = null, preferCache = true } = {}) => {
	const routeOptions = mergeXichengAiRouteOptions(rawRouteOptions || {})
	const routeSignature = createXichengRouteSignature(routeOptions)
	if (KASHGAR_DIARY_GENERATOR_ENABLED && routeOptions.mode === 'diary') {
		xichengAiGuideMode.value = 'chat'
		lastAppliedXichengRouteSignature = routeSignature
		openKashgarDiaryGenerator()
		return null
	}
	xichengAiGuideMode.value = normalizeXichengAiGuideMode(routeOptions.mode)
	xichengPlaybackPaused.value = false
	const previousScope = getActiveXichengCacheScope()
	const context = applyXichengAiContext(routeOptions)
	lastAppliedXichengRouteSignature = routeSignature
	const nextScope = getActiveXichengCacheScope()
	const scopeChanged = previousScope !== nextScope
	const hasInitialQuestion = Boolean(routeOptions.question)
	if (scopeChanged) {
		initialQuestionHandled = false
		initialQuestionHandledText = ''
		messages.value = []
	}
	if (hasXichengAiContext(context)) {
		showKashgarDiaryGenerator.value = false
		showAiCompanionHome.value = false
		if (hasInitialQuestion) {
			sendInitialQuestion(decodeRouteValue(routeOptions.question))
			return context
		}
		const cachedMessages = preferCache && !scopeChanged && !shouldSkipXichengUnsafeMessageCache() ? loadMessagesCache() : []
		if (cachedMessages.length > 0) {
			messages.value = cachedMessages
			scheduleHistoryScrollToBottom()
			return context
		}
		setWelcomeMessage()
		return context
	}
	if (hasInitialQuestion) {
		showAiCompanionHome.value = false
		sendInitialQuestion(decodeRouteValue(routeOptions.question))
		return context
	}
	if (preferCache) {
		const cachedMessages = loadMessagesCache()
		if (cachedMessages.length > 0) {
			messages.value = cachedMessages
			scheduleHistoryScrollToBottom()
		}
	}
	return context
}

const handleXichengH5RouteHashChange = () => {
	const routeOptions = mergeXichengAiRouteOptions()
	const nextRouteSignature = createXichengRouteSignature(routeOptions)
	if (nextRouteSignature && nextRouteSignature === lastAppliedXichengRouteSignature) {
		return
	}
	interruptCurrentResponse({ showStatus: false })
	stopAiSpeech()
	refreshXichengAiRouteContext({ routeOptions, preferCache: true })
}

onShow(() => {
	if (activeStream.value) {
		return
	}
	refreshXichengAiRouteContext({ preferCache: true })
})

onLoad((options = {}) => {
	if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
		window.removeEventListener('hashchange', handleXichengH5RouteHashChange)
		window.addEventListener('hashchange', handleXichengH5RouteHashChange)
	}
	const context = refreshXichengAiRouteContext({ routeOptions: options, preferCache: false }) || xichengAiContext.value
	loadXunjingPackageDetail(context)
	recordXunjingResourceEvent({
		eventType: 'VIEW',
		payload: {
			page: 'ai-guide',
			entryMode: options.mode || '',
			hasInitialQuestion: Boolean(options.question),
			packageCode: context.packageCode || XICHENG_REGION_CONFIG.packageCode,
			sceneCode: context.sceneCode || XICHENG_REGION_CONFIG.aiSceneCode,
			sourceChannel: context.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
			regionCode: context.regionCode || '',
			poiCode: context.poiCode || '',
			poiName: context.poiName || '',
			safetyStatus: context.safetyStatus || '',
			companionName: context.companionName || XICHENG_REGION_CONFIG.companionName
		}
	})
	if (KASHGAR_DIARY_GENERATOR_ENABLED && options.mode === 'diary') {
		return
	}
	if (!hasXichengAiContext(context) && !options.question) {
		loadChatHistory({ preferCache: true })
	}
})

onReady(() => {
	scheduleHistoryScrollToBottom()
})

onUnload(() => {
	if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
		window.removeEventListener('hashchange', handleXichengH5RouteHashChange)
	}
	clearPendingUiTimers()
	destroyAiSpeech()
	saveMessagesCache()
})
</script>

<style scoped src="./ai-guide-base.css"></style>
<style scoped src="./ai-guide-kashgar-diary.css"></style>
<style scoped src="./ai-guide-kashgar-home.css"></style>
<style scoped src="./ai-guide-chat.css"></style>
<style scoped src="./ai-guide-xicheng-chat.css"></style>
