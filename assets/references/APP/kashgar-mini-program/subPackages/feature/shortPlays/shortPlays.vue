<template>
  <view class="container">
    <!-- 自定义导航栏 - 透明背景 -->
		<custom-nav
			:title="drama.title || ''"
			:left-icon="UrlImg + '/baidu_map/weatch/images/left.png'"
			background-color="#ffffff"
			@leftClick="goBack"
		/>
        <view class="content">
            <view class="province-icon-wrapper">
                <video
					class="province-video"
					:src="episodeList[currentIndex]?.video_url"
					:poster="episodeList[currentIndex]?.cover_url"
					controls
					object-fit="cover"
				></video>
				<cover-image class="video-logo" :src="VIDEO_LOGO_URL"></cover-image>
            </view>

			<!-- 标题区域 -->
			<view class="title-section" @click="openDramaInfo">
				<text class="drama-title">{{ drama.title }}</text>
				<view class="arrow-right">
					<image class="arrow-icon" :src="UrlImg + '/baidu_map/weatch/images/rlght.png'" mode="aspectFill"></image>
				</view>
			</view>

			<!-- 观看信息 -->
			<view class="meta-info">
				<text class="meta-text">{{ drama.look_num }}次观看 · {{ drama.created_at }}</text>
			</view>

			<!-- 互动按钮 -->
			<view class="action-buttons">
				<view class="action-btn" :class="{ 'action-btn-liked': isZan }" @click="handleZan">
					<image
						class="action_img"
						:src="isZan ? '/static/tabbar/444.png' : UrlImg + '/baidu_map/weatch/images/zan.png'"
						mode="aspectFit"
					></image>
					<text class="action-text" :class="{ 'action-text-liked': isZan }">{{ drama.zan_num || 0 }}</text>
				</view>
				<view class="action-btn" @click="downloadVideo">
					<image class="action_img" :src="UrlImg + '/baidu_map/weatch/images/xz.png'" mode="aspectFill"></image>
					<text class="action-text">缓存</text>
				</view>
				<button class="action-btn share-btn" open-type="share" @click="handleShare">
					<image class="action_img" :src="UrlImg + '/baidu_map/weatch/images/fx.png'" mode="aspectFill"></image>
					<text class="action-text">分享</text>
				</button>
			</view>

			<!-- 选集区域 -->
			<view class="episodes-section">
				<view class="section-header">
					<text class="section-title">选集</text>
					<view class="arrow-right" @click="openEpisodePicker">
						<image class="arrow-icon" :src="UrlImg + '/baidu_map/weatch/images/rlght.png'" mode="aspectFill"></image>
					</view>
				</view>
				<scroll-view class="episodes-scroll" scroll-x="true" show-scrollbar="false">
					<view class="episodes-grid">
						<view class="episode-item" :class="{ 'episode-item-active': index === currentIndex }" v-for="(item, index) in episodeList" :key="item.id" @click="selectEpisode(index)">
							<text class="episode-number" :class="{ 'active': index === currentIndex }">{{ index + 1 }}</text>
							<image v-if="index === currentIndex" class="episode-selected-icon" :src="iconPaths.check" mode="aspectFit"></image>
						</view>
					</view>
				</scroll-view>
			</view>

			<!-- 相关推荐区域 -->
			<view class="recommend-section">
				<view class="section-header">
					<text class="section-title">相关推荐</text>
				</view>

				<scroll-view class="recommend-scroll" scroll-x="true" show-scrollbar="false">
					<view class="recommend-list">
						<view class="recommend-item" v-for="item in recommendList" :key="item.id" @click="onRecommendClick(item.id)">
							<view class="recommend-cover">
								<image class="cover-image" :src="item.cover_url" mode="aspectFill"></image>
								<view class="episode-count">
									<text class="count-text">{{ item.total_episodes }}集全</text>
								</view>
							</view>
							<view class="recommend-info">
								<text class="recommend-title">{{ item.title }}</text>
								<view class="recommend-subtitle">{{ item.desc_text }}</view>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>

		<!-- 周边视频区域 -->
		<view class="nearby-section">
			<view class="section-header">
				<text class="section-title">周边视频</text>
			</view>

			<view class="nearby-list">
				<view class="nearby-item" v-for="item in nearbyList" :key="item.id" @click="onNearbyClick(item.id)">
					<view class="nearby-cover">
						<image class="nearby-image" :src="item.cover_url" mode="aspectFill"></image>
						<view class="nearby-desc">
							<view class="desc-text">{{ item.desc_text }}</view>
						</view>
					</view>

					<view class="nearby-bottom">
						<view class="left-section">
							<text class="author-name">{{ item.title }}</text>
							<view class="tags-row">
								<image class="subscribe-icon" :src="item.brand.img_url" mode="aspectFill"></image>
								<view class="tag-btn follow-btn" :class="{ 'followed': item.isFollow }" @click.stop="handleFollow(item)">
									<text class="follow-text">{{ item.isFollow ? '已关注' : '+ 关注' }}</text>
								</view>
							</view>
						</view>

						<view class="action-icons">
							<view class="icon-item" @click.stop="handleLike(item)">
								<image
									:class="['action-icon', { 'action-icon-red': item.isLiked }]"
									:src="item.isLiked ? '/static/tabbar/000.png' : UrlImg + '/baidu_map/weatch/images/like-icon.png'"
									mode="aspectFill"
								></image>
							</view>
							<button class="share-btn" open-type="share" @click.stop="handleNearbyShare(item)">
								<image class="action-icon" :src="UrlImg + '/baidu_map/weatch/images/share-icon.png'" mode="aspectFill"></image>
							</button>

						</view>
					</view>
				</view>
			</view>
		</view>
        </view>
		<view v-if="activePopup" class="popup-mask" @click="closeActivePopup"></view>
		<view v-if="showDramaInfoPopup" class="drama-info-popup">
			<view class="popup-header">
				<text class="popup-title">详情</text>
				<text class="popup-close" @click="closeDramaInfo">×</text>
			</view>
			<scroll-view class="popup-content" scroll-y="true">
				<view class="detail-hero">
					<image
						v-if="currentEpisodeCover"
						class="detail-cover"
						:src="currentEpisodeCover"
						mode="aspectFill"
					></image>
					<view class="detail-main">
						<text class="detail-title">{{ drama.title || '剧集详情' }}</text>
						<view class="detail-tags">
							<text class="detail-tag" v-if="drama.total_episodes">{{ drama.total_episodes }}集</text>
							<text class="detail-tag" v-if="drama.created_at">{{ drama.created_at.split(' ')[0] }}</text>
							<text class="detail-tag" v-if="episodeList[currentIndex]?.episode_no">{{ episodeList[currentIndex].episode_no }}</text>
						</view>
					</view>
				</view>
				<view class="popup-section" v-if="drama.desc_text">
					<text class="popup-section-title">简介</text>
					<text class="popup-desc">{{ drama.desc_text }}</text>
				</view>
				<view class="popup-section" v-if="currentEpisodeDetail">
					<text class="popup-section-title">本集详情</text>
					<rich-text class="popup-rich-text" :nodes="currentEpisodeDetail"></rich-text>
				</view>
				<view class="popup-section" v-if="!drama.desc_text && !currentEpisodeDetail">
					<text class="popup-desc">暂无简介</text>
				</view>
			</scroll-view>
		</view>
		<view v-if="showEpisodePopup" class="episode-picker-popup">
			<view class="popup-header">
				<text class="popup-title">选集</text>
				<text class="popup-close" @click="closeEpisodePicker">×</text>
			</view>
			<scroll-view class="popup-content episode-picker-content" scroll-y="true">
				<view class="episode-summary" v-if="episodeList[currentIndex]">
					<image
						v-if="episodeList[currentIndex].cover_url"
						class="episode-summary-cover"
						:src="episodeList[currentIndex].cover_url"
						mode="aspectFill"
					></image>
					<view class="episode-summary-info">
						<text class="episode-summary-title">{{ episodeList[currentIndex].title || drama.title }}</text>
						<text class="episode-summary-subtitle">{{ episodeList[currentIndex].episode_no || `第${currentIndex + 1}集` }}</text>
					</view>
				</view>
				<view class="episode-count-row">
					<text class="episode-count-text">更新至{{ episodeList.length }}集/共{{ drama.total_episodes || episodeList.length }}集</text>
				</view>
				<view class="episode-picker-grid">
					<view
						class="episode-picker-item"
						:class="{ 'episode-picker-item-active': index === currentIndex }"
						v-for="(item, index) in episodeList"
						:key="item.id"
						@click="selectEpisodeFromPopup(index)"
					>
						<text class="episode-picker-number">{{ index + 1 }}</text>
						<image v-if="index === currentIndex" class="episode-picker-active-icon" :src="iconPaths.check" mode="aspectFit"></image>
					</view>
				</view>
			</scroll-view>
		</view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'

