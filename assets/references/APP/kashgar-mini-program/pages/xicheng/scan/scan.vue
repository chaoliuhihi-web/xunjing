<template>
	<view class="xicheng-scan xicheng-designed-page xicheng-bottom-safe">
		<view class="scan-hero scan-reference-hero xicheng-paper-card">
			<view class="scan-hero-copy">
				<text class="scan-kicker">{{ region.cityName }}</text>
				<text class="scan-title">扫一扫</text>
				<text class="scan-subtitle">一个入口自动识别二维码、照片、OCR文字、地点线索和路线图</text>
			</view>
			<view class="scan-companion">
				<image class="scan-companion-avatar" :src="region.companionAvatar" mode="aspectFit" />
				<view class="scan-companion-bubble xicheng-companion-bubble">
					<text class="scan-companion-name">{{ routeContext.companionName }}</text>
					<text class="scan-companion-line">我会先匹配西城官方 POI</text>
				</view>
			</view>
		</view>

		<view class="scan-panel xicheng-paper-card">
			<view class="scan-frame">
				<view class="scan-frame-corner scan-frame-corner-tl"></view>
				<view class="scan-frame-corner scan-frame-corner-tr"></view>
				<view class="scan-frame-corner scan-frame-corner-bl"></view>
				<view class="scan-frame-corner scan-frame-corner-br"></view>
				<view class="scan-frame-core">
					<text class="scan-frame-title">自动识别</text>
					<text class="scan-frame-copy">二维码 / 牌匾 / 展牌 / 路线图 / 当前位置</text>
				</view>
			</view>

			<textarea
				v-model="manualText"
				class="scan-textarea"
				placeholder="可选：补充白塔寺、展牌文字、攻略片段或路线图说明"
				auto-height
			/>

			<button
				class="primary-button xicheng-primary-action scan-primary-button"
				:disabled="recognizing"
				@click="startAutoRecognition"
			>
				{{ recognizing ? '正在识别' : '开始自动识别' }}
			</button>
			<text class="scan-privacy">图片和位置仅用于本次西城 POI 识别、来源匹配和本地游记素材生成，不默认公开。</text>
		</view>

		<view class="scan-capabilities xicheng-paper-card">
			<view class="section-head xicheng-section-label">
				<view>
					<text class="section-kicker">自动判断</text>
					<text class="section-title">小京会处理这些线索</text>
				</view>
				<text class="section-badge">单入口</text>
			</view>
			<view class="capability-grid">
				<view v-for="item in capabilities" :key="item.title" class="capability-item">
					<text class="capability-title">{{ item.title }}</text>
					<text class="capability-copy">{{ item.copy }}</text>
				</view>
			</view>
		</view>

		<view v-if="lastError" class="error-line">{{ lastError }}</view>
	</view>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import {
	isXichengDevelopmentRecognitionCacheBlocked,
	requestCurrentLocationForTrigger,
	resolveXichengPhotoTrigger,
	resolveXichengTextTrigger
} from '@/request/xunjing/trigger.js'
import { createXichengRouteOutputValue, decodeXichengRouteValue } from '@/request/xunjing/routeParams.js'
import { isXichengUnsafeSafetyStatus, normalizeXichengSafetyStatus } from '@/request/xunjing/safety.js'
import { isXunjingUserCancelled } from '@/request/xunjing/userCancel.js'

const encodeRouteValue = (value = '') => createXichengRouteOutputValue(value, { platform: process.env.UNI_PLATFORM })
const decodeRouteValue = decodeXichengRouteValue

