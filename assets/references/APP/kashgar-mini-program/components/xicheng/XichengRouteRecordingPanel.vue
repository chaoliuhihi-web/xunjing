<template>
	<view class="xicheng-route-recording-panel">
		<view class="recording-panel-nav" :class="{ 'recording-panel-nav-paused': isPaused }">
			<button class="recording-nav-button recording-nav-back" @click="$emit('back')">
				<xicheng-icon name="back" variant="plain" :size="24" />
			</button>
			<view class="recording-title-stack">
				<view class="recording-title-row">
					<text class="recording-title">记录中</text>
					<text v-if="isPaused" class="recording-paused-badge">已暂停</text>
				</view>
				<text v-if="isPaused" class="recording-subtitle">星河寻境西城 · P0 APP</text>
			</view>
			<button class="recording-nav-button recording-nav-layer" @click="$emit('toggle-layer')">
				<xicheng-icon :name="isPaused ? 'layer' : 'record'" variant="primary" :size="isPaused ? 24 : 22" />
				<text v-if="isPaused">图层</text>
			</button>
		</view>

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
				<view class="recording-path-segment recording-path-segment-1"></view>
				<view class="recording-path-segment recording-path-segment-2"></view>
				<view class="recording-path-segment recording-path-segment-3"></view>
				<view class="recording-path-segment recording-path-segment-4"></view>
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

		<view v-if="isPaused" class="recording-paused-stats xicheng-paper-card">
			<view class="recording-paused-stat">
				<xicheng-icon name="route" variant="plain" :size="23" />
				<text>已记录</text>
				<view><text>{{ distanceKilometers }}</text><text>公里</text></view>
			</view>
			<view class="recording-paused-stat">
				<xicheng-icon name="record" variant="plain" :size="23" />
				<text>用时</text>
				<view><text>{{ elapsedMinutes }}</text><text>分钟</text></view>
			</view>
			<view class="recording-paused-stat">
				<xicheng-icon name="study" variant="plain" :size="23" />
				<text>已到达</text>
				<view><text>{{ completedStopCount }}</text><text>/ {{ routeStopItems.length || 1 }}</text></view>
			</view>
			<view class="recording-paused-stat">
				<xicheng-icon name="photo" variant="plain" :size="23" />
				<text>素材</text>
				<view><text>{{ materialCount }}</text><text>条</text></view>
			</view>
		</view>

		<view v-if="isPaused" class="recording-paused-actions">
			<button class="recording-wide-primary xicheng-primary-action" @click="$emit('resume')">
				<xicheng-icon name="resume" variant="plain" :size="23" />
				<text>继续记录</text>
			</button>
			<button class="recording-wide-secondary xicheng-secondary-action" @click="$emit('finish')">
				<xicheng-icon name="edit" variant="plain" :size="23" />
				<text>结束并生成游记</text>
			</button>
			<view class="recording-paused-secondary-grid">
				<button class="xicheng-secondary-action" @click="$emit('photo')">
					<xicheng-icon name="photo" variant="plain" :size="21" />
					<text>补记照片</text>
				</button>
				<button class="xicheng-secondary-action" @click="$emit('materials')">
					<xicheng-icon name="ocr" variant="plain" :size="21" />
					<text>查看今日素材</text>
				</button>
			</view>
		</view>

		<view v-if="isPaused" class="recording-paused-next-card xicheng-paper-card">
			<image v-if="nextStopImage" class="recording-paused-next-image" :src="nextStopImage" mode="aspectFill" />
			<view class="recording-paused-next-copy">
				<view class="recording-paused-next-head">
					<text>下一站：{{ nextStopTitle }}</text>
					<view class="recording-step-dots">
						<text
							v-for="(stop, index) in routeStopItems"
							:key="`paused-step-${stop.poiCode || index}`"
							:class="{ active: index < completedStopCount, current: nextStop && nextStop.poiCode === stop.poiCode }"
						>{{ index + 1 }}</text>
					</view>
				</view>
				<view class="recording-paused-next-meta">
					<xicheng-icon name="route" variant="plain" :size="20" />
					<text>预计步行 {{ nextWalkText }}</text>
				</view>
			</view>
			<button class="recording-next-nav-button xicheng-primary-action" :disabled="!nextStop" @click="$emit('navigate-next')">
				导航到下一站
			</button>
		</view>
		<view v-else class="recording-live-next-card xicheng-paper-card">
			<image v-if="nextStopImage" class="recording-live-next-image" :src="nextStopImage" mode="aspectFill" />
			<view class="recording-live-next-copy">
				<text class="recording-live-next-kicker">下一站</text>
				<text class="recording-live-next-title">{{ nextStopTitle }}</text>
				<view class="recording-live-next-meta">
					<xicheng-icon name="location" variant="plain" :size="20" />
					<text>{{ nextStopAddress }}</text>
				</view>
				<view class="recording-live-next-meta">
					<xicheng-icon name="route" variant="plain" :size="20" />
					<text>预计步行时间 {{ nextWalkText }}</text>
				</view>
			</view>
			<button class="recording-checkin-button xicheng-primary-action" :disabled="!nextStop" @click="$emit('arrive')">
				到达打卡
			</button>
		</view>

		<view v-if="isPaused" class="recording-xiaojing-card xicheng-paper-card">
			<image v-if="companionAvatar" class="recording-xiaojing-avatar" :src="companionAvatar" mode="aspectFit" />
			<view class="recording-xiaojing-bubble">
				<text>记录已暂停，继续后会接着保存足迹。</text>
			</view>
		</view>
		<view v-else class="recording-study-card xicheng-paper-card">
			<view class="recording-study-head">
				<xicheng-icon name="edit" variant="primary" :size="22" />
				<text>游记素材任务</text>
				<text>{{ studyTaskDoneCount }} / {{ studyTaskCount }}</text>
			</view>
			<text class="recording-study-desc">{{ currentStudyTask }}</text>
		</view>

		<view v-else class="recording-live-actions xicheng-paper-card">
			<button class="xicheng-secondary-action" @click="$emit('pause')">
				<xicheng-icon name="record" variant="primary" :size="22" />
				<text>暂停记录</text>
			</button>
			<button class="xicheng-secondary-action" :disabled="!nextStop" @click="$emit('ask')">
				<xicheng-icon name="qa" variant="primary" :size="22" />
				<text>问小京</text>
			</button>
			<button class="xicheng-secondary-action" :disabled="completedStopCount < 1" @click="$emit('finish')">
				<xicheng-icon name="edit" variant="plain" :size="22" />
				<text>生成游记</text>
			</button>
		</view>

		<text class="recording-foreground-tip">为保证定位准确，请保持 APP 在前台运行</text>
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
	name: 'XichengRouteRecordingPanel',
	props: {
		session: {
			type: Object,
			default: () => ({})
		},
		route: {
			type: Object,
			default: () => ({})
		},
		routeStops: {
			type: Array,
			default: () => []
		},
		nextStop: {
			type: Object,
			default: null
		},
		nextStopImage: {
			type: String,
			default: ''
		},
		mapCard: {
			type: Object,
			default: () => ({})
		},
		elapsedMinutes: {
			type: [Number, String],
			default: 0
		},
		distanceKilometers: {
			type: [Number, String],
			default: '0.0'
		},
		completedStopCount: {
			type: Number,
			default: 0
		},
		studyTaskDoneCount: {
			type: Number,
			default: 0
		},
		studyTaskCount: {
			type: Number,
			default: 1
		},
		currentStudyTask: {
			type: String,
			default: '找到一处屋脊兽并拍照'
		},
		companionAvatar: {
			type: String,
			default: ''
		}
	},
	emits: ['back', 'pause', 'resume', 'arrive', 'finish', 'ask', 'locate', 'toggle-layer', 'navigate-next', 'photo', 'materials'],
	computed: {
		isPaused() {
			return this.session && this.session.status === 'paused'
		},
		routeStopItems() {
			return Array.isArray(this.routeStops) && this.routeStops.length > 0 ? this.routeStops : []
		},
		routeTitle() {
			return this.mapCard.title || this.route.title || '白塔寺文化线'
		},
		nextStopTitle() {
			return this.nextStop && this.nextStop.poiName ? this.nextStop.poiName : '路线已完成'
		},
		nextStopAddress() {
			return this.mapCard.address || '西城区阜成门内大街'
		},
		nextWalkText() {
			if (!this.nextStop) return '可以生成游记草稿'
			return this.nextStop.walkText || this.nextStop.durationText || '约 12 分钟'
		},
		materialCount() {
			const pointCount = this.session && Array.isArray(this.session.trackPoints) ? this.session.trackPoints.length : 0
			return Math.max(this.completedStopCount, Math.min(pointCount + this.completedStopCount, 9))
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
		isStopCompleted(stop = {}) {
			const completedCodes = this.session && Array.isArray(this.session.completedStopPoiCodes)
				? this.session.completedStopPoiCodes
				: []
			return completedCodes.includes(stop.poiCode)
		},
		getStopStyle(index = 0) {
			const layouts = this.isPaused ? PAUSED_STOP_LAYOUT : LIVE_STOP_LAYOUT
			const layout = layouts[index % layouts.length] || layouts[0]
			return `left:${layout.left}%;top:${layout.top}%;`
		}
	}
}
</script>

