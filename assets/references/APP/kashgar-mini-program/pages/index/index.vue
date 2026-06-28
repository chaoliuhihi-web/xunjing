<template>
	<view class="container">
		<view v-if="useKashgarLocalContent && showKashgarLanding" class="kashgar-home kashgar-landing-entry">
			<view class="kashgar-landing-nav">
				<view class="kashgar-landing-brand">
					<view class="kashgar-landing-logo">✦</view>
					<view class="kashgar-landing-brand-copy">
						<text class="kashgar-landing-brand-name">星河寻境</text>
						<text class="kashgar-landing-brand-sub">寻境丝路 · 遇见喀什</text>
					</view>
				</view>
				<view class="kashgar-landing-capsule">
					<text>•••</text>
					<view class="kashgar-landing-capsule-line"></view>
					<text class="kashgar-landing-ring">◎</text>
				</view>
			</view>

			<view class="kashgar-landing-meta">
				<text class="kashgar-landing-pin">◆</text>
				<text>喀什古城</text>
				<view class="kashgar-landing-meta-line"></view>
				<text class="kashgar-landing-sun">☼</text>
				<text>26°C</text>
			</view>

			<view class="kashgar-landing-title-wrap">
				<text class="kashgar-landing-title">喀小寻带你</text>
				<text class="kashgar-landing-title">玩喀什</text>
			</view>
			<view class="kashgar-landing-tags">
				<text>古城故事 / 丝路风物 / 特色美食 / 官方攻略</text>
			</view>

			<view class="kashgar-landing-map-card">
				<image class="kashgar-landing-map" src="/static/kashgar/map-illustration.png" mode="aspectFill"></image>
			</view>

			<view class="kashgar-landing-guide">
				<image class="kashgar-landing-avatar" src="/static/kashgar/diary-generator-mascot.png" mode="aspectFit"></image>
				<view class="kashgar-landing-bubble">
					<text>你好呀！</text>
					<text>我是喀小寻，</text>
					<text>你的丝路小导游！</text>
				</view>
			</view>

			<view class="kashgar-landing-enter" @click="enterKashgarExperience">
				<text class="kashgar-landing-enter-icon">✦</text>
				<text>进入喀什</text>
			</view>
		</view>
		<view v-else-if="useKashgarLocalContent && showKashgarPlayHome" class="kashgar-home kashgar-play-home">
			<view class="kashgar-play-nav">
				<view class="kashgar-play-brand">
					<text class="kashgar-play-brand-icon">✦</text>
					<text class="kashgar-play-brand-name">星河寻境</text>
				</view>
				<view class="kashgar-play-nav-right">
					<text>喀什市</text>
					<text class="kashgar-play-nav-pin">⌖</text>
					<view class="kashgar-home-capsule">
						<text>•••</text>
						<view class="kashgar-home-capsule-line"></view>
						<text class="kashgar-home-ring">◎</text>
					</view>
				</view>
			</view>

			<view class="kashgar-play-hero">
				<image class="kashgar-hero-building" src="/static/kashgar/home-top-building.png" mode="aspectFill"></image>
				<view class="kashgar-title-wrap">
					<text class="kashgar-title">喀小寻带你</text>
					<text class="kashgar-title">玩喀什</text>
					<view class="kashgar-title-line"></view>
					<text class="kashgar-subtitle">以下是为你推荐的喀什旅行攻略，</text>
					<text class="kashgar-subtitle">快开启喀什之旅吧</text>
				</view>
			</view>

			<view class="kashgar-chat-card" @click="openKashgarPlayChat">
				<image class="kashgar-chat-image" src="/static/kashgar/home-hero.png" mode="aspectFill"></image>
			</view>
			<view class="kashgar-play-chat-cta" @click="openKashgarPlayChat">点我对话吧~</view>

			<view class="kashgar-action-grid">
				<view
					v-for="action in kashgarActions"
					:key="action.key"
					:class="['kashgar-action-card', action.className]"
					@click="handleKashgarAction(action)"
				>
					<text class="kashgar-action-title">{{ action.title }}</text>
					<text class="kashgar-action-desc">{{ action.desc }}</text>
					<view class="kashgar-action-symbol">
						<view v-if="action.key === 'scan'" class="kashgar-symbol-scan">
							<view class="kashgar-symbol-corner kashgar-symbol-corner-tl"></view>
							<view class="kashgar-symbol-corner kashgar-symbol-corner-tr"></view>
							<view class="kashgar-symbol-corner kashgar-symbol-corner-bl"></view>
							<view class="kashgar-symbol-corner kashgar-symbol-corner-br"></view>
							<view class="kashgar-symbol-scan-line"></view>
						</view>
						<view v-else-if="action.key === 'route'" class="kashgar-symbol-route">
							<view class="kashgar-symbol-route-line"></view>
							<view class="kashgar-symbol-pin"></view>
						</view>
						<view v-else class="kashgar-symbol-camera">
							<view class="kashgar-symbol-lens"></view>
							<view class="kashgar-symbol-flash"></view>
						</view>
					</view>
				</view>
			</view>

			<view class="kashgar-section-head">
				<text class="kashgar-section-title">推荐打卡地</text>
				<text class="kashgar-more" @click="goToMap('79')">更多 ›</text>
			</view>
			<view class="kashgar-place-grid">
				<view
					v-for="place in kashgarPlaces"
					:key="place.title"
					class="kashgar-place-card"
					@click="goToMap(place.type)"
				>
					<image class="kashgar-place-image" :src="place.cover" mode="aspectFill"></image>
					<view class="kashgar-place-body">
						<text class="kashgar-place-title">{{ place.title }}</text>
						<text class="kashgar-place-desc">{{ place.desc }}</text>
					</view>
				</view>
			</view>

			<view class="kashgar-guide-strip" @click="goToMap('82')">
				<image class="kashgar-guide-image" src="/static/kashgar/official-guide.png" mode="aspectFill"></image>
				<view class="kashgar-guide-mask">
					<view class="kashgar-guide-copy">
						<text class="kashgar-guide-kicker">官方攻略</text>
						<text class="kashgar-guide-title">喀什古城半日游</text>
						<text class="kashgar-guide-desc">打卡精华景点｜文化体验｜美食打卡</text>
					</view>
					<text class="kashgar-guide-button">查看攻略 ›</text>
				</view>
			</view>

			<view class="kashgar-enter" @click="goToMap('82')">
				<text>进入导览</text>
				<text class="kashgar-enter-arrow">→</text>
			</view>

			<tab-bar :current="1" />
		</view>
		<view v-else-if="useKashgarLocalContent" class="kashgar-home kashgar-travel-notes-home">
			<view class="kashgar-home-sky">
				<image class="kashgar-home-mountain" src="/static/kashgar/home-top-mountains.png" mode="aspectFill"></image>
			</view>
			<view class="kashgar-home-nav">
				<view class="kashgar-home-brand">
					<image class="kashgar-home-brand-avatar" src="/static/tabbar/ai_companion_avatar.png" mode="aspectFill"></image>
					<view class="kashgar-home-brand-copy">
						<text class="kashgar-home-brand-name">喀小寻</text>
						<text class="kashgar-home-brand-sub">星 河 寻 境</text>
					</view>
				</view>
				<view class="kashgar-home-capsule">
					<text>•••</text>
					<view class="kashgar-home-capsule-line"></view>
					<text class="kashgar-home-ring">◎</text>
				</view>
			</view>

			<view class="kashgar-search-row">
				<view class="kashgar-search-box" @click="toSearch">
					<text class="kashgar-search-icon">⌕</text>
					<text class="kashgar-search-placeholder">搜索目的地/景点/游记</text>
				</view>
				<view class="kashgar-search-city" @click="initLocation(true)">
					<text class="kashgar-search-pin">◆</text>
					<text>{{ kashgarCityLabel }}</text>
					<text class="kashgar-search-arrow">⌄</text>
				</view>
			</view>

			<view class="kashgar-travel-banner" @click="goToMap('82')">
				<image class="kashgar-travel-banner-image" src="/static/kashgar/home-travel-banner.png" mode="aspectFill"></image>
			</view>

			<view class="kashgar-map-section-head">
				<text class="kashgar-map-section-title">喀什文旅地图</text>
				<text class="kashgar-map-section-more" @click="goToMap('82')">更多 ›</text>
			</view>
			<view class="kashgar-map-shortcuts">
				<view
					v-for="shortcut in kashgarMapShortcuts"
					:key="shortcut.key"
					class="kashgar-map-shortcut"
					@click="handleKashgarMapShortcut(shortcut)"
				>
					<image class="kashgar-map-shortcut-image" :src="shortcut.cover" mode="aspectFill"></image>
					<text class="kashgar-map-shortcut-title">{{ shortcut.title }}</text>
				</view>
			</view>

			<view class="kashgar-notes-section-head">
				<text class="kashgar-notes-title">跟着游记</text>
				<view class="kashgar-notes-more" @click="goToTheater">
					<text>游记剧场</text>
					<text>›</text>
				</view>
			</view>
			<view class="kashgar-travel-note-grid">
				<view
					v-for="note in kashgarTravelNotes"
					:key="note.key"
					class="kashgar-travel-note-card"
					@click="openKashgarTravelNote(note)"
				>
					<view class="kashgar-note-cover-wrap">
						<image class="kashgar-note-cover" :src="note.cover" mode="aspectFill"></image>
						<text class="kashgar-note-tag">{{ note.tag }}</text>
						<view class="kashgar-note-likes">
							<text>♡</text>
							<text>{{ note.likes }}</text>
						</view>
					</view>
					<view class="kashgar-note-body">
						<text class="kashgar-note-title">{{ note.title }}</text>
						<text class="kashgar-note-desc">{{ note.desc }}</text>
						<view class="kashgar-note-meta">
							<text>{{ note.author }}</text>
							<text>⌾ {{ note.location }}</text>
						</view>
					</view>
				</view>
			</view>

			<tab-bar :current="0" />
		</view>
		<view v-else class="backend-home">
		<!-- 自定义导航栏 -->
		<view class="custom-nav" :style="navStyle">
			<!-- 顶部品牌图区域 -->
			<view class="nav-top">
				<image src="https://www.neoxiake.com//upload/admin/20260602/1541ed4672310f0f341f05037f4a53af.png" class="nav-icon" mode="aspectFit"></image>
			</view>

			<!-- 底部搜索区域 -->
			<view class="nav-search-area">
				<view class="search-box" @click="toSearch">
					<image :src="UrlImg + '/baidu_map/weatch/images/icon2.png'" class="nav_img" mode="aspectFit"></image>
					<input type="text" placeholder="搜索目的地/景点/活动" disabled class="search-input">
				</view>
				<view class="location-box" @click="initLocation(true)">
					<image :src="UrlImg + '/baidu_map/weatch/images/icon1.png'" class="nav_imgs" mode="aspectFit"></image>
					<view class="location-text">{{ currentCity }}</view>
				</view>
			</view>
		</view>
	<!-- 轮播图 -->
	<view class="banner">
		<swiper class="swiper" :indicator-dots="true" :autoplay="true" :interval="3000" :duration="500"
			indicator-color="rgba(255, 255, 255, 0.5)" indicator-active-color="#ffffff" circular>
			<swiper-item v-for="(item, index) in bannerList" :key="index" @click="goToBanner(item)">
				<image :src="item.img_url" class="banner-img" mode="aspectFill"></image>
			</swiper-item>
		</swiper>
	</view>
		<!-- 页面内容 -->
	<view class="section">
		<!-- 祥云背景装饰 -->
		<image :src="UrlImg + '/baidu_map/weatch/images/yun.png'" class="cloud-bg" mode="aspectFit" lazy-load></image>

	<!-- 标题区域 -->
	<view class="section-header">
		<text class="section-title">剧好玩文旅地图</text>
	</view>

		<!-- 功能图标网格 -->
		<view class="function-grid">
			<view class="function-item" @click="goToMap('82')">
				<image :src="UrlImg + '/baidu_map/weatch/images/icon5.png'" class="function-icon" mode="aspectFit" lazy-load></image>
				<text class="function-text">路线指南</text>
			</view>
			<view class="function-item" @click="goToMap('81')">
				<image :src="UrlImg + '/baidu_map/weatch/images/icon4.png'" class="function-icon" mode="aspectFit" lazy-load></image>
				<text class="function-text">民宿酒店</text>
			</view>
			<view class="function-item" @click="goToMap('80')">
				<image :src="UrlImg + '/baidu_map/weatch/images/icon3.png'" class="function-icon" mode="aspectFit" lazy-load></image>
				<text class="function-text">好物美食</text>
			</view>
			<view class="function-item" @click="goToMap('79')">
				<image :src="UrlImg + '/baidu_map/weatch/images/icon6.png'" class="function-icon" mode="aspectFit" lazy-load></image>
				<text class="function-text">上镜城市</text>
			</view>
		</view>
	</view>
	<view class="home-loading" v-if="isHomeLoading">内容加载中...</view>
	<view class="home-error" v-if="homeError">{{ homeError }}</view>
	<view class="section">
		<!-- 祥云背景装饰 -->
		<image :src="UrlImg + '/baidu_map/weatch/images/yun.png'" class="cloud-bg" mode="aspectFit" lazy-load></image>

		<!-- 标题区域 -->
		<view class="section-header" @click="goToHundredPlays">
			<text style="font-weight: bold;" class="section-title">百县百剧</text>
			<image :src="UrlImg + '/baidu_map/weatch/images/arrow.png'" class="arrow-icon" mode="aspectFit" lazy-load></image>
		</view>

		<!-- 视频卡片网格 -->
		<view class="video-grid">
			<view class="video-card" v-for="(item, index) in videoList" :key="index">
				<view class="video-image-wrapper">
					<image :src="item.cover" class="video-image" mode="aspectFill" lazy-load @click="goToShortPlays(item)"></image>
					<view class="video-badge">{{ item.episodes }}集</view>
				</view>
				<view class="video-info">
					<text class="video-title">{{ item.title }}</text>
					<text class="video-desc">{{ item.desc }}</text>
				</view>
			</view>
		</view>
		<view>
			<image :src="UrlImg + '/baidu_map/weatch/images/img1.png'" class="video_bot" mode="aspectFill" lazy-load></image>
		</view>
	</view>
	<view class="section">
		<!-- 祥云背景装饰 -->
		<image :src="UrlImg + '/baidu_map/weatch/images/yun.png'" class="cloud-bg" mode="aspectFit" lazy-load></image>

		<!-- 标题区域 -->
		<view class="section-header" @click="goToTheater">
			<text style="font-weight: bold;" class="section-title">喀什剧场</text>
			<image :src="UrlImg + '/baidu_map/weatch/images/arrow.png'" class="arrow-icon" mode="aspectFit" lazy-load></image>
		</view>

		<!-- 剧场卡片 -->
		<view class="theater-card" v-for="(item, index) in theaterList" :key="index">
			<!-- 主图 -->
			<view class="theater-image-wrapper" @click="goToTheaterDetail(item)">
				<image :src="item.cover" class="theater-image" mode="aspectFill" lazy-load></image>
			</view>

			<!-- 内容区域 -->
			<view class="theater-content">
				<!-- 标题行 -->
				<view class="theater-header">
					<text class="theater-title">{{ item.address }}</text>
					<view class="theater-detail" @click="goToTheaterDetail(item)">
						<text class="detail-text">查看详情</text>
						<image :src="UrlImg + '/baidu_map/weatch/images/arrow.png'" class="detail-arrow" mode="aspectFit" lazy-load></image>
					</view>
				</view>

				<!-- 描述文字 -->
				<text class="theater-desc">{{ item.desc }}</text>

			<!-- 底部互动栏 -->
			<view class="theater-footer">
				<view class="footer-left">
					<!-- logo和关注 -->
					<image :src="item.brandIcon" class="footer-logo" mode="aspectFit" lazy-load></image>
					<view class="follow-btn" :class="{ 'followed': item.isFollow }" @click="handleFollow(item)">
						<text class="follow-icon" v-if="!item.isFollow">+</text>
						<text class="follow-text">{{ item.isFollow ? '已关注' : '关注' }}</text>
					</view>
				</view>

				<view class="footer-center">
					<!-- 地点标签（居中） -->
					<view class="location-tag" @click.stop="goToTheaterLocation(item)">
						<image :src="UrlImg + '/baidu_map/weatch/images/icon1.png'" class="location-icon" mode="aspectFit" lazy-load></image>
						<text class="location-name">{{ item.address }}</text>
					</view>
				</view>

				<view class="footer-right">
					<view class="action-group">
						<view class="action-btn" @click="handleLike(item)">
							<image
								:src="item.isLiked ? '/static/tabbar/000.png' : UrlImg + '/baidu_map/weatch/images/like-icon.png'"
								:class="['action-icon', { 'action-icon-red': item.isLiked }]"
								mode="aspectFit"
								lazy-load
							></image>
						</view>
						<view class="action-divider"></view>
						<button class="action-btn share-btn" open-type="share" @click="handleShare(item)">
							<image :src="UrlImg + '/baidu_map/weatch/images/share-icon.png'" class="action-icon" mode="aspectFit" lazy-load></image>
						</button>
					</view>
				</view>
			</view>
			</view>
		</view>
	</view>
  <view class="qqq"></view>
		<!-- 自定义TabBar -->
		<tab-bar :current="0" />
		</view>
	</view>
