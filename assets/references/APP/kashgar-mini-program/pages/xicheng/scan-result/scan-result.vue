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

		<view v-if="recommendedRoute" class="route-card">
			<view class="section-head">
				<text class="section-title">推荐路线</text>
				<text class="section-badge">{{ recommendedRoute.durationText || recommendedRoute.duration || '可加入路线护照' }}</text>
			</view>
			<text class="route-title">{{ recommendedRoute.title || '西城 Citywalk 推荐路线' }}</text>
			<text v-if="recommendedRoute.summary || recommendedRoute.theme" class="route-desc">
				{{ recommendedRoute.summary || recommendedRoute.theme }}
			</text>
			<view v-if="routeSteps.length > 0" class="route-steps">
				<text
					v-for="(stop, index) in routeSteps"
					:key="`${stop.poiCode || stop.poiName || stop}-${index}`"
					class="route-stop"
				>
					{{ index + 1 }}. {{ stop.poiName || stop }}
				</text>
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

		<view class="feedback-card">
			<view class="section-head">
				<text class="section-title">识别反馈</text>
				<text class="section-badge">{{ recognitionFeedback ? recognitionFeedback.feedbackLabel : '待反馈' }}</text>
			</view>
			<textarea
				v-model="feedbackNote"
				class="feedback-input"
				placeholder="可补充正确地点、展牌文字或现场线索"
				auto-height
			/>
			<view class="feedback-actions">
				<button class="ghost-button" @click="submitRecognitionFeedback('correct')">识别准确</button>
				<button class="ghost-button danger-button" @click="submitRecognitionFeedback('wrong')">识别有误</button>
			</view>
			<text v-if="recognitionFeedback" class="source-empty">
				已记录为{{ recognitionFeedback.reviewStatus }}反馈，运营可用于 POI 纠错。
			</text>
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
import { normalizeXichengReviewedSources } from '@/request/xunjing/sources.js'

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
	routeRecommendation: null,
	recommendedRoute: null,
	safetyStatus: '',
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

const decodeRouteValue = (value = '') => {
	try {
		return decodeURIComponent(String(value || ''))
	} catch (error) {
		return String(value || '')
	}
}

const normalizeRouteOptions = (options = {}) => ({
	source: decodeRouteValue(options.source),
	regionCode: decodeRouteValue(options.regionCode),
	packageCode: decodeRouteValue(options.packageCode),
	poiCode: decodeRouteValue(options.poiCode),
	poiName: decodeRouteValue(options.poiName),
	companionName: decodeRouteValue(options.companionName),
	safetyStatus: decodeRouteValue(options.safetyStatus)
})

const selectCachedRecognitionForRoute = (cached = {}, options = {}) => {
	if (!cached || typeof cached !== 'object') {
		return null
	}
	const routePoiCode = decodeRouteValue(options.poiCode)
	if (routePoiCode && cached.poiCode !== routePoiCode) {
		return null
	}
	const routePoiName = decodeRouteValue(options.poiName)
	if (routePoiName && cached.poiName !== routePoiName) {
		return null
	}
	const routeRegionCode = decodeRouteValue(options.regionCode)
	if (routeRegionCode && cached.regionCode && cached.regionCode !== routeRegionCode) {
		return null
	}
	return cached
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
	routeRecommendation: result.routeRecommendation || result.recommendedRoute || null,
	recommendedRoute: result.routeRecommendation || result.recommendedRoute || null,
	safetyStatus: result.safetyStatus || '',
	sources: normalizeXichengReviewedSources(result.sources)
})

