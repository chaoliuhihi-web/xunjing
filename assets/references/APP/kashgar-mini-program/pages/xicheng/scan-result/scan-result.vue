<template>
	<view class="scan-result xicheng-designed-page xicheng-bottom-safe">
		<view class="result-card xicheng-paper-card">
			<text class="label">{{ result.sourceLabel }}</text>
			<text class="poi-name">{{ result.poiName }}</text>
			<text class="reason">{{ result.reason || '小京已结合扫码、拍照、OCR和定位信号完成识别。' }}</text>
			<view class="meta-grid">
				<view>
					<text class="meta-value">{{ confidenceDisplay }}</text>
					<text class="meta-label">{{ confidenceMetaLabel }}</text>
				</view>
				<view>
					<text class="meta-value">{{ result.requiresUserConfirm ? '待确认' : '可直达' }}</text>
					<text class="meta-label">触发状态</text>
				</view>
				<view>
					<text class="meta-value">{{ safetyStatusLabel }}</text>
					<text class="meta-label">审核状态</text>
				</view>
			</view>
		</view>

		<view v-if="candidateList.length > 0" class="candidate-card xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<text class="section-title">可能匹配地点</text>
				<text class="section-badge">{{ candidateSectionBadge }}</text>
			</view>
			<view
				v-for="candidate in candidateList"
				:key="candidate.poiCode || candidate.poiName"
				class="candidate-row"
				:class="{ 'candidate-row-disabled': isUnsafeCandidate(candidate) }"
				@click="selectCandidate(candidate)"
			>
				<view>
					<text class="candidate-title">{{ candidate.poiName || '西城文化点' }}</text>
					<text v-if="candidate.summary || candidate.distanceMeters" class="candidate-desc">
						{{ formatCandidateSummary(candidate) }}
					</text>
				</view>
				<view class="candidate-side">
					<text class="candidate-confidence">{{ Math.round(Number(candidate.confidence || 0) * 100) }}%</text>
					<text v-if="isUnsafeCandidate(candidate)" class="candidate-safety">{{ candidateSafetyLabel(candidate) }}</text>
				</view>
			</view>
		</view>

		<view v-if="recommendedRoute" class="route-card xicheng-paper-card">
			<view class="section-head xicheng-section-label">
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

		<view class="question-card xicheng-paper-card">
			<text class="section-title">{{ questionSectionTitle }}</text>
			<view
				v-for="question in suggestedQuestions"
				:key="question"
				class="question-row"
				:class="{ 'question-row-disabled': recognitionActionBlocked }"
				@click="askXiaojing(question)"
			>
				<text>{{ question }}</text>
			</view>
			<text v-if="suggestedQuestions.length === 0" class="question-empty">{{ questionEmptyCopy }}</text>
		</view>

		<view class="source-card xicheng-paper-card">
			<text class="section-title">已审核来源</text>
			<view v-if="sourceList.length > 0">
				<view
					v-for="(source, index) in sourceList"
					:key="source.id || source.url || source.title || index"
					class="source-row"
				>
					<text class="source-title">{{ getDisplaySourceTitle(source) || '审核来源' }}</text>
					<text v-if="getDisplaySourceDescription(source)" class="source-desc">
						{{ getDisplaySourceDescription(source) }}
					</text>
				</view>
			</view>
			<text v-else class="source-empty">{{ sourceEmptyCopy }}</text>
		</view>

		<view class="feedback-card xicheng-paper-card">
			<view class="section-head xicheng-section-label">
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
				<button class="ghost-button xicheng-secondary-action" @click="submitRecognitionFeedback('correct')">识别准确</button>
				<button class="ghost-button danger-button xicheng-secondary-action" @click="submitRecognitionFeedback('wrong')">识别有误</button>
			</view>
			<text v-if="recognitionFeedback" class="source-empty">
				已记录为{{ recognitionFeedback.reviewStatus }}反馈，运营可用于 POI 纠错。
			</text>
			<view v-if="recognitionFeedback" class="feedback-actions">
				<button class="ghost-button danger-button xicheng-secondary-action" @click="withdrawRecognitionFeedback">撤回反馈</button>
			</view>
		</view>

		<view class="bottom-actions">
			<button class="primary-button xicheng-primary-action" :disabled="recognitionActionBlocked" @click="askXiaojing()">问问小京</button>
			<button class="ghost-button xicheng-secondary-action" :disabled="recognitionActionBlocked" @click="startRecording">开始记录</button>
		</view>
	</view>
