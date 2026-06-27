<template>
	<view class="container">
		<!-- 顶部导航 -->
		<view class="nav-bar">
			<view class="back-btn" @click="goBack">
				<image :src="UrlImg + '/baidu_map/weatch/images/backbtn1.png'" class="back-icon" mode="aspectFit"></image>
			</view>
			<text class="nav-title">我的点赞</text>
			<view class="placeholder"></view>
		</view>

		<!-- Tab 切换 -->
		<view class="tabs">
			<view class="tab-item" :class="{ active: activeTab === 0 }" @click="switchTab(0)">
				<text class="tab-text">百县百剧</text>
				<view v-if="activeTab === 0" class="tab-line"></view>
			</view>
			<view class="tab-item" :class="{ active: activeTab === 1 }" @click="switchTab(1)">
				<text class="tab-text">喀什剧场</text>
				<view v-if="activeTab === 1" class="tab-line"></view>
			</view>
		</view>

		<!-- 点赞列表 -->
		<scroll-view v-if="activeTab === 0" scroll-y class="list-scroll" @scrolltolower="loadMore">
			<view v-if="countyLikeList.length === 0 && !loading[0]" class="empty">
				<text class="empty-text">暂无百县百剧点赞记录</text>
			</view>
			<view v-else class="card-grid">
				<view
					class="card-item"
					v-for="item in countyLikeList"
					:key="item.id"
					@click="goToDetail(item)"
				>
					<image class="card-cover" :src="item.cover_url" mode="aspectFill" lazy-load></image>
					<view class="card-info">
						<text class="card-title">{{ item.title }}</text>
						<text class="card-sub">{{ getCardSub(item) }}</text>
					</view>
				</view>
			</view>
			<view v-if="loading[0]" class="loading-text">加载中...</view>
		</scroll-view>

		<!-- 喀什剧场点赞列表 -->
		<scroll-view v-if="activeTab === 1" scroll-y class="list-scroll" @scrolltolower="loadMore">
			<view v-if="theaterLikeList.length === 0 && !loading[1]" class="empty">
				<text class="empty-text">暂无喀什剧场点赞记录</text>
			</view>
			<view v-else class="card-grid">
				<view
					class="card-item"
					v-for="item in theaterLikeList"
					:key="item.id"
					@click="goToDetail(item)"
				>
					<image class="card-cover" :src="item.cover_url" mode="aspectFill" lazy-load></image>
					<view class="card-info">
						<text class="card-title">{{ item.title }}</text>
						<text class="card-sub">{{ getCardSub(item) }}</text>
					</view>
				</view>
			</view>
			<view v-if="loading[1]" class="loading-text">加载中...</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import config from '@/request/config.js'
import request from '@/request/request.js'

const UrlImg = config.UrlImg
const LIKE_TAB_TYPES = ['1,2', '3']
const pageSize = 10
const activeTab = ref(0)
const countyLikeList = ref([])
const theaterLikeList = ref([])
const page = ref([1, 1])
const loading = ref([false, false])
const noMore = ref([false, false])
const listLoaded = ref([false, false])

const tabLists = [countyLikeList, theaterLikeList]

const goBack = () => uni.navigateBack()

const goToDetail = (item) => {
	if (Number(item.type) === 3) {
		uni.navigateTo({
			url: `/subPackages/feature/theater/theaterDetail?dramaId=${item.id}`
		})
		return
	}

	uni.navigateTo({
		url: `/subPackages/feature/shortPlays/shortPlays?id=${item.id}`
	})
}

const setTabState = (stateRef, tabIndex, value) => {
	const next = [...stateRef.value]
	next[tabIndex] = value
	stateRef.value = next
}

