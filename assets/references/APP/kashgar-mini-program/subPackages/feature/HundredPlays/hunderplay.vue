<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<custom-nav
			title="百县百剧"
      :left-icon="UrlImg + '/baidu_map/weatch/images/left.png'"
			background-color="#F5F1EE"
			@leftClick="goBack"
		/>

		<!-- 页面内容 -->
		<view class="content">
			<!-- 主题横幅卡片 -->
			<view class="banner-card">
				<!-- 横幅图片 -->
				<view class="banner-wrapper">
					<image class="banner-image" :src="UrlImg + '/baidu_map/weatch/images/img3.png'" mode="aspectFill"></image>
				</view>

			<!-- 剧游中国卡片 -->
			<view class="info-bar" @click="goToDetail">
				<view class="info-left">
					<image class="info-icon" :src="UrlImg + '/baidu_map/weatch/images/icon7.png'" mode="aspectFill"></image>
					<text class="info-title">剧游中国</text>
				</view>
				<view class="info-right">
					<text class="detail-text">查看详情</text>
					<image class="arrow-icon" :src="UrlImg + '/baidu_map/weatch/images/arrow.png'" mode="aspectFit"></image>
				</view>
			</view>

			<!-- 宝藏县域横竖都爱 -->
			<view class="treasure-section">
				<!-- 标题栏 -->
				<view class="section-header">
					<view class="header-title">
						<image class="title-bg" :src="UrlImg + '/baidu_map/weatch/images/icon8.png'" mode="widthFix"></image>
						<text class="title-text">宝藏县域横竖都爱</text>
					</view>
					<image class="header-arrow" :src="iconPaths.arrow" mode="aspectFit"></image>
				</view>

				<!-- 内容卡片列表 -->
				<view class="card-list">
					<view class="card-item" v-for="item in treasureList" :key="item.id" @click="goToCardDetail(item)">
						<image class="card-image" :src="item.cover_url" mode="aspectFill"></image>
						<view class="card-info">
							<text class="card-title">{{ item.title }}</text>
						</view>
					</view>
				</view>
			</view>
		<!-- 文旅短剧大荟优秀案例 -->
		<view class="drama-section">
			<!-- 标题栏 -->
			<view class="section-header">
				<view class="header-title">
					<image class="title-bg" :src="UrlImg + '/baidu_map/weatch/images/icon8.png'" mode="widthFix"></image>
					<text class="title-text">文旅短剧大荟优秀案例</text>
				</view>
				<image class="header-arrow" :src="iconPaths.arrow" mode="aspectFit"></image>
			</view>

			<!-- 内容卡片网格列表 -->
			<view class="drama-grid">
				<view class="drama-card" v-for="item in dramaList" :key="item.id" @click="goToDramaDetail(item)">
					<view class="drama-image-wrapper">
						<image class="drama-image" :src="item.cover_url" mode="aspectFill"></image>
						<view class="drama-badge">{{ item.total_episodes }}集全</view>
					</view>
					<view class="drama-content">
						<text class="drama-title">{{ item.title }}</text>
						<text class="drama-subtitle">{{ item.desc_text }}</text>
					</view>
				</view>
			</view>
		</view>
		</view>
	</view>
</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import CustomNav from '@/components/custom-nav/custom-nav.vue'
import config from '@/request/config.js'
import request from '@/request/request.js'

const UrlImg = config.UrlImg
const iconPaths = { arrow: '/static/tabbar/qq.png' }
const page = ref(1)  // 当前页码
const page_size = ref(10)  // 每页数量

const treasureList = ref([])

const dramaList = ref([])

// 获取百县百剧列表 type: 1
const getDramaList = async () => {
	try {
		let params = {
			userId: uni.getStorageSync('userId') || 1,
			type: 1,
			page: page.value,
			page_size: page_size.value
		}
		let res = await request('api2/Drama/getDrama', params, 'GET')
		if (res.code == 0 && res.data) {
			treasureList.value = res.data
		}
	} catch (error) {
		console.error('接口调用失败 type=1:', error)
	}
}

// 获取百县百剧列表 type: 2
const getDramaList2 = async () => {
	try {
		let params = {
			userId: uni.getStorageSync('userId') || 1,
			type: 2,
			page: page.value,
			page_size: page_size.value
		}
		let res = await request('api2/Drama/getDrama', params, 'GET')
		if (res.code == 0 && res.data) {
			dramaList.value = res.data
		}
	} catch (error) {
		console.error('接口调用失败 type=2:', error)
	}
}

// 返回上一页
const goBack = () => {
	uni.navigateBack()
}

// 查看详情
const goToDetail = () => {
	uni.navigateTo({
		url: '/subPackages/feature/shortPlay/shortplay'
	})
}

// 跳转到卡片详情
const goToCardDetail = (item) => {
	uni.navigateTo({
		url: `/subPackages/feature/shortPlays/shortPlays?id=${item.id}`
	})
}

// 跳转到短剧详情
const goToDramaDetail = (item) => {
	uni.navigateTo({
		url: `/subPackages/feature/shortPlays/shortPlays?id=${item.id}`
	})
}

// 页面加载时调用
onLoad(() => {
	getDramaList()
	getDramaList2()
})

</script>

<style scoped>
.container {
	background-color: #F5F1EE;
	height: 100%;
}

.content {
	padding: 80px 20rpx 20rpx;
}

