<template>
	<view class="question-card xicheng-paper-card">
		<text class="section-title">{{ sectionTitle }}</text>
		<view
			v-for="question in questions"
			:key="question"
			class="question-row"
			:class="{ 'question-row-disabled': recognitionActionBlocked }"
			@click="handleAsk(question)"
		>
			<text>{{ question }}</text>
		</view>
		<text v-if="questions.length === 0" class="question-empty">{{ emptyCopy }}</text>
	</view>
</template>

<script>
export default {
	name: 'XichengScanResultQuestionsCard',
	props: {
		sectionTitle: {
			type: String,
			default: '可以继续问小京'
		},
		questions: {
			type: Array,
			default: () => []
		},
		recognitionActionBlocked: {
			type: Boolean,
			default: false
		},
		emptyCopy: {
			type: String,
			default: '暂无可继续追问的问题'
		}
	},
	methods: {
		handleAsk(question) {
			if (this.recognitionActionBlocked) return
			this.$emit('ask', question)
		}
	}
}
</script>

<style scoped>
.question-card {
	margin-top: 28rpx;
	padding: 32rpx;
	border-radius: 34rpx;
}

.section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #102F29;
}

.question-row {
	margin-top: 18rpx;
	padding: 22rpx;
	border-radius: 22rpx;
	background: rgba(255, 252, 246, 0.72);
	font-size: 26rpx;
	color: #173F35;
}

.question-row-disabled {
	opacity: 0.58;
}

.question-empty {
	display: block;
	margin-top: 18rpx;
	font-size: 24rpx;
	line-height: 1.6;
	color: #667085;
}
</style>
