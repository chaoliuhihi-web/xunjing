<template>
	<view class="material-box">
		<view class="hero">
			<text class="eyebrow">旅行素材盒</text>
			<text class="title">轨迹、照片、识别事件和用户备注</text>
			<text class="subtitle">用户主动开始记录后，素材会沉淀成可编辑游记时间线。</text>
			<view class="state-row">
				<text>轨迹：{{ activeSession.status || '未开始' }}</text>
				<text>{{ timeline.length }} 条素材</text>
			</view>
		</view>

		<view class="control-row">
			<button class="mini-button" @click="pauseTrack">暂停</button>
			<button class="mini-button" @click="resumeTrack">继续</button>
			<button class="mini-button" @click="endTrack">结束记录</button>
		</view>

		<view class="remark-card">
			<input v-model="remarkText" class="remark-input" placeholder="补充一句用户备注" />
			<button class="primary-button" @click="addRemark">加入素材</button>
		</view>

		<view class="timeline">
			<view v-for="item in timeline" :key="item.eventId" class="timeline-item">
				<text class="timeline-type">{{ item.eventType }}</text>
				<text class="timeline-title">{{ item.title }}</text>
				<text class="timeline-desc">{{ item.summary }}</text>
			</view>
		</view>

		<button class="bottom-button" @click="openTravelogue">生成游记草稿</button>
	</view>
</template>

<script>
import {
	XICHENG_ACTIVE_TRACK_STORAGE_KEY
} from '@/request/xunjing/track.js'
import {
	appendXichengMaterialEvent,
	endXichengTrackSession,
	getXichengMaterialTimeline,
	pauseXichengTrackSession,
	resumeXichengTrackSession
} from '@/request/xunjing/track.js'

export default {
	data() {
		return {
			routeId: '',
			activeSession: {},
			timeline: [],
			remarkText: ''
		}
	},
	onLoad(options = {}) {
		this.routeId = decodeURIComponent(options.routeId || '')
		this.refresh()
	},
	methods: {
		refresh() {
			this.activeSession = uni.getStorageSync(XICHENG_ACTIVE_TRACK_STORAGE_KEY) || {}
			this.timeline = getXichengMaterialTimeline()
		},
		pauseTrack() {
			this.activeSession = pauseXichengTrackSession()
		},
		resumeTrack() {
			this.activeSession = resumeXichengTrackSession()
		},
		endTrack() {
			this.activeSession = endXichengTrackSession()
			appendXichengMaterialEvent({
				eventType: 'track',
				title: '结束记录',
				summary: '本次前台轨迹记录已结束，可进入游记生成。'
			})
			this.refresh()
		},
		addRemark() {
			const text = this.remarkText.trim()
			if (!text) return
			appendXichengMaterialEvent({
				eventType: 'remark',
				title: '用户备注',
				summary: text
			})
			this.remarkText = ''
			this.refresh()
		},
		openTravelogue() {
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?routeId=${encodeURIComponent(this.routeId)}`
			})
		}
	}
}
</script>

<style scoped>
.material-box {
	min-height: 100vh;
	padding: 36rpx 28rpx 48rpx;
	box-sizing: border-box;
	background: #F7F5EE;
	color: #172B4D;
}

.hero,
.remark-card,
.timeline-item {
	padding: 28rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	box-shadow: 0 12rpx 36rpx rgba(31, 41, 51, 0.08);
}

.eyebrow,
.subtitle,
.timeline-desc {
	display: block;
	font-size: 24rpx;
	line-height: 1.6;
	color: #667085;
}

.title {
	display: block;
	margin-top: 10rpx;
	font-size: 38rpx;
	font-weight: 700;
}

.state-row,
.control-row {
	display: flex;
	gap: 16rpx;
	margin-top: 24rpx;
}

.state-row text,
.mini-button {
	flex: 1;
	height: 64rpx;
	line-height: 64rpx;
	border-radius: 8rpx;
	background: #EEF5F1;
	color: #1F6E5A;
	font-size: 24rpx;
	text-align: center;
}

.remark-card {
	display: flex;
	gap: 16rpx;
	margin-top: 24rpx;
}

.remark-input {
	flex: 1;
	height: 72rpx;
	padding: 0 18rpx;
	border-radius: 8rpx;
	background: #F2F4F7;
	box-sizing: border-box;
	font-size: 26rpx;
}

.primary-button,
.bottom-button {
	border-radius: 8rpx;
	background: #1F6E5A;
	color: #FFFFFF;
}

.primary-button {
	width: 160rpx;
	height: 72rpx;
	line-height: 72rpx;
	font-size: 24rpx;
}

.timeline {
	margin-top: 24rpx;
}

.timeline-item {
	margin-top: 18rpx;
}

.timeline-type {
	font-size: 22rpx;
	color: #1F6E5A;
}

.timeline-title {
	display: block;
	margin-top: 8rpx;
	font-size: 30rpx;
	font-weight: 700;
}

.bottom-button {
	margin-top: 28rpx;
	height: 82rpx;
	line-height: 82rpx;
}
</style>
