<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<custom-nav
			title="喀什剧场"
			:show-back="false"
			@navHeight="handleNavHeight"
      :left-icon="UrlImg + '/baidu_map/weatch/images/left.png'"
      @leftClick="goBack"
		/>

		<!-- 内容区域 -->
		<view class="content" :style="`padding-top: ${contentPaddingTop}px;`">
			<!-- 视频网格 -->
			<view class="video-grid">
				<view class="video-item" v-for="(item, index) in videoList" :key="index">
					<view class="video-cover">
						<image :src="item.cover" class="cover-image" mode="aspectFill" @click="goToShortPlays(item)"></image>
						<view class="video-badge">{{ item.episodes }}</view>
					</view>
					<text class="video-title">{{ item.title }}</text>
				</view>
			</view>
			<!-- 加载状态 -->
			<view class="loading-status">
				<text v-if="loading">加载中...</text>
				<text v-else-if="noMore">没有更多了</text>
			</view>
		</view>

	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onReachBottom } from '@dcloudio/uni-app'
import CustomNav from '@/components/custom-nav/custom-nav.vue'
import config from '@/request/config.js'
import request from '@/request/request.js'

const UrlImg = config.UrlImg
const contentPaddingTop = ref(80)  // 内容区域顶部间距
const page = ref(1)  // 当前页码
const page_size = ref(10)  // 每个分类每页数量
const videoList = ref([])
const loading = ref(false)  // 加载状态
const noMore = ref(false)   // 没有更多数据
const dramaTypes = [1, 2, 3]
const finishedTypes = {}
const loadedDramaKeys = new Set()

const getDramaKey = (item) => {
	const title = String(item && item.title ? item.title : '').trim()
	const episodes = String(item && item.total_episodes ? item.total_episodes : '')
	return `${title}_${episodes}`
}

const formatDramaItem = (item) => ({
	id: item.id, // 剧集id
	cover: item.cover_url,
	title: item.title,
	episodes: item.total_episodes ? `${item.total_episodes}集全` : '更新中'
})

// 获取剧集列表
const getDramaList = async () => {
	if (loading.value || noMore.value) return
	loading.value = true
	try {
		// 从本地存储获取用户ID
		const userId = uni.getStorageSync('userId') || 1
		const activeTypes = dramaTypes.filter(type => !finishedTypes[type])

		if (activeTypes.length === 0) {
			noMore.value = true
			return
		}

		const results = await Promise.all(activeTypes.map(async (type) => {
			const params = {
				userId: userId,
				type,
				page: page.value,
				page_size: page_size.value
			}
			try {
				const res = await request('api2/Drama/getDrama', params, 'GET', false, {
					cacheTime: 30000
				})
				const list = res.code == 0 && Array.isArray(res.data) ? res.data : []
				if (list.length < page_size.value) {
					finishedTypes[type] = true
				}
				return list
			} catch (error) {
				console.error(`剧场分类 ${type} 调用失败:`, error)
				return []
			}
		}))

		const newList = [].concat(...results)
			.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
			.filter(item => {
				const key = getDramaKey(item)
				if (!item || !key || loadedDramaKeys.has(key)) return false
				loadedDramaKeys.add(key)
				return true
			})
			.map(formatDramaItem)

		videoList.value = [...videoList.value, ...newList]

		if (newList.length === 0 || dramaTypes.every(type => finishedTypes[type])) {
			noMore.value = true
		}
	} catch (error) {
		console.error('接口调用失败:', error)
	} finally {
		loading.value = false
	}
}

// 接收导航栏高度
const handleNavHeight = (height) => {
	contentPaddingTop.value = height + 15
}
const goBack = () => {
	// 获取页面栈
	const pages = getCurrentPages()

	// 如果只有一个页面（说明是从 Tab 直接进入的），跳转到首页
	if (pages.length === 1) {
		uni.reLaunch({
			url: '/pages/index/index'
		})
	} else {
		// 否则正常返回上一页
		uni.navigateBack()
	}
}

// 跳转到剧场详情页面
const goToShortPlays = (item) => {
	uni.navigateTo({
		url: `/subPackages/feature/theater/theaterDetail?dramaId=${item.id}`
	})
}

// 页面加载时调用
onLoad(() => {
	getDramaList()
})

// 页面上拉触底事件
onReachBottom(() => {
	if (loading.value || noMore.value) return
	page.value++
	getDramaList()
})

</script>

<style scoped>
.container {
	background-color: #F5F1EE;
	min-height: 100vh;
	padding-bottom: 30rpx;
}

.content {
	padding-left: 15px;
	padding-right: 15px;
}

.video-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 15px;
}

.video-item {
	display: flex;
	flex-direction: column;
}

.video-cover {
	position: relative;
	width: 100%;
	height: 220rpx;
	border-radius: 8px;
	overflow: hidden;
	margin-bottom: 8px;
}

.cover-image {
	width: 100%;
	height: 100%;
}

.video-badge {
	position: absolute;
	bottom: 8px;
	right: 8px;
	background: rgba(0, 0, 0, 0.7);
	color: #FFFFFF;
	font-size: 20rpx;
	padding: 4rpx 10rpx;
	border-radius: 4px;
}

.video-title {
	font-size: 14px;
	color: #333333;
	line-height: 1.4;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
}

/* 加载状态 */
.loading-status {
	text-align: center;
	color: #999999;
	font-size: 26rpx;
}

.container {
	background: linear-gradient(180deg, #F8F1E4 0%, #F2E8D7 48%, #EEF5EF 100%);
	padding-bottom: 48rpx;
}

.content {
	padding-left: 24rpx;
	padding-right: 24rpx;
}

.video-grid {
	gap: 24rpx;
}

.video-item {
	padding: 12rpx;
	border-radius: 28rpx;
	background: rgba(255, 252, 244, 0.94);
	border: 1rpx solid rgba(184, 129, 43, 0.14);
	box-shadow: 0 12rpx 28rpx rgba(42, 55, 43, 0.1);
	box-sizing: border-box;
}

.video-cover {
	height: 250rpx;
	border-radius: 22rpx;
	margin-bottom: 14rpx;
}

.video-badge {
	right: 12rpx;
	bottom: 12rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #B8812B, #E1B55D);
	color: #FFFFFF;
}

.video-title {
	padding: 0 6rpx 8rpx;
	font-size: 28rpx;
	font-weight: 700;
	color: #183B34;
}

.loading-status {
	padding: 30rpx 0;
	color: #6C766D;
}
</style>
