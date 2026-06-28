<template>
	<view class="container">
		<view v-if="useKashgarItinerary" class="kashgar-itinerary-page">
			<view class="kashgar-itinerary-nav">
				<view class="kashgar-itinerary-back" @click="goKashgarItineraryBack">‹</view>
				<text class="kashgar-itinerary-nav-title">我的旅行日程</text>
				<view class="kashgar-itinerary-capsule">
					<text>•••</text>
					<view class="kashgar-itinerary-capsule-line"></view>
					<text class="kashgar-itinerary-ring">◎</text>
				</view>
			</view>

			<view class="kashgar-itinerary-hero">
				<image class="kashgar-itinerary-hero-image" src="/static/kashgar/itinerary-hero.png" mode="aspectFill"></image>
				<view class="kashgar-itinerary-hero-copy">
					<view class="kashgar-itinerary-title-row">
						<text class="kashgar-itinerary-trip-title">喀什亲子之旅</text>
						<text class="kashgar-itinerary-edit">✎</text>
					</view>
					<text class="kashgar-itinerary-date">2025.05.01 - 2025.05.07 · 共7天</text>
					<text class="kashgar-itinerary-subtitle">古城慢游 · 亲子时光 · 美食探索</text>
					<view class="kashgar-itinerary-ai-pill">
						<image class="kashgar-itinerary-ai-avatar" src="/static/tabbar/ai_companion_avatar.png" mode="aspectFill"></image>
						<text>喀小寻已为你整理</text>
						<text class="kashgar-itinerary-spark">✦</text>
					</view>
				</view>
			</view>

			<scroll-view class="kashgar-itinerary-days" scroll-x :show-scrollbar="false">
				<view class="kashgar-itinerary-day-track">
					<view
						v-for="day in kashgarItineraryDays"
						:key="day.key"
						:class="['kashgar-itinerary-day', activeKashgarDay === day.key ? 'kashgar-itinerary-day-active' : '']"
						@click="activeKashgarDay = day.key"
					>
						<text class="kashgar-itinerary-day-name">{{ day.name }}</text>
						<text class="kashgar-itinerary-day-date">{{ day.date }}</text>
					</view>
				</view>
			</scroll-view>

			<scroll-view class="kashgar-itinerary-scroll" scroll-y :show-scrollbar="false">
				<view class="kashgar-itinerary-timeline">
					<view
						v-for="section in kashgarItinerarySections"
						:key="section.day"
						class="kashgar-itinerary-section"
					>
						<view class="kashgar-itinerary-day-badge">{{ section.day }}</view>
						<view class="kashgar-itinerary-line"></view>
						<view class="kashgar-itinerary-events">
							<view
								v-for="event in section.events"
								:key="`${section.day}-${event.time}`"
								class="kashgar-itinerary-event"
							>
								<view class="kashgar-itinerary-time">
									<view class="kashgar-itinerary-dot"></view>
									<text class="kashgar-itinerary-time-text">{{ event.time }}</text>
									<text class="kashgar-itinerary-place">⌾ {{ event.place }}</text>
								</view>
								<view class="kashgar-itinerary-event-body">
									<text class="kashgar-itinerary-event-copy">{{ event.copy }}</text>
									<view class="kashgar-itinerary-photo-row">
										<image
											v-for="photo in event.photos"
											:key="photo"
											class="kashgar-itinerary-photo"
											:src="photo"
											mode="aspectFill"
											@click="previewKashgarItineraryPhoto(photo)"
										></image>
									</view>
									<view v-if="event.audio" class="kashgar-itinerary-audio" @click="playKashgarItineraryAudio(event)">
										<view class="kashgar-itinerary-audio-play">▶</view>
										<view class="kashgar-itinerary-wave">
											<text v-for="bar in 18" :key="bar"></text>
										</view>
										<text class="kashgar-itinerary-audio-time">{{ event.audio }}</text>
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>

			<view class="kashgar-itinerary-adjust" @click="adjustKashgarItinerary">
				<text class="kashgar-itinerary-adjust-spark">✦</text>
				<text>调整行程安排</text>
			</view>

			<tab-bar :current="2" />
		</view>
		<template v-else>
		<!-- 顶部背景图 -->
		<view class="header-bg">
			<image :src="UrlImg + '/baidu_map/weatch/images/beach-bg.png'" class="bg-image" mode="aspectFill"></image>
		</view>

		<!-- 用户信息卡片 -->
		<view class="user-card">
			<!-- 头像行 -->
			<view class="info-row">
				<text class="label">头像</text>
				<button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
					<view class="avatar-wrapper">
						<image :src="userAvatar" class="avatar" mode="aspectFill"></image>
						<text v-if="!hasUserInfo" class="click-tip">点击获取</text>
					</view>
				</button>
			</view>

			<!-- 用户名行 -->
			<view class="info-row">
				<text class="label">用户名</text>
				<input
					type="nickname"
					class="nickname-input"
					:value="userName"
					placeholder="点击输入昵称"
					@blur="onNicknameChange"
				/>
			</view>
		</view>

		<!-- 菜单列表 -->
		<view class="menu-card">
			<view class="menu-item" @click="goAboutUs">
				<text class="menu-label">关于我们</text>
				<text class="menu-arrow">›</text>
			</view>
		</view>

		<!-- 统计卡片 -->
		<navigator class="stats-card" url="/subPackages/user/myLikes/myLikes" hover-class="stats-card-active">
			<view class="stats-icon-wrap">
				<text class="stats-icon">♥</text>
			</view>
			<view class="stats-main">
				<text class="stats-title">我的点赞</text>
				<text class="stats-desc">收藏你喜欢的内容，之后可以快速找回</text>
			</view>
		</navigator>

		<view class="version-info">
			<text class="version-text">当前版本：{{ APP_VERSION }}</text>
		</view>

		<!-- 自定义TabBar -->
		<tab-bar :current="2" />
		</template>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TabBar from '@/components/tab-bar/tab-bar.vue'
