<template>
	<view class="container">
		<!-- 自定义导航栏 - 透明背景 -->
		<custom-nav
			title="剧游中国"
      :left-icon="UrlImg + '/baidu_map/weatch/images/left.png'"
			background-color="transparent"
			@leftClick="goBack"
		/>

		<!-- 短剧卡片网格滚动区域 -->
		<scroll-view class="scroll-content" scroll-y @scrolltolower="loadMoreDrama">
			<view class="hero-section">
				<image class="bg-image" :src="UrlImg + '/baidu_map/weatch/images/img4.png'" mode="widthFix"></image>
			</view>
			<view class="city-filter-bar">
				<scroll-view class="city-tabs" scroll-x :show-scrollbar="false">
					<view
						v-for="item in cityTabs"
						:key="item.value"
						:class="['city-tab', { active: activeCity.value === item.value }]"
						@click="selectCity(item)"
					>
						{{ item.value }}
					</view>
				</scroll-view>
				<view class="video-search">
					<input
						class="search-input"
						v-model.trim="searchKeyword"
						placeholder="搜视频"
						confirm-type="search"
					/>
					<text class="search-icon">⌕</text>
				</view>
			</view>
			<view class="drama-grid">
				<view class="drama-card" v-for="(item, index) in filteredDramaList" :key="item.id || index">
					<!-- 封面图片 -->
					<view class="drama-image-wrapper" @click="goToDramaDetail(item)">
						<image class="drama-image" :src="item.cover" mode="aspectFill"></image>
						<!-- 集数标签 -->
						<view class="drama-badge">{{ item.episodes }}</view>
					</view>
					<!-- 标题 -->
					<text class="drama-title">{{ item.title }}</text>
				</view>
			</view>
			<view class="empty-status" v-if="!loading && filteredDramaList.length === 0">
				<text>{{ searchKeyword ? '没有搜到相关视频' : '暂无视频' }}</text>
			</view>
			<!-- 加载状态 -->
			<view class="loading-status">
				<text v-if="loading">加载中...</text>
				<text v-else-if="noMore && page > 1">没有更多了</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import CustomNav from '@/components/custom-nav/custom-nav.vue'
import config from '@/request/config.js'
import request from '@/request/request.js'

const DEFAULT_PROVINCE_NAME = '浙江省'
const PROVINCE_NAMES = [
	'北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
	'上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
	'湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州',
	'云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆', '台湾',
	'香港', '澳门'
]
const DEFAULT_CITY_TAB = {
	label: DEFAULT_PROVINCE_NAME,
	value: `剧游${DEFAULT_PROVINCE_NAME.replace(/省|市|自治区|特别行政区/g, '')}`,
	requestValue: DEFAULT_PROVINCE_NAME.replace(/省|市|自治区|特别行政区/g, ''),
	requestValues: ['蛇蟠岛', '杨家板龙', '杨家村']
}
const ZHEJIANG_LOCAL_ADDRESS_NAMES = ['蛇蟠岛', '杨家板龙', '杨家村']

