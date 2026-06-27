<template>
  <view class="container">
		<!-- 自定义导航栏 - 透明背景 -->
		<custom-nav
			title="剧好玩文旅地图"
			background-color="#ffffff"
		/>
        <view class="content">
			<view class="nav-search-area">
				<view class="search-box">
					<view class="search-box_an1">
						<image :src="UrlImg + '/baidu_map/weatch/images/backbtn1.png'" class="nav_img1" mode="aspectFit" @click="goBack"></image>
						<view class="nav_cls1"></view>
					</view>
					<input type="text" placeholder="搜索目的地/景点/活动" class="search-input" @confirm="confirmnameg">
					<view class="search-box_an">
						<image :src="UrlImg + '/baidu_map/weatch/images/icon2.png'" class="nav_img2" mode="aspectFit"></image>
					</view>
				</view>
			</view>
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
				<view class="orderForm_img" v-if="!isLoading && markerArr.length == 0">
					<image :src="UrlImg + '/baidu_map/weatch/images/emptys.png'" mode=""></image>
					<view class="">
						暂无数据
					</view>
				</view>
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
				<view style="width: 100%;height: 80rpx;"></view>
			</scroll-view>
        </view>
  </view>
</template>

<script>
import CustomNav from '@/components/custom-nav/custom-nav.vue'
import config from '@/request/config.js'
import request from '@/request/request.js'
export default{
    components: {
		CustomNav
	},
	data() {
		return {
			UrlImg: config.UrlImg,
			dramaId: '',
			queryParams: {
			  page: 1,
			  page_size: 1000,
			  userId: 1,
			  title: '',
			  classId: ''
			},
			markerArr: [],
			dramaTitle: '',
			isRefreshing: false,
			isLoading: false
		}
	},
	onLoad(options) {
		if (options.type) {
			this.queryParams.classId = options.type
		}
		this.fetchData()
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
			this.isLoading = true
			try {
				let res = await request('api2/Map/lst', this.queryParams, 'GET')
				console.log(res)
				if (res.code == '0') {
					this.markerArr = Array.isArray(res.data) ? res.data : []
				}
			} catch (error) {
				console.error('地图搜索列表加载失败:', error)
			} finally {
				this.isLoading = false
			}
		},
		confirmnameg(e) {
			let keyword = e.detail.value ? String(e.detail.value).trim() : ''
			this.queryParams.page = 1
			this.queryParams.page_size = 1000
			this.queryParams.title = keyword
			this.fetchData()
		},
		mapdetail(item){
			const type = item.class_id || item.classId || this.queryParams.classId
			uni.navigateTo({
				url: '/subPackages/feature/map_two/detail?type=' + type + '&masters=' + item.id
			})
		},
		// 返回上一页
		goBack() {
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
	padding-top: 200rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	background-image: url('https://www.neoxiake.com/baidu_map/weatch/images/2.png');
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
}

/* 底部搜索区域 */
.nav-search-area {
	display: flex;
	gap: 10px;
	align-items: center;
	flex-shrink: 0;
	.search-box {
		flex: 1;
		display: flex;
		align-items: center;
		/* background-color: rgba(255, 255, 255, 0.9); */
		background: #a48f6e29;
		border-radius: 20px;
		padding: 8px 11px;
		gap: 8px;
		border: 1px solid #FFFFFF;

		.search-box_an1{
			display: flex;
			align-items: center;
			.nav_img1{
				width: 24px;
				height: 20px;
				margin-right: 5px;
			}
			.nav_cls1{
				width: 1rpx;
				height: 60rpx;
				border-right: 4rpx solid #C8A062;
			}
		}

		.search-box_an{
			padding: 10rpx;
			border: 1px solid #C8A062;
			border-radius: 50%;
			.nav_img2{
				width: 24px;
				height: 20px;
			}
		}

		.search-icon {
			font-size: 18px;
			color: #999;
		}

		.search-input {
			flex: 1;
			border: none;
			background: transparent;
			font-size: 16px;
			color: #A48F6E;
		}
	}
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
.orderForm_img {
	text-align: center;
	padding: 50rpx 0;

	image {
		width: 600rpx;
		height: 500rpx;
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

.nav-search-area {
	margin-bottom: 18rpx;
}

.nav-search-area .search-box {
	min-height: 86rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 244, 0.94);
	border: 1rpx solid rgba(184, 129, 43, 0.18);
	box-shadow: 0 12rpx 28rpx rgba(43, 57, 45, 0.1);
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
</style>
