<template>
	<view class="xicheng-route-recording-paused-panel">
		<view class="recording-paused-stats xicheng-paper-card">
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

		<view class="recording-paused-actions">
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

		<view class="recording-paused-next-card xicheng-paper-card">
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

		<view class="recording-xiaojing-card xicheng-paper-card">
			<image v-if="companionAvatar" class="recording-xiaojing-avatar" :src="companionAvatar" mode="aspectFit" />
			<view class="recording-xiaojing-bubble">
				<text>记录已暂停，继续后会接着保存路线记录。</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengRouteRecordingPausedPanel',
	props: {
		distanceKilometers: {
			type: [Number, String],
			default: '0.0'
		},
		elapsedMinutes: {
			type: [Number, String],
			default: 0
		},
		completedStopCount: {
			type: Number,
			default: 0
		},
		routeStopItems: {
			type: Array,
			default: () => []
		},
		materialCount: {
			type: Number,
			default: 0
		},
		nextStop: {
			type: Object,
			default: null
		},
		nextStopImage: {
			type: String,
			default: ''
		},
		nextStopTitle: {
			type: String,
			default: '路线已完成'
		},
		nextWalkText: {
			type: String,
			default: '可以生成游记草稿'
		},
		companionAvatar: {
			type: String,
			default: ''
		}
	},
	emits: ['resume', 'finish', 'photo', 'materials', 'navigate-next']
}
</script>

<style scoped>
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

.recording-paused-next-card {
	display: grid;
	grid-template-columns: 170rpx 1fr;
	gap: 22rpx;
	align-items: center;
	margin-top: 26rpx;
	padding: 24rpx;
	border-radius: 34rpx;
}

.recording-paused-next-image {
	width: 100%;
	height: 150rpx;
	border-radius: 24rpx;
	background: #E3E9DE;
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

.recording-paused-next-meta {
	display: flex;
	align-items: center;
	gap: 10rpx;
	margin-top: 16rpx;
	color: #746F68;
	font-size: 26rpx;
	line-height: 1.35;
}

.recording-next-nav-button {
	grid-column: 2 / 3;
	width: 100%;
	min-height: 76rpx;
	border-radius: 999rpx;
	font-size: 27rpx;
	font-weight: 800;
}

.recording-xiaojing-card {
	display: grid;
	grid-template-columns: 120rpx 1fr;
	align-items: end;
	gap: 20rpx;
	margin-top: 26rpx;
	padding: 28rpx;
	border-radius: 32rpx;
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
</style>
