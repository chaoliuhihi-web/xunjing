<template>
	<view class="xicheng-recording xicheng-designed-page xicheng-bottom-safe">
		<view class="record-nav">
			<button class="nav-icon" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="24" />
			</button>
			<text class="nav-title">记录中</text>
			<button class="nav-icon pause-icon" @click="toggleRecordingStatus">
				<xicheng-icon
					:name="recordingSession.status === 'paused' ? 'resume' : 'record'"
					variant="primary"
					:size="20"
				/>
			</button>
		</view>

		<view class="record-map-card xicheng-paper-card">
			<view class="map-grid"></view>
			<view class="map-water"></view>
			<view class="record-route-line"></view>
			<view class="record-map-card">
				<xicheng-icon class="route-mini-icon" name="route" variant="primary" :size="22" />
				<text class="record-map-title">{{ recordMapCard.title }}</text>
				<view class="record-stat-row">
					<text class="stat-label">已用时</text>
					<text class="stat-value">{{ elapsedMinutes }}</text>
					<text class="stat-unit">分钟</text>
				</view>
				<view class="record-stat-row">
					<text class="stat-label">已走距离</text>
					<text class="stat-value">{{ distanceKilometers }}</text>
					<text class="stat-unit">km</text>
				</view>
				<view class="record-stat-row">
					<text class="stat-label">完成进度</text>
					<text class="stat-value">{{ completedStopCount }}</text>
					<text class="stat-unit">/ {{ routeStopCards.length }}</text>
				</view>
			</view>
			<view
				v-for="(stop, index) in routeStopCards"
				:key="`${stop.poiCode}-${index}`"
				class="map-stop"
				:class="[`map-stop-${index}`, isStopCompleted(stop) ? 'map-stop-done' : '', nextStop && nextStop.poiCode === stop.poiCode ? 'map-stop-active' : '']"
			>
				<text class="map-stop-dot">{{ index + 1 }}</text>
				<text class="map-stop-label">{{ stop.poiName }}</text>
			</view>
			<view class="map-tools">
				<button class="map-tool-button">
					<xicheng-icon name="location" variant="plain" :size="19" />
				</button>
				<button class="map-tool-button">
					<xicheng-icon name="layer" variant="plain" :size="19" />
				</button>
			</view>
		</view>

		<view class="next-stop-card xicheng-paper-card">
			<image
				v-if="nextStopImage"
				class="next-stop-image"
				:src="nextStopImage"
				mode="aspectFill"
			/>
			<view class="next-stop-copy">
				<text class="next-stop-kicker">下一站</text>
				<text class="next-stop-title">{{ nextStop ? nextStop.poiName : '路线已完成' }}</text>
				<text class="next-stop-meta">{{ nextStop ? nextStop.walkText || nextStop.durationText : '可以生成游记草稿' }}</text>
				<text class="next-stop-address">{{ recordMapCard.address }}</text>
			</view>
			<button class="checkin-button xicheng-primary-action" :disabled="!nextStop" @click="arriveAtNextStop">到达打卡</button>
		</view>

		<view class="study-task-card xicheng-paper-card">
			<view class="study-task-head">
				<xicheng-icon class="study-task-icon" name="study" variant="primary" :size="22" />
				<text class="study-task-title">亲子研学任务</text>
				<text class="study-task-progress">{{ studyTaskDoneCount }} / {{ studyTasks.length }}</text>
			</view>
			<text class="study-task-desc">{{ currentStudyTask }}</text>
		</view>

		<view class="record-bottom-actions xicheng-paper-card">
			<button class="bottom-action xicheng-secondary-action" @click="toggleRecordingStatus">
				{{ recordingSession.status === 'paused' ? '继续记录' : '暂停记录' }}
			</button>
			<button class="bottom-action xicheng-secondary-action" :disabled="!nextStop" @click="askXiaojingForNextStop">问小京</button>
			<button class="bottom-action xicheng-primary-action" @click="generateTravelogue">生成游记</button>
		</view>

		<text class="foreground-tip">为保证定位准确，请保持 APP 在前台运行</text>
	</view>
</template>

