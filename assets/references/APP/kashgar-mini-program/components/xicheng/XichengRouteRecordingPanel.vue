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
				<text>记录已暂停，继续后会接着保存路线记录。</text>
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
import XichengRouteRecordingMapCanvas from '@/components/xicheng/XichengRouteRecordingMapCanvas.vue'

export default {
	name: 'XichengRouteRecordingPanel',
	components: { XichengRouteRecordingMapCanvas },
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
	margin-bottom: 24rpx;
}

.recording-live-next-image,
.recording-paused-next-image {
	width: 100%;
	border-radius: 24rpx;
	background: #E3E9DE;
}

.recording-live-next-image {
	height: 172rpx;
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
	min-height: 76rpx;
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