import config from '@/request/config.js'
import request from '@/request/request.js'

const UrlImg = config.UrlImg
const KASHGAR_ITINERARY_LOCAL_CONTENT_ENABLED = true
const APP_VERSION = '1.0.0'
const useKashgarItinerary = ref(KASHGAR_ITINERARY_LOCAL_CONTENT_ENABLED)
const activeKashgarDay = ref('day-1')
const userName = ref('点击输入昵称')
const userAvatar = ref('/static/tabbar/my.png')
const hasUserInfo = ref(false)
const kashgarItineraryDays = [
	{ key: 'day-1', name: 'Day 1', date: '5/01 周四' },
	{ key: 'day-2', name: 'Day 2', date: '5/02 周五' },
	{ key: 'day-3', name: 'Day 3', date: '5/03 周六' },
	{ key: 'day-4', name: 'Day 4', date: '5/04 周日' },
	{ key: 'day-5', name: 'Day 5', date: '5/05 周一' },
	{ key: 'day-6', name: 'Day 6', date: '5/06 周二' },
	{ key: 'day-7', name: 'Day 7', date: '5/07 周三' }
]
const kashgarItinerarySections = [
	{
		day: 'Day 1',
		events: [
			{
				time: '09:30',
				place: '喀什古城',
				copy: '我们抵达喀什古城，阳光洒在土黄色的街巷上，满满的异域风情迎面而来。',
				audio: '00:28',
				photos: [
					'/static/kashgar/itinerary-old-city-1.png',
					'/static/kashgar/itinerary-old-city-2.png',
					'/static/kashgar/itinerary-old-city-3.png'
				]
			},
			{
				time: '13:10',
				place: '百年老茶馆',
				copy: '在百年老茶馆里喝了杯维吾尔奶茶，孩子还学会了打馕，体验感满分！',
				audio: '00:19',
				photos: [
					'/static/kashgar/itinerary-teahouse-1.png',
					'/static/kashgar/itinerary-teahouse-2.png',
					'/static/kashgar/itinerary-teahouse-3.png'
				]
			},
			{
				time: '18:45',
				place: '鸽子广场',
				copy: '傍晚时分，登上高台民居，俯瞰整个喀什城，夕阳太美了！',
				photos: [
					'/static/kashgar/itinerary-sunset-1.png',
					'/static/kashgar/itinerary-sunset-2.png',
					'/static/kashgar/itinerary-sunset-3.png'
				]
			}
		]
	},
	{
		day: 'Day 2',
		events: [
			{
				time: '09:00',
				place: '艾提尕尔广场',
				copy: '来到艾提尕尔广场，感受信仰与历史交织的庄严与宁静。',
				photos: [
					'/static/kashgar/itinerary-aitigar-1.png',
					'/static/kashgar/itinerary-aitigar-2.png',
					'/static/kashgar/itinerary-aitigar-3.png'
				]
			},
			{
				time: '12:30',
				place: '香妃园',
				copy: '走进香妃园，聆听动人的爱情故事，园林景致雅致如画。',
				photos: [
					'/static/kashgar/itinerary-garden-1.png',
					'/static/kashgar/itinerary-garden-2.png',
					'/static/kashgar/itinerary-garden-3.png'
				]
			},
			{
				time: '16:30',
				place: '喀什大巴扎',
				copy: '逛喀什大巴扎，琳琅满目的手工艺品和香料，浓郁的市井气息扑面而来！',
				photos: [
					'/static/kashgar/note-bazaar.png',
					'/static/kashgar/guide-bazaar.png',
					'/static/kashgar/place-oldstreet.png'
				]
			}
		]
	}
]

