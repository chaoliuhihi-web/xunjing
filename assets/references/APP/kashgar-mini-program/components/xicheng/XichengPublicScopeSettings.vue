<template>
	<view class="public-scope-card xicheng-paper-card">
		<view class="public-scope-head">
			<view>
				<text class="public-scope-kicker">隐私授权</text>
				<text class="public-scope-title">公开范围设置</text>
			</view>
			<text class="public-scope-badge">发布前可逐项确认</text>
		</view>
		<text class="public-scope-copy">精确轨迹默认隐藏；正文、地点、照片和问答记录可分别设置公开范围。</text>
		<view class="public-scope-list">
			<view v-for="item in items" :key="item.key" class="public-scope-row" @click="$emit('toggle', item.key)">
				<xicheng-icon :name="item.icon" variant="plain" :size="22" />
				<view class="scope-row-copy">
					<text class="scope-row-title">{{ item.title }}</text>
					<text class="scope-row-desc">{{ item.desc }}</text>
				</view>
				<view class="scope-switch" :class="{ 'scope-switch-on': item.enabled }">
					<view class="scope-switch-thumb"></view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengPublicScopeSettings',
	props: {
		items: {
			type: Array,
			default: () => []
		}
	},
	emits: ['toggle']
}
</script>

<style scoped>
.public-scope-card {
	margin-top: 16rpx;
	padding: 24rpx;
	border-radius: 28rpx;
	box-sizing: border-box;
}
.public-scope-head,
.public-scope-row,
.scope-switch {
	display: flex;
	align-items: center;
}
.public-scope-head {
	justify-content: space-between;
	gap: 18rpx;
}
.public-scope-kicker,
.public-scope-title,
.public-scope-copy,
.scope-row-title,
.scope-row-desc {
	display: block;
}
.public-scope-kicker {
	color: #B5945E;
	font-size: 22rpx;
	font-weight: 800;
}
.public-scope-title {
	margin-top: 4rpx;
	color: #102F29;
	font-size: 32rpx;
	font-weight: 900;
}
.public-scope-badge {
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.08);
	color: #173F35;
	font-size: 20rpx;
	font-weight: 900;
	white-space: nowrap;
}
.public-scope-copy {
	margin-top: 12rpx;
	color: rgba(16, 47, 41, 0.62);
	font-size: 23rpx;
	line-height: 1.5;
}
.public-scope-list {
	margin-top: 16rpx;
	border-top: 1rpx solid rgba(181, 148, 94, 0.14);
}
.public-scope-row {
	gap: 14rpx;
	min-height: 92rpx;
	padding: 16rpx 0;
	border-bottom: 1rpx solid rgba(181, 148, 94, 0.12);
}
.scope-row-copy {
	flex: 1;
	min-width: 0;
}
.scope-row-title {
	color: #102F29;
	font-size: 25rpx;
	font-weight: 900;
}
.scope-row-desc {
	margin-top: 5rpx;
	color: rgba(16, 47, 41, 0.58);
	font-size: 21rpx;
	line-height: 1.35;
}
.scope-switch {
	justify-content: flex-start;
	width: 74rpx;
	height: 42rpx;
	padding: 4rpx;
	border-radius: 999rpx;
	background: rgba(16, 47, 41, 0.12);
	box-sizing: border-box;
}
.scope-switch-on {
	justify-content: flex-end;
	background: #173F35;
}
.scope-switch-thumb {
	width: 34rpx;
	height: 34rpx;
	border-radius: 999rpx;
	background: #FFF8EA;
	box-shadow: 0 4rpx 12rpx rgba(23, 63, 53, 0.18);
}
</style>
