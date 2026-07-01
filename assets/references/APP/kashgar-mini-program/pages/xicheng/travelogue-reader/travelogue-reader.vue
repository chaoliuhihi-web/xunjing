<template>
	<view class="xicheng-travelogue-reader xicheng-designed-page xicheng-bottom-safe">
		<view class="topbar">
			<view class="topbar-button" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="topbar-title">精美游记</text>
			<view class="topbar-button" @click="openSharePage">
				<xicheng-icon name="source" variant="plain" :size="21" />
			</view>
		</view>

		<view class="reader-cover xicheng-paper-card">
			<image class="reader-cover-image" :src="coverImage" mode="aspectFill" />
			<view class="reader-cover-scrim"></view>
			<view class="reader-cover-copy">
				<text class="reader-kicker">杂志式封面</text>
				<text class="reader-title">{{ readerTitle }}</text>
				<text class="reader-subtitle">一篇可以长期回看的西城纪念游记</text>
			</view>
			<view class="reader-template-pill">{{ templateLabel }}</view>
		</view>

		<view class="story-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">路线故事线</text>
				<text class="section-badge">{{ routeItems.length }} 站</text>
			</view>
			<view class="route-line">
				<view v-for="(item, index) in routeItems" :key="`${item.title}-${index}`" class="route-step">
					<text class="route-time">{{ item.time }}</text>
					<text class="route-dot">{{ index + 1 }}</text>
					<view class="route-copy">
						<text class="route-title">{{ item.title }}</text>
						<text class="route-desc">{{ item.desc }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="chapter-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">照片叙事</text>
				<text class="section-badge">可继续编辑</text>
			</view>
			<view v-for="chapter in chapters" :key="chapter.title" class="chapter-row">
				<image class="chapter-image" :src="chapter.image" mode="aspectFill" />
				<view class="chapter-copy">
					<text class="chapter-title">{{ chapter.title }}</text>
					<text class="chapter-text">{{ chapter.text }}</text>
				</view>
			</view>
		</view>

		<view class="source-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">小京来源补充</text>
				<text class="section-badge">{{ sourceCount }} 条来源</text>
			</view>
			<text class="source-copy">地点讲解只使用已审核来源；精确轨迹默认隐藏，公开前可继续检查正文、地点、照片和问答记录的公开范围。</text>
		</view>

		<view class="reader-actions">
			<button class="ghost-button xicheng-secondary-action" @click="openTravelogueEditor">继续编辑</button>
			<button class="ghost-button xicheng-secondary-action" @click="openSharePage">发布设置</button>
			<button class="primary-button xicheng-primary-action" @click="openPdfPrintPage">PDF打印</button>
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
		readerTitle() {
			return this.journeyDraft.editableTravelogueTitle || '在白塔下遇见西城'
		},
		templateLabel() {
			const pdfAsset = this.shareArtifacts.find(item => item && item.assetType === 'pdf')
			return pdfAsset && pdfAsset.templateCode ? pdfAsset.templateCode : '城市漫步杂志'
		},
		sourceCount() {
			return Number(this.journeyDraft.workSourceCount || this.journeyDraft.reviewedSourceCount || 0)
		},
		routeItems() {
			const route = safeObject(this.journeyDraft.recognizedRoute)
			const stops = safeArray(route.stops).slice(0, 4)
			if (stops.length > 0) {
				return stops.map((stop, index) => ({
					time: ['09:30', '11:00', '14:20', '16:10'][index] || '待定',
					title: stop.poiName || stop.title || `第 ${index + 1} 站`,
					desc: stop.desc || '已加入本次西城路线'
				}))
			}
			return [
				{ time: '09:30', title: '白塔寺', desc: '把第一张照片留给愿意停下来的地方' },
				{ time: '11:00', title: '历代帝王庙', desc: '在古建秩序里读懂城市脉络' },
				{ time: '15:40', title: '什刹海', desc: '用水面和风收住一天的脚步' }
			]
		},
		chapters() {
			return this.routeItems.slice(0, 3).map((item, index) => ({
				title: index === 0 ? '开篇：慢下来' : index === 1 ? '中段：走进街巷' : '尾声：值得回看',
				text: `${item.title} 不只是一个打卡点，它会和照片、路线、停留片段一起，成为这篇游记里最真实的一段。`,
				image: this.coverImage
			}))
		}
	},
	onShow() {
		this.journeyDraft = safeObject(uni.getStorageSync(XICHENG_REGION_CONFIG.journeyStorageKey))
		this.shareArtifacts = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey))
	},
	methods: {
		openTravelogueEditor() {
			uni.navigateTo({ url: '/pages/xicheng/travelogue/travelogue?mode=edit' })
		},
		openSharePage() {
			uni.navigateTo({ url: '/pages/xicheng/share/share' })
		},
		openPdfPrintPage() {
			uni.navigateTo({ url: '/pages/xicheng/pdf-print/pdf-print' })
		},
		goBack() {
			const pages = getCurrentPages()
			if (pages.length <= 1) {
				uni.reLaunch({ url: '/pages/xicheng/works/works' })
				return
			}
			uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/xicheng/works/works' }) })
		}
	}
}
</script>

