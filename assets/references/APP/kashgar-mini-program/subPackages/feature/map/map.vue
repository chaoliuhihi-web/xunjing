<template>
	<view v-if="useKashgarMapHome" class="kashgar-map-home">
		<image class="kashgar-map-bg" src="/static/kashgar/map-illustration.png" mode="aspectFill"></image>
		<view class="kashgar-map-wash"></view>

		<view class="kashgar-map-nav">
			<button class="kashgar-map-home-btn" hover-class="kashgar-map-home-btn--hover" @click="goKashgarMapHome">
				<text class="kashgar-map-home-roof"></text>
				<text class="kashgar-map-home-body"></text>
			</button>
			<view class="kashgar-map-heading">
				<text class="kashgar-map-title">喀什文旅地图</text>
				<text class="kashgar-map-subtitle">✦ 星河寻境 ✦</text>
			</view>
			<view class="kashgar-map-capsule">
				<text class="kashgar-map-dot">•••</text>
				<view class="kashgar-map-capsule-line"></view>
				<text class="kashgar-map-ring">◎</text>
			</view>
		</view>

		<view class="kashgar-map-categories">
			<button
				v-for="category in kashgarMapCategories"
				:key="category.label"
				class="kashgar-map-category"
				hover-class="kashgar-map-category--hover"
				@click="handleKashgarMapCategory(category)"
			>
				<view class="kashgar-map-category-icon">{{ category.icon }}</view>
				<text>{{ category.label }}</text>
			</button>
		</view>

		<view class="kashgar-map-tools">
			<button
				v-for="control in kashgarMapControls"
				:key="control.label"
				:class="['kashgar-map-tool', control.active ? 'kashgar-map-tool--active' : '']"
				hover-class="kashgar-map-tool--hover"
				@click="handleKashgarMapControl(control)"
			>
				<text>{{ control.icon }}</text>
			</button>
		</view>

		<view class="kashgar-map-markers">
			<button
				v-for="spot in kashgarMapSpots"
				:key="spot.name"
				:class="['kashgar-map-marker', spot.featured ? 'kashgar-map-marker--featured' : '']"
				:style="{ left: spot.left, top: spot.top }"
				hover-class="kashgar-map-marker--hover"
				@click="openKashgarMapSpot(spot)"
			>
				<view class="kashgar-map-pin">
					<view class="kashgar-map-pin-core"></view>
				</view>
				<text class="kashgar-map-marker-label">{{ spot.name }}</text>
			</button>
		</view>

		<button class="kashgar-map-place-card" hover-class="kashgar-map-place-card--hover" @click="openKashgarMapSpot(kashgarMapFeaturedSpot)">
			<image class="kashgar-map-place-image" src="/static/kashgar/map-gate-east.png" mode="aspectFill"></image>
			<view class="kashgar-map-place-copy">
				<text class="kashgar-map-place-title">喀什古城东门</text>
				<text class="kashgar-map-place-desc">千年古城的迎客之门</text>
				<text class="kashgar-map-place-badge">国家AAAAA级旅游景区</text>
			</view>
			<text class="kashgar-map-place-arrow">›</text>
		</button>

		<tab-bar :current="1" />
	</view>

	<view v-else class="legacy-map-home">
		<image :src="mapImage" class="map_img" mode="aspectFill"></image>

		<!-- 底部导览按钮 -->
		<view class="nav-btn-wrapper">
			<image :src="navImage" class="nav-btn" mode="aspectFit" @click="handleNavClick"></image>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TabBar from '@/components/tab-bar/tab-bar.vue'

