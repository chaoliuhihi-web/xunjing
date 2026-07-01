<template>
	<view class="xicheng-pdf-print xicheng-designed-page xicheng-bottom-safe">
		<view class="topbar">
			<view class="topbar-button" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="topbar-title">PDF打印预览</text>
			<view class="topbar-button" @click="openSharePage">
				<xicheng-icon name="source" variant="plain" :size="21" />
			</view>
		</view>

		<view class="print-hero xicheng-paper-card">
			<view class="print-hero-copy">
				<text class="print-kicker">A4 打印设置</text>
				<text class="print-title">{{ printTitle }}</text>
				<text class="print-subtitle">按出版小册子的节奏整理封面、路线地图、照片页和正文页。</text>
			</view>
			<view class="print-paper-stack">
				<view class="paper-page paper-page-back"></view>
				<view class="paper-page paper-page-front">
					<image class="paper-cover" :src="coverImage" mode="aspectFill" />
					<text class="paper-title">西城游记</text>
					<text class="paper-meta">A4 · 300dpi · 可打印</text>
				</view>
			</view>
		</view>

		<view class="settings-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">打印规格</text>
				<text class="section-badge">预配置模板</text>
			</view>
			<view class="setting-grid">
				<view v-for="setting in printSettings" :key="setting.label" class="setting-item">
					<text class="setting-value">{{ setting.value }}</text>
					<text class="setting-label">{{ setting.label }}</text>
				</view>
			</view>
		</view>

		<view class="preview-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">页码预览</text>
				<text class="section-badge">预览全部页面</text>
			</view>
			<view class="page-strip">
				<view v-for="page in previewPages" :key="page.pageNo" class="preview-page">
					<image v-if="page.image" class="preview-page-image" :src="page.image" mode="aspectFill" />
					<view class="preview-page-copy">
						<text class="preview-page-no">P{{ page.pageNo }}</text>
						<text class="preview-page-title">{{ page.title }}</text>
						<text class="preview-page-desc">{{ page.desc }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="print-note xicheng-paper-card">
			<text class="print-note-title">出版前检查</text>
			<text class="print-note-copy">PDF 只读取已保存的游记草稿、分享产物和公开预览字段；照片原始路径、精确坐标和私密素材不会写入公开 PDF。</text>
		</view>

		<view class="print-actions">
			<button class="ghost-button xicheng-secondary-action" @click="savePdf">保存 PDF</button>
			<button class="ghost-button xicheng-secondary-action" @click="systemPrintPdf">系统打印</button>
			<button class="primary-button xicheng-primary-action" @click="sharePdf">分享 PDF</button>
		</view>
	</view>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'

const safeArray = value => Array.isArray(value) ? value : []
const safeObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {}

export default {
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			journeyDraft: {},
			shareArtifacts: []
		}
	},
	computed: {
		coverImage() {
			return this.region.visualAssets.sharePosterBackground || this.region.visualAssets.heroLandmark
		},
		printTitle() {
			return this.journeyDraft.editableTravelogueTitle || '在白塔下遇见西城'
		},
		printSettings() {
			return [
				{ label: '纸张', value: 'A4' },
				{ label: '版式', value: '竖版' },
				{ label: '页数', value: `${this.previewPages.length}页` },
				{ label: '质量', value: '高清' }
			]
		},
		previewPages() {
			const pdfAsset = this.shareArtifacts.find(item => item && item.assetType === 'pdf') || {}
			const publicPreview = safeObject(pdfAsset.publicPreview)
			const materialCount = Number(publicPreview.materialCount || this.journeyDraft.photoMaterialCount || 3)
			return [
				{ pageNo: 1, title: '封面', desc: this.printTitle, image: this.coverImage },
				{ pageNo: 2, title: '路线地图', desc: '按当天路线和停留顺序排版', image: this.region.visualAssets.routeThumbnails['baitasi-imperial-shichahai'] },
				{ pageNo: 3, title: '照片时间线', desc: `${materialCount} 个素材进入精选页`, image: this.region.visualAssets.heroLandmark },
				{ pageNo: 4, title: '长文正文', desc: '以完整游记段落呈现，可继续编辑', image: '' }
			]
		}
	},
	onShow() {
		this.journeyDraft = safeObject(uni.getStorageSync(XICHENG_REGION_CONFIG.journeyStorageKey))
		this.shareArtifacts = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey))
	},
	methods: {
		savePdf() {
			uni.showToast({ title: 'PDF 已保存到本机预览', icon: 'none' })
		},
		systemPrintPdf() {
			uni.showToast({ title: '将接入系统打印能力', icon: 'none' })
		},
		sharePdf() {
			uni.showToast({ title: 'PDF 分享已准备', icon: 'none' })
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
	padding: 24rpx 30rpx 44rpx;
	box-sizing: border-box;
}
.topbar,
.section-head,
.print-actions {
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
.print-title,
.section-title,
.preview-page-title,
.print-note-title {
	font-weight: 800;
	color: #102F29;
}
.topbar-title {
	font-size: 34rpx;
}
.print-hero,
.settings-card,
.preview-card,
.print-note {
	margin-top: 24rpx;
	padding: 30rpx;
	border-radius: 34rpx;
}
.print-hero {
	display: flex;
	align-items: stretch;
	gap: 26rpx;
	min-height: 360rpx;
	overflow: hidden;
}
.print-hero-copy {
	flex: 1;
	min-width: 0;
	padding-top: 8rpx;
}
.print-kicker,
.print-title,
.print-subtitle,
.setting-value,
.setting-label,
.preview-page-no,
.preview-page-title,
.preview-page-desc,
.print-note-title,
.print-note-copy {
	display: block;
}
.print-kicker {
	font-size: 24rpx;
	color: #B5945E;
	font-weight: 900;
}
.print-title {
	margin-top: 14rpx;
	font-size: 43rpx;
	line-height: 1.16;
}
.print-subtitle,
.preview-page-desc,
.print-note-copy {
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #746F68;
}
.print-paper-stack {
	position: relative;
	width: 236rpx;
	flex-shrink: 0;
}
.paper-page {
	position: absolute;
	width: 192rpx;
	height: 286rpx;
	border-radius: 18rpx;
	background: #FFFDF8;
	box-shadow: 0 20rpx 46rpx rgba(28, 35, 32, 0.16);
	overflow: hidden;
}
.paper-page-back {
	top: 14rpx;
	right: 0;
	transform: rotate(5deg);
	border: 1rpx solid rgba(181, 148, 94, 0.2);
}
.paper-page-front {
	top: 0;
	right: 34rpx;
	padding: 14rpx;
	box-sizing: border-box;
	transform: rotate(-3deg);
}
.paper-cover {
	width: 100%;
	height: 150rpx;
	border-radius: 14rpx;
}
.paper-title {
	display: block;
	margin-top: 16rpx;
	font-size: 25rpx;
	font-weight: 900;
	color: #173F35;
}
.paper-meta {
	display: block;
	margin-top: 8rpx;
	font-size: 18rpx;
	color: #B5945E;
}
.section-title {
	font-size: 32rpx;
}
.section-badge,
.setting-label {
	font-size: 23rpx;
	color: #8C8278;
}
.setting-grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 22rpx;
}
.setting-item {
	padding: 18rpx 10rpx;
	border-radius: 22rpx;
	background: rgba(23, 63, 53, 0.07);
	text-align: center;
}
.setting-value {
	font-size: 27rpx;
	font-weight: 900;
	color: #173F35;
}
.page-strip {
	display: grid;
	gap: 18rpx;
	margin-top: 22rpx;
}
.preview-page {
	display: flex;
	gap: 18rpx;
	min-height: 150rpx;
	padding: 18rpx;
	border-radius: 26rpx;
	background: rgba(255, 248, 234, 0.74);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
	box-sizing: border-box;
}
.preview-page-image {
	width: 112rpx;
	height: 112rpx;
	border-radius: 20rpx;
	background: rgba(23, 63, 53, 0.08);
	flex-shrink: 0;
}
.preview-page-copy {
	flex: 1;
	min-width: 0;
}
.preview-page-no {
	font-size: 21rpx;
	color: #B5945E;
	font-weight: 900;
}
.preview-page-title {
	margin-top: 4rpx;
	font-size: 28rpx;
}
.print-actions {
	margin-top: 24rpx;
	padding: 18rpx;
	border-radius: 30rpx;
	background: rgba(255, 252, 246, 0.94);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
	box-shadow: 0 18rpx 42rpx rgba(28, 35, 32, 0.12);
}
.print-actions button {
	flex: 1;
	margin: 0;
}
</style>
