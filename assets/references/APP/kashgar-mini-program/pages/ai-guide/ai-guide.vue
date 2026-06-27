<template>
	<view class="container">
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

		<view v-else class="ai-chat-shell">
		<!-- 背景图 -->
		<image class="bg-image" :src="BG_IMAGE" mode="aspectFill"></image>

		<!-- 自定义导航栏 -->
		<custom-nav
			title="AI小导游"
			:left-icon="UrlImg + '/baidu_map/weatch/images/left.png'"
			background-color="#FFFFFF"
			@leftClick="goBack"
			@navHeight="handleNavHeight"
		/>

		<!-- 清空历史按钮 -->
		<view class="clear-history-btn" @click="clearChatHistory">
			<text class="clear-icon">🗑️</text>
		</view>

		<!-- 页面内容 -->
		<view class="content">
			<!-- 聊天消息列表 -->
			<view
				class="chat-list"
				:style="{ paddingTop: chatListPaddingTop }"
			>
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
								<image class="ai-avatar-image" :src="AI_AVATAR" mode="aspectFill"></image>
							</view>
							<!-- 内容为空时显示加载动画 -->
							<view v-if="msg.isPending && !msg.content" class="message-content ai-content loading-content">
								<text class="loading-dot">·</text>
								<text class="loading-dot">·</text>
								<text class="loading-dot">·</text>
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
								<text class="message-source-title">{{ source.title || source.name || '审核来源' }}</text>
								<text v-if="source.excerpt || source.summary || source.url" class="message-source-desc">
									{{ source.excerpt || source.summary || source.url }}
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
import { resolveXunjingPhotoTrigger } from '@/request/xunjingMultimodal.js'
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'

const UrlImg = config.UrlImg
const BG_IMAGE = 'https://www.neoxiake.com//upload/admin/20260527/f0405d5a04cbe38494795727956523d4.png'
const AI_AVATAR = 'https://www.neoxiake.com//upload/admin/20260526/e32b5647748751716be8f7eca54ef57f.png'
const KASHGAR_AI_COMPANION_HOME_ENABLED = true
const KASHGAR_DIARY_GENERATOR_ENABLED = true
const XICHENG_BLOCKED_ANSWER = '无已审核来源，不能回答'

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

