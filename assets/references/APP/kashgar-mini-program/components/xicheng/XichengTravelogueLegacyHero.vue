<template>
	<view class="hero xicheng-paper-card xicheng-travelogue-hero">
		<view class="travelogue-hero-main">
			<view class="travelogue-hero-copy">
				<text class="eyebrow">{{ region.cityName }} P0</text>
				<text class="title">{{ title }}</text>
				<text class="subtitle">{{ subtitle }}</text>
			</view>
			<view class="travelogue-companion">
				<image class="travelogue-companion-avatar" :src="region.companionAvatar" mode="aspectFit" />
				<view class="travelogue-companion-bubble xicheng-companion-bubble">
					<text class="companion-name">{{ region.companionName }}</text>
					<text class="companion-line">{{ companionLine }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengTravelogueLegacyHero',
	props: {
		region: {
			type: Object,
			default: () => ({})
		},
		title: {
			type: String,
			default: ''
		},
		subtitle: {
			type: String,
			default: ''
		},
		companionLine: {
			type: String,
			default: ''
		}
	}
}
</script>

<style scoped>
.hero {
	padding: 36rpx 32rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.78);
	border-radius: 34rpx;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(250, 246, 237, 0.88));
	box-shadow: 0 18rpx 46rpx rgba(28, 35, 32, 0.10);
	overflow: hidden;
}

.travelogue-hero-main {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
}

.travelogue-hero-copy {
	flex: 1;
	min-width: 0;
}

.eyebrow,
.subtitle {
	display: block;
	font-size: 24rpx;
	line-height: 1.6;
	color: #667085;
}

.title {
	display: block;
	margin-top: 12rpx;
	font-size: 44rpx;
	font-weight: 700;
	color: #102F29;
}

.subtitle {
	margin-top: 14rpx;
}

.travelogue-companion {
	width: 228rpx;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.travelogue-companion-avatar {
	width: 208rpx;
	height: 268rpx;
	border-radius: 30rpx;
	background: #E7EFE8;
}

.travelogue-companion-bubble {
	width: 100%;
	margin-top: 14rpx;
	padding: 14rpx 12rpx;
	border-radius: 26rpx;
	box-sizing: border-box;
}

.companion-name,
.companion-line {
	display: block;
	text-align: center;
}

.companion-name {
	font-size: 24rpx;
	font-weight: 700;
	color: #173F35;
}

.companion-line {
	margin-top: 4rpx;
	font-size: 22rpx;
	line-height: 1.4;
	color: #746F68;
}
</style>
