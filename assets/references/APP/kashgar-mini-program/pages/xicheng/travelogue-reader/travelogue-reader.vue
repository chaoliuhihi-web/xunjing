<template>
	<view class="xicheng-travelogue-reader xicheng-designed-page xicheng-bottom-safe">
		<view class="reader-topbar">
			<view class="reader-topbar-button" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="reader-topbar-title">精美游记</text>
			<view class="reader-topbar-actions">
				<button class="reader-topbar-action" @click="showReaderContents">
					<xicheng-icon name="source" variant="plain" :size="19" />
					<text>目录</text>
				</button>
				<button class="reader-topbar-action" @click="openSharePage">
					<xicheng-icon name="share" variant="plain" :size="19" />
					<text>分享</text>
				</button>
			</view>
		</view>

		<xicheng-long-travelogue-preview
			:cover-image="coverImage"
			:title="readerTitle"
			:subtitle="readerSubtitle"
			:intro="readerIntro"
			:template-title="templateLabel"
			:route-items="routeItems"
			:chapters="longArticleChapters"
			:photo-cards="photoMemoryCards"
			:tags="readerTags"
			:source-count="sourceCount"
			:companion-avatar="region.companionAvatar"
			@save="saveKeepsakeReader"
			@edit="openTravelogueEditor"
			@export-pdf="openPdfPrintPage"
			@publish-moments="openSharePage"
			@publish-xhs="openSharePage"
			@view-sources="showReaderSources"
		/>
	</view>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import XichengLongTraveloguePreview from '@/components/xicheng/XichengLongTraveloguePreview.vue'

const safeArray = value => Array.isArray(value) ? value : []
const safeObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {}

