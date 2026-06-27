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

		<view class="inspiration-panel" @click="openXichengInspiration">
			<view>
				<text class="inspiration-title">一键导入灵感</text>
				<text class="inspiration-desc">粘贴攻略文字或地点清单，AI 提取地点并匹配官方 POI。</text>
			</view>
			<text class="inspiration-action">生成路线</text>
		</view>

		<view v-if="recentRecognition" class="recent-panel">
			<view class="recent-copy">
				<text class="recent-kicker">最近识别</text>
				<text class="recent-title">{{ recentRecognition.poiName || '西城文化点' }}</text>
				<text class="recent-desc">
					{{ recentRecognition.sourceLabel || '识别结果' }} · 置信度 {{ recentRecognitionConfidence }}%
				</text>
			</view>
			<view class="recent-actions">
				<button class="primary-button" @click="continueRecentRecognitionWithXiaojing">继续问小京</button>
				<button class="ghost-button" @click="openRecentRecognition">查看识别结果</button>
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
			<view class="quick-card" @click="startGpsRecognition">
				<text class="quick-title">GPS定位</text>
				<text class="quick-desc">用当前位置识别附近文化点</text>
			</view>
			<view class="quick-card" @click="startOcrRecognition">
				<text class="quick-title">OCR识别</text>
				<text class="quick-desc">从图片文字提取地点线索</text>
			</view>
			<view class="quick-card" @click="startTextRecognition">
				<text class="quick-title">文本识别</text>
				<text class="quick-desc">粘贴地点、展牌或攻略文字</text>
			</view>
			<view class="quick-card" @click="askXiaojing">
				<text class="quick-title">问问小京</text>
				<text class="quick-desc">继续咨询路线和讲解</text>
			</view>
		</view>

		<view class="text-recognition-panel">
			<textarea
				v-model="textRecognitionInput"
				class="text-recognition-input"
				placeholder="输入白塔寺、什刹海，或粘贴展牌/攻略文字"
				auto-height
			/>
			<button class="primary-button" :disabled="recognizing" @click="startTextRecognition">文本识别</button>
		</view>

		<view class="flow-strip">
			<text>小京讲解</text>
			<text>推荐路线</text>
			<text>开始记录</text>
			<text>生成游记草稿</text>
		</view>

		<view class="journey-panel">
			<view>
				<text class="journey-title">西城 Citywalk 记录</text>
				<text class="journey-desc">把识别点、照片、备注和任务沉淀为旅行素材盒。</text>
			</view>
			<view class="journey-actions">
				<button class="primary-button" @click="openXichengTravelogue('record')">开始记录 Citywalk</button>
				<button class="ghost-button" @click="openXichengTravelogue('draft')">生成游记草稿</button>
			</view>
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
	resolveXichengOcrImageTrigger,
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
			textRecognitionInput: '',
			recognizing: false,
			lastError: '',
			recentRecognition: null
		}
	},
	computed: {
		recentRecognitionConfidence() {
			return Math.round(Number(this.recentRecognition && this.recentRecognition.confidence ? this.recentRecognition.confidence : 0) * 100)
		}
	},
	onLoad() {
		this.prepareLocation()
		this.loadRecentRecognition()
	},
	onShow() {
		this.loadRecentRecognition()
	},
	methods: {
		async prepareLocation() {
			this.currentLocation = await requestCurrentLocationForTrigger()
		},
		loadRecentRecognition() {
			const cached = uni.getStorageSync(XICHENG_REGION_CONFIG.storageKey)
			this.recentRecognition = cached && typeof cached === 'object' && (cached.poiCode || cached.poiName)
				? cached
				: null
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
				this.handleRecognitionUnavailable('scan')
				return
			}
			uni.scanCode({
				success: (res) => {
					const scannedText = res.result || res.path || ''
					if (!scannedText) {
						this.handleRecognitionUnavailable('scan')
						return
					}
					this.resolveTextAndOpenResult(scannedText, 'scan')
				},
				fail: () => {
					this.handleRecognitionUnavailable('scan')
				}
			})
		},
		startOcrRecognition() {
			if (this.recognizing) return
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['camera', 'album'],
				success: async (res) => {
					const filePath = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : ''
					if (!filePath) {
						this.handleRecognitionUnavailable('ocr')
						return
					}
					this.recognizing = true
					this.lastError = ''
					try {
						const trigger = await resolveXichengOcrImageTrigger({
							filePath,
							ocrText: this.textRecognitionInput.trim()
						})
						this.openScanResult(trigger, 'ocr')
					} catch (error) {
						this.lastError = error && (error.errMsg || error.message) ? (error.errMsg || error.message) : 'OCR识别失败'
					} finally {
						this.recognizing = false
					}
				},
				fail: () => {
					this.handleRecognitionUnavailable('ocr')
				}
			})
		},
		async startGpsRecognition() {
			if (this.recognizing) return
			this.recognizing = true
			this.lastError = ''
			try {
				const location = await requestCurrentLocationForTrigger()
				this.currentLocation = location
				if (!location) {
					this.handleRecognitionUnavailable('gps')
					return
				}
				const trigger = await resolveXichengTextTrigger({
					text: '当前位置附近西城文化点',
					ocrText: '',
					source: 'gps',
					location
				})
				this.openScanResult(trigger, 'gps')
			} catch (error) {
				this.lastError = error && (error.errMsg || error.message) ? (error.errMsg || error.message) : '定位识别失败'
			} finally {
				this.recognizing = false
			}
		},
		startTextRecognition() {
			const text = this.textRecognitionInput.trim()
			if (!text) {
				uni.showToast({
					icon: 'none',
					title: '请输入地点线索'
				})
				return
			}
			this.resolveTextAndOpenResult(text, 'text')
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
		handleRecognitionUnavailable(source = 'scan') {
			const message = source === 'gps'
				? '无法获取当前位置，请开启定位权限后重试'
				: source === 'ocr'
					? '未获得可识别图片，请补充图片或粘贴展牌文字'
					: '扫码未完成，请改用文本识别输入展牌或地点线索'
			this.lastError = message
			uni.showToast({
				icon: 'none',
				title: message
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
			this.recentRecognition = result
			uni.navigateTo({
				url: `/pages/xicheng/scan-result/scan-result?source=${encodeURIComponent(source)}&poiCode=${encodeURIComponent(result.poiCode || '')}`
			})
		},
		openRecentRecognition() {
			if (!this.recentRecognition) return
			uni.navigateTo({
				url: `/pages/xicheng/scan-result/scan-result?source=${encodeURIComponent(this.recentRecognition.source || '')}&poiCode=${encodeURIComponent(this.recentRecognition.poiCode || '')}`
			})
		},
		continueRecentRecognitionWithXiaojing() {
			if (!this.recentRecognition) return
			const prompt = this.recentRecognition.poiName ? `讲讲${this.recentRecognition.poiName}` : '讲讲这个西城文化点'
			const query = [
				`question=${encodeURIComponent(prompt)}`,
				`regionCode=${encodeURIComponent(this.recentRecognition.regionCode || this.region.regionCode)}`,
				`packageCode=${encodeURIComponent(this.recentRecognition.packageCode || this.region.packageCode)}`,
				`poiCode=${encodeURIComponent(this.recentRecognition.poiCode || '')}`,
				`poiName=${encodeURIComponent(this.recentRecognition.poiName || '')}`,
				`companionName=${encodeURIComponent(this.recentRecognition.companionName || this.region.companionName)}`,
				`confidence=${encodeURIComponent(String(this.recentRecognition.confidence || ''))}`
			].join('&')
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?${query}`
			})
		},
		askXiaojing() {
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?regionCode=${encodeURIComponent(this.region.regionCode)}&packageCode=${encodeURIComponent(this.region.packageCode)}&companionName=${encodeURIComponent(this.region.companionName)}`
			})
		},
		openXichengTravelogue(mode = 'record') {
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?mode=${encodeURIComponent(mode)}&autoStart=${encodeURIComponent(mode === 'record' ? '1' : '')}&regionCode=${encodeURIComponent(this.region.regionCode)}`
			})
		},
		openXichengInspiration() {
			uni.navigateTo({
				url: `/pages/xicheng/inspiration/inspiration?regionCode=${encodeURIComponent(this.region.regionCode)}`
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

.inspiration-panel {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	margin-top: 28rpx;
	padding: 28rpx;
	border-radius: 8rpx;
	background: #122033;
	color: #FFFFFF;
	box-shadow: 0 12rpx 36rpx rgba(31, 41, 51, 0.12);
}

.inspiration-title {
	display: block;
	font-size: 32rpx;
	font-weight: 700;
}

.inspiration-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: rgba(255, 255, 255, 0.76);
}

.inspiration-action {
	flex-shrink: 0;
	padding: 12rpx 18rpx;
	border-radius: 8rpx;
	background: #F2C94C;
	font-size: 24rpx;
	font-weight: 700;
	color: #122033;
}

.text-recognition-panel {
	margin-top: 28rpx;
	padding: 24rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	box-shadow: 0 8rpx 24rpx rgba(31, 41, 51, 0.06);
}

.text-recognition-input {
	width: 100%;
	min-height: 112rpx;
	padding: 20rpx;
	box-sizing: border-box;
	border: 2rpx solid #D6E3DC;
	border-radius: 8rpx;
	background: #F9FBFA;
	font-size: 26rpx;
	line-height: 1.5;
	color: #122033;
}

.text-recognition-panel .primary-button {
	margin-top: 20rpx;
	width: 100%;
}

.recent-panel {
	margin-top: 28rpx;
	padding: 28rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	box-shadow: 0 12rpx 36rpx rgba(31, 41, 51, 0.08);
}

.recent-copy {
	min-width: 0;
}

.recent-kicker {
	display: block;
	font-size: 24rpx;
	line-height: 1.5;
	color: #1F6E5A;
}

.recent-title {
	display: block;
	margin-top: 8rpx;
	font-size: 34rpx;
	font-weight: 700;
	color: #122033;
}

.recent-desc {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #667085;
}

.recent-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 24rpx;
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

.journey-panel {
	margin-top: 28rpx;
	padding: 32rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	box-shadow: 0 12rpx 36rpx rgba(31, 41, 51, 0.08);
}

.journey-title {
	display: block;
	font-size: 32rpx;
	font-weight: 700;
	color: #122033;
}

.journey-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.6;
	color: #667085;
}

.journey-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 24rpx;
}

.ops-section {
	grid-template-columns: 1fr;
}

.error-line {
	margin-top: 24rpx;
	color: #B42318;
}
</style>
