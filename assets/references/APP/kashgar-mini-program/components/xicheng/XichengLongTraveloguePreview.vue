<template>
	<view class="xicheng-long-travelogue xicheng-paper-card">
		<view class="long-cover">
			<image v-if="coverImage" class="long-cover-image" :src="coverImage" mode="aspectFill" />
			<view class="long-cover-scrim"></view>
			<view class="long-cover-copy">
				<text class="long-kicker">我的西城游记</text>
				<text class="long-title">{{ title }}</text>
				<text class="long-subtitle">{{ subtitle }}</text>
			</view>
			<view class="long-template-pill">{{ templateTitle }}</view>
		</view>

		<view class="long-body">
			<view class="long-intro-card">
				<text class="long-section-label">开场</text>
				<text class="long-intro">{{ intro }}</text>
				<view class="long-tag-row">
					<text v-for="tag in tagList" :key="tag" class="long-tag">{{ tag }}</text>
				</view>
			</view>

			<view class="long-route-card">
				<view class="long-section-head">
					<text class="long-section-title">今天这样走</text>
					<text class="long-section-meta">{{ safeRouteItems.length }} 站 · 可继续编辑</text>
				</view>
				<view class="long-route-line">
					<view
						v-for="(item, index) in safeRouteItems"
						:key="`${item.time}-${item.title}-${index}`"
						class="long-route-item"
					>
						<text class="long-route-time">{{ item.time }}</text>
						<view class="long-route-dot">{{ index + 1 }}</view>
						<text class="long-route-title">{{ item.title }}</text>
					</view>
				</view>
			</view>

			<view
				v-for="(chapter, index) in safeChapters"
				:key="`${chapter.title}-${index}`"
				class="long-chapter"
			>
				<image v-if="chapter.image" class="long-chapter-image" :src="chapter.image" mode="aspectFill" />
				<view class="long-chapter-copy">
					<text class="long-chapter-index">Chapter {{ String(index + 1).padStart(2, '0') }}</text>
					<text class="long-chapter-title">{{ chapter.title }}</text>
					<text class="long-chapter-text">{{ chapter.text }}</text>
					<view class="long-quote-card">
						<text>{{ chapter.quote }}</text>
					</view>
				</view>
			</view>

			<view class="long-photo-memory">
				<view class="long-section-head">
					<text class="long-section-title">照片记忆</text>
					<text class="long-section-meta">可换封面与顺序</text>
				</view>
				<scroll-view class="long-photo-scroll" scroll-x>
					<view class="long-photo-strip">
						<view
							v-for="photo in safePhotoCards"
							:key="photo.key"
							class="long-photo-card"
						>
							<image class="long-photo-image" :src="photo.image" mode="aspectFill" />
							<text class="long-photo-label">{{ photo.label }}</text>
						</view>
					</view>
				</scroll-view>
			</view>

			<view class="long-ending-card">
				<text class="long-ending-title">我想记住的，不是打卡完成</text>
				<text class="long-ending-text">而是每一次愿意停下来的瞬间。下次再来西城，我想少排几个点，多留一点时间给街口、树影和忽然听见的一句话。</text>
				<text class="long-privacy">{{ privacyText }}</text>
			</view>
		</view>

		<view class="long-actions">
			<button class="long-action-button long-action-ghost" @click="$emit('edit')">继续编辑</button>
			<button class="long-action-button long-action-ghost" @click="$emit('export-pdf')">导出PDF</button>
			<button class="long-action-button long-action-ghost" @click="$emit('publish-moments')">发朋友圈</button>
			<button class="long-action-button long-action-primary" @click="$emit('publish-xhs')">发布到小红书</button>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengLongTraveloguePreview',
	props: {
		coverImage: {
			type: String,
			default: ''
		},
		title: {
			type: String,
			default: '这次不急着看尽一切，只看懂今天遇到的自己'
		},
		subtitle: {
			type: String,
			default: '白塔寺之后，像是一场温柔又诚实的慢行'
		},
		intro: {
			type: String,
			default: ''
		},
		templateTitle: {
			type: String,
			default: '城市漫步杂志'
		},
		routeItems: {
			type: Array,
			default: () => []
		},
		chapters: {
			type: Array,
			default: () => []
		},
		photoCards: {
			type: Array,
			default: () => []
		},
		tags: {
			type: Array,
			default: () => []
		},
		sourceCount: {
			type: Number,
			default: 0
		}
	},
	emits: ['edit', 'export-pdf', 'publish-moments', 'publish-xhs'],
	computed: {
		tagList() {
			const tags = Array.isArray(this.tags) && this.tags.length > 0 ? this.tags : ['白塔寺', '什刹海', '胡同漫步']
			return tags.slice(0, 4)
		},
		safeRouteItems() {
			const fallback = [
				{ time: '09:30', title: '白塔寺' },
				{ time: '11:00', title: '历代帝王庙' },
				{ time: '15:40', title: '什刹海' }
			]
			return (Array.isArray(this.routeItems) && this.routeItems.length > 0 ? this.routeItems : fallback).slice(0, 5)
		},
		safePhotoCards() {
			const fallbackImage = this.coverImage
			const fallback = this.safeRouteItems.map((item, index) => ({
				key: `fallback-photo-${index}`,
				label: item.title,
				image: fallbackImage
			}))
			return (Array.isArray(this.photoCards) && this.photoCards.length > 0 ? this.photoCards : fallback).slice(0, 6)
		},
		safeChapters() {
			if (Array.isArray(this.chapters) && this.chapters.length > 0) {
				return this.chapters.slice(0, 4)
			}
			return [
				{
					title: '第一站 白塔寺',
					text: '从地铁口走出来的时候，阳光还不算重。我没有急着拍照，只是在白塔寺前停了一会儿，看风从塔身背后慢慢掠过去。',
					quote: '慢下来，才听得到这座城的温度。',
					image: this.coverImage
				},
				{
					title: '第二站 什刹海',
					text: '水面把午后的光分成很多小片，路边的声音也变得松弛。这里不像一个目的地，更像一段适合把脚步放慢的时间。',
					quote: '我记住的是树影、桥边和那一点点水汽。',
					image: this.coverImage
				},
				{
					title: '第三站 胡同里的黄昏',
					text: '傍晚穿过胡同，街口的小店开始亮灯。地图上的线条很直，真实的路却总有一点人情味的拐弯。',
					quote: '这不是打卡结束，是一天真正被记住。',
					image: this.coverImage
				}
			]
		},
		privacyText() {
			const sourceText = this.sourceCount > 0 ? `${this.sourceCount} 条资料已核对` : '地点与轨迹默认仅自己可见'
			return `${sourceText} · 精确轨迹可隐藏`
		}
	}
}
</script>

