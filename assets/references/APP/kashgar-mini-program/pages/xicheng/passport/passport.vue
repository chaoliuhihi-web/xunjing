<template>
	<view class="xicheng-passport xicheng-designed-page xicheng-bottom-safe">
		<view class="topbar">
			<view class="topbar-button" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="topbar-title">路线护照</text>
			<view class="topbar-button" @click="openRecording">
				<xicheng-icon name="record" variant="plain" :size="21" />
			</view>
		</view>

		<view class="passport-hero xicheng-paper-card">
			<image class="passport-stamp" :src="passportStampImage" mode="aspectFit" />
			<view class="passport-copy">
				<text class="passport-kicker">route-passport-stamp.png</text>
				<text class="passport-title">{{ passportTitle }}</text>
				<text class="passport-desc">{{ region.routePassport.thresholdText }}</text>
			</view>
		</view>

		<view class="progress-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">打卡进度</text>
				<text class="section-badge">{{ completedCheckins }}/{{ targetCheckinCount }}</text>
			</view>
			<view class="progress-bar">
				<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
			</view>
			<view class="stamp-grid">
				<view v-for="stamp in stampSlots" :key="stamp.key" class="stamp-cell" :class="{ 'stamp-cell-active': stamp.done }">
					<xicheng-icon name="passport" :variant="stamp.done ? 'primary' : 'soft'" :size="18" />
					<text>{{ stamp.label }}</text>
				</view>
			</view>
		</view>

		<view class="task-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">亲子研学任务</text>
				<text class="section-badge">{{ studyEvidence.length }} 条证据</text>
			</view>
			<view class="task-list">
				<view v-for="task in studyTasks" :key="task" class="task-row">
					<xicheng-icon name="study" variant="primary" :size="17" />
					<text>{{ task }}</text>
				</view>
			</view>
		</view>

		<view class="bottom-actions">
			<button class="primary-button xicheng-primary-action" @click="openRecording">继续路线</button>
			<button class="ghost-button xicheng-secondary-action" @click="openShare">生成纪念</button>
		</view>
	</view>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'

const safeArray = value => Array.isArray(value) ? value : []

export default {
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			routeCheckins: [],
			badgeAwards: [],
			studyEvidence: []
		}
	},
	computed: {
		passportStampImage() {
			return this.region.visualAssets.passportStamp || '/static/xicheng/route-passport-stamp.png'
		},
		targetCheckinCount() {
			return Number(this.region.routePassport.targetCheckinCount || 3)
		},
		completedCheckins() {
			return Math.min(this.routeCheckins.length, this.targetCheckinCount)
		},
		progressPercent() {
			return Math.round((this.completedCheckins / this.targetCheckinCount) * 100)
		},
		passportTitle() {
			return this.completedCheckins >= this.targetCheckinCount ? '西城路线纪念章已点亮' : '继续打卡点亮路线印章'
		},
		stampSlots() {
			return Array.from({ length: this.targetCheckinCount }).map((_, index) => ({
				key: `stamp-${index + 1}`,
				done: index < this.completedCheckins,
				label: this.routeCheckins[index]?.poiName || `第 ${index + 1} 站`
			}))
		},
		studyTasks() {
			return this.region.parentChildTasks
		}
	},
	onShow() {
		this.routeCheckins = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.checkinStorageKey))
		this.badgeAwards = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.badgeAwardStorageKey))
		this.studyEvidence = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.studyTaskStorageKey))
	},
	methods: {
		openRecording() {
			uni.navigateTo({ url: '/pages/xicheng/recording/recording' })
		},
		openShare() {
			uni.navigateTo({ url: '/pages/xicheng/share/share' })
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
.xicheng-passport {
	min-height: 100vh;
	padding: 24rpx 30rpx 44rpx;
	box-sizing: border-box;
}
.topbar,
.section-head,
.passport-hero,
.bottom-actions {
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
.passport-title {
	font-weight: 800;
	color: #102F29;
}
.topbar-title {
	font-size: 34rpx;
}
.passport-hero,
.progress-card,
.task-card {
	margin-top: 24rpx;
	padding: 30rpx;
	border-radius: 34rpx;
}
.passport-stamp {
	width: 180rpx;
	height: 180rpx;
	flex-shrink: 0;
}
.passport-copy {
	flex: 1;
	min-width: 0;
}
.passport-kicker,
.section-badge {
	font-size: 22rpx;
	font-weight: 700;
	color: #B5945E;
}
.passport-title {
	display: block;
	margin-top: 12rpx;
	font-size: 38rpx;
	line-height: 1.25;
}
.passport-desc {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.5;
	color: #746F68;
}
.section-title {
	font-size: 32rpx;
}
.progress-bar {
	height: 16rpx;
	margin-top: 24rpx;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.10);
	overflow: hidden;
}
.progress-fill {
	height: 100%;
	border-radius: 999rpx;
	background: #173F35;
}
.stamp-grid,
.task-list {
	display: grid;
	gap: 16rpx;
	margin-top: 24rpx;
}
.stamp-grid {
	grid-template-columns: repeat(3, minmax(0, 1fr));
}
.stamp-cell,
.task-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 18rpx;
	border-radius: 24rpx;
	background: rgba(23, 63, 53, 0.07);
	font-size: 24rpx;
	color: #173F35;
}
.stamp-cell-active {
	background: rgba(181, 148, 94, 0.16);
}
.bottom-actions {
	margin-top: 26rpx;
}
.bottom-actions button {
	flex: 1;
}
</style>