const getSavedOpenid = () => {
	const userInfo = uni.getStorageSync('userInfo') || {}
	const userModel = uni.getStorageSync('userModel') || {}
	const openid = uni.getStorageSync('openid') || userInfo.wxopen_id || userInfo.openid || (userModel.openid && userModel.openid.openid) || userModel.openid || ''
	if (openid) {
		uni.setStorageSync('openid', openid)
	}
	return openid
}

const getSavedUserId = () => {
	const userInfo = uni.getStorageSync('userInfo') || {}
	const userModel = uni.getStorageSync('userModel') || {}
	const userId = uni.getStorageSync('userId') || userInfo.id || userInfo.user_id || (userModel.member && userModel.member.id) || userModel.id || ''
	if (userId) {
		uni.setStorageSync('userId', userId)
	}
	return userId
}

const saveUserProfile = async (payload) => {
	const openid = getSavedOpenid()
	if (!openid) {
		uni.showModal({
			title: '提示',
			content: '登录信息缺失，请重新登录',
			showCancel: false,
			success: () => {
				uni.reLaunch({ url: '/pagesLogin/auth/auth' })
			}
		})
		return null
	}
	return request('api2/user/user_save', { openid, ...payload }, 'POST')
}

const persistAvatarFile = (tempFilePath) => new Promise((resolve) => {
	if (!tempFilePath || /^https?:\/\//i.test(tempFilePath)) {
		resolve(tempFilePath)
		return
	}
	uni.saveFile({
		tempFilePath,
		success: (saveRes) => {
			resolve(saveRes.savedFilePath || tempFilePath)
		},
		fail: (error) => {
			console.warn('头像本地保存失败，使用临时路径兜底:', error)
			resolve(tempFilePath)
		}
	})
})

