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
			<view class="xicheng-map-paper-grid"></view>
			<view class="xicheng-map-water xicheng-map-water-main"></view>
			<view class="xicheng-map-water xicheng-map-water-side"></view>
			<view class="xicheng-map-park xicheng-map-park-north"></view>
			<view class="xicheng-map-park xicheng-map-park-south"></view>
			<view class="xicheng-map-road xicheng-map-road-one"></view>
			<view class="xicheng-map-road xicheng-map-road-two"></view>
			<view class="xicheng-map-road xicheng-map-road-three"></view>
			<view
				v-for="sketch in mapSketches"
				:key="sketch.key"
				class="xicheng-map-sketch"
				:class="sketch.className"
			>
				<view class="xicheng-map-sketch-roof"></view>
				<view class="xicheng-map-sketch-body"></view>
			</view>
			<view
				v-for="tree in mapTrees"
				:key="tree.key"
				class="xicheng-map-tree"
				:style="`left:${tree.left}%;top:${tree.top}%;`"
			></view>
			<view class="xicheng-map-water-label xicheng-map-water-label-main">什刹海</view>
			<view class="xicheng-map-water-label xicheng-map-water-label-side">北海公园</view>
			<view class="xicheng-map-landmark xicheng-map-landmark-drum">鼓楼大街</view>
			<view class="xicheng-map-landmark xicheng-map-landmark-xisi">西四北大街</view>
			<view class="xicheng-map-landmark xicheng-map-landmark-dianmen">地安门西大街</view>
			<view class="xicheng-map-landmark xicheng-map-landmark-qianmen">前门大街</view>
			<view class="xicheng-map-landmark xicheng-map-landmark-xidan">西单</view>
			<view class="xicheng-map-landmark xicheng-map-landmark-district">西城区</view>

			<view class="xicheng-map-category-legend">
				<view
					v-for="category in mapCategories"
					:key="category.key"
					class="xicheng-map-category"
				>
					<view class="xicheng-map-category-dot" :style="`background:${category.color};`"></view>
					<text>{{ category.label }}</text>
				</view>
			</view>

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
import XichengCulturalMapPoiSheet from '@/components/xicheng/XichengCulturalMapPoiSheet.vue'

const DEFAULT_MAP_CATEGORIES = Object.freeze([
	{ key: 'culture-building', label: '文化建筑', color: '#16805F' },
	{ key: 'historic-site', label: '历史遗迹', color: '#A6783D' },
	{ key: 'hutong', label: '胡同院落', color: '#4E83A4' },
	{ key: 'food-shopping', label: '美食购物', color: '#D97A32' },
	{ key: 'nature', label: '自然景观', color: '#6F8E54' }
])

const FALLBACK_POI_LAYOUT = Object.freeze({
	'xicheng-baitasi': { left: 19, top: 63, categoryKey: 'culture-building', iconName: 'layer', image: '/static/xicheng/poi-baitasi-card.jpg' },
	'xicheng-imperial-temple': { left: 41, top: 70, categoryKey: 'historic-site', iconName: 'layer' },
	'xicheng-shichahai': { left: 50, top: 39, categoryKey: 'nature', iconName: 'location' },
	'xicheng-beihai': { left: 63, top: 28, categoryKey: 'nature', iconName: 'layer' },
	'xicheng-dashilar': { left: 72, top: 73, categoryKey: 'food-shopping', iconName: 'route' },
	'xicheng-beihai-north-gate': { left: 68, top: 27, categoryKey: 'culture-building', iconName: 'layer' },
	'xicheng-huguosi-street': { left: 72, top: 48, categoryKey: 'historic-site', iconName: 'layer' },
	'xicheng-hutong-yard': { left: 58, top: 55, categoryKey: 'hutong', iconName: 'location' },
	'xicheng-food-market': { left: 36, top: 58, categoryKey: 'food-shopping', iconName: 'route' }
})

const FALLBACK_POIS = Object.freeze([
	{ poiCode: 'xicheng-baitasi', poiName: '白塔寺', summary: '元大都古刹地标，白塔与胡同肌理相映成景。' },
	{ poiCode: 'xicheng-imperial-temple', poiName: '历代帝王庙', summary: '明清皇家礼制空间，适合串联古建与中轴叙事。' },
	{ poiCode: 'xicheng-shichahai', poiName: '什刹海', summary: '老北京水系与胡同生活交汇的慢行节点。' },
	{ poiCode: 'xicheng-beihai-north-gate', poiName: '北海北门', summary: '皇家园林北侧入口，适合作为水岸路线起点。' },
	{ poiCode: 'xicheng-huguosi-street', poiName: '护国寺街', summary: '从寺庙旧址延展出的京味街区和小吃线索。' },
	{ poiCode: 'xicheng-hutong-yard', poiName: '胡同院落', summary: '观察院落门楼、影壁和街巷尺度的生活场景。' },
	{ poiCode: 'xicheng-dashilar', poiName: '大栅栏', summary: '老字号与前门商业记忆交织的步行街区。' }
])

