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

			<view class="xicheng-map-route-path"></view>
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
					<xicheng-icon name="next" variant="plain" :size="20" />
					<text>放大</text>
				</button>
			</view>
		</view>

		<view v-if="selectedPoi" class="xicheng-map-bottom-sheet">
			<view class="xicheng-map-sheet-handle"></view>
			<view class="xicheng-map-sheet-head" :class="{ 'xicheng-map-sheet-head-no-image': !selectedPoi.image }">
				<image
					v-if="selectedPoi.image"
					class="xicheng-map-sheet-image"
					:src="selectedPoi.image"
					mode="aspectFill"
				/>
				<view class="xicheng-map-sheet-copy">
					<text class="xicheng-map-sheet-title">{{ selectedPoi.poiName }}</text>
					<view class="xicheng-map-sheet-tags">
						<text>{{ getCategoryLabel(selectedPoi.categoryKey) }}</text>
						<text>已审核来源 {{ selectedPoi.sourceCount || 6 }} 条</text>
					</view>
					<text class="xicheng-map-sheet-desc">{{ selectedPoi.summary }}</text>
				</view>
			</view>
			<view class="xicheng-map-sheet-info">
				<view class="xicheng-map-sheet-info-row">
					<xicheng-icon name="source" variant="plain" :size="22" />
					<text>来源：西城文旅官方资料库</text>
				</view>
				<view class="xicheng-map-sheet-info-row">
					<xicheng-icon name="route" variant="plain" :size="22" />
					<text>{{ selectedPoi.walkText || '步行约 12 分钟 · 距当前位置约 850 米' }}</text>
				</view>
			</view>
			<button class="xicheng-map-sheet-primary xicheng-primary-action" @click="$emit('navigate-poi', selectedPoi)">
				导航去这里
			</button>
			<view class="xicheng-map-sheet-actions">
				<button class="xicheng-map-sheet-action xicheng-secondary-action" @click="$emit('ask-poi', selectedPoi)">问问小京</button>
				<button class="xicheng-map-sheet-action xicheng-secondary-action" @click="$emit('add-poi-to-route', selectedPoi)">加入路线</button>
			</view>
		</view>
	</view>
</template>

<script>
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
		positionedPois() {
			const providedPois = Array.isArray(this.pois) && this.pois.length > 0 ? this.pois : FALLBACK_POIS
			return providedPois.map((poi, index) => this.decoratePoi(poi, index))
		},
		routeStopMarkers() {
			const stops = Array.isArray(this.routeStops) ? this.routeStops : []
			return stops.map((stop, index) => this.decoratePoi(stop, index))
		},
		selectedPoi() {
			return this.positionedPois.find(poi => poi.poiCode === this.selectedPoiCode) || this.positionedPois[0] || null
		}
	},
	mounted() {
		if (!this.selectedPoiCode && this.positionedPois[0]) {
			this.selectedPoiCode = this.positionedPois[0].poiCode
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
		}
	}
}
</script>

<style scoped>
.xicheng-cultural-map {
	position: relative;
	padding: 28rpx;
	border-radius: 34rpx;
	overflow: hidden;
	background:
		linear-gradient(180deg, rgba(255, 252, 246, 0.98), rgba(250, 243, 229, 0.94));
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
	height: 720rpx;
	margin-top: 28rpx;
	border-radius: 30rpx;
	overflow: hidden;
	border: 1rpx solid rgba(181, 148, 94, 0.22);
	background:
		linear-gradient(90deg, rgba(181, 148, 94, 0.10) 1rpx, transparent 1rpx),
		linear-gradient(0deg, rgba(181, 148, 94, 0.10) 1rpx, transparent 1rpx),
		linear-gradient(135deg, #F6EDDA 0%, #F7F1E4 44%, #EEF4EA 100%);
	background-size: 74rpx 74rpx, 74rpx 74rpx, 100% 100%;
	box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.50);
}

