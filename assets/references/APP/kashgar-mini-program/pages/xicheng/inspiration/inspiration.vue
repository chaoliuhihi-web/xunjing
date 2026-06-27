<template>
	<view class="inspiration-page">
		<view class="hero">
			<text class="eyebrow">导入灵感</text>
			<text class="title">一键抄作业</text>
			<text class="subtitle">把小红书、公众号、图片或文字里的地点线索转成西城可走路线。</text>
			<text class="notice">首版只做 AI 提取地点、匹配官方 POI 和生成可走路线，不抓取第三方平台原文，不复制小红书、公众号正文和图片。</text>
		</view>

		<view class="source-tabs">
			<view
				v-for="source in sourceTypes"
				:key="source"
				:class="['source-tab', sourceType === source ? 'source-active' : '']"
				@click="sourceType = source"
			>
				{{ source }}
			</view>
		</view>

		<view class="input-card">
			<textarea
				v-model="inputText"
				class="inspiration-input"
				maxlength="800"
				placeholder="粘贴攻略文字、地点清单或自己的游玩想法，例如：白塔寺、历代帝王庙、什刹海，想带孩子慢慢走。"
			/>
			<view class="input-actions">
				<button class="ghost-button" @click="chooseInspirationImage">选择图片</button>
				<button class="primary-button" :disabled="loading" @click="runImport">AI 提取地点</button>
			</view>
			<text v-if="imageMeta.path" class="image-line">已选择图片：{{ imageMeta.name }}</text>
		</view>

		<view v-if="extractedPlaces.length" class="section-card">
			<view class="section-head">
				<text class="section-title">AI 提取地点</text>
				<text class="section-status">{{ extractedPlaces.length }} 个线索</text>
			</view>
			<view class="tag-row">
				<text v-for="place in extractedPlaces" :key="place" class="place-tag">{{ place }}</text>
			</view>
		</view>

		<view v-if="matchedPois.length" class="section-card">
			<view class="section-head">
				<text class="section-title">匹配官方 POI</text>
				<text class="section-status">确认后生成路线</text>
			</view>
			<view
				v-for="poi in matchedPois"
				:key="poi.poiCode"
				class="poi-row"
				@click="togglePoi(poi.poiCode)"
			>
				<view>
					<text class="poi-title">{{ poi.poiName }}</text>
					<text class="poi-desc">{{ poi.poiCode }} · 可信度 {{ Math.round((poi.confidence || 0) * 100) }}%</text>
				</view>
				<text :class="['confirm-pill', poi.confirmed ? 'confirmed' : '']">{{ poi.confirmed ? '已确认' : '待确认' }}</text>
			</view>
			<view class="route-actions">
				<button class="ghost-button" :disabled="loading" @click="confirmPois">确认 POI</button>
				<button class="primary-button" :disabled="loading" @click="generateRoute">生成可走路线</button>
			</view>
		</view>

		<view v-if="generatedRoute.routeId" class="section-card">
			<text class="section-title">{{ generatedRoute.title }}</text>
			<text class="route-desc">{{ generatedRoute.subtitle }}</text>
			<button class="bottom-button" @click="openGeneratedRoute">进入路线</button>
		</view>

		<view v-if="lastError" class="error-line">{{ lastError }}</view>
	</view>
</template>

<script>
import {
	XICHENG_INSPIRATION_IMPORT_CONFIG
} from '@/config/regions/xicheng.js'
import {
	confirmXichengInspirationPois,
	generateXichengInspirationRoute,
	importXichengInspiration
} from '@/request/xunjing/inspiration.js'

const DEFAULT_TEXT = '白塔寺、历代帝王庙、什刹海，想做一条适合亲子研学的西城 Citywalk。'

