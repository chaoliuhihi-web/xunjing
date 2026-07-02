<template>
	<view class="xicheng-inspiration xicheng-designed-page xicheng-bottom-safe xicheng-inspiration-shell">
		<view class="hero xicheng-paper-card xicheng-inspiration-hero">
			<view class="inspiration-hero-main">
				<view class="inspiration-hero-copy">
					<text class="eyebrow">一键抄作业</text>
					<text class="title">导入灵感</text>
					<text class="subtitle">粘贴攻略文字、地点清单或上传攻略图片，先做本地 AI提取地点，再匹配官方 POI 生成可走路线。</text>
				</view>
				<view class="inspiration-companion">
					<image class="inspiration-companion-avatar" :src="region.companionAvatar" mode="aspectFit" />
					<view class="inspiration-companion-bubble xicheng-companion-bubble">
						<text class="companion-name">{{ region.companionName }}</text>
						<text class="companion-line">我帮你把灵感变成可走路线</text>
					</view>
				</view>
			</view>
		</view>

		<view class="section-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">粘贴攻略文字</text>
				<button class="tiny-button xicheng-secondary-action" @click="fillExample">示例</button>
			</view>
			<textarea
				class="input-area"
				v-model="rawText"
				maxlength="1200"
				placeholder="例如：白塔寺看建筑，历代帝王庙听礼制故事，最后去什刹海散步。"
			/>
			<view class="upload-row" @click="chooseInspirationImage">
				<text class="upload-title">上传攻略图片</text>
				<text class="upload-desc">{{ imagePath ? '已添加图片素材' : '图片进入素材盒，地点以文字匹配结果为准' }}</text>
			</view>
			<button class="primary-button xicheng-primary-action" @click="runExtraction">AI提取地点</button>
		</view>

		<view class="section-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">匹配官方 POI</text>
				<text class="section-badge">{{ matchedPois.length }} 个</text>
			</view>
			<view v-if="matchedPois.length > 0">
				<view
					v-for="poi in matchedPois"
					:key="poi.poiCode"
					class="poi-row"
				>
					<view>
						<text class="poi-title">{{ poi.poiName }}</text>
						<text class="poi-meta">{{ poi.theme }} · {{ poi.durationText }}</text>
					</view>
					<text class="poi-status">已匹配</text>
				</view>
			</view>
			<text v-else class="empty-copy">请输入白塔寺、历代帝王庙、什刹海、北海或大栅栏等西城官方 POI。</text>
		</view>

		<view class="section-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">生成可走路线</text>
				<text class="section-badge">{{ route.durationText }}</text>
			</view>
			<text class="route-title">{{ route.title }}</text>
			<text class="route-desc">{{ route.summary }}</text>
			<view class="route-steps">
				<text
					v-for="(stop, index) in route.stops"
					:key="stop.poiCode"
					class="route-stop"
				>
					{{ index + 1 }}. {{ stop.poiName }}
				</text>
			</view>
			<view class="action-row xicheng-inspiration-actions">
				<button class="primary-button xicheng-primary-action" @click="saveInspirationRoute">{{ isMapTarget ? '生成到文旅地图' : '加入路线护照' }}</button>
				<button class="ghost-button xicheng-secondary-action" @click="openTravelogue">打开素材盒</button>
			</view>
		</view>
	</view>
</template>

<script>
import {
	XICHENG_REGION_CONFIG
} from '@/config/regions/xicheng.js'
import { createXichengRouteOutputValue } from '@/request/xunjing/routeParams.js'
import { isXunjingUserCancelled } from '@/request/xunjing/userCancel.js'
import { mergeXichengOfficialRouteMaterials } from '@/request/xunjing/routeMaterials.js'
import {
	buildXichengWalkRoute as buildXichengWalkRouteFromImportPackage,
	createXichengInspirationImportPackage,
	createXichengInspirationRouteMaterials,
	createXichengInspirationImportRecord,
	extractXichengPoiMatches as extractXichengPoiMatchesFromImportPackage
} from '@/request/xunjing/inspirationImport.js'
import {
	extractXichengPrimaryInspirationLink,
	isXichengLinkOnlyInspirationInput,
	requestXichengInspirationLinkImport
} from '@/request/xunjing/inspirationLinkImport.js'