export default {
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			recognizing: false,
			lastError: '',
			manualText: '',
			currentLocation: null,
			routeContext: {
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				companionName: XICHENG_REGION_CONFIG.companionName,
				tenantId: XICHENG_REGION_CONFIG.tenantId
			},
			capabilities: [
				{ title: '二维码', copy: '读取地图、图书或展牌码并匹配官方 POI' },
				{ title: '照片', copy: '识别门头、文物、说明牌和现场照片' },
				{ title: 'OCR文字', copy: '从图片文字或补充文本提取地点线索' },
				{ title: '地点线索', copy: '把攻略里的地名匹配到西城官方 POI' },
				{ title: '路线图', copy: '把路线图和地点组合转成可走路线' }
			]
		}
	},
	onLoad(options = {}) {
		this.routeContext = {
			regionCode: decodeRouteValue(options.regionCode) || XICHENG_REGION_CONFIG.regionCode,
			packageCode: decodeRouteValue(options.packageCode) || XICHENG_REGION_CONFIG.packageCode,
			sceneCode: decodeRouteValue(options.sceneCode) || XICHENG_REGION_CONFIG.sceneCode,
			sourceChannel: decodeRouteValue(options.sourceChannel) || XICHENG_REGION_CONFIG.sourceChannel,
			companionName: decodeRouteValue(options.companionName) || XICHENG_REGION_CONFIG.companionName,
			tenantId: XICHENG_REGION_CONFIG.tenantId
		}
	},
	methods: {
		startAutoRecognition() {
			if (this.recognizing) return
			this.lastError = ''
			if (uni.scanCode) {
				uni.scanCode({
					success: async (res) => {
						if (res.result || res.path) {
							this.resolveTextAndOpenResult(res.result || res.path || '', 'scan')
							return
						}
						this.chooseAutoRecognitionImage()
					},
					fail: (err) => {
						if (isXunjingUserCancelled(err)) return
						this.chooseAutoRecognitionImage()
					}
				})
				return
			}
			this.chooseAutoRecognitionImage()
		},
		chooseAutoRecognitionImage() {
			if (!uni.chooseImage) {
				this.resolveNearbyLocation()
				return
			}
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['camera', 'album'],
				success: async (res) => {
					const filePath = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : ''
					if (!filePath) {
						this.resolveNearbyLocation()
						return
					}
					this.recognizing = true
					this.lastError = ''
					try {
						const text = this.manualText.trim()
						const trigger = await resolveXichengPhotoTrigger({
							filePath,
							text,
							ocrText: text,
							imageLabels: ['照片', 'OCR文字', '地点线索', '路线图']
						})
						this.openScanResult(trigger, 'photo')
					} catch (error) {
						this.handleRecognitionServiceFailure('photo', error)
					} finally {
						this.recognizing = false
					}
				},
				fail: (err) => {
					if (isXunjingUserCancelled(err)) return
					this.resolveNearbyLocation()
				}
			})
		},
		async resolveNearbyLocation() {
			if (this.recognizing) return
			this.recognizing = true
			this.lastError = ''
			try {
				const location = await requestCurrentLocationForTrigger()
				this.currentLocation = location
				const text = this.manualText.trim() || '当前位置附近西城文化点'
				const trigger = await resolveXichengTextTrigger({
					text,
					ocrText: text,
					location,
					source: location ? 'gps' : 'text'
				})
				this.openScanResult(trigger, location ? 'gps' : 'text')
			} catch (error) {
				this.handleRecognitionServiceFailure('gps', error)
			} finally {
				this.recognizing = false
			}
		},
		async resolveTextAndOpenResult(text = '', source = 'scan') {
			if (this.recognizing) return
			this.recognizing = true
			this.lastError = ''
			try {
				const trigger = await resolveXichengTextTrigger({
					text,
					ocrText: this.manualText.trim() || text,
					location: this.currentLocation,
					source
				})
				this.openScanResult(trigger, source)
			} catch (error) {
				this.handleRecognitionServiceFailure(source, error)
			} finally {
				this.recognizing = false
			}
		},
		openScanResult(trigger = {}, source = '') {
			if (isXichengDevelopmentRecognitionCacheBlocked(trigger)) {
				this.handleRecognitionUnavailable(source || 'scan')
				return
			}
			const result = {
				...trigger,
				source,
				regionCode: trigger.regionCode || this.routeContext.regionCode,
				packageCode: trigger.packageCode || this.routeContext.packageCode,
				sceneCode: trigger.sceneCode || this.routeContext.sceneCode,
				sourceChannel: trigger.sourceChannel || this.routeContext.sourceChannel,
				companionName: trigger.companionName || this.routeContext.companionName,
				tenantId: this.routeContext.tenantId
			}
			const unsafeSafetyStatus = isXichengUnsafeSafetyStatus(normalizeXichengSafetyStatus(result.safetyStatus))
			if (unsafeSafetyStatus) {
				uni.removeStorageSync(this.region.storageKey)
			} else {
				uni.setStorageSync(this.region.storageKey, result)
			}
			uni.navigateTo({
				url: `/pages/xicheng/scan-result/scan-result?source=${encodeRouteValue(source)}&regionCode=${encodeRouteValue(result.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(result.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(result.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(result.sourceChannel || this.region.sourceChannel)}&poiCode=${encodeRouteValue(result.poiCode || '')}&poiName=${encodeRouteValue(result.poiName || '')}&companionName=${encodeRouteValue(result.companionName || this.region.companionName)}&safetyStatus=${encodeRouteValue(result.safetyStatus || '')}`
			})
		},
		handleRecognitionUnavailable(source = 'scan') {
			const message = source === 'photo'
				? '未获得可识别图片，请重新拍摄或补充文字线索'
				: source === 'gps'
					? '无法获取当前位置，请开启定位权限后重试'
					: '未获得可识别线索，请补充文字或重新识别'
			this.lastError = message
			uni.showToast({
				icon: 'none',
				title: message
			})
		},
		handleRecognitionServiceFailure(source = 'scan', error = null) {
			const message = source === 'photo'
				? '图片识别服务暂不可用，请补充文字线索或稍后重试'
				: source === 'gps'
					? '定位识别服务暂不可用，请稍后重试'
					: '西城识别服务暂不可用，请改用文字线索或稍后重试'
			this.lastError = message
			uni.showToast({
				icon: 'none',
				title: message
			})
		}
	}
}
</script>

