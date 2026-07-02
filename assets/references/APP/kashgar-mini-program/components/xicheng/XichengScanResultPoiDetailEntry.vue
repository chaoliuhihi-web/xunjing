<template>
	<view
		class="poi-detail-entry xicheng-paper-card"
		:class="{ 'poi-detail-entry-disabled': recognitionActionBlocked }"
		@click="$emit('open-poi-detail')"
	>
		<view class="poi-detail-entry-icon">
			<xicheng-icon name="layer" variant="primary" :size="24" />
		</view>
		<view class="poi-detail-entry-copy">
			<text class="poi-detail-entry-title">建筑看点</text>
			<text class="poi-detail-entry-desc">{{ poiName }}官方地点详情</text>
		</view>
		<text class="poi-detail-entry-label">地点详情</text>
		<xicheng-icon name="next" variant="plain" :size="20" />
	</view>
</template>

<script>
export default {
	name: 'XichengScanResultPoiDetailEntry',
	emits: ['open-poi-detail'],
	props: {
		poiName: {
			type: String,
			default: '西城文化点'
		},
		recognitionActionBlocked: {
			type: Boolean,
			default: false
		}
	}
}
</script>

<style scoped>
.poi-detail-entry {
	display: grid;
	grid-template-columns: 76rpx 1fr auto 34rpx;
	align-items: center;
	gap: 18rpx;
	margin-top: 28rpx;
	padding: 24rpx 28rpx;
	border-radius: 30rpx;
	background: rgba(255, 253, 248, 0.94);
}

.poi-detail-entry-disabled {
	opacity: 0.56;
}

.poi-detail-entry-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 76rpx;
	height: 76rpx;
	border-radius: 999rpx;
	background: #173F35;
	box-shadow: 0 12rpx 26rpx rgba(16, 47, 41, 0.16);
}

.poi-detail-entry-copy {
	min-width: 0;
}

.poi-detail-entry-title,
.poi-detail-entry-desc {
	display: block;
}

.poi-detail-entry-title {
	font-size: 32rpx;
	font-weight: 700;
	line-height: 1.25;
	color: #102F29;
}

.poi-detail-entry-desc {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.45;
	color: #746F68;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.poi-detail-entry-label {
	font-size: 24rpx;
	font-weight: 700;
	color: #173F35;
	white-space: nowrap;
}
</style>
