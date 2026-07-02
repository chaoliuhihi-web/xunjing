<template>
	<view class="xicheng-publish-preflight-panel xicheng-paper-card">
		<view class="preflight-head">
			<view>
				<text class="preflight-kicker">发布前检查</text>
				<text class="preflight-title">{{ channelLabel }}</text>
			</view>
			<text class="preflight-status-ready">系统分享确认</text>
		</view>
		<view class="preflight-grid">
			<view
				v-for="item in normalizedItems"
				:key="item.key"
				class="preflight-row"
				:class="{ 'preflight-row-ready': item.ready, 'preflight-row-pending': !item.ready }"
			>
				<xicheng-icon :name="item.icon" :variant="item.ready ? 'primary' : 'soft'" :size="18" />
				<view class="preflight-copy">
					<text class="preflight-row-title">{{ item.title }}</text>
					<text class="preflight-row-desc">{{ item.desc }}</text>
				</view>
				<text class="preflight-row-status">{{ item.status }}</text>
			</view>
		</view>
	</view>
</template>

<script>
const channelLabelMap = Object.freeze({
	xinghe: '星河公开游记',
	moments: '朋友圈发布',
	xiaohongshu: '小红书发布',
	pdf: 'PDF 打印'
})

const assetStatusCopy = Object.freeze({
	ready: '素材已准备',
	pending: '待生成素材'
})

const fallbackItems = Object.freeze([
	{ key: 'privacy', icon: 'location', title: '隐私范围', status: '精确位置已隐藏', desc: '公开页只展示 POI 范围和路线摘要', ready: true },
	{ key: 'sources', icon: 'source', title: '已审核来源', status: '来源可公开', desc: '仅展示已审核资料来源', ready: true },
	{ key: 'asset', icon: 'photo', title: '素材生成', status: assetStatusCopy.pending, desc: '生成图片、文案、标签或 PDF 后发布', ready: false },
	{ key: 'confirm', icon: 'check', title: '用户确认', status: '系统分享确认', desc: '按系统分享或平台 SDK 唤起确认', ready: true }
])

export default {
	name: 'XichengPublishPreflightPanel',
	props: {
		items: {
			type: Array,
			default: () => []
		},
		selectedChannel: {
			type: String,
			default: 'xinghe'
		}
	},
	computed: {
		channelLabel() {
			return channelLabelMap[this.selectedChannel] || channelLabelMap.xinghe
		},
		normalizedItems() {
			const sourceItems = Array.isArray(this.items) && this.items.length > 0 ? this.items : fallbackItems
			return sourceItems.map((item, index) => ({
				key: item.key || `preflight-${index}`,
				icon: item.icon || 'check',
				title: item.title || '',
				status: item.status || '',
				desc: item.desc || '',
				ready: item.ready === true
			}))
		}
	}
}
</script>

<style scoped>
.xicheng-publish-preflight-panel {
	margin-top: 24rpx;
	padding: 28rpx;
	border-radius: 34rpx;
}
.preflight-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}
.preflight-kicker,
.preflight-title,
.preflight-status-ready,
.preflight-row-title,
.preflight-row-desc,
.preflight-row-status {
	display: block;
}
.preflight-kicker {
	color: #B5945E;
	font-size: 23rpx;
	font-weight: 900;
}
.preflight-title {
	margin-top: 8rpx;
	color: #102F29;
	font-size: 32rpx;
	line-height: 1.25;
	font-weight: 900;
}
.preflight-status-ready,
.preflight-row-status {
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(31, 110, 90, 0.1);
	color: #1F6E5A;
	font-size: 21rpx;
	font-weight: 900;
	white-space: nowrap;
}
.preflight-grid {
	display: grid;
	gap: 14rpx;
	margin-top: 22rpx;
}
.preflight-row {
	display: grid;
	grid-template-columns: 48rpx minmax(0, 1fr) auto;
	align-items: center;
	gap: 14rpx;
	padding: 18rpx;
	border-radius: 24rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.14);
	background: rgba(255, 248, 234, 0.68);
}
.preflight-row-ready {
	border-color: rgba(31, 110, 90, 0.22);
	background: rgba(31, 110, 90, 0.06);
}
.preflight-row-pending .preflight-row-status {
	background: rgba(181, 148, 94, 0.14);
	color: #8A6B33;
}
.preflight-copy {
	min-width: 0;
}
.preflight-row-title {
	color: #102F29;
	font-size: 25rpx;
	line-height: 1.3;
	font-weight: 900;
}
.preflight-row-desc {
	margin-top: 5rpx;
	color: #746F68;
	font-size: 21rpx;
	line-height: 1.35;
}
</style>
