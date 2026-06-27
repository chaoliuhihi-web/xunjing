<template>
	<view class="container">
		<view class="course_nav">
			<view class="back_btn" @click="backClick">
				<image :src="UrlImg + '/baidu_map/weatch/images/backbtn1.png'"></image>
			</view>
			<view></view>
			<view class="nav_title">关于我们</view>
			<view></view>
		</view>
		<view class="about-content-card">
			<rich-text class="new_con" :nodes="content"></rich-text>
		</view>
	</view>
</template>

<script>
	import request from '../../request/request.js'
  import config from '@/request/config.js'
	export default {
		data() {
			return {
        UrlImg: config.UrlImg,
				content: [],
			}
		},
		onLoad(options) {
			this.loadDetail()
		},
		methods: {
			backClick() {
				uni.reLaunch({
					url: '/subPackages/user/my/my'
				})
			},
			formatAboutContent(raw = '') {
				const text = String(raw)
					.replace(/<\/p>/gi, '\n')
					.replace(/<br\s*\/?\s*>/gi, '\n')
					.replace(/<[^>]+>/g, '')
					.replace(/&nbsp;/gi, ' ')
					.replace(/&amp;/gi, '&')
					.replace(/&lt;/gi, '<')
					.replace(/&gt;/gi, '>')
					.trim()
				const paragraphs = text
					.split(/\n+/)
					.map(item => item.trim())
					.filter(Boolean)

				return paragraphs.map((paragraph, index) => ({
					name: 'div',
					attrs: {
						style: index === 0
							? 'font-size: 40rpx; line-height: 1.5; font-weight: 700; color: #222; margin: 0 0 32rpx; text-align: center;'
							: 'font-size: 30rpx; line-height: 1.9; color: #333; margin: 0 0 28rpx; text-align: justify; text-indent: 2em; word-break: break-all;'
					},
					children: [{
						type: 'text',
						text: index === 0 ? paragraph : `　　${paragraph}`
					}]
				}))
			},
			async loadDetail() {
				const res = await request('api2/Drama/getAbout', {}, 'GET')
				if (res.code == '0' && res.data && res.data.content) {
					this.content = this.formatAboutContent(res.data.content)
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
		min-height: 100vh;
		box-sizing: border-box;
	}

	.about-content-card {
		box-sizing: border-box;
		margin: 24rpx 32rpx 80rpx;
		padding: 36rpx 28rpx;
		background-color: #ffffff;
		border-radius: 28rpx;
		box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.06);
		overflow: hidden;
	}

	.new_con {
		display: block;
		width: 100%;
		box-sizing: border-box;
		margin: 0;
	}
	.course_nav {
		position: relative;
		padding-top: var(--status-bar-height);
		width: 100%;
		height: calc(100rpx + var(--status-bar-height));
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

	.about-content-card {
		background: rgba(255, 252, 244, 0.94);
		border: 1rpx solid rgba(184, 129, 43, 0.16);
		border-radius: 30rpx;
		box-shadow: 0 14rpx 36rpx rgba(43, 57, 45, 0.09);
	}
</style>
