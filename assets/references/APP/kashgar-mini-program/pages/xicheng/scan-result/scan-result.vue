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

		<xicheng-scan-result-summary-hero
			:result="result"
			:region="region"
			:result-visual-image="resultVisualImage"
			:confidence-meta-label="confidenceMetaLabel"
			:confidence-display="confidenceDisplay"
			:recognition-signal-items="recognitionSignalItems"
			:recognition-action-blocked="recognitionActionBlocked"
			:source-summary-label="sourceSummaryLabel"
			:source-summary-copy="sourceSummaryCopy"
			:result-companion-title="resultCompanionTitle"
			:question-section-title="questionSectionTitle"
			@start-guide="askXiaojing()"
			@ask-xiaojing="askXiaojing(suggestedQuestions[1])"
		/>

		<xicheng-scan-result-candidate-card
			v-if="candidateList.length > 0"
			:candidate-list="candidateList"
			:candidate-section-badge="candidateSectionBadge"
			@select-candidate="selectCandidate"
		/>

		<xicheng-scan-result-route-card
			v-if="recommendedRoute"
			:recommended-route="recommendedRoute"
			:route-steps="routeSteps"
		/>

		<xicheng-scan-result-questions-card
			:section-title="questionSectionTitle"
			:questions="suggestedQuestions"
			:recognition-action-blocked="recognitionActionBlocked"
			:empty-copy="questionEmptyCopy"
			@ask="askXiaojing"
		/>

		<xicheng-scan-result-sources-card
			:source-list="sourceList"
			:source-empty-copy="sourceEmptyCopy"
		/>

		<xicheng-scan-result-feedback-card
			:feedback-note="feedbackNote"
			:recognition-feedback="recognitionFeedback"
			@update:feedback-note="feedbackNote = $event"
			@submit-feedback="submitRecognitionFeedback"
			@withdraw-feedback="withdrawRecognitionFeedback"
		/>
		<xicheng-scan-result-memory-panel
			:timeline-items="visionAgentTimelineItems"
			:memory-session-package="visionAgentMemorySessionPackage"
		/>

		<xicheng-scan-result-vision-agent-panel
			:vision-agent-decision-summary="visionAgentDecisionSummary"
			:camera-agent-decision-title="cameraAgentDecisionTitle"
			:scene-fusion-signal-badges="sceneFusionSignalBadges"
			:world-interface-summary="worldInterfaceSummary"
			:world-interface-signal-badges="worldInterfaceSignalBadges"
			:agent-decision-reason-card-items="agentDecisionReasonCardItems"
			:prioritized-scene-understanding-cards="prioritizedSceneUnderstandingCards"
			:prioritized-vision-agent-action-cards="prioritizedVisionAgentActionCards"
			:recognition-action-blocked="recognitionActionBlocked"
			:prioritized-scene-service-actions="prioritizedSceneServiceActions"
			:active-service-handoff-task="activeServiceHandoffTask"
			:active-service-handoff-steps="activeServiceHandoffSteps"
			:service-handoff-primary-action="serviceHandoffPrimaryAction"
			:city-knowledge-graph-nodes="cityKnowledgeGraphNodes"
			:knowledge-graph-node-type-label="knowledgeGraphNodeTypeLabel"
			@open-scene-understanding-card="openSceneUnderstandingCard"
			@open-vision-agent-action="openVisionAgentAction"
			@open-scene-service-action="openSceneServiceAction"
			@close-service-handoff-panel="closeServiceHandoffPanel"
			@open-service-handoff-primary-action="openServiceHandoffPrimaryAction"
			@open-knowledge-graph-node="openKnowledgeGraphNode"
		/>

		<xicheng-scan-result-poi-detail-entry
			:poi-name="result.poiName"
			:recognition-action-blocked="recognitionActionBlocked"
			@open-poi-detail="openPoiDetail"
		/>

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
import { normalizeXichengReviewedSources } from '@/request/xunjing/sources.js'
import { isXichengDevelopmentRecognitionCacheBlocked } from '@/request/xunjing/trigger.js'
import { mergeXichengVisionAgentRouteContext, parseXichengVisionAgentRouteContext } from '@/request/xunjing/visionAgentRouteContext.js'
import {
	createXichengVisionAgentDomainServiceActions,
	createXichengVisionAgentSceneUnderstandingCards,
	createXichengVisionAgentSceneUnderstandingPrompt,
	inferXichengVisionAgentSceneUnderstandingPackage
} from '@/request/xunjing/visionAgentSceneUnderstanding.js'
import XichengScanResultMemoryPanel from '@/components/xicheng/XichengScanResultMemoryPanel.vue'
import XichengScanResultCandidateCard from '@/components/xicheng/XichengScanResultCandidateCard.vue'
import XichengScanResultQuestionsCard from '@/components/xicheng/XichengScanResultQuestionsCard.vue'
import XichengScanResultVisionAgentPanel from '@/components/xicheng/XichengScanResultVisionAgentPanel.vue'
import XichengScanResultSummaryHero from '@/components/xicheng/XichengScanResultSummaryHero.vue'
import XichengScanResultSourcesCard from '@/components/xicheng/XichengScanResultSourcesCard.vue'
import XichengScanResultRouteCard from '@/components/xicheng/XichengScanResultRouteCard.vue'
import XichengScanResultFeedbackCard from '@/components/xicheng/XichengScanResultFeedbackCard.vue'
import XichengScanResultPoiDetailEntry from '@/components/xicheng/XichengScanResultPoiDetailEntry.vue'

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
	candidateConfirmationAudit: null,
	visionAgentContext: {}
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
	safetyStatus: normalizeXichengSafetyStatus(decodeRouteValue(options.safetyStatus)),
	visionAgentContext: parseXichengVisionAgentRouteContext(options.visionAgentContext),
	sourceRecognitionContext: decodeRouteValue(options.sourceRecognitionContext),
	memorySessionSceneCount: decodeRouteValue(options.memorySessionSceneCount)
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
		officialPoiMatched: Boolean(result.officialPoiMatched),
		visionAgentContext: result.visionAgentContext && typeof result.visionAgentContext === 'object'
			? result.visionAgentContext
			: {}
})