const encodeRouteValue = (value = '') => createXichengRouteOutputValue(value, { platform: process.env.UNI_PLATFORM })

export const extractXichengPoiMatches = (text = '') => extractXichengPoiMatchesFromImportPackage(text)

export const buildXichengWalkRoute = (pois = [], options = {}) => buildXichengWalkRouteFromImportPackage(pois, options)

export default {
	data() {
		const rawText = ''
		const matchedPois = extractXichengPoiMatches(rawText)
		return {
			region: XICHENG_REGION_CONFIG,
			rawText,
			imagePath: '',
			isLinkImporting: false,
			linkImportResult: null,
			inspirationImports: [],
			importPackage: createXichengInspirationImportPackage({ rawText, target: '' }),
			sourcePlatforms: [],
			unmatchedPlaceNames: [],
			matchedPois,
			route: buildXichengWalkRoute(matchedPois),
			target: ''
		}
	},
	computed: {
		isMapTarget() {
			return this.target === 'map'
		}
	},
	onLoad(options = {}) {
		this.target = options.target === 'map' ? 'map' : ''
		const sharedLink = decodeURIComponent(options.linkUrl || options.url || '')
		if (sharedLink) {
			this.rawText = sharedLink
			this.runExtraction()
		}
	},
	methods: {
		fillExample() {
			this.rawText = '白塔寺看建筑，历代帝王庙听礼制故事，最后去什刹海散步。'
			this.runExtraction()
		},
		async runExtraction() {
			const linkUrl = extractXichengPrimaryInspirationLink(this.rawText)
			if (linkUrl) {
				const imported = await this.importInspirationLink(linkUrl)
				if (imported) return
				if (this.isLinkOnlyInput(this.rawText)) return
			}
			this.refreshInspirationImportPackage()
		},
		isLinkOnlyInput(rawText = '') {
			return isXichengLinkOnlyInspirationInput(rawText)
		},
		async importInspirationLink(linkUrl = '') {
			this.isLinkImporting = true
			try {
				const linkImportResult = await requestXichengInspirationLinkImport({
					linkUrl,
					target: this.target
				})
				if (!linkImportResult.extractedText) {
					this.showInspirationLinkUnavailable()
					return false
				}
				this.linkImportResult = linkImportResult
				this.refreshInspirationImportPackage({ linkImportResult })
				return true
			} catch (error) {
				this.showInspirationLinkUnavailable(error)
				return false
			} finally {
				this.isLinkImporting = false
			}
		},
		refreshInspirationImportPackage({ includeImageOnly = false, linkImportResult = this.linkImportResult } = {}) {
			const effectiveRawText = linkImportResult && linkImportResult.extractedText
				? linkImportResult.extractedText
				: this.rawText
			this.importPackage = createXichengInspirationImportPackage({
				rawText: effectiveRawText,
				imagePath: this.imagePath,
				target: this.target,
				linkImportResult,
				includeImageOnly
			})
			this.matchedPois = this.importPackage.matchedPois
			this.sourcePlatforms = this.importPackage.sourcePlatforms
			this.unmatchedPlaceNames = this.importPackage.unmatchedPlaceNames
			this.route = this.importPackage.route
			return this.importPackage
		},
		confirmInspirationImagePurpose(actionLabel = '上传攻略图片') {
			return new Promise((resolve) => {
				uni.showModal({
					title: `${actionLabel}用途说明`,
					content: '图片仅用于本次西城灵感路线素材，不默认公开；系统只保存短摘和匹配结果，不保存第三方平台原文；不会用于模型评估或运营纠错，除非你另行授权。',
					confirmText: '继续',
					cancelText: '取消',
					success: (res) => resolve(Boolean(res.confirm)),
					fail: () => resolve(false)
				})
			})
		},
		showInspirationImageUnavailable() {
			uni.showToast({
				title: '未获得可用攻略图片，请重新选择',
				icon: 'none'
			})
		},
		showInspirationRouteUnavailable() {
			uni.showToast({
				title: '请先输入并匹配官方 POI',
				icon: 'none'
			})
		},
		showInspirationLinkUnavailable() {
			uni.showToast({
				title: '链接解析暂不可用，请换链接或稍后再试',
				icon: 'none'
			})
		},
		async chooseInspirationImage() {
			const confirmed = await this.confirmInspirationImagePurpose('上传攻略图片')
			if (!confirmed) return
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const filePath = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : ''
					if (!filePath) {
						this.showInspirationImageUnavailable()
						return
					}
					this.imagePath = filePath
					this.saveInspirationRoute({ silent: true, includeImageOnly: true })
				},
				fail: (err) => {
					if (isXunjingUserCancelled(err)) {
						return
					}
					this.showInspirationImageUnavailable()
				}
			})
		},
		saveInspirationRoute({ silent = false, includeImageOnly = false } = {}) {
			this.refreshInspirationImportPackage({ includeImageOnly })
			const importPackage = this.importPackage
			if (!includeImageOnly && importPackage.matchedPois.length === 0) {
				this.showInspirationRouteUnavailable()
				return false
			}
			const route = {
				...importPackage.route,
				rawTextExcerpt: importPackage.rawTextExcerpt || this.createInspirationTextExcerpt(this.rawText),
				imagePath: this.imagePath,
				regionCode: XICHENG_REGION_CONFIG.regionCode,
				packageCode: XICHENG_REGION_CONFIG.packageCode,
				sceneCode: XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: XICHENG_REGION_CONFIG.sourceChannel,
				sourceLabel: '一键抄作业导入',
				sourceUrl: importPackage.sourceUrl,
				sourceTitle: importPackage.sourceTitle,
				linkImported: importPackage.linkImported,
				sourcePlatforms: importPackage.sourcePlatforms,
				unmatchedPlaceNames: importPackage.unmatchedPlaceNames,
				updatedAt: new Date().toISOString()
			}
			importPackage.route = route
			const importRecord = this.createInspirationImportRecord(route, includeImageOnly)
			this.persistInspirationImportRecord(importRecord)
			const existingMaterials = uni.getStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey)
			const materials = Array.isArray(existingMaterials) ? existingMaterials : []
			const generatedMaterials = createXichengInspirationRouteMaterials(importPackage)
			if (!includeImageOnly) {
				uni.setStorageSync(XICHENG_REGION_CONFIG.inspirationStorageKey, route)
			}
			uni.setStorageSync(
				XICHENG_REGION_CONFIG.materialsStorageKey,
				mergeXichengOfficialRouteMaterials(generatedMaterials, materials).slice(0, 80)
			)
			if (!silent) {
				uni.showToast({
					title: this.isMapTarget ? '已生成到文旅地图' : '已加入路线护照',
					icon: 'none'
				})
				if (this.isMapTarget) {
					setTimeout(() => {
						uni.navigateBack({ delta: 1 })
					}, 450)
				}
			}
			return true
		},
		createInspirationTextExcerpt(text = '') {
			return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 80)
		},
		createInspirationImportRecord(route, includeImageOnly = false) {
			const importPackage = {
				...this.importPackage,
				route,
				includeImageOnly
			}
			return createXichengInspirationImportRecord(importPackage)
		},
		persistInspirationImportRecord(importRecord) {
			const existingImports = uni.getStorageSync(XICHENG_REGION_CONFIG.inspirationImportStorageKey)
			const imports = Array.isArray(existingImports) ? existingImports : []
			this.inspirationImports = [
				importRecord,
				...imports
			].slice(0, 20)
			uni.setStorageSync(XICHENG_REGION_CONFIG.inspirationImportStorageKey, this.inspirationImports)
		},
		openTravelogue() {
			const saved = this.saveInspirationRoute({ silent: true })
			if (!saved) return
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?mode=route&regionCode=${encodeRouteValue(this.region.regionCode)}&packageCode=${encodeRouteValue(this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.region.sourceChannel)}&companionName=${encodeRouteValue(this.region.companionName)}`
			})
		}
	}
}
</script>

<style scoped>
.xicheng-inspiration {
	min-height: 100vh;
	padding: 36rpx 28rpx 56rpx;
	box-sizing: border-box;
	color: #102F29;
}

.xicheng-inspiration-shell {
	position: relative;
}

.hero,
.section-card {
	border: 1rpx solid rgba(255, 255, 255, 0.78);
	border-radius: 34rpx;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(250, 246, 237, 0.88));
	box-shadow: 0 18rpx 46rpx rgba(28, 35, 32, 0.10);
	overflow: hidden;
}

.hero {
	padding: 36rpx 32rpx;
}

.inspiration-hero-main {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
}

.inspiration-hero-copy {
	flex: 1;
	min-width: 0;
}

.inspiration-companion {
	width: 228rpx;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.inspiration-companion-avatar {
	width: 208rpx;
	height: 268rpx;
	border-radius: 30rpx;
	background: #E7EFE8;
}

.inspiration-companion-bubble {
	width: 100%;
	margin-top: 14rpx;
	padding: 14rpx 12rpx;
	border-radius: 26rpx;
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
	color: #173F35;
}

.companion-line {
	margin-top: 4rpx;
	font-size: 22rpx;
	line-height: 1.4;
	color: #746F68;
}

.eyebrow,
.subtitle,
.empty-copy,
.poi-meta,
.route-desc,
.upload-desc {
	display: block;
	font-size: 24rpx;
	line-height: 1.6;
	color: #667085;
}

.title {
	display: block;
	margin-top: 12rpx;
	font-size: 44rpx;
	font-weight: 700;
	color: #102F29;
}

.subtitle {
	margin-top: 14rpx;
}

.section-card {
	margin-top: 24rpx;
	padding: 30rpx;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.section-title {
	display: flex;
	align-items: center;
	gap: 12rpx;
	font-size: 30rpx;
	font-weight: 700;
	color: #102F29;
}

.section-title::before {
	content: '';
	width: 8rpx;
	height: 34rpx;
	border-radius: 999rpx;
	background: #B5945E;
}

.section-badge,
.poi-status {
	flex-shrink: 0;
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.12);
	font-size: 22rpx;
	color: #173F35;
}

.tiny-button {
	width: 108rpx;
	height: 56rpx;
	line-height: 56rpx;
	border-radius: 18rpx;
	background: rgba(255, 252, 246, 0.86);
	font-size: 22rpx;
	color: #173F35;
}

.input-area {
	width: 100%;
	min-height: 260rpx;
	margin-top: 20rpx;
	padding: 22rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.14);
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.84);
	box-sizing: border-box;
	font-size: 26rpx;
	line-height: 1.7;
	color: #1F2933;
}

.upload-row,
.poi-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	margin-top: 18rpx;
	padding: 20rpx;
	border: 1rpx solid rgba(181, 148, 94, 0.14);
	border-radius: 24rpx;
	background: rgba(255, 252, 246, 0.76);
}

.upload-title,
.poi-title,
.route-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: #1F2933;
}

.route-title {
	margin-top: 18rpx;
}

.route-desc {
	margin-top: 10rpx;
}

.route-steps {
	margin-top: 18rpx;
}

.route-stop {
	display: block;
	margin-top: 12rpx;
	padding: 18rpx;
	border-radius: 22rpx;
	background: rgba(255, 252, 246, 0.82);
	font-size: 26rpx;
	color: #344054;
}

.action-row {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 24rpx;
}

.primary-button,
.ghost-button {
	height: 84rpx;
	line-height: 84rpx;
	border-radius: 28rpx;
	font-size: 28rpx;
}

.primary-button {
	margin-top: 22rpx;
	background: #1F6E5A;
	color: #FFFFFF;
}

.ghost-button {
	background: #E8ECE7;
	color: #1F6E5A;
}

.xicheng-inspiration-actions .primary-button {
	margin-top: 0;
}
</style>