<style scoped>
.xicheng-scan {
	min-height: 100vh;
	padding: 28rpx 28rpx 170rpx;
	box-sizing: border-box;
	color: #102F29;
}

.scan-hero {
	position: relative;
	overflow: hidden;
	display: flex;
	justify-content: space-between;
	gap: 22rpx;
	padding: 34rpx 30rpx;
	background:
		linear-gradient(135deg, rgba(247, 239, 222, 0.96), rgba(230, 241, 230, 0.94)),
		linear-gradient(180deg, rgba(184, 129, 43, 0.16), rgba(16, 47, 41, 0.05));
}

.scan-hero-copy {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
	min-width: 0;
}

.scan-kicker,
.section-kicker {
	font-size: 22rpx;
	color: #B8812B;
	font-weight: 700;
}

.scan-title {
	font-size: 44rpx;
	font-weight: 800;
	color: #102F29;
	line-height: 1.1;
}

.scan-subtitle {
	max-width: 420rpx;
	font-size: 25rpx;
	line-height: 1.55;
	color: rgba(16, 47, 41, 0.72);
}

.scan-companion {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 184rpx;
	flex: 0 0 184rpx;
}

.scan-companion-avatar {
	width: 138rpx;
	height: 168rpx;
}

.scan-companion-bubble {
	margin-top: -8rpx;
	padding: 14rpx 18rpx;
}

.scan-companion-name,
.scan-companion-line {
	display: block;
	font-size: 22rpx;
	line-height: 1.35;
	color: #102F29;
}

.scan-companion-name {
	font-weight: 800;
}

.scan-panel,
.scan-capabilities {
	margin-top: 24rpx;
	padding: 28rpx;
}

