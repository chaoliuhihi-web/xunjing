<template>
	<view class="travelogue-editor-share-panel xicheng-paper-card">
		<view class="editor-title-card">
			<image class="editor-title-watermark" :src="region.visualAssets.heroLandmark" mode="aspectFill" />
			<text class="editor-panel-kicker">编辑游记</text>
			<view class="editor-section-label">
				<text class="editor-section-mark"></text>
				<text>游记标题</text>
			</view>
			<view class="editor-title-row">
				<input
					:value="editableTitle"
					class="editor-title-input"
					maxlength="32"
					placeholder="给今天的西城游记起个标题"
					@input="handleTitleInput"
				/>
				<xicheng-icon name="edit" variant="plain" :size="22" />
			</view>
			<text class="editor-title-hint">小京已生成草稿，可继续修改</text>
		</view>

		<view class="editor-reference-section editor-photo-section">
			<view class="editor-reference-head">
				<view class="editor-section-label">
					<text class="editor-section-mark"></text>
					<text>照片 ({{ photoCards.length }}/9)</text>
				</view>
			</view>
			<view class="editor-photo-strip">
				<view
					v-for="photo in photoCards"
					:key="photo.key"
					class="editor-photo-item"
				>
					<image class="editor-photo-image" :src="photo.image" mode="aspectFill" />
					<view class="editor-photo-remove">
						<xicheng-icon name="close" variant="primary" :size="12" />
					</view>
					<text class="editor-photo-label">{{ photo.label }}</text>
				</view>
				<button class="editor-add-photo-card" @click="$emit('add-photo')">
					<xicheng-icon name="plus" variant="plain" :size="26" />
					<text>添加照片</text>
				</button>
			</view>
		</view>

		<view class="editor-reference-section editor-route-section">
			<view class="editor-reference-head">
				<view class="editor-section-label editor-route-label">
					<xicheng-icon name="location" variant="plain" :size="21" />
					<text>今日路线</text>
				</view>
				<xicheng-icon name="edit" variant="plain" :size="20" />
			</view>
			<view class="editor-route-layout">
				<view class="editor-route-list">
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
				<view class="editor-route-map-card">
					<view class="editor-route-map-line"></view>
					<view class="editor-route-map-pin editor-route-map-pin-a">
						<xicheng-icon name="explore" variant="primary" active :size="13" />
					</view>
					<view class="editor-route-map-pin editor-route-map-pin-b">
						<xicheng-icon name="record" variant="primary" :size="13" />
					</view>
					<view class="editor-route-map-pin editor-route-map-pin-c">
						<xicheng-icon name="play" variant="primary" :size="13" />
					</view>
				</view>
			</view>
		</view>

		<view class="editor-reference-section">
			<view class="editor-reference-head">
				<view class="editor-section-label editor-feeling-label">
					<xicheng-icon name="heart" variant="plain" :size="21" />
					<text>我的感受</text>
				</view>
				<xicheng-icon name="edit" variant="plain" :size="20" />
			</view>
			<text class="editor-block-copy">{{ feelingText }}</text>
		</view>

		<view class="editor-xiaojing-block editor-reference-section">
			<image class="editor-xiaojing-avatar" :src="region.companionAvatar" mode="aspectFit" />
			<view class="editor-xiaojing-copy">
				<view class="editor-reference-head">
					<text class="editor-block-title">小京补充</text>
					<text class="editor-source-pill">资料来源：已核实</text>
				</view>
				<text class="editor-block-copy">{{ xiaojingSupplement }}</text>
			</view>
		</view>

		<view class="editor-reference-section">
			<view class="editor-reference-head">
				<view class="editor-section-label editor-tag-label">
					<xicheng-icon name="record" variant="plain" :size="21" />
					<text>游记标签</text>
				</view>
				<xicheng-icon name="edit" variant="plain" :size="20" />
			</view>
			<view class="editor-tag-row">
				<view
					v-for="tag in tagChips"
					:key="tag"
					class="editor-tag-chip"
				>
					<text class="editor-tag-text">{{ tag }}</text>
					<xicheng-icon name="close" variant="plain" :size="10" />
				</view>
				<view class="editor-tag-chip editor-tag-add">
					<xicheng-icon name="plus" variant="plain" :size="14" />
					<text>添加标签</text>
				</view>
			</view>
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
	emits: ['update:title', 'save', 'generate-share', 'publish', 'add-photo'],
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
	padding: 0;
	border: 1rpx solid rgba(255, 255, 255, 0.78);
	border-radius: 34rpx;
	background:
		linear-gradient(150deg, rgba(255, 253, 248, 0.98) 0%, rgba(247, 241, 229, 0.94) 58%, rgba(232, 236, 231, 0.9) 100%);
	box-shadow: 0 18rpx 46rpx rgba(28, 35, 32, 0.12);
	overflow: hidden;
}

.travelogue-editor-share-panel button::after {
	border: 0;
}

.editor-title-card {
	position: relative;
	padding: 32rpx 30rpx 30rpx;
	overflow: hidden;
}

.editor-title-watermark {
	position: absolute;
	right: -18rpx;
	bottom: -26rpx;
	width: 210rpx;
	height: 152rpx;
	opacity: 0.12;
	filter: saturate(0.82);
}

.editor-panel-kicker {
	position: relative;
	z-index: 1;
	display: none;
	margin-bottom: 18rpx;
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(31, 110, 90, 0.1);
	color: #1F6E5A;
	font-size: 23rpx;
	line-height: 1.35;
	font-weight: 700;
}

.editor-section-label,
.editor-reference-head,
.editor-title-row {
	display: flex;
	align-items: center;
}

