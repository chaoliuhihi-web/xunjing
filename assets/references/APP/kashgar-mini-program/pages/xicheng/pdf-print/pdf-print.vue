<template>
	<view class="xicheng-pdf-print xicheng-designed-page xicheng-bottom-safe">
		<view class="topbar">
			<view class="topbar-button" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="topbar-title">PDF 纪念册</text>
			<view class="topbar-button" @click="openSharePage">
				<text class="topbar-action">设置</text>
			</view>
		</view>

		<view class="print-summary-card xicheng-paper-card">
			<image class="summary-cover" :src="coverImage" mode="aspectFill" />
			<view class="summary-copy">
				<text class="summary-title">{{ printTitle }}</text>
				<text class="summary-subtitle">星河寻境西城 · Citywalk 纪念册</text>
				<view class="summary-tags">
					<text>A4 纵向</text>
					<text>6 页</text>
					<text>可打印</text>
				</view>
			</view>
			<view class="summary-illustration">
				<text>西城记忆</text>
			</view>
		</view>

		<xicheng-pdf-print-preview
			:preview-pages="previewPages"
			:current-page-index="currentPageIndex"
			:current-preview-page="currentPreviewPage"
			:show-all-pages-preview="showAllPagesPreview"
			:route-stops="routeStops"
			:selected-photos="selectedPhotos"
			:companion-avatar="region.companionAvatar"
			@select-page="selectPreviewPage"
		/>

		<view class="print-bottom-grid">
			<view class="print-settings-grid xicheng-paper-card">
				<view class="section-head">
					<view class="section-title-row">
						<xicheng-icon name="source" variant="plain" :size="19" />
						<text class="section-title">打印设置</text>
					</view>
					<text class="section-badge">A4 打印设置</text>
				</view>
				<view v-for="setting in printSettings" :key="setting.key" class="setting-row">
					<text class="setting-label">{{ setting.label }}</text>
					<text class="setting-value" :class="{ 'setting-value-on': setting.enabled }">{{ setting.value }}</text>
				</view>
			</view>

			<view class="export-content-card xicheng-paper-card">
				<view class="section-head">
					<view class="section-title-row">
						<xicheng-icon name="check" variant="plain" :size="19" />
						<text class="section-title">导出内容</text>
					</view>
					<text class="section-badge">已检查</text>
				</view>
				<view v-for="item in exportContentItems" :key="item.title" class="export-row">
					<xicheng-icon name="check" variant="primary" :size="13" />
					<view class="export-copy">
						<text class="export-title">{{ item.title }}</text>
						<text class="export-desc">{{ item.desc }}</text>
					</view>
					<text class="export-count">{{ item.count }}</text>
				</view>
			</view>
		</view>

		<view class="print-preflight-card xicheng-paper-card">
			<view class="section-head">
				<view class="section-title-row">
					<xicheng-icon name="locked" variant="plain" :size="19" />
					<text class="section-title">打印前检查</text>
				</view>
				<text class="section-badge">不会自动发布</text>
			</view>
			<view class="preflight-grid">
				<view v-for="item in printPreflightItems" :key="item.title" class="preflight-item">
					<xicheng-icon :name="item.icon" variant="primary" :size="16" />
					<view class="preflight-copy"><text class="preflight-title">{{ item.title }}</text><text class="preflight-desc">{{ item.desc }}</text></view>
				</view>
			</view>
		</view>

		<view class="print-actions">
			<button class="ghost-button xicheng-secondary-action" @click="savePdf">保存 PDF</button>
			<button class="ghost-button xicheng-secondary-action" @click="previewAllPages">预览全部页面</button>
			<button class="primary-button xicheng-primary-action" @click="systemPrintPdf">打印 / 分享 PDF</button>
		</view>

		<text class="print-footnote">生成 PDF 后可保存到本地，支持系统打印或发送到微信文件助手。</text>
	</view>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import XichengPdfPrintPreview from '@/components/xicheng/XichengPdfPrintPreview.vue'

const safeArray = value => Array.isArray(value) ? value : []
const safeObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {}
const toSafeCount = value => {
	const count = Number(value || 0)
	return Number.isFinite(count) && count > 0 ? Math.round(count) : 0
}

