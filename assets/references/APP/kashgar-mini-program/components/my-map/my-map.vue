<template>
  <!-- 腾讯地图多标记点组件 -->
  <view class="map-box">
    <view class="map-viw">
      <map
        id="map"
        class="map"
        :show-location="false"
        theme="satellite"
        :markers="listMarkers"
        :scale="state.scale"
        :latitude="state.latitude"
        :longitude="state.longitude"
        :min-scale="state.minScale"
        @regionchange="mapRegionchange"
        @callouttap="markertap"
        @markertap="markertap"
		@tap="onMapTap"
      />
      <!-- 离线瓦片层 -->
      <canvas :class="{ 'tile-layer-hidden': !showHandDrawnMap }" canvas-id="tileLayer" class="tile-layer" />
    </view>

    <!-- 按钮组 -->
    <view class="map-btn_s">
      <view class="tool-btn" @tap="mapScaleUp">
        <text class="nvue-iconfont mapico">&#xec13;</text>
      </view>
      <view class="tool-btn" @tap="mapScaleDown">
        <text class="nvue-iconfont mapico">&#xe6e3;</text>
      </view>
      <view class="tool-btn2" @click="toSearch">
        <image v-if="UrlImg" class="float-image" style="width: 100%;height: 100%" :src="UrlImg + '/baidu_map/weatch/images/search.png'" mode="aspectFit"></image>
      </view>
    </view>

    <!-- 底部信息 -->
    <view class="info-view" v-if="chooseItemInfo.id" @click="openPopup">
      <view class="iv-item">
        <image class="ivi-img" :src="chooseItemInfo.img_url" mode="aspectFill" />
        <view class="ivi-text">
          <text class="ivi-t-title">{{ chooseItemInfo.title }}</text>
          <text class="ivi-t-address">{{ chooseItemInfo.address }} | {{ chooseItemInfo.distance }}</text>
        </view>
        <image v-if="UrlImg" class="ivi-img2" :src="UrlImg + '/baidu_map/weatch/images/icon9.png'" mode="aspectFit"></image>
      </view>
    </view>

	<!-- 遮罩层 -->
	<view class="popup-mask" v-if="showPopup" @click="closePopup"></view>
	<!-- 底部弹窗 -->
	<view class="popup-container" :class="{ 'popup-show': showPopup }">
		<view class="popup-header">
			<text class="popup-title">详情</text>
			<text class="popup-close" @click="closePopup">×</text>
		</view>
		<view class="popup-content">
			<!-- 弹窗内容 -->
			<view class="popup-content-imgs">
				<image class="content-imgs-img" :src="chooseItemInfo.img_url" mode="aspectFill" />
				<view class="content-imgs-mask"></view>
			</view>
			<view class="popup-content-bgcon">
				<text class="content-imgs-title">{{ chooseItemInfo.title }}</text>
				<view class="content-imgs-address">
					<image v-if="UrlImg" class="ivi-img2" :src="UrlImg + '/baidu_map/weatch/images/icon11.png'" mode="aspectFit"></image>
					{{ chooseItemInfo.address }}
				</view>
				<view class="content-imgs-dh-box">
					<view class="content-imgs-dh" @click="chooseItemDao">
						<image v-if="UrlImg" class="ivi-img2" :src="UrlImg + '/baidu_map/weatch/images/dh.png'" mode="aspectFit"></image>
						导航
					</view>
				</view>
			</view>
			<view class="popup-content-title">简介</view>
			<view class="popup-content-html">
				<view class="popup-content-con">{{chooseItemInfo.desc}}</view>
			</view>
			<view style="height: 60rpx;width: 100%;"></view>
		</view>
	</view>
  </view>
</template>

<script>
import config from '@/request/config.js'

