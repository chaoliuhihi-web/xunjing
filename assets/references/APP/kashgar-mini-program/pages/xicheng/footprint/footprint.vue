<template>
	<view class="xicheng-footprint xicheng-designed-page xicheng-bottom-safe">
		<view class="topbar">
			<view class="topbar-back" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="topbar-title">我的西城足迹</text>
			<view class="topbar-back" @click="openTravelogue">
				<xicheng-icon name="travelogue" variant="plain" :size="21" />
			</view>
		</view>

		<view class="hero footprint-reference-hero xicheng-paper-card">
			<image class="hero-companion" :src="region.companionAvatar" mode="aspectFit" />
			<view class="hero-copy">
				<text class="hero-kicker">今日记录</text>
				<text class="hero-title">{{ footprintTitle }}</text>
				<text class="hero-desc">这些片段可以生成你的游记，公开前会先进入审核。</text>
			</view>
			<view class="metric-grid">
				<view class="metric-card">
					<xicheng-icon name="photo" variant="primary" :size="18" />
					<text class="metric-value">{{ materialCount }}</text>
					<text class="metric-label">素材</text>
				</view>
				<view class="metric-card">
					<xicheng-icon name="qa" variant="primary" :size="18" />
					<text class="metric-value">{{ checkinCount }}</text>
					<text class="metric-label">打卡</text>
				</view>
				<view class="metric-card">
					<xicheng-icon name="source" variant="primary" :size="18" />
					<text class="metric-value">{{ reviewedSourceCount }}</text>
					<text class="metric-label">来源</text>
				</view>
				<view class="metric-card">
					<xicheng-icon name="scan" variant="primary" :size="18" />
					<text class="metric-value">{{ visionAgentServiceTaskCount }}</text>
					<text class="metric-label">AI任务</text>
				</view>
			</view>
		</view>

		<view class="footprint-filter-row">
			<text v-for="tab in footprintTabs" :key="tab" class="footprint-filter-chip">{{ tab }}</text>
		</view>

		<view class="timeline xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">足迹时间线</text>
				<text class="section-badge">{{ timelineItems.length }} 条</text>
			</view>
			<view v-if="timelineItems.length > 0" class="timeline-list">
				<view v-for="item in timelineItems" :key="item.id" class="timeline-row">
					<view class="timeline-icon">
						<xicheng-icon :name="item.icon" variant="primary" :size="18" />
					</view>
					<view class="timeline-copy">
						<view class="timeline-title-row">
							<text class="timeline-title">{{ item.title }}</text>
							<text class="timeline-type">{{ item.typeLabel }}</text>
						</view>
						<text class="timeline-desc">{{ item.desc }}</text>
						<text class="timeline-time">{{ item.time }}</text>
					</view>
				</view>
			</view>
			<view v-else class="footprint-empty-state">
				<text class="empty-copy">完成一次识别、路线记录或小京问答后，这里会出现可生成游记的足迹。</text>
				<view class="footprint-empty-steps">
					<view v-for="step in timelinePreviewItems" :key="step.title" class="footprint-empty-step">
						<xicheng-icon :name="step.icon" variant="soft" :size="18" />
						<view>
							<text class="empty-step-title">{{ step.title }}</text>
							<text class="empty-step-desc">{{ step.desc }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="footprint-draft-card xicheng-paper-card">
			<view>
				<text class="draft-kicker">游记草稿</text>
				<text class="draft-title">只使用可审核素材生成</text>
				<text class="draft-desc">照片、问答、路线打卡和AI识境任务会带来源进入草稿，不会公开精确定位。</text>
			</view>
			<button class="draft-button xicheng-primary-action" @click="openTravelogue">生成</button>
		</view>

		<view class="bottom-actions">
			<button class="primary-button xicheng-primary-action" @click="openTravelogue">生成今日游记</button>
			<button class="ghost-button xicheng-secondary-action" @click="openPassport">路线护照</button>
		</view>
	</view>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'

const safeArray = value => Array.isArray(value) ? value : []
const formatTime = value => value ? String(value).slice(0, 16).replace('T', ' ') : '刚刚'

export default {
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			materials: [],
			routeCheckins: [],
			visionAgentServiceTasks: []
		}
	},
	computed: {
		footprintTabs() {
			return ['全部', '识别', '问答', '路线', 'AI识境']
		},
		materialCount() {
			return this.materials.length
		},
		checkinCount() {
			return this.routeCheckins.length
		},
		visionAgentServiceTaskCount() {
			return this.visionAgentServiceTasks.length
		},
		reviewedSourceCount() {
			return this.materials.reduce((count, item) => count + Number(item.sourceCount || 0), 0)
		},
		footprintTitle() {
			return this.materialCount + this.checkinCount + this.visionAgentServiceTaskCount > 0 ? '已收集真实西城素材' : '从一次识别开始'
		},
		timelineItems() {
			const materialItems = this.materials.slice(0, 6).map((item, index) => ({
				id: `material-${index}-${item.createdAt || item.poiCode || item.type}`,
				icon: item.type === 'ai-guide' ? 'qa' : 'source',
				typeLabel: item.type === 'ai-guide' ? 'AI 问答' : '识别',
				title: item.poiName || item.sourceLabel || '西城素材',
				desc: item.aiAnswerExcerpt || item.remark || item.sourceLabel || '已进入本地素材盒',
				time: formatTime(item.createdAt)
			}))
			const checkinItems = this.routeCheckins.slice(0, 6).map((item, index) => ({
				id: `checkin-${index}-${item.createdAt || item.poiCode}`,
				icon: 'record',
				typeLabel: '路线',
				title: item.poiName || '路线打卡',
				desc: item.routeTitle || item.routeCode || '路线记录节点',
				time: formatTime(item.createdAt)
			}))
			const visionAgentTaskItems = this.visionAgentServiceTasks.slice(0, 6).map((task, index) => ({
				id: `vision-agent-task-${index}-${task.id || task.createdAt || task.actionKey}`,
				icon: task.taskType === 'merchant' ? 'source' : task.taskType === 'route' ? 'route' : 'scan',
				typeLabel: 'AI识境任务',
				title: task.actionTitle || task.actionCopy || 'AI识境后续动作',
				desc: this.formatVisionAgentFootprintTaskDesc(task),
				time: formatTime(task.createdAt)
			}))
			return [...materialItems, ...checkinItems, ...visionAgentTaskItems]
				.sort((a, b) => String(b.time).localeCompare(String(a.time)))
				.slice(0, 10)
		},
		timelinePreviewItems() {
			return [
				{ icon: 'scan', title: '拍照识别文化点', desc: '匹配官方 POI 与已审核来源' },
				{ icon: 'qa', title: '问小京补充故事', desc: '回答会带来源进入素材盒' },
				{ icon: 'route', title: '完成路线打卡', desc: '生成路线护照和游记线索' },
				{ icon: 'scan', title: '执行AI识境任务', desc: '商家、路线、成长和Agent动作会进入足迹' }
			]
		}
	},
	onShow() {
		this.loadFootprint()
	},
	methods: {
		loadVisionAgentFootprintTasks() {
			const storedTasks = uni.getStorageSync(XICHENG_REGION_CONFIG.visionAgentServiceTasksStorageKey)
			this.visionAgentServiceTasks = safeArray(storedTasks)
				.filter(task => task && typeof task === 'object')
				.slice(0, 50)
			return this.visionAgentServiceTasks
		},
		formatVisionAgentFootprintTaskDesc(task = {}) {
			const poiName = task.poiName || '当前场景'
			const taskTypeLabel = task.taskTypeLabel || (task.taskType === 'merchant' ? '商家' : task.taskType === 'route' ? '路线' : task.taskType === 'growth' ? '成长' : task.taskType === 'agent' ? 'Agent' : '服务')
			const serviceIntentLabel = task.serviceIntentLabel ? ` · ${task.serviceIntentLabel}` : ''
			const actionPrompt = task.actionPrompt ? ` · ${String(task.actionPrompt).slice(0, 28)}` : ''
			const statusText = task.statusText || '已收进任务包'
			return `${poiName} · ${taskTypeLabel}${serviceIntentLabel}${actionPrompt} · ${statusText}`
		},
		loadFootprint() {
			this.materials = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey))
			this.routeCheckins = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.checkinStorageKey))
			this.loadVisionAgentFootprintTasks()
		},
		openTravelogue() {
			uni.navigateTo({ url: '/pages/xicheng/travelogue/travelogue?mode=footprint' })
		},
		openPassport() {
			uni.navigateTo({ url: '/pages/xicheng/passport/passport' })
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
.xicheng-footprint {
	min-height: 100vh;
	padding: 24rpx 30rpx 44rpx;
	box-sizing: border-box;
}
.topbar,
.section-head,
.bottom-actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}
.topbar {
	height: 72rpx;
}
.topbar-title {
	font-size: 34rpx;
	font-weight: 800;
	color: #102F29;
}
.topbar-back {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60rpx;
	height: 60rpx;
}
.hero,
.timeline {
	margin-top: 24rpx;
	padding: 30rpx;
	border-radius: 34rpx;
}

