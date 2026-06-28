<template>
  <view v-if="useKashgarTravelGuide" class="kashgar-travel-guide">
		<view class="kashgar-guide-nav">
			<button class="kashgar-guide-back" hover-class="kashgar-guide-back--hover" @click="goBack">
				<text>‹</text>
			</button>
			<text class="kashgar-guide-title">喀什旅行指南</text>
			<view class="kashgar-guide-capsule">
				<text class="kashgar-guide-dot">•••</text>
				<view class="kashgar-guide-capsule-line"></view>
				<text class="kashgar-guide-ring">◎</text>
			</view>
		</view>

		<view class="kashgar-guide-location">
			<text class="kashgar-guide-location-pin">⌾</text>
			<text>喀什市</text>
		</view>

		<scroll-view class="kashgar-guide-scroll" scroll-y>
			<button
				v-for="item in kashgarGuideList"
				:key="item.id"
				class="kashgar-guide-card"
				hover-class="kashgar-guide-card--hover"
				@click="mapdetail(item)"
			>
				<image class="kashgar-guide-cover" :src="item.img_url" mode="aspectFill"></image>
				<view class="kashgar-guide-copy">
					<view class="kashgar-guide-card-head">
						<text class="kashgar-guide-card-title">{{ item.title }}</text>
						<text class="kashgar-guide-rating">{{ item.rating }}</text>
					</view>
					<view class="kashgar-guide-address">
						<text class="kashgar-guide-small-pin">⌾</text>
						<text>{{ item.addr }}</text>
					</view>
					<text class="kashgar-guide-desc">{{ item.desc }}</text>
					<view class="kashgar-guide-hours">
						<text class="kashgar-guide-clock">◷</text>
						<text>开放时间 {{ item.business_hours }}</text>
					</view>
				</view>
			</button>
		</scroll-view>

		<view class="kashgar-guide-actions">
			<button
				v-for="action in kashgarGuideActions"
				:key="action.label"
				class="kashgar-guide-action"
				hover-class="kashgar-guide-action--hover"
				@click="handleKashgarGuideAction(action)"
			>
				<text class="kashgar-guide-action-icon">{{ action.icon }}</text>
				<text>{{ action.label }}</text>
				<text class="kashgar-guide-action-arrow">›</text>
			</button>
		</view>

		<tab-bar :current="1" />
  </view>

  <view v-else class="legacy-masters-page">
		<!-- 自定义导航栏 - 透明背景 -->
		<custom-nav
			title="剧好玩文旅地图"
			:left-icon="UrlImg + '/baidu_map/weatch/images/left4.png'"
			background-color="#ffffff"
			@leftClick="goBack"
		/>
        <view class="content">
			<scroll-view
				class="control_list_con3list"
				scroll-y
				:refresher-enabled="true"
				:refresher-triggered="isRefreshing"
				refresher-default-style="black"
				refresher-background="transparent"
				@refresherrefresh="handleRefresh"
				@scrolltolower="handleReachBottom"
			>
				<view class="control_list_item" v-for="(item,index) in markerArr" :key="index" @click="mapdetail(item)">
					<view class="control_list_item_l">
						<image class="control-list-cover" :src="item.img_url" mode="aspectFill"></image>
						<view class="control_list_item_lcon">
							<view class="control_list_item_l_name">
								<view class="control_list_item_l_name_text">{{item.title}}</view>
							</view>
							<view class="control_list_item_l_pa">{{item.addr}}</view>
							<view class="control_list_item_l_create" v-if="item.business_hours">营业时间：{{item.business_hours}}</view>
						</view>
					</view>
				</view>
			</scroll-view>
        </view>
  </view>
</template>

<script>
import CustomNav from '@/components/custom-nav/custom-nav.vue'
import TabBar from '@/components/tab-bar/tab-bar.vue'
import config from '@/request/config.js'
import request from '@/request/request.js'

const KASHGAR_TRAVEL_GUIDE_LOCAL_CONTENT_ENABLED = true