export default {
	components: {
		CustomNav
	},
	data() {
		return {
      UrlImg: config.UrlImg,
			page: 1,  // 当前页码
			page_size: 10,  // 每次下拉加载10个视频
			dramaList: [],
			cityTabs: [DEFAULT_CITY_TAB],
			activeCity: DEFAULT_CITY_TAB,
			searchKeyword: '',
			loading: false,  // 加载状态
			noMore: false    // 没有更多数据
		}
	},
	computed: {
		filteredDramaList() {
			const keyword = String(this.searchKeyword || '').trim()
			if (!keyword) return this.dramaList
			return this.dramaList.filter(item => item.title && item.title.includes(keyword))
		}
	},
	onLoad() {
		// 页面加载时调用接口
		this.loadCityTabs()
	},
	methods: {
		// 获取短剧列表
		async getDramaList() {
			if (this.loading || this.noMore) return
			this.loading = true
			try {
				const userId = uni.getStorageSync('userId') || 1
				const requestValues = this.getActiveAddressRequestValues()
				const isMergedAddress = requestValues.length > 1
				const requestPageSize = isMergedAddress ? this.page * this.page_size : this.page_size
				const responses = await Promise.all(requestValues.map(addressName => {
					const params = {
						userId,
						type: "1,2,3",
						page: isMergedAddress ? 1 : this.page,
						page_size: requestPageSize,
						address_name: addressName
					}
					return request('api2/Drama/getDrama', params, 'GET')
				}))
				console.log('接口返回数据:', responses)
				const responseData = responses.reduce((result, res) => {
					if (res.code == 0 && Array.isArray(res.data)) {
						return result.concat(res.data)
					}
					return result
				}, [])
				const currentPageData = responseData.slice((this.page - 1) * this.page_size, this.page * this.page_size)

				// 处理返回的数据
				if (currentPageData.length > 0) {
					const newList = currentPageData.map(item => ({
						id: item.id,
						title: item.title,
						cover: item.cover_url,
						addressName: item.address_name || '',
						episodes: item.total_episodes ? `${item.total_episodes}集全` : '更新中'
					}))
					this.dramaList = this.page === 1 ? newList : this.dramaList.concat(newList)
					// 判断是否还有更多数据
					if (responseData.length <= this.page * this.page_size) {
						this.noMore = true
					} else {
						this.noMore = false
					}
				} else {
					this.dramaList = []
					this.noMore = true
				}
			} catch (error) {
				console.error('接口调用失败:', error)
			} finally {
				this.loading = false
			}
		},
		async loadCityTabs() {
			let hasAddressTabs = false
			try {
				const res = await request('api2/Drama/getDramaAddressNames', {}, 'GET')
				const list = res.code == 0 && Array.isArray(res.data) ? res.data : []
				hasAddressTabs = list.length > 0
				this.cityTabs = this.normalizeCityTabs(list)
				this.activeCity = this.cityTabs[0] || DEFAULT_CITY_TAB
			} catch (error) {
				console.error('获取剧游城市标签失败:', error)
				this.cityTabs = [DEFAULT_CITY_TAB]
				this.activeCity = DEFAULT_CITY_TAB
			}
			await this.resetDramaList()
			if (!hasAddressTabs && this.cityTabs.length <= 1) {
				const fallbackTabs = this.normalizeCityTabs(this.fallbackCityTabsFromDrama(this.dramaList))
				const fallbackActive = fallbackTabs.find(item => item.value === this.activeCity.value) || fallbackTabs[0] || DEFAULT_CITY_TAB
				this.cityTabs = fallbackTabs
				if (fallbackActive.value !== this.activeCity.value) {
					this.activeCity = fallbackActive
					await this.resetDramaList()
					return
				}
				this.activeCity = fallbackActive
			}
		},
		normalizeCityTabs(list = []) {
			const seen = new Set()
			const tabs = list.map(name => {
				const value = String(name || '').trim()
				const tabValue = this.normalizeCityTabValue(value)
				if (!tabValue || seen.has(tabValue)) return null
				seen.add(tabValue)
				return {
					label: tabValue,
					value: tabValue,
					requestValue: this.normalizeAddressNameForRequest(tabValue),
					requestValues: this.getAddressRequestValues(value)
				}
			}).filter(Boolean)
			return tabs.length > 0 ? tabs : [DEFAULT_CITY_TAB]
		},
		normalizeCityTabValue(value = '') {
			const requestValue = this.normalizeAddressNameForRequest(value)
			if (ZHEJIANG_LOCAL_ADDRESS_NAMES.includes(requestValue)) return DEFAULT_CITY_TAB.value
			return String(value || '').trim()
		},
		normalizeAddressNameForRequest(value = '') {
			return String(value || '').trim().replace(/^剧游/, '')
		},
		getAddressRequestValues(value = '') {
			const requestValue = this.normalizeAddressNameForRequest(value)
			if (ZHEJIANG_LOCAL_ADDRESS_NAMES.includes(requestValue) || requestValue === DEFAULT_CITY_TAB.requestValue) {
				return ZHEJIANG_LOCAL_ADDRESS_NAMES
			}
			return requestValue ? [requestValue] : []
		},
		getActiveAddressRequestValues() {
			const values = Array.isArray(this.activeCity.requestValues) && this.activeCity.requestValues.length > 0
				? this.activeCity.requestValues
				: [this.activeCity.requestValue]
			return [...new Set(values.filter(Boolean))]
		},
		fallbackCityTabsFromDrama(list = []) {
			return list.map(item => `剧游${this.getDramaProvince(item).replace(/省|市|自治区|特别行政区/g, '')}`)
		},
		async resetDramaList() {
			this.page = 1
			this.noMore = false
			this.dramaList = []
			await this.getDramaList()
		},
		selectCity(item) {
			if (!item || item.value === this.activeCity.value) return
			this.activeCity = item
			this.searchKeyword = ''
			this.resetDramaList()
		},
		normalizeProvinceName(name = '') {
			const province = String(name || '').replace(/省|市|自治区|壮族自治区|回族自治区|维吾尔自治区|特别行政区/g, '')
			if (!province) return DEFAULT_PROVINCE_NAME
			if (['北京', '天津', '上海', '重庆'].includes(province)) return `${province}市`
			if (['内蒙古', '广西', '宁夏', '新疆', '西藏'].includes(province)) return `${province}自治区`
			if (['香港', '澳门'].includes(province)) return `${province}特别行政区`
			return `${province}省`
		},
		getDramaProvince(item) {
			const address = String(item.addressName || item.address_name || '').replace(/^取景地[:：]\s*/, '').trim()
			const matchedProvince = PROVINCE_NAMES.find(province => address.includes(province))
			if (matchedProvince) return this.normalizeProvinceName(matchedProvince)
			const firstPart = address.split(/[·,，、\s-]+/).find(Boolean)
			if (firstPart && PROVINCE_NAMES.includes(firstPart)) return this.normalizeProvinceName(firstPart)
			return DEFAULT_PROVINCE_NAME
		},
		loadMoreDrama() {
			if (this.loading || this.noMore) return
			this.page++
			this.getDramaList()
		},

		// 返回上一页
		goBack() {
			uni.navigateBack()
		},
		// 跳转到短剧详情
		goToDramaDetail(item) {
			uni.navigateTo({
				url: `/subPackages/feature/shortPlays/shortPlays?id=${item.id}&title=${item.title}`
			})
		}
	}
}
</script>

