<template>
	<view class="custom-nav" :style="navBarStyle">
		<view class="nav-inner" :style="navInnerStyle">
			<!-- 左侧图标区域 -->
			<view class="nav-left" v-if="showBack || leftIcon" @click="handleLeftClick">
				<image v-if="leftIcon" :src="leftIcon" class="nav-icon" :style="{width: leftIconSize, height: leftIconSize}" mode="aspectFit"></image>
				<text v-else-if="showBack" class="back-icon">←</text>
			</view>

			<!-- 中间标题区域 -->
			<view class="nav-center">
				<image v-if="centerIcon" :src="centerIcon" class="center-icon" mode="aspectFit"></image>
				<text class="nav-title">{{ title }}</text>
			</view>

			<!-- 右侧图标区域（始终存在以保持居中） -->
			<view class="nav-right">
				<template v-if="rightIcon || (rightIcons && rightIcons.length > 0)">
					<!-- 单个右侧图标 -->
					<image v-if="rightIcon && (!rightIcons || rightIcons.length === 0)"
						:src="rightIcon"
						class="nav-icon"
						mode="aspectFit"
						@click="handleRightClick">
					</image>

					<!-- 多个右侧图标 -->
					<template v-if="rightIcons && rightIcons.length > 0">
						<image
							v-for="(icon, index) in rightIcons"
							:key="index"
							:src="icon.src"
							class="nav-icon right-icon-item"
							mode="aspectFit"
							@click="handleRightIconClick(index, icon)">
						</image>
					</template>
				</template>
			</view>
		</view>
	</view>

</template>

<script>
export default {
	name: 'CustomNav',
	props: {
		// 标题文字
		title: {
			type: String,
			default: ''
		},
		// 中间图标（在标题旁边）
		centerIcon: {
			type: String,
			default: ''
		},
		// 左侧图标
		leftIcon: {
			type: String,
			default: ''
		},
		// 左侧图标大小
		leftIconSize: {
			type: String,
			default: '24px'
		},
		// 右侧图标
		rightIcon: {
			type: String,
			default: ''
		},
		// 右侧多个图标 [{src: '', class: ''}]
		rightIcons: {
			type: Array,
			default: () => []
		},
		// 是否显示返回按钮
		showBack: {
			type: Boolean,
			default: false
		},
		// 背景颜色
		backgroundColor: {
			type: String,
			default: '#F8F1E4'
		},
		// 背景图片
		backgroundImage: {
			type: String,
			default: ''
		},
		// 标题颜色
		titleColor: {
			type: String,
			default: '#000000'
		},
		// 是否固定在顶部
		fixed: {
			type: Boolean,
			default: true
		}
	},
	data() {
		return {
			statusBarHeight: 0,  // 状态栏高度
			menuButtonInfo: {},  // 胶囊按钮信息
			navHeight: 0  // 导航栏总高度
		}
	},
	computed: {
		// 导航栏样式
		navBarStyle() {
			const { statusBarHeight, menuButtonInfo, backgroundColor, backgroundImage, fixed } = this
			let style = ''

			if (menuButtonInfo.height) {
				// 导航栏高度 = 状态栏高度 + 胶囊按钮高度 + 上下间距
				const navBarHeight = statusBarHeight + menuButtonInfo.height + (menuButtonInfo.top - statusBarHeight) * 2
				style += `height: ${navBarHeight}px; padding-top: ${statusBarHeight}px;`
			} else {
				style += 'height: 64px; padding-top: 20px;'
			}

			// 背景样式
			if (backgroundImage) {
				style += `background-image: url('${backgroundImage}'); background-size: cover; background-position: center; background-repeat: no-repeat;`
			} else {
				style += `background-color: ${backgroundColor};`
			}

			// 是否固定定位
			if (fixed) {
				style += 'position: fixed; top: 0; left: 0; right: 0; z-index: 9998;'
			}

			return style
		},
		// 内部容器样式（对齐胶囊按钮）
		navInnerStyle() {
			const { statusBarHeight, menuButtonInfo, titleColor } = this
			let style = ''

			if (menuButtonInfo.height) {
				// 让内容区域垂直居中对齐到胶囊按钮
				const height = menuButtonInfo.height
				style += `height: ${height}px;`
			} else {
				style += 'height: 32px;'
			}

			style += `color: ${titleColor};`

			return style
		}
	},
	mounted() {
		this.initNavBar()
	},
	methods: {
		initNavBar() {
			// #ifdef MP-WEIXIN
			// 获取系统信息
			const systemInfo = uni.getSystemInfoSync()
			this.statusBarHeight = systemInfo.statusBarHeight || 0

			// 获取胶囊按钮信息
			const menuButton = uni.getMenuButtonBoundingClientRect()
			this.menuButtonInfo = menuButton

			// 计算导航栏高度
			this.navHeight = this.statusBarHeight + menuButton.height + (menuButton.top - this.statusBarHeight) * 2
			// #endif

			// #ifndef MP-WEIXIN
			// 非小程序端设置默认值
			this.statusBarHeight = 20
			this.menuButtonInfo = {
				width: 87,
				height: 32,
				top: 24,
				right: 15,
				bottom: 56,
				left: 278
			}
			this.navHeight = 64
			// #endif

			// 将导航栏高度传递给父组件
			this.$emit('navHeight', this.navHeight)
		},
		// 左侧按钮点击
		handleLeftClick() {
			if (this.showBack) {
				uni.navigateBack()
			}
		this.$emit('leftClick')
	},
	// 右侧单个按钮点击
	handleRightClick() {
		this.$emit('rightClick')
	},
	// 右侧多个图标点击
	handleRightIconClick(index, icon) {
		this.$emit('rightIconClick', { index, icon })
	}
}
}
</script>

<style scoped>
.custom-nav {
	width: 100%;
	box-sizing: border-box;
	overflow: hidden;
	box-shadow: 0 8rpx 26rpx rgba(35, 44, 36, 0.06);
	backdrop-filter: blur(10px);
}

.nav-inner {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 15px;
	position: relative;
	box-sizing: border-box;
}

.nav-left,
.nav-right {
	width: 60px;
	display: flex;
	align-items: center;
}

.nav-left {
	justify-content: flex-start;
}

.nav-right {
	justify-content: flex-end;
	display: flex;
	align-items: center;
	gap: 16px;
}

.nav-icon {
	width: 24px;
	height: 24px;
	filter: drop-shadow(0 2rpx 3rpx rgba(31, 38, 35, 0.12));
}

.right-icon-item {
	width: 20px;
	height: 20px;
}

.back-icon {
	font-size: 24px;
	font-weight: bold;
	color: #244C41;
}

.nav-center {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	pointer-events: none;
}

.center-icon {
	width: 28px;
	height: 28px;
}

.nav-title {
	font-size: 17px;
	font-weight: 700;
	text-align: center;
	color: #183B34;
	letter-spacing: 0;
}
</style>
