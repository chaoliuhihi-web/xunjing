<template>
	<view class="xicheng-works xicheng-designed-page xicheng-bottom-safe">
		<view class="topbar">
			<view class="topbar-button" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="topbar-title">我的游记</text>
			<view class="topbar-button" @click="openTravelogue">
				<xicheng-icon name="edit" variant="plain" :size="21" />
			</view>
		</view>

		<view class="profile-card xicheng-paper-card">
			<image class="profile-avatar" :src="region.companionAvatar" mode="aspectFit" />
			<view class="profile-copy">
				<text class="profile-kicker">登录信息</text>
				<text class="profile-name">西城旅伴用户</text>
				<text class="profile-desc">游客模式可先保存本机游记，登录后同步我的游记、草稿和收藏。</text>
			</view>
			<button class="profile-login-button" @click="openLogin">登录</button>
		</view>

		<view class="library-overview">
			<view class="library-stat xicheng-paper-card">
				<text class="library-stat-value">{{ travelogueItems.length }}</text>
				<text class="library-stat-label">我的游记</text>
			</view>
			<view class="library-stat xicheng-paper-card">
				<text class="library-stat-value">{{ draftCount }}</text>
				<text class="library-stat-label">草稿</text>
			</view>
			<view class="library-stat xicheng-paper-card">
				<text class="library-stat-value">{{ favoriteCount }}</text>
				<text class="library-stat-label">收藏</text>
			</view>
		</view>

		<view class="personal-entry-card xicheng-paper-card" @click="openFootprint">
			<view>
				<text class="personal-entry-title">西城足迹</text>
				<text class="personal-entry-copy">查看识别、路线记录和照片素材，继续生成游记。</text>
			</view>
			<xicheng-icon name="next" variant="plain" :size="22" />
		</view>

		<view class="works-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">我的游记</text>
				<text class="section-badge">{{ travelogueItems.length }} 篇</text>
			</view>
			<view v-if="travelogueItems.length > 0" class="work-list">
				<xicheng-keepsake-travelogue-card
					v-for="item in travelogueItems"
					:key="item.id"
					:item="item"
					:default-thumb="getWorkThumb(item)"
					@open="openWorkItem"
					@read="openTravelogueReaderPage"
					@share="openSharePage"
					@print="openPdfPrintPage"
				/>
			</view>
			<view v-else class="works-empty-state">
				<text class="empty-copy">暂无游记。完成一次识别或路线记录后，可以生成一篇西城长文游记。</text>
				<button class="empty-action-card" @click="openTravelogue">去生成游记</button>
			</view>
			<button class="ghost-button xicheng-secondary-action" @click="openTravelogue">继续编辑</button>
		</view>

		<view class="privacy-card xicheng-paper-card">
			<view>
				<text class="privacy-title">隐私授权</text>
				<text class="privacy-copy">精确轨迹默认隐藏；发布前可单独设置正文、地点、照片和问答记录的公开范围。</text>
			</view>
			<xicheng-icon name="locked" variant="plain" :size="23" />
		</view>

		<view class="works-tip-card xicheng-paper-card">
			<image class="works-tip-avatar" :src="region.companionAvatar" mode="aspectFit" />
			<view class="works-tip-bubble">
				<text class="works-tip-title">小京提示</text>
				<text class="works-tip-copy">我的页面只放账号、游记和隐私设置，运营玩法会独立放在专门页面。</text>
			</view>
		</view>
	</view>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import XichengKeepsakeTravelogueCard from '@/components/xicheng/XichengKeepsakeTravelogueCard.vue'

const safeArray = value => Array.isArray(value) ? value : []