// 响应式数据
const showKashgarDiaryGenerator = ref(false)
const showAiCompanionHome = ref(KASHGAR_AI_COMPANION_HOME_ENABLED)
const activeKashgarDiaryMode = ref('family')
const kashgarDiaryElements = [
	{ icon: '▣', name: '喀什古城' },
	{ icon: '◉', name: '老茶馆' },
	{ icon: '⌾', name: '鸽子广场' },
	{ icon: '◌', name: '烤包子' }
]
const kashgarDiaryModes = [
	{ key: 'family', icon: '♟', title: '亲子游记' },
	{ key: 'moments', icon: '◐', title: '朋友圈' },
	{ key: 'redbook', icon: '▣', title: '小红书' },
	{ key: 'album', icon: '▤', title: '旅行纪念页' }
]
const kashgarDiaryStats = [
	{ icon: '⌾', value: '5个', label: '景点' },
	{ icon: '▧', value: '20张', label: '照片' },
	{ icon: '▣', value: '3天2晚', label: '' }
]
const kashgarDiaryChecklist = [
	'行程亮点提炼',
	'亲子视角故事',
	'朋友圈文案',
	'小红书图文笔记',
	'旅行纪念页排版',
	'PDF纪念册'
]
const aiCompanionActions = [
	{
		key: 'listen',
		title: '听讲解',
		iconClass: 'kashgar-ai-action-listen',
		question: '给我讲讲喀什古城的历史故事'
	},
	{
		key: 'guide',
		title: '看攻略',
		iconClass: 'kashgar-ai-action-guide',
		question: '推荐一条喀什古城半日游攻略'
	},
	{
		key: 'places',
		title: '找打卡地',
		iconClass: 'kashgar-ai-action-place',
		target: 'map'
	},
	{
		key: 'question',
		title: '问问题',
		iconClass: 'kashgar-ai-action-question',
		question: ''
	}
]
const aiCompanionQuestions = [
	'喀什古城有什么历史故事？',
	'适合带孩子游玩的路线推荐',
	'喀什有哪些特色美食不能错过？',
	'喀什拍照打卡地有哪些？',
	'喀什古城晚上有哪些好玩的地方？'
]
const defaultAiCompanionPlaces = [
	{
		badge: 'TOP1',
		title: '高台民居',
		desc: '俯瞰古城全景',
		cover: '/static/kashgar/ai-place-gaotai.png',
		question: '高台民居怎么玩最值得？'
	},
	{
		badge: 'TOP2',
		title: '百年老茶馆',
		desc: '品茗古茶时光',
		cover: '/static/kashgar/ai-place-tea.png',
		question: '喀什老茶馆有什么体验？'
	},
	{
		badge: 'TOP3',
		title: '喀什老街巷',
		desc: '漫步古城老街',
		cover: '/static/kashgar/ai-place-oldstreet.png',
		question: '喀什老街巷适合怎么逛？'
	}
]
const aiCompanionPlaces = ref(defaultAiCompanionPlaces)
const messages = ref([])
const inputText = ref('')
const historyLoading = ref(false)
const imageUploading = ref(false)
const conversationId = ref('')
const isStreaming = ref(false)
const navBarHeight = ref(44)
const chatListPaddingTop = computed(() => `${navBarHeight.value + 10}px`)
const xichengAiContext = ref({
	regionCode: '',
	packageCode: '',
	poiCode: '',
	poiName: '',
	companionName: '',
	confidence: ''
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
let speechAudioContext = null
let speechRequestSeed = 0
let speechFileSeed = 0
let speechQueue = []
let speechQueuePlaying = false
const activeStream = ref(null)

const createMessageId = () => `msg_${Date.now()}_${messageSeed++}`
const createWelcomeMessage = () => ({
	id: createMessageId(),
	role: 'assistant',
	content: hasXichengAiContext()
		? `你好，我是${xichengAiContext.value.companionName || XICHENG_REGION_CONFIG.companionName}，可以继续帮你讲解西城文化点、推荐路线或生成游记草稿。`
		: '您好！我是AI小导游，有什么可以帮助您的吗？',
	images: [],
	followUps: [],
	sources: [],
	safetyStatus: '',
	isPending: false,
	interrupted: false,
	hasSpoken: false
})
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

const normalizeCachedMessages = (list) => {
	if (!Array.isArray(list)) return []
	return list
		.filter(item => item && (item.role === 'user' || item.role === 'assistant'))
		.filter(item => !(item.role === 'assistant' && item.isPending && !item.content))
		.map(item => ({
			id: item.id || createMessageId(),
			role: item.role,
			content: item.content || '',
			images: Array.isArray(item.images) ? item.images : [],
			followUps: Array.isArray(item.followUps) ? item.followUps : [],
			sources: Array.isArray(item.sources) ? item.sources : [],
			safetyStatus: item.safetyStatus || '',
			isPending: false,
			interrupted: Boolean(item.interrupted)
		}))
}

const saveMessagesCache = () => {
	uni.setStorageSync(CHAT_CACHE_KEY, normalizeCachedMessages(messages.value))
}

const loadMessagesCache = () => normalizeCachedMessages(uni.getStorageSync(CHAT_CACHE_KEY) || [])

const setWelcomeMessage = () => {
	const welcomeMessage = createWelcomeMessage()
	messages.value = [welcomeMessage]
	saveMessagesCache()
	scrollToBottom({ immediate: true })
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

const decodeRouteValue = (value = '') => {
	try {
		return decodeURIComponent(String(value || ''))
	} catch (error) {
		return String(value || '')
	}
}

const normalizeXichengAiContext = (options = {}) => ({
	regionCode: decodeRouteValue(options.regionCode),
	packageCode: decodeRouteValue(options.packageCode),
	poiCode: decodeRouteValue(options.poiCode),
	poiName: decodeRouteValue(options.poiName),
	companionName: decodeRouteValue(options.companionName),
	confidence: decodeRouteValue(options.confidence)
})

const applyXichengAiContext = (options = {}) => {
	const context = normalizeXichengAiContext(options)
	if (context.regionCode !== XICHENG_REGION_CONFIG.regionCode && !context.poiCode && !context.poiName) {
		xichengAiContext.value = {
			regionCode: '',
			packageCode: '',
			poiCode: '',
			poiName: '',
			companionName: '',
			confidence: ''
		}
		return xichengAiContext.value
	}
	xichengAiContext.value = {
		regionCode: context.regionCode || XICHENG_REGION_CONFIG.regionCode,
		packageCode: context.packageCode || XICHENG_REGION_CONFIG.packageCode,
		poiCode: context.poiCode,
		poiName: context.poiName,
		companionName: context.companionName || XICHENG_REGION_CONFIG.companionName,
		confidence: context.confidence
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

const buildXichengContextQuestion = (question = '', context = xichengAiContext.value) => {
	if (!hasXichengAiContext(context)) {
		return question
	}
	const poiText = context.poiName ? `识别地点：${context.poiName}。` : ''
	const confidenceText = context.confidence ? `识别置信度：${context.confidence}。` : ''
	return `你是${context.companionName || XICHENG_REGION_CONFIG.companionName}，服务北京西城试运营路线。${poiText}${confidenceText}用户问题：${question}`
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

const requestXunjingPackageDetail = () => {
	return new Promise((resolve, reject) => {
		uni.request({
			url: buildYudaoAppApiUrl(XUNJING_RESOURCE_CONFIG.apiPath),
			method: 'GET',
			data: {
				packageCode: XUNJING_RESOURCE_CONFIG.packageCode
			},
			header: {
				'tenant-id': XUNJING_RESOURCE_CONFIG.tenantId
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

const requestXunjingResourceEvent = ({ eventType = 'VIEW', payload = {} } = {}) => {
	return new Promise((resolve, reject) => {
		uni.request({
			url: buildYudaoAppApiUrl(XUNJING_EVENT_CONFIG.apiPath),
			method: 'POST',
			header: {
				'Content-Type': 'application/json',
				'tenant-id': XUNJING_EVENT_CONFIG.tenantId
			},
			data: {
				packageCode: XUNJING_EVENT_CONFIG.packageCode,
				eventType,
				sourceChannel: XUNJING_EVENT_CONFIG.sourceChannel,
				userTraceId: getUserTraceId(),
				payloadJson: JSON.stringify(payload)
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
	requestXunjingResourceEvent(options).catch((error) => {
		console.warn('星河寻境事件回传暂不可用:', error && (error.errMsg || error.message) ? (error.errMsg || error.message) : error)
	})
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

let xunjingPackageDetailRequested = false
const loadXunjingPackageDetail = async () => {
	if (xunjingPackageDetailRequested) {
		return
	}
	xunjingPackageDetailRequested = true
	try {
		const detail = await requestXunjingPackageDetail()
		applyXunjingPackageDetail(detail)
	} catch (error) {
		console.warn('星河寻境资源包接口暂不可用，继续使用本地喀什内容:', error && (error.errMsg || error.message) ? (error.errMsg || error.message) : error)
	}
}

const normalizeXunjingAiResponse = (res) => {
	if (res && res.data && res.data.code !== undefined && Number(res.data.code) !== 0) {
		throw new Error(res.data.msg || res.data.message || `星河寻境AI接口异常:${res.data.code}`)
	}
	const body = res && res.data ? res.data : {}
	const payload = body && body.data && typeof body.data === 'object' ? body.data : body
	const sources = payload && Array.isArray(payload.sources) ? payload.sources : []
	const suggestedQuestions = payload && Array.isArray(payload.suggestedQuestions)
		? payload.suggestedQuestions
		: payload && Array.isArray(payload.recommendedQuestions)
			? payload.recommendedQuestions
			: []
	const safetyStatus = payload && payload.safetyStatus ? String(payload.safetyStatus) : ''
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
	const poiName = context.poiName || '西城文化点'
	const normalizedQuestion = String(question || '').trim()
	const topic = normalizedQuestion.includes('路线') || normalizedQuestion.includes('攻略')
		? '路线'
		: normalizedQuestion.includes('游记') || normalizedQuestion.includes('记录')
			? '游记'
			: '讲解'
	const answer = topic === '路线'
		? `我是${context.companionName || XICHENG_REGION_CONFIG.companionName}。先按西城试运营资料为你推荐：从${poiName}出发，可以串联周边历史街巷、博物馆或水系空间，控制在 1.5 到 2.5 小时，适合边走边听讲解并完成路线护照打卡。`
		: topic === '游记'
			? `我是${context.companionName || XICHENG_REGION_CONFIG.companionName}。我可以先把${poiName}作为今天的游记素材，补上识别地点、讲解要点、亲子观察任务和分享海报标题，后续再合并路线记录生成草稿。`
			: `我是${context.companionName || XICHENG_REGION_CONFIG.companionName}。先按西城本地导览资料讲解：${poiName}可以从历史沿革、建筑细节、街区生活和亲子研学观察四个角度来听。现场可以先看门头、碑刻或说明牌，再继续问我“下一站去哪”。`
	return {
		fallback: true,
		answer,
		sources: [],
		followUps: [
			`讲讲${poiName}`,
			`从${poiName}出发推荐路线`,
			`把${poiName}写进游记草稿`
		]
	}
}

const createLocalXunjingAiFallback = (question = '', context = xichengAiContext.value) => {
	return hasXichengAiContext(context)
		? createLocalXichengAiFallback(question, context)
		: createLocalKashgarAiFallback(question)
}

const createSourceFollowUps = (sources = []) => sources
	.filter(source => source && source.title)
	.slice(0, 3)
	.map(source => source.title)

const createXunjingResultFollowUps = (result = {}) => {
	const suggestedQuestions = result && Array.isArray(result.suggestedQuestions) ? result.suggestedQuestions : []
	if (suggestedQuestions.length > 0) {
		return suggestedQuestions.slice(0, 3)
	}
	return createSourceFollowUps(result && result.sources ? result.sources : [])
}

const requestXunjingAiChat = (question) => {
	let requestTask = null
	const context = xichengAiContext.value || {}
	const requestQuestion = buildXichengContextQuestion(question, context)
	const requestPayload = {
		packageCode: XUNJING_AI_CONFIG.packageCode,
		question: requestQuestion,
		sceneCode: XUNJING_AI_CONFIG.sceneCode,
		sourceChannel: XUNJING_AI_CONFIG.sourceChannel,
		userTraceId: getUserTraceId()
	}
	if (hasXichengAiContext(context)) {
		requestPayload.packageCode = context.packageCode || XICHENG_REGION_CONFIG.packageCode
		requestPayload.regionCode = context.regionCode || XICHENG_REGION_CONFIG.regionCode
		requestPayload.sceneCode = XICHENG_REGION_CONFIG.aiSceneCode
		requestPayload.poiCode = context.poiCode
		requestPayload.poiName = context.poiName
		requestPayload.companionName = context.companionName || XICHENG_REGION_CONFIG.companionName
		requestPayload.recognitionConfidence = context.confidence || ''
	}
	const pendingRequest = new Promise((resolve, reject) => {
		requestTask = uni.request({
			url: buildYudaoAppApiUrl(XUNJING_AI_CONFIG.apiPath),
			method: 'POST',
			header: {
				'Content-Type': 'application/json',
				'tenant-id': XUNJING_AI_CONFIG.tenantId
			},
			data: requestPayload,
			success: (res) => {
				if (res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
					resolve({
						...createLocalXunjingAiFallback(question, context),
						statusCode: res && res.statusCode,
						fallback: true
					})
					return
				}
				try {
					resolve(normalizeXunjingAiResponse(res))
				} catch (error) {
					resolve({
						...createLocalXunjingAiFallback(question, context),
						errorMessage: error && error.message ? error.message : '',
						fallback: true
					})
				}
			},
			fail: (error) => {
				if (isAbortError(error)) {
					reject(error)
					return
				}
				resolve({
					...createLocalXunjingAiFallback(question, context),
					errorMessage: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : '',
					fallback: true
				})
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
			uni.removeStorageSync(CONVERSATION_KEY)
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
				if (result && result.safetyStatus === 'BLOCKED') {
					appendAnswerContent(state, XICHENG_BLOCKED_ANSWER)
					state.followUps = []
					state.sources = result.sources || []
					state.safetyStatus = 'BLOCKED'
					state.streamFinished = true
					flushStreamContent(state)
					commitAssistantMessage(assistantMessage, {
						isPending: false,
						followUps: [],
						sources: result.sources,
						safetyStatus: 'BLOCKED'
					})
					saveMessagesCache()
					clearActiveStreamIfMatch(requestController.id)
					settleRequest(() => resolve({
						answer: state.fullContent,
						followUps: [],
						sources: result.sources,
						safetyStatus: 'BLOCKED'
					}))
					return
				}
				if (result && result.fallback) {
					appendAnswerContent(state, result.answer)
					state.followUps = result.followUps || []
					state.sources = result.sources || []
					state.streamFinished = true
					flushStreamContent(state)
					commitAssistantMessage(assistantMessage, {
						isPending: false,
						followUps: result.followUps || [],
						sources: result.sources || [],
						safetyStatus: result.safetyStatus || ''
					})
					saveMessagesCache()
					clearActiveStreamIfMatch(requestController.id)
					settleRequest(() => resolve({ answer: state.fullContent, followUps: state.followUps, sources: state.sources, fallback: true }))
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
			commitAssistantMessage(assistantMessage, { isPending: false })
			cancelStreamContentRender(state)
			saveMessagesCache()
			clearActiveStreamIfMatch(requestController.id)
			settleRequest(() => reject(new Error('AI响应超时')))
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

// 加载历史对话记录
const loadChatHistory = async ({ preferCache = false } = {}) => {
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
				uni.removeStorageSync(CONVERSATION_KEY)
				uni.removeStorageSync(CHAT_CACHE_KEY)
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

// 返回上一页
const goBack = () => {
	if (showKashgarDiaryGenerator.value) {
		showKashgarDiaryGenerator.value = false
		showAiCompanionHome.value = true
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
			url: '/pages/index/index'
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
	if (!trigger || !trigger.poiName) {
		return ['帮我识别这张照片', '我在西城，附近有什么文化点？', '生成一段照片游记']
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
		try {
			trigger = await resolveXunjingPhotoTrigger({
				filePath,
				text: inputText.value,
				ocrText: inputText.value
			})
			content = buildXunjingTriggerAssistantContent(trigger)
			recordXunjingResourceEvent({
				eventType: 'MEDIA_USE',
				payload: {
					page: 'ai-guide',
					triggerType: trigger && trigger.triggerType,
					intent: trigger && trigger.intent,
					action: trigger && trigger.action,
					poiCode: trigger && trigger.poiCode,
					confidence: trigger && trigger.confidence,
					requiresUserConfirm: trigger && trigger.requiresUserConfirm
				}
			})
		} catch (error) {
			console.warn('星河寻境多模态照片识别暂不可用:', error && (error.errMsg || error.message) ? (error.errMsg || error.message) : error)
			content = '照片已收到，但当前多模态识别接口暂不可用。你可以先描述图片里的地名、门头或文物说明牌，我会继续帮你识别并生成讲解。'
		}
		commitAssistantMessage(assistantMessage, {
			isPending: false,
			content,
			followUps: createXunjingTriggerFollowUps(trigger)
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
			console.log('✅ 已选择图片:', filePath)
			uploadAndSendImage(filePath)
		},
		fail: (err) => {
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
		recordXunjingResourceEvent({
			eventType: 'ASK',
			payload: {
				page: 'ai-guide',
				questionLength: userMessage.length,
				fallback: Boolean(aiResult && aiResult.fallback),
				sourceCount: aiResult && Array.isArray(aiResult.sources) ? aiResult.sources.length : 0,
				followUpCount: aiResult && Array.isArray(aiResult.followUps) ? aiResult.followUps.length : 0,
				regionCode: xichengAiContext.value.regionCode || '',
				poiCode: xichengAiContext.value.poiCode || ''
			}
		})
		speakVisibleAssistantReply(assistantMessage, aiResult.answer)
	} catch (error) {
		if (error && error.type === 'INTERRUPTED') {
			return
		}
		console.error('调用 AI 失败:', error)

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
	if (initialQuestionHandled) return
	const question = String(questionText || '').trim()
	if (!question) return
	initialQuestionHandled = true
	await loadChatHistory({ preferCache: true })
	inputText.value = question
	await nextTick()
	sendMessage()
}

onShow(() => {
	if (activeStream.value) {
		return
	}
	const cachedMessages = loadMessagesCache()
	if (cachedMessages.length > 0) {
		messages.value = cachedMessages
		scheduleHistoryScrollToBottom()
	}
})

onLoad((options = {}) => {
	const context = applyXichengAiContext(options)
	loadXunjingPackageDetail()
	recordXunjingResourceEvent({
		eventType: 'VIEW',
		payload: {
			page: 'ai-guide',
			entryMode: options.mode || '',
			hasInitialQuestion: Boolean(options.question),
			regionCode: context.regionCode || '',
			poiCode: context.poiCode || ''
		}
	})
	if (KASHGAR_DIARY_GENERATOR_ENABLED && options.mode === 'diary') {
		openKashgarDiaryGenerator()
		return
	}
	if (hasXichengAiContext(context) && !options.question) {
		showKashgarDiaryGenerator.value = false
		showAiCompanionHome.value = false
		setWelcomeMessage()
		return
	}
	if (!options.question) return
	showAiCompanionHome.value = false
	sendInitialQuestion(decodeURIComponent(options.question))
})

onReady(() => {
	scheduleHistoryScrollToBottom()
})

onUnload(() => {
	clearPendingUiTimers()
	destroyAiSpeech()
	saveMessagesCache()
})

// 页面加载时加载历史对话
loadChatHistory({ preferCache: true })
</script>

<style scoped>
.kashgar-diary-generator {
	position: relative;
	min-height: 100vh;
	padding: 32rpx 28rpx 34rpx;
	box-sizing: border-box;
	overflow: hidden;
	background: linear-gradient(180deg, #FFF7EA 0%, #FFF1DF 42%, #FFFDF8 100%);
	color: #3D281A;
	font-family: "PingFang SC", "Songti SC", sans-serif;
}

.kashgar-diary-bg {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	height: 270rpx;
	background:
		linear-gradient(180deg, rgba(255, 246, 231, 0.2), rgba(255, 246, 231, 0.92)),
		url('/static/kashgar/home-top-mountains.png') center top / cover no-repeat;
	opacity: 0.72;
	pointer-events: none;
}

.kashgar-diary-topbar {
	position: relative;
	z-index: 2;
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 72rpx;
}

.kashgar-diary-brand {
	display: flex;
	align-items: center;
	gap: 12rpx;
	min-width: 0;
}

.kashgar-diary-logo {
	width: 54rpx;
	height: 54rpx;
	border-radius: 18rpx;
	background: linear-gradient(135deg, #CB8C30, #E9BE68);
	color: #FFFFFF;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	font-weight: 900;
	box-shadow: 0 8rpx 16rpx rgba(145, 92, 39, 0.16);
}

.kashgar-diary-brand-copy {
	display: flex;
	flex-direction: column;
	gap: 3rpx;
}

.kashgar-diary-brand-name {
	color: #2B2118;
	font-size: 28rpx;
	line-height: 32rpx;
	font-weight: 900;
	letter-spacing: 0;
}

.kashgar-diary-brand-sub {
	color: #4D3F32;
	font-size: 20rpx;
	line-height: 24rpx;
	font-weight: 700;
}

.kashgar-diary-capsule {
	width: 126rpx;
	height: 58rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.72);
	border: 1rpx solid rgba(83, 56, 26, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	color: #14110E;
	font-size: 26rpx;
	box-shadow: 0 8rpx 20rpx rgba(73, 51, 26, 0.06);
}

.kashgar-diary-capsule-line {
	width: 1rpx;
	height: 34rpx;
	background: rgba(62, 47, 31, 0.16);
}

.kashgar-diary-ring {
	font-size: 38rpx;
	line-height: 38rpx;
	font-weight: 800;
}

.kashgar-diary-heading {
	position: relative;
	z-index: 2;
	margin-top: 6rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
	text-align: center;
}

.kashgar-diary-title {
	font-family: "Songti SC", "STSong", serif;
	color: #3B281C;
	font-size: 44rpx;
	line-height: 52rpx;
	font-weight: 900;
	letter-spacing: 0;
	white-space: nowrap;
}

.kashgar-diary-subtitle {
	color: #7D7369;
	font-size: 22rpx;
	line-height: 28rpx;
	white-space: nowrap;
}

.kashgar-diary-hero {
	position: relative;
	z-index: 2;
	margin-top: 22rpx;
	height: 370rpx;
	border-radius: 20rpx;
	overflow: hidden;
	background: #E8C899;
	border: 4rpx solid rgba(255, 255, 255, 0.88);
	box-shadow: 0 16rpx 32rpx rgba(110, 74, 38, 0.12);
}

.kashgar-diary-hero-image {
	width: 100%;
	height: 100%;
}

.kashgar-diary-elements {
	position: relative;
	z-index: 2;
	margin-top: 14rpx;
	height: 68rpx;
	padding: 0 18rpx;
	border-radius: 18rpx;
	background: rgba(255, 255, 255, 0.82);
	border: 1rpx solid rgba(212, 164, 92, 0.18);
	box-shadow: 0 10rpx 22rpx rgba(105, 76, 43, 0.07);
	display: flex;
	align-items: center;
	gap: 12rpx;
	box-sizing: border-box;
	overflow: hidden;
}

.kashgar-diary-elements-head {
	width: 132rpx;
	display: flex;
	align-items: center;
	gap: 6rpx;
	color: #5E4736;
	font-size: 18rpx;
	line-height: 22rpx;
	font-weight: 800;
	flex-shrink: 0;
}

.kashgar-diary-spark {
	color: #C98C35;
	font-size: 28rpx;
	line-height: 28rpx;
}

.kashgar-diary-element {
	height: 48rpx;
	min-width: 110rpx;
	padding: 0 14rpx;
	border-radius: 999rpx;
	background: #FFF3DD;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 7rpx;
	color: #3D281A;
	font-size: 21rpx;
	font-weight: 800;
	box-sizing: border-box;
	flex-shrink: 0;
}

.kashgar-diary-element-icon {
	color: #8E642E;
	font-size: 24rpx;
}

.kashgar-diary-mode-tabs {
	position: relative;
	z-index: 2;
	margin-top: 14rpx;
	height: 70rpx;
	padding: 8rpx 14rpx;
	border-radius: 22rpx;
	background: rgba(255, 255, 255, 0.82);
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 10rpx;
	box-sizing: border-box;
	box-shadow: 0 10rpx 22rpx rgba(105, 76, 43, 0.07);
}

.kashgar-diary-mode {
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	color: #6E6258;
	font-size: 22rpx;
	font-weight: 800;
	white-space: nowrap;
}

.kashgar-diary-mode-active {
	background: #EDF7EF;
	color: #29A977;
}

.kashgar-diary-mode-icon {
	font-size: 25rpx;
}

.kashgar-diary-content-grid {
	position: relative;
	z-index: 2;
	margin-top: 14rpx;
	display: grid;
	grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
	gap: 14rpx;
}

.kashgar-diary-preview,
.kashgar-diary-complete {
	min-width: 0;
	border-radius: 22rpx;
	background: rgba(255, 253, 248, 0.9);
	border: 1rpx solid rgba(211, 154, 66, 0.34);
	box-shadow: 0 14rpx 28rpx rgba(105, 76, 43, 0.08);
	box-sizing: border-box;
}

.kashgar-diary-preview {
	padding: 20rpx 20rpx 16rpx;
}

.kashgar-diary-preview-kicker {
	display: flex;
	align-items: center;
	gap: 14rpx;
	color: #8F8274;
	font-size: 20rpx;
	line-height: 28rpx;
	white-space: nowrap;
}

.kashgar-diary-preview-kicker text:first-child {
	height: 42rpx;
	padding: 0 18rpx;
	border-radius: 999rpx;
	background: #30A979;
	color: #FFFFFF;
	font-size: 22rpx;
	line-height: 42rpx;
	font-weight: 900;
}

.kashgar-diary-preview-title {
	display: block;
	margin-top: 14rpx;
	font-family: "Songti SC", "STSong", serif;
	color: #51321E;
	font-size: 37rpx;
	line-height: 46rpx;
	font-weight: 900;
	letter-spacing: 0;
}

.kashgar-diary-preview-copy {
	display: block;
	margin-top: 12rpx;
	color: #5F4D3C;
	font-size: 20rpx;
	line-height: 30rpx;
}

.kashgar-diary-preview-line {
	margin: 13rpx 0 12rpx;
	border-top: 2rpx dashed rgba(195, 142, 72, 0.34);
}

.kashgar-diary-stats {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 4rpx;
}

.kashgar-diary-stat {
	min-width: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 5rpx;
	color: #4C3522;
	font-size: 20rpx;
	font-weight: 800;
	white-space: nowrap;
}

.kashgar-diary-stat-icon {
	color: #8C612E;
	font-size: 28rpx;
	line-height: 28rpx;
}

.kashgar-diary-complete {
	position: relative;
	padding: 22rpx 18rpx 14rpx;
	overflow: hidden;
}

.kashgar-diary-complete-title {
	display: block;
	color: #2F241B;
	font-size: 26rpx;
	line-height: 32rpx;
	font-weight: 900;
	white-space: nowrap;
}

.kashgar-diary-check-list {
	position: relative;
	z-index: 2;
	margin-top: 14rpx;
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}

.kashgar-diary-check {
	display: flex;
	align-items: center;
	gap: 12rpx;
	color: #3F352B;
	font-size: 20rpx;
	line-height: 25rpx;
	font-weight: 700;
	white-space: nowrap;
}

.kashgar-diary-check-dot {
	width: 26rpx;
	height: 26rpx;
	border-radius: 50%;
	background: #31A979;
	color: #FFFFFF;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 18rpx;
	line-height: 26rpx;
	flex-shrink: 0;
}

.kashgar-diary-mascot {
	position: absolute;
	right: -14rpx;
	bottom: -6rpx;
	width: 150rpx;
	height: 164rpx;
}

.kashgar-diary-actions {
	position: relative;
	z-index: 2;
	margin: 16rpx 20rpx 0;
	display: grid;
	grid-template-columns: 0.84fr 1.16fr;
	gap: 24rpx;
}

.kashgar-diary-action {
	height: 66rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	font-size: 29rpx;
	line-height: 66rpx;
	font-weight: 900;
	box-sizing: border-box;
	box-shadow: 0 12rpx 24rpx rgba(105, 76, 43, 0.11);
}

.kashgar-diary-action-secondary {
	background: rgba(255, 252, 245, 0.9);
	border: 2rpx solid rgba(151, 103, 42, 0.5);
	color: #8A5D29;
}

.kashgar-diary-action-primary {
	background: linear-gradient(180deg, #B98037, #966221);
	border: 2rpx solid rgba(255, 242, 216, 0.66);
	color: #FFFFFF;
}

.kashgar-diary-footnote {
	position: relative;
	z-index: 2;
	display: block;
	margin-top: 12rpx;
	color: #987F61;
	font-size: 21rpx;
	line-height: 28rpx;
	text-align: center;
}

.kashgar-ai-home {
	position: relative;
	min-height: 100vh;
	padding: 0 28rpx 240rpx;
	box-sizing: border-box;
	background: linear-gradient(180deg, #FBF4E8 0%, #FFF8ED 42%, #F7EFE4 100%);
	overflow: hidden;
}

.kashgar-ai-home::before {
	content: '';
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	height: 260rpx;
	background: linear-gradient(180deg, rgba(226, 203, 169, 0.34), rgba(255, 248, 238, 0));
	pointer-events: none;
}

.kashgar-ai-topbar {
	position: relative;
	z-index: 2;
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 76rpx;
	padding-top: 14rpx;
}

.kashgar-ai-clock {
	font-size: 30rpx;
	line-height: 38rpx;
	font-weight: 800;
	color: #111111;
}

.kashgar-ai-capsule {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 20rpx;
	width: 148rpx;
	height: 56rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.76);
	border: 1rpx solid rgba(123, 91, 55, 0.12);
}

.kashgar-ai-dot {
	font-size: 28rpx;
	line-height: 28rpx;
	font-weight: 900;
	color: #201A15;
	letter-spacing: 2rpx;
}

.kashgar-ai-capsule-line {
	width: 1rpx;
	height: 34rpx;
	background: rgba(64, 47, 32, 0.18);
}

.kashgar-ai-circle {
	width: 30rpx;
	height: 30rpx;
	box-sizing: border-box;
	border: 7rpx solid #111111;
	border-radius: 50%;
}

.kashgar-ai-title-row {
	position: relative;
	z-index: 2;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 92rpx;
}

.kashgar-ai-mountain {
	position: absolute;
	left: 60rpx;
	top: 8rpx;
	width: 180rpx;
	height: 68rpx;
	opacity: 0.34;
	background: linear-gradient(135deg, transparent 38%, rgba(152, 116, 72, 0.28) 39%, transparent 41%);
}

.kashgar-ai-title {
	font-size: 42rpx;
	line-height: 56rpx;
	font-weight: 900;
	color: #2E1E13;
	letter-spacing: 0;
}

.kashgar-ai-hero {
	position: relative;
	z-index: 2;
	height: 410rpx;
	border-radius: 28rpx;
	overflow: hidden;
	background: #E7CDA8;
	box-shadow: 0 18rpx 42rpx rgba(99, 67, 31, 0.14);
}

.kashgar-ai-hero-image {
	width: 100%;
	height: 100%;
	display: block;
}

.kashgar-ai-hero-button {
	position: absolute;
	right: 28rpx;
	bottom: 34rpx;
	display: flex;
	align-items: center;
	gap: 14rpx;
	min-width: 210rpx;
	height: 58rpx;
	padding: 0 26rpx;
	box-sizing: border-box;
	border-radius: 999rpx;
	background: rgba(255, 251, 242, 0.94);
	color: #6A421E;
	font-size: 26rpx;
	font-weight: 800;
	box-shadow: 0 10rpx 24rpx rgba(79, 51, 24, 0.16);
}

.kashgar-ai-chat-icon {
	position: relative;
	width: 28rpx;
	height: 22rpx;
	border: 4rpx solid #81572D;
	border-radius: 8rpx;
	box-sizing: border-box;
}

.kashgar-ai-chat-icon::after {
	content: '';
	position: absolute;
	left: 5rpx;
	bottom: -8rpx;
	width: 10rpx;
	height: 10rpx;
	border-left: 4rpx solid #81572D;
	border-bottom: 4rpx solid #81572D;
	transform: rotate(-35deg);
}

.kashgar-ai-action-panel {
	position: relative;
	z-index: 3;
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 12rpx;
	margin: -24rpx 8rpx 0;
	padding: 20rpx 18rpx;
	border-radius: 26rpx;
	background: rgba(255, 252, 247, 0.96);
	box-shadow: 0 14rpx 38rpx rgba(104, 69, 35, 0.12);
}

.kashgar-ai-action {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	color: #6B421F;
	font-size: 24rpx;
	font-weight: 800;
}

.kashgar-ai-action-icon {
	position: relative;
	width: 44rpx;
	height: 44rpx;
	color: #8A5D2E;
}

.kashgar-ai-action-listen {
	box-sizing: border-box;
	border: 5rpx solid #8A5D2E;
	border-radius: 50%;
}

.kashgar-ai-action-listen::before,
.kashgar-ai-action-listen::after {
	content: '';
	position: absolute;
	top: 18rpx;
	width: 10rpx;
	height: 26rpx;
	border-radius: 8rpx;
	background: #8A5D2E;
}

.kashgar-ai-action-listen::before {
	left: -8rpx;
}

.kashgar-ai-action-listen::after {
	right: -8rpx;
}

.kashgar-ai-action-guide {
	box-sizing: border-box;
	border: 4rpx solid #8A5D2E;
	border-radius: 6rpx;
}

.kashgar-ai-action-guide::before {
	content: '';
	position: absolute;
	left: 21rpx;
	top: -4rpx;
	bottom: -4rpx;
	width: 4rpx;
	background: #8A5D2E;
}

.kashgar-ai-action-place {
	box-sizing: border-box;
	width: 42rpx;
	height: 42rpx;
	margin-top: 2rpx;
	border: 7rpx solid #8A5D2E;
	border-radius: 50% 50% 50% 0;
	transform: rotate(-45deg);
}

.kashgar-ai-action-place::after {
	content: '';
	position: absolute;
	left: 10rpx;
	top: 10rpx;
	width: 8rpx;
	height: 8rpx;
	border-radius: 50%;
	background: #8A5D2E;
}

.kashgar-ai-action-question {
	box-sizing: border-box;
	border: 4rpx solid #8A5D2E;
	border-radius: 12rpx;
}

.kashgar-ai-action-question::after {
	content: '';
	position: absolute;
	left: 9rpx;
	bottom: -10rpx;
	width: 14rpx;
	height: 14rpx;
	border-left: 4rpx solid #8A5D2E;
	border-bottom: 4rpx solid #8A5D2E;
	transform: rotate(-35deg);
}

.kashgar-ai-card {
	position: relative;
	z-index: 2;
	margin: 12rpx 4rpx 0;
	padding: 18rpx;
	border-radius: 24rpx;
	background: rgba(255, 252, 247, 0.94);
	box-shadow: 0 12rpx 34rpx rgba(104, 69, 35, 0.1);
}

.kashgar-ai-section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 10rpx;
}

.kashgar-ai-section-title {
	font-size: 30rpx;
	line-height: 40rpx;
	font-weight: 900;
	color: #2E1E13;
}

.kashgar-ai-refresh,
.kashgar-ai-more {
	font-size: 24rpx;
	line-height: 32rpx;
	color: #9B6530;
	font-weight: 700;
}

.kashgar-ai-question {
	display: flex;
	align-items: center;
	gap: 16rpx;
	min-height: 42rpx;
	padding: 0 18rpx;
	margin-top: 7rpx;
	border-radius: 999rpx;
	background: rgba(250, 244, 235, 0.86);
	color: #5B4431;
	font-size: 23rpx;
	line-height: 30rpx;
}

.kashgar-ai-question-dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	background: #E59A44;
	box-shadow: inset 0 0 0 5rpx rgba(255, 255, 255, 0.7);
	flex-shrink: 0;
}

.kashgar-ai-place-section {
	min-height: 238rpx;
	padding-bottom: 72rpx;
}

.kashgar-ai-place-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 14rpx;
}

.kashgar-ai-place-card {
	position: relative;
	overflow: hidden;
	border-radius: 18rpx;
	background: #FFFFFF;
	box-shadow: 0 10rpx 26rpx rgba(104, 69, 35, 0.1);
}

.kashgar-ai-place-image {
	display: block;
	width: 100%;
	height: 110rpx;
}

.kashgar-ai-place-badge {
	position: absolute;
	left: 8rpx;
	top: 8rpx;
	min-width: 58rpx;
	height: 30rpx;
	padding: 0 10rpx;
	border-radius: 999rpx;
	background: #4FBF73;
	color: #FFFFFF;
	font-size: 20rpx;
	line-height: 30rpx;
	font-weight: 900;
}

.kashgar-ai-place-card:nth-child(2) .kashgar-ai-place-badge {
	background: #E59A44;
}

.kashgar-ai-place-card:nth-child(3) .kashgar-ai-place-badge {
	background: #5F94D8;
}

.kashgar-ai-place-body {
	padding: 10rpx 12rpx 12rpx;
}

.kashgar-ai-place-title {
	display: block;
	font-size: 22rpx;
	line-height: 30rpx;
	font-weight: 900;
	color: #2F2117;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.kashgar-ai-place-desc {
	display: block;
	margin-top: 4rpx;
	font-size: 19rpx;
	line-height: 26rpx;
	color: #7E6958;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.kashgar-ai-join {
	position: absolute;
	right: 24rpx;
	bottom: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 14rpx;
	width: 250rpx;
	height: 64rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #52BE74, #28A866);
	color: #FFFFFF;
	font-size: 28rpx;
	font-weight: 900;
	box-shadow: 0 12rpx 28rpx rgba(41, 139, 84, 0.22);
}

.kashgar-ai-join-icon {
	position: relative;
	width: 30rpx;
	height: 22rpx;
	border: 4rpx solid rgba(255, 255, 255, 0.95);
	border-radius: 50%;
}

.kashgar-ai-join-icon::after {
	content: '';
	position: absolute;
	right: -14rpx;
	top: 6rpx;
	width: 18rpx;
	height: 14rpx;
	border-top: 4rpx solid rgba(255, 255, 255, 0.95);
	border-right: 4rpx solid rgba(255, 255, 255, 0.95);
	border-radius: 0 8rpx 0 0;
}

.container {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	position: relative;
}

.bg-image {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100vh;
	z-index: 0;
}

/* 清空历史按钮 */
.clear-history-btn {
	position: fixed;
  bottom: 150px;
	right: 10px;
	z-index: 9999;
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(255, 255, 255, 0.9);
	border-radius: 50%;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.clear-icon {
	font-size: 32rpx;
}

.content {
	min-height: 100vh;
	padding-bottom: calc(220rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	position: relative;
	z-index: 1;
}

/* 聊天列表 */
.chat-list {
	padding: 20rpx 24rpx;
	padding-bottom: 0;
	box-sizing: border-box;
}

.chat-bottom-spacer {
	height: calc(220rpx + env(safe-area-inset-bottom));
}

.message-item {
	margin-bottom: 32rpx;
}

/* 用户消息 */
.message-user {
	display: flex;
	justify-content: flex-end;
	align-items: flex-start;
	gap: 16rpx;
  padding-right: 20px;
}

.user-avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.message-content-wrapper {
	max-width: 65%;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.user-content {
	padding: 24rpx 28rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #FFFFFF;
	border-radius: 20rpx 20rpx 4rpx 20rpx;
	word-break: break-all;
	line-height: 1.7;
	font-size: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.2);
}

/* 消息中的图片 */
.message-images {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.message-image {
	width: 200rpx;
	height: 200rpx;
	border-radius: 12rpx;
	background-color: #F0F0F0;
}

/* AI消息容器 */
.message-ai-wrapper {
	width: 100%;
}

.message-status {
	display: block;
	margin-top: 12rpx;
	margin-left: 88rpx;
	color: #999999;
	font-size: 22rpx;
	line-height: 1.4;
}

/* AI消息 */
.message-ai {
	display: flex;
	justify-content: flex-start;
	align-items: flex-start;
	gap: 16rpx;
	margin-top: 50px;
}

.ai-avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	background: #FFFFFF;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	overflow: hidden;
	box-shadow: 0 4rpx 12rpx rgba(86, 157, 144, 0.24);
}

.ai-avatar-image {
	width: 100%;
	height: 100%;
}

.ai-content {
	max-width: 65%;
	padding: 24rpx 28rpx;
	background-color: #FFFFFF;
	color: #333333;
	border-radius: 20rpx 20rpx 20rpx 4rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
	word-break: break-all;
	line-height: 1.7;
	font-size: 30rpx;
}

.ai-content .md-p {
	margin: 0 0 12rpx;
	line-height: 1.75;
}

.ai-content .md-p:last-child {
	margin-bottom: 0;
}

.ai-content .md-empty {
	height: 10rpx;
	line-height: 10rpx;
}

.ai-content .md-heading {
	margin: 12rpx 0;
	font-weight: 700;
	color: #1f1f1f;
}

.ai-content .md-list {
	padding-left: 8rpx;
}

.ai-content .md-inline-code {
	padding: 2rpx 8rpx;
	border-radius: 6rpx;
	background: #f3f3f3;
	color: #d14;
	font-family: monospace;
}

.avatar-text {
	color: #FFFFFF;
	font-size: 26rpx;
	font-weight: 600;
}

/* 加载动画 */
.loading-content {
	display: flex;
	align-items: center;
	gap: 10rpx;
	padding: 20rpx 28rpx;
}

.loading-dot {
	font-size: 48rpx;
	color: #999999;
	animation: loading 1.4s infinite;
}

.loading-dot:nth-child(2) {
	animation-delay: 0.2s;
}

.loading-dot:nth-child(3) {
	animation-delay: 0.4s;
}

@keyframes loading {
	0%, 60%, 100% {
		opacity: 0.3;
		transform: translateY(0);
	}
	30% {
		opacity: 1;
		transform: translateY(-12rpx);
	}
}

/* 输入区域 */
.input-area {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #FFFFFF;
	border-top: 1rpx solid #EEEEEE;
	padding: 16rpx 24rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	z-index: 100;
	box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.input-wrapper {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

/* 图片上传按钮 */
.upload-btn {
	width: 88rpx;
	height: 88rpx;
	background-color: #F7F8FA;
	border-radius: 44rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	transition: all 0.3s;
	border: 2rpx solid transparent;
}

.upload-btn:active {
	background-color: #E8E8E8;
	transform: scale(0.95);
}

.upload-btn-disabled {
	opacity: 0.5;
	pointer-events: none;
}

.upload-icon {
	font-size: 48rpx;
}

.message-input {
	flex: 1;
	height: 88rpx;
	padding: 0 28rpx;
	background-color: #F7F8FA;
	border-radius: 44rpx;
	font-size: 30rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s;
}

.message-input:focus {
	background-color: #FFFFFF;
	border-color: #667eea;
}

.send-btn {
	width: 128rpx;
	height: 88rpx;
	background-color: #E8E8E8;
	color: #999999;
	border-radius: 44rpx;
	font-size: 30rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	padding: 0;
	line-height: 88rpx;
	transition: all 0.3s;
	font-weight: 500;
}

.send-btn-active {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #FFFFFF;
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
	transform: scale(1.02);
}

.send-btn:disabled {
	opacity: 1;
}

.send-btn::after {
	border: none;
}

/* 跟进问题列表 */
.follow-up-list {
	margin-top: 24rpx;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
  padding-right: 80px;
  padding-left: 30px;
}

.follow-up-item {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 20rpx 24rpx;
	background: linear-gradient(135deg, #F0F4FF 0%, #E8F0FE 100%);
	border-radius: 16rpx;
	border: 2rpx solid #D0E2FF;
	transition: all 0.3s;
	cursor: pointer;
}

.follow-up-item:active {
	background: linear-gradient(135deg, #E0EBFF 0%, #D8E8FE 100%);
	transform: scale(0.98);
}

.follow-up-icon {
	font-size: 32rpx;
	flex-shrink: 0;
}

.follow-up-text {
	flex: 1;
	font-size: 28rpx;
	color: #4A5568;
	line-height: 1.6;
}

.message-source-list {
	margin-top: 20rpx;
	margin-left: 96rpx;
	margin-right: 30rpx;
	padding: 20rpx 24rpx;
	border-radius: 8rpx;
	border: 1rpx solid rgba(36, 76, 65, 0.14);
	background: rgba(255, 252, 244, 0.92);
}

.message-source-heading,
.message-source-title,
.message-source-desc {
	display: block;
	line-height: 1.55;
}

.message-source-heading {
	font-size: 24rpx;
	font-weight: 700;
	color: #244C41;
}

.message-source-item {
	margin-top: 14rpx;
	padding-top: 14rpx;
	border-top: 1rpx solid rgba(36, 76, 65, 0.1);
}

.message-source-title {
	font-size: 24rpx;
	font-weight: 700;
	color: #183B34;
}

.message-source-desc {
	margin-top: 6rpx;
	font-size: 22rpx;
	color: #6C766D;
}

.container {
	background: linear-gradient(180deg, #F8F1E4 0%, #F2E8D7 46%, #EEF5EF 100%);
}

.bg-image {
	opacity: 0.2;
}

.clear-history-btn {
	background: rgba(255, 252, 244, 0.94);
	border: 1rpx solid rgba(184, 129, 43, 0.16);
	box-shadow: 0 10rpx 24rpx rgba(43, 57, 45, 0.12);
}

.user-avatar,
.user-content,
.send-btn-active {
	background: linear-gradient(135deg, #244C41 0%, #367063 100%);
	box-shadow: 0 8rpx 22rpx rgba(36, 76, 65, 0.2);
}

.ai-avatar {
	border: 2rpx solid rgba(184, 129, 43, 0.28);
	box-shadow: 0 8rpx 20rpx rgba(43, 57, 45, 0.12);
}

.ai-content {
	background: rgba(255, 252, 244, 0.96);
	color: #183B34;
	border: 1rpx solid rgba(184, 129, 43, 0.14);
	box-shadow: 0 12rpx 28rpx rgba(43, 57, 45, 0.08);
}

.ai-content .md-heading {
	color: #183B34;
}

.message-status,
.loading-dot {
	color: #6C766D;
}

.input-area {
	background: rgba(255, 252, 244, 0.96);
	border-top-color: rgba(184, 129, 43, 0.16);
	box-shadow: 0 -10rpx 30rpx rgba(43, 57, 45, 0.12);
}

.message-input,
.upload-btn {
	background: rgba(238, 245, 239, 0.92);
	border: 1rpx solid rgba(184, 129, 43, 0.14);
}

.message-input:focus {
	border-color: #B8812B;
	background: #FFFCF4;
}

.follow-up-item {
	background: rgba(255, 252, 244, 0.94);
	border-color: rgba(184, 129, 43, 0.16);
}

.follow-up-text {
	color: #244C41;
}
</style>
