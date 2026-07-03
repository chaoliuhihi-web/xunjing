<template>
	<view class="xicheng-travelogue xicheng-designed-page xicheng-bottom-safe xicheng-travelogue-shell">
		<xicheng-travelogue-edit-topbar
			v-if="isTravelogueEditMode"
			@go-back="goBack"
			@open-actions="openTravelogueActions"
		/>
		<xicheng-travelogue-record-shell
			v-if="!isTravelogueEditMode"
			:region="region"
			:preview-image="traveloguePreviewImage"
			:preview-title="traveloguePreviewTitle"
			:preview-text="traveloguePreviewText"
			:material-count="materialCount"
			:route-count="recognizedRoute || importedRoute ? 1 : 0"
			:photo-count="photoMaterialCount"
			:qa-count="aiGuideMaterialCount"
			:has-evidence="hasTraveloguePreviewEvidence"
			:has-reviewable-evidence="hasReviewableJourneyEvidence()"
			:style-options="travelogueStyleOptions"
			:active-style="activeTravelogueStyle"
			@generate="generateTravelogueDraft"
			@add-photo="addPhotoMaterial"
			@scroll-draft="scrollToDraftEditor"
			@open-reader="openTravelogueReaderPage"
			@apply-template="applyTravelogueTemplate"
			@export-pdf="exportMemorialPdf"
			@open-share="openSharePage"
			@open-works="openWorksPage"
		/>
		<xicheng-travelogue-legacy-hero
			v-if="!isTravelogueEditMode && showLegacyTravelogueHero"
			class="xicheng-travelogue-hero-host"
			:region="region"
			:title="travelogueHeroTitle"
			:subtitle="travelogueHeroSubtitle"
			:companion-line="travelogueCompanionLine"
		/>
		<xicheng-travelogue-generation-hero
			v-if="!isTravelogueEditMode && showAdvancedTravelogueGeneration"
			:region="region"
			:summary-cards="summaryCards"
			:style-options="travelogueStyleOptions"
			:active-style="activeTravelogueStyle"
			:selected-template="selectedTravelogueTemplate"
			:template-title="activeTravelogueStyleTitle"
			:template-settings="travelogueTemplateSettings"
			:generation-state="travelogueGenerationState"
			:material-hints="travelogueMaterialHints"
			:failure-reason="travelogueGenerationFailureReason"
			:has-evidence="hasTraveloguePreviewEvidence"
			:cover-image="traveloguePreviewImage"
			:title="traveloguePreviewTitle"
			:subtitle="longTravelogueSubtitle"
			:intro="longTravelogueIntro"
			:route-items="editorRouteItems"
			:chapters="longTravelogueChapters"
			:photo-cards="editorPhotoCards"
			:tags="traveloguePreviewTags"
			:source-count="workSourceCount"
			:auto-travelogue-package="visionAgentAutoTraveloguePackage"
			@apply-template="applyTravelogueTemplate"
			@change-template-settings="updateTravelogueTemplateSettings"
			@explore="openRoutesPage"
			@add-photo="addPhotoMaterial"
			@generate="generateTravelogueDraft"
			@edit="scrollToDraftEditor"
			@open-reader="openTravelogueReaderPage"
			@export-pdf="exportMemorialPdf"
			@publish-moments="openSharePage"
			@publish-xhs="openSharePage"
		/>
		<xicheng-travelogue-editor-share
			v-if="isTravelogueEditMode"
			class="travelogue-editor-reference-stack"
			:region="region"
			:editable-title="editableTravelogueTitle"
			:photo-cards="editorPhotoCards"
			:route-items="editorRouteItems"
			:feeling-text="editorFeelingText"
			:xiaojing-supplement="editorXiaojingSupplement"
			:tag-chips="travelogueTagChips"
			@update:title="editableTravelogueTitle = $event"
			@save="saveDraft"
			@generate-share="generatePoster"
			@publish="publishTravelogue"
			@add-photo="addPhotoMaterial"
		/>
		<xicheng-travelogue-secondary-directory
			v-if="isTravelogueEditMode"
			:entries="travelogueSecondaryEntries"
			@open="openTravelogueSecondaryEntry"
		/>
		<xicheng-travelogue-ops-details
			v-if="!isTravelogueEditMode && showTravelogueOpsDetails"
			:region="region"
			:material-count="materialCount"
			:passport-progress="passportProgress"
			:completed-task-count="completedTaskCount"
			:parent-child-tasks="parentChildTasks"
			:vision-agent-service-task-count="visionAgentServiceTaskCount"
			:visible-vision-agent-service-tasks="visibleVisionAgentServiceTasks"
			:recording-status-text="recordingStatusText"
			:route-point-count="routePointCount"
			:stay-point-count="stayPointCount"
			:filtered-track-point-count="filteredTrackPointCount"
			:recording-session="recordingSession"
			:imported-route="importedRoute"
			:inspiration-import-count="inspirationImportCount"
			:inspiration-imports="inspirationImports"
			:recognized-route="recognizedRoute"
			:recognized-route-stops="recognizedRouteStops"
			:badge-unlocked="badgeUnlocked"
			:badge-name="badgeName"
			:route-passport="routePassport"
			:active-badge-award="activeBadgeAward"
			:checkin-count="checkinCount"
			:route-checkins="routeCheckins"
			:materials="materials"
			:official-poi-names="officialPoiNames"
			:photo-material-count="photoMaterialCount"
			:remark-material-count="remarkMaterialCount"
			:remark-input="remarkInput"
			:study-task-drafts="studyTaskDrafts"
			:review-text="reviewText"
			:draft="draft"
			:editable-travelogue-title="editableTravelogueTitle"
			:editor-photo-cards="editorPhotoCards"
			:editor-route-items="editorRouteItems"
			:editor-feeling-text="editorFeelingText"
			:editor-xiaojing-supplement="editorXiaojingSupplement"
			:travelogue-tag-chips="travelogueTagChips"
			:share-artifacts="shareArtifacts"
			:review-submission="reviewSubmission"
			:ops-report="opsReport"
			:format-artifact-time="formatArtifactTime"
			:format-vision-agent-service-task-type="formatVisionAgentServiceTaskType"
			:create-vision-agent-service-task-meta="createVisionAgentServiceTaskMeta"
			:create-checkin-event-label="createCheckinEventLabel"
			:format-candidate-confirmation-audit="formatCandidateConfirmationAudit"
			:get-study-task-evidence="getStudyTaskEvidence"
			:format-study-task-evidence="formatStudyTaskEvidence"
			:get-study-task-status="getStudyTaskStatus"
			@start-recording="startRecordingSession"
			@resume-recording="resumeRecordingSession"
			@capture-track-point="captureTrackPoint"
			@mark-stay-point="markStayPoint"
			@pause-recording="pauseRecordingSession"
			@finish-recording="finishRecordingSession"
			@delete-recording="deleteRecordingSession"
			@delete-inspiration-import="deleteInspirationImport"
			@claim-route-badge="claimRouteBadge"
			@delete-route-checkin="deleteRouteCheckin"
			@correct-material-poi="correctMaterialPoi"
			@hide-material-location="hideMaterialLocation"
			@delete-journey-material="deleteJourneyMaterial"
			@update:remark-input="remarkInput = $event"
			@add-remark-material="addRemarkMaterial"
			@add-photo-material="addPhotoMaterial"
			@update-study-task-draft="updateStudyTaskDraft"
			@delete-study-task-evidence="deleteStudyTaskEvidence"
			@submit-study-task-evidence="submitStudyTaskEvidence"
			@add-study-task-photo="addStudyTaskPhoto"
			@update:draft="draft = $event"
			@save-draft="saveDraft"
			@update:editable-travelogue-title="editableTravelogueTitle = $event"
			@generate-share="generatePoster"
			@publish="publishTravelogue"
			@privacy-policy="openPrivacyPolicy"
			@user-protocol="openUserProtocol"
			@ai-content-notice="openAiContentNotice"
			@feedback="openXichengFeedbackEntry"
			@clear-local-data="clearXichengLocalData"
			@delete-share-artifact="deleteShareArtifact"
			@withdraw-review="withdrawReviewSubmission"
		/>
	</view>