<style scoped>
.xicheng-route-recording-panel {
	min-height: 100vh;
	padding: 34rpx 28rpx 48rpx;
	box-sizing: border-box;
	color: #102F29;
}

.recording-panel-nav {
	display: grid;
	grid-template-columns: 82rpx 1fr 82rpx;
	align-items: center;
	gap: 18rpx;
	margin-bottom: 24rpx;
}

.recording-panel-nav-paused {
	grid-template-columns: 1fr 128rpx;
	align-items: start;
}

.recording-panel-nav-paused .recording-nav-back {
	display: none;
}

.recording-nav-button {
	width: 82rpx;
	min-height: 82rpx;
	border-radius: 28rpx;
	background: rgba(255, 252, 246, 0.94);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	box-shadow: 0 14rpx 34rpx rgba(35, 42, 34, 0.1);
}

.recording-nav-layer {
	flex-direction: column;
	gap: 6rpx;
	color: #173F35;
	font-size: 22rpx;
}

.recording-panel-nav:not(.recording-panel-nav-paused) .recording-nav-layer {
	border-radius: 999rpx;
	background: #173F35;
}

.recording-title-stack {
	min-width: 0;
	text-align: center;
}

.recording-panel-nav-paused .recording-title-stack {
	text-align: left;
}

.recording-title-row {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16rpx;
}

