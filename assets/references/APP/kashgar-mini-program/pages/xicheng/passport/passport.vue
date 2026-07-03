<template>
	<view class="xicheng-passport xicheng-designed-page xicheng-bottom-safe">
		<view class="topbar">
			<view class="topbar-button" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="topbar-title">路线记录</text>
			<view class="topbar-button" @click="openRecording">
				<xicheng-icon name="record" variant="plain" :size="21" />
			</view>
		</view>

		<view class="passport-hero passport-reference-hero xicheng-paper-card">
			<view class="passport-copy">
				<text class="passport-kicker">我的路线记录</text>
				<text class="passport-title">{{ passportTitle }}</text>
				<text class="passport-desc">古刹文脉 · 建筑美学 · 老城风情</text>
				<view class="passport-progress-inline">
					<text>路线进度</text>
					<view class="passport-progress-track">
						<view class="passport-progress-fill" :style="{ width: progressPercent + '%' }"></view>
					</view>
					<text>{{ completedCheckins }}/{{ targetCheckinCount }}</text>
				</view>
			</view>
			<view class="passport-stamp-orbit">
				<image class="passport-companion" :src="region.companionAvatar" mode="aspectFit" />
				<image class="passport-stamp" :src="passportStampImage" mode="aspectFit" />
				<text class="passport-ribbon">小京陪伴中</text>
			</view>
		</view>

		<view class="progress-card xicheng-paper-card">
			<view class="section-head">
				<view class="section-title-row">
					<xicheng-icon name="route" variant="primary" :size="18" />
					<text class="section-title">路线记录点位</text>
				</view>
				<text class="section-badge">{{ completedCheckins }}/{{ targetCheckinCount }}</text>
			</view>
			<view class="progress-bar">
				<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
			</view>
			<view class="stamp-grid">
				<view v-for="stamp in stampSlots" :key="stamp.key" class="stamp-cell" :class="{ 'stamp-cell-active': stamp.done }">
					<image class="stamp-cell-image" :src="passportStampImage" mode="aspectFit" />
					<text class="stamp-status">{{ stamp.done ? '已记录' : '待记录' }}</text>
					<text class="stamp-label">{{ stamp.label }}</text>
				</view>
			</view>
		</view>

		<view class="badge-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">路线复盘</text>
				<text class="section-badge">{{ badgeProgressText }}</text>
			</view>
			<view class="passport-badge-grid">
				<view v-for="badge in badgeCards" :key="badge.title" class="badge-tile" :class="{ 'badge-tile-locked': badge.locked }">
					<view class="badge-medal">
						<xicheng-icon :name="badge.locked ? 'locked' : badge.icon" :variant="badge.locked ? 'soft' : 'primary'" :size="22" />
					</view>
					<text class="badge-title">{{ badge.title }}</text>
					<text class="badge-desc">{{ badge.desc }}</text>
				</view>
			</view>
		</view>

		<view class="task-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">街区观察记录</text>
				<text class="section-badge">{{ studyEvidence.length }} 条记录</text>
			</view>
			<view class="task-list">
				<view v-for="task in studyTasks" :key="task" class="task-row">
					<xicheng-icon name="study" variant="primary" :size="17" />
					<text>{{ task }}</text>
				</view>
			</view>
		</view>

		<view class="bottom-actions">
			<button class="primary-button xicheng-primary-action" @click="openRecording">继续记录</button>
			<button class="ghost-button xicheng-secondary-action" @click="openShare">生成游记</button>
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
			return this.completedCheckins >= this.targetCheckinCount ? '西城路线复盘已完成' : '继续记录完善路线复盘'
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
		},
		badgeProgressText() {
			return `记录进度 ${this.completedCheckins}/${this.targetCheckinCount}`
		},
		badgeCards() {
			return [
				{ icon: 'passport', title: '建筑观察家', desc: '发现建筑之美', locked: this.completedCheckins < 1 },
				{ icon: 'source', title: '历史小侦探', desc: '探寻历史故事', locked: this.completedCheckins < 2 },
				{ icon: 'locked', title: '湖畔漫步者', desc: '漫步什刹海畔', locked: this.completedCheckins < 3 }
			]
		}
	},
	onShow() {
		uni.setNavigationBarTitle({ title: '路线记录' })
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
.badge-card,
.task-card {
	margin-top: 24rpx;
	padding: 30rpx;
	border-radius: 34rpx;
}

.passport-reference-hero {
	position: relative;
	overflow: hidden;
	min-height: 382rpx;
	align-items: stretch;
	background:
		linear-gradient(90deg, rgba(255, 252, 246, 0.97), rgba(255, 252, 246, 0.70)),
		url('/static/xicheng/scene-baitasi-waterfront.jpg') center/cover;
}

.passport-reference-hero::after {
	content: "";
	position: absolute;
	inset: 0;
	background:
		linear-gradient(180deg, rgba(255, 252, 246, 0.16), rgba(255, 252, 246, 0.88)),
		radial-gradient(circle at 78% 22%, rgba(181, 148, 94, 0.18), transparent 38%);
	pointer-events: none;
}

.passport-reference-hero .passport-copy,
.passport-stamp-orbit {
	position: relative;
	z-index: 1;
}

.passport-stamp {
	width: 150rpx;
	height: 150rpx;
	flex-shrink: 0;
	opacity: 0.92;
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

.passport-progress-inline {
	display: grid;
	grid-template-columns: auto 1fr auto;
	align-items: center;
	gap: 16rpx;
	margin-top: 28rpx;
	font-size: 24rpx;
	font-weight: 800;
	color: #173F35;
}

.passport-progress-track {
	height: 14rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.9);
	overflow: hidden;
}

.passport-progress-fill {
	height: 100%;
	border-radius: 999rpx;
	background: #173F35;
}

.passport-stamp-orbit {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-end;
	width: 192rpx;
	flex: 0 0 192rpx;
}

.passport-companion {
	width: 154rpx;
	height: 174rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.72);
}

