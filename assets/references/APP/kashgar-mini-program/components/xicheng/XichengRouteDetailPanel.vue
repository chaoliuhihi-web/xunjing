<template>
	<view class="xicheng-route-detail-panel">
		<view class="route-detail-nav">
			<button class="route-detail-nav-button route-detail-back-button" @click="$emit('back')">
				<xicheng-icon name="back" variant="plain" :size="25" />
			</button>
			<text class="route-detail-nav-title">路线详情</text>
			<button class="route-detail-nav-button route-detail-share-button" @click="$emit('passport')">
				<xicheng-icon name="passport" variant="plain" :size="24" />
			</button>
		</view>

		<view class="route-detail-hero xicheng-paper-card">
			<image
				v-if="routeHeroImage"
				class="route-detail-hero-image"
				:src="routeHeroImage"
				mode="aspectFill"
			/>
			<view class="route-detail-hero-shade"></view>
			<view class="route-detail-hero-copy">
				<text class="route-detail-title">{{ displayRouteTitle }}</text>
				<text class="route-detail-meta">{{ routeHero.meta || routeMetaText }}</text>
			</view>
			<view class="route-detail-map-dots">
				<view class="route-detail-dashed-path"></view>
				<view class="route-detail-map-dot route-detail-map-dot-1"></view>
				<view class="route-detail-map-dot route-detail-map-dot-2"></view>
				<view class="route-detail-map-dot route-detail-map-dot-3"></view>
			</view>
			<view class="route-detail-xiaojing">
				<image v-if="companionAvatar" class="route-detail-xiaojing-avatar" :src="companionAvatar" mode="aspectFit" />
				<view class="route-detail-xiaojing-bubble">
					<text>我帮你排好了顺路走法</text>
				</view>
			</view>
		</view>

		<view class="route-detail-timeline">
			<view
				v-for="(stop, index) in routeStopItems"
				:key="`${stop.poiCode || stop.poiName}-${index}`"
				class="route-detail-timeline-row"
			>
				<view class="route-detail-timeline-rail">
					<view class="route-detail-step-index">{{ index + 1 }}</view>
					<view class="route-detail-step-copy">
						<text>步行</text>
						<text>{{ getStepWalkDistance(index) }}</text>
						<text>{{ getStepWalkMinutes(stop) }}</text>
					</view>
				</view>
				<view class="route-detail-stop-card xicheng-paper-card">
					<image
						v-if="getStopThumbnail(stop, index)"
						class="route-detail-stop-image"
						:src="getStopThumbnail(stop, index)"
						mode="aspectFill"
					/>
					<view class="route-detail-stop-copy">
						<text class="route-detail-stop-title">{{ stop.poiName }}</text>
						<text class="route-detail-stop-desc">{{ stop.summary || stop.theme || '西城官方文化点。' }}</text>
					</view>
					<button class="route-detail-listen-button" @click="$emit('ask-stop', stop)">
						<xicheng-icon name="play" variant="primary" :size="24" />
						<text>听讲解</text>
					</button>
					<view class="route-detail-stop-actions">
						<button class="route-detail-stop-action" @click="$emit('open-poi-detail', stop)">
							<text>地点详情</text>
						</button>
						<button class="route-detail-stop-action route-detail-stop-action-primary" @click="$emit('navigate-stop', stop)">
							<text>导航去这里</text>
						</button>
					</view>
				</view>
			</view>
			<view class="route-detail-finish-pin"></view>
		</view>

		<view v-if="nearbyHighlightItems.length > 0" class="route-detail-highlights xicheng-paper-card">
			<view class="route-detail-section-title">
				<xicheng-icon name="route" variant="plain" :size="23" />
				<text>沿途看点</text>
			</view>
			<view class="route-detail-highlight-strip">
				<view
					v-for="(highlight, index) in nearbyHighlightItems"
					:key="highlight.title"
					class="route-detail-highlight-card"
				>
					<image class="route-detail-highlight-image" :src="getHighlightImage(index)" mode="aspectFill" />
					<text>{{ highlight.title }}</text>
				</view>
			</view>
		</view>

		<view class="route-detail-bottom-cta xicheng-paper-card">
			<view class="route-detail-cta-icon">
				<xicheng-icon name="edit" variant="plain" :size="32" />
			</view>
			<view class="route-detail-cta-copy">
				<text>生成这条路线的游记</text>
				<text>全程约 {{ routeDistanceText }}，建议穿舒适步行鞋，带好水和防晒用品。</text>
			</view>
			<button class="route-detail-cta-button" @click="$emit('generate-travelogue')">
				<xicheng-icon name="next" variant="plain" active :size="25" />
			</button>
		</view>

		<view class="route-detail-start-bar">
			<button class="route-detail-record-button xicheng-primary-action" @click="$emit('start-recording')">
				<xicheng-icon name="record" variant="plain" active :size="23" />
				<text>开始记录</text>
			</button>
		</view>
	</view>
