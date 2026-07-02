<template>
	<view class="scan-result-vision-agent-stack">
		<view class="vision-agent-panel xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<text class="section-title">AI识境推荐动作</text>
				<text class="section-badge">Scene Vision Agent</text>
			</view>
			<view class="vision-agent-decision-strip">
				<view class="vision-agent-decision-copy">
					<text class="vision-agent-decision-kicker">Agent 决策</text>
					<text class="vision-agent-decision-summary">{{ visionAgentDecisionSummary }}</text>
					<text v-if="cameraAgentDecisionTitle" class="vision-agent-decision-preview">
						拍前预判：{{ cameraAgentDecisionTitle }}
					</text>
				</view>
				<view class="vision-agent-signal-badges">
					<text
						v-for="signal in sceneFusionSignalBadges"
						:key="signal.key"
						class="vision-agent-signal-badge"
					>
						{{ signal.label }}
					</text>
				</view>
			</view>
			<xicheng-vision-agent-world-interface-strip
				:summary="worldInterfaceSummary"
				:signal-badges="worldInterfaceSignalBadges"
				:reason-cards="agentDecisionReasonCardItems"
			/>
			<view v-if="prioritizedSceneUnderstandingCards.length > 0" class="scene-understanding-panel">
				<text class="scene-understanding-title">看见什么，就能问什么</text>
				<view class="scene-understanding-grid">
					<view
						v-for="card in prioritizedSceneUnderstandingCards"
						:key="card.domainKey"
						class="scene-understanding-card"
						:class="{ 'scene-understanding-card-active': card.score > 0 }"
						@click="$emit('open-scene-understanding-card', card)"
					>
						<text class="scene-understanding-label">{{ card.domainLabel }}</text>
						<text class="scene-understanding-card-title">{{ card.title }}</text>
						<text class="scene-understanding-card-copy">{{ card.copy }}</text>
					</view>
				</view>
			</view>
			<view class="vision-agent-action-grid">
				<view
					v-for="action in prioritizedVisionAgentActionCards"
					:key="action.actionKey"
					class="vision-agent-action"
					:class="{ 'vision-agent-action-disabled': recognitionActionBlocked && action.requiresRecognition }"
					@click="$emit('open-vision-agent-action', action)"
				>
					<text class="vision-agent-action-title">{{ action.title }}</text>
					<text class="vision-agent-action-copy">{{ action.copy }}</text>
				</view>
			</view>
			<view class="scene-service-grid">
				<view
					v-for="action in prioritizedSceneServiceActions"
					:key="action.actionKey"
					class="scene-service-action"
					@click="$emit('open-scene-service-action', action)"
				>
					<text class="scene-service-title">{{ action.title }}</text>
					<text class="scene-service-copy">{{ action.copy }}</text>
				</view>
			</view>
			<view v-if="activeServiceHandoffTask" class="vision-agent-service-handoff xicheng-paper-card">
				<view class="service-handoff-head">
					<view class="service-handoff-head-copy">
						<text class="service-handoff-kicker">AI识境服务承接</text>
						<text class="service-handoff-title">{{ activeServiceHandoffTask.handoffTitle }}</text>
					</view>
					<view class="service-handoff-close" @click="$emit('close-service-handoff-panel')">
						<xicheng-icon name="close" variant="plain" :size="18" />
					</view>
				</view>
				<view class="service-handoff-meta">
					<text class="service-handoff-meta-label">服务意图</text>
					<text class="service-handoff-meta-value">{{ activeServiceHandoffTask.serviceIntentText }}</text>
				</view>
				<text class="service-handoff-summary">{{ activeServiceHandoffTask.handoffSummary }}</text>
				<view class="service-handoff-step-list">
					<view
						v-for="step in activeServiceHandoffSteps"
						:key="step.label"
						class="service-handoff-step"
					>
						<text class="service-handoff-step-label">{{ step.label }}</text>
						<text class="service-handoff-step-copy">{{ step.copy }}</text>
					</view>
				</view>
				<view class="service-handoff-primary" @click="$emit('open-service-handoff-primary-action')">
					<text>{{ serviceHandoffPrimaryAction }}</text>
					<view class="service-handoff-primary-arrow">
						<xicheng-icon name="next" variant="primary" :size="15" />
					</view>
				</view>
			</view>
		</view>

		<view v-if="cityKnowledgeGraphNodes.length > 0" class="vision-agent-knowledge-panel xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<text class="section-title">城市知识图谱</text>
				<text class="section-badge">Knowledge Graph</text>
			</view>
			<text class="knowledge-graph-summary">从当前镜头出发，把地标、路线、人物/主题和城市服务串成可继续追问的节点。</text>
			<view class="knowledge-graph-node-grid">
				<view
					v-for="node in cityKnowledgeGraphNodes"
					:key="node.key"
					class="knowledge-graph-node"
					:class="`knowledge-graph-node-${node.type}`"
					@click="$emit('open-knowledge-graph-node', node)"
				>
					<text class="knowledge-graph-node-label">{{ knowledgeGraphNodeTypeLabel(node.type) }}</text>
					<text class="knowledge-graph-node-title">{{ node.title }}</text>
					<text class="knowledge-graph-node-copy">{{ node.copy }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import XichengVisionAgentWorldInterfaceStrip from '@/components/xicheng/vision-agent-world-interface-strip.vue'

export default {
	name: 'XichengScanResultVisionAgentPanel',
	components: {
		XichengVisionAgentWorldInterfaceStrip
	},
	props: {
		visionAgentDecisionSummary: { type: String, default: '' },
		cameraAgentDecisionTitle: { type: String, default: '' },
		sceneFusionSignalBadges: { type: Array, default: () => [] },
		worldInterfaceSummary: { type: String, default: '' },
		worldInterfaceSignalBadges: { type: Array, default: () => [] },
		agentDecisionReasonCardItems: { type: Array, default: () => [] },
		prioritizedSceneUnderstandingCards: { type: Array, default: () => [] },
		prioritizedVisionAgentActionCards: { type: Array, default: () => [] },
		recognitionActionBlocked: { type: Boolean, default: false },
		prioritizedSceneServiceActions: { type: Array, default: () => [] },
		activeServiceHandoffTask: { type: Object, default: null },
		activeServiceHandoffSteps: { type: Array, default: () => [] },
		serviceHandoffPrimaryAction: { type: String, default: '' },
		cityKnowledgeGraphNodes: { type: Array, default: () => [] },
		knowledgeGraphNodeTypeLabel: { type: Function, default: () => '' }
	},
	emits: [
		'open-scene-understanding-card',
		'open-vision-agent-action',
		'open-scene-service-action',
		'close-service-handoff-panel',
		'open-service-handoff-primary-action',
		'open-knowledge-graph-node'
	]
}
</script>

<style scoped>
.scan-result-vision-agent-stack,
.section-title,
.section-badge,
.vision-agent-decision-kicker,
.vision-agent-decision-summary,
.vision-agent-decision-preview,
.scene-understanding-title,
.scene-understanding-label,
.scene-understanding-card-title,
.scene-understanding-card-copy,
.knowledge-graph-summary,
.knowledge-graph-node-label,
.knowledge-graph-node-title,
.knowledge-graph-node-copy,
.vision-agent-action-title,
.vision-agent-action-copy,
.scene-service-title,
.scene-service-copy,
.service-handoff-kicker,
.service-handoff-title,
.service-handoff-summary,
.service-handoff-meta-label,
.service-handoff-meta-value,
.service-handoff-step-label,
.service-handoff-step-copy {
	display: block;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.section-title {
	font-size: 30rpx;
	font-weight: 800;
	line-height: 1.3;
	color: #102F29;
}

.section-badge {
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(31, 110, 90, 0.10);
	font-size: 21rpx;
	font-weight: 800;
	color: #1F6E5A;
	white-space: nowrap;
}

.vision-agent-panel,
.vision-agent-knowledge-panel {
	margin-top: 28rpx;
	padding: 26rpx;
	border-radius: 30rpx;
	background: rgba(255, 253, 248, 0.94);
}

.vision-agent-decision-strip {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 20rpx;
	margin-top: 22rpx;
	padding: 20rpx;
	border-radius: 24rpx;
	background: rgba(31, 110, 90, 0.10);
	border: 1rpx solid rgba(31, 110, 90, 0.16);
	box-sizing: border-box;
}

.vision-agent-decision-copy {
	flex: 1;
	min-width: 0;
}

.vision-agent-decision-kicker {
	font-size: 22rpx;
	font-weight: 800;
	line-height: 1.45;
	color: #1F6E5A;
}

.vision-agent-decision-summary {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.45;
	color: rgba(16, 47, 41, 0.76);
}

.vision-agent-decision-preview {
	margin-top: 8rpx;
	font-size: 22rpx;
	font-weight: 800;
	line-height: 1.45;
	color: rgba(31, 110, 90, 0.86);
}

.vision-agent-signal-badges {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 10rpx;
	width: 210rpx;
	flex-shrink: 0;
}

.vision-agent-signal-badge {
	max-width: 100%;
	padding: 7rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(255, 253, 248, 0.86);
	font-size: 20rpx;
	line-height: 1.3;
	font-weight: 700;
	color: #173F35;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.scene-understanding-panel {
	margin-top: 22rpx;
	padding: 20rpx;
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.72);
	border: 1rpx solid rgba(181, 148, 94, 0.18);
}

.scene-understanding-title {
	font-size: 24rpx;
	font-weight: 800;
	color: #102F29;
}

.scene-understanding-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 16rpx;
}

