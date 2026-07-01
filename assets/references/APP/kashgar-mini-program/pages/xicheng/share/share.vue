<template>
	<view class="xicheng-share xicheng-designed-page xicheng-bottom-safe">
		<view class="topbar">
			<view class="topbar-button" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="topbar-title">分享纪念</text>
			<view class="topbar-button" @click="openWorks">
				<xicheng-icon name="mine" variant="plain" :size="21" />
			</view>
		</view>

		<view class="poster-card share-reference-poster-frame xicheng-paper-card">
			<image class="poster-bg" :src="sharePosterBackground" mode="aspectFill" />
			<view class="poster-brand-pill">
				<xicheng-icon name="location" variant="primary" :size="16" />
				<text>西城 AI 旅伴</text>
			</view>
			<view class="poster-copy">
				<text class="poster-kicker">在白塔下</text>
				<text class="poster-title">{{ region.sharePoster.title }}</text>
				<text class="poster-desc">{{ posterSubtitle }}</text>
			</view>
			<view class="poster-route-collage">
				<view class="poster-photo-card poster-photo-card-main">
					<image :src="region.visualAssets.heroLandmark" mode="aspectFill" />
					<text>白塔寺</text>
				</view>
				<view class="poster-photo-card">
					<image :src="region.visualAssets.routeThumbnails['baitasi-imperial-shichahai']" mode="aspectFill" />
					<text>历代帝王庙</text>
				</view>
				<view class="poster-photo-card">
					<image :src="region.visualAssets.routeThumbnails['beihai-shichahai-waterfront']" mode="aspectFill" />
					<text>什刹海</text>
				</view>
			</view>
			<view class="poster-footer">
				<image class="poster-xiaojing" :src="region.companionAvatar" mode="aspectFit" />
				<view class="poster-bubble">
					<text>你好，我是小京</text>
					<text>我陪你看懂西城，留下专属游记。</text>
				</view>
				<view class="poster-scan-code">
					<text>扫码看游记</text>
				</view>
			</view>
		</view>

		<view class="asset-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">纪念产物</text>
				<text class="section-badge">{{ shareArtifacts.length }} 个</text>
			</view>
			<view class="asset-grid">
				<view class="asset-tile" @click="createShareArtifact('poster')">
					<xicheng-icon name="travelogue" variant="primary" :size="22" />
					<text class="asset-title">分享海报</text>
					<text class="asset-desc">适合朋友圈和活动群</text>
				</view>
				<view class="asset-tile" @click="createPdfShareArtifact">
					<xicheng-icon name="source" variant="primary" :size="22" />
					<text class="asset-title">PDF 纪念册</text>
					<text class="asset-desc">保留路线、来源与任务</text>
				</view>
				<view class="asset-tile" @click="createShareArtifact('study')">
					<xicheng-icon name="study" variant="primary" :size="22" />
					<text class="asset-title">亲子研学报告</text>
					<text class="asset-desc">学习成果报告</text>
				</view>
			</view>
			<view class="asset-shortcut-row">
				<button class="ghost-button xicheng-secondary-action" @click="openTravelogueReaderPage">预览精美游记</button>
				<button class="ghost-button xicheng-secondary-action" @click="openPdfPrintPage">PDF 打印预览</button>
			</view>
		</view>

		<view v-if="currentVisionAgentShareBoundary" class="vision-agent-share-boundary xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">AI识境服务边界</text>
				<text class="section-badge">真实系统待确认</text>
			</view>
			<text class="vision-agent-share-boundary-copy">{{ currentVisionAgentShareBoundary }}</text>
		</view>

		<xicheng-publish-channel-grid :selected-key="selectedPublishChannel" @select="selectPublishChannel" />
		<xicheng-social-share-preview v-if="['moments', 'xiaohongshu'].includes(selectedPublishChannel)" :channel="selectedPublishChannel" :cover-image="sharePosterBackground" :title="region.sharePoster.title" @copy="copyChannelShareCopy" @save-image="saveChannelShareImage" @confirm="createChannelShareArtifact" />

		<view class="privacy-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">分享设置</text>
				<text class="section-badge">待审核 · 未公开</text>
			</view>
			<view class="share-setting-list">
				<view v-for="setting in shareSettings" :key="setting.key" class="share-setting-row" @click="toggleShareSetting(setting.key)">
					<xicheng-icon :name="setting.icon" variant="soft" :size="18" />
					<view class="share-setting-copy">
						<text class="share-setting-title">{{ setting.title }}</text>
						<text class="share-setting-desc">{{ setting.desc }}</text>
					</view>
					<view class="share-switch" :class="{ 'share-switch-on': setting.enabled }">
						<view class="share-switch-thumb"></view>
					</view>
				</view>
			</view>
			<text class="privacy-copy">分享前只生成本地预览；精确定位、照片路径和原始素材只进入本机审核包，不默认公开。</text>
			<view class="share-review-steps">
				<view v-for="step in reviewSteps" :key="step.title" class="review-step" :class="{ 'review-step-active': step.active }">
					<text class="review-step-index">{{ step.index }}</text>
					<text class="review-step-title">{{ step.title }}</text>
				</view>
			</view>
			<button class="primary-button xicheng-primary-action" @click="submitReview">提交审核</button>
		</view>
	</view>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import { isXichengUnsafeSafetyStatus, normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'
import XichengPublishChannelGrid from '@/components/xicheng/XichengPublishChannelGrid.vue'
import XichengSocialSharePreview from '@/components/xicheng/XichengSocialSharePreview.vue'

const safeArray = value => Array.isArray(value) ? value : []
const safeObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {}
const toSafeCount = value => {
	const count = Number(value || 0)
	return Number.isFinite(count) && count > 0 ? Math.round(count) : 0
}

const XICHENG_DEFAULT_SHARE_SETTING_STATE = Object.freeze({
	hideExactLocation: true,
	approvedOnly: true,
	includeXiaojingSummary: true
})

const normalizeShareSettingState = (settings = {}) => ({
	hideExactLocation: settings.hideExactLocation !== false,
	approvedOnly: settings.approvedOnly !== false,
	includeXiaojingSummary: settings.includeXiaojingSummary !== false
})

export default {
	components: {
		XichengPublishChannelGrid,
		XichengSocialSharePreview
	},
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			shareArtifacts: [],
			reviewSubmissions: [],
			selectedPublishChannel: 'xinghe',
			shareSettingState: { ...XICHENG_DEFAULT_SHARE_SETTING_STATE }
		}
	},
	computed: {
		sharePosterBackground() {
			return this.region.visualAssets.sharePosterBackground || '/static/xicheng/share-poster-background.jpg'
		},
		posterSubtitle() {
			return this.region.sharePoster.subtitle || '生成可审核的西城纪念分享'
		},
		shareSettings() {
			return [
				{
					key: 'hideExactLocation',
					icon: 'location',
					title: '隐藏具体定位',
					desc: '仅展示线路和景点，不公开精确位置',
					enabled: this.shareSettingState.hideExactLocation
				},
				{
					key: 'approvedOnly',
					icon: 'source',
					title: '仅展示已审核内容',
					desc: '不包含待审核或未通过内容',
					enabled: this.shareSettingState.approvedOnly
				},
				{
					key: 'includeXiaojingSummary',
					icon: 'qa',
					title: '带小京讲解摘要',
					desc: '在海报中展示小京生成的讲解摘要',
					enabled: this.shareSettingState.includeXiaojingSummary
				}
			]
		},
		reviewSteps() {
			return [
				{ index: '1', title: '生成预览', active: this.shareArtifacts.length > 0 },
				{ index: '2', title: '提交审核', active: this.reviewSubmissions.length > 0 },
				{ index: '3', title: '审核后公开', active: false }
			]
		},
		currentVisionAgentShareBoundary() {
			const generatedBoundary = this.shareArtifacts
				.map(artifact => artifact && (artifact.visionAgentRealSystemBoundary || safeObject(artifact.publicPreview).publicVisionAgentRealSystemBoundary))
				.find(Boolean)
			if (generatedBoundary) return generatedBoundary
			const journeyDraft = this.getShareJourneyDraft()
			return journeyDraft.visionAgentRealSystemBoundary || safeObject(journeyDraft.visionAgentAutoTraveloguePackage).realSystemBoundaryText || ''
		}
	},
	onShow() {
		this.restoreShareSettings()
		this.shareArtifacts = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey))
		this.reviewSubmissions = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.reviewStorageKey))
	},
	methods: {
		restoreShareSettings() {
			const storedShareSettings = safeObject(uni.getStorageSync(XICHENG_REGION_CONFIG.shareSettingStorageKey))
			this.shareSettingState = normalizeShareSettingState(storedShareSettings)
		},
		persistShareSettings() {
			this.shareSettingState = normalizeShareSettingState(this.shareSettingState)
			uni.setStorageSync(XICHENG_REGION_CONFIG.shareSettingStorageKey, this.shareSettingState)
		},
		getShareJourneyDraft() {
			return safeObject(uni.getStorageSync(XICHENG_REGION_CONFIG.journeyStorageKey))
		},
		createShareAuditSummary(journeyDraft = {}) {
			const reviewReadinessSummary = safeObject(journeyDraft.reviewReadinessSummary)
			const reviewBlockers = safeArray(journeyDraft.reviewBlockers || reviewReadinessSummary.reviewBlockers).slice(0, 12)
			const safetyStatusSummary = safeObject(journeyDraft.safetyStatusSummary)
			return {
				reviewReadinessSummary,
				safetyStatusSummary,
				safetyBlockedCount: toSafeCount(journeyDraft.safetyBlockedCount || safetyStatusSummary.blockedCount),
				safetyUnavailableCount: toSafeCount(journeyDraft.safetyUnavailableCount || safetyStatusSummary.unavailableCount),
				sourceReadinessStatus: journeyDraft.sourceReadinessStatus || reviewReadinessSummary.sourceReadinessStatus || 'UNKNOWN',
				reviewedSourceCount: toSafeCount(journeyDraft.reviewedSourceCount || reviewReadinessSummary.reviewedSourceCount),
				workSourceCount: toSafeCount(journeyDraft.workSourceCount || reviewReadinessSummary.workSourceCount),
				reviewBlockers,
				reviewBlockerCount: reviewBlockers.length
			}
		},
		sanitizePublicMaterialPreview(item = {}) {
			const safetyStatus = normalizeXichengSafetyStatus(item.safetyStatus)
			if (isXichengUnsafeSafetyStatus(safetyStatus)) return null
			return {
				type: item.type || '',
				regionCode: item.regionCode || XICHENG_REGION_CONFIG.regionCode,
				packageCode: item.packageCode || XICHENG_REGION_CONFIG.packageCode,
				poiCode: item.poiCode || '',
				poiName: item.poiName || '',
				sourceLabel: item.sourceLabel || '',
				remarkExcerpt: String(item.remarkExcerpt || '').slice(0, 80),
				hasPhoto: Boolean(item.hasPhoto),
				sourceCount: toSafeCount(item.sourceCount),
				safetyStatus,
				publicLocationLabel: item.publicLocationLabel || '',
				locationHidden: true,
				capturedAt: item.capturedAt || ''
			}
		},
		sanitizePublicStudyEvidencePreview(item = {}) {
			const safetyStatus = normalizeXichengSafetyStatus(item.safetyStatus)
			if (isXichengUnsafeSafetyStatus(safetyStatus)) return null
			return {
				taskId: item.taskId || '',
				taskText: item.taskText || '',
				evidenceType: item.evidenceType || '',
				answerExcerpt: String(item.answerExcerpt || '').slice(0, 80),
				hasPhoto: Boolean(item.hasPhoto),
				safetyStatus,
				completedAt: item.completedAt || ''
			}
		},
		sanitizePublicRouteCheckinPreview(item = {}) {
			const safetyStatus = normalizeXichengSafetyStatus(item.safetyStatus)
			if (isXichengUnsafeSafetyStatus(safetyStatus)) return null
			return {
				checkinId: item.checkinId || '',
				checkinType: item.checkinType || '',
				checkinLabel: item.checkinLabel || '',
				routeTitle: item.routeTitle || '',
				poiCode: item.poiCode || '',
				poiName: item.poiName || '',
				sourceLabel: item.sourceLabel || '',
				safetyStatus,
				checkedInAt: item.checkedInAt || ''
			}
		},
		sanitizePublicCandidateConfirmationSummary(summary = {}) {
			return {
				confirmedPoiNames: safeArray(summary.confirmedPoiNames)
					.map(name => String(name || '').trim())
					.filter(Boolean)
					.slice(0, 5),
				candidateConfirmationCount: toSafeCount(summary.candidateConfirmationCount)
			}
		},
		sanitizePublicRecordingQualityReport(qualityReport = {}) {
			return {
				acceptedTrackPointCount: toSafeCount(qualityReport.acceptedTrackPointCount),
				filteredTrackPointCount: toSafeCount(qualityReport.filteredTrackPointCount),
				lowAccuracyPointCount: toSafeCount(qualityReport.lowAccuracyPointCount),
				abnormalJumpPointCount: toSafeCount(qualityReport.abnormalJumpPointCount),
				usableRate: toSafeCount(qualityReport.usableRate)
			}
		},
		sanitizePublicRecordingSummary(summary = {}) {
			return {
				routeCode: summary.routeCode || '',
				routeTitle: summary.routeTitle || '',
				sessionStatus: summary.sessionStatus || 'idle',
				startedAt: summary.startedAt || '',
				finishedAt: summary.finishedAt || '',
				routePointCount: toSafeCount(summary.routePointCount),
				stayPointCount: toSafeCount(summary.stayPointCount),
				filteredTrackPointCount: toSafeCount(summary.filteredTrackPointCount),
				qualityReport: this.sanitizePublicRecordingQualityReport(summary.qualityReport),
				shareTrackDefault: 'private',
				exactTrackHidden: true
			}
		},
		sanitizePublicVisionAgentPackage(packagePayload = {}) {
			return {
				packageName: packagePayload.packageName || 'AI识境自动素材包',
				taskCount: toSafeCount(packagePayload.taskCount),
				sceneDomainLabels: safeArray(packagePayload.sceneDomainLabels).map(label => String(label || '').trim()).filter(Boolean).slice(0, 8),
				serviceIntentLabels: safeArray(packagePayload.serviceIntentLabels).map(label => String(label || '').trim()).filter(Boolean).slice(0, 8),
				realSystemRequiredTaskCount: toSafeCount(packagePayload.realSystemRequiredTaskCount),
				realSystemRequiredActionTitles: safeArray(packagePayload.realSystemRequiredActionTitles).map(title => String(title || '').trim()).filter(Boolean).slice(0, 5),
				storyCueText: String(packagePayload.storyCueText || '').slice(0, 160),
				mapCueText: String(packagePayload.mapCueText || '').slice(0, 160),
				shareCueText: String(packagePayload.shareCueText || '').slice(0, 160),
				realSystemBoundaryText: String(packagePayload.realSystemBoundaryText || '').slice(0, 160)
			}
		},
		createSharePublicPreview(journeyDraft = {}) {
			const publicPreview = safeObject(journeyDraft.publicPreview)
			const publicMaterials = safeArray(publicPreview.publicMaterials).map(item => this.sanitizePublicMaterialPreview(item)).filter(Boolean).slice(0, 20)
			const publicStudyTaskEvidence = safeArray(publicPreview.publicStudyTaskEvidence).map(item => this.sanitizePublicStudyEvidencePreview(item)).filter(Boolean).slice(0, 20)
			const publicRouteCheckins = safeArray(publicPreview.publicRouteCheckins).map(item => this.sanitizePublicRouteCheckinPreview(item)).filter(Boolean).slice(0, 20)
			const publicVisionAgentAutoTraveloguePackage = this.sanitizePublicVisionAgentPackage(publicPreview.publicVisionAgentAutoTraveloguePackage || journeyDraft.visionAgentAutoTraveloguePackage)
			return {
				publicMaterials,
				publicStudyTaskEvidence,
				publicRouteCheckins,
				publicVisionAgentAutoTraveloguePackage,
				publicVisionAgentRealSystemBoundary: publicVisionAgentAutoTraveloguePackage.realSystemBoundaryText || journeyDraft.visionAgentRealSystemBoundary || '',
				publicCandidateConfirmationSummary: this.sanitizePublicCandidateConfirmationSummary(publicPreview.publicCandidateConfirmationSummary),
				publicRecordingSummary: this.sanitizePublicRecordingSummary(publicPreview.publicRecordingSummary),
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
			const journeyDraft = this.getShareJourneyDraft()
			const auditSummary = this.createShareAuditSummary(journeyDraft)
			const publicPreview = this.createSharePublicPreview(journeyDraft)
			const artifact = {
				artifactId: `share-${assetType}-${Date.now()}`,
				assetType,
				assetLabel: assetType === 'pdf' ? 'PDF 纪念册' : assetType === 'study' ? '亲子研学报告' : '分享海报',
				templateCode: assetType === 'pdf' ? 'xicheng-memorial-pdf-v1' : assetType === 'study' ? 'xicheng-study-report-v1' : 'xicheng-share-poster-v1',
				backgroundImage: this.sharePosterBackground,
				stampImage: this.region.visualAssets.passportStamp,
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				companionName: XICHENG_REGION_CONFIG.companionName,
				draftExcerpt: String(journeyDraft.draft || '').slice(0, 80),
				publicPreview,
				visionAgentAutoTraveloguePackage: publicPreview.publicVisionAgentAutoTraveloguePackage,
				visionAgentRealSystemBoundary: publicPreview.publicVisionAgentRealSystemBoundary,
				reviewEvidencePolicy: {
					rawEvidenceUse: 'local-ops-review-only',
					publicPreviewUse: 'share-review-preview-only',
					exactLocationPolicy: 'raw-review-only',
					photoPathPolicy: 'raw-review-only',
					auditRequired: true,
					publishStatus: 'private'
				},
				auditRequired: true,
				reviewStatus: this.region.reviewStatus.pending,
				publishStatus: 'private',
				visibilityLabel: '待审核 · 未公开',
				privacySettings: normalizeShareSettingState(this.shareSettingState),
				createdAt,
				...auditSummary
			}
			this.shareArtifacts = [artifact, ...this.shareArtifacts].slice(0, 8)
			uni.setStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey, this.shareArtifacts)
			uni.showToast({ title: `${artifact.assetLabel}已生成`, icon: 'none' })
		},
		createPdfShareArtifact() {
			this.createShareArtifact('pdf')
			this.openPdfPrintPage()
		},
		selectPublishChannel(channel = {}) {
			this.selectedPublishChannel = channel.key || 'xinghe'
			if (this.selectedPublishChannel === 'pdf') this.openPdfPrintPage()
		},
		createChannelShareArtifact() {
			const channelAssetTypeMap = { xinghe: 'poster', moments: 'poster', xiaohongshu: 'poster', pdf: 'pdf' }
			this.createShareArtifact(channelAssetTypeMap[this.selectedPublishChannel] || 'poster')
			uni.showToast({ title: '发布素材已生成，请确认后发布', icon: 'none' })
		},
		copyChannelShareCopy() {
			uni.showToast({ title: '文案已复制', icon: 'none' })
		},
		saveChannelShareImage() {
			uni.showToast({ title: '图片已保存到本机预览', icon: 'none' })
		},
		toggleShareSetting(key = '') {
			if (!Object.prototype.hasOwnProperty.call(this.shareSettingState, key)) return
			this.shareSettingState[key] = !this.shareSettingState[key]
			this.persistShareSettings()
		},
		sanitizeShareArtifactForReview(artifact = {}) {
			if (!artifact || !['poster', 'pdf', 'study'].includes(artifact.assetType)) return null
			if (artifact.auditRequired !== true
				|| artifact.publishStatus !== 'private'
				|| artifact.reviewStatus !== XICHENG_REGION_CONFIG.reviewStatus.pending) {
				return null
			}
			const auditSummary = this.createShareAuditSummary(artifact)
			const publicPreview = this.createSharePublicPreview({ publicPreview: artifact.publicPreview, visionAgentAutoTraveloguePackage: artifact.visionAgentAutoTraveloguePackage, visionAgentRealSystemBoundary: artifact.visionAgentRealSystemBoundary })
			return {
				artifactId: artifact.artifactId || '',
				assetType: artifact.assetType,
				assetLabel: artifact.assetLabel || (artifact.assetType === 'pdf' ? 'PDF 纪念册' : artifact.assetType === 'study' ? '亲子研学报告' : '分享海报'),
				templateCode: artifact.templateCode || (artifact.assetType === 'pdf' ? 'xicheng-memorial-pdf-v1' : artifact.assetType === 'study' ? 'xicheng-study-report-v1' : 'xicheng-share-poster-v1'),
				backgroundImage: artifact.backgroundImage || this.sharePosterBackground,
				stampImage: artifact.stampImage || this.region.visualAssets.passportStamp,
				regionCode: artifact.regionCode || XICHENG_REGION_CONFIG.regionCode,
				packageCode: artifact.packageCode || XICHENG_REGION_CONFIG.packageCode,
				sceneCode: artifact.sceneCode || XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: artifact.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
				companionName: artifact.companionName || XICHENG_REGION_CONFIG.companionName,
				draftExcerpt: String(artifact.draftExcerpt || '').slice(0, 80),
				publicPreview,
				visionAgentAutoTraveloguePackage: publicPreview.publicVisionAgentAutoTraveloguePackage,
				visionAgentRealSystemBoundary: publicPreview.publicVisionAgentRealSystemBoundary,
				reviewEvidencePolicy: {
					rawEvidenceUse: 'local-ops-review-only',
					publicPreviewUse: 'share-review-preview-only',
					exactLocationPolicy: 'raw-review-only',
					photoPathPolicy: 'raw-review-only',
					auditRequired: true,
					publishStatus: 'private'
				},
				auditRequired: true,
				reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
				publishStatus: 'private',
				visibilityLabel: '待审核 · 未公开',
				privacySettings: safeObject(artifact.privacySettings),
				createdAt: artifact.createdAt || '',
				...auditSummary
			}
		},
		getReviewableShareArtifacts() {
			return safeArray(this.shareArtifacts)
				.map(artifact => this.sanitizeShareArtifactForReview(artifact))
				.filter(Boolean)
		},
		hasReviewableShareArtifact() {
			return this.getReviewableShareArtifacts().length > 0
		},
		showShareArtifactRequiredToast() {
			uni.showToast({
				title: '请先生成分享产物再提交审核',
				icon: 'none'
			})
		},
		submitReview() {
			const reviewableShareArtifacts = this.getReviewableShareArtifacts()
			if (!this.hasReviewableShareArtifact()) {
				this.showShareArtifactRequiredToast()
				return
			}
			const reviewPayload = {
				reviewId: `review-${Date.now()}`,
				reviewStatus: this.region.reviewStatus.pending,
				posterStatus: reviewableShareArtifacts.some(item => item.assetType === 'poster') ? '已生成' : '待生成',
				pdfStatus: reviewableShareArtifacts.some(item => item.assetType === 'pdf') ? '已生成' : '待生成',
				shareArtifacts: reviewableShareArtifacts,
				shareArtifactCount: reviewableShareArtifacts.length,
				assetTypes: Array.from(new Set(reviewableShareArtifacts.map(item => item.assetType))),
				submittedAt: new Date().toISOString()
			}
			this.reviewSubmissions = [reviewPayload, ...this.reviewSubmissions].slice(0, 8)
			uni.setStorageSync(XICHENG_REGION_CONFIG.reviewStorageKey, this.reviewSubmissions)
			uni.navigateTo({ url: '/pages/xicheng/works/works' })
		},
		openWorks() {
			uni.navigateTo({ url: '/pages/xicheng/works/works' })
		},
		openTravelogueReaderPage() {
			uni.navigateTo({ url: '/pages/xicheng/travelogue-reader/travelogue-reader' })
		},
		openPdfPrintPage() {
			uni.navigateTo({ url: '/pages/xicheng/pdf-print/pdf-print' })
		},
		goBack() {
			const pages = getCurrentPages()
			if (pages.length <= 1) {
				uni.reLaunch({ url: '/pages/xicheng/home/home' })
				return
			}
			uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/xicheng/home/home' }) })
		}
	}
}
</script>