export default {
	components: {
		XichengKeepsakeTravelogueCard
	},
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			shareArtifacts: [],
			cachedDraft: null
		}
	},
	computed: {
		travelogueItems() {
			const draft = this.cachedDraft && this.cachedDraft.draft ? [{
				id: 'local-draft',
				assetType: 'draft',
				title: this.cachedDraft.editableTravelogueTitle || '在白塔下遇见西城',
				desc: '本机草稿 · 可继续编辑成长文游记',
				status: '草稿'
			}] : []
			const assets = this.shareArtifacts.map((item, index) => ({
				id: item.artifactId || `asset-${index}`,
				assetType: item.assetType,
				templateCode: item.templateCode,
				icon: item.assetType === 'pdf' ? 'source' : 'travelogue',
				title: item.title || item.assetLabel || '西城纪念游记',
				desc: item.templateCode || '已保存的游记素材',
				status: item.assetType === 'pdf' ? 'PDF' : '已保存'
			}))
			return [...draft, ...assets].slice(0, 10)
		},
		draftCount() {
			return this.cachedDraft && this.cachedDraft.draft ? 1 : 0
		},
		favoriteCount() {
			return 0
		}
	},
	onShow() {
		this.shareArtifacts = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey))
		this.cachedDraft = uni.getStorageSync(XICHENG_REGION_CONFIG.journeyStorageKey) || null
	},
	methods: {
		openTravelogue() {
			uni.navigateTo({ url: '/pages/xicheng/travelogue/travelogue?mode=edit' })
		},
		openWorkItem(item = {}) {
			if (item.assetType === 'pdf') {
				this.openPdfPrintPage()
				return
			}
			this.openTravelogueReaderPage()
		},
		openTravelogueReaderPage() {
			uni.navigateTo({ url: '/pages/xicheng/travelogue-reader/travelogue-reader' })
		},
		openPdfPrintPage() {
			uni.navigateTo({ url: '/pages/xicheng/pdf-print/pdf-print' })
		},
		openSharePage() {
			uni.navigateTo({ url: '/pages/xicheng/share/share' })
		},
		openLogin() {
			uni.navigateTo({ url: '/pagesLogin/auth/auth' })
		},
		openFootprint() {
			uni.navigateTo({ url: '/pages/xicheng/footprint/footprint' })
		},
		getWorkThumb(item = {}) {
			if (item.assetType === 'pdf') return this.region.visualAssets.passportStamp
			if (item.assetType === 'draft') return this.region.visualAssets.heroLandmark
			return this.region.visualAssets.sharePosterBackground || this.region.visualAssets.heroLandmark
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
.work-title {
	font-weight: 800;
	color: #102F29;
}
.topbar-title {
	font-size: 34rpx;
}

.profile-card {
	display: grid;
	grid-template-columns: 112rpx 1fr auto;
	align-items: center;
	gap: 20rpx;
	margin-top: 20rpx;
	padding: 24rpx;
	border-radius: 32rpx;
	box-sizing: border-box;
}

.profile-avatar {
	width: 112rpx;
	height: 124rpx;
	object-fit: contain;
}

.profile-copy {
	min-width: 0;
}

.profile-kicker,
.profile-name,
.profile-desc,
.library-stat-value,
.library-stat-label,
.personal-entry-title,
.personal-entry-copy,
.privacy-title,
.privacy-copy {
	display: block;
}

.profile-kicker {
	font-size: 22rpx;
	line-height: 1.2;
	color: #B5945E;
	font-weight: 800;
}

.profile-name {
	margin-top: 8rpx;
	font-size: 32rpx;
	line-height: 1.22;
	color: #102F29;
	font-weight: 800;
}

.profile-desc {
	margin-top: 8rpx;
	font-size: 23rpx;
	line-height: 1.45;
	color: rgba(16, 47, 41, 0.62);
}

.profile-login-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 112rpx;
	height: 64rpx;
	margin: 0;
	padding: 0;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF8EA;
	font-size: 24rpx;
	line-height: 64rpx;
	font-weight: 800;
}

.profile-login-button::after {
	border: 0;
}

.library-overview {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 20rpx;
}

.library-stat {
	min-height: 136rpx;
	padding: 22rpx 14rpx;
	border-radius: 26rpx;
	text-align: center;
	box-sizing: border-box;
}

.library-stat-value {
	font-size: 38rpx;
	line-height: 1;
	font-weight: 900;
	color: #173F35;
}

.library-stat-label {
	margin-top: 12rpx;
	font-size: 23rpx;
	line-height: 1.2;
	color: rgba(16, 47, 41, 0.62);
}

.personal-entry-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
	margin-top: 20rpx;
	padding: 24rpx;
	border-radius: 28rpx;
	box-sizing: border-box;
}

.personal-entry-title {
	font-size: 30rpx;
	line-height: 1.3;
	font-weight: 800;
	color: #102F29;
}

.personal-entry-copy {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.5;
	color: rgba(16, 47, 41, 0.62);
}

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
.work-action-row {
	display: flex;
	gap: 12rpx;
	margin-top: 14rpx;
}
.mini-work-action {
	min-height: 52rpx;
	margin: 0;
	padding: 0 18rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.22);
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.9);
	color: #173F35;
	font-size: 22rpx;
	line-height: 52rpx;
	font-weight: 800;
}
.mini-work-action-primary {
	background: #173F35;
	color: #FFF8EA;
}
.mini-work-action::after {
	border: 0;
}
.work-status {
	font-size: 24rpx;
	font-weight: 700;
	color: #173F35;
	white-space: nowrap;
}

.works-empty-state {
	margin-top: 20rpx;
}

.empty-action-card {
	min-height: 86rpx;
	margin: 18rpx 0 0;
	padding: 0 28rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.22);
	border-radius: 20rpx;
	background: rgba(255, 252, 246, 0.88);
	color: #173F35;
	font-size: 24rpx;
	line-height: 86rpx;
	font-weight: 800;
}

.empty-action-card::after {
	border: 0;
}

.works-card button {
	margin-top: 24rpx;
}
.works-card .work-action-row button {
	margin-top: 0;
}

.privacy-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	margin-top: 24rpx;
	padding: 26rpx 28rpx;
	border-radius: 30rpx;
}

.privacy-title {
	font-size: 29rpx;
	line-height: 1.3;
	font-weight: 800;
	color: #102F29;
}

.privacy-copy {
	margin-top: 8rpx;
	font-size: 23rpx;
	line-height: 1.48;
	color: #746F68;
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