<script>
import {
	XICHENG_RECOMMENDED_ROUTES,
	XICHENG_REGION_CONFIG,
	normalizeXichengRouteCode
} from '@/config/regions/xicheng.js'
import { createXichengOfficialPoiSources } from '@/request/xunjing/officialPoi.js'
import { decodeXichengRouteValue, createXichengRouteOutputValue } from '@/request/xunjing/routeParams.js'

const XICHENG_HOME_ROUTE = '/pages/xicheng/home/home'
const encodeRouteValue = (value = '') => createXichengRouteOutputValue(value, { platform: process.env.UNI_PLATFORM })

const normalizeRecordingOptions = (options = {}) => ({
	routeCode: normalizeXichengRouteCode(decodeXichengRouteValue(options.routeCode || options.routeId)),
	regionCode: decodeXichengRouteValue(options.regionCode),
	packageCode: decodeXichengRouteValue(options.packageCode),
	sceneCode: decodeXichengRouteValue(options.sceneCode),
	sourceChannel: decodeXichengRouteValue(options.sourceChannel),
	companionName: decodeXichengRouteValue(options.companionName),
	autoStart: decodeXichengRouteValue(options.autoStart)
})

const resolveRouteByCode = (routeCode = '') => {
	const normalizedRouteCode = normalizeXichengRouteCode(routeCode)
	const route = XICHENG_RECOMMENDED_ROUTES.find(item => item.routeCode === normalizedRouteCode)
	return route || XICHENG_RECOMMENDED_ROUTES[0]
}

const createEmptyRecordingSession = () => ({
	sessionId: '',
	routeCode: '',
	routeTitle: '',
	status: 'idle',
	startedAt: '',
	pausedAt: '',
	resumedAt: '',
	finishedAt: '',
	currentStopIndex: 0,
	completedStopPoiCodes: [],
	trackPoints: [],
	checkinCount: 0,
	updatedAt: ''
})