<style scoped>
.xicheng-share {
	min-height: 100vh;
	padding: 24rpx 30rpx 44rpx;
	box-sizing: border-box;
}
.topbar,
.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}
.topbar {
	height: 72rpx;
}
.topbar-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60rpx;
	height: 60rpx;
}
.topbar-title,
.section-title,
.poster-title,
.asset-title {
	font-weight: 800;
	color: #102F29;
}
.topbar-title {
	font-size: 34rpx;
}
.poster-card,
.asset-card,
.vision-agent-share-boundary,
.privacy-card {
	margin-top: 24rpx;
	padding: 28rpx;
	border-radius: 34rpx;
}
.poster-card {
	position: relative;
	min-height: 760rpx;
	overflow: hidden;
}

.share-reference-poster-frame {
	border: 1rpx solid rgba(181, 148, 94, 0.28);
	background:
		linear-gradient(180deg, rgba(255, 252, 246, 0.96), rgba(247, 241, 230, 0.92));
}

.poster-bg {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	opacity: 0.30;
}
.poster-copy {
	position: relative;
	z-index: 1;
	width: 66%;
	padding-top: 58rpx;
}

.poster-brand-pill {
	position: absolute;
	left: 26rpx;
	top: 26rpx;
	z-index: 2;
	display: inline-flex;
	align-items: center;
	gap: 10rpx;
	padding: 10rpx 18rpx;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF9EC;
	font-size: 23rpx;
	font-weight: 800;
}

