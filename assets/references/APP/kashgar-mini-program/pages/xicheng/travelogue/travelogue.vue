<template>
	<view class="xicheng-travelogue">
		<view class="hero">
			<text class="eyebrow">{{ region.cityName }} P0</text>
			<text class="title">西城 Citywalk 记录</text>
			<text class="subtitle">把识别、路线护照、亲子研学任务和素材时间线整理成可编辑游记草稿。</text>
		</view>

		<view class="stats-grid">
			<view class="stat-card">
				<text class="stat-value">{{ materialCount }}</text>
				<text class="stat-label">旅行素材盒</text>
			</view>
			<view class="stat-card">
				<text class="stat-value">{{ passportProgress }}%</text>
				<text class="stat-label">路线护照</text>
			</view>
			<view class="stat-card">
				<text class="stat-value">{{ completedTaskCount }}/{{ parentChildTasks.length }}</text>
				<text class="stat-label">亲子研学任务</text>
			</view>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">记录会话</text>
				<text class="section-badge">{{ recordingStatusText }}</text>
			</view>
			<text class="section-desc">主动开始后采集前台位置点，用于游记足迹、路线复盘和停留点摘要。</text>
			<view class="report-grid">
				<view>
					<text class="report-value">{{ routePointCount }}</text>
					<text class="report-label">轨迹点</text>
				</view>
				<view>
					<text class="report-value">{{ stayPointCount }}</text>
					<text class="report-label">停留点</text>
				</view>
				<view>
					<text class="report-value">{{ filteredTrackPointCount }}</text>
					<text class="report-label">异常点</text>
				</view>
				<view>
					<text class="report-value">{{ recordingSession.startedAt ? formatArtifactTime(recordingSession.startedAt) : '--' }}</text>
					<text class="report-label">开始日期</text>
				</view>
			</view>
			<view class="recording-actions">
				<button class="primary-button" :disabled="recordingSession.status === 'recording' || recordingSession.status === 'paused'" @click="startRecordingSession">开始记录</button>
				<button class="ghost-button" :disabled="recordingSession.status !== 'paused'" @click="resumeRecordingSession">继续</button>
				<button class="ghost-button" :disabled="recordingSession.status !== 'recording'" @click="captureTrackPoint('manual')">补记位置</button>
				<button class="ghost-button" :disabled="recordingSession.status !== 'recording'" @click="markStayPoint">标记停留</button>
				<button class="ghost-button" :disabled="recordingSession.status !== 'recording'" @click="pauseRecordingSession">暂停</button>
				<button class="ghost-button" :disabled="recordingSession.status === 'idle' || recordingSession.status === 'finished'" @click="finishRecordingSession">结束</button>
				<button class="ghost-button danger-button" :disabled="recordingSession.status === 'idle' && routePointCount === 0 && stayPointCount === 0" @click="deleteRecordingSession">删除记录</button>
			</view>
		</view>

		<view v-if="importedRoute" class="section-card">
			<view class="section-head">
				<text class="section-title">灵感导入路线</text>
				<text class="section-badge">{{ importedRoute.durationText || '待出发' }}</text>
			</view>
			<text class="route-title">{{ importedRoute.title }}</text>
			<text class="section-desc">{{ importedRoute.summary }}</text>
			<view class="route-steps">
				<text
					v-for="(stop, index) in importedRoute.stops"
					:key="stop.poiCode"
					class="route-stop"
				>
					{{ index + 1 }}. {{ stop.poiName }}
				</text>
			</view>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">灵感导入记录</text>
				<text class="section-badge">{{ inspirationImportCount }} 条</text>
			</view>
			<view v-if="inspirationImports.length > 0">
				<view
					v-for="(record, index) in inspirationImports.slice(0, 3)"
					:key="record.importId"
					class="material-row"
				>
					<text class="material-title">{{ record.routeTitle || '西城灵感路线' }}</text>
					<text class="material-meta">{{ record.rawTextExcerpt || '已保存导入摘要' }}</text>
					<text class="material-meta">{{ record.sourcePolicy || '不保存第三方平台原文' }}</text>
					<view class="material-actions">
						<button class="mini-button danger-mini-button" @click="deleteInspirationImport(index)">删除导入</button>
					</view>
				</view>
			</view>
			<text v-else class="empty-copy">从“一键导入灵感”生成路线后，会沉淀为可审核的导入记录。</text>
		</view>

		<view v-if="recognizedRoute" class="section-card">
			<view class="section-head">
				<text class="section-title">识别推荐路线</text>
				<text class="section-badge">{{ recognizedRoute.durationText || recognizedRoute.duration || '已加入素材' }}</text>
			</view>
			<text class="route-title">{{ recognizedRoute.title || '西城 Citywalk 推荐路线' }}</text>
			<text v-if="recognizedRoute.summary || recognizedRoute.theme" class="section-desc">
				{{ recognizedRoute.summary || recognizedRoute.theme }}
			</text>
			<view v-if="recognizedRouteStops.length > 0" class="route-steps">
				<text
					v-for="(stop, index) in recognizedRouteStops"
					:key="`${stop.poiCode || stop.poiName || stop}-${index}`"
					class="route-stop"
				>
					{{ index + 1 }}. {{ stop.poiName || stop }}
				</text>
			</view>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">路线护照</text>
				<text class="section-badge">{{ badgeUnlocked ? badgeName : '待达成' }}</text>
			</view>
			<text class="section-desc">{{ routePassport.thresholdText }}</text>
			<view class="progress-track">
				<view class="progress-fill" :style="{ width: `${passportProgress}%` }"></view>
			</view>
			<text class="badge-copy">西城印章会随打卡素材自动累积，完成后可用于分享海报和 PDF纪念册。</text>
			<view v-if="activeBadgeAward" class="badge-award-box">
				<text class="badge-award-title">徽章达成记录</text>
				<text class="badge-award-copy">{{ activeBadgeAward.badgeName }} · {{ formatArtifactTime(activeBadgeAward.awardedAt) }}</text>
			</view>
			<button v-else class="ghost-button badge-claim-button" :disabled="!badgeUnlocked" @click="claimRouteBadge">领取徽章</button>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">路线打卡</text>
				<text class="section-badge">{{ checkinCount }} 个打卡事件</text>
			</view>
			<view v-if="routeCheckins.length > 0">
				<view
					v-for="(checkin, index) in routeCheckins.slice(0, 5)"
					:key="checkin.checkinId"
					class="checkin-row"
				>
					<text class="material-title">{{ checkin.poiName || '西城文化点' }}</text>
					<text class="material-meta">{{ createCheckinEventLabel(checkin) }}</text>
					<view class="material-actions">
						<button class="mini-button danger-mini-button" @click="deleteRouteCheckin(index)">删除打卡</button>
					</view>
				</view>
			</view>
			<text v-else class="empty-copy">从识别结果页点击“开始记录”后，会生成可审核的路线打卡事件。</text>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">旅行素材盒</text>
				<text class="section-badge">{{ materials.length > 0 ? '已记录' : '待补充' }}</text>
			</view>
			<view v-if="materials.length > 0">
				<view
					v-for="(material, index) in materials"
					:key="`${material.poiCode || material.poiName || 'material'}-${index}`"
					class="material-row"
				>
					<text class="material-title">{{ material.poiName || '西城文化点' }}</text>
					<text class="material-meta">{{ material.sourceLabel || '识别素材' }} · {{ material.capturedAt || '刚刚' }}</text>
					<text v-if="material.candidateConfirmationAudit" class="material-meta">候选确认：{{ formatCandidateConfirmationAudit(material.candidateConfirmationAudit) }}</text>
					<text v-if="material.aiAnswerExcerpt" class="material-meta">小京回答：{{ material.aiAnswerExcerpt }}</text>
					<text v-if="material.remarkText" class="material-meta">{{ material.remarkText }}</text>
					<text v-if="material.locationHidden" class="material-meta">地点已隐藏 · {{ material.publicLocationLabel || '西城街区一带' }}</text>
					<image v-if="material.imagePath" class="material-image" :src="material.imagePath" mode="aspectFill" />
					<view class="material-actions">
						<picker class="mini-picker" :range="officialPoiNames" @change="correctMaterialPoi(index, $event)">
							<text class="mini-button picker-button">修正 POI</text>
						</picker>
						<button class="mini-button" :disabled="material.locationHidden" @click="hideMaterialLocation(index)">隐藏地点</button>
						<button class="mini-button danger-mini-button" @click="deleteJourneyMaterial(index)">删除素材</button>
					</view>
				</view>
			</view>
			<text v-else class="empty-copy">从识别结果页点击“开始记录”后，POI、来源和识别置信度会进入这里。</text>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">现场备注</text>
				<text class="section-badge">照片 {{ photoMaterialCount }} · 备注 {{ remarkMaterialCount }}</text>
			</view>
			<text class="section-desc">把现场观察、同行感受和补充照片加入素材盒，游记草稿会一起引用。</text>
			<textarea
				v-model="remarkInput"
				class="remark-input"
				maxlength="240"
				placeholder="记录现场观察、亲子问答或同行感受"
			/>
			<view class="evidence-actions">
				<button class="primary-button" @click="addRemarkMaterial">添加备注</button>
				<button class="ghost-button" @click="addPhotoMaterial">补充照片</button>
			</view>
		</view>

		<view class="section-card">
			<text class="section-title">亲子研学任务</text>
			<view
				v-for="(task, index) in parentChildTasks"
				:key="`study-task-${index}`"
				class="task-row"
			>
				<text class="task-index">{{ index + 1 }}</text>
				<view class="task-main">
					<text class="task-copy">{{ task }}</text>
					<text v-if="getStudyTaskEvidence(index)" class="task-evidence">研学任务证据：{{ formatStudyTaskEvidence(getStudyTaskEvidence(index)) }}</text>
					<textarea
						v-else
						v-model="studyTaskDrafts[index]"
						class="task-input"
						maxlength="160"
						placeholder="记录孩子观察、答案或一句发现"
					/>
					<view class="task-actions">
						<button v-if="getStudyTaskEvidence(index)" class="mini-button danger-mini-button" @click="deleteStudyTaskEvidence(index)">删除证据</button>
						<button v-else class="mini-button" @click="submitStudyTaskEvidence(index)">提交观察</button>
						<button v-if="!getStudyTaskEvidence(index)" class="mini-button" @click="addStudyTaskPhoto(index)">拍照完成</button>
					</view>
				</view>
				<text class="task-status">{{ getStudyTaskStatus(index) }}</text>
			</view>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">游记草稿</text>
				<text class="section-badge">{{ reviewText }}</text>
			</view>
			<textarea
				class="draft-input"
				v-model="draft"
				maxlength="1600"
				placeholder="小京会根据素材盒生成可编辑游记草稿"
			/>
			<button class="primary-button" @click="saveDraft">保存草稿</button>
		</view>

		<view class="action-grid">
			<button class="ghost-button" @click="generatePoster">分享海报</button>
			<button class="ghost-button" @click="exportMemorialPdf">PDF纪念册</button>
			<button class="ghost-button" @click="submitReview">作品审核</button>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">隐私与本地数据</text>
				<text class="section-badge">试运营</text>
			</view>
			<text class="section-desc">西城试运营素材、轨迹、反馈、审核包和分享产物先保存在本机，可随时清除。</text>
			<view class="evidence-actions">
				<button class="ghost-button" @click="openPrivacyPolicy">隐私政策</button>
				<button class="ghost-button" @click="openUserProtocol">用户协议</button>
				<button class="ghost-button" @click="openAiContentNotice">AI 内容说明</button>
				<button class="ghost-button" @click="openXichengFeedbackEntry">反馈入口</button>
				<button class="ghost-button danger-button" @click="clearXichengLocalData">清除西城本地数据</button>
			</view>
		</view>

		<view v-if="shareArtifacts.length > 0" class="section-card">
			<view class="section-head">
				<text class="section-title">分享产物包</text>
				<text class="section-badge">{{ shareArtifacts.length }} 个产物</text>
			</view>
			<view
				v-for="(artifact, index) in shareArtifacts.slice(0, 3)"
				:key="artifact.assetId"
				class="material-row"
			>
				<text class="material-title">{{ artifact.title }}</text>
				<text class="material-meta">{{ artifact.assetLabel }} · {{ artifact.visibilityLabel || '待审核 · 未公开' }} · {{ formatArtifactTime(artifact.createdAt) }}</text>
				<text v-if="artifact.templateLabel" class="material-meta">{{ artifact.templateLabel }}</text>
				<view class="material-actions">
					<button class="mini-button danger-mini-button" @click="deleteShareArtifact(index)">删除产物</button>
				</view>
			</view>
		</view>

		<view v-if="reviewSubmission" class="section-card">
			<view class="section-head">
				<text class="section-title">审核提交记录</text>
				<text class="section-badge">{{ reviewSubmission.reviewStatus }}</text>
			</view>
			<view class="report-grid">
				<view>
					<text class="report-value">{{ reviewSubmission.materialCount }}</text>
					<text class="report-label">素材数</text>
				</view>
				<view>
					<text class="report-value">{{ reviewSubmission.sourceCount }}</text>
					<text class="report-label">来源数</text>
				</view>
				<view>
					<text class="report-value">{{ reviewSubmission.workCount }}</text>
					<text class="report-label">作品数</text>
				</view>
			</view>
			<text class="section-desc">提交时间：{{ reviewSubmission.submittedAt }}</text>
			<text class="section-desc">海报：{{ reviewSubmission.posterStatus }} · PDF：{{ reviewSubmission.pdfStatus }}</text>
			<view class="material-actions">
				<button class="mini-button danger-mini-button" @click="withdrawReviewSubmission">撤回审核</button>
			</view>
		</view>

		<view class="section-card">
			<view class="section-head">
				<text class="section-title">城市运营报告</text>
				<text class="section-badge">本地预览</text>
			</view>
			<view class="report-grid">
				<view>
					<text class="report-value">{{ opsReport.recognitionCount }}</text>
					<text class="report-label">识别量</text>
				</view>
				<view>
					<text class="report-value">{{ opsReport.sourceCount }}</text>
					<text class="report-label">审核来源</text>
				</view>
				<view>
					<text class="report-value">{{ opsReport.workCount }}</text>
					<text class="report-label">作品数</text>
				</view>
			</view>
			<text class="section-desc">分享产物：{{ opsReport.shareAssetCount }}</text>
			<text class="section-desc">路线完成：{{ opsReport.routeCompletionRate }}% · 分享数：{{ opsReport.shareCount }}</text>
			<text class="section-desc">热门 POI：{{ opsReport.hotPoiLabel }}</text>
			<text class="section-desc">误触发：{{ opsReport.misTriggerCount }} · 识别反馈：{{ opsReport.recognitionFeedbackCount }}</text>
			<text class="section-desc">候选确认：{{ opsReport.candidateConfirmationCount }} 条 · {{ opsReport.candidateConfirmedPoiLabel }}</text>
			<text class="section-desc">小京讲解：{{ opsReport.aiGuideMaterialCount }} 条</text>
			<text class="section-desc">安全拦截：{{ opsReport.safetyBlockedCount }} · 服务不可用：{{ opsReport.safetyUnavailableCount }}</text>
			<text class="section-desc">来源审核：{{ opsReport.sourceReadinessStatus }} · 待复核：{{ opsReport.reviewBlockerCount }}</text>
			<text class="section-desc">轨迹质量：{{ opsReport.qualityReport.usableRate }}% 可用 · 异常点：{{ opsReport.filteredTrackPointCount }}</text>
			<text class="section-desc">优化建议：{{ opsReport.optimizationSuggestionText }}</text>
			<text class="section-desc">试运营日报覆盖识别、路线、分享、审核来源和安全状态，可直接用于现场复盘。</text>
		</view>
	</view>
