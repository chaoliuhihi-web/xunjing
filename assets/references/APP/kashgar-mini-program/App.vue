<script>
const AUTH_PAGE = '/pagesLogin/auth/auth'
const AUTH_ROUTE = 'pagesLogin/auth/auth'
const PUBLIC_ROUTES = [
	'pages/xicheng/home/home',
	'pages/xicheng/scan/scan',
	'pages/xicheng/scan-result/scan-result',
	'pages/xicheng/route-detail/route-detail',
	'pages/xicheng/travelogue/travelogue',
	'pages/xicheng/inspiration/inspiration',
	'pages/ai-guide/ai-guide',
	'pages/index/index',
	'pages/banner/banner',
	'pagesInfo/aboutus/aboutus',
	'pagesInfo/aboutus/protocol',
	'pagesInfo/aboutus/policy',
	'subPackages/feature/map/map',
	'subPackages/feature/map_two/map_two',
	'subPackages/feature/map_two/detail',
	'subPackages/feature/map_two/search',
	'subPackages/feature/map_two/masters',
	'subPackages/feature/HundredPlays/hunderplay',
	'subPackages/feature/shortPlay/shortplay',
	'subPackages/feature/shortPlays/shortPlays',
	'subPackages/feature/theater/theater',
	'subPackages/feature/theater/theaterDetail'
]

export default {
	onLaunch: function() {
		setTimeout(() => {
			this.checkLoginStatus()
		}, 0)
	},
	onShow: function() {
	},
	onHide: function() {
	},
	methods: {
		isPublicRoute(route) {
			return PUBLIC_ROUTES.includes(route)
		},
		getStoredUserId() {
			const userInfo = uni.getStorageSync('userInfo') || {}
			const userModel = uni.getStorageSync('userModel') || {}
			const userId = uni.getStorageSync('userId') || userInfo.id || userInfo.user_id || (userModel.member && userModel.member.id) || userModel.id || ''
			if (userId) {
				uni.setStorageSync('userId', userId)
			}
			return userId
		},
		getStoredOpenid() {
			const userInfo = uni.getStorageSync('userInfo') || {}
			const userModel = uni.getStorageSync('userModel') || {}
			const openid = uni.getStorageSync('openid') || userInfo.wxopen_id || userInfo.openid || (userModel.openid && userModel.openid.openid) || userModel.openid || ''
			if (openid) {
				uni.setStorageSync('openid', openid)
			}
			return openid
		},
		// 检查登录状态
		async checkLoginStatus() {
			const userInfo = uni.getStorageSync('userInfo')
			const userId = this.getStoredUserId()
			const openid = this.getStoredOpenid()
			const pages = getCurrentPages()
			const currentPage = pages[pages.length - 1]
			const currentRoute = currentPage ? currentPage.route : ''

			if (!currentRoute || this.isPublicRoute(currentRoute)) {
				return
			}

			// 如果当前已经在授权页，不需要跳转
			if (currentRoute.includes(AUTH_ROUTE)) {
				return
			}

			// 如果没有用户信息或userId或openid，跳转到授权页
			if (!userInfo || !userId || !openid) {
				uni.reLaunch({
					url: AUTH_PAGE
				})
				return
			}
		}
	}
}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import '@/uni_modules/uni-scss/index.scss';
	@import '@/styles/xicheng-theme.scss';
	/* #ifndef APP-NVUE */
	@import '@/static/customicons.css';
	// 设置整个项目的背景色
	page {
		background:
			linear-gradient(180deg, #F8F1E4 0%, #F2E8D7 42%, #EEF5EF 100%);
		color: #183B34;
		font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
	}

	.container,
	.auth-container {
		background:
			linear-gradient(180deg, #F8F1E4 0%, #F2E8D7 46%, #EEF5EF 100%) !important;
		color: #183B34;
	}

	.section,
	.banner-detail,
	.user-card,
	.menu-card,
	.stats-card,
	.about-content-card,
	.banner-card,
	.treasure-section,
	.drama-section,
	.episodes-section,
	.recommend-section,
	.nearby-section,
	.auth-content {
		background: rgba(255, 252, 244, 0.9);
		border: 1rpx solid rgba(184, 129, 43, 0.16);
		box-shadow: 0 14rpx 36rpx rgba(54, 68, 52, 0.08);
	}

	.section,
	.banner-detail,
	.about-content-card,
	.treasure-section,
	.drama-section,
	.episodes-section,
	.recommend-section,
	.nearby-section {
		border-radius: 28rpx;
	}

	.section-title,
	.nav-title,
	.drama-title,
	.video-title,
	.theater-title,
	.card-title,
	.recommend-title,
	.author-name,
	.stats-title,
	.menu-label,
	.info-title,
	.title-text {
		color: #183B34 !important;
		letter-spacing: 0;
	}

	.video-desc,
	.theater-desc,
	.meta-text,
	.recommend-subtitle,
	.drama-subtitle,
	.stats-desc,
	.card-sub,
	.control_list_item_l_pa,
	.control_list_item_l_create {
		color: #6C766D !important;
	}

	.video-card,
	.theater-card,
	.drama-card,
	.card-item,
	.video-item,
	.control_list_item,
	.recommend-item,
	.nearby-item,
	.episode-summary,
	.info-row,
	.menu-item {
		background: rgba(255, 252, 244, 0.96) !important;
		border: 1rpx solid rgba(184, 129, 43, 0.14);
		box-shadow: 0 12rpx 28rpx rgba(45, 56, 44, 0.08);
	}

	.video-card,
	.theater-card,
	.drama-card,
	.card-item,
	.control_list_item,
	.recommend-cover,
	.nearby-cover,
	.province-video,
	.banner-image,
	.cover-image,
	.card-cover,
	.theater-image,
	.video-image {
		border-radius: 22rpx;
		overflow: hidden;
	}

	.video-badge,
	.drama-badge,
	.episode-count,
	.location-tag,
	.tag-btn,
	.action-btn,
	.selected-place-action,
	.auth-btn,
	.page-btn,
	.tab-line {
		background: linear-gradient(135deg, #B8812B 0%, #E3B65D 100%) !important;
		color: #FFFFFF !important;
		border-color: rgba(184, 129, 43, 0.34) !important;
	}

	.search-box,
	.message-input,
	.upload-btn,
	.episode-item,
	.episode-picker-item,
	.follow-up-item,
	.selected-place-row,
	.voice-ask-box,
	.bottom-bar,
	.nav-bar,
	.tabs,
	.input-area {
		background: rgba(255, 252, 244, 0.94) !important;
		border-color: rgba(184, 129, 43, 0.16) !important;
		box-shadow: 0 10rpx 26rpx rgba(45, 56, 44, 0.08);
	}

	/* 微信小程序特殊处理 */
	/* #ifdef MP-WEIXIN */
	/* #endif */

	/* #endif */
	.example-info {
		font-size: 14px;
		color: #333;
		padding: 10px;
	}
</style>