</template>
<script>
import {
	XICHENG_OFFICIAL_POIS,
	XICHENG_RECOMMENDED_ROUTES,
	XICHENG_REGION_CONFIG,
	normalizeXichengRouteCode
} from '@/config/regions/xicheng.js'
import { decodeXichengRouteValue } from '@/request/xunjing/routeParams.js'
import { createXichengRouteOutputValue } from '@/request/xunjing/routeParams.js'
import { requestCurrentLocationForTrigger } from '@/request/xunjing/trigger.js'
import { isXichengUnsafeSafetyStatus, normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'
import { createXichengOfficialPoiSources } from '@/request/xunjing/officialPoi.js'
import { isXunjingUserCancelled } from '@/request/xunjing/userCancel.js'
import XichengTravelogueGenerationHero from '@/components/xicheng/XichengTravelogueGenerationHero.vue'
import XichengTravelogueLegacyHero from '@/components/xicheng/XichengTravelogueLegacyHero.vue'
import XichengTravelogueEditorShare from '@/components/xicheng/travelogue-editor-share.vue'
import XichengTravelogueEditTopbar from '@/components/xicheng/XichengTravelogueEditTopbar.vue'
import XichengTravelogueRecordShell from '@/components/xicheng/XichengTravelogueRecordShell.vue'
import XichengTravelogueSecondaryDirectory from '@/components/xicheng/XichengTravelogueSecondaryDirectory.vue'
import XichengTravelogueOpsDetails from '@/components/xicheng/XichengTravelogueOpsDetails.vue'
import { createXichengTravelogueGenerationStateMixin } from '@/components/xicheng/travelogueGenerationState.js'
import { createXichengTravelogueSecondaryEntries } from '@/components/xicheng/travelogueSecondaryEntries.js'
import {
	getXichengDisplaySourceDescription,
	getXichengDisplaySourceTitle,
	normalizeXichengReviewedSources
} from '@/request/xunjing/sources.js'
import {
	createVisionAgentMemorySessionPackageFromRouteContext,
	createVisionAgentAutoTraveloguePackage,
	hasReviewableVisionAgentServiceTaskEvidence,
	parseTravelogueVisionAgentContext
} from '@/request/xunjing/visionAgentTravelogue.js'
export const XICHENG_PLANNING_ONLY_MATERIAL_TYPES = Object.freeze([
	'official-route-poi',
	'inspiration-poi',
	'inspiration-image'
])
const XICHENG_TRAVELOGUE_PREVIEW_EMPTY_TITLE = '等待你的西城素材'
const XICHENG_TRAVELOGUE_PREVIEW_EMPTY_TEXT = '请先通过识别、开始记录、补充照片或现场备注积累真实素材，再预览西城游记。预览只整理已记录的地点、照片、路线轨迹和用户备注。'
const XICHENG_TRAVELOGUE_PREVIEW_EMPTY_TAGS = Object.freeze(['待补充素材', '来源审核后生成', '私人草稿'])
const XICHENG_DEFAULT_TEMPLATE_SETTINGS = Object.freeze({ cover: '使用白塔寺主图', layout: '杂志大图 + 长文', focus: '路线故事线', crop: '自动适配封面', tone: '像人写的自然语气', privacy: '只用已审核来源' })
export const normalizeTravelogueMode = (mode = 'draft') => {
	const normalizedMode = String(mode || 'draft').trim()
	return ['draft', 'edit', 'record'].includes(normalizedMode) ? normalizedMode : 'draft'
}
export const createXichengTraveloguePreviewExcerpt = (text = '', limit = 88) => {
	const normalizedText = String(text || '').replace(/\s+/g, ' ').trim()
	if (!normalizedText || normalizedText.length <= limit) return normalizedText
	const boundedText = normalizedText.slice(0, limit)
	const punctuationIndexes = ['。', '！', '？', '；', '，'].map(mark => boundedText.lastIndexOf(mark)).filter(index => index >= Math.floor(limit * 0.56))
	const cutIndex = punctuationIndexes.length > 0 ? Math.max(...punctuationIndexes) : -1
	const excerpt = (cutIndex >= 0 ? boundedText.slice(0, cutIndex + 1) : boundedText).replace(/[，、；：:,\s]+$/g, '').trim()
	return `${excerpt}…`
}
const sanitizeXichengTravelogueDraftText = (draftText = '') => String(draftText || '')
	.replace(/亲子研学任务可继续围绕/g, '街区观察可以继续围绕')
	.replace(/研学任务证据包括/g, '现场观察提到')
	.replace(/，补充孩子观察或照片证据/g, '，补充现场观察或照片细节')
	.replace(/亲子研学发现/g, '街区发现')
	.replace(/路线护照打卡包括/g, '路线经过')
	.replace(/研学任务证据和用户备注/g, '用户备注')
export const isUnsafeSourceBlockedMaterial = (material = {}) => {
	const safetyStatus = normalizeXichengSafetyStatus(material.safetyStatus)
	return isXichengUnsafeSafetyStatus(safetyStatus)
}
export const hasReviewableMaterialEvidence = (material = {}) => {
	if (!material || isUnsafeSourceBlockedMaterial(material)) return false
	return Boolean(
		material.poiCode
		|| material.poiName
		|| material.remarkText
		|| material.imagePath
		|| material.routeRecommendation
		|| material.aiAnswerExcerpt
		|| ['photo', 'remark', 'manual-entry'].includes(material.type)
	)
}
export const hasReviewableWorkMaterialEvidence = (material = {}) => {
	if (!material) return false
	if (XICHENG_PLANNING_ONLY_MATERIAL_TYPES.includes(material.type)) {
		return false
	}
	return hasReviewableMaterialEvidence(material)
}
export const getReviewableMaterialSources = (material = {}) => {
	if (!hasReviewableMaterialEvidence(material)) return []
	return normalizeXichengReviewedSources(material.sources)
}
export const getReviewableWorkMaterialSources = (material = {}) => {
	if (!hasReviewableWorkMaterialEvidence(material)) return []
	return normalizeXichengReviewedSources(material.sources)
}
export function hasReviewableRouteCheckinEvidence(checkin = {}) {
	const safetyStatus = normalizeXichengSafetyStatus(checkin.safetyStatus)
	if (isXichengUnsafeSafetyStatus(safetyStatus)) return false
	return Boolean(checkin.poiCode || checkin.poiName || checkin.routeTitle)
}
export const getReviewableRouteCheckinSources = (checkin = {}) => {
	if (!hasReviewableRouteCheckinEvidence(checkin)) return []
	return normalizeXichengReviewedSources(checkin.sources)
}
export const hasReviewableStudyTaskEvidence = (evidence = {}) => {
	if (!evidence || !evidence.completedAt) return false
	const safetyStatus = normalizeXichengSafetyStatus(evidence.safetyStatus)
	if (isXichengUnsafeSafetyStatus(safetyStatus)) return false
	return Boolean(
		String(evidence.answerText || '').trim()
		|| evidence.photoPath
	)
}
export const hasXichengTravelogueDraftEvidence = ({
	materials = [],
	recordingSession = null,
	studyTaskEvidence = [],
	routeRecommendation = null,
	routeCheckins = [],
	visionAgentServiceTasks = [],
	visionAgentMemorySessionPackage = null
} = {}) => {
	const hasMaterialEvidence = Array.isArray(materials) && materials.some(material => {
		if (!material) return false
		return hasReviewableMaterialEvidence(material)
	})
	const hasTrackEvidence = Boolean(recordingSession && (
		(Array.isArray(recordingSession.trackPoints) && recordingSession.trackPoints.length > 0)
		|| (Array.isArray(recordingSession.stayPoints) && recordingSession.stayPoints.length > 0)
	))
	const hasStudyEvidence = Array.isArray(studyTaskEvidence) && studyTaskEvidence.some(evidence => hasReviewableStudyTaskEvidence(evidence))
	const hasRouteEvidence = Boolean(routeRecommendation && (
		routeRecommendation.title
		|| (Array.isArray(routeRecommendation.stops) && routeRecommendation.stops.length > 0)
	))
	const hasRouteCheckinEvidence = Array.isArray(routeCheckins)
		&& routeCheckins.some(checkin => hasReviewableRouteCheckinEvidence(checkin))
	const hasVisionAgentServiceTaskEvidence = Array.isArray(visionAgentServiceTasks)
		&& visionAgentServiceTasks.some(task => hasReviewableVisionAgentServiceTaskEvidence(task))
	const hasVisionAgentMemorySessionEvidence = Boolean(visionAgentMemorySessionPackage && Number(visionAgentMemorySessionPackage.sceneCount || 0) > 0)
	return hasMaterialEvidence || hasTrackEvidence || hasStudyEvidence || hasRouteEvidence || hasRouteCheckinEvidence || hasVisionAgentServiceTaskEvidence || hasVisionAgentMemorySessionEvidence
}
export const hasXichengReviewableWorkEvidence = ({
	materials = [],
	recordingSession = null,
	studyTaskEvidence = [],
	routeCheckins = []
} = {}) => {
	const hasMaterialEvidence = Array.isArray(materials) && materials.some(material => {
		return hasReviewableWorkMaterialEvidence(material)
	})
	const hasTrackEvidence = Boolean(recordingSession && (
		(Array.isArray(recordingSession.trackPoints) && recordingSession.trackPoints.length > 0)
		|| (Array.isArray(recordingSession.stayPoints) && recordingSession.stayPoints.length > 0)
	))
	const hasStudyEvidence = Array.isArray(studyTaskEvidence) && studyTaskEvidence.some(evidence => hasReviewableStudyTaskEvidence(evidence))
	const hasRouteCheckinEvidence = Array.isArray(routeCheckins)
		&& routeCheckins.some(checkin => hasReviewableRouteCheckinEvidence(checkin))
	return hasMaterialEvidence || hasTrackEvidence || hasStudyEvidence || hasRouteCheckinEvidence
}
export const createXichengTravelogueDraft = ({
	materials = [],
	routeRecommendation = null,
	recordingSession = null,
	studyTaskEvidence = [],
	routeCheckins = [],
	visionAgentServiceTasks = [],
	visionAgentMemorySessionPackage = null
} = {}) => {
	if (!hasXichengTravelogueDraftEvidence({
		materials,
		routeRecommendation,
		recordingSession,
		studyTaskEvidence,
		routeCheckins,
		visionAgentServiceTasks,
		visionAgentMemorySessionPackage
	})) {
		return `请先通过识别、开始记录、补充照片或现场备注积累真实素材，再生成西城游记草稿。小京会基于真实照片、轨迹、识别事件、停留点和用户备注整理内容，不会替用户编造路线。`
	}
	const reviewableMaterials = materials.filter(material => hasReviewableMaterialEvidence(material))
	const poiNames = Array.from(new Set(
		reviewableMaterials
			.map(material => material && material.poiName ? material.poiName : '')
			.filter(Boolean)
	))
	const routeCheckinNames = Array.from(new Set(
		(Array.isArray(routeCheckins) ? routeCheckins : [])
			.filter(checkin => hasReviewableRouteCheckinEvidence(checkin))
			.map(checkin => checkin && checkin.poiName ? checkin.poiName : '')
			.filter(Boolean)
	))
	const routePointCount = recordingSession && Array.isArray(recordingSession.trackPoints)
		? recordingSession.trackPoints.length
		: 0
	const stayPointCount = recordingSession && Array.isArray(recordingSession.stayPoints)
		? recordingSession.stayPoints.length
		: 0
	const routeText = routeRecommendation && routeRecommendation.title
		? routeRecommendation.title
		: poiNames.length > 0 ? poiNames.join('、') : routeCheckinNames.length > 0 ? routeCheckinNames.join('、') : '本次西城 Citywalk'
	const photoCount = reviewableMaterials.filter(material => material && material.type === 'photo').length
	const remarkTexts = reviewableMaterials
		.map(material => material && material.remarkText ? material.remarkText : '')
		.filter(Boolean)
		.slice(0, 2)
	const aiGuideExcerpts = reviewableMaterials
		.filter(material => material && material.type === 'ai-guide' && material.aiAnswerExcerpt)
		.map(material => material.aiAnswerExcerpt)
		.slice(0, 2)
	const trackText = routePointCount > 0 ? `本次主动记录了 ${routePointCount} 个前台位置点。` : ''
	const stayText = stayPointCount > 0 ? `本次标记了 ${stayPointCount} 个停留点。` : ''
	const routeCheckinText = routeCheckinNames.length > 0 ? `路线经过：${routeCheckinNames.join('、')}。` : ''
	const photoText = photoCount > 0 ? `现场补充了 ${photoCount} 张照片。` : ''
	const remarkText = remarkTexts.length > 0 ? `用户备注提到：${remarkTexts.join('；')}。` : ''
	const aiGuideText = aiGuideExcerpts.length > 0 ? `小京回答提到：${aiGuideExcerpts.join('；')}。` : ''
	const completedStudyEvidence = Array.isArray(studyTaskEvidence)
		? studyTaskEvidence.filter(evidence => hasReviewableStudyTaskEvidence(evidence)).slice(0, 2)
		: []
	const observationEvidenceText = completedStudyEvidence.length > 0
		? `现场观察提到：${completedStudyEvidence.map(evidence => evidence.answerText || evidence.taskText || '照片观察').join('；')}。`
		: ''
	const studyTaskText = observationEvidenceText
	const reviewableVisionAgentTasks = Array.isArray(visionAgentServiceTasks)
		? visionAgentServiceTasks.filter(task => hasReviewableVisionAgentServiceTaskEvidence(task)).slice(0, 4)
		: []
	const visionAgentAutoTraveloguePackage = createVisionAgentAutoTraveloguePackage(visionAgentServiceTasks)
	const visionAgentPackageBoundaryText = visionAgentAutoTraveloguePackage ? visionAgentAutoTraveloguePackage.realSystemBoundaryText : ''
	const visionAgentRealSystemBoundaryText = visionAgentPackageBoundaryText || ''
	const visionAgentTaskText = visionAgentAutoTraveloguePackage
		? `AI识境已收集 ${reviewableVisionAgentTasks.length} 个后续动作：${reviewableVisionAgentTasks.map(task => `${task.taskTypeLabel || '服务'}-${task.actionTitle || task.actionCopy || '现场任务'}`).join('；')}。${visionAgentAutoTraveloguePackage.storyCueText}${visionAgentAutoTraveloguePackage.mapCueText}${visionAgentAutoTraveloguePackage.shareCueText}${visionAgentRealSystemBoundaryText}`
		: ''
	const visionAgentMemorySessionText = visionAgentMemorySessionPackage
		? `AI识境连续会话包：${visionAgentMemorySessionPackage.continuityCueText || ''}${visionAgentMemorySessionPackage.poiTrailText || ''}${visionAgentMemorySessionPackage.domainContinuityText || ''}`
		: ''
	return `今天的西城 Citywalk 从${routeText}展开。小京把识别到的文化点、讲解来源和现场观察整理进旅行素材盒。${trackText}${stayText}${photoText}${routeCheckinText}${remarkText}${studyTaskText}${aiGuideText}${visionAgentTaskText}${visionAgentMemorySessionText}这条路线适合慢慢走、边看边听，把建筑细节、胡同生活和街区发现写进一篇可继续编辑的游记。`
}
const createEmptyRecordingSession = () => ({ sessionId: '', regionCode: XICHENG_REGION_CONFIG.regionCode, packageCode: XICHENG_REGION_CONFIG.packageCode, status: 'idle', startedAt: '', pausedAt: '', finishedAt: '', trackPoints: [], stayPoints: [], filteredTrackPoints: [] })
const XICHENG_TRACK_POINT_QUALITY = Object.freeze({ maxPoiAttributionAccuracyMeters: 80, abnormalJumpWindowSeconds: 5, abnormalJumpDistanceMeters: 500 })
const normalizeTrackNumber = (value) => {
	const numericValue = Number(value)
	return Number.isFinite(numericValue) ? numericValue : null
}
const calculateTrackPointDistanceMeters = (left = {}, right = {}) => {
	const leftLatitude = normalizeTrackNumber(left.latitude)
	const leftLongitude = normalizeTrackNumber(left.longitude)
	const rightLatitude = normalizeTrackNumber(right.latitude)
	const rightLongitude = normalizeTrackNumber(right.longitude)
	if (leftLatitude === null || leftLongitude === null || rightLatitude === null || rightLongitude === null) {
		return null
	}
	const toRadians = degrees => degrees * Math.PI / 180
	const earthRadiusMeters = 6371000
	const deltaLatitude = toRadians(rightLatitude - leftLatitude)
	const deltaLongitude = toRadians(rightLongitude - leftLongitude)
	const a = Math.sin(deltaLatitude / 2) ** 2
		+ Math.cos(toRadians(leftLatitude)) * Math.cos(toRadians(rightLatitude)) * Math.sin(deltaLongitude / 2) ** 2
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return Math.round(earthRadiusMeters * c)
}
const decodeJourneyRouteValue = decodeXichengRouteValue
const encodeRouteValue = (value = '') => createXichengRouteOutputValue(value, { platform: process.env.UNI_PLATFORM })
const resolveRouteByCode = (routeCode = '') => {
	const normalizedRouteCode = normalizeXichengRouteCode(routeCode)
	return XICHENG_RECOMMENDED_ROUTES.find(route => route.routeCode === normalizedRouteCode) || null
}
const createOfficialRouteMaterials = ({
	route = null,
	regionCode = XICHENG_REGION_CONFIG.regionCode,
	packageCode = XICHENG_REGION_CONFIG.packageCode,
	sceneCode = XICHENG_REGION_CONFIG.sceneCode,
	sourceChannel = XICHENG_REGION_CONFIG.sourceChannel,
	capturedAt = new Date().toISOString()
} = {}) => {
	if (!route || !Array.isArray(route.stops)) return []
	return route.stops.map(stop => {
		const sources = createXichengOfficialPoiSources(stop)
		return {
			type: 'official-route-poi',
			regionCode,
			packageCode,
			sceneCode,
			sourceChannel,
			poiCode: stop.poiCode,
			poiName: stop.poiName,
			routeCode: route.routeCode,
			routeTitle: route.title,
			sourceLabel: '官方路线详情',
			sources,
			sourceCount: sources.length,
			safetyStatus: 'PASSED',
			reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
			publishStatus: 'private',
			capturedAt
		}
	})
}
const normalizePhotoCoordinate = (value) => {
	const numericValue = Number(value)
	return Number.isFinite(numericValue) ? numericValue : null
}
export const normalizePhotoExifLocationForMaterial = (fileMeta = {}) => {
	const exifLocation = fileMeta.exifLocation || fileMeta.location || {}
	const exifLatitude = exifLocation.latitude !== undefined
		? exifLocation.latitude
		: fileMeta.exifLatitude !== undefined ? fileMeta.exifLatitude : fileMeta.latitude
	const exifLongitude = exifLocation.longitude !== undefined
		? exifLocation.longitude
		: fileMeta.exifLongitude !== undefined ? fileMeta.exifLongitude : fileMeta.longitude
	const latitude = normalizePhotoCoordinate(exifLatitude)
	const longitude = normalizePhotoCoordinate(exifLongitude)
	if (latitude === null || longitude === null) return null
	return {
		latitude,
		longitude,
		coordType: exifLocation.coordType || exifLocation.type || fileMeta.coordType || fileMeta.type || 'gcj02',
		accuracyMeters: Math.round(Number(exifLocation.accuracyMeters || exifLocation.accuracy || fileMeta.accuracyMeters || fileMeta.accuracy || 0)),
		exifSource: fileMeta.exifLocation ? 'chooseImage-exifLocation' : 'chooseImage-tempFile'
	}
}
export const resolvePhotoEvidenceFileMeta = (chooseImageResult = {}) => {
	const tempFile = Array.isArray(chooseImageResult.tempFiles) && chooseImageResult.tempFiles[0]
		? chooseImageResult.tempFiles[0]
		: {}
	const filePath = tempFile.path
		|| tempFile.tempFilePath
		|| (chooseImageResult.tempFilePaths && chooseImageResult.tempFilePaths[0] ? chooseImageResult.tempFilePaths[0] : '')
	return {
		filePath,
		localFileId: tempFile.fileId || tempFile.uuid || tempFile.path || tempFile.tempFilePath || filePath,
		imageSizeBytes: Number(tempFile.size || tempFile.fileSize || 0) || 0,
		imageMimeType: tempFile.type || tempFile.mimeType || '',
		exifLocation: normalizePhotoExifLocationForMaterial(tempFile)
	}
}
export default {
	components: { XichengTravelogueGenerationHero, XichengTravelogueLegacyHero, XichengTravelogueEditorShare, XichengTravelogueEditTopbar, XichengTravelogueRecordShell, XichengTravelogueSecondaryDirectory, XichengTravelogueOpsDetails },
	mixins: [createXichengTravelogueGenerationStateMixin()],
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			officialPois: XICHENG_OFFICIAL_POIS,
			routePassport: XICHENG_REGION_CONFIG.routePassport,
			parentChildTasks: XICHENG_REGION_CONFIG.parentChildTasks,
			materials: [],
			importedRoute: null,
			draft: '',
			reviewText: XICHENG_REGION_CONFIG.reviewStatus.draft,
			posterStatus: '未生成',
			pdfStatus: '未生成',
			reviewSubmission: null,
			shareArtifacts: [],
			remarkInput: '',
			editableTravelogueTitle: '在白塔下遇见西城',
			travelogueTagChips: ['白塔寺', '什刹海', '胡同漫步'],
			travelogueMode: 'draft',
			showLegacyTravelogueHero: false,
			showAdvancedTravelogueGeneration: false,
			showTravelogueOpsDetails: false,
			activeTravelogueStyle: 'citywalk',
			selectedTravelogueTemplate: 'citywalk',
			travelogueTemplateSettings: { ...XICHENG_DEFAULT_TEMPLATE_SETTINGS },
			travelogueStyleOptions: [{ key: 'family', title: '家庭纪念' }, { key: 'citywalk', title: '城市漫步杂志' }, { key: 'culture', title: '文化札记' }, { key: 'album', title: '照片纪念册' }],
			studyTaskEvidence: [],
			studyTaskDrafts: [],
			badgeAwards: [],
			routeCheckins: [],
			inspirationImports: [],
			recognitionFeedbacks: [],
			visionAgentServiceTasks: [],
			visionAgentMemorySessionPackage: null,
			visionAgentRouteContext: {}, visionAgentRouteContextSource: '',
			recordingSession: createEmptyRecordingSession()
			}
		},
	computed: {
		isTravelogueEditMode() {
			return this.travelogueMode === 'edit'
		},
		travelogueHeroTitle() {
			return this.isTravelogueEditMode ? '编辑游记' : '生成西城游记'
		},
		travelogueHeroSubtitle() {
			return this.isTravelogueEditMode
				? '继续修改标题、照片、路线、感受和游记标签，发布前确认公开范围。'
				: '把识别地点、路线记录、照片和现场备注整理成一篇值得分享的长文游记。'
		},
		travelogueCompanionLine() {
			return '这些片段可以生成你的游记'
		},
		travelogueSecondaryEntries() {
			return createXichengTravelogueSecondaryEntries({
				materialCount: this.materialCount,
				routePointCount: this.routePointCount,
				passportProgress: this.passportProgress,
				completedTaskCount: this.completedTaskCount,
				parentChildTaskCount: this.parentChildTasks.length,
				shareArtifactCount: this.shareArtifacts.length,
				reviewText: this.reviewText,
				recognitionCount: this.opsReport.recognitionCount,
				reviewBlockerCount: this.opsReport.reviewBlockerCount
			})
		},
		materialCount() {
			return this.materials.length
		},
		sourceCount() {
			const materialSourceCount = this.materials.reduce((total, material) => {
				return total + getReviewableMaterialSources(material).length
			}, 0)
			const routeCheckinSourceCount = this.routeCheckins.reduce((total, checkin) => {
				return total + getReviewableRouteCheckinSources(checkin).length
			}, 0)
			return materialSourceCount + routeCheckinSourceCount
		},
		workSourceCount() {
			const materialSourceCount = this.materials.reduce((total, material) => {
				return total + getReviewableWorkMaterialSources(material).length
			}, 0)
			const routeCheckinSourceCount = this.routeCheckins.reduce((total, checkin) => {
				return total + getReviewableRouteCheckinSources(checkin).length
			}, 0)
			return materialSourceCount + routeCheckinSourceCount
		},
		completedTaskCount() {
			return Math.min(this.studyTaskEvidenceCount, this.parentChildTasks.length)
		},
		routePassportTargetCount() {
			return Number(this.routePassport.targetCheckinCount) || 3
		},
		routePassportCheckinCount() {
			const checkedPoiKeys = new Set(
				this.routeCheckins
					.filter(checkin => this.hasReviewableRouteCheckinEvidence(checkin))
					.map(checkin => checkin && (checkin.poiCode || checkin.poiName) ? (checkin.poiCode || checkin.poiName) : '')
					.filter(Boolean)
			)
			return Math.min(checkedPoiKeys.size, this.routePassportTargetCount)
		},
		passportProgress() {
			const total = Math.max(this.routePassportTargetCount, 1)
			return Math.min(100, Math.round((this.routePassportCheckinCount / total) * 100))
		},
		badgeUnlocked() {
			return this.passportProgress >= 100
		},
		badgeName() {
			return `${this.routePassport.badgePrefix || '西城印章'} · Citywalk`
		},
		routeBadgeCode() {
			return `${XICHENG_REGION_CONFIG.regionCode}:route-passport:citywalk`
		},
		activeBadgeAward() {
			return this.badgeAwards.find(award => award && award.badgeCode === this.routeBadgeCode) || null
		},
			badgeAwardCount() {
				return this.badgeAwards.length
			},
			checkinCount() {
				return this.routeCheckins.length
			},
			inspirationImportCount() {
				return this.inspirationImports.length
			},
			recognitionFeedbackCount() {
				return this.recognitionFeedbacks.length
			},
			visionAgentServiceTaskCount() {
				return this.visionAgentServiceTasks.length
			},
			visibleVisionAgentServiceTasks() {
				return this.visionAgentServiceTasks
					.filter(task => hasReviewableVisionAgentServiceTaskEvidence(task))
					.slice(0, 4)
			},
			visionAgentAutoTraveloguePackage() {
				return createVisionAgentAutoTraveloguePackage(this.visionAgentServiceTasks)
			},
			visionAgentRealSystemBoundary() {
				return this.visionAgentAutoTraveloguePackage && this.visionAgentAutoTraveloguePackage.realSystemBoundaryText
					? this.visionAgentAutoTraveloguePackage.realSystemBoundaryText
					: ''
			},
			aiGuideMaterials() {
				return this.materials.filter(material => material && material.type === 'ai-guide' && hasReviewableMaterialEvidence(material))
			},
		aiGuideMaterialCount() {
			return this.aiGuideMaterials.length
		},
		candidateConfirmationAudits() {
			const auditItems = [
				...this.materials,
				...this.routeCheckins,
				...this.recognitionFeedbacks
			]
			const seenAuditKeys = new Set()
			const audits = []
			auditItems.forEach(item => {
				const audit = item && item.candidateConfirmationAudit ? item.candidateConfirmationAudit : null
				if (!audit) return
				const auditKey = audit.confirmedAt || `${audit.selectedCandidatePoiCode || ''}:${audit.candidateCount || 0}:${audit.confirmationSource || ''}`
				if (seenAuditKeys.has(auditKey)) return
				seenAuditKeys.add(auditKey)
				audits.push(audit)
			})
			return audits
		},
		candidateConfirmationCount() {
			return this.candidateConfirmationAudits.length
		},
		candidateConfirmedPoiLabel() {
			const poiNames = this.candidateConfirmationAudits
				.map(audit => audit && audit.selectedCandidatePoiName ? audit.selectedCandidatePoiName : '')
				.filter(Boolean)
			return poiNames.length > 0 ? Array.from(new Set(poiNames)).join('、') : '暂无'
		},
		completedStudyTaskEvidence() {
			return this.studyTaskEvidence.filter(evidence => hasReviewableStudyTaskEvidence(evidence))
		},
		studyTaskEvidenceCount() {
			return this.completedStudyTaskEvidence.length
		},
		reportTemplateSections() {
			return [
				{ sectionKey: 'traffic', title: '访问与识别' },
				{ sectionKey: 'route-completion', title: '路线完成' },
				{ sectionKey: 'hot-pois', title: '热门 POI' },
				{ sectionKey: 'content-works', title: '作品数' },
				{ sectionKey: 'sharing', title: '分享数' },
				{ sectionKey: 'mis-trigger', title: '误触发' },
				{ sectionKey: 'optimization', title: '优化建议' }
			]
		},
		misTriggerCount() {
			const explicitFeedbackCount = this.recognitionFeedbacks.filter(feedback => feedback && feedback.misTrigger).length
			const lowConfidenceMaterialCount = this.materials.filter(material => {
				const confidence = material && material.triggerConfidence !== undefined
					? Number(material.triggerConfidence)
					: 0
				return confidence > 0 && confidence < 0.6
			}).length
			return explicitFeedbackCount + lowConfidenceMaterialCount
		},
		safetyStatusSummary() {
			return this.createSafetyStatusSummary()
		},
		safetyBlockedCount() {
			return this.safetyStatusSummary.blockedCount
		},
		safetyUnavailableCount() {
			return this.safetyStatusSummary.unavailableCount
		},
		reviewReadinessSummary() {
			const reviewBlockers = []
			if (this.workSourceCount === 0) {
				reviewBlockers.push('missing-reviewed-sources')
			}
			if (this.safetyBlockedCount > 0) {
				reviewBlockers.push('blocked-ai-answer')
			}
			if (this.safetyUnavailableCount > 0) {
				reviewBlockers.push('ai-source-service-unavailable')
			}
			return {
				sourceReadinessStatus: reviewBlockers.length === 0 ? 'SOURCE_READY' : 'SOURCE_REVIEW_REQUIRED',
				reviewedSourceCount: this.workSourceCount,
				totalSourceCount: this.sourceCount,
				safetyBlockedCount: this.safetyBlockedCount,
				safetyUnavailableCount: this.safetyUnavailableCount,
				reviewBlockers
			}
		},
		opsReport() {
			const hotPois = this.createHotPoiRanking()
			const optimizationSuggestions = this.createOptimizationSuggestions()
			return {
				templateCode: 'xicheng-city-ops-report-v1',
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				companionName: XICHENG_REGION_CONFIG.companionName,
				templateSections: this.reportTemplateSections,
				visitCount: this.materialCount + this.shareArtifacts.length,
				recognitionCount: this.materialCount,
				routeCompletionRate: this.passportProgress,
				hotPois: this.createHotPoiRanking(),
				sourceCount: this.sourceCount,
				workSourceCount: this.workSourceCount,
				workCount: this.draft ? 1 : 0,
				inspirationImportCount: this.inspirationImportCount,
				studyTaskEvidenceCount: this.studyTaskEvidenceCount,
					badgeAwardCount: this.badgeAwardCount,
					checkinCount: this.checkinCount,
					recognitionFeedbackCount: this.recognitionFeedbackCount,
					candidateConfirmationCount: this.candidateConfirmationCount,
					aiGuideMaterialCount: this.aiGuideMaterialCount,
					visionAgentServiceTaskCount: this.visionAgentServiceTaskCount,
					visionAgentAutoTraveloguePackage: this.visionAgentAutoTraveloguePackage,
					visionAgentMemorySessionPackage: this.visionAgentMemorySessionPackage,
					visionAgentMemorySceneCount: this.visionAgentMemorySessionPackage?.sceneCount || 0,
					visionAgentRouteContext: this.visionAgentRouteContext, visionAgentRouteContextSource: this.visionAgentRouteContextSource,
					visionAgentSceneDomainLabels: this.visionAgentAutoTraveloguePackage?.sceneDomainLabels || [],
					visionAgentServiceIntentLabels: this.visionAgentAutoTraveloguePackage?.serviceIntentLabels || [],
					visionAgentRealSystemBoundary: this.visionAgentRealSystemBoundary,
					visionAgentRealSystemRequiredTaskCount: this.visionAgentAutoTraveloguePackage?.realSystemRequiredTaskCount || 0,
					shareCount: this.shareArtifacts.length,
					misTriggerCount: this.misTriggerCount,
					safetyStatusSummary: this.safetyStatusSummary,
				safetyBlockedCount: this.safetyBlockedCount,
				safetyUnavailableCount: this.safetyUnavailableCount,
				reviewReadinessSummary: this.reviewReadinessSummary,
				sourceReadinessStatus: this.reviewReadinessSummary.sourceReadinessStatus,
				workSourceCount: this.workSourceCount,
				reviewedSourceCount: this.reviewReadinessSummary.reviewedSourceCount,
				reviewBlockers: this.reviewReadinessSummary.reviewBlockers,
				reviewBlockerCount: this.reviewReadinessSummary.reviewBlockers.length,
				optimizationSuggestions: this.createOptimizationSuggestions(),
				reviewStatus: this.reviewText,
				posterStatus: this.posterStatus,
				pdfStatus: this.pdfStatus,
				shareAssetCount: this.shareArtifacts.length,
				hotPoiLabel: hotPois.length > 0 ? hotPois.map(poi => `${poi.poiName}(${poi.visitCount})`).join('、') : '暂无',
				candidateConfirmedPoiLabel: this.candidateConfirmedPoiLabel,
				optimizationSuggestionText: optimizationSuggestions.join('；'),
				routePointCount: this.routePointCount,
				stayPointCount: this.stayPointCount,
				qualityReport: this.qualityReport,
				filteredTrackPointCount: this.filteredTrackPointCount,
				photoMaterialCount: this.photoMaterialCount,
				remarkMaterialCount: this.remarkMaterialCount,
				recordingStatus: this.recordingStatusText
			}
		},
		routePointCount() {
			return Array.isArray(this.recordingSession.trackPoints) ? this.recordingSession.trackPoints.length : 0
		},
		stayPointCount() {
			return Array.isArray(this.recordingSession.stayPoints) ? this.recordingSession.stayPoints.length : 0
		},
		filteredTrackPointCount() {
			return Array.isArray(this.recordingSession.filteredTrackPoints) ? this.recordingSession.filteredTrackPoints.length : 0
		},
		traveloguePreviewImage() {
			const visualAssets = this.region.visualAssets || {}
			return visualAssets.sharePosterBackground || visualAssets.heroLandmark || ''
		},
		hasTraveloguePreviewEvidence() {
			return hasXichengTravelogueDraftEvidence({ materials: this.materials, routeRecommendation: this.recognizedRoute || this.importedRoute, recordingSession: this.recordingSession, studyTaskEvidence: this.studyTaskEvidence, routeCheckins: this.routeCheckins, visionAgentServiceTasks: this.visionAgentServiceTasks, visionAgentMemorySessionPackage: this.visionAgentMemorySessionPackage })
		},
		summaryCards() {
			const recognizedPoiName = this.materials.find(material => material && material.poiName)
			const routeTitle = this.recognizedRoute && this.recognizedRoute.title
				? this.recognizedRoute.title
				: this.importedRoute && this.importedRoute.title ? this.importedRoute.title : '待选择路线'
			return [
				{ key: 'poi', label: '识别地点', value: recognizedPoiName && recognizedPoiName.poiName ? recognizedPoiName.poiName : '待补充' },
				{ key: 'route', label: '路线', value: routeTitle },
				{ key: 'photo', label: '照片', value: `${this.photoMaterialCount} 张` },
				{ key: 'qa', label: '问答', value: `${this.aiGuideMaterialCount} 条` },
				{ key: 'memory', label: '连续识境', value: `${this.visionAgentMemorySessionPackage?.sceneCount || 0} 次` },
				{ key: 'agent', label: 'AI识境任务', value: `${this.visionAgentServiceTaskCount} 项` }
			]
		},
		traveloguePreviewTitle() {
			if (!this.hasTraveloguePreviewEvidence) return XICHENG_TRAVELOGUE_PREVIEW_EMPTY_TITLE
			const reviewedPoi = this.materials.find(material => material && hasReviewableMaterialEvidence(material) && material.poiName)
			if (reviewedPoi && reviewedPoi.poiName) return `在${reviewedPoi.poiName}遇见西城`
			const routeTitle = this.recognizedRoute && this.recognizedRoute.title ? String(this.recognizedRoute.title).trim() : ''
			return routeTitle || this.editableTravelogueTitle
		},
		traveloguePreviewText() {
			if (!this.hasTraveloguePreviewEvidence) return XICHENG_TRAVELOGUE_PREVIEW_EMPTY_TEXT
			const currentDraft = String(this.draft || '').trim()
			if (currentDraft && !currentDraft.startsWith('请先通过识别')) return createXichengTraveloguePreviewExcerpt(currentDraft)
			const style = this.travelogueStyleOptions.find(option => option.key === this.activeTravelogueStyle)
			const styleTitle = style && style.title ? style.title : '城市漫步'
			const stopNames = this.recognizedRouteStops.map(stop => typeof stop === 'string' ? stop : stop.poiName).filter(Boolean).slice(0, 4)
			const reviewedPoiNames = Array.from(new Set(
				this.materials
					.filter(material => hasReviewableMaterialEvidence(material))
					.map(material => material && material.poiName ? material.poiName : '')
					.filter(Boolean)
				)).slice(0, 4)
			const previewNames = stopNames.length > 0 ? stopNames : reviewedPoiNames
			const taskTitles = this.visibleVisionAgentServiceTasks
				.map(task => task && task.actionTitle ? task.actionTitle : '')
				.filter(Boolean)
				.slice(0, 3)
			const trackSummary = this.routePointCount > 0 || this.stayPointCount > 0
				? `已记录 ${this.routePointCount} 个轨迹点、${this.stayPointCount} 个停留点，`
				: ''
			const taskSummary = taskTitles.length > 0
				? `AI识境已收集 ${taskTitles.join('、')} 等后续动作，`
				: ''
			const autoPackage = this.visionAgentAutoTraveloguePackage
			const autoPackageSummary = autoPackage
				? `${autoPackage.storyCueText}${autoPackage.mapCueText}`
				: ''
			const memorySessionSummary = this.visionAgentMemorySessionPackage
				? `${this.visionAgentMemorySessionPackage.continuityCueText || ''}${this.visionAgentMemorySessionPackage.poiTrailText || ''}`
				: ''
			return previewNames.length > 0
				? `${trackSummary}${taskSummary}${autoPackageSummary}${memorySessionSummary}这次慢行经过 ${previewNames.join('、')}。我想把这些真实地点、照片和停留片段，整理成「${styleTitle}」里的长文记忆。`
				: `${trackSummary}${taskSummary}${autoPackageSummary}${memorySessionSummary}已收集照片、问答、路线动作或现场备注，可按「${styleTitle}」整理成西城游记草稿。`
		},
		activeTravelogueStyleTitle() {
			const style = this.travelogueStyleOptions.find(option => option.key === this.activeTravelogueStyle)
			return style && style.title ? style.title : '城市漫步杂志'
		},
		longTravelogueSubtitle() {
			return this.hasTraveloguePreviewEvidence
				? '白塔寺之后，像是一场温柔又诚实的慢行'
				: '先记录真实素材，再生成值得分享的长文'
		},
		longTravelogueIntro() {
			if (!this.hasTraveloguePreviewEvidence) {
				return '这篇游记会从你真实记录的地点、照片、路线和备注开始。先不急着写满，只把今天真的看见、真的停下来的片段留下来。'
			}
			return this.traveloguePreviewText
		},
		longTravelogueChapters() {
			const stops = this.editorRouteItems.length > 0 ? this.editorRouteItems : [
				{ time: '09:30', title: '白塔寺' },
				{ time: '11:00', title: '历代帝王庙' },
				{ time: '15:40', title: '什刹海' }
			]
			const chapterCopies = [
				'从街口走过去的时候，我先看到的是树影，再看到白塔。这里很适合把脚步放慢，把第一张照片留给一处真正愿意停下来的地方。',
				'路过老街和院墙时，时间好像被压低了一点。地图上的路线只是线，真正让人记住的，是每个转角出现的生活气。',
				'傍晚的西城不需要太多解释。水面、风、路灯和慢慢亮起来的小店，会让一天变成可以反复打开看的记忆。'
			]
			return stops.slice(0, 3).map((stop, index) => ({
				title: index === 0 ? `第一站 ${stop.title}` : index === 1 ? `第二站 ${stop.title}` : `第三站 ${stop.title}`,
				text: chapterCopies[index] || this.traveloguePreviewText,
				quote: index === 0 ? '我记住的不是打卡完成，而是第一次愿意停下来的瞬间。' : index === 1 ? '真实的路，总有一点人情味的拐弯。' : '这一天值得被写成长文，而不只是一张照片。',
				image: this.traveloguePreviewImage
			}))
		},
		traveloguePreviewTags() {
			if (!this.hasTraveloguePreviewEvidence) return [...XICHENG_TRAVELOGUE_PREVIEW_EMPTY_TAGS]
			const routeStopTags = this.recognizedRouteStops.map(stop => typeof stop === 'string' ? stop : stop.poiName).filter(Boolean).slice(0, 3)
			return routeStopTags.length > 0 ? routeStopTags : ['白塔寺', '什刹海', '胡同漫步']
		},
		editorPhotoCards() {
			return this.traveloguePreviewTags.slice(0, 3).map((tag, index) => ({
				key: `editor-photo-${index}-${tag}`,
				label: tag,
				image: this.traveloguePreviewImage
			}))
		},
		editorRouteItems() {
			const stops = this.recognizedRouteStops.length > 0
				? this.recognizedRouteStops
				: this.traveloguePreviewTags
			const routeTimes = ['09:00', '10:00', '11:30']
			return stops.slice(0, 3).map((stop, index) => ({
				time: routeTimes[index] || `${String(9 + index).padStart(2, '0')}:00`,
				title: typeof stop === 'string' ? stop : stop.poiName
			})).filter(item => item.title)
		},
		editorFeelingText() {
			return this.traveloguePreviewText
		},
		editorXiaojingSupplement() {
			if (this.workSourceCount > 0) {
				return `小京已整理 ${this.workSourceCount} 条已审核来源，可继续补充历史背景和路线讲解。`
			}
			return '小京会基于已审核来源补充讲解；暂无已审核来源时，不会编造地点故事。'
		},
		qualityReport() {
			const acceptedTrackPoints = Array.isArray(this.recordingSession.trackPoints) ? this.recordingSession.trackPoints : []
			const filteredTrackPoints = Array.isArray(this.recordingSession.filteredTrackPoints) ? this.recordingSession.filteredTrackPoints : []
			const lowAccuracyPointCount = acceptedTrackPoints.filter(point => point && point.locationQuality === 'low_accuracy').length
			const abnormalJumpPointCount = filteredTrackPoints.filter(point => point && point.filteredReason === 'abnormal_jump').length
			const totalQualityPointCount = acceptedTrackPoints.length + filteredTrackPoints.length
			return {
				acceptedTrackPointCount: this.routePointCount,
				filteredTrackPointCount: this.filteredTrackPointCount,
				lowAccuracyPointCount,
				abnormalJumpPointCount,
				usableRate: totalQualityPointCount > 0 ? Math.round((acceptedTrackPoints.length / totalQualityPointCount) * 100) : 100
			}
		},
		photoMaterialCount() {
			return this.materials.filter(material => material && material.type === 'photo').length
		},
		remarkMaterialCount() {
			return this.materials.filter(material => material && material.type === 'remark').length
		},
		officialPoiNames() {
			return this.officialPois.map(poi => poi.poiName)
		},
		recordingStatusText() {
			const status = this.recordingSession.status
			if (status === 'recording') return '记录中'
			if (status === 'paused') return '已暂停'
			if (status === 'finished') return '已结束'
			return '待开始'
		},
		recognizedRoute() {
			const routeMaterial = this.materials.find(material => material && hasReviewableMaterialEvidence(material) && material.routeRecommendation)
			if (routeMaterial) return routeMaterial.routeRecommendation
			return this.importedRoute || null
		},
		recognizedRouteStops() {
			if (!this.recognizedRoute) return []
			if (Array.isArray(this.recognizedRoute.stops) && this.recognizedRoute.stops.length > 0) {
				return this.recognizedRoute.stops
			}
			const title = String(this.recognizedRoute.title || '')
			return title
				.split(/\s*[-—－]\s*/)
				.map(name => name.trim())
				.filter(Boolean)
		}
	},
	onLoad(options = {}) {
		uni.setNavigationBarTitle({ title: '西城游记草稿' })
		this.loadJourney(options)
	},
	methods: {
		goBack() {
			uni.navigateBack({
				delta: 1,
				fail: () => uni.reLaunch({ url: '/pages/xicheng/home/home' })
			})
		},
		openTravelogueActions() {
			uni.showToast({
				title: '已在下方提供分享与审核操作',
				icon: 'none'
			})
		},
			openTravelogueSecondaryEntry(entry = {}) {
				if (!entry.url) return
				uni.navigateTo({ url: entry.url })
			},
			loadVisionAgentServiceTasks() {
				const storedTasks = uni.getStorageSync(XICHENG_REGION_CONFIG.visionAgentServiceTasksStorageKey)
				this.visionAgentServiceTasks = Array.isArray(storedTasks)
					? storedTasks.filter(task => task && typeof task === 'object').slice(0, 50)
					: []
				return this.visionAgentServiceTasks
			},
			loadVisionAgentMemorySessionPackage() {
				const storedPackage = uni.getStorageSync(XICHENG_REGION_CONFIG.visionAgentMemorySessionStorageKey)
				this.visionAgentMemorySessionPackage = storedPackage && typeof storedPackage === 'object'
					? storedPackage
					: null
				return this.visionAgentMemorySessionPackage
			},
			formatVisionAgentServiceTaskType(task = {}) {
				if (task.taskTypeLabel) return task.taskTypeLabel
				if (task.taskType === 'merchant') return '商家'
				if (task.taskType === 'route') return '路线'
				if (task.taskType === 'travelogue') return '游记'
				if (task.taskType === 'growth') return '成长'
				return '服务'
			},
			createVisionAgentServiceTaskMeta(task = {}) {
				const poiName = task.poiName || '当前场景'
				const serviceIntentLabel = task.serviceIntentLabel ? ` · ${task.serviceIntentLabel}` : ''
				const sceneDomain = task.sceneDomain ? ` · ${this.createVisionAgentSceneDomainLabel(task.sceneDomain)}` : ''
				const actionPrompt = task.actionPrompt ? ` · ${String(task.actionPrompt).slice(0, 24)}` : ''
				const statusText = task.statusText || '已收进任务包'
				return `${poiName}${serviceIntentLabel}${sceneDomain}${actionPrompt} · ${statusText}`
			},
			createVisionAgentSceneDomainLabel(sceneDomain = '') {
				const labels = {
					architecture: '建筑',
					artifact: '文物',
					menu: '菜单',
					food: '食物',
					'sign-ocr': '路牌/OCR',
					heritage: '非遗',
					plant: '植物',
					animal: '动物',
					person: '人物',
					event: '活动'
				}
				return labels[sceneDomain] || sceneDomain
			},
			async loadJourney(options = {}) {
				this.travelogueMode = normalizeTravelogueMode(options.mode)
				this.loadVisionAgentServiceTasks()
				this.loadVisionAgentMemorySessionPackage()
				const visionAgentRouteContext = parseTravelogueVisionAgentContext(options.visionAgentContext)
				this.visionAgentRouteContext = visionAgentRouteContext
				this.visionAgentRouteContextSource = visionAgentRouteContext.entry || ''
				const routeMemorySessionPackage = createVisionAgentMemorySessionPackageFromRouteContext(visionAgentRouteContext, decodeJourneyRouteValue(options.memorySessionSceneCount))
				if (routeMemorySessionPackage) {
					this.visionAgentMemorySessionPackage = routeMemorySessionPackage
				}
				const storedMaterials = uni.getStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey)
				const importedRoute = uni.getStorageSync(XICHENG_REGION_CONFIG.inspirationStorageKey)
			const storedReviewSubmissions = uni.getStorageSync(XICHENG_REGION_CONFIG.reviewStorageKey)
			const storedShareAssets = uni.getStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey)
			const storedRecordingSession = uni.getStorageSync(XICHENG_REGION_CONFIG.recordingStorageKey)
			const storedStudyTaskEvidence = uni.getStorageSync(XICHENG_REGION_CONFIG.studyTaskStorageKey)
			const storedBadgeAwards = uni.getStorageSync(XICHENG_REGION_CONFIG.badgeAwardStorageKey)
			const storedCheckins = uni.getStorageSync(XICHENG_REGION_CONFIG.checkinStorageKey)
			const storedInspirationImports = uni.getStorageSync(XICHENG_REGION_CONFIG.inspirationImportStorageKey)
			const storedRecognitionFeedbacks = uni.getStorageSync(XICHENG_REGION_CONFIG.recognitionFeedbackStorageKey)
			const materials = Array.isArray(storedMaterials) ? storedMaterials : []
			this.importedRoute = importedRoute && importedRoute.stops ? importedRoute : null
			this.reviewSubmission = Array.isArray(storedReviewSubmissions) && storedReviewSubmissions.length > 0
				? storedReviewSubmissions[0]
				: null
			this.shareArtifacts = Array.isArray(storedShareAssets) ? storedShareAssets : []
			this.studyTaskEvidence = Array.isArray(storedStudyTaskEvidence) ? storedStudyTaskEvidence : []
			this.badgeAwards = Array.isArray(storedBadgeAwards) ? storedBadgeAwards : []
			this.routeCheckins = Array.isArray(storedCheckins) ? storedCheckins : []
			this.inspirationImports = Array.isArray(storedInspirationImports) ? storedInspirationImports : []
			this.recognitionFeedbacks = Array.isArray(storedRecognitionFeedbacks) ? storedRecognitionFeedbacks : []
			this.studyTaskDrafts = this.parentChildTasks.map((_, index) => {
				const evidence = this.getStudyTaskEvidence(index)
				return evidence && evidence.answerText ? evidence.answerText : ''
			})
			this.recordingSession = storedRecordingSession && Array.isArray(storedRecordingSession.trackPoints)
				? {
					...createEmptyRecordingSession(),
					...storedRecordingSession,
					trackPoints: storedRecordingSession.trackPoints,
					stayPoints: Array.isArray(storedRecordingSession.stayPoints) ? storedRecordingSession.stayPoints : [],
					filteredTrackPoints: Array.isArray(storedRecordingSession.filteredTrackPoints) ? storedRecordingSession.filteredTrackPoints : []
				}
				: createEmptyRecordingSession()
			const routeRegionCode = decodeJourneyRouteValue(options.regionCode) || XICHENG_REGION_CONFIG.regionCode
			const routePackageCode = decodeJourneyRouteValue(options.packageCode) || XICHENG_REGION_CONFIG.packageCode
			const routeSceneCode = decodeJourneyRouteValue(options.sceneCode) || XICHENG_REGION_CONFIG.sceneCode
			const routeSourceChannel = decodeJourneyRouteValue(options.sourceChannel) || XICHENG_REGION_CONFIG.sourceChannel
			const routeSafetyStatus = normalizeXichengSafetyStatus(decodeJourneyRouteValue(options.safetyStatus))
			const unsafeRouteSafetyStatus = isXichengUnsafeSafetyStatus(routeSafetyStatus)
			const routeCode = normalizeXichengRouteCode(decodeJourneyRouteValue(options.routeCode || options.routeId))
			const routeFromCode = !unsafeRouteSafetyStatus ? resolveRouteByCode(routeCode) : null
			if (routeFromCode && !this.importedRoute) {
				this.importedRoute = {
					...routeFromCode,
					regionCode: routeRegionCode,
					packageCode: routePackageCode,
					sceneCode: routeSceneCode,
					sourceChannel: routeSourceChannel,
					routeSource: 'travelogue-route-param',
					sourceLabel: '官方路线详情',
					updatedAt: new Date().toISOString()
				}
				uni.setStorageSync(XICHENG_REGION_CONFIG.inspirationStorageKey, this.importedRoute)
			}
			if (routeFromCode && !materials.some(material => material && material.routeCode === routeFromCode.routeCode && material.type === 'official-route-poi')) {
				const routeMaterials = createOfficialRouteMaterials({
					route: routeFromCode,
					regionCode: routeRegionCode,
					packageCode: routePackageCode,
					sceneCode: routeSceneCode,
					sourceChannel: routeSourceChannel
				})
				materials.unshift(...routeMaterials)
				uni.setStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey, materials)
			}
			const routePoiName = decodeJourneyRouteValue(options.poiName)
			if (routePoiName && !unsafeRouteSafetyStatus && !materials.some(material => material && material.poiName === routePoiName)) {
				materials.unshift({
					type: 'manual-entry',
					regionCode: routeRegionCode,
					packageCode: routePackageCode,
					sceneCode: routeSceneCode,
					sourceChannel: routeSourceChannel,
					poiCode: decodeJourneyRouteValue(options.poiCode),
					poiName: routePoiName,
					sourceLabel: '入口记录',
					sources: [],
					safetyStatus: routeSafetyStatus,
					reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
					publishStatus: 'private',
					capturedAt: new Date().toISOString()
				})
				uni.setStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey, materials)
			}
				this.materials = materials
				const cachedDraft = uni.getStorageSync(XICHENG_REGION_CONFIG.journeyStorageKey)
				this.draft = cachedDraft && cachedDraft.draft
					? sanitizeXichengTravelogueDraftText(cachedDraft.draft)
					: sanitizeXichengTravelogueDraftText(createXichengTravelogueDraft({
						materials: this.materials,
						routeRecommendation: this.recognizedRoute,
						recordingSession: this.recordingSession,
						studyTaskEvidence: this.studyTaskEvidence,
						routeCheckins: this.routeCheckins,
						visionAgentServiceTasks: this.visionAgentServiceTasks,
						visionAgentMemorySessionPackage: this.visionAgentMemorySessionPackage
					}))
				this.reviewText = cachedDraft && cachedDraft.reviewText ? cachedDraft.reviewText : this.reviewText
			this.posterStatus = cachedDraft && cachedDraft.posterStatus ? cachedDraft.posterStatus : this.posterStatus
			this.pdfStatus = cachedDraft && cachedDraft.pdfStatus ? cachedDraft.pdfStatus : this.pdfStatus
			this.editableTravelogueTitle = cachedDraft && cachedDraft.editableTravelogueTitle
				? cachedDraft.editableTravelogueTitle
				: this.editableTravelogueTitle
			this.selectedTravelogueTemplate = cachedDraft && cachedDraft.selectedTravelogueTemplate ? cachedDraft.selectedTravelogueTemplate : this.selectedTravelogueTemplate
			this.activeTravelogueStyle = cachedDraft && cachedDraft.activeTravelogueStyle ? cachedDraft.activeTravelogueStyle : this.selectedTravelogueTemplate
			this.travelogueTemplateSettings = cachedDraft && cachedDraft.travelogueTemplateSettings ? { ...this.travelogueTemplateSettings, ...cachedDraft.travelogueTemplateSettings } : this.travelogueTemplateSettings
			this.saveDraft({ silent: true })
			if (this.shouldAutoStartRecording(options)) {
				await this.startRecordingSession()
			}
		},
		shouldAutoStartRecording(options = {}) {
			const routeSafetyStatus = normalizeXichengSafetyStatus(decodeJourneyRouteValue(options.safetyStatus))
			return options.mode === 'record'
				&& options.autoStart === '1'
				&& this.recordingSession.status !== 'recording'
				&& !isXichengUnsafeSafetyStatus(routeSafetyStatus)
		},
		openPrivacyPolicy() {
			uni.navigateTo({
				url: '/pagesInfo/aboutus/policy'
			})
		},
		openUserProtocol() {
			uni.navigateTo({
				url: '/pagesInfo/aboutus/protocol'
			})
		},
		openAiContentNotice() {
			uni.showModal({
				title: 'AI 内容说明',
				content: '小京回答和游记草稿由 AI 辅助生成，仅作旅行参考；西城讲解优先使用已审核来源，无已审核来源时不编造。',
				showCancel: false,
				confirmText: '知道了'
			})
		},
		openXichengFeedbackEntry() {
			uni.showModal({
				title: '反馈入口',
				content: '识别结果页可提交识别准确/有误反馈；本页可清除西城本地数据；其它试运营问题请联系现场运营人员处理。',
				showCancel: false,
				confirmText: '知道了'
			})
		},
		clearXichengLocalData() {
			uni.showModal({
				title: '清除西城本地数据',
				content: '将清除本机保存的西城识别结果、路线记录、游记草稿、审核包、分享产物和反馈记录。',
				confirmText: '清除',
				confirmColor: '#B42318',
				success: (res) => {
					if (!res.confirm) return
					XICHENG_REGION_CONFIG.privacyClearStorageKeys.forEach(key => uni.removeStorageSync(key))
					this.clearXichengAiGuideCaches()
					this.resetXichengLocalState()
					uni.showToast({
						title: '西城本地数据已清除',
						icon: 'none'
					})
				}
			})
		},
		clearXichengAiGuideCaches() {
			const storageInfo = uni.getStorageInfoSync ? uni.getStorageInfoSync() : {}
			const keys = Array.isArray(storageInfo.keys) ? storageInfo.keys : []
			keys
				.filter(key => XICHENG_REGION_CONFIG.privacyClearStorageKeyPrefixes.some(prefix => String(key).startsWith(prefix)))
				.forEach(key => uni.removeStorageSync(key))
		},
		resetXichengLocalState() {
			this.materials = []
			this.importedRoute = null
			this.draft = ''
			this.reviewText = XICHENG_REGION_CONFIG.reviewStatus.draft
			this.posterStatus = '未生成'
			this.pdfStatus = '未生成'
			this.reviewSubmission = null
			this.shareArtifacts = []
			this.remarkInput = ''
			this.studyTaskEvidence = []
			this.studyTaskDrafts = this.parentChildTasks.map(() => '')
			this.badgeAwards = []
			this.routeCheckins = []
			this.inspirationImports = []
			this.recognitionFeedbacks = []
			this.recordingSession = createEmptyRecordingSession()
		},
		persistJourneyMaterials() {
			uni.setStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey, this.materials.slice(0, 50))
		},
		createPublicLocationLabel(material = {}) {
			if (material.poiName && !['现场照片', '现场备注'].includes(material.poiName)) {
				return `${material.poiName}附近`
			}
			if (material.sourceLabel) {
				return `${material.sourceLabel}附近`
			}
			return '西城街区一带'
		},
		hideMaterialLocation(index) {
			const material = this.materials[index]
			if (!material) return
			const publicLocationLabel = this.createPublicLocationLabel(material)
			this.materials = this.materials.map((item, materialIndex) => materialIndex === index
				? {
					...item,
					locationHidden: true,
					publicLocationLabel,
					captureLocation: null,
					exifLocation: null,
					nearestTrackPoint: null
				}
				: item)
			this.persistJourneyMaterials()
			this.refreshDraftFromEvidence()
			uni.showToast({
				title: '地点已隐藏',
				icon: 'none'
			})
		},
		deleteJourneyMaterial(index) {
			if (index < 0 || index >= this.materials.length) return
			this.materials = this.materials.filter((_, materialIndex) => materialIndex !== index)
			this.persistJourneyMaterials()
			this.refreshDraftFromEvidence()
			uni.showToast({
				title: '素材已删除',
				icon: 'none'
			})
		},
		deleteInspirationImport(index) {
			const removedImport = this.inspirationImports[index]
			if (!removedImport) return
			this.inspirationImports = this.inspirationImports.filter((_, importIndex) => importIndex !== index)
			uni.setStorageSync(XICHENG_REGION_CONFIG.inspirationImportStorageKey, this.inspirationImports)
			if (removedImport && this.importedRoute && removedImport.routeTitle === this.importedRoute.title) {
				this.importedRoute = null
				uni.removeStorageSync(XICHENG_REGION_CONFIG.inspirationStorageKey)
				this.materials = this.materials.filter(material => !['inspiration-poi', 'inspiration-image'].includes(material.type))
				this.persistJourneyMaterials()
			}
			this.refreshDraftFromEvidence()
			uni.showToast({
				title: '灵感导入已删除',
				icon: 'none'
			})
		},
		correctMaterialPoi(index, event) {
			const material = this.materials[index]
			const selectedIndex = Number(event && event.detail ? event.detail.value : -1)
			const poi = this.officialPois[selectedIndex]
			if (!material || !poi) return
			const previousPoiCode = material.poiCode || ''
			const previousPoiName = material.poiName || ''
			const correctedAt = new Date().toISOString()
			this.materials = this.materials.map((item, materialIndex) => materialIndex === index
				? {
					...item,
					poiCode: poi.poiCode,
					poiName: poi.poiName,
					poiCorrected: true,
					poiCorrection: {
						correctionSource: 'user-picker',
						previousPoiCode,
						previousPoiName,
						poiCode: poi.poiCode,
						poiName: poi.poiName,
						correctedAt
					},
					publicLocationLabel: item.locationHidden ? `${poi.poiName}附近` : item.publicLocationLabel
				}
				: item)
			this.persistJourneyMaterials()
			this.refreshDraftFromEvidence()
			uni.showToast({
				title: 'POI 已修正',
				icon: 'none'
			})
			},
			refreshDraftFromEvidence() {
				this.draft = createXichengTravelogueDraft({
					materials: this.materials,
					parentChildTasks: this.parentChildTasks,
					routeRecommendation: this.recognizedRoute,
					recordingSession: this.recordingSession,
					studyTaskEvidence: this.studyTaskEvidence,
					routeCheckins: this.routeCheckins,
					visionAgentServiceTasks: this.visionAgentServiceTasks,
					visionAgentMemorySessionPackage: this.visionAgentMemorySessionPackage
				})
				this.saveDraft({ silent: true })
			},
		applyTravelogueTemplate(template = {}) {
			const templateKey = template.key || 'citywalk'
			this.selectedTravelogueTemplate = this.activeTravelogueStyle = templateKey
			this.travelogueTemplateSettings = { ...this.travelogueTemplateSettings, layout: template.meta || this.travelogueTemplateSettings.layout, focus: template.title || this.travelogueTemplateSettings.focus }
			this.saveDraft({ silent: true })
			uni.showToast({ title: `${template.title || '模板'}已选中`, icon: 'none' })
		},
		updateTravelogueTemplateSettings(item = {}) {
			if (!item.key) return
			this.travelogueTemplateSettings = { ...this.travelogueTemplateSettings, [item.key]: item.value || this.travelogueTemplateSettings[item.key] || '' }
			this.saveDraft({ silent: true })
			uni.showToast({ title: '模板设置已保存', icon: 'none' })
		},
		scrollToDraftEditor() {
			uni.pageScrollTo({
				selector: '#travelogue-draft-editor',
				duration: 240
			})
		},
		publishTravelogue() {
			this.submitReview()
		},
		getStudyTaskEvidence(index) {
			return this.studyTaskEvidence.find(evidence => evidence && evidence.taskId === `study-task-${index + 1}`) || null
		},
		getStudyTaskStatus(index) {
			return this.getStudyTaskEvidence(index) ? '已完成' : '进行中'
		},
		formatStudyTaskEvidence(evidence = {}) {
			if (evidence.evidenceType === 'photo') return evidence.answerText || '照片证据'
			return evidence.answerText || '观察记录'
		},
		createStudyTaskEvidence(index, evidenceType, payload = {}) {
			const completedAt = new Date().toISOString()
			return {
				taskId: `study-task-${index + 1}`,
				taskIndex: index,
				taskText: this.parentChildTasks[index],
				evidenceType,
				answerText: payload.answerText || '',
				photoPath: payload.photoPath || '',
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				completedAt,
				reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
				publishStatus: 'private'
			}
		},
		persistStudyTaskEvidence(evidence) {
			const existingEvidence = this.studyTaskEvidence.filter(item => item && item.taskId !== evidence.taskId)
			this.studyTaskEvidence = [
				evidence,
				...existingEvidence
			].slice(0, this.parentChildTasks.length)
			uni.setStorageSync(XICHENG_REGION_CONFIG.studyTaskStorageKey, this.studyTaskEvidence)
			this.refreshDraftFromEvidence()
		},
		deleteStudyTaskEvidence(index) {
			const taskId = `study-task-${index + 1}`
			const existingEvidence = this.getStudyTaskEvidence(index)
			if (!existingEvidence) return
			this.studyTaskEvidence = this.studyTaskEvidence.filter(evidence => evidence && evidence.taskId !== taskId)
			uni.setStorageSync(XICHENG_REGION_CONFIG.studyTaskStorageKey, this.studyTaskEvidence)
			this.refreshDraftFromEvidence()
			uni.showToast({
				title: '观察记录已删除',
				icon: 'none'
			})
		},
		updateStudyTaskDraft(index, value) {
			this.studyTaskDrafts = this.studyTaskDrafts.map((draft, draftIndex) => {
				return draftIndex === index ? String(value || '') : draft
			})
		},
		submitStudyTaskEvidence(index) {
			const answerText = String(this.studyTaskDrafts[index] || '').trim()
			if (!answerText) {
				uni.showToast({
					title: '请先填写观察',
					icon: 'none'
				})
				return
			}
			const evidence = this.createStudyTaskEvidence(index, 'answer', {
				answerText: this.studyTaskDrafts[index].trim()
			})
			this.persistStudyTaskEvidence(evidence)
			uni.showToast({
				title: '观察任务已完成',
				icon: 'none'
			})
		},
		showPhotoEvidenceCaptureFailed(title = '照片选择失败') {
			uni.showToast({
				title,
				icon: 'none'
			})
		},
		confirmTraveloguePhotoPurpose(actionLabel = '补充照片') {
			return new Promise(resolve => {
				uni.showModal({
					title: `${actionLabel}用途说明`,
					content: '照片仅用于本次西城游记素材、街区观察记录和本地审核包，不默认公开；如你已授权定位，可记录拍摄时定位和定位精度用于足迹归属；不会用于模型评估或运营纠错，除非你另行授权。',
					confirmText: '继续',
					cancelText: '取消',
					success: (res) => {
						resolve(Boolean(res.confirm))
					},
					fail: () => {
						resolve(false)
					}
				})
			})
		},
		async addStudyTaskPhoto(index) {
			const confirmed = await this.confirmTraveloguePhotoPurpose('观察照片')
			if (!confirmed) return
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['camera', 'album'],
				success: (res) => {
					const filePath = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : ''
					if (!filePath) {
						this.showPhotoEvidenceCaptureFailed('观察照片未保存，请重新选择')
						return
					}
					const evidence = this.createStudyTaskEvidence(index, 'photo', {
						answerText: String(this.studyTaskDrafts[index] || '').trim(),
						photoPath: filePath
					})
					this.persistStudyTaskEvidence(evidence)
					uni.showToast({
						title: '观察照片已保存',
						icon: 'none'
					})
				},
				fail: (err) => {
					if (isXunjingUserCancelled(err)) {
						return
					}
					this.showPhotoEvidenceCaptureFailed()
				}
			})
		},
		claimRouteBadge() {
			if (!this.badgeUnlocked || this.activeBadgeAward) return
			const award = this.createRouteBadgeAward()
			this.persistRouteBadgeAward(award)
			uni.showToast({
				title: '路线进度已更新',
				icon: 'none'
			})
		},
		createRouteBadgeAward() {
			const awardedAt = new Date().toISOString()
			return {
				awardId: `badge-${Date.now()}`,
				badgeCode: this.routeBadgeCode,
				badgeName: this.badgeName,
				routePassportTitle: this.routePassport.title,
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				passportProgress: this.passportProgress,
				routePassportTargetCount: this.routePassportTargetCount,
				routePassportCheckinCount: this.routePassportCheckinCount,
				stampImage: XICHENG_REGION_CONFIG.visualAssets.passportStamp,
				checkinCount: this.checkinCount,
				studyTaskEvidenceCount: this.studyTaskEvidenceCount,
				awardedAt,
				reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
				publishStatus: 'private'
			}
		},
		persistRouteBadgeAward(award) {
			const existingAwards = this.badgeAwards.filter(item => item && item.badgeCode !== award.badgeCode)
			this.badgeAwards = [
				award,
				...existingAwards
			].slice(0, 20)
			uni.setStorageSync(XICHENG_REGION_CONFIG.badgeAwardStorageKey, this.badgeAwards)
			this.saveDraft({ silent: true })
		},
		createCheckinEventLabel(checkin = {}) {
			const checkinEventLabel = `${checkin.checkinType || '打卡事件'} · ${checkin.routeTitle || '西城 Citywalk'} · ${this.formatArtifactTime(checkin.checkedInAt)}`
			return checkinEventLabel
		},
		deleteRouteCheckin(index) {
			this.routeCheckins = this.routeCheckins.filter((_, checkinIndex) => checkinIndex !== index)
			uni.setStorageSync(XICHENG_REGION_CONFIG.checkinStorageKey, this.routeCheckins)
			if (!this.badgeUnlocked) {
				this.badgeAwards = this.badgeAwards.filter(award => award && award.badgeCode !== this.routeBadgeCode)
				uni.setStorageSync(XICHENG_REGION_CONFIG.badgeAwardStorageKey, this.badgeAwards)
			}
			this.saveDraft({ silent: true })
			uni.showToast({
				title: '路线打卡已删除',
				icon: 'none'
			})
		},
		formatCandidateConfirmationAudit(audit = {}) {
			const candidateCount = Number(audit.candidateCount || 0)
			const poiName = audit.selectedCandidatePoiName || '已确认 POI'
			return `${poiName} · ${candidateCount} 个候选`
		},
		addRemarkMaterial() {
			if (!this.remarkInput.trim()) {
				uni.showToast({
					title: '请输入现场备注',
					icon: 'none'
				})
				return
			}
			const material = {
				type: 'remark',
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				poiCode: '',
				poiName: '现场备注',
				sourceLabel: '用户备注',
				remarkText: this.remarkInput.trim(),
				sources: [],
				reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
				publishStatus: 'private',
				capturedAt: new Date().toISOString()
			}
			this.materials = [material, ...this.materials].slice(0, 50)
			this.remarkInput = ''
			this.persistJourneyMaterials()
			this.refreshDraftFromEvidence()
			uni.showToast({
				title: '备注已加入素材盒',
				icon: 'none'
			})
		},
		normalizeCaptureLocationForMaterial(location = null) {
			if (!location) return null
			return {
				latitude: location.latitude !== undefined ? Number(location.latitude) : null,
				longitude: location.longitude !== undefined ? Number(location.longitude) : null,
				coordType: location.coordType || 'gcj02',
				accuracyMeters: location.accuracyMeters !== undefined ? Number(location.accuracyMeters) : 0
			}
		},
		findNearestTrackPoint(capturedAt = '') {
			const trackPoints = Array.isArray(this.recordingSession.trackPoints)
				? this.recordingSession.trackPoints.filter(point => point && point.poiAttributionEligible !== false)
				: []
			const capturedTime = new Date(capturedAt).getTime()
			if (!Number.isFinite(capturedTime) || trackPoints.length === 0) return null
			const nearest = trackPoints.reduce((best, point) => {
				const pointTime = point.recordedAt || point.capturedAt || ''
				const diffMs = Math.abs(new Date(pointTime).getTime() - capturedTime)
				if (!Number.isFinite(diffMs)) return best
				if (!best || diffMs < best.diffMs) {
					return { point, diffMs }
				}
				return best
			}, null)
			if (!nearest) return null
			return {
				trackSessionId: this.recordingSession.sessionId,
				pointType: nearest.point.pointType || 'manual',
				capturedAt: nearest.point.capturedAt || nearest.point.recordedAt || '',
				latitude: nearest.point.latitude,
				longitude: nearest.point.longitude,
				coordType: nearest.point.coordType || 'gcj02',
				accuracyMeters: nearest.point.accuracyMeters || 0,
				locationQuality: nearest.point.locationQuality || 'usable',
				poiAttributionEligible: nearest.point.poiAttributionEligible !== false,
				diffMs: nearest.diffMs
			}
		},
		normalizeTrackPointForMaterial(point = null) {
			if (!point) return null
			return {
				trackSessionId: this.recordingSession.sessionId,
				pointType: point.pointType || 'manual',
				capturedAt: point.capturedAt || point.recordedAt || '',
				latitude: point.latitude,
				longitude: point.longitude,
				coordType: point.coordType || 'gcj02',
				accuracyMeters: point.accuracyMeters || 0,
				locationQuality: point.locationQuality || 'usable',
				poiAttributionEligible: point.poiAttributionEligible !== false,
				diffMs: 0
			}
		},
		async capturePhotoTrackPointIfRecording() {
			if (this.recordingSession.status !== 'recording') return null
			const point = await this.captureTrackPoint('photo')
			return this.normalizeTrackPointForMaterial(point)
		},
		async addPhotoMaterial() {
			const confirmed = await this.confirmTraveloguePhotoPurpose('补充照片')
			if (!confirmed) return
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['camera', 'album'],
				success: async (res) => {
					const photoFileMeta = resolvePhotoEvidenceFileMeta(res)
					const filePath = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : ''
					if (!filePath) {
						if (!photoFileMeta.filePath) {
							this.showPhotoEvidenceCaptureFailed('照片未保存，请重新选择')
							return
						}
					}
					const resolvedFilePath = photoFileMeta.filePath || filePath
					const takenAt = new Date().toISOString()
					const captureLocation = await requestCurrentLocationForTrigger()
					const photoTrackPoint = await this.capturePhotoTrackPointIfRecording()
					const material = {
						photoId: `photo-${Date.now()}`,
						type: 'photo',
						regionCode: XICHENG_REGION_CONFIG.regionCode,
						packageCode: XICHENG_REGION_CONFIG.packageCode,
						sceneCode: XICHENG_REGION_CONFIG.sceneCode,
						sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
						poiCode: '',
						poiName: '现场照片',
						sourceLabel: '补充照片',
						imagePath: filePath || resolvedFilePath,
						localFileId: photoFileMeta.localFileId || resolvedFilePath,
						objectKey: '',
						imageSizeBytes: photoFileMeta.imageSizeBytes,
						imageMimeType: photoFileMeta.imageMimeType,
						takenAt,
						exifLocation: photoFileMeta.exifLocation,
						captureLocation: this.normalizeCaptureLocationForMaterial(captureLocation),
						nearestTrackPoint: photoTrackPoint || this.findNearestTrackPoint(takenAt),
						sources: [],
						reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
						publishStatus: 'private',
						capturedAt: takenAt
					}
					this.materials = [material, ...this.materials].slice(0, 50)
					this.persistJourneyMaterials()
					this.refreshDraftFromEvidence()
					uni.showToast({
						title: '照片已加入素材盒',
						icon: 'none'
					})
				},
				fail: (err) => {
					if (isXunjingUserCancelled(err)) {
						return
					}
					this.showPhotoEvidenceCaptureFailed()
				}
			})
		},
		hasReviewableJourneyEvidence() {
			return hasXichengReviewableWorkEvidence({
				materials: this.materials,
				recordingSession: this.recordingSession,
				studyTaskEvidence: this.studyTaskEvidence,
				routeCheckins: this.routeCheckins
			})
		},
		showWorkEvidenceRequiredToast(actionLabel = '生成作品') {
			uni.showToast({
				title: `请先补充真实素材再${actionLabel}`,
				icon: 'none'
			})
		},
		saveDraft({ silent = false } = {}) {
			const payload = {
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				companionName: XICHENG_REGION_CONFIG.companionName,
				draft: this.draft,
				materials: this.materials,
				photoMaterialCount: this.photoMaterialCount,
				remarkMaterialCount: this.remarkMaterialCount,
				activeTravelogueStyle: this.activeTravelogueStyle,
				selectedTravelogueTemplate: this.selectedTravelogueTemplate,
				travelogueTemplateSettings: this.travelogueTemplateSettings,
				editableTravelogueTitle: this.editableTravelogueTitle,
				recognizedRoute: this.recognizedRoute,
				reviewSubmission: this.reviewSubmission,
				shareArtifacts: this.shareArtifacts,
				recordingSession: this.recordingSession,
				routeCheckins: this.routeCheckins,
				checkinCount: this.checkinCount,
					inspirationImports: this.inspirationImports,
					inspirationImportCount: this.inspirationImportCount,
					recognitionFeedbacks: this.recognitionFeedbacks,
					recognitionFeedbackCount: this.recognitionFeedbackCount,
					visionAgentServiceTasks: this.visionAgentServiceTasks,
					visionAgentServiceTaskCount: this.visionAgentServiceTaskCount,
					visionAgentAutoTraveloguePackage: this.visionAgentAutoTraveloguePackage,
					visionAgentMemorySessionPackage: this.visionAgentMemorySessionPackage,
					visionAgentRealSystemBoundary: this.visionAgentRealSystemBoundary,
					candidateConfirmationAudits: this.candidateConfirmationAudits,
					candidateConfirmationCount: this.candidateConfirmationCount,
				aiGuideMaterialCount: this.aiGuideMaterialCount,
				studyTaskEvidence: this.studyTaskEvidence,
				badgeAwards: this.badgeAwards,
				activeBadgeAward: this.activeBadgeAward,
				safetyStatusSummary: this.safetyStatusSummary,
				safetyBlockedCount: this.safetyBlockedCount,
				safetyUnavailableCount: this.safetyUnavailableCount,
				reviewReadinessSummary: this.reviewReadinessSummary,
				sourceReadinessStatus: this.reviewReadinessSummary.sourceReadinessStatus,
				workSourceCount: this.workSourceCount,
				reviewedSourceCount: this.reviewReadinessSummary.reviewedSourceCount,
				reviewBlockers: this.reviewReadinessSummary.reviewBlockers,
				reviewBlockerCount: this.reviewReadinessSummary.reviewBlockers.length,
				reviewText: this.reviewText,
				posterStatus: this.posterStatus,
				pdfStatus: this.pdfStatus,
				updatedAt: new Date().toISOString()
			}
			uni.setStorageSync(XICHENG_REGION_CONFIG.journeyStorageKey, payload)
			uni.setStorageSync(XICHENG_REGION_CONFIG.localOpsReportKey, this.opsReport)
			if (!silent) {
				uni.showToast({
					title: '游记草稿已保存',
					icon: 'none'
				})
			}
		},
		generatePoster() {
			if (!this.hasReviewableJourneyEvidence()) {
				this.showWorkEvidenceRequiredToast('社交分享素材')
				return
			}
			this.posterStatus = '社交分享素材已生成'
			const posterAsset = this.createShareArtifact('poster')
			this.persistShareArtifact(posterAsset)
			this.saveDraft({ silent: true })
			uni.showToast({
				title: '社交分享素材已生成',
				icon: 'none'
			})
			this.openSharePage()
		},
		exportMemorialPdf() {
			if (!this.hasReviewableJourneyEvidence()) {
				this.showWorkEvidenceRequiredToast('PDF纪念册')
				return
			}
			this.pdfStatus = 'PDF纪念册已生成'
			const pdfAsset = this.createShareArtifact('pdf')
			this.persistShareArtifact(pdfAsset)
			this.saveDraft({ silent: true })
			uni.showToast({
				title: 'PDF纪念册已生成',
				icon: 'none'
			})
			this.openPdfPrintPage()
		},
		submitReview() {
			if (!this.hasReviewableJourneyEvidence()) {
				this.showWorkEvidenceRequiredToast('发布前检查')
				return
			}
			this.reviewText = XICHENG_REGION_CONFIG.reviewStatus.pending
			const reviewPayload = this.submitReviewPackage()
			const existingSubmissions = uni.getStorageSync(XICHENG_REGION_CONFIG.reviewStorageKey)
			uni.setStorageSync(XICHENG_REGION_CONFIG.reviewStorageKey, [
				reviewPayload,
				...(Array.isArray(existingSubmissions) ? existingSubmissions : [])
			].slice(0, 20))
			this.reviewSubmission = reviewPayload
			this.saveDraft({ silent: true })
			uni.showToast({
				title: '发布前检查已生成',
				icon: 'none'
			})
			this.openWorksPage()
		},
		openSharePage(channel = 'xinghe') {
			const publishChannel = encodeRouteValue(channel || 'xinghe')
			uni.navigateTo({ url: `/pages/xicheng/share/share?channel=${publishChannel}` })
		},
		openTravelogueReaderPage() {
			uni.navigateTo({ url: '/pages/xicheng/travelogue-reader/travelogue-reader' })
		},
		openPdfPrintPage() {
			uni.navigateTo({ url: '/pages/xicheng/pdf-print/pdf-print' })
		},
		openWorksPage() {
			uni.navigateTo({ url: '/pages/xicheng/works/works' })
		},
		openOpsReportPage() {
			uni.navigateTo({ url: '/pages/xicheng/ops-report/ops-report' })
		},
		withdrawReviewSubmission() {
			const submittedAt = this.reviewSubmission && this.reviewSubmission.submittedAt ? this.reviewSubmission.submittedAt : ''
			const existingSubmissions = uni.getStorageSync(XICHENG_REGION_CONFIG.reviewStorageKey)
			const submissions = Array.isArray(existingSubmissions) ? existingSubmissions : []
			const remainingSubmissions = submittedAt
				? submissions.filter(submission => submission && submission.submittedAt !== submittedAt)
				: submissions.slice(1)
			uni.setStorageSync(XICHENG_REGION_CONFIG.reviewStorageKey, remainingSubmissions)
			this.reviewSubmission = remainingSubmissions[0] || null
			this.reviewText = this.reviewSubmission ? this.reviewSubmission.reviewStatus : XICHENG_REGION_CONFIG.reviewStatus.draft
			this.saveDraft({ silent: true })
			uni.showToast({
				title: '审核提交已撤回',
				icon: 'none'
			})
		},
		submitReviewPackage() {
			const submittedAt = new Date().toISOString()
			const reviewableShareArtifacts = this.getReviewableShareArtifacts()
			return {
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				companionName: XICHENG_REGION_CONFIG.companionName,
				draft: this.draft,
				materials: this.materials,
				recognizedRoute: this.recognizedRoute,
				recordingSession: this.recordingSession,
				routePointCount: this.routePointCount,
				stayPointCount: this.stayPointCount,
				qualityReport: this.qualityReport,
				filteredTrackPoints: this.recordingSession.filteredTrackPoints,
				filteredTrackPointCount: this.filteredTrackPointCount,
				photoMaterialCount: this.photoMaterialCount,
				remarkMaterialCount: this.remarkMaterialCount,
				routeCheckins: this.routeCheckins,
				checkinCount: this.checkinCount,
				inspirationImports: this.inspirationImports,
				inspirationImportCount: this.inspirationImportCount,
				recognitionFeedbacks: this.recognitionFeedbacks,
				recognitionFeedbackCount: this.recognitionFeedbackCount,
				candidateConfirmationAudits: this.candidateConfirmationAudits,
				candidateConfirmationCount: this.candidateConfirmationCount,
				visionAgentAutoTraveloguePackage: this.visionAgentAutoTraveloguePackage,
				visionAgentMemorySessionPackage: this.visionAgentMemorySessionPackage,
				visionAgentRealSystemBoundary: this.visionAgentRealSystemBoundary,
				aiGuideMaterialCount: this.aiGuideMaterialCount,
				studyTaskEvidence: this.studyTaskEvidence,
				studyTaskEvidenceCount: this.studyTaskEvidenceCount,
				badgeAwards: this.badgeAwards,
				activeBadgeAward: this.activeBadgeAward,
				badgeAwardCount: this.badgeAwardCount,
				safetyStatusSummary: this.safetyStatusSummary,
				safetyBlockedCount: this.safetyBlockedCount,
				safetyUnavailableCount: this.safetyUnavailableCount,
				reviewReadinessSummary: this.reviewReadinessSummary,
				sourceReadinessStatus: this.reviewReadinessSummary.sourceReadinessStatus,
				workSourceCount: this.workSourceCount,
				reviewedSourceCount: this.reviewReadinessSummary.reviewedSourceCount,
				reviewBlockers: this.reviewReadinessSummary.reviewBlockers,
				reviewBlockerCount: this.reviewReadinessSummary.reviewBlockers.length,
				reviewEvidencePolicy: {
					rawEvidenceUse: 'local-ops-review-only',
					publicPreviewUse: 'share-review-preview-only',
					exactLocationPolicy: 'raw-review-only',
					photoPathPolicy: 'raw-review-only',
					publishStatus: 'private',
					auditRequired: true
				},
				publicPreview: this.createReviewPublicPreview(),
				reviewStatus: this.reviewText,
				submittedAt,
				materialCount: this.materialCount,
				sourceCount: this.sourceCount,
				workSourceCount: this.workSourceCount,
				workCount: this.draft ? 1 : 0,
				posterStatus: this.posterStatus,
				pdfStatus: this.pdfStatus,
				shareArtifacts: reviewableShareArtifacts,
				shareArtifactCount: reviewableShareArtifacts.length,
				assetTypes: Array.from(new Set(reviewableShareArtifacts.map(item => item.assetType)))
			}
		},
		createSafetyStatusSummary() {
			const statusItems = [
				...this.materials,
				...this.routeCheckins,
				...this.recognitionFeedbacks
			].filter(item => item && item.safetyStatus)
			const statusCounts = statusItems.reduce((counts, item) => {
				const status = normalizeXichengSafetyStatus(item.safetyStatus)
				if (!status) return counts
				counts[status] = (counts[status] || 0) + 1
				return counts
			}, {})
			return {
				totalCount: statusItems.length,
				blockedCount: statusCounts.BLOCKED || 0,
				unavailableCount: statusCounts.UNAVAILABLE || 0,
				statusCounts
			}
		},
		sanitizeRouteRecommendationForPublicShare(routeRecommendation = null) {
			if (!routeRecommendation) return null
			const publicStops = Array.isArray(routeRecommendation.stops)
				? routeRecommendation.stops
					.map(stop => ({
						poiCode: stop.poiCode || '',
						poiName: stop.poiName || stop.name || ''
					}))
					.filter(stop => stop.poiCode || stop.poiName)
					.slice(0, 8)
				: []
			return {
				title: routeRecommendation.title || '',
				summary: routeRecommendation.summary || routeRecommendation.theme || '',
				durationText: routeRecommendation.durationText || routeRecommendation.duration || '',
				theme: routeRecommendation.theme || '',
				stops: publicStops
			}
		},
		sanitizeMaterialForPublicShare(material = {}) {
			return {
				type: material.type || '',
				regionCode: material.regionCode || XICHENG_REGION_CONFIG.regionCode,
				packageCode: material.packageCode || XICHENG_REGION_CONFIG.packageCode,
				poiCode: material.poiCode || '',
				poiName: material.poiName || '',
				sourceLabel: material.sourceLabel || '',
				remarkExcerpt: String(material.remarkText || '').slice(0, 80),
				hasPhoto: Boolean(material.imagePath),
				routeRecommendation: this.sanitizeRouteRecommendationForPublicShare(material.routeRecommendation),
				sourceCount: getReviewableMaterialSources(material).length,
				safetyStatus: normalizeXichengSafetyStatus(material.safetyStatus),
				publicLocationLabel: material.publicLocationLabel || this.createPublicLocationLabel(material),
				locationHidden: true,
				capturedAt: material.capturedAt || material.takenAt || ''
			}
		},
		sanitizeStudyTaskEvidenceForPublicShare(evidence = {}) {
			const safetyStatus = normalizeXichengSafetyStatus(evidence.safetyStatus)
			if (isXichengUnsafeSafetyStatus(safetyStatus)) return null
			return {
				taskId: evidence.taskId || '',
				taskText: evidence.taskText || '',
				evidenceType: evidence.evidenceType || '',
				answerExcerpt: String(evidence.answerText || '').slice(0, 80),
				hasPhoto: Boolean(evidence.photoPath),
				safetyStatus,
				completedAt: evidence.completedAt || ''
			}
		},
		sanitizeRouteCheckinForPublicShare(checkin = {}) {
			return {
				checkinId: checkin.checkinId || '',
				checkinType: checkin.checkinType || '',
				checkinLabel: checkin.checkinLabel || '',
				routeTitle: checkin.routeTitle || '',
				poiCode: checkin.poiCode || '',
				poiName: checkin.poiName || '',
				sourceLabel: checkin.sourceLabel || '',
				safetyStatus: normalizeXichengSafetyStatus(checkin.safetyStatus),
				checkedInAt: checkin.checkedInAt || ''
			}
		},
		hasReviewableRouteCheckinEvidence(checkin = {}) {
			return hasReviewableRouteCheckinEvidence(checkin)
		},
		createPublicCandidateConfirmationSummary() {
			const confirmedPoiNames = this.candidateConfirmationAudits
				.map(audit => audit && audit.selectedCandidatePoiName ? audit.selectedCandidatePoiName : '')
				.filter(Boolean)
			return {
				candidateConfirmationCount: this.candidateConfirmationCount,
				confirmedPoiNames: Array.from(new Set(confirmedPoiNames)).slice(0, 5)
			}
		},
		createPublicRecordingSummary() {
			return {
				routeCode: this.recordingSession.routeCode || '',
				routeTitle: this.recordingSession.routeTitle || '',
				sessionStatus: this.recordingSession.status || 'idle',
				startedAt: this.recordingSession.startedAt || '',
				finishedAt: this.recordingSession.finishedAt || '',
				routePointCount: this.routePointCount,
				stayPointCount: this.stayPointCount,
				filteredTrackPointCount: this.filteredTrackPointCount,
				qualityReport: this.qualityReport,
				shareTrackDefault: 'private',
				exactTrackHidden: true
			}
		},
		createReviewPublicPreview() {
			const publicRouteCheckins = this.routeCheckins
				.filter(checkin => this.hasReviewableRouteCheckinEvidence(checkin))
				.map(checkin => this.sanitizeRouteCheckinForPublicShare(checkin))
			const publicMaterials = this.materials
				.filter(material => hasReviewableMaterialEvidence(material))
				.map(material => this.sanitizeMaterialForPublicShare(material))
			const publicStudyTaskEvidence = this.completedStudyTaskEvidence
				.map(evidence => this.sanitizeStudyTaskEvidenceForPublicShare(evidence))
				.filter(Boolean)
			return {
				publicMaterials,
				publicRouteCheckins,
				publicStudyTaskEvidence,
				visionAgentAutoTraveloguePackage: this.visionAgentAutoTraveloguePackage,
				publicCandidateConfirmationSummary: this.createPublicCandidateConfirmationSummary(),
				publicRecordingSummary: this.createPublicRecordingSummary(),
				materialCount: publicMaterials.length,
				checkinCount: publicRouteCheckins.length,
				studyTaskEvidenceCount: publicStudyTaskEvidence.length,
				privacy: {
					shareLocationPrecision: 'poi_area',
					shareTrackDefault: 'private',
					exactCoordinatesHidden: true
				}
			}
		},
		createShareArtifact(assetType) {
			const createdAt = new Date().toISOString()
			const routeTitle = this.recognizedRoute && this.recognizedRoute.title
				? this.recognizedRoute.title
				: this.importedRoute && this.importedRoute.title ? this.importedRoute.title : '西城 Citywalk'
			const assetLabel = assetType === 'pdf' ? 'PDF纪念册' : '社交分享素材'
			const assetTitle = assetType === 'pdf' ? '西城 PDF纪念册' : '西城社交分享素材'
			const publicRouteCheckins = this.routeCheckins
				.filter(checkin => this.hasReviewableRouteCheckinEvidence(checkin))
				.map(checkin => this.sanitizeRouteCheckinForPublicShare(checkin))
			const publicMaterials = this.materials
				.filter(material => hasReviewableMaterialEvidence(material))
				.map(material => this.sanitizeMaterialForPublicShare(material))
			const publicPhotoMaterialCount = publicMaterials.filter(material => material && material.type === 'photo').length
			const publicRemarkMaterialCount = publicMaterials.filter(material => material && material.type === 'remark').length
			const publicAiGuideMaterialCount = publicMaterials.filter(material => material && material.type === 'ai-guide').length
			return {
				assetId: `${assetType}-${Date.now()}`,
				assetType,
				assetLabel,
				title: assetTitle,
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				companionName: XICHENG_REGION_CONFIG.companionName,
				routeTitle,
				backgroundImage: XICHENG_REGION_CONFIG.visualAssets.sharePosterBackground,
				stampImage: XICHENG_REGION_CONFIG.visualAssets.passportStamp,
				visualAssets: {
					backgroundImage: XICHENG_REGION_CONFIG.visualAssets.sharePosterBackground,
					passportStamp: XICHENG_REGION_CONFIG.visualAssets.passportStamp,
					heroLandmark: XICHENG_REGION_CONFIG.visualAssets.heroLandmark
				},
				publicMaterials,
				publicStudyTaskEvidence: this.completedStudyTaskEvidence.map(evidence => this.sanitizeStudyTaskEvidenceForPublicShare(evidence)).filter(Boolean),
				visionAgentAutoTraveloguePackage: this.visionAgentAutoTraveloguePackage,
				publicRouteCheckins,
				publicCandidateConfirmationSummary: this.createPublicCandidateConfirmationSummary(),
				publicRecordingSummary: this.createPublicRecordingSummary(),
				checkinCount: publicRouteCheckins.length,
				materialCount: publicMaterials.length,
				photoMaterialCount: publicPhotoMaterialCount,
				remarkMaterialCount: publicRemarkMaterialCount,
				aiGuideMaterialCount: publicAiGuideMaterialCount,
				qualityReport: this.qualityReport,
				filteredTrackPointCount: this.filteredTrackPointCount,
				privacy: {
					shareLocationPrecision: 'poi_area',
					shareTrackDefault: 'private',
					exactCoordinatesHidden: true
				},
				templateCode: assetType === 'pdf' ? 'xicheng-memorial-pdf-v1' : 'xicheng-share-poster-v1',
				templateLabel: assetType === 'pdf' ? 'PDF固定模板：封面、路线地图、照片时间线、游记正文、知识卡片、路线复盘' : '社交分享固定模板',
				templateSections: assetType === 'pdf' ? this.createMemorialPdfTemplate(routeTitle, createdAt) : this.createPosterTemplate(routeTitle),
				draftExcerpt: String(this.draft || '').slice(0, 80),
				stayPointCount: this.stayPointCount,
				studyTaskEvidenceCount: this.studyTaskEvidenceCount,
				activeBadgeAward: this.activeBadgeAward,
				badgeAwardCount: this.badgeAwardCount,
				recognitionFeedbackCount: this.recognitionFeedbackCount,
				candidateConfirmationCount: this.candidateConfirmationCount,
				safetyStatusSummary: this.safetyStatusSummary,
				safetyBlockedCount: this.safetyBlockedCount,
				safetyUnavailableCount: this.safetyUnavailableCount,
				reviewReadinessSummary: this.reviewReadinessSummary,
				sourceReadinessStatus: this.reviewReadinessSummary.sourceReadinessStatus,
				workSourceCount: this.workSourceCount,
				reviewedSourceCount: this.reviewReadinessSummary.reviewedSourceCount,
				reviewBlockers: this.reviewReadinessSummary.reviewBlockers,
				reviewBlockerCount: this.reviewReadinessSummary.reviewBlockers.length,
				sourceCount: this.sourceCount,
				badgeName: this.badgeName,
				passportProgress: this.passportProgress,
				auditRequired: true,
				reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
				publishStatus: 'private',
				visibilityLabel: '待审核 · 未公开',
				posterStatus: this.posterStatus,
				pdfStatus: this.pdfStatus,
				createdAt
			}
		},
		getReviewableShareArtifacts() {
			return this.shareArtifacts
				.map(artifact => this.sanitizeShareArtifactForReview(artifact))
				.filter(Boolean)
		},
		sanitizeShareArtifactForReview(artifact = {}) {
			if (!artifact || !['poster', 'pdf', 'study'].includes(artifact.assetType)) return null
			if (artifact.auditRequired !== true
				|| artifact.publishStatus !== 'private'
				|| artifact.reviewStatus !== XICHENG_REGION_CONFIG.reviewStatus.pending) {
				return null
			}
			const createdAt = artifact.createdAt || new Date().toISOString()
			const routeTitle = artifact.routeTitle || (this.recognizedRoute && this.recognizedRoute.title) || '西城 Citywalk'
			const assetLabel = artifact.assetLabel || (artifact.assetType === 'pdf' ? 'PDF 纪念册' : artifact.assetType === 'study' ? '街区观察记录' : '社交分享素材')
			const publicPreview = this.createReviewPublicPreview()
			return {
				assetId: artifact.assetId || artifact.artifactId || '',
				artifactId: artifact.artifactId || artifact.assetId || '',
				assetType: artifact.assetType,
				assetLabel,
				title: artifact.title || assetLabel,
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				companionName: XICHENG_REGION_CONFIG.companionName,
				routeTitle,
				backgroundImage: XICHENG_REGION_CONFIG.visualAssets.sharePosterBackground,
				stampImage: XICHENG_REGION_CONFIG.visualAssets.passportStamp,
				publicPreview,
				publicMaterials: publicPreview.publicMaterials,
				publicStudyTaskEvidence: publicPreview.publicStudyTaskEvidence,
				publicRouteCheckins: publicPreview.publicRouteCheckins,
				publicCandidateConfirmationSummary: publicPreview.publicCandidateConfirmationSummary,
				publicRecordingSummary: publicPreview.publicRecordingSummary,
				checkinCount: publicPreview.checkinCount,
				materialCount: publicPreview.materialCount,
				studyTaskEvidenceCount: publicPreview.studyTaskEvidenceCount,
				privacy: publicPreview.privacy,
				templateCode: artifact.assetType === 'pdf' ? 'xicheng-memorial-pdf-v1' : artifact.assetType === 'study' ? 'xicheng-study-report-v1' : 'xicheng-share-poster-v1',
				templateLabel: artifact.assetType === 'pdf' ? 'PDF固定模板：封面、路线地图、照片时间线、游记正文、知识卡片、路线复盘' : artifact.assetType === 'study' ? '街区观察记录固定模板' : '社交分享固定模板',
				templateSections: artifact.assetType === 'pdf' ? this.createMemorialPdfTemplate(routeTitle, createdAt) : artifact.assetType === 'study' ? [] : this.createPosterTemplate(routeTitle),
				draftExcerpt: String(this.draft || artifact.draftExcerpt || '').slice(0, 80),
				reviewEvidencePolicy: {
					rawEvidenceUse: 'local-ops-review-only',
					publicPreviewUse: 'share-review-preview-only',
					exactLocationPolicy: 'raw-review-only',
					photoPathPolicy: 'raw-review-only',
					publishStatus: 'private',
					auditRequired: true
				},
				safetyStatusSummary: this.safetyStatusSummary,
				safetyBlockedCount: this.safetyBlockedCount,
				safetyUnavailableCount: this.safetyUnavailableCount,
				reviewReadinessSummary: this.reviewReadinessSummary,
				sourceReadinessStatus: this.reviewReadinessSummary.sourceReadinessStatus,
				workSourceCount: this.workSourceCount,
				reviewedSourceCount: this.reviewReadinessSummary.reviewedSourceCount,
				reviewBlockers: this.reviewReadinessSummary.reviewBlockers,
				reviewBlockerCount: this.reviewReadinessSummary.reviewBlockers.length,
				sourceCount: this.sourceCount,
				badgeName: this.badgeName,
				passportProgress: this.passportProgress,
				auditRequired: true,
				reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
				publishStatus: 'private',
				visibilityLabel: '待审核 · 未公开',
				createdAt
			}
		},
		createPosterTemplate(routeTitle) {
			return [
				{
					sectionKey: 'share-card',
					title: '社交分享素材',
					routeTitle,
					backgroundImage: XICHENG_REGION_CONFIG.visualAssets.sharePosterBackground,
					stampImage: XICHENG_REGION_CONFIG.visualAssets.passportStamp,
					badgeName: this.badgeName,
					passportProgress: this.passportProgress,
					draftExcerpt: String(this.draft || '').slice(0, 80)
				}
			]
		},
		getDisplaySourceTitle(source = {}) {
			return getXichengDisplaySourceTitle(source)
		},
		getDisplaySourceDescription(source = {}) {
			return getXichengDisplaySourceDescription(source, 96)
		},
		createMemorialPdfSourceCards() {
			const seenCards = new Set()
			const sourceCards = []
			this.materials
				.filter(material => hasReviewableMaterialEvidence(material))
				.forEach((material = {}, materialIndex) => {
					const materialSources = getReviewableMaterialSources(material)
					materialSources.forEach((source = {}, sourceIndex) => {
						const title = this.getDisplaySourceTitle(source)
						const excerpt = this.getDisplaySourceDescription(source)
						if (!title && !excerpt) return
						const cardKey = `${material.poiCode || material.poiName || materialIndex}:${title}:${excerpt}`
						if (seenCards.has(cardKey)) return
						seenCards.add(cardKey)
						sourceCards.push({
							sourceCardId: `source-card-material-${materialIndex}-${sourceIndex}`,
							title: title || '审核来源',
							excerpt,
							url: source.sourceUrl || source.url || '',
							poiCode: material.poiCode || '',
							poiName: material.poiName || ''
						})
					})
				})
			this.routeCheckins
				.filter(checkin => this.hasReviewableRouteCheckinEvidence(checkin))
				.forEach((checkin = {}, checkinIndex) => {
					const checkinSources = getReviewableRouteCheckinSources(checkin)
					checkinSources.forEach((source = {}, sourceIndex) => {
						const title = this.getDisplaySourceTitle(source)
						const excerpt = this.getDisplaySourceDescription(source)
						if (!title && !excerpt) return
						const cardKey = `${checkin.poiCode || checkin.poiName || checkinIndex}:${title}:${excerpt}`
						if (seenCards.has(cardKey)) return
						seenCards.add(cardKey)
						sourceCards.push({
							sourceCardId: `source-card-checkin-${checkinIndex}-${sourceIndex}`,
							title: title || '审核来源',
							excerpt,
							url: source.sourceUrl || source.url || '',
							poiCode: checkin.poiCode || '',
							poiName: checkin.poiName || ''
						})
					})
				})
			return sourceCards.slice(0, 8)
		},
		createMemorialPdfTemplate(routeTitle, createdAt) {
			return [
				{
					sectionKey: 'cover',
					title: '封面',
					routeTitle,
					createdAt,
					subtitle: '我的西城 Citywalk 纪念册',
					backgroundImage: XICHENG_REGION_CONFIG.visualAssets.sharePosterBackground
				},
				{
					sectionKey: 'route-map',
					title: '路线地图',
					routeTitle,
					routePointCount: this.routePointCount,
					stayPointCount: this.stayPointCount
				},
				{
					sectionKey: 'photo-timeline',
					title: '照片时间线',
					photoMaterialCount: this.photoMaterialCount,
					materialCount: this.materialCount
				},
				{
					sectionKey: 'travelogue-body',
					title: '游记正文',
					draftExcerpt: String(this.draft || '').slice(0, 160)
				},
				{
					sectionKey: 'knowledge-cards',
					title: '知识卡片',
					sourceCount: this.sourceCount,
					sourceCards: this.createMemorialPdfSourceCards(),
					poiNames: this.materials
						.map(material => material && material.poiName ? material.poiName : '')
						.filter(Boolean)
						.slice(0, 6)
				},
				{
					sectionKey: 'route-review',
					title: '路线复盘',
					badgeName: this.badgeName,
					passportProgress: this.passportProgress,
					stampImage: XICHENG_REGION_CONFIG.visualAssets.passportStamp
				}
			]
		},
		createHotPoiRanking() {
			const ranking = this.materials.reduce((ranking, material) => {
				const poiName = material && material.poiName ? material.poiName : ''
				if (!poiName || ['现场照片', '现场备注'].includes(poiName)) return ranking
				if (!ranking[poiName]) {
					ranking[poiName] = {
						poiCode: material.poiCode || '',
						poiName,
						visitCount: 0
					}
				}
				ranking[poiName].visitCount += 1
				return ranking
			}, {})
			return Object.values(ranking)
				.sort((left, right) => right.visitCount - left.visitCount)
				.slice(0, 5)
		},
		createOptimizationSuggestions() {
			const suggestions = []
			if (this.misTriggerCount > 0) {
				suggestions.push('复核低置信识别素材，补充别名和触发关键词')
			}
			if (this.workSourceCount === 0) {
				suggestions.push('补充已审核讲解来源，提升小京回答可信度')
			}
			if (this.passportProgress < 100) {
				suggestions.push('优化路线记录任务，引导完成更多打卡点')
			}
			return suggestions.length > 0 ? suggestions : ['继续观察路线完成、分享转化和热门 POI 分布']
		},
		persistShareArtifact(artifact) {
			const existingArtifacts = uni.getStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey)
			this.shareArtifacts = [
				artifact,
				...(Array.isArray(existingArtifacts) ? existingArtifacts : [])
			].slice(0, 20)
			uni.setStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey, this.shareArtifacts)
		},
		deleteShareArtifact(index) {
			const removedArtifact = this.shareArtifacts[index]
			this.shareArtifacts = this.shareArtifacts.filter((_, artifactIndex) => artifactIndex !== index)
			if (removedArtifact && removedArtifact.assetType === 'poster' && !this.shareArtifacts.some(artifact => artifact.assetType === 'poster')) {
				this.posterStatus = '未生成'
			}
			if (removedArtifact && removedArtifact.assetType === 'pdf' && !this.shareArtifacts.some(artifact => artifact.assetType === 'pdf')) {
				this.pdfStatus = '未生成'
			}
			uni.setStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey, this.shareArtifacts)
			this.saveDraft({ silent: true })
			uni.showToast({
				title: '分享产物已删除',
				icon: 'none'
			})
		},
		saveRecordingSession() {
			uni.setStorageSync(XICHENG_REGION_CONFIG.recordingStorageKey, this.recordingSession)
			this.saveDraft({ silent: true })
		},
		async startRecordingSession() {
			const startedAt = new Date().toISOString()
			const activeRoute = this.recognizedRoute || {}
			this.recordingSession = {
				...createEmptyRecordingSession(),
				sessionId: `recording-${Date.now()}`,
				status: 'recording',
				startedAt,
				routeCode: activeRoute.routeCode || '',
				routeTitle: activeRoute.title || '',
				trackPoints: [],
				stayPoints: []
			}
			this.saveRecordingSession()
			await this.captureTrackPoint('start')
			uni.showToast({
				title: '已开始记录',
				icon: 'none'
			})
		},
		pauseRecordingSession() {
			if (this.recordingSession.status !== 'recording') return
			this.recordingSession = {
				...this.recordingSession,
				status: 'paused',
				pausedAt: new Date().toISOString()
			}
			this.saveRecordingSession()
			uni.showToast({
				title: '记录已暂停',
				icon: 'none'
			})
		},
		async resumeRecordingSession() {
			if (this.recordingSession.status !== 'paused') return
			this.recordingSession = {
				...this.recordingSession,
				status: 'recording',
				resumedAt: new Date().toISOString()
			}
			this.saveRecordingSession()
			await this.captureTrackPoint('resume')
			uni.showToast({
				title: '记录已继续',
				icon: 'none'
			})
		},
		async finishRecordingSession() {
			if (this.recordingSession.status === 'idle' || this.recordingSession.status === 'finished') return
			await this.captureTrackPoint('finish')
			this.recordingSession = {
				...this.recordingSession,
				status: 'finished',
				finishedAt: new Date().toISOString()
			}
			this.saveRecordingSession()
			uni.showToast({
				title: '记录已结束',
				icon: 'none'
			})
		},
		deleteRecordingSession() {
			if (this.recordingSession.status === 'idle' && this.routePointCount === 0 && this.stayPointCount === 0) return
			uni.showModal({
				title: '删除记录',
				content: '将清除本次轨迹点和停留点，但不会删除素材盒和已保存草稿。',
				confirmText: '删除',
				confirmColor: '#B42318',
				success: (res) => {
					if (!res.confirm) return
					uni.removeStorageSync(XICHENG_REGION_CONFIG.recordingStorageKey)
					this.recordingSession = createEmptyRecordingSession()
					this.refreshDraftFromEvidence()
					uni.showToast({
						title: '记录已删除',
						icon: 'none'
					})
				}
			})
		},
		getLastAcceptedTrackPoint() {
			const trackPoints = Array.isArray(this.recordingSession.trackPoints) ? this.recordingSession.trackPoints : []
			return trackPoints.length > 0 ? trackPoints[trackPoints.length - 1] : null
		},
		createTrackPointQuality(point = {}, previousPoint = null) {
			const accuracyMeters = Number(point.accuracyMeters || 0)
			if (normalizeTrackNumber(point.latitude) === null || normalizeTrackNumber(point.longitude) === null) {
				return {
					locationQuality: 'invalid_location',
					poiAttributionEligible: false,
					filteredReason: 'invalid_location',
					distanceFromPreviousMeters: null,
					secondsFromPrevious: null
				}
			}
			const distanceFromPreviousMeters = previousPoint
				? calculateTrackPointDistanceMeters(previousPoint, point)
				: null
			const secondsFromPrevious = previousPoint && (previousPoint.recordedAt || previousPoint.capturedAt)
				? Math.round(Math.abs(new Date(point.recordedAt || point.capturedAt).getTime() - new Date(previousPoint.recordedAt || previousPoint.capturedAt).getTime()) / 1000)
				: null
			if (
				secondsFromPrevious !== null
				&& distanceFromPreviousMeters !== null
				&& secondsFromPrevious <= XICHENG_TRACK_POINT_QUALITY.abnormalJumpWindowSeconds
				&& distanceFromPreviousMeters >= XICHENG_TRACK_POINT_QUALITY.abnormalJumpDistanceMeters
			) {
				return {
					locationQuality: 'abnormal_jump',
					poiAttributionEligible: false,
					filteredReason: 'abnormal_jump',
					distanceFromPreviousMeters,
					secondsFromPrevious
				}
			}
			if (accuracyMeters > XICHENG_TRACK_POINT_QUALITY.maxPoiAttributionAccuracyMeters) {
				return {
					locationQuality: 'low_accuracy',
					poiAttributionEligible: false,
					filteredReason: '',
					distanceFromPreviousMeters,
					secondsFromPrevious
				}
			}
			return {
				locationQuality: 'usable',
				poiAttributionEligible: true,
				filteredReason: '',
				distanceFromPreviousMeters,
				secondsFromPrevious
			}
		},
		persistFilteredTrackPoint(point) {
			this.recordingSession = {
				...this.recordingSession,
				filteredTrackPoints: [
					...(Array.isArray(this.recordingSession.filteredTrackPoints) ? this.recordingSession.filteredTrackPoints : []),
					point
				].slice(-50)
			}
			this.saveRecordingSession()
		},
		async captureTrackPoint(pointType = 'manual') {
			if (this.recordingSession.status === 'idle' || this.recordingSession.status === 'finished') return
			const location = await requestCurrentLocationForTrigger()
			const capturedAt = new Date().toISOString()
			const point = {
				pointType,
				capturedAt,
				recordedAt: capturedAt,
				appState: 'foreground',
				syncStatus: 'local_pending',
				latitude: location && location.latitude !== undefined ? Number(location.latitude) : null,
				longitude: location && location.longitude !== undefined ? Number(location.longitude) : null,
				coordType: location && location.coordType ? location.coordType : 'gcj02',
				accuracyMeters: location && location.accuracyMeters !== undefined ? Number(location.accuracyMeters) : 0
			}
			const quality = this.createTrackPointQuality(point, this.getLastAcceptedTrackPoint())
			if (quality.filteredReason === 'abnormal_jump') {
				this.persistFilteredTrackPoint({
					...point,
					...quality
				})
				return null
			}
			if (quality.filteredReason === 'invalid_location') {
				this.persistFilteredTrackPoint({
					...point,
					...quality
				})
				return null
			}
			Object.assign(point, quality)
			this.recordingSession = {
				...this.recordingSession,
				trackPoints: [
					...(Array.isArray(this.recordingSession.trackPoints) ? this.recordingSession.trackPoints : []),
					point
				]
			}
			this.saveRecordingSession()
			return point
		},
		async markStayPoint() {
			if (this.recordingSession.status !== 'recording') return
			const location = await requestCurrentLocationForTrigger()
			const capturedAt = new Date().toISOString()
			const stayPoint = {
				pointType: 'stay',
				capturedAt,
				recordedAt: capturedAt,
				appState: 'foreground',
				syncStatus: 'local_pending',
				latitude: location && location.latitude !== undefined ? Number(location.latitude) : null,
				longitude: location && location.longitude !== undefined ? Number(location.longitude) : null,
				coordType: location && location.coordType ? location.coordType : 'gcj02',
				accuracyMeters: location && location.accuracyMeters !== undefined ? Number(location.accuracyMeters) : 0
			}
			const quality = this.createTrackPointQuality(stayPoint, this.getLastAcceptedTrackPoint())
			if (quality.filteredReason === 'abnormal_jump' || quality.filteredReason === 'invalid_location') {
				this.persistFilteredTrackPoint({
					...stayPoint,
					...quality
				})
				uni.showToast({
					title: '定位漂移较大，未标记停留点',
					icon: 'none'
				})
				return
			}
			this.recordingSession = {
				...this.recordingSession,
				stayPoints: [
					...(Array.isArray(this.recordingSession.stayPoints) ? this.recordingSession.stayPoints : []),
					{
						...stayPoint,
						...quality
					}
				]
			}
			this.saveRecordingSession()
			this.refreshDraftFromEvidence()
			uni.showToast({
				title: '停留点已标记',
				icon: 'none'
			})
		},
		formatArtifactTime(createdAt) {
			return String(createdAt || '').slice(0, 10)
		}
	}
}
</script>
<style scoped src="./travelogue.css"></style>
