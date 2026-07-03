<template>
	<view class="xicheng-works xicheng-designed-page xicheng-bottom-safe">
		<view class="topbar">
			<view class="topbar-button" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="topbar-title">我的</text>
			<view class="topbar-button" @click="openTravelogue">
				<xicheng-icon name="edit" variant="plain" :size="21" />
			</view>
		</view>

		<view class="works-page-head">
			<view class="works-page-copy">
				<text class="works-page-kicker">西城记忆</text>
				<text class="works-page-title">我的游记</text>
			</view>
			<button class="works-manage-button" @click="openWorksManager">
				<xicheng-icon name="settings" variant="plain" :size="18" />
				<text>管理</text>
			</button>
		</view>

		<xicheng-works-profile-card
			:user-profile="userProfile"
			:library-stats="libraryStats"
			:companion-avatar="region.companionAvatar"
			@login="openLogin"
		/>

		<view class="works-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">我的游记</text>
				<text class="section-badge">查看全部游记</text>
			</view>
			<view class="library-filter-row">
				<button
					v-for="filter in libraryFilters"
					:key="filter.key"
					class="library-filter-chip"
					:class="{ active: selectedLibraryFilter === filter.key }"
					@click="selectLibraryFilter(filter.key)"
				>
					{{ filter.label }}
				</button>
			</view>
			<view v-if="filteredTravelogueItems.length > 0" class="work-list">
				<xicheng-keepsake-travelogue-card
					v-for="item in filteredTravelogueItems"
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
				<image class="works-empty-image" :src="region.visualAssets.heroLandmark" mode="aspectFill" />
				<text class="empty-copy">暂无游记。完成一次识别或路线记录后，可以生成一篇西城长文游记。</text>
				<button class="empty-action-card" @click="openTravelogue">去生成游记</button>
			</view>
			<button class="ghost-button xicheng-secondary-action" @click="openTravelogue">继续编辑</button>
		</view>

		<view class="account-shortcut-grid xicheng-paper-card">
			<view class="personal-entry-card account-shortcut" @click="openTravelogueMaterials">
				<xicheng-icon name="location" variant="plain" :size="28" />
				<text class="account-shortcut-title">游记素材</text>
				<text class="account-shortcut-desc">路线/照片/问答</text>
			</view>
			<view class="account-shortcut" @click="openLogin">
				<xicheng-icon name="mine" variant="plain" :size="28" />
				<text class="account-shortcut-title">账号资料</text>
				<text class="account-shortcut-desc">登录信息</text>
			</view>
			<view class="account-shortcut" @click="openPrivacyScopeSettings('material')">
				<xicheng-icon name="locked" variant="plain" :size="28" />
				<text class="account-shortcut-title">素材授权</text>
				<text class="account-shortcut-desc">照片与问答</text>
			</view>
			<view class="account-shortcut" @click="openPrivacyScopeSettings('public')">
				<xicheng-icon name="eye" variant="plain" :size="28" />
				<text class="account-shortcut-title">公开范围</text>
				<text class="account-shortcut-desc">轨迹默认隐藏</text>
			</view>
		</view>

		<xicheng-public-scope-settings data-scope-label="隐私授权" :items="publicScopeItems" @toggle="togglePublicScopeSetting" />

		<view class="works-tip-card xicheng-paper-card">
			<image class="works-tip-avatar" :src="region.companionAvatar" mode="aspectFit" />
			<view class="works-tip-bubble">
				<text class="works-tip-title">小京提示</text>
				<text class="works-tip-copy">我的页面只放账号、游记和隐私设置，运营玩法会独立放在专门页面。</text>
			</view>
		</view>

		<xicheng-main-tab-nav
			active-key="mine"
			:route-context="region"
		/>
	</view>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import XichengKeepsakeTravelogueCard from '@/components/xicheng/XichengKeepsakeTravelogueCard.vue'
import XichengMainTabNav from '@/components/xicheng/XichengMainTabNav.vue'
import XichengPublicScopeSettings from '@/components/xicheng/XichengPublicScopeSettings.vue'
import XichengWorksProfileCard from '@/components/xicheng/XichengWorksProfileCard.vue'

