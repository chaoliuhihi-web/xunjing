<template>
	<view class="travelogue-generation-hero xicheng-paper-card">
		<view class="travelogue-generation-head">
			<image class="travelogue-generation-avatar" :src="region.companionAvatar" mode="aspectFit" />
			<view class="travelogue-generation-bubble xicheng-companion-bubble">
				<text class="travelogue-generation-title">生成西城游记</text>
				<text class="travelogue-generation-copy">我已帮你整理今天的西城片段</text>
			</view>
		</view>
		<view class="travelogue-summary-grid">
			<view
				v-for="card in summaryCards"
				:key="card.key"
				class="travelogue-summary-card"
			>
				<text class="summary-label">{{ card.label }}</text>
				<text class="summary-value">{{ card.value }}</text>
			</view>
		</view>
		<view class="travelogue-style-selector">
			<button
				v-for="style in styleOptions"
				:key="style.key"
				:class="['travelogue-style-chip', activeStyle === style.key ? 'travelogue-style-chip-active' : '']"
				@click="$emit('apply-template', style)"
			>
				{{ style.title }}
			</button>
		</view>
		<xicheng-travelogue-template-gallery
			:selected-key="selectedTemplate"
			@select="$emit('apply-template', $event)"
			@apply="$emit('apply-template', $event)"
		/>
		<xicheng-travelogue-template-settings
			:template-title="templateTitle"
			:settings="templateSettings"
			@change="$emit('change-template-settings', $event)"
		/>
		<xicheng-travelogue-generation-state-panel
			v-if="generationState !== 'ready'"
			:status="generationState"
			:material-hints="materialHints"
			:failure-reason="failureReason"
			@explore="$emit('explore')"
			@add-photo="$emit('add-photo')"
			@retry="$emit('generate')"
			@manual-edit="$emit('edit')"
		/>
		<xicheng-long-travelogue-preview
			:has-evidence="hasEvidence"
			:cover-image="coverImage"
			:title="title"
			:subtitle="subtitle"
			:intro="intro"
			:template-title="templateTitle"
			:route-items="routeItems"
			:chapters="chapters"
			:photo-cards="photoCards"
			:tags="tags"
			:source-count="sourceCount"
			@edit="$emit('edit')"
			@export-pdf="$emit('export-pdf')"
			@publish-moments="$emit('publish-moments')"
			@publish-xhs="$emit('publish-xhs')"
		/>
		<view v-if="autoTraveloguePackage" class="vision-agent-auto-package">
			<view class="vision-agent-auto-package-head">
				<text class="vision-agent-auto-package-title">AI识境自动素材包</text>
				<text class="vision-agent-auto-package-count">{{ autoTraveloguePackage.taskCount }} 个真实任务包</text>
			</view>
			<text class="vision-agent-auto-package-line">{{ autoTraveloguePackage.storyCueText }}</text>
			<text class="vision-agent-auto-package-line">{{ autoTraveloguePackage.mapCueText }}</text>
			<text class="vision-agent-auto-package-line">{{ autoTraveloguePackage.shareCueText }}</text>
		</view>
		<view class="travelogue-generation-actions">
			<button class="ghost-button xicheng-secondary-action" @click="$emit('edit')">继续编辑</button>
			<button class="ghost-button xicheng-secondary-action" @click="$emit('open-reader')">精美预览</button>
			<button class="primary-button xicheng-primary-action" @click="$emit('generate')">生成游记</button>
		</view>
		<text class="travelogue-human-notice">预览内容来自你的照片、路线、备注和已核对资料，可继续改成自己的语气。</text>
	</view>
</template>

<script>
import XichengLongTraveloguePreview from '@/components/xicheng/XichengLongTraveloguePreview.vue'
import XichengTravelogueTemplateGallery from '@/components/xicheng/XichengTravelogueTemplateGallery.vue'
import XichengTravelogueTemplateSettings from '@/components/xicheng/XichengTravelogueTemplateSettings.vue'
import XichengTravelogueGenerationStatePanel from '@/components/xicheng/XichengTravelogueGenerationStatePanel.vue'

