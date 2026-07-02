<template>
	<view class="route-card xicheng-paper-card">
		<view class="section-head xicheng-section-label">
			<text class="section-title">推荐路线</text>
			<text class="section-badge">{{ routeDurationLabel }}</text>
		</view>
		<text class="route-title">{{ recommendedRoute.title || '西城 Citywalk 推荐路线' }}</text>
		<text v-if="recommendedRoute.summary || recommendedRoute.theme" class="route-desc">
			{{ recommendedRoute.summary || recommendedRoute.theme }}
		</text>
		<view v-if="routeSteps.length > 0" class="route-steps">
			<text
				v-for="(stop, index) in routeSteps"
				:key="routeStopKey(stop, index)"
				class="route-stop"
			>
				{{ index + 1 }}. {{ formatRouteStop(stop) }}
			</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengScanResultRouteCard',
	props: {
		recommendedRoute: {
			type: Object,
			default: () => ({})
		},
		routeSteps: {
			type: Array,
			default: () => []
		}
	},
	computed: {
		routeDurationLabel() {
			return this.recommendedRoute.durationText || this.recommendedRoute.duration || '可加入路线护照'
		}
	},
	methods: {
		formatRouteStop(stop = {}) {
			if (typeof stop === 'string') return stop
			return stop.poiName || stop.name || '西城文化点'
		},
		routeStopKey(stop = {}, index = 0) {
			if (typeof stop === 'string') return `${stop}-${index}`
			return `${stop.poiCode || stop.poiName || stop.name || 'route-stop'}-${index}`
		}
	}
}
</script>

<style scoped>
.route-card {
	margin-top: 28rpx;
	padding: 32rpx;
	border-radius: 34rpx;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.section-head.xicheng-section-label {
	justify-content: flex-start;
}

.section-head.xicheng-section-label .section-badge {
	margin-left: auto;
}

.section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #102F29;
}

.section-badge {
	flex-shrink: 0;
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.16);
	font-size: 22rpx;
	color: #173F35;
}

.route-title {
	display: block;
	margin-top: 18rpx;
	font-size: 28rpx;
	font-weight: 700;
	color: #102F29;
}

.route-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #746F68;
}

.route-steps {
	margin-top: 18rpx;
}

.route-stop {
	display: block;
	margin-top: 12rpx;
	padding: 18rpx;
	border-radius: 22rpx;
	background: rgba(23, 63, 53, 0.08);
	font-size: 26rpx;
	color: #173F35;
}
</style>