export default {
	data() {
		return {
			result: normalizeResult(),
			feedbackNote: '',
			recognitionFeedback: null
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
		},
		recommendedRoute() {
			return this.result.routeRecommendation || this.result.recommendedRoute || null
		},
		routeSteps() {
			if (!this.recommendedRoute) return []
			if (Array.isArray(this.recommendedRoute.stops) && this.recommendedRoute.stops.length > 0) {
				return this.recommendedRoute.stops
			}
			const title = String(this.recommendedRoute.title || '')
			return title
				.split(/\s*[-—－]\s*/)
				.map(name => name.trim())
				.filter(Boolean)
		}
	},
	onLoad(options = {}) {
		const cached = uni.getStorageSync(XICHENG_REGION_CONFIG.storageKey)
		const routeOptions = normalizeRouteOptions(options)
		const selectedCached = selectCachedRecognitionForRoute(cached, options)
		this.result = normalizeResult({
			...(selectedCached || {}),
			source: routeOptions.source || (selectedCached && selectedCached.source) || '',
			regionCode: routeOptions.regionCode || (selectedCached && selectedCached.regionCode) || XICHENG_REGION_CONFIG.regionCode,
			packageCode: routeOptions.packageCode || (selectedCached && selectedCached.packageCode) || XICHENG_REGION_CONFIG.packageCode,
			poiCode: routeOptions.poiCode || (selectedCached && selectedCached.poiCode) || '',
			poiName: routeOptions.poiName || (selectedCached && selectedCached.poiName) || XICHENG_EMPTY_RECOGNITION_RESULT.poiName,
			companionName: routeOptions.companionName || (selectedCached && selectedCached.companionName) || XICHENG_REGION_CONFIG.companionName,
			safetyStatus: routeOptions.safetyStatus || (selectedCached && selectedCached.safetyStatus) || ''
		})
		this.loadRecognitionFeedback()
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
				`confidence=${encodeURIComponent(String(this.result.confidence || ''))}`,
				`safetyStatus=${encodeURIComponent(this.result.safetyStatus || '')}`
			].join('&')
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?${query}`
			})
		},
		startRecording() {
			const existingMaterials = uni.getStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey)
			const material = {
				type: 'recognition',
				regionCode: this.result.regionCode || XICHENG_REGION_CONFIG.regionCode,
				packageCode: this.result.packageCode || XICHENG_REGION_CONFIG.packageCode,
				poiCode: this.result.poiCode || '',
				poiName: this.result.poiName || '',
				sourceLabel: this.result.sourceLabel || '',
				confidence: this.result.confidence || 0,
				routeRecommendation: this.recommendedRoute,
				sources: this.sourceList,
				safetyStatus: this.result.safetyStatus || '',
				recognitionFeedback: this.recognitionFeedback,
				capturedAt: new Date().toISOString()
			}
			const checkinEvent = this.createRouteCheckinEvent(material)
			this.persistRouteCheckinEvent(checkinEvent)
			const materials = Array.isArray(existingMaterials) ? existingMaterials : []
			uni.setStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey, [
				material,
				...materials
			].slice(0, 50))
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?mode=record&autoStart=1&regionCode=${encodeURIComponent(this.result.regionCode || XICHENG_REGION_CONFIG.regionCode)}&packageCode=${encodeURIComponent(this.result.packageCode || XICHENG_REGION_CONFIG.packageCode)}&poiCode=${encodeURIComponent(this.result.poiCode || '')}&poiName=${encodeURIComponent(this.result.poiName || '')}&companionName=${encodeURIComponent(this.result.companionName || XICHENG_REGION_CONFIG.companionName)}&safetyStatus=${encodeURIComponent(this.result.safetyStatus || '')}`
			})
		},
		createRouteCheckinEvent(material) {
			return {
				checkinId: `checkin-${Date.now()}`,
				checkinType: 'recognition-poi',
				checkinLabel: '打卡事件',
				regionCode: material.regionCode,
				packageCode: material.packageCode,
				routeTitle: this.recommendedRoute && this.recommendedRoute.title ? this.recommendedRoute.title : '西城 Citywalk',
				poiCode: material.poiCode,
				poiName: material.poiName,
				sourceLabel: material.sourceLabel,
				confidence: material.confidence,
				sources: material.sources,
				safetyStatus: material.safetyStatus || '',
				checkedInAt: material.capturedAt
			}
		},
		persistRouteCheckinEvent(checkinEvent) {
			const existingCheckins = uni.getStorageSync(XICHENG_REGION_CONFIG.checkinStorageKey)
			const checkins = Array.isArray(existingCheckins) ? existingCheckins : []
			uni.setStorageSync(XICHENG_REGION_CONFIG.checkinStorageKey, [
				checkinEvent,
				...checkins
			].slice(0, 80))
		},
		loadRecognitionFeedback() {
			const existingFeedbacks = uni.getStorageSync(XICHENG_REGION_CONFIG.recognitionFeedbackStorageKey)
			const feedbacks = Array.isArray(existingFeedbacks) ? existingFeedbacks : []
			this.recognitionFeedback = feedbacks.find(feedback => {
				return feedback
					&& feedback.poiCode === this.result.poiCode
					&& feedback.source === this.result.source
			}) || null
		},
		submitRecognitionFeedback(feedbackType = 'correct') {
			const feedback = this.createRecognitionFeedback(feedbackType)
			this.persistRecognitionFeedback(feedback)
			this.recognitionFeedback = feedback
			this.feedbackNote = ''
			uni.showToast({
				title: '识别反馈已记录',
				icon: 'none'
			})
		},
		createRecognitionFeedback(feedbackType = 'correct') {
			const createdAt = new Date().toISOString()
			return {
				feedbackId: `feedback-${Date.now()}`,
				feedbackType,
				feedbackLabel: feedbackType === 'wrong' ? '识别有误' : '识别准确',
				regionCode: this.result.regionCode,
				packageCode: this.result.packageCode,
				poiCode: this.result.poiCode,
				poiName: this.result.poiName,
				confidence: this.result.confidence,
				source: this.result.source || '',
				sourceLabel: this.result.sourceLabel,
				sources: this.sourceList,
				safetyStatus: this.result.safetyStatus || '',
				feedbackNote: this.feedbackNote.trim(),
				misTrigger: feedbackType === 'wrong',
				reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
				publishStatus: 'private',
				createdAt
			}
		},
		persistRecognitionFeedback(feedback) {
			const existingFeedbacks = uni.getStorageSync(XICHENG_REGION_CONFIG.recognitionFeedbackStorageKey)
			const feedbacks = Array.isArray(existingFeedbacks) ? existingFeedbacks : []
			uni.setStorageSync(XICHENG_REGION_CONFIG.recognitionFeedbackStorageKey, [
				feedback,
				...feedbacks
			].slice(0, 80))
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
.route-card,
.source-card,
.feedback-card {
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

.feedback-card {
	margin-top: 28rpx;
}

.route-card {
	margin-top: 28rpx;
}

.section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.section-badge {
	flex-shrink: 0;
	padding: 8rpx 14rpx;
	border-radius: 8rpx;
	background: #EEF5F1;
	font-size: 22rpx;
	color: #1F6E5A;
}

.route-title {
	display: block;
	margin-top: 18rpx;
	font-size: 28rpx;
	font-weight: 700;
	color: #1F2933;
}

.route-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #667085;
}

.route-steps {
	margin-top: 18rpx;
}

.route-stop {
	display: block;
	margin-top: 12rpx;
	padding: 18rpx;
	border-radius: 8rpx;
	background: #F2F4F7;
	font-size: 26rpx;
	color: #344054;
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

.feedback-input {
	width: 100%;
	min-height: 112rpx;
	margin-top: 20rpx;
	padding: 20rpx;
	box-sizing: border-box;
	border-radius: 8rpx;
	background: #F2F4F7;
	font-size: 26rpx;
	color: #344054;
}

.feedback-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 18rpx;
}

.danger-button {
	color: #B42318;
	background: #FFF5F5;
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
