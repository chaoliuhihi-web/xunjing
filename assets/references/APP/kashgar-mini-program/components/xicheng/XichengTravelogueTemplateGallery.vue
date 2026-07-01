<template>
	<view class="xicheng-travelogue-template-gallery xicheng-paper-card">
		<view class="template-head">
			<view>
				<text class="template-kicker">游记模板库</text>
				<text class="template-title">选择一种值得回看的排版</text>
			</view>
			<text class="template-count">{{ normalizedTemplates.length }} 套</text>
		</view>
		<scroll-view class="template-scroll" scroll-x>
			<view class="template-strip">
				<view
					v-for="template in normalizedTemplates"
					:key="template.key"
					class="template-card"
					:class="{ 'template-card-active': template.key === selectedKey }"
					@click="$emit('select', template)"
				>
					<view class="template-cover" :style="{ background: template.background }">
						<text class="template-cover-title">{{ template.title }}</text>
						<text class="template-cover-meta">{{ template.meta }}</text>
					</view>
					<text class="template-name">{{ template.title }}</text>
					<text class="template-desc">{{ template.desc }}</text>
					<button class="template-use-button" @click.stop="$emit('apply', template)">使用此模板生成</button>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
const DEFAULT_TEMPLATES = Object.freeze([
	{ key: 'citywalk', title: '城市漫步杂志', meta: '长文 + 大图', desc: '适合路线故事线和完整长文', background: 'linear-gradient(135deg, #173F35, #B5945E)' },
	{ key: 'hutong', title: '胡同手账', meta: '贴纸 + 札记', desc: '适合慢逛、亲子和手写感记录', background: 'linear-gradient(135deg, #F3E3C2, #7E986D)' },
	{ key: 'architecture', title: '古建札记', meta: '知识卡 + 细节', desc: '适合白塔寺、历代帝王庙等文化线', background: 'linear-gradient(135deg, #102F29, #D7B56D)' },
	{ key: 'album', title: '相册纪念', meta: '照片优先', desc: '适合亲友分享和长期收藏', background: 'linear-gradient(135deg, #F7E9D1, #6C8EA4)' },
	{ key: 'pdf', title: 'PDF 纪念册', meta: 'A4 打印', desc: '适合保存 PDF 和线下打印', background: 'linear-gradient(135deg, #FFF8EA, #173F35)' },
	{ key: 'minimal', title: '简洁图文', meta: '轻量排版', desc: '适合快速发布朋友圈和小红书', background: 'linear-gradient(135deg, #F9F3E8, #C48B5B)' }
])

export default {
	name: 'XichengTravelogueTemplateGallery',
	props: {
		selectedKey: {
			type: String,
			default: 'citywalk'
		},
		templates: {
			type: Array,
			default: () => []
		}
	},
	emits: ['select', 'apply'],
	computed: {
		normalizedTemplates() {
			return Array.isArray(this.templates) && this.templates.length > 0 ? this.templates : DEFAULT_TEMPLATES
		}
	}
}
</script>

<style scoped>
.xicheng-travelogue-template-gallery {
	margin-top: 24rpx;
	padding: 28rpx;
	border-radius: 34rpx;
}
.template-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}
.template-kicker,
.template-title,
.template-count,
.template-cover-title,
.template-cover-meta,
.template-name,
.template-desc {
	display: block;
}
.template-kicker {
	font-size: 23rpx;
	color: #B5945E;
	font-weight: 900;
}
.template-title {
	margin-top: 8rpx;
	font-size: 32rpx;
	line-height: 1.25;
	color: #102F29;
	font-weight: 900;
}
.template-count {
	font-size: 23rpx;
	color: #746F68;
}
.template-scroll {
	margin-top: 22rpx;
	white-space: nowrap;
}
.template-strip {
	display: inline-flex;
	gap: 18rpx;
	padding-right: 2rpx;
}
.template-card {
	width: 246rpx;
	padding: 14rpx;
	border-radius: 28rpx;
	background: rgba(255, 252, 246, 0.9);
	border: 2rpx solid rgba(181, 148, 94, 0.14);
	box-sizing: border-box;
	white-space: normal;
}
.template-card-active {
	border-color: #1F6E5A;
	box-shadow: 0 14rpx 34rpx rgba(31, 110, 90, 0.14);
}
.template-cover {
	height: 168rpx;
	padding: 18rpx;
	border-radius: 22rpx;
	box-sizing: border-box;
}
.template-cover-title {
	color: #FFF8EA;
	font-size: 26rpx;
	font-weight: 900;
}
.template-cover-meta {
	margin-top: 10rpx;
	color: rgba(255, 248, 234, 0.82);
	font-size: 21rpx;
}
.template-name {
	margin-top: 16rpx;
	color: #102F29;
	font-size: 26rpx;
	font-weight: 900;
}
.template-desc {
	margin-top: 8rpx;
	min-height: 60rpx;
	color: #746F68;
	font-size: 22rpx;
	line-height: 1.35;
}
.template-use-button {
	min-height: 56rpx;
	margin: 16rpx 0 0;
	padding: 0 16rpx;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF8EA;
	font-size: 22rpx;
	line-height: 56rpx;
	font-weight: 900;
}
.template-use-button::after {
	border: 0;
}
</style>
