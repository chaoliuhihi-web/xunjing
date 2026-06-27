<template>
	<view class="container">
		<!--腾讯地图插件-->
		<mapView v-if="isShow && UrlImg" :markersArr="markerArr" :myLcat="myLocation" :preOpenMarkerId="masters" :showHandDrawnMap="showHandDrawnMap" @chooseMarker="getChooseMarker" @clearMarker="clearSelectedMarker" @moveMapView="getMapCenterLoca"></mapView>

		<!-- 顶部导航 -->
		<custom-nav
			v-if="UrlImg"
			title="剧好玩文旅地图"
			:left-icon="UrlImg + '/baidu_map/weatch/images/left3.png'"
			left-icon-size="20px"
			background-color="transparent"
			@leftClick="goBack"
		/>

		<!-- 左侧分类筛选 -->
		<view class="float-con-box">
			<view class="float-con-item" v-for="(item, index) in markerCls" :key="index" @click="getMapMarkersListZ(item.id)">
				<image class="float-con-image" :src="item.img_url" mode="aspectFit"></image>
				<view class="float-con-name">{{item.name}}</view>
			</view>
			<!-- 功能按钮跟随左侧分类纵向排列，避免压到地图内容。 -->
			<view class="right-btns">
				<view class="right-btn" @click="openMaters">
					<text class="right-btn-icon">☰</text>
					<text class="right-btn-label">列表</text>
				</view>
				<view class="right-btn" @click="goAiGuide">
					<text class="right-btn-icon">AI</text>
					<text class="right-btn-label">讲解</text>
				</view>
				<view class="hand-drawn-switch-row" @click="toggleHandDrawnMap">
					<view class="hand-drawn-switch-track" :class="{ 'hand-drawn-switch-track-active': showHandDrawnMap }">
						<view class="hand-drawn-switch-thumb"></view>
					</view>
					<text class="hand-drawn-switch-label">手绘地图</text>
				</view>
			</view>
		</view>

		<!-- 底部互动栏 -->
		<view class="bottom-bar">
			<view class="recommend-with-guide">
				<view class="map-guide-atlas-viewport" @click="goAiGuide">
					<image
						class="map-guide-atlas-image"
						:src="MAP_GUIDE_ATLAS_URL"
						:style="mapGuideAtlasStyle"
						mode="scaleToFill"
					></image>
				</view>
				<view class="recommend-content-slot">
					<view v-if="selectedMarker" class="selected-place-row">
						<image class="selected-place-img" :src="selectedMarkerDetailImage" mode="aspectFill"></image>
						<view class="selected-place-info">
							<text class="selected-place-title">{{ selectedMarker.title }}</text>
							<text class="selected-place-addr">{{ selectedMarkerMeta }}</text>
						</view>
						<view class="selected-place-action" @click="goMarkerDetail">
							<text class="selected-place-action-text">了解详情</text>
						</view>
					</view>
					<scroll-view v-else class="recommend-row" scroll-x :show-scrollbar="false">
						<view class="recommend-list">
							<view class="recommend-item" v-for="item in recommendEntries" :key="item.label" @click="goAiGuideWithQuestion(item.prompt)">
								<view class="recommend-icon" :class="item.iconClass">
									<view v-if="item.type === 'spot'" class="icon-spot-sun"></view>
									<view v-if="item.type === 'spot'" class="icon-spot-mountain icon-spot-mountain-left"></view>
									<view v-if="item.type === 'spot'" class="icon-spot-mountain icon-spot-mountain-right"></view>
									<view v-if="item.type === 'spot'" class="icon-spot-pin"></view>

									<view v-if="item.type === 'food'" class="icon-food-steam icon-food-steam-left"></view>
									<view v-if="item.type === 'food'" class="icon-food-steam icon-food-steam-right"></view>
									<view v-if="item.type === 'food'" class="icon-food-bowl"></view>
									<view v-if="item.type === 'food'" class="icon-food-chopsticks"></view>

									<view v-if="item.type === 'booking'" class="icon-booking-card"></view>
									<view v-if="item.type === 'booking'" class="icon-booking-line icon-booking-line-one"></view>
									<view v-if="item.type === 'booking'" class="icon-booking-line icon-booking-line-two"></view>
									<view v-if="item.type === 'booking'" class="icon-booking-check"></view>

									<view v-if="item.type === 'hotel'" class="icon-hotel-bed"></view>
									<view v-if="item.type === 'hotel'" class="icon-hotel-pillow"></view>
									<view v-if="item.type === 'hotel'" class="icon-hotel-headboard"></view>
									<view v-if="item.type === 'hotel'" class="icon-hotel-lamp"></view>

									<view v-if="item.type === 'route'" class="icon-route-line"></view>
									<view v-if="item.type === 'route'" class="icon-route-dot icon-route-dot-start"></view>
									<view v-if="item.type === 'route'" class="icon-route-dot icon-route-dot-end"></view>
									<view v-if="item.type === 'route'" class="icon-route-flag"></view>
								</view>
								<text class="recommend-label">{{ item.label }}</text>
							</view>
						</view>
					</scroll-view>
				</view>
			</view>
			<view class="bottom-bar-main">
				<view class="home-entry" @click="goHome">
					<view class="home-entry-icon">
						<view class="home-entry-roof"></view>
						<view class="home-entry-body">
							<view class="home-entry-door"></view>
						</view>
					</view>
				</view>

				<view
					class="voice-ask-box"
					:class="{ 'voice-ask-box-active': voiceState === 'recording' }"
					@touchstart="startVoiceAsk"
					@touchend="finishVoiceAsk"
					@touchcancel="cancelVoiceAsk"
				>
					<text class="voice-ask-text">{{ voiceButtonText }}</text>
				</view>

				<view class="quick-actions">
					<view class="quick-action" @click="goAiGuide">
						<view class="keyboard-icon">
							<view class="keyboard-key" v-for="item in 9" :key="item"></view>
						</view>
					</view>
				</view>
			</view>
			<text class="bar-hint">对话内容由AI生成</text>
		</view>
	</view>
