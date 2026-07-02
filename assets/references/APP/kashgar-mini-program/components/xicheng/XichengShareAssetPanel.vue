<template>
	<view class="xicheng-share-asset-panel xicheng-paper-card">
		<view class="section-head">
			<text class="section-title">纪念产物</text>
			<text class="section-badge">{{ safeArtifactCount }} 个</text>
		</view>
		<view class="asset-grid">
			<view class="asset-tile" @click="this.$emit('create-moments')">
				<xicheng-icon name="photo" variant="primary" :size="22" />
				<text class="asset-title">朋友圈素材</text>
				<text class="asset-desc">图片文案 · 确认后发布</text>
			</view>
			<view class="asset-tile" @click="this.$emit('create-xiaohongshu')">
				<xicheng-icon name="edit" variant="primary" :size="22" />
				<text class="asset-title">小红书笔记</text>
				<text class="asset-desc">标题图集 · 标签文案</text>
			</view>
			<view class="asset-tile" @click="this.$emit('create-pdf')">
				<xicheng-icon name="source" variant="primary" :size="22" />
				<text class="asset-title">PDF 纪念册</text>
				<text class="asset-desc">保存 PDF · 系统打印</text>
			</view>
		</view>
		<view class="asset-shortcut-row">
			<button class="ghost-button xicheng-secondary-action" @click="this.$emit('open-reader')">预览精美游记</button>
			<button class="ghost-button xicheng-secondary-action" @click="this.$emit('open-pdf')">PDF 打印预览</button>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengShareAssetPanel',
	props: {
		artifactCount: {
			type: Number,
			default: 0
		}
	},
	emits: ['create-moments', 'create-xiaohongshu', 'create-pdf', 'open-reader', 'open-pdf'],
	computed: {
		safeArtifactCount() {
			const count = Number(this.artifactCount || 0)
			return Number.isFinite(count) && count > 0 ? Math.round(count) : 0
		}
	}
}
</script>

<style scoped>
.xicheng-share-asset-panel {
	margin-top: 24rpx;
	padding: 28rpx;
	border-radius: 34rpx;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}

.section-title,
.asset-title {
	color: #102F29;
	font-weight: 800;
}

.section-title {
	font-size: 30rpx;
}

.section-badge {
	color: #B5945E;
	font-size: 22rpx;
	font-weight: 700;
}

.asset-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 18rpx;
	margin-top: 24rpx;
}

.asset-tile {
	display: grid;
	gap: 12rpx;
	padding: 22rpx 18rpx;
	border-radius: 28rpx;
	background: rgba(23, 63, 53, 0.08);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
}

.asset-title,
.asset-desc {
	display: block;
}

.asset-title {
	font-size: 26rpx;
	line-height: 1.3;
}

.asset-desc {
	margin-top: 12rpx;
	color: #746F68;
	font-size: 24rpx;
	line-height: 1.55;
}

.asset-shortcut-row {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 20rpx;
}

.asset-shortcut-row button {
	margin: 0;
}
</style>
