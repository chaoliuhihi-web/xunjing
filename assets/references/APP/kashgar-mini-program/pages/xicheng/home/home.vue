<template>
	<view class="xicheng-home">
		<view class="hero">
			<view class="hero-main">
				<view class="hero-copy">
					<text class="eyebrow">{{ region.cityName }}</text>
					<text class="title">小京 AI旅伴</text>
					<text class="subtitle">拍照、OCR、定位识别后，直接进入讲解、路线和游记草稿。</text>
					<view class="hero-actions">
						<button class="primary-button" :disabled="recognizing" @click="startPhotoRecognition">拍照识别</button>
						<button class="ghost-button" :disabled="recognizing" @click="askXiaojing">问问小京</button>
					</view>
				</view>
				<view class="companion-visual">
					<image class="xiaojing-avatar" :src="region.companionAvatar" mode="aspectFit" />
					<view class="companion-bubble">
						<text class="companion-name">{{ region.companionName }}</text>
						<text class="companion-line">我陪你看懂西城</text>
					</view>
				</view>
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

		<view class="route-recommendation-section">
			<view class="section-head">
				<view>
					<text class="section-kicker">官方路线</text>
					<text class="section-title">路线推荐</text>
				</view>
				<text class="section-link" @click="openXichengInspiration">导入灵感</text>
			</view>
			<view
				v-for="route in recommendedRoutes.slice(0, 3)"
				:key="route.routeCode"
				class="recommended-route-card"
				@click="openRecommendedRoute(route)"
			>
				<view class="route-card-header">
					<view>
						<text class="route-title">{{ route.title }}</text>
						<text class="route-desc">{{ route.summary }}</text>
					</view>
					<text class="route-theme">{{ route.theme }}</text>
				</view>
				<view class="route-meta">
					<text>{{ route.durationText }}</text>
					<text>路线护照 {{ route.passportTaskCount }} 点</text>
					<text>研学任务 {{ route.studyTaskCount }} 个</text>
				</view>
				<view class="route-stops">
					<text
						v-for="(stop, index) in route.stops"
						:key="`${route.routeCode}-${stop.poiCode}`"
						class="route-stop"
					>
						{{ index + 1 }}. {{ stop.poiName }}
					</text>
				</view>
				<view class="route-card-action">
					<button class="mini-button" @click.stop="openRecommendedRoute(route)">加入路线护照</button>
				</view>
			</view>
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
	XICHENG_RECOMMENDED_ROUTES,
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
			recommendedRoutes: XICHENG_RECOMMENDED_ROUTES,
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
		confirmImageRecognitionPurpose(actionLabel = '图片识别') {
			return new Promise(resolve => {
				uni.showModal({
					title: `${actionLabel}用途说明`,
					content: '照片或图片仅用于本次西城 POI 识别和本地游记素材生成，不默认公开；不会用于模型评估或运营纠错，除非你另行授权。',
					confirmText: '继续',
					cancelText: '取消',
					success: (res) => {
						resolve(Boolean(res.confirm))
					},
					fail: () => {
						resolve(false)
					}
				})
			})
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
		async startOcrRecognition() {
			if (this.recognizing) return
			const confirmed = await this.confirmImageRecognitionPurpose('OCR识别')
			if (!confirmed) return
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
		async startPhotoRecognition() {
			if (this.recognizing) return
			const confirmed = await this.confirmImageRecognitionPurpose('拍照识别')
			if (!confirmed) return
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['camera', 'album'],
				success: async (res) => {
					const filePath = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : ''
					if (!filePath) {
						this.handleRecognitionUnavailable('photo')
						return
					}
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
				},
				fail: () => {
					this.handleRecognitionUnavailable('photo')
				}
			})
		},
		handleRecognitionUnavailable(source = 'scan') {
			const message = source === 'gps'
				? '无法获取当前位置，请开启定位权限后重试'
				: source === 'photo'
					? '未获得可识别照片，请重新拍照或从相册选择'
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
				sceneCode: trigger.sceneCode || this.region.sceneCode,
				sourceChannel: trigger.sourceChannel || this.region.sourceChannel,
				companionName: this.region.companionName
			}
			uni.setStorageSync(this.region.storageKey, result)
			this.recentRecognition = result
			uni.navigateTo({
				url: `/pages/xicheng/scan-result/scan-result?source=${encodeURIComponent(source)}&regionCode=${encodeURIComponent(result.regionCode || this.region.regionCode)}&packageCode=${encodeURIComponent(result.packageCode || this.region.packageCode)}&sceneCode=${encodeURIComponent(result.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeURIComponent(result.sourceChannel || this.region.sourceChannel)}&poiCode=${encodeURIComponent(result.poiCode || '')}&poiName=${encodeURIComponent(result.poiName || '')}&companionName=${encodeURIComponent(result.companionName || this.region.companionName)}&safetyStatus=${encodeURIComponent(result.safetyStatus || '')}`
			})
		},
		openRecentRecognition() {
			if (!this.recentRecognition) return
			uni.navigateTo({
				url: `/pages/xicheng/scan-result/scan-result?source=${encodeURIComponent(this.recentRecognition.source || '')}&regionCode=${encodeURIComponent(this.recentRecognition.regionCode || this.region.regionCode)}&packageCode=${encodeURIComponent(this.recentRecognition.packageCode || this.region.packageCode)}&sceneCode=${encodeURIComponent(this.recentRecognition.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeURIComponent(this.recentRecognition.sourceChannel || this.region.sourceChannel)}&poiCode=${encodeURIComponent(this.recentRecognition.poiCode || '')}&poiName=${encodeURIComponent(this.recentRecognition.poiName || '')}&companionName=${encodeURIComponent(this.recentRecognition.companionName || this.region.companionName)}&safetyStatus=${encodeURIComponent(this.recentRecognition.safetyStatus || '')}`
			})
		},
		continueRecentRecognitionWithXiaojing() {
			if (!this.recentRecognition) return
			const prompt = this.recentRecognition.poiName ? `讲讲${this.recentRecognition.poiName}` : '讲讲这个西城文化点'
			const query = [
				`question=${encodeURIComponent(prompt)}`,
				`regionCode=${encodeURIComponent(this.recentRecognition.regionCode || this.region.regionCode)}`,
				`packageCode=${encodeURIComponent(this.recentRecognition.packageCode || this.region.packageCode)}`,
				`sceneCode=${encodeURIComponent(this.recentRecognition.sceneCode || this.region.sceneCode)}`,
				`sourceChannel=${encodeURIComponent(this.recentRecognition.sourceChannel || this.region.sourceChannel)}`,
				`poiCode=${encodeURIComponent(this.recentRecognition.poiCode || '')}`,
				`poiName=${encodeURIComponent(this.recentRecognition.poiName || '')}`,
				`companionName=${encodeURIComponent(this.recentRecognition.companionName || this.region.companionName)}`,
				`confidence=${encodeURIComponent(String(this.recentRecognition.confidence || ''))}`,
				`safetyStatus=${encodeURIComponent(this.recentRecognition.safetyStatus || '')}`
			].join('&')
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?${query}`
			})
		},
		askXiaojing() {
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?regionCode=${encodeURIComponent(this.region.regionCode)}&packageCode=${encodeURIComponent(this.region.packageCode)}&sceneCode=${encodeURIComponent(this.region.aiSceneCode || this.region.sceneCode)}&sourceChannel=${encodeURIComponent(this.region.sourceChannel)}&companionName=${encodeURIComponent(this.region.companionName)}`
			})
		},
		openRecommendedRoute(route = {}) {
			const updatedAt = new Date().toISOString()
			const stops = Array.isArray(route.stops)
				? route.stops.map(stop => ({ ...stop }))
				: []
			const routePayload = {
				...route,
				stops,
				regionCode: this.region.regionCode,
				packageCode: this.region.packageCode,
				sourceChannel: this.region.sourceChannel,
				routeSource: 'home-recommendation',
				sourceLabel: '官方推荐路线',
				updatedAt
			}
			const existingMaterials = uni.getStorageSync(this.region.materialsStorageKey)
			const materials = Array.isArray(existingMaterials) ? existingMaterials : []
			const routeMaterials = stops.map(stop => ({
				type: 'official-route-poi',
				regionCode: this.region.regionCode,
				packageCode: this.region.packageCode,
				poiCode: stop.poiCode,
				poiName: stop.poiName,
				routeCode: route.routeCode,
				routeTitle: route.title,
				sourceLabel: '官方推荐路线',
				sources: [],
				capturedAt: updatedAt
			}))
			uni.setStorageSync(this.region.inspirationStorageKey, routePayload)
			uni.setStorageSync(this.region.materialsStorageKey, [
				...routeMaterials,
				...materials
			].slice(0, 80))
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?mode=route&regionCode=${encodeURIComponent(this.region.regionCode)}&packageCode=${encodeURIComponent(this.region.packageCode)}&companionName=${encodeURIComponent(this.region.companionName)}`
			})
		},
		openXichengTravelogue(mode = 'record') {
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?mode=${encodeURIComponent(mode)}&autoStart=${encodeURIComponent(mode === 'record' ? '1' : '')}&regionCode=${encodeURIComponent(this.region.regionCode)}&packageCode=${encodeURIComponent(this.region.packageCode)}&companionName=${encodeURIComponent(this.region.companionName)}`
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

.hero-main {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
}

.hero-copy {
	flex: 1;
	min-width: 0;
}

.companion-visual {
	width: 220rpx;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.xiaojing-avatar {
	width: 208rpx;
	height: 268rpx;
	border-radius: 8rpx;
	background: #EEF5F1;
}

.companion-bubble {
	width: 100%;
	margin-top: 14rpx;
	padding: 14rpx 12rpx;
	border-radius: 8rpx;
	background: #F7F5EE;
	box-sizing: border-box;
}

.companion-name,
.companion-line {
	display: block;
	text-align: center;
}

.companion-name {
	font-size: 24rpx;
	font-weight: 700;
	color: #1F6E5A;
}

.companion-line {
	margin-top: 4rpx;
	font-size: 22rpx;
	line-height: 1.4;
	color: #667085;
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

.route-recommendation-section {
	margin-top: 28rpx;
	padding: 30rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	box-shadow: 0 12rpx 36rpx rgba(31, 41, 51, 0.08);
}

.section-head,
.route-card-header,
.route-meta,
.route-card-action {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}

.section-kicker {
	display: block;
	font-size: 22rpx;
	line-height: 1.4;
	color: #1F6E5A;
}

.section-title {
	display: block;
	margin-top: 6rpx;
	font-size: 34rpx;
	font-weight: 700;
	color: #122033;
}

.section-link {
	flex-shrink: 0;
	font-size: 24rpx;
	font-weight: 700;
	color: #1F6E5A;
}

.recommended-route-card {
	margin-top: 22rpx;
	padding: 24rpx;
	border: 2rpx solid #D6E3DC;
	border-radius: 8rpx;
	background: #F9FBFA;
	box-sizing: border-box;
}

.route-card-header {
	align-items: flex-start;
}

.route-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	line-height: 1.35;
	color: #122033;
}

.route-desc {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #667085;
}

.route-theme {
	flex-shrink: 0;
	padding: 8rpx 12rpx;
	border-radius: 8rpx;
	background: #EEF5F1;
	font-size: 22rpx;
	color: #1F6E5A;
}

.route-meta {
	justify-content: flex-start;
	flex-wrap: wrap;
	margin-top: 18rpx;
}

.route-meta text {
	padding: 8rpx 12rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	font-size: 22rpx;
	color: #344054;
}

.route-stops {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 18rpx;
}

.route-stop {
	padding: 8rpx 12rpx;
	border-radius: 8rpx;
	background: #E8ECE7;
	font-size: 22rpx;
	color: #344054;
}

.route-card-action {
	justify-content: flex-end;
	margin-top: 20rpx;
}

.mini-button {
	min-width: 180rpx;
	height: 64rpx;
	line-height: 64rpx;
	border-radius: 8rpx;
	background: #1F6E5A;
	font-size: 24rpx;
	color: #FFFFFF;
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