const safeArray = value => Array.isArray(value) ? value : []
const safeObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {}
const XICHENG_DEFAULT_PUBLIC_SCOPE_STATE = Object.freeze({
	hideExactLocation: true,
	approvedOnly: true,
	includeXiaojingSummary: true,
	publicBody: true,
	publicPlaces: true,
	publicPhotos: true,
	publicQaRecord: false
})
const normalizeWorksPublicScopeState = (settings = {}) => ({
	hideExactLocation: settings.hideExactLocation !== false,
	approvedOnly: settings.approvedOnly !== false,
	includeXiaojingSummary: settings.includeXiaojingSummary !== false,
	publicBody: settings.publicBody !== false,
	publicPlaces: settings.publicPlaces !== false,
	publicPhotos: settings.publicPhotos !== false,
	publicQaRecord: settings.publicQaRecord === true
})

export default {
	components: {
		XichengKeepsakeTravelogueCard,
		XichengMainTabNav,
		XichengPublicScopeSettings,
		XichengWorksProfileCard
	},
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			shareArtifacts: [],
			cachedDraft: null,
			selectedLibraryFilter: 'all',
			publicScopeState: { ...XICHENG_DEFAULT_PUBLIC_SCOPE_STATE }
		}
	},
	computed: {
		userProfile() {
			const hasLocalDraft = !!(this.cachedDraft && this.cachedDraft.draft)
			return {
				name: '西城访客 Bruce',
				status: hasLocalDraft || this.shareArtifacts.length > 0 ? '已保存' : '未登录',
				desc: hasLocalDraft || this.shareArtifacts.length > 0
					? '本机已保存游记素材，登录后可同步到星河寻境账号。'
					: '游客模式可先保存本机游记，登录后同步我的游记和发布素材。',
				action: hasLocalDraft || this.shareArtifacts.length > 0 ? '编辑资料' : '登录'
			}
		},
		libraryFilters() {
			return [
				{ key: 'all', label: '全部' },
				{ key: 'travelogue', label: '精美游记' },
				{ key: 'pdf', label: 'PDF' },
				{ key: 'draft', label: '未发布' }
			]
		},
		libraryStats() {
			const travelogues = this.travelogueItems.filter(item => item.assetType !== 'pdf' && item.assetType !== 'draft').length
			const pdfs = this.travelogueItems.filter(item => item.assetType === 'pdf').length
			return [
				{ label: '精美游记', value: travelogues, icon: 'travelogue' },
				{ label: '可打印 PDF', value: pdfs, icon: 'source' },
				{ label: '已发布', value: this.publishedCount, icon: 'route' },
				{ label: '本机存档', value: this.draftCount, icon: 'edit' }
			]
		},
		travelogueItems() {
			const draft = this.cachedDraft && this.cachedDraft.draft ? [{
				id: 'local-draft',
				assetType: 'draft',
				title: this.cachedDraft.editableTravelogueTitle || '在白塔下遇见西城',
				desc: '穿梭在胡同里，记录下那些容易被忽略的角落、人文与生活细节。',
				status: '未发布',
				templateLabel: '胡同手账',
				createdAt: '2025-05-10 创建',
				placeCount: '1 个地点',
				durationText: '一小时',
				distanceText: '步行约 0.8 公里',
				meta: { places: '1 个地点', duration: '一小时', distance: '步行约 0.8 公里' }
			}] : []
			const assets = this.shareArtifacts.map((item, index) => ({
				id: item.artifactId || `asset-${index}`,
				assetType: item.assetType,
				templateCode: item.templateCode,
				icon: item.assetType === 'pdf' ? 'source' : 'travelogue',
				title: item.title || item.assetLabel || '西城纪念游记',
				desc: item.description || item.templateCode || '清晨的白塔寺，静立在阳光与青瓦之间。沿什刹海慢行，聆听一段老北京的故事。',
				status: item.assetType === 'pdf' ? 'PDF 纪念册' : '已保存',
				templateLabel: item.templateLabel || (item.assetType === 'pdf' ? '可打印 PDF' : '城市漫步杂志'),
				createdAt: item.createdAt || (index === 0 ? '2025-05-15 创建' : '2025-05-12 发布'),
				placeCount: item.placeCount || (index === 0 ? '3 个地点' : '2 个地点'),
				durationText: item.durationText || (index === 0 ? '2.5 小时' : '1.5 小时'),
				distanceText: item.distanceText || (index === 0 ? '步行约 3.2 公里' : '步行约 2.1 公里'),
				meta: {
					places: item.placeCount || (index === 0 ? '3 个地点' : '2 个地点'),
					duration: item.durationText || (index === 0 ? '2.5 小时' : '1.5 小时'),
					distance: item.distanceText || (index === 0 ? '步行约 3.2 公里' : '步行约 2.1 公里')
				}
			}))
			return [...draft, ...assets].slice(0, 10)
		},
		filteredTravelogueItems() {
			if (this.selectedLibraryFilter === 'all') return this.travelogueItems
			if (this.selectedLibraryFilter === 'travelogue') {
				return this.travelogueItems.filter(item => item.assetType !== 'pdf' && item.assetType !== 'draft')
			}
			return this.travelogueItems.filter(item => item.assetType === this.selectedLibraryFilter)
		},
		draftCount() {
			return this.cachedDraft && this.cachedDraft.draft ? 1 : 0
		},
		publishedCount() {
			return this.shareArtifacts.filter(item => item.assetType && item.assetType !== 'pdf').length
		},
		publicScopeItems() {
			return [
				{ key: 'publicBody', icon: 'edit', title: '正文公开', desc: '公开页展示成品游记正文', enabled: this.publicScopeState.publicBody },
				{ key: 'publicPlaces', icon: 'location', title: '地点公开', desc: '只展示 POI 范围，不公开精确坐标', enabled: this.publicScopeState.publicPlaces },
				{ key: 'publicPhotos', icon: 'photo', title: '照片公开', desc: '只公开选入游记的照片', enabled: this.publicScopeState.publicPhotos },
				{ key: 'publicQaRecord', icon: 'qa', title: '问答记录', desc: '默认不公开小京问答原文', enabled: this.publicScopeState.publicQaRecord },
				{ key: 'hideExactLocation', icon: 'locked', title: '精确轨迹默认隐藏', desc: '不会公开精确坐标', enabled: this.publicScopeState.hideExactLocation }
			]
		}
	},
	onShow() {
		uni.setNavigationBarTitle({ title: '我的游记' })
		this.shareArtifacts = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey))
		this.cachedDraft = uni.getStorageSync(XICHENG_REGION_CONFIG.journeyStorageKey) || null
		this.restorePublicScopeSettings()
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
		openPrivacyScopeSettings(scope = 'privacy') {
			uni.pageScrollTo({ selector: '.public-scope-card', duration: 180, fail: () => {} })
		},
		openWorksManager() {
			this.selectedLibraryFilter = 'all'
			uni.pageScrollTo({ selector: '.works-card', duration: 180, fail: () => {} })
		},
		openTravelogueMaterials() {
			uni.navigateTo({ url: '/pages/xicheng/footprint/footprint?mode=travelogueMaterial' })
		},
		restorePublicScopeSettings() {
			const storedShareSettings = safeObject(uni.getStorageSync(XICHENG_REGION_CONFIG.shareSettingStorageKey))
			this.publicScopeState = normalizeWorksPublicScopeState(storedShareSettings)
		},
		persistPublicScopeSettings() {
			const storedShareSettings = safeObject(uni.getStorageSync(XICHENG_REGION_CONFIG.shareSettingStorageKey))
			uni.setStorageSync(XICHENG_REGION_CONFIG.shareSettingStorageKey, {
				...storedShareSettings,
				...this.publicScopeState
			})
		},
		togglePublicScopeSetting(key = '') {
			if (!Object.prototype.hasOwnProperty.call(this.publicScopeState, key)) return
			this.publicScopeState[key] = !this.publicScopeState[key]
			this.persistPublicScopeSettings()
		},
		selectLibraryFilter(key = 'all') {
			this.selectedLibraryFilter = key
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

.works-page-head {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 24rpx;
	margin-top: 18rpx;
}

.works-page-copy {
	min-width: 0;
}

.works-page-kicker,
.works-page-title,
.profile-sync-note {
	display: block;
}

.works-page-kicker {
	font-size: 24rpx;
	line-height: 1.25;
	font-weight: 800;
	color: #B5945E;
}

.works-page-title {
	margin-top: 4rpx;
	font-size: 60rpx;
	font-family: "Songti SC", "STSong", "Noto Serif CJK SC", "Noto Serif SC", serif;
	font-weight: 800;
	line-height: 1.1;
	color: #102F29;
}

.works-manage-button {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	width: 118rpx;
	height: 82rpx;
	margin: 0;
	padding: 0;
	border-radius: 22rpx;
	background: rgba(255, 252, 246, 0.92);
	border: 1rpx solid rgba(181, 148, 94, 0.22);
	color: #173F35;
	font-size: 22rpx;
	line-height: 1.2;
	font-weight: 900;
	box-shadow: 0 10rpx 24rpx rgba(23, 63, 53, 0.08);
}

.works-manage-button::after {
	border: 0;
}

.works-tip-card::after {
	content: '';
	position: absolute;
	right: -22rpx;
	top: -18rpx;
	width: 230rpx;
	height: 190rpx;
	background: url('/static/xicheng/poi-baitasi-card.jpg') center/cover no-repeat;
	opacity: 0.12;
	border-radius: 999rpx 0 0 999rpx;
}

.account-shortcut-title,
.account-shortcut-desc,
.privacy-title,
.privacy-copy {
	display: block;
}

.account-shortcut-grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 0;
	margin-top: 16rpx;
	padding: 10rpx 0;
	border-radius: 28rpx;
	box-sizing: border-box;
}