.editor-section-label {
	position: relative;
	z-index: 1;
	gap: 12rpx;
	font-size: 28rpx;
	line-height: 1.4;
	font-weight: 700;
	color: #173F35;
}

.editor-section-mark {
	width: 7rpx;
	height: 32rpx;
	border-radius: 999rpx;
	background: #B5945E;
	box-shadow: 0 5rpx 12rpx rgba(181, 148, 94, 0.28);
}

.editor-title-row {
	position: relative;
	z-index: 1;
	gap: 12rpx;
	margin-top: 20rpx;
}

.editor-title-input {
	flex: 1;
	min-width: 0;
	height: 82rpx;
	padding: 0;
	border: 0;
	background: transparent;
	font-size: 50rpx;
	line-height: 82rpx;
	font-weight: 800;
	color: #102F29;
}

.editor-title-hint {
	position: relative;
	z-index: 1;
	display: block;
	margin-top: 8rpx;
	font-size: 26rpx;
	line-height: 1.45;
	color: #746F68;
}

.editor-reference-section {
	margin: 22rpx 24rpx 0;
	padding: 28rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.12);
	border-radius: 28rpx;
	background: rgba(255, 253, 248, 0.78);
	box-shadow: 0 10rpx 24rpx rgba(28, 35, 32, 0.05);
	box-sizing: border-box;
}

.editor-reference-head {
	justify-content: space-between;
	gap: 16rpx;
}

.editor-photo-strip {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 22rpx;
}

.editor-photo-item {
	position: relative;
	min-height: 176rpx;
	border-radius: 22rpx;
	overflow: hidden;
	background: #E8ECE7;
}

.editor-photo-image {
	width: 100%;
	height: 176rpx;
	object-fit: cover;
}

.editor-photo-remove {
	position: absolute;
	top: 2rpx;
	right: 2rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 72rpx;
	height: 72rpx;
	border-radius: 999rpx;
	background: transparent;
}

.editor-photo-remove::before {
	position: absolute;
	width: 38rpx;
	height: 38rpx;
	border-radius: 999rpx;
	background: rgba(16, 47, 41, 0.74);
	content: '';
}

.editor-photo-remove :deep(.xicheng-icon) {
	position: relative;
	z-index: 1;
}

.editor-photo-remove :deep(.xicheng-icon-primary) {
	background: transparent;
	border-color: transparent;
	box-shadow: none;
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

.editor-add-photo-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	min-height: 176rpx;
	margin: 0;
	padding: 0;
	border: 1rpx dashed rgba(139, 122, 97, 0.44);
	border-radius: 22rpx;
	background: rgba(255, 249, 236, 0.86);
	color: #8B7A61;
	font-size: 23rpx;
	line-height: 1.25;
	box-sizing: border-box;
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
	line-height: 1.8;
	color: #344054;
}

.editor-route-layout {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 178rpx;
	gap: 18rpx;
	align-items: stretch;
	margin-top: 22rpx;
}

.editor-route-list {
	position: relative;
	min-width: 0;
}

.editor-route-list::before {
	position: absolute;
	top: 22rpx;
	bottom: 22rpx;
	left: 110rpx;
	width: 2rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.22);
	content: '';
}

.editor-route-row {
	position: relative;
	display: grid;
	grid-template-columns: 96rpx 26rpx 1fr;
	align-items: center;
	gap: 14rpx;
	margin-top: 18rpx;
	z-index: 1;
}

.editor-route-row:first-child {
	margin-top: 0;
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

.editor-route-map-card {
	position: relative;
	min-height: 168rpx;
	border-radius: 24rpx;
	background:
		linear-gradient(135deg, rgba(31, 110, 90, 0.12), rgba(181, 148, 94, 0.18)),
		linear-gradient(90deg, rgba(255, 255, 255, 0.32) 1rpx, transparent 1rpx),
		linear-gradient(0deg, rgba(255, 255, 255, 0.3) 1rpx, transparent 1rpx);
	background-size: auto, 42rpx 42rpx, 42rpx 42rpx;
	overflow: hidden;
}

.editor-route-map-line {
	position: absolute;
	left: 34rpx;
	right: 32rpx;
	top: 86rpx;
	height: 4rpx;
	border-radius: 999rpx;
	background: rgba(31, 110, 90, 0.48);
	transform: rotate(-18deg);
	transform-origin: center;
}

.editor-route-map-pin {
	position: absolute;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 42rpx;
	height: 42rpx;
	border: 4rpx solid rgba(255, 249, 236, 0.92);
	border-radius: 999rpx;
	background: #1F6E5A;
	box-shadow: 0 10rpx 20rpx rgba(31, 110, 90, 0.24);
}

.editor-route-map-pin :deep(.xicheng-icon-primary) {
	background: transparent;
	border-color: transparent;
	box-shadow: none;
}

.editor-route-map-pin-a {
	left: 22rpx;
	top: 76rpx;
}

.editor-route-map-pin-b {
	left: 75rpx;
	top: 43rpx;
	background: #B5945E;
}

.editor-route-map-pin-c {
	right: 22rpx;
	bottom: 30rpx;
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

.editor-source-pill {
	padding: 7rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(31, 110, 90, 0.1);
	color: #1F6E5A;
	font-size: 21rpx;
	line-height: 1.3;
	white-space: nowrap;
}

.editor-tag-row {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 22rpx;
}

.editor-tag-chip {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	min-height: 54rpx;
	padding: 10rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.12);
	font-size: 24rpx;
	line-height: 1.35;
	color: #173F35;
	box-sizing: border-box;
}

.editor-tag-add {
	border: 1rpx dashed rgba(181, 148, 94, 0.5);
	background: rgba(255, 249, 236, 0.86);
	color: #8B7A61;
}

.editor-share-actions {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14rpx;
	margin: 24rpx;
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
