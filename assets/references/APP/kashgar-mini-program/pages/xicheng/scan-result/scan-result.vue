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
				v-for="question in suggestedQuestions"
				:key="question"
				class="question-row"
				@click="askXiaojing(question)"
			>
				<text>{{ question }}</text>
			</view>
		</view>

		<view class="source-card">
			<text class="section-title">已审核来源</text>
			<view v-if="sourceList.length > 0">
				<view
					v-for="(source, index) in sourceList"
					:key="source.id || source.url || source.title || index"
					class="source-row"
				>
					<text class="source-title">{{ source.title || source.name || '审核来源' }}</text>
					<text v-if="source.excerpt || source.summary || source.url" class="source-desc">
						{{ source.excerpt || source.summary || source.url }}
					</text>
				</view>
			</view>
			<text v-else class="source-empty">暂无已审核来源，小京会按后台审核状态回答。</text>
		</view>

		<view class="bottom-actions">
			<button class="primary-button" @click="askXiaojing()">问问小京</button>
			<button class="ghost-button" @click="startRecording">开始记录</button>
		</view>
	</view>
</template>

<script>
import {
	XICHENG_REGION_CONFIG,
	XICHENG_SUGGESTED_QUESTIONS
} from '@/config/regions/xicheng.js'

const XICHENG_EMPTY_RECOGNITION_RESULT = Object.freeze({
	regionCode: XICHENG_REGION_CONFIG.regionCode,
	packageCode: XICHENG_REGION_CONFIG.packageCode,
	companionName: XICHENG_REGION_CONFIG.companionName,
	poiCode: '',
	poiName: '待确认西城文化点',
	sourceLabel: '识别结果',
	reason: '小京已结合扫码、拍照、OCR和定位信号完成识别。',
	confidence: 0,
	requiresUserConfirm: true,
	suggestedQuestions: XICHENG_SUGGESTED_QUESTIONS,
	sources: []
})

const normalizeSuggestedQuestions = (result = {}) => {
	if (Array.isArray(result.suggestedQuestions) && result.suggestedQuestions.length > 0) {
		return result.suggestedQuestions
	}
	if (Array.isArray(result.recommendedQuestions) && result.recommendedQuestions.length > 0) {
		return result.recommendedQuestions
	}
	return XICHENG_SUGGESTED_QUESTIONS
}

const normalizeResult = (result = {}) => ({
	...XICHENG_EMPTY_RECOGNITION_RESULT,
	...result,
	regionCode: result.regionCode || XICHENG_REGION_CONFIG.regionCode,
	packageCode: result.packageCode || XICHENG_REGION_CONFIG.packageCode,
	companionName: result.companionName || XICHENG_REGION_CONFIG.companionName,
	poiName: result.poiName || XICHENG_EMPTY_RECOGNITION_RESULT.poiName,
	suggestedQuestions: normalizeSuggestedQuestions(result),
	recommendedQuestions: normalizeSuggestedQuestions(result),
	sources: Array.isArray(result.sources) ? result.sources : []
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
		suggestedQuestions() {
			return this.result.suggestedQuestions || XICHENG_SUGGESTED_QUESTIONS
		},
		sourceList() {
			return Array.isArray(this.result.sources) ? this.result.sources : []
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
			const prompt = question || this.suggestedQuestions[0] || `讲讲${this.result.poiName}`
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
.question-card,
.source-card {
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

.source-card {
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

.source-row {
	margin-top: 18rpx;
	padding: 22rpx;
	border-radius: 8rpx;
	border: 1rpx solid #D9E7DF;
	background: #FAFCFA;
}

.source-title,
.source-desc,
.source-empty {
	display: block;
	line-height: 1.55;
}

.source-title {
	font-size: 26rpx;
	font-weight: 700;
	color: #1F2933;
}

.source-desc,
.source-empty {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #667085;
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