</template>

<script setup>
import { nextTick, onMounted, ref, reactive, computed } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app'
import config from '@/request/config.js'
import request from '@/request/request.js'
import mapView from '@/components/my-map/my-map.vue'
import CustomNav from '@/components/custom-nav/custom-nav.vue'

const UrlImg = ref('')
const type = ref(0)
const masters = ref(0)
const MAP_GUIDE_ATLAS_URL = 'https://www.neoxiake.com//upload/admin/20260528/2ea11df9b7429762a9fb737e302ed743.png'
const MAP_GUIDE_FRAME_COUNT = 301
const MAP_GUIDE_ATLAS_COLUMNS = 20
const MAP_GUIDE_ATLAS_ROWS = 16
const MAP_GUIDE_FRAME_INTERVAL = 33
const MAP_GUIDE_FRAME_WIDTH_PX = 117
const MAP_GUIDE_FRAME_HEIGHT_PX = 156
const MIN_RECORD_DURATION = 700
const voiceState = ref('idle')
const voiceQuestionText = ref('')
const recommendEntries = [
	{ label: '推荐景点', type: 'spot', iconClass: 'recommend-icon-spot', prompt: '请推荐几个适合游玩的三门景点，并说明各自亮点。' },
	{ label: '美食小吃', type: 'food', iconClass: 'recommend-icon-food', prompt: '请推荐三门当地值得尝试的美食小吃，并介绍特色。' },
	{ label: '景区预约', type: 'booking', iconClass: 'recommend-icon-booking', prompt: '我想预约三门景区游玩，请介绍可预约的景区和预约建议。' },
	{ label: '酒店预订', type: 'hotel', iconClass: 'recommend-icon-hotel', prompt: '请推荐三门适合游客入住的酒店或住宿区域，并给出预订建议。' },
	{ label: '推荐游线', type: 'route', iconClass: 'recommend-icon-route', prompt: '请推荐几条三门旅游路线，适合一日游或两日游。' }
]
let recognitionManager = null
let recordStartAt = 0
let isFinishingRecord = false
let mapGuideTimer = null
const DEFAULT_MAP_TYPE = '82'
const VALID_MAP_TYPES = ['82', '81', '80', '79']
const normalizeMapType = (value) => {
	const currentType = String(value || '')
	return VALID_MAP_TYPES.includes(currentType) ? currentType : DEFAULT_MAP_TYPE
}
const default_lng = ref(121.567354 + 0.008)
const default_lat = ref(29.028492 + 0.045 + 0.008)
const map_center = ref({
	latitude: 29.028492 + 0.045 + 0.008,
	longitude: 121.567354 + 0.008
});
const markerArr = ref([]);//标记点，可动态获取
const markerCls = ref([]);//标记点，可动态获取
const isShow = ref(false);//
const myLocation = ref({});//用户发送到后台请求对应的数据
const mapGuideFrameIndex = ref(0)
const showHandDrawnMap = ref(false)

// 页面加载时调用
onLoad((options) => {
  type.value = normalizeMapType(options.type)
  masters.value = options.masters
  console.log('type3',type.value)
  getMapClassList()
  getMapMarkersList(type.value)
  nextTick(()=>{
	isShow.value = true;
	UrlImg.value = config.UrlImg;
  })
  getMyLocation();
})

onMounted(()=>{
	initVoiceRuntime()
	startMapGuideAnimation()
});

onUnload(() => {
	stopMapGuideAnimation()
	if (recognitionManager && voiceState.value === 'recording') {
		recognitionManager.stop()
	}
})
const goBack = () => {
	uni.reLaunch({
		url: '/pages/index/index'
	})
}

const openMaters = () => {
	uni.navigateTo({
		url: '/subPackages/feature/map_two/masters?type=' + type.value
	})
}