.footprint-reference-hero {
	position: relative;
	min-height: 330rpx;
	overflow: hidden;
	padding: 34rpx 30rpx 30rpx 238rpx;
	background:
		linear-gradient(90deg, rgba(255, 252, 246, 0.96), rgba(255, 252, 246, 0.82)),
		linear-gradient(135deg, rgba(181, 148, 94, 0.15), rgba(23, 63, 53, 0.08));
}

.footprint-reference-hero::after {
	content: "";
	position: absolute;
	right: 0;
	top: 0;
	width: 320rpx;
	height: 240rpx;
	background: radial-gradient(circle at 70% 20%, rgba(181, 148, 94, 0.16), transparent 58%);
	pointer-events: none;
}

.hero-companion {
	position: absolute;
	left: 18rpx;
	bottom: -8rpx;
	width: 218rpx;
	height: 286rpx;
}

.hero-copy {
	position: relative;
	z-index: 1;
	min-height: 132rpx;
}

.hero-kicker,
.section-badge {
	font-size: 24rpx;
	font-weight: 700;
	color: #B5945E;
}
.hero-title {
	display: block;
	margin-top: 14rpx;
	font-size: 46rpx;
	font-weight: 800;
	color: #102F29;
}
.hero-desc,
.empty-copy,
.timeline-desc,
.timeline-time {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #746F68;
}
.metric-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 24rpx;
}
.metric-card {
	display: grid;
	justify-items: start;
	gap: 8rpx;
	padding: 18rpx;
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.84);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
}
.metric-value,
.metric-label,
.section-title,
.timeline-title {
	display: block;
}
.metric-value {
	font-size: 36rpx;
	font-weight: 800;
	color: #173F35;
}
.metric-label {
	margin-top: 6rpx;
	font-size: 22rpx;
	color: #746F68;
}
.section-title {
	font-size: 32rpx;
	font-weight: 800;
	color: #102F29;
}