</template>

<script>
const FALLBACK_HIGHLIGHT_IMAGES = Object.freeze([
	'/static/xicheng/route-hutong-life.jpg',
	'/static/xicheng/route-shichahai-waterfront.jpg',
	'/static/xicheng/poi-baitasi-card.jpg',
	'/static/xicheng/route-baitasi-culture.jpg'
])

const WALK_DISTANCES = Object.freeze(['1.1 公里', '1.2 公里', '1.0 公里', '0.8 公里'])

export default {
	name: 'XichengRouteDetailPanel',
	props: {
		route: {
			type: Object,
			default: () => ({})
		},
		routeHero: {
			type: Object,
			default: () => ({})
		},
		routeStops: {
			type: Array,
			default: () => []
		},
		nearbyHighlights: {
			type: Array,
			default: () => []
		},
		routeHeroImage: {
			type: String,
			default: ''
		},
		companionAvatar: {
			type: String,
			default: ''
		}
	},
	emits: ['back', 'passport', 'ask-stop', 'open-poi-detail', 'navigate-stop', 'start-recording', 'generate-travelogue'],
	computed: {
		routeStopItems() {
			return Array.isArray(this.routeStops) ? this.routeStops : []
		},
		nearbyHighlightItems() {
			return Array.isArray(this.nearbyHighlights) ? this.nearbyHighlights.slice(0, 4) : []
		},
		displayRouteTitle() {
			const title = this.routeHero.title || this.route.title || '白塔寺文化线'
			if (title.includes('白塔寺')) return '白塔寺文化线'
			if (title.includes('北海')) return '什刹海水岸线'
			if (title.includes('大栅栏')) return '胡同烟火线'
			return title
		},
		routeMetaText() {
			return [
				this.route.durationText,
				this.route.distanceText,
				this.route.bestTimeText
			].filter(Boolean).join(' · ')
		},
		routeDistanceText() {
			return this.route.distanceText || '3.2 公里'
		}
	},
	methods: {
		getStopThumbnail(stop = {}, index = 0) {
			const byCode = {
				'xicheng-baitasi': '/static/xicheng/poi-baitasi-card.jpg',
				'xicheng-imperial-temple': '/static/xicheng/route-baitasi-culture.jpg',
				'xicheng-shichahai': '/static/xicheng/route-shichahai-waterfront.jpg',
				'xicheng-beihai': '/static/xicheng/route-shichahai-waterfront.jpg',
				'xicheng-dashilar': '/static/xicheng/route-hutong-life.jpg'
			}
			return byCode[stop.poiCode] || FALLBACK_HIGHLIGHT_IMAGES[index % FALLBACK_HIGHLIGHT_IMAGES.length] || this.routeHeroImage
		},
		getHighlightImage(index = 0) {
			return FALLBACK_HIGHLIGHT_IMAGES[index % FALLBACK_HIGHLIGHT_IMAGES.length] || this.routeHeroImage
		},
		getStepWalkDistance(index = 0) {
			return WALK_DISTANCES[index % WALK_DISTANCES.length]
		},
		getStepWalkMinutes(stop = {}) {
			const text = stop.walkText || stop.durationText || '约 20 分钟'
			const matched = String(text).match(/约?\s*\d+\s*分钟/)
			return matched ? matched[0].replace(/\s+/g, '') : '约20分钟'
		}
	}
}
</script>

<style scoped>
.xicheng-route-detail-panel {
	min-height: 100vh;
	padding: 34rpx 28rpx 48rpx;
	box-sizing: border-box;
	color: #102F29;
}