export default {
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			routeOptions: normalizeRecordingOptions(),
			activeRoute: resolveRouteByCode(),
			recordingSession: createEmptyRecordingSession()
		}
	},
	computed: {
		routeStopCards() {
			return Array.isArray(this.activeRoute.stops) ? this.activeRoute.stops : []
		},
		recordMapCard() {
			return {
				title: this.getShortRouteTitle(this.activeRoute.title || '西城文化线'),
				address: this.nextStop ? '西城区阜成门内大街' : '今日路线已完成'
			}
		},
		completedStopCount() {
			return Array.isArray(this.recordingSession.completedStopPoiCodes)
				? this.recordingSession.completedStopPoiCodes.length
				: 0
		},
		nextStop() {
			const completed = new Set(this.recordingSession.completedStopPoiCodes || [])
			return this.routeStopCards.find(stop => stop && stop.poiCode && !completed.has(stop.poiCode)) || null
		},
		elapsedMinutes() {
			if (!this.recordingSession.startedAt) return 0
			const startTime = new Date(this.recordingSession.startedAt).getTime()
			const elapsed = Math.max(1, Math.round((Date.now() - startTime) / 60000))
			return elapsed
		},
		distanceKilometers() {
			const stopDistance = this.completedStopCount * 0.9
			return Math.max(0.3, stopDistance).toFixed(1)
		},
		nextStopImage() {
			const thumbnails = this.region.visualAssets && this.region.visualAssets.routeThumbnails
				? this.region.visualAssets.routeThumbnails
				: {}
			return thumbnails[this.activeRoute.routeCode] || this.region.visualAssets.heroLandmark || ''
		},
		studyTasks() {
			return this.region.parentChildTasks || []
		},
		studyTaskDoneCount() {
			return Math.min(this.completedStopCount, this.studyTasks.length)
		},
		currentStudyTask() {
			return this.studyTasks[this.studyTaskDoneCount] || '完成路线后生成亲子研学报告。'
		}
	},
	onLoad(options = {}) {
		this.routeOptions = normalizeRecordingOptions(options)
		this.activeRoute = resolveRouteByCode(this.routeOptions.routeCode)
		this.restoreRecordingSession()
		if (this.routeOptions.autoStart === '1') {
			this.ensureRecordingSession()
		}
	},
	methods: {
		goBack() {
			const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
			if (!Array.isArray(pages) || pages.length <= 1) {
				uni.reLaunch({ url: XICHENG_HOME_ROUTE })
				return
			}
			uni.navigateBack({
				delta: 1,
				fail: () => uni.reLaunch({ url: XICHENG_HOME_ROUTE })
			})
		},
		getShortRouteTitle(title = '') {
			if (title.includes('白塔寺')) return '白塔寺文化线'
			if (title.includes('北海')) return '什刹海水岸线'
			if (title.includes('大栅栏')) return '胡同烟火线'
			return title || '西城文化线'
		},
		restoreRecordingSession() {
			const storedSession = uni.getStorageSync(XICHENG_REGION_CONFIG.recordingStorageKey)
			if (
				storedSession
				&& storedSession.routeCode === this.activeRoute.routeCode
				&& ['recording', 'paused', 'finished'].includes(storedSession.status)
			) {
				this.recordingSession = {
					...createEmptyRecordingSession(),
					...storedSession,
					completedStopPoiCodes: Array.isArray(storedSession.completedStopPoiCodes)
						? storedSession.completedStopPoiCodes
						: [],
					trackPoints: Array.isArray(storedSession.trackPoints) ? storedSession.trackPoints : []
				}
			}
		},
		ensureRecordingSession() {
			if (['recording', 'paused'].includes(this.recordingSession.status)) return
			const startedAt = new Date().toISOString()
			this.recordingSession = {
				sessionId: `recording-${Date.now()}`,
				routeCode: this.activeRoute.routeCode,
				routeTitle: this.activeRoute.title,
				status: 'recording',
				startedAt: startedAt,
				pausedAt: '',
				resumedAt: '',
				finishedAt: '',
				currentStopIndex: 0,
				completedStopPoiCodes: [],
				trackPoints: [],
				checkinCount: 0,
				updatedAt: startedAt
			}
			this.captureForegroundTrackPoint('start')
			this.saveRecordingSession()
		},
		saveRecordingSession() {
			uni.setStorageSync(XICHENG_REGION_CONFIG.recordingStorageKey, this.recordingSession)
		},
		captureForegroundTrackPoint(pointType = 'manual') {
			const capturedAt = new Date().toISOString()
			this.recordingSession.trackPoints = [
				...(this.recordingSession.trackPoints || []),
				{
					pointType,
					recordedAt: capturedAt,
					capturedAt,
					appState: 'foreground',
					syncStatus: 'local_pending',
					routeCode: this.activeRoute.routeCode
				}
			].slice(-80)
			this.recordingSession.updatedAt = capturedAt
		},
		pauseRecordingSession() {
			if (this.recordingSession.status !== 'recording') return
			this.recordingSession = {
				...this.recordingSession,
				status: 'paused',
				pausedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			}
			this.saveRecordingSession()
		},
		resumeRecordingSession() {
			if (this.recordingSession.status !== 'paused') return
			this.recordingSession = {
				...this.recordingSession,
				status: 'recording',
				resumedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			}
			this.captureForegroundTrackPoint('resume')
			this.saveRecordingSession()
		},
		toggleRecordingStatus() {
			if (this.recordingSession.status === 'paused') {
				this.resumeRecordingSession()
				return
			}
			this.pauseRecordingSession()
		},
		isStopCompleted(stop = {}) {
			return (this.recordingSession.completedStopPoiCodes || []).includes(stop.poiCode)
		},
		arriveAtNextStop() {
			const stop = this.nextStop
			if (!stop) {
				uni.showToast({ title: '路线已完成', icon: 'none' })
				return
			}
			this.ensureRecordingSession()
			const completedStopPoiCodes = new Set(this.recordingSession.completedStopPoiCodes || [])
			completedStopPoiCodes.add(stop.poiCode)
			this.recordingSession.completedStopPoiCodes = Array.from(completedStopPoiCodes)
			this.recordingSession.currentStopIndex = this.recordingSession.completedStopPoiCodes.length
			this.recordingSession.checkinCount = this.recordingSession.completedStopPoiCodes.length
			this.captureForegroundTrackPoint('checkin')
			const checkinEvent = this.createRouteCheckinEvent(stop)
			this.persistRouteCheckinEvent(checkinEvent)
			this.persistStopMaterial(stop, checkinEvent)
			this.saveRecordingSession()
			uni.showToast({ title: '打卡已记录', icon: 'none' })
		},
		createRouteCheckinEvent(stop = {}) {
			const sources = createXichengOfficialPoiSources(stop)
			const checkedInAt = new Date().toISOString()
			return {
				checkinId: `route-stop-${Date.now()}`,
				checkinType: 'route-stop',
				checkinLabel: '路线到达打卡',
				regionCode: this.routeOptions.regionCode || this.region.regionCode,
				packageCode: this.routeOptions.packageCode || this.region.packageCode,
				sceneCode: this.routeOptions.sceneCode || this.region.sceneCode,
				sourceChannel: this.routeOptions.sourceChannel || this.region.sourceChannel,
				routeCode: this.activeRoute.routeCode,
				routeTitle: this.activeRoute.title,
				sessionId: this.recordingSession.sessionId,
				poiCode: stop.poiCode,
				poiName: stop.poiName,
				sources,
				sourceCount: sources.length,
				reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
				publishStatus: 'private',
				checkedInAt
			}
		},
		persistRouteCheckinEvent(checkinEvent) {
			const existingCheckins = uni.getStorageSync(XICHENG_REGION_CONFIG.checkinStorageKey)
			const checkins = Array.isArray(existingCheckins) ? existingCheckins : []
			uni.setStorageSync(XICHENG_REGION_CONFIG.checkinStorageKey, [
				checkinEvent,
				...checkins
			].slice(0, 80))
		},
		persistStopMaterial(stop = {}, checkinEvent = {}) {
			const existingMaterials = uni.getStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey)
			const materials = Array.isArray(existingMaterials) ? existingMaterials : []
			const sources = createXichengOfficialPoiSources(stop)
			uni.setStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey, [
				{
					type: 'route-recording-checkin',
					regionCode: checkinEvent.regionCode,
					packageCode: checkinEvent.packageCode,
					sceneCode: checkinEvent.sceneCode,
					sourceChannel: checkinEvent.sourceChannel,
					routeCode: this.activeRoute.routeCode,
					routeTitle: this.activeRoute.title,
					sessionId: this.recordingSession.sessionId,
					poiCode: stop.poiCode,
					poiName: stop.poiName,
					sourceLabel: '路线记录打卡',
					sources,
					sourceCount: sources.length,
					reviewStatus: XICHENG_REGION_CONFIG.reviewStatus.pending,
					publishStatus: 'private',
					capturedAt: checkinEvent.checkedInAt
				},
				...materials
			].slice(0, 80))
		},
		persistStopGuideContext(stop = {}, question = '') {
			const sources = createXichengOfficialPoiSources(stop)
			uni.setStorageSync(this.region.storageKey, {
				regionCode: this.routeOptions.regionCode || this.region.regionCode,
				packageCode: this.routeOptions.packageCode || this.region.packageCode,
				sceneCode: this.region.aiSceneCode || this.routeOptions.sceneCode || this.region.sceneCode,
				sourceChannel: this.routeOptions.sourceChannel || this.region.sourceChannel,
				poiCode: stop.poiCode,
				poiName: stop.poiName,
				confidence: 1,
				sourceLabel: '路线记录打卡',
				officialPoiMatched: true,
				routeCode: this.activeRoute.routeCode,
				routeTitle: this.activeRoute.title,
				sources,
				sourceCount: sources.length,
				suggestedQuestions: question ? [question] : [],
				safetyStatus: 'PASSED',
				capturedAt: new Date().toISOString()
			})
		},
		askXiaojingForNextStop() {
			const stop = this.nextStop
			if (!stop) return
			const question = stop.guidePrompt || `讲讲${stop.poiName}`
			this.persistStopGuideContext(stop, question)
			uni.navigateTo({
				url: `/pages/ai-guide/ai-guide?question=${encodeRouteValue(question)}&regionCode=${encodeRouteValue(this.routeOptions.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(this.routeOptions.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(this.region.aiSceneCode || this.routeOptions.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.routeOptions.sourceChannel || this.region.sourceChannel)}&poiCode=${encodeRouteValue(stop.poiCode || '')}&poiName=${encodeRouteValue(stop.poiName || '')}&safetyStatus=${encodeRouteValue('PASSED')}&companionName=${encodeRouteValue(this.routeOptions.companionName || this.region.companionName)}`
			})
		},
		generateTravelogue() {
			this.saveRecordingSession()
			uni.navigateTo({
				url: `/pages/xicheng/travelogue/travelogue?mode=record&routeCode=${encodeRouteValue(this.activeRoute.routeCode || '')}&regionCode=${encodeRouteValue(this.routeOptions.regionCode || this.region.regionCode)}&packageCode=${encodeRouteValue(this.routeOptions.packageCode || this.region.packageCode)}&sceneCode=${encodeRouteValue(this.routeOptions.sceneCode || this.region.sceneCode)}&sourceChannel=${encodeRouteValue(this.routeOptions.sourceChannel || this.region.sourceChannel)}&companionName=${encodeRouteValue(this.routeOptions.companionName || this.region.companionName)}`
			})
		}
	}
}
</script>