</template>

<script>
import {
	XICHENG_REGION_CONFIG,
	XICHENG_OFFICIAL_POIS,
	XICHENG_RECOMMENDED_ROUTES,
	XICHENG_SUGGESTED_QUESTIONS,
	createXichengPoiSuggestedQuestions
} from '@/config/regions/xicheng.js'
import { submitXichengRecognitionFeedbackEvent } from '@/request/xunjing/events.js'
import { createXichengOfficialPoiSources } from '@/request/xunjing/officialPoi.js'
import { decodeXichengRouteValue } from '@/request/xunjing/routeParams.js'
import { normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'
import {
	getXichengDisplaySourceDescription,
	getXichengDisplaySourceTitle,
	normalizeXichengReviewedSources
} from '@/request/xunjing/sources.js'
import { isXichengDevelopmentRecognitionCacheBlocked } from '@/request/xunjing/trigger.js'

const XICHENG_EMPTY_RECOGNITION_RESULT = Object.freeze({
	regionCode: XICHENG_REGION_CONFIG.regionCode,
	packageCode: XICHENG_REGION_CONFIG.packageCode,
	sceneCode: XICHENG_REGION_CONFIG.sceneCode,
	sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
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
	sources: [],
	candidates: [],
	candidateConfirmationAudit: null
})

const normalizeSuggestedQuestions = (result = {}) => {
	const safetyStatus = normalizeXichengSafetyStatus(result.safetyStatus)
	if (['BLOCKED', 'UNAVAILABLE'].includes(safetyStatus)) {
		return []
	}
	if (Array.isArray(result.suggestedQuestions) && result.suggestedQuestions.length > 0) {
		return result.suggestedQuestions
	}
	if (Array.isArray(result.recommendedQuestions) && result.recommendedQuestions.length > 0) {
		return result.recommendedQuestions
	}
	return createXichengPoiSuggestedQuestions(result.poiName)
}

const normalizeReviewedSources = (result = {}) => {
	const safetyStatus = normalizeXichengSafetyStatus(result.safetyStatus)
	if (['BLOCKED', 'UNAVAILABLE'].includes(safetyStatus)) {
		return []
	}
	return normalizeXichengReviewedSources(result.sources)
}

const normalizeRecommendedRoute = (result = {}) => {
	const safetyStatus = normalizeXichengSafetyStatus(result.safetyStatus)
	if (['BLOCKED', 'UNAVAILABLE'].includes(safetyStatus)) {
		return null
	}
	return result.routeRecommendation || result.recommendedRoute || null
}

const decodeRouteValue = decodeXichengRouteValue

const normalizePoiCodeKey = (value = '') => String(value || '').trim().toLowerCase()
const normalizePoiNameKey = (value = '') => String(value || '').trim()

const findXichengOfficialPoiForResult = (result = {}) => {
	const poiCodeKey = normalizePoiCodeKey(result.poiCode)
	if (poiCodeKey) {
		const officialPoiByCode = XICHENG_OFFICIAL_POIS.find(poi => normalizePoiCodeKey(poi.poiCode) === poiCodeKey)
		if (officialPoiByCode) {
			return officialPoiByCode
		}
	}
	const poiNameKey = normalizePoiNameKey(result.poiName)
	if (!poiNameKey) {
		return null
	}
	return XICHENG_OFFICIAL_POIS.find(poi => {
		const aliases = Array.isArray(poi.aliases) ? poi.aliases : []
		return poi.poiName === poiNameKey || aliases.includes(poiNameKey)
	}) || null
}

const findXichengRecommendedRouteForPoi = (officialPoi = {}) => {
	const officialPoiCodeKey = normalizePoiCodeKey(officialPoi.poiCode)
	const officialPoiNameKey = normalizePoiNameKey(officialPoi.poiName)
	return XICHENG_RECOMMENDED_ROUTES.find(route => {
		const stops = Array.isArray(route.stops) ? route.stops : []
		return stops.some(stop => {
			return normalizePoiCodeKey(stop.poiCode) === officialPoiCodeKey
				|| normalizePoiNameKey(stop.poiName) === officialPoiNameKey
		})
	}) || null
}

const applyXichengOfficialPoiDefaults = (result = {}) => {
	const safetyStatus = normalizeXichengSafetyStatus(result.safetyStatus)
	if (['BLOCKED', 'UNAVAILABLE'].includes(safetyStatus)) {
		return result
	}
	const officialPoi = findXichengOfficialPoiForResult(result)
	if (!officialPoi) {
		return result
	}
	const existingSources = normalizeXichengReviewedSources(result.sources)
	const recommendedRoute = result.routeRecommendation || result.recommendedRoute || findXichengRecommendedRouteForPoi(officialPoi)
	return {
		...result,
		officialPoiMatched: true,
		poiCode: result.poiCode || officialPoi.poiCode,
		poiName: result.poiName || officialPoi.poiName,
		theme: result.theme || officialPoi.theme,
		reason: result.reason || officialPoi.summary || '已匹配西城官方 POI，可继续问小京。',
		requiresUserConfirm: result.requiresUserConfirm === undefined ? false : result.requiresUserConfirm,
		sources: existingSources.length > 0 ? existingSources : createXichengOfficialPoiSources(officialPoi),
		routeRecommendation: recommendedRoute,
		recommendedRoute
	}
}

const normalizeRouteOptions = (options = {}) => ({
	source: decodeRouteValue(options.source),
	regionCode: decodeRouteValue(options.regionCode),
	packageCode: decodeRouteValue(options.packageCode),
	sceneCode: decodeRouteValue(options.sceneCode),
	sourceChannel: decodeRouteValue(options.sourceChannel),
	poiCode: decodeRouteValue(options.poiCode),
	poiName: decodeRouteValue(options.poiName),
	companionName: decodeRouteValue(options.companionName),
	safetyStatus: normalizeXichengSafetyStatus(decodeRouteValue(options.safetyStatus))
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

const clampConfidence = (value) => Math.min(1, Math.max(0, value))

const clampConfidencePercent = (value) => Math.min(100, Math.max(0, value))

const normalizeCandidateConfidence = (candidate = {}) => {
	const hasConfidence = candidate.confidence !== undefined && candidate.confidence !== null && candidate.confidence !== ''
	const numericValue = hasConfidence
		? Number(candidate.confidence)
		: Number(candidate.confidencePercent)
	const rawConfidence = hasConfidence
		? numericValue
		: numericValue / 100
	if (!Number.isFinite(rawConfidence)) {
		return 0
	}
	return clampConfidence(hasConfidence && rawConfidence > 1 ? rawConfidence / 100 : rawConfidence)
}

const normalizeConfidencePercent = (result = {}) => {
	const explicitPercent = Number(result.confidencePercent)
	if (result.confidencePercent !== undefined && result.confidencePercent !== null && result.confidencePercent !== '' && Number.isFinite(explicitPercent)) {
		return clampConfidencePercent(Math.round(explicitPercent))
	}
	return clampConfidencePercent(Math.round(normalizeCandidateConfidence(result) * 100))
}

const normalizeRecognitionCandidate = (candidate = {}) => ({
	...candidate,
	poiCode: candidate.poiCode || '',
	poiName: candidate.poiName || '',
	confidence: normalizeCandidateConfidence(candidate),
	safetyStatus: normalizeXichengSafetyStatus(candidate.safetyStatus),
	suggestedQuestions: normalizeSuggestedQuestions(candidate),
	recommendedQuestions: normalizeSuggestedQuestions(candidate),
	sources: normalizeReviewedSources(candidate)
})

const normalizeRecognitionCandidates = (candidates = []) => Array.isArray(candidates)
	? candidates.map(normalizeRecognitionCandidate).filter(candidate => candidate.poiCode || candidate.poiName)
	: []

const normalizeResult = (result = {}) => ({
	...XICHENG_EMPTY_RECOGNITION_RESULT,
	...result,
	regionCode: result.regionCode || XICHENG_REGION_CONFIG.regionCode,
	packageCode: result.packageCode || XICHENG_REGION_CONFIG.packageCode,
	sceneCode: result.sceneCode || XICHENG_REGION_CONFIG.sceneCode,
	sourceChannel: result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
	companionName: result.companionName || XICHENG_REGION_CONFIG.companionName,
	poiName: result.poiName || XICHENG_EMPTY_RECOGNITION_RESULT.poiName,
	confidence: normalizeCandidateConfidence(result),
	confidencePercent: normalizeConfidencePercent(result),
	suggestedQuestions: normalizeSuggestedQuestions(result),
	recommendedQuestions: normalizeSuggestedQuestions(result),
	routeRecommendation: normalizeRecommendedRoute(result),
	recommendedRoute: normalizeRecommendedRoute(result),
	safetyStatus: normalizeXichengSafetyStatus(result.safetyStatus),
	sources: normalizeReviewedSources(result),
	candidates: normalizeRecognitionCandidates(result.candidates),
	officialPoiMatched: Boolean(result.officialPoiMatched)
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
			const explicitPercent = Number(this.result.confidencePercent)
			if (Number.isFinite(explicitPercent)) {
				return Math.round(explicitPercent)
			}
			return Math.round(Number(this.result.confidence || 0) * 100)
		},
		hasDisplayableConfidence() {
			return Number(this.result.confidencePercent || 0) > 0 || Number(this.result.confidence || 0) > 0
		},
		confidenceMetaLabel() {
			if (this.hasDisplayableConfidence) return '置信度'
			if (this.result.officialPoiMatched) return '官方匹配'
			return '置信度'
		},
		confidenceDisplay() {
			if (this.hasDisplayableConfidence) {
				return `${this.confidencePercent}%`
			}
			if (this.result.officialPoiMatched) return '官方POI'
			return '0%'
		},
		suggestedQuestions() {
			return this.result.suggestedQuestions || createXichengPoiSuggestedQuestions(this.result.poiName)
		},
		sourceList() {
			return Array.isArray(this.result.sources) ? this.result.sources : []
		},
		safetyStatusLabel() {
			const safetyStatus = normalizeXichengSafetyStatus(this.result.safetyStatus)
			if (safetyStatus === 'BLOCKED') return '已拦截'
			if (safetyStatus === 'UNAVAILABLE') return '来源服务不可用'
			if (this.sourceList.length > 0) return '来源可用'
			return '待审核'
		},
		sourceEmptyCopy() {
			const safetyStatus = normalizeXichengSafetyStatus(this.result.safetyStatus)
			if (safetyStatus === 'BLOCKED') {
				return '无已审核来源，不能回答'
			}
			if (safetyStatus === 'UNAVAILABLE') {
				return '小京暂时无法获取已审核来源，请稍后再试'
			}
			return '暂无已审核来源，小京会按后台审核状态回答。'
		},
		questionEmptyCopy() {
			const safetyStatus = normalizeXichengSafetyStatus(this.result.safetyStatus)
			if (safetyStatus === 'BLOCKED') {
				return '无已审核来源，不能问小京'
			}
			if (safetyStatus === 'UNAVAILABLE') {
				return '小京暂时无法获取已审核来源，不能问小京'
			}
			return '暂无可继续追问的问题'
		},
		candidateSectionBadge() {
			if (this.pendingCandidateConfirmation) return '请选择官方 POI'
			return '已确认官方 POI'
		},
		questionSectionTitle() {
			if (this.pendingCandidateConfirmation) return '确认官方 POI 后可问小京'
			if (this.missingOfficialPoiContext) return '匹配官方 POI 后可问小京'
			if (this.unsafeRecognitionSafetyStatus) return this.sourceEmptyCopy
			return '可以继续问小京'
		},
		unsafeRecognitionSafetyStatus() {
			const safetyStatus = normalizeXichengSafetyStatus(this.result.safetyStatus)
			return ['BLOCKED', 'UNAVAILABLE'].includes(safetyStatus)
		},
		candidateList() {
			return normalizeRecognitionCandidates(this.result.candidates)
		},
		recommendedRoute() {
			if (this.unsafeRecognitionSafetyStatus) return null
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
		},
		pendingCandidateConfirmation() {
			return Boolean(this.result.requiresUserConfirm && this.candidateList.length > 0)
		},
		missingOfficialPoiContext() {
			const hasMissingPoi = !this.result.poiCode || !this.result.poiName || this.result.poiName === XICHENG_EMPTY_RECOGNITION_RESULT.poiName
			const hasOfficialPoiMatch = Boolean(this.result.officialPoiMatched)
			const hasReviewedSources = this.sourceList.length > 0
			return hasMissingPoi || (!hasOfficialPoiMatch && !hasReviewedSources)
		},
		recognitionActionBlocked() {
			return this.pendingCandidateConfirmation || this.missingOfficialPoiContext || this.unsafeRecognitionSafetyStatus
		}
	},
	onLoad(options = {}) {
		const cached = uni.getStorageSync(XICHENG_REGION_CONFIG.storageKey)
		const routeOptions = normalizeRouteOptions(options)
		const cachedBlockedByProductionFixture = this.isBlockedDevelopmentRecognitionCache(cached)
		if (cachedBlockedByProductionFixture) {
			uni.removeStorageSync(XICHENG_REGION_CONFIG.storageKey)
		}
		const selectedCached = cachedBlockedByProductionFixture
			? null
			: selectCachedRecognitionForRoute(cached, options)
		const normalizedResult = normalizeResult(applyXichengOfficialPoiDefaults({
			...(selectedCached || {}),
			source: routeOptions.source || (selectedCached && selectedCached.source) || '',
			regionCode: routeOptions.regionCode || (selectedCached && selectedCached.regionCode) || XICHENG_REGION_CONFIG.regionCode,
			packageCode: routeOptions.packageCode || (selectedCached && selectedCached.packageCode) || XICHENG_REGION_CONFIG.packageCode,
			sceneCode: routeOptions.sceneCode || (selectedCached && selectedCached.sceneCode) || XICHENG_REGION_CONFIG.sceneCode,
			sourceChannel: routeOptions.sourceChannel || (selectedCached && selectedCached.sourceChannel) || XICHENG_REGION_CONFIG.sourceChannel,
			poiCode: routeOptions.poiCode || (selectedCached && selectedCached.poiCode) || '',
			poiName: routeOptions.poiName || (selectedCached && selectedCached.poiName) || XICHENG_EMPTY_RECOGNITION_RESULT.poiName,
			companionName: routeOptions.companionName || (selectedCached && selectedCached.companionName) || XICHENG_REGION_CONFIG.companionName,
			safetyStatus: routeOptions.safetyStatus || (selectedCached && selectedCached.safetyStatus) || ''
		}))
		this.result = normalizedResult
		if (this.result.officialPoiMatched && this.result.poiCode && this.result.poiName) {
			uni.setStorageSync(XICHENG_REGION_CONFIG.storageKey, this.result)
		}
		this.loadRecognitionFeedback()
	},
	methods: {
		isBlockedDevelopmentRecognitionCache(recognition = {}) {
			return isXichengDevelopmentRecognitionCacheBlocked(recognition)
		},
		requireOfficialPoiConfirmation(actionLabel = '继续') {
			uni.showToast({
				title: `请先选择官方 POI 再${actionLabel}`,
				icon: 'none'
			})
		},
		showMissingOfficialPoiToast(actionLabel = '继续') {
			uni.showToast({
				title: `暂无官方 POI 匹配，不能${actionLabel}`,
				icon: 'none'
			})
		},
		showUnsafeRecognitionToast(actionLabel = '继续') {
			uni.showToast({
				title: this.sourceEmptyCopy || `无已审核来源，不能${actionLabel}`,
				icon: 'none'
			})
		},
		isUnsafeCandidate(candidate = {}) {
			const safetyStatus = normalizeXichengSafetyStatus(candidate.safetyStatus)
			return ['BLOCKED', 'UNAVAILABLE'].includes(safetyStatus)
		},
		candidateSafetyLabel(candidate = {}) {
			const safetyStatus = normalizeXichengSafetyStatus(candidate.safetyStatus)
			if (safetyStatus === 'BLOCKED') return '已拦截'
			if (safetyStatus === 'UNAVAILABLE') return '来源不可用'
			return ''
		},
		showUnsafeCandidateToast(candidate = {}) {
			const safetyStatus = normalizeXichengSafetyStatus(candidate.safetyStatus)
			uni.showToast({
				title: safetyStatus === 'UNAVAILABLE' ? '来源服务不可用，不能确认' : '无已审核来源，不能确认',
				icon: 'none'
			})
		},
		askXiaojing(question = '') {
			if (this.pendingCandidateConfirmation) {
				this.requireOfficialPoiConfirmation('问小京')
				return
			}
			if (this.missingOfficialPoiContext) {
				this.showMissingOfficialPoiToast('问小京')
				return
			}
			if (this.unsafeRecognitionSafetyStatus) {
				this.showUnsafeRecognitionToast('问小京')
				return
			}
			const prompt = question || this.suggestedQuestions[0] || `讲讲${this.result.poiName}`
			const query = [
				`question=${encodeURIComponent(prompt)}`,
				`regionCode=${encodeURIComponent(this.result.regionCode || XICHENG_REGION_CONFIG.regionCode)}`,
				`packageCode=${encodeURIComponent(this.result.packageCode || XICHENG_REGION_CONFIG.packageCode)}`,
				`sceneCode=${encodeURIComponent(this.result.sceneCode || XICHENG_REGION_CONFIG.sceneCode)}`,
				`sourceChannel=${encodeURIComponent(this.result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel)}`,
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
		selectCandidate(candidate) {
			const selectedCandidate = normalizeRecognitionCandidate(applyXichengOfficialPoiDefaults(candidate))
			if (this.isUnsafeCandidate(selectedCandidate)) {
				this.showUnsafeCandidateToast(selectedCandidate)
				return
			}
			const retainedReviewedSources = selectedCandidate.sources.length > 0 ? selectedCandidate.sources : this.sourceList
			const candidateConfirmationAudit = this.createCandidateConfirmationAudit(selectedCandidate, retainedReviewedSources)
			const retainedRouteRecommendation = selectedCandidate.routeRecommendation || selectedCandidate.recommendedRoute || this.result.routeRecommendation || this.result.recommendedRoute || null
			this.result = normalizeResult({
				...this.result,
				...selectedCandidate,
				poiCode: selectedCandidate.poiCode,
				poiName: selectedCandidate.poiName,
				confidence: selectedCandidate.confidence,
				requiresUserConfirm: false,
				reason: selectedCandidate.summary || this.result.reason,
				safetyStatus: selectedCandidate.safetyStatus,
				officialPoiMatched: selectedCandidate.officialPoiMatched,
				sources: retainedReviewedSources,
				suggestedQuestions: selectedCandidate.suggestedQuestions,
				recommendedQuestions: selectedCandidate.suggestedQuestions,
				routeRecommendation: retainedRouteRecommendation,
				recommendedRoute: retainedRouteRecommendation,
				candidateConfirmationAudit
			})
			uni.setStorageSync(XICHENG_REGION_CONFIG.storageKey, this.result)
			uni.showToast({
				title: '已确认识别地点',
				icon: 'none'
			})
		},
		createCandidateConfirmationAudit(selectedCandidate, retainedReviewedSources) {
			return {
				auditType: 'recognition-candidate-confirmation',
				regionCode: this.result.regionCode || XICHENG_REGION_CONFIG.regionCode,
				packageCode: this.result.packageCode || XICHENG_REGION_CONFIG.packageCode,
				sceneCode: this.result.sceneCode || XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: this.result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
				candidateCount: this.candidateList.length,
				candidatePoiCodes: this.candidateList
					.map(candidate => candidate.poiCode)
					.filter(Boolean),
				selectedCandidatePoiCode: selectedCandidate.poiCode,
				selectedCandidatePoiName: selectedCandidate.poiName,
				selectedCandidateConfidence: selectedCandidate.confidence,
				reviewedSourceCount: retainedReviewedSources.length,
				confirmationSource: 'user-selected-candidate',
				confirmedAt: new Date().toISOString()
			}
		},
		formatCandidateSummary(candidate = {}) {
			return candidate.summary || `距离约 ${candidate.distanceMeters} 米`
		},
		getDisplaySourceTitle(source = {}) {
			return getXichengDisplaySourceTitle(source)
		},
		getDisplaySourceDescription(source = {}) {
			return getXichengDisplaySourceDescription(source)
		},
		startRecording() {
			if (this.pendingCandidateConfirmation) {
				this.requireOfficialPoiConfirmation('开始记录')
				return
			}
			if (this.missingOfficialPoiContext) {
				this.showMissingOfficialPoiToast('开始记录')
				return
			}
			if (this.unsafeRecognitionSafetyStatus) {
				this.showUnsafeRecognitionToast('开始记录')
				return
			}
			const existingMaterials = uni.getStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey)
			const material = {
				type: 'recognition',
				regionCode: this.result.regionCode || XICHENG_REGION_CONFIG.regionCode,
				packageCode: this.result.packageCode || XICHENG_REGION_CONFIG.packageCode,
				sceneCode: this.result.sceneCode || XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: this.result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
				poiCode: this.result.poiCode || '',
				poiName: this.result.poiName || '',
				sourceLabel: this.result.sourceLabel || '',
				confidence: this.result.confidence || 0,
				routeRecommendation: this.recommendedRoute,
				sources: this.sourceList,
				safetyStatus: normalizeXichengSafetyStatus(this.result.safetyStatus),
				recognitionFeedback: this.recognitionFeedback,
				candidateConfirmationAudit: this.result.candidateConfirmationAudit || null,
				reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
				publishStatus: 'private',
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
				url: `/pages/xicheng/travelogue/travelogue?mode=record&autoStart=1&regionCode=${encodeURIComponent(this.result.regionCode || XICHENG_REGION_CONFIG.regionCode)}&packageCode=${encodeURIComponent(this.result.packageCode || XICHENG_REGION_CONFIG.packageCode)}&sceneCode=${encodeURIComponent(this.result.sceneCode || XICHENG_REGION_CONFIG.sceneCode)}&sourceChannel=${encodeURIComponent(this.result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel)}&poiCode=${encodeURIComponent(this.result.poiCode || '')}&poiName=${encodeURIComponent(this.result.poiName || '')}&companionName=${encodeURIComponent(this.result.companionName || XICHENG_REGION_CONFIG.companionName)}&safetyStatus=${encodeURIComponent(this.result.safetyStatus || '')}`
			})
		},
		createRouteCheckinEvent(material) {
			return {
				checkinId: `checkin-${Date.now()}`,
				checkinType: 'recognition-poi',
				checkinLabel: '打卡事件',
				regionCode: material.regionCode,
				packageCode: material.packageCode,
				sceneCode: material.sceneCode,
				sourceChannel: material.sourceChannel,
				routeTitle: this.recommendedRoute && this.recommendedRoute.title ? this.recommendedRoute.title : '西城 Citywalk',
				poiCode: material.poiCode,
				poiName: material.poiName,
				sourceLabel: material.sourceLabel,
				confidence: material.confidence,
				sources: material.sources,
				safetyStatus: normalizeXichengSafetyStatus(material.safetyStatus),
				candidateConfirmationAudit: material.candidateConfirmationAudit || null,
				reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
				publishStatus: 'private',
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
			this.submitRecognitionFeedbackEvent(feedback)
			this.recognitionFeedback = feedback
			this.feedbackNote = ''
			uni.showToast({
				title: '识别反馈已记录',
				icon: 'none'
			})
		},
		submitRecognitionFeedbackEvent(feedback) {
			submitXichengRecognitionFeedbackEvent(feedback)
				.then(() => this.updateRecognitionFeedbackSyncStatus(feedback.feedbackId, 'synced'))
				.catch(() => this.updateRecognitionFeedbackSyncStatus(feedback.feedbackId, 'local_pending'))
		},
		updateRecognitionFeedbackSyncStatus(feedbackId, syncStatus) {
			if (!feedbackId) return
			const existingFeedbacks = uni.getStorageSync(XICHENG_REGION_CONFIG.recognitionFeedbackStorageKey)
			const feedbacks = Array.isArray(existingFeedbacks) ? existingFeedbacks : []
			const syncedAt = syncStatus === 'synced' ? new Date().toISOString() : ''
			const nextFeedbacks = feedbacks.map(feedback => {
				if (!feedback || feedback.feedbackId !== feedbackId) return feedback
				return {
					...feedback,
					syncStatus,
					syncedAt: syncedAt || feedback.syncedAt || ''
				}
			})
			uni.setStorageSync(XICHENG_REGION_CONFIG.recognitionFeedbackStorageKey, nextFeedbacks)
			if (this.recognitionFeedback && this.recognitionFeedback.feedbackId === feedbackId) {
				this.recognitionFeedback = nextFeedbacks.find(feedback => feedback && feedback.feedbackId === feedbackId) || this.recognitionFeedback
			}
		},
		withdrawRecognitionFeedback() {
			const feedbackId = this.recognitionFeedback && this.recognitionFeedback.feedbackId ? this.recognitionFeedback.feedbackId : ''
			const existingFeedbacks = uni.getStorageSync(XICHENG_REGION_CONFIG.recognitionFeedbackStorageKey)
			const feedbacks = Array.isArray(existingFeedbacks) ? existingFeedbacks : []
			const remainingFeedbacks = feedbackId
				? feedbacks.filter(feedback => feedback && feedback.feedbackId !== feedbackId)
				: feedbacks.filter(feedback => !(feedback && feedback.poiCode === this.result.poiCode && feedback.source === this.result.source))
			uni.setStorageSync(XICHENG_REGION_CONFIG.recognitionFeedbackStorageKey, remainingFeedbacks)
			this.recognitionFeedback = null
			uni.showToast({
				title: '识别反馈已撤回',
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
				sceneCode: this.result.sceneCode,
				sourceChannel: this.result.sourceChannel,
				poiCode: this.result.poiCode,
				poiName: this.result.poiName,
				confidence: this.result.confidence,
				source: this.result.source || '',
				sourceLabel: this.result.sourceLabel,
				sources: this.sourceList,
				safetyStatus: normalizeXichengSafetyStatus(this.result.safetyStatus),
				candidateConfirmationAudit: this.result.candidateConfirmationAudit || null,
				feedbackNote: this.feedbackNote.trim(),
				misTrigger: feedbackType === 'wrong',
				eventType: 'ERROR_FEEDBACK',
				syncStatus: 'local_pending',
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
	padding: 40rpx 28rpx 56rpx;
	box-sizing: border-box;
	color: #102F29;
}

.result-card,
.question-card,
.route-card,
.candidate-card,
.source-card,
.feedback-card {
	padding: 32rpx;
	border-radius: 34rpx;
}

.label,
.reason,
.meta-label {
	display: block;
	font-size: 24rpx;
	line-height: 1.6;
	color: #746F68;
}

.poi-name {
	display: block;
	margin-top: 12rpx;
	font-size: 44rpx;
	font-weight: 700;
	color: #102F29;
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
	border-radius: 24rpx;
	background: rgba(23, 63, 53, 0.08);
}

.meta-value {
	display: block;
	font-size: 32rpx;
	font-weight: 700;
	color: #173F35;
}

.question-card {
	margin-top: 28rpx;
}

.candidate-card {
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
	color: #102F29;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.section-head.xicheng-section-label {
	justify-content: flex-start;
}

.section-head.xicheng-section-label .section-badge {
	margin-left: auto;
}

.section-badge {
	flex-shrink: 0;
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.16);
	font-size: 22rpx;
	color: #173F35;
}

.route-title {
	display: block;
	margin-top: 18rpx;
	font-size: 28rpx;
	font-weight: 700;
	color: #102F29;
}

.route-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #746F68;
}

.route-steps {
	margin-top: 18rpx;
}

.route-stop {
	display: block;
	margin-top: 12rpx;
	padding: 18rpx;
	border-radius: 22rpx;
	background: rgba(23, 63, 53, 0.08);
	font-size: 26rpx;
	color: #173F35;
}

.question-row {
	margin-top: 18rpx;
	padding: 22rpx;
	border-radius: 22rpx;
	background: rgba(255, 252, 246, 0.72);
	font-size: 26rpx;
	color: #173F35;
}

.question-row-disabled {
	opacity: 0.58;
}

.question-empty {
	display: block;
	margin-top: 18rpx;
	font-size: 24rpx;
	line-height: 1.6;
	color: #667085;
}

.candidate-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	margin-top: 18rpx;
	padding: 22rpx;
	border-radius: 24rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.24);
	background: rgba(255, 252, 246, 0.72);
}

.candidate-row-disabled {
	background: #FFF7F5;
	border-color: #F4C7C3;
}

.candidate-title,
.candidate-desc,
.candidate-confidence {
	display: block;
	line-height: 1.5;
}

.candidate-side {
	flex-shrink: 0;
	text-align: right;
}

.candidate-title {
	font-size: 28rpx;
	font-weight: 700;
	color: #102F29;
}

.candidate-desc {
	margin-top: 6rpx;
	font-size: 24rpx;
	color: #746F68;
}

.candidate-confidence {
	font-size: 28rpx;
	font-weight: 700;
	color: #173F35;
}

.candidate-safety {
	display: block;
	margin-top: 4rpx;
	font-size: 22rpx;
	color: #B42318;
}

.source-row {
	margin-top: 18rpx;
	padding: 22rpx;
	border-radius: 24rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.24);
	background: rgba(255, 252, 246, 0.72);
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
	color: #102F29;
}

.source-desc,
.source-empty {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #746F68;
}

.feedback-input {
	width: 100%;
	min-height: 112rpx;
	margin-top: 20rpx;
	padding: 20rpx;
	box-sizing: border-box;
	border: 1rpx solid rgba(181, 148, 94, 0.24);
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.72);
	font-size: 26rpx;
	color: #173F35;
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
	border-radius: 28rpx;
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
