<template>
	<view
		v-if="hasEvidence"
		class="xicheng-ai-guide-message-evidence"
		:class="{ 'message-evidence-xicheng': xichengMode }"
	>
		<view v-if="sourceList.length > 0" class="message-source-list">
			<text class="message-source-heading">已审核来源</text>
			<view
				v-for="(source, sourceIndex) in sourceList"
				:key="source.id || source.url || source.title || sourceIndex"
				class="message-source-item"
			>
				<text class="message-source-title">{{ getDisplaySourceTitle(source) || '审核来源' }}</text>
				<text v-if="getDisplaySourceDescription(source)" class="message-source-desc">
					{{ getDisplaySourceDescription(source) }}
				</text>
			</view>
		</view>

		<view v-if="followUpList.length > 0" class="follow-up-list">
			<view
				v-for="(followUp, fIndex) in followUpList"
				:key="fIndex"
				class="follow-up-item"
				@click="handleFollowUpClick(followUp)"
			>
				<text class="follow-up-icon">💡</text>
				<text class="follow-up-text">{{ followUp }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import {
	getXichengDisplaySourceDescription,
	getXichengDisplaySourceTitle
} from '@/request/xunjing/sources.js'

export default {
	name: 'XichengAiGuideMessageEvidence',
	props: {
		sources: {
			type: Array,
			default: () => []
		},
		followUps: {
			type: Array,
			default: () => []
		},
		xichengMode: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		sourceList() {
			return Array.isArray(this.sources) ? this.sources : []
		},
		followUpList() {
			return Array.isArray(this.followUps) ? this.followUps.filter(Boolean) : []
		},
		hasEvidence() {
			return this.sourceList.length > 0 || this.followUpList.length > 0
		}
	},
	methods: {
		getDisplaySourceTitle(source = {}) {
			return getXichengDisplaySourceTitle(source)
		},
		getDisplaySourceDescription(source = {}) {
			return getXichengDisplaySourceDescription(source)
		},
		handleFollowUpClick(followUp) {
			this.$emit('follow-up', followUp)
		}
	}
}
</script>

<style scoped>
.follow-up-list {
	margin-top: 24rpx;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	padding-right: 80px;
	padding-left: 30px;
}

.follow-up-item {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 20rpx 24rpx;
	background: linear-gradient(135deg, #F0F4FF 0%, #E8F0FE 100%);
	border-radius: 16rpx;
	border: 2rpx solid #D0E2FF;
	transition: all 0.3s;
	cursor: pointer;
}

.follow-up-item:active {
	background: linear-gradient(135deg, #E0EBFF 0%, #D8E8FE 100%);
	transform: scale(0.98);
}

.follow-up-icon {
	font-size: 32rpx;
	flex-shrink: 0;
}

.follow-up-text {
	flex: 1;
	font-size: 28rpx;
	color: #4A5568;
	line-height: 1.6;
}

.message-source-list {
	margin-top: 20rpx;
	margin-left: 96rpx;
	margin-right: 30rpx;
	padding: 20rpx 24rpx;
	border-radius: 8rpx;
	border: 1rpx solid rgba(36, 76, 65, 0.14);
	background: rgba(255, 252, 244, 0.92);
}

.message-source-heading,
.message-source-title,
.message-source-desc {
	display: block;
	line-height: 1.55;
}

.message-source-heading {
	font-size: 24rpx;
	font-weight: 700;
	color: #244C41;
}

.message-source-item {
	margin-top: 14rpx;
	padding-top: 14rpx;
	border-top: 1rpx solid rgba(36, 76, 65, 0.1);
}

.message-source-title {
	font-size: 24rpx;
	font-weight: 700;
	color: #183B34;
}

.message-source-desc {
	margin-top: 6rpx;
	font-size: 22rpx;
	color: #6C766D;
}

.message-evidence-xicheng .message-source-list,
.message-evidence-xicheng .follow-up-item {
	border: 1rpx solid rgba(255, 255, 255, 0.78);
	background:
		linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(250, 246, 237, 0.88));
	box-shadow: 0 14rpx 34rpx rgba(28, 35, 32, 0.08);
}

.message-evidence-xicheng .message-source-list {
	margin-left: 84rpx;
	margin-right: 0;
	border-radius: 28rpx;
}

.message-evidence-xicheng .message-source-heading,
.message-evidence-xicheng .message-source-title {
	color: #173F35;
}

.message-evidence-xicheng .message-source-desc,
.message-evidence-xicheng .follow-up-text {
	color: #746F68;
}

.message-evidence-xicheng .follow-up-list {
	padding-left: 84rpx;
	padding-right: 0;
}

.message-evidence-xicheng .follow-up-item {
	border-radius: 24rpx;
}
</style>
