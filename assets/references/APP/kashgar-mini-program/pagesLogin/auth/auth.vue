<template>
	<view class="auth-container">
		<!-- 背景装饰 -->
		<view class="bg-decoration">
			<image class="bg-image" :src="UrlImg + '/baidu_map/weatch/images/back.png'" mode="aspectFill"></image>
		</view>

		<!-- Logo 和标题 -->
		<view class="auth-header">
			<image class="logo" :src="UrlImg + '/themes/simpleboot3/public/assets/images/foot/logo.png'" mode="aspectFit"></image>
			<text class="app-name">星河寻境</text>
			<text class="welcome-text">欢迎来到星河寻境</text>
		</view>

		<!-- 授权按钮 -->
		<view class="auth-content">
			<view class="auth-tips">
				<text class="tips-text">为了给您提供更好的服务</text>
				<text class="tips-text">需要获取您的微信授权</text>
			</view>

			<!-- 微信授权登录按钮 -->
			<button class="auth-btn" @click="handleWxAuth" :loading="isLoading">
				<image class="wx-icon" :src="'/static/images/login/share_icon_wx.png'" mode="aspectFit"></image>
				<text class="btn-text">{{ isLoading ? '授权中...' : '微信授权登录' }}</text>
			</button>
		</view>

		<!-- 协议 -->
		<view class="protocol">
			<view class="protocol-check">
				<checkbox-group @change="protocolChange">
					<label class="protocol-label">
						<checkbox :checked="protocolChecked" color="#3cc51f" />
						<text class="protocol-text">我已阅读并同意</text>
					</label>
				</checkbox-group>
				<text class="protocol-link" @click="goToProtocol(1)">《用户协议》</text>
				<text class="protocol-text">和</text>
				<text class="protocol-link" @click="goToProtocol(2)">《隐私政策》</text>
			</view>
		</view>
	</view>
</template>

<script>
import request from '@/request/request.js'
import config from '@/request/config.js'
import global from '@/request/global.js'

export default {
	data() {
		return {
			UrlImg: config.UrlImg,
			isLoading: false,
			protocolChecked: false
		}
	},
	onLoad() {
		console.log('授权页面加载')
	},
	methods: {
		// 协议勾选变化
		protocolChange(e) {
			this.protocolChecked = e.detail.value.length > 0
		},

		// 微信授权登录
		async handleWxAuth() {
			if (!this.protocolChecked) {
				uni.showToast({
					icon: 'none',
					title: '请先阅读并同意用户协议和隐私政策',
					duration: 2000
				})
				return
			}

			this.isLoading = true
			const that = this
			const canUseWeixinOauth = await this.ensureWeixinOauthProvider()
			if (!canUseWeixinOauth) {
				this.isLoading = false
				return
			}

			// 调用微信登录
			uni.login({
				provider: 'weixin',
				onlyAuthorize: true,
				success: function(loginRes) {
					console.log('微信登录成功，code:', loginRes.code)
					that.wxLogin(loginRes.code)
				},
				fail: function(err) {
					console.error('微信登录失败:', err)
					that.isLoading = false
					uni.showToast({
						icon: 'none',
						title: '授权失败，请重试'
					})
				}
			})
		},

		ensureWeixinOauthProvider() {
			return new Promise((resolve) => {
				// #ifdef APP-PLUS
				if (!uni.getProvider) {
					uni.showToast({
						icon: 'none',
						title: '微信登录服务未配置'
					})
					resolve(false)
					return
				}
				uni.getProvider({
					service: 'oauth',
					success: (res) => {
						const providerIds = (res.provider || []).map((provider) => {
							if (typeof provider === 'string') return provider
							return provider.id || provider.provider || provider.service || ''
						})
						if (providerIds.includes('weixin')) {
							resolve(true)
							return
						}
						uni.showToast({
							icon: 'none',
							title: '当前 APP 包未配置微信登录'
						})
						resolve(false)
					},
					fail: () => {
						uni.showToast({
							icon: 'none',
							title: '微信登录服务未配置'
						})
						resolve(false)
					}
				})
				// #endif
				// #ifndef APP-PLUS
				resolve(true)
				// #endif
			})
		},

		// 调用后端接口进行微信登录
		// 标准微信小程序登录流程：
		// 1. 前端调用 uni.login() 获取临时登录凭证 code（5分钟有效）
		// 2. 前端把 code 发送给后端 api2/user/get_user
		// 3. 后端用 code + appid + secret 调用微信接口换取 openid 和 session_key
		// 4. 后端生成自定义 token 返回给前端
		// 5. 前端缓存 token，后续请求带上 token
		async wxLogin(code) {
			try {
				console.log('发送 code 到后端:', code)

				let params = {
					code: code  // 微信临时登录凭证
				}

				// 调用后端接口 api2/user/get_user，后端会用 code 换取 openid 并生成 token
				let res = await request('api2/user/get_user', params, 'GET', false)

				console.log('后端返回结果:', res)

				if (res.code == 0 || res.code == '0') {
					// 保存后端返回的用户信息到本地缓存
					uni.setStorageSync('userModel', res.data)

					const token = this.getLoginToken(res)
					if (token) {
						uni.setStorageSync('token', token)
					}

					// 保存用户ID到本地缓存，方便其他地方使用（兼容后端多种返回结构）
					const resolvedUserId = (res.data.member && (res.data.member.id || res.data.member.user_id)) ||
						res.data.user_id ||
						res.data.id ||
						''
					if (resolvedUserId) {
						uni.setStorageSync('userId', resolvedUserId)
						console.log('用户ID已保存:', resolvedUserId)
					} else {
						console.warn('后端未返回 userId，res.data 结构:', res.data)
					}

					// 保存openid到本地缓存（兼容后端多种返回结构）
					const openidData = res.data.openid
					const resolvedOpenid = (openidData && typeof openidData === 'object' ? openidData.openid : openidData) ||
						(res.data.member && (res.data.member.openid || res.data.member.wxopen_id)) ||
						res.data.wxopen_id ||
						''
					if (resolvedOpenid) {
						uni.setStorageSync('openid', resolvedOpenid)
						console.log('openid已保存:', resolvedOpenid)
					} else {
						console.warn('后端未返回 openid，res.data 结构:', res.data)
					}

					// 保存个人信息
					if (res.data.member) {
						uni.setStorageSync('userInfo', res.data.member)
						console.log('个人信息已保存:', res.data.member)
					}

					global.globalLoginOK = false

					console.log('登录成功，用户信息已保存')

					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})

					// 延迟跳转到首页
					setTimeout(() => {
						uni.reLaunch({
							url: '/pages/index/index'
						})
					}, 1000)
				} else {
					console.error('登录失败:', res.message)
					uni.showToast({
						icon: 'none',
						title: res.message || '登录失败'
					})
				}
			} catch (error) {
				console.error('登录接口调用失败:', error)
				uni.showToast({
					icon: 'none',
					title: '登录失败，请重试'
				})
			} finally {
				this.isLoading = false
			}
		},

		getLoginToken(res) {
			const data = res && res.data ? res.data : {}
			return data.token ||
				data.access_token ||
				data.user_token ||
				data.authorization ||
				(data.member && data.member.token) ||
				res.token ||
				res.access_token ||
				''
		},

		// 跳转到协议页面
		goToProtocol(type) {
			if (type === 1) {
				uni.navigateTo({
					url: '/pagesInfo/aboutus/protocol'
				})
			} else {
				uni.navigateTo({
					url: '/pagesInfo/aboutus/policy'
				})
			}
		}
	}
}
</script>

