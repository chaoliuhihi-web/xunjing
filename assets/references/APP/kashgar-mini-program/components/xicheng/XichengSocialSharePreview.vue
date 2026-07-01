<template>
	<view class="xicheng-social-share-preview xicheng-paper-card">
		<view class="social-head">
			<view>
				<text class="social-kicker">{{ channelLabel }}</text>
				<text class="social-title">{{ previewTitle }}</text>
			</view>
			<text class="social-status">发布确认</text>
		</view>
		<view class="social-preview-body">
			<image class="social-cover" :src="coverImage" mode="aspectFill" />
			<view class="social-copy">
				<text class="social-copy-title">{{ copyTitle }}</text>
				<text class="social-copy-text">{{ copyText }}</text>
				<view class="social-tag-row">
					<text v-for="tag in visibleTags" :key="tag" class="social-tag">#{{ tag }}</text>
				</view>
			</view>
		</view>
		<view class="social-actions">
			<button class="social-button" @click="$emit('copy')">复制文案</button>
			<button class="social-button" @click="$emit('save-image')">保存图片</button>
			<button class="social-button social-button-primary" @click="$emit('confirm')">唤起发布确认</button>
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
			return this.isXiaohongshu ? '标题、正文、图集和标签已生成' : '图片、文案和隐私摘要已生成'
		},
		copyTitle() {
			return this.isXiaohongshu ? `${this.title}｜西城 Citywalk` : this.title
		},
		copyText() {
			return this.isXiaohongshu
				? '白塔寺、胡同和什刹海串成了一天的慢行路线，适合收藏成一篇完整游记。'
				: '今天在西城慢慢走了一圈，把路线、照片和小京讲解整理成了一篇游记。'
		},
		visibleTags() {
			const fallback = this.isXiaohongshu ? ['北京Citywalk', '西城旅行', '白塔寺'] : ['西城', '城市漫步']
			return (Array.isArray(this.tags) && this.tags.length > 0 ? this.tags : fallback).slice(0, 4)
		}
	}
}
</script>

<style scoped>
.xicheng-social-share-preview {
	margin-top: 24rpx;
	padding: 28rpx;
	border-radius: 34rpx;
}
.social-head,
.social-preview-body,
.social-actions {
	display: flex;
	gap: 18rpx;
}
.social-head {
	align-items: flex-start;
	justify-content: space-between;
}
.social-kicker,
.social-title,
.social-status,
.social-copy-title,
.social-copy-text {
	display: block;
}
.social-kicker {
	color: #B5945E;
	font-size: 23rpx;
	font-weight: 900;
}
.social-title {
	margin-top: 8rpx;
	color: #102F29;
	font-size: 31rpx;
	line-height: 1.25;
	font-weight: 900;
}
.social-status {
	padding: 10rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(31, 110, 90, 0.1);
	color: #1F6E5A;
	font-size: 21rpx;
	font-weight: 900;
	white-space: nowrap;
}
.social-preview-body {
	align-items: stretch;
	margin-top: 22rpx;
}
.social-cover {
	width: 192rpx;
	height: 226rpx;
	border-radius: 24rpx;
	background: rgba(23, 63, 53, 0.08);
	flex-shrink: 0;
}
.social-copy {
	flex: 1;
	min-width: 0;
	padding: 18rpx;
	border-radius: 24rpx;
	background: rgba(255, 248, 234, 0.72);
	box-sizing: border-box;
}
.social-copy-title {
	color: #102F29;
	font-size: 27rpx;
	line-height: 1.35;
	font-weight: 900;
}
.social-copy-text {
	margin-top: 10rpx;
	color: #746F68;
	font-size: 23rpx;
	line-height: 1.45;
}
.social-tag-row {
	display: flex;
	flex-wrap: wrap;
	gap: 10rpx;
	margin-top: 14rpx;
}
.social-tag {
	padding: 7rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.14);
	color: #8C6B36;
	font-size: 20rpx;
	font-weight: 800;
}
.social-actions {
	margin-top: 22rpx;
}
.social-button {
	flex: 1;
	min-height: 58rpx;
	margin: 0;
	padding: 0 12rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.9);
	color: #173F35;
	font-size: 22rpx;
	line-height: 58rpx;
	font-weight: 900;
}
.social-button-primary {
	background: #173F35;
	color: #FFF8EA;
}
.social-button::after {
	border: 0;
}
</style>
