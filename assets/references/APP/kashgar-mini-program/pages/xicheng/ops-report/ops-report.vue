<template>
	<view class="xicheng-ops-report xicheng-designed-page xicheng-bottom-safe">
		<view class="topbar">
			<view class="topbar-button" @click="goBack">
				<xicheng-icon name="back" variant="plain" :size="22" />
			</view>
			<text class="topbar-title">运营报告</text>
			<view class="topbar-button" @click="refreshReport">
				<xicheng-icon name="refresh" variant="plain" :size="21" />
			</view>
		</view>

		<view class="report-hero ops-reference-dashboard xicheng-paper-card">
			<image class="report-hero-image" :src="region.visualAssets.heroLandmark" mode="aspectFill" />
			<text class="report-kicker">xicheng-city-ops-report-v1</text>
			<text class="report-title">西城试运营日报</text>
			<text class="report-date">今日预览 · {{ reportDateText }}</text>
			<text class="report-desc">基于识别、路线、游记与审核来源生成，只展示汇总数据和审核安全状态，不展示用户隐私明细。</text>
		</view>

		<view class="metric-grid">
			<view v-for="metric in metrics" :key="metric.label" class="metric-card xicheng-paper-card">
				<xicheng-icon :name="metric.icon" variant="primary" :size="20" />
				<text class="metric-value">{{ metric.value }}</text>
				<text class="metric-label">{{ metric.label }}</text>
				<text class="metric-trend">{{ metric.trend }}</text>
			</view>
		</view>

		<view class="trend-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">今日触发趋势</text>
				<text class="section-badge">近 7 日</text>
			</view>
			<view class="trend-legend">
				<text>触发次数（次）</text>
				<text>趋势</text>
			</view>
			<view class="trend-chart">
				<view v-for="bar in trendBars" :key="bar.label" class="trend-bar-cell">
					<view class="trend-bar-track">
						<view class="trend-bar-fill" :style="{ height: bar.height + '%' }"></view>
					</view>
					<text class="trend-bar-value">{{ bar.value }}</text>
					<text class="trend-bar-label">{{ bar.label }}</text>
				</view>
			</view>
		</view>

		<view class="ranking-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">热门内容</text>
				<text class="section-badge">查看全部</text>
			</view>
			<view v-if="hotPois.length > 0" class="ranking-list">
				<view v-for="(poi, index) in hotPois" :key="poi.poiName" class="ranking-row">
					<text class="ranking-index">{{ index + 1 }}</text>
					<image class="ranking-thumb" :src="getPoiThumb(poi.poiName)" mode="aspectFill" />
					<view class="ranking-copy">
						<text class="ranking-title">{{ poi.poiName }}</text>
						<text class="ranking-desc">历史文化底蕴深厚，适合运营重点推荐</text>
					</view>
					<text class="ranking-count">{{ poi.count }} 次</text>
				</view>
			</view>
			<text v-else class="empty-copy">暂无足够素材形成热点排行。</text>
		</view>

		<view class="ranking-card vision-agent-service-lane xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">AI识境服务意图</text>
				<text class="section-badge">{{ visionAgentServiceTaskCount }} 项</text>
			</view>
			<view v-if="serviceIntentSummaryCards.length > 0" class="service-intent-grid">
				<view v-for="card in serviceIntentSummaryCards" :key="card.intent" class="service-intent-card">
					<text class="service-intent-value">{{ card.count }}</text>
					<text class="service-intent-label">{{ card.label }}</text>
					<text class="service-intent-copy">{{ card.poiLabel }}</text>
				</view>
			</view>
			<text v-else class="empty-copy">AI识境服务动作累积后，会在这里看到点餐、优惠、预约和票务体验需求。</text>
		</view>

		<view v-if="visionAgentOpsBoundarySummary.hasBoundary" class="ranking-card service-boundary-card xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">AI识境服务待接入</text>
				<text class="section-badge">{{ visionAgentOpsBoundarySummary.realSystemRequiredTaskCount }} 项</text>
			</view>
			<text class="service-boundary-kicker">真实系统待确认</text>
			<text class="service-boundary-copy">{{ visionAgentOpsBoundarySummary.boundaryText }}</text>
			<view class="service-boundary-tags">
				<text
					v-for="label in visionAgentOpsBoundarySummary.sceneDomainLabels"
					:key="`domain-${label}`"
					class="service-boundary-tag"
				>
					{{ label }}
				</text>
				<text
					v-for="label in visionAgentOpsBoundarySummary.serviceIntentLabels"
					:key="`intent-${label}`"
					class="service-boundary-tag service-boundary-tag-gold"
				>
					{{ label }}
				</text>
			</view>
		</view>

		<view class="ranking-card ops-safety-lane xicheng-paper-card">
			<view class="section-head">
				<text class="section-title">审核安全</text>
				<text class="section-badge">{{ sourceReadinessStatus }}</text>
			</view>
			<view class="safety-grid">
				<view v-for="item in safetyMetrics" :key="item.label" class="safety-item">
					<xicheng-icon :name="item.icon" variant="soft" :size="20" />
					<text class="safety-value">{{ item.value }}</text>
					<text class="safety-label">{{ item.label }}</text>
				</view>
			</view>
			<text class="empty-copy">无已审核来源、BLOCKED 和来源服务不可用会进入运营复核，不进入公开分享。</text>
		</view>

		<view class="xiaojing-insight-card xicheng-paper-card">
			<image class="insight-avatar" :src="region.companionAvatar" mode="aspectFit" />
			<view>
				<text class="insight-title">小京洞察</text>
				<text class="insight-copy">{{ insightCopy }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import { isXichengUnsafeSafetyStatus } from '@/request/xunjing/safety.js'

const safeArray = value => Array.isArray(value) ? value : []
const safeObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {}

export default {
	data() {
		return {
			region: XICHENG_REGION_CONFIG,
			localOpsReport: {},
			materials: [],
			shareArtifacts: [],
			routeCheckins: [],
			reviewSubmissions: [],
			visionAgentServiceTasks: []
		}
	},
	computed: {
		metrics() {
			const topPoiName = this.hotPois.length > 0 ? this.hotPois[0].poiName : '待形成'
			return [
				{ label: '识别量', value: this.materials.length, icon: 'photo', trend: '本机汇总' },
				{ label: '热门 POI', value: topPoiName, icon: 'location', trend: topPoiName === '待形成' ? '待接入更多数据' : '访问量最高' },
				{ label: '路线完成率', value: `${this.routeCompletionRate}%`, icon: 'route', trend: '基于本地打卡' },
				{ label: '分享作品', value: this.shareArtifacts.length, icon: 'travelogue', trend: '待审核后公开' },
				{ label: 'AI识境服务', value: this.visionAgentServiceTaskCount, icon: 'scan', trend: '识别后动作' },
				{ label: '商家意向', value: this.merchantServiceTaskCount, icon: 'source', trend: '点餐/优惠/预约' }
			]
		},
		visionAgentServiceTaskCount() {
			return this.visionAgentServiceTasks.length
		},
		merchantServiceTasks() {
			return this.visionAgentServiceTasks.filter(task => task && task.taskType === 'merchant')
		},
		merchantServiceTaskCount() {
			return this.merchantServiceTasks.length
		},
		hotPois() {
			return this.createHotPoiRanking()
		},
		reportDateText() {
			const now = new Date()
			return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
		},
		routeCompletionRate() {
			const targetCount = Number(this.region.routePassport.targetCheckinCount || 3)
			if (targetCount <= 0) return 0
			return Math.min(100, Math.round((this.routeCheckins.length / targetCount) * 100))
		},
		trendBars() {
			const values = [
				{ label: '扫码', value: this.materials.length },
				{ label: '问答', value: this.materials.filter(item => item.type === 'ai-guide').length },
				{ label: '路线', value: this.routeCheckins.length },
				{ label: '游记', value: this.shareArtifacts.length },
				{ label: 'AI识境', value: this.visionAgentServiceTaskCount },
				{ label: '商家', value: this.merchantServiceTaskCount }
			]
			const maxValue = Math.max(...values.map(item => item.value), 1)
			return values.map(item => ({
				...item,
				height: Math.max(18, Math.round((item.value / maxValue) * 100))
			}))
		},
		sourceReadinessStatus() {
			const blocked = this.materials.some(item => isXichengUnsafeSafetyStatus(item && item.safetyStatus) || Number(item && item.sourceCount || 0) === 0)
			return blocked ? 'SOURCE_REVIEW_REQUIRED' : 'SOURCE_READY'
		},
		safetyMetrics() {
			const unsafeSafetyCount = this.materials.filter(item => isXichengUnsafeSafetyStatus(item && item.safetyStatus)).length
			return [
				{ label: '已审核来源', value: this.materials.reduce((sum, item) => sum + Number(item.sourceCount || 0), 0), icon: 'source' },
				{ label: '待复核', value: this.reviewSubmissions.length, icon: 'refresh' },
				{ label: '安全拦截', value: unsafeSafetyCount, icon: 'locked' }
			]
		},
		serviceIntentSummaryCards() {
			const serviceIntentCounts = this.visionAgentServiceTasks.reduce((summary, task) => {
				if (!task || typeof task !== 'object') return summary
				const serviceIntent = task.serviceIntent || task.taskType || 'service'
				const current = summary[serviceIntent] || {
					intent: serviceIntent,
					label: task.serviceIntentLabel || this.formatVisionAgentServiceIntentLabel(serviceIntent),
					count: 0,
					poiNames: []
				}
				current.count += 1
				if (task.poiName && !current.poiNames.includes(task.poiName)) {
					current.poiNames.push(task.poiName)
				}
				summary[serviceIntent] = current
				return summary
			}, {})
			return Object.values(serviceIntentCounts)
				.sort((left, right) => right.count - left.count)
				.slice(0, 4)
				.map(card => ({
					...card,
					poiLabel: card.poiNames.length > 0 ? card.poiNames.slice(0, 2).join('、') : '待形成 POI'
				}))
		},
		visionAgentOpsBoundarySummary() {
			const localOpsReport = safeObject(this.localOpsReport)
			const reportBoundaryText = localOpsReport.visionAgentRealSystemBoundary || ''
			const sharePackages = this.shareArtifacts
				.map(artifact => {
					const publicPreview = safeObject(artifact && artifact.publicPreview)
					return safeObject(artifact && artifact.visionAgentAutoTraveloguePackage).realSystemBoundaryText
						? safeObject(artifact.visionAgentAutoTraveloguePackage)
						: safeObject(publicPreview.publicVisionAgentAutoTraveloguePackage)
				})
				.filter(packagePayload => Object.keys(packagePayload).length > 0)
			const shareBoundaryText = this.shareArtifacts
				.map(artifact => {
					const safeArtifact = safeObject(artifact)
					const publicPreview = safeObject(safeArtifact.publicPreview)
					const artifactPackage = safeObject(safeArtifact.visionAgentAutoTraveloguePackage)
					const publicPackage = safeObject(publicPreview.publicVisionAgentAutoTraveloguePackage)
					return safeArtifact.visionAgentRealSystemBoundary
						|| publicPreview.publicVisionAgentRealSystemBoundary
						|| artifactPackage.realSystemBoundaryText
						|| publicPackage.realSystemBoundaryText
						|| ''
				})
				.find(Boolean) || ''
			const reportPackage = safeObject(localOpsReport.visionAgentAutoTraveloguePackage)
			const packageSummary = Object.keys(reportPackage).length > 0 ? reportPackage : safeObject(sharePackages[0])
			const realSystemRequiredTaskCount = Number(localOpsReport.visionAgentRealSystemRequiredTaskCount || packageSummary.realSystemRequiredTaskCount || 0)
			const sceneDomainLabels = safeArray(localOpsReport.visionAgentSceneDomainLabels).length > 0
				? safeArray(localOpsReport.visionAgentSceneDomainLabels)
				: safeArray(packageSummary.sceneDomainLabels)
			const serviceIntentLabels = safeArray(localOpsReport.visionAgentServiceIntentLabels).length > 0
				? safeArray(localOpsReport.visionAgentServiceIntentLabels)
				: safeArray(packageSummary.serviceIntentLabels)
			const boundaryText = reportBoundaryText
				|| shareBoundaryText
				|| packageSummary.realSystemBoundaryText
				|| ''
			return {
				hasBoundary: Boolean(boundaryText || realSystemRequiredTaskCount > 0 || sceneDomainLabels.length > 0 || serviceIntentLabels.length > 0),
				boundaryText: boundaryText || 'AI识境已形成服务动作，需要接入真实商家、票务、优惠或预约系统后再对游客承诺结果。',
				realSystemRequiredTaskCount,
				sceneDomainLabels: sceneDomainLabels.slice(0, 6),
				serviceIntentLabels: serviceIntentLabels.slice(0, 6)
			}
		},
		insightCopy() {
			if (this.merchantServiceTaskCount > 0) {
				return `AI识境已捕捉 ${this.merchantServiceTaskCount} 条商家服务意图，可优先复盘点餐、优惠和预约需求。`
			}
			if (this.materials.length + this.routeCheckins.length + this.shareArtifacts.length === 0) {
				return '数据累积后，小京会基于识别、路线和审核汇总给出运营建议。'
			}
			return '建议优先关注来源待复核内容，并结合热门 POI 调整路线和亲子研学任务运营。'
		}
	},
	onShow() {
		this.refreshReport()
	},
	methods: {
		refreshReport() {
			this.materials = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.materialsStorageKey))
			const storedLocalOpsReport = uni.getStorageSync(XICHENG_REGION_CONFIG.localOpsReportKey)
			this.localOpsReport = safeObject(storedLocalOpsReport)
			const storedShareArtifacts = uni.getStorageSync(XICHENG_REGION_CONFIG.shareAssetStorageKey)
			this.shareArtifacts = safeArray(storedShareArtifacts)
			this.routeCheckins = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.checkinStorageKey))
			this.reviewSubmissions = safeArray(uni.getStorageSync(XICHENG_REGION_CONFIG.reviewStorageKey))
			const storedTasks = uni.getStorageSync(XICHENG_REGION_CONFIG.visionAgentServiceTasksStorageKey)
			this.visionAgentServiceTasks = safeArray(storedTasks)
				.filter(task => task && typeof task === 'object')
				.slice(0, 50)
		},
		formatVisionAgentServiceIntentLabel(serviceIntent = '') {
			if (serviceIntent === 'order') return '点餐'
			if (serviceIntent === 'coupon') return '优惠'
			if (serviceIntent === 'reservation') return '预约'
			if (serviceIntent === 'ticket') return '票务'
			if (serviceIntent === 'experience') return '体验'
			if (serviceIntent === 'merchant') return '商家'
			if (serviceIntent === 'route') return '路线'
			if (serviceIntent === 'growth') return '成长'
			if (serviceIntent === 'agent') return 'Agent'
			return '服务'
		},
		createHotPoiRanking() {
			const counter = new Map()
			;[...this.materials, ...this.routeCheckins].forEach(item => {
				const poiName = item && item.poiName ? item.poiName : ''
				if (!poiName) return
				counter.set(poiName, (counter.get(poiName) || 0) + 1)
			})
			return Array.from(counter.entries())
				.map(([poiName, count]) => ({ poiName, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 5)
		},
		getPoiThumb(poiName = '') {
			if (String(poiName).includes('什刹海')) return this.region.visualAssets.routeThumbnails['beihai-shichahai-waterfront']
			if (String(poiName).includes('帝王庙')) return this.region.visualAssets.routeThumbnails['baitasi-imperial-shichahai']
			return this.region.visualAssets.heroLandmark
		},
		goBack() {
			const pages = getCurrentPages()
			if (pages.length <= 1) {
				uni.reLaunch({ url: '/pages/xicheng/home/home' })
				return
			}
			uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/xicheng/home/home' }) })
		}
	}
}
</script>