.route-detail-nav {
	display: grid;
	grid-template-columns: 82rpx 1fr 82rpx;
	align-items: center;
	gap: 18rpx;
	margin-bottom: 24rpx;
}

.route-detail-nav-button {
	width: 82rpx;
	height: 82rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.92);
	padding: 0;
	box-shadow: 0 12rpx 28rpx rgba(35, 42, 34, 0.1);
}

.route-detail-back-button {
	background: #173F35;
}

.route-detail-nav-title {
	text-align: center;
	font-size: 40rpx;
	font-weight: 800;
	color: #102F29;
}

.route-detail-share-button {
	background: transparent;
	box-shadow: none;
}

.route-detail-hero {
	position: relative;
	min-height: 440rpx;
	padding: 42rpx 38rpx;
	border-radius: 34rpx;
	overflow: hidden;
	box-sizing: border-box;
	background: #F7EFE3;
}

.route-detail-hero-image {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.route-detail-hero-shade {
	position: absolute;
	inset: 0;
	background:
		linear-gradient(90deg, rgba(255, 250, 240, 0.94) 0%, rgba(255, 250, 240, 0.72) 45%, rgba(255, 250, 240, 0.08) 76%),
		linear-gradient(180deg, rgba(255, 250, 240, 0.08) 30%, rgba(255, 250, 240, 0.82) 100%);
}

.route-detail-hero-copy,
.route-detail-map-dots,
.route-detail-xiaojing {
	position: relative;
	z-index: 2;
}

.route-detail-title,
.route-detail-meta {
	display: block;
}

.route-detail-title {
	max-width: 440rpx;
	font-size: 58rpx;
	line-height: 1.16;
	font-weight: 800;
	font-family: serif;
	color: #123F35;
}

.route-detail-meta {
	margin-top: 22rpx;
	font-size: 30rpx;
	color: #4C4740;
}

.route-detail-map-dots {
	position: absolute;
	left: 150rpx;
	top: 245rpx;
	width: 294rpx;
	height: 96rpx;
}

.route-detail-dashed-path {
	position: absolute;
	left: 28rpx;
	right: 28rpx;
	top: 48rpx;
	height: 2rpx;
	border-top: 3rpx dashed rgba(181, 148, 94, 0.72);
	transform: rotate(-11deg);
}

.route-detail-map-dot {
	position: absolute;
	width: 34rpx;
	height: 34rpx;
	border: 8rpx solid rgba(255, 249, 236, 0.88);
	border-radius: 999rpx;
	background: #B5945E;
	box-shadow: 0 10rpx 22rpx rgba(35, 42, 34, 0.16);
}

.route-detail-map-dot-1 {
	left: 0;
	bottom: 8rpx;
}

.route-detail-map-dot-2 {
	left: 118rpx;
	top: 20rpx;
}

.route-detail-map-dot-3 {
	right: 0;
	top: 0;
}

.route-detail-xiaojing {
	position: absolute;
	left: 34rpx;
	right: 340rpx;
	bottom: 20rpx;
	display: grid;
	grid-template-columns: 116rpx 1fr;
	align-items: center;
	gap: 8rpx;
}

.route-detail-xiaojing-avatar {
	width: 116rpx;
	height: 116rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.68);
}

.route-detail-xiaojing-bubble {
	position: relative;
	padding: 18rpx 24rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.96);
	color: #4C4740;
	font-size: 27rpx;
	box-shadow: 0 10rpx 22rpx rgba(35, 42, 34, 0.1);
	white-space: nowrap;
}

.route-detail-timeline {
	position: relative;
	margin-top: 30rpx;
	display: grid;
	gap: 26rpx;
}

.route-detail-timeline::before {
	content: "";
	position: absolute;
	left: 74rpx;
	top: 48rpx;
	bottom: 44rpx;
	border-left: 3rpx dashed rgba(181, 148, 94, 0.58);
}

.route-detail-timeline-row {
	position: relative;
	display: grid;
	grid-template-columns: 126rpx 1fr;
	gap: 16rpx;
	align-items: center;
}

.route-detail-timeline-rail {
	position: relative;
	z-index: 2;
	display: grid;
	justify-items: center;
	gap: 18rpx;
}

