<template>
	<view class="xicheng-works xicheng-designed-page xicheng-bottom-safe">
		<view class="topbar">
			<view class="topbar-button" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="topbar-title">我的作品</text>
			<view class="topbar-button" @click="openShare">
				<xicheng-icon name="edit" variant="plain" :size="21" />
			</view>
		</view>

		<view class="status-strip">
			<view class="status-card xicheng-paper-card">
				<text class="status-value">{{ pendingCount }}</text>
				<text class="status-label">审核中</text>
			</view>
			<view class="status-card xicheng-paper-card">
				<text class="status-value">{{ rejectedCount }}</text>
				<text class="status-label">需修改</text>
			</view>
			<view class="status-card xicheng-paper-card">
				<text class="status-value">{{ approvedCount }}</text>
				<text class="status-label">已发布</text>
			</view>
		</view>

		<view class="works-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">作品审核状态</text>
				<text class="section-badge">{{ workItems.length }} 条</text>
			</view>
			<view v-if="workItems.length > 0" class="work-list">
				<view v-for="item in workItems" :key="item.id" class="work-row">
					<xicheng-icon :name="item.icon" :variant="item.status === '需修改' ? 'soft' : 'primary'" :size="20" />
					<view class="work-copy">
						<text class="work-title">{{ item.title }}</text>
						<text class="work-desc">{{ item.desc }}</text>
					</view>
					<text class="work-status">{{ item.status }}</text>
				</view>
			</view>
			<text v-else class="empty-copy">暂无审核作品。生成分享海报或 PDF 纪念册后，可在这里查看审核进度。</text>
			<button class="ghost-button xicheng-secondary-action" @click="openShare">继续编辑</button>
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
			reviewSubmissions: [],
			shareArtifacts: []
		}
	},
	computed: {
		workItems() {
			const reviews = this.reviewSubmissions.map((item, index) => ({
				id: item.reviewId || `review-${index}`,
				icon: 'source',
				title: '西城游记审核包',
				desc: `海报 ${item.posterStatus || '待生成'} · PDF ${item.pdfStatus || '待生成'}`,
				status: item.reviewStatus || '审核中'
			}))
			const assets = this.shareArtifacts.map((item, index) => ({
				id: item.artifactId || `asset-${index}`,
				icon: item.assetType === 'pdf' ? 'source' : 'travelogue',
				title: item.assetLabel || '分享作品',
				desc: item.templateCode || '本地分享预览',
				status: item.reviewStatus || '审核中'
			}))
			return [...reviews, ...assets].slice(0, 10)
		},
		pendingCount() {
			return this.workItems.filter(item => item.status === this.region.reviewStatus.pending || item.status === '审核中').length
		},
		rejectedCount() {
			return this.workItems.filter(item => item.status === this.region.reviewStatus.rejected || item.status === '需修改').length
		},
		approvedCount() {
			return this.workItems.filter(item => item.status === this.region.reviewStatus.approved || item.status === '已发布').length
		}
	},
	onShow() {
		this.reviewSubmissions = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.reviewStorageKey))
		this.shareArtifacts = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey))
	},
	methods: {
		openShare() {
			uni.navigateTo({ url: '/pages/xicheng/share/share' })
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
.xicheng-works {
	min-height: 100vh;
	padding: 24rpx 30rpx 44rpx;
	box-sizing: border-box;
}
.topbar,
.section-head,
.status-strip,
.work-row {
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
.section-title,
.status-value,
.work-title {
	font-weight: 800;
	color: #102F29;
}
.topbar-title {
	font-size: 34rpx;
}
.status-strip {
	margin-top: 24rpx;
}
.status-card {
	flex: 1;
	padding: 24rpx;
	border-radius: 28rpx;
}
.status-value,
.status-label {
	display: block;
}
.status-value {
	font-size: 38rpx;
}
.status-label,
.section-badge,
.work-desc,
.empty-copy {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.45;
	color: #746F68;
}
.works-card {
	margin-top: 24rpx;
	padding: 30rpx;
	border-radius: 34rpx;
}
.section-title {
	font-size: 32rpx;
}
.section-badge {
	font-weight: 700;
	color: #B5945E;
}
.work-list {
	display: grid;
	gap: 18rpx;
	margin-top: 24rpx;
}
.work-row {
	padding: 18rpx 0;
	border-bottom: 1rpx solid rgba(181, 148, 94, 0.18);
}
.work-copy {
	flex: 1;
	min-width: 0;
}
.work-title {
	display: block;
	font-size: 28rpx;
}
.work-status {
	font-size: 24rpx;
	font-weight: 700;
	color: #173F35;
	white-space: nowrap;
}
.works-card button {
	margin-top: 24rpx;
}
</style>