</template>

<script>
import { XICHENG_OFFICIAL_POIS, XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import { requestCurrentLocationForTrigger } from '@/request/xunjing/trigger.js'
import { normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'

export const isUnsafeSourceBlockedMaterial = (material = {}) => {
	const safetyStatus = normalizeXichengSafetyStatus(material.safetyStatus)
	return ['BLOCKED', 'UNAVAILABLE'].includes(safetyStatus)
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

export const getReviewableMaterialSources = (material = {}) => {
	if (!hasReviewableMaterialEvidence(material)) return []
	return Array.isArray(material.sources) ? material.sources : []
}

export const hasXichengTravelogueDraftEvidence = ({
	materials = [],
	recordingSession = null,
	studyTaskEvidence = [],
	routeRecommendation = null
} = {}) => {
	const hasMaterialEvidence = Array.isArray(materials) && materials.some(material => {
		if (!material) return false
		return hasReviewableMaterialEvidence(material)
	})
	const hasTrackEvidence = Boolean(recordingSession && (
		(Array.isArray(recordingSession.trackPoints) && recordingSession.trackPoints.length > 0)
		|| (Array.isArray(recordingSession.stayPoints) && recordingSession.stayPoints.length > 0)
	))
	const hasStudyEvidence = Array.isArray(studyTaskEvidence) && studyTaskEvidence.some(evidence => evidence && evidence.completedAt)
	const hasRouteEvidence = Boolean(routeRecommendation && (
		routeRecommendation.title
		|| (Array.isArray(routeRecommendation.stops) && routeRecommendation.stops.length > 0)
	))
	return hasMaterialEvidence || hasTrackEvidence || hasStudyEvidence || hasRouteEvidence
}

export const createXichengTravelogueDraft = ({
	materials = [],
	parentChildTasks = XICHENG_REGION_CONFIG.parentChildTasks,
	routeRecommendation = null,
	recordingSession = null,
	studyTaskEvidence = []
} = {}) => {
	if (!hasXichengTravelogueDraftEvidence({
		materials,
		routeRecommendation,
		recordingSession,
		studyTaskEvidence
	})) {
		return `请先通过识别、开始记录、补充照片或现场备注积累真实素材，再生成西城游记草稿。小京会基于真实照片、轨迹、识别事件、停留点、研学任务证据和用户备注整理内容，不会替用户编造路线。`
	}
	const poiNames = Array.from(new Set(
		materials
			.map(material => material && material.poiName ? material.poiName : '')
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
		: poiNames.length > 0 ? poiNames.join('、') : '本次西城 Citywalk'
	const taskText = parentChildTasks.length > 0 ? parentChildTasks.slice(0, 2).join('；') : '完成现场观察'
	const photoCount = materials.filter(material => material && material.type === 'photo').length
	const remarkTexts = materials
		.map(material => material && material.remarkText ? material.remarkText : '')
		.filter(Boolean)
		.slice(0, 2)
	const aiGuideExcerpts = materials
		.filter(material => material && material.type === 'ai-guide' && material.aiAnswerExcerpt && hasReviewableMaterialEvidence(material))
		.map(material => material.aiAnswerExcerpt)
		.slice(0, 2)
	const trackText = routePointCount > 0 ? `本次主动记录了 ${routePointCount} 个前台位置点，` : ''
	const stayText = stayPointCount > 0 ? `本次标记了 ${stayPointCount} 个停留点，` : ''
	const photoText = photoCount > 0 ? `现场补充了 ${photoCount} 张照片，` : ''
	const remarkText = remarkTexts.length > 0 ? `用户备注提到：${remarkTexts.join('；')}。` : ''
	const aiGuideText = aiGuideExcerpts.length > 0 ? `小京回答提到：${aiGuideExcerpts.join('；')}。` : ''
	const completedStudyEvidence = studyTaskEvidence
		.filter(evidence => evidence && evidence.completedAt)
		.slice(0, 2)
	const studyEvidenceText = completedStudyEvidence.length > 0
		? `研学任务证据包括：${completedStudyEvidence.map(evidence => evidence.answerText || evidence.taskText || '照片观察').join('；')}。`
		: ''
	return `今天的西城 Citywalk 从${routeText}展开。小京把识别到的文化点、讲解来源和现场观察整理进旅行素材盒，${trackText}${stayText}${photoText}我们沿途完成了${taskText}。${remarkText}${studyEvidenceText}${aiGuideText}这条路线适合慢慢走、边看边听，把建筑细节、胡同生活和亲子研学发现写进一篇可继续编辑的游记。`
}

const createEmptyRecordingSession = () => ({
	sessionId: '',
	regionCode: XICHENG_REGION_CONFIG.regionCode,
	packageCode: XICHENG_REGION_CONFIG.packageCode,
	status: 'idle',
	startedAt: '',
	pausedAt: '',
	finishedAt: '',
	trackPoints: [],
	stayPoints: [],
	filteredTrackPoints: []
})

const XICHENG_TRACK_POINT_QUALITY = Object.freeze({
	maxPoiAttributionAccuracyMeters: 80,
	abnormalJumpWindowSeconds: 5,
	abnormalJumpDistanceMeters: 500
})

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

const decodeJourneyRouteValue = (value = '') => {
	try {
		return decodeURIComponent(String(value || ''))
	} catch (error) {
		return String(value || '')
	}
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
			studyTaskEvidence: [],
			studyTaskDrafts: [],
			badgeAwards: [],
			routeCheckins: [],
			inspirationImports: [],
			recognitionFeedbacks: [],
			recordingSession: createEmptyRecordingSession()
		}
	},
	computed: {
		materialCount() {
			return this.materials.length
		},
		sourceCount() {
			return this.materials.reduce((total, material) => {
				return total + getReviewableMaterialSources(material).length
			}, 0)
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
		aiGuideMaterials() {
			return this.materials.filter(material => material && material.type === 'ai-guide')
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
			return this.studyTaskEvidence.filter(evidence => evidence && evidence.completedAt)
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
			if (this.sourceCount === 0) {
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
				reviewedSourceCount: this.sourceCount,
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
				workCount: this.draft ? 1 : 0,
				inspirationImportCount: this.inspirationImportCount,
				studyTaskEvidenceCount: this.studyTaskEvidenceCount,
				badgeAwardCount: this.badgeAwardCount,
				checkinCount: this.checkinCount,
				recognitionFeedbackCount: this.recognitionFeedbackCount,
				candidateConfirmationCount: this.candidateConfirmationCount,
				aiGuideMaterialCount: this.aiGuideMaterialCount,
				shareCount: this.shareArtifacts.length,
				misTriggerCount: this.misTriggerCount,
				safetyStatusSummary: this.safetyStatusSummary,
				safetyBlockedCount: this.safetyBlockedCount,
				safetyUnavailableCount: this.safetyUnavailableCount,
				reviewReadinessSummary: this.reviewReadinessSummary,
				sourceReadinessStatus: this.reviewReadinessSummary.sourceReadinessStatus,
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
			const routeMaterial = this.materials.find(material => material && material.routeRecommendation)
			return routeMaterial ? routeMaterial.routeRecommendation : null
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
		this.loadJourney(options)
	},
	methods: {
		async loadJourney(options = {}) {
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
			const routeSafetyStatus = decodeJourneyRouteValue(options.safetyStatus)
			const routePoiName = decodeJourneyRouteValue(options.poiName)
			if (routePoiName && !materials.some(material => material && material.poiName === routePoiName)) {
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
				? cachedDraft.draft
				: createXichengTravelogueDraft({
					materials: this.materials,
					parentChildTasks: this.parentChildTasks,
					routeRecommendation: this.recognizedRoute,
					recordingSession: this.recordingSession,
					studyTaskEvidence: this.studyTaskEvidence
				})
			this.reviewText = cachedDraft && cachedDraft.reviewText ? cachedDraft.reviewText : this.reviewText
			this.posterStatus = cachedDraft && cachedDraft.posterStatus ? cachedDraft.posterStatus : this.posterStatus
			this.pdfStatus = cachedDraft && cachedDraft.pdfStatus ? cachedDraft.pdfStatus : this.pdfStatus
			this.saveDraft({ silent: true })
			if (this.shouldAutoStartRecording(options)) {
				await this.startRecordingSession()
			}
		},
		shouldAutoStartRecording(options = {}) {
			return options.mode === 'record'
				&& options.autoStart === '1'
				&& this.recordingSession.status !== 'recording'
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
				studyTaskEvidence: this.studyTaskEvidence
			})
			this.saveDraft({ silent: true })
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
				title: '研学证据已删除',
				icon: 'none'
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
				title: '研学任务已完成',
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
					content: '照片仅用于本次西城游记素材、研学任务证据和本地审核包，不默认公开；如你已授权定位，可记录拍摄时定位和定位精度用于足迹归属；不会用于模型评估或运营纠错，除非你另行授权。',
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
			const confirmed = await this.confirmTraveloguePhotoPurpose('研学照片')
			if (!confirmed) return
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['camera', 'album'],
				success: (res) => {
					const filePath = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : ''
					if (!filePath) {
						this.showPhotoEvidenceCaptureFailed('研学照片未保存，请重新选择')
						return
					}
					const evidence = this.createStudyTaskEvidence(index, 'photo', {
						answerText: String(this.studyTaskDrafts[index] || '').trim(),
						photoPath: filePath
					})
					this.persistStudyTaskEvidence(evidence)
					uni.showToast({
						title: '研学照片已保存',
						icon: 'none'
					})
				},
				fail: () => {
					this.showPhotoEvidenceCaptureFailed()
				}
			})
		},
		claimRouteBadge() {
			if (!this.badgeUnlocked || this.activeBadgeAward) return
			const award = this.createRouteBadgeAward()
			this.persistRouteBadgeAward(award)
			uni.showToast({
				title: '徽章已领取',
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
				fail: () => {
					this.showPhotoEvidenceCaptureFailed()
				}
			})
		},
		hasReviewableJourneyEvidence() {
			return hasXichengTravelogueDraftEvidence({
				materials: this.materials,
				routeRecommendation: this.recognizedRoute,
				recordingSession: this.recordingSession,
				studyTaskEvidence: this.studyTaskEvidence
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
				this.showWorkEvidenceRequiredToast('分享海报')
				return
			}
			this.posterStatus = '分享海报已生成'
			const posterAsset = this.createShareArtifact('poster')
			this.persistShareArtifact(posterAsset)
			this.saveDraft({ silent: true })
			uni.showToast({
				title: '分享海报已生成',
				icon: 'none'
			})
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
		},
		submitReview() {
			if (!this.hasReviewableJourneyEvidence()) {
				this.showWorkEvidenceRequiredToast('作品审核')
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
				title: '作品审核已提交',
				icon: 'none'
			})
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
				reviewedSourceCount: this.reviewReadinessSummary.reviewedSourceCount,
				reviewBlockers: this.reviewReadinessSummary.reviewBlockers,
				reviewBlockerCount: this.reviewReadinessSummary.reviewBlockers.length,
				reviewStatus: this.reviewText,
				submittedAt,
				materialCount: this.materialCount,
				sourceCount: this.sourceCount,
				workCount: this.draft ? 1 : 0,
				posterStatus: this.posterStatus,
				pdfStatus: this.pdfStatus,
				shareArtifacts: this.shareArtifacts
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
			return {
				taskId: evidence.taskId || '',
				taskText: evidence.taskText || '',
				evidenceType: evidence.evidenceType || '',
				answerExcerpt: String(evidence.answerText || '').slice(0, 80),
				hasPhoto: Boolean(evidence.photoPath),
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
			const safetyStatus = normalizeXichengSafetyStatus(checkin.safetyStatus)
			if (['BLOCKED', 'UNAVAILABLE'].includes(safetyStatus)) return false
			return Boolean(checkin.poiCode || checkin.poiName || checkin.routeTitle)
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
		createShareArtifact(assetType) {
			const createdAt = new Date().toISOString()
			const routeTitle = this.recognizedRoute && this.recognizedRoute.title
				? this.recognizedRoute.title
				: this.importedRoute && this.importedRoute.title ? this.importedRoute.title : '西城 Citywalk'
			const assetLabel = assetType === 'pdf' ? 'PDF纪念册' : '分享海报'
			const assetTitle = assetType === 'pdf' ? '西城 PDF纪念册' : '西城分享海报'
			const publicRouteCheckins = this.routeCheckins
				.filter(checkin => this.hasReviewableRouteCheckinEvidence(checkin))
				.map(checkin => this.sanitizeRouteCheckinForPublicShare(checkin))
			const publicMaterials = this.materials
				.filter(material => hasReviewableMaterialEvidence(material))
				.map(material => this.sanitizeMaterialForPublicShare(material))
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
				publicMaterials,
				publicStudyTaskEvidence: this.completedStudyTaskEvidence.map(evidence => this.sanitizeStudyTaskEvidenceForPublicShare(evidence)),
				publicRouteCheckins,
				publicCandidateConfirmationSummary: this.createPublicCandidateConfirmationSummary(),
				publicRecordingSummary: this.createPublicRecordingSummary(),
				checkinCount: publicRouteCheckins.length,
				materialCount: publicMaterials.length,
				qualityReport: this.qualityReport,
				filteredTrackPointCount: this.filteredTrackPointCount,
				privacy: {
					shareLocationPrecision: 'poi_area',
					shareTrackDefault: 'private',
					exactCoordinatesHidden: true
				},
				templateCode: assetType === 'pdf' ? 'xicheng-memorial-pdf-v1' : 'xicheng-share-poster-v1',
				templateLabel: assetType === 'pdf' ? 'PDF固定模板：封面、路线地图、照片时间线、游记正文、知识卡片、徽章页' : '分享海报固定模板',
				templateSections: assetType === 'pdf' ? this.createMemorialPdfTemplate(routeTitle, createdAt) : this.createPosterTemplate(routeTitle),
				draftExcerpt: String(this.draft || '').slice(0, 80),
				stayPointCount: this.stayPointCount,
				photoMaterialCount: this.photoMaterialCount,
				remarkMaterialCount: this.remarkMaterialCount,
				studyTaskEvidenceCount: this.studyTaskEvidenceCount,
				activeBadgeAward: this.activeBadgeAward,
				badgeAwardCount: this.badgeAwardCount,
				recognitionFeedbackCount: this.recognitionFeedbackCount,
				candidateConfirmationCount: this.candidateConfirmationCount,
				aiGuideMaterialCount: this.aiGuideMaterialCount,
				safetyStatusSummary: this.safetyStatusSummary,
				safetyBlockedCount: this.safetyBlockedCount,
				safetyUnavailableCount: this.safetyUnavailableCount,
				reviewReadinessSummary: this.reviewReadinessSummary,
				sourceReadinessStatus: this.reviewReadinessSummary.sourceReadinessStatus,
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
		createPosterTemplate(routeTitle) {
			return [
				{
					sectionKey: 'share-card',
					title: '分享海报',
					routeTitle,
					badgeName: this.badgeName,
					passportProgress: this.passportProgress,
					draftExcerpt: String(this.draft || '').slice(0, 80)
				}
			]
		},
		createMemorialPdfSourceCards() {
			const seenCards = new Set()
			const sourceCards = []
			this.materials
				.filter(material => hasReviewableMaterialEvidence(material))
				.forEach((material = {}, materialIndex) => {
					const materialSources = getReviewableMaterialSources(material)
					materialSources.forEach((source = {}, sourceIndex) => {
						const title = source.title || source.name || ''
						const excerpt = source.excerpt || source.summary || source.url || ''
						if (!title && !excerpt) return
						const cardKey = `${material.poiCode || material.poiName || materialIndex}:${title}:${excerpt}`
						if (seenCards.has(cardKey)) return
						seenCards.add(cardKey)
						sourceCards.push({
							sourceCardId: `source-card-${materialIndex}-${sourceIndex}`,
							title: source.title || source.name,
							excerpt: source.excerpt || source.summary || source.url,
							url: source.url || '',
							poiCode: material.poiCode || '',
							poiName: material.poiName || ''
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
					subtitle: '我的西城 Citywalk 纪念册'
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
					sectionKey: 'badge-page',
					title: '徽章页',
					badgeName: this.badgeName,
					passportProgress: this.passportProgress
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
			if (this.sourceCount === 0) {
				suggestions.push('补充已审核讲解来源，提升小京回答可信度')
			}
			if (this.passportProgress < 100) {
				suggestions.push('优化路线护照任务，引导完成更多打卡点')
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
			this.recordingSession = {
				...createEmptyRecordingSession(),
				sessionId: `recording-${Date.now()}`,
				status: 'recording',
				startedAt,
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

<style scoped>
.xicheng-travelogue {
	min-height: 100vh;
	padding: 36rpx 28rpx 56rpx;
	box-sizing: border-box;
	background: #F7F5EE;
	color: #172B4D;
}

.hero,
.section-card,
.stat-card {
	border-radius: 8rpx;
	background: #FFFFFF;
	box-shadow: 0 12rpx 36rpx rgba(31, 41, 51, 0.08);
}

.hero {
	padding: 36rpx 32rpx;
}

.eyebrow,
.subtitle,
.section-desc,
.badge-copy,
.empty-copy,
.material-meta,
.report-label {
	display: block;
	font-size: 24rpx;
	line-height: 1.6;
	color: #667085;
}

.title {
	display: block;
	margin-top: 12rpx;
	font-size: 44rpx;
	font-weight: 700;
	color: #122033;
}

.subtitle {
	margin-top: 14rpx;
}

.stats-grid,
.report-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 24rpx;
}

.stat-card {
	padding: 22rpx;
	text-align: center;
}

.stat-value,
.report-value {
	display: block;
	font-size: 34rpx;
	font-weight: 700;
	color: #1F6E5A;
}

.stat-label {
	display: block;
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #667085;
}

.section-card {
	margin-top: 24rpx;
	padding: 30rpx;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #122033;
}

.section-badge {
	flex-shrink: 0;
	padding: 8rpx 14rpx;
	border-radius: 8rpx;
	background: #EEF5F1;
	font-size: 22rpx;
	color: #1F6E5A;
}

.progress-track {
	height: 14rpx;
	margin-top: 22rpx;
	overflow: hidden;
	border-radius: 8rpx;
	background: #E8ECE7;
}

.progress-fill {
	height: 100%;
	border-radius: 8rpx;
	background: #1F6E5A;
}

.badge-copy {
	margin-top: 16rpx;
}

.badge-award-box {
	margin-top: 18rpx;
	padding: 18rpx;
	border-radius: 8rpx;
	background: #EEF5F1;
}

.badge-award-title,
.badge-award-copy {
	display: block;
	font-size: 24rpx;
	line-height: 1.5;
	color: #1F6E5A;
}

.badge-award-title {
	font-weight: 700;
}

.badge-claim-button {
	margin-top: 18rpx;
}

.material-row,
.checkin-row,
.task-row {
	margin-top: 18rpx;
	padding: 20rpx;
	border-radius: 8rpx;
	background: #F2F4F7;
}

.material-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: #1F2933;
}

.route-title {
	display: block;
	margin-top: 18rpx;
	font-size: 28rpx;
	font-weight: 700;
	color: #1F2933;
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

.material-meta {
	margin-top: 8rpx;
}

.material-image {
	display: block;
	width: 100%;
	height: 220rpx;
	margin-top: 16rpx;
	border-radius: 8rpx;
	background: #E8ECE7;
}

.material-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 16rpx;
}

.mini-picker {
	display: inline-flex;
}

.mini-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 56rpx;
	line-height: 56rpx;
	margin: 0;
	padding: 0 20rpx;
	border-radius: 8rpx;
	background: #E8ECE7;
	color: #1F6E5A;
	font-size: 24rpx;
}

.picker-button {
	box-sizing: border-box;
}

.danger-mini-button {
	background: #FEE4E2;
	color: #B42318;
}

.remark-input {
	width: 100%;
	min-height: 160rpx;
	margin-top: 20rpx;
	padding: 20rpx;
	border-radius: 8rpx;
	background: #F9FAFB;
	box-sizing: border-box;
	font-size: 26rpx;
	line-height: 1.6;
	color: #1F2933;
}

.evidence-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 8rpx;
}

.task-row {
	display: grid;
	grid-template-columns: 48rpx minmax(0, 1fr) 104rpx;
	align-items: flex-start;
	gap: 14rpx;
}

.task-main {
	min-width: 0;
}

.task-index,
.task-status {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 44rpx;
	border-radius: 8rpx;
	background: #E8ECE7;
	font-size: 22rpx;
	color: #1F6E5A;
}

.task-copy {
	display: block;
	font-size: 26rpx;
	line-height: 1.5;
	color: #344054;
}

.task-evidence {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.5;
	color: #1F6E5A;
}

.task-input {
	width: 100%;
	min-height: 112rpx;
	margin-top: 12rpx;
	padding: 16rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	box-sizing: border-box;
	font-size: 24rpx;
	line-height: 1.5;
	color: #1F2933;
}

.task-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 12rpx;
}

.draft-input {
	width: 100%;
	min-height: 320rpx;
	margin-top: 20rpx;
	padding: 22rpx;
	border-radius: 8rpx;
	background: #F9FAFB;
	box-sizing: border-box;
	font-size: 26rpx;
	line-height: 1.7;
	color: #1F2933;
}

.primary-button,
.ghost-button {
	height: 84rpx;
	line-height: 84rpx;
	border-radius: 8rpx;
	font-size: 28rpx;
}

.primary-button {
	margin-top: 20rpx;
	background: #1F6E5A;
	color: #FFFFFF;
}

.action-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 24rpx;
}

.ghost-button {
	background: #E8ECE7;
	color: #1F6E5A;
}

.danger-button {
	background: #FEE4E2;
	color: #B42318;
}
</style>