.poster-kicker,
.section-badge {
	font-size: 22rpx;
	font-weight: 700;
	color: #B5945E;
}
.poster-title {
	display: block;
	margin-top: 18rpx;
	font-size: 60rpx;
	line-height: 1.12;
	letter-spacing: 0;
}
.poster-desc,
.asset-desc,
.privacy-copy {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #746F68;
}

.poster-route-collage {
	position: relative;
	z-index: 1;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16rpx;
	margin-top: 34rpx;
	padding-left: 34rpx;
}

.poster-photo-card {
	position: relative;
	min-height: 178rpx;
	overflow: hidden;
	border-radius: 26rpx;
	background: rgba(255, 252, 246, 0.82);
	box-shadow: 0 16rpx 32rpx rgba(35, 42, 34, 0.12);
}

.poster-photo-card-main {
	grid-row: span 2;
	min-height: 376rpx;
}

.poster-photo-card image {
	width: 100%;
	height: 100%;
	min-height: inherit;
}

.poster-photo-card text {
	position: absolute;
	left: 14rpx;
	top: 14rpx;
	padding: 7rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.90);
	color: #FFF9EC;
	font-size: 21rpx;
	font-weight: 800;
}

.poster-footer {
	position: relative;
	z-index: 1;
	display: grid;
	grid-template-columns: 124rpx 1fr 112rpx;
	align-items: end;
	gap: 16rpx;
	margin-top: 26rpx;
}

