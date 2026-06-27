<template>
	<view class="xicheng-home">
		<view class="hero">
			<text class="eyebrow">{{ region.cityName }}</text>
			<text class="title">小京 AI旅伴</text>
			<text class="subtitle">拍照、OCR、定位识别后，直接进入讲解、路线和游记草稿。</text>
			<view class="hero-actions">
				<button class="primary-button" :disabled="recognizing" @click="startPhotoRecognition">拍照识别</button>
				<button class="ghost-button" :disabled="recognizing" @click="askXiaojing">问问小京</button>
			</view>
		</view>

		<view class="quick-grid">
			<view class="quick-card" @click="startScanRecognition">
				<text class="quick-title">扫一扫</text>
				<text class="quick-desc">识别二维码、展牌和门票</text>
			</view>
			<view class="quick-card" @click="startPhotoRecognition">
				<text class="quick-title">拍照识别</text>
				<text class="quick-desc">识别门头、文物和说明牌</text>
			</view>
			<view class="quick-card" @click="startOcrRecognition">
				<text class="quick-title">OCR识别</text>
				<text class="quick-desc">从图片文字提取地点线索</text>
			</view>
			<view class="quick-card" @click="askXiaojing">
				<text class="quick-title">问问小京</text>
				<text class="quick-desc">继续咨询路线和讲解</text>
			</view>
		</view>

		<view class="flow-strip">
			<text>小京讲解</text>
			<text>推荐路线</text>
			<text>开始记录</text>
			<text>生成游记草稿</text>
		</view>

		<view class="ops-section">
			<view class="ops-card">
				<text class="ops-title">{{ routePassport.title }}</text>
				<text class="ops-desc">{{ routePassport.thresholdText }}</text>
			</view>
			<view class="ops-card">
				<text class="ops-title">亲子研学任务</text>
				<text class="ops-desc">{{ parentChildTasks[0] }}</text>
			</view>
			<view class="ops-card">
				<text class="ops-title">分享海报</text>
				<text class="ops-desc">{{ sharePoster.subtitle }}</text>
			</view>
		</view>

		<view v-if="lastError" class="error-line">{{ lastError }}</view>
	</view>
</template>

<script>
import {
	XICHENG_REGION_CONFIG
} from '@/config/regions/xicheng.js'
import {
	requestCurrentLocationForTrigger,
	resolveXichengPhotoTrigger,
	resolveXichengTextTrigger
} from '@/request/xunjing/trigger.js'

export default {
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			routePassport: XICHENG_REGION_CONFIG.routePassport,
			parentChildTasks: XICHENG_REGION_CONFIG.parentChildTasks,
			sharePoster: XICHENG_REGION_CONFIG.sharePoster,
			currentLocation: null,
			recognizing: false,
			lastError: ''
		}
	},
	onLoad() {
		this.prepareLocation()
	},
	methods: {
		async prepareLocation() {
			this.currentLocation = await requestCurrentLocationForTrigger()
		},
		async resolveTextAndOpenResult(text = '', source = 'ocr') {
			if (this.recognizing) return
			this.recognizing = true
			this.lastError = ''
			try {
				const location = this.currentLocation || await requestCurrentLocationForTrigger()
				const trigger = await resolveXichengTextTrigger({
					text,
					ocrText: text,
					location,
					source
				})
				this.openScanResult(trigger, source)
			} catch (error) {
				this.lastError = error && (error.errMsg || error.message) ? (error.errMsg || error.message) : '识别失败'
			} finally {
				this.recognizing = false
			}
		},
		startScanRecognition() {
			if (!uni.scanCode) {
				this.resolveTextAndOpenResult('白塔寺 西城文化点', 'scan')
				return
			}
			uni.scanCode({
				success: (res) => {
					this.resolveTextAndOpenResult(res.result || res.path || '', 'scan')
				},
				fail: () => {
					this.resolveTextAndOpenResult('白塔寺 西城文化点', 'scan')
				}
			})
		},
		startOcrRecognition() {
			this.resolveTextAndOpenResult('白塔寺 文物说明牌 北京西城', 'ocr')
		},
		startPhotoRecognition() {
			if (this.recognizing) return
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['camera', 'album'],
				success: async (res) => {
					const filePath = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : ''
					if (!filePath) return
					this.recognizing = true
					this.lastError = ''
					try {
						const trigger = await resolveXichengPhotoTrigger({ filePath })
						this.openScanResult(trigger, 'photo')
					} catch (error) {
						this.lastError = error && (error.errMsg || error.message) ? (error.errMsg || error.message) : '照片识别失败'
					} finally {
						this.recognizing = false
					}
				}
			})
		},
		openScanResult(trigger = {}, source = '') {
			const result = {
				...trigger,
				source,
				regionCode: this.region.regionCode,
				packageCode: this.region.packageCode,
				companionName: this.region.companionName
			}
			uni.setStorageSync(this.region.storageKey, result)
			uni.navigateTo({
				url: `/pages/xicheng/scan-result/scan-result?source=${encodeURIComponent(source)}&poiCode=${encodeURIComponent(result.poiCode || '')}`
			})
		},
		askXiaojing() {
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?regionCode=${encodeURIComponent(this.region.regionCode)}&packageCode=${encodeURIComponent(this.region.packageCode)}&companionName=${encodeURIComponent(this.region.companionName)}`
			})
		}
	}
}
</script>

<style scoped>
.xicheng-home {
	min-height: 100vh;
	padding: 36rpx 28rpx 48rpx;
	box-sizing: border-box;
	background: #F7F5EE;
	color: #1F2933;
}

.hero {
	padding: 40rpx 32rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	box-shadow: 0 12rpx 36rpx rgba(31, 41, 51, 0.08);
}

.eyebrow,
.subtitle,
.quick-desc,
.ops-desc,
.error-line {
	display: block;
	font-size: 24rpx;
	line-height: 1.6;
	color: #667085;
}

.title {
	display: block;
	margin-top: 12rpx;
	font-size: 48rpx;
	font-weight: 700;
	color: #122033;
}

.subtitle {
	margin-top: 16rpx;
}

.hero-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 28rpx;
}

.primary-button,
.ghost-button {
	flex: 1;
	height: 84rpx;
	line-height: 84rpx;
	border-radius: 8rpx;
	font-size: 28rpx;
}

.primary-button {
	background: #1F6E5A;
	color: #FFFFFF;
}

.ghost-button {
	background: #EEF5F1;
	color: #1F6E5A;
}

.quick-grid,
.ops-section {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20rpx;
	margin-top: 28rpx;
}

.quick-card,
.ops-card {
	min-height: 150rpx;
	padding: 24rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	box-sizing: border-box;
}

.quick-title,
.ops-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #172B4D;
}

.quick-desc,
.ops-desc {
	margin-top: 10rpx;
}

.flow-strip {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 28rpx;
}

.flow-strip text {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 76rpx;
	padding: 8rpx;
	border-radius: 8rpx;
	background: #E8ECE7;
	font-size: 22rpx;
	text-align: center;
	color: #344054;
	box-sizing: border-box;
}

.ops-section {
	grid-template-columns: 1fr;
}

.error-line {
	margin-top: 24rpx;
	color: #B42318;
}
</style>