//获取地图移动的中心坐标
const getMapCenterLoca = (e)=>{
	console.log("中心坐标：",e);
	map_center.value = e
};
const selectedMarker = ref(null)
//获取选中的标记
const getChooseMarker = (e) =>{
	console.log("选中的气泡标记：",e);
	const found = markerArr.value.find(m => m.id == (e.markerId || e.id))
	selectedMarker.value = found || e || null
};

const clearSelectedMarker = () => {
	selectedMarker.value = null
}

const selectedMarkerDetailImage = computed(() => {
	if (!selectedMarker.value) return ''
	return selectedMarker.value.img_url || selectedMarker.value.cover_url || selectedMarker.value.image || selectedMarker.value.iconPath || ''
})

const selectedMarkerMeta = computed(() => {
	if (!selectedMarker.value) return ''
	return [selectedMarker.value.address || selectedMarker.value.addr, selectedMarker.value.distance].filter(Boolean).join(' | ')
})

const goMarkerDetail = () => {
	if (!selectedMarker.value) return
	uni.navigateTo({
		url: `/subPackages/feature/map_two/masters?type=${type.value}`
	})
}

const goAiGuide = () => {
	uni.navigateTo({ url: '/pages/ai-guide/ai-guide' })
}

const toggleHandDrawnMap = () => {
	showHandDrawnMap.value = !showHandDrawnMap.value
}

const goAiGuideWithQuestion = (questionText) => {
	const question = String(questionText || '').trim()
	if (!question) {
		uni.showToast({ title: '没有识别到语音内容', icon: 'none' })
		voiceState.value = 'idle'
		return
	}
	voiceState.value = 'idle'
	uni.navigateTo({
		url: `/pages/ai-guide/ai-guide?question=${encodeURIComponent(question)}`
	})
}

const goHome = () => {
	uni.reLaunch({ url: '/pages/index/index' })
}

const mapGuideAtlasStyle = computed(() => {
	const column = mapGuideFrameIndex.value % MAP_GUIDE_ATLAS_COLUMNS
	const row = Math.floor(mapGuideFrameIndex.value / MAP_GUIDE_ATLAS_COLUMNS)
	return {
		width: `${MAP_GUIDE_FRAME_WIDTH_PX * MAP_GUIDE_ATLAS_COLUMNS}px`,
		height: `${MAP_GUIDE_FRAME_HEIGHT_PX * MAP_GUIDE_ATLAS_ROWS}px`,
		transform: `translate3d(${-column * MAP_GUIDE_FRAME_WIDTH_PX}px, ${-row * MAP_GUIDE_FRAME_HEIGHT_PX}px, 0)`
	}
})

const startMapGuideAnimation = () => {
	if (mapGuideTimer) return
	mapGuideTimer = setInterval(() => {
		mapGuideFrameIndex.value = (mapGuideFrameIndex.value + 1) % MAP_GUIDE_FRAME_COUNT
	}, MAP_GUIDE_FRAME_INTERVAL)
}

const stopMapGuideAnimation = () => {
	if (!mapGuideTimer) return
	clearInterval(mapGuideTimer)
	mapGuideTimer = null
}

const voiceButtonText = computed(() => {
	const textMap = {
		idle: '按住提问',
		recording: '松开发送',
		recognizing: '正在识别'
	}
	return textMap[voiceState.value] || '按住提问'
})

const canUseVoicePlugin = () => {
	const plugin = getWechatPlugin()
	return Boolean(plugin && plugin.getRecordRecognitionManager)
}

const getWechatPlugin = () => {
	if (typeof requirePlugin !== 'function') return null
	try {
		return requirePlugin('WechatSI')
	} catch (error) {
		return null
	}
}

const initVoiceRuntime = () => {
	const plugin = getWechatPlugin()
	if (!plugin || !plugin.getRecordRecognitionManager) return
	recognitionManager = plugin.getRecordRecognitionManager()
	recognitionManager.onStart = () => {
		voiceState.value = 'recording'
	}
	recognitionManager.onRecognize = (res) => {
		if (res && res.result) {
			voiceQuestionText.value = res.result
		}
	}
	recognitionManager.onStop = (res) => {
		const result = String((res && res.result) || voiceQuestionText.value || '').trim()
		if (!isFinishingRecord) {
			voiceState.value = 'idle'
			return
		}
		isFinishingRecord = false
		voiceState.value = 'recognizing'
		goAiGuideWithQuestion(result)
	}
	recognitionManager.onError = (error) => {
		isFinishingRecord = false
		console.error('语音识别失败:', error)
		voiceState.value = 'idle'
		uni.showToast({ title: '请检查麦克风权限后重试', icon: 'none' })
	}
}

