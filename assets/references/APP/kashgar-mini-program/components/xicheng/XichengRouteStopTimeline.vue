<template>
	<view class="route-detail-timeline">
		<view
			v-for="(stop, index) in routeStopItems"
			:key="`${stop.poiCode || stop.poiName}-${index}`"
			class="route-detail-timeline-row"
		>
			<view class="route-detail-timeline-rail">
				<view class="route-detail-step-index">{{ index + 1 }}</view>
				<view class="route-detail-step-copy">
					<text>步行</text>
					<text>{{ getStepWalkDistance(index) }}</text>
					<text>{{ getStepWalkMinutes(stop) }}</text>
				</view>
			</view>
			<view class="route-detail-stop-card xicheng-paper-card">
				<image
					v-if="getStopThumbnail(stop, index)"
					class="route-detail-stop-image"
					:src="getStopThumbnail(stop, index)"
					mode="aspectFill"
				/>
				<view class="route-detail-stop-copy">
					<text class="route-detail-stop-title">{{ stop.poiName }}</text>
					<text class="route-detail-stop-desc">{{ stop.summary || stop.theme || '西城官方文化点。' }}</text>
				</view>
				<button class="route-detail-listen-button" @click="$emit('ask-stop', stop)">
					<xicheng-icon name="play" variant="primary" :size="24" />
					<text>听讲解</text>
				</button>
				<view class="route-detail-stop-actions">
					<button class="route-detail-stop-action" @click="$emit('open-poi-detail', stop)">
						<text>地点详情</text>
					</button>
					<button class="route-detail-stop-action route-detail-stop-action-primary" @click="$emit('navigate-stop', stop)">
						<text>导航去这里</text>
					</button>
				</view>
			</view>
		</view>
		<view class="route-detail-finish-pin"></view>
	</view>
</template>

<script>
import {
	XICHENG_ROUTE_DETAIL_FALLBACK_HIGHLIGHT_IMAGES,
	XICHENG_ROUTE_DETAIL_STOP_THUMBNAILS,
	XICHENG_ROUTE_DETAIL_WALK_DISTANCES
} from '@/config/regions/xichengRouteDetail.js'

export default {
	name: 'XichengRouteStopTimeline',
	props: {
		routeStops: {
			type: Array,
			default: () => []
		},
		routeHeroImage: {
			type: String,
			default: ''
		}
	},
	emits: ['ask-stop', 'open-poi-detail', 'navigate-stop'],
	computed: {
		routeStopItems() {
			return Array.isArray(this.routeStops) ? this.routeStops : []
		}
	},
	methods: {
		getStopThumbnail(stop = {}, index = 0) {
			const fallbackImage = XICHENG_ROUTE_DETAIL_FALLBACK_HIGHLIGHT_IMAGES[index % XICHENG_ROUTE_DETAIL_FALLBACK_HIGHLIGHT_IMAGES.length]
			return XICHENG_ROUTE_DETAIL_STOP_THUMBNAILS[stop.poiCode] || fallbackImage || this.routeHeroImage
		},
		getStepWalkDistance(index = 0) {
			return XICHENG_ROUTE_DETAIL_WALK_DISTANCES[index % XICHENG_ROUTE_DETAIL_WALK_DISTANCES.length]
		},
		getStepWalkMinutes(stop = {}) {
			const text = stop.walkText || stop.durationText || '约 20 分钟'
			const matched = String(text).match(/约?\s*\d+\s*分钟/)
			return matched ? matched[0].replace(/\s+/g, '') : '约20分钟'
		}
	}
}
</script>

<style scoped>
.route-detail-timeline {
	position: relative;
	margin-top: 30rpx;
	display: grid;
	gap: 26rpx;
}

.route-detail-timeline::before {
	content: "";
	position: absolute;
	left: 74rpx;
	top: 48rpx;
	bottom: 44rpx;
	border-left: 3rpx dashed rgba(181, 148, 94, 0.58);
}

.route-detail-timeline-row {
	position: relative;
	display: grid;
	grid-template-columns: 126rpx 1fr;
	gap: 16rpx;
	align-items: center;
}

.route-detail-timeline-rail {
	position: relative;
	z-index: 2;
	display: grid;
	justify-items: center;
	gap: 18rpx;
}

.route-detail-step-index {
	width: 58rpx;
	height: 58rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 6rpx solid #B5945E;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF9EC;
	font-size: 28rpx;
	font-weight: 800;
	box-shadow: 0 8rpx 18rpx rgba(23, 63, 53, 0.16);
}

.route-detail-step-copy {
	display: grid;
	gap: 4rpx;
	text-align: center;
	color: #4C4740;
	font-size: 23rpx;
	line-height: 1.35;
}

.route-detail-stop-card {
	display: grid;
	grid-template-columns: 180rpx 1fr 112rpx;
	align-items: center;
	gap: 22rpx;
	min-height: 194rpx;
	padding: 20rpx;
	border-radius: 28rpx;
	box-sizing: border-box;
}

.route-detail-stop-image {
	width: 180rpx;
	height: 154rpx;
	border-radius: 20rpx;
	background: #E3E8E0;
	object-fit: cover;
}

.route-detail-stop-copy {
	min-width: 0;
}

.route-detail-stop-title,
.route-detail-stop-desc {
	display: block;
}

.route-detail-stop-title {
	font-size: 38rpx;
	line-height: 1.24;
	font-weight: 800;
	color: #102F29;
}

.route-detail-stop-desc {
	margin-top: 12rpx;
	font-size: 26rpx;
	line-height: 1.5;
	color: #4C4740;
}

.route-detail-listen-button {
	width: 104rpx;
	min-height: 138rpx;
	display: grid;
	justify-items: center;
	align-content: center;
	gap: 10rpx;
	border-radius: 30rpx;
	background: transparent;
	color: #173F35;
	font-size: 24rpx;
	font-weight: 700;
	padding: 0;
}

.route-detail-stop-actions {
	grid-column: 2 / 4;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: -6rpx;
}

.route-detail-stop-action {
	min-height: 58rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.08);
	color: #173F35;
	font-size: 24rpx;
	font-weight: 700;
	padding: 0 14rpx;
}

.route-detail-stop-action-primary {
	background: rgba(181, 148, 94, 0.18);
	color: #805F27;
}

.route-detail-finish-pin {
	position: absolute;
	left: 58rpx;
	bottom: -18rpx;
	width: 34rpx;
	height: 34rpx;
	border-radius: 999rpx 999rpx 999rpx 0;
	background: #B5945E;
	transform: rotate(-45deg);
}
</style>