// 选择头像回调（新版微信API）
const onChooseAvatar = async (e) => {
	const avatarUrl = e.detail.avatarUrl
	if (!avatarUrl) return
	const savedAvatarUrl = await persistAvatarFile(avatarUrl)
	userAvatar.value = savedAvatarUrl
	hasUserInfo.value = true
	const userInfo = uni.getStorageSync('userInfo') || {}
	userInfo.avatarUrl = savedAvatarUrl
	uni.setStorageSync('userInfo', userInfo)

	try {
		let res = await saveUserProfile({ avatarUrl: savedAvatarUrl })
		if (!res || res.code == '0') {
			uni.showToast({
				title: '头像设置成功',
				icon: 'success'
			})
			return
		}
		uni.showToast({
			title: '头像已保存到本机',
			icon: 'none'
		})
	} catch (error) {
		console.warn('头像同步到服务器失败，已保存在本机:', error)
		uni.showToast({
			title: '头像已保存到本机',
			icon: 'none'
		})
	}
}

// 昵称输入回调（新版微信API）
const onNicknameChange = async (e) => {
	const nickname = e.detail.value || e.target.value
	if (nickname && nickname.trim()) {
		userName.value = nickname
		hasUserInfo.value = true
		const userInfo = uni.getStorageSync('userInfo') || {}
		let res = await saveUserProfile({ nickName: nickname })
		if (!res) return
		if (res.code == '0') {
			// 保存到本地
			userInfo.nickName = nickname
			uni.setStorageSync('userInfo', userInfo)

			uni.showToast({
				title: '昵称设置成功',
				icon: 'success'
			})
		}
	}
}

// 页面加载时调用
const likeCount = ref(0)

const goAboutUs = () => {
	uni.navigateTo({ url: '/pagesInfo/aboutus/aboutus' })
}

const goKashgarItineraryBack = () => {
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack()
		return
	}
	uni.reLaunch({ url: '/pages/index/index' })
}

const previewKashgarItineraryPhoto = (photo) => {
	const urls = kashgarItinerarySections.flatMap(section => section.events.flatMap(event => event.photos))
	uni.previewImage({
		current: photo,
		urls
	})
}

const playKashgarItineraryAudio = (event) => {
	uni.showToast({
		title: `${event.place} 语音回忆`,
		icon: 'none'
	})
}

const adjustKashgarItinerary = () => {
	uni.showToast({
		title: '喀小寻正在优化行程',
		icon: 'none'
	})
}

const loadLikeCount = async () => {
	const userId = getSavedUserId()
	if (!userId) {
		likeCount.value = 0
		return
	}
	try {
		const res = await request('api2/Drama/getZanDrama', {
			userId,
			page: 1,
			page_size: 1
		}, 'GET')
		if (res.code == 0 && res.data) {
			likeCount.value = Number(res.data.total || 0)
		}
	} catch (error) {
		console.error('获取点赞数量失败:', error)
	}
}

onLoad(() => {
	if (useKashgarItinerary.value) {
		return
	}
	loadLikeCount()
	// 从缓存加载
	const userInfo = uni.getStorageSync('userInfo')
	if (userInfo) {
		if (userInfo.nickName) {
			userName.value = userInfo.nickName
			hasUserInfo.value = true
		}
		if (userInfo.avatarUrl) {
			userAvatar.value = userInfo.avatarUrl
		}
	}
})
</script>