export default {
	data() {
		return {
			sourceTypes: XICHENG_INSPIRATION_IMPORT_CONFIG.supportedSources,
			sourceType: '文字',
			inputText: DEFAULT_TEXT,
			imageMeta: {},
			importResult: {},
			extractedPlaces: [],
			matchedPois: [
				{
					poiCode: '',
					poiName: '',
					confidence: 0,
					confirmed: false
				}
			],
			confirmedPois: [],
			generatedRoute: {},
			loading: false,
			lastError: ''
		}
	},
	created() {
		this.matchedPois = []
	},
	methods: {
		chooseInspirationImage() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const filePath = res.tempFilePaths && res.tempFilePaths[0] ? res.tempFilePaths[0] : ''
					if (!filePath) return
					this.sourceType = '图片'
					this.imageMeta = {
						path: filePath,
						name: filePath.split('/').pop() || '攻略图片',
						sourceType: '图片'
					}
				}
			})
		},
		async runImport() {
			if (this.loading) return
			this.loading = true
			this.lastError = ''
			try {
				const result = await importXichengInspiration({
					inputText: this.inputText,
					sourceType: this.sourceType,
					imageMeta: this.imageMeta.path ? this.imageMeta : null
				})
				this.importResult = result
				this.extractedPlaces = result.extractedPlaces || []
				this.matchedPois = (result.matchedPois || []).map(poi => ({
					...poi,
					confirmed: poi.confirmed !== false
				}))
				if (!this.matchedPois.length) {
					this.lastError = '暂未匹配到西城官方 POI，请补充白塔寺、历代帝王庙、什刹海等地点线索。'
				}
			} catch (error) {
				this.lastError = error && (error.errMsg || error.message) ? (error.errMsg || error.message) : '导入失败'
			} finally {
				this.loading = false
			}
		},
		togglePoi(poiCode = '') {
			this.matchedPois = this.matchedPois.map(poi => poi.poiCode === poiCode
				? { ...poi, confirmed: !poi.confirmed }
				: poi)
		},
		async confirmPois() {
			if (this.loading) return []
			const selectedPois = this.matchedPois.filter(poi => poi.confirmed)
			if (!selectedPois.length) {
				this.lastError = '请至少确认一个官方 POI。'
				return []
			}
			this.loading = true
			this.lastError = ''
			try {
				const result = await confirmXichengInspirationPois({
					inspirationId: this.importResult.inspirationId,
					matchedPois: selectedPois
				})
				this.confirmedPois = result.confirmedPois || selectedPois
				return this.confirmedPois
			} catch (error) {
				this.lastError = error && (error.errMsg || error.message) ? (error.errMsg || error.message) : '确认失败'
				return []
			} finally {
				this.loading = false
			}
		},
		async generateRoute() {
			if (this.loading) return
			let pois = this.confirmedPois
			if (!pois.length) {
				pois = await this.confirmPois()
			}
			if (!pois.length) return
			this.loading = true
			this.lastError = ''
			try {
				this.generatedRoute = await generateXichengInspirationRoute({
					inspirationId: this.importResult.inspirationId,
					confirmedPois: pois
				})
				this.openGeneratedRoute()
			} catch (error) {
				this.lastError = error && (error.errMsg || error.message) ? (error.errMsg || error.message) : '路线生成失败'
			} finally {
				this.loading = false
			}
		},
		openGeneratedRoute() {
			if (!this.generatedRoute.routeId) return
			uni.navigateTo({
				url: `/pages/xicheng/route-detail/route-detail?routeId=${encodeURIComponent(this.generatedRoute.routeId)}&source=inspiration`
			})
		}
	}
}
</script>

<style scoped>
.inspiration-page {
	min-height: 100vh;
	padding: 36rpx 28rpx 48rpx;
	box-sizing: border-box;
	background: #F7F5EE;
	color: #172B4D;
}

.hero,
.input-card,
.section-card {
	padding: 30rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	box-shadow: 0 12rpx 36rpx rgba(31, 41, 51, 0.08);
}

.eyebrow,
.subtitle,
.notice,
.image-line,
.poi-desc,
.route-desc,
.error-line {
	display: block;
	font-size: 24rpx;
	line-height: 1.6;
	color: #667085;
}

.title {
	display: block;
	margin-top: 10rpx;
	font-size: 42rpx;
	font-weight: 700;
}

.subtitle,
.notice {
	margin-top: 12rpx;
}

.notice {
	color: #8A4B12;
}

.source-tabs {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 12rpx;
	margin-top: 24rpx;
}

.source-tab {
	min-height: 68rpx;
	padding: 14rpx 8rpx;
	border-radius: 8rpx;
	background: #EEF5F1;
	color: #1F6E5A;
	font-size: 24rpx;
	text-align: center;
	box-sizing: border-box;
}

.source-active {
	background: #1F6E5A;
	color: #FFFFFF;
}

.input-card,
.section-card {
	margin-top: 24rpx;
}

.inspiration-input {
	width: 100%;
	min-height: 220rpx;
	padding: 20rpx;
	border-radius: 8rpx;
	background: #F2F4F7;
	box-sizing: border-box;
	font-size: 26rpx;
	line-height: 1.5;
}

.input-actions,
.route-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	margin-top: 20rpx;
}

.primary-button,
.ghost-button,
.bottom-button {
	height: 76rpx;
	line-height: 76rpx;
	border-radius: 8rpx;
	font-size: 24rpx;
}

.primary-button,
.bottom-button {
	background: #1F6E5A;
	color: #FFFFFF;
}

.ghost-button {
	background: #EEF5F1;
	color: #1F6E5A;
}

.image-line {
	margin-top: 14rpx;
}

.section-head,
.poi-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
}

.section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
}

.section-status {
	font-size: 24rpx;
	color: #1F6E5A;
}

.tag-row {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 18rpx;
}

.place-tag,
.confirm-pill {
	padding: 10rpx 16rpx;
	border-radius: 8rpx;
	background: #EEF5F1;
	font-size: 24rpx;
	color: #1F6E5A;
}

.poi-row {
	margin-top: 18rpx;
	padding-top: 18rpx;
	border-top: 1px solid #E4E7EC;
}

.poi-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
}

.confirm-pill {
	min-width: 100rpx;
	text-align: center;
	background: #F2F4F7;
	color: #667085;
}

.confirmed {
	background: #EEF5F1;
	color: #1F6E5A;
}

.route-desc {
	margin-top: 12rpx;
}

.bottom-button {
	margin-top: 22rpx;
	width: 100%;
}

.error-line {
	margin-top: 24rpx;
	color: #B42318;
}
</style>