.scan-frame {
	position: relative;
	height: 390rpx;
	border-radius: 32rpx;
	background:
		radial-gradient(circle at 50% 34%, rgba(184, 129, 43, 0.16), transparent 32%),
		linear-gradient(180deg, rgba(16, 47, 41, 0.92), rgba(30, 72, 59, 0.86));
	overflow: hidden;
}

.scan-frame::after {
	content: "";
	position: absolute;
	left: 58rpx;
	right: 58rpx;
	top: 50%;
	height: 2rpx;
	background: linear-gradient(90deg, transparent, rgba(241, 199, 106, 0.96), transparent);
	box-shadow: 0 0 26rpx rgba(241, 199, 106, 0.58);
}

.scan-frame-corner {
	position: absolute;
	width: 54rpx;
	height: 54rpx;
	border-color: #F1C76A;
}

.scan-frame-corner-tl {
	left: 42rpx;
	top: 42rpx;
	border-left: 6rpx solid;
	border-top: 6rpx solid;
}

.scan-frame-corner-tr {
	right: 42rpx;
	top: 42rpx;
	border-right: 6rpx solid;
	border-top: 6rpx solid;
}

.scan-frame-corner-bl {
	left: 42rpx;
	bottom: 42rpx;
	border-left: 6rpx solid;
	border-bottom: 6rpx solid;
}

.scan-frame-corner-br {
	right: 42rpx;
	bottom: 42rpx;
	border-right: 6rpx solid;
	border-bottom: 6rpx solid;
}

.scan-frame-core {
	position: absolute;
	left: 72rpx;
	right: 72rpx;
	top: 118rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14rpx;
	text-align: center;
	color: #FFF7E6;
}

.scan-frame-title {
	font-size: 40rpx;
	font-weight: 800;
}

.scan-frame-copy {
	font-size: 24rpx;
	line-height: 1.5;
	color: rgba(255, 247, 230, 0.84);
}

.scan-textarea {
	width: 100%;
	min-height: 120rpx;
	margin-top: 24rpx;
	padding: 22rpx 24rpx;
	border-radius: 24rpx;
	box-sizing: border-box;
	background: rgba(255, 252, 244, 0.92);
	border: 1rpx solid rgba(184, 129, 43, 0.18);
	color: #102F29;
	font-size: 26rpx;
	line-height: 1.5;
}

.scan-primary-button {
	width: 100%;
	margin-top: 24rpx;
}

.scan-privacy {
	display: block;
	margin-top: 18rpx;
	font-size: 22rpx;
	line-height: 1.5;
	color: rgba(16, 47, 41, 0.58);
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
}

.section-title {
	display: block;
	margin-top: 6rpx;
	font-size: 32rpx;
	font-weight: 800;
	color: #102F29;
}

.section-badge {
	padding: 8rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(184, 129, 43, 0.14);
	color: #8A5B1E;
	font-size: 22rpx;
	font-weight: 700;
	white-space: nowrap;
}

.capability-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 24rpx;
}

.capability-item {
	min-width: 0;
	padding: 20rpx;
	border-radius: 22rpx;
	background: rgba(255, 252, 244, 0.72);
	border: 1rpx solid rgba(184, 129, 43, 0.14);
}

.capability-title,
.capability-copy {
	display: block;
}

.capability-title {
	font-size: 25rpx;
	font-weight: 800;
	color: #102F29;
}

.capability-copy {
	margin-top: 8rpx;
	font-size: 22rpx;
	line-height: 1.45;
	color: rgba(16, 47, 41, 0.62);
}

.error-line {
	margin-top: 20rpx;
	padding: 18rpx 20rpx;
	border-radius: 18rpx;
	background: rgba(162, 62, 42, 0.1);
	color: #8B2D21;
	font-size: 24rpx;
	line-height: 1.45;
}
</style>
