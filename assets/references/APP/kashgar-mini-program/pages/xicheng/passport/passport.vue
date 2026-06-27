<template>
	<view class="passport">
		<view class="hero">
			<text class="eyebrow">路线护照</text>
			<text class="title">{{ route.title }}</text>
			<text class="subtitle">完成度 {{ completionPercent }}%，继续完成打卡任务、亲子研学任务和徽章。</text>
		</view>

		<view class="section-card">
			<text class="section-title">打卡任务</text>
			<view v-for="point in route.checkinPoints" :key="point.poiCode" class="row">
				<text>{{ point.poiName }}</text>
				<text>{{ point.completed ? '已完成' : '待打卡' }}</text>
			</view>
		</view>

		<view class="section-card">
			<text class="section-title">亲子研学任务</text>
			<view v-for="task in route.passportTasks" :key="task.taskId" class="row">
				<text>{{ task.title }}</text>
				<text>{{ task.completed ? '已完成' : '待完成' }}</text>
			</view>
		</view>

		<view class="section-card">
			<text class="section-title">徽章</text>
			<view class="badge-grid">
				<view v-for="badge in route.badges" :key="badge.badgeId" class="badge">
					<text>{{ badge.title }}</text>
					<text>{{ badge.status === 'earned' ? '已获得' : '待解锁' }}</text>
				</view>
			</view>
		</view>

		<view class="section-card">
			<text class="section-title">分享海报 / 作品审核 / 城市运营报告</text>
			<view v-for="metric in report.metrics" :key="metric.label" class="row">
				<text>{{ metric.label }}</text>
				<text>{{ metric.value }}</text>
			</view>
			<text class="suggestion">{{ report.suggestion }}</text>
		</view>
	</view>
</template>

<script>
import { XICHENG_DEFAULT_ROUTE } from '@/config/regions/xicheng.js'
import { getXichengRoutePassport } from '@/request/xunjing/route.js'
import { getXichengCityOpsReportPreview } from '@/request/xunjing/travelogue.js'

export default {
	data() {
		return {
			route: XICHENG_DEFAULT_ROUTE,
			report: getXichengCityOpsReportPreview()
		}
	},
	computed: {
		completionPercent() {
			const items = [
				...(this.route.checkinPoints || []),
				...(this.route.passportTasks || [])
			]
			if (items.length === 0) return 0
			const done = items.filter(item => item.completed).length
			return Math.round((done / items.length) * 100)
		}
	},
	async onLoad(options = {}) {
		const routeId = decodeURIComponent(options.routeId || XICHENG_DEFAULT_ROUTE.routeId)
		this.route = await getXichengRoutePassport({ routeId })
	}
}
</script>

<style scoped>
.passport {
	min-height: 100vh;
	padding: 36rpx 28rpx 48rpx;
	box-sizing: border-box;
	background: #F7F5EE;
	color: #172B4D;
}

.hero,
.section-card {
	padding: 30rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	box-shadow: 0 12rpx 36rpx rgba(31, 41, 51, 0.08);
}

.section-card {
	margin-top: 24rpx;
}

.eyebrow,
.subtitle,
.suggestion {
	display: block;
	font-size: 24rpx;
	line-height: 1.6;
	color: #667085;
}

.title {
	display: block;
	margin-top: 10rpx;
	font-size: 40rpx;
	font-weight: 700;
}

.section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
}

.row {
	display: flex;
	justify-content: space-between;
	gap: 20rpx;
	padding: 20rpx 0;
	border-bottom: 1px solid #E4E7EC;
	font-size: 26rpx;
}

.row text:last-child {
	color: #1F6E5A;
}

.badge-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 20rpx;
}

.badge {
	min-height: 108rpx;
	padding: 16rpx;
	border-radius: 8rpx;
	background: #EEF5F1;
	font-size: 24rpx;
	text-align: center;
	box-sizing: border-box;
}

.badge text {
	display: block;
}

.badge text:last-child {
	margin-top: 8rpx;
	color: #1F6E5A;
}

.suggestion {
	margin-top: 20rpx;
}
</style>