const DEFAULT_MARKER_ICON = config.UrlImg + '/baidu_map/weatch/images/icon1.png'
const HAND_DRAWN_OVERLAY_ID = 0
const HAND_DRAWN_OVERLAY_SRC = 'https://www.neoxiake.com//upload/admin/20260601/509dfaebaa074483b2689954b18d2d0a.png'
const HAND_DRAWN_OVERLAY_BOUNDS = {
  southwest: {
    latitude: 28.6892,
    longitude: 121.1646
  },
  northeast: {
    latitude: 29.3486,
    longitude: 121.7734
  }
}

export default {
  name: 'MyMap',
  props: {
    markersArr: { type: Array, default: () => [] },
    myLcat:     { type: Object, default: () => ({}) },
    preOpenMarkerId: { type: [String, Number], default: null },
    showHandDrawnMap: { type: Boolean, default: false }
  },
  data() {
    return {
		showPopup: false,
		UrlImg: config.UrlImg,
      _mapContext: null,
      listMarkers: [],
      chooseItemInfo: {},
      lastMarkerTapAt: 0,
      myLocation: {},
      state: {
        latitude: 29.028492 + 0.045 + 0.008,
        longitude: 121.567354 + 0.008,
        scale: 11,
        minScale: 4.5,
        markers: [],
        listMarkers: []
      },
      /* 瓦片层 */
      canvas: null,
      ctx: null,
      tileSize: 256,
      mapW: 0,
      mapH: 0,
      tileDrawTimer: null,
      tileDrawDelay: 160,
      tileDrawGeneration: 0,
      tileRequestTasks: [],
      markerIconCache: {},
      markerIconRequestTasks: [],
      markerIconGeneration: 0
    }
  },
  watch: {
    markersArr: {
      handler(n) { this.applyMarkers(n) },
      immediate: true
    },
    myLcat: {
      handler(n) { this.myLocation = n },
      immediate: true
    },
    showHandDrawnMap() {
      this.syncHandDrawnOverlay()
      this.syncHandDrawnTiles()
    }
  },
  mounted() {
    this._mapContext = uni.createMapContext('map', this)
    this.$nextTick(() => this.initCanvas())
    this.syncHandDrawnOverlay()
  },
  beforeDestroy() {
    this.cancelTileDrawTimer()
    this.tileDrawGeneration += 1
    this.abortTileRequests()
    this.markerIconGeneration += 1
    this.abortMarkerIconRequests()
  },
  beforeUnmount() {
    this.cancelTileDrawTimer()
    this.tileDrawGeneration += 1
    this.abortTileRequests()
    this.markerIconGeneration += 1
    this.abortMarkerIconRequests()
  },
	methods: {
	syncHandDrawnOverlay() {
		if (!this._mapContext) return
		if (this.showHandDrawnMap) {
			this._mapContext.addGroundOverlay({
				id: HAND_DRAWN_OVERLAY_ID,
				src: HAND_DRAWN_OVERLAY_SRC,
				bounds: HAND_DRAWN_OVERLAY_BOUNDS
			})
		} else {
			this._mapContext.removeGroundOverlay({
				id: HAND_DRAWN_OVERLAY_ID
			})
		}
	},
	syncHandDrawnTiles() {
		if (this.showHandDrawnMap) {
			this.scheduleDrawTiles(0)
			return
		}
		this.cancelTileDrawTimer()
		this.tileDrawGeneration += 1
		this.abortTileRequests()
		this.clearTileLayer()
	},
	applyMarkers(markers = []) {
		this.markerIconGeneration += 1
		const generation = this.markerIconGeneration
		this.abortMarkerIconRequests()
		const normalizedMarkers = this.normalizeMarkers(markers)
		const missingIconUrls = Array.from(new Set(
			normalizedMarkers
				.map(marker => marker._markerIconUrl)
				.filter(url => url && !this.markerIconCache[url])
		))
		if (!missingIconUrls.length) {
			this.listMarkers = normalizedMarkers
			this._tryPreOpenMarker()
			return
		}

		// 避免首屏先显示错误占位图，等本批 marker 图标准备好后一次性渲染。
		if (!this.listMarkers.length) {
			this.listMarkers = []
		}
		this.prepareMarkerIcons(missingIconUrls, generation, () => {
			if (generation !== this.markerIconGeneration) return
			this.listMarkers = this.normalizeMarkers(markers)
			this._tryPreOpenMarker()
		})
	},
	normalizeMarkers(markers = []) {
		if (!Array.isArray(markers)) return []
		return markers
			.map(item => this.normalizeMarker(item))
			.filter(Boolean)
	},
	normalizeMarker(item = {}) {
		const latitude = this.toNumber(item.latitude || item.lat)
		const longitude = this.toNumber(item.longitude || item.lng)
		if (!this.isValidCoordinate(latitude, longitude)) return null

		const iconSource = this.getMarkerIconSource(item)
		const remoteIconUrl = this.isRemoteUrl(iconSource) ? iconSource : ''
		const iconPath = remoteIconUrl ? (this.markerIconCache[remoteIconUrl] || DEFAULT_MARKER_ICON) : (iconSource || DEFAULT_MARKER_ICON)
		const address = item.address || item.addr || ''
		return {
			...item,
			id: item.id,
			latitude,
			longitude,
			iconPath,
			_markerIconUrl: remoteIconUrl,
			width: this.toNumber(item.width) || 40,
			height: this.toNumber(item.height) || 40,
			address,
			addr: item.addr || address,
			alpha: item.alpha == null ? 1 : Number(item.alpha)
		}
	},
	getMarkerIconSource(item = {}) {
		return item.iconPath || item.img_url || item.cover_url || item.image || (item.class && item.class.img_url) || DEFAULT_MARKER_ICON
	},
	isRemoteUrl(value = '') {
		return /^https?:\/\//i.test(String(value || ''))
	},
	prepareMarkerIcons(urls, generation, done) {
		if (!urls.length) {
			done()
			return
		}
		let pendingCount = urls.length
		const finishOne = () => {
			pendingCount -= 1
			if (pendingCount <= 0) done()
		}
		urls.forEach(url => {
			if (this.markerIconCache[url]) {
				finishOne()
				return
			}
			let requestTask = null
			requestTask = uni.downloadFile({
				url,
				success: (res) => {
					if (generation !== this.markerIconGeneration || res.statusCode !== 200 || !res.tempFilePath) return
					this.$set ? this.$set(this.markerIconCache, url, res.tempFilePath) : (this.markerIconCache[url] = res.tempFilePath)
				},
				fail: () => {},
				complete: () => {
					if (requestTask) this.removeMarkerIconRequestTask(requestTask)
					if (generation !== this.markerIconGeneration) return
					finishOne()
				}
			})
			if (requestTask && typeof requestTask.abort === 'function') {
				this.markerIconRequestTasks.push(requestTask)
			}
		})
	},
	abortMarkerIconRequests() {
		if (!this.markerIconRequestTasks.length) return
		this.markerIconRequestTasks.forEach(task => {
			if (task && typeof task.abort === 'function') {
				try {
					task.abort()
				} catch (e) {}
			}
		})
		this.markerIconRequestTasks = []
	},
	removeMarkerIconRequestTask(task) {
		const index = this.markerIconRequestTasks.indexOf(task)
		if (index > -1) this.markerIconRequestTasks.splice(index, 1)
	},
	toNumber(value) {
		const numberValue = Number(value)
		return Number.isFinite(numberValue) ? numberValue : 0
	},
	isValidCoordinate(latitude, longitude) {
		return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 && latitude !== 0 && longitude !== 0
	},
	formatDistance(marker) {
		if (!this.isValidCoordinate(this.myLocation.latitude, this.myLocation.longitude)) {
			return ''
		}
		const distancem = this.getDistance(this.myLocation.latitude, this.myLocation.longitude, marker.latitude, marker.longitude)
		if (!Number.isFinite(distancem)) return ''
		return distancem < 1000
		  ? Math.round(distancem) + ' 米'
		  : (distancem / 1000).toFixed(1) + ' 千米'
	},
	_tryPreOpenMarker() {
		if (!this.preOpenMarkerId) return
		const marker = this.listMarkers.find(item => String(item.id) === String(this.preOpenMarkerId))
		if (!marker) return
		const distance = this.formatDistance(marker)
		this.chooseItemInfo = { ...marker, distance }
		this.showPopup = true
	},
	openPopup(){
		this.showPopup = true
	},
	closePopup(){
		this.showPopup = false
	},
	onMapTap(e) {
		if (Date.now() - this.lastMarkerTapAt < 300) return
		this.chooseItemInfo = {}
		this.$emit('clearMarker')
		const { latitude, longitude } = e.detail;
		console.log('点击位置：', latitude, longitude);
		// 这里你可以做任何后续操作
	},
	chooseItemDao_old(){
		console.log('调起地图App')
		const { latitude, longitude, title } = this.chooseItemInfo;
		console.log('调起地图App2',latitude, longitude, title)
		if (!latitude || !longitude) return;
		wx.openLocation({
			latitude,
			longitude,
			name: title,
			address: this.chooseItemInfo.address || '',
			scale: 18
		});
	},
	chooseItemDao() {
	  const { latitude, longitude, title, address } = this.chooseItemInfo;
	  if (!latitude || !longitude) return;

	  console.log('导航', latitude, longitude); // 真机看日志

	  // ① 微信小程序
	  // #ifdef MP-WEIXIN
	  wx.openLocation({
	    latitude: Number(latitude),
	    longitude: Number(longitude),
	    name: String(title),
	    address: String(address || ''),
	    scale: 18
	  });
	  // #endif

	  // ② App 端（5+）
	  // #ifdef APP-PLUS
	  const url = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(title)})`;
	  plus.runtime.openURL(url, err => {
	    uni.showToast({ title: '未安装地图App', icon: 'none' });
	  });
	  // #endif

	  // ③ H5
	  // #ifdef H5
	  location.href = `https://uri.amap.com/navigation?to=${longitude},${latitude},${encodeURIComponent(title)}&mode=car&policy=1`;
	  // #endif
	},
    /* 辅助函数 */
    ll2tile(lon, lat, z) {
      const n = Math.pow(2, z)
      const x = Math.floor((lon + 180) / 360 * n)
      const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n)
      return { x, y }
    },
    tile2ll(x, y, z) {
      const n = Math.pow(2, z)
      const lon = x / n * 360 - 180
      const lat = 180 / Math.PI * (2 * Math.atan(Math.exp(Math.PI * (1 - 2 * y / n))) - Math.PI / 2)
      return { lon, lat }
    },
    ll2px(lon, lat, z) {
      const n = 256 * Math.pow(2, z)
      return { x: (lon + 180) / 360 * n, y: (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n }
    },
    cancelTileDrawTimer() {
      if (!this.tileDrawTimer) return
      clearTimeout(this.tileDrawTimer)
      this.tileDrawTimer = null
    },
    scheduleDrawTiles(delay = this.tileDrawDelay) {
      this.cancelTileDrawTimer()
      this.tileDrawTimer = setTimeout(() => {
        this.tileDrawTimer = null
        this.drawTiles()
      }, delay)
    },
    abortTileRequests() {
      if (!this.tileRequestTasks.length) return
      this.tileRequestTasks.forEach(task => {
        if (task && typeof task.abort === 'function') {
          try {
            task.abort()
          } catch (e) {}
        }
      })
      this.tileRequestTasks = []
    },
    removeTileRequestTask(task) {
      const index = this.tileRequestTasks.indexOf(task)
      if (index > -1) this.tileRequestTasks.splice(index, 1)
    },
    flushTileDraw(generation, drawTiles) {
      if (generation !== this.tileDrawGeneration || !drawTiles.length || !this.ctx) return

      this.ctx.clearRect(0, 0, this.mapW, this.mapH)
      drawTiles.forEach(tile => {
        this.ctx.drawImage(tile.path, tile.left, tile.top, this.tileSize, this.tileSize)
      })
      this.ctx.draw()
    },
    clearTileLayer() {
      if (!this.ctx || !this.mapW || !this.mapH) return
      this.ctx.clearRect(0, 0, this.mapW, this.mapH)
      this.ctx.draw()
    },
    drawTiles() {
      if (!this.ctx) return;
      if (!this.showHandDrawnMap) {
        this.clearTileLayer()
        return
      }

      const generation = this.tileDrawGeneration + 1
      this.tileDrawGeneration = generation
      this.abortTileRequests()

      const z = Math.round(this.state.scale) + 8;
      const centerPx = this.ll2px(this.state.longitude, this.state.latitude, z);
      const dx = this.mapW / 2, dy = this.mapH / 2;
      const minx = centerPx.x - dx, maxx = centerPx.x + dx;
      const miny = centerPx.y - dy, maxy = centerPx.y + dy;

      const tmin = {
        x: Math.floor(minx / this.tileSize),
        y: Math.floor(miny / this.tileSize)
      };
      const tmax = {
        x: Math.floor(maxx / this.tileSize),
        y: Math.floor(maxy / this.tileSize)
      };
      const drawTiles = [];
      const tileJobs = [];

      for (let x = tmin.x - 1; x <= tmax.x + 1; x++) {
        for (let y = tmin.y - 1; y <= tmax.y + 1; y++) {
          tileJobs.push({
            x,
            y,
            left: x * this.tileSize - minx,
            top: y * this.tileSize - miny
          });
        }
      }

      if (!tileJobs.length) return;

      let completedCount = 0;
      const finishTile = () => {
        completedCount += 1
        if (completedCount >= tileJobs.length) {
          this.flushTileDraw(generation, drawTiles)
        }
      }

      tileJobs.forEach(tile => {
          const url = this.UrlImg + `/baidu_map/offlineTiles/${z}/tile-${tile.x}_${tile.y}.png`;
          let requestTask = null
          requestTask = uni.downloadFile({
            url,
            success: res => {
              if (generation !== this.tileDrawGeneration) return
              if (res.statusCode === 200) {
                drawTiles.push({
                  path: res.tempFilePath,
                  left: tile.left,
                  top: tile.top
                });
              }
            },
            fail: () => {},
            complete: () => {
              if (requestTask) this.removeTileRequestTask(requestTask)
              if (generation !== this.tileDrawGeneration) return
              finishTile()
            }
          });
          if (requestTask && typeof requestTask.abort === 'function') {
            this.tileRequestTasks.push(requestTask)
          }
      });
    },
    initCanvas_old() {
      uni.createSelectorQuery()
        .in(this)
        .select('#tileLayer')
        .fields({ node: true, size: true })
        .exec(res => {
          this.canvas = res[0].node
          this.ctx = this.canvas.getContext('2d')
          this.mapW = res[0].width
          this.mapH = res[0].height
          this.canvas.width = this.mapW
          this.canvas.height = this.mapH
          this.drawTiles()
        })
    },
	initCanvas() {
	  this.ctx = uni.createCanvasContext('tileLayer', this);
	  this.mapW = uni.getSystemInfoSync().windowWidth;
	  this.mapH = uni.getSystemInfoSync().windowHeight;
	  this.drawTiles();
	},
    /* 原有业务方法 */
    markertap(e) {
		this.lastMarkerTapAt = Date.now()
		const marker = this.listMarkers.find(item => String(item.id) === String(e.detail.markerId))
		if (!marker) return;
		const distance = this.formatDistance(marker);
		this.chooseItemInfo = { ...marker, distance };
		console.log(this.chooseItemInfo)
		this.$emit('chooseMarker', this.chooseItemInfo);
    },
	getDistance(lat1, lon1, lat2, lon2) {
	  const R = 6371000; // 地球半径 m
	  const dLat = (lat2 - lat1) * Math.PI / 180;
	  const dLon = (lon2 - lon1) * Math.PI / 180;
	  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
	          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
	          Math.sin(dLon / 2) * Math.sin(dLon / 2);
	  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	  return Math.round(R * c);
	},
	toSearch(){
		uni.navigateTo({
			url: '/subPackages/feature/map_two/search'
		})
	},
    mapScaleUp() { this.updateMapScale(1) },
    mapScaleDown() { this.updateMapScale(2) },
    updateMapScale(type = 0, level = 15) {
      this._mapContext.getScale({
        success: res => {
          this.state.scale = res.scale
          this.$nextTick(() => {
            if (type === 0) this.state.scale = level
            else if (type === 1 && this.state.scale < 20) this.state.scale = Math.min(20, this.state.scale + 1)
            else if (type === 2 && this.state.scale > this.state.minScale) this.state.scale = Math.max(this.state.minScale, this.state.scale - 1)
          })
        }
      })
    },
    mapRegionchange(e) {
      if (e.type !== 'end') {
        this.cancelTileDrawTimer()
        if (this.tileRequestTasks.length) {
          this.tileDrawGeneration += 1
          this.abortTileRequests()
        }
        return
      }
      this._mapContext.getCenterLocation({
        success: res => {
          if (Math.abs(this.state.longitude - res.longitude) < 0.000005 &&
              Math.abs(this.state.latitude - res.latitude) < 0.000005) return
          this.$emit('moveMapView', res)
          this.state.latitude = res.latitude
          this.state.longitude = res.longitude
          this.$nextTick(() => this.scheduleDrawTiles())
        }
      })
    }
  }
}
</script>