<style scoped>
.xicheng-ops-report {
	min-height: 100vh;
	padding: 24rpx 30rpx 44rpx;
	box-sizing: border-box;
}
.topbar,
.section-head,
.ranking-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}
.topbar {
	height: 72rpx;
}
.topbar-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60rpx;
	height: 60rpx;
}
.topbar-title,
.report-title,
.metric-value,
.section-title {
	font-weight: 800;
	color: #102F29;
}
.topbar-title {
	font-size: 34rpx;
}
.report-hero,
.trend-card,
.ranking-card {
	margin-top: 24rpx;
	padding: 30rpx;
	border-radius: 34rpx;
}

.ops-reference-dashboard {
	position: relative;
	min-height: 250rpx;
	overflow: hidden;
	background: rgba(255, 252, 246, 0.94);
}

.report-hero-image {
	position: absolute;
	right: 0;
	top: 0;
	width: 320rpx;
	height: 100%;
	opacity: 0.28;
}

.ops-reference-dashboard::after {
	content: "";
	position: absolute;
	inset: 0;
	background:
		linear-gradient(90deg, rgba(255, 252, 246, 0.98) 0%, rgba(255, 252, 246, 0.82) 56%, rgba(255, 252, 246, 0.34) 100%);
	pointer-events: none;
}