</template>

<script>
import TabBar from '@/components/tab-bar/tab-bar.vue'
import config from '@/request/config.js'
import request from '@/request/request.js'
import { buildTencentMapSignedUrl } from '@/request/qqMapSign.js'
import { resolveXunjingMultimodalTrigger, requestCurrentLocationForTrigger } from '@/request/xunjingMultimodal.js'
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import { normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'
import { normalizeXichengReviewedSources } from '@/request/xunjing/sources.js'
import {
	KASHGAR_ACTIONS,
	KASHGAR_MAP_SHORTCUTS,
	KASHGAR_PLACES,
	KASHGAR_TRAVEL_HERO,
	KASHGAR_TRAVEL_NOTES
} from './kashgar-home-content.js'

const KASHGAR_LOCAL_CONTENT_ENABLED = true
const KASHGAR_LANDING_LOCAL_CONTENT_ENABLED = true
const KASHGAR_PLAY_HOME_LOCAL_CONTENT_ENABLED = true
const HOME_THEATER_TYPES = [1, 2, 3]
const HOME_THEATER_LIKE_TYPES = HOME_THEATER_TYPES.join(',')
const QQ_MAP_KEY = 'Y2EBZ-ALIEI-542GN-UQTLT-NX6A3-VNFLA'
const QQ_MAP_GEOCODER_PATH = '/ws/geocoder/v1/'
const HOME_LOCATION_CACHE_KEY = 'homeLocationInfo'
const HOME_LOCATION_CACHE_TIME = 24 * 60 * 60 * 1000
const HOME_LOCATION_TIMEOUT_MS = 8000
const HOME_GEOCODER_QUOTA_LIMIT_KEY = 'homeGeocoderQuotaLimitDate'
const MAP_GUIDE_STORAGE_KEY = 'hasSeenMapGuide'
const XUNJING_SCAN_CONFIG = {
	packageCode: 'KASHGAR-MAP-001',
	sourceChannel: 'APP_UNIAPP',
	apiPath: 'app-api/xunjing/scan/resolve',
	tenantId: config.XunjingTenantId || '1'
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

const cloneContentList = (list) => list.map(item => ({ ...item }))

export default {
	components: {
		TabBar
	},
	data() {
			return {
			useKashgarLocalContent: KASHGAR_LOCAL_CONTENT_ENABLED,
			showKashgarLanding: false,
			showKashgarPlayHome: false,
			kashgarCityLabel: '喀什',
		kashgarTravelHero: { ...KASHGAR_TRAVEL_HERO },
		kashgarMapShortcuts: cloneContentList(KASHGAR_MAP_SHORTCUTS),
		kashgarTravelNotes: cloneContentList(KASHGAR_TRAVEL_NOTES),
		kashgarActions: cloneContentList(KASHGAR_ACTIONS),
		kashgarPlaces: cloneContentList(KASHGAR_PLACES),
      UrlImg: config.UrlImg,
		statusBarHeight: 0,  // 状态栏高度
		capsuleInfo: {},      // 胶囊按钮信息
		currentCity: '定位失败',
		currentLocation: null,
		isLocating: false,
		// 轮播图数据
		bannerList: [],
		// 视频列表数据
		videoList: [],
		// 喀什剧场数据
		theaterList: [],
		isHomeLoading: false,
		homeError: '',
		// 当前要分享的剧场信息
		currentShareItem: null
		}
	},
	computed: {
		// 导航栏样式，使用CSS背景图
		navStyle() {
			return `
				background-image: url('https://kashi.weiapp.net//upload/admin/20260615/4c43fbda68dac98f461205006708c01e.png');
				background-size: cover;
				background-position: center;
				background-repeat: no-repeat;
			`
		},
		// 计算icon位置，与胶囊按钮对齐
		iconPosition() {
			if (this.capsuleInfo.left) {
				return {
					marginLeft: `${this.capsuleInfo.left}px`
				}
			}
			return {
				marginLeft: '20px'
			}
		}
	},
	onLoad(options = {}) {
		if (this.useKashgarLocalContent) {
			this.initNavigationBar()
			this.resolveKashgarHomeMode(options)
			this.applyKashgarHomeContent()
			this.resolveXunjingScanLaunch(options)
			return
		}
		this.initNavigationBar()
		this.initLocation()
		this.getHomeData()
		uni.$on('theaterLikeChanged', this.applyTheaterLikeChange)
	},
	onShow() {
		if (this.useKashgarLocalContent) { return }
		this.syncTheaterLikeStateFromApi()
	},
	onUnload() {
		uni.$off('theaterLikeChanged', this.applyTheaterLikeChange)
	},
	// 分享配置
	onShareAppMessage() {
		// 如果有当前分享的剧场信息,使用它
		if (this.currentShareItem) {
			const item = this.currentShareItem
			console.log('📤 分享内容:', item)
			return {
				title: item.title || '剧好玩文旅地图',
				path: `/pages/index/index?dramaId=${item.id}`,
				imageUrl: item.cover || ''
			}
		}
		// 默认分享内容
		return {
			title: '剧好玩文旅地图',
			path: '/pages/index/index',
			imageUrl: ''
		}
	},
	methods: {
		resolveKashgarHomeMode(options = {}) {
			this.showKashgarLanding = KASHGAR_LANDING_LOCAL_CONTENT_ENABLED && options.mode === 'landing'
			this.showKashgarPlayHome = KASHGAR_PLAY_HOME_LOCAL_CONTENT_ENABLED && options.mode === 'play'
		},
		parseXunjingQueryString(query = '') {
			return String(query || '').replace(/^[^?]*\?/, '').split('&').reduce((params, pair) => {
				if (!pair || !pair.includes('=')) return params
				const [rawKey, ...rawValueParts] = pair.split('=')
				const key = this.safeDecodeXunjingText(rawKey).trim()
				const value = this.safeDecodeXunjingText(rawValueParts.join('=')).trim()
				if (key) {
					params[key] = value
				}
				return params
			}, {})
		},
		stringifyXunjingQuery(params = {}) {
			return Object.keys(params).filter(key => params[key] !== undefined && params[key] !== null && String(params[key]) !== '').map(key => {
				return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
			}).join('&')
		},
		safeDecodeXunjingText(value = '') {
			let decoded = String(value || '').trim()
			for (let i = 0; i < 2; i += 1) {
				try {
					const next = decodeURIComponent(decoded)
					if (next === decoded) break
					decoded = next
				} catch (error) {
					break
				}
			}
			return decoded
		},
		decodeXunjingScanText(rawText = '') {
			const text = this.safeDecodeXunjingText(rawText)
			if (!text) return {}
			const query = text.includes('?') ? text.split('?').slice(1).join('?').split('#')[0] : text
			const params = this.parseXunjingQueryString(query)
			const sceneCode = params.sceneCode || params.qrSceneCode || params.scene || ''
			const packageCode = params.packageCode || params.package_code || ''
			if (sceneCode || packageCode) {
				return {
					sceneCode,
					packageCode
				}
			}
			if (!/[/?&=]/.test(text)) {
				return {
					sceneCode: text
				}
			}
			return {}
		},
		resolveXunjingLaunchScene(options = {}) {
			const decodedScene = this.decodeXunjingScanText(options.scene || options.q || '')
			return {
				sceneCode: decodedScene.sceneCode || String(options.sceneCode || options.qrSceneCode || '').trim(),
				packageCode: decodedScene.packageCode || String(options.packageCode || '').trim()
			}
		},
		getXunjingUserTraceId() {
			const openid = uni.getStorageSync('openid') || uni.getStorageSync('openId') || uni.getStorageSync('OPENID')
			if (openid) {
				return `openid_${openid}`
			}
			const userId = this.getCurrentUserId()
			if (userId) {
				return `user_${userId}`
			}
			return 'guest'
		},
		requestXunjingScanResolve(scan = {}) {
			if (!scan.sceneCode && !scan.packageCode) {
				return Promise.resolve(null)
			}
			return new Promise((resolve, reject) => {
				uni.request({
					url: buildYudaoAppApiUrl(XUNJING_SCAN_CONFIG.apiPath),
					method: 'POST',
					timeout: 8000,
					header: {
						'Content-Type': 'application/json',
						'tenant-id': XUNJING_SCAN_CONFIG.tenantId
					},
					data: {
						packageCode: scan.packageCode || (scan.sceneCode ? '' : XUNJING_SCAN_CONFIG.packageCode),
						sceneCode: scan.sceneCode,
						userTraceId: this.getXunjingUserTraceId()
					},
					success: (res) => {
						if (res && res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
							reject(new Error(`星河寻境扫码接口异常:${res.statusCode}`))
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
		},
		normalizeXunjingTargetPath(targetPath = '', scan = {}) {
			const target = String(targetPath || '').trim()
			const [route, queryString = ''] = target.split('?')
			const targetParams = this.parseXunjingQueryString(queryString)
			const packageCode = targetParams.packageCode || scan.packageCode || XUNJING_SCAN_CONFIG.packageCode
			const sceneCode = targetParams.sceneCode || scan.sceneCode || ''
			if (!target || route === '/pages/map/detail') {
				const query = this.stringifyXunjingQuery({
					type: '82',
					firstGuide: '1',
					packageCode,
					sceneCode
				})
				return `/subPackages/feature/map/map?${query}`
			}
			if (this.isExistingXunjingRoute(route)) {
				return target
			}
			const query = this.stringifyXunjingQuery({
				type: '82',
				firstGuide: '1',
				packageCode,
				sceneCode
			})
			return `/subPackages/feature/map/map?${query}`
		},
		isExistingXunjingRoute(route = '') {
			return [
				'/pages/index/index',
				'/pages/ai-guide/ai-guide',
				'/pages/banner/banner',
				'/subPackages/feature/map/map',
				'/subPackages/feature/map_two/detail',
				'/subPackages/feature/map_two/map_two',
				'/subPackages/feature/map_two/masters',
				'/subPackages/feature/map_two/search'
			].includes(route)
		},
		navigateToXunjingTarget(targetUrl = '') {
			if (!targetUrl) return
			if (targetUrl.startsWith('/pages/index/index')) {
				uni.reLaunch({ url: targetUrl })
				return
			}
			uni.navigateTo({ url: targetUrl })
		},
		async requestXunjingMultimodalTriggerFromText(text = '') {
			const location = this.currentLocation || await requestCurrentLocationForTrigger()
			return resolveXunjingMultimodalTrigger({
				text,
				ocrText: text,
				location
			})
		},
		normalizeXichengMultimodalSources(trigger = {}) {
			const safetyStatus = normalizeXichengSafetyStatus(trigger.safetyStatus)
			if (['BLOCKED', 'UNAVAILABLE'].includes(safetyStatus)) {
				return []
			}
			return normalizeXichengReviewedSources(trigger.sources)
		},
		normalizeXichengMultimodalSuggestedQuestions(trigger = {}) {
			const safetyStatus = normalizeXichengSafetyStatus(trigger.safetyStatus)
			if (['BLOCKED', 'UNAVAILABLE'].includes(safetyStatus)) {
				return []
			}
			return Array.isArray(trigger.suggestedQuestions) ? trigger.suggestedQuestions : []
		},
		persistXichengMultimodalRecognition(trigger = {}) {
			if (!trigger || !trigger.poiCode) return
			uni.setStorageSync(XICHENG_REGION_CONFIG.storageKey, {
				...trigger,
				regionCode: trigger.regionCode || XICHENG_REGION_CONFIG.regionCode,
				packageCode: trigger.packageCode || XICHENG_REGION_CONFIG.packageCode,
				sceneCode: trigger.sceneCode || XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: trigger.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
				companionName: trigger.companionName || XICHENG_REGION_CONFIG.companionName,
				source: trigger.source || trigger.triggerType || 'multimodal',
				sourceLabel: trigger.sourceLabel || '文本识别',
				safetyStatus: normalizeXichengSafetyStatus(trigger.safetyStatus),
				sources: this.normalizeXichengMultimodalSources(trigger),
				suggestedQuestions: this.normalizeXichengMultimodalSuggestedQuestions(trigger)
			})
		},
		normalizeXunjingTriggerTargetPath(trigger = {}) {
			if (!trigger || !trigger.poiCode) {
				return ''
			}
			const query = this.stringifyXunjingQuery({
				regionCode: trigger.regionCode || XICHENG_REGION_CONFIG.regionCode,
				packageCode: trigger.packageCode || XICHENG_REGION_CONFIG.packageCode,
				sceneCode: trigger.sceneCode || XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: trigger.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
				poiCode: trigger.poiCode,
				poiName: trigger.poiName,
				companionName: trigger.companionName || XICHENG_REGION_CONFIG.companionName,
				intent: trigger.intent,
				confidence: trigger.confidence,
				safetyStatus: normalizeXichengSafetyStatus(trigger.safetyStatus),
				trigger: 'multimodal'
			})
			if (trigger.intent === 'route' || trigger.action === 'open_route_recommendation') {
				return `/subPackages/feature/map/map?type=82&firstGuide=1&${query}`
			}
			if (trigger.intent === 'record' || trigger.action === 'start_travel_note') {
				return `/pages/ai-guide/ai-guide?mode=diary&${query}`
			}
			const question = encodeURIComponent(`讲讲${trigger.poiName || '这个地方'}`)
			return `/pages/ai-guide/ai-guide?question=${question}&${query}`
		},
		navigateToXunjingTrigger(trigger = {}) {
			this.persistXichengMultimodalRecognition(trigger)
			const targetUrl = this.normalizeXunjingTriggerTargetPath(trigger)
			if (!targetUrl) {
				return Promise.resolve(false)
			}
			if (!trigger.requiresUserConfirm) {
				this.navigateToXunjingTarget(targetUrl)
				return Promise.resolve(true)
			}
			return new Promise((resolve) => {
				uni.showModal({
					title: '小京识别到线索',
					content: `可能是${trigger.poiName || '西城文化点'}，是否继续？`,
					confirmText: '继续',
					cancelText: '取消',
					success: (modalRes) => {
						if (modalRes.confirm) {
							this.navigateToXunjingTarget(targetUrl)
							resolve(true)
							return
						}
						resolve(false)
					},
					fail: () => resolve(false)
				})
			})
		},
		async resolveXunjingMultimodalFromText(text = '') {
			try {
				const trigger = await this.requestXunjingMultimodalTriggerFromText(text)
				return this.navigateToXunjingTrigger(trigger)
			} catch (error) {
				console.warn('星河寻境多模态触发失败:', error && (error.errMsg || error.message) ? (error.errMsg || error.message) : error)
				return false
			}
		},
		resolveXunjingScanLaunch(options = {}) {
			const scan = this.resolveXunjingLaunchScene(options)
			if (!scan.sceneCode && !scan.packageCode) {
				return Promise.resolve(false)
			}
			return this.requestXunjingScanResolve(scan)
				.then((resolved) => {
					const targetUrl = this.normalizeXunjingTargetPath(resolved && resolved.targetPath ? resolved.targetPath : '', {
						...scan,
						...(resolved || {})
					})
					this.navigateToXunjingTarget(targetUrl)
					return true
				})
				.catch((error) => {
					console.warn('星河寻境扫码解析失败:', error)
					return false
				})
		},
		startKashgarManualScan() {
			if (!uni.scanCode) {
				this.resolveXunjingMultimodalFromText('').then((handled) => {
					if (!handled) this.goToMap('82')
				})
				return
			}
			uni.scanCode({
				onlyFromCamera: true,
				scanType: ['qrCode', 'barCode'],
				success: (scanRes = {}) => {
					const scanText = scanRes.result || scanRes.path || scanRes.scanResult || ''
					this.resolveXunjingScanLaunch({
						scene: scanText
					}).then((handled) => {
						if (!handled) {
							this.resolveXunjingMultimodalFromText(scanText).then((triggerHandled) => {
								if (!triggerHandled) this.goToMap('82')
							})
						}
					})
				},
				fail: (error) => {
					const errMsg = error && error.errMsg ? String(error.errMsg) : ''
					if (/cancel/i.test(errMsg)) return
					console.warn('星河寻境扫码调用失败:', error)
					this.resolveXunjingMultimodalFromText('').then((handled) => {
						if (!handled) this.goToMap('82')
					})
				}
			})
		},
		enterKashgarExperience() {
			this.showKashgarLanding = false
			this.showKashgarPlayHome = true
			uni.setStorageSync('kashgarLandingSeen', '1')
		},
		openKashgarPlayChat() {
			uni.navigateTo({
				url: '/pages/ai-guide/ai-guide'
			})
		},
		applyKashgarHomeContent() {
			this.currentCity = '喀什市'
			this.homeError = ''
			this.isHomeLoading = false
			this.bannerList = [
				{
					id: 'kashgar-ai-guide',
					img_url: '/static/kashgar/home-hero.png'
				}
			]
			this.videoList = this.kashgarPlaces.map((place, index) => ({
				id: `kashgar-place-${index + 1}`,
				cover: place.cover,
				title: place.title,
				desc: place.desc,
				episodes: index === 0 ? 5 : 4
			}))
			this.theaterList = [
				{
					id: 'kashgar-guide',
					type: 82,
					cover: '/static/kashgar/official-guide.png',
					title: '喀什古城半日游',
					desc: '打卡精华景点、文化体验与美食路线，适合第一次到喀什的游客。',
					address: '官方攻略',
					brandId: '',
					brandIcon: '',
					isFollow: false,
					zan_num: 128,
					isLiked: false
				}
			]
		},
		handleKashgarAction(action) {
			if (!action) return
			if (action.target === 'map') {
				this.startKashgarManualScan()
				return
			}
			if (action.target === 'guide') {
				this.goToMap('82')
				return
			}
			if (action.target === 'diary') {
				uni.navigateTo({
					url: '/pages/ai-guide/ai-guide?mode=diary'
				})
			}
		},
		handleKashgarMapShortcut(shortcut) {
			if (!shortcut) return
			if (shortcut.key === 'route-guide') {
				uni.navigateTo({
					url: '/subPackages/feature/map_two/masters?type=' + shortcut.type
				})
				return
			}
			this.goToMap(shortcut.type)
		},
	openKashgarTravelNote(note) {
		uni.navigateTo({
			url: `/subPackages/feature/theater/theaterDetail?dramaId=${note.id}&localStory=1`
		})
	},
		goKashgarAiGuide() {
			uni.reLaunch({
				url: '/pages/ai-guide/ai-guide'
			})
		},
		getCurrentUserId() {
			const userInfo = uni.getStorageSync('userInfo') || {}
			const userModel = uni.getStorageSync('userModel') || {}
			return uni.getStorageSync('userId') || userInfo.id || userInfo.user_id || (userModel.member && userModel.member.id) || userModel.id || ''
		},
		getTheaterLikeKey(item) {
			return `${Number(item.type || 3)}:${item.id}`
		},
		getTheaterLikedEntriesFromApi(list = []) {
			return list.flatMap(item => {
				if (item.type) {
					return [[this.getTheaterLikeKey(item), item]]
				}
				return HOME_THEATER_TYPES.map(type => [`${type}:${item.id}`, { ...item, type }])
			})
		},
		async syncTheaterLikeStateFromApi() {
			if (!this.theaterList.length) return
			const userId = this.getCurrentUserId()
			if (!userId) return
			try {
				const params = {
					userId,
					type: HOME_THEATER_LIKE_TYPES,
					page: 1,
					page_size: 100
				}
				const res = await request('api2/Drama/getZanDrama', params, 'GET')
				if (res.code != 0 || !res.data || !Array.isArray(res.data.list)) return
				const likedMap = new Map(this.getTheaterLikedEntriesFromApi(res.data.list))
				this.theaterList = this.theaterList.map(item => {
					const likedItem = likedMap.get(this.getTheaterLikeKey(item))
					return {
						...item,
						isLiked: likedMap.has(this.getTheaterLikeKey(item)),
						zan_num: likedItem ? Number(likedItem.zan_num || item.zan_num || 0) : Number(item.zan_num || 0)
					}
				})
			} catch (error) {
				console.error('同步首页喀什剧场点赞状态失败:', error)
			}
		},
		applyTheaterLikeStateFromApiList(list = []) {
			const likedMap = new Map(this.getTheaterLikedEntriesFromApi(list))
			this.theaterList = this.theaterList.map(item => {
				const likedItem = likedMap.get(this.getTheaterLikeKey(item))
				return {
					...item,
					isLiked: likedMap.has(this.getTheaterLikeKey(item)),
					zan_num: likedItem ? Number(likedItem.zan_num || item.zan_num || 0) : Number(item.zan_num || 0)
				}
			})
		},
		applyTheaterLikeChange(payload = {}) {
			if (!payload.id || !this.theaterList.length) return
			this.theaterList = this.theaterList.map(item => {
				if (String(item.id) !== String(payload.id)) return item
				if (payload.type !== undefined && Number(item.type || 3) !== Number(payload.type || 3)) return item
				return {
					...item,
					isLiked: Boolean(payload.isLiked),
					zan_num: Number(payload.zan_num || item.zan_num || 0)
				}
			})
		},
		initLocation(force = false) {
			if (this.isLocating) return
			const cached = uni.getStorageSync(HOME_LOCATION_CACHE_KEY)
			if (!force && cached && cached.city && this.isUsableCachedCity(cached.city) && cached.time && Date.now() - cached.time < HOME_LOCATION_CACHE_TIME) {
				this.currentCity = cached.city
				this.currentLocation = cached.location || null
				return
			}

			uni.getSetting({
				success: (settingRes) => {
					const authSetting = settingRes.authSetting || {}
					if (authSetting['scope.userFuzzyLocation'] === false) {
						this.currentCity = '定位失败'
						this.showLocationPermissionModal()
						return
					}
					this.requestCurrentLocation(force)
				},
				fail: () => {
					this.requestCurrentLocation(force)
				}
			})
		},
		requestCurrentLocation(force = false) {
			if (this.isLocating) return
			this.isLocating = true
			if (force) {
				this.currentCity = '定位中'
			}
			if (typeof wx === 'undefined' || !wx.getFuzzyLocation) {
				this.currentCity = '定位失败'
				this.isLocating = false
				if (force) {
					uni.showToast({
						title: '当前微信版本不支持模糊定位',
						icon: 'none'
					})
				}
				return
			}
			const locationTimeoutTimer = setTimeout(() => {
				if (!this.isLocating) return
				this.currentCity = '定位失败'
				this.isLocating = false
			}, HOME_LOCATION_TIMEOUT_MS)
			const finishLocationFlow = () => {
				clearTimeout(locationTimeoutTimer)
				this.isLocating = false
			}
			let nativeLocationSucceeded = false
			wx.getFuzzyLocation({
				type: 'gcj02',
				success: async (location) => {
					nativeLocationSucceeded = true
					try {
						this.currentLocation = {
							latitude: location.latitude,
							longitude: location.longitude
						}
						if (this.isReverseGeocoderQuotaLimited()) {
							this.currentCity = '定位失败'
							if (force) {
								uni.showToast({
									title: '定位解析今日已达上限',
									icon: 'none'
								})
							}
							return
						}
						try {
							const city = await this.reverseGeocodeLocation(location.latitude, location.longitude)
							if (city) {
								this.currentCity = city
								uni.setStorageSync(HOME_LOCATION_CACHE_KEY, {
									city,
									location: this.currentLocation,
									time: Date.now()
								})
							} else {
								this.currentCity = '定位失败'
							}
						} catch (error) {
							if (error && error.status === 121) {
								this.markReverseGeocoderQuotaLimited()
								console.warn('逆地理解析配额已用完，今日不再请求腾讯接口:', error)
								if (force) {
									uni.showToast({
										title: '定位解析今日已达上限',
										icon: 'none'
									})
								}
							} else {
								console.error('逆地理解析失败:', error)
								if (force) {
									const reverseMsg = (error && (error.message || error.errMsg)) ? String(error.message || error.errMsg) : JSON.stringify(error || {})
									uni.showModal({
										title: '城市解析调试信息',
										content: reverseMsg || '未知错误',
										showCancel: false
									})
								}
							}
							this.currentCity = '定位失败'
						}
					} finally {
						finishLocationFlow()
					}
				},
				fail: (error) => {
					console.error('首页模糊定位失败:', error)
					this.currentCity = '定位失败'
					const errMsg = (error && error.errMsg) ? String(error.errMsg) : ''
					if (force) {
						uni.showModal({
							title: '定位调试信息',
							content: errMsg || '未知错误',
							showCancel: false
						})
					}
					if (/auth|permission|deny|拒绝/i.test(errMsg)) {
						this.showLocationPermissionModal()
					}
				},
				complete: () => {
					if (!nativeLocationSucceeded) {
						finishLocationFlow()
					}
				}
			})
		},
		showLocationPermissionModal() {
			uni.showModal({
				title: '定位失败',
				content: '需要开启模糊定位权限后才能获取当前位置',
				confirmText: '去开启',
				cancelText: '取消',
				success: (modalRes) => {
					if (!modalRes.confirm) return
					uni.openSetting({
						success: (settingRes) => {
							if (settingRes.authSetting && settingRes.authSetting['scope.userFuzzyLocation']) {
								this.initLocation(true)
							}
						}
					})
				}
			})
		},
		reverseGeocodeLocation(latitude, longitude) {
			return new Promise((resolve, reject) => {
				const url = buildTencentMapSignedUrl(QQ_MAP_GEOCODER_PATH, {
					location: `${latitude},${longitude}`,
					key: QQ_MAP_KEY,
					get_poi: 0,
					output: 'json'
				})
				uni.request({
					url,
					method: 'GET',
					timeout: 8000,
					success: (res) => {
						const data = res.data || {}
						const component = data.result && data.result.address_component ? data.result.address_component : {}
						const city = this.formatCityName(component.city || component.district || component.province)
						if (data.status === 0 && city) {
							resolve(city)
							return
						}
						reject(data)
					},
					fail: reject
				})
			})
		},
		getTodayKey() {
			const date = new Date()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')
			return `${date.getFullYear()}-${month}-${day}`
		},
		isReverseGeocoderQuotaLimited() {
			return uni.getStorageSync(HOME_GEOCODER_QUOTA_LIMIT_KEY) === this.getTodayKey()
		},
		markReverseGeocoderQuotaLimited() {
			uni.setStorageSync(HOME_GEOCODER_QUOTA_LIMIT_KEY, this.getTodayKey())
		},
		formatCityName(city = '') {
			return String(city || '').replace(/市$/, '')
		},
		isUsableCachedCity(city) {
			return !['定位中', '定位失败'].includes(String(city || '').trim())
		},
		// 点击轮播图跳转
		goToBanner(item) {
			uni.navigateTo({
				url: `/pages/banner/banner?id=${item.id}`
			})
		},

		// 获取首页数据
		async getHomeData() {
			if (this.isHomeLoading) return
			this.isHomeLoading = true
			this.homeError = ''
			try {
				// 从本地存储获取用户ID
				const userId = uni.getStorageSync('userId') || 1
				let params = {
					userId: userId
				}
				let res = await request('api2/Drama/getHome', params, 'GET', false, {
					cacheTime: 60000,
					timeout: 12000
				})

				// 处理返回的数据
				if (res.code == 0 && res.data) {
					// 处理 banner 数据
					if (res.data.banner && res.data.banner.length > 0) {
						this.bannerList = res.data.banner.slice(0, 5).map(item => ({
							id: item.id,
							img_url: item.img_url
						}))
					}

					// 处理 bxbj（百县百剧）数据
					if (res.data.bxbj && res.data.bxbj.length > 0) {
						const homeVideos = this.uniqueDramaItems(res.data.bxbj).map(this.formatVideoItem)
						this.videoList = homeVideos.slice(0, 4)
						if (this.videoList.length < 4) {
							await this.fillVideoListFromDrama()
						}
					}

					// 处理 xkjc（喀什剧场）数据：getHome.xkjc 当前只有 type=3 的重复推荐，首页改为从剧场列表补齐。
					const fallbackTheaters = this.uniqueTheaterItems(res.data.xkjc || []).map(this.formatTheaterItem)
					await this.fillTheaterListFromDrama(fallbackTheaters)
				} else {
					this.homeError = res.message || res.msg || '首页数据加载失败'
				}
			} catch (error) {
				console.error('接口调用失败:', error)
				this.homeError = '网络较慢，请稍后重试'
			} finally {
				this.isHomeLoading = false
			}
		},
		formatVideoItem(item) {
			return {
				id: item.id,
				cover: item.cover_url,
				title: item.title,
				desc: item.desc_text,
				episodes: item.total_episodes || 0
			}
		},
		formatTheaterItem(item) {
			return {
				id: item.id,
				type: Number(item.type || 3),
				cover: item.cover_url,
				title: item.title,
				desc: item.desc_text,
				address: item.address_name || item.title,
				brandId: item.brand && item.brand.id ? item.brand.id : '',
				brandIcon: item.brand && item.brand.img_url ? item.brand.img_url : '',
				isFollow: item.brand && item.brand.is_follow == 1,
				zan_num: Number(item.zan_num || 0),
				isLiked: item.is_zan == 1
			}
		},
		uniqueDramaItems(list = []) {
			const seen = new Set()
			return list.filter(item => {
				const key = [
					item.title || '',
					item.cover_url || '',
					item.desc_text || ''
				].join('|')
				if (seen.has(key)) return false
				seen.add(key)
				return true
			})
		},
		uniqueTheaterItems(list = []) {
			const seen = new Set()
			return list.filter(item => {
				const key = [
					item.title || '',
					item.total_episodes || '',
					item.cover_url || ''
				].join('|')
				if (seen.has(key)) return false
				seen.add(key)
				return true
			})
		},
		async fillVideoListFromDrama() {
			let res
			try {
				const userId = uni.getStorageSync('userId') || 1
				res = await request('api2/Drama/getDrama', {
					userId,
					type: 1,
					page: 1,
					page_size: 12
				}, 'GET', false, {
					cacheTime: 60000,
					timeout: 12000
				})
			} catch (error) {
				return
			}
			if (res.code != 0 || !Array.isArray(res.data)) return

			const merged = this.uniqueDramaItems([
				...this.videoList.map(item => ({
					id: item.id,
					cover_url: item.cover,
					title: item.title,
					desc_text: item.desc,
					total_episodes: item.episodes
				})),
				...res.data
			])
			this.videoList = merged.slice(0, 4).map(this.formatVideoItem)
		},
		async fillTheaterListFromDrama(fallbackList = []) {
			try {
				const userId = uni.getStorageSync('userId') || 1
				const results = await Promise.all(HOME_THEATER_TYPES.map(type => {
					return request('api2/Drama/getDrama', {
						userId,
						type,
						page: 1,
						page_size: 8
					}, 'GET', false, {
						cacheTime: 60000,
						timeout: 12000
					}).catch(() => ({ code: -1, data: [] }))
				}))

				const merged = this.uniqueTheaterItems([].concat(...results.map(res => {
					return res.code == 0 && Array.isArray(res.data) ? res.data : []
				})))
					.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
					.map(this.formatTheaterItem)

				this.theaterList = merged.length > 0 ? merged.slice(0, 4) : fallbackList.slice(0, 4)
				await this.syncTheaterLikeStateFromApi()
			} catch (error) {
				this.theaterList = fallbackList.slice(0, 4)
				await this.syncTheaterLikeStateFromApi()
			}
		},
		initNavigationBar() {
			// #ifdef MP-WEIXIN
			// 获取系统信息
			const systemInfo = uni.getSystemInfoSync()
			this.statusBarHeight = systemInfo.statusBarHeight || 0

			// 获取胶囊按钮信息
			const capsule = uni.getMenuButtonBoundingClientRect()
			this.capsuleInfo = capsule
			// #endif

			// #ifndef MP-WEIXIN
			// 非小程序端设置默认值
			this.statusBarHeight = 20
			this.capsuleInfo = {
				left: 20,
				top: 44,
				height: 32
			}
			// #endif
		},
		// 跳转到短剧页面
		goToShortPlays(item) {
			uni.navigateTo({
				url: `/subPackages/feature/shortPlays/shortPlays?id=${item.id}`
			})
		},
		// 跳转到剧场详情页面
		goToTheaterDetail(item) {
			uni.navigateTo({
				url: `/subPackages/feature/theater/theaterDetail?dramaId=${item.id}&isLiked=${item.isLiked ? 1 : 0}&zanNum=${Number(item.zan_num || 0)}&dramaType=${Number(item.type || 3)}`
			})
		},
		// 跳转到百县百剧页面
		goToHundredPlays() {
			uni.navigateTo({
				url: '/subPackages/feature/HundredPlays/hunderplay'
			})
		},
		// 跳转到喀什剧场页面
		goToTheater() {
			uni.navigateTo({
				url: '/subPackages/feature/theater/theater'
			})
		},
		// 跳转到地图页面
		goToMap(e) {
			const type = String(e || '82')
			if (uni.getStorageSync(MAP_GUIDE_STORAGE_KEY)) {
				uni.navigateTo({
					url: '/subPackages/feature/map_two/detail?type=' + type
				})
				return
			}
			uni.navigateTo({
				url: '/subPackages/feature/map/map?type=' + type + '&firstGuide=1'
			})
		},
		async goToTheaterLocation(item) {
			const keyword = item && item.address ? String(item.address).trim() : ''
			const defaultType = '79'
			if (!keyword) {
				this.goToMap(defaultType)
				return
			}
			try {
				const res = await request('api2/Map/lst', {
					page: 1,
					page_size: 20,
					userId: uni.getStorageSync('userId') || 1,
					classId: defaultType,
					title: keyword
				}, 'GET', false, {
					cacheTime: 60000,
					timeout: 12000
				})
				const list = res && res.code == 0 && Array.isArray(res.data) ? res.data : []
				const target = list.find(mapItem => mapItem.title === keyword) || list[0]
				if (target && target.id) {
					uni.navigateTo({
						url: `/subPackages/feature/map_two/detail?type=${defaultType}&masters=${target.id}`
					})
					return
				}
			} catch (error) {
				console.error('地图地点查询失败:', error)
			}
			this.goToMap(defaultType)
		},
		toSearch() {
			uni.navigateTo({
				url: '/subPackages/feature/map_two/search'
			})
		},
		// 处理点赞
		async handleLike(item) {
			const isLiked = item.isLiked
			const action = isLiked ? 2 : 1  // 1点赞，2取消点赞

			const userId = this.getCurrentUserId()
			if (!userId) {
				uni.showModal({
					title: '提示',
					content: '登录信息缺失，请重新登录',
					showCancel: false,
					success: () => {
						uni.reLaunch({ url: '/pagesLogin/auth/auth' })
					}
				})
				return
			}

			try {
				const params = {
					userId: userId,
					dataId: item.id,
					action: action,
					type: Number(item.type || 3)
				}

				const res = await request('api2/Drama/dramaZan', params, 'GET')
				console.log('点赞结果:', res)

				if (res.code == 0) {
					// 切换点赞状态
					item.isLiked = !isLiked
					item.zan_num = item.isLiked ? Number(item.zan_num || 0) + 1 : Math.max(Number(item.zan_num || 0) - 1, 0)
					uni.showToast({
						title: isLiked ? '已取消点赞' : '点赞成功',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('点赞失败:', error)
			}
		},
		// 处理分享
		async handleShare(item) {
			console.log('🎬 点击分享的剧场数据:', item)
			console.log('🆔 剧场ID (dataId):', item.id)

			// 保存当前要分享的剧场信息,供 onShareAppMessage 使用
			this.currentShareItem = item

			// 调用分享统计接口
			try {
				const userId = uni.getStorageSync('userId') || 1
				const params = {
					userId: userId,
					dataId: item.id,
					type: 2
				}

				console.log('📤 分享统计参数:', params)

				const res = await request('api2/Drama/dramaShare', params, 'GET')
				console.log('✅ 分享统计返回:', res)
			} catch (error) {
				console.error('❌ 分享统计失败:', error)
			}
		},
		// 处理关注
		async handleFollow(item) {
			try {
				console.log('👤 点击关注的剧场数据:', item)
				console.log('🏷️ 品牌ID (brandId):', item.brandId)
				console.log('📊 当前关注状态:', item.isFollow)

				// 从本地存储获取用户ID
				const userId = uni.getStorageSync('userId') || 1

				// 根据当前状态决定操作: 已关注则取消(2), 未关注则关注(1)
				const action = item.isFollow ? 2 : 1

				const params = {
					userId: userId,
					brandId: item.brandId, // 品牌id
					action: action // 操作: 1=关注 2=取消
				}

				console.log('📤 关注请求参数:', params)

				const res = await request('api2/Drama/brandFollow', params, 'GET')

				console.log('✅ 关注接口返回:', res)

				if (res.code == 0) {
					// 切换关注状态
					item.isFollow = !item.isFollow

					uni.showToast({
						title: item.isFollow ? '关注成功' : '已取消关注',
						icon: 'success'
					})
				} else {
					uni.showToast({
						title: res.msg || '操作失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('❌ 关注操作失败:', error)
				uni.showToast({
					title: '操作失败',
					icon: 'none'
				})
			}
		}
	}
}
</script>

<style scoped>
.container {
	padding: 0 0 20px 0;
	background-color: #F5F1EE;
	min-height: 100vh;
}

.custom-nav {
	width: 100%;
	height: 200px;
	position: relative;
	padding: 15px 20px 20px;
	box-sizing: border-box;
}

/* 顶部logo区域 */
.nav-top {
	display: flex;
	align-items: center;
	min-height: 92px;
}

.nav-icon {
	width: 116px;
	height: 42px;
	transform: translateY(15px);
}

.nav-logo-text {
	display: flex;
	flex-direction: column;
}

.nav-title {
	font-size: 16px;
	font-weight: bold;
	color: #333;
	line-height: 18px;
}

.nav-subtitle {
	font-size: 12px;
	color: #666;
	line-height: 14px;
}

/* 底部搜索区域 */
.nav-search-area {
	display: flex;
	gap: 10px;
	align-items: center;
	width: 100%;
	margin-top: 8px;
}

.search-box {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	/* background-color: rgba(255, 255, 255, 0.9); */
	background: #a48f6e29;
	border-radius: 20px;
	padding: 8px 15px;
	gap: 8px;
	border: 1px solid #FFFFFF;
}

.search-icon {
	font-size: 16px;
	color: #999;
}

.search-input {
	flex: 1;
	min-width: 0;
	border: none;
	background: transparent;
	font-size: 14px;
	color: #A48F6E;
}

.location-box {
	flex: 0 0 90px;
	padding: 10px 0;
	white-space: nowrap;
	display: flex;
	align-items: center;
	justify-content: center;
  box-sizing: border-box;
}
.nav_imgs{
  width: 22px;
	height: 20px;
}
.nav_img{
	width: 24px;
	height: 20px;
	margin-right: 5px;
}
.location-text {
	color: #6D4f1f;
	font-size: 16px;
  margin-left: 5px;
	width: 48px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.banner {
	width: 100%;
	height: 280rpx;
	padding: 0 20rpx;
	box-sizing: border-box;
}

.swiper {
	width: 100%;
	height: 100%;
	border-radius: 12rpx;
	overflow: hidden;
}

.banner-img {
	width: 100%;
	height: 100%;
}

.section {
	padding: 14px 15px;
	position: relative;
	z-index: 1;
	overflow: hidden;
	box-sizing: border-box;
}

.home-loading,
.home-error {
	margin: 16rpx 30rpx 0;
	padding: 18rpx 24rpx;
	border-radius: 16rpx;
	font-size: 24rpx;
	text-align: center;
}

.home-loading {
	color: #6D4F1F;
	background: rgba(164, 143, 110, 0.12);
}

.home-error {
	color: #9B3A2F;
	background: rgba(155, 58, 47, 0.08);
}

/* 祥云背景装饰 */
.cloud-bg {
	position: absolute;
	width: 80px;
	height: 80px;
	z-index: 0;
	left: -5rpx;
	top: 5rpx;
}

.cloud-top-right {
	top: -20px;
	right: -20px;
	transform: scaleX(-1);
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 14px;
	position: relative;
	z-index: 1;
}

.section-title {
	font-size: 18px;
	color: #170506;
}

.arrow-icon {
	width: 24px;
	height: 24px;
}

.section-more {
	font-size: 12px;
	color: #999;
}

/* 功能图标网格 */
.function-grid {
	display: flex;
	justify-content: space-around;
	align-items: center;
	margin-bottom: 4px;
	position: relative;
	z-index: 1;
}

.function-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
}

.function-icon {
	width: 96rpx;
	height: 96rpx;
	border-radius: 12px;
}

.function-text {
	font-size: 13px;
	color: #170506;
	text-align: center;
}

/* 视频卡片网格 */
.video-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
	position: relative;
	z-index: 1;
}

.video-card {
	display: flex;
	flex-direction: column;
	background: #FFFFFF;
	border-radius: 12rpx;
	overflow: hidden;
}
.video_bot{
	width: 100%;
	height: 200rpx;
	margin-top: 25px;
}
.video-image-wrapper {
	position: relative;
	width: 100%;
	height: 200rpx;
}

.video-image {
	width: 100%;
	height: 100%;
}

.video-badge {
	position: absolute;
	bottom: 0px;
	right: 10rpx;
	background: rgba(0, 0, 0, 0.6);
	color: #FFFFFF;
	font-size: 20rpx;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
}

.video-info {
	padding: 16rpx;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.video-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #170506;
	line-height: 1.3;
}

.video-desc {
	font-size: 22rpx;
	color: #999999;
	line-height: 1.5;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
}

.grid-list {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}

.grid-item {
	width: 48%;
	margin-bottom: 10px;
}

.grid-image {
	width: 100%;
	height: 100px;
	border-radius: 4px;
}

.grid-text {
	font-size: 14px;
	margin-top: 5px;
}

.article-list {
	display: flex;
	flex-direction: column;
}

.article-item {
	display: flex;
	margin-bottom: 10px;
}

.article-image {
	width: 120px;
	height: 80px;
	border-radius: 4px;
	margin-right: 10px;
}

.article-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.article-title {
	font-size: 16px;
	font-weight: bold;
}

.article-desc {
	font-size: 12px;
	color: #666;
	line-height: 1.5;
}

/* 喀什剧场卡片样式 */
.theater-card {
	background: #FFFFFF;
	border-radius: 16rpx;
	overflow: hidden;
	position: relative;
	z-index: 1;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
	margin-top: 20px;
}

.theater-image-wrapper {
	width: 100%;
	height: 400rpx;
	position: relative;
}

.theater-image {
	width: 100%;
	height: 100%;
}

.theater-content {
	padding: 24rpx;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.theater-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.theater-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #170506;
}

.theater-detail {
	display: flex;
	align-items: center;
	gap: 4rpx;
}

.detail-text {
	font-size: 24rpx;
	color: #999999;
}

.detail-arrow {
	width: 16rpx;
	height: 16rpx;
}

.theater-desc {
	font-size: 26rpx;
	color: #666666;
	line-height: 1.6;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	line-clamp: 3;
	-webkit-box-orient: vertical;
}

.theater-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: 16rpx;
}

.footer-left {
	display: flex;
	align-items: center;
	gap: 16rpx;
	flex: 1 1 0;
	min-width: 0;
}

.footer-center {
	display: flex;
	justify-content: center;
	align-items: center;
	flex: 1 1 0;
	min-width: 0;
}

.footer-logo {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	flex-shrink: 0;
}

.follow-btn {
	display: flex;
	align-items: center;
	gap: 4rpx;
	padding: 8rpx 16rpx;
	background: #FFFFFF;
	border: 1px solid #DED9CE;
	border-radius: 99px;
	flex-shrink: 0;
}

/* 已关注状态 */
.follow-btn.followed {
	background: #F5F1EE;
	border: 1px solid #C4B5A0;
}

.follow-btn.followed .follow-text {
	color: #999999;
}

.follow-icon {
	font-size: 24rpx;
	color: #6D4F1F;
	font-weight: bold;
}

.follow-text {
	font-size: 23rpx;
	color: #6D4F1F;
}

.location-tag {
	display: flex;
	align-items: center;
	gap: 10rpx;
	padding: 6rpx 12rpx;
	background: #F5F5F5;
	border-radius: 99px;
	flex-shrink: 0;
}

.location-icon {
	width: 22rpx;
	height: 23rpx;
}

.location-name {
	font-size: 26rpx;
	color: #170506;
}

.footer-right {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	flex: 1 1 0;
	min-width: 0;
}

.action-group {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 4rpx;
	border: 1rpx solid rgba(109, 79, 31, 0.22);
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.92);
	box-shadow: 0 4rpx 12rpx rgba(109, 79, 31, 0.08);
	box-sizing: border-box;
}

.action-btn {
	width: 54rpx;
	height: 54rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	margin: 0;
	border: none;
	border-radius: 50%;
	background: transparent;
	line-height: 1;
	box-sizing: border-box;
}

.action-btn:active {
	background: rgba(109, 79, 31, 0.08);
}

.action-divider {
	width: 1rpx;
	height: 28rpx;
	background: rgba(109, 79, 31, 0.18);
	margin: 0 2rpx;
}

.action-icon {
	width: 40rpx;
	height: 40rpx;
	display: block;
	flex-shrink: 0;
}

.action-icon-red {
	filter: brightness(0) saturate(100%) invert(20%) sepia(89%) saturate(3850%) hue-rotate(345deg) brightness(95%) contrast(96%);
}

.share-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	margin: 0;
	background: transparent;
	border: none;
	line-height: 1;
	color: inherit;
}

.share-btn::after {
	border: none;
}
</style>
<style scoped src="./index-kashgar-landing.css"></style>
<style scoped src="./index-kashgar-play.css"></style>
<style scoped src="./index-kashgar-notes.css"></style>
<style scoped src="./index-theme.css"></style>
