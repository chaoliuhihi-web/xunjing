<template>
	<view class="xicheng-pdf-print-preview">
		<view class="print-page-stage xicheng-paper-card">
			<view class="print-page-sheet" :class="`print-page-sheet-${currentPreviewPage.type}`">
				<view class="sheet-watermark"></view>
				<view class="sheet-head">
					<text class="sheet-title">{{ currentPreviewPage.title }}</text>
					<text class="sheet-subtitle">{{ currentPreviewPage.subtitle }}</text>
				</view>
				<image v-if="currentPreviewPage.image" class="sheet-image" :src="currentPreviewPage.image" mode="aspectFill" />
				<view v-if="currentPreviewPage.type === 'cover'" class="sheet-route">
					<view v-for="(stop, index) in routeStops" :key="stop" class="sheet-route-stop">
						<text class="sheet-route-index">{{ index + 1 }}</text>
						<text class="sheet-route-name">{{ stop }}</text>
					</view>
				</view>
				<view v-else-if="currentPreviewPage.type === 'route'" class="sheet-mini-map">
					<view class="sheet-map-water sheet-map-water-left"></view>
					<view class="sheet-map-water sheet-map-water-right"></view>
					<view class="sheet-map-line"></view>
					<view v-for="(stop, index) in routeStops.slice(0, 4)" :key="stop" class="sheet-map-pin" :class="`sheet-map-pin-${index + 1}`">
						<text>{{ index + 1 }}</text>
					</view>
				</view>
				<view v-else-if="currentPreviewPage.type === 'photos'" class="sheet-photo-grid">
					<image v-for="photo in selectedPhotos" :key="photo.label" class="sheet-photo" :src="photo.image" mode="aspectFill" />
				</view>
				<view v-else class="sheet-text-blocks">
					<text v-for="line in currentPreviewPage.lines" :key="line" class="sheet-text-line">{{ line }}</text>
				</view>
				<view class="sheet-companion">
					<image class="sheet-companion-avatar" :src="companionAvatar" mode="aspectFit" />
					<text>{{ currentPreviewPage.caption }}</text>
				</view>
			</view>
		</view>

		<view class="print-page-counter">
			<button class="print-page-counter-button print-page-counter-prev" :disabled="currentPageIndex === 0" aria-label="上一页" @click="$emit('select-page', currentPageIndex - 1)"><xicheng-icon name="back" variant="plain" :size="22" :disabled="currentPageIndex === 0" /></button>
			<text class="print-page-counter-label">页码预览 第 {{ currentPageIndex + 1 }} / {{ previewPages.length }} 页</text>
			<button class="print-page-counter-button print-page-counter-next" :disabled="currentPageIndex === previewPages.length - 1" aria-label="下一页" @click="$emit('select-page', currentPageIndex + 1)"><xicheng-icon name="next" variant="plain" :size="22" :disabled="currentPageIndex === previewPages.length - 1" /></button>
		</view>

		<scroll-view class="print-thumbnail-strip" scroll-x :show-scrollbar="false">
			<view class="thumbnail-row">
				<view
					v-for="(page, index) in previewPages"
					:key="page.label"
					class="thumbnail-item"
					:class="{ 'thumbnail-item-active': index === currentPageIndex }"
					@click="$emit('select-page', index)"
				>
					<view class="thumbnail-paper">
						<image v-if="page.image" class="thumbnail-image" :src="page.image" mode="aspectFill" />
						<text class="thumbnail-no">P{{ page.pageNo }}</text>
					</view>
					<text class="thumbnail-label">{{ page.label }}</text>
				</view>
			</view>
		</scroll-view>

		<view v-if="showAllPagesPreview" class="print-all-pages-overview xicheng-paper-card">
			<view class="all-pages-head">
				<view>
					<text class="all-pages-kicker">全页总览</text>
					<text class="all-pages-title">打印前逐页检查</text>
				</view>
				<text class="all-pages-count">{{ previewPages.length }} 页</text>
			</view>
			<view class="all-pages-grid">
				<view
					v-for="page in previewPages"
					:key="`all-page-${page.pageNo}`"
					class="all-page-item"
					:class="{ 'all-page-item-active': page.pageNo - 1 === currentPageIndex }"
				>
					<view class="all-page-mini-sheet" @click="$emit('select-page', page.pageNo - 1)">
						<image v-if="page.image" class="all-page-mini-image" :src="page.image" mode="aspectFill" />
						<text class="all-page-mini-no">P{{ page.pageNo }}</text>
					</view>
					<text class="all-page-label">{{ page.label }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengPdfPrintPreview',
	props: {
		previewPages: {
			type: Array,
			default: () => []
		},
		currentPageIndex: {
			type: Number,
			default: 0
		},
		currentPreviewPage: {
			type: Object,
			default: () => ({})
		},
		routeStops: {
			type: Array,
			default: () => []
		},
		selectedPhotos: {
			type: Array,
			default: () => []
		},
		companionAvatar: {
			type: String,
			default: ''
		},
		showAllPagesPreview: {
			type: Boolean,
			default: false
		}
	},
	emits: ['select-page']
}
</script>