const KASHGAR_MAP_LOCAL_CONTENT_ENABLED = true
const useKashgarMapHome = KASHGAR_MAP_LOCAL_CONTENT_ENABLED
const type = ref(0)
const isFirstGuide = ref(false)
const DEFAULT_MAP_TYPE = '82'
const VALID_MAP_TYPES = ['82', '81', '80', '79']
const MAP_GUIDE_STORAGE_KEY = 'hasSeenMapGuide'
const mapImage = 'https://www.neoxiake.com//upload/admin/20260527/95089a260d4431d8584b287d5c039bbb.jpg'
const navImage = '/subPackages/feature/img/nav.png'
const kashgarMapCategories = [
	{ label: '自然风光', icon: '山', type: '82' },
	{ label: '人文景点', icon: '塔', type: '81' },
	{ label: '特色美食', icon: '馕', type: '80' },
	{ label: '行程建议', icon: '游', type: '79' }
]
const kashgarMapControls = [
	{ label: '搜索', icon: '⌕', action: 'search' },
	{ label: '定位', icon: '⌾', action: 'location', active: true },
	{ label: '图层', icon: '▱', action: 'layers' }
]
const kashgarMapSpots = [
	{ name: '艾提尕尔清真寺', left: '55%', top: '24%', type: '81', id: 106 },
	{ name: '香妃园', left: '25%', top: '37%', type: '81', id: 107 },
	{ name: '高台民居', left: '72%', top: '45%', type: '81', id: 108 },
	{ name: '喀什古城集市', left: '36%', top: '53%', type: '80', id: 109 },
	{ name: '喀什古城西门', left: '14%', top: '62%', type: '81', id: 110 },
	{ name: '喀什古城东门', left: '55%', top: '70%', type: '81', id: 111, featured: true }
]
const kashgarMapFeaturedSpot = kashgarMapSpots.find((spot) => spot.featured) || kashgarMapSpots[0]
const normalizeMapType = (value) => {
	const currentType = String(value || '')
	return VALID_MAP_TYPES.includes(currentType) ? currentType : DEFAULT_MAP_TYPE
}
// 页面加载时调用
onLoad((options) => {
  type.value = normalizeMapType(options.type)
  isFirstGuide.value = options.firstGuide === '1'
  if (!useKashgarMapHome && uni.getStorageSync(MAP_GUIDE_STORAGE_KEY)) {
	uni.redirectTo({
		url: '/subPackages/feature/map_two/detail?type=' + type.value
	})
	return
  }
})

const handleNavClick = () => {
	uni.navigateTo({
		url: '/subPackages/feature/map_two/map_two?type=' + type.value + (isFirstGuide.value ? '&firstGuide=1' : '')
	})
}

const goKashgarMapHome = () => {
	uni.reLaunch({
		url: '/pages/index/index'
	})
}

const handleKashgarMapCategory = (category) => {
	type.value = normalizeMapType(category.type)
}

const handleKashgarMapControl = (control) => {
	if (control.action === 'search') {
		uni.navigateTo({
			url: '/subPackages/feature/map_two/search?type=' + type.value
		})
		return
	}

	if (control.action === 'location') {
		uni.showToast({
			title: '已定位到喀什古城',
			icon: 'none'
		})
		return
	}

	handleNavClick()
}

const openKashgarMapSpot = (spot) => {
	const detailType = spot.type || type.value
	const query = spot.id ? `?type=${detailType}&masters=${spot.id}` : `?type=${detailType}`
	uni.navigateTo({
		url: '/subPackages/feature/map_two/detail' + query
	})
}
</script>

<style scoped>
.legacy-map-home {
	width: 100vw;
	height: 100vh;
	position: relative;
	overflow: hidden;
}

.map_img {
	width: 100%;
	height: 100%;
	display: block;
}

.nav-btn-wrapper {
	position: absolute;
	bottom: 80rpx;
	left: 50%;
	transform: translateX(-50%);
	z-index: 10;
}

.nav-btn {
	width: 280rpx;
	height: 80rpx;
	border-radius: 999rpx;
	box-shadow: 0 12rpx 28rpx rgba(43, 57, 45, 0.22);
}

.legacy-map-home::after {
	content: '';
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	height: 34%;
	background: linear-gradient(180deg, rgba(24, 59, 52, 0), rgba(24, 59, 52, 0.28));
	pointer-events: none;
}

.kashgar-map-home {
	width: 100vw;
	min-height: 100vh;
	position: relative;
	overflow: hidden;
	background: #F7F1E4;
	color: #3B2A1C;
	font-family: "Songti SC", "STSong", "PingFang SC", serif;
}