export default {
	components: { XichengScanResultMemoryPanel, XichengScanResultCandidateCard, XichengScanResultQuestionsCard, XichengScanResultVisionAgentPanel, XichengScanResultSummaryHero, XichengScanResultSourcesCard, XichengScanResultRouteCard, XichengScanResultFeedbackCard, XichengScanResultPoiDetailEntry },
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			result: normalizeResult(),
			feedbackNote: '',
			recognitionFeedback: null,
			activeServiceHandoffTask: null
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
			const baseQuestions = normalizeSuggestedQuestions(this.result)
			if (this.recognitionActionBlocked) {
				return normalizeSuggestedQuestions(this.result)
			}
			return this.createVisionAgentFollowupQuestions(baseQuestions)
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
		cityKnowledgeGraphNodes() {
			return this.createCityKnowledgeGraphNodes()
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
		},
		visionAgentActionCards() {
			return [
				{ actionKey: 'photo-spot', title: '拍照建议', copy: '先判断光线、角度和适合拍的细节。', requiresRecognition: true },
				{ actionKey: 'guide', title: '开始讲解', copy: '结合现场信号进入讲解。', requiresRecognition: true },
				{ actionKey: 'video-brief', title: '30秒视频', copy: '生成适合现场的短讲解。', requiresRecognition: true },
				{ actionKey: 'deep-history', title: '深入历史', copy: '展开人物、年代和城市知识图谱。', requiresRecognition: true },
				{ actionKey: 'kids-story', title: '儿童版', copy: '换成孩子能听懂的故事。', requiresRecognition: true },
				{ actionKey: 'english', title: 'English', copy: 'Switch to English guide.', requiresRecognition: true }
			]
		},
		sceneUnderstandingCards() {
			return createXichengVisionAgentSceneUnderstandingCards()
		},
		prioritizedSceneUnderstandingCards() {
			if (this.recognitionActionBlocked) return []
			return this.visionAgentSceneUnderstandingPackage.domainCards
		},
		visionAgentSceneUnderstandingPackage() {
			return inferXichengVisionAgentSceneUnderstandingPackage({
				result: this.result,
				visionAgentContext: this.result.visionAgentContext || {},
				recommendedRoute: this.recommendedRoute
			})
		},
		enrichedVisionAgentContext() {
			const memorySessionPackage = this.visionAgentMemorySessionPackage
			const fallbackVisionContext = this.result.visionAgentContext || {}
			const visionAgentMemorySessionText = memorySessionPackage
				? [
					memorySessionPackage.poiTrailText,
					memorySessionPackage.continuityCueText
				].filter(Boolean).join(' ')
				: fallbackVisionContext.visionAgentMemorySessionText || fallbackVisionContext.memorySessionText || ''
			return {
				...fallbackVisionContext,
				visionAgentMemorySessionPackage: memorySessionPackage,
				visionAgentMemorySessionText: visionAgentMemorySessionText,
				memorySessionSceneCount: memorySessionPackage
					? memorySessionPackage.sceneCount
					: fallbackVisionContext.memorySessionSceneCount || '',
				sceneUnderstandingPackage: this.visionAgentSceneUnderstandingPackage,
				primarySceneDomainKey: this.visionAgentSceneUnderstandingPackage.primaryDomainKey,
				primarySceneDomainLabel: this.visionAgentSceneUnderstandingPackage.primaryDomainLabel,
				sceneUnderstandingSummary: this.visionAgentSceneUnderstandingPackage.sceneUnderstandingSummary
			}
		},
		sceneFusionSignalBadges() {
			const visionContext = this.result.visionAgentContext || {}
			const sceneFusionSignals = Array.isArray(visionContext.sceneFusionSignals)
				? visionContext.sceneFusionSignals
				: []
			return sceneFusionSignals
				.filter(signal => signal && signal.active)
				.map(signal => ({
					key: signal.key || signal.label || signal.statusText,
					label: signal.label || signal.statusText || '现场信号',
					statusText: signal.statusText || ''
				}))
				.slice(0, 4)
		},
		worldInterfaceSnapshot() {
			const visionContext = this.result.visionAgentContext || {}
			const snapshot = visionContext.worldInterfaceSnapshot && typeof visionContext.worldInterfaceSnapshot === 'object'
				? visionContext.worldInterfaceSnapshot
				: {}
			const worldInterfaceSignals = Array.isArray(snapshot.signals)
				? snapshot.signals
				: Array.isArray(visionContext.worldInterfaceSignals)
					? visionContext.worldInterfaceSignals
					: []
			return {
				summary: snapshot.summary || visionContext.worldInterfaceSummary || '',
				signals: worldInterfaceSignals
			}
		},
		worldInterfaceSummary() {
			return this.worldInterfaceSnapshot.summary || ''
		},
		worldInterfaceSignalBadges() {
			const { signals } = this.worldInterfaceSnapshot
			return signals
				.filter(signal => signal && signal.active)
				.map(signal => ({
					key: signal.key || signal.label || signal.value,
					label: signal.label || signal.value || '现场信号',
					value: signal.value || signal.statusText || ''
				}))
				.slice(0, 6)
		},
		cameraAgentDecisionSnapshot() {
			const visionContext = this.result.visionAgentContext || {}
			return {
				agentDecisionActionKey: String(visionContext.agentDecisionActionKey || ''),
				agentDecisionActionTitle: String(visionContext.agentDecisionActionTitle || ''),
				agentDecisionPreviewSummary: String(visionContext.agentDecisionPreviewSummary || ''),
				sceneAgentActionPreviews: Array.isArray(visionContext.sceneAgentActionPreviews)
					? visionContext.sceneAgentActionPreviews
					: []
			}
		},
		cameraAgentDecisionTitle() {
			return this.cameraAgentDecisionSnapshot.agentDecisionActionTitle
		},
		cameraAgentDecisionSummary() {
			return this.cameraAgentDecisionSnapshot.agentDecisionPreviewSummary
		},
		agentDecisionReasonCardItems() {
			const visionContext = this.result.visionAgentContext || {}
			const reasonCards = Array.isArray(visionContext.agentDecisionReasonCards)
				? visionContext.agentDecisionReasonCards
				: []
			const agentDecisionReasonSummary = String(visionContext.agentDecisionReasonSummary || '')
			const normalizedCards = reasonCards
				.map((card, index) => ({
					key: card.key || `reason-${index}`,
					label: card.label || '决策依据',
					title: card.title || card.label || '为什么先做这个',
					copy: card.copy || ''
				}))
				.filter(card => card.title || card.copy)
			if (normalizedCards.length === 0 && agentDecisionReasonSummary) {
				return [{
					key: 'reason-summary',
					label: '决策依据',
					title: '为什么先做这个',
					copy: agentDecisionReasonSummary
				}]
			}
			return normalizedCards.slice(0, 3)
		},
		visionAgentDecisionSummary() {
			if (this.recognitionActionBlocked) {
				return '先确认官方 POI 和审核来源，再继续讲解、路线或服务动作。'
			}
			const visionContext = this.result.visionAgentContext || {}
			const cameraAgentDecisionSummary = this.cameraAgentDecisionSummary
			const cameraDecisionPrefix = cameraAgentDecisionSummary ? `拍前预判：${cameraAgentDecisionSummary}；` : ''
			const worldInterfaceSummary = this.worldInterfaceSummary
			const sceneFusionSummary = visionContext.sceneFusionSummary || ''
			const signalCount = this.sceneFusionSignalBadges.length
			const routeCue = this.recommendedRoute && (this.recommendedRoute.title || this.recommendedRoute.theme)
				? `优先可接入${this.recommendedRoute.title || this.recommendedRoute.theme}`
				: '优先给出讲解、拍照和下一步服务'
			const primarySceneSummary = worldInterfaceSummary || sceneFusionSummary
			const fusedSummary = primarySceneSummary
				? `${primarySceneSummary}，${routeCue}`
				: `已融合${signalCount || 1}类现场信号，${routeCue}`
			return cameraDecisionPrefix
				? `${cameraDecisionPrefix}${fusedSummary}`
				: fusedSummary
		},
		prioritizedVisionAgentActionCards() {
			return this.prioritizeVisionAgentActions(this.visionAgentActionCards)
		},
		domainSceneServiceActions() {
			const packagedActions = this.visionAgentSceneUnderstandingPackage.serviceActions
			if (packagedActions.length > 0) return packagedActions
			return this.createDomainSceneServiceActions(this.prioritizedSceneUnderstandingCards)
		},
		sceneServiceActions() {
			return [
				...this.domainSceneServiceActions,
				{ actionKey: 'next-stop', title: '去下一个景点', copy: '加入旅行地图', taskType: 'route' },
				{ actionKey: 'nearby-food', title: '附近美食', copy: '推荐菜/点单', taskType: 'merchant' },
				{ actionKey: 'souvenir', title: '纪念品', copy: '匹配附近文创和小店', taskType: 'merchant' },
				{ actionKey: 'badge', title: '领取徽章', copy: '完成打卡并收集徽章', taskType: 'growth' },
				{ actionKey: 'travelogue', title: '生成游记', copy: '把这一站写进今天故事', taskType: 'travelogue' }
			]
		},
		prioritizedSceneServiceActions() {
			return this.prioritizeSceneServiceActions(this.sceneServiceActions)
		},
		activeServiceHandoffSteps() {
			return this.activeServiceHandoffTask && Array.isArray(this.activeServiceHandoffTask.handoffSteps)
				? this.activeServiceHandoffTask.handoffSteps
				: []
		},
		serviceHandoffPrimaryAction() {
			return this.activeServiceHandoffTask && this.activeServiceHandoffTask.primaryAction
				? this.activeServiceHandoffTask.primaryAction
				: '问小京生成方案'
		},
		visionAgentTimelineItems() {
			const visionContext = this.result.visionAgentContext || {}
			const previousContext = this.parseVisionAgentSourceContext(visionContext.sourceRecognitionContext)
			const memoryTrail = this.readVisionAgentMemoryTrail()
			const currentSnapshot = this.createVisionAgentMemorySnapshot('current')
			const currentKey = `${currentSnapshot.poiCode || currentSnapshot.poiName || ''}-${currentSnapshot.source || ''}`
			const previousSnapshot = (previousContext.poiCode || previousContext.poiName || previousContext.visionCaption)
				? previousContext
				: memoryTrail.find(item => {
					const itemKey = `${item.poiCode || item.poiName || ''}-${item.source || ''}`
					return itemKey && itemKey !== currentKey
				}) || null
			const nextQuestion = this.suggestedQuestions[0] || `继续问${this.result.poiName || XICHENG_REGION_CONFIG.companionName}`
			return [
				{
					key: 'previous',
					label: '上一拍',
					title: previousSnapshot && (previousSnapshot.poiName || previousSnapshot.visionCaption)
						? (previousSnapshot.poiName || previousSnapshot.visionCaption)
						: '等待上一轮现场',
					copy: previousSnapshot && (previousSnapshot.sourceLabel || previousSnapshot.source || previousSnapshot.localTimeText)
						? `延续 ${previousSnapshot.sourceLabel || previousSnapshot.source || previousSnapshot.localTimeText}`
						: '继续拍摄后，小京会把上下文串起来。',
					active: Boolean(previousSnapshot)
				},
				{
					key: 'current',
					label: '当前场景',
					title: currentSnapshot.poiName || '待确认西城文化点',
					copy: [currentSnapshot.sourceLabel || currentSnapshot.source || '现场识别', currentSnapshot.locationText, currentSnapshot.weatherText]
						.filter(Boolean)
						.join(' · ') || '已融合本次镜头与官方来源。',
					active: !this.recognitionActionBlocked
				},
				{
					key: 'next',
					label: '下一问',
					title: nextQuestion,
					copy: currentSnapshot.knowledgeGraphText || currentSnapshot.serviceText || '进入小京后继续追问历史、路线和服务。',
					active: !this.recognitionActionBlocked
					}
				]
		},
			visionAgentMemorySessionPackage() {
				return this.createVisionAgentMemorySessionPackage(
					this.readVisionAgentMemoryTrail(),
					this.createVisionAgentMemorySnapshot('current')
				)
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
			safetyStatus: routeOptions.safetyStatus || (selectedCached && selectedCached.safetyStatus) || '',
			visionAgentContext: mergeXichengVisionAgentRouteContext(routeOptions, selectedCached)
		}))
		this.result = normalizedResult
		if (!this.unsafeRecognitionSafetyStatus && this.result.officialPoiMatched && this.result.poiCode && this.result.poiName) {
			uni.setStorageSync(XICHENG_REGION_CONFIG.storageKey, this.result)
		}
		this.rememberVisionAgentSceneMemory()
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
		parseVisionAgentSourceContext(sourceRecognitionContext = '') {
			if (!sourceRecognitionContext) return {}
			if (typeof sourceRecognitionContext === 'object') {
				return {
					...sourceRecognitionContext,
					poiCode: sourceRecognitionContext.poiCode || '',
					poiName: sourceRecognitionContext.poiName || sourceRecognitionContext.visionCaption || ''
				}
			}
			try {
				const parsedContext = JSON.parse(String(sourceRecognitionContext))
				return parsedContext && typeof parsedContext === 'object'
					? {
						...parsedContext,
						poiCode: parsedContext.poiCode || '',
						poiName: parsedContext.poiName || parsedContext.visionCaption || ''
					}
					: {}
			} catch (error) {
				return {
					visionCaption: String(sourceRecognitionContext).slice(0, 48)
				}
			}
		},
		readVisionAgentMemoryTrail() {
			try {
				const memoryTrail = uni.getStorageSync(XICHENG_REGION_CONFIG.visionAgentMemoryStorageKey)
				return Array.isArray(memoryTrail)
					? memoryTrail.filter(item => item && typeof item === 'object')
					: []
			} catch (error) {
				return []
			}
		},
		prioritizeVisionAgentActions(actions = []) {
			const visionContext = this.result.visionAgentContext || {}
			const localTimeText = String(visionContext.localTimeText || '')
			const weatherText = String(visionContext.weatherText || '')
			const knowledgeGraphText = String(visionContext.knowledgeGraphText || '')
			const userInterestTags = String(visionContext.userInterestTags || '')
			const agentDecisionActionKey = String(visionContext.agentDecisionActionKey || '')
			const routeHint = this.recommendedRoute ? 8 : 0
			const scoreMap = {
				'photo-spot': localTimeText || weatherText ? 40 : 16,
				'deep-history': knowledgeGraphText ? 34 : 20,
				'kids-story': /亲子|儿童|孩子|family|kid/i.test(userInterestTags) ? 36 : 12,
				'video-brief': weatherText || localTimeText ? 26 : 14,
				guide: 24 + routeHint,
				english: 8
			}
			if (agentDecisionActionKey === 'photo-spot') scoreMap['photo-spot'] += 70
			if (agentDecisionActionKey === 'deep-history') scoreMap['deep-history'] += 70
			if (agentDecisionActionKey === 'continue-memory') scoreMap.guide += 70
			if (agentDecisionActionKey === 'weather-route') {
				scoreMap.guide += 46
				scoreMap['video-brief'] += 24
			}
			return [...actions].sort((left, right) => {
				const rightScore = scoreMap[right.actionKey] || 0
				const leftScore = scoreMap[left.actionKey] || 0
				return rightScore - leftScore
			})
		},
		prioritizeSceneServiceActions(actions = []) {
			const hasRecommendedRoute = Boolean(this.recommendedRoute)
			const visionContext = this.result.visionAgentContext || {}
			const serviceText = String(visionContext.serviceText || '')
			const agentDecisionActionKey = String(visionContext.agentDecisionActionKey || '')
			const hasMerchantCue = /美食|商家|餐|merchant|food/i.test(serviceText)
			const scoreMap = {
				'next-stop': hasRecommendedRoute ? 42 : 18,
				travelogue: hasRecommendedRoute ? 34 : 26,
				'nearby-food': hasMerchantCue ? 36 : 20,
				souvenir: hasMerchantCue ? 28 : 12,
				badge: 22
			}
			if (agentDecisionActionKey === 'next-service') {
				scoreMap['next-stop'] += 52
				scoreMap['nearby-food'] += 42
				scoreMap.travelogue += 36
			}
			return [...actions].sort((left, right) => {
				const scoreAction = (action = {}) => {
					const serviceIntent = String(action.serviceIntent || '')
					const sceneDomain = String(action.sceneDomain || '')
					let score = scoreMap[action.actionKey] || 0
					if (sceneDomain) score += 44
					if (serviceIntent === 'ticket') score += 46
					if (serviceIntent === 'experience') score += 44
					if (serviceIntent === 'order') score += 48
					if (serviceIntent === 'coupon') score += 38
					if (serviceIntent === 'reservation') score += 40
					if (serviceIntent === 'translate') score += 42
					return score
				}
				return scoreAction(right) - scoreAction(left)
			})
		},
		createDomainSceneServiceActions(cards = []) {
			return createXichengVisionAgentDomainServiceActions(cards)
		},
		inferSceneUnderstandingDomainScore(card = {}) {
			const matchedCard = this.visionAgentSceneUnderstandingPackage.domainCards.find(item => item.domainKey === card.domainKey)
			return matchedCard ? Number(matchedCard.score || 0) : 0
		},
		createSceneUnderstandingPrompt(card = {}) {
			return createXichengVisionAgentSceneUnderstandingPrompt(card, this.result.poiName || '当前场景')
		},
		openSceneUnderstandingCard(card = {}) {
			if (this.recognitionActionBlocked) {
				this.showMissingOfficialPoiToast(card.title || '继续理解')
				return
			}
			const prompt = this.createSceneUnderstandingPrompt(card)
			this.rememberVisionAgentExecutionTask({
				actionKey: `scene-domain-${card.domainKey || 'unknown'}`,
				title: card.title || card.domainLabel || '场景理解',
				copy: card.copy || '',
				sceneDomain: card.domainKey
			}, prompt)
			this.askXiaojing(prompt)
		},
		createCityKnowledgeGraphNodes() {
			if (this.recognitionActionBlocked) return []
			const officialPoi = findXichengOfficialPoiForResult(this.result) || {}
			const visionContext = this.result.visionAgentContext || {}
			const knowledgeGraphText = String(visionContext.knowledgeGraphText || this.result.theme || '').trim()
			const serviceText = String(visionContext.serviceText || '').trim()
			const nodes = []
			const appendNode = (node = {}) => {
				if (!node.title) return
				const nodeKey = node.key || `${node.type || 'topic'}-${node.title}`
				if (nodes.some(item => item.key === nodeKey)) return
				nodes.push({
					key: nodeKey,
					type: node.type || 'topic',
					title: node.title,
					copy: node.copy || '点击继续追问小京'
				})
			}
			appendNode({
				key: `poi-${this.result.poiCode || officialPoi.poiCode || this.result.poiName}`,
				type: 'poi',
				title: this.result.poiName || officialPoi.poiName || '当前场景',
				copy: officialPoi.summary || this.result.reason || '从当前识别点展开历史、建筑和人物关系。'
			})
			knowledgeGraphText
				.split(/[,，、;；|/→>]+/)
				.map(item => item.trim())
				.filter(Boolean)
				.slice(0, 3)
				.forEach((topic, index) => appendNode({
					key: `topic-${index}-${topic}`,
					type: 'topic',
					title: topic,
					copy: `围绕${this.result.poiName || '当前场景'}继续展开。`
				}))
			if (this.recommendedRoute && (this.recommendedRoute.title || this.routeSteps.length > 0)) {
				appendNode({
					key: `route-${this.recommendedRoute.routeCode || this.recommendedRoute.title}`,
					type: 'route',
					title: this.recommendedRoute.title || '推荐路线',
					copy: this.recommendedRoute.summary || this.recommendedRoute.theme || '把当前点接入下一站路线。'
				})
			}
			if (serviceText) {
				appendNode({
					key: `service-${serviceText}`,
					type: 'service',
					title: serviceText,
					copy: '把城市服务、商家、活动或打卡任务接到当前场景。'
				})
			}
			return nodes.slice(0, 6)
		},
		knowledgeGraphNodeTypeLabel(type = 'topic') {
			if (type === 'poi') return '地标'
			if (type === 'route') return '路线'
			if (type === 'service') return '服务'
			return '知识'
		},
		createKnowledgeGraphNodePrompt(node = {}) {
			if (node.type === 'route') {
				return `沿着城市知识图谱，从${this.result.poiName || '当前场景'}继续讲到${node.title || '这条路线'}这条路线，说明下一站为什么这样推荐。`
			}
			if (node.type === 'service') {
				return `沿着城市知识图谱，从${this.result.poiName || '当前场景'}继续讲到${node.title || '这个服务节点'}，告诉我现在可以接哪些文旅服务动作。`
			}
			return `沿着城市知识图谱，从${this.result.poiName || '当前场景'}继续讲到${node.title || '这个节点'}，讲清楚它和当前场景的关系。`
		},
		createVisionAgentFollowupQuestions(baseQuestions = []) {
			const questions = []
			const appendQuestion = (question = '') => {
				const safeQuestion = String(question || '').trim()
				if (!safeQuestion || questions.includes(safeQuestion)) return
				questions.push(safeQuestion)
			}
			;(Array.isArray(baseQuestions) ? baseQuestions : []).forEach(appendQuestion)
			const sceneCard = this.prioritizedSceneUnderstandingCards
				.find(card => card && Number(card.score || 0) > 0)
				|| this.prioritizedSceneUnderstandingCards[0]
			if (sceneCard) {
				appendQuestion(`看见什么，就能问什么：${this.createSceneUnderstandingPrompt(sceneCard)}`)
			}
			const graphNode = this.cityKnowledgeGraphNodes
				.find(node => node && node.type && node.type !== 'poi')
				|| this.cityKnowledgeGraphNodes[0]
			if (graphNode) {
				appendQuestion(this.createKnowledgeGraphNodePrompt(graphNode))
			}
			const serviceAction = this.prioritizedSceneServiceActions
				.find(action => action && (action.serviceIntent || ['merchant', 'ticketing', 'experience', 'navigation'].includes(action.taskType)))
				|| this.prioritizedSceneServiceActions[0]
			if (serviceAction) {
				const serviceHandoffTask = this.createVisionAgentServiceHandoff({
					...serviceAction,
					actionTitle: serviceAction.title,
					actionCopy: serviceAction.copy,
					poiName: this.result.poiName || '当前场景'
				})
				appendQuestion(this.createServiceHandoffPrompt(serviceHandoffTask))
			}
			const previousMemory = this.readVisionAgentMemoryTrail()
				.find(item => {
					if (!item || typeof item !== 'object') return false
					const currentPoiKey = this.result.poiCode || this.result.poiName
					const memoryPoiKey = item.poiCode || item.poiName
					return memoryPoiKey && memoryPoiKey !== currentPoiKey
				})
			if (previousMemory) {
				appendQuestion(`沿着连续识境，把${previousMemory.poiName || previousMemory.visionCaption || '上一拍'}和${this.result.poiName || '当前场景'}串起来讲，告诉我接下来最值得问什么。`)
			}
			return questions.slice(0, 6)
		},
		openKnowledgeGraphNode(node = {}) {
			if (this.recognitionActionBlocked) {
				this.showMissingOfficialPoiToast(node.title || '继续')
				return
			}
			const prompt = this.createKnowledgeGraphNodePrompt(node)
			this.askXiaojing(prompt)
		},
		createVisionAgentMemorySessionPackage(memoryTrail = [], currentSnapshot = null) {
			const rawSnapshots = [
				currentSnapshot,
				...(Array.isArray(memoryTrail) ? memoryTrail : [])
			].filter(snapshot => {
				if (!snapshot || typeof snapshot !== 'object') return false
				const safetyStatus = normalizeXichengSafetyStatus(snapshot.safetyStatus)
				if (isXichengUnsafeSafetyStatus(safetyStatus)) return false
				return Boolean(snapshot.poiCode || snapshot.poiName)
			})
			const seenSnapshotKeys = new Set()
			const sessionSnapshots = rawSnapshots.filter(snapshot => {
				const snapshotKey = `${snapshot.poiCode || snapshot.poiName}-${snapshot.source || ''}`
				if (!snapshotKey || seenSnapshotKeys.has(snapshotKey)) return false
				seenSnapshotKeys.add(snapshotKey)
				return true
			}).slice(0, 8)
			if (sessionSnapshots.length === 0) return null
			const uniqueTexts = (items = [], limit = 6) => Array.from(new Set(
				items.flat().map(item => String(item || '').trim()).filter(Boolean)
			)).slice(0, limit)
			const poiNames = uniqueTexts(sessionSnapshots.map(snapshot => snapshot.poiName || snapshot.poiCode), 6)
			const sceneDomainLabels = uniqueTexts(sessionSnapshots.map(snapshot => snapshot.sceneDomainLabels || []), 8)
			const serviceIntentLabels = uniqueTexts(sessionSnapshots.map(snapshot => snapshot.serviceIntentLabels || []), 8)
			const poiTrailText = poiNames.length > 0
				? `连续识境路线：${poiNames.join(' → ')}。`
				: '连续识境路线正在形成。'
			const domainCue = sceneDomainLabels.length > 0 ? sceneDomainLabels.join('、') : '当前场景'
			const serviceCue = serviceIntentLabels.length > 0 ? serviceIntentLabels.join('、') : '讲解、路线和游记'
			return {
				packageName: 'AI识境连续会话包',
				sceneCount: sessionSnapshots.length,
				poiNames,
				sceneDomainLabels,
				serviceIntentLabels,
				poiTrailText,
				continuityCueText: `小京会按这 ${sessionSnapshots.length} 次识境继续理解，不重新开始讲解。`,
				domainContinuityText: `连续关注的场景领域：${domainCue}。`,
				serviceContinuityText: `后续服务保持在${serviceCue}上接力。`,
				nextQuestionText: this.suggestedQuestions[0] || `继续问${this.result.poiName || XICHENG_REGION_CONFIG.companionName}`,
				updatedAt: new Date().toISOString()
			}
		},
		createVisionAgentMemorySnapshot(stage = 'current') {
			const visionContext = this.result.visionAgentContext || {}
			const sceneUnderstandingPackage = this.visionAgentSceneUnderstandingPackage
			return {
				id: `vision-agent-memory-${Date.now()}`,
				stage,
				regionCode: this.result.regionCode || XICHENG_REGION_CONFIG.regionCode,
				packageCode: this.result.packageCode || XICHENG_REGION_CONFIG.packageCode,
				sceneCode: this.result.sceneCode || XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: this.result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
				poiCode: this.result.poiCode || visionContext.poiCode || '',
				poiName: this.result.poiName || visionContext.poiName || visionContext.visionCaption || '',
				source: this.result.source || visionContext.source || '',
				sourceLabel: this.result.sourceLabel || visionContext.sourceLabel || '',
				locationText: visionContext.locationText || '',
				localTimeText: visionContext.localTimeText || '',
				weatherText: visionContext.weatherText || '',
				headingText: visionContext.headingText || '',
				serviceText: visionContext.serviceText || '',
				knowledgeGraphText: visionContext.knowledgeGraphText || '',
				worldInterfaceSummary: this.worldInterfaceSummary,
				worldInterfaceSignals: this.worldInterfaceSnapshot.signals,
				agentDecisionReasonSummary: visionContext.agentDecisionReasonSummary || '',
				agentDecisionReasonCards: this.agentDecisionReasonCardItems,
				sceneUnderstandingPackage,
				primarySceneDomainKey: sceneUnderstandingPackage.primaryDomainKey || '',
				primarySceneDomainLabel: sceneUnderstandingPackage.primaryDomainLabel || '',
				sceneDomainLabels: sceneUnderstandingPackage.domainCards.map(card => card.domainLabel || card.domainKey).filter(Boolean).slice(0, 6),
				serviceIntentLabels: this.prioritizedSceneServiceActions.map(action => this.serviceIntentLabel(action.serviceIntent || '') || action.title).filter(Boolean).slice(0, 6),
				confidence: this.result.confidence || visionContext.confidence || '',
				safetyStatus: normalizeXichengSafetyStatus(this.result.safetyStatus || visionContext.safetyStatus),
				sourceRecognitionContext: visionContext.sourceRecognitionContext || '',
				sourceCount: this.sourceList.length,
				rememberedAt: new Date().toISOString()
			}
		},
		rememberVisionAgentSceneMemory() {
			if (this.recognitionActionBlocked) return null
			const snapshot = this.createVisionAgentMemorySnapshot('current')
			if (!snapshot.poiCode && !snapshot.poiName) return null
			const snapshotKey = `${snapshot.poiCode || snapshot.poiName}-${snapshot.source || ''}`
			const memoryTrail = this.readVisionAgentMemoryTrail()
			const nextMemoryTrail = [
				snapshot,
				...memoryTrail.filter(item => {
					const itemKey = `${item.poiCode || item.poiName || ''}-${item.source || ''}`
					return itemKey !== snapshotKey
				})
			].slice(0, 24)
			uni.setStorageSync(XICHENG_REGION_CONFIG.visionAgentMemoryStorageKey, nextMemoryTrail)
			const memorySessionPackage = this.createVisionAgentMemorySessionPackage(nextMemoryTrail, snapshot)
			if (memorySessionPackage) {
				uni.setStorageSync(XICHENG_REGION_CONFIG.visionAgentMemorySessionStorageKey, memorySessionPackage)
			}
			return snapshot
		},
		isUnsafeCandidate(candidate = {}) {
			const safetyStatus = normalizeXichengSafetyStatus(candidate.safetyStatus)
			return isXichengUnsafeSafetyStatus(safetyStatus)
		},
		showUnsafeCandidateToast(candidate = {}) {
			const safetyStatus = normalizeXichengSafetyStatus(candidate.safetyStatus)
			uni.showToast({
				title: safetyStatus === 'UNAVAILABLE' ? '来源服务不可用，不能确认' : '无已审核来源，不能确认',
				icon: 'none'
			})
		},
		askXiaojing(question = '', { serviceHandoffContext = null } = {}) {
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
			this.rememberVisionAgentSceneMemory()
			const prompt = question || this.suggestedQuestions[0] || `讲讲${this.result.poiName}`
			const visionAgentContext = this.enrichedVisionAgentContext
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
				`safetyStatus=${encodeURIComponent(this.result.safetyStatus || '')}`,
				`visionAgentContext=${encodeRouteValue(JSON.stringify(visionAgentContext))}`,
				`sourceRecognitionContext=${encodeRouteValue(visionAgentContext.sourceRecognitionContext || '')}`,
				`memorySessionSceneCount=${encodeRouteValue(visionAgentContext.memorySessionSceneCount || '')}`
			]
			if (serviceHandoffContext) {
				query.push(`serviceHandoffContext=${encodeRouteValue(JSON.stringify(serviceHandoffContext))}`)
			}
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?${query.join('&')}`
			})
		},
		openVisionAgentAction(action = {}) {
			if (this.recognitionActionBlocked && action.requiresRecognition) {
				this.showMissingOfficialPoiToast(action.title || '继续')
				return
			}
			const prompt = this.createVisionAgentActionPrompt(action)
			this.rememberVisionAgentExecutionTask(action, prompt)
			this.askXiaojing(prompt)
		},
		createVisionAgentActionPrompt(action = {}) {
			return action.actionKey === 'photo-spot'
				? `先给我${this.result.poiName}的拍照建议，结合现在的时间、天气、方位和现场细节`
				: action.actionKey === 'video-brief'
					? `用30秒视频脚本讲讲${this.result.poiName}`
					: action.actionKey === 'deep-history'
						? `深入讲讲${this.result.poiName}的历史和城市知识图谱`
						: action.actionKey === 'kids-story'
							? `用儿童版讲讲${this.result.poiName}`
							: action.actionKey === 'english'
								? `Explain ${this.result.poiName} in English`
								: ''
		},
		rememberVisionAgentExecutionTask(action = {}, prompt = '') {
			return this.rememberVisionAgentServiceTask({
				...action,
				taskType: 'agent',
				actionPrompt: prompt,
				agentDecisionActionKey: this.cameraAgentDecisionSnapshot.agentDecisionActionKey,
				status: 'handoff',
				statusText: '已进入小京执行'
			})
		},
		openSceneServiceAction(action = {}) {
			const serviceTask = this.rememberVisionAgentServiceTask(action)
			if (action.actionKey === 'travelogue') {
				this.startRecording()
				return
			}
			this.activeServiceHandoffTask = this.createVisionAgentServiceHandoff(serviceTask)
			uni.showToast({
				title: `${serviceTask.statusText}`,
				icon: 'none'
			})
		},
		createVisionAgentServiceHandoff(task = {}) {
			const taskType = String(task.taskType || 'service')
			const serviceIntent = String(task.serviceIntent || '')
			const poiName = task.poiName || this.result.poiName || '当前场景'
			const intentText = task.serviceIntentLabel || this.serviceIntentLabel(serviceIntent) || task.taskTypeLabel || this.serviceTaskTypeLabel(taskType)
			const title = task.actionTitle || task.actionCopy || '继续服务'
			let handoffSteps = [
				{ label: '确认场景', copy: `围绕${poiName}和当前镜头上下文判断。` },
				{ label: '生成方案', copy: '交给小京继续整理可执行建议。' }
			]
			let primaryAction = '问小京生成方案'
			let handoffSummary = '先把当前识别结果、位置和现场信号交给小京，继续生成下一步服务方案。'
			if (taskType === 'merchant' || ['order', 'coupon', 'reservation'].includes(serviceIntent)) {
				handoffSteps = [
					{ label: '推荐菜/点单', copy: '按辣度、清真、人数和当地特色生成建议。' },
					{ label: '优惠券', copy: '真实优惠需接入商家系统后确认，不在本地伪造。' },
					{ label: '预约/排队', copy: '先生成排队和预约策略，再等待真实商家接口承接。' }
				]
				primaryAction = '问小京生成商家方案'
				handoffSummary = '适合把识别到的菜单、食物或商家线索转成点单、优惠和预约建议。'
			} else if (taskType === 'route') {
				handoffSteps = [
					{ label: '加入旅行地图', copy: '把当前点位放进今日路线和足迹。' },
					{ label: '推荐下一站', copy: '结合时间、天气、距离和兴趣继续规划。' }
				]
				primaryAction = '问小京安排下一站'
				handoffSummary = '把当前场景变成路线节点，继续推动下一站推荐。'
			} else if (taskType === 'growth') {
				handoffSteps = [
					{ label: '完成打卡', copy: '记录当前官方点位和识别来源。' },
					{ label: '领取徽章', copy: '把本次到访加入城市探索成长记录。' }
				]
				primaryAction = '问小京生成打卡文案'
				handoffSummary = '把这次 AI识境识别转成可保存、可分享的到访成果。'
			} else if (taskType === 'ticketing' || serviceIntent === 'ticket') {
				handoffSteps = [
					{ label: '票务信息', copy: '整理演出、活动、入场和购票注意事项。' },
					{ label: '活动时间', copy: '结合当前位置和当前时间判断是否适合前往。' }
				]
				primaryAction = '问小京查活动方案'
				handoffSummary = '适合把演出或活动识别结果转成票务和入场决策。'
			} else if (taskType === 'experience' || serviceIntent === 'experience') {
				handoffSteps = [
					{ label: '体验预约', copy: '整理附近非遗体验、讲师、工坊和适合人群。' },
					{ label: '附近体验', copy: '按距离、时段和兴趣推荐可继续探索的项目。' }
				]
				primaryAction = '问小京约体验'
				handoffSummary = '把非遗或手作线索转成可预约、可到店咨询的体验计划。'
			} else if (taskType === 'navigation' || serviceIntent === 'translate') {
				handoffSteps = [
					{ label: '文字翻译', copy: '继续解释读音、含义和本地语境。' },
					{ label: '步行导航', copy: '把路牌或招牌线索接到下一段步行路线。' }
				]
				primaryAction = '问小京翻译并导航'
				handoffSummary = '把 OCR 或路牌识别转成翻译、发音和方向建议。'
			}
			return {
				...task,
				handoffTitle: title,
				handoffSummary,
				serviceIntentText: intentText || '现场服务',
				handoffSteps,
				primaryAction
			}
		},
		createServiceHandoffPrompt(task = {}) {
			const poiName = task.poiName || this.result.poiName || '当前场景'
			const stepText = Array.isArray(task.handoffSteps)
				? task.handoffSteps.map(step => step.label).filter(Boolean).join('、')
				: ''
			return `围绕${poiName}的${task.actionTitle || task.taskTypeLabel || '服务'}，结合AI识境现场上下文，给我${stepText || '下一步'}方案；如果涉及商家、优惠、票务或预约，请明确哪些需要真实系统确认，不要编造可用券、库存或排队结果。`
		},
		createServiceHandoffRouteContext(task = {}) {
			return {
				actionKey: task.actionKey || '',
				actionTitle: task.actionTitle || '',
				taskType: task.taskType || '',
				taskTypeLabel: task.taskTypeLabel || '',
				serviceIntent: task.serviceIntent || '',
				serviceIntentLabel: task.serviceIntentLabel || '',
				serviceIntentText: task.serviceIntentText || task.serviceIntentLabel || task.taskTypeLabel || '',
				sceneDomain: task.sceneDomain || '',
				handoffSummary: task.handoffSummary || '',
				handoffSteps: Array.isArray(task.handoffSteps)
					? task.handoffSteps
						.map(step => ({
							label: step.label || '',
							copy: step.copy || ''
						}))
						.filter(step => step.label || step.copy)
						.slice(0, 3)
					: []
			}
		},
		openServiceHandoffPrimaryAction() {
			const task = this.activeServiceHandoffTask
			if (!task) return
			const prompt = this.createServiceHandoffPrompt(task)
			const serviceHandoffContext = this.createServiceHandoffRouteContext(task)
			this.rememberVisionAgentServiceTask({
				...task,
				actionPrompt: prompt,
				status: 'handoff',
				statusText: '已交给小京继续'
			})
			this.askXiaojing(prompt, { serviceHandoffContext })
		},
		closeServiceHandoffPanel() {
			this.activeServiceHandoffTask = null
		},
		rememberVisionAgentServiceTask(action = {}) {
			const existingTasks = uni.getStorageSync(XICHENG_REGION_CONFIG.visionAgentServiceTasksStorageKey)
			const tasks = Array.isArray(existingTasks) ? existingTasks : []
			const sceneUnderstandingPackage = this.visionAgentSceneUnderstandingPackage
			const task = {
				id: `vision-agent-task-${Date.now()}`,
				regionCode: this.result.regionCode || XICHENG_REGION_CONFIG.regionCode,
				packageCode: this.result.packageCode || XICHENG_REGION_CONFIG.packageCode,
				taskType: action.taskType || 'service',
				taskTypeLabel: this.serviceTaskTypeLabel(action.taskType || 'service'),
				actionKey: action.actionKey || '',
				actionTitle: action.title || '',
				actionCopy: action.copy || '',
				actionPrompt: action.actionPrompt || '',
				sceneDomain: action.sceneDomain || '',
				serviceIntent: action.serviceIntent || '',
				serviceIntentLabel: this.serviceIntentLabel(action.serviceIntent || ''),
				agentDecisionActionKey: action.agentDecisionActionKey || '',
				poiCode: this.result.poiCode || '',
				poiName: this.result.poiName || '',
				sceneCode: this.result.sceneCode || XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: this.result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
				visionAgentContext: this.enrichedVisionAgentContext,
				sceneUnderstandingPackage,
				primarySceneDomainKey: sceneUnderstandingPackage.primaryDomainKey || '',
				primarySceneDomainLabel: sceneUnderstandingPackage.primaryDomainLabel || '',
				memorySessionPackage: this.visionAgentMemorySessionPackage,
				status: action.status || 'collected',
				statusText: action.statusText || '已收进任务包',
				createdAt: new Date().toISOString()
			}
			uni.setStorageSync(XICHENG_REGION_CONFIG.visionAgentServiceTasksStorageKey, [
				task,
				...tasks
			].slice(0, 50))
			return task
		},
		serviceTaskTypeLabel(taskType = 'service') {
			if (taskType === 'merchant') return '商家'
			if (taskType === 'route') return '路线'
			if (taskType === 'travelogue') return '游记'
			if (taskType === 'growth') return '成长'
			if (taskType === 'agent') return 'Agent'
			if (taskType === 'ticketing') return '票务'
			if (taskType === 'experience') return '体验'
			if (taskType === 'navigation') return '导航'
			return '服务'
		},
		serviceIntentLabel(serviceIntent = '') {
			if (serviceIntent === 'order') return '点餐'
			if (serviceIntent === 'coupon') return '优惠'
			if (serviceIntent === 'reservation') return '预约'
			if (serviceIntent === 'ticket') return '票务'
			if (serviceIntent === 'experience') return '体验'
			if (serviceIntent === 'translate') return '翻译导航'
			return ''
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
			this.rememberVisionAgentSceneMemory()
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
			const visionAgentContext = this.enrichedVisionAgentContext
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
				visionAgentContext,
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
				url: `/pages/xicheng/travelogue/travelogue?mode=record&autoStart=1&regionCode=${encodeURIComponent(this.result.regionCode || XICHENG_REGION_CONFIG.regionCode)}&packageCode=${encodeURIComponent(this.result.packageCode || XICHENG_REGION_CONFIG.packageCode)}&sceneCode=${encodeURIComponent(this.result.sceneCode || XICHENG_REGION_CONFIG.sceneCode)}&sourceChannel=${encodeURIComponent(this.result.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel)}&poiCode=${encodeRouteValue(this.result.poiCode || '')}&poiName=${encodeRouteValue(this.result.poiName || '')}&companionName=${encodeRouteValue(this.result.companionName || XICHENG_REGION_CONFIG.companionName)}&safetyStatus=${encodeURIComponent(this.result.safetyStatus || '')}&visionAgentContext=${encodeRouteValue(JSON.stringify(visionAgentContext))}&sourceRecognitionContext=${encodeRouteValue(visionAgentContext.sourceRecognitionContext || '')}&memorySessionSceneCount=${encodeRouteValue(visionAgentContext.memorySessionSceneCount || '')}`
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

.label,
.reason,
.meta-label {
	display: block;
	font-size: 24rpx;
	line-height: 1.6;
	color: #746F68;
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

</style>
