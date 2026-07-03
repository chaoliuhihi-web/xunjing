<template>
	<view class="xicheng-share xicheng-designed-page xicheng-bottom-safe">
		<view class="topbar">
			<view class="topbar-button" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="topbar-title">游记发布</text>
			<view class="topbar-button" @click="openWorks">
				<xicheng-icon name="mine" variant="plain" :size="21" />
			</view>
		</view>

		<view class="publish-summary-card xicheng-paper-card">
			<image class="publish-summary-cover" :src="region.visualAssets.heroLandmark" mode="aspectFill" />
			<view class="publish-summary-copy">
				<view class="publish-summary-head">
					<text class="publish-summary-kicker">发布游记</text>
					<text class="publish-summary-status">待发布</text>
				</view>
				<text class="publish-summary-title">在白塔下遇见西城</text>
				<text class="publish-summary-desc">清晨的白塔寺，慢慢走过胡同与湖水，生成可发布的纪念游记。</text>
				<view class="publish-summary-metrics">
					<view class="publish-summary-chip">
						<xicheng-icon name="location" variant="soft" :size="15" />
						<text>3 个地点</text>
					</view>
					<view class="publish-summary-chip">
						<xicheng-icon name="eye" variant="soft" :size="15" />
						<text>精确轨迹已隐藏</text>
					</view>
					<view class="publish-summary-chip">
						<xicheng-icon name="source" variant="soft" :size="15" />
						<text>来源已审核</text>
					</view>
				</view>
			</view>
		</view>

		<xicheng-publish-channel-grid :selected-key="selectedPublishChannel" :selected-keys="selectedPublishChannels" :selected-count="selectedPublishChannelCount" @toggle="togglePublishChannel" @select="selectPublishChannel" />
		<xicheng-publish-preflight-panel :items="publishPreflightItems" :selected-channel="selectedPublishChannel" />
		<xicheng-publish-confirm-queue :items="publishConfirmationQueue" :focused-channel="selectedPublishChannel" @focus="focusPublishChannel" @confirm="confirmPublishQueueItem" />
		<xicheng-social-share-preview v-if="['moments', 'xiaohongshu'].includes(selectedPublishChannel)" :channel="selectedPublishChannel" :cover-image="sharePosterBackground" :title="region.sharePoster.title" @copy="copyChannelShareCopy" @save-image="saveChannelShareImage" @confirm="createChannelShareArtifact" />
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
		<xicheng-share-asset-panel :artifact-count="shareArtifacts.length" @create-moments="createChannelShareArtifact('moments')" @create-xiaohongshu="createChannelShareArtifact('xiaohongshu')" @create-pdf="createPdfShareArtifact" @open-reader="openTravelogueReaderPage" @open-pdf="openPdfPrintPage" />

		<view v-if="currentVisionAgentShareBoundary" class="vision-agent-share-boundary xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">AI识境服务边界</text>
				<text class="section-badge">真实系统待确认</text>
			</view>
			<text class="vision-agent-share-boundary-copy">{{ currentVisionAgentShareBoundary }}</text>
		</view>

		<xicheng-share-privacy-review-panel :settings="shareSettings" :review-steps="reviewSteps" @toggle-setting="toggleShareSetting" @submit-review="submitReview" />
	</view>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import { isXichengUnsafeSafetyStatus, normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'
import { decodeXichengRouteValue } from '@/request/xunjing/routeParams.js'
import { getXichengShareChannelAssetLabel, getXichengShareChannelAssetType, getXichengShareChannelTemplateCode, normalizeXichengSharePublishChannel } from '@/request/xunjing/shareAssets.js'
import XichengPublishChannelGrid from '@/components/xicheng/XichengPublishChannelGrid.vue'
import XichengPublishConfirmQueue from '@/components/xicheng/XichengPublishConfirmQueue.vue'
import XichengPublishPreflightPanel from '@/components/xicheng/XichengPublishPreflightPanel.vue'
import XichengShareAssetPanel from '@/components/xicheng/XichengShareAssetPanel.vue'
import XichengSharePrivacyReviewPanel from '@/components/xicheng/XichengSharePrivacyReviewPanel.vue'
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
	includeXiaojingSummary: true,
	publicBody: true,
	publicPlaces: true,
	publicPhotos: true,
	publicQaRecord: false
})

