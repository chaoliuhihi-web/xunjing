<template>
	<view class="xicheng-travelogue-template-settings xicheng-paper-card">
		<view class="settings-head">
			<view>
				<text class="settings-kicker">模板细节定制</text>
				<text class="settings-title">{{ templateTitle }}</text>
			</view>
			<text class="settings-badge">来源与隐私已检查</text>
		</view>
		<view class="settings-grid">
			<view v-for="item in settingItems" :key="item.key" class="settings-item" @click="$emit('change', item)">
				<text class="settings-item-label">{{ item.label }}</text>
				<text class="settings-item-value">{{ item.value }}</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengTravelogueTemplateSettings',
	props: {
		templateTitle: {
			type: String,
			default: '城市漫步杂志'
		},
		settings: {
			type: Object,
			default: () => ({})
		}
	},
	emits: ['change'],
	computed: {
		settingItems() {
			const settings = this.settings && typeof this.settings === 'object' ? this.settings : {}
			return [
				{ key: 'cover', label: '封面', value: settings.cover || '使用白塔寺主图' },
				{ key: 'layout', label: '排版风格', value: settings.layout || '杂志大图 + 长文' },
				{ key: 'focus', label: '内容重点', value: settings.focus || '路线故事线' },
				{ key: 'crop', label: '图片裁切', value: settings.crop || '自动适配封面' },
				{ key: 'tone', label: '文字润色', value: settings.tone || '像人写的自然语气' },
				{ key: 'privacy', label: '来源与隐私', value: settings.privacy || '只用已审核来源' }
			]
		}
	}
}
</script>

<style scoped>
.xicheng-travelogue-template-settings {
	margin-top: 24rpx;
	padding: 28rpx;
	border-radius: 34rpx;
}
.settings-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 18rpx;
}
.settings-kicker,
.settings-title,
.settings-badge,
.settings-item-label,
.settings-item-value {
	display: block;
}
.settings-kicker {
	color: #B5945E;
	font-size: 23rpx;
	font-weight: 900;
}
.settings-title {
	margin-top: 8rpx;
	color: #102F29;
	font-size: 32rpx;
	line-height: 1.25;
	font-weight: 900;
}
.settings-badge {
	padding: 10rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(31, 110, 90, 0.1);
	color: #1F6E5A;
	font-size: 21rpx;
	font-weight: 900;
	white-space: nowrap;
}
.settings-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 22rpx;
}
.settings-item {
	min-height: 112rpx;
	padding: 18rpx;
	border-radius: 24rpx;
	background: rgba(255, 248, 234, 0.72);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
	box-sizing: border-box;
}
.settings-item-label {
	color: #8C6B36;
	font-size: 22rpx;
	font-weight: 800;
}
.settings-item-value {
	margin-top: 10rpx;
	color: #102F29;
	font-size: 24rpx;
	line-height: 1.35;
	font-weight: 800;
}
</style>
