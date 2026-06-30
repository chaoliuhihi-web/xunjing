<template>
	<view class="xicheng-ops-report xicheng-designed-page xicheng-bottom-safe">
		<view class="topbar">
			<view class="topbar-button" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="topbar-title">运营报告</text>
			<view class="topbar-button" @click="refreshReport">
				<xicheng-icon name="refresh" variant="plain" :size="21" />
			</view>
		</view>

		<view class="report-hero xicheng-paper-card">
			<text class="report-kicker">xicheng-city-ops-report-v1</text>
			<text class="report-title">西城试运营日报</text>
			<text class="report-desc">只展示汇总数据和审核安全状态，不展示用户隐私明细。</text>
		</view>

		<view class="metric-grid">
			<view v-for="metric in metrics" :key="metric.label" class="metric-card xicheng-paper-card">
				<text class="metric-value">{{ metric.value }}</text>
				<text class="metric-label">{{ metric.label }}</text>
			</view>
		</view>

		<view class="ranking-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">热门 POI</text>
				<text class="section-badge">汇总</text>
			</view>
			<view v-if="hotPois.length > 0" class="ranking-list">
				<view v-for="poi in hotPois" :key="poi.poiName" class="ranking-row">
					<xicheng-icon name="location" variant="primary" :size="18" />
					<text>{{ poi.poiName }}</text>
					<text>{{ poi.count }}</text>
				</view>
			</view>
			<text v-else class="empty-copy">暂无足够素材形成热点排行。</text>
		</view>

		<view class="ranking-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">审核安全</text>
				<text class="section-badge">{{ sourceReadinessStatus }}</text>
			</view>
			<text class="empty-copy">无已审核来源、BLOCKED 和来源服务不可用会进入运营复核，不进入公开分享。</text>
		</view>
	</view>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'

const safeArray = value => Array.isArray(value) ? value : []

export default {
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			materials: [],
			shareArtifacts: [],
			routeCheckins: [],
			reviewSubmissions: []
		}
	},
	computed: {
		metrics() {
			return [
				{ label: '识别素材', value: this.materials.length },
				{ label: '路线打卡', value: this.routeCheckins.length },
				{ label: '分享作品', value: this.shareArtifacts.length },
				{ label: '审核提交', value: this.reviewSubmissions.length }
			]
		},
		hotPois() {
			return this.createHotPoiRanking()
		},
		sourceReadinessStatus() {
			const blocked = this.materials.some(item => item.safetyStatus === 'BLOCKED' || item.sourceCount === 0)
			return blocked ? 'SOURCE_REVIEW_REQUIRED' : 'SOURCE_READY'
		}
	},
	onShow() {
		this.refreshReport()
	},
	methods: {
		refreshReport() {
			this.materials = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey))
			this.shareArtifacts = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey))
			this.routeCheckins = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.checkinStorageKey))
			this.reviewSubmissions = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.reviewStorageKey))
		},
		createHotPoiRanking() {
			const counter = new Map()
			;[...this.materials, ...this.routeCheckins].forEach(item => {
				const poiName = item && item.poiName ? item.poiName : ''
				if (!poiName) return
				counter.set(poiName, (counter.get(poiName) || 0) + 1)
			})
			return Array.from(counter.entries())
				.map(([poiName, count]) => ({ poiName, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 5)
		},
		goBack() {
			const pages = getCurrentPages()
			if (pages.length <= 1) {
				uni.reLaunch({ url: '/pages/xicheng/home/home' })
				return
			}
			uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/xicheng/home/home' }) })
		}
	}
}
</script>

<style scoped>
.xicheng-ops-report {
	min-height: 100vh;
	padding: 24rpx 30rpx 44rpx;
	box-sizing: border-box;
}
.topbar,
.section-head,
.ranking-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}
.topbar {
	height: 72rpx;
}
.topbar-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60rpx;
	height: 60rpx;
}
.topbar-title,
.report-title,
.metric-value,
.section-title {
	font-weight: 800;
	color: #102F29;
}
.topbar-title {
	font-size: 34rpx;
}
.report-hero,
.ranking-card {
	margin-top: 24rpx;
	padding: 30rpx;
	border-radius: 34rpx;
}
.report-kicker,
.section-badge {
	font-size: 22rpx;
	font-weight: 700;
	color: #B5945E;
}
.report-title {
	display: block;
	margin-top: 14rpx;
	font-size: 44rpx;
}
.report-desc,
.metric-label,
.empty-copy {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.5;
	color: #746F68;
}
.metric-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
	margin-top: 24rpx;
}
.metric-card {
	padding: 24rpx;
	border-radius: 28rpx;
}
.metric-value {
	display: block;
	font-size: 40rpx;
}
.section-title {
	font-size: 32rpx;
}
.ranking-list {
	display: grid;
	gap: 16rpx;
	margin-top: 22rpx;
}
.ranking-row {
	padding: 18rpx 0;
	border-bottom: 1rpx solid rgba(181, 148, 94, 0.18);
	font-size: 26rpx;
	color: #173F35;
}
</style>
