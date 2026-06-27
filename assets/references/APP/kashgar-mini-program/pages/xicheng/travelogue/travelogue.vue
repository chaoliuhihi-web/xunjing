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
				</view>
			</view>
			<text v-else class="empty-copy">从识别结果页点击“开始记录”后，POI、来源和识别置信度会进入这里。</text>
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
			<text class="section-desc">上线后可替换为后端真实城市运营报告。</text>
		</view>
	</view>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'

export const createXichengTravelogueDraft = ({
	materials = [],
	parentChildTasks = XICHENG_REGION_CONFIG.parentChildTasks
} = {}) => {
	const poiNames = Array.from(new Set(
		materials
			.map(material => material && material.poiName ? material.poiName : '')
			.filter(Boolean)
	))
	const routeText = poiNames.length > 0 ? poiNames.join('、') : '白塔寺、西四街巷、什刹海'
	const taskText = parentChildTasks.length > 0 ? parentChildTasks.slice(0, 2).join('；') : '完成现场观察'
	return `今天的西城 Citywalk 从${routeText}展开。小京把识别到的文化点、讲解来源和现场观察整理进旅行素材盒，我们沿途完成了${taskText}。这条路线适合慢慢走、边看边听，把建筑细节、胡同生活和亲子研学发现写进一篇可继续编辑的游记。`
}

export default {
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			routePassport: XICHENG_REGION_CONFIG.routePassport,
			parentChildTasks: XICHENG_REGION_CONFIG.parentChildTasks,
			materials: [],
			draft: '',
			reviewText: XICHENG_REGION_CONFIG.reviewStatus.draft,
			posterStatus: '未生成',
			pdfStatus: '未生成'
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
				pdfStatus: this.pdfStatus
			}
		}
	},
	onLoad(options = {}) {
		this.loadJourney(options)
	},
	methods: {
		loadJourney(options = {}) {
			const storedMaterials = uni.getStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey)
			const materials = Array.isArray(storedMaterials) ? storedMaterials : []
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
					parentChildTasks: this.parentChildTasks
				})
			this.reviewText = cachedDraft && cachedDraft.reviewText ? cachedDraft.reviewText : this.reviewText
			this.posterStatus = cachedDraft && cachedDraft.posterStatus ? cachedDraft.posterStatus : this.posterStatus
			this.pdfStatus = cachedDraft && cachedDraft.pdfStatus ? cachedDraft.pdfStatus : this.pdfStatus
			this.saveDraft({ silent: true })
		},
		saveDraft({ silent = false } = {}) {
			const payload = {
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				draft: this.draft,
				materials: this.materials,
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
			this.saveDraft({ silent: true })
			uni.showToast({
				title: '分享海报已生成',
				icon: 'none'
			})
		},
		exportMemorialPdf() {
			this.pdfStatus = 'PDF纪念册已生成'
			this.saveDraft({ silent: true })
			uni.showToast({
				title: 'PDF纪念册已生成',
				icon: 'none'
			})
		},
		submitReview() {
			this.reviewText = XICHENG_REGION_CONFIG.reviewStatus.pending
			this.saveDraft({ silent: true })
			uni.showToast({
				title: '作品审核已提交',
				icon: 'none'
			})
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

.material-meta {
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
</style>