const normalizeShareSettingState = (settings = {}) => ({
	hideExactLocation: settings.hideExactLocation !== false,
	approvedOnly: settings.approvedOnly !== false,
	includeXiaojingSummary: settings.includeXiaojingSummary !== false,
	publicBody: settings.publicBody !== false,
	publicPlaces: settings.publicPlaces !== false,
	publicPhotos: settings.publicPhotos !== false,
	publicQaRecord: settings.publicQaRecord === true
})

export default {
	components: {
		XichengPublishChannelGrid,
		XichengPublishConfirmQueue,
		XichengPublishPreflightPanel,
		XichengShareAssetPanel,
		XichengSharePrivacyReviewPanel,
		XichengSocialSharePreview
	},
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			shareArtifacts: [],
			reviewSubmissions: [],
			selectedPublishChannel: 'xinghe',
			selectedPublishChannels: ['xinghe', 'moments', 'xiaohongshu', 'pdf'],
			shareSettingState: { ...XICHENG_DEFAULT_SHARE_SETTING_STATE }
		}
	},
	computed: {
		selectedPublishChannelCount() {
			return this.selectedPublishChannels.length
		},
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
				{ index: '2', title: '发布前检查', active: this.reviewSubmissions.length > 0 },
				{ index: '3', title: '审核后公开', active: false }
			]
		},
		publishConfirmationQueue() {
			return this.selectedPublishChannels.map(channelKey => this.createPublishConfirmationQueueItem(channelKey))
		},
		publishPreflightItems() {
			const journeyDraft = this.getShareJourneyDraft()
			const auditSummary = this.createShareAuditSummary(journeyDraft)
			const reviewedSourceCount = toSafeCount(auditSummary.reviewedSourceCount)
			const selectedArtifactCount = this.getSelectedChannelArtifactCount()
			const selectedAssetType = getXichengShareChannelAssetType(this.selectedPublishChannel)
			const selectedAssetLabel = getXichengShareChannelAssetLabel(this.selectedPublishChannel, selectedAssetType)
			return [
				{
					key: 'privacy',
					icon: 'location',
					title: '隐私范围',
					status: this.shareSettingState.hideExactLocation ? '精确位置已隐藏' : '请隐藏精确位置',
					desc: '公开页只展示 POI 范围、路线摘要和必要照片',
					ready: this.shareSettingState.hideExactLocation
				},
				{
					key: 'sources',
					icon: 'source',
					title: '已审核来源',
					status: reviewedSourceCount > 0 ? `${reviewedSourceCount} 条来源可公开` : '来源待补充',
					desc: this.shareSettingState.approvedOnly ? '仅展示已审核内容' : '建议开启仅展示已审核内容',
					ready: reviewedSourceCount > 0 && this.shareSettingState.approvedOnly
				},
				{
					key: 'asset',
					icon: selectedAssetType === 'pdf' ? 'source' : 'photo',
					title: '素材生成',
					status: selectedArtifactCount > 0 ? `${selectedAssetLabel}素材已准备` : '待生成素材',
					desc: '先生成图片、文案、标签或 PDF 后再发布',
					ready: selectedArtifactCount > 0
				},
				{
					key: 'confirm',
					icon: 'check',
					title: '用户确认',
					status: '系统分享确认',
					desc: '朋友圈、小红书和 PDF 均由系统分享或平台 SDK 确认',
					ready: true
				}
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
	onLoad(options = {}) {
		const routeChannel = normalizeXichengSharePublishChannel(decodeXichengRouteValue(options.channel))
		this.selectedPublishChannel = routeChannel
		this.selectedPublishChannels = Array.from(new Set([routeChannel, ...this.selectedPublishChannels]))
	},
	onShow() {
		uni.setNavigationBarTitle({ title: '游记发布' })
		this.restoreShareSettings()
		this.selectedPublishChannels = Array.from(new Set([this.selectedPublishChannel, ...this.selectedPublishChannels]))
		this.shareArtifacts = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey))
		this.reviewSubmissions = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.reviewStorageKey))
	},
	methods: {
		restoreShareSettings() {
			const storedShareSettings = safeObject(uni.getStorageSync(XICHENG_REGION_CONFIG.shareSettingStorageKey))
			this.shareSettingState = normalizeShareSettingState(storedShareSettings)
			if (Array.isArray(storedShareSettings.selectedPublishChannels) && storedShareSettings.selectedPublishChannels.length > 0) {
				this.selectedPublishChannels = storedShareSettings.selectedPublishChannels
					.map(channelKey => normalizeXichengSharePublishChannel(channelKey))
					.filter((channelKey, index, list) => list.indexOf(channelKey) === index)
			}
		},
		persistShareSettings() {
			this.shareSettingState = normalizeShareSettingState(this.shareSettingState)
			uni.setStorageSync(XICHENG_REGION_CONFIG.shareSettingStorageKey, {
				...this.shareSettingState,
				selectedPublishChannels: this.selectedPublishChannels
			})
		},
		savePublishSettings() {
			this.persistShareSettings()
			uni.showToast({ title: '发布设置已保存', icon: 'none' })
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
			const safePackagePayload = safeObject(packagePayload)
			return {
				packageName: safePackagePayload.packageName || 'AI识境自动素材包',
				taskCount: toSafeCount(safePackagePayload.taskCount),
				sceneDomainLabels: safeArray(safePackagePayload.sceneDomainLabels).map(label => String(label || '').trim()).filter(Boolean).slice(0, 8),
				serviceIntentLabels: safeArray(safePackagePayload.serviceIntentLabels).map(label => String(label || '').trim()).filter(Boolean).slice(0, 8),
				realSystemRequiredTaskCount: toSafeCount(safePackagePayload.realSystemRequiredTaskCount),
				realSystemRequiredActionTitles: safeArray(safePackagePayload.realSystemRequiredActionTitles).map(title => String(title || '').trim()).filter(Boolean).slice(0, 5),
				storyCueText: String(safePackagePayload.storyCueText || '').slice(0, 160),
				mapCueText: String(safePackagePayload.mapCueText || '').slice(0, 160),
				shareCueText: String(safePackagePayload.shareCueText || '').slice(0, 160),
				realSystemBoundaryText: String(safePackagePayload.realSystemBoundaryText || '').slice(0, 160)
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
			const publishChannel = normalizeXichengSharePublishChannel(this.selectedPublishChannel, assetType)
			const artifact = {
				artifactId: `share-${publishChannel}-${assetType}-${Date.now()}`,
				assetType,
				assetLabel: getXichengShareChannelAssetLabel(publishChannel, assetType),
				templateCode: getXichengShareChannelTemplateCode(publishChannel, assetType),
				publishChannel,
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
		getPublishChannelIcon(channelKey = '') {
			if (channelKey === 'moments') return 'photo'
			if (channelKey === 'xiaohongshu') return 'edit'
			if (channelKey === 'pdf') return 'source'
			return 'travelogue'
		},
		createPublishConfirmationQueueItem(channelKey) {
			const publishChannel = normalizeXichengSharePublishChannel(channelKey)
			const assetType = getXichengShareChannelAssetType(publishChannel)
			const artifactCount = this.getSelectedChannelArtifactCount(channelKey)
			const assetLabel = getXichengShareChannelAssetLabel(publishChannel, assetType)
			return {
				key: publishChannel,
				icon: this.getPublishChannelIcon(publishChannel),
				label: assetLabel,
				desc: publishChannel === 'pdf' ? '保存 PDF 后可系统打印或分享' : '生成素材后进入系统分享确认',
				assetType,
				assetReady: artifactCount > 0,
				statusText: artifactCount > 0 ? '素材已生成' : '待生成素材',
				actionText: artifactCount > 0 ? '继续确认' : '生成素材'
			}
		},
		createPdfShareArtifact() {
			this.selectedPublishChannel = 'pdf'
			this.createShareArtifact('pdf')
			this.openPdfPrintPage()
		},
		selectPublishChannel(channel = {}) {
			const channelKey = typeof channel === 'string' ? channel : channel.key
			if (this.isPublishActionCard(channelKey)) {
				this.handlePublishAction(channelKey)
				return
			}
			this.selectedPublishChannel = channelKey || 'xinghe'
		},
		isPublishActionCard(channelKey = '') {
			return ['save', 'publish'].includes(channelKey)
		},
		togglePublishChannel(channel = {}) {
			const channelKey = normalizeXichengSharePublishChannel(channel.key)
			const selectedChannelSet = new Set(this.selectedPublishChannels)
			if (selectedChannelSet.has(channelKey) && selectedChannelSet.size > 1) {
				selectedChannelSet.delete(channelKey)
			} else {
				selectedChannelSet.add(channelKey)
			}
			this.selectedPublishChannels = Array.from(selectedChannelSet)
			this.selectedPublishChannel = channelKey
			this.persistShareSettings()
		},
		createSelectedChannelShareArtifacts() {
			const previewChannel = this.selectedPublishChannel
			this.selectedPublishChannels.forEach(channelKey => {
				this.selectedPublishChannel = channelKey
				this.createShareArtifact(getXichengShareChannelAssetType(channelKey))
			})
			this.selectedPublishChannel = previewChannel
			this.focusNextPublishConfirmationChannel()
			uni.showToast({ title: '已生成所选渠道素材，请逐项确认发布', icon: 'none' })
		},
		handlePublishAction(event = {}) {
			const publishAction = typeof event === 'string' ? event : event.publishAction
			if (publishAction === 'publish') {
				this.createSelectedChannelShareArtifacts()
				return
			}
			if (publishAction === 'save') {
				this.savePublishSettings()
			}
		},
		createChannelShareArtifact(channelKey = '') {
			const requestedChannel = typeof channelKey === 'string' && channelKey ? channelKey : this.selectedPublishChannel
			this.selectedPublishChannel = requestedChannel
			this.createShareArtifact(getXichengShareChannelAssetType(requestedChannel))
			uni.showToast({ title: '发布素材已生成，请确认后发布', icon: 'none' })
		},
		getSelectedChannelArtifactCount(channelKey = this.selectedPublishChannel) {
			const selectedChannel = normalizeXichengSharePublishChannel(channelKey)
			const selectedAssetType = getXichengShareChannelAssetType(selectedChannel)
			return safeArray(this.shareArtifacts).filter(artifact => {
				if (!artifact) return false
				const artifactAssetType = artifact.assetType || ''
				const artifactChannel = normalizeXichengSharePublishChannel(artifact.publishChannel, artifactAssetType)
				if (artifact.publishChannel) return artifactChannel === selectedChannel
				return selectedChannel === 'pdf' ? artifactAssetType === 'pdf' : artifactAssetType === selectedAssetType
			}).length
		},
		focusPublishChannel(item = {}) {
			this.selectedPublishChannel = normalizeXichengSharePublishChannel(item.key)
		},
		focusNextPublishConfirmationChannel() {
			const nextItem = this.publishConfirmationQueue.find(item => ['moments', 'xiaohongshu'].includes(item.key))
				|| this.publishConfirmationQueue.find(item => item.key === 'xinghe')
				|| this.publishConfirmationQueue[0]
			if (nextItem) this.selectedPublishChannel = normalizeXichengSharePublishChannel(nextItem.key)
		},
		confirmPublishQueueItem(item = {}) {
			this.selectedPublishChannel = normalizeXichengSharePublishChannel(item.key)
			if (this.selectedPublishChannel === 'pdf') {
				if (this.getSelectedChannelArtifactCount(this.selectedPublishChannel) <= 0) this.createShareArtifact('pdf')
				this.openPdfPrintPage()
				return
			}
			this.createChannelShareArtifact(this.selectedPublishChannel)
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
			const publishChannel = normalizeXichengSharePublishChannel(artifact.publishChannel, artifact.assetType)
			return {
				artifactId: artifact.artifactId || '',
				assetType: artifact.assetType,
				assetLabel: artifact.assetLabel || getXichengShareChannelAssetLabel(publishChannel, artifact.assetType),
				templateCode: artifact.templateCode || getXichengShareChannelTemplateCode(publishChannel, artifact.assetType),
				publishChannel,
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
				title: '请先生成发布素材再进行发布前检查',
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

<style scoped src="./share.css"></style>
