<template>
	<view class="scan-advanced-context">
		<view class="scan-fusion-panel xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<view>
					<text class="section-kicker">场景融合</text>
					<text class="section-title">镜头打开前，小京已接入这些信号</text>
				</view>
				<text class="section-badge">Scene Engine</text>
			</view>
			<text class="scan-fusion-summary">{{ sceneFusionSummary }}</text>
			<view class="scan-fusion-grid">
				<view
					v-for="signal in sceneFusionSignals"
					:key="signal.key"
					class="scan-fusion-signal"
					:class="{ 'scan-fusion-signal-active': signal.active }"
				>
					<text class="scan-fusion-signal-label">{{ signal.label }}</text>
					<text class="scan-fusion-signal-status">{{ signal.statusText }}</text>
				</view>
			</view>
		</view>

		<view class="scan-agent-preview-panel xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<view>
					<text class="section-kicker">Agent 预判</text>
					<text class="section-title">AI识境预判动作</text>
				</view>
				<text class="section-badge">Decision</text>
			</view>
			<text class="scan-agent-preview-summary">{{ agentDecisionPreviewSummary }}</text>
			<view class="scan-agent-action-grid">
				<view
					class="scan-agent-action"
					v-for="action in sceneAgentActionPreviews"
					:key="action.key"
					:class="{ 'scan-agent-action-active': selectedSceneAgentActionKey === action.key }"
					@click="$emit('select-scene-agent-action', action)"
				>
					<text class="scan-agent-action-label">{{ action.signal }}</text>
					<text class="scan-agent-action-title">{{ action.title }}</text>
					<text class="scan-agent-action-copy">{{ action.copy }}</text>
				</view>
			</view>
		</view>

		<view v-if="memorySessionContinuation" class="scan-memory-session-panel xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<view>
					<text class="section-kicker">连续识境</text>
					<text class="section-title">AI识境连续会话包</text>
				</view>
				<text class="section-badge">{{ memorySessionContinuation.sceneCount }}次识境</text>
			</view>
			<text class="scan-memory-session-copy">{{ memorySessionContinuation.poiTrailText }}</text>
			<text class="scan-memory-session-copy">{{ memorySessionContinuation.continuityCueText }}</text>
			<view class="scan-memory-session-cue-grid">
				<view class="scan-memory-session-cue">
					<text class="scan-memory-session-cue-label">场景领域</text>
					<text class="scan-memory-session-cue-value">{{ memorySessionContinuation.domainContinuityText }}</text>
				</view>
				<view class="scan-memory-session-cue">
					<text class="scan-memory-session-cue-label">服务接力</text>
					<text class="scan-memory-session-cue-value">{{ memorySessionContinuation.serviceContinuityText }}</text>
				</view>
			</view>
			<view class="scan-memory-session-action-grid">
				<view
					v-for="action in memorySessionActionItems"
					:key="action.key"
					class="scan-memory-session-action"
					@click="$emit('handle-memory-session-action', action)"
				>
					<text class="scan-memory-session-action-title">{{ action.title }}</text>
					<text class="scan-memory-session-action-copy">{{ action.copy }}</text>
				</view>
			</view>
		</view>

		<view class="scan-world-interface-hud xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<view>
					<text class="section-kicker">世界交互入口</text>
					<text class="section-title">现实世界成为AI的交互界面</text>
				</view>
				<text class="section-badge">World Interface</text>
			</view>
			<view class="scan-world-interface-grid">
				<view
					v-for="signal in worldInterfaceSignals"
					:key="signal.key"
					class="scan-world-interface-signal"
					:class="{ 'scan-world-interface-signal-active': signal.active }"
				>
					<text class="scan-world-interface-label">{{ signal.label }}</text>
					<text class="scan-world-interface-value">{{ signal.value }}</text>
				</view>
			</view>
			<text class="scan-world-interface-summary">{{ worldInterfaceSummary }}</text>
		</view>

		<view class="scan-capabilities xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<view>
					<text class="section-kicker">自动判断</text>
					<text class="section-title">小京会处理这些线索</text>
				</view>
				<text class="section-badge">单入口</text>
			</view>
			<view class="capability-grid">
				<view v-for="item in capabilities" :key="item.title" class="capability-item">
					<text class="capability-title">{{ item.title }}</text>
					<text class="capability-copy">{{ item.copy }}</text>
				</view>
			</view>
		</view>

		<view class="scan-scene-domain-panel xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<view>
					<text class="section-kicker">可问场景</text>
					<text class="section-title">看见什么，就能问什么</text>
				</view>
				<text class="section-badge">10类理解</text>
			</view>
			<view class="scene-domain-grid">
				<view
					v-for="domain in sceneDomainCapabilities"
					:key="domain.domainKey"
					class="scene-domain-item"
				>
					<text class="scene-domain-label">{{ domain.label }}</text>
					<text class="scene-domain-title">{{ domain.title }}</text>
					<text class="scene-domain-copy">{{ domain.copy }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengScanAdvancedContextPanel',
	props: {
		sceneFusionSummary: {
			type: String,
			default: ''
		},
		sceneFusionSignals: {
			type: Array,
			default: () => []
		},
		agentDecisionPreviewSummary: {
			type: String,
			default: ''
		},
		sceneAgentActionPreviews: {
			type: Array,
			default: () => []
		},
		selectedSceneAgentActionKey: {
			type: String,
			default: ''
		},
		memorySessionContinuation: {
			type: Object,
			default: null
		},
		memorySessionActionItems: {
			type: Array,
			default: () => []
		},
		worldInterfaceSignals: {
			type: Array,
			default: () => []
		},
		worldInterfaceSummary: {
			type: String,
			default: ''
		},
		capabilities: {
			type: Array,
			default: () => []
		},
		sceneDomainCapabilities: {
			type: Array,
			default: () => []
		}
	},
	emits: [
		'select-scene-agent-action',
		'handle-memory-session-action'
	]
}
</script>

