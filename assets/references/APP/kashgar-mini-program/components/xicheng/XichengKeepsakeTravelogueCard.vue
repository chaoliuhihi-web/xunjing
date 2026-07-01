<template>
	<view class="xicheng-keepsake-travelogue-card" @click="$emit('open', item)">
		<image class="keepsake-thumb" :src="thumb" mode="aspectFill" />
		<view class="keepsake-copy">
			<view class="keepsake-title-line">
				<text class="keepsake-title">{{ title }}</text>
				<text class="keepsake-type">{{ typeLabel }}</text>
			</view>
			<text class="keepsake-desc">{{ desc }}</text>
			<view class="keepsake-actions">
				<button class="keepsake-button" @click.stop="$emit('read', item)">继续阅读</button>
				<button class="keepsake-button" @click.stop="$emit('share', item)">分享</button>
				<button class="keepsake-button keepsake-button-primary" @click.stop="$emit('print', item)">打印</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengKeepsakeTravelogueCard',
	props: {
		item: {
			type: Object,
			default: () => ({})
		},
		defaultThumb: {
			type: String,
			default: ''
		}
	},
	emits: ['open', 'read', 'share', 'print'],
	computed: {
		title() {
			return this.item.title || (this.item.assetType === 'pdf' ? 'PDF 纪念册' : '精美游记')
		},
		desc() {
			return this.item.desc || '已保存为可长期回看的西城纪念游记'
		},
		typeLabel() {
			if (this.item.assetType === 'pdf') return 'PDF 纪念册'
			if (this.item.assetType === 'draft') return '草稿'
			return '精美游记'
		},
		thumb() {
			return this.item.thumb || this.defaultThumb
		}
	}
}
</script>

<style scoped>
.xicheng-keepsake-travelogue-card {
	display: flex;
	align-items: stretch;
	gap: 18rpx;
	padding: 18rpx 0;
	border-bottom: 1rpx solid rgba(181, 148, 94, 0.18);
}
.keepsake-thumb {
	width: 142rpx;
	height: 164rpx;
	border-radius: 20rpx;
	background: rgba(23, 63, 53, 0.08);
	flex-shrink: 0;
}
.keepsake-copy {
	flex: 1;
	min-width: 0;
}
.keepsake-title-line {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
}
.keepsake-title,
.keepsake-type,
.keepsake-desc {
	display: block;
}
.keepsake-title {
	color: #102F29;
	font-size: 28rpx;
	line-height: 1.35;
	font-weight: 900;
}
.keepsake-type {
	padding: 7rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(31, 110, 90, 0.1);
	color: #1F6E5A;
	font-size: 20rpx;
	font-weight: 900;
	white-space: nowrap;
}
.keepsake-desc {
	margin-top: 8rpx;
	color: #746F68;
	font-size: 24rpx;
	line-height: 1.45;
}
.keepsake-actions {
	display: flex;
	gap: 12rpx;
	margin-top: 14rpx;
}
.keepsake-button {
	min-height: 52rpx;
	margin: 0;
	padding: 0 18rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.9);
	color: #173F35;
	font-size: 22rpx;
	line-height: 52rpx;
	font-weight: 900;
}
.keepsake-button-primary {
	background: #173F35;
	color: #FFF8EA;
}
.keepsake-button::after {
	border: 0;
}
</style>