.recording-panel-nav-paused .recording-title-row {
	justify-content: flex-start;
}

.recording-title {
	font-size: 44rpx;
	line-height: 1.15;
	font-weight: 800;
	color: #123F35;
}

.recording-paused-badge {
	padding: 9rpx 20rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.2);
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.1);
	color: #7C633B;
	font-size: 24rpx;
	font-weight: 700;
}

.recording-subtitle {
	display: block;
	margin-top: 10rpx;
	font-size: 27rpx;
	color: #746F68;
}

.recording-map-canvas {
	position: relative;
	min-height: 720rpx;
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
	left: 120rpx;
	right: 136rpx;
	top: 170rpx;
	bottom: 122rpx;
	z-index: 2;
}

.recording-path-segment {
	height: 14rpx;
	border-radius: 999rpx;
	background: #1C604F;
	box-shadow: 0 0 0 8rpx rgba(255, 252, 246, 0.65);
	transform-origin: left center;
}

.recording-path-segment-1 {
	left: 0;
	bottom: 26rpx;
	width: 220rpx;
	transform: rotate(-18deg);
}

.recording-path-segment-2 {
	left: 190rpx;
	bottom: 92rpx;
	width: 190rpx;
	transform: rotate(-2deg);
}

.recording-path-segment-3 {
	right: 36rpx;
	bottom: 118rpx;
	width: 240rpx;
	transform: rotate(-64deg);
}