.route-detail-step-index {
	width: 58rpx;
	height: 58rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 6rpx solid #B5945E;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF9EC;
	font-size: 28rpx;
	font-weight: 800;
	box-shadow: 0 8rpx 18rpx rgba(23, 63, 53, 0.16);
}

.route-detail-step-copy {
	display: grid;
	gap: 4rpx;
	text-align: center;
	color: #4C4740;
	font-size: 23rpx;
	line-height: 1.35;
}

.route-detail-stop-card {
	display: grid;
	grid-template-columns: 180rpx 1fr 112rpx;
	align-items: center;
	gap: 22rpx;
	min-height: 194rpx;
	padding: 20rpx;
	border-radius: 28rpx;
	box-sizing: border-box;
}

.route-detail-stop-image {
	width: 180rpx;
	height: 154rpx;
	border-radius: 20rpx;
	background: #E3E8E0;
	object-fit: cover;
}

.route-detail-stop-copy {
	min-width: 0;
}

.route-detail-stop-title,
.route-detail-stop-desc {
	display: block;
}

.route-detail-stop-title {
	font-size: 38rpx;
	line-height: 1.24;
	font-weight: 800;
	color: #102F29;
}

.route-detail-stop-desc {
	margin-top: 12rpx;
	font-size: 26rpx;
	line-height: 1.5;
	color: #4C4740;
}

.route-detail-listen-button {
	width: 104rpx;
	min-height: 138rpx;
	display: grid;
	justify-items: center;
	align-content: center;
	gap: 10rpx;
	border-radius: 30rpx;
	background: transparent;
	color: #173F35;
	font-size: 24rpx;
	font-weight: 700;
	padding: 0;
}

.route-detail-stop-actions {
	grid-column: 2 / 4;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: -6rpx;
}

.route-detail-stop-action {
	min-height: 58rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.08);
	color: #173F35;
	font-size: 24rpx;
	font-weight: 700;
	padding: 0 14rpx;
}

.route-detail-stop-action-primary {
	background: rgba(181, 148, 94, 0.18);
	color: #805F27;
}

.route-detail-finish-pin {
	position: absolute;
	left: 58rpx;
	bottom: -18rpx;
	width: 34rpx;
	height: 34rpx;
	border-radius: 999rpx 999rpx 999rpx 0;
	background: #B5945E;
	transform: rotate(-45deg);
}

.route-detail-highlights,
.route-detail-bottom-cta {
	margin-top: 34rpx;
	padding: 28rpx;
	border-radius: 32rpx;
}

.route-detail-section-title {
	display: flex;
	align-items: center;
	gap: 12rpx;
	font-size: 32rpx;
	font-weight: 800;
	color: #102F29;
}

.route-detail-highlight-strip {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 24rpx;
}

.route-detail-highlight-card {
	min-width: 0;
	text-align: center;
	color: #4C4740;
	font-size: 23rpx;
}

.route-detail-highlight-image {
	width: 100%;
	height: 96rpx;
	border-radius: 16rpx;
	background: #E3E8E0;
	object-fit: cover;
}

.route-detail-highlight-card text {
	display: block;
	margin-top: 10rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.route-detail-bottom-cta {
	display: grid;
	grid-template-columns: 86rpx 1fr 82rpx;
	align-items: center;
	gap: 18rpx;
}

.route-detail-cta-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 86rpx;
	height: 86rpx;
	border-radius: 24rpx;
	background: rgba(181, 148, 94, 0.13);
}

.route-detail-cta-copy {
	min-width: 0;
}

.route-detail-cta-copy text {
	display: block;
}

.route-detail-cta-copy text:first-child {
	font-size: 34rpx;
	font-weight: 800;
	color: #102F29;
}

.route-detail-cta-copy text:last-child {
	margin-top: 8rpx;
	font-size: 23rpx;
	line-height: 1.45;
	color: #746F68;
}

.route-detail-cta-button {
	width: 76rpx;
	height: 76rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 999rpx;
	background: #173F35;
	padding: 0;
}

.route-detail-start-bar {
	position: sticky;
	bottom: 20rpx;
	z-index: 12;
	margin-top: 24rpx;
}

.route-detail-record-button {
	width: 100%;
	min-height: 92rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	border-radius: 999rpx;
	font-size: 32rpx;
	font-weight: 800;
}
</style>
