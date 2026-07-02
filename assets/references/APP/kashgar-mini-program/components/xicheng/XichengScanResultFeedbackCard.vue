<template>
	<view class="feedback-card xicheng-paper-card">
		<view class="section-head xicheng-section-label">
			<text class="section-title">识别反馈</text>
			<text class="section-badge">{{ recognitionFeedback ? recognitionFeedback.feedbackLabel : '待反馈' }}</text>
		</view>
		<textarea
			v-model="draftFeedbackNote"
			class="feedback-input"
			placeholder="可补充正确地点、展牌文字或现场线索"
			auto-height
			@input="updateFeedbackNote"
		/>
		<view class="feedback-actions">
			<button class="ghost-button xicheng-secondary-action" @click="$emit('submit-feedback', 'correct')">识别准确</button>
			<button class="ghost-button danger-button xicheng-secondary-action" @click="$emit('submit-feedback', 'wrong')">识别有误</button>
		</view>
		<text v-if="recognitionFeedback" class="source-empty">
			已记录为{{ recognitionFeedback.reviewStatus }}反馈，运营可用于 POI 纠错。
		</text>
		<view v-if="recognitionFeedback" class="feedback-actions">
			<button class="ghost-button danger-button xicheng-secondary-action" @click="$emit('withdraw-feedback')">撤回反馈</button>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengScanResultFeedbackCard',
	emits: ['update:feedback-note', 'submit-feedback', 'withdraw-feedback'],
	props: {
		feedbackNote: {
			type: String,
			default: ''
		},
		recognitionFeedback: {
			type: Object,
			default: null
		}
	},
	data() {
		return {
			draftFeedbackNote: this.feedbackNote
		}
	},
	watch: {
		feedbackNote(value) {
			this.draftFeedbackNote = value
		}
	},
	methods: {
		updateFeedbackNote(event) {
			this.draftFeedbackNote = event.detail.value
			this.$emit('update:feedback-note', this.draftFeedbackNote)
		}
	}
}
</script>

<style scoped>
.feedback-card {
	margin-top: 28rpx;
	padding: 32rpx;
	border-radius: 34rpx;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.section-head.xicheng-section-label {
	justify-content: flex-start;
}

.section-head.xicheng-section-label .section-badge {
	margin-left: auto;
}

.section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #102F29;
}

.section-badge {
	flex-shrink: 0;
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.16);
	font-size: 22rpx;
	color: #173F35;
}

.feedback-input {
	width: 100%;
	min-height: 112rpx;
	margin-top: 20rpx;
	padding: 20rpx;
	box-sizing: border-box;
	border: 1rpx solid rgba(181, 148, 94, 0.24);
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.72);
	font-size: 26rpx;
	color: #173F35;
}

.feedback-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 18rpx;
}

.source-empty {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #746F68;
}
</style>
