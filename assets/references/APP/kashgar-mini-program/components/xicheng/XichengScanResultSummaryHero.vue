<template>
	<view class="scan-result-summary-hero">
		<view class="result-card xicheng-paper-card xicheng-reference-result-card">
			<view class="result-hero-layout">
				<image
					v-if="resultVisualImage"
					class="result-poi-image"
					:src="resultVisualImage"
					mode="aspectFill"
				/>
				<view class="result-hero-copy">
					<text class="poi-name">{{ result.poiName }}</text>
					<view class="confidence-line">
						<text>{{ confidenceMetaLabel }}</text>
						<text class="confidence-value">{{ confidenceDisplay }}</text>
					</view>
					<view class="official-match-row">
						<xicheng-icon name="check" variant="primary" :size="17" />
						<text>{{ result.requiresUserConfirm ? '待确认官方地标' : '已验证为官方地标' }}</text>
					</view>
					<text class="signal-title">识别信号</text>
					<view class="result-signal-list">
						<view
							v-for="signal in recognitionSignalItems"
							:key="signal.key"
							class="result-source-signal"
						>
							<text class="result-source-signal-label">{{ signal.label }}</text>
							<text class="result-source-signal-value">{{ signal.value }}</text>
						</view>
					</view>
				</view>
			</view>
			<view class="result-source-summary" :class="{ 'result-source-summary-blocked': recognitionActionBlocked }">
				<xicheng-icon
					class="result-source-summary-icon"
					:name="recognitionActionBlocked ? 'locked' : 'source'"
					variant="primary"
					:size="19"
				/>
				<view class="result-source-summary-copywrap">
					<text class="result-source-summary-label">{{ sourceSummaryLabel }}</text>
					<text class="result-source-summary-copy">{{ sourceSummaryCopy }}</text>
				</view>
			</view>
			<view class="result-companion-card">
				<image class="result-companion-avatar" :src="companionAvatar" mode="aspectFit" />
				<view class="result-companion-copy xicheng-companion-bubble">
					<text class="result-companion-title">{{ resultCompanionTitle }}</text>
					<text class="result-companion-desc">{{ companionDescription }}</text>
				</view>
			</view>
		</view>

		<view class="result-reference-actions">
			<button
				class="primary-button xicheng-primary-action"
				:disabled="recognitionActionBlocked"
				@click="$emit('start-guide')"
			>
				开始 AI 讲解
			</button>
			<button
				class="ghost-button xicheng-secondary-action"
				:disabled="recognitionActionBlocked"
				@click="$emit('ask-xiaojing')"
			>
				问问小京
			</button>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengScanResultSummaryHero',
	props: {
		result: {
			type: Object,
			default: () => ({})
		},
		region: {
			type: Object,
			default: () => ({})
		},
		resultVisualImage: {
			type: String,
			default: ''
		},
		confidenceMetaLabel: {
			type: String,
			default: '置信度'
		},
		confidenceDisplay: {
			type: String,
			default: '0%'
		},
		recognitionSignalItems: {
			type: Array,
			default: () => []
		},
		recognitionActionBlocked: {
			type: Boolean,
			default: false
		},
		sourceSummaryLabel: {
			type: String,
			default: '来源待审核'
		},
		sourceSummaryCopy: {
			type: String,
			default: ''
		},
		resultCompanionTitle: {
			type: String,
			default: '小京已为你匹配到这里'
		},
		questionSectionTitle: {
			type: String,
			default: '可以继续问小京'
		}
	},
	emits: ['start-guide', 'ask-xiaojing'],
	computed: {
		companionAvatar() {
			return this.region && this.region.companionAvatar ? this.region.companionAvatar : ''
		},
		companionDescription() {
			return this.recognitionActionBlocked
				? this.questionSectionTitle
				: '可以继续听讲解、问路线或生成游记素材。'
		}
	}
}
</script>

<style scoped>
.result-card {
	padding: 32rpx;
	border-radius: 34rpx;
}

.xicheng-reference-result-card {
	position: relative;
	min-height: 660rpx;
	padding: 34rpx;
	overflow: hidden;
	border-radius: 34rpx;
	background:
		radial-gradient(circle at 94% 20%, rgba(181, 148, 94, 0.12), transparent 28%),
		linear-gradient(145deg, rgba(255, 253, 248, 0.98), rgba(250, 245, 237, 0.94));
}

.xicheng-reference-result-card::after {
	content: '';
	position: absolute;
	right: -52rpx;
	top: 128rpx;
	width: 270rpx;
	height: 420rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.08);
	pointer-events: none;
}

.result-hero-layout {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: flex-start;
	gap: 30rpx;
}

