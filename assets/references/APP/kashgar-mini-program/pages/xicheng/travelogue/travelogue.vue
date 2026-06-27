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
					<text class="report-value">{{ recordingSession.startedAt ? formatArtifactTime(recordingSession.startedAt) : '--' }}</text>
					<text class="report-label">开始日期</text>
				</view>
			</view>
			<view class="recording-actions">
				<button class="primary-button" :disabled="recordingSession.status === 'recording'" @click="startRecordingSession">开始记录</button>
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
					<text v-if="material.remarkText" class="material-meta">{{ material.remarkText }}</text>
					<image v-if="material.imagePath" class="material-image" :src="material.imagePath" mode="aspectFill" />
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
				:key="task"
				class="task-row"
			>
				<text class="task-index">{{ index + 1 }}</text>
				<text class="task-copy">{{ task }}</text>
				<text class="task-status">{{ index < completedTaskCount ? '已完成' : '进行中' }}</text>
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

		<view v-if="shareArtifacts.length > 0" class="section-card">
			<view class="section-head">
				<text class="section-title">分享产物包</text>
				<text class="section-badge">{{ shareArtifacts.length }} 个产物</text>
			</view>
			<view
				v-for="artifact in shareArtifacts.slice(0, 3)"
				:key="artifact.assetId"
				class="material-row"
			>
				<text class="material-title">{{ artifact.title }}</text>
				<text class="material-meta">{{ artifact.assetLabel }} · {{ formatArtifactTime(artifact.createdAt) }}</text>
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
			<text class="section-desc">上线后可替换为后端真实城市运营报告。</text>
		</view>
	</view>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import { requestCurrentLocationForTrigger } from '@/request/xunjing/trigger.js'

export const createXichengTravelogueDraft = ({
	materials = [],
	parentChildTasks = XICHENG_REGION_CONFIG.parentChildTasks,
	routeRecommendation = null,
	recordingSession = null
} = {}) => {
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
		: poiNames.length > 0 ? poiNames.join('、') : '白塔寺、西四街巷、什刹海'
	const taskText = parentChildTasks.length > 0 ? parentChildTasks.slice(0, 2).join('；') : '完成现场观察'
	const photoCount = materials.filter(material => material && material.type === 'photo').length
	const remarkTexts = materials
		.map(material => material && material.remarkText ? material.remarkText : '')
		.filter(Boolean)
		.slice(0, 2)
	const trackText = routePointCount > 0 ? `本次主动记录了 ${routePointCount} 个前台位置点，` : ''
	const stayText = stayPointCount > 0 ? `本次标记了 ${stayPointCount} 个停留点，` : ''
	const photoText = photoCount > 0 ? `现场补充了 ${photoCount} 张照片，` : ''
	const remarkText = remarkTexts.length > 0 ? `用户备注提到：${remarkTexts.join('；')}。` : ''
	return `今天的西城 Citywalk 从${routeText}展开。小京把识别到的文化点、讲解来源和现场观察整理进旅行素材盒，${trackText}${stayText}${photoText}我们沿途完成了${taskText}。${remarkText}这条路线适合慢慢走、边看边听，把建筑细节、胡同生活和亲子研学发现写进一篇可继续编辑的游记。`
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
	stayPoints: []
})