<style scoped>
.print-page-stage {
	margin-top: 22rpx;
	padding: 26rpx;
	border-radius: 26rpx;
}
.print-page-sheet {
	position: relative;
	min-height: 720rpx;
	padding: 44rpx 42rpx 34rpx;
	border-radius: 12rpx;
	background: #FFFDF8;
	box-shadow: 0 18rpx 46rpx rgba(36, 31, 24, 0.16);
	overflow: hidden;
	box-sizing: border-box;
}
.sheet-watermark {
	position: absolute;
	right: 18rpx;
	bottom: 14rpx;
	width: 190rpx;
	height: 150rpx;
	border: 2rpx solid rgba(181, 148, 94, 0.12);
	border-radius: 90rpx 90rpx 12rpx 12rpx;
}
.sheet-head {
	position: relative;
	z-index: 1;
	text-align: center;
}
.sheet-title,
.sheet-subtitle,
.sheet-companion text,
.sheet-text-line,
.thumbnail-label {
	display: block;
}
.sheet-title {
	color: #102F29;
	font-size: 44rpx;
	line-height: 1.18;
	font-weight: 900;
}
.sheet-subtitle {
	margin-top: 14rpx;
	font-size: 25rpx;
	color: #5C574F;
}
.sheet-image {
	position: relative;
	z-index: 1;
	width: 100%;
	height: 330rpx;
	margin-top: 34rpx;
	border-radius: 8rpx 8rpx 38rpx 38rpx;
}
.sheet-route {
	position: relative;
	z-index: 1;
	display: flex;
	justify-content: space-between;
	gap: 12rpx;
	margin-top: 28rpx;
	padding-top: 20rpx;
	border-top: 2rpx dashed rgba(181, 148, 94, 0.46);
}
.sheet-route-stop {
	text-align: center;
	flex: 1;
	min-width: 0;
}
.sheet-route-index,
.sheet-map-pin text {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 42rpx;
	height: 42rpx;
	border-radius: 999px;
	background: #173F35;
	color: #FFF9EC;
	font-size: 24rpx;
	font-weight: 900;
}
.sheet-route-name {
	display: block;
	margin-top: 9rpx;
	font-size: 21rpx;
	color: #173F35;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.sheet-mini-map {
	position: relative;
	height: 330rpx;
	margin-top: 34rpx;
	border-radius: 18rpx;
	background: linear-gradient(90deg, rgba(181, 148, 94, 0.12) 1rpx, transparent 1rpx), linear-gradient(0deg, rgba(181, 148, 94, 0.12) 1rpx, transparent 1rpx), #F8F0DF;
	background-size: 54rpx 54rpx;
	overflow: hidden;
}
.sheet-map-water {
	position: absolute;
	border-radius: 999px;
	background: rgba(142, 185, 190, 0.42);
}
.sheet-map-water-left {
	left: 116rpx;
	top: 78rpx;
	width: 210rpx;
	height: 132rpx;
}
.sheet-map-water-right {
	right: 80rpx;
	top: 72rpx;
	width: 122rpx;
	height: 180rpx;
}
.sheet-map-line {
	position: absolute;
	left: 108rpx;
	right: 102rpx;
	top: 176rpx;
	height: 100rpx;
	border-left: 6rpx solid #173F35;
	border-bottom: 6rpx solid #173F35;
	border-radius: 0 0 0 38rpx;
}
.sheet-map-pin {
	position: absolute;
	z-index: 2;
}
.sheet-map-pin-1 {
	left: 86rpx;
	bottom: 52rpx;
}
.sheet-map-pin-2 {
	left: 188rpx;
	top: 130rpx;
}
.sheet-map-pin-3 {
	right: 150rpx;
	top: 104rpx;
}
.sheet-map-pin-4 {
	right: 74rpx;
	bottom: 58rpx;
}
.sheet-photo-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 34rpx;
}
.sheet-photo {
	width: 100%;
	height: 152rpx;
	border-radius: 16rpx;
}
.sheet-text-blocks {
	margin-top: 34rpx;
	padding: 26rpx;
	border-radius: 20rpx;
	background: rgba(255, 248, 234, 0.72);
}
.sheet-text-line {
	font-size: 26rpx;
	line-height: 1.72;
	color: #3E3831;
}
.sheet-companion {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	gap: 18rpx;
	margin-top: 32rpx;
}
.sheet-companion-avatar {
	width: 106rpx;
	height: 106rpx;
	flex-shrink: 0;
}
.sheet-companion text {
	flex: 1;
	padding: 18rpx 22rpx;
	border-radius: 18rpx;
	background: rgba(255, 252, 246, 0.92);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
	font-size: 23rpx;
	line-height: 1.48;
	color: #5C574F;
}
.print-page-counter {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 18rpx;
	margin-top: 16rpx;
	color: #8C8278;
	font-size: 25rpx;
}
.print-page-counter-button {
	width: 76rpx;
	height: 76rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 999rpx;
	padding: 0;
	margin: 0;
	background: rgba(255, 252, 246, 0.94);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
	box-shadow: 0 10rpx 22rpx rgba(36, 31, 24, 0.08);
}
.print-page-counter-button[disabled] {
	opacity: 0.46;
	box-shadow: none;
}
.print-page-counter-label {
	padding: 10rpx 30rpx;
	border-radius: 999px;
	background: rgba(255, 252, 246, 0.94);
	border: 1rpx solid rgba(181, 148, 94, 0.14);
}
.print-thumbnail-strip {
	margin-top: 20rpx;
	white-space: nowrap;
}
.thumbnail-row {
	display: flex;
	align-items: center;
	gap: 18rpx;
	padding: 0 2rpx 8rpx;
}
.thumbnail-item {
	width: 112rpx;
	flex-shrink: 0;
	text-align: center;
}
.thumbnail-paper {
	position: relative;
	height: 146rpx;
	border-radius: 10rpx;
	background: #FFFDF8;
	border: 2rpx solid rgba(181, 148, 94, 0.16);
	overflow: hidden;
}
.thumbnail-item-active .thumbnail-paper {
	border-color: #173F35;
	box-shadow: 0 10rpx 24rpx rgba(16, 47, 41, 0.16);
}
.thumbnail-image {
	width: 100%;
	height: 96rpx;
}
.thumbnail-no {
	position: absolute;
	left: 8rpx;
	bottom: 8rpx;
	font-size: 19rpx;
	font-weight: 900;
	color: #B5945E;
}
.thumbnail-label {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #4C463E;
}
.print-all-pages-overview { margin-top: 22rpx; padding: 24rpx; border-radius: 26rpx; }
.all-pages-head { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; }
.all-pages-kicker,
.all-pages-title,
.all-pages-count,
.all-page-label { display: block; }
.all-pages-kicker { color: #B5945E; font-size: 22rpx; font-weight: 800; }
.all-pages-title { margin-top: 6rpx; color: #102F29; font-size: 30rpx; font-weight: 900; }
.all-pages-count { padding: 9rpx 18rpx; border-radius: 999rpx; background: rgba(23, 63, 53, 0.08); color: #173F35; font-size: 22rpx; font-weight: 800; }
.all-pages-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18rpx; margin-top: 22rpx; }
.all-page-item { min-width: 0; text-align: center; }
.all-page-mini-sheet { position: relative; height: 150rpx; border-radius: 10rpx; background: #FFFDF8; border: 2rpx solid rgba(181, 148, 94, 0.18); overflow: hidden; }
.all-page-item-active .all-page-mini-sheet { border-color: #173F35; box-shadow: 0 10rpx 22rpx rgba(16, 47, 41, 0.14); }
.all-page-mini-image { width: 100%; height: 96rpx; }
.all-page-mini-no { position: absolute; left: 9rpx; bottom: 8rpx; color: #B5945E; font-size: 19rpx; font-weight: 900; }
.all-page-label { margin-top: 8rpx; color: #4C463E; font-size: 22rpx; }
</style>