export default {
	components: {
		XichengPdfPrintPreview
	},
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			journeyDraft: {},
			shareArtifacts: [],
			showAllPagesPreview: false,
			currentPageIndex: 0
		}
	},
	computed: {
		coverImage() {
			return this.region.visualAssets.sharePosterBackground || this.region.visualAssets.heroLandmark
		},
		printTitle() {
			return this.journeyDraft.editableTravelogueTitle || '在白塔下遇见西城'
		},
		routeStops() {
			const recordedStops = safeArray(this.journeyDraft.routeCheckins)
				.map(item => item.poiName)
				.filter(Boolean)
			return recordedStops.length ? recordedStops.slice(0, 5) : ['白塔寺', '历代帝王庙', '什刹海', '护国寺街']
		},
		selectedPhotos() {
			return [
				{ label: '白塔寺晨光', image: this.region.visualAssets.heroLandmark },
				{ label: '路线回望', image: this.region.visualAssets.routeThumbnails['baitasi-imperial-shichahai'] },
				{ label: '什刹海水面', image: this.region.visualAssets.routeThumbnails['beihai-shichahai-waterfront'] },
				{ label: '胡同院落', image: this.region.visualAssets.poiCards['xicheng-baitasi'] || this.region.visualAssets.heroLandmark }
			]
		},
		materialCount() {
			const pdfAsset = this.shareArtifacts.find(item => item && item.assetType === 'pdf') || {}
			const publicPreview = safeObject(pdfAsset.publicPreview)
			return toSafeCount(publicPreview.materialCount || this.journeyDraft.photoMaterialCount || this.selectedPhotos.length)
		},
		reviewedSourceCount() {
			const pdfAsset = this.shareArtifacts.find(item => item && item.assetType === 'pdf') || {}
			return toSafeCount(pdfAsset.reviewedSourceCount || this.journeyDraft.reviewedSourceCount || 6)
		},
		previewPages() {
			return [
				{
					pageNo: 1,
					label: '封面',
					type: 'cover',
					title: this.printTitle,
					subtitle: '星河寻境西城 · Citywalk 纪念册',
					image: this.coverImage,
					caption: '你好，我是小京，陪你在西城慢慢走，遇见历史与生活。',
					lines: []
				},
				{
					pageNo: 2,
					label: '路线',
					type: 'route',
					title: '路线概览',
					subtitle: `${this.routeStops.length} 个地点 · 步行约 3.2 公里`,
					image: '',
					caption: '路线页只展示景点级位置，默认隐藏精确轨迹。',
					lines: ['白塔寺出发，沿胡同向东南慢行。', '经过历代帝王庙，转向什刹海水岸。']
				},
				{
					pageNo: 3,
					label: '照片',
					type: 'photos',
					title: '精选照片',
					subtitle: `${this.materialCount} 张照片进入纪念册`,
					image: '',
					caption: '照片页使用预配置裁切，保留旅途温度。',
					lines: []
				},
				{
					pageNo: 4,
					label: '游记',
					type: 'article',
					title: '游记正文',
					subtitle: '像一篇完整长文，适合长期保存',
					image: '',
					caption: '正文按章节排版，读起来像一次完整回望。',
					lines: ['白塔寺之后，西城的时间慢了下来。', '湖面、屋檐和胡同里的光，把这趟路变成可以反复翻看的记忆。']
				},
				{
					pageNo: 5,
					label: '来源',
					type: 'sources',
					title: '资料来源',
					subtitle: `${this.reviewedSourceCount} 条已审核来源`,
					image: '',
					caption: '来源页只导出审核通过的公开信息。',
					lines: ['官方 POI 资料、路线说明和讲解来源。', '未审核或安全状态异常的内容不会进入 PDF。']
				},
				{
					pageNo: 6,
					label: '封底',
					type: 'back',
					title: '把西城带回家',
					subtitle: '扫码回看游记与路线',
					image: this.region.visualAssets.heroLandmark,
					caption: '愿你下次再来，还能从这里继续出发。',
					lines: ['西城没有喧嚣的终点，只有愿意停下来的片刻。']
				}
			]
		},
		currentPreviewPage() {
			return this.previewPages[this.currentPageIndex] || this.previewPages[0]
		},
		printSettings() {
			const hideExactTrack = true
			const officialSources = true
			return [
				{ key: 'paper', label: '纸张', value: 'A4', enabled: true },
				{ key: 'margin', label: '边距', value: '标准', enabled: true },
				{ key: 'quality', label: '图片质量', value: '高清', enabled: true },
				{ key: 'hideExactTrack', label: '隐藏精确轨迹', value: hideExactTrack ? '已开启' : '未开启', enabled: hideExactTrack },
				{ key: 'officialSources', label: '附官方来源页', value: officialSources ? '已开启' : '未开启', enabled: officialSources }
			]
		},
		exportContentItems() {
			const reviewedSourceCount = this.reviewedSourceCount
			const materialCount = this.materialCount
			return [
				{ title: '游记正文', desc: '长文排版和章节标题', count: '已选' },
				{ title: '路线概览', desc: '景点级路线和站点顺序', count: `${this.routeStops.length} 点` },
				{ title: '精选照片', desc: '自动裁切为打印比例', count: `${materialCount} 张` },
				{ title: '资料来源', desc: '只导出已审核来源', count: `${reviewedSourceCount} 条` }
			]
		},
		printPreflightItems() {
			return [
				{ title: '隐私保护', desc: '精确轨迹默认隐藏', icon: 'locked' }, { title: '来源检查', desc: '只导出已审核来源', icon: 'source' }, { title: '用户确认', desc: '系统打印/分享前会再次确认', icon: 'check' }
			]
		}
	},
	onShow() {
		this.journeyDraft = safeObject(uni.getStorageSync(XICHENG_REGION_CONFIG.journeyStorageKey))
		this.shareArtifacts = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey))
	},
	methods: {
		selectPreviewPage(index) {
			const nextIndex = Number(index)
			if (!Number.isFinite(nextIndex)) return
			this.currentPageIndex = Math.min(Math.max(Math.round(nextIndex), 0), this.previewPages.length - 1)
		},
		previewAllPages() {
			this.showAllPagesPreview = !this.showAllPagesPreview
		},
		confirmPdfExportAction(actionLabel = '') {
			return new Promise((resolve) => {
				uni.showModal({
					title: `${actionLabel}确认`,
					content: 'PDF 会先保存到本机预览，不会自动发布；系统打印/分享前会再次确认。',
					confirmText: actionLabel,
					cancelText: '取消',
					success: (res) => resolve(Boolean(res.confirm)),
					fail: () => resolve(false)
				})
			})
		},
		async savePdf() {
			const confirmed = await this.confirmPdfExportAction('保存 PDF')
			if (!confirmed) return
			uni.showToast({ title: 'PDF 已保存到本机预览', icon: 'none' })
		},
		systemPrintPdf() {
			this.sharePdf()
		},
		async sharePdf() {
			const confirmed = await this.confirmPdfExportAction('打印 / 分享 PDF')
			if (!confirmed) return
			uni.showToast({ title: '将唤起系统打印或分享 PDF', icon: 'none' })
		},
		openSharePage() {
			uni.navigateTo({ url: '/pages/xicheng/share/share' })
		},
		goBack() {
			const pages = getCurrentPages()
			if (pages.length <= 1) {
				uni.reLaunch({ url: '/pages/xicheng/travelogue-reader/travelogue-reader' })
				return
			}
			uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/xicheng/travelogue-reader/travelogue-reader' }) })
		}
	}
}
</script>