<style scoped>
.container {
	position: relative;
	height: 100vh;
	overflow: hidden;
	background: #EAF8F6;
}

/* 滚动区域 */
.scroll-content {
	position: relative;
	height: 100vh;
	z-index: 1;
	box-sizing: border-box;
}

.hero-section {
	position: relative;
	width: 100%;
}

/* 背景图片 */
.bg-image {
	display: block;
	width: 100%;
}

.city-filter-bar {
	display: flex;
	align-items: center;
	gap: 18rpx;
	position: relative;
	z-index: 2;
	margin-top: -860rpx;
	padding: 20rpx 24rpx 12rpx;
	box-sizing: border-box;
	background: linear-gradient(180deg, rgba(234, 248, 246, 0), rgba(234, 248, 246, 0.86) 42%, #EAF8F6 100%);
}

.city-tabs {
	flex: 1;
	min-width: 0;
	white-space: nowrap;
}

.city-tab {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 14rpx 22rpx 18rpx;
	margin-right: 10rpx;
	color: rgba(38, 38, 38, 0.66);
	font-size: 30rpx;
	font-weight: 500;
	position: relative;
}

.city-tab.active {
	color: #111111;
	font-weight: 700;
}

.city-tab.active::after {
	content: '';
	position: absolute;
	left: 28rpx;
	right: 28rpx;
	bottom: 4rpx;
	height: 5rpx;
	border-radius: 999rpx;
	background: #111111;
}

.video-search {
	display: flex;
	align-items: center;
	flex: 0 0 172rpx;
	height: 64rpx;
	padding: 0 18rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.78);
	border: 1rpx solid rgba(17, 17, 17, 0.08);
	box-shadow: 0 8rpx 22rpx rgba(32, 91, 86, 0.12);
	box-sizing: border-box;
}