<style scoped>
.xicheng-recording {
	min-height: 100vh;
	padding: 34rpx 28rpx 48rpx;
	box-sizing: border-box;
	color: #102F29;
}

.record-nav {
	display: grid;
	grid-template-columns: 76rpx 1fr 76rpx;
	align-items: center;
	gap: 18rpx;
	margin-bottom: 24rpx;
}

.nav-icon {
	width: 76rpx;
	height: 76rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.9);
	color: #173F35;
	font-size: 34rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	box-shadow: 0 12rpx 30rpx rgba(35, 42, 34, 0.08);
}

.pause-icon {
	background: #173F35;
	color: #FFF9EC;
	font-size: 28rpx;
}

.nav-title {
	text-align: center;
	font-size: 38rpx;
	font-weight: 700;
	color: #173F35;
}

.record-map-card {
	position: relative;
	min-height: 720rpx;
	border-radius: 34rpx;
	overflow: hidden;
	background:
		linear-gradient(90deg, rgba(198, 207, 188, 0.14) 1px, transparent 1px),
		linear-gradient(0deg, rgba(198, 207, 188, 0.14) 1px, transparent 1px),
		linear-gradient(180deg, #F8F2E7 0%, #F3ECD9 100%);
	background-size: 84rpx 84rpx, 84rpx 84rpx, auto;
}

.map-grid,
.map-water,
.record-route-line {
	position: absolute;
	pointer-events: none;
}

.map-grid {
	inset: 0;
	background:
		linear-gradient(118deg, transparent 0 43%, rgba(219, 210, 189, 0.42) 43% 44%, transparent 44%),
		linear-gradient(28deg, transparent 0 56%, rgba(219, 210, 189, 0.42) 56% 57%, transparent 57%);
	opacity: 0.72;
}

.map-water {
	right: 26rpx;
	top: 34rpx;
	width: 238rpx;
	height: 260rpx;
	border-radius: 45% 55% 48% 52%;
	background: rgba(159, 199, 203, 0.34);
}

.record-route-line {
	left: 146rpx;
	right: 142rpx;
	top: 386rpx;
	height: 180rpx;
	border-left: 16rpx solid #173F35;
	border-bottom: 16rpx solid #173F35;
	border-radius: 0 0 0 90rpx;
	transform: skewY(-18deg);
}

.record-map-card .record-map-card {
	left: 30rpx;
	top: 34rpx;
	width: 258rpx;
	min-height: 260rpx;
	padding: 24rpx;
	border-radius: 28rpx;
	background: rgba(255, 252, 246, 0.94);
	box-shadow: 0 18rpx 48rpx rgba(35, 42, 34, 0.12);
	box-sizing: border-box;
}

.route-mini-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 56rpx;
	height: 56rpx;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF9EC;
	font-size: 24rpx;
	font-weight: 700;
}