const startVoiceAsk = () => {
	if (voiceState.value !== 'idle') return
	if (!recognitionManager) {
		initVoiceRuntime()
	}
	if (!recognitionManager || !canUseVoicePlugin()) {
		uni.showToast({ title: '语音能力未配置', icon: 'none' })
		voiceState.value = 'idle'
		return
	}
	recordStartAt = Date.now()
	isFinishingRecord = false
	voiceQuestionText.value = ''
	recognitionManager.start({
		duration: 60000,
		lang: 'zh_CN'
	})
}

const finishVoiceAsk = () => {
	if (voiceState.value !== 'recording' || !recognitionManager) return
	const duration = Date.now() - recordStartAt
	if (duration < MIN_RECORD_DURATION) {
		cancelVoiceAsk()
		uni.showToast({ title: '说话时间太短', icon: 'none' })
		return
	}
	isFinishingRecord = true
	recognitionManager.stop()
}

const cancelVoiceAsk = () => {
	if (!recognitionManager) {
		voiceState.value = 'idle'
		return
	}
	isFinishingRecord = false
	recognitionManager.stop()
	voiceState.value = 'idle'
}
//获取当前所在的位置
const getMyLocation =()=>{
	//获得当前的位置
	if (typeof wx === 'undefined' || !wx.getFuzzyLocation) {
		console.log('模糊定位接口不可用');
		return;
	}
	wx.getFuzzyLocation({
		type: 'gcj02', //返回国测局坐标
		success(e) {
			// console.log(e,"我的位置")
			myLocation.value = e;
		},
		fail(e) {
			console.log('失败', e);
		}
	})
}
const queryParams = reactive({
  page: 1,
  page_size: 10,
  userId: 1,
  classId: '',
  mastersId: ''
})
const getMapClassList = async (e) =>{
	let res = await request('api2/Map/cls', queryParams, 'GET')
	console.log(res)
	if (res.code == '0') {
		markerCls.value = res.data
	}
}
const getMapMarkersListZ = (e) =>{
	type.value = normalizeMapType(e)
	getMapMarkersList(type.value)
}
//获取位置中心范围内的数据
const getMapMarkersList = async (e) =>{
	queryParams.classId = normalizeMapType(e)
	if (masters.value) {
		queryParams.mastersId = masters.value
	}
	let res = await request('api2/Map/lst', queryParams, 'GET')
	console.log(res)
	if (res.code == '0') {
		markerArr.value = res.data
	}
/*markerArr.value =    [
		{
			id:1,
			longitude:'115.851002', //经度
			latitude:'28.689684',//纬度
			iconPath:'/static/ad/ad01.jpg',//缩略图
			width:40,
			height: 40,
			title:'商家1',
			address:'商家标记地址1',
			alpha: 1,   //透明度
			callout: {  //自定义标记点上方的气泡窗口 点击有效
				content: '商家标记点1',//文本
				color: '#ffffff',//文字颜色
				fontSize: 12,//文本大小
				borderRadius: 5,//边框圆角
				padding:7,
				bgColor: '#3f94fd',//背景颜色
				display: 'ALWAYS',//常显
			},
		},
		{
			id:2,
			longitude:'115.880356',
			latitude:'28.643896',
			iconPath:'/static/ad/ad02.jpg',
			width:40,
			height: 40,
			title:'商家2',
			address:'商家标记地址2',
			alpha: 1,
			callout: {  //气泡窗口
				content:'商家标记点2',
				color: '#ffffff',
				fontSize: 12,
				borderRadius: 5,
				padding:7,
				bgColor: '#3f94fd',
				display: 'ALWAYS',
			},
		},
		{
			id:3,
			longitude:'115.902672',
			latitude:'28.671311',
			iconPath:'/static/ad/ad03.jpg',
			width:40,
			height: 40,
			title:'商家3',
			address:'商家标记地址3',
			alpha: 1,
			callout: {  //气泡窗口
				content: '商家标记点3',
				color: '#ffffff',
				fontSize: 12,
				borderRadius: 5,
				padding:7,
				bgColor: '#3f94fd',
				display: 'ALWAYS',
			},
		},
		{
			id:4,
			longitude:'115.881386',
			latitude:'28.682456',
			iconPath:'/static/ad/ad02.jpg',
			width:40,
			height: 40,
			title:'商家4',
			address:'商家标记地址4',
			alpha: 1,
			callout: {  //气泡窗口
				content: '商家标记点4',
				color: '#ffffff',
				fontSize: 12,
				borderRadius: 5,
				padding:7,
				bgColor: '#3f94fd',
				display: 'ALWAYS',
			},
		},
		{
			id:5,
			longitude:'115.854435',
			latitude:'28.677787',
			iconPath:'/static/ad/ad01.jpg',
			width:40,
			height: 40,
			title:'商家5',
			address:'商家标记地址5',
			alpha: 1,
			callout: {  //气泡窗口
				content: '商家标记点5',
				color: '#ffffff',
				fontSize: 12,
				borderRadius: 5,
				padding:7,
				bgColor: '#3f94fd',
				display: 'ALWAYS',
			},
		},
		{
			id:6,
			longitude:'115.848255',
			latitude:'28.660617',
			iconPath:'/static/ad/ad02.jpg',
			width:40,
			height: 40,
			title:'商家6',
			address:'商家标记地址6',
			alpha: 1,
			callout: {  //气泡窗口
				content: '商家标记点6',
				color: '#ffffff',
				fontSize: 12,
				borderRadius: 5,
				padding:7,
				bgColor: '#3f94fd',
				display: 'ALWAYS',
			},
		},
		{
			id:7,
			longitude:'115.849972',
			latitude:'28.670407',
			iconPath:'/static/ad/ad03.jpg',
			width:40,
			height: 40,
			title:'商家7',
			address:'商家标记地址7',
			alpha: 1,
			callout: {  //气泡窗口
				content: '商家标记点7',
				color: '#ffffff',
				fontSize: 12,
				borderRadius: 5,
				padding:7,
				bgColor: '#3f94fd',
				display: 'ALWAYS',
			},
		},
		{
			id:8,
			longitude:'115.900612',
			latitude:'28.661671',
			iconPath:'/static/ad/ad01.jpg',
			width:40,
			height: 40,
			title:'商家8',
			address:'商家标记地址8',
			alpha: 1,
			callout: {  //气泡窗口
				content: '商家标记点8',
				color: '#ffffff',
				fontSize: 12,
				borderRadius: 5,
				padding:7,
				bgColor: '#3f94fd',
				display: 'ALWAYS',
			},
		},
	];*/
}
</script>