export default {
	components: {
		XichengLongTraveloguePreview
	},
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			journeyDraft: {},
			shareArtifacts: []
		}
	},
	computed: {
		coverImage() {
			return this.journeyDraft.coverImage || this.region.visualAssets.sharePosterBackground || this.region.visualAssets.heroLandmark
		},
		readerTitle() {
			return this.journeyDraft.editableTravelogueTitle || '这次不急着看尽一切，只看懂今天遇到的自己'
		},
		readerSubtitle() {
			return this.journeyDraft.travelogueSubtitle || '白塔寺之后，像是一场温柔又诚实的慢行'
		},
		readerIntro() {
			return this.journeyDraft.travelogueIntro || '两天一夜的西城漫步，从白塔寺的晨钟开始，穿过什刹海的烟柳，拐进胡同里的小店，在黄昏的光里，把时间还给生活。'
		},
		templateLabel() {
			const pdfAsset = this.shareArtifacts.find(item => item && item.assetType === 'pdf')
			return pdfAsset && pdfAsset.templateCode ? pdfAsset.templateCode : '城市漫步杂志'
		},
		sourceCount() {
			return Number(this.journeyDraft.workSourceCount || this.journeyDraft.reviewedSourceCount || 0)
		},
		readerTags() {
			const tags = safeArray(this.journeyDraft.tags).filter(Boolean)
			return tags.length > 0 ? tags : ['白塔寺', '什刹海', '胡同漫步', '北京西城']
		},
		routeItems() {
			const route = safeObject(this.journeyDraft.recognizedRoute)
			const stops = safeArray(route.stops).slice(0, 6)
			if (stops.length > 0) {
				return stops.map((stop, index) => ({
					time: ['09:30', '12:00', '15:00', '10:00', '14:00', '17:30'][index] || '待定',
					title: stop.poiName || stop.title || `第 ${index + 1} 站`,
					desc: stop.summary || stop.desc || stop.theme || '这一天被认真保存下来的一站',
					image: stop.image || stop.cover || this.coverImage
				}))
			}
			return [
				{ time: '09:30', title: '白塔寺', desc: '清晨的白塔寺格外安静，阳光落在白塔上，也把眼前慢了下来。', image: this.coverImage },
				{ time: '12:00', title: '什刹海', desc: '风吹过水面，远处的钟鼓楼像一首老歌，越听越有味道。', image: this.region.visualAssets.routeShichahai || this.coverImage },
				{ time: '15:00', title: '北海北门', desc: '从什刹海到北海北门，一片绿意让人放松，坐在岸边发呆。', image: this.region.visualAssets.heroLandmark || this.coverImage },
				{ time: '10:00', title: '胡同里的小店', desc: '拐进安静的胡同，发现一家有院子的咖啡馆。', image: this.coverImage },
				{ time: '14:00', title: '护国寺街', desc: '护国寺街热闹又亲切，烟火气最抚人心。', image: this.region.visualAssets.routeBaitasi || this.coverImage },
				{ time: '17:30', title: '大栅栏 & 日落 Citywalk', desc: '夕阳把前门大街染成暖金色，把这趟慢行收进口袋。', image: this.region.visualAssets.sharePosterBackground || this.coverImage }
			]
		},
		longArticleChapters() {
			const customChapters = safeArray(this.journeyDraft.longArticleChapters).filter(item => item && item.title)
			if (customChapters.length > 0) return customChapters
			return this.routeItems.map((item, index) => ({
				title: index < 3 ? `${item.title}` : item.title,
				text: item.desc,
				quote: index === 0 ? '慢一点，也没关系。' : index === 1 ? '我记住的是树影、桥边和那一点点水汽。' : '这不是打卡结束，是一天真正被记住。',
				image: item.image || this.coverImage
			}))
		},
		photoMemoryCards() {
			const photos = safeArray(this.journeyDraft.photoCards).filter(item => item && item.image)
			if (photos.length > 0) return photos
			return this.routeItems.slice(0, 5).map((item, index) => ({
				key: `memory-${index}`,
				label: ['白塔寺的晨光', '什刹海的摇橹声', '胡同里的小院', '护国寺的香甜', '前门的日落'][index] || item.title,
				image: item.image || this.coverImage
			}))
		}
	},
	onShow() {
		this.journeyDraft = safeObject(uni.getStorageSync(XICHENG_REGION_CONFIG.journeyStorageKey))
		this.shareArtifacts = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey))
	},
	methods: {
		saveKeepsakeReader() {
			uni.showToast({ title: '已保存游记', icon: 'none' })
		},
		openTravelogueEditor() {
			uni.navigateTo({ url: '/pages/xicheng/travelogue/travelogue?mode=edit' })
		},
		openSharePage() {
			uni.navigateTo({ url: '/pages/xicheng/share/share' })
		},
		openPdfPrintPage() {
			uni.navigateTo({ url: '/pages/xicheng/pdf-print/pdf-print' })
		},
		scrollReaderTo(selector, fallbackTitle) {
			if (typeof uni !== 'undefined' && typeof uni.pageScrollTo === 'function') {
				uni.pageScrollTo({
					selector,
					duration: 220,
					fail: () => uni.showToast({ title: fallbackTitle, icon: 'none' })
				})
				return
			}
			if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
				uni.showToast({ title: fallbackTitle, icon: 'none' })
			}
		},
		showReaderContents() {
			this.scrollReaderTo('.long-reader-tabs', '已定位到目录')
		},
		showReaderSources() {
			this.scrollReaderTo('.long-source-panel', '已定位到来源')
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
	padding: 24rpx 24rpx 40rpx;
	box-sizing: border-box;
}

.reader-topbar {
	display: grid;
	grid-template-columns: 72rpx 1fr auto;
	align-items: center;
	gap: 16rpx;
	min-height: 72rpx;
	margin-bottom: 18rpx;
}

.reader-topbar-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 64rpx;
	height: 64rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.86);
}

.reader-topbar-actions {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 10rpx;
}

.reader-topbar-action {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 4rpx;
	min-width: 76rpx;
	min-height: 64rpx;
	margin: 0;
	padding: 0 12rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.86);
	color: #173F35;
	font-size: 21rpx;
	line-height: 1;
	font-weight: 800;
}

.reader-topbar-action::after {
	border: 0;
}

.reader-topbar-title {
	text-align: center;
	font-size: 34rpx;
	font-weight: 800;
	color: #102F29;
}
</style>
