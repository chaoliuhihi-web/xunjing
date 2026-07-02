<template>
	<view class="xicheng-cultural-map">
		<view class="xicheng-map-title-row">
			<view>
				<text class="xicheng-map-title">西城文旅地图</text>
				<text class="xicheng-map-subtitle">POI 地图 · 路线生成</text>
			</view>
			<button class="xicheng-map-layer-button" @click="$emit('toggle-layer')">
				<xicheng-icon name="layer" variant="plain" :size="25" />
				<text>图层</text>
			</button>
		</view>

		<view class="xicheng-map-canvas">
			<xicheng-cultural-map-backdrop />

			<view
				v-for="segment in routeSegments"
				:key="segment.key"
				class="xicheng-map-route-path xicheng-map-route-segment"
				:style="getRouteSegmentStyle(segment)"
			></view>
			<view
				v-for="(stop, index) in routeStopMarkers"
				:key="`route-stop-${stop.poiCode || stop.poiName}-${index}`"
				class="xicheng-map-route-stop"
				:style="getPoiPositionStyle(stop, index)"
			>
				<text>{{ index + 1 }}</text>
			</view>

			<view
				v-for="poi in positionedPois"
				:key="poi.poiCode"
				class="xicheng-map-poi"
				:style="getPoiPositionStyle(poi)"
				@click.stop="selectPoi(poi)"
			>
				<view
					class="xicheng-map-poi-pin"
					:class="{ 'xicheng-map-poi-pin-active': selectedPoiCode === poi.poiCode, 'xicheng-map-poi-pin-route': isRouteStop(poi) }"
					:style="`--pin-color:${getCategoryColor(poi.categoryKey)};`"
				>
					<xicheng-icon :name="poi.iconName || 'location'" variant="primary" :size="17" />
				</view>
				<text class="xicheng-map-poi-label">{{ poi.poiName }}</text>
			</view>

			<view class="xicheng-map-control-stack">
				<button class="xicheng-map-control" @click="$emit('locate')">
					<xicheng-icon name="location" variant="plain" :size="22" />
					<text>定位</text>
				</button>
				<button class="xicheng-map-control" @click="$emit('toggle-layer')">
					<xicheng-icon name="layer" variant="plain" :size="22" />
					<text>图层</text>
				</button>
				<button class="xicheng-map-control" @click="$emit('zoom-in')">
					<xicheng-icon name="plus" variant="plain" :size="21" />
					<text>放大</text>
				</button>
			</view>

			<xicheng-cultural-map-poi-sheet
				v-if="selectedPoi"
				:selected-poi="selectedPoi"
				:category-label="getCategoryLabel(selectedPoi.categoryKey)"
				@close="clearSelectedPoi"
				@navigate="$emit('navigate-poi', selectedPoi)"
				@ask="$emit('ask-poi', selectedPoi)"
				@add-to-route="$emit('add-poi-to-route', selectedPoi)"
			/>
		</view>
	</view>
</template>

<script>
import XichengCulturalMapBackdrop from '@/components/xicheng/XichengCulturalMapBackdrop.vue'
import XichengCulturalMapPoiSheet from '@/components/xicheng/XichengCulturalMapPoiSheet.vue'
import {
	XICHENG_CULTURAL_MAP_CATEGORIES,
	XICHENG_CULTURAL_MAP_FALLBACK_POIS,
	XICHENG_CULTURAL_MAP_POI_LAYOUTS
} from '@/config/regions/xichengMap.js'