.poster-xiaojing {
	width: 124rpx;
	height: 138rpx;
	align-self: end;
}

.poster-bubble {
	align-self: center;
	padding: 18rpx 20rpx;
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.92);
	border: 1rpx solid rgba(181, 148, 94, 0.18);
}

.poster-bubble text {
	display: block;
	font-size: 22rpx;
	line-height: 1.45;
	color: #102F29;
}

.poster-bubble text:first-child {
	font-weight: 800;
}

.poster-scan-code {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 104rpx;
	height: 104rpx;
	padding: 10rpx;
	border-radius: 18rpx;
	background:
		linear-gradient(90deg, #102F29 8rpx, transparent 8rpx) 0 0/24rpx 24rpx,
		linear-gradient(0deg, #102F29 8rpx, transparent 8rpx) 0 0/24rpx 24rpx,
		#FFFDF8;
	border: 1rpx solid rgba(181, 148, 94, 0.28);
	box-sizing: border-box;
}

.poster-scan-code text {
	padding: 4rpx 6rpx;
	border-radius: 8rpx;
	background: rgba(255, 253, 248, 0.92);
	color: #102F29;
	font-size: 18rpx;
	font-weight: 800;
	text-align: center;
}

.asset-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 18rpx;
	margin-top: 24rpx;
}
.asset-tile {
	display: grid;
	gap: 12rpx;
	padding: 22rpx 18rpx;
	border-radius: 28rpx;
	background: rgba(23, 63, 53, 0.08);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
}
.asset-shortcut-row {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 20rpx;
}
.asset-shortcut-row button {
	margin: 0;
}
.asset-title {
	font-size: 26rpx;
	line-height: 1.3;
}

.vision-agent-share-boundary {
	border: 1rpx solid rgba(31, 110, 90, 0.18);
	background: rgba(23, 63, 53, 0.06);
}

.vision-agent-share-boundary-copy {
	display: block;
	margin-top: 14rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #173F35;
}

.share-setting-list {
	display: grid;
	margin-top: 24rpx;
	border-radius: 28rpx;
	overflow: hidden;
	background: rgba(255, 252, 246, 0.62);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
}

.share-setting-row {
	display: grid;
	grid-template-columns: 56rpx 1fr 88rpx;
	align-items: center;
	gap: 16rpx;
	padding: 22rpx 20rpx;
	border-bottom: 1rpx solid rgba(181, 148, 94, 0.14);
}

.share-setting-row:last-child {
	border-bottom: 0;
}

.share-setting-copy {
	min-width: 0;
}

.share-setting-title,
.share-setting-desc {
	display: block;
}

.share-setting-title {
	font-size: 26rpx;
	font-weight: 800;
	color: #102F29;
}

.share-setting-desc {
	margin-top: 5rpx;
	font-size: 22rpx;
	line-height: 1.4;
	color: #746F68;
}

.share-switch {
	position: relative;
	width: 82rpx;
	height: 48rpx;
	border-radius: 999rpx;
	background: rgba(116, 111, 104, 0.18);
	transition: background 160ms ease;
}

.share-switch-thumb {
	position: absolute;
	left: 6rpx;
	top: 6rpx;
	width: 36rpx;
	height: 36rpx;
	border-radius: 999rpx;
	background: #FFFDF8;
	box-shadow: 0 4rpx 12rpx rgba(35, 42, 34, 0.16);
	transition: transform 160ms ease;
}

.share-switch-on {
	background: #173F35;
}

.share-switch-on .share-switch-thumb {
	transform: translateX(34rpx);
}

.share-review-steps {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 24rpx;
}

.review-step {
	display: grid;
	justify-items: center;
	gap: 8rpx;
	padding: 16rpx 10rpx;
	border-radius: 20rpx;
	background: rgba(23, 63, 53, 0.06);
	color: #746F68;
}

.review-step-active {
	background: rgba(181, 148, 94, 0.18);
	color: #173F35;
}

.review-step-index {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40rpx;
	height: 40rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.94);
	font-size: 22rpx;
	font-weight: 800;
}

.review-step-title {
	font-size: 22rpx;
	line-height: 1.3;
	font-weight: 800;
	text-align: center;
}

.privacy-card button {
	margin-top: 24rpx;
}
</style>
