<template>
	<view class="scan-result xicheng-designed-page xicheng-bottom-safe">
		<view class="scan-result-topbar">
			<view class="scan-result-back" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="scan-result-title">识别结果</text>
			<view class="scan-result-share">
				<xicheng-icon name="edit" variant="plain" :size="20" />
			</view>
		</view>

		<view class="result-card xicheng-paper-card xicheng-reference-result-card">
			<view class="result-hero-layout">
				<image
					v-if="resultVisualImage"
					class="result-poi-image"
					:src="resultVisualImage"
					mode="aspectFill"
				/>
				<view class="result-hero-copy">
					<text class="poi-name">{{ result.poiName }}</text>
					<view class="confidence-line">
						<text>{{ confidenceMetaLabel }}</text>
						<text class="confidence-value">{{ confidenceDisplay }}</text>
					</view>
					<view class="official-match-row">
						<xicheng-icon name="check" variant="primary" :size="17" />
						<text>{{ result.requiresUserConfirm ? '待确认官方地标' : '已验证为官方地标' }}</text>
					</view>
					<text class="signal-title">识别信号</text>
					<view class="result-signal-list">
						<view
							v-for="signal in recognitionSignalItems"
							:key="signal.key"
							class="result-source-signal"
						>
							<text class="result-source-signal-label">{{ signal.label }}</text>
							<text class="result-source-signal-value">{{ signal.value }}</text>
						</view>
					</view>
				</view>
			</view>
			<view class="result-source-summary" :class="{ 'result-source-summary-blocked': recognitionActionBlocked }">
				<xicheng-icon
					class="result-source-summary-icon"
					:name="recognitionActionBlocked ? 'locked' : 'source'"
					variant="primary"
					:size="19"
				/>
				<view class="result-source-summary-copywrap">
					<text class="result-source-summary-label">{{ sourceSummaryLabel }}</text>
					<text class="result-source-summary-copy">{{ sourceSummaryCopy }}</text>
				</view>
			</view>
			<view class="result-companion-card">
				<image class="result-companion-avatar" :src="region.companionAvatar" mode="aspectFit" />
				<view class="result-companion-copy xicheng-companion-bubble">
					<text class="result-companion-title">{{ resultCompanionTitle }}</text>
					<text class="result-companion-desc">{{ recognitionActionBlocked ? questionSectionTitle : '可以继续听讲解、问路线或生成游记素材。' }}</text>
				</view>
			</view>
		</view>

		<view class="result-reference-actions">
			<button class="primary-button xicheng-primary-action" :disabled="recognitionActionBlocked" @click="askXiaojing()">开始 AI 讲解</button>
			<button class="ghost-button xicheng-secondary-action" :disabled="recognitionActionBlocked" @click="askXiaojing(suggestedQuestions[1])">问问小京</button>
		</view>

		<view
			class="poi-detail-entry xicheng-paper-card"
			:class="{ 'poi-detail-entry-disabled': recognitionActionBlocked }"
			@click="openPoiDetail"
		>
			<view class="poi-detail-entry-icon">
				<xicheng-icon name="layer" variant="primary" :size="24" />
			</view>
			<view class="poi-detail-entry-copy">
				<text class="poi-detail-entry-title">建筑看点</text>
				<text class="poi-detail-entry-desc">{{ result.poiName }}官方地点详情</text>
			</view>
			<text class="poi-detail-entry-label">地点详情</text>
			<xicheng-icon name="next" variant="plain" :size="20" />
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
import { decodeXichengRouteValue, createXichengRouteOutputValue } from '@/request/xunjing/routeParams.js'
import { isXichengUnsafeSafetyStatus, normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'
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
	if (isXichengUnsafeSafetyStatus(safetyStatus)) {
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
	if (isXichengUnsafeSafetyStatus(safetyStatus)) {
		return []
	}
	return normalizeXichengReviewedSources(result.sources)
}

const normalizeRecommendedRoute = (result = {}) => {
	const safetyStatus = normalizeXichengSafetyStatus(result.safetyStatus)
	if (isXichengUnsafeSafetyStatus(safetyStatus)) {
		return null
	}
	return result.routeRecommendation || result.recommendedRoute || null
}

const decodeRouteValue = decodeXichengRouteValue
const encodeRouteValue = (value = '') => createXichengRouteOutputValue(value, { platform: process.env.UNI_PLATFORM })

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
	if (isXichengUnsafeSafetyStatus(safetyStatus)) {
		return result
	}
	const officialPoi = findXichengOfficialPoiForResult(result)
	if (!officialPoi) {
		return result
	}
	const existingSources = normalizeXichengReviewedSources(result.sources)
	const sources = existingSources.length > 0 ? existingSources : createXichengOfficialPoiSources(officialPoi)
	const recommendedRoute = result.routeRecommendation || result.recommendedRoute || findXichengRecommendedRouteForPoi(officialPoi)
	return {
		...result,
		officialPoiMatched: true,
		poiCode: result.poiCode || officialPoi.poiCode,
		poiName: result.poiName || officialPoi.poiName,
		theme: result.theme || officialPoi.theme,
		reason: result.reason || officialPoi.summary || '已匹配西城官方 POI，可继续问小京。',
		requiresUserConfirm: result.requiresUserConfirm === undefined ? false : result.requiresUserConfirm,
		sources,
		safetyStatus: safetyStatus || (sources.length > 0 ? 'PASSED' : ''),
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
	confidence: decodeRouteValue(options.confidence),
	confidencePercent: decodeRouteValue(options.confidencePercent),
	safetyStatus: normalizeXichengSafetyStatus(decodeRouteValue(options.safetyStatus))
})

