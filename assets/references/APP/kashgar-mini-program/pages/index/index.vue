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
		kashgarTravelHero: {
			title: '遇见喀什，遇见千年',
			subtitle: '丝路古城 · 多元文化 · 人间烟火'
		},
		kashgarMapShortcuts: [
			{
				key: 'route-guide',
				title: '路线指南',
				type: '82',
				cover: '/static/kashgar/map-illustration.png'
			},
			{
				key: 'homestay',
				title: '民宿酒店',
				type: '81',
				cover: '/static/kashgar/place-oldstreet.png'
			},
			{
				key: 'food',
				title: '好物美食',
				type: '80',
				cover: '/static/kashgar/note-baked-bun.png'
			},
			{
				key: 'camera-city',
				title: '上镜喀什',
				type: '79',
				cover: '/static/kashgar/guide-old-city.png'
			}
		],
		kashgarTravelNotes: [
			{
				key: 'note-old-city-winter',
				id: 701,
				tag: '喀什古城',
				title: '喀什古城的冬日时光',
				desc: '雪落古城，阳光洒在土黄色的墙上，老城的每一面墙都会讲故事。',
				author: '行走的风',
				location: '喀什古城',
				likes: '826',
				cover: '/static/kashgar/note-old-city-winter.png'
			},
			{
				key: 'note-baked-bun',
				id: 702,
				tag: '特色美食',
				title: '喀什烤包子，外酥里嫩超满足',
				desc: '皮薄馅大，羊肉鲜香多汁，刚出炉的时候咬一口下去满嘴留香。',
				author: '美食探路者',
				location: '喀什老城',
				likes: '429',
				cover: '/static/kashgar/note-baked-bun.png'
			},
			{
				key: 'note-muqam',
				id: 703,
				tag: '非遗文化·木卡姆',
				title: '听听木卡姆，千年旋律的回响',
				desc: '在喀什听一场木卡姆，感受非遗的魅力与深厚的文化底蕴。',
				author: '热爱生活',
				location: '艾提尕尔广场',
				likes: '589',
				cover: '/static/kashgar/note-muqam.png'
			},
			{
				key: 'note-teahouse',
				id: 704,
				tag: '老茶馆',
				title: '老茶馆里的喀什慢时光',
				desc: '一壶茶，几碟点心，听老人讲故事，感受喀什人的惬意与热情。',
				author: '喀什慢记',
				location: '高台民居旁',
				likes: '468',
				cover: '/static/kashgar/note-teahouse.png'
			},
			{
				key: 'note-window',
				id: 705,
				tag: '花窗之美',
				title: '喀什花窗，光影里的艺术',
				desc: '精美的花窗雕刻，光影交织间，是匠人留下的独特美学。',
				author: '光影猎手',
				location: '喀什老城',
				likes: '368',
				cover: '/static/kashgar/note-window.png'
			},
			{
				key: 'note-bazaar',
				id: 706,
				tag: '巴扎风情',
				title: '巴扎的烟火气，最抚人心',
				desc: '香料、干果、手工艺品琳琅满目，这里是喀什最真实的生活舞台。',
				author: '旅行小琳',
				location: '喀什大巴扎',
				likes: '512',
				cover: '/static/kashgar/note-bazaar.png'
			}
		],
		kashgarActions: [
			{
				key: 'scan',
				title: '扫一扫',
				desc: '景点/书本讲解',
				className: 'kashgar-action-green',
				symbolClass: 'kashgar-action-symbol-scan',
				target: 'map'
			},
			{
				key: 'route',
				title: '跟着游记去旅行',
				desc: '精选游记路线',
				className: 'kashgar-action-gold',
				symbolClass: 'kashgar-action-symbol-route',
				target: 'guide'
			},
			{
				key: 'record',
				title: '记录旅行',
				desc: '随手记，自动成书',
				className: 'kashgar-action-blue',
				symbolClass: 'kashgar-action-symbol-camera',
				target: 'diary'
			}
		],
		kashgarPlaces: [
			{
				title: '艾提尕尔清真寺',
				desc: '喀什地标建筑',
				type: '79',
				cover: '/static/kashgar/place-qingzhen.png'
			},
			{
				title: '高台民居',
				desc: '喀什特色民居',
				type: '79',
				cover: '/static/kashgar/place-gaotai.png'
			},
			{
				title: '喀什古城老街',
				desc: '千年古城记忆',
				type: '79',
				cover: '/static/kashgar/place-oldstreet.png'
			}
		],
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
		normalizeXunjingTriggerTargetPath(trigger = {}) {
			if (!trigger || !trigger.poiCode) {
				return ''
			}
			const query = this.stringifyXunjingQuery({
				poiCode: trigger.poiCode,
				poiName: trigger.poiName,
				intent: trigger.intent,
				confidence: trigger.confidence,
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
.kashgar-home {
	position: relative;
	min-height: 100vh;
	padding: 0 28rpx 300rpx;
	box-sizing: border-box;
	background: #F7EFE4;
	overflow: hidden;
}

.kashgar-landing-entry {
	min-height: 100vh;
	padding: 42rpx 40rpx 54rpx;
	background:
		linear-gradient(180deg, rgba(255, 247, 232, 0.96) 0%, rgba(248, 227, 194, 0.64) 46%, rgba(242, 220, 181, 0.86) 100%),
		url('/static/kashgar/home-top-mountains.png') center top / cover no-repeat,
		#F8EBD2;
	font-family: "Songti SC", "STSong", "PingFang SC", serif;
	color: #6C3C1D;
}

.kashgar-landing-nav,
.kashgar-play-nav {
	position: relative;
	z-index: 3;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.kashgar-landing-brand,
.kashgar-play-brand {
	display: flex;
	align-items: center;
	gap: 14rpx;
}

.kashgar-landing-logo,
.kashgar-play-brand-icon {
	width: 58rpx;
	height: 58rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #8D5627;
	color: #F8EBD2;
	font-size: 34rpx;
	font-weight: 900;
	box-shadow: 0 8rpx 18rpx rgba(92, 50, 18, 0.16);
}

.kashgar-landing-brand-copy {
	display: flex;
	flex-direction: column;
}

.kashgar-landing-brand-name,
.kashgar-play-brand-name {
	font-size: 34rpx;
	line-height: 42rpx;
	font-weight: 900;
	color: #4F2B14;
}

.kashgar-landing-brand-sub {
	margin-top: 3rpx;
	font-size: 17rpx;
	line-height: 22rpx;
	color: #9B6841;
}

.kashgar-landing-capsule {
	width: 158rpx;
	height: 60rpx;
	border-radius: 999rpx;
	background: rgba(255, 250, 241, 0.8);
	border: 1rpx solid rgba(107, 72, 38, 0.18);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16rpx;
	color: #1C1711;
	font-size: 28rpx;
}

.kashgar-landing-capsule-line {
	width: 1rpx;
	height: 34rpx;
	background: rgba(90, 62, 36, 0.18);
}

.kashgar-landing-ring {
	font-size: 38rpx;
	line-height: 38rpx;
	font-weight: 900;
}

.kashgar-landing-meta {
	position: relative;
	z-index: 3;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 12rpx;
	margin-top: 34rpx;
	font-size: 26rpx;
	line-height: 34rpx;
	font-weight: 800;
	color: #6D431F;
}

.kashgar-landing-pin,
.kashgar-landing-sun {
	color: #9B5E28;
	font-size: 28rpx;
}

.kashgar-landing-meta-line {
	width: 1rpx;
	height: 28rpx;
	background: rgba(101, 66, 32, 0.3);
}

.kashgar-landing-title-wrap {
	position: relative;
	z-index: 3;
	display: flex;
	flex-direction: column;
	margin-top: 22rpx;
}

.kashgar-landing-title {
	font-size: 86rpx;
	line-height: 98rpx;
	font-weight: 900;
	color: #7A421E;
	letter-spacing: 0;
	text-shadow: 0 4rpx 0 rgba(255, 245, 225, 0.54);
}

.kashgar-landing-tags {
	position: relative;
	z-index: 3;
	margin-top: 24rpx;
	padding: 14rpx 24rpx;
	border-radius: 999rpx;
	background: rgba(146, 90, 42, 0.9);
	border: 3rpx solid rgba(255, 238, 197, 0.84);
	color: #FFFFFF;
	text-align: center;
	font-size: 25rpx;
	line-height: 34rpx;
	font-weight: 800;
	box-shadow: 0 8rpx 20rpx rgba(105, 57, 20, 0.18);
}

.kashgar-landing-map-card {
	position: relative;
	z-index: 2;
	height: 530rpx;
	margin: 18rpx -18rpx 0;
	overflow: hidden;
	border-radius: 56rpx;
	background: rgba(242, 217, 176, 0.28);
	mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.96), rgba(0, 0, 0, 0.74) 82%, rgba(0, 0, 0, 0.15));
}

.kashgar-landing-map {
	width: 100%;
	height: 100%;
	opacity: 0.95;
	filter: saturate(0.9);
}

.kashgar-landing-guide {
	position: relative;
	z-index: 4;
	display: flex;
	align-items: flex-end;
	gap: 16rpx;
	margin-top: -106rpx;
}

.kashgar-landing-avatar {
	width: 208rpx;
	height: 292rpx;
	object-fit: contain;
	border-radius: 36rpx;
	filter: drop-shadow(0 12rpx 18rpx rgba(78, 46, 19, 0.18));
}

.kashgar-landing-bubble {
	display: flex;
	flex-direction: column;
	min-width: 0;
	max-width: 336rpx;
	padding: 22rpx 28rpx;
	border-radius: 50rpx;
	background: rgba(255, 247, 232, 0.92);
	border: 2rpx solid rgba(163, 112, 62, 0.28);
	color: #7A4A26;
	font-size: 26rpx;
	line-height: 36rpx;
	font-weight: 800;
	text-align: center;
	box-shadow: 0 10rpx 22rpx rgba(90, 54, 20, 0.12);
}

.kashgar-landing-enter {
	position: relative;
	z-index: 5;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 26rpx;
	height: 92rpx;
	margin: 24rpx 46rpx 0;
	border-radius: 999rpx;
	background: linear-gradient(90deg, #60B4B4 0%, #FFF4D9 36%, #F0C97D 100%);
	border: 4rpx solid rgba(255, 244, 211, 0.96);
	box-shadow: 0 15rpx 32rpx rgba(93, 56, 18, 0.2);
	color: #744019;
	font-size: 40rpx;
	line-height: 44rpx;
	font-weight: 900;
}

.kashgar-landing-enter-icon {
	width: 54rpx;
	height: 54rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(112, 68, 24, 0.92);
	color: #FFF6D8;
	font-size: 30rpx;
}

.kashgar-play-home {
	padding: 42rpx 28rpx 248rpx;
	background:
		linear-gradient(180deg, rgba(255, 249, 236, 0.98), rgba(255, 250, 241, 0.86) 42%, #FFFDFC 100%),
		url('/static/kashgar/home-top-mountains.png') center top / cover no-repeat,
		#FFF6E9;
	font-family: "PingFang SC", "Songti SC", sans-serif;
}

.kashgar-play-nav-right {
	display: flex;
	align-items: center;
	gap: 10rpx;
	color: #4E3320;
	font-size: 25rpx;
	font-weight: 800;
}

.kashgar-play-nav-pin {
	color: #8D5C2B;
}

.kashgar-play-hero {
	position: relative;
	min-height: 284rpx;
	margin-top: 16rpx;
	overflow: hidden;
}

.kashgar-play-chat-cta {
	position: absolute;
	z-index: 4;
	right: 64rpx;
	top: 640rpx;
	width: 250rpx;
	height: 76rpx;
	margin: 0;
	padding: 0;
	border-radius: 999rpx;
	background: rgba(255, 248, 234, 0);
	color: rgba(125, 79, 39, 0);
	font-size: 26rpx;
	line-height: 32rpx;
	font-weight: 900;
	box-shadow: none;
}

.kashgar-hero {
	position: relative;
	min-height: 320rpx;
	padding-top: 40rpx;
	overflow: hidden;
}

.kashgar-hero-building {
	position: absolute;
	right: -80rpx;
	top: 78rpx;
	width: 520rpx;
	height: 292rpx;
	opacity: 0.72;
	border-bottom-left-radius: 160rpx;
}

.kashgar-status {
	position: relative;
	z-index: 2;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.kashgar-brand {
	display: flex;
	align-items: center;
	min-height: 64rpx;
}

.kashgar-brand-name {
	font-size: 42rpx;
	font-weight: 800;
	color: #4B2B14;
	letter-spacing: 0;
}

.kashgar-city {
	display: flex;
	align-items: center;
	padding: 12rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(255, 248, 238, 0.8);
	color: #5A3518;
	font-size: 24rpx;
	font-weight: 700;
}

.kashgar-title-wrap {
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	margin-top: 36rpx;
}

.kashgar-title {
	font-size: 64rpx;
	line-height: 72rpx;
	font-weight: 900;
	color: #4A2914;
	letter-spacing: 0;
}

.kashgar-title-line {
	width: 220rpx;
	height: 6rpx;
	margin: 14rpx 0 16rpx;
	border-radius: 999rpx;
	background: #8C572A;
}

.kashgar-subtitle {
	font-size: 26rpx;
	line-height: 36rpx;
	color: #654129;
}

.kashgar-chat-card {
	position: relative;
	z-index: 3;
	width: 100%;
	height: 260rpx;
	margin-top: -8rpx;
	border-radius: 28rpx;
	overflow: hidden;
	background: #E8D0AE;
	box-shadow: 0 18rpx 44rpx rgba(108, 67, 25, 0.14);
}

.kashgar-chat-image {
	width: 100%;
	height: 100%;
}

.kashgar-action-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 18rpx;
	margin-top: 14rpx;
}

.kashgar-action-card {
	position: relative;
	min-height: 120rpx;
	padding: 18rpx 16rpx;
	box-sizing: border-box;
	border-radius: 24rpx;
	overflow: hidden;
	box-shadow: 0 16rpx 34rpx rgba(106, 67, 29, 0.12);
}

.kashgar-action-green {
	background: linear-gradient(145deg, #69BF80, #4BA767);
}

.kashgar-action-gold {
	background: linear-gradient(145deg, #F2B668, #DF8741);
}

.kashgar-action-blue {
	background: linear-gradient(145deg, #70BCE3, #469BD1);
}

.kashgar-action-title {
	display: block;
	font-size: 26rpx;
	line-height: 32rpx;
	font-weight: 800;
	color: #FFFFFF;
}

.kashgar-action-desc {
	display: block;
	margin-top: 4rpx;
	font-size: 21rpx;
	line-height: 28rpx;
	color: rgba(255, 255, 255, 0.88);
}

.kashgar-action-symbol {
	position: absolute;
	right: 18rpx;
	bottom: 16rpx;
	width: 58rpx;
	height: 58rpx;
	color: #FFFFFF;
	opacity: 0.92;
}

.kashgar-symbol-scan,
.kashgar-symbol-route,
.kashgar-symbol-camera {
	position: relative;
	width: 100%;
	height: 100%;
}

.kashgar-symbol-corner {
	position: absolute;
	width: 17rpx;
	height: 17rpx;
	border-color: rgba(255, 255, 255, 0.96);
}

.kashgar-symbol-corner-tl {
	left: 0;
	top: 0;
	border-left: 5rpx solid;
	border-top: 5rpx solid;
	border-top-left-radius: 6rpx;
}

.kashgar-symbol-corner-tr {
	right: 0;
	top: 0;
	border-right: 5rpx solid;
	border-top: 5rpx solid;
	border-top-right-radius: 6rpx;
}

.kashgar-symbol-corner-bl {
	left: 0;
	bottom: 0;
	border-left: 5rpx solid;
	border-bottom: 5rpx solid;
	border-bottom-left-radius: 6rpx;
}

.kashgar-symbol-corner-br {
	right: 0;
	bottom: 0;
	border-right: 5rpx solid;
	border-bottom: 5rpx solid;
	border-bottom-right-radius: 6rpx;
}

.kashgar-symbol-scan-line {
	position: absolute;
	left: 12rpx;
	right: 12rpx;
	top: 27rpx;
	height: 4rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.95);
}

.kashgar-symbol-route-line {
	position: absolute;
	left: 6rpx;
	right: 10rpx;
	bottom: 12rpx;
	height: 28rpx;
	border-left: 5rpx solid rgba(255, 255, 255, 0.95);
	border-bottom: 5rpx solid rgba(255, 255, 255, 0.95);
	border-radius: 0 0 0 16rpx;
}

.kashgar-symbol-pin {
	position: absolute;
	right: 2rpx;
	top: 0;
	width: 34rpx;
	height: 34rpx;
	border: 6rpx solid rgba(255, 255, 255, 0.95);
	border-radius: 50% 50% 50% 0;
	transform: rotate(-45deg);
}

.kashgar-symbol-pin::after {
	content: '';
	position: absolute;
	left: 8rpx;
	top: 8rpx;
	width: 8rpx;
	height: 8rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.95);
}

.kashgar-symbol-camera {
	box-sizing: border-box;
	margin-top: 10rpx;
	width: 58rpx;
	height: 42rpx;
	border: 6rpx solid rgba(255, 255, 255, 0.95);
	border-radius: 10rpx;
}

.kashgar-symbol-camera::before {
	content: '';
	position: absolute;
	left: 12rpx;
	top: -11rpx;
	width: 20rpx;
	height: 10rpx;
	border-radius: 8rpx 8rpx 0 0;
	background: rgba(255, 255, 255, 0.95);
}

.kashgar-symbol-lens {
	position: absolute;
	left: 18rpx;
	top: 10rpx;
	width: 16rpx;
	height: 16rpx;
	border: 5rpx solid rgba(255, 255, 255, 0.95);
	border-radius: 50%;
}

.kashgar-symbol-flash {
	position: absolute;
	right: 7rpx;
	top: 8rpx;
	width: 7rpx;
	height: 7rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.95);
}

.kashgar-section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 16rpx 4rpx 10rpx;
}

.kashgar-section-title {
	font-size: 32rpx;
	line-height: 44rpx;
	font-weight: 900;
	color: #3D2617;
}

.kashgar-more {
	font-size: 24rpx;
	color: #9B6530;
}

.kashgar-place-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 18rpx;
}

.kashgar-place-card {
	overflow: hidden;
	border-radius: 16rpx;
	background: rgba(255, 252, 247, 0.94);
	box-shadow: 0 12rpx 30rpx rgba(108, 67, 25, 0.1);
}

.kashgar-place-image {
	display: block;
	width: 100%;
	height: 96rpx;
}

.kashgar-place-body {
	padding: 8rpx 12rpx 10rpx;
}

.kashgar-place-title {
	display: block;
	font-size: 22rpx;
	line-height: 30rpx;
	font-weight: 800;
	color: #3E2819;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.kashgar-place-desc {
	display: block;
	margin-top: 4rpx;
	font-size: 19rpx;
	line-height: 26rpx;
	color: #9B806B;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.kashgar-guide-strip {
	position: relative;
	height: 104rpx;
	margin-top: 12rpx;
	border-radius: 24rpx;
	overflow: hidden;
	background: #C89B62;
}

.kashgar-guide-image {
	width: 100%;
	height: 100%;
}

.kashgar-guide-mask {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14rpx 20rpx;
	box-sizing: border-box;
	background: linear-gradient(90deg, rgba(253, 242, 221, 0.96), rgba(238, 202, 151, 0.62), rgba(122, 77, 30, 0.52));
}

.kashgar-guide-copy {
	display: flex;
	flex-direction: column;
}

.kashgar-guide-kicker {
	font-size: 22rpx;
	line-height: 28rpx;
	font-weight: 800;
	color: #74491E;
}

.kashgar-guide-title {
	margin-top: 4rpx;
	font-size: 28rpx;
	line-height: 34rpx;
	font-weight: 900;
	color: #4A2C18;
}

.kashgar-guide-desc {
	margin-top: 4rpx;
	font-size: 20rpx;
	line-height: 28rpx;
	color: #73533B;
}

.kashgar-guide-button {
	min-width: 150rpx;
	padding: 13rpx 22rpx;
	border-radius: 999rpx;
	background: rgba(104, 62, 22, 0.82);
	color: #FFFFFF;
	font-size: 22rpx;
	font-weight: 800;
	text-align: center;
}

.kashgar-enter {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 28rpx;
	height: 66rpx;
	margin-top: 12rpx;
	border-radius: 999rpx;
	background: linear-gradient(180deg, #93622F, #704315);
	color: #FFFFFF;
	font-size: 32rpx;
	font-weight: 900;
	box-shadow: 0 18rpx 34rpx rgba(98, 59, 21, 0.18);
}

.kashgar-enter-arrow {
	font-size: 36rpx;
	line-height: 36rpx;
}

.kashgar-travel-notes-home {
	min-height: 100vh;
	padding: 0 22rpx 250rpx;
	background:
		linear-gradient(180deg, rgba(255, 249, 238, 0.96) 0%, rgba(255, 249, 238, 0.82) 18%, rgba(248, 244, 238, 0.94) 42%, #FFFFFF 100%),
		#FFF8EC;
	overflow: hidden;
	font-family: "PingFang SC", "Songti SC", sans-serif;
}

.kashgar-home-sky {
	position: absolute;
	left: 0;
	top: 0;
	right: 0;
	height: 180rpx;
	overflow: hidden;
	pointer-events: none;
}

.kashgar-home-mountain {
	width: 100%;
	height: 100%;
	opacity: 0.34;
	filter: saturate(0.82);
}

.kashgar-home-nav {
	position: relative;
	z-index: 2;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: 42rpx;
}

.kashgar-home-brand {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.kashgar-home-brand-avatar {
	width: 55rpx;
	height: 55rpx;
	border-radius: 50%;
	border: 3rpx solid rgba(255, 255, 255, 0.86);
	box-shadow: 0 6rpx 14rpx rgba(92, 64, 32, 0.13);
}

.kashgar-home-brand-copy {
	display: flex;
	flex-direction: column;
}

.kashgar-home-brand-name {
	font-size: 28rpx;
	line-height: 31rpx;
	font-weight: 900;
	color: #2D1B10;
}

.kashgar-home-brand-sub {
	margin-top: 2rpx;
	font-size: 17rpx;
	line-height: 20rpx;
	color: #665543;
}

.kashgar-home-capsule {
	width: 118rpx;
	height: 52rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.76);
	border: 1rpx solid rgba(83, 56, 26, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	color: #11100D;
	font-size: 26rpx;
}

.kashgar-home-capsule-line {
	width: 1rpx;
	height: 30rpx;
	background: rgba(62, 47, 31, 0.16);
}

.kashgar-home-ring {
	font-size: 36rpx;
	line-height: 36rpx;
	font-weight: 800;
}

.kashgar-search-row {
	position: relative;
	z-index: 2;
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	align-items: center;
	gap: 18rpx;
	margin-top: 18rpx;
}

.kashgar-search-box {
	height: 56rpx;
	border-radius: 999rpx;
	background: rgba(223, 213, 198, 0.66);
	display: flex;
	align-items: center;
	padding: 0 24rpx;
	box-sizing: border-box;
	gap: 10rpx;
	color: #8C8176;
}

.kashgar-search-icon {
	font-size: 28rpx;
	color: #786E63;
}

.kashgar-search-placeholder {
	font-size: 23rpx;
	line-height: 28rpx;
	color: #8B8176;
	white-space: nowrap;
}

.kashgar-search-city {
	height: 56rpx;
	display: flex;
	align-items: center;
	gap: 8rpx;
	color: #5B452A;
	font-size: 23rpx;
	font-weight: 700;
	white-space: nowrap;
}

.kashgar-search-pin {
	color: #8B6127;
	font-size: 21rpx;
}

.kashgar-search-arrow {
	color: #7B674F;
	font-size: 22rpx;
}

.kashgar-travel-banner {
	position: relative;
	z-index: 2;
	height: 236rpx;
	margin-top: 16rpx;
	border-radius: 24rpx;
	overflow: hidden;
	background: #B9854F;
	box-shadow: 0 14rpx 34rpx rgba(80, 61, 36, 0.13);
}

.kashgar-travel-banner-image {
	width: 100%;
	height: 100%;
}

.kashgar-map-section-head,
.kashgar-notes-section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 18rpx 4rpx 12rpx;
}

.kashgar-map-section-title,
.kashgar-notes-title {
	position: relative;
	font-family: "Songti SC", "STSong", serif;
	font-size: 30rpx;
	line-height: 38rpx;
	font-weight: 900;
	color: #2D2116;
}

.kashgar-map-section-title::after,
.kashgar-notes-title::after {
	content: '';
	position: absolute;
	left: -4rpx;
	right: -8rpx;
	bottom: -2rpx;
	height: 10rpx;
	border-radius: 999rpx;
	background: rgba(198, 140, 65, 0.22);
	z-index: -1;
}

.kashgar-map-section-more,
.kashgar-notes-more {
	display: flex;
	align-items: center;
	gap: 5rpx;
	color: #967457;
	font-size: 21rpx;
	font-weight: 700;
}

.kashgar-map-shortcuts {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 22rpx;
	padding: 0 4rpx;
}

.kashgar-map-shortcut {
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 0;
}

.kashgar-map-shortcut-image {
	width: 80rpx;
	height: 80rpx;
	border-radius: 18rpx;
	background: #E9D7B7;
	border: 3rpx solid rgba(255, 255, 255, 0.9);
	box-shadow: 0 8rpx 18rpx rgba(98, 73, 38, 0.12);
}

.kashgar-map-shortcut-title {
	margin-top: 9rpx;
	color: #4F3B2D;
	font-size: 21rpx;
	line-height: 25rpx;
	font-weight: 700;
	white-space: nowrap;
}

.kashgar-travel-note-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 15rpx;
}

.kashgar-travel-note-card {
	min-width: 0;
	border-radius: 18rpx;
	overflow: hidden;
	background: rgba(255, 255, 255, 0.96);
	border: 1rpx solid rgba(202, 171, 128, 0.2);
	box-shadow: 0 10rpx 24rpx rgba(98, 73, 38, 0.1);
}

.kashgar-note-cover-wrap {
	position: relative;
	height: 116rpx;
	background: #D2B68C;
	overflow: hidden;
}

.kashgar-note-cover {
	width: 100%;
	height: 100%;
}

.kashgar-note-tag {
	position: absolute;
	left: 8rpx;
	top: 8rpx;
	max-width: 150rpx;
	padding: 4rpx 10rpx;
	border-radius: 999rpx;
	background: rgba(255, 248, 233, 0.9);
	color: #7D542A;
	font-size: 17rpx;
	font-weight: 800;
	line-height: 20rpx;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.kashgar-note-likes {
	position: absolute;
	right: 8rpx;
	top: 8rpx;
	display: flex;
	align-items: center;
	gap: 3rpx;
	color: #FFFFFF;
	text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.28);
	font-size: 18rpx;
	font-weight: 700;
}

.kashgar-note-body {
	padding: 10rpx 10rpx 12rpx;
	box-sizing: border-box;
}

.kashgar-note-title {
	display: block;
	color: #2B1B12;
	font-size: 23rpx;
	line-height: 28rpx;
	font-weight: 900;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.kashgar-note-desc {
	display: block;
	margin-top: 5rpx;
	height: 58rpx;
	color: #6E5A48;
	font-size: 19rpx;
	line-height: 29rpx;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.kashgar-note-meta {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8rpx;
	margin-top: 8rpx;
	color: #8B7A6B;
	font-size: 17rpx;
	line-height: 20rpx;
	white-space: nowrap;
}

.kashgar-note-meta text {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
}

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
<style scoped src="./index-theme.css"></style>