.report-kicker,
.report-title,
.report-date,
.report-desc {
	position: relative;
	z-index: 1;
}

.report-kicker,
.section-badge {
	font-size: 22rpx;
	font-weight: 700;
	color: #B5945E;
}
.report-title {
	display: block;
	margin-top: 14rpx;
	font-size: 44rpx;
}

.report-date {
	display: block;
	margin-top: 14rpx;
	font-size: 25rpx;
	font-weight: 800;
	color: #8B7A61;
}

.report-desc,
.metric-label,
.metric-trend,
.empty-copy {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.5;
	color: #746F68;
}

.report-desc {
	max-width: 430rpx;
}
.metric-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
	margin-top: 24rpx;
}
.metric-card {
	display: grid;
	align-content: start;
	gap: 8rpx;
	min-height: 180rpx;
	padding: 24rpx;
	border-radius: 28rpx;
}
.metric-value {
	display: block;
	font-size: 40rpx;
	line-height: 1.15;
}

.metric-trend {
	margin-top: 2rpx;
	font-size: 21rpx;
	color: #9A7132;
}

.section-title {
	font-size: 32rpx;
}

.trend-legend {
	display: flex;
	align-items: center;
	gap: 28rpx;
	margin-top: 18rpx;
	color: #746F68;
	font-size: 22rpx;
}