<style lang="scss" scoped>
.container {
	width: 100%;
	min-height: 100vh;
	position: relative;
}

/* 左侧分类 */
.float-con-box {
	position: fixed;
	left: 20rpx;
	top: 200rpx;
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	.float-con-item {
		display: flex;
		align-items: center;
		background: rgba(255,255,255,0.92);
		border-radius: 40rpx;
		padding: 10rpx 20rpx 10rpx 10rpx;
		box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
		.float-con-name {
			color: #5C3D1E;
			font-size: 24rpx;
			margin-left: 8rpx;
			font-weight: 500;
		}
		.float-con-image {
			width: 48rpx;
			height: 48rpx;
			border-radius: 50%;
		}
	}
}

/* 右侧按钮 */
.right-btns {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	margin-top: 20rpx;
}

.right-btn {
	width: 112rpx;
	min-height: 96rpx;
	background: rgba(255,255,255,0.95);
	border-radius: 20rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6rpx;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.12);
}

.right-btn + .right-btn {
	margin-top: 18rpx;
}

.hand-drawn-switch-row {
	margin-top: 18rpx;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.12);
	padding: 12rpx 10rpx;
	box-sizing: border-box;
}

.hand-drawn-switch-track {
	width: 54rpx;
	height: 30rpx;
	padding: 3rpx;
	border-radius: 999rpx;
	background: #F1F1F1;
	box-shadow: inset 0 1rpx 5rpx rgba(0, 0, 0, 0.16), 0 1rpx 4rpx rgba(0, 0, 0, 0.08);
	box-sizing: border-box;
	transition: background 0.18s ease;
}

.hand-drawn-switch-thumb {
	width: 24rpx;
	height: 24rpx;
	border-radius: 50%;
	background: #FFFFFF;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.2);
	transform: translateX(0);
	transition: transform 0.18s ease;
}

.hand-drawn-switch-track-active {
	background: #4E83FF;
}

.hand-drawn-switch-track-active .hand-drawn-switch-thumb {
	transform: translateX(24rpx);
}

.hand-drawn-switch-label {
	font-size: 20rpx;
	line-height: 1.1;
	color: #606060;
	white-space: nowrap;
}

.right-btn-icon {
	font-size: 34rpx;
	color: #5C3D1E;
}

.right-btn-label {
	font-size: 20rpx;
	color: #888888;
}

/* 底部互动栏 */
.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: 40;
	background: #FFFFFF;
	padding: 12rpx 0 14rpx;
	padding-bottom: calc(14rpx + env(safe-area-inset-bottom));
	box-shadow: 0 -8rpx 28rpx rgba(39, 35, 53, 0.08);
}

.selected-place-row {
	width: calc(100% - 48rpx);
	height: 140rpx;
	margin: 0 24rpx;
	padding: 0 22rpx;
	border-radius: 26rpx;
	background: #FFFFFF;
	box-shadow: 0 8rpx 24rpx rgba(65, 56, 84, 0.12);
	display: flex;
	align-items: center;
	gap: 22rpx;
	box-sizing: border-box;
}

.selected-place-img {
	width: 150rpx;
	height: 100rpx;
	border-radius: 14rpx;
	flex-shrink: 0;
	background: #F3F0FF;
}