<style scoped>
.xicheng-long-travelogue {
	margin-top: 28rpx;
	padding: 0;
	border-radius: 36rpx;
	overflow: hidden;
	background: #FFFCF6;
	box-shadow: 0 22rpx 56rpx rgba(28, 35, 32, 0.12);
}

.long-cover {
	position: relative;
	min-height: 620rpx;
	overflow: hidden;
}

.long-cover-image {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.long-cover-scrim {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: linear-gradient(180deg, rgba(16, 47, 41, 0.16), rgba(16, 47, 41, 0.72));
}

.long-cover-copy {
	position: absolute;
	left: 36rpx;
	right: 36rpx;
	bottom: 56rpx;
	z-index: 2;
}

.long-kicker,
.long-title,
.long-subtitle {
	display: block;
	color: #FFF8EA;
}

.long-kicker {
	margin-bottom: 18rpx;
	font-size: 24rpx;
	line-height: 1.35;
	letter-spacing: 0;
}

.long-title {
	max-width: 560rpx;
	font-size: 48rpx;
	line-height: 1.22;
	font-weight: 900;
}

.long-subtitle {
	margin-top: 18rpx;
	font-size: 26rpx;
	line-height: 1.55;
	opacity: 0.92;
}

.long-template-pill {
	position: absolute;
	right: 28rpx;
	top: 28rpx;
	z-index: 3;
	padding: 12rpx 20rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.9);
	color: #173F35;
	font-size: 23rpx;
	line-height: 1.35;
	font-weight: 800;
}

.long-body {
	padding: 30rpx;
}

.long-intro-card,
.long-route-card,
.long-chapter,
.long-photo-memory,
.long-ending-card {
	border: 1rpx solid rgba(181, 148, 94, 0.14);
	border-radius: 30rpx;
	background: rgba(255, 255, 255, 0.78);
	box-sizing: border-box;
}

.long-intro-card,
.long-route-card,
.long-photo-memory,
.long-ending-card {
	padding: 28rpx;
}

.long-section-label,
.long-section-title,
.long-section-meta,
.long-intro,
.long-tag,
.long-route-time,
.long-route-title,
.long-chapter-index,
.long-chapter-title,
.long-chapter-text,
.long-quote-card text,
.long-ending-title,
.long-ending-text,
.long-privacy,
.long-photo-label {
	display: block;
}

.long-section-label {
	color: #B8812B;
	font-size: 23rpx;
	line-height: 1.35;
	font-weight: 800;
}

.long-intro {
	margin-top: 16rpx;
	color: #2B3632;
	font-size: 31rpx;
	line-height: 1.75;
	font-weight: 500;
}

.long-tag-row {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 24rpx;
}

