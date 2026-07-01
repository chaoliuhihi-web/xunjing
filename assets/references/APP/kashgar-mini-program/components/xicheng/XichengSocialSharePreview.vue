<template>
	<view class="xicheng-social-share-preview xicheng-paper-card" :class="{ 'xicheng-social-share-preview-red': isXiaohongshu }">
		<view class="social-head">
			<view>
				<text class="social-kicker">{{ channelLabel }}</text>
				<text class="social-title">{{ previewTitle }}</text>
			</view>
			<text class="social-status">发布确认</text>
		</view>

		<view class="social-guide">
			<xicheng-icon :name="isXiaohongshu ? 'edit' : 'photo'" variant="plain" :size="21" />
			<text>{{ isXiaohongshu ? '已生成标题、正文、标签和图片' : '将生成图片与文案，并唤起系统分享确认' }}</text>
		</view>

		<view v-if="isXiaohongshu" class="share-note-card">
			<view class="share-note-carousel">
				<image v-for="(image, index) in previewImages" :key="image" class="share-note-image" :class="{ 'share-note-image-main': index === 0 }" :src="image" mode="aspectFill" />
				<text class="share-note-count">1/{{ previewImages.length }}</text>
			</view>
			<text class="share-note-title">{{ notePreviewTitle }}</text>
			<text class="share-note-body">{{ notePreviewBody }}</text>
			<view class="social-tag-row">
				<text v-for="tag in visibleTags" :key="tag" class="social-tag">#{{ tag }}</text>
			</view>
		</view>

		<view v-else class="share-moments-card">
			<view class="moments-author-row">
				<image class="moments-avatar" src="/static/xicheng/xiaojing-companion.png" mode="aspectFit" />
				<view class="moments-author-copy">
					<text class="moments-name">西城访客 Bruce</text>
					<text class="moments-time">1分钟前</text>
				</view>
				<text class="moments-visibility">好友可见</text>
			</view>
			<text class="moments-copy">{{ copyText }}</text>
			<view class="social-tag-row">
				<text v-for="tag in visibleTags" :key="tag" class="social-tag">#{{ tag }}</text>
			</view>
			<view class="share-photo-collage">
				<image v-for="(image, index) in previewImages.slice(0, 3)" :key="image" class="moments-photo" :class="{ 'moments-photo-main': index === 0 }" :src="image" mode="aspectFill" />
			</view>
		</view>

		<view class="share-route-summary">
			<xicheng-icon name="route" variant="primary" :size="17" />
			<view class="route-summary-copy">
				<text class="route-summary-title">白塔寺文化线 · 3个地点 · 约2.5小时</text>
				<view class="route-stop-row">
					<text v-for="stop in routeStops" :key="stop">{{ stop }}</text>
				</view>
			</view>
			<text class="route-privacy-badge">精确轨迹已隐藏</text>
		</view>

		<view class="material-card">
			<view class="material-head">
				<text class="material-title">{{ isXiaohongshu ? '自动生成素材' : '发布素材' }}</text>
				<text class="material-note">{{ privacySummary }}</text>
			</view>
			<view class="material-grid">
				<view v-for="row in materialRows" :key="row.label" class="material-row">
					<xicheng-icon name="check" variant="primary" :size="13" />
					<text class="material-label">{{ row.label }}</text>
					<text class="material-value">{{ row.value }}</text>
				</view>
			</view>
		</view>

		<view v-if="isXiaohongshu" class="showcase-card">
			<text class="showcase-kicker">发布后展示效果</text>
			<view class="showcase-row">
				<image class="showcase-image" :src="previewImages[0]" mode="aspectFill" />
				<view class="showcase-copy">
					<text class="showcase-title">{{ notePreviewTitle }}</text>
					<text class="showcase-desc">{{ notePreviewBody.slice(0, 46) }}...</text>
				</view>
			</view>
		</view>

		<view class="social-actions">
			<button class="social-button" @click="$emit('copy')">复制文案</button>
			<button class="social-button" @click="$emit('save-image')">保存图片</button>
			<button class="social-button social-button-primary" @click="$emit('confirm')">{{ primaryActionLabel }}</button>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengSocialSharePreview',
	props: {
		channel: {
			type: String,
			default: 'moments'
		},
		coverImage: {
			type: String,
			default: ''
		},
		title: {
			type: String,
			default: '在白塔下遇见西城'
		},
		tags: {
			type: Array,
			default: () => []
		}
	},
	emits: ['copy', 'save-image', 'confirm'],
	computed: {
		isXiaohongshu() {
			return this.channel === 'xiaohongshu'
		},
		channelLabel() {
			return this.isXiaohongshu ? '小红书笔记预览' : '朋友圈发布预览'
		},
		previewTitle() {
			return this.isXiaohongshu ? '小红书笔记预览' : '朋友圈预览'
		},
		previewImages() {
			return [
				this.coverImage || '/static/xicheng/share-poster-background.jpg',
				'/static/xicheng/route-baitasi-culture.jpg',
				'/static/xicheng/route-shichahai-waterfront.jpg',
				'/static/xicheng/route-hutong-life.jpg',
				'/static/xicheng/poi-baitasi-card.jpg'
			]
		},
		routeStops() {
			return ['白塔寺', '历代帝王庙', '什刹海']
		},
		notePreviewTitle() {
			return this.isXiaohongshu ? `${this.title}｜白塔寺 Citywalk 半日线` : this.title
		},
		notePreviewBody() {
			return this.isXiaohongshu
				? '清晨的白塔寺在阳光下格外静谧，沿着胡同走到什刹海，湖光和老城风情扑面而来。'
				: this.copyText
		},
		copyText() {
			return this.isXiaohongshu
				? '白塔寺、胡同和什刹海串成了一天的慢行路线，适合收藏成一篇完整游记。'
				: '在白塔下遇见西城，清晨的胡同和什刹海水色很适合慢慢走。'
		},
		visibleTags() {
			const fallback = this.isXiaohongshu ? ['北京周末去哪儿', '西城Citywalk', '白塔寺', '什刹海', '胡同漫步'] : ['西城Citywalk', '白塔寺', '什刹海']
			return (Array.isArray(this.tags) && this.tags.length > 0 ? this.tags : fallback).slice(0, this.isXiaohongshu ? 5 : 3)
		},
		materialRows() {
			return this.isXiaohongshu
				? [
					{ label: '封面图', value: '1张' },
					{ label: '图集', value: '4张' },
					{ label: '标题', value: '28字' },
					{ label: '正文', value: '186字' },
					{ label: '位置不公开', value: '已设置' },
					{ label: '来源说明已保留', value: '已附' }
				]
				: [
					{ label: '分享图片', value: '3张' },
					{ label: '文案', value: '86字' },
					{ label: '位置不公开', value: '不显示位置' },
					{ label: '来源说明已保留', value: '官方资料库' }
				]
		},
		primaryActionLabel() {
			return this.isXiaohongshu ? '唤起小红书发布' : '唤起朋友圈发布'
		},
		privacySummary() {
			return '位置不公开 · 精确轨迹已隐藏 · 来源说明已保留'
		}
	}
}
</script>

<style scoped src="./XichengSocialSharePreview.css"></style>
