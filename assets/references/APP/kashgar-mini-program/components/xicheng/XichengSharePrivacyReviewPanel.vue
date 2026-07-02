<template>
	<view class="privacy-card xicheng-paper-card">
		<view class="section-head">
			<text class="section-title">分享设置</text>
			<text class="section-badge">待审核 · 未公开</text>
		</view>
		<view class="share-setting-list">
			<view v-for="setting in normalizedSettings" :key="setting.key" class="share-setting-row" @click="this.$emit('toggle-setting', setting.key)">
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
			<view v-for="step in normalizedReviewSteps" :key="step.title" class="review-step" :class="{ 'review-step-active': step.active }">
				<text class="review-step-index">{{ step.index }}</text>
				<text class="review-step-title">{{ step.title }}</text>
			</view>
		</view>
		<button class="primary-button xicheng-primary-action" @click="this.$emit('submit-review')">提交审核</button>
	</view>
</template>

<script>
export default {
	name: 'XichengSharePrivacyReviewPanel',
	props: {
		settings: {
			type: Array,
			default: () => []
		},
		reviewSteps: {
			type: Array,
			default: () => []
		}
	},
	emits: ['toggle-setting', 'submit-review'],
	computed: {
		normalizedSettings() {
			return (Array.isArray(this.settings) ? this.settings : []).map(setting => ({
				key: setting.key || '',
				icon: setting.icon || 'settings',
				title: setting.title || '',
				desc: setting.desc || '',
				enabled: setting.enabled === true
			}))
		},
		normalizedReviewSteps() {
			return (Array.isArray(this.reviewSteps) ? this.reviewSteps : []).map((step, index) => ({
				index: step.index || String(index + 1),
				title: step.title || '',
				active: step.active === true
			}))
		}
	}
}
</script>

<style scoped>
.privacy-card {
	margin-top: 24rpx;
	padding: 28rpx;
	border-radius: 34rpx;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}

.section-title {
	color: #102F29;
	font-size: 30rpx;
	font-weight: 800;
}

.section-badge {
	color: #B5945E;
	font-size: 22rpx;
	font-weight: 700;
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
.share-setting-desc,
.privacy-copy {
	display: block;
}

.share-setting-title {
	color: #102F29;
	font-size: 26rpx;
	font-weight: 800;
}

.share-setting-desc {
	margin-top: 5rpx;
	color: #746F68;
	font-size: 22rpx;
	line-height: 1.4;
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

.privacy-copy {
	margin-top: 12rpx;
	color: #746F68;
	font-size: 24rpx;
	line-height: 1.55;
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
