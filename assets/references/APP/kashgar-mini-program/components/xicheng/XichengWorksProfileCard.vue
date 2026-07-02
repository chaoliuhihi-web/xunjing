<template>
	<view class="profile-card xicheng-paper-card">
		<view class="profile-account-art">
			<image class="profile-avatar" :src="companionAvatar" mode="aspectFit" />
		</view>
		<view class="profile-copy">
			<text class="profile-kicker">登录信息</text>
			<view class="profile-name-line">
				<text class="profile-name">{{ safeUserProfile.name }}</text>
				<text class="profile-status">{{ safeUserProfile.status }}</text>
			</view>
			<text class="profile-desc">{{ safeUserProfile.desc }}</text>
			<view class="profile-action-row">
				<button class="profile-login-button" @click="$emit('login')">{{ safeUserProfile.action }}</button>
				<text class="profile-sync-note">登录后同步游记和发布素材</text>
			</view>
		</view>
		<view class="profile-library-overview">
			<text class="profile-library-note">已保存的精美游记、PDF 纪念册和发布素材</text>
			<view v-for="stat in libraryStats" :key="stat.label" class="library-stat">
				<xicheng-icon :name="stat.icon" variant="primary" :size="19" />
				<text class="library-stat-label">{{ stat.label }}</text>
				<text class="library-stat-value">{{ stat.value }}</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengWorksProfileCard',
	props: {
		userProfile: {
			type: Object,
			default: () => ({})
		},
		libraryStats: {
			type: Array,
			default: () => []
		},
		companionAvatar: {
			type: String,
			default: ''
		}
	},
	emits: ['login'],
	computed: {
		safeUserProfile() {
			return {
				name: this.userProfile.name || '西城访客',
				status: this.userProfile.status || '未登录',
				desc: this.userProfile.desc || '游客模式可先保存本机游记，登录后同步我的游记和发布素材。',
				action: this.userProfile.action || '登录'
			}
		}
	}
}
</script>

<style scoped>
.profile-card {
	position: relative;
	display: grid;
	grid-template-columns: 150rpx minmax(0, 1fr);
	align-items: center;
	gap: 16rpx 20rpx;
	margin-top: 20rpx;
	padding: 24rpx;
	border-radius: 34rpx;
	box-sizing: border-box;
	overflow: hidden;
}
.profile-card::after {
	content: '';
	position: absolute;
	right: -22rpx;
	top: -18rpx;
	width: 230rpx;
	height: 190rpx;
	background: url('/static/xicheng/poi-baitasi-card.jpg') center/cover no-repeat;
	opacity: 0.12;
	border-radius: 999rpx 0 0 999rpx;
}
.profile-account-art {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 150rpx;
	height: 150rpx;
	border-radius: 999rpx;
	background:
		linear-gradient(180deg, rgba(23, 63, 53, 0.16), rgba(23, 63, 53, 0.04)),
		rgba(255, 252, 246, 0.88);
	position: relative;
	z-index: 1;
	box-shadow: inset 0 0 0 1rpx rgba(181, 148, 94, 0.20);
	overflow: hidden;
}
.profile-avatar {
	width: 142rpx;
	height: 160rpx;
	object-fit: contain;
	position: relative;
	z-index: 1;
}
.profile-copy {
	min-width: 0;
	position: relative;
	z-index: 1;
}
.profile-kicker,
.profile-name,
.profile-status,
.profile-desc,
.profile-library-note,
.library-stat-value,
.library-stat-label {
	display: block;
}
.profile-kicker {
	font-size: 22rpx;
	line-height: 1.2;
	color: #B5945E;
	font-weight: 800;
}
.profile-name-line {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-top: 8rpx;
	flex-wrap: wrap;
}
.profile-name {
	font-size: 36rpx;
	line-height: 1.22;
	color: #102F29;
	font-weight: 800;
}
.profile-status {
	padding: 7rpx 13rpx;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF8EA;
	font-size: 20rpx;
	font-weight: 900;
	white-space: nowrap;
}
.profile-desc {
	margin-top: 8rpx;
	font-size: 23rpx;
	line-height: 1.45;
	color: rgba(16, 47, 41, 0.62);
}
.profile-action-row {
	display: flex;
	align-items: center;
	gap: 14rpx;
	margin-top: 16rpx;
}
.profile-login-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 132rpx;
	height: 56rpx;
	margin: 0;
	padding: 0;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF8EA;
	font-size: 22rpx;
	line-height: 56rpx;
	font-weight: 800;
	position: relative;
	z-index: 1;
}
.profile-login-button::after {
	border: 0;
}
.profile-sync-note {
	flex: 1;
	min-width: 0;
	font-size: 20rpx;
	line-height: 1.35;
	color: rgba(16, 47, 41, 0.48);
}
.profile-library-overview {
	display: grid;
	grid-column: 1 / -1;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 8rpx;
	margin-top: 0;
	position: relative;
	z-index: 1;
}
.profile-library-note {
	grid-column: 1 / -1;
	color: rgba(16, 47, 41, 0.50);
	font-size: 19rpx;
	line-height: 1.2;
}
.library-stat {
	min-height: 78rpx;
	padding: 8rpx 4rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.16);
	border-radius: 18rpx;
	background: rgba(255, 252, 246, 0.78);
	text-align: center;
	box-sizing: border-box;
}
.library-stat-value {
	margin-top: 3rpx;
	font-size: 27rpx;
	line-height: 1;
	font-weight: 900;
	color: #173F35;
}
.library-stat-label {
	margin-top: 4rpx;
	font-size: 18rpx;
	line-height: 1.2;
	color: rgba(16, 47, 41, 0.62);
}
</style>