.xicheng-map-paper-grid {
	position: absolute;
	inset: 0;
	background:
		radial-gradient(circle at 22% 68%, rgba(23, 63, 53, 0.10) 0 3rpx, transparent 4rpx),
		radial-gradient(circle at 64% 36%, rgba(23, 63, 53, 0.12) 0 3rpx, transparent 4rpx),
		radial-gradient(circle at 82% 74%, rgba(23, 63, 53, 0.09) 0 3rpx, transparent 4rpx);
	background-size: 86rpx 92rpx, 96rpx 84rpx, 92rpx 100rpx;
	opacity: 0.8;
}

.xicheng-map-water {
	position: absolute;
	background: rgba(105, 164, 178, 0.38);
	border: 8rpx solid rgba(255, 252, 246, 0.65);
	box-shadow: inset 0 10rpx 32rpx rgba(49, 102, 116, 0.16);
}

.xicheng-map-water-main {
	left: 37%;
	top: 12%;
	width: 28%;
	height: 38%;
	border-radius: 48% 52% 44% 54%;
	transform: rotate(-8deg);
}

.xicheng-map-water-side {
	left: 61%;
	top: 19%;
	width: 16%;
	height: 24%;
	border-radius: 44% 56% 52% 48%;
	transform: rotate(11deg);
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
	left: 20%;
	top: 62%;
	width: 46%;
	height: 14rpx;
	border-radius: 999rpx;
	background: #173F35;
	transform: rotate(-12deg);
	box-shadow:
		76rpx -90rpx 0 -2rpx #173F35,
		156rpx -166rpx 0 -2rpx #173F35,
		224rpx -222rpx 0 -2rpx #173F35;
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

.xicheng-map-bottom-sheet {
	position: relative;
	z-index: 6;
	margin-top: -40rpx;
	padding: 18rpx 24rpx 26rpx;
	border-radius: 34rpx;
	background: rgba(255, 252, 246, 0.98);
	box-shadow: 0 -10rpx 40rpx rgba(26, 48, 39, 0.12);
}

.xicheng-map-sheet-handle {
	width: 76rpx;
	height: 8rpx;
	border-radius: 999rpx;
	margin: 0 auto 20rpx;
	background: rgba(16, 47, 41, 0.18);
}

.xicheng-map-sheet-head {
	display: grid;
	grid-template-columns: 180rpx minmax(0, 1fr);
	gap: 22rpx;
	align-items: start;
}

.xicheng-map-sheet-head-no-image {
	grid-template-columns: 1fr;
}

.xicheng-map-sheet-image {
	width: 180rpx;
	height: 190rpx;
	border-radius: 22rpx;
	background: rgba(16, 47, 41, 0.08);
}

.xicheng-map-sheet-title {
	display: block;
	font-size: 40rpx;
	line-height: 1.15;
	font-weight: 900;
	color: #102F29;
}

.xicheng-map-sheet-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 16rpx;
}

.xicheng-map-sheet-tags text {
	padding: 9rpx 14rpx;
	border-radius: 12rpx;
	background: rgba(23, 63, 53, 0.08);
	color: #173F35;
	font-size: 22rpx;
	font-weight: 700;
}

.xicheng-map-sheet-desc {
	display: block;
	margin-top: 18rpx;
	font-size: 28rpx;
	line-height: 1.55;
	color: rgba(16, 47, 41, 0.74);
}

.xicheng-map-sheet-info {
	margin-top: 24rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.18);
	border-radius: 22rpx;
	overflow: hidden;
}

.xicheng-map-sheet-info-row {
	display: flex;
	align-items: center;
	gap: 14rpx;
	padding: 20rpx 18rpx;
	color: rgba(16, 47, 41, 0.76);
	font-size: 26rpx;
	border-bottom: 1rpx solid rgba(181, 148, 94, 0.14);
}

.xicheng-map-sheet-info-row:last-child {
	border-bottom: 0;
}

.xicheng-map-sheet-primary {
	width: 100%;
	height: 78rpx;
	line-height: 78rpx;
	margin-top: 24rpx;
	border-radius: 20rpx;
	font-size: 30rpx;
	font-weight: 900;
}

.xicheng-map-sheet-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
	margin-top: 18rpx;
}

.xicheng-map-sheet-action {
	height: 70rpx;
	line-height: 70rpx;
	border-radius: 18rpx;
	font-size: 27rpx;
	font-weight: 800;
}
</style>
