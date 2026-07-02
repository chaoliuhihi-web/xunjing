<template>
	<view class="source-card xicheng-paper-card">
		<text class="section-title">已审核来源</text>
		<view v-if="sourceList.length > 0">
			<view
				v-for="(source, index) in sourceList"
				:key="source.id || source.url || source.title || index"
				class="source-row"
			>
				<text class="source-title">{{ getDisplaySourceTitle(source) || '审核来源' }}</text>
				<text v-if="getDisplaySourceDescription(source)" class="source-desc">
					{{ getDisplaySourceDescription(source) }}
				</text>
			</view>
		</view>
		<text v-else class="source-empty">{{ sourceEmptyCopy }}</text>
	</view>
</template>

<script>
import {
	getXichengDisplaySourceDescription,
	getXichengDisplaySourceTitle
} from '@/request/xunjing/sources.js'

export default {
	name: 'XichengScanResultSourcesCard',
	props: {
		sourceList: {
			type: Array,
			default: () => []
		},
		sourceEmptyCopy: {
			type: String,
			default: '暂无已审核来源'
		}
	},
	methods: {
		getDisplaySourceTitle(source = {}) {
			return getXichengDisplaySourceTitle(source)
		},
		getDisplaySourceDescription(source = {}) {
			return getXichengDisplaySourceDescription(source)
		}
	}
}
</script>

<style scoped>
.source-card {
	margin-top: 22rpx;
	padding: 32rpx;
	border-radius: 34rpx;
}
.section-title {
	display: block;
	font-size: 32rpx;
	font-weight: 900;
	color: #102F29;
	line-height: 1.35;
}
.source-row {
	margin-top: 18rpx;
	padding: 22rpx;
	border-radius: 24rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.24);
	background: rgba(255, 252, 246, 0.72);
}
.source-title,
.source-desc,
.source-empty {
	display: block;
	line-height: 1.55;
}
.source-title {
	font-size: 26rpx;
	font-weight: 700;
	color: #102F29;
}
.source-desc,
.source-empty {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #746F68;
}
</style>