const getCardSub = (item) => {
	if (item.brand && item.brand.name) {
		return item.brand.name
	}
	if (item.zan_num || item.look_num) {
		return `${item.zan_num || 0}赞 · ${item.look_num || 0}浏览`
	}
	return ''
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

const loadData = async (tabIndex = activeTab.value, reset = false) => {
	const userId = getSavedUserId()
	if (!userId) {
		uni.showToast({
			title: '请先登录',
			icon: 'none'
		})
		return
	}
	if (loading.value[tabIndex] || (!reset && noMore.value[tabIndex])) {
		return
	}

	if (reset) {
		tabLists[tabIndex].value = []
		setTabState(page, tabIndex, 1)
		setTabState(noMore, tabIndex, false)
	}

	setTabState(loading, tabIndex, true)
	try {
		const params = {
			userId,
			type: LIKE_TAB_TYPES[tabIndex],
			page: page.value[tabIndex],
			page_size: pageSize
		}
		const res = await request('api2/Drama/getZanDrama', params, 'GET')
		if (res.code == 0 && res.data && Array.isArray(res.data.list)) {
			const currentList = reset ? [] : tabLists[tabIndex].value
			const newList = res.data.list
			tabLists[tabIndex].value = [...currentList, ...newList]
			setTabState(listLoaded, tabIndex, true)
			setTabState(noMore, tabIndex, newList.length < pageSize || tabLists[tabIndex].value.length >= Number(res.data.total || 0))
			setTabState(page, tabIndex, page.value[tabIndex] + 1)
		} else {
			setTabState(noMore, tabIndex, true)
		}
	} catch (error) {
		console.error('获取我的点赞列表失败:', error)
		uni.showToast({
			title: '加载失败，请稍后重试',
			icon: 'none'
		})
	} finally {
		setTabState(loading, tabIndex, false)
	}
}

const switchTab = (tabIndex) => {
	activeTab.value = tabIndex
	if (!listLoaded.value[tabIndex]) {
		loadData(tabIndex)
	}
}

const loadMore = () => {
	loadData(activeTab.value)
}

onMounted(() => {
	loadData()
})
</script>

<style scoped>
.container {
	min-height: 100vh;
	background-color: #F5F5F5;
}

/* 导航栏 */
.nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--status-bar-height) 30rpx 0;
	height: calc(88rpx + var(--status-bar-height));
	background-color: #FFFFFF;
}

.back-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
}

.back-icon {
	width: 20rpx;
	height: 35rpx;
}

.nav-title {
	font-size: 34rpx;
	font-weight: 600;
	color: #333333;
}

.placeholder {
	width: 60rpx;
}

/* Tabs */
.tabs {
	display: flex;
	background-color: #FFFFFF;
	border-bottom: 1rpx solid #EEEEEE;
}

.tab-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 24rpx 0 0;
	position: relative;
}

.tab-text {
	font-size: 30rpx;
	color: #999999;
	padding-bottom: 20rpx;
}

.tab-item.active .tab-text {
	color: #C8A062;
	font-weight: 600;
}

.tab-line {
	width: 48rpx;
	height: 4rpx;
	background-color: #C8A062;
	border-radius: 2rpx;
}

/* 列表 */
.list-scroll {
	height: calc(100vh - 88rpx - var(--status-bar-height) - 90rpx);
}

.card-grid {
	display: flex;
	flex-wrap: wrap;
	padding: 20rpx;
	gap: 20rpx;
}

.card-item {
	width: calc(50% - 10rpx);
	background-color: #FFFFFF;
	border-radius: 16rpx;
	overflow: hidden;
}

.card-cover {
	width: 100%;
	height: 240rpx;
}

.card-info {
	padding: 16rpx;
}

.card-title {
	font-size: 26rpx;
	color: #333333;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.card-sub {
	font-size: 22rpx;
	color: #999999;
	margin-top: 8rpx;
	display: block;
}

/* 空状态 */
.empty {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 120rpx 0;
}

.empty-text {
	font-size: 28rpx;
	color: #CCCCCC;
}

.loading-text {
	text-align: center;
	padding: 24rpx 0;
	font-size: 24rpx;
	color: #999999;
}

.container {
	background: linear-gradient(180deg, #F8F1E4 0%, #F2E8D7 46%, #EEF5EF 100%);
}

.nav-bar,
.tabs {
	background: rgba(255, 252, 244, 0.94);
	border-bottom: 1rpx solid rgba(184, 129, 43, 0.14);
}

.nav-title,
.card-title {
	color: #183B34;
	font-weight: 800;
}

.tab-item.active .tab-text {
	color: #B8812B;
}

.tab-line {
	background: #B8812B;
}

.card-grid {
	padding: 24rpx;
	gap: 24rpx;
}

.card-item {
	width: calc(50% - 12rpx);
	border-radius: 26rpx;
	background: rgba(255, 252, 244, 0.96);
	border: 1rpx solid rgba(184, 129, 43, 0.14);
	box-shadow: 0 12rpx 28rpx rgba(43, 57, 45, 0.09);
}

.card-cover {
	height: 260rpx;
	border-radius: 24rpx 24rpx 0 0;
}

.card-sub,
.tab-text,
.empty-text,
.loading-text {
	color: #6C766D;
}
</style>