.account-shortcut {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 128rpx;
	padding: 10rpx;
	border-right: 1rpx solid rgba(181, 148, 94, 0.16);
	box-sizing: border-box;
}

.account-shortcut:last-child {
	border-right: 0;
}

.account-shortcut-title {
	margin-top: 8rpx;
	font-size: 23rpx;
	line-height: 1.3;
	font-weight: 900;
	color: #102F29;
	text-align: center;
}

.account-shortcut-desc {
	margin-top: 5rpx;
	font-size: 19rpx;
	line-height: 1.25;
	color: rgba(16, 47, 41, 0.62);
	text-align: center;
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
	margin-top: 18rpx;
	padding: 26rpx;
	border-radius: 34rpx;
}

.library-filter-row {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 8rpx;
	margin-top: 16rpx;
	padding: 6rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.08);
}

.library-filter-chip {
	min-height: 50rpx;
	margin: 0;
	padding: 0 8rpx;
	border-radius: 999rpx;
	background: transparent;
	color: #3E3831;
	font-size: 21rpx;
	line-height: 50rpx;
	font-weight: 900;
}

.library-filter-chip.active {
	background: #173F35;
	color: #FFF8EA;
	box-shadow: 0 8rpx 18rpx rgba(23, 63, 53, 0.18);
}

.library-filter-chip::after {
	border: 0;
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
	margin-top: 18rpx;
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
	margin-top: 22rpx;
	padding: 24rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.14);
	border-radius: 28rpx;
	text-align: center;
	background: rgba(255, 252, 246, 0.74);
}

.works-empty-image {
	width: 220rpx;
	height: 150rpx;
	border-radius: 22rpx;
	opacity: 0.76;
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

.privacy-action {
	display: flex;
	align-items: center;
	gap: 4rpx;
	padding: 12rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.08);
	color: #173F35;
	font-size: 22rpx;
	font-weight: 900;
	white-space: nowrap;
}

.works-tip-card {
	position: relative;
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
	position: relative;
	z-index: 1;
}

.works-tip-bubble {
	align-self: center;
	padding: 20rpx 22rpx;
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.86);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
	position: relative;
	z-index: 1;
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
