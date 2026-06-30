<template>
	<view class="xicheng-share xicheng-designed-page xicheng-bottom-safe">
		<view class="topbar">
			<view class="topbar-button" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="topbar-title">分享纪念</text>
			<view class="topbar-button" @click="openWorks">
				<xicheng-icon name="mine" variant="plain" :size="21" />
			</view>
		</view>

		<view class="poster-card xicheng-paper-card">
			<image class="poster-bg" :src="sharePosterBackground" mode="aspectFill" />
			<view class="poster-copy">
				<text class="poster-kicker">share-poster-background.jpg</text>
				<text class="poster-title">{{ region.sharePoster.title }}</text>
				<text class="poster-desc">{{ posterSubtitle }}</text>
			</view>
		</view>

		<view class="asset-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">纪念产物</text>
				<text class="section-badge">{{ shareArtifacts.length }} 个</text>
			</view>
			<view class="asset-grid">
				<view class="asset-tile" @click="createShareArtifact('poster')">
					<xicheng-icon name="travelogue" variant="primary" :size="22" />
					<text class="asset-title">分享海报</text>
					<text class="asset-desc">适合朋友圈和活动群</text>
				</view>
				<view class="asset-tile" @click="createShareArtifact('pdf')">
					<xicheng-icon name="source" variant="primary" :size="22" />
					<text class="asset-title">PDF 纪念册</text>
					<text class="asset-desc">保留路线、来源与任务</text>
				</view>
			</view>
		</view>

		<view class="privacy-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">隐私与审核</text>
				<text class="section-badge">待审核 · 未公开</text>
			</view>
			<text class="privacy-copy">分享前只生成本地预览；精确定位、照片路径和原始素材只进入本机审核包，不默认公开。</text>
			<button class="primary-button xicheng-primary-action" @click="submitReview">提交审核</button>
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
			shareArtifacts: [],
			reviewSubmissions: []
		}
	},
	computed: {
		sharePosterBackground() {
			return this.region.visualAssets.sharePosterBackground || '/static/xicheng/share-poster-background.jpg'
		},
		posterSubtitle() {
			return this.region.sharePoster.subtitle || '生成可审核的西城纪念分享'
		}
	},
	onShow() {
		this.shareArtifacts = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey))
		this.reviewSubmissions = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.reviewStorageKey))
	},
	methods: {
		createShareArtifact(assetType) {
			const createdAt = new Date().toISOString()
			const artifact = {
				artifactId: `share-${assetType}-${Date.now()}`,
				assetType,
				assetLabel: assetType === 'pdf' ? 'PDF 纪念册' : '分享海报',
				templateCode: assetType === 'pdf' ? 'xicheng-memorial-pdf-v1' : 'xicheng-share-poster-v1',
				backgroundImage: this.sharePosterBackground,
				stampImage: this.region.visualAssets.passportStamp,
				reviewStatus: this.region.reviewStatus.pending,
				publishStatus: 'private',
				createdAt
			}
			this.shareArtifacts = [artifact, ...this.shareArtifacts].slice(0, 8)
			uni.setStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey, this.shareArtifacts)
			uni.showToast({ title: `${artifact.assetLabel}已生成`, icon: 'none' })
		},
		submitReview() {
			const reviewPayload = {
				reviewId: `review-${Date.now()}`,
				reviewStatus: this.region.reviewStatus.pending,
				posterStatus: this.shareArtifacts.some(item => item.assetType === 'poster') ? '已生成' : '待生成',
				pdfStatus: this.shareArtifacts.some(item => item.assetType === 'pdf') ? '已生成' : '待生成',
				submittedAt: new Date().toISOString()
			}
			this.reviewSubmissions = [reviewPayload, ...this.reviewSubmissions].slice(0, 8)
			uni.setStorageSync(XICHENG_REGION_CONFIG.reviewStorageKey, this.reviewSubmissions)
			uni.navigateTo({ url: '/pages/xicheng/works/works' })
		},
		openWorks() {
			uni.navigateTo({ url: '/pages/xicheng/works/works' })
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
.xicheng-share {
	min-height: 100vh;
	padding: 24rpx 30rpx 44rpx;
	box-sizing: border-box;
}
.topbar,
.section-head {
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
.poster-title,
.asset-title {
	font-weight: 800;
	color: #102F29;
}
.topbar-title {
	font-size: 34rpx;
}
.poster-card,
.asset-card,
.privacy-card {
	margin-top: 24rpx;
	padding: 28rpx;
	border-radius: 34rpx;
}
.poster-card {
	position: relative;
	min-height: 430rpx;
	overflow: hidden;
}
.poster-bg {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	opacity: 0.72;
}
.poster-copy {
	position: relative;
	z-index: 1;
	width: 64%;
}
.poster-kicker,
.section-badge {
	font-size: 22rpx;
	font-weight: 700;
	color: #B5945E;
}
.poster-title {
	display: block;
	margin-top: 18rpx;
	font-size: 44rpx;
	line-height: 1.2;
}
.poster-desc,
.asset-desc,
.privacy-copy {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #746F68;
}
.asset-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 18rpx;
	margin-top: 24rpx;
}
.asset-tile {
	display: grid;
	gap: 12rpx;
	padding: 22rpx;
	border-radius: 28rpx;
	background: rgba(23, 63, 53, 0.08);
}
.asset-title {
	font-size: 28rpx;
}
.privacy-card button {
	margin-top: 24rpx;
}
</style>