.trend-legend text:first-child::before {
	content: "";
	display: inline-block;
	width: 22rpx;
	height: 12rpx;
	margin-right: 8rpx;
	border-radius: 999rpx;
	background: #173F35;
}

.trend-legend text:last-child::before {
	content: "";
	display: inline-block;
	width: 24rpx;
	height: 2rpx;
	margin-right: 8rpx;
	background: #B5945E;
	vertical-align: middle;
}

.trend-chart {
	display: grid;
	grid-template-columns: repeat(6, minmax(0, 1fr));
	gap: 12rpx;
	align-items: end;
	height: 260rpx;
	margin-top: 22rpx;
	padding: 0 8rpx 8rpx;
	border-bottom: 1rpx solid rgba(181, 148, 94, 0.26);
	background:
		linear-gradient(180deg, transparent 24%, rgba(181, 148, 94, 0.12) 24% 25%, transparent 25% 49%, rgba(181, 148, 94, 0.12) 49% 50%, transparent 50% 74%, rgba(181, 148, 94, 0.12) 74% 75%, transparent 75%);
}

.trend-bar-cell {
	display: grid;
	justify-items: center;
	align-items: end;
	gap: 8rpx;
	height: 100%;
}

.trend-bar-track {
	display: flex;
	align-items: flex-end;
	width: 48rpx;
	height: 150rpx;
	border-radius: 16rpx 16rpx 0 0;
	background: rgba(23, 63, 53, 0.08);
	overflow: hidden;
}