.footprint-filter-row {
	display: flex;
	gap: 16rpx;
	margin-top: 24rpx;
	overflow: hidden;
}

.footprint-filter-chip {
	padding: 16rpx 28rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.72);
	color: #746F68;
	font-size: 25rpx;
	font-weight: 700;
	box-shadow: 0 10rpx 24rpx rgba(35, 42, 34, 0.06);
}

.footprint-filter-chip:first-child {
	background: #173F35;
	color: #FFF9EC;
}

.timeline-list {
	display: grid;
	gap: 18rpx;
	margin-top: 24rpx;
}
.timeline-row {
	position: relative;
	display: grid;
	grid-template-columns: 76rpx 1fr;
	gap: 18rpx;
	padding-bottom: 18rpx;
	border-bottom: 1rpx solid rgba(181, 148, 94, 0.18);
}

.timeline-row::before {
	content: "";
	position: absolute;
	left: 31rpx;
	top: 68rpx;
	bottom: -6rpx;
	width: 2rpx;
	background: rgba(181, 148, 94, 0.24);
}

.timeline-row:last-child::before {
	display: none;
}

.timeline-icon {
	padding-top: 2rpx;
}

.timeline-title-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.timeline-title {
	font-size: 28rpx;
	font-weight: 700;
	color: #102F29;
}

.timeline-type {
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.08);
	color: #173F35;
	font-size: 21rpx;
	font-weight: 700;
	white-space: nowrap;
}

.footprint-empty-state {
	margin-top: 20rpx;
}

.footprint-empty-steps {
	display: grid;
	gap: 14rpx;
	margin-top: 20rpx;
}

.footprint-empty-step {
	display: grid;
	grid-template-columns: 56rpx 1fr;
	gap: 16rpx;
	align-items: center;
	padding: 18rpx;
	border-radius: 22rpx;
	background: rgba(23, 63, 53, 0.06);
}

.empty-step-title,
.empty-step-desc,
.draft-kicker,
.draft-title,
.draft-desc {
	display: block;
}

.empty-step-title {
	font-size: 25rpx;
	font-weight: 800;
	color: #102F29;
}

.empty-step-desc {
	margin-top: 4rpx;
	font-size: 22rpx;
	line-height: 1.4;
	color: #746F68;
}

.footprint-draft-card {
	display: grid;
	grid-template-columns: 1fr 138rpx;
	align-items: center;
	gap: 22rpx;
	margin-top: 24rpx;
	padding: 26rpx;
	border-radius: 30rpx;
}

.draft-kicker {
	font-size: 22rpx;
	font-weight: 800;
	color: #B5945E;
}

.draft-title {
	margin-top: 6rpx;
	font-size: 30rpx;
	font-weight: 800;
	color: #102F29;
}

.draft-desc {
	margin-top: 8rpx;
	font-size: 23rpx;
	line-height: 1.45;
	color: #746F68;
}

.draft-button {
	min-height: 76rpx;
	margin: 0;
	padding: 0;
	border-radius: 999rpx;
	font-size: 26rpx;
	line-height: 76rpx;
}

.draft-button::after {
	border: 0;
}

.bottom-actions {
	margin-top: 26rpx;
}
.bottom-actions button {
	flex: 1;
}
</style>