.result-poi-image {
	width: 290rpx;
	height: 430rpx;
	flex-shrink: 0;
	border-radius: 28rpx;
	background: rgba(181, 148, 94, 0.14);
	object-fit: cover;
	overflow: hidden;
	box-shadow: 0 16rpx 34rpx rgba(35, 42, 34, 0.12);
}

.result-hero-copy {
	flex: 1;
	min-width: 0;
}

.poi-name {
	display: block;
	margin-top: 18rpx;
	font-size: 58rpx;
	line-height: 1.1;
	font-weight: 700;
	color: #102F29;
}

.confidence-line {
	display: flex;
	align-items: baseline;
	gap: 14rpx;
	margin-top: 28rpx;
	font-size: 30rpx;
	line-height: 1.35;
	color: #746F68;
}

.confidence-value {
	font-size: 36rpx;
	font-weight: 800;
	color: #B42318;
}

.official-match-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-top: 26rpx;
	padding-top: 24rpx;
	border-top: 1rpx dashed rgba(181, 148, 94, 0.28);
	font-size: 27rpx;
	color: #173F35;
}

.signal-title {
	display: block;
	margin-top: 30rpx;
	font-size: 28rpx;
	font-weight: 700;
	color: #102F29;
}

.result-signal-list {
	display: grid;
	gap: 18rpx;
	margin-top: 18rpx;
}

.result-source-signal {
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 16rpx;
	min-height: 58rpx;
	padding: 0;
	background: transparent;
	box-sizing: border-box;
}

.result-source-signal-label,
.result-source-signal-value {
	font-size: 22rpx;
	line-height: 1.35;
	color: #173F35;
}

.result-source-signal-label {
	min-width: 112rpx;
	font-size: 27rpx;
	color: #746F68;
}

.result-source-signal-value {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 48rpx;
	height: 48rpx;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.10);
	font-size: 0;
	font-weight: 700;
	text-align: right;
}

.result-source-signal-value::after {
	content: '';
	width: 18rpx;
	height: 10rpx;
	border-left: 4rpx solid #173F35;
	border-bottom: 4rpx solid #173F35;
	transform: rotate(-45deg);
}

.result-source-summary {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: flex-start;
	gap: 16rpx;
	margin-top: 28rpx;
	padding: 18rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.22);
	border-radius: 24rpx;
	background: rgba(181, 148, 94, 0.12);
	box-sizing: border-box;
}

.result-source-summary-blocked {
	border-color: rgba(180, 35, 24, 0.24);
	background: rgba(180, 35, 24, 0.08);
}

.result-source-summary-icon {
	flex-shrink: 0;
}

.result-source-summary-copywrap {
	min-width: 0;
}

.result-source-summary-label,
.result-source-summary-copy {
	display: block;
	line-height: 1.45;
}

.result-source-summary-label {
	font-size: 26rpx;
	font-weight: 700;
	color: #173F35;
}

.result-source-summary-copy {
	margin-top: 4rpx;
	font-size: 22rpx;
	color: #746F68;
}

.result-companion-card {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	gap: 18rpx;
	margin-top: 24rpx;
	padding: 12rpx;
	border-radius: 28rpx;
	background: rgba(255, 253, 248, 0.72);
}

.result-companion-avatar {
	width: 118rpx;
	height: 118rpx;
	flex-shrink: 0;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.08);
	box-shadow: 0 10rpx 24rpx rgba(16, 47, 41, 0.10);
}

.result-companion-copy {
	flex: 1;
	min-width: 0;
	padding: 18rpx 22rpx;
	border-radius: 24rpx;
	box-sizing: border-box;
}

.result-companion-copy.xicheng-companion-bubble::before {
	left: -10rpx;
	top: 34rpx;
	margin-left: 0;
	transform: rotate(45deg);
}

.result-companion-title,
.result-companion-desc {
	display: block;
	line-height: 1.5;
}

.result-companion-title {
	font-size: 26rpx;
	font-weight: 700;
	color: #173F35;
}

.result-companion-desc {
	margin-top: 4rpx;
	font-size: 22rpx;
	color: #746F68;
}

.result-reference-actions {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 28rpx;
	margin-top: 32rpx;
}

.primary-button,
.ghost-button {
	flex: 1;
	height: 104rpx;
	line-height: 104rpx;
	border-radius: 30rpx;
	font-size: 34rpx;
	font-weight: 700;
	box-shadow: 0 16rpx 34rpx rgba(16, 47, 41, 0.12);
}

.primary-button {
	background: #1F6E5A;
	color: #FFFFFF;
}

.ghost-button {
	background: #E8ECE7;
	color: #1F6E5A;
}
</style>