.passport-ribbon {
	margin-top: -10rpx;
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF9EC;
	font-size: 22rpx;
	font-weight: 800;
	white-space: nowrap;
}

.section-title-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	min-width: 0;
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
.stamp-cell {
	position: relative;
	display: grid;
	justify-items: center;
	gap: 10rpx;
	min-height: 230rpx;
	padding: 18rpx 12rpx;
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.74);
	border: 1rpx solid rgba(181, 148, 94, 0.22);
	box-sizing: border-box;
	text-align: center;
}

.stamp-cell::after {
	content: "";
	position: absolute;
	right: -14rpx;
	top: 50%;
	width: 28rpx;
	height: 2rpx;
	border-top: 2rpx dashed rgba(181, 148, 94, 0.32);
}

.stamp-cell:last-child::after {
	display: none;
}

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

.stamp-cell-image {
	width: 106rpx;
	height: 106rpx;
	opacity: 0.42;
	filter: grayscale(1);
}

.stamp-cell-active .stamp-cell-image {
	opacity: 1;
	filter: none;
}

.stamp-status {
	display: inline-flex;
	padding: 7rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.08);
	color: #173F35;
	font-size: 21rpx;
	font-weight: 800;
}

.stamp-cell-active .stamp-status {
	background: #173F35;
	color: #FFF9EC;
}

.stamp-label {
	display: block;
	min-height: 64rpx;
	font-size: 24rpx;
	line-height: 1.35;
	font-weight: 800;
	color: #102F29;
}

.passport-badge-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 24rpx;
}

.badge-tile {
	display: grid;
	justify-items: center;
	gap: 10rpx;
	padding: 20rpx 12rpx;
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.78);
	border: 1rpx solid rgba(181, 148, 94, 0.20);
	text-align: center;
}

.badge-tile-locked {
	opacity: 0.58;
	filter: grayscale(0.55);
}

.badge-medal {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 82rpx;
	height: 82rpx;
	border-radius: 28rpx;
	background: linear-gradient(145deg, rgba(181, 148, 94, 0.22), rgba(23, 63, 53, 0.06));
}

.badge-title,
.badge-desc {
	display: block;
}

.badge-title {
	font-size: 24rpx;
	line-height: 1.35;
	font-weight: 800;
	color: #102F29;
}

.badge-desc {
	font-size: 21rpx;
	line-height: 1.35;
	color: #746F68;
}
.bottom-actions {
	margin-top: 26rpx;
}
.bottom-actions button {
	flex: 1;
}
</style>