.search-input {
	flex: 1;
	min-width: 0;
	height: 64rpx;
	font-size: 24rpx;
	color: #222222;
}

.search-icon {
	color: #555555;
	font-size: 34rpx;
	line-height: 1;
}

/* 短剧卡片网格 */
.drama-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
	position: relative;
	z-index: 2;
	padding: 12rpx 30rpx 40rpx;
}

.drama-card {
	border-radius: 16rpx;
	overflow: hidden;
	transition: transform 0.3s;
}

.drama-card:active {
	transform: scale(0.98);
}

/* 封面图片区域 */
.drama-image-wrapper {
	position: relative;
	width: 100%;
	overflow: hidden;
}

.drama-image {
	width: 339rpx;
	height: 440rpx;
}

/* 集数标签 */
.drama-badge {
	position: absolute;
	bottom: 12rpx;
	right: 12rpx;
	background: rgba(0, 0, 0, 0.7);
	color: #FFFFFF;
	font-size: 22rpx;
	padding: 6rpx 16rpx;
	border-radius: 20rpx;
	backdrop-filter: blur(4px);
}

/* 标题 */
.drama-title {
	display: block;
	font-size: 28rpx;
	font-weight: 500;
	color: #333333;
	padding: 20rpx;
	line-height: 1.4;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* 加载状态 */
.loading-status {
	text-align: center;
	padding: 30rpx 0;
	color: #999999;
	font-size: 26rpx;
}

.empty-status {
	position: relative;
	z-index: 2;
	text-align: center;
	padding: 80rpx 0 120rpx;
	color: #8B8B8B;
	font-size: 28rpx;
}

.pagination-bar {
	position: relative;
	z-index: 2;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 28rpx;
	padding: 16rpx 30rpx 36rpx;
}

.page-btn {
	min-width: 132rpx;
	height: 58rpx;
	line-height: 58rpx;
	text-align: center;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.84);
	color: #222222;
	font-size: 26rpx;
	box-shadow: 0 8rpx 20rpx rgba(32, 91, 86, 0.12);
}

.page-btn.disabled {
	opacity: 0.42;
}

.page-text {
	color: #555555;
	font-size: 26rpx;
}

.container {
	background: linear-gradient(180deg, #F8F1E4 0%, #F2E8D7 46%, #EEF5EF 100%);
}

.city-filter-bar {
	background: linear-gradient(180deg, rgba(248, 241, 228, 0), rgba(248, 241, 228, 0.9) 38%, #F2E8D7 100%);
}

.city-tab {
	color: #6C766D;
}

.city-tab.active {
	color: #183B34;
}

.city-tab.active::after {
	background: #B8812B;
}

.video-search,
.page-btn {
	background: rgba(255, 252, 244, 0.94);
	border: 1rpx solid rgba(184, 129, 43, 0.16);
	box-shadow: 0 10rpx 24rpx rgba(43, 57, 45, 0.1);
}

.drama-card {
	background: rgba(255, 252, 244, 0.96);
	border: 1rpx solid rgba(184, 129, 43, 0.14);
	border-radius: 28rpx;
	box-shadow: 0 12rpx 28rpx rgba(43, 57, 45, 0.09);
}

.drama-image-wrapper,
.drama-image {
	border-radius: 26rpx 26rpx 0 0;
}

.drama-badge {
	background: linear-gradient(135deg, #B8812B, #E1B55D);
	border-radius: 999rpx;
}

.drama-title {
	color: #183B34;
	font-weight: 800;
}

.loading-status,
.empty-status,
.page-text {
	color: #6C766D;
}
</style>