.scene-understanding-card,
.knowledge-graph-node,
.vision-agent-action,
.scene-service-action,
.service-handoff-step {
	min-width: 0;
	box-sizing: border-box;
}

.scene-understanding-card {
	min-height: 156rpx;
	padding: 16rpx;
	border-radius: 20rpx;
	background: rgba(23, 63, 53, 0.06);
	border: 1rpx solid rgba(31, 110, 90, 0.10);
}

.scene-understanding-card-active {
	background: rgba(31, 110, 90, 0.11);
	border-color: rgba(31, 110, 90, 0.24);
}

.scene-understanding-label {
	font-size: 20rpx;
	font-weight: 800;
	line-height: 1.35;
	color: #B8812B;
}

.scene-understanding-card-title,
.knowledge-graph-node-title {
	margin-top: 7rpx;
	font-size: 23rpx;
	font-weight: 800;
	line-height: 1.35;
	color: #173F35;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.scene-understanding-card-copy {
	margin-top: 7rpx;
	font-size: 20rpx;
	line-height: 1.35;
	color: rgba(16, 47, 41, 0.62);
}

.knowledge-graph-summary {
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.45;
	color: rgba(16, 47, 41, 0.72);
}

.knowledge-graph-node-grid,
.vision-agent-action-grid,
.scene-service-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 20rpx;
}

