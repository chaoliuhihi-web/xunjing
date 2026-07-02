<template>
	<view class="xicheng-map-backdrop" aria-hidden="true">
		<view class="xicheng-map-paper-grid"></view>
		<view class="xicheng-map-water xicheng-map-water-main"></view>
		<view class="xicheng-map-water xicheng-map-water-side"></view>
		<view class="xicheng-map-park xicheng-map-park-north"></view>
		<view class="xicheng-map-park xicheng-map-park-south"></view>
		<view class="xicheng-map-road xicheng-map-road-one"></view>
		<view class="xicheng-map-road xicheng-map-road-two"></view>
		<view class="xicheng-map-road xicheng-map-road-three"></view>
		<view
			v-for="sketch in backdrop.sketches"
			:key="sketch.key"
			class="xicheng-map-sketch"
			:class="sketch.className"
		>
			<view class="xicheng-map-sketch-roof"></view>
			<view class="xicheng-map-sketch-body"></view>
		</view>
		<view
			v-for="tree in backdrop.trees"
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
	</view>
</template>

<script>
import {
	XICHENG_CULTURAL_MAP_BACKDROP,
	XICHENG_CULTURAL_MAP_CATEGORIES
} from '@/config/regions/xichengMap.js'

export default {
	name: 'XichengCulturalMapBackdrop',
	computed: {
		backdrop() {
			return XICHENG_CULTURAL_MAP_BACKDROP
		},
		mapCategories() {
			return XICHENG_CULTURAL_MAP_CATEGORIES
		}
	}
}
</script>

<style scoped>
.xicheng-map-backdrop {
	position: absolute;
	inset: 0;
	z-index: 1;
	pointer-events: none;
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
</style>
