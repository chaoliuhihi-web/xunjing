<template>
	<view class="vision-agent-memory-panel xicheng-paper-card">
		<view class="section-head xicheng-section-label">
			<text class="section-title">连续理解</text>
			<text class="section-badge">Memory</text>
		</view>
		<view class="vision-agent-memory-track">
			<view
				v-for="item in timelineItems"
				:key="item.key"
				class="vision-agent-memory-item"
				:class="{ 'vision-agent-memory-item-active': item.active }"
			>
				<text class="vision-agent-memory-label">{{ item.label }}</text>
				<text class="vision-agent-memory-title">{{ item.title }}</text>
				<text class="vision-agent-memory-copy">{{ item.copy }}</text>
			</view>
		</view>
		<view v-if="memorySessionPackage" class="vision-agent-memory-session">
			<view class="vision-agent-memory-session-head">
				<text class="vision-agent-memory-session-title">AI识境连续会话包</text>
				<text class="vision-agent-memory-session-count">{{ memorySessionPackage.sceneCount }} 次识境</text>
			</view>
			<text class="vision-agent-memory-session-copy">{{ memorySessionPackage.poiTrailText }}</text>
			<text class="vision-agent-memory-session-copy">{{ memorySessionPackage.continuityCueText }}</text>
			<text class="vision-agent-memory-session-copy">{{ memorySessionPackage.domainContinuityText }}</text>
			<text class="vision-agent-memory-session-copy">{{ memorySessionPackage.serviceContinuityText }}</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengScanResultMemoryPanel',
	props: {
		timelineItems: {
			type: Array,
			default: () => []
		},
		memorySessionPackage: {
			type: Object,
			default: null
		}
	}
}
</script>

<style scoped>
.vision-agent-memory-panel {
	margin-top: 28rpx;
	padding: 26rpx;
	border-radius: 30rpx;
	background:
		linear-gradient(135deg, rgba(23, 63, 53, 0.96), rgba(31, 110, 90, 0.92));
}
.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
}
.section-title,
.section-badge {
	display: block;
	color: #FFFFFF;
}
.section-title {
	font-size: 30rpx;
	line-height: 1.3;
	font-weight: 900;
}
.section-badge {
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.16);
	font-size: 20rpx;
	line-height: 1.2;
	font-weight: 800;
	white-space: nowrap;
}
.vision-agent-memory-track {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 22rpx;
}
.vision-agent-memory-item {
	min-width: 0;
	min-height: 170rpx;
	padding: 18rpx;
	border-radius: 22rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.18);
	background: rgba(255, 255, 255, 0.10);
	box-sizing: border-box;
}
.vision-agent-memory-item-active {
	background: rgba(255, 253, 248, 0.18);
}
.vision-agent-memory-label,
.vision-agent-memory-title,
.vision-agent-memory-copy {
	display: block;
	line-height: 1.4;
}
.vision-agent-memory-label {
	font-size: 21rpx;
	color: rgba(255, 255, 255, 0.72);
}
.vision-agent-memory-title {
	margin-top: 8rpx;
	font-size: 25rpx;
	font-weight: 800;
	color: #FFFFFF;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.vision-agent-memory-copy {
	margin-top: 8rpx;
	font-size: 21rpx;
	color: rgba(255, 255, 255, 0.74);
}
.vision-agent-memory-session {
	margin-top: 18rpx;
	padding: 18rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.18);
	border-radius: 22rpx;
	background: rgba(255, 253, 248, 0.13);
	box-sizing: border-box;
}
.vision-agent-memory-session-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 14rpx;
	margin-bottom: 10rpx;
}
.vision-agent-memory-session-title,
.vision-agent-memory-session-count,
.vision-agent-memory-session-copy {
	display: block;
	min-width: 0;
	line-height: 1.4;
}
.vision-agent-memory-session-title {
	font-size: 25rpx;
	font-weight: 800;
	color: #FFFFFF;
}
.vision-agent-memory-session-count {
	flex-shrink: 0;
	font-size: 21rpx;
	font-weight: 700;
	color: rgba(255, 255, 255, 0.76);
}
.vision-agent-memory-session-copy {
	margin-top: 7rpx;
	font-size: 21rpx;
	color: rgba(255, 255, 255, 0.76);
}
</style>
