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

		<view class="hero xicheng-paper-card">
			<text class="hero-kicker">今日记录</text>
			<text class="hero-title">{{ footprintTitle }}</text>
			<text class="hero-desc">识别、问答、路线打卡会沉淀为可审核素材，再生成今日游记。</text>
			<view class="metric-grid">
				<view class="metric-card">
					<text class="metric-value">{{ materialCount }}</text>
					<text class="metric-label">素材</text>
				</view>
				<view class="metric-card">
					<text class="metric-value">{{ checkinCount }}</text>
					<text class="metric-label">打卡</text>
				</view>
				<view class="metric-card">
					<text class="metric-value">{{ reviewedSourceCount }}</text>
					<text class="metric-label">来源</text>
				</view>
			</view>
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
						<text class="timeline-title">{{ item.title }}</text>
						<text class="timeline-desc">{{ item.desc }}</text>
						<text class="timeline-time">{{ item.time }}</text>
					</view>
				</view>
			</view>
			<text v-else class="empty-copy">完成一次识别、路线记录或小京问答后，这里会出现可生成游记的足迹。</text>
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
			routeCheckins: []
		}
	},
	computed: {
		materialCount() {
			return this.materials.length
		},
		checkinCount() {
			return this.routeCheckins.length
		},
		reviewedSourceCount() {
			return this.materials.reduce((count, item) => count + Number(item.sourceCount || 0), 0)
		},
		footprintTitle() {
			return this.materialCount + this.checkinCount > 0 ? '已收集真实西城素材' : '从一次识别开始'
		},
		timelineItems() {
			const materialItems = this.materials.slice(0, 6).map((item, index) => ({
				id: `material-${index}-${item.createdAt || item.poiCode || item.type}`,
				icon: item.type === 'ai-guide' ? 'qa' : 'source',
				title: item.poiName || item.sourceLabel || '西城素材',
				desc: item.aiAnswerExcerpt || item.remark || item.sourceLabel || '已进入本地素材盒',
				time: formatTime(item.createdAt)
			}))
			const checkinItems = this.routeCheckins.slice(0, 6).map((item, index) => ({
				id: `checkin-${index}-${item.createdAt || item.poiCode}`,
				icon: 'record',
				title: item.poiName || '路线打卡',
				desc: item.routeTitle || item.routeCode || '路线记录节点',
				time: formatTime(item.createdAt)
			}))
			return [...materialItems, ...checkinItems]
				.sort((a, b) => String(b.time).localeCompare(String(a.time)))
				.slice(0, 8)
		}
	},
	onShow() {
		this.loadFootprint()
	},
	methods: {
		loadFootprint() {
			this.materials = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey))
			this.routeCheckins = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.checkinStorageKey))
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
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 24rpx;
}
.metric-card {
	padding: 18rpx;
	border-radius: 24rpx;
	background: rgba(23, 63, 53, 0.08);
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
.timeline-list {
	display: grid;
	gap: 18rpx;
	margin-top: 24rpx;
}
.timeline-row {
	display: grid;
	grid-template-columns: 64rpx 1fr;
	gap: 18rpx;
	padding-bottom: 18rpx;
	border-bottom: 1rpx solid rgba(181, 148, 94, 0.18);
}
.timeline-icon {
	padding-top: 2rpx;
}
.timeline-title {
	font-size: 28rpx;
	font-weight: 700;
	color: #102F29;
}
.bottom-actions {
	margin-top: 26rpx;
}
.bottom-actions button {
	flex: 1;
}
</style>