<style scoped>
.xicheng-travelogue-reader {
	min-height: 100vh;
	padding: 24rpx 30rpx 44rpx;
	box-sizing: border-box;
}
.topbar,
.section-head,
.route-step,
.chapter-row,
.reader-actions {
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
.reader-title,
.route-title,
.chapter-title {
	font-weight: 800;
	color: #102F29;
}
.topbar-title {
	font-size: 34rpx;
}
.reader-cover {
	position: relative;
	min-height: 640rpx;
	margin-top: 20rpx;
	padding: 0;
	border-radius: 38rpx;
	overflow: hidden;
}
.reader-cover-image,
.reader-cover-scrim {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
}
.reader-cover-scrim {
	background: linear-gradient(180deg, rgba(16, 47, 41, 0.08), rgba(16, 47, 41, 0.74));
}
.reader-cover-copy {
	position: absolute;
	left: 34rpx;
	right: 34rpx;
	bottom: 42rpx;
}
.reader-kicker,
.reader-title,
.reader-subtitle,
.route-time,
.route-title,
.route-desc,
.chapter-title,
.chapter-text,
.source-copy {
	display: block;
}
.reader-kicker {
	font-size: 24rpx;
	color: #E9C984;
	font-weight: 800;
}
.reader-title {
	margin-top: 12rpx;
	font-size: 48rpx;
	line-height: 1.16;
	color: #FFF8EA;
}
.reader-subtitle {
	margin-top: 12rpx;
	font-size: 25rpx;
	line-height: 1.5;
	color: rgba(255, 248, 234, 0.86);
}
.reader-template-pill {
	position: absolute;
	top: 28rpx;
	right: 28rpx;
	padding: 12rpx 20rpx;
	border-radius: 999rpx;
	background: rgba(255, 248, 234, 0.88);
	color: #173F35;
	font-size: 22rpx;
	font-weight: 800;
}
.story-card,
.chapter-card,
.source-card {
	margin-top: 24rpx;
	padding: 30rpx;
	border-radius: 34rpx;
}
.section-title {
	font-size: 32rpx;
}
.section-badge,
.route-desc,
.chapter-text,
.source-copy {
	font-size: 24rpx;
	line-height: 1.55;
	color: #746F68;
}
.route-line {
	display: grid;
	gap: 18rpx;
	margin-top: 24rpx;
}
.route-step {
	align-items: flex-start;
	justify-content: flex-start;
}
.route-time {
	width: 74rpx;
	color: #B5945E;
	font-size: 23rpx;
	font-weight: 800;
}
.route-dot {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 46rpx;
	height: 46rpx;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF8EA;
	font-size: 22rpx;
	font-weight: 900;
}
.route-copy,
.chapter-copy {
	flex: 1;
	min-width: 0;
}
.route-title,
.chapter-title {
	font-size: 27rpx;
	line-height: 1.35;
}
.chapter-card {
	display: grid;
	gap: 18rpx;
}
.chapter-row {
	align-items: stretch;
}
.chapter-image {
	width: 168rpx;
	height: 188rpx;
	border-radius: 24rpx;
	background: rgba(23, 63, 53, 0.08);
	flex-shrink: 0;
}
.reader-actions {
	margin-top: 24rpx;
	padding: 18rpx;
	border-radius: 30rpx;
	background: rgba(255, 252, 246, 0.94);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
	box-shadow: 0 18rpx 42rpx rgba(28, 35, 32, 0.12);
}
.reader-actions button {
	flex: 1;
	margin: 0;
}
</style>
