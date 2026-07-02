<template>
	<view class="travelogue-approved-card xicheng-paper-card">
		<view class="travelogue-approved-section-head">
			<text class="travelogue-approved-section-title">今日素材</text>
			<text class="travelogue-approved-section-link" @click="$emit('scroll-draft')">查看全部</text>
		</view>
		<view class="travelogue-approved-material-grid">
			<view
				v-for="item in materialItems"
				:key="item.key"
				class="travelogue-approved-material-card"
			>
				<xicheng-icon :name="item.icon" variant="plain" :size="24" />
				<text class="material-label">{{ item.label }}</text>
				<text class="material-value">{{ item.value }}</text>
			</view>
		</view>
		<view class="travelogue-approved-ready-line" :class="{ 'ready-line-active': hasEvidence }">
			<xicheng-icon name="check" variant="plain" :size="18" />
			<text>{{ hasEvidence ? '素材充足，可生成草稿' : '素材不足，继续补充后再生成' }}</text>
		</view>
		<view class="travelogue-approved-draft-card">
			<image class="travelogue-approved-draft-image" :src="previewImage" mode="aspectFill" />
			<view class="travelogue-approved-draft-copy">
				<view class="travelogue-approved-draft-title-row">
					<text class="travelogue-approved-draft-title">{{ previewTitle }}</text>
					<text class="travelogue-approved-draft-status">{{ hasEvidence ? '草稿' : '待补充' }}</text>
				</view>
				<text class="travelogue-approved-draft-excerpt">{{ previewText }}</text>
				<text class="travelogue-approved-draft-meta">来自：白塔寺识别 · 什刹海路线 · {{ photoCount }} 张照片 · {{ qaCount }} 次问答</text>
				<button class="travelogue-approved-preview-button" @click="$emit('open-reader')">
					<xicheng-icon name="play" variant="primary" active :size="18" />
					<text>预览草稿</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengTravelogueMaterialDraftCard',
	emits: ['scroll-draft', 'open-reader'],
	props: {
		previewImage: { type: String, default: '' },
		previewTitle: { type: String, default: '' },
		previewText: { type: String, default: '' },
		materialCount: { type: Number, default: 0 },
		routeCount: { type: Number, default: 0 },
		photoCount: { type: Number, default: 0 },
		qaCount: { type: Number, default: 0 },
		hasEvidence: { type: Boolean, default: false }
	},
	computed: {
		materialItems() {
			return [
				{ key: 'poi', icon: 'location', label: '识别地点', value: `${this.materialCount} 个` },
				{ key: 'route', icon: 'route', label: '路线', value: `${this.routeCount} 条` },
				{ key: 'photo', icon: 'photo', label: '照片', value: `${this.photoCount} 张` },
				{ key: 'qa', icon: 'qa', label: '问答', value: `${this.qaCount} 条` }
			]
		}
	}
}
</script>

<style scoped>
.travelogue-approved-card {
	padding: 28rpx;
	border-radius: 32rpx;
	background: rgba(255, 253, 248, 0.94);
}

.travelogue-approved-section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}

.travelogue-approved-section-title,
.travelogue-approved-section-link,
.material-label,
.material-value,
.travelogue-approved-draft-title,
.travelogue-approved-draft-excerpt,
.travelogue-approved-draft-meta { display: block; }

.travelogue-approved-section-title {
	position: relative;
	padding-left: 22rpx;
	font-size: 34rpx;
	line-height: 1.25;
	font-weight: 900;
	color: #102F29;
}

.travelogue-approved-section-title::before {
	content: "";
	position: absolute;
	left: 0;
	top: 7rpx;
	width: 6rpx;
	height: 28rpx;
	border-radius: 999rpx;
	background: #B5945E;
}

.travelogue-approved-section-link {
	font-size: 24rpx;
	color: #746F68;
}

.travelogue-approved-material-grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 24rpx;
}

.travelogue-approved-material-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 0;
	min-height: 142rpx;
	padding: 18rpx 10rpx;
	border-radius: 22rpx;
	background: rgba(255, 252, 246, 0.82);
	border: 1rpx solid rgba(181, 148, 94, 0.14);
	box-sizing: border-box;
}

.material-label {
	margin-top: 10rpx;
	font-size: 22rpx;
	color: #746F68;
	white-space: nowrap;
}

.material-value {
	margin-top: 6rpx;
	font-size: 31rpx;
	font-weight: 900;
	color: #102F29;
}

.travelogue-approved-ready-line {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-top: 18rpx;
	padding: 18rpx 20rpx;
	border-radius: 20rpx;
	background: rgba(181, 148, 94, 0.10);
	color: #8A5B1E;
	font-size: 24rpx;
	font-weight: 800;
}

.ready-line-active { background: rgba(31, 110, 90, 0.10); color: #173F35; }

.travelogue-approved-draft-card {
	display: grid;
	grid-template-columns: 178rpx minmax(0, 1fr);
	gap: 20rpx;
	margin-top: 22rpx;
	padding: 18rpx;
	border-radius: 26rpx;
	background: #FFFFFF;
	border: 1rpx solid rgba(181, 148, 94, 0.14);
	box-shadow: 0 8rpx 22rpx rgba(35, 42, 34, 0.06);
}

.travelogue-approved-draft-image {
	width: 178rpx;
	height: 200rpx;
	border-radius: 22rpx;
	object-fit: cover;
}

.travelogue-approved-draft-copy { min-width: 0; }

.travelogue-approved-draft-title-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.travelogue-approved-draft-title {
	min-width: 0;
	flex: 1;
	font-size: 30rpx;
	line-height: 1.25;
	font-weight: 900;
	color: #102F29;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.travelogue-approved-draft-status {
	padding: 6rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.14);
	color: #8A5B1E;
	font-size: 20rpx;
	font-weight: 800;
}

.travelogue-approved-draft-excerpt {
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.52;
	color: rgba(16, 47, 41, 0.72);
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.travelogue-approved-draft-meta {
	margin-top: 12rpx;
	font-size: 22rpx;
	line-height: 1.4;
	color: #746F68;
}

.travelogue-approved-preview-button {
	width: 196rpx;
	height: 56rpx;
	margin: 14rpx 0 0;
	padding: 0 18rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #173F35, #0F332D);
	color: #FFFFFF;
	font-size: 23rpx;
	font-weight: 900;
	line-height: 1;
	white-space: nowrap;
	box-sizing: border-box;
}

.travelogue-approved-preview-button::after { display: none; }
</style>
