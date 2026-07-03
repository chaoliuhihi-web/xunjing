<template>
	<view class="travelogue-ops-details">
		<view class="stats-grid">
			<view class="stat-card xicheng-paper-card">
				<text class="stat-value">{{ materialCount }}</text>
				<text class="stat-label">旅行素材盒</text>
			</view>
			<view class="stat-card xicheng-paper-card">
				<text class="stat-value">{{ passportProgress }}%</text>
				<text class="stat-label">路线记录</text>
			</view>
			<view class="stat-card xicheng-paper-card">
				<text class="stat-value">{{ completedTaskCount }}/{{ parentChildTasks.length }}</text>
				<text class="stat-label">街区观察任务</text>
			</view>
		</view>
		<view class="section-card xicheng-paper-card vision-agent-task-card">
			<view class="section-head">
				<text class="section-title">AI识境任务包</text>
				<text class="section-badge">{{ visionAgentServiceTaskCount }} 项</text>
			</view>
			<text class="section-desc">拍照识别后的路线、商家、记录和游记素材会沉淀到这里，继续生成游记、路线复盘和试运营日报。</text>
			<view v-if="visibleVisionAgentServiceTasks.length > 0" class="vision-agent-task-list">
				<view
					v-for="task in visibleVisionAgentServiceTasks"
					:key="task.id || `${task.actionKey}-${task.createdAt}`"
					class="vision-agent-task-row"
				>
					<view class="vision-agent-task-main">
						<text class="vision-agent-task-type">{{ formatVisionAgentServiceTaskType(task) }}</text>
						<text class="vision-agent-task-title">{{ task.actionTitle || '现场服务动作' }}</text>
					</view>
					<text class="vision-agent-task-meta">{{ createVisionAgentServiceTaskMeta(task) }}</text>
				</view>
			</view>
			<text v-else class="empty-copy">打开 AI识境拍一下，选择路线、美食、记录或生成游记后，会在这里形成可继续处理的任务包。</text>
		</view>
		<view class="section-card xicheng-paper-card">
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
				<button class="primary-button xicheng-primary-action" :disabled="recordingSession.status === 'recording' || recordingSession.status === 'paused'" @click="$emit('start-recording')">开始记录</button>
				<button class="ghost-button xicheng-secondary-action" :disabled="recordingSession.status !== 'paused'" @click="$emit('resume-recording')">继续</button>
				<button class="ghost-button xicheng-secondary-action" :disabled="recordingSession.status !== 'recording'" @click="$emit('capture-track-point', 'manual')">补记位置</button>
				<button class="ghost-button xicheng-secondary-action" :disabled="recordingSession.status !== 'recording'" @click="$emit('mark-stay-point')">标记停留</button>
				<button class="ghost-button xicheng-secondary-action" :disabled="recordingSession.status !== 'recording'" @click="$emit('pause-recording')">暂停</button>
				<button class="ghost-button xicheng-secondary-action" :disabled="recordingSession.status === 'idle' || recordingSession.status === 'finished'" @click="$emit('finish-recording')">结束</button>
				<button class="ghost-button danger-button" :disabled="recordingSession.status === 'idle' && routePointCount === 0 && stayPointCount === 0" @click="$emit('delete-recording')">删除记录</button>
			</view>
		</view>
		<view v-if="importedRoute" class="section-card xicheng-paper-card">
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
		<view class="section-card xicheng-paper-card">
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
						<button class="mini-button danger-mini-button" @click="$emit('delete-inspiration-import', index)">删除导入</button>
					</view>
				</view>
			</view>
			<text v-else class="empty-copy">从“一键导入灵感”生成路线后，会沉淀为可审核的导入记录。</text>
		</view>
		<view v-if="recognizedRoute" class="section-card xicheng-paper-card">
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
		<view class="section-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">路线记录进度</text>
				<text class="section-badge">{{ badgeUnlocked ? '已完成' : '继续记录' }}</text>
			</view>
			<text class="section-desc">完成 {{ routePassport.targetCheckinCount || 3 }} 个文化点记录后，可生成更完整的路线复盘与游记素材。</text>
			<view class="progress-track">
				<view class="progress-fill" :style="{ width: `${passportProgress}%` }"></view>
			</view>
			<text class="badge-copy">路线点位会随记录素材自动累积，完成后可用于游记长文和 PDF 打印。</text>
			<view v-if="activeBadgeAward" class="badge-award-box">
				<text class="badge-award-title">路线记录达成</text>
				<text class="badge-award-copy">记录完成 · {{ formatArtifactTime(activeBadgeAward.awardedAt) }}</text>
			</view>
			<button v-else class="ghost-button xicheng-secondary-action badge-claim-button" :disabled="!badgeUnlocked" @click="$emit('claim-route-badge')">更新路线进度</button>
		</view>
		<view class="section-card xicheng-paper-card">
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
						<button class="mini-button danger-mini-button" @click="$emit('delete-route-checkin', index)">删除打卡</button>
					</view>
				</view>
			</view>
			<text v-else class="empty-copy">从识别结果页点击“开始记录”后，会生成可审核的路线打卡事件。</text>
		</view>
		<view class="section-card xicheng-paper-card">
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
						<picker class="mini-picker" :range="officialPoiNames" @change="$emit('correct-material-poi', index, $event)">
							<text class="mini-button picker-button">修正 POI</text>
						</picker>
						<button class="mini-button" :disabled="material.locationHidden" @click="$emit('hide-material-location', index)">隐藏地点</button>
						<button class="mini-button danger-mini-button" @click="$emit('delete-journey-material', index)">删除素材</button>
					</view>
				</view>
			</view>
			<text v-else class="empty-copy">从识别结果页点击“开始记录”后，POI、来源和识别置信度会进入这里。</text>
		</view>
		<view class="section-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">现场备注</text>
				<text class="section-badge">照片 {{ photoMaterialCount }} · 备注 {{ remarkMaterialCount }}</text>
			</view>
			<text class="section-desc">把现场观察、同行感受和补充照片加入素材盒，游记草稿会一起引用。</text>
			<textarea
				:value="remarkInput"
				class="remark-input"
				maxlength="240"
				placeholder="记录现场观察、同行感受或一句发现"
				@input="$emit('update:remarkInput', $event.detail.value)"
			/>
			<view class="evidence-actions">
				<button class="primary-button xicheng-primary-action" @click="$emit('add-remark-material')">添加备注</button>
				<button class="ghost-button xicheng-secondary-action" @click="$emit('add-photo-material')">补充照片</button>
			</view>
		</view>
		<view class="section-card xicheng-paper-card">
			<text class="section-title">街区观察任务</text>
			<view
				v-for="(task, index) in parentChildTasks"
				:key="`study-task-${index}`"
				class="task-row"
			>
				<text class="task-index">{{ index + 1 }}</text>
				<view class="task-main">
					<text class="task-copy">{{ task }}</text>
					<text v-if="getStudyTaskEvidence(index)" class="task-evidence">观察记录：{{ formatStudyTaskEvidence(getStudyTaskEvidence(index)) }}</text>
					<textarea
						v-else
						:value="studyTaskDrafts[index]"
						class="task-input"
						maxlength="160"
						placeholder="记录观察、答案或一句发现"
						@input="$emit('update-study-task-draft', index, $event.detail.value)"
					/>
					<view class="task-actions">
						<button v-if="getStudyTaskEvidence(index)" class="mini-button danger-mini-button" @click="$emit('delete-study-task-evidence', index)">删除记录</button>
						<button v-else class="mini-button" @click="$emit('submit-study-task-evidence', index)">提交观察</button>
						<button v-if="!getStudyTaskEvidence(index)" class="mini-button" @click="$emit('add-study-task-photo', index)">拍照补充</button>
					</view>
				</view>
				<text class="task-status">{{ getStudyTaskStatus(index) }}</text>
			</view>
		</view>
		<view class="section-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">游记草稿</text>
				<text class="section-badge">{{ reviewText }}</text>
			</view>
			<textarea
				id="travelogue-draft-editor"
				class="draft-input"
				:value="draft"
				maxlength="1600"
				placeholder="小京会根据素材盒生成可编辑游记草稿"
				@input="$emit('update:draft', $event.detail.value)"
			/>
			<button class="primary-button xicheng-primary-action" @click="$emit('save-draft')">保存草稿</button>
		</view>
		<xicheng-travelogue-editor-share
			class="travelogue-secondary-editor"
			:region="region"
			:editable-title="editableTravelogueTitle"
			:photo-cards="editorPhotoCards"
			:route-items="editorRouteItems"
			:feeling-text="editorFeelingText"
			:xiaojing-supplement="editorXiaojingSupplement"
			:tag-chips="travelogueTagChips"
			@update:title="$emit('update:editableTravelogueTitle', $event)"
			@save="$emit('save-draft')"
			@generate-share="$emit('generate-share')"
			@publish="$emit('publish')"
			@add-photo="$emit('add-photo-material')"
		/>
		<view class="section-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">隐私与本地数据</text>
				<text class="section-badge">试运营</text>
			</view>
			<text class="section-desc">西城试运营素材、轨迹、反馈、审核包和分享产物先保存在本机，可随时清除。</text>
			<view class="evidence-actions">
				<button class="ghost-button xicheng-secondary-action" @click="$emit('privacy-policy')">隐私政策</button>
				<button class="ghost-button xicheng-secondary-action" @click="$emit('user-protocol')">用户协议</button>
				<button class="ghost-button xicheng-secondary-action" @click="$emit('ai-content-notice')">AI 内容说明</button>
				<button class="ghost-button xicheng-secondary-action" @click="$emit('feedback')">反馈入口</button>
				<button class="ghost-button danger-button" @click="$emit('clear-local-data')">清除西城本地数据</button>
			</view>
		</view>
		<view v-if="shareArtifacts.length > 0" class="section-card xicheng-paper-card">
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
				<text class="material-meta">{{ getShareArtifactLabel(artifact) }} · {{ artifact.visibilityLabel || '待审核 · 未公开' }} · {{ formatArtifactTime(artifact.createdAt) }}</text>
				<text v-if="artifact.templateLabel" class="material-meta">{{ artifact.templateLabel }}</text>
				<view class="material-actions">
					<button class="mini-button danger-mini-button" @click="$emit('delete-share-artifact', index)">删除产物</button>
				</view>
			</view>
		</view>
		<view v-if="reviewSubmission" class="section-card xicheng-paper-card">
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
			<text class="section-desc">社交素材：{{ reviewSubmission.posterStatus }} · PDF：{{ reviewSubmission.pdfStatus }}</text>
			<text v-if="reviewSubmission.publicPreview" class="section-desc">
				公开预览：素材 {{ reviewSubmission.publicPreview.materialCount }} · 打卡 {{ reviewSubmission.publicPreview.checkinCount }} · 观察 {{ reviewSubmission.publicPreview.studyTaskEvidenceCount }}
			</text>
			<view class="material-actions">
				<button class="mini-button danger-mini-button" @click="$emit('withdraw-review')">撤回审核</button>
			</view>
		</view>
		<view class="section-card xicheng-paper-card">
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
					<text class="report-value">{{ opsReport.workSourceCount }}</text>
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
			<text class="section-desc">来源审核：{{ opsReport.sourceReadinessStatus }} · 待复核：{{ opsReport.reviewBlockerCount }} · 总来源：{{ opsReport.sourceCount }}</text>
			<text class="section-desc">轨迹质量：{{ opsReport.qualityReport.usableRate }}% 可用 · 异常点：{{ opsReport.filteredTrackPointCount }}</text>
			<text class="section-desc">优化建议：{{ opsReport.optimizationSuggestionText }}</text>
			<text class="section-desc">试运营日报覆盖识别、路线、分享、审核来源和安全状态，可直接用于现场复盘。</text>
		</view>
	</view>
