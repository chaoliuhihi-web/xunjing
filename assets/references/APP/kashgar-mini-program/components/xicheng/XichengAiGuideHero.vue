<template>
	<view class="xicheng-chat-hero-card">
		<image
			class="xicheng-chat-hero-landmark"
			:src="regionConfig.visualAssets.heroLandmark"
			mode="aspectFill"
		></image>
		<view class="xicheng-chat-hero-overlay"></view>
		<view class="xicheng-chat-hero-head">
			<text class="xicheng-chat-hero-kicker">{{ context.poiName || regionConfig.cityName }}</text>
			<text class="xicheng-chat-hero-title">{{ isPlaybackMode ? 'AI 讲解' : '问问小京' }}</text>
		</view>
		<view class="xicheng-chat-companion-row">
			<image
				class="xicheng-chat-companion-avatar"
				:src="regionConfig.companionAvatar"
				mode="aspectFit"
			></image>
			<view class="xicheng-chat-companion-bubble xicheng-companion-bubble">
				<text class="xicheng-chat-companion-title">你想了解西城的哪一面？</text>
				<text class="xicheng-chat-companion-desc">{{ heroSubtitle }}</text>
			</view>
		</view>
		<view v-if="visionAgentContextChips.length > 0" class="xicheng-vision-agent-strip">
			<text class="xicheng-vision-agent-strip-title">AI识境已接入</text>
			<view class="xicheng-vision-agent-chip-row">
				<text
					v-for="chip in visionAgentContextChips"
					:key="chip.key"
					class="xicheng-vision-agent-chip"
				>
					{{ chip.label }} {{ chip.value }}
				</text>
			</view>
		</view>
		<view v-if="serviceHandoffContext" class="xicheng-service-handoff-strip">
			<text class="xicheng-service-handoff-kicker">AI识境服务承接</text>
			<text class="xicheng-service-handoff-title">{{ serviceHandoffContext.title }}</text>
			<view class="xicheng-service-handoff-row">
				<text class="xicheng-service-handoff-pill">{{ serviceHandoffContext.intentText }}</text>
				<text class="xicheng-service-handoff-next">{{ serviceHandoffContext.stepText }}</text>
			</view>
		</view>
		<view v-if="!isPlaybackMode" class="xicheng-chat-prompt-row">
			<button
				v-for="question in heroQuestions"
				:key="question"
				class="xicheng-chat-prompt-chip"
				@click="$emit('follow-up', question)"
			>
				{{ question }}
			</button>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengAiGuideHero',
	props: {
		context: {
			type: Object,
			default: () => ({})
		},
		regionConfig: {
			type: Object,
			default: () => ({
				cityName: '',
				visualAssets: {},
				companionAvatar: ''
			})
		},
		isPlaybackMode: {
			type: Boolean,
			default: false
		},
		heroSubtitle: {
			type: String,
			default: ''
		},
		visionAgentContextChips: {
			type: Array,
			default: () => []
		},
		serviceHandoffContext: {
			type: Object,
			default: null
		},
		heroQuestions: {
			type: Array,
			default: () => []
		}
	},
	emits: ['follow-up']
}
</script>
