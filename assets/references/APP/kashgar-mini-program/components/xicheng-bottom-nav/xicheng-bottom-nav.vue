<template>
	<view class="xicheng-bottom-nav-shell">
		<view class="xicheng-bottom-nav">
			<view
				v-for="item in items"
				:key="item.key"
				class="xicheng-bottom-nav-item"
				:class="{
					'xicheng-bottom-nav-item-active': isActive(item.key),
					'xicheng-bottom-nav-item-disabled': item.disabled
				}"
				hover-class="xicheng-bottom-nav-item-pressed"
				hover-stay-time="80"
				@click="handleTap(item)"
			>
				<xicheng-icon
					class="xicheng-bottom-nav-icon"
					:name="item.icon"
					variant="tab"
					:active="isActive(item.key)"
					:disabled="item.disabled"
					:size="26"
				/>
				<text class="xicheng-bottom-nav-text">{{ item.title }}</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengBottomNav',
	emits: ['navigate'],
	props: {
		items: {
			type: Array,
			default: () => []
		},
		activeKey: {
			type: String,
			default: 'explore'
		}
	},
	methods: {
		isActive(key = '') {
			return key === this.activeKey
		},
		handleTap(item = {}) {
			if (!item || item.disabled) return
			this.$emit('navigate', item.key)
		}
	}
}
</script>

<style scoped>
.xicheng-bottom-nav-shell {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 60;
	padding: 10rpx 30rpx calc(12rpx + env(safe-area-inset-bottom));
	background: linear-gradient(180deg, rgba(255, 253, 248, 0.88), rgba(255, 253, 248, 0.98));
	border-top: 1rpx solid rgba(181, 148, 94, 0.18);
	box-shadow: 0 -12rpx 30rpx rgba(16, 47, 41, 0.08);
	backdrop-filter: blur(18rpx);
	box-sizing: border-box;
}

.xicheng-bottom-nav {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	align-items: center;
	min-height: 116rpx;
}

.xicheng-bottom-nav-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6rpx;
	min-width: 0;
	min-height: 96rpx;
	color: #746F68;
	transition: opacity 180ms ease, transform 180ms ease, color 180ms ease;
}

.xicheng-bottom-nav-item-active {
	color: #173F35;
}

.xicheng-bottom-nav-item-pressed {
	opacity: 0.72;
	transform: translateY(2rpx);
}

.xicheng-bottom-nav-item-disabled {
	opacity: 0.48;
}

.xicheng-bottom-nav-icon {
	margin-bottom: 2rpx;
}

.xicheng-bottom-nav-text {
	font-size: 24rpx;
	line-height: 1.2;
	font-weight: 700;
	white-space: nowrap;
	letter-spacing: 0;
}
</style>
