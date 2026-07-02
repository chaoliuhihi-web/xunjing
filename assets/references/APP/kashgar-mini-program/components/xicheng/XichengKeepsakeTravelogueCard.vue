<template>
	<view class="xicheng-keepsake-travelogue-card" @click="$emit('open', item)">
		<view class="keepsake-cover">
			<image class="keepsake-thumb" :src="thumb" mode="aspectFill" />
			<text class="keepsake-cover-badge">封面</text>
		</view>
		<view class="keepsake-copy">
			<view class="keepsake-title-line">
				<text class="keepsake-title">{{ title }}</text>
				<text class="keepsake-type">{{ typeLabel }}</text>
			</view>
			<text class="keepsake-date">{{ createdAt }}</text>
			<text class="keepsake-desc">{{ desc }}</text>
			<view class="keepsake-meta-row">
				<view v-for="meta in metaItems" :key="meta.key" class="keepsake-primary-meta">
					<xicheng-icon :name="meta.icon" variant="plain" :size="13" />
					<text>{{ getMetaValue(meta) }}</text>
				</view>
			</view>
			<view class="keepsake-actions">
				<button class="keepsake-button keepsake-button-primary" @click.stop="$emit('read', item)">{{ primaryActionLabel }}</button>
				<button class="keepsake-button" @click.stop="$emit('share', item)">{{ secondaryActionLabel }}</button>
				<button class="keepsake-button" @click.stop="$emit('print', item)">打印 PDF</button>
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
			if (this.item.assetType === 'draft') return '未发布'
			return this.item.templateLabel || '精美游记'
		},
		thumb() {
			return this.item.thumb || this.defaultThumb
		},
		createdAt() {
			return this.item.createdAt || '2025-05-15 创建'
		},
		metaItems() {
			return [
				{ key: 'places', icon: 'location', fallback: '3 个地点' },
				{ key: 'duration', icon: 'record', fallback: '2.5 小时' },
				{ key: 'distance', icon: 'route', fallback: '步行约 3.2 公里' }
			]
		},
		primaryActionLabel() {
			return this.item.assetType === 'draft' ? '继续编辑' : '继续阅读'
		},
		secondaryActionLabel() {
			return this.item.assetType === 'pdf' ? '查看素材' : '分享'
		}
	},
	methods: {
		getMetaValue(meta = {}) {
			return (this.item.meta && this.item.meta[meta.key]) || this.item[`${meta.key}Text`] || meta.fallback
		}
	}
}
</script>

<style scoped>
.xicheng-keepsake-travelogue-card {
	display: grid;
	grid-template-columns: 204rpx 1fr;
	align-items: stretch;
	gap: 16rpx;
	padding: 16rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.16);
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.78);
	box-shadow: 0 10rpx 28rpx rgba(23, 63, 53, 0.06);
}
.keepsake-cover {
	position: relative;
	min-height: 204rpx;
}
.keepsake-thumb {
	width: 100%;
	height: 100%;
	min-height: 204rpx;
	border-radius: 18rpx;
	background: rgba(23, 63, 53, 0.08);
}
.keepsake-cover-badge {
	position: absolute;
	top: 10rpx;
	left: 10rpx;
	padding: 6rpx 10rpx;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.82);
	color: #FFF8EA;
	font-size: 18rpx;
	font-weight: 900;
}
.keepsake-copy {
	flex: 1;
	min-width: 0;
}
.keepsake-title-line {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8rpx;
}
.keepsake-title,
.keepsake-type,
.keepsake-date,
.keepsake-desc {
	display: block;
}
.keepsake-title {
	color: #102F29;
	font-size: 25rpx;
	line-height: 1.3;
	font-weight: 900;
}
.keepsake-type {
	padding: 6rpx 10rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.12);
	color: #8D6A33;
	font-size: 18rpx;
	font-weight: 900;
	white-space: nowrap;
}
.keepsake-date {
	margin-top: 6rpx;
	color: #746F68;
	font-size: 20rpx;
}
.keepsake-desc {
	margin-top: 8rpx;
	max-height: 62rpx;
	overflow: hidden;
	color: #746F68;
	font-size: 22rpx;
	line-height: 1.4;
}
.keepsake-meta-row {
	display: flex;
	flex-wrap: wrap;
	gap: 8rpx 12rpx;
	margin-top: 10rpx;
	padding-top: 10rpx;
	border-top: 1rpx solid rgba(181, 148, 94, 0.14);
}
.keepsake-primary-meta {
	display: flex;
	align-items: center;
	gap: 6rpx;
	color: #5F554A;
	font-size: 19rpx;
	white-space: nowrap;
}
.keepsake-actions {
	display: grid;
	grid-template-columns: 1.12fr 0.88fr 1fr;
	gap: 8rpx;
	margin-top: 10rpx;
}
.keepsake-button {
	min-width: 0;
	min-height: 44rpx;
	margin: 0;
	padding: 0 6rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.9);
	color: #173F35;
	font-size: 18rpx;
	line-height: 44rpx;
	font-weight: 900;
	white-space: nowrap;
}
.keepsake-button-primary {
	background: #173F35;
	color: #FFF8EA;
}
.keepsake-button::after {
	border: 0;
}
</style>
