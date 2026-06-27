<template>
	<view class="ops-report">
		<view class="hero">
			<text class="eyebrow">城市运营报告</text>
			<text class="title">{{ report.title }}</text>
			<text class="subtitle">面向西城试运营，聚合访问量、识别量、路线完成、作品数、分享数和误触发。</text>
		</view>

		<view class="metric-grid">
			<view v-for="metric in report.metrics" :key="metric.label" class="metric-card">
				<text class="metric-label">{{ metric.label }}</text>
				<text class="metric-value">{{ metric.value }}</text>
			</view>
		</view>

		<view class="section-card">
			<text class="section-title">运营建议</text>
			<text class="section-body">{{ report.suggestion }}</text>
		</view>

		<view class="section-card">
			<text class="section-title">作品审核</text>
			<view class="row">
				<text>待审核作品</text>
				<text>{{ pendingWorksText }}</text>
			</view>
			<view class="row">
				<text>审核动作</text>
				<text>游记草稿提交后进入 pending</text>
			</view>
		</view>

		<view class="section-card">
			<text class="section-title">分享海报</text>
			<view class="row">
				<text>分享转化</text>
				<text>{{ shareConversionText }}</text>
			</view>
			<view class="row">
				<text>cityOpsReport</text>
				<text>{{ report.cityOpsReport ? 'enabled' : 'disabled' }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { getXichengCityOpsReportPreview } from '@/request/xunjing/travelogue.js'

const findMetricValue = (metrics = [], label = '') => {
	const metric = metrics.find(item => item.label === label)
	return metric ? Number(metric.value) || 0 : 0
}

export default {
	data() {
		return {
			report: getXichengCityOpsReportPreview()
		}
	},
	computed: {
		pendingWorksText() {
			const works = findMetricValue(this.report.metrics, '作品数')
			return `${works} 个作品进入作品审核池`
		},
		shareConversionText() {
			const shares = findMetricValue(this.report.metrics, '分享数')
			const works = findMetricValue(this.report.metrics, '作品数')
			if (!works) return '暂无作品'
			return `${Math.round((shares / works) * 100)}%`
		}
	}
}
</script>

<style scoped>
.ops-report {
	min-height: 100vh;
	padding: 36rpx 28rpx 48rpx;
	box-sizing: border-box;
	background: #F7F5EE;
	color: #172B4D;
}

.hero,
.metric-card,
.section-card {
	padding: 30rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	box-shadow: 0 12rpx 36rpx rgba(31, 41, 51, 0.08);
}

.eyebrow,
.subtitle,
.metric-label,
.section-body {
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

.subtitle {
	margin-top: 12rpx;
}

.metric-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 24rpx;
}

.metric-value {
	display: block;
	margin-top: 8rpx;
	font-size: 42rpx;
	font-weight: 700;
	color: #1F6E5A;
}

.section-card {
	margin-top: 24rpx;
}

.section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
}

.section-body {
	margin-top: 14rpx;
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
	text-align: right;
}
</style>
