<template>
	<view
		class="xicheng-icon"
		:class="[
			`xicheng-icon-${variant}`,
			active ? 'xicheng-icon-active' : '',
			disabled ? 'xicheng-icon-disabled' : ''
		]"
		:style="containerStyle"
	>
		<view
			v-if="usesCustomTabVectorIcon"
			:class="[
				'xicheng-tab-vector',
				`xicheng-tab-vector-${name}`,
				active ? 'xicheng-tab-vector-active' : ''
			]"
		>
			<template v-if="name === 'explore'">
				<view class="xicheng-tab-vector-explore-roof"></view>
				<view class="xicheng-tab-vector-explore-eave"></view>
				<view class="xicheng-tab-vector-explore-body">
					<view class="xicheng-tab-vector-explore-column"></view>
					<view class="xicheng-tab-vector-explore-column"></view>
					<view class="xicheng-tab-vector-explore-column"></view>
				</view>
				<view class="xicheng-tab-vector-explore-base"></view>
			</template>
			<template v-else-if="name === 'routes'">
				<view class="xicheng-tab-vector-map-panel xicheng-tab-vector-map-panel-left"></view>
				<view class="xicheng-tab-vector-map-panel xicheng-tab-vector-map-panel-middle"></view>
				<view class="xicheng-tab-vector-map-panel xicheng-tab-vector-map-panel-right"></view>
				<view class="xicheng-tab-vector-map-line xicheng-tab-vector-map-line-a"></view>
				<view class="xicheng-tab-vector-map-line xicheng-tab-vector-map-line-b"></view>
			</template>
			<template v-else-if="name === 'favorite' || name === 'travelogue'">
				<view class="xicheng-tab-vector-star"></view>
			</template>
			<template v-else-if="name === 'mine'">
				<view class="xicheng-tab-vector-person-head"></view>
				<view class="xicheng-tab-vector-person-body"></view>
			</template>
		</view>
		<uni-icons v-else :type="resolvedType" :size="iconSize" :color="iconColor" />
	</view>
</template>

<script>
const TAB_VECTOR_ICON_NAMES = Object.freeze(['explore', 'routes', 'favorite', 'travelogue', 'mine'])

const ICON_TYPE_MAP = Object.freeze({
	back: 'back',
	play: 'sound-filled',
	location: 'location-filled',
	layer: 'map-filled',
	qa: 'chatbubble-filled',
	edit: 'compose',
	scan: 'scan',
	photo: 'camera-filled',
	ocr: 'image-filled',
	text: 'compose',
	route: 'navigate-filled',
	refresh: 'refresh',
	source: 'info',
	next: 'right',
	check: 'checkmarkempty',
	study: 'medal',
	passport: 'medal',
	record: 'flag',
	resume: 'sound-filled',
	locked: 'locked',
	explore: Object.freeze({ default: 'home', active: 'home-filled' }),
	routes: Object.freeze({ default: 'map', active: 'map-filled' }),
	favorite: Object.freeze({ default: 'star', active: 'star-filled' }),
	travelogue: Object.freeze({ default: 'star', active: 'star-filled' }),
	mine: Object.freeze({ default: 'person', active: 'person-filled' })
})

export default {
	name: 'XichengIcon',
	props: {
		name: {
			type: String,
			default: 'explore'
		},
		size: {
			type: [Number, String],
			default: 24
		},
		variant: {
			type: String,
			default: 'soft'
		},
		active: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		resolvedType() {
			const matchedType = ICON_TYPE_MAP[this.name] || this.name || ICON_TYPE_MAP.explore
			if (matchedType && typeof matchedType === 'object') {
				return this.active ? matchedType.active : matchedType.default
			}
			return matchedType
		},
		iconSize() {
			const parsedSize = Number.parseInt(String(this.size), 10)
			return Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : 24
		},
		iconColor() {
			if (this.disabled) return '#A8A199'
			if (this.variant === 'tab') return this.active ? '#173F35' : '#746F68'
			if (this.active || this.variant === 'primary') return '#FFF9EC'
			return '#173F35'
		},
		usesCustomTabVectorIcon() {
			return this.variant === 'tab' && TAB_VECTOR_ICON_NAMES.includes(this.name)
		},
		containerStyle() {
			const boxSize = this.variant === 'tab' ? Math.max(this.iconSize * 1.86, 46) : Math.max(this.iconSize * 2, 34)
			return `width:${boxSize}rpx;height:${boxSize}rpx;--xicheng-icon-color:${this.iconColor};`
		}
	}
}
</script>