<style scoped>
.auth-container {
	position: relative;
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	background: linear-gradient(180deg, #F5F1EE 0%, #FFFFFF 100%);
	overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 400rpx;
	z-index: 0;
}

.bg-image {
	width: 100%;
	height: 100%;
	opacity: 0.3;
}

/* 头部 Logo 区域 */
.auth-header {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: 200rpx;
}

.logo {
	width: 180rpx;
	height: 180rpx;
	border-radius: 40rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.app-name {
	font-size: 48rpx;
	font-weight: bold;
	color: #333333;
	margin-top: 40rpx;
}

.welcome-text {
	font-size: 28rpx;
	color: #999999;
	margin-top: 20rpx;
}

/* 授权内容区域 */
.auth-content {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: 120rpx;
	width: 100%;
	padding: 0 60rpx;
}

.auth-tips {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 60rpx;
}

.tips-text {
	font-size: 28rpx;
	color: #666666;
	line-height: 48rpx;
}

/* 授权按钮 */
.auth-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 96rpx;
	background: linear-gradient(135deg, #07C160 0%, #06AE56 100%);
	border-radius: 48rpx;
	box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.3);
	border: none;
}

.auth-btn::after {
	border: none;
}

.wx-icon {
	width: 40rpx;
	height: 40rpx;
	margin-right: 16rpx;
}

.btn-text {
	font-size: 32rpx;
	font-weight: 500;
	color: #FFFFFF;
}

/* 协议区域 */
.protocol {
	position: absolute;
	bottom: 60rpx;
	left: 0;
	right: 0;
	z-index: 1;
	padding: 0 60rpx;
}

.protocol-check {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
}

.protocol-label {
	display: flex;
	align-items: center;
}

.protocol-text {
	font-size: 24rpx;
	color: #999999;
	margin: 0 4rpx;
}

.protocol-link {
	font-size: 24rpx;
	color: #3cc51f;
	text-decoration: underline;
	margin: 0 4rpx;
}

.auth-container {
	background: linear-gradient(180deg, #F8F1E4 0%, #F2E8D7 50%, #EEF5EF 100%);
}

.bg-decoration {
	height: 520rpx;
	border-bottom-left-radius: 52rpx;
	border-bottom-right-radius: 52rpx;
	overflow: hidden;
}

.bg-image {
	opacity: 0.22;
}

.auth-header {
	margin-top: 180rpx;
	padding: 0 48rpx;
}

.logo {
	width: 164rpx;
	height: 164rpx;
	border-radius: 36rpx;
	border: 2rpx solid rgba(184, 129, 43, 0.26);
	box-shadow: 0 14rpx 32rpx rgba(43, 57, 45, 0.16);
}

.app-name {
	color: #183B34;
	font-weight: 800;
}

.welcome-text,
.tips-text,
.protocol-text {
	color: #6C766D;
}

.auth-content {
	width: calc(100% - 48rpx);
	margin-top: 96rpx;
	padding: 42rpx 36rpx;
	border-radius: 34rpx;
	background: rgba(255, 252, 244, 0.92);
	border: 1rpx solid rgba(184, 129, 43, 0.16);
	box-shadow: 0 14rpx 36rpx rgba(43, 57, 45, 0.1);
	box-sizing: border-box;
}

.auth-btn {
	background: linear-gradient(135deg, #244C41 0%, #367063 100%);
	box-shadow: 0 12rpx 24rpx rgba(36, 76, 65, 0.24);
}

.protocol-link {
	color: #B8812B;
}
</style>