export default {
	name: 'XichengCulturalMap',
	components: {
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
		mapCategories() {
			return DEFAULT_MAP_CATEGORIES
		},
		mapSketches() {
			return [
				{ key: 'white-pagoda', className: 'xicheng-map-sketch-pagoda' },
				{ key: 'gate-north', className: 'xicheng-map-sketch-gate-north' },
				{ key: 'gate-south', className: 'xicheng-map-sketch-gate-south' },
				{ key: 'temple-east', className: 'xicheng-map-sketch-temple-east' }
			]
		},
		mapTrees() {
			return [
				{ key: 'tree-1', left: 18, top: 22 },
				{ key: 'tree-2', left: 28, top: 72 },
				{ key: 'tree-3', left: 38, top: 18 },
				{ key: 'tree-4', left: 52, top: 64 },
				{ key: 'tree-5', left: 76, top: 34 },
				{ key: 'tree-6', left: 82, top: 70 },
				{ key: 'tree-7', left: 66, top: 82 },
				{ key: 'tree-8', left: 13, top: 52 }
			]
		},
		positionedPois() {
			const providedPois = Array.isArray(this.pois) && this.pois.length > 0 ? this.pois : FALLBACK_POIS
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
			const layout = FALLBACK_POI_LAYOUT[poi.poiCode] || {}
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
			const category = DEFAULT_MAP_CATEGORIES.find(item => item.key === categoryKey)
			return category ? category.color : '#16805F'
		},
		getCategoryLabel(categoryKey = '') {
			const category = DEFAULT_MAP_CATEGORIES.find(item => item.key === categoryKey)
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

.xicheng-map-paper-grid {
	position: absolute;
	inset: 0;
	background:
		radial-gradient(circle at 22% 68%, rgba(23, 63, 53, 0.12) 0 3rpx, transparent 4rpx),
		radial-gradient(circle at 64% 36%, rgba(23, 63, 53, 0.13) 0 3rpx, transparent 4rpx),
		radial-gradient(circle at 82% 74%, rgba(23, 63, 53, 0.10) 0 3rpx, transparent 4rpx),
		linear-gradient(28deg, transparent 0 46%, rgba(255, 252, 246, 0.62) 46% 48%, transparent 48% 100%);
	background-size: 86rpx 92rpx, 96rpx 84rpx, 92rpx 100rpx, 190rpx 150rpx;
	opacity: 0.9;
}

.xicheng-map-water {
	position: absolute;
	background:
		radial-gradient(circle at 35% 38%, rgba(255, 252, 246, 0.28), transparent 28%),
		radial-gradient(circle at 68% 62%, rgba(83, 142, 164, 0.28), transparent 36%),
		rgba(105, 164, 178, 0.46);
	border: 8rpx solid rgba(255, 252, 246, 0.65);
	box-shadow: inset 0 10rpx 32rpx rgba(49, 102, 116, 0.16);
}

.xicheng-map-water-main {
	left: 35%;
	top: 9%;
	width: 31%;
	height: 40%;
	border-radius: 48% 52% 44% 54%;
	transform: rotate(-8deg);
}

.xicheng-map-water-side {
	left: 61%;
	top: 18%;
	width: 18%;
	height: 27%;
	border-radius: 44% 56% 52% 48%;
	transform: rotate(11deg);
}

.xicheng-map-park {
	position: absolute;
	z-index: 1;
	border-radius: 45% 55% 50% 45%;
	background:
		radial-gradient(circle at 24% 28%, rgba(111, 142, 84, 0.32) 0 9rpx, transparent 10rpx),
		radial-gradient(circle at 58% 58%, rgba(111, 142, 84, 0.24) 0 8rpx, transparent 9rpx),
		rgba(111, 142, 84, 0.08);
	border: 1rpx solid rgba(111, 142, 84, 0.12);
}

.xicheng-map-park-north {
	left: 19%;
	top: 14%;
	width: 25%;
	height: 22%;
	transform: rotate(-7deg);
}

.xicheng-map-park-south {
	left: 56%;
	top: 66%;
	width: 25%;
	height: 18%;
	transform: rotate(13deg);
}

.xicheng-map-road {
	position: absolute;
	z-index: 1;
	left: -8%;
	width: 118%;
	height: 18rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.64);
	box-shadow: 0 4rpx 14rpx rgba(93, 75, 49, 0.06);
}

.xicheng-map-road-one {
	top: 25%;
	transform: rotate(-8deg);
}

.xicheng-map-road-two {
	top: 54%;
	transform: rotate(9deg);
}

.xicheng-map-road-three {
	top: 82%;
	transform: rotate(-5deg);
}

.xicheng-map-tree {
	position: absolute;
	z-index: 2;
	width: 34rpx;
	height: 42rpx;
	transform: translate(-50%, -50%);
	border-radius: 50% 50% 46% 48%;
	background: rgba(111, 142, 84, 0.34);
	box-shadow:
		10rpx 8rpx 0 -4rpx rgba(111, 142, 84, 0.24),
		-8rpx 12rpx 0 -6rpx rgba(111, 142, 84, 0.20);
}

.xicheng-map-tree::after {
	content: '';
	position: absolute;
	left: 15rpx;
	bottom: -10rpx;
	width: 4rpx;
	height: 16rpx;
	border-radius: 999rpx;
	background: rgba(104, 72, 36, 0.22);
}

.xicheng-map-sketch {
	position: absolute;
	z-index: 2;
	width: 74rpx;
	height: 74rpx;
	opacity: 0.72;
	filter: drop-shadow(0 7rpx 10rpx rgba(91, 65, 32, 0.08));
}

.xicheng-map-sketch-roof {
	width: 0;
	height: 0;
	margin: 0 auto;
	border-left: 34rpx solid transparent;
	border-right: 34rpx solid transparent;
	border-bottom: 22rpx solid rgba(166, 120, 61, 0.48);
}

.xicheng-map-sketch-body {
	width: 58rpx;
	height: 38rpx;
	margin: 0 auto;
	border: 3rpx solid rgba(91, 65, 32, 0.20);
	border-top: 0;
	background: rgba(255, 252, 246, 0.46);
}

.xicheng-map-sketch-pagoda {
	left: 20%;
	top: 57%;
	height: 104rpx;
}

.xicheng-map-sketch-pagoda .xicheng-map-sketch-roof {
	border-left-width: 20rpx;
	border-right-width: 20rpx;
	border-bottom-width: 42rpx;
}

.xicheng-map-sketch-pagoda .xicheng-map-sketch-body {
	width: 36rpx;
	height: 54rpx;
	border-radius: 999rpx 999rpx 6rpx 6rpx;
}

.xicheng-map-sketch-gate-north { left: 72%; top: 36%; }
.xicheng-map-sketch-gate-south { left: 49%; top: 84%; }
.xicheng-map-sketch-temple-east { left: 83%; top: 22%; }

.xicheng-map-water-label {
	position: absolute;
	z-index: 3;
	color: rgba(24, 74, 88, 0.76);
	font-size: 27rpx;
	line-height: 1.1;
	font-weight: 800;
	text-shadow: 0 2rpx 0 rgba(255, 252, 246, 0.64);
}

.xicheng-map-water-label-main {
	left: 45%;
	top: 26%;
}

.xicheng-map-water-label-side {
	left: 58%;
	top: 11%;
	font-size: 22rpx;
}

.xicheng-map-landmark {
	position: absolute;
	z-index: 1;
	padding: 5rpx 12rpx;
	border-radius: 10rpx;
	background: rgba(255, 252, 246, 0.70);
	color: rgba(65, 48, 30, 0.72);
	font-size: 22rpx;
	font-weight: 700;
	box-shadow: 0 4rpx 12rpx rgba(74, 52, 26, 0.06);
}

.xicheng-map-landmark-drum { left: 43%; top: 4%; }
.xicheng-map-landmark-xisi { left: 12%; top: 36%; writing-mode: vertical-rl; }
.xicheng-map-landmark-dianmen { right: 10%; top: 8%; }
.xicheng-map-landmark-qianmen { left: 47%; bottom: 3%; }
.xicheng-map-landmark-xidan { right: 8%; bottom: 9%; }
.xicheng-map-landmark-district {
	left: 45%;
	top: 54%;
	font-size: 40rpx;
	font-family: serif;
	color: rgba(65, 48, 30, 0.48);
	background: transparent;
	box-shadow: none;
}

.xicheng-map-category-legend {
	position: absolute;
	z-index: 3;
	left: 22rpx;
	top: 28rpx;
	display: flex;
	flex-direction: column;
	gap: 14rpx;
	width: 178rpx;
	padding: 20rpx 18rpx;
	border-radius: 22rpx;
	background: rgba(255, 252, 246, 0.88);
	box-shadow: 0 16rpx 34rpx rgba(35, 46, 35, 0.10);
}

.xicheng-map-category {
	display: flex;
	align-items: center;
	gap: 12rpx;
	color: #3E3931;
	font-size: 22rpx;
	font-weight: 700;
}

.xicheng-map-category-dot {
	width: 24rpx;
	height: 24rpx;
	border-radius: 999rpx;
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