<style scoped>
.xicheng-pdf-print {
	min-height: 100vh;
	padding: 24rpx 30rpx 42rpx;
	box-sizing: border-box;
}
.topbar,
.section-head,
.summary-tags,
.print-actions,
.setting-row,
.export-row {
	display: flex;
	align-items: center;
}
.topbar,
.section-head,
.setting-row {
	justify-content: space-between;
}
.topbar {
	height: 72rpx;
}
.topbar-button {
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 60rpx;
	height: 60rpx;
}
.topbar-title,
.summary-title,
.section-title,
.export-title {
	font-weight: 900;
	color: #102F29;
}
.topbar-title {
	font-size: 38rpx;
	letter-spacing: 0;
}
.topbar-action,
.section-badge,
.summary-subtitle,
.setting-label,
.export-desc,
.print-footnote {
	color: #746F68;
}
.topbar-action {
	font-size: 27rpx;
}
.print-summary-card,
.print-settings-grid,
.export-content-card,
.print-preflight-card {
	margin-top: 22rpx;
	border-radius: 26rpx;
}
.print-summary-card {
	position: relative;
	display: flex;
	gap: 24rpx;
	padding: 24rpx;
	overflow: hidden;
}
.summary-cover {
	width: 142rpx;
	height: 170rpx;
	border-radius: 18rpx;
	flex-shrink: 0;
}
.summary-copy {
	position: relative;
	z-index: 1;
	flex: 1;
	min-width: 0;
	padding-top: 8rpx;
}
.summary-title {
	display: block;
	font-size: 36rpx;
	line-height: 1.24;
}
.summary-subtitle {
	display: block;
	margin-top: 12rpx;
	font-size: 25rpx;
}
.summary-tags {
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 22rpx;
}
.summary-tags text {
	padding: 10rpx 20rpx;
	border-radius: 14rpx;
	background: rgba(255, 252, 246, 0.9);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
	font-size: 23rpx;
	color: #173F35;
}
.summary-illustration {
	position: absolute;
	right: 22rpx;
	bottom: 18rpx;
	width: 180rpx;
	height: 116rpx;
	border-radius: 90rpx 90rpx 0 0;
	border: 2rpx solid rgba(181, 148, 94, 0.18);
	color: rgba(181, 148, 94, 0.35);
	font-size: 24rpx;
	text-align: center;
	line-height: 116rpx;
}
.print-bottom-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20rpx;
	margin-top: 18rpx;
}
.print-settings-grid,
.export-content-card,
.print-preflight-card {
	padding: 24rpx;
}
.section-title-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
}
.section-title {
	font-size: 29rpx;
}
.section-badge {
	font-size: 21rpx;
}
.setting-label,
.setting-value,
.export-title,
.export-desc,
.export-count,
.print-footnote {
	display: block;
}
.setting-row,
.export-row {
	gap: 14rpx;
	padding: 18rpx 0;
	border-top: 1rpx solid rgba(181, 148, 94, 0.13);
}
.setting-row:first-of-type,
.export-row:first-of-type {
	margin-top: 12rpx;
}
.setting-label,
.setting-value,
.export-title,
.export-desc,
.export-count,
.preflight-title,
.preflight-desc {
	font-size: 24rpx;
	line-height: 1.35;
}
.setting-value,
.export-count {
	color: #3E3831;
	text-align: right;
}
.setting-value-on { color: #173F35; font-weight: 800; }
.export-copy { flex: 1; min-width: 0; }
.export-title { color: #173F35; font-weight: 800; }
.export-desc,
.preflight-desc {
	margin-top: 4rpx;
	color: #8C8278;
}
.preflight-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14rpx; margin-top: 18rpx; }
.preflight-item {
	display: flex;
	align-items: flex-start;
	gap: 12rpx;
	min-height: 104rpx;
	padding: 18rpx 16rpx;
	border-radius: 20rpx;
	background: rgba(255, 252, 246, 0.84);
	border: 1rpx solid rgba(181, 148, 94, 0.14);
	box-sizing: border-box;
}
.preflight-copy { flex: 1; min-width: 0; }
.preflight-title,
.preflight-desc { display: block; }
.preflight-title { color: #173F35; font-weight: 800; }
.print-actions {
	gap: 18rpx;
	margin-top: 24rpx;
}
.print-actions button {
	flex: 1;
	margin: 0;
}
.print-actions .primary-button {
	flex: 1.5;
}
.print-footnote {
	margin-top: 18rpx;
	text-align: center;
	font-size: 22rpx;
	line-height: 1.5;
}
</style>
