<template>
	<view class="action-grid xicheng-travelogue-actions">
		<button
			v-for="action in actionItems"
			:key="action.key"
			:class="['ghost-button xicheng-secondary-action', action.requiresEvidence && !hasReviewableEvidence ? 'work-action-needs-evidence' : '']"
			@click="emitAction(action)"
		>
			{{ action.label }}
		</button>
	</view>
</template>

<script>
export default {
	name: 'XichengTravelogueActionGrid',
	props: {
		hasReviewableEvidence: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			actionItems: [
				{ key: 'poster', label: '分享海报', event: 'generate-poster', requiresEvidence: true },
				{ key: 'pdf', label: 'PDF纪念册', event: 'export-pdf', requiresEvidence: true },
				{ key: 'review', label: '作品审核', event: 'submit-review', requiresEvidence: true },
				{ key: 'share', label: '分享纪念', event: 'open-share', requiresEvidence: false },
				{ key: 'works', label: '我的游记', event: 'open-works', requiresEvidence: false },
				{ key: 'ops', label: '运营报告', event: 'open-ops-report', requiresEvidence: false }
			]
		}
	},
	methods: {
		emitAction(action) {
			this.$emit(action.event)
		}
	}
}
</script>

<style scoped>
.action-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 24rpx;
}

.xicheng-travelogue-actions {
	padding: 14rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.74);
	border-radius: 34rpx;
	background: rgba(255, 253, 248, 0.92);
	box-shadow: 0 18rpx 46rpx rgba(28, 35, 32, 0.12);
}

.ghost-button {
	height: 84rpx;
	margin-top: 0;
	border-radius: 28rpx;
	background: #E8ECE7;
	color: #1F6E5A;
	font-size: 28rpx;
	line-height: 84rpx;
}

.work-action-needs-evidence {
	opacity: 0.58;
	border-style: dashed;
	border-color: rgba(31, 110, 90, 0.38);
}
</style>