.trend-bar-fill {
	width: 100%;
	border-radius: 16rpx 16rpx 0 0;
	background: linear-gradient(180deg, #234D42, #102F29);
}

.trend-bar-value {
	font-size: 22rpx;
	font-weight: 800;
	color: #173F35;
}

.trend-bar-label {
	font-size: 23rpx;
	color: #746F68;
}

.ranking-list {
	display: grid;
	gap: 0;
	margin-top: 22rpx;
}
.ranking-row {
	display: grid;
	grid-template-columns: 48rpx 104rpx 1fr auto;
	align-items: center;
	padding: 18rpx 0;
	border-bottom: 1rpx solid rgba(181, 148, 94, 0.18);
	font-size: 26rpx;
	color: #173F35;
}

.ranking-index {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 38rpx;
	height: 38rpx;
	border-radius: 999rpx;
	background: #B5945E;
	color: #FFF9EC;
	font-size: 22rpx;
	font-weight: 800;
}

.ranking-thumb {
	width: 88rpx;
	height: 64rpx;
	border-radius: 14rpx;
	background: rgba(23, 63, 53, 0.08);
}

.ranking-copy {
	min-width: 0;
}

.ranking-title,
.ranking-desc {
	display: block;
}

.ranking-title {
	font-size: 27rpx;
	font-weight: 800;
	color: #102F29;
}

.ranking-desc {
	margin-top: 4rpx;
	font-size: 22rpx;
	line-height: 1.35;
	color: #746F68;
}

.ranking-count {
	font-size: 24rpx;
	font-weight: 800;
	color: #9A7132;
	white-space: nowrap;
}

.vision-agent-service-lane {
	background:
		linear-gradient(135deg, rgba(23, 63, 53, 0.96), rgba(35, 77, 66, 0.92)),
		linear-gradient(180deg, rgba(181, 148, 94, 0.18), rgba(255, 255, 255, 0));
	color: #FFF9EC;
}

.vision-agent-service-lane .section-title,
.vision-agent-service-lane .section-badge {
	color: #FFF9EC;
}

.service-intent-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 22rpx;
}