<style scoped>
.scan-advanced-context {
	margin-top: 28rpx;
}

.scan-fusion-panel,
.scan-agent-preview-panel,
.scan-memory-session-panel,
.scan-world-interface-hud,
.scan-scene-domain-panel,
.scan-capabilities {
	margin-top: 24rpx;
	padding: 28rpx;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
}

.section-kicker {
	font-size: 22rpx;
	color: #B8812B;
	font-weight: 700;
}

.section-title {
	display: block;
	margin-top: 6rpx;
	font-size: 32rpx;
	font-weight: 800;
	color: #102F29;
}

.section-badge {
	padding: 8rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(184, 129, 43, 0.14);
	color: #8A5B1E;
	font-size: 22rpx;
	font-weight: 700;
	white-space: nowrap;
}

.scan-fusion-panel {
	background:
		linear-gradient(135deg, rgba(255, 253, 248, 0.96), rgba(232, 241, 233, 0.94));
}

.scan-fusion-summary {
	display: block;
	margin-top: 18rpx;
	font-size: 25rpx;
	line-height: 1.55;
	color: rgba(16, 47, 41, 0.74);
}

.scan-fusion-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 22rpx;
}

.scan-fusion-signal {
	min-width: 0;
	min-height: 100rpx;
	padding: 18rpx;
	border-radius: 22rpx;
	border: 1rpx solid rgba(16, 47, 41, 0.08);
	background: rgba(255, 252, 244, 0.72);
	box-sizing: border-box;
}

.scan-fusion-signal-active {
	border-color: rgba(31, 110, 90, 0.24);
	background: rgba(31, 110, 90, 0.10);
}

.scan-fusion-signal-label,
.scan-fusion-signal-status {
	display: block;
	line-height: 1.4;
}

.scan-fusion-signal-label {
	font-size: 22rpx;
	color: rgba(16, 47, 41, 0.56);
}

.scan-fusion-signal-status {
	margin-top: 8rpx;
	font-size: 25rpx;
	font-weight: 800;
	color: #102F29;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.scan-agent-preview-panel {
	background:
		linear-gradient(135deg, rgba(23, 63, 53, 0.96), rgba(31, 110, 90, 0.92));
	color: #FFFFFF;
}

.scan-agent-preview-panel .section-kicker,
.scan-agent-preview-panel .section-title,
.scan-agent-preview-panel .section-badge {
	color: #FFFFFF;
}

.scan-agent-preview-panel .section-badge {
	background: rgba(255, 255, 255, 0.14);
}

.scan-agent-preview-summary {
	display: block;
	margin-top: 18rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: rgba(255, 255, 255, 0.78);
}

.scan-agent-action-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 22rpx;
}

.scan-agent-action {
	min-width: 0;
	min-height: 166rpx;
	padding: 18rpx;
	border-radius: 22rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.14);
	background: rgba(255, 255, 255, 0.09);
	box-sizing: border-box;
}

.scan-agent-action-active {
	border-color: rgba(241, 199, 106, 0.82);
	background: rgba(241, 199, 106, 0.16);
}

.scan-agent-action-label,
.scan-agent-action-title,
.scan-agent-action-copy {
	display: block;
	line-height: 1.4;
}