.recording-path-segment-4 {
	right: 66rpx;
	top: 78rpx;
	width: 170rpx;
	transform: rotate(-70deg);
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

.recording-paused-stats {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	margin-top: 22rpx;
	padding: 24rpx 12rpx;
	border-radius: 30rpx;
}

.recording-paused-stat {
	display: grid;
	gap: 8rpx;
	justify-items: center;
	border-right: 1rpx solid rgba(16, 47, 41, 0.1);
	font-size: 24rpx;
	color: #4C4740;
}

.recording-paused-stat:last-child {
	border-right: 0;
}

.recording-paused-stat view {
	display: flex;
	align-items: baseline;
	gap: 6rpx;
	color: #102F29;
}

.recording-paused-stat view text:first-child {
	font-size: 40rpx;
	font-weight: 800;
}

.recording-live-next-card,
.recording-paused-next-card {
	margin-top: 26rpx;
	padding: 24rpx;
	border-radius: 34rpx;
}

.recording-live-next-card {
	display: grid;
	grid-template-columns: 226rpx 1fr;
	gap: 24rpx;
}

.recording-live-next-image,
.recording-paused-next-image {
	width: 100%;
	border-radius: 24rpx;
	background: #E3E9DE;
}

.recording-live-next-image {
	height: 214rpx;
}

.recording-live-next-copy {
	min-width: 0;
}

.recording-live-next-kicker,
.recording-live-next-title {
	display: block;
}

.recording-live-next-kicker {
	color: #8A6B3D;
	font-size: 25rpx;
}

.recording-live-next-title {
	margin-top: 6rpx;
	font-size: 40rpx;
	line-height: 1.2;
	font-weight: 800;
	color: #102F29;
}

.recording-live-next-meta,
.recording-paused-next-meta {
	display: flex;
	align-items: center;
	gap: 10rpx;
	margin-top: 16rpx;
	color: #746F68;
	font-size: 26rpx;
	line-height: 1.35;
}

.recording-checkin-button {
	grid-column: 1 / 3;
	width: 80%;
	min-height: 92rpx;
	justify-self: center;
	border-radius: 999rpx;
	font-size: 34rpx;
	font-weight: 800;
}

.recording-paused-next-card {
	display: grid;
	grid-template-columns: 170rpx 1fr;
	gap: 22rpx;
	align-items: center;
}

.recording-paused-next-image {
	height: 150rpx;
}

.recording-paused-next-copy {
	min-width: 0;
}

.recording-paused-next-head {
	display: flex;
	justify-content: space-between;
	gap: 14rpx;
	align-items: center;
	font-size: 33rpx;
	font-weight: 800;
	color: #102F29;
}

.recording-step-dots {
	display: flex;
	align-items: center;
	gap: 8rpx;
	flex-shrink: 0;
}

.recording-step-dots text {
	width: 32rpx;
	height: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 999rpx;
	background: #E7E1D8;
	color: #746F68;
	font-size: 20rpx;
}

.recording-step-dots text.active,
.recording-step-dots text.current {
	background: #173F35;
	color: #FFF9EC;
}

.recording-next-nav-button {
	grid-column: 2 / 3;
	width: 100%;
	min-height: 76rpx;
	border-radius: 999rpx;
	font-size: 27rpx;
	font-weight: 800;
}

.recording-study-card,
.recording-xiaojing-card {
	margin-top: 26rpx;
	padding: 28rpx;
	border-radius: 32rpx;
}

.recording-study-head {
	display: grid;
	grid-template-columns: 56rpx 1fr auto;
	align-items: center;
	gap: 16rpx;
	font-size: 32rpx;
	font-weight: 800;
	color: #102F29;
}

.recording-study-head text:last-child {
	padding: 8rpx 20rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.12);
	font-size: 26rpx;
	color: #173F35;
}

.recording-study-desc {
	display: block;
	margin-top: 24rpx;
	font-size: 31rpx;
	line-height: 1.5;
	color: #102F29;
}

.recording-xiaojing-card {
	display: grid;
	grid-template-columns: 120rpx 1fr;
	align-items: end;
	gap: 20rpx;
}

.recording-xiaojing-avatar {
	width: 120rpx;
	height: 120rpx;
	align-self: end;
}

.recording-xiaojing-bubble {
	padding: 24rpx 28rpx;
	border: 1rpx solid rgba(16, 47, 41, 0.08);
	border-radius: 26rpx;
	background: rgba(255, 252, 246, 0.92);
	color: #4C4740;
	font-size: 28rpx;
	line-height: 1.45;
}

.recording-live-actions {
	position: sticky;
	bottom: 168rpx;
	z-index: 12;
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 30rpx;
	padding: 16rpx;
	border-radius: 28rpx;
}

.recording-live-actions button {
	min-height: 84rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	border-radius: 22rpx;
	font-size: 25rpx;
	font-weight: 800;
	padding: 0 10rpx;
}

.recording-paused-actions {
	position: sticky;
	bottom: 168rpx;
	z-index: 12;
	display: grid;
	gap: 18rpx;
	margin-top: 28rpx;
	padding: 14rpx 0;
	border-radius: 30rpx;
	background: linear-gradient(180deg, rgba(249, 243, 232, 0.1), rgba(249, 243, 232, 0.92));
}

.recording-wide-primary,
.recording-wide-secondary {
	min-height: 92rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	border-radius: 999rpx;
	font-size: 33rpx;
	font-weight: 800;
}

.recording-paused-secondary-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
}

.recording-paused-secondary-grid button {
	min-height: 82rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	border-radius: 22rpx;
	font-size: 27rpx;
	font-weight: 700;
}

.recording-foreground-tip {
	display: block;
	margin-top: 24rpx;
	text-align: center;
	font-size: 24rpx;
	color: rgba(23, 63, 53, 0.58);
}
</style>
