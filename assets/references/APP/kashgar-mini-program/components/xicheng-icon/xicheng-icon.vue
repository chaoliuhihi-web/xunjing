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
			<view class="xicheng-tab-vector-explore-roof"></view>
			<view class="xicheng-tab-vector-explore-eave"></view>
			<view class="xicheng-tab-vector-explore-body">
				<view class="xicheng-tab-vector-explore-column"></view>
				<view class="xicheng-tab-vector-explore-column"></view>
				<view class="xicheng-tab-vector-explore-column"></view>
			</view>
			<view class="xicheng-tab-vector-explore-base"></view>
		</view>
		<uni-icons v-else :type="resolvedType" :size="iconSize" :color="iconColor" />
	</view>
</template>

<script>
const TAB_VECTOR_ICON_NAMES = Object.freeze(['explore'])

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
	close: 'closeempty',
	more: 'more-filled',
	plus: 'plusempty',
	heart: 'heart-filled',
	share: 'paperplane-filled',
	settings: 'settings-filled',
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
	width: 44rpx;
	height: 44rpx;
	color: var(--xicheng-icon-color);
}

.xicheng-tab-vector-explore,
.xicheng-tab-vector-active {
	color: var(--xicheng-icon-color);
}

.xicheng-tab-vector-explore-roof {
	position: absolute;
	left: 4rpx;
	right: 4rpx;
	top: 3rpx;
	height: 12rpx;
	background: currentColor;
	clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.xicheng-tab-vector-explore-eave,
.xicheng-tab-vector-explore-base {
	position: absolute;
	left: 4rpx;
	right: 4rpx;
	height: 5rpx;
	border-radius: 8rpx;
	background: currentColor;
}

.xicheng-tab-vector-explore-eave {
	top: 17rpx;
}

.xicheng-tab-vector-explore-base {
	bottom: 4rpx;
}

.xicheng-tab-vector-explore-body {
	position: absolute;
	left: 9rpx;
	right: 9rpx;
	top: 24rpx;
	bottom: 10rpx;
	display: flex;
	justify-content: space-between;
}

.xicheng-tab-vector-explore-column {
	width: 4rpx;
	height: 100%;
	border-radius: 4rpx;
	background: currentColor;
}

</style>