const getCurrentXichengScanResultRouteOptions = () => {
	const options = {}
	try {
		if (typeof getCurrentPages === 'function') {
			const pages = getCurrentPages()
			const currentPage = Array.isArray(pages) && pages.length > 0 ? pages[pages.length - 1] : null
			if (currentPage && currentPage.options && typeof currentPage.options === 'object') {
				Object.assign(options, currentPage.options)
			}
		}
	} catch (error) {
		// H5 and native runtimes expose route params differently; hash parsing below is the fallback.
	}
	try {
		const currentHash = typeof location !== 'undefined' && location.hash ? String(location.hash) : ''
		const queryIndex = currentHash.indexOf('?')
		if (queryIndex >= 0 && typeof URLSearchParams !== 'undefined') {
			const params = new URLSearchParams(currentHash.slice(queryIndex + 1))
			params.forEach((value, key) => {
				options[key] = decodeRouteValue(value)
			})
		}
	} catch (error) {
		return options
	}
	if (options.safetyStatus) {
		options.safetyStatus = normalizeXichengSafetyStatus(decodeRouteValue(options.safetyStatus))
	}
	return options
}

const mergeXichengScanResultRouteOptions = (routeOptions = {}) => {
	const h5RouteOptions = getCurrentXichengScanResultRouteOptions()
	const mergedOptions = {
		...h5RouteOptions
	}
	Object.keys(routeOptions || {}).forEach(key => {
		const value = routeOptions[key]
		if (value !== undefined && value !== null && value !== '') {
			mergedOptions[key] = value
		}
	})
	return {
		...mergedOptions,
		safetyStatus: normalizeXichengSafetyStatus(routeOptions.safetyStatus || h5RouteOptions.safetyStatus)
	}
}

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
	const routePackageCode = decodeRouteValue(options.packageCode)
	if (routePackageCode && cached.packageCode && cached.packageCode !== routePackageCode) {
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
			region: XICHENG_REGION_CONFIG,
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
			return normalizeSuggestedQuestions(this.result)
		},
		sourceList() {
			return normalizeReviewedSources(this.result)
		},
		sourceSummaryLabel() {
			const safetyStatus = normalizeXichengSafetyStatus(this.result.safetyStatus)
			if (this.sourceList.length > 0) return `已审核来源 ${this.sourceList.length} 条`
			if (safetyStatus === 'BLOCKED') return '无已审核来源'
			if (safetyStatus === 'UNAVAILABLE') return '来源服务不可用'
			return '来源待审核'
		},
		sourceSummaryCopy() {
			if (this.sourceList.length > 0) return '小京回答将优先引用这些官方来源。'
			return this.sourceEmptyCopy
		},
		resultVisualImage() {
			return this.region && this.region.visualAssets
				? this.region.visualAssets.heroLandmark || ''
				: ''
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
		recognitionSignalItems() {
			const source = String(this.result.source || '').trim()
			const hasRecognizedText = ['scan', 'ocr', 'text'].includes(source) || Boolean(this.result.sourceLabel)
			const hasLocationSignal = source === 'gps' || !this.result.requiresUserConfirm || this.sourceList.length > 0
			return [
				{
					key: 'photo',
					label: '拍照识别',
					value: ['photo', 'scan'].includes(source) ? '已启用' : '可补充'
				},
				{
					key: 'text',
					label: '文字识别',
					value: hasRecognizedText ? '已启用' : '可补充'
				},
				{
					key: 'nearby',
					label: '附近触发',
					value: hasLocationSignal ? '已匹配' : '可补充'
				},
				{
					key: 'safety',
					label: '审核状态',
					value: this.safetyStatusLabel
				}
			]
		},
		candidateSectionBadge() {
			if (this.pendingCandidateConfirmation) return '请选择官方 POI'
			return '已确认官方 POI'
		},
		questionSectionTitle() {
			if (this.unsafeRecognitionSafetyStatus) return this.sourceEmptyCopy
			if (this.pendingCandidateConfirmation) return '确认官方 POI 后可问小京'
			if (this.missingOfficialPoiContext) return '匹配官方 POI 后可问小京'
			return '可以继续问小京'
		},
		resultCompanionTitle() {
			if (this.unsafeRecognitionSafetyStatus) return '小京暂不能讲解这里'
			if (this.pendingCandidateConfirmation || this.missingOfficialPoiContext) return '小京识别到待确认线索'
			return '小京已为你匹配到这里'
		},
		unsafeRecognitionSafetyStatus() {
			const safetyStatus = normalizeXichengSafetyStatus(this.result.safetyStatus)
			return isXichengUnsafeSafetyStatus(safetyStatus)
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
		const mergedRouteOptions = mergeXichengScanResultRouteOptions(options)
		const routeOptions = normalizeRouteOptions(mergedRouteOptions)
		const routeUnsafeSafetyStatus = isXichengUnsafeSafetyStatus(routeOptions.safetyStatus)
		const cachedBlockedByProductionFixture = this.isBlockedDevelopmentRecognitionCache(cached)
		if (cachedBlockedByProductionFixture) {
			uni.removeStorageSync(XICHENG_REGION_CONFIG.storageKey)
		}
		const selectedCached = cachedBlockedByProductionFixture || routeUnsafeSafetyStatus
			? null
			: selectCachedRecognitionForRoute(cached, mergedRouteOptions)
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
			confidence: routeOptions.confidence || (selectedCached && selectedCached.confidence) || '',
			confidencePercent: routeOptions.confidencePercent || (selectedCached && selectedCached.confidencePercent) || '',
			safetyStatus: routeOptions.safetyStatus || (selectedCached && selectedCached.safetyStatus) || ''
		}))
		this.result = normalizedResult
		if (!this.unsafeRecognitionSafetyStatus && this.result.officialPoiMatched && this.result.poiCode && this.result.poiName) {
			uni.setStorageSync(XICHENG_REGION_CONFIG.storageKey, this.result)
		}
		this.loadRecognitionFeedback()
	},
	methods: {
		goBack() {
			if (uni.navigateBack) {
				uni.navigateBack({
					delta: 1,
					fail: () => {
						uni.reLaunch({
							url: '/pages/xicheng/home/home'
						})
					}
				})
				return
			}
			uni.reLaunch({
				url: '/pages/xicheng/home/home'
			})
		},
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
			return isXichengUnsafeSafetyStatus(safetyStatus)
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
				`question=${encodeRouteValue(prompt)}`,
				`regionCode=${encodeURIComponent(this.result.regionCode || XICHENG_REGION_CONFIG.regionCode)}`,
				`packageCode=${encodeURIComponent(this.result.packageCode || XICHENG_REGION_CONFIG.packageCode)}`,
				`sceneCode=${encodeURIComponent(this.result.sceneCode || XICHENG_REGION_CONFIG.sceneCode)}`,
				`sourceChannel=${encodeURIComponent(this.result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel)}`,
				`poiCode=${encodeRouteValue(this.result.poiCode || '')}`,
				`poiName=${encodeRouteValue(this.result.poiName || '')}`,
				`companionName=${encodeRouteValue(this.result.companionName || XICHENG_REGION_CONFIG.companionName)}`,
				`confidence=${encodeURIComponent(String(this.result.confidence || ''))}`,
				`safetyStatus=${encodeURIComponent(this.result.safetyStatus || '')}`
			].join('&')
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?${query}`
			})
		},
		openPoiDetail() {
			if (this.pendingCandidateConfirmation) {
				this.requireOfficialPoiConfirmation('查看详情')
				return
			}
			if (this.missingOfficialPoiContext) {
				this.showMissingOfficialPoiToast('查看详情')
				return
			}
			if (this.unsafeRecognitionSafetyStatus) {
				this.showUnsafeRecognitionToast('查看详情')
				return
			}
			uni.setStorageSync(XICHENG_REGION_CONFIG.storageKey, this.result)
			uni.navigateTo({
				url: `/pages/xicheng/poi/poi?poiCode=${encodeRouteValue(this.result.poiCode || '')}&poiName=${encodeRouteValue(this.result.poiName || '')}&regionCode=${encodeURIComponent(this.result.regionCode || XICHENG_REGION_CONFIG.regionCode)}&packageCode=${encodeURIComponent(this.result.packageCode || XICHENG_REGION_CONFIG.packageCode)}&sceneCode=${encodeURIComponent(this.result.sceneCode || XICHENG_REGION_CONFIG.sceneCode)}&sourceChannel=${encodeURIComponent(this.result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel)}&companionName=${encodeRouteValue(this.result.companionName || XICHENG_REGION_CONFIG.companionName)}&safetyStatus=${encodeURIComponent(this.result.safetyStatus || '')}`
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
				url: `/pages/xicheng/travelogue/travelogue?mode=record&autoStart=1&regionCode=${encodeURIComponent(this.result.regionCode || XICHENG_REGION_CONFIG.regionCode)}&packageCode=${encodeURIComponent(this.result.packageCode || XICHENG_REGION_CONFIG.packageCode)}&sceneCode=${encodeURIComponent(this.result.sceneCode || XICHENG_REGION_CONFIG.sceneCode)}&sourceChannel=${encodeURIComponent(this.result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel)}&poiCode=${encodeRouteValue(this.result.poiCode || '')}&poiName=${encodeRouteValue(this.result.poiName || '')}&companionName=${encodeRouteValue(this.result.companionName || XICHENG_REGION_CONFIG.companionName)}&safetyStatus=${encodeURIComponent(this.result.safetyStatus || '')}`
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
	padding: 30rpx 28rpx 56rpx;
	box-sizing: border-box;
	color: #102F29;
}

.scan-result-topbar {
	display: grid;
	grid-template-columns: 72rpx minmax(0, 1fr) 72rpx;
	align-items: center;
	min-height: 72rpx;
	margin-bottom: 22rpx;
}

.scan-result-title {
	font-size: 34rpx;
	line-height: 1.3;
	font-weight: 700;
	text-align: center;
	color: #102F29;
}

.scan-result-back,
.scan-result-share {
	width: 64rpx;
	height: 64rpx;
	border-radius: 999rpx;
	background: rgba(255, 253, 248, 0.78);
	box-shadow: 0 10rpx 24rpx rgba(16, 47, 41, 0.08);
	display: flex;
	align-items: center;
	justify-content: center;
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

.result-hero-layout {
	display: flex;
	align-items: stretch;
	gap: 24rpx;
}

.result-poi-image {
	width: 250rpx;
	height: 360rpx;
	flex-shrink: 0;
	border-radius: 26rpx;
	background: rgba(181, 148, 94, 0.14);
	object-fit: cover;
	overflow: hidden;
}

.result-hero-copy {
	flex: 1;
	min-width: 0;
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

.result-source-signals {
	display: grid;
	gap: 12rpx;
	margin-top: 22rpx;
}

.result-source-signal {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	min-height: 54rpx;
	padding: 10rpx 14rpx;
	border-radius: 18rpx;
	background: rgba(23, 63, 53, 0.08);
	box-sizing: border-box;
}

.result-source-signal-label,
.result-source-signal-value {
	font-size: 22rpx;
	line-height: 1.35;
	color: #173F35;
}

.result-source-signal-value {
	font-weight: 700;
	text-align: right;
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

.result-source-summary {
	display: flex;
	align-items: flex-start;
	gap: 16rpx;
	margin-top: 22rpx;
	padding: 18rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.22);
	border-radius: 24rpx;
	background: rgba(181, 148, 94, 0.12);
	box-sizing: border-box;
}

.result-source-summary-blocked {
	border-color: rgba(180, 35, 24, 0.24);
	background: rgba(180, 35, 24, 0.08);
}

.result-source-summary-icon {
	flex-shrink: 0;
}

.result-source-summary-copywrap {
	min-width: 0;
}

.result-source-summary-label,
.result-source-summary-copy {
	display: block;
	line-height: 1.45;
}

.result-source-summary-label {
	font-size: 26rpx;
	font-weight: 700;
	color: #173F35;
}

.result-source-summary-copy {
	margin-top: 4rpx;
	font-size: 22rpx;
	color: #746F68;
}

.result-companion-card {
	display: flex;
	align-items: center;
	gap: 18rpx;
	margin-top: 28rpx;
}

.result-companion-avatar {
	width: 92rpx;
	height: 92rpx;
	flex-shrink: 0;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.08);
	box-shadow: 0 10rpx 24rpx rgba(16, 47, 41, 0.10);
}

.result-companion-copy {
	flex: 1;
	min-width: 0;
	padding: 18rpx 22rpx;
	border-radius: 24rpx;
	box-sizing: border-box;
}

.result-companion-copy.xicheng-companion-bubble::before {
	left: -10rpx;
	top: 34rpx;
	margin-left: 0;
	transform: rotate(45deg);
}

.result-companion-title,
.result-companion-desc {
	display: block;
	line-height: 1.5;
}

.result-companion-title {
	font-size: 26rpx;
	font-weight: 700;
	color: #173F35;
}

.result-companion-desc {
	margin-top: 4rpx;
	font-size: 22rpx;
	color: #746F68;
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

.xicheng-reference-result-card {
	position: relative;
	min-height: 660rpx;
	padding: 34rpx;
	overflow: hidden;
	border-radius: 34rpx;
	background:
		radial-gradient(circle at 94% 20%, rgba(181, 148, 94, 0.12), transparent 28%),
		linear-gradient(145deg, rgba(255, 253, 248, 0.98), rgba(250, 245, 237, 0.94));
}

.xicheng-reference-result-card::after {
	content: '';
	position: absolute;
	right: -52rpx;
	top: 128rpx;
	width: 270rpx;
	height: 420rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.08);
	pointer-events: none;
}

.xicheng-reference-result-card .result-hero-layout {
	position: relative;
	z-index: 1;
	align-items: flex-start;
	gap: 30rpx;
}

.xicheng-reference-result-card .result-poi-image {
	width: 290rpx;
	height: 430rpx;
	border-radius: 28rpx;
	box-shadow: 0 16rpx 34rpx rgba(35, 42, 34, 0.12);
}

.xicheng-reference-result-card .poi-name {
	margin-top: 18rpx;
	font-size: 58rpx;
	line-height: 1.1;
}

.confidence-line {
	display: flex;
	align-items: baseline;
	gap: 14rpx;
	margin-top: 28rpx;
	font-size: 30rpx;
	line-height: 1.35;
	color: #746F68;
}

.confidence-value {
	font-size: 36rpx;
	font-weight: 800;
	color: #B42318;
}

.official-match-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-top: 26rpx;
	padding-top: 24rpx;
	border-top: 1rpx dashed rgba(181, 148, 94, 0.28);
	font-size: 27rpx;
	color: #173F35;
}

.signal-title {
	display: block;
	margin-top: 30rpx;
	font-size: 28rpx;
	font-weight: 700;
	color: #102F29;
}

.result-signal-list {
	display: grid;
	gap: 18rpx;
	margin-top: 18rpx;
}

.xicheng-reference-result-card .result-source-signal {
	min-height: 58rpx;
	padding: 0;
	background: transparent;
	justify-content: flex-start;
	gap: 16rpx;
}

.xicheng-reference-result-card .result-source-signal-label {
	min-width: 112rpx;
	font-size: 27rpx;
	color: #746F68;
}

.xicheng-reference-result-card .result-source-signal-value {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 48rpx;
	height: 48rpx;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.10);
	font-size: 0;
}

.xicheng-reference-result-card .result-source-signal-value::after {
	content: '';
	width: 18rpx;
	height: 10rpx;
	border-left: 4rpx solid #173F35;
	border-bottom: 4rpx solid #173F35;
	transform: rotate(-45deg);
}

.xicheng-reference-result-card .result-source-summary {
	position: relative;
	z-index: 1;
	margin-top: 28rpx;
}

.xicheng-reference-result-card .result-companion-card {
	position: relative;
	z-index: 1;
	margin-top: 24rpx;
	padding: 12rpx;
	border-radius: 28rpx;
	background: rgba(255, 253, 248, 0.72);
}

.xicheng-reference-result-card .result-companion-avatar {
	width: 118rpx;
	height: 118rpx;
}

.result-reference-actions {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 28rpx;
	margin-top: 32rpx;
}

.result-reference-actions .primary-button,
.result-reference-actions .ghost-button {
	height: 104rpx;
	line-height: 104rpx;
	border-radius: 30rpx;
	font-size: 34rpx;
	font-weight: 700;
	box-shadow: 0 16rpx 34rpx rgba(16, 47, 41, 0.12);
}

.poi-detail-entry {
	display: grid;
	grid-template-columns: 76rpx 1fr auto 34rpx;
	align-items: center;
	gap: 18rpx;
	margin-top: 28rpx;
	padding: 24rpx 28rpx;
	border-radius: 30rpx;
	background: rgba(255, 253, 248, 0.94);
}

.poi-detail-entry-disabled {
	opacity: 0.56;
}

.poi-detail-entry-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 76rpx;
	height: 76rpx;
	border-radius: 999rpx;
	background: #173F35;
	box-shadow: 0 12rpx 26rpx rgba(16, 47, 41, 0.16);
}

.poi-detail-entry-copy {
	min-width: 0;
}

.poi-detail-entry-title,
.poi-detail-entry-desc {
	display: block;
}

.poi-detail-entry-title {
	font-size: 32rpx;
	font-weight: 700;
	line-height: 1.25;
	color: #102F29;
}

.poi-detail-entry-desc {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.45;
	color: #746F68;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.poi-detail-entry-label {
	font-size: 24rpx;
	font-weight: 700;
	color: #173F35;
	white-space: nowrap;
}
</style>
