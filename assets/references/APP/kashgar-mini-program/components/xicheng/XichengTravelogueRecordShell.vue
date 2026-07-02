<template>
	<view class="travelogue-approved-record-shell">
		<view class="travelogue-approved-topbar">
			<view>
				<text class="travelogue-approved-page-title">记录</text>
				<text class="travelogue-approved-page-subtitle">游记草稿 · 足迹素材</text>
			</view>
			<button class="travelogue-approved-draftbox" @click="$emit('open-works')">
				<xicheng-icon name="travelogue" variant="plain" :size="20" />
				<text>草稿箱</text>
			</button>
		</view>
		<xicheng-travelogue-record-hero-card
			:preview-image="previewImage"
			:beihai-route-image="beihaiRouteImage"
			:baitasi-route-image="baitasiRouteImage"
			@generate="$emit('generate')"
			@add-photo="$emit('add-photo')"
		/>
		<view class="travelogue-approved-card xicheng-paper-card">
			<view class="travelogue-approved-section-head">
				<text class="travelogue-approved-section-title">今日素材</text>
				<text class="travelogue-approved-section-link" @click="$emit('scroll-draft')">查看全部</text>
			</view>
			<view class="travelogue-approved-material-grid">
				<view class="travelogue-approved-material-card">
					<xicheng-icon name="location" variant="plain" :size="24" />
					<text class="material-label">识别地点</text>
					<text class="material-value">{{ materialCount }} 个</text>
				</view>
				<view class="travelogue-approved-material-card">
					<xicheng-icon name="route" variant="plain" :size="24" />
					<text class="material-label">路线</text>
					<text class="material-value">{{ routeCount }} 条</text>
				</view>
				<view class="travelogue-approved-material-card">
					<xicheng-icon name="photo" variant="plain" :size="24" />
					<text class="material-label">照片</text>
					<text class="material-value">{{ photoCount }} 张</text>
				</view>
				<view class="travelogue-approved-material-card">
					<xicheng-icon name="qa" variant="plain" :size="24" />
					<text class="material-label">问答</text>
					<text class="material-value">{{ qaCount }} 条</text>
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
		<view class="travelogue-approved-card xicheng-paper-card">
			<view class="travelogue-approved-section-head">
				<text class="travelogue-approved-section-title">生成风格</text>
			</view>
			<view class="travelogue-approved-style-row">
				<button
					v-for="style in visibleStyleOptions"
					:key="style.key"
					:class="['travelogue-approved-style-chip', activeStyle === style.key ? 'travelogue-approved-style-chip-active' : '']"
					@click="$emit('apply-template', style)"
				>
					{{ style.title }}
				</button>
			</view>
		</view>
		<xicheng-travelogue-action-grid
			:has-reviewable-evidence="hasReviewableEvidence"
			@export-pdf="$emit('export-pdf')"
			@open-share="$emit('open-share', $event)"
			@open-works="$emit('open-works')"
		/>
		<view class="travelogue-approved-card xicheng-paper-card">
			<view class="travelogue-approved-section-head">
				<text class="travelogue-approved-section-title">最近记录</text>
				<text class="travelogue-approved-section-link" @click="$emit('open-works')">全部记录</text>
			</view>
			<view class="travelogue-approved-recent-row" @click="$emit('open-reader')">
				<image class="travelogue-approved-recent-image" :src="previewImage" mode="aspectFill" />
				<view class="travelogue-approved-recent-copy">
					<text class="travelogue-approved-recent-title">白塔寺文化线</text>
					<text class="travelogue-approved-recent-meta">约 2.5小时 · 3个景点 · 1.8公里</text>
				</view>
				<button class="travelogue-approved-recent-button">查看游记</button>
			</view>
		</view>
		<view class="travelogue-approved-tip-card xicheng-paper-card">
			<image class="travelogue-approved-tip-avatar" :src="companionAvatar" mode="aspectFit" />
			<view class="travelogue-approved-tip-bubble xicheng-companion-bubble">
				<text class="travelogue-approved-tip-title">小京提示：</text>
				<text class="travelogue-approved-tip-copy">精确轨迹默认隐藏，发布前可选择公开范围。</text>
			</view>
		</view>
	</view>
</template>

<script>
import XichengTravelogueActionGrid from '@/components/xicheng/XichengTravelogueActionGrid.vue'
import XichengTravelogueRecordHeroCard from '@/components/xicheng/XichengTravelogueRecordHeroCard.vue'

export default {
	name: 'XichengTravelogueRecordShell',
	components: { XichengTravelogueActionGrid, XichengTravelogueRecordHeroCard },
	props: {
		region: { type: Object, default: () => ({}) },
		previewImage: { type: String, default: '' },
		previewTitle: { type: String, default: '' },
		previewText: { type: String, default: '' },
		materialCount: { type: Number, default: 0 },
		routeCount: { type: Number, default: 0 },
		photoCount: { type: Number, default: 0 },
		qaCount: { type: Number, default: 0 },
		hasEvidence: { type: Boolean, default: false },
		hasReviewableEvidence: { type: Boolean, default: false },
		styleOptions: { type: Array, default: () => [] },
		activeStyle: { type: String, default: 'citywalk' }
	},
	emits: ['open-works', 'generate', 'add-photo', 'scroll-draft', 'open-reader', 'apply-template', 'export-pdf', 'open-share'],
	computed: {
		visibleStyleOptions() {
			return this.styleOptions.slice(0, 3)
		},
		routeThumbnails() {
			return this.region && this.region.visualAssets && this.region.visualAssets.routeThumbnails
				? this.region.visualAssets.routeThumbnails
				: {}
		},
		beihaiRouteImage() {
			return this.routeThumbnails['beihai-shichahai-waterfront'] || this.previewImage
		},
		baitasiRouteImage() {
			return this.routeThumbnails['baitasi-imperial-shichahai'] || this.previewImage
		},
		companionAvatar() {
			return this.region && this.region.companionAvatar ? this.region.companionAvatar : ''
		}
	}
}
</script>

