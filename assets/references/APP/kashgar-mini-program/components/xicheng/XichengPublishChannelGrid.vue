<template>
	<view class="xicheng-publish-channel-grid xicheng-paper-card">
		<view class="channel-head">
			<text class="channel-title">选择发布渠道</text>
			<text class="channel-note">生成素材后唤起用户确认</text>
		</view>
		<view class="channel-grid">
			<view
				v-for="channel in channels"
				:key="channel.key"
				class="channel-card"
				:class="{ 'channel-card-active': channel.key === selectedKey }"
				@click="$emit('select', channel)"
			>
				<text v-if="channel.key === selectedKey" class="channel-card-check">✓</text>
				<xicheng-icon :name="channel.icon" variant="soft" :size="21" />
				<text class="channel-name">{{ channel.title }}</text>
				<text class="channel-desc">{{ channel.desc }}</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengPublishChannelGrid',
	props: {
		selectedKey: {
			type: String,
			default: 'xinghe'
		}
	},
	emits: ['select'],
	computed: {
		channels() {
			return [
				{ key: 'xinghe', icon: 'travelogue', title: '星河寻境公开游记', desc: '审核后公开到城市游记' },
				{ key: 'moments', icon: 'photo', title: '朋友圈', desc: '生成图片和文案后确认发布' },
				{ key: 'xiaohongshu', icon: 'edit', title: '小红书', desc: '生成标题、图集和标签' },
				{ key: 'pdf', icon: 'source', title: 'PDF 打印', desc: '保存 PDF 或系统打印' }
			]
		}
	}
}
</script>

<style scoped>
.xicheng-publish-channel-grid {
	margin-top: 24rpx;
	padding: 28rpx;
	border-radius: 34rpx;
}
.channel-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}
.channel-title,
.channel-note,
.channel-name,
.channel-desc {
	display: block;
}
.channel-title {
	color: #102F29;
	font-size: 32rpx;
	font-weight: 900;
}
.channel-note {
	color: #8C8278;
	font-size: 23rpx;
}
.channel-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 22rpx;
}
.channel-card {
	position: relative;
	min-height: 150rpx;
	padding: 20rpx;
	border-radius: 26rpx;
	background: rgba(255, 248, 234, 0.72);
	border: 2rpx solid rgba(181, 148, 94, 0.14);
	box-sizing: border-box;
}
.channel-card-check {
	position: absolute;
	right: 18rpx;
	top: 18rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 34rpx;
	height: 34rpx;
	border-radius: 999rpx;
	background: #1F6E5A;
	color: #FFFDF8;
	font-size: 22rpx;
	font-weight: 900;
	line-height: 1;
}
.channel-card-active {
	border-color: #1F6E5A;
	background: rgba(31, 110, 90, 0.08);
}
.channel-name {
	margin-top: 12rpx;
	color: #102F29;
	font-size: 25rpx;
	line-height: 1.3;
	font-weight: 900;
}
.channel-desc {
	margin-top: 8rpx;
	color: #746F68;
	font-size: 22rpx;
	line-height: 1.35;
}
</style>