export default {
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
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
			recordingSession: createEmptyRecordingSession()
		}
	},
	computed: {
		materialCount() {
			return this.materials.length
		},
		sourceCount() {
			return this.materials.reduce((total, material) => {
				return total + (Array.isArray(material.sources) ? material.sources.length : 0)
			}, 0)
		},
		completedTaskCount() {
			return Math.min(this.materials.length, this.parentChildTasks.length)
		},
		passportProgress() {
			const total = Math.max(this.parentChildTasks.length, 1)
			return Math.min(100, Math.round((this.completedTaskCount / total) * 100))
		},
		badgeUnlocked() {
			return this.passportProgress >= 100
		},
		badgeName() {
			return `${this.routePassport.badgePrefix || '西城印章'} · Citywalk`
		},
		opsReport() {
			return {
				recognitionCount: this.materialCount,
				sourceCount: this.sourceCount,
				workCount: this.draft ? 1 : 0,
				reviewStatus: this.reviewText,
				posterStatus: this.posterStatus,
				pdfStatus: this.pdfStatus,
				shareAssetCount: this.shareArtifacts.length,
				routePointCount: this.routePointCount,
				stayPointCount: this.stayPointCount,
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
		photoMaterialCount() {
			return this.materials.filter(material => material && material.type === 'photo').length
		},
		remarkMaterialCount() {
			return this.materials.filter(material => material && material.type === 'remark').length
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
			const materials = Array.isArray(storedMaterials) ? storedMaterials : []
			this.importedRoute = importedRoute && importedRoute.stops ? importedRoute : null
			this.reviewSubmission = Array.isArray(storedReviewSubmissions) && storedReviewSubmissions.length > 0
				? storedReviewSubmissions[0]
				: null
			this.shareArtifacts = Array.isArray(storedShareAssets) ? storedShareAssets : []
			this.recordingSession = storedRecordingSession && Array.isArray(storedRecordingSession.trackPoints)
				? {
					...createEmptyRecordingSession(),
					...storedRecordingSession,
					trackPoints: storedRecordingSession.trackPoints,
					stayPoints: Array.isArray(storedRecordingSession.stayPoints) ? storedRecordingSession.stayPoints : []
				}
				: createEmptyRecordingSession()
			const routePoiName = options.poiName ? decodeURIComponent(options.poiName) : ''
			if (routePoiName && !materials.some(material => material && material.poiName === routePoiName)) {
				materials.unshift({
					type: 'manual-entry',
					regionCode: XICHENG_REGION_CONFIG.regionCode,
					poiCode: options.poiCode ? decodeURIComponent(options.poiCode) : '',
					poiName: routePoiName,
					sourceLabel: '入口记录',
					sources: [],
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
					recordingSession: this.recordingSession
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
		persistJourneyMaterials() {
			uni.setStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey, this.materials.slice(0, 50))
		},
		refreshDraftFromEvidence() {
			this.draft = createXichengTravelogueDraft({
				materials: this.materials,
				parentChildTasks: this.parentChildTasks,
				routeRecommendation: this.recognizedRoute,
				recordingSession: this.recordingSession
			})
			this.saveDraft({ silent: true })
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
				poiCode: '',
				poiName: '现场备注',
				sourceLabel: '用户备注',
				remarkText: this.remarkInput.trim(),
				sources: [],
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
			const trackPoints = Array.isArray(this.recordingSession.trackPoints) ? this.recordingSession.trackPoints : []
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
				diffMs: nearest.diffMs
			}
		},
		addPhotoMaterial() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['camera', 'album'],
				success: async (res) => {
					const filePath = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : ''
					if (!filePath) return
					const takenAt = new Date().toISOString()
					const captureLocation = await requestCurrentLocationForTrigger()
					const material = {
						photoId: `photo-${Date.now()}`,
						type: 'photo',
						regionCode: XICHENG_REGION_CONFIG.regionCode,
						packageCode: XICHENG_REGION_CONFIG.packageCode,
						poiCode: '',
						poiName: '现场照片',
						sourceLabel: '补充照片',
						imagePath: filePath,
						localFileId: filePath,
						objectKey: '',
						takenAt,
						exifLocation: null,
						captureLocation: this.normalizeCaptureLocationForMaterial(captureLocation),
						nearestTrackPoint: this.findNearestTrackPoint(takenAt),
						sources: [],
						capturedAt: takenAt
					}
					this.materials = [material, ...this.materials].slice(0, 50)
					this.persistJourneyMaterials()
					this.refreshDraftFromEvidence()
					uni.showToast({
						title: '照片已加入素材盒',
						icon: 'none'
					})
				}
			})
		},
		saveDraft({ silent = false } = {}) {
			const payload = {
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				draft: this.draft,
				materials: this.materials,
				recognizedRoute: this.recognizedRoute,
				reviewSubmission: this.reviewSubmission,
				shareArtifacts: this.shareArtifacts,
				recordingSession: this.recordingSession,
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
		submitReviewPackage() {
			const submittedAt = new Date().toISOString()
			return {
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				draft: this.draft,
				materials: this.materials,
				recognizedRoute: this.recognizedRoute,
				recordingSession: this.recordingSession,
				routePointCount: this.routePointCount,
				stayPointCount: this.stayPointCount,
				photoMaterialCount: this.photoMaterialCount,
				remarkMaterialCount: this.remarkMaterialCount,
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
		createShareArtifact(assetType) {
			const createdAt = new Date().toISOString()
			const routeTitle = this.recognizedRoute && this.recognizedRoute.title
				? this.recognizedRoute.title
				: this.importedRoute && this.importedRoute.title ? this.importedRoute.title : '西城 Citywalk'
			const assetLabel = assetType === 'pdf' ? 'PDF纪念册' : '分享海报'
			const assetTitle = assetType === 'pdf' ? '西城 PDF纪念册' : '西城分享海报'
			return {
				assetId: `${assetType}-${Date.now()}`,
				assetType,
				assetLabel,
				title: assetTitle,
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				routeTitle,
				draftExcerpt: String(this.draft || '').slice(0, 80),
				materialCount: this.materialCount,
				stayPointCount: this.stayPointCount,
				photoMaterialCount: this.photoMaterialCount,
				remarkMaterialCount: this.remarkMaterialCount,
				sourceCount: this.sourceCount,
				badgeName: this.badgeName,
				passportProgress: this.passportProgress,
				posterStatus: this.posterStatus,
				pdfStatus: this.pdfStatus,
				createdAt
			}
		},
		persistShareArtifact(artifact) {
			const existingArtifacts = uni.getStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey)
			this.shareArtifacts = [
				artifact,
				...(Array.isArray(existingArtifacts) ? existingArtifacts : [])
			].slice(0, 20)
			uni.setStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey, this.shareArtifacts)
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
		async captureTrackPoint(pointType = 'manual') {
			if (this.recordingSession.status === 'idle' || this.recordingSession.status === 'finished') return
			const location = await requestCurrentLocationForTrigger()
			const capturedAt = new Date().toISOString()
			const point = {
				pointType,
				capturedAt,
				latitude: location && location.latitude !== undefined ? Number(location.latitude) : null,
				longitude: location && location.longitude !== undefined ? Number(location.longitude) : null,
				coordType: location && location.coordType ? location.coordType : 'gcj02',
				accuracyMeters: location && location.accuracyMeters !== undefined ? Number(location.accuracyMeters) : 0
			}
			this.recordingSession = {
				...this.recordingSession,
				trackPoints: [
					...(Array.isArray(this.recordingSession.trackPoints) ? this.recordingSession.trackPoints : []),
					point
				]
			}
			this.saveRecordingSession()
		},
		async markStayPoint() {
			if (this.recordingSession.status !== 'recording') return
			const location = await requestCurrentLocationForTrigger()
			const capturedAt = new Date().toISOString()
			const stayPoint = {
				pointType: 'stay',
				capturedAt,
				latitude: location && location.latitude !== undefined ? Number(location.latitude) : null,
				longitude: location && location.longitude !== undefined ? Number(location.longitude) : null,
				coordType: location && location.coordType ? location.coordType : 'gcj02',
				accuracyMeters: location && location.accuracyMeters !== undefined ? Number(location.accuracyMeters) : 0
			}
			this.recordingSession = {
				...this.recordingSession,
				stayPoints: [
					...(Array.isArray(this.recordingSession.stayPoints) ? this.recordingSession.stayPoints : []),
					stayPoint
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

.material-row,
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
	align-items: center;
	gap: 14rpx;
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
	font-size: 26rpx;
	line-height: 1.5;
	color: #344054;
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
