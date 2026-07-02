<template>
	<view class="travelogue-secondary-directory xicheng-paper-card">
		<view class="section-head">
			<text class="section-title">二级功能</text>
			<text class="section-badge">按需进入</text>
		</view>
		<text class="section-desc">记录、护照、分享审核和运营数据不在编辑页展开，避免主编辑流程过长。</text>
		<view class="travelogue-secondary-entry-grid">
			<view
				v-for="entry in entries"
				:key="entry.key"
				class="travelogue-secondary-entry"
				@click="$emit('open', entry)"
			>
				<view class="travelogue-secondary-entry-head">
					<xicheng-icon :name="entry.icon" variant="plain" :size="21" />
					<text class="travelogue-secondary-entry-title">{{ entry.title }}</text>
				</view>
				<text class="travelogue-secondary-entry-copy">{{ entry.copy }}</text>
				<text class="travelogue-secondary-entry-meta">{{ entry.meta }}</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengTravelogueSecondaryDirectory',
	props: {
		entries: {
			type: Array,
			default: () => []
		}
	},
	emits: ['open']
}
</script>

<style scoped>
.travelogue-secondary-directory {
	margin-top: 24rpx;
	padding: 26rpx;
}
.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}
.section-title,
.section-badge,
.section-desc,
.travelogue-secondary-entry-title,
.travelogue-secondary-entry-copy,
.travelogue-secondary-entry-meta {
	display: block;
}
.section-title {
	position: relative;
	padding-left: 22rpx;
	font-size: 32rpx;
	line-height: 1.35;
	font-weight: 900;
	color: #102F29;
}
.section-title::before {
	content: '';
	position: absolute;
	left: 0;
	top: 11rpx;
	width: 8rpx;
	height: 28rpx;
	border-radius: 999rpx;
	background: #B5945E;
}
.section-badge {
	flex-shrink: 0;
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(31, 110, 90, 0.1);
	color: #1F6E5A;
	font-size: 22rpx;
	line-height: 1.3;
	font-weight: 800;
}
.section-desc {
	margin-top: 16rpx;
	color: #746F68;
	font-size: 25rpx;
	line-height: 1.55;
}
.travelogue-secondary-entry-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 20rpx;
}
.travelogue-secondary-entry {
	min-height: 164rpx;
	padding: 20rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.12);
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.78);
	box-sizing: border-box;
	box-shadow: 0 8rpx 20rpx rgba(28, 35, 32, 0.05);
}
.travelogue-secondary-entry-head {
	display: flex;
	align-items: center;
	gap: 10rpx;
	min-width: 0;
}
.travelogue-secondary-entry-title {
	min-width: 0;
	font-size: 27rpx;
	line-height: 1.35;
	font-weight: 800;
	color: #173F35;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.travelogue-secondary-entry-copy {
	margin-top: 12rpx;
	color: #746F68;
	font-size: 23rpx;
	line-height: 1.45;
}
.travelogue-secondary-entry-meta {
	margin-top: 12rpx;
	color: #1F6E5A;
	font-size: 22rpx;
	line-height: 1.35;
	font-weight: 700;
}
</style>
