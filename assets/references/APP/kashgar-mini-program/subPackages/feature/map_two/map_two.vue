<template>
	<view class="container">
		<image v-if="UrlImg" class="background-image" :src="UrlImg + '/baidu_map/weatch/images/back4.png'" mode="aspectFit"></image>
		<view class="content">
			<custom-nav
				v-if="UrlImg"
				:left-icon="UrlImg + '/baidu_map/weatch/images/left3.png'"
				left-icon-size="20px"
				background-color="#FFFFFF"
				@leftClick="goBack"
			/>
			<view class="welcome-section">
				<view class="welcome-title">hi，晚上好！</view>
				<view class="welcome-desc">以下是为你推荐的旅行攻略，快开启三门之旅吧</view>
				<view class="ad-image-wrapper">
					<image
						class="welcome-image"
						:src="localAdImage"
						mode="widthFix"
						@click="goToDetail"
					></image>
					<view class="ad-skip" @click.stop="skipAd">{{ adCountdown }} 跳过</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue';
import CustomNav from '@/components/custom-nav/custom-nav.vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import config from '@/request/config.js'
const localAdImage = 'https://www.neoxiake.com//upload/admin/20260527/7ce2c60dd72aedeccfaa949945d598cf.jpg'
const type = ref(0)
const isFirstGuide = ref(false)
const UrlImg = ref(config.UrlImg || '')
const DEFAULT_MAP_TYPE = '82'
const AD_COUNTDOWN_SECONDS = 3
const VALID_MAP_TYPES = ['82', '81', '80', '79']
const MAP_GUIDE_STORAGE_KEY = 'hasSeenMapGuide'
const adCountdown = ref(AD_COUNTDOWN_SECONDS)
const shouldAutoCloseAd = ref(true)
let adTimer = null
const normalizeMapType = (value) => {
  const currentType = String(value || '')
  return VALID_MAP_TYPES.includes(currentType) ? currentType : DEFAULT_MAP_TYPE
}

const clearAdCountdown = () => {
  if (adTimer) {
    clearInterval(adTimer)
    adTimer = null
  }
}

const startAdCountdown = () => {
  if (!shouldAutoCloseAd.value) return
  clearAdCountdown()
  adCountdown.value = AD_COUNTDOWN_SECONDS
  adTimer = setInterval(() => {
    if (adCountdown.value <= 1) {
      skipAd()
      return
    }
    adCountdown.value -= 1
  }, 1000)
}

const goToDetail = () => {
  markGuideSeen()
  clearAdCountdown()
	uni.navigateTo({
		url: '/subPackages/feature/map_two/detail?type=' + type.value
	})
}

const skipAd = () => {
  markGuideSeen()
  clearAdCountdown()
	uni.redirectTo({
		url: '/subPackages/feature/map_two/detail?type=' + type.value
	})
}

const hasSeenGuide = () => Boolean(uni.getStorageSync(MAP_GUIDE_STORAGE_KEY))

const markGuideSeen = () => {
  uni.setStorageSync(MAP_GUIDE_STORAGE_KEY, true)
}

// 页面加载时调用
onLoad((options) => {
  type.value = normalizeMapType(options.type)
  isFirstGuide.value = options.firstGuide === '1'
  if (!isFirstGuide.value || hasSeenGuide()) {
	uni.redirectTo({
		url: '/subPackages/feature/map_two/detail?type=' + type.value
	})
	return
  }
  if (shouldAutoCloseAd.value) {
	startAdCountdown()
  }
})

onUnload(() => {
  clearAdCountdown()
})

const goBack = () => {
	clearAdCountdown()
	uni.navigateBack()
}
</script>

<style scoped>
.container {
	min-height: 100vh;
}

.background-image {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 0;
	pointer-events: none;
}

.content {
	position: relative;
	z-index: 10;
  margin-top: 100px;
}

.welcome-section {
	padding: 20px 16px;
	position: relative;
}

.welcome-title {
	font-size: 24px;
	font-weight: bold;
	color: #5C4033;
	margin-bottom: 8px;
}

.welcome-desc {
	font-size: 14px;
	color: #8B7355;
	line-height: 20px;
}

.ad-image-wrapper {
	position: relative;
	width: 100%;
	margin-top: 16px;
	overflow: hidden;
	border-radius: 16rpx;
}

.welcome-image{
  width: 100%;
  display: block;
  border: none;
  padding: 0;
  margin: 0;
}

.ad-skip {
	position: absolute;
	right: 58rpx;
	top: 28rpx;
	z-index: 20;
	padding: 10rpx 22rpx;
	border-radius: 999rpx;
	background: rgba(0, 0, 0, 0.56);
	color: #fff;
	font-size: 24rpx;
	line-height: 1.4;
}

.container {
	background: linear-gradient(180deg, #F8F1E4 0%, #F2E8D7 46%, #EEF5EF 100%);
}

.background-image {
	opacity: 0.26;
}

.content {
	margin: 100px 24rpx 0;
}

.welcome-section {
	padding: 28rpx 24rpx;
	border-radius: 30rpx;
	background: rgba(255, 252, 244, 0.92);
	border: 1rpx solid rgba(184, 129, 43, 0.16);
	box-shadow: 0 14rpx 34rpx rgba(43, 57, 45, 0.09);
}

.welcome-title {
	color: #183B34;
	font-weight: 800;
}

.welcome-desc {
	color: #6C766D;
}

.ad-image-wrapper {
	border-radius: 28rpx;
	box-shadow: 0 12rpx 28rpx rgba(43, 57, 45, 0.1);
}

.ad-skip {
	background: rgba(36, 76, 65, 0.82);
	border: 1rpx solid rgba(255, 255, 255, 0.26);
}
</style>