export default{
    components: {
		CustomNav,
		TabBar
	},
	data() {
		return {
			useKashgarTravelGuide: KASHGAR_TRAVEL_GUIDE_LOCAL_CONTENT_ENABLED,
			UrlImg: config.UrlImg,
			dramaId: '',
			queryParams: {
			  page: 1,
			  page_size: 1000,
			  userId: 1,
			  classId: ''
			},
			markerArr: [],
			dramaTitle: '',
			isRefreshing: false,
			kashgarGuideActions: [
				{ label: '交通指南', icon: '车', action: 'traffic' },
				{ label: '必吃美食', icon: '碗', action: 'food', type: '80' },
				{ label: '推荐路线', icon: '旗', action: 'route' },
				{ label: '旅行贴士', icon: '记', action: 'tips' }
			],
			kashgarGuideList: [
				{
					id: 111,
					type: '81',
					title: '喀什古城',
					rating: '5A',
					addr: '喀什市解放北路',
					business_hours: '10:00–22:00',
					desc: '国家5A级景区，千年古城活化石，维吾尔族传统生活的生动写照。',
					img_url: '/static/kashgar/guide-old-city.png'
				},
				{
					id: 112,
					type: '81',
					title: '香妃园',
					rating: '4A',
					addr: '喀什市东郊路',
					business_hours: '09:30–19:30',
					desc: '香妃的故乡，典雅的维吾尔园林，感受动人传奇与文化魅力。',
					img_url: '/static/kashgar/guide-xiangfei.png'
				},
				{
					id: 113,
					type: '81',
					title: '艾提尕尔广场',
					rating: '',
					addr: '喀什市艾提尕尔路',
					business_hours: '全天开放',
					desc: '喀什的心脏，清真寺与广场交相辉映，感受浓厚的宗教氛围与市井气息。',
					img_url: '/static/kashgar/guide-aitigar.png'
				},
				{
					id: 114,
					type: '81',
					title: '高台民居',
					rating: '4A',
					addr: '喀什市吐曼路',
					business_hours: '10:00–20:00',
					desc: '维吾尔传统民居的典范，建于黄土高台之上，历史悠久，风貌独特。',
					img_url: '/static/kashgar/guide-gaotai.png'
				},
				{
					id: 115,
					type: '80',
					title: '喀什大巴扎',
					rating: '4A',
					addr: '喀什市解放北路',
					business_hours: '10:30–22:30',
					desc: '中亚风情的国际大巴扎，集购物、美食、文化体验于一体的热闹集市。',
					img_url: '/static/kashgar/guide-bazaar.png'
				}
			]
		}
	},
	onLoad(options) {
		// 接收传递过来的参数
		if (options.type) {
			this.queryParams.classId = options.type
		}
		if (this.useKashgarTravelGuide) {
			return
		}
		if (options.type) {
			this.fetchData()
		}
	},
	// 上拉加载 生命周期函数
	async onReachBottom() {
		this.handleReachBottom()
	},
	async onPullDownRefresh() {
		await this.handleRefresh()
		uni.stopPullDownRefresh()
	},
	methods: {
		async handleReachBottom() {
			uni.showLoading({
				title: '正在加载中...'
			})
			try {
				if (this.markerArr.length < this.queryParams.page_size) {
					uni.showToast({
						title: '没有更多数据了'
					})
					return false
				}
				this.queryParams.page_size += 10
				await this.fetchData()
			} finally {
				uni.hideLoading()
			}
		},
		async handleRefresh() {
			if (this.isRefreshing) return
			this.isRefreshing = true
			try {
				await this.fetchData()
			} finally {
				this.isRefreshing = false
			}
		},
		async fetchData(){
			let res = await request('api2/Map/lst', this.queryParams, 'GET')
			if (res.code == '0') {
				this.markerArr = res.data
			}
		},
		mapdetail(item){
			const type = item.type || this.queryParams.classId
			uni.navigateTo({
				url: '/subPackages/feature/map_two/detail?type=' + type + '&masters=' + item.id
			})
		},
		handleKashgarGuideAction(action) {
			if (action.action === 'food') {
				uni.navigateTo({
					url: '/subPackages/feature/map_two/masters?type=' + action.type
				})
				return
			}
			if (action.action === 'traffic') {
				uni.navigateTo({
					url: '/subPackages/feature/map/map?type=' + (this.queryParams.classId || '82')
				})
				return
			}
			uni.showToast({
				title: action.label,
				icon: 'none'
			})
		},
		// 返回上一页
		goBack() {
			const pages = getCurrentPages()
			if (pages.length <= 1) {
				uni.reLaunch({ url: '/pages/index/index' })
				return
			}
			uni.navigateBack()
		}
	}
}
</script>
<style lang="scss" scoped>
.container {
	position: relative;
	min-height: 100vh;
	height: 100vh;
	overflow: hidden;
	background-color: #ffffff;
}

