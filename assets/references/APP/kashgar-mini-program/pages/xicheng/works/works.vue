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

		<view class="works-reference-hero">
			<text class="works-hero-title">审核状态总览</text>
			<text class="works-hero-subtitle">公开作品只展示已审核内容，隐私安全有保障。</text>
		</view>

		<view class="status-strip">
			<view class="status-card status-card-approved xicheng-paper-card">
				<xicheng-icon name="check" variant="primary" :size="20" />
				<text class="status-label">已发布</text>
				<text class="status-value">{{ approvedCount }}</text>
				<text class="status-copy">已通过审核并公开</text>
			</view>
			<view class="status-card status-card-pending xicheng-paper-card">
				<xicheng-icon name="refresh" variant="primary" :size="20" />
				<text class="status-label">审核中</text>
				<text class="status-value">{{ pendingCount }}</text>
				<text class="status-copy">预计 24 小时内完成</text>
			</view>
			<view class="status-card status-card-rejected xicheng-paper-card">
				<xicheng-icon name="source" variant="soft" :size="20" />
				<text class="status-label">需修改</text>
				<text class="status-value">{{ rejectedCount }}</text>
				<text class="status-copy">未通过审核，需修改</text>
			</view>
		</view>

		<view class="works-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">作品审核状态</text>
				<text class="section-badge">{{ workItems.length }} 条</text>
			</view>
			<view v-if="workItems.length > 0" class="work-list">
				<view v-for="item in workItems" :key="item.id" class="work-row">
					<image class="work-thumb" :src="getWorkThumb(item)" mode="aspectFill" />
					<view class="work-copy">
						<view class="work-title-line">
							<text class="work-title">{{ item.title }}</text>
							<xicheng-icon name="edit" variant="plain" :size="15" />
						</view>
						<text class="work-desc">{{ item.desc }}</text>
						<view v-if="item.status === '需修改'" class="work-review-note">
							<text>含未核实资料，请修改后重新提交</text>
						</view>
						<view v-else-if="item.status === '审核中' || item.status === '待审核'" class="work-review-note work-review-note-pending">
							<text>AI 正在审核中，请耐心等待</text>
						</view>
					</view>
					<text class="work-status" :class="getStatusClass(item.status)">{{ item.status }}</text>
				</view>
			</view>
			<view v-else class="works-empty-state">
				<text class="empty-copy">暂无审核作品。生成分享海报或 PDF 纪念册后，可在这里查看审核进度。</text>
				<view class="work-empty-action-grid">
					<button class="empty-action-card" @click="openShare">生成分享海报</button>
					<button class="empty-action-card" @click="openShare">生成 PDF 纪念册</button>
					<button class="empty-action-card" @click="openShare">提交审核</button>
				</view>
			</view>
			<button class="ghost-button xicheng-secondary-action" @click="openShare">继续编辑</button>
		</view>

		<view class="works-tip-card xicheng-paper-card">
			<image class="works-tip-avatar" :src="region.companionAvatar" mode="aspectFit" />
			<view class="works-tip-bubble">
				<text class="works-tip-title">小京提示</text>
				<text class="works-tip-copy">公开作品只展示已审核内容，保护隐私和版权。</text>
			</view>
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
		getWorkThumb(item = {}) {
			if (item.assetType === 'pdf') return this.region.visualAssets.passportStamp
			return this.region.visualAssets.sharePosterBackground || this.region.visualAssets.heroLandmark
		},
		getStatusClass(status = '') {
			if (status === this.region.reviewStatus.rejected || status === '需修改') return 'work-status-rejected'
			if (status === this.region.reviewStatus.approved || status === '已发布') return 'work-status-approved'
			return 'work-status-pending'
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

.works-reference-hero {
	position: relative;
	margin-top: 20rpx;
	padding: 20rpx 0 6rpx 18rpx;
}

.works-reference-hero::before {
	content: "";
	position: absolute;
	left: 0;
	top: 24rpx;
	width: 8rpx;
	height: 42rpx;
	border-radius: 999rpx;
	background: #B5945E;
}

.works-reference-hero::after {
	content: "";
	position: absolute;
	right: 10rpx;
	top: -12rpx;
	width: 210rpx;
	height: 150rpx;
	background: radial-gradient(circle, rgba(181, 148, 94, 0.14), transparent 68%);
	pointer-events: none;
}

.works-hero-title,
.works-hero-subtitle {
	display: block;
}

.works-hero-title {
	font-size: 34rpx;
	font-weight: 800;
	color: #102F29;
}

.works-hero-subtitle {
	margin-top: 8rpx;
	font-size: 23rpx;
	line-height: 1.45;
	color: #746F68;
}

.status-strip {
	margin-top: 24rpx;
}
.status-card {
	flex: 1;
	display: grid;
	align-content: start;
	gap: 10rpx;
	min-height: 180rpx;
	padding: 24rpx 18rpx;
	border-radius: 28rpx;
}
.status-value,
.status-label {
	display: block;
}
.status-value {
	font-size: 38rpx;
}
.status-copy,
.status-label,
.section-badge,
.work-desc,
.empty-copy {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.45;
	color: #746F68;
}

.status-copy {
	margin-top: 0;
	font-size: 21rpx;
}

.status-card-approved {
	background: linear-gradient(180deg, rgba(243, 249, 242, 0.98), rgba(255, 252, 246, 0.94));
}

.status-card-pending {
	background: linear-gradient(180deg, rgba(252, 247, 235, 0.98), rgba(255, 252, 246, 0.94));
}

.status-card-rejected {
	background: linear-gradient(180deg, rgba(252, 239, 235, 0.98), rgba(255, 252, 246, 0.94));
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
	align-items: flex-start;
	padding: 18rpx 0;
	border-bottom: 1rpx solid rgba(181, 148, 94, 0.18);
}

.work-thumb {
	width: 142rpx;
	height: 164rpx;
	border-radius: 20rpx;
	background: rgba(23, 63, 53, 0.08);
	flex-shrink: 0;
}

.work-copy {
	flex: 1;
	min-width: 0;
}

.work-title-line {
	display: flex;
	align-items: center;
	gap: 10rpx;
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

.work-status-approved {
	color: #1F7A4C;
}

.work-status-pending {
	color: #9A7132;
}

.work-status-rejected {
	color: #A23E2A;
}

.work-review-note {
	margin-top: 14rpx;
	padding: 16rpx 18rpx;
	border-radius: 18rpx;
	background: rgba(162, 62, 42, 0.08);
	color: #8B2D21;
	font-size: 22rpx;
	line-height: 1.45;
}

.work-review-note-pending {
	background: rgba(181, 148, 94, 0.10);
	color: #8A5B1E;
}

.works-empty-state {
	margin-top: 20rpx;
}

.work-empty-action-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 18rpx;
}

.empty-action-card {
	min-height: 86rpx;
	margin: 0;
	padding: 0 12rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.22);
	border-radius: 20rpx;
	background: rgba(255, 252, 246, 0.88);
	color: #173F35;
	font-size: 22rpx;
	line-height: 1.25;
	font-weight: 800;
}

.empty-action-card::after {
	border: 0;
}

.works-card button {
	margin-top: 24rpx;
}

.works-tip-card {
	display: grid;
	grid-template-columns: 150rpx 1fr;
	align-items: end;
	gap: 18rpx;
	margin-top: 24rpx;
	padding: 20rpx 24rpx 0;
	border-radius: 30rpx;
	overflow: hidden;
}

.works-tip-avatar {
	width: 150rpx;
	height: 168rpx;
}

.works-tip-bubble {
	align-self: center;
	padding: 20rpx 22rpx;
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.86);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
}

.works-tip-title,
.works-tip-copy {
	display: block;
}

.works-tip-title {
	font-size: 26rpx;
	font-weight: 800;
	color: #102F29;
}

.works-tip-copy {
	margin-top: 8rpx;
	font-size: 23rpx;
	line-height: 1.45;
	color: #746F68;
}
</style>
