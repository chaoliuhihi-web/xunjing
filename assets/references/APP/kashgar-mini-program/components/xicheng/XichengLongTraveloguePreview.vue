<template>
	<view class="xicheng-long-travelogue xicheng-paper-card">
		<view class="long-cover">
			<image v-if="coverImage" class="long-cover-image" :src="coverImage" mode="aspectFill" />
			<view class="long-cover-scrim"></view>
			<view class="long-cover-copy">
				<text class="long-kicker">我的西城游记</text>
				<text class="long-title">{{ title }}</text>
				<text class="long-subtitle">{{ subtitle }}</text>
				<text class="long-intro">{{ intro }}</text>
			</view>
			<view class="long-template-pill">出版级长文预览 · {{ templateTitle }}</view>
		</view>

		<view class="long-reader-tabs">
			<view
				v-for="tab in readerTabs"
				:key="tab.key"
				class="long-reader-tab"
				:class="{ 'long-reader-tab-active': tab.active }"
			>
				<xicheng-icon :name="tab.icon" variant="plain" :size="20" />
				<text>{{ tab.title }}</text>
			</view>
		</view>

		<view class="long-body">
			<view class="long-route-overview">
				<view class="long-section-head">
					<view>
						<text class="long-section-kicker">行程路线概览</text>
						<text class="long-section-title">两日慢行路线</text>
					</view>
					<text class="long-section-meta">{{ routeMetaText }}</text>
				</view>
				<view class="long-map-card">
					<view class="long-map-grid"></view>
					<view class="long-map-water long-map-water-left"></view>
					<view class="long-map-water long-map-water-right"></view>
					<view class="long-map-route"></view>
					<view class="long-map-legend">
						<text class="long-map-legend-item">文化建筑</text>
						<text class="long-map-legend-item">历史遗迹</text>
						<text class="long-map-legend-item">胡同院落</text>
						<text class="long-map-legend-item">自然景观</text>
					</view>
					<view
						v-for="(item, index) in mapRouteItems"
						:key="`map-${item.title}-${index}`"
						class="long-map-pin"
						:class="`long-map-pin-${index + 1}`"
					>
						<text>{{ index + 1 }}</text>
						<view>{{ item.title }}</view>
					</view>
					<view class="long-route-summary">
						<text class="long-route-summary-title">两日慢行路线</text>
						<text class="long-route-summary-copy">{{ routeSummary }}</text>
						<text class="long-route-day">{{ dayOneRouteText }}</text>
						<text class="long-route-day">{{ dayTwoRouteText }}</text>
					</view>
				</view>
			</view>

			<view
				v-for="day in dailySections"
				:key="day.key"
				class="long-day-card"
			>
				<view class="long-day-head">
					<view class="long-day-dot"></view>
					<text class="long-day-label">{{ day.label }}</text>
					<text class="long-day-title">{{ day.title }}</text>
				</view>
				<view class="long-day-grid">
					<view
						v-for="(chapter, index) in day.items"
						:key="`${day.key}-${chapter.title}-${index}`"
						class="long-chapter"
					>
						<view class="long-chapter-time-line">
							<text class="long-chapter-time">{{ chapter.time }}</text>
							<view class="long-chapter-dot"></view>
						</view>
						<text class="long-chapter-title">{{ chapter.title }}</text>
						<text class="long-chapter-text">{{ chapter.text }}</text>
						<image v-if="chapter.image" class="long-chapter-image" :src="chapter.image" mode="aspectFill" />
						<view class="long-stamp">{{ chapter.stamp }}</view>
					</view>
				</view>
			</view>

			<view class="long-photo-memory">
				<view class="long-section-head">
					<view>
						<text class="long-section-kicker">我记住的瞬间</text>
						<text class="long-section-title">照片记忆</text>
					</view>
					<text class="long-section-meta">可换封面与顺序</text>
				</view>
				<scroll-view class="long-photo-scroll" scroll-x>
					<view class="long-photo-strip">
						<view
							v-for="photo in safePhotoCards"
							:key="photo.key"
							class="long-photo-card"
						>
							<image v-if="photo.image" class="long-photo-image" :src="photo.image" mode="aspectFill" />
							<view v-else class="long-photo-placeholder"></view>
							<text class="long-photo-label">{{ photo.label }}</text>
						</view>
					</view>
				</scroll-view>
			</view>

			<view class="long-quote-panel">
				<text class="long-quote-mark">“</text>
				<text class="long-quote-text">旅行的意义，不在于去了多少地方，而在于每一次愿意停下来的瞬间。</text>
			</view>

			<view class="long-source-panel">
				<image v-if="companionAvatar" class="long-source-avatar" :src="companionAvatar" mode="aspectFit" />
				<view class="long-source-copy">
					<text class="long-source-kicker">官方来源</text>
					<text class="long-source-title">地点资料已核对，发布前可再次查看</text>
					<text class="long-source-text">白塔寺、什刹海、胡同街区和路线说明只展示已核对的公开信息；精确轨迹默认隐藏。</text>
				</view>
				<view class="long-source-count-card">
					<xicheng-icon name="source" variant="plain" :size="22" />
					<text class="long-source-count-title">官方来源</text>
					<text class="long-source-count">{{ sourceCountLabel }}</text>
					<button class="long-source-link" @click="$emit('view-sources')">查看来源</button>
				</view>
			</view>

			<view class="long-tips-panel">
				<text class="long-section-title">西城慢行小贴士</text>
				<view class="long-tips-grid">
					<view
						v-for="tip in travelTips"
						:key="tip.title"
						class="long-tip-card"
					>
						<xicheng-icon class="long-tip-icon" :name="tip.icon" variant="plain" :size="21" />
						<text class="long-tip-title">{{ tip.title }}</text>
						<text class="long-tip-copy">{{ tip.copy }}</text>
					</view>
				</view>
			</view>

			<view class="long-ending-card">
				<text class="long-section-kicker">写在最后</text>
				<text class="long-ending-text">{{ endingText }}</text>
				<text class="long-privacy">{{ privacyText }}</text>
			</view>
		</view>

		<view class="long-actions">
			<button class="long-action-button long-action-save" @click="$emit('save')">保存游记</button>
			<button class="long-action-button long-action-ghost" @click="$emit('export-pdf')">导出PDF</button>
			<button class="long-action-button long-action-red" @click="$emit('publish-xhs')">发布到小红书</button>
			<button class="long-action-button long-action-primary" @click="$emit('publish-moments')">发朋友圈</button>
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
			default: '两天一夜的西城漫步，从白塔寺的晨钟开始，穿过什刹海的烟柳，拐进胡同里的小店，在黄昏的光里，把时间还给生活。'
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
		},
		companionAvatar: {
			type: String,
			default: ''
		},
		hasEvidence: {
			type: Boolean,
			default: true
		}
	},
	emits: ['save', 'edit', 'export-pdf', 'publish-moments', 'publish-xhs', 'view-sources'],
	computed: {
		readerTabs() {
			return [
				{ key: 'cover', icon: 'travelogue', title: '封面', active: true },
				{ key: 'route', icon: 'route', title: '路线', active: false },
				{ key: 'photo', icon: 'photo', title: '照片', active: false },
				{ key: 'story', icon: 'edit', title: '故事', active: false },
				{ key: 'source', icon: 'source', title: '来源', active: false }
			]
		},
		mapRouteItems() {
			return this.safeRouteItems.slice(0, 3)
		},
		routeSummary() {
			if (!this.hasEvidence) return '待补充真实路线和照片'
			return this.safeRouteItems.length > 0 ? `${this.safeRouteItems.length} 个地点 · 照片和路线已排好` : '白塔寺、什刹海、胡同院落和日落街景'
		},
		routeMetaText() {
			return this.hasEvidence ? '约 8 公里 · 步行为主' : '路线和距离待记录'
		},
		dayOneRouteText() {
			if (!this.hasEvidence) return 'DAY 1  继续识别地点 -> 开始记录 -> 补充照片'
			return 'DAY 1  白塔寺 -> 什刹海 -> 北海北门'
		},
		dayTwoRouteText() {
			if (!this.hasEvidence) return 'DAY 2  写下备注 -> 选择模板 -> 生成长文'
			return 'DAY 2  胡同小店 -> 护国寺街 -> 日落 Citywalk'
		},
		safeRouteItems() {
			if (!this.hasEvidence) {
				return [
					{ time: '--', title: '待补充素材', desc: '继续识别一个真实西城地点。' },
					{ time: '--', title: '继续记录路线', desc: '开始路线记录后再生成路线故事线。' },
					{ time: '--', title: '保存照片备注', desc: '补充照片或一句现场感受。' }
				]
			}
			const fallback = [
				{ time: '09:30', title: '白塔寺', desc: '清晨的白塔寺格外安静。' },
				{ time: '12:00', title: '什刹海', desc: '水面把午后的光分成很多小片。' },
				{ time: '15:00', title: '北海北门', desc: '从什刹海到北海北门，岸边发呆很值得。' },
				{ time: '10:00', title: '胡同里的小店', desc: '拐进安静的胡同，遇见小院和咖啡香。' },
				{ time: '14:00', title: '护国寺街', desc: '热闹、亲切，也有人间烟火。' },
				{ time: '17:30', title: '大栅栏 & 日落 Citywalk', desc: '前门大街染成暖金色。' }
			]
			return (Array.isArray(this.routeItems) && this.routeItems.length > 0 ? this.routeItems : fallback).slice(0, 6)
		},
		safePhotoCards() {
			if (!this.hasEvidence) {
				return [{ key: 'empty-photo', label: '等待补充照片', image: '' }]
			}
			const fallbackImage = this.coverImage
			const fallback = this.safeRouteItems.slice(0, 5).map((item, index) => ({
				key: `fallback-photo-${index}`,
				label: ['白塔寺的晨光', '什刹海的摇橹声', '胡同里的小院', '护国寺的香甜', '前门的日落'][index] || item.title,
				image: item.image || fallbackImage
			}))
			return (Array.isArray(this.photoCards) && this.photoCards.length > 0 ? this.photoCards : fallback).slice(0, 6)
		},
		safeChapters() {
			if (!this.hasEvidence) {
				return [
					{ title: '继续补充真实素材', text: '先识别地点、记录路线、补充照片或现场备注，再生成像人写的完整长文。', image: '' },
					{ title: '不生成空游记', text: '没有可审核素材时，预览只展示待补充结构，不虚构旅行路线和照片故事。', image: '' },
					{ title: '保留编辑入口', text: '素材准备好后，可以选择模板、定制封面和排版，再生成可分享的游记。', image: '' }
				]
			}
			const fallbackChapters = this.safeRouteItems.map((item, index) => ({
				title: item.title,
				text: item.desc || '这一站不只是一个地名，也是今天被认真保存下来的一段。',
				quote: index % 2 === 0 ? '慢下来，才看见细节。' : '把时间留给真正喜欢的地方。',
				image: item.image || this.coverImage
			}))
			if (Array.isArray(this.chapters) && this.chapters.length > 0) {
				const customChapters = this.chapters.slice(0, 6)
				const missingChapters = fallbackChapters.slice(customChapters.length, 6)
				return [...customChapters, ...missingChapters].slice(0, 6)
			}
			return fallbackChapters
		},
		dailySections() {
			const chapters = this.safeChapters
			const time = index => this.safeRouteItems[index] && this.safeRouteItems[index].time ? this.safeRouteItems[index].time : ['09:30', '12:00', '15:00', '10:00', '14:00', '17:30'][index]
			const toItem = (chapter, index) => ({
				time: time(index),
				title: chapter.title,
				text: chapter.text,
				image: chapter.image || this.coverImage,
				stamp: chapter.title
			})
			return [
				{
					key: 'day-1',
					label: 'DAY 1',
					title: '文化与湖光的一天',
					items: chapters.slice(0, 3).map((chapter, index) => toItem(chapter, index))
				},
				{
					key: 'day-2',
					label: 'DAY 2',
					title: '胡同与烟火的一天',
					items: chapters.slice(3, 6).map((chapter, index) => toItem(chapter, index + 3))
				}
			]
		},
		travelTips() {
			return [
				{ icon: 'route', title: '出行建议', copy: '步行为主，地铁 4 号线和 6 号线都方便。' },
				{ icon: 'location', title: '最佳时间', copy: '春秋两季最舒服，清晨与傍晚适合拍照。' },
				{ icon: 'favorite', title: '美食推荐', copy: '护国寺小吃、糖火烧和胡同咖啡都值得试。' },
				{ icon: 'heart', title: '温馨提醒', copy: '街巷里请轻声慢行，把时间留给生活。' }
			]
		},
		endingText() {
			return this.hasEvidence
				? '西城没有喧嚣的终点，却有最真实的生活。两天的时间，我没有赶路，也没有清单，只是跟着自己喜欢的节奏，在老城里慢慢走、慢慢看。也许，这就是旅行最好的样子：我在路上，也在成为更好的自己。'
				: '继续补充真实素材后，这里会生成完整结尾。现在先保留结构和模板，不替你编造一段并没有发生的旅行。'
		},
		privacyText() {
			const checkedText = this.sourceCount > 0 ? `${this.sourceCount} 条地点资料已核对` : '地点与照片可继续补充'
			return `${checkedText} · 精确轨迹默认隐藏 · 发布前可再次检查公开范围`
		},
		sourceCountLabel() {
			return this.sourceCount > 0 ? `${this.sourceCount} 条已核对` : '待补充来源'
		}
	}
}
</script>

<style scoped src="./XichengLongTraveloguePreview.css"></style>
