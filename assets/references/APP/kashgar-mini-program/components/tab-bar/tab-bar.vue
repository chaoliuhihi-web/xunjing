<template>
	<view class="tab-bar-wrapper">
		<view class="tab-bar">
			<!-- 跟着游记 -->
			<navigator class="tab-item" url="/pages/index/index" open-type="reLaunch" hover-class="tab-item-active">
				<image :src="selected === 0 ? tabIcons.xiakeActive : tabIcons.xiake" mode="aspectFit" class="tab-icon"></image>
				<text :class="['tab-text', selected === 0 ? 'active-text' : '']">跟着游记</text>
			</navigator>

			<!-- AI旅伴 -->
			<navigator class="center-btn-wrapper" url="/pages/ai-guide/ai-guide" open-type="reLaunch" hover-class="none">
				<view class="center-btn">
					<image src="/static/tabbar/ai_companion_avatar.png" mode="aspectFill" class="center-avatar"></image>
				</view>
				<text class="center-text">AI旅伴</text>
			</navigator>

			<!-- 我的 -->
			<navigator class="tab-item" url="/subPackages/user/my/my" open-type="reLaunch" hover-class="tab-item-active">
				<image :src="selected === 2 ? tabIcons.myActive : tabIcons.my" mode="aspectFit" class="tab-icon"></image>
				<text :class="['tab-text', selected === 2 ? 'active-text' : '']">我的</text>
			</navigator>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'TabBar',
		props: {
			current: {
				type: Number,
				default: 0
			}
		},
		data() {
			return {
				selected: 0,
				color: '#7A7E83',
				selectedColor: '#B8812B',
				tabIcons: {
					xiake: '/static/tabbar/xiake.png',
					xiakeActive: '/static/tabbar/xiake1.png',
					my: '/static/tabbar/my.png',
					myActive: '/static/tabbar/my1.png'
				}
			};
		},
		watch: {
			current: {
				immediate: true,
				handler(val) {
					this.selected = val;
				}
			}
		}
	}
</script>

<style>
	.tab-bar-wrapper {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 9999;
		background: linear-gradient(180deg, rgba(248, 241, 228, 0), rgba(248, 241, 228, 0.96) 28%, #F8F1E4 100%);
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);
		box-sizing: border-box;
	}

	.tab-bar {
		display: flex;
		height: 86px;
		margin: 0 20rpx 12rpx;
		border-radius: 28rpx;
		background: rgba(255, 252, 244, 0.94);
		border: 1rpx solid rgba(184, 129, 43, 0.18);
		box-shadow: 0 -8rpx 34rpx rgba(43, 50, 39, 0.12);
		position: relative;
		box-sizing: border-box;
		padding-top: 12px;
	}

	.tab-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-top: 8px;
		text-decoration: none;
		line-height: normal;
	}

	.tab-item-active {
		opacity: 0.72;
	}

	.tab-icon {
		width: 25px;
		height: 25px;
		margin-bottom: 5px;
	}

	.tab-text {
		font-size: 12px;
		color: #75817B;
		white-space: nowrap;
	}

	.active-text {
		color: #B8812B;
		font-weight: 700;
	}

	.center-btn-wrapper {
		position: relative;
		width: 112px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		margin-top: -18px;
		z-index: 10000;
		text-decoration: none;
		line-height: normal;
	}

	.center-btn {
		position: relative;
		width: 74px;
		height: 74px;
		border-radius: 50%;
		background: radial-gradient(circle at 50% 44%, #FFF5CD 0%, #E7BF62 68%, #3A835E 100%);
		box-shadow: 0 12rpx 28rpx rgba(60, 73, 53, 0.22);
		overflow: hidden;
		border: 3px solid rgba(255, 248, 226, 0.96);
	}

	.center-avatar {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		pointer-events: none;
	}

	.center-text {
		display: block;
		margin-top: -9px;
		min-width: 72px;
		height: 26px;
		padding: 0 10px;
		border-radius: 999px;
		background: #38B28A;
		box-shadow: 0 5rpx 12rpx rgba(45, 131, 97, 0.2);
		font-size: 16px;
		line-height: 26px;
		color: #FFFFFF;
		font-weight: 800;
		white-space: nowrap;
		box-sizing: border-box;
		text-align: center;
	}
</style>