.record-map-title {
	display: block;
	margin: 18rpx 0;
	padding-bottom: 16rpx;
	border-bottom: 1rpx solid rgba(23, 63, 53, 0.12);
	font-size: 31rpx;
	line-height: 1.3;
	font-weight: 700;
	color: #102F29;
}

.record-stat-row {
	display: grid;
	grid-template-columns: 1fr auto auto;
	align-items: baseline;
	gap: 8rpx;
	margin-top: 18rpx;
}

.stat-label {
	font-size: 24rpx;
	color: #746F68;
}

.stat-value {
	font-size: 38rpx;
	font-weight: 700;
	color: #102F29;
}

.stat-unit {
	font-size: 22rpx;
	color: #746F68;
}

.map-stop {
	position: absolute;
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.map-stop-0 {
	left: 82rpx;
	bottom: 96rpx;
}

.map-stop-1 {
	left: 330rpx;
	bottom: 230rpx;
}

.map-stop-2 {
	right: 82rpx;
	top: 190rpx;
}

.map-stop-dot {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48rpx;
	height: 48rpx;
	border: 8rpx solid rgba(255, 252, 246, 0.88);
	border-radius: 999rpx;
	background: #B5945E;
	color: #FFF9EC;
	font-size: 22rpx;
	font-weight: 700;
	box-shadow: 0 10rpx 24rpx rgba(35, 42, 34, 0.18);
}

.map-stop-label {
	padding: 9rpx 18rpx;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF9EC;
	font-size: 24rpx;
	white-space: nowrap;
}

.map-stop-done .map-stop-dot {
	background: #173F35;
}

.map-stop-active .map-stop-dot {
	background: #B5945E;
}

.map-tools {
	position: absolute;
	right: 26rpx;
	bottom: 130rpx;
	display: grid;
	gap: 18rpx;
}

.map-tool-button {
	width: 82rpx;
	min-height: 82rpx;
	border-radius: 999rpx;
	background: rgba(255, 252, 246, 0.92);
	color: #173F35;
	font-size: 23rpx;
	padding: 0;
	box-shadow: 0 12rpx 30rpx rgba(35, 42, 34, 0.1);
}

.next-stop-card {
	display: grid;
	grid-template-columns: 228rpx 1fr;
	gap: 24rpx;
	margin-top: 28rpx;
	padding: 24rpx;
	border-radius: 34rpx;
}

.next-stop-image {
	width: 228rpx;
	height: 188rpx;
	border-radius: 24rpx;
	object-fit: cover;
	background: #E4E9E1;
}

.next-stop-copy {
	min-width: 0;
}

.next-stop-kicker,
.next-stop-title,
.next-stop-meta,
.next-stop-address {
	display: block;
}

.next-stop-kicker {
	font-size: 25rpx;
	color: #8A6B3D;
}

.next-stop-title {
	margin-top: 6rpx;
	font-size: 39rpx;
	line-height: 1.24;
	font-weight: 700;
	color: #102F29;
}

.next-stop-meta,
.next-stop-address {
	margin-top: 12rpx;
	font-size: 25rpx;
	line-height: 1.45;
	color: #746F68;
}

.checkin-button {
	grid-column: 1 / 3;
	width: 100%;
	min-height: 94rpx;
	border-radius: 999rpx;
	font-size: 32rpx;
	font-weight: 700;
}

.study-task-card {
	margin-top: 28rpx;
	padding: 28rpx;
	border-radius: 32rpx;
}

.study-task-head {
	display: grid;
	grid-template-columns: 58rpx 1fr auto;
	align-items: center;
	gap: 16rpx;
}

.study-task-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 58rpx;
	height: 58rpx;
	border-radius: 999rpx;
	background: #173F35;
	color: #FFF9EC;
	font-size: 24rpx;
	font-weight: 700;
}

.study-task-title {
	font-size: 31rpx;
	font-weight: 700;
	color: #102F29;
}

.study-task-progress {
	padding: 8rpx 20rpx;
	border-radius: 999rpx;
	background: rgba(181, 148, 94, 0.12);
	color: #173F35;
	font-size: 26rpx;
	font-weight: 700;
}

.study-task-desc {
	display: block;
	margin-top: 24rpx;
	font-size: 30rpx;
	line-height: 1.5;
	color: #102F29;
}

.record-bottom-actions {
	position: sticky;
	bottom: 20rpx;
	z-index: 5;
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 30rpx;
	padding: 16rpx;
	border-radius: 28rpx;
}

.bottom-action {
	min-height: 84rpx;
	border-radius: 22rpx;
	font-size: 25rpx;
	font-weight: 700;
	padding: 0 12rpx;
}

.foreground-tip {
	display: block;
	margin-top: 24rpx;
	text-align: center;
	font-size: 24rpx;
	color: rgba(23, 63, 53, 0.58);
}
</style>