.knowledge-graph-node {
	min-height: 164rpx;
	padding: 18rpx;
	border-radius: 22rpx;
	border: 1rpx solid rgba(31, 110, 90, 0.12);
	background: rgba(246, 250, 246, 0.80);
}

.knowledge-graph-node-route {
	background: rgba(31, 110, 90, 0.10);
}

.knowledge-graph-node-service {
	background: rgba(181, 148, 94, 0.12);
}

.knowledge-graph-node-label {
	font-size: 21rpx;
	font-weight: 800;
	line-height: 1.4;
	color: #1F6E5A;
}

.knowledge-graph-node-title {
	margin-top: 8rpx;
	font-size: 27rpx;
	line-height: 1.4;
}

.knowledge-graph-node-copy {
	margin-top: 8rpx;
	font-size: 22rpx;
	line-height: 1.4;
	color: rgba(16, 47, 41, 0.66);
}

.vision-agent-action,
.scene-service-action {
	padding: 18rpx;
	border-radius: 22rpx;
	background: rgba(23, 63, 53, 0.07);
	border: 1rpx solid rgba(181, 148, 94, 0.18);
}

.vision-agent-action-disabled {
	opacity: 0.54;
}

.vision-agent-action-title,
.scene-service-title {
	font-size: 24rpx;
	font-weight: 800;
	line-height: 1.3;
	color: #102F29;
}

.vision-agent-action-copy,
.scene-service-copy {
	margin-top: 8rpx;
	font-size: 21rpx;
	line-height: 1.45;
	color: rgba(16, 47, 41, 0.62);
}

.vision-agent-service-handoff {
	margin-top: 22rpx;
	padding: 22rpx;
	border-radius: 24rpx;
	background: rgba(255, 253, 248, 0.94);
	border: 1rpx solid rgba(31, 110, 90, 0.18);
}

.service-handoff-head,
.service-handoff-meta,
.service-handoff-primary {
	display: flex;
	align-items: center;
}

.service-handoff-head {
	align-items: flex-start;
	justify-content: space-between;
	gap: 18rpx;
}

.service-handoff-head-copy {
	flex: 1;
	min-width: 0;
}

.service-handoff-kicker {
	font-size: 21rpx;
	font-weight: 800;
	line-height: 1.42;
	color: #1F6E5A;
}

.service-handoff-title {
	margin-top: 6rpx;
	font-size: 28rpx;
	font-weight: 800;
	line-height: 1.42;
	color: #102F29;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.service-handoff-close {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	flex-shrink: 0;
	background: rgba(23, 63, 53, 0.08);
}

.service-handoff-meta {
	gap: 12rpx;
	margin-top: 16rpx;
}

.service-handoff-meta-label {
	padding: 6rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(31, 110, 90, 0.12);
	font-size: 20rpx;
	font-weight: 800;
	line-height: 1.42;
	color: #1F6E5A;
}

.service-handoff-meta-value {
	min-width: 0;
	font-size: 22rpx;
	font-weight: 800;
	line-height: 1.42;
	color: #B8812B;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.service-handoff-summary {
	margin-top: 14rpx;
	font-size: 22rpx;
	line-height: 1.42;
	color: rgba(16, 47, 41, 0.66);
}

.service-handoff-step-list {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 18rpx;
}

.service-handoff-step {
	min-height: 132rpx;
	padding: 16rpx;
	border-radius: 20rpx;
	background: rgba(31, 110, 90, 0.08);
	border: 1rpx solid rgba(31, 110, 90, 0.12);
}

.service-handoff-step-label {
	font-size: 22rpx;
	font-weight: 800;
	line-height: 1.42;
	color: #173F35;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.service-handoff-step-copy {
	margin-top: 8rpx;
	font-size: 20rpx;
	line-height: 1.42;
	color: rgba(16, 47, 41, 0.62);
}

.service-handoff-primary {
	justify-content: center;
	gap: 10rpx;
	min-height: 70rpx;
	margin-top: 18rpx;
	border-radius: 999rpx;
	background: #1F6E5A;
	font-size: 24rpx;
	font-weight: 800;
	color: #FFFFFF;
}

.service-handoff-primary-arrow {
	font-size: 26rpx;
	font-weight: 800;
	line-height: 1;
}
</style>