</template>

<script>
import XichengTravelogueEditorShare from '@/components/xicheng/travelogue-editor-share.vue'

const noop = () => ''

export default {
	name: 'XichengTravelogueOpsDetails',
	components: { XichengTravelogueEditorShare },
	props: {
		region: { type: Object, required: true },
		materialCount: { type: Number, default: 0 },
		passportProgress: { type: Number, default: 0 },
		completedTaskCount: { type: Number, default: 0 },
		parentChildTasks: { type: Array, default: () => [] },
		visionAgentServiceTaskCount: { type: Number, default: 0 },
		visibleVisionAgentServiceTasks: { type: Array, default: () => [] },
		recordingStatusText: { type: String, default: '' },
		routePointCount: { type: Number, default: 0 },
		stayPointCount: { type: Number, default: 0 },
		filteredTrackPointCount: { type: Number, default: 0 },
		recordingSession: { type: Object, default: () => ({ status: 'idle' }) },
		importedRoute: { type: Object, default: null },
		inspirationImportCount: { type: Number, default: 0 },
		inspirationImports: { type: Array, default: () => [] },
		recognizedRoute: { type: Object, default: null },
		recognizedRouteStops: { type: Array, default: () => [] },
		badgeUnlocked: { type: Boolean, default: false },
		badgeName: { type: String, default: '' },
		routePassport: { type: Object, default: () => ({}) },
		activeBadgeAward: { type: Object, default: null },
		checkinCount: { type: Number, default: 0 },
		routeCheckins: { type: Array, default: () => [] },
		materials: { type: Array, default: () => [] },
		officialPoiNames: { type: Array, default: () => [] },
		photoMaterialCount: { type: Number, default: 0 },
		remarkMaterialCount: { type: Number, default: 0 },
		remarkInput: { type: String, default: '' },
		studyTaskDrafts: { type: Array, default: () => [] },
		reviewText: { type: String, default: '' },
		draft: { type: String, default: '' },
		editableTravelogueTitle: { type: String, default: '' },
		editorPhotoCards: { type: Array, default: () => [] },
		editorRouteItems: { type: Array, default: () => [] },
		editorFeelingText: { type: String, default: '' },
		editorXiaojingSupplement: { type: String, default: '' },
		travelogueTagChips: { type: Array, default: () => [] },
		shareArtifacts: { type: Array, default: () => [] },
		reviewSubmission: { type: Object, default: null },
		opsReport: { type: Object, default: () => ({ qualityReport: {} }) },
		formatArtifactTime: { type: Function, default: () => noop },
		formatVisionAgentServiceTaskType: { type: Function, default: () => noop },
		createVisionAgentServiceTaskMeta: { type: Function, default: () => noop },
		createCheckinEventLabel: { type: Function, default: () => noop },
		formatCandidateConfirmationAudit: { type: Function, default: () => noop },
		getStudyTaskEvidence: { type: Function, default: () => noop },
		formatStudyTaskEvidence: { type: Function, default: () => noop },
		getStudyTaskStatus: { type: Function, default: () => noop }
	},
	emits: [
		'start-recording',
		'resume-recording',
		'capture-track-point',
		'mark-stay-point',
		'pause-recording',
		'finish-recording',
		'delete-recording',
		'delete-inspiration-import',
		'claim-route-badge',
		'delete-route-checkin',
		'correct-material-poi',
		'hide-material-location',
		'delete-journey-material',
		'update:remarkInput',
		'add-remark-material',
		'add-photo-material',
		'update-study-task-draft',
		'delete-study-task-evidence',
		'submit-study-task-evidence',
		'add-study-task-photo',
		'update:draft',
		'save-draft',
		'update:editableTravelogueTitle',
		'generate-share',
		'publish',
		'privacy-policy',
		'user-protocol',
		'ai-content-notice',
		'feedback',
		'clear-local-data',
		'delete-share-artifact',
		'withdraw-review'
	],
	methods: {
		getShareArtifactLabel(artifact = {}) {
			if (artifact.assetType === 'pdf') return 'PDF 纪念册'
			if (artifact.assetType === 'poster') return '社交分享素材'
			return artifact.assetLabel || '游记发布素材'
		}
	}
}
</script>

<style scoped src="../../pages/xicheng/travelogue/travelogue.css"></style>