.long-tag {
	padding: 8rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(31, 110, 90, 0.1);
	color: #1F6E5A;
	font-size: 22rpx;
	line-height: 1.35;
	font-weight: 700;
}

.long-route-card,
.long-chapter,
.long-photo-memory,
.long-ending-card {
	margin-top: 24rpx;
}

.long-section-head {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 20rpx;
}

.long-section-title {
	color: #102F29;
	font-size: 34rpx;
	line-height: 1.3;
	font-weight: 900;
}

.long-section-meta {
	color: #8B7A61;
	font-size: 22rpx;
	line-height: 1.35;
	white-space: nowrap;
}

.long-route-line {
	position: relative;
	margin-top: 26rpx;
	padding-left: 28rpx;
}

.long-route-line::before {
	content: '';
	position: absolute;
	left: 20rpx;
	top: 20rpx;
	bottom: 20rpx;
	width: 2rpx;
	background: rgba(31, 110, 90, 0.22);
}

.long-route-item {
	position: relative;
	display: grid;
	grid-template-columns: 92rpx 50rpx minmax(0, 1fr);
	align-items: center;
	gap: 12rpx;
	min-height: 70rpx;
}

.long-route-time {
	color: #8B7A61;
	font-size: 22rpx;
	line-height: 1.35;
	font-weight: 700;
}

.long-route-dot {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 42rpx;
	height: 42rpx;
	border-radius: 999rpx;
	background: #1F6E5A;
	color: #FFF8EA;
	font-size: 22rpx;
	font-weight: 800;
	box-shadow: 0 8rpx 18rpx rgba(31, 110, 90, 0.2);
}

.long-route-title {
	min-width: 0;
	color: #263D35;
	font-size: 28rpx;
	line-height: 1.35;
	font-weight: 800;
}

.long-chapter {
	overflow: hidden;
}

.long-chapter-image {
	width: 100%;
	height: 312rpx;
}

.long-chapter-copy {
	padding: 28rpx;
}

.long-chapter-index {
	color: #B8812B;
	font-size: 22rpx;
	line-height: 1.35;
	font-weight: 800;
}

.long-chapter-title {
	margin-top: 10rpx;
	color: #102F29;
	font-size: 36rpx;
	line-height: 1.3;
	font-weight: 900;
}

.long-chapter-text {
	margin-top: 18rpx;
	color: #3A403D;
	font-size: 30rpx;
	line-height: 1.75;
}

.long-quote-card {
	margin-top: 24rpx;
	padding: 22rpx 24rpx;
	border-left: 6rpx solid #B8812B;
	border-radius: 20rpx;
	background: rgba(247, 241, 229, 0.9);
}

.long-quote-card text {
	color: #6D5733;
	font-size: 27rpx;
	line-height: 1.6;
	font-weight: 700;
}

.long-photo-scroll {
	margin-top: 24rpx;
	white-space: nowrap;
}

.long-photo-strip {
	display: inline-flex;
	gap: 16rpx;
	padding-bottom: 4rpx;
}

.long-photo-card {
	width: 220rpx;
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.92);
	overflow: hidden;
	box-shadow: 0 8rpx 20rpx rgba(28, 35, 32, 0.08);
}

.long-photo-image {
	width: 220rpx;
	height: 170rpx;
}

.long-photo-label {
	padding: 14rpx 16rpx 18rpx;
	color: #173F35;
	font-size: 24rpx;
	line-height: 1.35;
	font-weight: 800;
}

.long-ending-card {
	background: linear-gradient(135deg, rgba(31, 110, 90, 0.1), rgba(184, 129, 43, 0.1));
}

.long-ending-title {
	color: #102F29;
	font-size: 36rpx;
	line-height: 1.35;
	font-weight: 900;
}

.long-ending-text {
	margin-top: 18rpx;
	color: #3A403D;
	font-size: 30rpx;
	line-height: 1.75;
}

.long-privacy {
	margin-top: 24rpx;
	color: #8B7A61;
	font-size: 23rpx;
	line-height: 1.45;
}

.long-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14rpx;
	padding: 0 30rpx 30rpx;
}

.long-action-button {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 82rpx;
	margin: 0;
	border-radius: 999rpx;
	font-size: 27rpx;
	line-height: 1.35;
	font-weight: 800;
}

.long-action-button::after {
	border: 0;
}

.long-action-ghost {
	border: 1rpx solid rgba(181, 148, 94, 0.2);
	background: #FFF8EA;
	color: #173F35;
}

.long-action-primary {
	background: linear-gradient(135deg, #173F35, #1F6E5A);
	color: #FFF8EA;
	box-shadow: 0 16rpx 30rpx rgba(31, 110, 90, 0.2);
}
</style>