export default {
	name: 'XichengCulturalMap',
	components: {
		XichengCulturalMapBackdrop,
		XichengCulturalMapPoiSheet
	},
	props: {
		pois: {
			type: Array,
			default: () => []
		},
		routeStops: {
			type: Array,
			default: () => []
		}
	},
	emits: ['select-poi', 'navigate-poi', 'ask-poi', 'add-poi-to-route', 'toggle-layer', 'locate', 'zoom-in'],
	data() {
		return {
			selectedPoiCode: ''
		}
	},
	computed: {
		positionedPois() {
			const providedPois = Array.isArray(this.pois) && this.pois.length > 0 ? this.pois : XICHENG_CULTURAL_MAP_FALLBACK_POIS
			return providedPois.map((poi, index) => this.decoratePoi(poi, index))
		},
		routeStopMarkers() {
			const stops = Array.isArray(this.routeStops) ? this.routeStops : []
			return stops.map((stop, index) => this.decoratePoi(stop, index))
		},
		routeSegments() {
			const markers = this.routeStopMarkers
			return markers.slice(0, -1).map((start, index) => {
				const end = markers[index + 1]
				const deltaLeft = Number(end.left) - Number(start.left)
				const deltaTop = Number(end.top) - Number(start.top)
				return {
					key: `route-segment-${start.poiCode || index}-${end.poiCode || index + 1}`,
					left: Number(start.left),
					top: Number(start.top),
					width: Math.hypot(deltaLeft, deltaTop),
					angle: Math.atan2(deltaTop, deltaLeft) * 180 / Math.PI
				}
			})
		},
		selectedPoi() {
			if (!this.selectedPoiCode) return null
			return this.positionedPois.find(poi => poi.poiCode === this.selectedPoiCode) || null
		}
	},
	methods: {
		decoratePoi(poi = {}, index = 0) {
			const layout = XICHENG_CULTURAL_MAP_POI_LAYOUTS[poi.poiCode] || {}
			return {
				...poi,
				poiCode: poi.poiCode || `xicheng-map-poi-${index}`,
				poiName: poi.poiName || '西城文化点',
				summary: poi.summary || '西城官方文化点，适合加入 Citywalk 路线。',
				left: Number.isFinite(Number(poi.left)) ? Number(poi.left) : layout.left || (18 + (index * 12) % 66),
				top: Number.isFinite(Number(poi.top)) ? Number(poi.top) : layout.top || (28 + (index * 10) % 44),
				categoryKey: poi.categoryKey || layout.categoryKey || 'culture-building',
				iconName: poi.iconName || layout.iconName || 'location',
				image: poi.image || layout.image || ''
			}
		},
		getPoiPositionStyle(poi = {}) {
			return `left:${poi.left}%;top:${poi.top}%;`
		},
		getRouteSegmentStyle(segment = {}) {
			return `left:${segment.left}%;top:${segment.top}%;width:${segment.width}%;transform:rotate(${segment.angle}deg);`
		},
		getCategoryColor(categoryKey = '') {
			const category = XICHENG_CULTURAL_MAP_CATEGORIES.find(item => item.key === categoryKey)
			return category ? category.color : '#16805F'
		},
		getCategoryLabel(categoryKey = '') {
			const category = XICHENG_CULTURAL_MAP_CATEGORIES.find(item => item.key === categoryKey)
			return category ? category.label : '文化建筑'
		},
		isRouteStop(poi = {}) {
			const stops = Array.isArray(this.routeStops) ? this.routeStops : []
			return stops.some(stop => stop.poiCode && stop.poiCode === poi.poiCode)
		},
		selectPoi(poi = {}) {
			this.selectedPoiCode = poi.poiCode || ''
			this.$emit('select-poi', poi)
		},
		clearSelectedPoi() {
			this.selectedPoiCode = ''
		}
	}
}
</script>

<style scoped>
.xicheng-cultural-map {
	position: relative;
	padding: 30rpx 28rpx 28rpx;
	border-radius: 34rpx;
	overflow: hidden;
	background:
		radial-gradient(circle at 62% 3%, rgba(184, 129, 43, 0.18) 0 2rpx, transparent 3rpx),
		linear-gradient(180deg, rgba(255, 252, 246, 0.99), rgba(250, 243, 229, 0.95));
	box-shadow: 0 18rpx 52rpx rgba(30, 37, 32, 0.12);
}

.xicheng-map-title-row {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 18rpx;
}

.xicheng-map-title,
.xicheng-map-subtitle {
	display: block;
}

.xicheng-map-title {
	font-size: 44rpx;
	line-height: 1.1;
	font-weight: 900;
	color: #102F29;
}