<style scoped>
.xicheng-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	border-radius: 999px;
	background: rgba(23, 63, 53, 0.08);
	border: 1px solid rgba(23, 63, 53, 0.10);
	box-sizing: border-box;
	line-height: 1;
}

.xicheng-icon-primary,
.xicheng-icon-active {
	background: #173F35;
	border-color: rgba(23, 63, 53, 0.18);
	box-shadow: 0 8rpx 18rpx rgba(16, 47, 41, 0.16);
}

.xicheng-icon-plain {
	background: transparent;
	border-color: transparent;
	box-shadow: none;
}

.xicheng-icon-tab {
	background: transparent;
	border-color: transparent;
	box-shadow: none;
}

.xicheng-icon-disabled {
	opacity: 0.54;
}

.xicheng-tab-vector {
	position: relative;
	width: 40rpx;
	height: 40rpx;
	color: var(--xicheng-icon-color);
}

.xicheng-tab-vector-explore,
.xicheng-tab-vector-routes,
.xicheng-tab-vector-favorite,
.xicheng-tab-vector-travelogue,
.xicheng-tab-vector-mine,
.xicheng-tab-vector-active {
	color: var(--xicheng-icon-color);
}

.xicheng-tab-vector-explore-roof {
	position: absolute;
	left: 5rpx;
	right: 5rpx;
	top: 4rpx;
	height: 10rpx;
	background: currentColor;
	clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.xicheng-tab-vector-explore-eave,
.xicheng-tab-vector-explore-base {
	position: absolute;
	left: 5rpx;
	right: 5rpx;
	height: 4rpx;
	border-radius: 8rpx;
	background: currentColor;
}

.xicheng-tab-vector-explore-eave {
	top: 16rpx;
}

.xicheng-tab-vector-explore-base {
	bottom: 4rpx;
}

.xicheng-tab-vector-explore-body {
	position: absolute;
	left: 9rpx;
	right: 9rpx;
	top: 21rpx;
	bottom: 9rpx;
	display: flex;
	justify-content: space-between;
}

.xicheng-tab-vector-explore-column {
	width: 4rpx;
	height: 100%;
	border-radius: 4rpx;
	background: currentColor;
}

.xicheng-tab-vector-map-panel {
	position: absolute;
	top: 7rpx;
	width: 12rpx;
	height: 26rpx;
	border: 3rpx solid currentColor;
	background: transparent;
	box-sizing: border-box;
}

.xicheng-tab-vector-map-panel-left {
	left: 4rpx;
	border-right-width: 0;
	transform: skewY(-7deg);
}

.xicheng-tab-vector-map-panel-middle {
	left: 14rpx;
	height: 28rpx;
	transform: skewY(7deg);
}

.xicheng-tab-vector-map-panel-right {
	right: 4rpx;
	border-left-width: 0;
	transform: skewY(-7deg);
}

.xicheng-tab-vector-map-line {
	position: absolute;
	height: 3rpx;
	border-radius: 6rpx;
	background: currentColor;
	opacity: 0.88;
}

.xicheng-tab-vector-map-line-a {
	left: 10rpx;
	top: 15rpx;
	width: 11rpx;
	transform: rotate(-18deg);
}

.xicheng-tab-vector-map-line-b {
	right: 9rpx;
	bottom: 13rpx;
	width: 12rpx;
	transform: rotate(18deg);
}

.xicheng-tab-vector-star {
	position: absolute;
	left: 6rpx;
	top: 4rpx;
	width: 28rpx;
	height: 28rpx;
	background: currentColor;
	clip-path: polygon(50% 0, 61% 35%, 98% 35%, 68% 56%, 79% 92%, 50% 70%, 21% 92%, 32% 56%, 2% 35%, 39% 35%);
}

.xicheng-tab-vector-person-head {
	position: absolute;
	left: 13rpx;
	top: 5rpx;
	width: 14rpx;
	height: 14rpx;
	border: 4rpx solid currentColor;
	border-radius: 999rpx;
	box-sizing: border-box;
}

.xicheng-tab-vector-person-body {
	position: absolute;
	left: 7rpx;
	right: 7rpx;
	bottom: 5rpx;
	height: 17rpx;
	border: 4rpx solid currentColor;
	border-bottom: 0;
	border-radius: 22rpx 22rpx 0 0;
	box-sizing: border-box;
}
</style>
