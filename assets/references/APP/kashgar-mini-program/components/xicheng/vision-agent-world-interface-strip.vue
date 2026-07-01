<template>
	<view v-if="signalBadges.length > 0" class="vision-agent-world-interface-strip">
		<view class="vision-agent-world-interface-copy">
			<text class="vision-agent-world-interface-kicker">世界交互承接</text>
			<text class="vision-agent-world-interface-summary">{{ summary }}</text>
		</view>
		<view class="vision-agent-world-interface-badges">
			<text
				v-for="signal in signalBadges"
				:key="signal.key"
				class="vision-agent-world-interface-badge"
			>
				{{ signal.label }}
			</text>
		</view>
		<text class="vision-agent-world-interface-mark">World Interface</text>
	</view>
</template>

<script>
export default {
	name: 'XichengVisionAgentWorldInterfaceStrip',
	props: {
		summary: {
			type: String,
			default: ''
		},
		signalBadges: {
			type: Array,
			default: () => []
		}
	}
}
</script>

<style scoped>
.vision-agent-world-interface-strip {
	position: relative;
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 18rpx;
	margin-top: 18rpx;
	padding: 20rpx;
	border-radius: 24rpx;
	background: rgba(255, 247, 226, 0.76);
	border: 1rpx solid rgba(184, 129, 43, 0.18);
	box-sizing: border-box;
	overflow: hidden;
}

.vision-agent-world-interface-copy {
	flex: 1;
	min-width: 0;
}

.vision-agent-world-interface-kicker,
.vision-agent-world-interface-summary,
.vision-agent-world-interface-mark {
	display: block;
	line-height: 1.4;
}

.vision-agent-world-interface-kicker {
	font-size: 22rpx;
	font-weight: 800;
	color: #8A5B1E;
}

.vision-agent-world-interface-summary {
	margin-top: 8rpx;
	font-size: 23rpx;
	color: rgba(16, 47, 41, 0.72);
}

.vision-agent-world-interface-badges {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 8rpx;
	width: 248rpx;
	flex-shrink: 0;
}

.vision-agent-world-interface-badge {
	max-width: 100%;
	padding: 7rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(255, 253, 248, 0.88);
	font-size: 20rpx;
	line-height: 1.3;
	font-weight: 800;
	color: #173F35;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.vision-agent-world-interface-mark {
	position: absolute;
	right: 20rpx;
	bottom: 12rpx;
	font-size: 18rpx;
	font-weight: 800;
	color: rgba(138, 91, 30, 0.22);
}
</style>
