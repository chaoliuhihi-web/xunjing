<template>
	<view class="container">
		<custom-nav
			v-if="UrlImg"
			title="用户协议"
			:left-icon="UrlImg + '/baidu_map/weatch/images/backbtn1.png'"
			left-icon-size="20px"
			background-color="#FFFFFF"
			@leftClick="backClick"
		/>
		<view class="new_con" style="width: 100%;" v-html="content"></view>
	</view>
</template>

<script>
	import request from '../../request/request.js'
  import config from '@/request/config.js'
	export default {
		data() {
			return {
        UrlImg: config.UrlImg,
				content: '',
			}
		},
		onLoad(options) {
			this.loadDetail()
		},
		methods: {
			formatHtml(html) {
				return "<div style='margin:15px;'>" +
					html + "</div>"
			},
			backClick() {
				uni.reLaunch({
					url: '/pagesLogin/auth/auth'
				})
			},
			async loadDetail() {
				let res = await request('api/login/about', {type: '28'}, 'GET')
				if (res.code == '0') {
					let resdata = res.data
					let content = resdata.detail;
					const regex = new RegExp('<img src', 'gi')
					content = content.replace(regex, `<img style="max-width: 100%; height: auto" src`);
					if(resdata.img_url){
						const regex2 = new RegExp('<video', 'gi')
						content = content.replace(regex2, `<video style="max-width: calc(100% - 15px);height: 230px;" poster=${resdata.img_url}`);
					}
					this.content = this.formatHtml(content)
				}
			}
		}
	}
</script>

<style>
	page {
		background-color: #ffffff;
	}
</style>

<style lang="scss" scoped>
	.detail_s {
		position: absolute;
		height: 100rpx;
		display: flex;
		align-items: center;
		right: 20rpx;
		z-index: 1;

		image {
			width: 50rpx;
			height: 50rpx;
		}
	}

	.detail_ss {
		position: absolute;
		height: 100rpx;
		display: flex;
		align-items: center;
		right: 100rpx;
		z-index: 1;

		image {
			padding-top: 5rpx;
			width: 35rpx;
			height: 35rpx;
		}
	}

	.container {
		width: 100%;
	}

	.new_con {
		// width: 690rpx;
		margin: 0 auto;
		padding: 50rpx 0;
		padding-top: 0;
		margin-top: 180rpx;
		// background: #ffffff;
		// text-align: center;
	}
	.course_nav {
		position: relative;
		//padding-top: 60rpx;
		// margin-top: 60rpx;
		width: 100%;
		height: 100rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;

		.nav_title {
			font-size: 36rpx;
			// color: #ffffff;
		}

		.love_btn {
			width: 80rpx;
			height: 80rpx;
			display: flex;
			justify-content: center;
			align-items: center;
			position: absolute;
			z-index: 1;
			right: 20rpx;
			top: 5rpx;

			image {
				width: 42rpx;
				height: 35rpx;
			}
		}
	}
	.back_btn {
		position: absolute;
		z-index: 100;
		left: 20rpx;
		width: 80rpx;
		height: 100rpx;
		display: flex;
		justify-content: center;
		align-items: center;

		image {
			width: 20rpx;
			height: 35rpx;
		}
	}

	.container {
		min-height: 100vh;
		background: linear-gradient(180deg, #F8F1E4 0%, #F2E8D7 46%, #EEF5EF 100%);
	}

	.course_nav {
		background: rgba(255, 252, 244, 0.88);
		box-shadow: 0 8rpx 26rpx rgba(43, 57, 45, 0.08);

		.nav_title {
			color: #183B34;
			font-weight: 800;
		}
	}

	.new_con {
		box-sizing: border-box;
		margin: 130rpx 32rpx 80rpx;
		padding: 36rpx 28rpx;
		background: rgba(255, 252, 244, 0.94);
		border: 1rpx solid rgba(184, 129, 43, 0.16);
		border-radius: 30rpx;
		box-shadow: 0 14rpx 36rpx rgba(43, 57, 45, 0.09);
		color: #4F6259;
	}
</style>