/* 主题横幅卡片 */
.banner-card {
	border-radius: 16rpx;
	overflow: hidden;
	margin-bottom: 30rpx;
}

/* 横幅图片区域 */
.banner-wrapper {
	width: 100%;
	height: 360rpx;
	overflow: hidden;
}

.banner-image {
	width: 100%;
	height: 100%;
}

/* 底部信息栏 */
.info-bar {
	display: flex;
	align-items: center;
	margin-top: 15px;
}

.info-left {
	display: flex;
	align-items: center;
	flex: 1;
}

.info-icon {
	width: 36rpx;
	height: 36rpx;
	border-radius: 50%;
	margin-right: 20rpx;
}

.info-title {
	font-size: 32rpx;
	font-weight: 500;
	color: #6D4F1F;
}

.info-right {
	display: flex;
	align-items: center;
}

.detail-text {
	font-size: 28rpx;
	color: #170506;
	margin-right: 8rpx;
}

.arrow-icon {
	width: 32rpx;
	height: 32rpx;
}

/* 宝藏县域区域 */
.treasure-section {
	margin-top: 40rpx;
}

/* 标题栏 */
.section-header {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 30rpx;
	position: relative;
}

.header-title {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
}

.title-bg {
	width: 400rpx;
	height: auto;
}

.title-text {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	font-size: 32rpx;
	font-weight: bold;
	color: #333333;
	white-space: nowrap;
}

.header-arrow {
	width: 32rpx;
	height: 32rpx;
	position: absolute;
	right: 0;
}

/* 卡片列表 */
.card-list {
	display: flex;
	gap: 20rpx;
	overflow-x: auto;
	padding-bottom: 10rpx;
}

.card-item {
	flex-shrink: 0;
	width: 244rpx;
	background-color: #FFFFFF;
	border-radius: 12rpx;
	overflow: hidden;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.card-image {
	width: 244rpx;
	height: 326rpx;
}

.card-info {
	padding: 20rpx;
}

.card-title {
	font-size: 28rpx;
	color: #333333;
	font-weight: 500;
}

/* 文旅短剧区域 */
.drama-section {
	margin-top: 40rpx;
}

/* 短剧网格布局 */
.drama-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
	padding: 0 10rpx;
}

.drama-card {
	border-radius: 12rpx;
	overflow: hidden;
	background-color: #FFFFFF;
}

.drama-image-wrapper {
	position: relative;
	width: 100%;
	height: 240rpx;
	overflow: hidden;
}

.drama-image {
	width: 100%;
	height: 100%;
}

.drama-badge {
	position: absolute;
	bottom: 10rpx;
	right: 10rpx;
	background-color: rgba(0, 0, 0, 0.6);
	color: #FFFFFF;
	font-size: 22rpx;
	padding: 4rpx 12rpx;
	border-radius: 4rpx;
}

.drama-content {
	padding: 16rpx 20rpx 20rpx;
	background-color: #FFFFFF;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.drama-title {
	font-size: 28rpx;
	color: #333333;
	font-weight: 500;
	line-height: 1.4;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.drama-subtitle {
	font-size: 24rpx;
	color: #999999;
	line-height: 1.3;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.container {
	min-height: 100vh;
	background: linear-gradient(180deg, #F8F1E4 0%, #F2E8D7 48%, #EEF5EF 100%);
}

.content {
	padding: 92px 24rpx 44rpx;
}

.banner-card {
	border-radius: 30rpx;
	background: rgba(255, 252, 244, 0.92);
	border: 1rpx solid rgba(184, 129, 43, 0.16);
	box-shadow: 0 14rpx 34rpx rgba(43, 57, 45, 0.1);
	padding: 16rpx;
	box-sizing: border-box;
}

.banner-wrapper,
.banner-image {
	border-radius: 24rpx;
}

.info-bar {
	padding: 20rpx 6rpx 8rpx;
}

.info-title,
.detail-text,
.title-text,
.card-title,
.drama-title {
	color: #183B34;
	font-weight: 800;
}

.treasure-section,
.drama-section {
	margin-top: 28rpx;
	padding: 26rpx 22rpx;
	border-radius: 30rpx;
	background: rgba(255, 252, 244, 0.92);
	border: 1rpx solid rgba(184, 129, 43, 0.16);
	box-shadow: 0 14rpx 34rpx rgba(43, 57, 45, 0.08);
}

.section-header {
	justify-content: space-between;
	margin-bottom: 26rpx;
}

.title-bg {
	display: none;
}

.title-text {
	position: static;
	transform: none;
	font-size: 32rpx;
}

.title-text::before {
	content: '';
	display: inline-block;
	width: 10rpx;
	height: 30rpx;
	margin-right: 12rpx;
	border-radius: 999rpx;
	background: #B8812B;
	vertical-align: -4rpx;
}

.card-list {
	gap: 22rpx;
}

.card-item,
.drama-card {
	border-radius: 24rpx;
	background: rgba(255, 252, 244, 0.96);
	border: 1rpx solid rgba(184, 129, 43, 0.14);
	box-shadow: 0 12rpx 28rpx rgba(42, 55, 43, 0.09);
}

.card-image,
.drama-image-wrapper {
	border-radius: 22rpx 22rpx 0 0;
}

.drama-badge {
	border-radius: 999rpx;
	background: linear-gradient(135deg, #B8812B, #E1B55D);
}

.drama-subtitle {
	color: #6C766D;
}
</style>