.scan-agent-action-label {
	font-size: 20rpx;
	font-weight: 800;
	color: rgba(255, 255, 255, 0.66);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.scan-agent-action-title {
	margin-top: 8rpx;
	font-size: 25rpx;
	font-weight: 800;
	color: #FFFFFF;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.scan-agent-action-copy {
	margin-top: 8rpx;
	font-size: 21rpx;
	color: rgba(255, 255, 255, 0.72);
}

.scan-memory-session-panel {
	background:
		linear-gradient(135deg, rgba(255, 253, 248, 0.98), rgba(238, 247, 241, 0.94));
	border: 1rpx solid rgba(31, 110, 90, 0.10);
}

.scan-memory-session-copy {
	display: block;
	margin-top: 14rpx;
	font-size: 24rpx;
	line-height: 1.5;
	color: rgba(16, 47, 41, 0.72);
}

.scan-memory-session-cue-grid,
.scan-memory-session-action-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 18rpx;
}

.scan-memory-session-cue,
.scan-memory-session-action {
	min-width: 0;
	padding: 18rpx;
	border-radius: 20rpx;
	box-sizing: border-box;
}

.scan-memory-session-cue {
	background: rgba(255, 252, 244, 0.82);
	border: 1rpx solid rgba(16, 47, 41, 0.08);
}

.scan-memory-session-action {
	background: rgba(23, 63, 53, 0.92);
}

.scan-memory-session-cue-label,
.scan-memory-session-cue-value,
.scan-memory-session-action-title,
.scan-memory-session-action-copy {
	display: block;
	line-height: 1.4;
}

.scan-memory-session-cue-label {
	font-size: 20rpx;
	font-weight: 800;
	color: rgba(16, 47, 41, 0.54);
}

.scan-memory-session-cue-value {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #102F29;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.scan-memory-session-action-title {
	font-size: 25rpx;
	font-weight: 900;
	color: #FFFFFF;
}

.scan-memory-session-action-copy {
	margin-top: 8rpx;
	font-size: 21rpx;
	color: rgba(255, 255, 255, 0.72);
}

.scan-world-interface-hud {
	background:
		linear-gradient(135deg, rgba(255, 252, 244, 0.98), rgba(239, 247, 240, 0.94));
}

.scan-world-interface-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 22rpx;
}

.scan-world-interface-signal {
	min-width: 0;
	min-height: 132rpx;
	padding: 16rpx;
	border-radius: 20rpx;
	border: 1rpx solid rgba(16, 47, 41, 0.08);
	background: rgba(255, 255, 255, 0.58);
	box-sizing: border-box;
}

.scan-world-interface-signal-active {
	border-color: rgba(184, 129, 43, 0.28);
	background: rgba(255, 247, 226, 0.86);
}

.scan-world-interface-label,
.scan-world-interface-value,
.scan-world-interface-summary {
	display: block;
	line-height: 1.4;
}

.scan-world-interface-label {
	font-size: 20rpx;
	font-weight: 800;
	color: rgba(16, 47, 41, 0.56);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.scan-world-interface-value {
	margin-top: 10rpx;
	font-size: 23rpx;
	font-weight: 800;
	color: #102F29;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.scan-world-interface-summary {
	margin-top: 18rpx;
	font-size: 24rpx;
	color: rgba(16, 47, 41, 0.68);
}

.capability-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 24rpx;
}

.capability-item {
	min-width: 0;
	padding: 20rpx;
	border-radius: 22rpx;
	background: rgba(255, 252, 244, 0.72);
	border: 1rpx solid rgba(184, 129, 43, 0.14);
}

.capability-title,
.capability-copy {
	display: block;
}

.capability-title {
	font-size: 25rpx;
	font-weight: 800;
	color: #102F29;
}

.capability-copy {
	margin-top: 8rpx;
	font-size: 22rpx;
	line-height: 1.45;
	color: rgba(16, 47, 41, 0.62);
}

.scan-scene-domain-panel {
	background:
		linear-gradient(135deg, rgba(255, 253, 248, 0.96), rgba(238, 247, 241, 0.92));
}

.scene-domain-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 24rpx;
}

.scene-domain-item {
	min-width: 0;
	min-height: 136rpx;
	padding: 18rpx;
	border-radius: 20rpx;
	background: rgba(255, 252, 244, 0.78);
	border: 1rpx solid rgba(31, 110, 90, 0.10);
	box-sizing: border-box;
}

.scene-domain-label,
.scene-domain-title,
.scene-domain-copy {
	display: block;
	line-height: 1.35;
}

.scene-domain-label {
	font-size: 20rpx;
	font-weight: 800;
	color: #B8812B;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.scene-domain-title {
	margin-top: 8rpx;
	font-size: 24rpx;
	font-weight: 800;
	color: #102F29;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.scene-domain-copy {
	margin-top: 8rpx;
	font-size: 21rpx;
	color: rgba(16, 47, 41, 0.62);
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
</style>