.service-intent-card {
	min-width: 0;
	min-height: 142rpx;
	padding: 20rpx;
	border-radius: 22rpx;
	background: rgba(255, 249, 236, 0.10);
	border: 1rpx solid rgba(255, 249, 236, 0.14);
	box-sizing: border-box;
}

.service-intent-value,
.service-intent-label,
.service-intent-copy {
	display: block;
}

.service-intent-value {
	font-size: 38rpx;
	line-height: 1.1;
	font-weight: 800;
	color: #FCE8A9;
}

.service-intent-label {
	margin-top: 8rpx;
	font-size: 24rpx;
	font-weight: 800;
	color: #FFF9EC;
}

.service-intent-copy {
	margin-top: 8rpx;
	font-size: 21rpx;
	line-height: 1.35;
	color: rgba(255, 249, 236, 0.72);
}

.service-boundary-card {
	border: 1rpx solid rgba(181, 148, 94, 0.22);
	background:
		linear-gradient(135deg, rgba(255, 252, 246, 0.98), rgba(245, 249, 243, 0.92)),
		linear-gradient(180deg, rgba(181, 148, 94, 0.14), rgba(255, 255, 255, 0));
}

.service-boundary-kicker,
.service-boundary-copy {
	display: block;
}

.service-boundary-kicker {
	margin-top: 18rpx;
	font-size: 23rpx;
	font-weight: 800;
	color: #9A7132;
}

.service-boundary-copy {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #3D4D47;
}

.service-boundary-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 18rpx;
}

.service-boundary-tag {
	max-width: 100%;
	padding: 8rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(23, 63, 53, 0.08);
	color: #173F35;
	font-size: 21rpx;
	font-weight: 800;
	box-sizing: border-box;
}

.service-boundary-tag-gold {
	background: rgba(181, 148, 94, 0.16);
	color: #8B6428;
}

.ops-safety-lane {
	background: linear-gradient(180deg, rgba(255, 252, 246, 0.96), rgba(245, 249, 243, 0.92));
}

.safety-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14rpx;
	margin-top: 24rpx;
}

.safety-item {
	display: grid;
	justify-items: center;
	gap: 8rpx;
	padding: 20rpx 10rpx;
	border-radius: 22rpx;
	background: rgba(255, 252, 246, 0.78);
	border: 1rpx solid rgba(181, 148, 94, 0.16);
}

.safety-value {
	font-size: 34rpx;
	line-height: 1.1;
	font-weight: 800;
	color: #102F29;
}

.safety-label {
	font-size: 22rpx;
	line-height: 1.3;
	color: #746F68;
	text-align: center;
}

.xiaojing-insight-card {
	display: grid;
	grid-template-columns: 132rpx 1fr;
	align-items: center;
	gap: 18rpx;
	margin-top: 24rpx;
	padding: 18rpx 24rpx 0;
	border-radius: 30rpx;
	overflow: hidden;
}

.insight-avatar {
	width: 132rpx;
	height: 150rpx;
	align-self: end;
}

.insight-title,
.insight-copy {
	display: block;
}

.insight-title {
	font-size: 27rpx;
	font-weight: 800;
	color: #102F29;
}

.insight-copy {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.55;
	color: #3D4D47;
}
</style>
