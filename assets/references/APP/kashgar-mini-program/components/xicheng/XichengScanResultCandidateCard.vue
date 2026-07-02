<template>
	<view class="candidate-card xicheng-paper-card">
		<view class="section-head xicheng-section-label">
			<text class="section-title">可能匹配地点</text>
			<text class="section-badge">{{ candidateSectionBadge }}</text>
		</view>
		<view
			v-for="candidate in candidateList"
			:key="candidate.poiCode || candidate.poiName"
			class="candidate-row"
			:class="{ 'candidate-row-disabled': isUnsafeCandidate(candidate) }"
			@click="$emit('select-candidate', candidate)"
		>
			<view>
				<text class="candidate-title">{{ candidate.poiName || '西城文化点' }}</text>
				<text v-if="candidate.summary || candidate.distanceMeters" class="candidate-desc">
					{{ formatCandidateSummary(candidate) }}
				</text>
			</view>
			<view class="candidate-side">
				<text class="candidate-confidence">{{ Math.round(Number(candidate.confidence || 0) * 100) }}%</text>
				<text v-if="isUnsafeCandidate(candidate)" class="candidate-safety">{{ candidateSafetyLabel(candidate) }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { isXichengUnsafeSafetyStatus, normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'

export default {
	name: 'XichengScanResultCandidateCard',
	emits: ['select-candidate'],
	props: {
		candidateList: {
			type: Array,
			default: () => []
		},
		candidateSectionBadge: {
			type: String,
			default: ''
		}
	},
	methods: {
		isUnsafeCandidate(candidate = {}) {
			const safetyStatus = normalizeXichengSafetyStatus(candidate.safetyStatus)
			return isXichengUnsafeSafetyStatus(safetyStatus)
		},
		candidateSafetyLabel(candidate = {}) {
			const safetyStatus = normalizeXichengSafetyStatus(candidate.safetyStatus)
			if (safetyStatus === 'BLOCKED') return '已拦截'
			if (safetyStatus === 'UNAVAILABLE') return '来源不可用'
			return ''
		},
		formatCandidateSummary(candidate = {}) {
			return candidate.summary || `距离约 ${candidate.distanceMeters} 米`
		}
	}
}
</script>

<style scoped>
.candidate-card {
	margin-top: 28rpx;
	padding: 32rpx;
	border-radius: 34rpx;
}

.section-head {
	display: flex;
	align-items: center;
	gap: 16rpx;
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

.candidate-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	margin-top: 18rpx;
	padding: 22rpx;
	border-radius: 24rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.24);
	background: rgba(255, 252, 246, 0.72);
}

.candidate-row-disabled {
	background: #FFF7F5;
	border-color: #F4C7C3;
}

.candidate-title,
.candidate-desc,
.candidate-confidence {
	display: block;
	line-height: 1.5;
}

.candidate-side {
	flex-shrink: 0;
	text-align: right;
}

.candidate-title {
	font-size: 28rpx;
	font-weight: 700;
	color: #102F29;
}

.candidate-desc {
	margin-top: 6rpx;
	font-size: 24rpx;
	color: #746F68;
}

.candidate-confidence {
	font-size: 28rpx;
	font-weight: 700;
	color: #173F35;
}

.candidate-safety {
	display: block;
	margin-top: 4rpx;
	font-size: 22rpx;
	color: #B42318;
}
</style>