import config from '@/request/config.js'
import request from '@/request/request.js'

// 响应式数据
const UrlImg = config.UrlImg
const VIDEO_LOGO_URL = 'https://www.neoxiake.com//upload/admin/20260602/d307da0de58c7b5ab10dc6abf35797da.png'
const iconPaths = { check: '/static/tabbar/11.png' }
const dramaId = ref('')
const drama = ref({})        // 剧集信息
const episodeList = ref([])  // 集数列表 (list)
const recommendList = ref([]) // 相关推荐 (xgtj)
const nearbyList = ref([])   // 周边视频 (zhoubian)
const currentIndex = ref(0)  // 当前选中的集数索引
const currentShareItem = ref(null) // 当前要分享的信息
const isZan = ref(false)     // 是否已点赞
const showDramaInfoPopup = ref(false)
const showEpisodePopup = ref(false)

const currentEpisodeDetail = computed(() => {
	const currentEpisode = episodeList.value[currentIndex.value]
	return currentEpisode && currentEpisode.detail ? currentEpisode.detail : ''
})

const currentEpisodeCover = computed(() => {
	const currentEpisode = episodeList.value[currentIndex.value]
	return currentEpisode && currentEpisode.cover_url ? currentEpisode.cover_url : drama.value.cover_url
})

