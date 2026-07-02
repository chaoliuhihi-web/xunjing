<template>
	<view class="recording-map-canvas xicheng-paper-card">
		<view class="recording-map-paper-grid"></view>
		<view class="recording-map-water recording-map-water-main"></view>
		<view class="recording-map-water recording-map-water-side"></view>
		<view class="recording-map-street recording-map-street-top">地安门西大街</view>
		<view class="recording-map-street recording-map-street-left">阜成门内大街</view>
		<view class="recording-map-street recording-map-street-right">西四北大街</view>
		<view class="recording-map-street recording-map-street-bottom">西长安街</view>
		<view class="recording-map-district">西 城 区</view>

		<view v-if="isPaused" class="recording-category-legend">
			<view v-for="category in categories" :key="category.label" class="recording-category-row">
				<view class="recording-category-dot" :style="`background:${category.color};`"></view>
				<text>{{ category.label }}</text>
			</view>
		</view>

		<view v-else class="recording-progress-card">
			<xicheng-icon class="recording-progress-icon" name="layer" variant="primary" :size="24" />
			<text class="recording-progress-title">{{ routeTitle }}</text>
			<view class="recording-progress-line"></view>
			<view class="recording-progress-row">
				<xicheng-icon name="record" variant="plain" :size="18" />
				<text>已用时</text>
				<text class="recording-progress-value">{{ elapsedMinutes }}</text>
				<text>分钟</text>
			</view>
			<view class="recording-progress-row">
				<xicheng-icon name="location" variant="plain" :size="18" />
				<text>已走距离</text>
				<text class="recording-progress-value">{{ distanceKilometers }}</text>
				<text>km</text>
			</view>
			<view class="recording-progress-row">
				<xicheng-icon name="study" variant="plain" :size="18" />
				<text>完成进度</text>
				<text class="recording-progress-value">{{ completedStopCount }}</text>
				<text>/ {{ routeStopItems.length || 1 }}</text>
			</view>
			<text class="recording-progress-caption">路线进度</text>
		</view>

		<view class="recording-route-path">
			<view
				v-for="segment in routeSegments"
				:key="segment.key"
				class="recording-path-segment recording-route-segment"
				:style="getRouteSegmentStyle(segment)"
			></view>
		</view>

		<view
			v-for="(stop, index) in routeStopItems"
			:key="`${stop.poiCode || stop.poiName}-${index}`"
			class="recording-stop-marker"
			:class="{
				'recording-stop-complete': isStopCompleted(stop),
				'recording-stop-next': nextStop && nextStop.poiCode === stop.poiCode
			}"
			:style="getStopStyle(index)"
		>
			<view class="recording-stop-pin">
				<text>{{ index + 1 }}</text>
			</view>
			<text class="recording-stop-label">{{ stop.poiName }}</text>
		</view>

		<view class="recording-live-pin" :class="{ 'recording-live-pin-paused': isPaused }">
			<view class="recording-live-pin-core"></view>
		</view>

		<view class="recording-map-tool-stack">
			<button class="recording-map-tool" @click="$emit('locate')">
				<xicheng-icon name="location" variant="plain" :size="20" />
				<text>定位</text>
			</button>
			<button class="recording-map-tool" @click="$emit('toggle-layer')">
				<xicheng-icon name="layer" variant="plain" :size="20" />
				<text>图层</text>
			</button>
		</view>
		<view v-if="!isPaused" class="recording-map-scale">100 m</view>
	</view>
</template>

<script>
const LIVE_STOP_LAYOUT = Object.freeze([
	{ left: 15, top: 80 },
	{ left: 49, top: 58 },
	{ left: 73, top: 32 },
	{ left: 69, top: 67 }
])

const PAUSED_STOP_LAYOUT = Object.freeze([
	{ left: 22, top: 67 },
	{ left: 48, top: 75 },
	{ left: 67, top: 26 },
	{ left: 73, top: 54 }
])