<style scoped>
.travelogue-approved-record-shell {
	display: flex;
	flex-direction: column;
	gap: 22rpx;
}

.travelogue-approved-topbar {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 20rpx;
}

.travelogue-approved-page-title,
.travelogue-approved-page-subtitle,
.travelogue-approved-hero-title,
.travelogue-approved-hero-desc,
.travelogue-approved-section-title,
.travelogue-approved-section-link,
.material-label,
.material-value,
.travelogue-approved-draft-title,
.travelogue-approved-draft-excerpt,
.travelogue-approved-draft-meta,
.travelogue-approved-recent-title,
.travelogue-approved-recent-meta,
.travelogue-approved-tip-title,
.travelogue-approved-tip-copy {
	display: block;
}

.travelogue-approved-page-title {
	font-size: 58rpx;
	line-height: 1.1;
	font-weight: 900;
	color: #102F29;
}

.travelogue-approved-page-subtitle {
	margin-top: 14rpx;
	font-size: 28rpx;
	line-height: 1.4;
	color: #746F68;
}

.travelogue-approved-draftbox,
.travelogue-approved-primary,
.travelogue-approved-secondary,
.travelogue-approved-preview-button,
.travelogue-approved-style-chip,
.travelogue-approved-recent-button {
	margin: 0;
	padding: 0 18rpx;
	border-radius: 999rpx;
	font-weight: 900;
	line-height: 1;
	white-space: nowrap;
	box-sizing: border-box;
}

.travelogue-approved-draftbox::after,
.travelogue-approved-primary::after,
.travelogue-approved-secondary::after,
.travelogue-approved-preview-button::after,
.travelogue-approved-style-chip::after,
.travelogue-approved-recent-button::after {
	border: 0;
}

.travelogue-approved-draftbox,
.travelogue-approved-primary,
.travelogue-approved-secondary,
.travelogue-approved-preview-button,
.travelogue-approved-recent-button {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
}

.travelogue-approved-draftbox {
	min-width: 148rpx;
	height: 64rpx;
	background: rgba(255, 253, 248, 0.94);
	border: 1rpx solid rgba(181, 148, 94, 0.22);
	color: #102F29;
	font-size: 24rpx;
	box-shadow: 0 12rpx 28rpx rgba(35, 42, 34, 0.08);
}

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

.ready-line-active {
	background: rgba(31, 110, 90, 0.10);
	color: #173F35;
}

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

.travelogue-approved-draft-copy {
	min-width: 0;
}

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
	margin-top: 14rpx;
	background: linear-gradient(135deg, #173F35, #0F332D);
	color: #FFFFFF;
	font-size: 23rpx;
}

.travelogue-approved-style-row {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 24rpx;
}

.travelogue-approved-style-chip {
	height: 70rpx;
	background: rgba(255, 252, 246, 0.86);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
	color: #746F68;
	font-size: 27rpx;
}

.travelogue-approved-style-chip-active {
	background: linear-gradient(135deg, #173F35, #0F332D);
	color: #FFFFFF;
	box-shadow: 0 12rpx 24rpx rgba(16, 47, 41, 0.16);
}

.travelogue-approved-recent-row {
	display: grid;
	grid-template-columns: 146rpx minmax(0, 1fr) 142rpx;
	align-items: center;
	gap: 18rpx;
	margin-top: 22rpx;
}

.travelogue-approved-recent-image {
	width: 146rpx;
	height: 96rpx;
	border-radius: 18rpx;
	object-fit: cover;
}

.travelogue-approved-recent-copy {
	min-width: 0;
}

.travelogue-approved-recent-title {
	font-size: 28rpx;
	font-weight: 900;
	color: #102F29;
}

.travelogue-approved-recent-meta {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #746F68;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.travelogue-approved-recent-button {
	height: 58rpx;
	background: rgba(23, 63, 53, 0.08);
	color: #173F35;
	font-size: 22rpx;
}

.travelogue-approved-tip-card {
	display: grid;
	grid-template-columns: 170rpx minmax(0, 1fr);
	align-items: end;
	gap: 18rpx;
	padding: 18rpx 22rpx 0;
	border-radius: 32rpx;
	background:
		linear-gradient(135deg, rgba(255, 253, 248, 0.96), rgba(240, 229, 207, 0.62));
}

.travelogue-approved-tip-avatar {
	width: 160rpx;
	height: 174rpx;
}

.travelogue-approved-tip-bubble {
	margin-bottom: 24rpx;
	padding: 22rpx 24rpx;
}

.travelogue-approved-tip-title {
	font-size: 26rpx;
	font-weight: 900;
	color: #102F29;
}

.travelogue-approved-tip-copy {
	margin-top: 8rpx;
	font-size: 25rpx;
	line-height: 1.5;
	color: rgba(16, 47, 41, 0.72);
}
</style>