.kashgar-map-bg {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 0;
	filter: blur(0.7px) saturate(0.96);
	opacity: 0.96;
	transform: scale(1.012);
}

.kashgar-map-wash {
	position: absolute;
	inset: 0;
	z-index: 1;
	background:
		linear-gradient(180deg, rgba(255, 252, 242, 0.88) 0%, rgba(255, 252, 242, 0.08) 20%, rgba(255, 252, 242, 0.02) 70%, rgba(247, 241, 228, 0.74) 100%),
		radial-gradient(circle at 50% 8%, rgba(255, 255, 255, 0.58) 0%, rgba(255, 255, 255, 0) 45%);
	pointer-events: none;
}

.kashgar-map-nav {
	position: relative;
	z-index: 5;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 54rpx 38rpx 0;
	box-sizing: border-box;
}

.kashgar-map-home-btn,
.kashgar-map-capsule,
.kashgar-map-category,
.kashgar-map-tool,
.kashgar-map-marker,
.kashgar-map-place-card {
	border: 0;
	margin: 0;
	padding: 0;
	background: transparent;
	line-height: 1;
}

.kashgar-map-home-btn::after,
.kashgar-map-category::after,
.kashgar-map-tool::after,
.kashgar-map-marker::after,
.kashgar-map-place-card::after {
	border: 0;
}

.kashgar-map-home-btn {
	width: 78rpx;
	height: 78rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.94);
	box-shadow: 0 10rpx 28rpx rgba(83, 63, 36, 0.16);
	position: relative;
}

.kashgar-map-home-btn--hover {
	transform: scale(0.96);
}

.kashgar-map-home-roof {
	position: absolute;
	left: 24rpx;
	top: 21rpx;
	width: 28rpx;
	height: 28rpx;
	border-left: 7rpx solid #0B0B0B;
	border-top: 7rpx solid #0B0B0B;
	transform: rotate(45deg);
	border-radius: 3rpx;
}

.kashgar-map-home-body {
	position: absolute;
	left: 25rpx;
	top: 35rpx;
	width: 28rpx;
	height: 24rpx;
	border: 7rpx solid #0B0B0B;
	border-top: 0;
	border-radius: 2rpx;
	box-sizing: border-box;
}

.kashgar-map-heading {
	position: absolute;
	left: 50%;
	top: 64rpx;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 360rpx;
}

.kashgar-map-title {
	font-size: 44rpx;
	line-height: 54rpx;
	font-weight: 900;
	letter-spacing: 0;
	color: #15110C;
	text-shadow: 0 3rpx 0 rgba(255, 255, 255, 0.66);
	white-space: nowrap;
}

.kashgar-map-subtitle {
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 28rpx;
	letter-spacing: 0;
	color: #3A2A1F;
	white-space: nowrap;
}

.kashgar-map-capsule {
	width: 146rpx;
	height: 68rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.9);
	box-shadow: 0 8rpx 24rpx rgba(83, 63, 36, 0.12);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 18rpx;
	color: #070707;
	font-family: "PingFang SC", sans-serif;
	font-size: 32rpx;
}

.kashgar-map-capsule-line {
	width: 1rpx;
	height: 38rpx;
	background: rgba(61, 51, 39, 0.18);
}

.kashgar-map-ring {
	font-size: 45rpx;
	line-height: 45rpx;
	font-weight: 800;
}

.kashgar-map-categories {
	position: absolute;
	left: 32rpx;
	top: 184rpx;
	z-index: 6;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.kashgar-map-category {
	width: 206rpx;
	height: 58rpx;
	padding: 0 18rpx 0 8rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.92);
	box-shadow: 0 8rpx 18rpx rgba(121, 88, 42, 0.14);
	display: flex;
	align-items: center;
	gap: 12rpx;
	color: #60421E;
	font-size: 23rpx;
	font-weight: 800;
	white-space: nowrap;
}

.kashgar-map-category--hover {
	transform: translateX(4rpx);
}