export default {
	name: 'XichengRouteRecordingMapCanvas',
	emits: ['locate', 'toggle-layer'],
	props: {
		isPaused: { type: Boolean, default: false },
		routeTitle: { type: String, default: '白塔寺文化线' },
		elapsedMinutes: { type: [Number, String], default: 0 },
		distanceKilometers: { type: [Number, String], default: '0.0' },
		completedStopCount: { type: Number, default: 0 },
		routeStopItems: { type: Array, default: () => [] },
		nextStop: { type: Object, default: null },
		completedStopPoiCodes: { type: Array, default: () => [] }
	},
	computed: {
		routeSegments() {
			return this.routeStopItems.slice(0, -1).map((stop, index) => {
				const start = this.getStopPosition(index)
				const end = this.getStopPosition(index + 1)
				const deltaLeft = Number(end.left) - Number(start.left)
				const deltaTop = Number(end.top) - Number(start.top)
				return {
					key: `recording-segment-${stop.poiCode || stop.poiName || index}`,
					left: Number(start.left),
					top: Number(start.top),
					width: Math.hypot(deltaLeft, deltaTop),
					angle: Math.atan2(deltaTop, deltaLeft) * 180 / Math.PI
				}
			})
		},
		categories() {
			return [
				{ label: '文化建筑', color: '#16805F' },
				{ label: '历史遗迹', color: '#A6783D' },
				{ label: '胡同院落', color: '#4E83A4' },
				{ label: '美食购物', color: '#D97A32' },
				{ label: '自然景观', color: '#6F8E54' }
			]
		}
	},
	methods: {
		getStopPosition(index = 0) {
			const layouts = this.isPaused ? PAUSED_STOP_LAYOUT : LIVE_STOP_LAYOUT
			return layouts[index % layouts.length] || layouts[0]
		},
		isStopCompleted(stop = {}) {
			return this.completedStopPoiCodes.includes(stop.poiCode)
		},
		getStopStyle(index = 0) {
			const layout = this.getStopPosition(index)
			return `left:${layout.left}%;top:${layout.top}%;`
		},
		getRouteSegmentStyle(segment = {}) {
			return `left:${segment.left}%;top:${segment.top}%;width:${segment.width}%;transform:rotate(${segment.angle}deg);`
		}
	}
}
</script>

<style scoped>
.recording-map-canvas {
	position: relative;
	min-height: 640rpx;
	border-radius: 34rpx;
	overflow: hidden;
	background:
		linear-gradient(90deg, rgba(198, 207, 188, 0.18) 1px, transparent 1px),
		linear-gradient(0deg, rgba(198, 207, 188, 0.18) 1px, transparent 1px),
		linear-gradient(180deg, #F9F2E7 0%, #F2E9D9 100%);
	background-size: 82rpx 82rpx, 82rpx 82rpx, auto;
	box-shadow: 0 18rpx 46rpx rgba(35, 42, 34, 0.08);
}

.recording-map-paper-grid,
.recording-map-water,
.recording-route-path,
.recording-path-segment,
.recording-map-street,
.recording-map-district {
	position: absolute;
	pointer-events: none;
}

.recording-map-paper-grid {
	inset: 0;
	background:
		linear-gradient(116deg, transparent 0 43%, rgba(214, 204, 184, 0.46) 43% 44%, transparent 44%),
		linear-gradient(28deg, transparent 0 56%, rgba(214, 204, 184, 0.44) 56% 57%, transparent 57%),
		radial-gradient(circle at 20% 74%, rgba(132, 157, 111, 0.14), transparent 12%),
		radial-gradient(circle at 77% 54%, rgba(132, 157, 111, 0.13), transparent 13%);
	opacity: 0.84;
}

.recording-map-water {
	background: rgba(142, 190, 201, 0.35);
	border: 1rpx solid rgba(117, 157, 166, 0.16);
}

.recording-map-water-main {
	right: 108rpx;
	top: 52rpx;
	width: 180rpx;
	height: 272rpx;
	border-radius: 49% 51% 45% 55%;
	transform: rotate(9deg);
}

.recording-map-water-side {
	left: 322rpx;
	top: 54rpx;
	width: 150rpx;
	height: 190rpx;
	border-radius: 50% 42% 54% 44%;
	transform: rotate(-11deg);
}

.recording-map-street {
	color: rgba(73, 58, 38, 0.64);
	font-size: 22rpx;
	letter-spacing: 0;
}

.recording-map-street-top {
	right: 154rpx;
	top: 74rpx;
}

.recording-map-street-left {
	left: 170rpx;
	top: 356rpx;
	writing-mode: vertical-rl;
}

.recording-map-street-right {
	right: 104rpx;
	top: 360rpx;
	writing-mode: vertical-rl;
}

.recording-map-street-bottom {
	left: 320rpx;
	bottom: 74rpx;
}

.recording-map-district {
	left: 370rpx;
	top: 388rpx;
	color: rgba(38, 34, 26, 0.58);
	font-size: 44rpx;
	font-family: serif;
}

.recording-progress-card {
	position: absolute;
	left: 28rpx;
	top: 28rpx;
	z-index: 4;
	width: 304rpx;
	padding: 28rpx 26rpx;
	border-radius: 30rpx;
	background: rgba(255, 252, 246, 0.95);
	box-shadow: 0 18rpx 46rpx rgba(35, 42, 34, 0.13);
	box-sizing: border-box;
}

.recording-progress-icon {
	margin-bottom: 14rpx;
}

.recording-progress-title {
	display: block;
	font-size: 31rpx;
	line-height: 1.25;
	font-weight: 800;
	color: #102F29;
}

.recording-progress-line {
	height: 1rpx;
	margin: 20rpx 0 14rpx;
	background: rgba(16, 47, 41, 0.12);
}

.recording-progress-row {
	display: grid;
	grid-template-columns: 30rpx 90rpx minmax(52rpx, 1fr) auto;
	align-items: baseline;
	gap: 8rpx;
	margin-top: 16rpx;
	font-size: 23rpx;
	color: #746F68;
}

.recording-progress-row text {
	white-space: nowrap;
}

.recording-progress-value {
	justify-self: end;
	color: #102F29;
	font-size: 34rpx;
	font-weight: 800;
}

.recording-progress-caption {
	display: block;
	margin-top: 16rpx;
	font-size: 22rpx;
	color: rgba(23, 63, 53, 0.6);
}

.recording-category-legend {
	position: absolute;
	left: 24rpx;
	top: 30rpx;
	z-index: 4;
	display: grid;
	gap: 16rpx;
	padding: 22rpx 24rpx;
	border-radius: 26rpx;
	background: rgba(255, 252, 246, 0.92);
	box-shadow: 0 14rpx 36rpx rgba(35, 42, 34, 0.1);
}

.recording-category-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	font-size: 23rpx;
	color: #4C4740;
}

