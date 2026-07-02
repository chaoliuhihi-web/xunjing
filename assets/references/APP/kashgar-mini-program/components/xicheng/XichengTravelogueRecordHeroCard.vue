<template>
	<view class="travelogue-approved-hero-card xicheng-paper-card">
		<view class="travelogue-approved-hero-copy">
			<text class="travelogue-approved-hero-title">生成今日游记草稿</text>
			<text class="travelogue-approved-hero-desc">识别、路线、照片和问答会自动汇总成草稿</text>
			<button class="travelogue-approved-primary" @click="$emit('generate')">
				<xicheng-icon name="travelogue" variant="primary" active :size="21" />
				<text>一键生成游记</text>
			</button>
			<button class="travelogue-approved-secondary" @click="$emit('add-photo')">
				<xicheng-icon name="plus" variant="plain" :size="19" />
				<text>添加素材</text>
			</button>
		</view>
		<view class="travelogue-approved-visual">
			<image class="travelogue-approved-cover" :src="previewImage" mode="aspectFill" />
			<view class="travelogue-approved-route-dot dot-a"></view>
			<view class="travelogue-approved-route-dot dot-b"></view>
			<view class="travelogue-approved-route-dot dot-c"></view>
			<view class="travelogue-approved-photo-card photo-a">
				<image :src="beihaiRouteImage" mode="aspectFill" />
			</view>
			<view class="travelogue-approved-photo-card photo-b">
				<image :src="baitasiRouteImage" mode="aspectFill" />
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengTravelogueRecordHeroCard',
	emits: ['generate', 'add-photo'],
	props: {
		previewImage: {
			type: String,
			default: ''
		},
		beihaiRouteImage: {
			type: String,
			default: ''
		},
		baitasiRouteImage: {
			type: String,
			default: ''
		}
	}
}
</script>

<style scoped>
.travelogue-approved-hero-card {
	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 1fr) 330rpx;
	gap: 20rpx;
	min-height: 296rpx;
	padding: 34rpx 28rpx;
	border-radius: 34rpx;
	overflow: hidden;
	background:
		linear-gradient(90deg, rgba(255, 253, 248, 0.96) 0%, rgba(255, 253, 248, 0.90) 52%, rgba(240, 229, 207, 0.66) 100%),
		radial-gradient(circle at 80% 20%, rgba(181, 148, 94, 0.22), transparent 36%);
}

.travelogue-approved-hero-copy {
	position: relative;
	z-index: 2;
	min-width: 0;
}

.travelogue-approved-hero-title {
	font-size: 42rpx;
	line-height: 1.22;
	font-weight: 900;
	color: #102F29;
}

.travelogue-approved-hero-desc {
	margin-top: 18rpx;
	font-size: 25rpx;
	line-height: 1.5;
	color: rgba(16, 47, 41, 0.68);
}

.travelogue-approved-primary {
	width: 270rpx;
	height: 72rpx;
	margin-top: 28rpx;
	background: linear-gradient(135deg, #173F35, #0F332D);
	color: #FFFFFF;
	font-size: 28rpx;
	box-shadow: 0 14rpx 28rpx rgba(16, 47, 41, 0.18);
}

.travelogue-approved-secondary {
	width: 270rpx;
	height: 68rpx;
	margin-top: 16rpx;
	background: rgba(255, 253, 248, 0.72);
	border: 1rpx solid rgba(181, 148, 94, 0.48);
	color: #102F29;
	font-size: 27rpx;
}

.travelogue-approved-visual {
	position: relative;
	min-height: 264rpx;
}

.travelogue-approved-cover {
	position: absolute;
	right: 0;
	top: 6rpx;
	width: 250rpx;
	height: 230rpx;
	border-radius: 28rpx;
	box-shadow: 0 18rpx 34rpx rgba(35, 42, 34, 0.14);
}

.travelogue-approved-visual::before {
	content: "";
	position: absolute;
	left: 42rpx;
	top: 56rpx;
	width: 214rpx;
	height: 168rpx;
	border: 4rpx dashed rgba(181, 148, 94, 0.70);
	border-left-color: transparent;
	border-bottom-color: transparent;
	border-radius: 999rpx;
	transform: rotate(18deg);
}

.travelogue-approved-route-dot {
	position: absolute;
	z-index: 3;
	width: 18rpx;
	height: 18rpx;
	border: 6rpx solid #B5945E;
	border-radius: 50%;
	background: #FFFFFF;
	box-shadow: 0 4rpx 10rpx rgba(35, 42, 34, 0.18);
}

.dot-a { left: 80rpx; top: 74rpx; }
.dot-b { left: 142rpx; top: 180rpx; border-color: #1F6E5A; }
.dot-c { right: 22rpx; bottom: 32rpx; }

.travelogue-approved-photo-card {
	position: absolute;
	z-index: 4;
	width: 86rpx;
	height: 70rpx;
	padding: 6rpx;
	border-radius: 10rpx;
	background: #FFFFFF;
	box-shadow: 0 10rpx 20rpx rgba(35, 42, 34, 0.14);
	transform: rotate(-8deg);
}

.travelogue-approved-photo-card image {
	width: 100%;
	height: 100%;
	border-radius: 8rpx;
}

.photo-a { left: 28rpx; top: 44rpx; }
.photo-b { right: 4rpx; bottom: 6rpx; transform: rotate(8deg); }
</style>
