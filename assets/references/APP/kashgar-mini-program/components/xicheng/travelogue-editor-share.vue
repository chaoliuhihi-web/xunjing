<template>
	<view class="travelogue-editor-share-panel xicheng-paper-card">
		<view class="section-head">
			<text class="section-title">编辑游记</text>
			<text class="section-badge">发布前预览</text>
		</view>
		<input
			:value="editableTitle"
			class="editor-title-input"
			maxlength="32"
			placeholder="给今天的西城游记起个标题"
			@input="handleTitleInput"
		/>
		<view class="editor-photo-strip">
			<view
				v-for="photo in photoCards"
				:key="photo.key"
				class="editor-photo-item"
			>
				<image class="editor-photo-image" :src="photo.image" mode="aspectFill" />
				<text class="editor-photo-label">{{ photo.label }}</text>
			</view>
		</view>
		<view class="editor-block">
			<text class="editor-block-title">今日路线</text>
			<view
				v-for="item in routeItems"
				:key="`${item.time}-${item.title}`"
				class="editor-route-row"
			>
				<text class="editor-route-time">{{ item.time }}</text>
				<text class="editor-route-dot"></text>
				<text class="editor-route-title">{{ item.title }}</text>
			</view>
		</view>
		<view class="editor-block">
			<text class="editor-block-title">我的感受</text>
			<text class="editor-block-copy">{{ feelingText }}</text>
		</view>
		<view class="editor-xiaojing-block">
			<image class="editor-xiaojing-avatar" :src="region.companionAvatar" mode="aspectFit" />
			<view class="editor-xiaojing-copy">
				<text class="editor-block-title">小京补充</text>
				<text class="editor-block-copy">{{ xiaojingSupplement }}</text>
			</view>
		</view>
		<view class="editor-tag-row">
			<text
				v-for="tag in tagChips"
				:key="tag"
				class="editor-tag-chip"
			>
				{{ tag }}
			</text>
		</view>
		<view class="editor-share-actions">
			<button class="ghost-button xicheng-secondary-action" @click="$emit('save')">保存草稿</button>
			<button class="ghost-button xicheng-secondary-action" @click="$emit('generate-share')">生成分享图</button>
			<button class="primary-button xicheng-primary-action" @click="$emit('publish')">发布</button>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengTravelogueEditorShare',
	props: {
		region: {
			type: Object,
			required: true
		},
		editableTitle: {
			type: String,
			default: ''
		},
		photoCards: {
			type: Array,
			default: () => []
		},
		routeItems: {
			type: Array,
			default: () => []
		},
		feelingText: {
			type: String,
			default: ''
		},
		xiaojingSupplement: {
			type: String,
			default: ''
		},
		tagChips: {
			type: Array,
			default: () => []
		}
	},
	emits: ['update:title', 'save', 'generate-share', 'publish'],
	methods: {
		handleTitleInput(event) {
			this.$emit('update:title', event && event.detail ? event.detail.value : '')
		}
	}
}
</script>

<style scoped>
.travelogue-editor-share-panel {
	margin-top: 24rpx;
	padding: 30rpx;
}

.editor-title-input {
	width: 100%;
	height: 92rpx;
	margin-top: 18rpx;
	padding: 0 24rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.16);
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.84);
	box-sizing: border-box;
	font-size: 34rpx;
	font-weight: 800;
	color: #102F29;
}

.editor-photo-strip {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 24rpx;
}

.editor-photo-item {
	position: relative;
	min-height: 150rpx;
	border-radius: 24rpx;
	overflow: hidden;
	background: #E8ECE7;
}

.editor-photo-image {
	width: 100%;
	height: 150rpx;
	object-fit: cover;
}

.editor-photo-label {
	position: absolute;
	left: 12rpx;
	right: 12rpx;
	bottom: 12rpx;
	padding: 6rpx 10rpx;
	border-radius: 999rpx;
	background: rgba(16, 47, 41, 0.78);
	color: #FFF9EC;
	font-size: 22rpx;
	line-height: 1.3;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.editor-block,
.editor-xiaojing-block {
	margin-top: 24rpx;
	padding-top: 22rpx;
	border-top: 1rpx solid rgba(181, 148, 94, 0.14);
}

.editor-block-title,
.editor-block-copy,
.editor-route-time,
.editor-route-title {
	display: block;
}

.editor-block-title {
	font-size: 30rpx;
	line-height: 1.4;
	font-weight: 800;
	color: #102F29;
}

.editor-block-copy {
	margin-top: 12rpx;
	font-size: 25rpx;
	line-height: 1.75;
	color: #344054;
}

.editor-route-row {
	display: grid;
	grid-template-columns: 96rpx 26rpx 1fr;
	align-items: center;
	gap: 14rpx;
	margin-top: 14rpx;
}

.editor-route-time {
	font-size: 24rpx;
	color: #746F68;
}

.editor-route-dot {
	width: 16rpx;
	height: 16rpx;
	border: 3rpx solid #B5945E;
	border-radius: 999rpx;
	box-sizing: border-box;
}

.editor-route-title {
	font-size: 26rpx;
	line-height: 1.45;
	color: #173F35;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.editor-xiaojing-block {
	display: grid;
	grid-template-columns: 112rpx 1fr;
	gap: 18rpx;
	align-items: start;
}

.editor-xiaojing-avatar {
	width: 112rpx;
	height: 132rpx;
}

.editor-xiaojing-copy {
	min-width: 0;
}

.editor-tag-row {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 22rpx;
}

.editor-tag-chip {
	padding: 10rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.12);
	font-size: 24rpx;
	line-height: 1.35;
	color: #173F35;
}

.editor-share-actions {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 24rpx;
}

.editor-share-actions .primary-button,
.editor-share-actions .ghost-button {
	width: 100%;
	margin-top: 0;
}

.primary-button,
.ghost-button {
	height: 84rpx;
	line-height: 84rpx;
	border-radius: 28rpx;
	font-size: 28rpx;
}

.primary-button {
	background: #1F6E5A;
	color: #FFFFFF;
}

.ghost-button {
	background: #E8ECE7;
	color: #1F6E5A;
}
</style>