.recording-category-dot {
	width: 22rpx;
	height: 22rpx;
	border-radius: 999rpx;
}

.recording-route-path {
	inset: 0;
	z-index: 2;
}

.recording-path-segment {
	position: absolute;
	height: 14rpx;
	border-radius: 999rpx;
	background: #1C604F;
	box-shadow: 0 0 0 8rpx rgba(255, 252, 246, 0.65);
	transform-origin: left center;
	pointer-events: none;
}

.recording-route-segment::after {
	content: '';
	position: absolute;
	right: -7rpx;
	top: 50%;
	width: 14rpx;
	height: 14rpx;
	border-radius: 999rpx;
	background: #1C604F;
	transform: translateY(-50%);
	box-shadow: 0 0 0 6rpx rgba(255, 252, 246, 0.72);
}

.recording-stop-marker {
	position: absolute;
	z-index: 5;
	display: flex;
	align-items: center;
	gap: 8rpx;
	transform: translate(-18rpx, -18rpx);
}

.recording-stop-pin {
	width: 54rpx;
	height: 54rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 999rpx;
	background: #B5945E;
	border: 8rpx solid rgba(255, 252, 246, 0.88);
	color: #FFF9EC;
	font-size: 24rpx;
	font-weight: 800;
	box-shadow: 0 12rpx 26rpx rgba(35, 42, 34, 0.18);
}

.recording-stop-label {
	padding: 9rpx 18rpx;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF9EC;
	font-size: 24rpx;
	font-weight: 700;
	white-space: nowrap;
	box-shadow: 0 10rpx 24rpx rgba(35, 42, 34, 0.12);
}

.recording-stop-complete .recording-stop-pin,
.recording-stop-next .recording-stop-pin {
	background: #173F35;
}

.recording-live-pin {
	position: absolute;
	left: 56%;
	top: 56%;
	z-index: 6;
	width: 60rpx;
	height: 60rpx;
	border-radius: 999rpx;
	border: 10rpx solid rgba(255, 252, 246, 0.92);
	background: rgba(23, 63, 53, 0.16);
	box-shadow: 0 16rpx 32rpx rgba(23, 63, 53, 0.18);
}

.recording-live-pin-paused {
	left: 49%;
	top: 74%;
}

.recording-live-pin-core {
	width: 28rpx;
	height: 28rpx;
	margin: 16rpx;
	border-radius: 999rpx;
	background: #173F35;
}

.recording-map-tool-stack {
	position: absolute;
	right: 24rpx;
	top: 362rpx;
	z-index: 7;
	display: grid;
	gap: 16rpx;
}

.recording-map-tool {
	width: 84rpx;
	min-height: 84rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 4rpx;
	border-radius: 28rpx;
	background: rgba(255, 252, 246, 0.92);
	color: #173F35;
	font-size: 22rpx;
	box-shadow: 0 14rpx 32rpx rgba(35, 42, 34, 0.1);
	padding: 0;
}

.recording-map-scale {
	position: absolute;
	left: 28rpx;
	bottom: 22rpx;
	width: 84rpx;
	padding-top: 12rpx;
	border-bottom: 4rpx solid #102F29;
	color: #4C4740;
	font-size: 22rpx;
	text-align: center;
}
</style>
