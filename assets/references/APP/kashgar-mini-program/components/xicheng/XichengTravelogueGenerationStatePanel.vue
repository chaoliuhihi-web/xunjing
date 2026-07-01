<template>
	<view class="travelogue-state-panel xicheng-paper-card" :class="`travelogue-state-${normalizedStatus}`">
		<view class="state-head">
			<view>
				<text class="state-kicker">{{ stateKicker }}</text>
				<text class="state-title">{{ stateTitle }}</text>
			</view>
			<text class="state-badge">{{ stateBadge }}</text>
		</view>
		<text class="state-copy">{{ stateCopy }}</text>
		<view v-if="normalizedStatus === 'failed'" class="failure-reason">
			<text class="failure-label">失败原因</text>
			<text class="failure-copy">{{ safeFailureReason }}</text>
		</view>
		<view class="hint-list">
			<view v-for="hint in normalizedHints" :key="hint.key" class="hint-row">
				<text class="hint-index">{{ hint.index }}</text>
				<view>
					<text class="hint-title">{{ hint.title }}</text>
					<text class="hint-copy">{{ hint.copy }}</text>
				</view>
			</view>
		</view>
		<view class="state-actions">
			<button v-if="normalizedStatus === 'insufficient'" class="state-button state-button-primary" @click="$emit('explore')">继续探索</button>
			<button v-if="normalizedStatus === 'insufficient'" class="state-button" @click="$emit('add-photo')">补充照片</button>
			<button v-if="normalizedStatus === 'failed'" class="state-button state-button-primary" @click="$emit('retry')">重新生成</button>
			<button v-if="normalizedStatus === 'failed'" class="state-button" @click="$emit('manual-edit')">手动编辑</button>
		</view>
	</view>
</template>

<script>
const DEFAULT_HINTS = Object.freeze([
	{ key: 'poi', title: '识别一个西城地点', copy: '先从扫一扫、拍照或文字线索确认官方 POI。' },
	{ key: 'route', title: '开始一段路线记录', copy: '记录路线、停留点和打卡后，长文会更完整。' },
	{ key: 'photo', title: '补充照片或现场备注', copy: '图片和一句真实感受会进入游记素材盒。' }
])

export default {
	name: 'XichengTravelogueGenerationStatePanel',
	props: {
		status: {
			type: String,
			default: 'insufficient'
		},
		materialHints: {
			type: Array,
			default: () => []
		},
		failureReason: {
			type: String,
			default: ''
		}
	},
	emits: ['explore', 'add-photo', 'retry', 'manual-edit'],
	computed: {
		normalizedStatus() {
			return this.status === 'failed' ? 'failed' : 'insufficient'
		},
		normalizedHints() {
			const hints = Array.isArray(this.materialHints) && this.materialHints.length > 0 ? this.materialHints : DEFAULT_HINTS
			return hints.slice(0, 4).map((hint, index) => ({
				key: hint.key || `hint-${index}`,
				index: index + 1,
				title: hint.title || '补充真实素材',
				copy: hint.copy || '继续收集地点、照片、路线或备注后再生成。'
			}))
		},
		safeFailureReason() {
			return this.failureReason || '网络或生成服务暂时不可用，素材已保存，可以稍后重新生成。'
		},
		stateKicker() {
			return this.normalizedStatus === 'failed' ? '生成失败' : '素材不足'
		},
		stateTitle() {
			return this.normalizedStatus === 'failed' ? '素材已保存，可以重新生成' : '素材不足，不能生成草稿'
		},
		stateBadge() {
			return this.normalizedStatus === 'failed' ? '可重试' : '待补充'
		},
		stateCopy() {
			return this.normalizedStatus === 'failed'
				? '这次没有生成成功，但照片、路线、备注和来源不会丢失。可以重新生成，也可以先进入手动编辑。'
				: '请先积累真实地点、路线、照片或现场备注。没有可审核素材时，不会生成看起来像人写的空游记。'
		}
	}
}
</script>

<style scoped>
.travelogue-state-panel {
	margin-top: 24rpx;
	padding: 28rpx;
	border-radius: 34rpx;
	border: 2rpx solid rgba(181, 148, 94, 0.18);
	background: linear-gradient(135deg, rgba(255, 252, 246, 0.96), rgba(250, 240, 219, 0.88));
}
.state-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 18rpx;
}
.state-kicker,
.state-title,
.state-badge,
.state-copy,
.failure-label,
.failure-copy,
.hint-title,
.hint-copy {
	display: block;
}
.state-kicker {
	color: #B5945E;
	font-size: 23rpx;
	font-weight: 900;
}
.state-title {
	margin-top: 8rpx;
	color: #102F29;
	font-size: 34rpx;
	line-height: 1.25;
	font-weight: 900;
}
.state-badge {
	padding: 10rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(31, 110, 90, 0.1);
	color: #1F6E5A;
	font-size: 21rpx;
	font-weight: 900;
	white-space: nowrap;
}
.state-copy,
.failure-copy,
.hint-copy {
	color: #746F68;
	font-size: 24rpx;
	line-height: 1.55;
}
.state-copy {
	margin-top: 18rpx;
}
.failure-reason {
	margin-top: 18rpx;
	padding: 18rpx;
	border-radius: 24rpx;
	background: rgba(180, 91, 74, 0.1);
}
.failure-label {
	margin-bottom: 8rpx;
	color: #9D4B3E;
	font-size: 22rpx;
	font-weight: 900;
}
.hint-list {
	display: grid;
	gap: 14rpx;
	margin-top: 22rpx;
}
.hint-row {
	display: flex;
	gap: 16rpx;
	padding: 18rpx;
	border-radius: 24rpx;
	background: rgba(255, 248, 234, 0.74);
}
.hint-index {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 42rpx;
	height: 42rpx;
	border-radius: 50%;
	background: #173F35;
	color: #FFF8EA;
	font-size: 22rpx;
	font-weight: 900;
	flex: 0 0 auto;
}
.hint-title {
	color: #102F29;
	font-size: 25rpx;
	font-weight: 900;
}
.state-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 22rpx;
}
.state-button {
	min-height: 76rpx;
	margin: 0;
	border-radius: 999rpx;
	background: rgba(255, 248, 234, 0.9);
	color: #173F35;
	font-size: 25rpx;
	line-height: 76rpx;
	font-weight: 900;
}
.state-button-primary {
	background: #173F35;
	color: #FFF8EA;
}
.state-button::after {
	border: 0;
}
</style>
