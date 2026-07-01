<template>
	<view class="map-import-route-card xicheng-paper-card">
		<view class="map-import-head">
			<view>
				<text class="map-import-kicker">一键导入攻略</text>
				<text class="map-import-title">从图文灵感生成可走路线</text>
			</view>
			<button class="map-import-primary xicheng-primary-action" @click="$emit('import-guide')">粘贴攻略</button>
		</view>
		<view class="map-import-step-row">
			<text>AI 提取地点</text>
			<text>匹配官方 POI</text>
			<text>生成可走路线</text>
		</view>
		<view class="map-import-source-row">
			<view v-for="source in mapImportSources" :key="source.title" class="map-import-source-chip">
				<text class="map-import-source-title">{{ source.title }}</text>
				<text class="map-import-source-desc">{{ source.desc }}</text>
			</view>
		</view>
		<view class="map-import-poi-rail">
			<view v-for="poi in matchedImportPois" :key="poi.poiCode || poi.poiName" class="map-import-poi-card">
				<text class="map-import-poi-name">{{ poi.poiName }}</text>
				<text class="map-import-poi-theme">{{ poi.theme }}</text>
			</view>
		</view>
		<view class="map-import-selected-summary">
			<view>
				<text class="map-import-selected-label">当前选点</text>
				<text class="map-import-selected-title">{{ selectedMapPoiSummary.poiName }}</text>
				<text class="map-import-selected-copy">{{ selectedMapPoiSummary.summary }}</text>
			</view>
			<button class="map-import-secondary xicheng-secondary-action" @click="$emit('generate-route')">
				从当前 POI 生成路线
			</button>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengMapImportGuide',
	props: {
		mapImportSources: {
			type: Array,
			default: () => []
		},
		matchedImportPois: {
			type: Array,
			default: () => []
		},
		selectedMapPoiSummary: {
			type: Object,
			default: () => ({})
		}
	},
	emits: ['import-guide', 'generate-route']
}
</script>

<style scoped>
.map-import-route-card {
	margin-top: 24rpx;
	padding: 28rpx;
	border-radius: 34rpx;
}
.map-import-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}
.map-import-kicker,
.map-import-selected-label,
.map-import-source-title,
.map-import-source-desc,
.map-import-poi-name,
.map-import-poi-theme,
.map-import-title,
.map-import-selected-title,
.map-import-selected-copy {
	display: block;
}
.map-import-kicker,
.map-import-selected-label {
	color: #B8812B;
	font-size: 22rpx;
	line-height: 1.35;
	font-weight: 800;
}
.map-import-title {
	margin-top: 8rpx;
	color: #102F29;
	font-size: 36rpx;
	line-height: 1.2;
	font-weight: 900;
}
.map-import-primary {
	flex-shrink: 0;
	width: 170rpx;
	height: 66rpx;
	line-height: 66rpx;
	border-radius: 999rpx;
	font-size: 25rpx;
	font-weight: 900;
	padding: 0;
}
.map-import-step-row,
.map-import-source-row,
.map-import-poi-rail {
	display: grid;
	gap: 10rpx;
	margin-top: 18rpx;
}
.map-import-step-row {
	grid-template-columns: repeat(3, minmax(0, 1fr));
	margin-top: 24rpx;
}
.map-import-step-row text {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 58rpx;
	border-radius: 16rpx;
	background: rgba(23, 63, 53, 0.08);
	color: #173F35;
	font-size: 22rpx;
	line-height: 1.25;
	font-weight: 900;
	text-align: center;
}
.map-import-source-row,
.map-import-poi-rail {
	grid-template-columns: repeat(4, minmax(0, 1fr));
}
.map-import-source-chip,
.map-import-poi-card {
	border: 1rpx solid rgba(181, 148, 94, 0.16);
	background: rgba(255, 252, 246, 0.76);
	box-sizing: border-box;
}
.map-import-source-chip {
	min-height: 96rpx;
	padding: 14rpx 8rpx;
	border-radius: 18rpx;
	text-align: center;
}
.map-import-source-title,
.map-import-poi-name {
	color: #102F29;
	font-size: 23rpx;
	line-height: 1.25;
	font-weight: 900;
}
.map-import-source-desc,
.map-import-poi-theme {
	margin-top: 7rpx;
	color: rgba(16, 47, 41, 0.58);
	font-size: 18rpx;
	line-height: 1.25;
}
.map-import-poi-card {
	min-height: 104rpx;
	padding: 16rpx 12rpx;
	border-radius: 20rpx;
}
.map-import-poi-name,
.map-import-poi-theme {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.map-import-poi-theme {
	color: #B8812B;
	font-size: 20rpx;
	font-weight: 800;
}
.map-import-selected-summary {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 210rpx;
	align-items: center;
	gap: 18rpx;
	margin-top: 20rpx;
	padding: 20rpx;
	border-radius: 24rpx;
	background: linear-gradient(135deg, rgba(23, 63, 53, 0.08), rgba(184, 129, 43, 0.08));
}
.map-import-selected-title {
	margin-top: 6rpx;
	color: #102F29;
	font-size: 30rpx;
	line-height: 1.25;
	font-weight: 900;
}
.map-import-selected-copy {
	margin-top: 8rpx;
	color: rgba(16, 47, 41, 0.66);
	font-size: 22rpx;
	line-height: 1.45;
}
.map-import-secondary {
	width: 210rpx;
	min-height: 86rpx;
	line-height: 1.25;
	padding: 0 14rpx;
	border-radius: 20rpx;
	font-size: 23rpx;
	font-weight: 900;
	white-space: normal;
}
</style>