.kashgar-map-category-icon {
	width: 44rpx;
	height: 44rpx;
	border-radius: 50%;
	background: #FFF7E9;
	border: 2rpx solid rgba(181, 127, 45, 0.22);
	display: flex;
	align-items: center;
	justify-content: center;
	color: #A07434;
	font-size: 18rpx;
	font-weight: 900;
}

.kashgar-map-tools {
	position: absolute;
	right: 34rpx;
	top: 185rpx;
	z-index: 6;
	width: 68rpx;
	padding: 24rpx 0;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.92);
	box-shadow: 0 10rpx 26rpx rgba(83, 63, 36, 0.14);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 22rpx;
}

.kashgar-map-tool {
	width: 54rpx;
	height: 54rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #6A4A22;
	font-size: 43rpx;
	font-family: "PingFang SC", sans-serif;
	font-weight: 800;
}

.kashgar-map-tool--active {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	background: #43AA8D;
	color: #FFFFFF;
	font-size: 38rpx;
}

.kashgar-map-tool--hover {
	opacity: 0.76;
}

.kashgar-map-markers {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 4;
}

.kashgar-map-marker {
	position: absolute;
	display: flex;
	align-items: center;
	height: 46rpx;
	transform: translate(-18rpx, -24rpx);
}

.kashgar-map-marker--hover {
	transform: translate(-18rpx, -28rpx) scale(1.02);
}

.kashgar-map-pin {
	width: 38rpx;
	height: 38rpx;
	border-radius: 50% 50% 50% 0;
	background: #FFFFFF;
	transform: rotate(-45deg);
	box-shadow: 0 6rpx 14rpx rgba(82, 61, 36, 0.22);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2;
}

.kashgar-map-pin-core {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	background: #9E7A3B;
}

.kashgar-map-marker-label {
	margin-left: -2rpx;
	padding: 9rpx 18rpx 9rpx 20rpx;
	border-radius: 8rpx;
	background: rgba(57, 128, 95, 0.92);
	color: #FFFFFF;
	font-size: 22rpx;
	font-weight: 800;
	box-shadow: 0 5rpx 12rpx rgba(53, 75, 51, 0.18);
	white-space: nowrap;
}

.kashgar-map-marker--featured .kashgar-map-marker-label {
	background: rgba(53, 117, 87, 0.96);
}

.kashgar-map-place-card {
	position: absolute;
	left: 28rpx;
	right: 28rpx;
	bottom: 150rpx;
	z-index: 7;
	height: 218rpx;
	border-radius: 24rpx;
	background: rgba(255, 255, 255, 0.94);
	box-shadow: 0 16rpx 38rpx rgba(83, 63, 36, 0.17);
	display: flex;
	align-items: center;
	padding: 22rpx 24rpx;
	box-sizing: border-box;
	text-align: left;
}

.kashgar-map-place-card--hover {
	transform: translateY(-3rpx);
}

.kashgar-map-place-image {
	width: 250rpx;
	height: 154rpx;
	border-radius: 15rpx;
	background: #D2B381;
	flex: 0 0 auto;
}

.kashgar-map-place-copy {
	flex: 1;
	min-width: 0;
	margin-left: 24rpx;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
}

.kashgar-map-place-title {
	font-size: 35rpx;
	line-height: 42rpx;
	font-weight: 900;
	color: #27180D;
	white-space: nowrap;
}

.kashgar-map-place-desc {
	margin-top: 16rpx;
	font-size: 24rpx;
	line-height: 28rpx;
	color: #7D654E;
	white-space: nowrap;
}

.kashgar-map-place-badge {
	margin-top: 24rpx;
	padding: 8rpx 15rpx;
	border-radius: 999rpx;
	background: #D6EFE2;
	color: #2C8F74;
	font-size: 20rpx;
	font-weight: 800;
	white-space: nowrap;
}

.kashgar-map-place-arrow {
	width: 36rpx;
	margin-left: 12rpx;
	color: #9C7C56;
	font-family: "PingFang SC", sans-serif;
	font-size: 70rpx;
	line-height: 70rpx;
	text-align: center;
}
</style>
