<template>
	<view class="travelogue">
		<view class="hero">
			<text class="eyebrow">游记草稿</text>
			<text class="title">{{ draft.title }}</text>
			<text class="subtitle">{{ draft.summary }}</text>
		</view>

		<view class="style-tabs">
			<view
				v-for="style in styles"
				:key="style"
				:class="['style-tab', activeStyle === style ? 'style-active' : '']"
				@click="generateDraft(style)"
			>
				{{ style }}
			</view>
		</view>

		<view class="draft-card">
			<view v-for="section in draft.sections" :key="section.heading" class="section">
				<text class="section-title">{{ section.heading }}</text>
				<text class="section-body">{{ section.body }}</text>
			</view>
		</view>

		<view class="ops-grid">
			<button @click="createPoster">分享海报</button>
			<button @click="createPdf">PDF纪念册</button>
			<button @click="submitReview">提交审核</button>
			<button @click="openPassport">作品审核</button>
		</view>

		<view class="status-card">
			<text>海报：{{ poster.status || '待生成' }}</text>
			<text>PDF：{{ pdf.status || '待生成' }}</text>
			<text>审核：{{ review.reviewStatus || draft.reviewStatus }}</text>
		</view>
	</view>
</template>

<script>
import { XICHENG_TRAVELOGUE_TEMPLATE } from '@/config/regions/xicheng.js'
import { getXichengMaterialTimeline } from '@/request/xunjing/track.js'
import {
	generateXichengMemorialPdf,
	generateXichengSharePoster,
	generateXichengTravelogueDraft,
	submitXichengWorkReview
} from '@/request/xunjing/travelogue.js'

const XICHENG_TRAVELOGUE_STYLES = ['城市漫步', '文化随笔', '亲子研学', '朋友圈短文', '小红书图文笔记']

export default {
	data() {
		return {
			routeId: '',
			activeStyle: '城市漫步',
			styles: XICHENG_TRAVELOGUE_STYLES,
			draft: XICHENG_TRAVELOGUE_TEMPLATE,
			poster: {},
			pdf: {},
			review: {}
		}
	},
	async onLoad(options = {}) {
		this.routeId = decodeURIComponent(options.routeId || '')
		await this.generateDraft(this.activeStyle)
	},
	methods: {
		async generateDraft(style = '城市漫步') {
			this.activeStyle = style
			this.draft = await generateXichengTravelogueDraft({
				timeline: getXichengMaterialTimeline(),
				style
			})
		},
		async createPoster() {
			this.poster = await generateXichengSharePoster({ draftId: this.draft.draftId })
			uni.showToast({ title: '分享海报已生成', icon: 'none' })
		},
		async createPdf() {
			this.pdf = await generateXichengMemorialPdf({ draftId: this.draft.draftId })
			uni.showToast({ title: 'PDF纪念册已生成', icon: 'none' })
		},
		async submitReview() {
			this.review = await submitXichengWorkReview({
				workId: this.draft.draftId,
				workType: 'travelogue'
			})
			uni.showToast({ title: '已提交审核', icon: 'none' })
		},
		openPassport() {
			uni.navigateTo({
				url: `/pages/xicheng/passport/passport?routeId=${encodeURIComponent(this.routeId)}`
			})
		}
	}
}
</script>

<style scoped>
.travelogue {
	min-height: 100vh;
	padding: 36rpx 28rpx 48rpx;
	box-sizing: border-box;
	background: #F7F5EE;
	color: #172B4D;
}

.hero,
.draft-card,
.status-card {
	padding: 30rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	box-shadow: 0 12rpx 36rpx rgba(31, 41, 51, 0.08);
}

.eyebrow,
.subtitle,
.section-body,
.status-card text {
	display: block;
	font-size: 24rpx;
	line-height: 1.6;
	color: #667085;
}

.title {
	display: block;
	margin-top: 10rpx;
	font-size: 40rpx;
	font-weight: 700;
}

.style-tabs,
.ops-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 24rpx;
}

.style-tab,
.ops-grid button {
	min-height: 72rpx;
	padding: 16rpx;
	border-radius: 8rpx;
	background: #EEF5F1;
	color: #1F6E5A;
	font-size: 24rpx;
	text-align: center;
	box-sizing: border-box;
}

.style-active {
	background: #1F6E5A;
	color: #FFFFFF;
}

.draft-card,
.status-card {
	margin-top: 24rpx;
}

.section {
	margin-top: 22rpx;
}

.section:first-child {
	margin-top: 0;
}

.section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
}
</style>
