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

		<xicheng-route-recording-map-canvas
			:is-paused="isPaused"
			:route-title="routeTitle"
			:elapsed-minutes="elapsedMinutes"
			:distance-kilometers="distanceKilometers"
			:completed-stop-count="completedStopCount"
			:route-stop-items="routeStopItems"
			:next-stop="nextStop"
			:completed-stop-poi-codes="completedStopPoiCodes"
			@locate="$emit('locate')"
			@toggle-layer="$emit('toggle-layer')"
		/>

		<xicheng-route-recording-paused-panel
			v-if="isPaused"
			:distance-kilometers="distanceKilometers"
			:elapsed-minutes="elapsedMinutes"
			:completed-stop-count="completedStopCount"
			:route-stop-items="routeStopItems"
			:material-count="materialCount"
			:next-stop="nextStop"
			:next-stop-image="nextStopImage"
			:next-stop-title="nextStopTitle"
			:next-walk-text="nextWalkText"
			:companion-avatar="companionAvatar"
			@resume="$emit('resume')"
			@finish="$emit('finish')"
			@photo="$emit('photo')"
			@materials="$emit('materials')"
			@navigate-next="$emit('navigate-next')"
		/>
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
import XichengRouteRecordingMapCanvas from '@/components/xicheng/XichengRouteRecordingMapCanvas.vue'
import XichengRouteRecordingPausedPanel from '@/components/xicheng/XichengRouteRecordingPausedPanel.vue'

export default {
	name: 'XichengRouteRecordingPanel',
	components: { XichengRouteRecordingMapCanvas, XichengRouteRecordingPausedPanel },
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
		completedStopPoiCodes() {
			return this.session && Array.isArray(this.session.completedStopPoiCodes)
				? this.session.completedStopPoiCodes
				: []
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

.recording-live-next-card,
.recording-study-card {
	margin-top: 26rpx;
	padding: 24rpx;
	border-radius: 34rpx;
}

.recording-live-next-card {
	display: grid;
	grid-template-columns: 226rpx 1fr;
	gap: 24rpx;
	margin-bottom: 24rpx;
}

.recording-live-next-image {
	width: 100%;
	height: 172rpx;
	border-radius: 24rpx;
	background: #E3E9DE;
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

.recording-live-next-meta {
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
	min-height: 76rpx;
	justify-self: center;
	border-radius: 999rpx;
	font-size: 34rpx;
	font-weight: 800;
}

.recording-study-card {
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

.recording-live-actions {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 0;
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

.recording-foreground-tip {
	display: block;
	margin-top: 24rpx;
	text-align: center;
	font-size: 24rpx;
	color: rgba(23, 63, 53, 0.58);
}
</style>