.xicheng-map-subtitle {
	margin-top: 10rpx;
	font-size: 28rpx;
	color: rgba(16, 47, 41, 0.62);
}

.xicheng-map-layer-button,
.xicheng-map-control {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6rpx;
	min-width: 86rpx;
	min-height: 86rpx;
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.92);
	box-shadow: 0 12rpx 30rpx rgba(26, 48, 39, 0.10);
	color: #173F35;
	font-size: 22rpx;
	font-weight: 700;
	padding: 10rpx;
}

.xicheng-map-canvas {
	position: relative;
	height: 780rpx;
	margin-top: 26rpx;
	border-radius: 30rpx;
	overflow: hidden;
	border: 1rpx solid rgba(181, 148, 94, 0.22);
	background:
		linear-gradient(90deg, rgba(181, 148, 94, 0.11) 1rpx, transparent 1rpx),
		linear-gradient(0deg, rgba(181, 148, 94, 0.10) 1rpx, transparent 1rpx),
		radial-gradient(circle at 24% 74%, rgba(111, 142, 84, 0.20), transparent 18%),
		radial-gradient(circle at 73% 18%, rgba(111, 142, 84, 0.18), transparent 22%),
		linear-gradient(135deg, #F6EDDA 0%, #F7F1E4 42%, #EEF4EA 100%);
	background-size: 72rpx 72rpx, 72rpx 72rpx, 100% 100%, 100% 100%, 100% 100%;
	box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.50);
}

.xicheng-map-route-path {
	position: absolute;
	z-index: 2;
	height: 12rpx;
	border-radius: 999rpx;
	background: #173F35;
	transform-origin: left center;
	box-shadow: 0 6rpx 16rpx rgba(16, 47, 41, 0.22);
	pointer-events: none;
}

.xicheng-map-route-segment::after {
	content: '';
	position: absolute;
	right: -6rpx;
	top: 50%;
	width: 12rpx;
	height: 12rpx;
	border-radius: 999rpx;
	background: #173F35;
	transform: translateY(-50%);
	box-shadow: 0 0 0 5rpx rgba(255, 252, 246, 0.82);
}

.xicheng-map-route-stop,
.xicheng-map-poi {
	position: absolute;
	z-index: 4;
	transform: translate(-50%, -50%);
}

.xicheng-map-route-stop {
	width: 58rpx;
	height: 58rpx;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF9EC;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
	font-weight: 900;
	border: 6rpx solid rgba(255, 252, 246, 0.92);
	box-shadow: 0 14rpx 28rpx rgba(16, 47, 41, 0.24);
	pointer-events: none;
}

.xicheng-map-poi {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4rpx;
}

.xicheng-map-poi-pin {
	width: 56rpx;
	height: 56rpx;
	border-radius: 999rpx 999rpx 999rpx 12rpx;
	background: var(--pin-color);
	transform: rotate(-45deg);
	display: flex;
	align-items: center;
	justify-content: center;
	border: 5rpx solid rgba(255, 252, 246, 0.95);
	box-shadow: 0 12rpx 28rpx rgba(16, 47, 41, 0.20);
}

.xicheng-map-poi-pin :deep(.xicheng-icon) {
	transform: rotate(45deg);
}

.xicheng-map-poi-pin-active {
	width: 76rpx;
	height: 76rpx;
	box-shadow: 0 16rpx 36rpx rgba(16, 47, 41, 0.28);
}

.xicheng-map-poi-pin-route {
	outline: 6rpx solid rgba(23, 63, 53, 0.18);
}

.xicheng-map-poi-label {
	max-width: 150rpx;
	padding: 8rpx 12rpx;
	border-radius: 10rpx;
	background: rgba(255, 252, 246, 0.90);
	color: #102F29;
	font-size: 23rpx;
	font-weight: 800;
	box-shadow: 0 6rpx 16rpx rgba(42, 47, 38, 0.08);
	white-space: nowrap;
}

.xicheng-map-control-stack {
	position: absolute;
	z-index: 5;
	right: 18rpx;
	top: 260rpx;
	display: flex;
	flex-direction: column;
	gap: 14rpx;
}

</style>