.selected-place-info {
	min-width: 0;
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.selected-place-title {
	font-size: 30rpx;
	font-weight: 700;
	line-height: 1.15;
	color: #25252A;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.selected-place-addr {
	font-size: 23rpx;
	line-height: 1.15;
	color: #8B8B93;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.selected-place-action {
	height: 64rpx;
	padding: 0 28rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #5C7CFF 0%, #3363F5 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	box-shadow: 0 8rpx 18rpx rgba(57, 99, 245, 0.22);
}

.selected-place-action-text {
	font-size: 25rpx;
	font-weight: 600;
	color: #FFFFFF;
	white-space: nowrap;
}

.recommend-with-guide {
	width: 100%;
	margin-bottom: 18rpx;
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.recommend-content-slot {
	width: 100%;
	height: 150rpx;
	display: flex;
	align-items: center;
}

.map-guide-atlas-viewport {
	width: 117px;
	height: 156px;
	position: absolute;
	left: 50%;
	top: -132px;
	transform: translateX(-50%);
	z-index: 2;
	overflow: hidden;
	flex-shrink: 0;
	filter: drop-shadow(0 12rpx 20rpx rgba(45, 67, 83, 0.18));
}

.map-guide-atlas-image {
	position: absolute;
	left: 0;
	top: 0;
	will-change: transform;
}

.recommend-row {
	width: 100%;
	height: 150rpx;
	white-space: nowrap;
}

.recommend-list {
	display: inline-flex;
	align-items: center;
	gap: 34rpx;
	padding: 0 24rpx;
	box-sizing: border-box;
	height: 150rpx;
}

.recommend-item {
	width: 104rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
}

.recommend-icon {
	position: relative;
	width: 62rpx;
	height: 62rpx;
	border-radius: 22rpx;
	border: 4rpx solid #FFFFFF;
	box-shadow: 0 10rpx 22rpx rgba(65, 56, 84, 0.16);
	background: #F3F0FF;
	overflow: hidden;
	box-sizing: border-box;
}

.recommend-icon::before {
	content: '';
	position: absolute;
	left: 8rpx;
	top: 7rpx;
	width: 18rpx;
	height: 14rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.72);
	filter: blur(1rpx);
}

.recommend-icon-spot {
	background: linear-gradient(145deg, #E6FBFF 0%, #BCEBFF 48%, #E9F6D6 100%);
}

.icon-spot-sun {
	position: absolute;
	right: 10rpx;
	top: 10rpx;
	width: 13rpx;
	height: 13rpx;
	border-radius: 50%;
	background: #FFD76A;
}

.icon-spot-mountain {
	position: absolute;
	bottom: 11rpx;
	width: 30rpx;
	height: 24rpx;
	background: #38B789;
	clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.icon-spot-mountain-left {
	left: 8rpx;
}

.icon-spot-mountain-right {
	right: 7rpx;
	bottom: 10rpx;
	background: #1D9A72;
	transform: scale(0.9);
}

.icon-spot-pin {
	position: absolute;
	left: 23rpx;
	top: 18rpx;
	width: 15rpx;
	height: 20rpx;
	border-radius: 50% 50% 50% 0;
	background: #FF6B6B;
	transform: rotate(-45deg);
	box-shadow: 0 3rpx 7rpx rgba(255, 107, 107, 0.28);
}

.icon-spot-pin::after {
	content: '';
	position: absolute;
	left: 5rpx;
	top: 5rpx;
	width: 5rpx;
	height: 5rpx;
	border-radius: 50%;
	background: #FFFFFF;
}

.recommend-icon-food {
	background: linear-gradient(145deg, #FFF2DF 0%, #FFD9A6 52%, #FFECEE 100%);
}

.icon-food-steam {
	position: absolute;
	top: 9rpx;
	width: 8rpx;
	height: 18rpx;
	border-radius: 999rpx;
	border-left: 4rpx solid rgba(255, 132, 85, 0.72);
	transform: rotate(18deg);
}

.icon-food-steam-left {
	left: 21rpx;
}

.icon-food-steam-right {
	left: 34rpx;
	top: 8rpx;
	transform: rotate(-15deg);
}

.icon-food-bowl {
	position: absolute;
	left: 12rpx;
	bottom: 12rpx;
	width: 38rpx;
	height: 20rpx;
	border-radius: 4rpx 4rpx 22rpx 22rpx;
	background: #FFFFFF;
	box-shadow: inset 0 -6rpx 0 #FF9F5A;
}

.icon-food-bowl::before {
	content: '';
	position: absolute;
	left: -2rpx;
	top: -4rpx;
	width: 42rpx;
	height: 8rpx;
	border-radius: 50%;
	background: #FFE8C7;
}

.icon-food-chopsticks {
	position: absolute;
	right: 16rpx;
	top: 18rpx;
	width: 4rpx;
	height: 28rpx;
	border-radius: 999rpx;
	background: #8B5E3C;
	transform: rotate(42deg);
}

.icon-food-chopsticks::after {
	content: '';
	position: absolute;
	left: 8rpx;
	top: 0;
	width: 4rpx;
	height: 28rpx;
	border-radius: 999rpx;
	background: #8B5E3C;
}

.recommend-icon-booking {
	background: linear-gradient(145deg, #E9F7FF 0%, #BEE5FF 50%, #E8F3FF 100%);
}

.icon-booking-card {
	position: absolute;
	left: 12rpx;
	top: 14rpx;
	width: 38rpx;
	height: 34rpx;
	border-radius: 8rpx;
	background: #FFFFFF;
	box-shadow: inset 0 9rpx 0 #67B7FF;
}

.icon-booking-card::before,
.icon-booking-card::after {
	content: '';
	position: absolute;
	top: -4rpx;
	width: 5rpx;
	height: 10rpx;
	border-radius: 999rpx;
	background: #4092E8;
}

.icon-booking-card::before {
	left: 9rpx;
}

.icon-booking-card::after {
	right: 9rpx;
}

.icon-booking-line {
	position: absolute;
	left: 20rpx;
	width: 16rpx;
	height: 4rpx;
	border-radius: 999rpx;
	background: #C7D9EA;
}

.icon-booking-line-one {
	top: 30rpx;
}

.icon-booking-line-two {
	top: 39rpx;
}

.icon-booking-check {
	position: absolute;
	right: 13rpx;
	bottom: 16rpx;
	width: 16rpx;
	height: 9rpx;
	border-left: 5rpx solid #39C681;
	border-bottom: 5rpx solid #39C681;
	transform: rotate(-45deg);
}

.recommend-icon-hotel {
	background: linear-gradient(145deg, #F3EDFF 0%, #D7C6FF 50%, #FFEAF2 100%);
}

.icon-hotel-bed {
	position: absolute;
	left: 12rpx;
	bottom: 16rpx;
	width: 40rpx;
	height: 19rpx;
	border-radius: 8rpx 8rpx 5rpx 5rpx;
	background: #FFFFFF;
	box-shadow: inset 0 -7rpx 0 #9B7CFF;
}

.icon-hotel-pillow {
	position: absolute;
	left: 17rpx;
	bottom: 29rpx;
	width: 15rpx;
	height: 10rpx;
	border-radius: 5rpx;
	background: #FFE9B8;
}

.icon-hotel-headboard {
	position: absolute;
	left: 10rpx;
	bottom: 15rpx;
	width: 6rpx;
	height: 29rpx;
	border-radius: 999rpx;
	background: #7B5BE8;
}

.icon-hotel-lamp {
	position: absolute;
	right: 11rpx;
	top: 14rpx;
	width: 12rpx;
	height: 10rpx;
	border-radius: 6rpx 6rpx 2rpx 2rpx;
	background: #FFD76A;
}

.icon-hotel-lamp::after {
	content: '';
	position: absolute;
	left: 5rpx;
	top: 10rpx;
	width: 3rpx;
	height: 12rpx;
	border-radius: 999rpx;
	background: #7B5BE8;
}

.recommend-icon-route {
	background: linear-gradient(145deg, #E9FFF4 0%, #BFF2D7 48%, #EAF8FF 100%);
}

.icon-route-line {
	position: absolute;
	left: 15rpx;
	top: 31rpx;
	width: 33rpx;
	height: 20rpx;
	border-top: 5rpx dashed #23B984;
	border-radius: 50%;
	transform: rotate(-18deg);
}

.icon-route-dot {
	position: absolute;
	width: 10rpx;
	height: 10rpx;
	border-radius: 50%;
	background: #23B984;
	border: 3rpx solid #FFFFFF;
}

.icon-route-dot-start {
	left: 11rpx;
	bottom: 15rpx;
}

.icon-route-dot-end {
	right: 11rpx;
	top: 17rpx;
	background: #FF7A59;
}

.icon-route-flag {
	position: absolute;
	right: 16rpx;
	top: 11rpx;
	width: 4rpx;
	height: 29rpx;
	border-radius: 999rpx;
	background: #3E6AF8;
}

.icon-route-flag::after {
	content: '';
	position: absolute;
	left: 4rpx;
	top: 2rpx;
	width: 16rpx;
	height: 12rpx;
	border-radius: 2rpx 8rpx 8rpx 2rpx;
	background: #FF6B6B;
}

.recommend-label {
	width: 120rpx;
	font-size: 24rpx;
	line-height: 1.2;
	color: #6B6672;
	text-align: center;
	white-space: nowrap;
}

.bottom-bar-main {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 0 24rpx;
}

.home-entry {
	position: relative;
	width: 76rpx;
	height: 76rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.96);
	border: 3rpx solid #D7A64D;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 12rpx rgba(115, 91, 53, 0.12);
	flex-shrink: 0;
	overflow: hidden;
}

.home-entry-icon {
	position: relative;
	width: 38rpx;
	height: 32rpx;
	z-index: 1;
}

.home-entry-roof {
	position: absolute;
	left: 5rpx;
	top: 0;
	width: 0;
	height: 0;
	border-left: 14rpx solid transparent;
	border-right: 14rpx solid transparent;
	border-bottom: 11rpx solid #9A7438;
	box-sizing: border-box;
}

.home-entry-roof::after {
	content: '';
	position: absolute;
	left: -18rpx;
	top: 11rpx;
	width: 36rpx;
	height: 5rpx;
	border-radius: 999rpx;
	background: #C28B3A;
}

.home-entry-body {
	position: absolute;
	left: 7rpx;
	bottom: 3rpx;
	width: 24rpx;
	height: 15rpx;
	border-top: 4rpx solid #C28B3A;
	border-bottom: 4rpx solid #9A7438;
	border-radius: 3rpx;
	box-sizing: border-box;
}

.home-entry-body::before,
.home-entry-body::after {
	content: '';
	position: absolute;
	top: 0;
	width: 4rpx;
	height: 12rpx;
	border-radius: 999rpx;
	background: #9A7438;
}

.home-entry-body::before {
	left: 1rpx;
}

.home-entry-body::after {
	right: 1rpx;
}

.home-entry-door {
	position: absolute;
	left: 10rpx;
	bottom: -3rpx;
	width: 4rpx;
	height: 12rpx;
	border-radius: 999rpx;
	background: #9A7438;
}

.voice-ask-box {
	min-width: 0;
	flex: 1;
	height: 78rpx;
	border-radius: 999rpx;
	background: #FFFFFF;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 28rpx rgba(31, 32, 36, 0.12);
	border: 1rpx solid rgba(236, 236, 240, 0.95);
	transition: transform 180ms ease, background 180ms ease;
}

.voice-ask-box-active {
	background: #F3EEFF;
	transform: scale(0.98);
}

.voice-ask-text {
	font-size: 32rpx;
	font-weight: 600;
	color: #222222;
	letter-spacing: 1rpx;
}

.quick-actions {
	display: flex;
	align-items: center;
	gap: 12rpx;
	flex-shrink: 0;
}

.quick-action {
	width: 76rpx;
	height: 76rpx;
	border-radius: 50%;
	background: #FFFFFF;
	border: 3rpx solid #303030;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	box-shadow: 0 4rpx 12rpx rgba(31, 31, 31, 0.10);
}

.quick-action-icon {
	font-size: 38rpx;
	line-height: 1;
	color: #303030;
	font-weight: 700;
}

.keyboard-icon {
	width: 33rpx;
	height: 28rpx;
	border: 3rpx solid #303030;
	border-radius: 9rpx;
	padding: 5rpx 6rpx;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 4rpx;
	box-sizing: border-box;
}

.keyboard-key {
	width: 4rpx;
	height: 4rpx;
	border-radius: 2rpx;
	background: #303030;
}

.bar-hint {
	display: block;
	width: 100%;
	margin-top: 12rpx;
	text-align: center;
	font-size: 22rpx;
	color: #9A9A9A;
	line-height: 1.3;
}

.float-con-box .float-con-item,
.right-btn,
.hand-drawn-switch-row {
	background: rgba(255, 252, 244, 0.94);
	border: 1rpx solid rgba(184, 129, 43, 0.16);
	box-shadow: 0 10rpx 26rpx rgba(43, 57, 45, 0.12);
}

.float-con-box .float-con-item .float-con-name,
.right-btn-icon,
.voice-ask-text,
.selected-place-title {
	color: #183B34;
	font-weight: 800;
}

.right-btn-label,
.hand-drawn-switch-label,
.recommend-label,
.selected-place-addr,
.bar-hint {
	color: #6C766D;
}

.hand-drawn-switch-track-active {
	background: #B8812B;
}

.bottom-bar {
	background: rgba(255, 252, 244, 0.97);
	border-top: 1rpx solid rgba(184, 129, 43, 0.16);
	box-shadow: 0 -12rpx 34rpx rgba(43, 57, 45, 0.14);
}

.selected-place-row,
.voice-ask-box,
.quick-action,
.home-entry {
	background: rgba(255, 252, 244, 0.96);
	border-color: rgba(184, 129, 43, 0.22);
	box-shadow: 0 10rpx 26rpx rgba(43, 57, 45, 0.1);
}

.selected-place-img {
	background: #EEF5EF;
}

.selected-place-action {
	background: linear-gradient(135deg, #244C41 0%, #367063 100%);
	box-shadow: 0 8rpx 18rpx rgba(36, 76, 65, 0.22);
}

.voice-ask-box-active {
	background: rgba(238, 245, 239, 0.96);
}

.home-entry {
	border-color: #B8812B;
}

.home-entry-roof,
.home-entry-body,
.home-entry-body::before,
.home-entry-body::after,
.home-entry-door {
	border-bottom-color: #B8812B;
	border-top-color: #B8812B;
	background: #B8812B;
}

.quick-action {
	border-color: #244C41;
}

.quick-action-icon,
.keyboard-key {
	color: #244C41;
	background: #244C41;
}
</style>