const activePopup = computed(() => showDramaInfoPopup.value || showEpisodePopup.value)

// 切换集数
const selectEpisode = (index) => {
	currentIndex.value = index
}

const openDramaInfo = () => {
	showEpisodePopup.value = false
	showDramaInfoPopup.value = true
}

const closeDramaInfo = () => {
	showDramaInfoPopup.value = false
}

const openEpisodePicker = () => {
	showDramaInfoPopup.value = false
	showEpisodePopup.value = true
}

const closeEpisodePicker = () => {
	showEpisodePopup.value = false
}

const closeActivePopup = () => {
	showDramaInfoPopup.value = false
	showEpisodePopup.value = false
}

const selectEpisodeFromPopup = (index) => {
	selectEpisode(index)
	closeEpisodePicker()
}

// 获取剧集详情
const getDramaDetail = async () => {
	try {
		// 从本地存储获取用户ID
		const userId = uni.getStorageSync('userId') || 1
		console.log('👤 userId:', userId)

		const params = {
			userId: userId,
			data_id: dramaId.value
		}
		const res = await request('api2/Drama/getDramaDetail', params, 'GET')
		if (res.code == 0 && res.data) {
			const data = res.data
			closeActivePopup()
			drama.value = data.drama || {}
			isZan.value = Number(drama.value.zan || drama.value.is_zan || 0) === 1
			episodeList.value = data.list || []
			recommendList.value = data.xgtj || []
			// 处理周边视频数据，添加关注状态
			nearbyList.value = (data.zhoubian || []).map(item => ({
				...item,
				brandId: item.brand && item.brand.id ? item.brand.id : '',
				isFollow: item.brand && item.brand.is_follow == 1
			}))
		} else {
			console.log('⚠️ 接口返回失败, code:', res.code, 'msg:', res.msg)
			uni.showToast({
				title: res.msg || '获取详情失败',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('❌ 获取剧集详情失败, 错误信息:', error)
		uni.showToast({
			title: '获取详情失败',
			icon: 'none'
		})
	}
}

// 返回上一页
const goBack = () => {
	uni.navigateBack()
}

// 点击相关推荐
const onRecommendClick = (id) => {
	console.log(id);
	dramaId.value = id
	currentIndex.value = 0  // 重置选中的集数
	getDramaDetail()
}

// 点击周边视频
const onNearbyClick = (id) => {
	console.log(id);
	dramaId.value = id
	currentIndex.value = 0  // 重置选中的集数
	getDramaDetail()
}

// 下载视频
const downloadVideo = () => {
	const videoUrl = episodeList.value[currentIndex.value]?.video_url
	if (!videoUrl) {
		uni.showToast({
			title: '暂无视频可下载',
			icon: 'none'
		})
		return
	}

	uni.showLoading({
		title: '正在下载...'
	})

	uni.downloadFile({
		url: videoUrl,
		success: (res) => {
			if (res.statusCode === 200) {
				uni.saveVideoToPhotosAlbum({
					filePath: res.tempFilePath,
					success: () => {
						uni.hideLoading()
						uni.showToast({
							title: '已保存到相册',
							icon: 'success'
						})
					},
					fail: (err) => {
						uni.hideLoading()
						console.error('保存失败:', err)
						uni.showToast({
							title: '保存失败，请检查权限',
							icon: 'none'
						})
					}
				})
			}
		},
		fail: (err) => {
			uni.hideLoading()
			console.error('下载失败:', err)
			uni.showToast({
				title: '下载失败',
				icon: 'none'
			})
		}
	})
}

// 处理关注
const handleFollow = async (item) => {
	try {
		console.log('👤 点击关注:', item)
		console.log('🏷️ 品牌ID (brandId):', item.brandId)
		console.log('📊 当前关注状态:', item.isFollow)

		// 从本地存储获取用户ID
		const userId = uni.getStorageSync('userId') || 1

		// 根据当前状态决定操作: 已关注则取消(2), 未关注则关注(1)
		const action = item.isFollow ? 2 : 1

		const params = {
			userId: userId,
			brandId: item.brand_id ,
			action: action
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

// 点赞
const handleZan = async () => {
	try {
		const userInfo = uni.getStorageSync('userInfo') || {}
		const userModel = uni.getStorageSync('userModel') || {}
		const userId = uni.getStorageSync('userId') || userInfo.id || userInfo.user_id || (userModel.member && userModel.member.id) || userModel.id || ''
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
		const action = isZan.value ? 2 : 1  // 1点赞 2取消
		const params = {
			userId: userId,
			dataId: drama.value.id,
			action: action,
			type: 1
		}

		console.log('👍 点赞请求参数:', params)

		const res = await request('api2/Drama/dramaZan', params, 'GET')
		console.log('✅ 点赞接口返回:', res)

		if (res.code == 0) {
			isZan.value = !isZan.value
			// 更新点赞数量
			if (isZan.value) {
				drama.value.zan_num = (drama.value.zan_num || 0) + 1
			} else {
				drama.value.zan_num = Math.max((drama.value.zan_num || 0) - 1, 0)
			}
			uni.showToast({
				title: isZan.value ? '点赞成功' : '已取消点赞',
				icon: 'success'
			})
		}
	} catch (error) {
		console.error('❌ 点赞失败:', error)
	}
}

// 分享
const handleShare = async () => {
	const currentEpisode = episodeList.value[currentIndex.value]
	console.log('🎬 点击分享的剧集:', currentEpisode)
	console.log('🆔 剧集ID (dataId):', currentEpisode?.id)

	// 保存当前要分享的信息,供 onShareAppMessage 使用
	currentShareItem.value = {
		id: currentEpisode?.id,
		title: drama.value.title,
		cover_url: currentEpisode?.cover_url || drama.value.cover_url
	}

	// 调用分享统计接口
	try {
		const userId = uni.getStorageSync('userId') || 1
		const params = {
			userId: userId,
			dataId: currentEpisode?.id || '',
			type: 2
		}

		console.log('📤 分享统计参数:', params)

		const res = await request('api2/Drama/dramaShare', params, 'GET')
		console.log('✅ 分享统计返回:', res)
	} catch (error) {
		console.error('❌ 分享统计失败:', error)
	}
}

// 周边视频分享
const handleNearbyShare = async (item) => {
	console.log('🎬 点击分享的周边视频:', item)
	console.log('🆔 视频ID (dataId):', item.id)

	// 保存当前要分享的信息,供 onShareAppMessage 使用
	currentShareItem.value = item

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
}

// 处理点赞
const handleLike = async (item) => {
	const isLiked = item.isLiked
	const action = isLiked ? 2 : 1  // 1点赞，2取消点赞

	try {
		const userInfo = uni.getStorageSync('userInfo') || {}
		const userModel = uni.getStorageSync('userModel') || {}
		const userId = uni.getStorageSync('userId') || userInfo.id || userInfo.user_id || (userModel.member && userModel.member.id) || userModel.id || ''
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
		const params = {
			userId: userId,
			dataId: item.id,
			action: action,
			type: 3
		}

		const res = await request('api2/Drama/dramaZan', params, 'GET')
		console.log('点赞结果:', res)

		if (res.code == 0) {
			// 切换点赞状态
			item.isLiked = !isLiked
			uni.showToast({
				title: isLiked ? '已取消点赞' : '点赞成功',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('点赞失败:', error)
	}
}

// 分享配置
onShareAppMessage(() => {
	if (currentShareItem.value) {
		const item = currentShareItem.value
		console.log('📤 分享内容:', item)
		return {
			title: item.title || '喀什剧场',
			path: `/subPackages/feature/shortPlays/shortPlays?id=${item.id}`,
			imageUrl: item.cover_url || ''
		}
	}
	// 默认分享内容
	return {
		title: drama.value.title || '喀什剧场',
		path: `/subPackages/feature/shortPlays/shortPlays?id=${dramaId.value}`,
		imageUrl: drama.value.cover_url || ''
	}
})

// 页面加载
onLoad((options) => {
	dramaId.value = options.dramaId || options.id
	getDramaDetail()
})
</script>
<style scoped>
.container {
	position: relative;
	min-height: 100vh;
	overflow: hidden;
	background-color: #ffffff;
}

.content {
	width: 100%;
	margin-top: 75px;
}

/* 图片区域 */
.province-icon-wrapper {
	width: 100%;
	position: relative;
	overflow: hidden;
}

.province-video {
	width: 100%;
	height: 419rpx;
  margin-top: 20px;
}

.video-logo {
	position: absolute;
	top: 64rpx;
	left: 24rpx;
	z-index: 20;
	width: 96rpx;
	height: 58rpx;
}

/* 标题区域 */
.title-section {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx 30rpx 20rpx;
}

.title-section:active {
	opacity: 0.7;
}

.drama-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #170506;
	line-height: 1.4;
}

.arrow-right {
	margin-left: 20rpx;
}

.arrow-icon {
	width: 32rpx;
	height: 32rpx;
}

/* 观看信息 */
.meta-info {
	padding: 0 30rpx 0rpx;
}

.meta-text {
	font-size: 26rpx;
	color: #999999;
	line-height: 1.5;
}

/* 互动按钮区域 */
.action-buttons {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 40rpx 30rpx;
	gap: 20rpx;
}

.action-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 80rpx;
	border-radius: 55rpx;
	background-color: #F6F6F6;
}

.action-btn-liked {
	background-color: #fff3f3;
}

.action-text {
	font-size: 28rpx;
	color: #333333;
	line-height: 1.5;
}

.action-text-liked {
	color: #f21d1d;
}

/* 选集区域 */
.episodes-section {
	padding: 0 30rpx 40rpx;
}

.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 40rpx;
}

.section-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333333;
}

/* 选集滚动容器 */
.episodes-scroll {
	width: 100%;
	white-space: nowrap;
}

/* 选集网格 */
.episodes-grid {
	display: inline-flex;
	gap: 24rpx;
}

.episode-item {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 96rpx;
	height: 96rpx;
	background-color: #f7f7f7;
	border-radius: 8rpx;
	flex-shrink: 0;
}

/* 选中状态 */
.episode-item-active {
	background-color: #FFF3F4;
}

/* 选中图标 - 左下角 */
.episode-selected-icon {
	position: absolute;
	left: 8px;
	top: 34px;
	width: 15rpx;
	height: 17rpx;
}

.episode-number {
	font-size: 32rpx;
	color: #333333;
	font-weight: 400;
}

.episode-number.active {
	font-weight: 500;
}

.episode-item:active {
	opacity: 0.7;
}
.action_img{
	width: 42rpx;
	height: 42rpx;
	margin-right: 20rpx;
}

/* 相关推荐区域 */
.recommend-section {
	padding: 40rpx 30rpx;
}

.recommend-scroll {
	width: 100%;
	white-space: nowrap;
}

.recommend-list {
	display: inline-flex;
	gap: 20rpx;
}

.recommend-item {
	display: inline-block;
	width: 280rpx;
	flex-shrink: 0;
}

.recommend-cover {
	position: relative;
	width: 100%;
	height: 180rpx;
	border-radius: 12rpx;
	overflow: hidden;
	margin-bottom: 16rpx;
}

.cover-image {
	width: 100%;
	height: 100%;
}

.episode-count {
	position: absolute;
	bottom: 12rpx;
	right: 0rpx;
	padding: 4rpx 12rpx;
	background-color: rgba(0, 0, 0, 0.6);
	border-radius: 4rpx;
}

.count-text {
	font-size: 22rpx;
	color: #ffffff;
	line-height: 1.4;
}

.recommend-info {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	width: 100%;
	overflow: hidden;
}

.recommend-title {
	font-size: 28rpx;
	font-weight: 500;
	color: #333333;
	line-height: 1.4;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.recommend-subtitle {
	display: block;
	width: 100%;
	font-size: 24rpx;
	color: #999999;
	line-height: 1.4;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.recommend-item:active {
	opacity: 0.7;
}

/* 周边视频区域 */
.nearby-section {
	padding: 0 30rpx 40rpx;
}

.nearby-list {
	display: flex;
	flex-direction: column;
	gap: 30rpx;
}

.nearby-item {
	width: 100%;
}

.nearby-cover {
	position: relative;
	width: 100%;
	height: 420rpx;
	border-radius: 16rpx;
	overflow: hidden;
	margin-bottom: 20rpx;
}

.nearby-image {
	width: 100%;
	height: 100%;
}

.nearby-desc {
	position: absolute;
	top: 24rpx;
	left: 24rpx;
	right: 24rpx;
	padding: 0;
}

.desc-text {
	font-size: 28rpx;
	color: #ffffff;
	line-height: 1.6;
	text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	overflow: hidden;
	text-overflow: ellipsis;
}

.nearby-bottom {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
}

.left-section {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.author-name {
	font-size: 32rpx;
	font-weight: 500;
	color: #333333;
}

.tags-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.subscribe-icon {
	width: 90rpx;
	height: 36rpx;
}

.tag-btn {
	display: flex;
	align-items: center;
	padding: 8rpx 24rpx;
	border-radius: 25rpx;
	border: 1rpx solid;
}

.follow-btn {
	border-color: #DED9CE;
	background-color: transparent;
}

/* 已关注状态 */
.follow-btn.followed {
	background: #F5F1EE;
	border-color: #C4B5A0;
}

.follow-btn.followed .follow-text {
	color: #999999;
}

.follow-text {
	font-size: 24rpx;
	color: #6D4F1F;
}

.tag-btn:active {
	opacity: 0.7;
}

.action-icons {
	display: flex;
	align-items: center;
	gap: 32rpx;
}

.icon-item {
	display: flex;
	align-items: center;
	justify-content: center;
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
}

.share-btn::after {
	border: none;
}

.action-icon {
	width: 44rpx;
	height: 44rpx;
}

.action-icon-red {
	filter: brightness(0) saturate(100%) invert(20%) sepia(89%) saturate(3850%) hue-rotate(345deg) brightness(95%) contrast(96%);
}

.popup-mask {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	z-index: 998;
	background: rgba(0, 0, 0, 0.45);
}

.drama-info-popup,
.episode-picker-popup {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
	max-height: 74vh;
	background: #ffffff;
	border-radius: 24rpx 24rpx 0 0;
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.18);
	overflow: hidden;
}

.popup-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx 38rpx 24rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.popup-title {
	flex: 1;
	min-width: 0;
	font-size: 34rpx;
	font-weight: 600;
	color: #170506;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.popup-close {
	width: 56rpx;
	height: 56rpx;
	margin-left: 20rpx;
	text-align: center;
	line-height: 52rpx;
	font-size: 44rpx;
	color: #999999;
}

.popup-content {
	max-height: 62vh;
	padding: 28rpx 38rpx calc(40rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.detail-hero {
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;
}

.detail-cover {
	width: 168rpx;
	height: 220rpx;
	border-radius: 12rpx;
	flex-shrink: 0;
	background: #f4f4f4;
}

.detail-main {
	flex: 1;
	min-width: 0;
	margin-left: 28rpx;
}

.detail-title {
	display: block;
	margin-bottom: 18rpx;
	font-size: 38rpx;
	font-weight: 600;
	color: #111111;
}

.detail-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;
}

.detail-tag {
	padding: 8rpx 18rpx;
	border: 1rpx solid #eeeeee;
	border-radius: 12rpx;
	font-size: 26rpx;
	color: #333333;
	background: #ffffff;
}

.popup-section {
	margin-bottom: 28rpx;
}

.popup-section:last-child {
	margin-bottom: 0;
}

.popup-section-title {
	display: block;
	margin-bottom: 14rpx;
	font-size: 28rpx;
	font-weight: 600;
	color: #333333;
}

.popup-desc,
.popup-rich-text {
	font-size: 28rpx;
	color: #555555;
	line-height: 1.7;
}

.episode-picker-content {
	padding-top: 28rpx;
}

.episode-summary {
	display: flex;
	align-items: center;
	margin-bottom: 28rpx;
	padding: 0;
	border: 1rpx solid #eeeeee;
	border-radius: 14rpx;
	background: #f8f8fb;
	overflow: hidden;
}

.episode-summary-cover {
	width: 220rpx;
	height: 126rpx;
	flex-shrink: 0;
	background: #eeeeee;
}

.episode-summary-info {
	flex: 1;
	min-width: 0;
	padding: 0 22rpx;
}

.episode-summary-title {
	display: block;
	font-size: 31rpx;
	font-weight: 500;
	color: #111111;
	line-height: 1.35;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.episode-summary-subtitle {
	display: block;
	margin-top: 10rpx;
	font-size: 26rpx;
	color: #888888;
}

.episode-count-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}

.episode-count-text {
	font-size: 32rpx;
	color: #111111;
}

.episode-picker-grid {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 18rpx;
}

.episode-picker-item {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 102rpx;
	border: 1rpx solid #eeeeee;
	border-radius: 12rpx;
	background: #ffffff;
	box-sizing: border-box;
}

.episode-picker-item-active {
	background: #f4f4fb;
}

.episode-picker-number {
	font-size: 38rpx;
	font-weight: 500;
	color: #111111;
}

.episode-picker-item-active .episode-picker-number {
	color: #1db666;
}

.episode-picker-active-icon {
	position: absolute;
	left: 12rpx;
	bottom: 12rpx;
	width: 18rpx;
	height: 20rpx;
}

.container {
	background: linear-gradient(180deg, #F8F1E4 0%, #F2E8D7 46%, #EEF5EF 100%);
}

.content {
	margin-top: 82px;
	padding-bottom: 44rpx;
}

.province-icon-wrapper {
	width: auto;
	margin: 0 24rpx;
	border-radius: 30rpx;
	box-shadow: 0 14rpx 36rpx rgba(43, 57, 45, 0.14);
}

.province-video {
	height: 430rpx;
	margin-top: 0;
	border-radius: 30rpx;
	overflow: hidden;
}

.title-section,
.meta-info,
.action-buttons,
.episodes-section,
.recommend-section,
.nearby-section {
	margin: 24rpx;
	padding: 26rpx;
	border-radius: 30rpx;
	background: rgba(255, 252, 244, 0.92);
	border: 1rpx solid rgba(184, 129, 43, 0.16);
	box-shadow: 0 14rpx 34rpx rgba(43, 57, 45, 0.08);
}

.meta-info {
	margin-top: -8rpx;
	padding-top: 20rpx;
}

.drama-title,
.section-title,
.author-name,
.recommend-title,
.popup-title,
.detail-title {
	color: #183B34;
	font-weight: 800;
}

.section-title::before {
	content: '';
	display: inline-block;
	width: 10rpx;
	height: 30rpx;
	margin-right: 12rpx;
	border-radius: 999rpx;
	background: #B8812B;
	vertical-align: -4rpx;
}

.meta-text,
.recommend-subtitle,
.popup-desc,
.popup-rich-text,
.desc-text {
	color: #6C766D;
}

.action-buttons {
	gap: 18rpx;
}

.action-btn {
	height: 82rpx;
	background: rgba(238, 245, 239, 0.96);
	border: 1rpx solid rgba(184, 129, 43, 0.14);
	box-shadow: none;
}

.action-btn-liked {
	background: linear-gradient(135deg, rgba(184, 129, 43, 0.14), rgba(225, 181, 93, 0.22));
}

.episode-item,
.episode-picker-item {
	border-radius: 22rpx;
	background: rgba(238, 245, 239, 0.9);
	border: 1rpx solid rgba(184, 129, 43, 0.12);
}

.episode-item-active,
.episode-picker-item-active {
	background: linear-gradient(135deg, #B8812B, #E1B55D);
}

.episode-item-active .episode-number,
.episode-number.active,
.episode-picker-item-active .episode-picker-number {
	color: #FFFFFF;
}

.recommend-cover,
.nearby-cover {
	border-radius: 26rpx;
	box-shadow: 0 10rpx 24rpx rgba(43, 57, 45, 0.11);
}

.nearby-item {
	padding: 14rpx;
	border-radius: 30rpx;
	background: rgba(255, 252, 244, 0.94);
	border: 1rpx solid rgba(184, 129, 43, 0.14);
	box-sizing: border-box;
}

.follow-btn:not(.followed) {
	background: linear-gradient(135deg, #B8812B, #E1B55D);
	border-color: transparent;
}

.follow-btn:not(.followed) .follow-text {
	color: #FFFFFF;
}

.drama-info-popup,
.episode-picker-popup {
	background: #FFFCF4;
	border: 1rpx solid rgba(184, 129, 43, 0.16);
}

.popup-header {
	border-bottom-color: rgba(184, 129, 43, 0.14);
}

.detail-tag {
	background: rgba(238, 245, 239, 0.92);
	border-color: rgba(184, 129, 43, 0.16);
	color: #244C41;
}
</style>