.content {
	width: 100%;
	height: 100vh;
	padding-top: 187rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	background-image: url('https://www.neoxiake.com/baidu_map/weatch/images/2.png');
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
}

.control_list_con3list {
	margin-top: 0rpx;
	padding: 10rpx 0;
	width: 100%;
	height: auto;
	flex: 1;
	min-height: 0;
	box-sizing: border-box;
	overflow-y: scroll;
	z-index: 1;
	.control_list_item {
		min-height: 190rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 32rpx 60rpx;
		border-bottom: 1rpx solid #f0f0f0;
		background: #fff;
		border-radius: 20rpx;
		overflow: hidden;
		.control_list_item_l {
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			font-size: 32rpx;
			.control-list-cover {
				width: 200rpx;
				height: 180rpx;
				margin-right: 40rpx;
				border-top-left-radius: 20rpx;
				border-bottom-left-radius: 20rpx;
				flex-shrink: 0;
			}
			.control_list_item_lcon{
				flex: 1;
				min-width: 0;
				padding: 16rpx 20rpx 16rpx 0;
				box-sizing: border-box;
				.control_list_item_l_name{
					display: flex;
					align-items: center;
					.control_list_item_l_name_text{
						max-width: 100%;
						font-size: 32rpx;
						color: #170506;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
					}
				}
				.control_list_item_l_pa{
					line-height: 32rpx;
					max-height: 64rpx;
					font-size: 24rpx;
					color: #737373;
					margin: 8rpx 0 4rpx;
					overflow: hidden;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
				}
				.control_list_item_l_create{
					font-size: 24rpx;
					line-height: 32rpx;
					color: #737373;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}
			}
		}
	}
}

.container {
	background: linear-gradient(180deg, #F8F1E4 0%, #F2E8D7 46%, #EEF5EF 100%);
}

.content {
	background-image: none;
	background: linear-gradient(180deg, #F8F1E4 0%, #F2E8D7 46%, #EEF5EF 100%);
	padding-left: 24rpx;
	padding-right: 24rpx;
}

.control_list_con3list .control_list_item {
	margin: 24rpx 0;
	border: 1rpx solid rgba(184, 129, 43, 0.14);
	border-radius: 28rpx;
	background: rgba(255, 252, 244, 0.96);
	box-shadow: 0 12rpx 28rpx rgba(43, 57, 45, 0.09);
}

.control_list_con3list .control_list_item .control_list_item_l .control-list-cover {
	border-radius: 24rpx;
	margin-left: 14rpx;
	margin-right: 24rpx;
}

.control_list_item_l_name_text {
	color: #183B34 !important;
	font-weight: 800;
}

.kashgar-travel-guide {
	position: relative;
	width: 100vw;
	height: 100vh;
	overflow: hidden;
	background:
		radial-gradient(circle at 50% -6%, rgba(238, 205, 146, 0.22), rgba(238, 205, 146, 0) 36%),
		linear-gradient(180deg, #FFF9EE 0%, #F8F0E3 48%, #F7F9F4 100%);
	color: #382616;
	font-family: "PingFang SC", "Songti SC", sans-serif;
}

.kashgar-guide-nav {
	position: relative;
	z-index: 5;
	height: 102rpx;
	padding: 34rpx 28rpx 0;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.kashgar-guide-back,
.kashgar-guide-capsule,
.kashgar-guide-card,
.kashgar-guide-action {
	border: 0;
	margin: 0;
	padding: 0;
	background: transparent;
	line-height: 1;
}

.kashgar-guide-back::after,
.kashgar-guide-card::after,
.kashgar-guide-action::after {
	border: 0;
}

.kashgar-guide-back {
	width: 62rpx;
	height: 62rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #1E160F;
	font-size: 52rpx;
	font-family: "PingFang SC", sans-serif;
}

.kashgar-guide-back--hover {
	background: rgba(95, 66, 32, 0.08);
}

.kashgar-guide-title {
	position: absolute;
	left: 50%;
	top: 43rpx;
	transform: translateX(-50%);
	font-family: "Songti SC", "STSong", serif;
	font-size: 34rpx;
	line-height: 42rpx;
	font-weight: 900;
	color: #15100A;
	white-space: nowrap;
}

.kashgar-guide-capsule {
	width: 122rpx;
	height: 52rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.72);
	border: 1rpx solid rgba(99, 67, 30, 0.12);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 14rpx;
	color: #080808;
	font-size: 26rpx;
	font-family: "PingFang SC", sans-serif;
}

.kashgar-guide-capsule-line {
	width: 1rpx;
	height: 30rpx;
	background: rgba(54, 42, 29, 0.16);
}

.kashgar-guide-ring {
	font-size: 36rpx;
	font-weight: 800;
	line-height: 36rpx;
}

.kashgar-guide-location {
	position: relative;
	z-index: 4;
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 0 40rpx 16rpx;
	color: #6C543B;
	font-size: 22rpx;
}

.kashgar-guide-location-pin {
	font-size: 25rpx;
	color: #9A6A2E;
}

.kashgar-guide-scroll {
	position: relative;
	z-index: 2;
	height: calc(100vh - 210rpx);
	padding: 0 26rpx 250rpx;
	box-sizing: border-box;
}

.kashgar-guide-card {
	width: 100%;
	min-height: 198rpx;
	margin: 0 0 14rpx;
	padding: 10rpx;
	box-sizing: border-box;
	border-radius: 18rpx;
	background: rgba(255, 253, 248, 0.94);
	box-shadow: 0 8rpx 24rpx rgba(104, 74, 36, 0.12);
	display: flex;
	align-items: stretch;
	text-align: left;
}

.kashgar-guide-card--hover {
	transform: translateY(-2rpx);
}

.kashgar-guide-cover {
	width: 300rpx;
	height: 176rpx;
	border-radius: 14rpx;
	flex: 0 0 auto;
	background: #D8B27A;
}

.kashgar-guide-copy {
	flex: 1;
	min-width: 0;
	padding: 4rpx 4rpx 4rpx 24rpx;
	display: flex;
	flex-direction: column;
}

.kashgar-guide-card-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
}

.kashgar-guide-card-title {
	font-family: "Songti SC", "STSong", serif;
	font-size: 29rpx;
	line-height: 34rpx;
	font-weight: 900;
	color: #2A170B;
	white-space: nowrap;
}

.kashgar-guide-rating {
	min-width: 46rpx;
	height: 32rpx;
	padding: 0 10rpx;
	border-radius: 999rpx;
	background: #F2D7B3;
	color: #B47B35;
	font-size: 20rpx;
	line-height: 32rpx;
	font-weight: 800;
	text-align: center;
	white-space: nowrap;
}

.kashgar-guide-rating:empty {
	display: none;
}

.kashgar-guide-address,
.kashgar-guide-hours {
	display: flex;
	align-items: center;
	gap: 8rpx;
	color: #7D664C;
	font-size: 19rpx;
	line-height: 24rpx;
	white-space: nowrap;
}

.kashgar-guide-address {
	margin-top: 5rpx;
}

.kashgar-guide-small-pin,
.kashgar-guide-clock {
	color: #A07032;
	font-size: 19rpx;
}

.kashgar-guide-desc {
	margin-top: 8rpx;
	color: #5F4D3B;
	font-size: 21rpx;
	line-height: 29rpx;
	height: 58rpx;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.kashgar-guide-hours {
	margin-top: auto;
	padding-top: 7rpx;
	border-top: 1rpx solid rgba(119, 93, 59, 0.12);
}

.kashgar-guide-actions {
	position: absolute;
	left: 22rpx;
	right: 22rpx;
	bottom: 160rpx;
	z-index: 8;
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 10rpx;
	padding: 12rpx 6rpx 6rpx;
	background: linear-gradient(180deg, rgba(248, 249, 244, 0), rgba(248, 249, 244, 0.94) 28%, rgba(248, 249, 244, 0.98) 100%);
}

.kashgar-guide-action {
	height: 50rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.94);
	border: 1rpx solid rgba(170, 121, 57, 0.18);
	box-shadow: 0 5rpx 14rpx rgba(95, 66, 32, 0.08);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6rpx;
	color: #8A6233;
	font-size: 19rpx;
	font-weight: 700;
	white-space: nowrap;
}

.kashgar-guide-action--hover {
	background: #FFF4DF;
}

.kashgar-guide-action-icon {
	font-size: 18rpx;
	color: #B7823A;
}

.kashgar-guide-action-arrow {
	font-size: 22rpx;
	color: #C19963;
}

</style>
