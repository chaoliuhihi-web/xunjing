<template>
	<view class="xicheng-map-bottom-sheet">
		<view class="xicheng-map-sheet-handle"></view>
		<button class="xicheng-map-sheet-close" @click="$emit('close')">×</button>
		<view class="xicheng-map-sheet-head" :class="{ 'xicheng-map-sheet-head-no-image': !selectedPoi.image }">
			<image
				v-if="selectedPoi.image"
				class="xicheng-map-sheet-image"
				:src="selectedPoi.image"
				mode="aspectFill"
			/>
			<view class="xicheng-map-sheet-copy">
				<text class="xicheng-map-sheet-title">{{ selectedPoi.poiName }}</text>
				<view class="xicheng-map-sheet-tags">
					<text>{{ categoryLabel }}</text>
					<text>已审核来源 {{ selectedPoi.sourceCount || 6 }} 条</text>
				</view>
				<text class="xicheng-map-sheet-desc">{{ selectedPoi.summary }}</text>
			</view>
		</view>
		<view class="xicheng-map-sheet-detail-list">
			<view class="xicheng-map-sheet-detail-row">
				<xicheng-icon name="time" variant="plain" :size="18" />
				<text class="xicheng-map-sheet-detail-label">开放时间</text>
				<text class="xicheng-map-sheet-detail-value">{{ selectedPoi.openTime || '09:00-17:00' }}</text>
			</view>
			<view class="xicheng-map-sheet-detail-row">
				<xicheng-icon name="route" variant="plain" :size="18" />
				<view class="xicheng-map-sheet-detail-copy">
					<text class="xicheng-map-sheet-detail-label">{{ selectedPoi.walkDuration || '步行约 12 分钟' }}</text>
					<text class="xicheng-map-sheet-detail-note">{{ selectedPoi.walkDistance || '距当前位置约 850 米' }}</text>
				</view>
			</view>
			<view class="xicheng-map-sheet-detail-row">
				<xicheng-icon name="source" variant="plain" :size="18" />
				<text class="xicheng-map-sheet-detail-label">来源：西城文旅官方资料库</text>
			</view>
		</view>
		<button class="xicheng-map-sheet-primary xicheng-primary-action" @click="$emit('navigate')">
			<xicheng-icon name="route" class="xicheng-map-sheet-primary-icon" variant="plain" :size="20" />
			导航去这里
		</button>
		<view class="xicheng-map-sheet-actions">
			<button class="xicheng-map-sheet-action xicheng-secondary-action" @click="$emit('ask')">问问小京</button>
			<button class="xicheng-map-sheet-action xicheng-secondary-action" @click="$emit('add-to-route')">加入路线</button>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengCulturalMapPoiSheet',
	emits: ['close', 'navigate', 'ask', 'add-to-route'],
	props: {
		selectedPoi: {
			type: Object,
			default: () => ({})
		},
		categoryLabel: {
			type: String,
			default: '文化建筑'
		}
	}
}
</script>

<style scoped>
.xicheng-map-bottom-sheet {
	position: absolute;
	z-index: 6;
	left: 20rpx;
	right: 20rpx;
	bottom: 18rpx;
	padding: 14rpx 18rpx 18rpx;
	border-radius: 26rpx;
	background: rgba(255, 252, 246, 0.98);
	box-shadow: 0 -10rpx 36rpx rgba(26, 48, 39, 0.14);
}

.xicheng-map-sheet-handle {
	width: 66rpx;
	height: 6rpx;
	border-radius: 999rpx;
	margin: 0 auto 12rpx;
	background: rgba(16, 47, 41, 0.18);
}

.xicheng-map-sheet-close {
	position: absolute;
	right: 18rpx;
	top: 16rpx;
	width: 52rpx;
	height: 52rpx;
	border: 0;
	border-radius: 999rpx;
	background: rgba(16, 47, 41, 0.06);
	color: rgba(16, 47, 41, 0.72);
	font-size: 42rpx;
	line-height: 48rpx;
	font-weight: 300;
	padding: 0;
}

.xicheng-map-sheet-head {
	display: grid;
	grid-template-columns: 118rpx minmax(0, 1fr);
	gap: 14rpx;
	align-items: start;
}

.xicheng-map-sheet-head-no-image { grid-template-columns: 1fr; }

.xicheng-map-sheet-image {
	width: 118rpx;
	height: 126rpx;
	border-radius: 18rpx;
	background: rgba(16, 47, 41, 0.08);
}

.xicheng-map-sheet-title {
	display: block;
	font-size: 32rpx;
	line-height: 1.15;
	font-weight: 900;
	color: #102F29;
}

.xicheng-map-sheet-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 8rpx;
	margin-top: 10rpx;
}

.xicheng-map-sheet-tags text {
	padding: 6rpx 10rpx;
	border-radius: 10rpx;
	background: rgba(23, 63, 53, 0.08);
	color: #173F35;
	font-size: 19rpx;
	font-weight: 700;
}

.xicheng-map-sheet-desc {
	display: block;
	margin-top: 10rpx;
	max-height: 64rpx;
	overflow: hidden;
	font-size: 22rpx;
	line-height: 1.42;
	color: rgba(16, 47, 41, 0.74);
}

.xicheng-map-sheet-detail-list {
	margin-top: 12rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.18);
	border-radius: 16rpx;
	overflow: hidden;
}

.xicheng-map-sheet-detail-row {
	display: flex;
	align-items: center;
	gap: 10rpx;
	padding: 10rpx 12rpx;
	color: rgba(16, 47, 41, 0.76);
	font-size: 21rpx;
	line-height: 1.25;
	border-bottom: 1rpx solid rgba(181, 148, 94, 0.14);
}

.xicheng-map-sheet-detail-row:last-child { border-bottom: 0; }

.xicheng-map-sheet-detail-label,
.xicheng-map-sheet-detail-value,
.xicheng-map-sheet-detail-note { display: block; }

.xicheng-map-sheet-detail-label { color: #173F35; font-weight: 800; }

.xicheng-map-sheet-detail-value {
	margin-left: auto;
	color: #4F4A40;
	font-weight: 700;
}

.xicheng-map-sheet-detail-copy {
	display: grid;
	gap: 4rpx;
	min-width: 0;
}

.xicheng-map-sheet-detail-note { color: rgba(16, 47, 41, 0.54); font-size: 20rpx; }

.xicheng-map-sheet-primary {
	width: 100%;
	height: 58rpx;
	line-height: 58rpx;
	margin-top: 12rpx;
	border-radius: 16rpx;
	font-size: 25rpx;
	font-weight: 900;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	padding: 0;
}

.xicheng-map-sheet-primary-icon { color: #FFFDF8; }

.xicheng-map-sheet-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 10rpx;
}

.xicheng-map-sheet-action {
	height: 52rpx;
	line-height: 52rpx;
	border-radius: 14rpx;
	font-size: 22rpx;
	font-weight: 800;
}
</style>