<style lang="scss">
@font-face {
  font-family: 'mapico';
  src: url('./iconfont.ttf') format('truetype');
}
.mapico {
  font-family: mapico;
}
.map-box {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  .map-viw {
    width: 100%;
    height: 100%;
    flex: 2;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    .map {
      width: 100%;
      height: 100%;
      position: relative;
    }
  }
  .map-btn_s {
    width: 70rpx;
    height: 70rpx;
    position: fixed;
    right: 30rpx;
    top: 210rpx;
    .tool-btn {
      background-color: #ffffff;
      border-radius: 10rpx;
      width: 70rpx;
      height: 70rpx;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 8px #ccc;
      margin-bottom: 20rpx;
      .nvue-iconfont {
        display: block;
        position: relative;
        text-align: center;
        line-height: 76rpx;
        color: #333;
        font-size: 44rpx;
      }
    }
    .tool-btn2 {
      width: 70rpx;
      height: 70rpx;
      align-items: center;
      justify-content: center;
    }
  }
  .info-view {
    position: absolute;
    z-index: 2;
    width: 100%;
    height: 160rpx;
    bottom: 60rpx;
    left: 0;
    display: flex;
    justify-content: center;
    .iv-item {
      width: 90%;
      background-color: #ffffff;
      padding: 10rpx;
      height: 100%;
      border-radius: 20rpx;
      display: flex;
      flex-direction: row;
      align-items: center;
      .ivi-img {
        padding: 10rpx;
		padding-left: 20rpx;
        width: 140rpx;
        height: 100rpx;
      }
	  .ivi-img2{
		  width: 36rpx;
		  height: 36rpx;
	  }
      .ivi-text {
        flex: 2;
		width: calc(100% - 140rpx - 60rpx);
		margin-left: 20rpx;
		height: 3.6rem;
        display: flex;
        flex-direction: column;
		justify-content: space-between;
        .ivi-t-title {
          font-size: 1rem;
          font-weight: bold;
          color: #333;
        }
        .ivi-t-address {
          font-size: 0.8rem;
          color: #999;
        }
      }
    }
  }
  .tile-layer {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .tile-layer-hidden {
    opacity: 0;
  }
}



/* 遮罩层 */
.popup-mask {
	position: fixed;
	top: 0;
	left: 0;
	animation: maskFadeIn 0.3s ease forwards;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 100;
}

/* 底部弹窗 */
.popup-container {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #F7F7F7;
	border-radius: 24rpx 24rpx 0 0;
	z-index: 101;
	transform: translateY(105%);
	transition: transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.popup-container.popup-show {
	transform: translateY(0);
}

.popup-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #eee;
}

.popup-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.popup-close {
	font-size: 48rpx;
	color: #999;
	line-height: 1;
}

.popup-content {
	padding: 30rpx;
	min-height: 600rpx;
	margin: 20rpx 40rpx;
}
.popup-content-imgs{
	width: 100%;
	height: 360rpx;
	.content-imgs-mask{
		width: calc(100% - 0rpx);
		height: 360rpx;
		background: rgba(0, 0, 0, 0.3);
		position: relative;
		bottom: 366rpx;
		border-radius: 20rpx;
	}
	.content-imgs-img{
		width: 100%;
		height: 100%;
		border-radius: 20rpx;
	}
}
.popup-content-bgcon{
	height: 10rpx;
	.content-imgs-title{
		position: relative;
		left: 40rpx;
		bottom: 320rpx;
		color: #fff;
		font-weight: 550;
	}
	.content-imgs-address{
		display: flex;
		position: relative;
		left: 40rpx;
		bottom: 290rpx;
		color: #fff;
		font-size: 22rpx;
		image{
			margin-right: 10rpx;
			width: 30rpx;
			height: 30rpx;
		}
	}
	.content-imgs-dh-box{
		position: relative;
		right: 50rpx;
		bottom: 180rpx;
		color: #fff;
		display: flex;
		justify-content: flex-end;
		.content-imgs-dh{
			width: 132rpx;
			height: 64rpx;
			background: #0062F4;
			display: flex;
			justify-content: center;
			align-items: center;
			border-radius: 10rpx;
			image{
				margin-right: 4rpx;
				width: 30rpx;
				height: 30rpx;
			}
		}
	}
}
.popup-content-title{
	margin-top: 40rpx;
	font-size: 36rpx;
}
.popup-content-html{
	width: 100%;
	margin-top: 10rpx;
	.popup-content-con{
		min-height: 200rpx;
		background: #fff;
		padding: 30rpx;
		border-radius: 20rpx;
		font-size: 28rpx;
		color: #90A0B9;
	}
}

@keyframes maskFadeIn {
	from { opacity: 0; }
	to   { opacity: 1; }
}

.map-box {
	background: #EEF5EF;
}

.map-box .map-btn_s .tool-btn,
.map-box .info-view .iv-item {
	background: rgba(255, 252, 244, 0.96);
	border: 1rpx solid rgba(184, 129, 43, 0.16);
	box-shadow: 0 10rpx 24rpx rgba(43, 57, 45, 0.12);
}

.map-box .map-btn_s .tool-btn {
	border-radius: 22rpx;
}

.map-box .info-view .iv-item {
	border-radius: 28rpx;
}

.map-box .info-view .iv-item .ivi-img {
	border-radius: 22rpx;
	padding: 0;
	margin-left: 16rpx;
}

.map-box .info-view .iv-item .ivi-text .ivi-t-title {
	color: #183B34;
}

.map-box .info-view .iv-item .ivi-text .ivi-t-address {
	color: #6C766D;
}

.popup-container {
	background: #FFFCF4;
	border: 1rpx solid rgba(184, 129, 43, 0.16);
}

.popup-header {
	border-bottom-color: rgba(184, 129, 43, 0.14);
}

.popup-title,
.popup-content-title {
	color: #183B34;
}

.popup-content-html .popup-content-con {
	background: rgba(238, 245, 239, 0.92);
	color: #4F6259;
}

.popup-content-bgcon .content-imgs-dh {
	background: linear-gradient(135deg, #244C41 0%, #367063 100%);
}
</style>
