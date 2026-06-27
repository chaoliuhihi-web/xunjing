<template>
	<view class="scan-result">
		<view class="result-card">
			<text class="label">{{ result.sourceLabel }}</text>
			<text class="poi-name">{{ result.poiName }}</text>
			<text class="reason">{{ result.reason || '小京已结合扫码、拍照、OCR和定位信号完成识别。' }}</text>
			<view class="meta-grid">
				<view>
					<text class="meta-value">{{ confidencePercent }}%</text>
					<text class="meta-label">置信度</text>
				</view>
				<view>
					<text class="meta-value">{{ result.requiresUserConfirm ? '待确认' : '可直达' }}</text>
					<text class="meta-label">触发状态</text>
				</view>
			</view>
		</view>

		<view class="question-card">
			<text class="section-title">可以继续问小京</text>
			<view
				v-for="question in recommendedQuestions"
				:key="question"
				class="question-row"
				@click="askXiaojing(question)"
			>
				<text>{{ question }}</text>
			</view>
		</view>

		<view class="bottom-actions">
			<button class="primary-button" @click="askXiaojing()">问问小京</button>
			<button class="ghost-button" @click="startRecording">开始记录</button>
		</view>
	</view>
</template>

<script>
import {
	XICHENG_DEVELOPMENT_TRIGGER_FIXTURE,
	XICHENG_REGION_CONFIG,
	XICHENG_RECOMMENDED_QUESTIONS
} from '@/config/regions/xicheng.js'

const normalizeResult = (result = {}) => ({
	...XICHENG_DEVELOPMENT_TRIGGER_FIXTURE,
	...result,
	regionCode: result.regionCode || XICHENG_REGION_CONFIG.regionCode,
	packageCode: result.packageCode || XICHENG_REGION_CONFIG.packageCode,
	companionName: result.companionName || XICHENG_REGION_CONFIG.companionName,
	poiName: result.poiName || XICHENG_DEVELOPMENT_TRIGGER_FIXTURE.poiName,
	recommendedQuestions: Array.isArray(result.recommendedQuestions) && result.recommendedQuestions.length > 0
		? result.recommendedQuestions
		: XICHENG_RECOMMENDED_QUESTIONS
})

export default {
	data() {
		return {
			result: normalizeResult()
		}
	},
	computed: {
		confidencePercent() {
			return Math.round(Number(this.result.confidence || 0) * 100)
		},
		recommendedQuestions() {
			return this.result.recommendedQuestions || XICHENG_RECOMMENDED_QUESTIONS
		}
	},
	onLoad(options = {}) {
		const cached = uni.getStorageSync(XICHENG_REGION_CONFIG.storageKey)
		this.result = normalizeResult({
			...(cached && typeof cached === 'object' ? cached : {}),
			source: options.source || (cached && cached.source) || '',
			poiCode: options.poiCode || (cached && cached.poiCode) || ''
		})
	},
	methods: {
		askXiaojing(question = '') {
			const prompt = question || this.recommendedQuestions[0] || `讲讲${this.result.poiName}`
			const query = [
				`question=${encodeURIComponent(prompt)}`,
				`regionCode=${encodeURIComponent(this.result.regionCode || XICHENG_REGION_CONFIG.regionCode)}`,
				`packageCode=${encodeURIComponent(this.result.packageCode || XICHENG_REGION_CONFIG.packageCode)}`,
				`poiCode=${encodeURIComponent(this.result.poiCode || '')}`,
				`poiName=${encodeURIComponent(this.result.poiName || '')}`,
				`companionName=${encodeURIComponent(this.result.companionName || XICHENG_REGION_CONFIG.companionName)}`,
				`confidence=${encodeURIComponent(String(this.result.confidence || ''))}`
			].join('&')
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?${query}`
			})
		},
		startRecording() {
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?mode=diary&regionCode=${encodeURIComponent(this.result.regionCode)}&poiCode=${encodeURIComponent(this.result.poiCode || '')}&poiName=${encodeURIComponent(this.result.poiName || '')}&companionName=${encodeURIComponent(this.result.companionName)}`
			})
		}
	}
}
</script>

<style scoped>
.scan-result {
	min-height: 100vh;
	padding: 36rpx 28rpx 48rpx;
	box-sizing: border-box;
	background: #F7F5EE;
	color: #172B4D;
}

.result-card,
.question-card {
	padding: 32rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	box-shadow: 0 12rpx 36rpx rgba(31, 41, 51, 0.08);
}

.label,
.reason,
.meta-label {
	display: block;
	font-size: 24rpx;
	line-height: 1.6;
	color: #667085;
}

.poi-name {
	display: block;
	margin-top: 12rpx;
	font-size: 44rpx;
	font-weight: 700;
	color: #122033;
}

.reason {
	margin-top: 16rpx;
}

.meta-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20rpx;
	margin-top: 28rpx;
}

.meta-grid > view {
	padding: 20rpx;
	border-radius: 8rpx;
	background: #EEF5F1;
}

.meta-value {
	display: block;
	font-size: 32rpx;
	font-weight: 700;
	color: #1F6E5A;
}

.question-card {
	margin-top: 28rpx;
}

.section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
}

.question-row {
	margin-top: 18rpx;
	padding: 22rpx;
	border-radius: 8rpx;
	background: #F2F4F7;
	font-size: 26rpx;
	color: #344054;
}

.bottom-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 32rpx;
}

.primary-button,
.ghost-button {
	flex: 1;
	height: 84rpx;
	line-height: 84rpx;
	border-radius: 8rpx;
	font-size: 28rpx;
}

.primary-button {
	background: #1F6E5A;
	color: #FFFFFF;
}

.ghost-button {
	background: #E8ECE7;
	color: #1F6E5A;
}
</style>
