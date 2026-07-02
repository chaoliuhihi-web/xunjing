<template>
	<view class="xicheng-publish-channel-grid xicheng-paper-card">
		<view class="channel-head">
			<text class="channel-title">选择发布渠道</text>
			<text class="channel-note">生成素材后唤起用户确认</text>
		</view>
		<view class="channel-action-panel">
			<view class="channel-action-summary">
				<view>
					<text class="channel-action-kicker">可同时选择多个渠道发布</text>
					<text class="channel-action-title">已选 {{ selectedCount }} 个渠道</text>
				</view>
				<text class="channel-action-badge">发布前确认</text>
			</view>
			<text class="channel-action-note">第三方平台将按系统分享能力唤起确认；PDF 可从下方预览和打印。</text>
		</view>
		<view class="channel-grid">
			<view
				v-for="card in channelCards"
				:key="card.key"
				class="channel-card"
				:class="{
					'channel-card-active': card.type !== 'action' && isChannelActive(card.key),
					'channel-action-primary': card.primary
				}"
				@click="handleCardTap(card)"
			>
				<text v-if="card.type !== 'action' && isChannelActive(card.key)" class="channel-card-check">✓</text>
				<xicheng-icon :name="card.icon" variant="soft" :size="21" />
				<text class="channel-name">{{ card.title }}</text>
				<text class="channel-desc">{{ card.desc }}</text>
				<text v-if="card.visibility" class="channel-visibility">{{ card.visibility }}</text>
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
		},
		selectedKeys: {
			type: Array,
			default: () => []
		},
		selectedCount: {
			type: Number,
			default: 0
		}
	},
	emits: ['select', 'toggle'],
	computed: {
		normalizedSelectedKeys() {
			if (Array.isArray(this.selectedKeys) && this.selectedKeys.length > 0) return this.selectedKeys
			return [this.selectedKey]
		},
		channels() {
			return [
				{ key: 'xinghe', icon: 'travelogue', title: '星河寻境公开游记', desc: '审核后公开到城市游记', visibility: '公开可见' },
				{ key: 'moments', icon: 'photo', title: '朋友圈', desc: '生成图片和文案后确认发布', visibility: '好友可见' },
				{ key: 'xiaohongshu', icon: 'edit', title: '小红书', desc: '生成标题、图集和标签', visibility: '公开可见' },
				{ key: 'pdf', icon: 'source', title: 'PDF 打印', desc: '保存 PDF 或系统打印', visibility: '仅自己保存' }
			]
		},
		channelActions() {
			return [
				{ key: 'save', type: 'action', icon: 'settings', title: '保存设置', desc: '保留渠道和隐私范围', primary: false },
				{ key: 'publish', type: 'action', icon: 'route', title: '一键发布', desc: '生成所选渠道素材', primary: true }
			]
		},
		channelCards() {
			return [...this.channelActions, ...this.channels]
		}
	},
	methods: {
		isChannelActive(channelKey) {
			return this.normalizedSelectedKeys.includes(channelKey)
		},
		handleCardTap(card = {}) {
			if (card.type === 'action') {
				this.$emit('select', card.key)
				return
			}
			this.$emit('toggle', card)
			this.$emit('select', card)
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
.channel-card .channel-name,
.channel-card .channel-desc,
.channel-card .channel-visibility,
.channel-card .channel-card-check {
	pointer-events: none;
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
.channel-visibility {
	display: inline-flex;
	margin-top: 14rpx;
	padding: 7rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.82);
	color: #7A633D;
	font-size: 20rpx;
	font-weight: 800;
}
.channel-action-panel {
	margin-top: 22rpx;
	padding-top: 22rpx;
	border-top: 1rpx solid rgba(181, 148, 94, 0.16);
}
.channel-action-summary,
.channel-action-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}
.channel-action-kicker,
.channel-action-title,
.channel-action-badge,
.channel-action-note {
	display: block;
}
.channel-action-kicker {
	color: #B5945E;
	font-size: 22rpx;
	font-weight: 900;
}
.channel-action-title {
	margin-top: 8rpx;
	color: #102F29;
	font-size: 32rpx;
	font-weight: 900;
	line-height: 1.25;
}
.channel-action-badge {
	flex: 0 0 auto;
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(31, 110, 90, 0.10);
	color: #1F6E5A;
	font-size: 21rpx;
	font-weight: 900;
}
.channel-action-note {
	margin-top: 16rpx;
	color: #8C8278;
	font-size: 21rpx;
	line-height: 1.45;
}
.channel-action-primary {
	background: linear-gradient(135deg, #1E6E59 0%, #0E3C33 100%);
	border-color: transparent;
	box-shadow: 0 14rpx 28rpx rgba(14, 60, 51, 0.16);
}
.channel-action-primary .channel-name,
.channel-action-primary .channel-desc {
	color: #FFFDF8;
}
</style>
