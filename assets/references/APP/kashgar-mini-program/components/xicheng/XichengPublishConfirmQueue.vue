<template>
	<view class="xicheng-publish-confirm-queue xicheng-paper-card">
		<view class="confirm-queue-head">
			<view>
				<text class="confirm-queue-kicker">发布确认队列</text>
				<text class="confirm-queue-title">逐个确认后发布</text>
			</view>
			<text class="confirm-queue-count">{{ normalizedItems.length }} 项</text>
		</view>
		<view class="confirm-queue-list">
			<view
				v-for="item in normalizedItems"
				:key="item.key"
				class="confirm-queue-item"
				:class="{ 'confirm-queue-item-ready': item.assetReady, 'confirm-queue-item-focused': item.key === focusedChannel }"
				@click="focusItem(item)"
			>
				<xicheng-icon :name="item.icon" :variant="item.assetReady ? 'primary' : 'soft'" :size="18" />
				<view class="confirm-queue-copy">
					<text class="confirm-queue-label">{{ item.label }}</text>
					<text class="confirm-queue-desc">{{ item.desc }}</text>
				</view>
				<view class="confirm-queue-side">
					<text class="confirm-queue-status">{{ item.statusText }}</text>
					<button class="confirm-queue-action" :class="{ 'confirm-queue-action-primary': item.assetReady }" @click.stop="confirmItem(item)">
						{{ item.actionText }}
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengPublishConfirmQueue',
	props: {
		items: {
			type: Array,
			default: () => []
		},
		focusedChannel: {
			type: String,
			default: 'xinghe'
		}
	},
	emits: ['focus', 'confirm'],
	computed: {
		normalizedItems() {
			return (Array.isArray(this.items) ? this.items : []).map((item, index) => ({
				key: item.key || `publish-${index}`,
				icon: item.icon || 'check',
				label: item.label || '',
				desc: item.desc || '',
				assetReady: item.assetReady === true,
				statusText: item.statusText || (item.assetReady ? '素材已生成' : '待生成素材'),
				actionText: item.actionText || (item.assetReady ? '继续确认' : '生成素材')
			}))
		}
	},
	methods: {
		focusItem(item = {}) {
			this.$emit('focus', item)
		},
		confirmItem(item = {}) {
			this.$emit('confirm', item)
		}
	}
}
</script>

<style scoped>
.xicheng-publish-confirm-queue {
	margin-top: 24rpx;
	padding: 28rpx;
	border-radius: 34rpx;
}
.confirm-queue-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}
.confirm-queue-kicker,
.confirm-queue-title,
.confirm-queue-count,
.confirm-queue-label,
.confirm-queue-desc,
.confirm-queue-status {
	display: block;
}
.confirm-queue-kicker {
	color: #B5945E;
	font-size: 23rpx;
	font-weight: 900;
}
.confirm-queue-title {
	margin-top: 8rpx;
	color: #102F29;
	font-size: 32rpx;
	line-height: 1.25;
	font-weight: 900;
}
.confirm-queue-count {
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(31, 110, 90, 0.1);
	color: #1F6E5A;
	font-size: 21rpx;
	font-weight: 900;
	white-space: nowrap;
}
.confirm-queue-list {
	display: grid;
	gap: 14rpx;
	margin-top: 22rpx;
}
.confirm-queue-item {
	display: grid;
	grid-template-columns: 46rpx minmax(0, 1fr) auto;
	align-items: center;
	gap: 14rpx;
	padding: 18rpx;
	border-radius: 24rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.14);
	background: rgba(255, 248, 234, 0.68);
	box-sizing: border-box;
}
.confirm-queue-item-ready {
	border-color: rgba(31, 110, 90, 0.24);
	background: rgba(31, 110, 90, 0.06);
}
.confirm-queue-item-focused {
	box-shadow: inset 0 0 0 2rpx rgba(31, 110, 90, 0.18);
}
.confirm-queue-copy {
	min-width: 0;
}
.confirm-queue-label {
	color: #102F29;
	font-size: 25rpx;
	line-height: 1.3;
	font-weight: 900;
}
.confirm-queue-desc {
	margin-top: 6rpx;
	color: #746F68;
	font-size: 21rpx;
	line-height: 1.35;
}
.confirm-queue-side {
	display: grid;
	justify-items: end;
	gap: 10rpx;
}
.confirm-queue-status {
	color: #8A6B33;
	font-size: 20rpx;
	font-weight: 900;
	white-space: nowrap;
}
.confirm-queue-item-ready .confirm-queue-status {
	color: #1F6E5A;
}
.confirm-queue-action {
	min-width: 118rpx;
	height: 48rpx;
	padding: 0 16rpx;
	border: 0;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.14);
	color: #7A633D;
	font-size: 21rpx;
	font-weight: 900;
	line-height: 48rpx;
}
.confirm-queue-action-primary {
	background: #1F6E5A;
	color: #FFFDF8;
}
</style>