export default {
	name: 'XichengTravelogueGenerationHero',
	components: {
		XichengLongTraveloguePreview,
		XichengTravelogueTemplateGallery,
		XichengTravelogueTemplateSettings,
		XichengTravelogueGenerationStatePanel
	},
	props: {
		region: {
			type: Object,
			required: true
		},
		summaryCards: {
			type: Array,
			default: () => []
		},
		styleOptions: {
			type: Array,
			default: () => []
		},
		activeStyle: {
			type: String,
			default: ''
		},
		selectedTemplate: {
			type: String,
			default: ''
		},
		templateTitle: {
			type: String,
			default: ''
		},
		templateSettings: {
			type: Object,
			default: () => ({})
		},
		generationState: {
			type: String,
			default: 'ready'
		},
		materialHints: {
			type: Array,
			default: () => []
		},
		failureReason: {
			type: String,
			default: ''
		},
		hasEvidence: {
			type: Boolean,
			default: false
		},
		coverImage: {
			type: String,
			default: ''
		},
		title: {
			type: String,
			default: ''
		},
		subtitle: {
			type: String,
			default: ''
		},
		intro: {
			type: String,
			default: ''
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
		autoTraveloguePackage: {
			type: Object,
			default: null
		}
	},
	emits: [
		'apply-template',
		'change-template-settings',
		'explore',
		'add-photo',
		'generate',
		'edit',
		'open-reader',
		'export-pdf',
		'publish-moments',
		'publish-xhs'
	]
}
</script>

<style scoped>
.travelogue-generation-hero {
	margin-top: 24rpx;
	padding: 30rpx;
}
.travelogue-generation-head {
	display: flex;
	align-items: center;
	gap: 20rpx;
}
.travelogue-generation-avatar {
	width: 128rpx;
	height: 128rpx;
	flex-shrink: 0;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.88);
	box-shadow: 0 14rpx 32rpx rgba(28, 35, 32, 0.10);
}
.travelogue-generation-bubble {
	flex: 1;
	min-width: 0;
	padding: 24rpx 28rpx;
	border-radius: 30rpx;
	box-sizing: border-box;
	background: rgba(255, 253, 248, 0.92);
	border: 1rpx solid rgba(181, 148, 94, 0.18);
}
.travelogue-generation-title,
.travelogue-generation-copy {
	display: block;
}
.travelogue-generation-title {
	font-size: 36rpx;
	line-height: 1.32;
	font-weight: 800;
	color: #102F29;
}
.travelogue-generation-copy {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.45;
	color: #746F68;
}
.travelogue-summary-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
	margin-top: 28rpx;
}
.travelogue-summary-card {
	min-height: 104rpx;
	padding: 20rpx 22rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.14);
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.78);
	box-sizing: border-box;
}
.summary-label,
.summary-value {
	display: block;
}
.summary-label {
	font-size: 22rpx;
	line-height: 1.35;
	color: #8B7A61;
}
.summary-value {
	margin-top: 6rpx;
	font-size: 28rpx;
	line-height: 1.35;
	font-weight: 700;
	color: #173F35;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.travelogue-style-selector {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 28rpx;
}
.travelogue-style-chip {
	height: 78rpx;
	line-height: 76rpx;
	margin: 0;
	padding: 0 12rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.18);
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.80);
	color: #173F35;
	font-size: 26rpx;
	box-shadow: 0 8rpx 20rpx rgba(28, 35, 32, 0.05);
}
.travelogue-style-chip::after {
	border: 0;
}
.travelogue-style-chip-active {
	background: linear-gradient(180deg, #234D42 0%, #102F29 100%);
	color: #FFF9EC;
}
.vision-agent-auto-package {
	margin-top: 20rpx;
	padding: 22rpx;
	border: 1rpx solid rgba(31, 110, 90, 0.16);
	border-radius: 24rpx;
	background: rgba(241, 249, 244, 0.82);
	box-sizing: border-box;
}
.vision-agent-auto-package-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 14rpx;
	margin-bottom: 14rpx;
}
.vision-agent-auto-package-title,
.vision-agent-auto-package-count,
.vision-agent-auto-package-line {
	display: block;
	min-width: 0;
}
.vision-agent-auto-package-title {
	font-size: 27rpx;
	line-height: 1.35;
	font-weight: 800;
	color: #173F35;
}
.vision-agent-auto-package-count {
	flex-shrink: 0;
	font-size: 22rpx;
	line-height: 1.35;
	font-weight: 700;
	color: #1F6E5A;
}
.vision-agent-auto-package-line {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #43534D;
}
.travelogue-generation-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
	margin-top: 28rpx;
}
.primary-button,
.ghost-button {
	height: 84rpx;
	line-height: 84rpx;
	margin-top: 0;
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
.travelogue-human-notice {
	display: block;
	margin-top: 20rpx;
	font-size: 22rpx;
	line-height: 1.45;
	text-align: center;
	color: #8B7A61;
}
</style>
