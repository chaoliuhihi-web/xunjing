<template>
	<view class="route-detail">
		<view class="hero">
			<text class="eyebrow">今日推荐路线</text>
			<text class="title">{{ route.title }}</text>
			<text class="subtitle">{{ route.subtitle }}</text>
			<view class="meta-row">
				<text>{{ route.durationText }}</text>
				<text>{{ route.distanceText }}</text>
				<text>{{ route.theme }}</text>
			</view>
			<button class="primary-button" @click="startRecording">开始记录</button>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">路线护照</text>
				<text class="section-link" @click="openPassport">查看完成度</text>
			</view>
			<view v-for="point in route.checkinPoints" :key="point.poiCode" class="point-row">
				<view>
					<text class="point-name">{{ point.poiName }}</text>
					<text class="point-task">{{ point.task }}</text>
				</view>
				<button class="mini-button" @click="checkin(point)">打卡</button>
			</view>
		</view>

		<view class="section-card">
			<text class="section-title">亲子研学任务</text>
			<view v-for="task in route.passportTasks" :key="task.taskId" class="task-row">
				<text>{{ task.title }}</text>
				<text>{{ task.completed ? '已完成' : '待完成' }}</text>
			</view>
		</view>

		<view class="section-card">
			<text class="section-title">打卡徽章</text>
			<view class="badge-grid">
				<view v-for="badge in route.badges" :key="badge.badgeId" class="badge-card">
					<text class="badge-mark">{{ badge.status === 'earned' ? '已获' : '待解锁' }}</text>
					<text>{{ badge.title }}</text>
				</view>
			</view>
		</view>

		<view class="bottom-actions">
			<button class="ghost-button" @click="openMaterialBox">旅行素材盒</button>
			<button class="ghost-button" @click="openTravelogue">生成游记草稿</button>
		</view>
	</view>
</template>

<script>
import { XICHENG_DEFAULT_ROUTE } from '@/config/regions/xicheng.js'
import {
	getXichengRoutePassport,
	getXichengRouteRecommendation,
	submitXichengCheckin
} from '@/request/xunjing/route.js'
import {
	XICHENG_GENERATED_ROUTE_STORAGE_KEY
} from '@/request/xunjing/inspiration.js'
import {
	appendXichengMaterialEvent,
	startXichengTrackSession
} from '@/request/xunjing/track.js'

export default {
	data() {
		return {
			route: XICHENG_DEFAULT_ROUTE,
			poiCode: '',
			poiName: ''
		}
	},
	async onLoad(options = {}) {
		const routeId = decodeURIComponent(options.routeId || '')
		const source = decodeURIComponent(options.source || '')
		this.poiCode = decodeURIComponent(options.poiCode || XICHENG_DEFAULT_ROUTE.startPoiCode)
		this.poiName = decodeURIComponent(options.poiName || '')
		const generatedRoute = uni.getStorageSync(XICHENG_GENERATED_ROUTE_STORAGE_KEY) || {}
		if (generatedRoute.routeId && (generatedRoute.routeId === routeId || source === 'inspiration')) {
			this.route = {
				...XICHENG_DEFAULT_ROUTE,
				...generatedRoute,
				passportTasks: generatedRoute.passportTasks || XICHENG_DEFAULT_ROUTE.passportTasks,
				badges: generatedRoute.badges || XICHENG_DEFAULT_ROUTE.badges
			}
			this.poiCode = this.route.startPoiCode || this.poiCode
			return
		}
		this.route = await getXichengRouteRecommendation({
			poiCode: this.poiCode,
			poiName: this.poiName
		})
		const passport = await getXichengRoutePassport({ routeId: this.route.routeId })
		this.route = { ...this.route, ...passport }
	},
	methods: {
		async checkin(point = {}) {
			await submitXichengCheckin({
				routeId: this.route.routeId,
				poiCode: point.poiCode,
				taskId: point.taskId || ''
			})
			appendXichengMaterialEvent({
				eventType: 'checkin',
				title: `完成打卡：${point.poiName}`,
				poiCode: point.poiCode,
				poiName: point.poiName,
				summary: point.task
			})
			uni.showToast({ title: '已加入路线护照', icon: 'none' })
		},
		async startRecording() {
			const session = await startXichengTrackSession({
				routeId: this.route.routeId,
				startPoiCode: this.route.startPoiCode
			})
			appendXichengMaterialEvent({
				eventType: 'track',
				title: '轨迹记录已开始',
				poiCode: this.route.startPoiCode,
				poiName: this.poiName || '白塔寺',
				summary: `轨迹 ${session.trackSessionId} 已进入前台记录。`
			})
			this.openMaterialBox()
		},
		openMaterialBox() {
			uni.navigateTo({
				url: `/pages/xicheng/material-box/material-box?routeId=${encodeURIComponent(this.route.routeId)}`
			})
		},
		openTravelogue() {
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?routeId=${encodeURIComponent(this.route.routeId)}`
			})
		},
		openPassport() {
			uni.navigateTo({
				url: `/pages/xicheng/passport/passport?routeId=${encodeURIComponent(this.route.routeId)}`
			})
		}
	}
}
</script>

<style scoped>
.route-detail {
	min-height: 100vh;
	padding: 36rpx 28rpx 48rpx;
	box-sizing: border-box;
	background: #F7F5EE;
	color: #172B4D;
}

.hero,
.section-card {
	padding: 32rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	box-shadow: 0 12rpx 36rpx rgba(31, 41, 51, 0.08);
}

.section-card {
	margin-top: 24rpx;
}

.eyebrow,
.subtitle,
.point-task {
	display: block;
	font-size: 24rpx;
	line-height: 1.6;
	color: #667085;
}

.title {
	display: block;
	margin-top: 10rpx;
	font-size: 42rpx;
	font-weight: 700;
}

.subtitle {
	margin-top: 10rpx;
}

.meta-row,
.bottom-actions {
	display: flex;
	gap: 16rpx;
	margin-top: 24rpx;
}

.meta-row text {
	padding: 10rpx 14rpx;
	border-radius: 8rpx;
	background: #EEF5F1;
	font-size: 22rpx;
	color: #1F6E5A;
}

.primary-button,
.ghost-button,
.mini-button {
	border-radius: 8rpx;
}

.primary-button {
	margin-top: 28rpx;
	height: 82rpx;
	line-height: 82rpx;
	background: #1F6E5A;
	color: #FFFFFF;
}

.section-head,
.point-row,
.task-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
}

.section-title,
.point-name {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
}

.section-link {
	font-size: 24rpx;
	color: #1F6E5A;
}

.point-row,
.task-row {
	margin-top: 22rpx;
	padding-top: 22rpx;
	border-top: 1px solid #E4E7EC;
}

.task-row text:last-child {
	color: #1F6E5A;
}

.mini-button {
	min-width: 116rpx;
	height: 58rpx;
	line-height: 58rpx;
	background: #EEF5F1;
	color: #1F6E5A;
	font-size: 24rpx;
}

.badge-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 22rpx;
}

.badge-card {
	min-height: 112rpx;
	padding: 18rpx;
	border-radius: 8rpx;
	background: #F2F4F7;
	font-size: 24rpx;
	text-align: center;
}

.badge-mark {
	display: block;
	margin-bottom: 8rpx;
	color: #1F6E5A;
}

.bottom-actions .ghost-button {
	flex: 1;
	height: 76rpx;
	line-height: 76rpx;
	background: #E8ECE7;
	color: #1F6E5A;
}
</style>
