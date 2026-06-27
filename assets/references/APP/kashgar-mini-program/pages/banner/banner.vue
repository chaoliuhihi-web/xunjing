<template>
	<view class="container">
		<!-- 自定义导航栏 -->
		<custom-nav
			title="详情"
			:show-back="false"
			@navHeight="handleNavHeight"
			:left-icon="UrlImg + '/baidu_map/weatch/images/left.png'"
			@leftClick="goBack"
		/>

		<view class="content" :style="{ paddingTop: navHeight + 'px' }">
			<view class="banner-detail" v-if="bannerInfo">
				<image v-if="bannerInfo.img_url" :src="bannerInfo.img_url" class="banner-image" mode="aspectFill"></image>
				<view class="banner-info">
					<text class="banner-title">{{ bannerInfo.title || '' }}</text>
					<rich-text class="banner-content" :nodes="formatBannerDetail(bannerInfo.detail)"></rich-text>
				</view>
			</view>
			<view class="loading" v-else>
				<text>加载中...</text>
			</view>
		</view>
	</view>
</template>

<script>
import request from '@/request/request.js'
import config from '@/request/config.js'
import CustomNav from '@/components/custom-nav/custom-nav.vue'

export default {
	components: {
		CustomNav
	},
	data() {
		return {
			id: '',
			UrlImg: config.UrlImg,
			navHeight: 80,
			bannerInfo: null
		}
	},
	onLoad(options) {
		this.id = options.id || ''
		// 调用接口获取banner详情
		if (this.id) {
			this.getBannerDetail()
		}
	},
	methods: {
		// 处理导航栏高度
		handleNavHeight(height) {
			this.navHeight = height
		},

		goBack() {
			uni.navigateBack()
		},

		formatBannerDetail(detail = '') {
			const html = String(detail || '')
			if (!html) return ''
			const imageStyle = 'max-width:100%;width:100%;height:auto;display:block;margin:24rpx auto;box-sizing:border-box;'
			return html
				.replace(/<img\b([^>]*)>/gi, (match, attrs = '') => {
					const cleanAttrs = String(attrs).replace(/\sstyle=(["'])(.*?)\1/gi, '')
					return `<img${cleanAttrs} style="${imageStyle}">`
				})
				.replace(/<p\b([^>]*)>/gi, '<p$1 style="margin:0 0 24rpx;line-height:1.7;">')
		},

		// 获取banner详情
		async getBannerDetail() {
			try {
				let params = {
					id: this.id
				}
				let res = await request('api2/Drama/banner_detail', params, 'GET')
				console.log('Banner详情接口返回:', res)

				if (res.code == 0 && res.data) {
					this.bannerInfo = res.data
				} else {
					uni.showToast({
						title: res.message || '获取详情失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('获取Banner详情失败:', error)
				uni.showToast({
					title: '网络请求失败',
					icon: 'none'
				})
			}
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
}

.content {
	padding: 20rpx;
}

.banner-detail {
	background-color: #ffffff;
	border-radius: 16rpx;
	overflow: hidden;
}

.banner-image {
	width: 100%;
	height: 400rpx;
}

.banner-info {
	padding: 30rpx;
	box-sizing: border-box;
	overflow-x: hidden;
}

.banner-title {
	display: block;
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.banner-content {
	display: block;
	width: 100%;
	max-width: 100%;
	font-size: 28rpx;
	color: #666;
	line-height: 1.6;
	overflow-wrap: break-word;
	word-break: break-word;
	box-sizing: border-box;
}

.loading {
	text-align: center;
	padding: 100rpx 0;
	color: #999;
}

.container {
	background: linear-gradient(180deg, #F8F1E4 0%, #F2E8D7 46%, #EEF5EF 100%);
}

.content {
	padding: 24rpx;
}

.banner-detail {
	border-radius: 30rpx;
	background: rgba(255, 252, 244, 0.94);
	border: 1rpx solid rgba(184, 129, 43, 0.16);
	box-shadow: 0 14rpx 36rpx rgba(43, 57, 45, 0.1);
}

.banner-image {
	height: 430rpx;
	border-radius: 28rpx 28rpx 0 0;
}

.banner-title {
	color: #183B34;
	font-weight: 800;
}

.banner-content {
	color: #4F6259;
	line-height: 1.8;
}

.loading {
	color: #6C766D;
}
</style>