<style scoped>
.kashgar-itinerary-page {
	position: relative;
	min-height: 100vh;
	padding: 34rpx 30rpx 330rpx;
	box-sizing: border-box;
	background:
		linear-gradient(180deg, #FFF8EC 0%, #FFF3DF 30%, #FFFCF5 58%, #FFFFFF 100%);
	color: #2B2118;
	overflow: hidden;
	font-family: "PingFang SC", "Songti SC", sans-serif;
}

.kashgar-itinerary-page::before {
	content: '';
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	height: 252rpx;
	background:
		linear-gradient(180deg, rgba(255, 248, 236, 0.34), rgba(255, 248, 236, 1)),
		url('/static/kashgar/home-top-mountains.png') center top / cover no-repeat;
	opacity: 0.52;
	pointer-events: none;
}

.kashgar-itinerary-nav {
	position: relative;
	z-index: 2;
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 76rpx;
}

.kashgar-itinerary-back {
	width: 56rpx;
	height: 56rpx;
	color: #1F1711;
	font-size: 58rpx;
	line-height: 48rpx;
	font-weight: 500;
}

.kashgar-itinerary-nav-title {
	flex: 1;
	text-align: center;
	padding: 0 18rpx;
	font-size: 31rpx;
	line-height: 40rpx;
	font-weight: 900;
	color: #1E1C19;
	white-space: nowrap;
}

.kashgar-itinerary-capsule {
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

.kashgar-itinerary-capsule-line {
	width: 1rpx;
	height: 34rpx;
	background: rgba(62, 47, 31, 0.16);
}

.kashgar-itinerary-ring {
	font-size: 38rpx;
	line-height: 38rpx;
	font-weight: 800;
}

.kashgar-itinerary-hero {
	position: relative;
	z-index: 2;
	height: 252rpx;
	margin-top: 16rpx;
	border-radius: 24rpx;
	overflow: hidden;
	background: #F3D7AF;
	box-shadow: 0 18rpx 38rpx rgba(110, 76, 38, 0.13);
}

.kashgar-itinerary-hero-image {
	position: absolute;
	right: 0;
	top: 0;
	width: 65%;
	height: 100%;
}

.kashgar-itinerary-hero::after {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(90deg, rgba(255, 243, 224, 0.98) 0%, rgba(255, 242, 220, 0.94) 42%, rgba(255, 242, 220, 0.18) 100%);
}

.kashgar-itinerary-hero-copy {
	position: relative;
	z-index: 2;
	width: 58%;
	padding: 32rpx 0 0 42rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
}

.kashgar-itinerary-title-row {
	display: flex;
	align-items: center;
	gap: 14rpx;
	max-width: 100%;
}

.kashgar-itinerary-trip-title {
	font-family: "Songti SC", "STSong", serif;
	font-size: 34rpx;
	line-height: 42rpx;
	font-weight: 900;
	color: #3A2114;
	white-space: nowrap;
}

.kashgar-itinerary-edit {
	color: #7A5A3F;
	font-size: 25rpx;
	line-height: 30rpx;
}

.kashgar-itinerary-date {
	margin-top: 12rpx;
	color: #5E5146;
	font-size: 22rpx;
	line-height: 30rpx;
	white-space: nowrap;
}

.kashgar-itinerary-subtitle {
	margin-top: 10rpx;
	color: #6F6256;
	font-size: 20rpx;
	line-height: 28rpx;
	white-space: nowrap;
}

.kashgar-itinerary-ai-pill {
	margin-top: 20rpx;
	height: 54rpx;
	min-width: 220rpx;
	border-radius: 999rpx;
	background: rgba(255, 250, 241, 0.9);
	box-shadow: 0 8rpx 18rpx rgba(124, 84, 37, 0.11);
	display: flex;
	align-items: center;
	gap: 9rpx;
	padding: 0 18rpx 0 8rpx;
	color: #69503B;
	font-size: 22rpx;
	font-weight: 700;
	box-sizing: border-box;
}

.kashgar-itinerary-ai-avatar {
	width: 42rpx;
	height: 42rpx;
	border-radius: 50%;
}

.kashgar-itinerary-spark {
	color: #D7A14A;
	font-size: 20rpx;
}

.kashgar-itinerary-days {
	position: relative;
	z-index: 3;
	height: 82rpx;
	margin: 4rpx -10rpx 0;
	padding: 0 0 8rpx;
	white-space: nowrap;
}

.kashgar-itinerary-day-track {
	display: inline-flex;
	min-width: 100%;
	padding: 0 0 0 0;
	border-radius: 26rpx;
	background: rgba(255, 255, 255, 0.9);
	box-shadow: 0 10rpx 26rpx rgba(72, 50, 28, 0.1);
	overflow: hidden;
}

.kashgar-itinerary-day {
	width: 102rpx;
	height: 78rpx;
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 5rpx;
	color: #49443F;
	font-size: 22rpx;
	box-sizing: border-box;
}

.kashgar-itinerary-day-active {
	width: 116rpx;
	border-radius: 24rpx;
	background: #FFFFFF;
	color: #28A876;
	box-shadow: 0 8rpx 22rpx rgba(65, 58, 47, 0.1);
}

.kashgar-itinerary-day-name {
	font-weight: 800;
	line-height: 25rpx;
}

.kashgar-itinerary-day-date {
	color: #8A8178;
	font-size: 17rpx;
	line-height: 22rpx;
}

.kashgar-itinerary-day-active .kashgar-itinerary-day-name {
	position: relative;
}

.kashgar-itinerary-day-active .kashgar-itinerary-day-name::after {
	content: '';
	position: absolute;
	left: 8rpx;
	right: 8rpx;
	bottom: -12rpx;
	height: 4rpx;
	border-radius: 999rpx;
	background: #28A876;
}

.kashgar-itinerary-scroll {
	position: relative;
	z-index: 2;
	height: calc(100vh - 470rpx);
	margin: 22rpx -4rpx 0;
	padding-bottom: 260rpx;
	box-sizing: border-box;
}

.kashgar-itinerary-timeline {
	padding: 0 8rpx 260rpx;
}

.kashgar-itinerary-section {
	position: relative;
	display: grid;
	grid-template-columns: 82rpx 1rpx minmax(0, 1fr);
	column-gap: 12rpx;
	padding-bottom: 16rpx;
}

.kashgar-itinerary-day-badge {
	align-self: start;
	height: 34rpx;
	min-width: 80rpx;
	border-radius: 999rpx;
	background: #2DAA78;
	color: #FFFFFF;
	font-size: 21rpx;
	line-height: 34rpx;
	text-align: center;
	font-weight: 900;
}

.kashgar-itinerary-line {
	width: 1rpx;
	min-height: 100%;
	background: repeating-linear-gradient(180deg, rgba(187, 174, 159, 0.7) 0 8rpx, transparent 8rpx 15rpx);
}

.kashgar-itinerary-events {
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 18rpx;
}

.kashgar-itinerary-event {
	display: grid;
	grid-template-columns: 82rpx minmax(0, 1fr);
	column-gap: 12rpx;
}

.kashgar-itinerary-time {
	position: relative;
	min-width: 0;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
}

.kashgar-itinerary-dot {
	width: 18rpx;
	height: 18rpx;
	border-radius: 50%;
	border: 8rpx solid #30A979;
	background: #FFFFFF;
	box-sizing: border-box;
	margin-top: 2rpx;
	margin-left: 0;
}

.kashgar-itinerary-time-text {
	position: absolute;
	left: 28rpx;
	top: -2rpx;
	color: #3D3832;
	font-size: 20rpx;
	line-height: 26rpx;
	font-weight: 500;
	white-space: nowrap;
}

.kashgar-itinerary-place {
	margin-top: 22rpx;
	margin-left: 28rpx;
	color: #659E82;
	font-size: 16rpx;
	line-height: 22rpx;
	white-space: nowrap;
}

.kashgar-itinerary-event-body {
	min-width: 0;
}

.kashgar-itinerary-event-copy {
	display: block;
	color: #2C2824;
	font-size: 20rpx;
	line-height: 30rpx;
	font-weight: 500;
}

.kashgar-itinerary-photo-row {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 10rpx;
	margin-top: 12rpx;
}

.kashgar-itinerary-photo {
	width: 100%;
	height: 78rpx;
	border-radius: 12rpx;
	background: #E8D2B1;
}

.kashgar-itinerary-audio {
	margin-top: 8rpx;
	width: 226rpx;
	height: 38rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.88);
	box-shadow: 0 6rpx 14rpx rgba(78, 60, 38, 0.09);
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 0 14rpx;
	box-sizing: border-box;
}

.kashgar-itinerary-audio-play {
	width: 24rpx;
	height: 24rpx;
	border-radius: 50%;
	background: #2FA878;
	color: #FFFFFF;
	font-size: 15rpx;
	line-height: 24rpx;
	text-align: center;
}

.kashgar-itinerary-wave {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 3rpx;
	height: 24rpx;
	overflow: hidden;
}

.kashgar-itinerary-wave text {
	width: 2rpx;
	height: 12rpx;
	border-radius: 99rpx;
	background: #E7C69B;
}

.kashgar-itinerary-wave text:nth-child(3n) {
	height: 20rpx;
}

.kashgar-itinerary-wave text:nth-child(4n) {
	height: 16rpx;
}

.kashgar-itinerary-audio-time {
	color: #6F675F;
	font-size: 18rpx;
	line-height: 24rpx;
}

.kashgar-itinerary-adjust {
	position: fixed;
	left: 150rpx;
	right: 150rpx;
	bottom: calc(204rpx + env(safe-area-inset-bottom));
	z-index: 10000;
	height: 58rpx;
	border-radius: 999rpx;
	background: linear-gradient(90deg, #31A776, #23BF88);
	color: #FFFFFF;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	font-size: 27rpx;
	line-height: 58rpx;
	font-weight: 900;
	box-shadow: 0 12rpx 24rpx rgba(43, 150, 104, 0.22);
}

.kashgar-itinerary-adjust-spark {
	font-size: 28rpx;
}

.container {
	min-height: 80vh;
	background-color: #F5F5F5;
	padding-bottom: 130px;
}

/* 顶部背景图 */
.header-bg {
	width: 100%;
	height: 280rpx;
	position: relative;
	overflow: hidden;
	z-index: 1;
}

.bg-image {
	width: 100%;
	height: 100%;
}

/* 用户信息卡片 */
.user-card {
	position: relative;
	background-color: #F5F5F5;
	border-top-left-radius: 60rpx;
	border-top-right-radius: 60rpx;
	margin: -60rpx 0 0 0;
	padding: 0;
	box-shadow-top: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	overflow: hidden;
	z-index: 2;
}

/* 信息行 */
.info-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 40rpx 30rpx;
	border-bottom: 1rpx solid #D8D8D8;
	background-color: #FFFFFF;
}

.info-row:last-child {
	border-bottom: none;
}

.label {
	font-size: 30rpx;
	color: #333333;
}

.value {
	font-size: 30rpx;
	color: #666666;
}

/* 头像按钮 */
.avatar-btn {
	padding: 0;
	margin: 0;
	background: transparent;
	border: none;
	line-height: 1;
}

.avatar-btn::after {
	border: none;
}

/* 头像 */
.avatar-wrapper {
	position: relative;
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	overflow: hidden;
}

.avatar {
	width: 100%;
	height: 100%;
}

.click-tip {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	font-size: 18rpx;
	color: #fff;
	background: rgba(0, 0, 0, 0.5);
	text-align: center;
	padding: 4rpx 0;
}

/* 昵称输入框 */
.nickname-input {
	font-size: 30rpx;
	color: #666666;
	text-align: right;
}

/* 统计卡片 */
.stats-card {
	display: flex;
	align-items: center;
	gap: 22rpx;
	background: #FFFFFF;
	margin: 24rpx 30rpx;
	border-radius: 26rpx;
	padding: 30rpx 28rpx;
	box-shadow: 0 10rpx 28rpx rgba(31, 34, 40, 0.06);
	border: 1rpx solid rgba(222, 217, 208, 0.72);
	box-sizing: border-box;
	text-decoration: none;
	line-height: normal;
}

.stats-card-active {
	background: #FBF8F2;
}

.stats-icon-wrap {
	width: 76rpx;
	height: 76rpx;
	border-radius: 50%;
	background: #FFF4E8;
	color: #D39A42;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.stats-icon {
	font-size: 34rpx;
	line-height: 1;
}

.stats-main {
	min-width: 0;
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.stats-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #252525;
	line-height: 1.2;
}

.stats-desc {
	font-size: 24rpx;
	color: #9A948B;
	line-height: 1.35;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.stats-meta {
	display: flex;
	align-items: baseline;
	gap: 4rpx;
	padding-left: 18rpx;
	flex-shrink: 0;
}

.stats-num {
	font-size: 38rpx;
	font-weight: 700;
	color: #2E2C2A;
	line-height: 1;
}

.stats-label {
	font-size: 22rpx;
	color: #B0AAA2;
	line-height: 1;
}

.version-info {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 310rpx;
	text-align: center;
	z-index: 10001;
	pointer-events: none;
}

.version-text {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 8rpx 22rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.72);
	font-size: 24rpx;
	color: #858585;
	letter-spacing: 1rpx;
	line-height: 1.2;
}

/* 菜单卡片 */
.menu-card {
	background-color: #F5F5F5;
	margin: 20rpx 0 0 0;
	border-radius: 0;
}

.menu-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 40rpx 30rpx;
	border-bottom: 1rpx solid #D8D8D8;
	background-color: #FFFFFF;
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-label {
	font-size: 30rpx;
	color: #333333;
}

.menu-arrow {
	font-size: 40rpx;
	color: #CCCCCC;
	line-height: 1;
}

.container {
	min-height: 100vh;
	background: linear-gradient(180deg, #F8F1E4 0%, #F2E8D7 46%, #EEF5EF 100%);
}

.header-bg {
	height: 330rpx;
	border-bottom-left-radius: 46rpx;
	border-bottom-right-radius: 46rpx;
	box-shadow: 0 16rpx 40rpx rgba(35, 48, 41, 0.14);
}

.header-bg::after {
	content: '';
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	background: linear-gradient(180deg, rgba(24, 59, 52, 0.04), rgba(24, 59, 52, 0.32));
}

.user-card {
	margin: -54rpx 24rpx 0;
	border-radius: 34rpx;
	background: rgba(255, 252, 244, 0.94);
	border: 1rpx solid rgba(184, 129, 43, 0.16);
	box-shadow: 0 14rpx 36rpx rgba(43, 57, 45, 0.1);
}

.info-row,
.menu-item {
	background: transparent;
	border-bottom-color: rgba(184, 129, 43, 0.12);
}

.label,
.menu-label,
.stats-title {
	color: #183B34;
	font-weight: 700;
}

.nickname-input,
.stats-desc,
.version-text {
	color: #6C766D;
}

.avatar-wrapper {
	border: 4rpx solid rgba(184, 129, 43, 0.42);
	box-shadow: 0 8rpx 18rpx rgba(43, 57, 45, 0.12);
}

.menu-card,
.stats-card {
	margin: 24rpx;
	border-radius: 30rpx;
	background: rgba(255, 252, 244, 0.94);
	border: 1rpx solid rgba(184, 129, 43, 0.16);
	box-shadow: 0 14rpx 34rpx rgba(43, 57, 45, 0.08);
	overflow: hidden;
}

.stats-icon-wrap {
	background: linear-gradient(135deg, #B8812B, #E1B55D);
	color: #FFFFFF;
}

.stats-card-active {
	background: rgba(238, 245, 239, 0.94);
}

.version-info {
	bottom: 280rpx;
}

.version-text {
	background: rgba(255, 252, 244, 0.84);
	border: 1rpx solid rgba(184, 129, 43, 0.14);
}
</style>
