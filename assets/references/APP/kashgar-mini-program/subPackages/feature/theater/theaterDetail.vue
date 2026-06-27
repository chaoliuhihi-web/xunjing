<template>
  <view class="container">
    <view v-if="useKashgarStoryDetail" class="kashgar-story-detail">
      <image class="kashgar-story-background" :src="kashgarStory.cover" mode="aspectFill"></image>
      <view class="kashgar-story-shade"></view>

      <view class="kashgar-story-nav">
        <view class="kashgar-story-back" @click="goBack">‹</view>
        <text class="kashgar-story-nav-title">{{ kashgarStory.title }}</text>
        <view class="kashgar-story-capsule">
          <text>•••</text>
          <view class="kashgar-story-capsule-line"></view>
          <text class="kashgar-story-ring">◎</text>
        </view>
      </view>

      <view class="kashgar-story-play" @click="toggleKashgarStoryPlay">
        <text class="kashgar-story-play-icon">{{ kashgarStoryPlaying ? 'Ⅱ' : '▶' }}</text>
      </view>

      <view class="kashgar-story-side">
        <image class="kashgar-story-avatar" :src="kashgarStory.authorAvatar" mode="aspectFill"></image>
        <text class="kashgar-story-author">{{ kashgarStory.author }}</text>
        <view class="kashgar-story-follow" @click="handleKashgarFollow">{{ kashgarStoryFollowed ? '已关注' : '+ 关注' }}</view>
        <view class="kashgar-story-side-action" @click="toggleKashgarStoryLike">
          <text class="kashgar-story-heart">{{ kashgarStoryLiked ? '♥' : '♡' }}</text>
          <text>{{ kashgarStory.likeText }}</text>
        </view>
        <view class="kashgar-story-side-action" @click="handleShare">
          <text class="kashgar-story-share">↗</text>
          <text>分享</text>
        </view>
      </view>

      <view class="kashgar-story-content">
        <view class="kashgar-story-location">
          <text class="kashgar-story-pin">●</text>
          <text>{{ kashgarStory.location }}</text>
        </view>
        <text class="kashgar-story-title">{{ kashgarStory.title }}</text>
        <view class="kashgar-story-tags">
          <text v-for="tag in kashgarStory.tags" :key="tag">{{ tag }}</text>
        </view>
        <text class="kashgar-story-meta">{{ kashgarStory.metaText }}</text>
        <view class="kashgar-story-copy" :class="{ 'kashgar-story-copy-expanded': kashgarStoryExpanded }">
          <text v-for="line in kashgarStory.lines" :key="line">{{ line }}</text>
        </view>
        <view class="kashgar-story-expand" @click="expandKashgarStory">
          <text>{{ kashgarStoryExpanded ? '收起' : '展开' }}</text>
          <text>{{ kashgarStoryExpanded ? '⌃' : '⌄' }}</text>
        </view>
      </view>

      <view class="kashgar-story-bottom">
        <view class="kashgar-story-comment" @click="focusKashgarComment">
          <text class="kashgar-story-pencil">✎</text>
          <text>说点什么…</text>
        </view>
        <view class="kashgar-story-bottom-action" @click="toggleKashgarStoryFavorite">
          <text>{{ kashgarStoryFavorited ? '★' : '☆' }}</text>
          <text>收藏</text>
        </view>
        <view class="kashgar-story-bottom-action" @click="focusKashgarComment">
          <text>◌</text>
          <text>326</text>
        </view>
        <view class="kashgar-story-bottom-action" @click="showKashgarStoryMore">
          <text>•••</text>
          <text>更多</text>
        </view>
      </view>
    </view>
    <template v-else>
    <!-- 顶部导航 -->
    <custom-nav
      title="喀什剧场"
      :show-back="false"
      :left-icon="UrlImg + '/baidu_map/weatch/images/left.png'"
      @leftClick="goBack"
    />

    <!-- 抖音风格视频滑动区域 -->
    <swiper
      class="video-swiper"
      :vertical="true"
      :current="currentIndex"
      @change="onSwiperChange"
      :duration="300"
      :easing-function="'easeOutCubic'"
    >
      <swiper-item v-for="(item, index) in episodeList" :key="item.id" class="swiper-item">
        <view class="video-container" @click="onScreenClick(item)">
          <video
            v-if="shouldRenderVideo(index)"
            :id="'video-' + index"
            class="full-video"
            :src="item.video_url"
            :poster="item.cover_url"
            :autoplay="index === currentIndex"
            :controls="true"
            object-fit="contain"
            :show-fullscreen-btn="false"
            :show-play-btn="true"
            :enable-progress-gesture="true"
            @play="onVideoPlay(index)"
            @pause="onVideoPause(index)"
          ></video>
          <view v-else class="video-placeholder">
            <image
              v-if="item.cover_url"
              class="placeholder-cover"
              :src="item.cover_url"
              mode="aspectFit"
              lazy-load
            ></image>
          </view>
          <cover-image class="video-logo" :src="VIDEO_LOGO_URL"></cover-image>
          <!-- 双击点赞动画 -->
          <view v-if="showLikeAnim && index === currentIndex" class="like-animation">
            <image :src="iconPaths.like" class="like-heart" mode="aspectFit"></image>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <!-- 右侧操作栏 -->
    <view class="side-bar">
      <!-- 头像 -->
      <view class="avatar-wrapper">
        <image class="avatar" :src="brand.img_url" mode="aspectFill"></image>
        <view class="follow-btn" @click="handleFollow" v-if="!isFollowed">
          <image class="follow-icon" :src="iconPaths.follow" mode="aspectFit"></image>
        </view>
      </view>

      <!-- 点赞 -->
      <view class="action-item" @click="handleLike">
        <image class="action-icon" :src="episodeList[currentIndex]?.isLiked ? iconPaths.liked : iconPaths.like" mode="aspectFit"></image>
        <text class="action-text">{{ episodeList[currentIndex]?.zan_num || 0 }}</text>
      </view>

      <!-- 分享 -->
      <view class="action-item" @click="handleShare">
        <image class="action-icon" :src="iconPaths.share" mode="aspectFit"></image>
        <text class="action-text">分享</text>
      </view>
    </view>

    <!-- 底部信息区域 -->
    <view class="bottom-info">
      <text class="author-name">@{{ brand.name || '作者名称' }}</text>
      <text class="video-tags">{{ drama.title }}</text>
      <text class="video-episodes">{{ episodeList[currentIndex]?.episode_no }} · 共{{ episodeList.length }}集</text>
      <text class="video-date">{{ episodeList[currentIndex]?.created_at?.split(' ')[0] }}</text>
    </view>
    </template>
  </view>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import CustomNav from '@/components/custom-nav/custom-nav.vue'
import config from '@/request/config.js'
import request from '@/request/request.js'

const VIDEO_RENDER_BUFFER = 1
const KASHGAR_STORY_DETAIL_LOCAL_CONTENT_ENABLED = true
const UrlImg = config.UrlImg
const VIDEO_LOGO_URL = 'https://www.neoxiake.com//upload/admin/20260602/d307da0de58c7b5ab10dc6abf35797da.png'
const iconPaths = { like: '/static/tabbar/456.png', liked: '/static/tabbar/444.png', follow: '/static/tabbar/333.png', share: '/static/tabbar/luj.png' }
const dramaId = ref('')
const useKashgarStoryDetail = ref(false)
const kashgarStoryPlaying = ref(false)
const kashgarStoryLiked = ref(false)
const kashgarStoryFavorited = ref(false)
const kashgarStoryFollowed = ref(false)
const kashgarStoryExpanded = ref(false)
const kashgarStory = ref({
  id: 701,
  title: '沿着石巷去看喀什',
  location: '喀什古城',
  author: '星河漫游记',
  authorAvatar: '/static/kashgar/story-author-avatar.png',
  cover: '/static/kashgar/story-stone-alley-final.png',
  likeText: '1.2万',
  date: '2025/05/19',
  readMinutes: 5,
  metaText: '2025/05/19 · 阅读约 5 分钟',
  tags: ['# 人文', '# 美食', '# 古城', '# 老街', '# 慢生活'],
  lines: [
    '清晨的喀什，阳光刚洒进石巷，馕香与茶香已在街角升腾。',
    '老城的每一块砖、每一扇门，都在低声诉说着时光的故事。',
    '跟着我的脚步，一起慢慢走进喀什的日常。'
  ]
})
const currentIndex = ref(0) // 当前播放的集数索引
const drama = ref({}) // 剧集信息
const brand = ref({}) // 品牌信息
const episodeList = ref([]) // 集数列表
const routeLikeState = ref(null)
const routeZanNum = ref(null)
const routeDramaType = ref(null)
const videoContexts = new Map()
const activeTimers = new Set()
let playTimer = null
let likeAnimTimer = null

// 双击点赞相关
const lastClickTime = ref(0)
const showLikeAnim = ref(false)

// 关注状态
const isFollowed = ref(false)

const normalizeEpisodeLikeState = (episodes = [], dramaInfo = {}) => {
  const dramaLiked = routeLikeState.value !== null ? routeLikeState.value : Number(dramaInfo.zan || dramaInfo.is_zan || 0) === 1
  const dramaZanNum = routeZanNum.value !== null ? routeZanNum.value : Number(dramaInfo.zan_num || 0)
  return episodes.map(item => {
    return {
      ...item,
      zan_num: dramaZanNum || Number(item.zan_num || 0),
      isLiked: dramaLiked
    }
  })
}

const applyDramaLikeSummary = (likedDrama) => {
  if (!likedDrama) return
  routeLikeState.value = null
  routeZanNum.value = null
  drama.value = {
    ...drama.value,
    zan_num: Number(likedDrama.zan_num || drama.value.zan_num || 0),
    is_zan: 1,
    zan: 1
  }
  episodeList.value = normalizeEpisodeLikeState(episodeList.value, drama.value)
}

const getCurrentDramaType = () => Number(drama.value.type || routeDramaType.value || 3)

const isKashgarLocalStoryRoute = (options = {}) => {
  if (!KASHGAR_STORY_DETAIL_LOCAL_CONTENT_ENABLED) return false
  const id = String(options.dramaId || options.id || '')
  return options.localStory === '1' || ['701', '702', '703', '704', '705', '706'].includes(id)
}

const toggleKashgarStoryPlay = () => {
  kashgarStoryPlaying.value = !kashgarStoryPlaying.value
}

const toggleKashgarStoryLike = () => {
  kashgarStoryLiked.value = !kashgarStoryLiked.value
  uni.showToast({
    title: kashgarStoryLiked.value ? '已点赞' : '已取消点赞',
    icon: 'none'
  })
}

const toggleKashgarStoryFavorite = () => {
  kashgarStoryFavorited.value = !kashgarStoryFavorited.value
  uni.showToast({
    title: kashgarStoryFavorited.value ? '已收藏' : '已取消收藏',
    icon: 'none'
  })
}

const handleKashgarFollow = () => {
  kashgarStoryFollowed.value = !kashgarStoryFollowed.value
  uni.showToast({
    title: kashgarStoryFollowed.value ? '关注成功' : '已取消关注',
    icon: 'none'
  })
}

const expandKashgarStory = () => {
  kashgarStoryExpanded.value = !kashgarStoryExpanded.value
}

const focusKashgarComment = () => {
  uni.showToast({
    title: '评论功能演示中',
    icon: 'none'
  })
}

const showKashgarStoryMore = () => {
  uni.showActionSheet({
    itemList: ['保存海报', '复制链接', '不感兴趣']
  })
}

const emitTheaterLikeChange = (isLiked) => {
  if (!drama.value.id) return
  uni.$emit('theaterLikeChanged', {
    id: drama.value.id,
    type: getCurrentDramaType(),
    isLiked,
    zan_num: Number(drama.value.zan_num || 0)
  })
}

const syncDramaLikeSummary = async (userId) => {
  if (!userId || !drama.value.id) return
  try {
    const params = {
      userId,
      type: getCurrentDramaType(),
      page: 1,
      page_size: 100
    }
    const res = await request('api2/Drama/getZanDrama', params, 'GET')
    if (res.code != 0 || !res.data || !Array.isArray(res.data.list)) return
    const likedDrama = res.data.list.find(item => String(item.id) === String(drama.value.id))
    if (!likedDrama) return
    applyDramaLikeSummary(likedDrama)
  } catch (error) {
    console.error('同步喀什剧场点赞数量失败:', error)
  }
}

const shouldRenderVideo = (index) => {
  return Math.abs(index - currentIndex.value) <= VIDEO_RENDER_BUFFER
}

const setManagedTimeout = (callback, delay) => {
  const timer = setTimeout(() => {
    activeTimers.delete(timer)
    callback()
  }, delay)
  activeTimers.add(timer)
  return timer
}

const clearManagedTimeout = (timer) => {
  if (!timer) return
  clearTimeout(timer)
  activeTimers.delete(timer)
}

const getVideoId = (index) => `video-${index}`

const getVideoContext = (index) => {
  if (index < 0 || index >= episodeList.value.length || !shouldRenderVideo(index)) {
    return null
  }

  const videoId = getVideoId(index)
  if (!videoContexts.has(videoId)) {
    videoContexts.set(videoId, uni.createVideoContext(videoId))
  }

  return videoContexts.get(videoId)
}

const pauseVideoContext = (context) => {
  try {
    context?.pause?.()
  } catch (error) {
    console.warn('暂停视频失败:', error)
  }
}

const stopVideoContext = (context) => {
  try {
    context?.pause?.()
    context?.stop?.()
  } catch (error) {
    console.warn('停止视频失败:', error)
  }
}

const pauseVideo = (index) => {
  pauseVideoContext(getVideoContext(index))
}

const playVideo = async (index) => {
  await nextTick()

  if (index !== currentIndex.value) return

  clearManagedTimeout(playTimer)
  playTimer = setManagedTimeout(() => {
    playTimer = null
    if (index !== currentIndex.value) return

    const videoContext = getVideoContext(index)
    if (videoContext) {
      videoContext.play()
    }
  }, 80)
}

const cleanupOutOfRangeVideoContexts = () => {
  videoContexts.forEach((context, videoId) => {
    const index = Number(videoId.replace('video-', ''))
    if (!shouldRenderVideo(index)) {
      stopVideoContext(context)
      videoContexts.delete(videoId)
    }
  })
}

const cleanupAllTimers = () => {
  activeTimers.forEach((timer) => clearTimeout(timer))
  activeTimers.clear()
  playTimer = null
  likeAnimTimer = null
}

const cleanupVideoContexts = () => {
  videoContexts.forEach((context) => {
    stopVideoContext(context)
  })
  videoContexts.clear()
}

// 获取视频详情
const getVideoDetail = async () => {
  try {
    const userId = uni.getStorageSync('userId') || 1
    const params = {
      userId: userId,
      data_id: dramaId.value
    }
    const res = await request('api2/Drama/getDramaDetail', params, 'GET')
    console.log('接口返回:', res)
    if (res.code == 0 && res.data) {
      const data = res.data
      drama.value = data.drama || {}
      brand.value = data.brand || {}
      episodeList.value = normalizeEpisodeLikeState(data.list || [], drama.value)
      if (routeLikeState.value === null) {
        await syncDramaLikeSummary(userId)
      }
      currentIndex.value = 0
      playVideo(currentIndex.value)
    }
  } catch (error) {
    console.error('获取视频详情失败:', error)
  }
}

// swiper切换事件
const onSwiperChange = (e) => {
  const newIndex = e.detail.current
  const oldIndex = currentIndex.value

  // 暂停旧视频
  pauseVideo(oldIndex)

  currentIndex.value = newIndex

  // 播放新视频
  playVideo(newIndex)
  nextTick(() => {
    cleanupOutOfRangeVideoContexts()
  })

  // 边界提示
  if (newIndex === episodeList.value.length - 1 && newIndex > oldIndex) {
    uni.showToast({
      title: '已经是最后一集了',
      icon: 'none'
    })
  } else if (newIndex === 0 && newIndex < oldIndex) {
    uni.showToast({
      title: '已经是第一集了',
      icon: 'none'
    })
  }
}

// 视频播放事件
const onVideoPlay = (index) => {
  console.log('视频播放:', index)
}

// 视频暂停事件
const onVideoPause = (index) => {
  console.log('视频暂停:', index)
}

// 屏幕点击事件（双击点赞）
const onScreenClick = (item) => {
  const currentTime = new Date().getTime()
  const timeDiff = currentTime - lastClickTime.value

  if (timeDiff < 300) {
    // 双击 - 执行点赞
    doLike(item)
  }

  lastClickTime.value = currentTime
}

// 执行点赞/取消点赞接口
const doLike = async (item) => {
  const isLiked = item.isLiked
  const action = isLiked ? 2 : 1  // 1点赞，2取消点赞

  // 点赞时显示动画
  if (!isLiked) {
    showLikeAnim.value = true
    clearManagedTimeout(likeAnimTimer)
    likeAnimTimer = setManagedTimeout(() => {
      showLikeAnim.value = false
      likeAnimTimer = null
    }, 800)
  }

  try {
    const userInfo = uni.getStorageSync('userInfo') || {}
    const userModel = uni.getStorageSync('userModel') || {}
    const userId = uni.getStorageSync('userId') || userInfo.id || userInfo.user_id || (userModel.member && userModel.member.id) || userModel.id || ''
    if (!userId) {
      showLikeAnim.value = false
      uni.showModal({
        title: '提示',
        content: '登录信息缺失，请重新登录',
        showCancel: false,
        success: () => {
          uni.reLaunch({ url: '/pagesLogin/auth/auth' })
        }
      })
      return
    }
    const params = {
      userId: userId,
      dataId: drama.value.id,
      action: action,
      type: getCurrentDramaType()
    }
    const res = await request('api2/Drama/dramaZan', params, 'GET')
    console.log('点赞结果:', res)
    if (res.code == 0) {
      if (isLiked) {
        // 取消点赞
        drama.value.zan_num = Math.max((drama.value.zan_num || item.zan_num || 1) - 1, 0)
        item.zan_num = drama.value.zan_num
        item.isLiked = false
        episodeList.value = episodeList.value.map(episode => ({
          ...episode,
          zan_num: drama.value.zan_num,
          isLiked: false
        }))
        emitTheaterLikeChange(false)
        uni.showToast({
          title: '已取消点赞',
          icon: 'none'
        })
      } else {
        // 点赞成功
        drama.value.zan_num = (drama.value.zan_num || item.zan_num || 0) + 1
        item.zan_num = drama.value.zan_num
        item.isLiked = true
        episodeList.value = episodeList.value.map(episode => ({
          ...episode,
          zan_num: drama.value.zan_num,
          isLiked: true
        }))
        emitTheaterLikeChange(true)
        const likeList = uni.getStorageSync('myLikeList') || []
        if (!likeList.find(d => d.id === drama.value.id)) {
          likeList.unshift({ id: drama.value.id, title: drama.value.title, cover_url: drama.value.cover_url, episode_count: drama.value.total_episodes })
          uni.setStorageSync('myLikeList', likeList)
        }
        uni.showToast({
          title: '点赞成功',
          icon: 'none'
        })
      }
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

// 返回上一页
const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length === 1) {
    uni.reLaunch({
      url: '/pages/index/index'
    })
  } else {
    uni.navigateBack()
  }
}

// 点赞（右侧按钮点击）
const handleLike = () => {
  const currentItem = episodeList.value[currentIndex.value]
  if (currentItem) {
    doLike(currentItem)
  }
}

// 分享
const handleShare = () => {
  console.log('分享')
}

// 关注/取消关注
const handleFollow = async () => {
  const action = isFollowed.value ? 2 : 1  // 1关注，2取消关注

  try {
    const userId = uni.getStorageSync('userId') || 1
    const params = {
      userId: userId,
      brandId: brand.value.id,
      action: action
    }
    const res = await request('api2/Drama/brandFollow', params, 'GET')
    console.log('关注结果:', res)
    if (res.code == 0) {
      if (isFollowed.value) {
        isFollowed.value = false
        uni.showToast({
          title: '已取消关注',
          icon: 'none'
        })
      } else {
        isFollowed.value = true
        const followList = uni.getStorageSync('myFollowList') || []
        if (!followList.find(b => b.id === brand.value.id)) {
          followList.unshift({ id: brand.value.id, title: brand.value.name, cover_url: brand.value.img_url })
          uni.setStorageSync('myFollowList', followList)
        }
        uni.showToast({
          title: '关注成功',
          icon: 'none'
        })
      }
    }
  } catch (error) {
    console.error('关注失败:', error)
  }
}

// 页面加载
onLoad((options) => {
  dramaId.value = options.dramaId || options.id
  useKashgarStoryDetail.value = isKashgarLocalStoryRoute(options)
  if (useKashgarStoryDetail.value) {
    return
  }
  if (options.isLiked !== undefined) {
    routeLikeState.value = options.isLiked === '1'
  }
  if (options.zanNum !== undefined) {
    routeZanNum.value = Number(options.zanNum || 0)
  }
  if (options.dramaType !== undefined) {
    routeDramaType.value = Number(options.dramaType || 3)
  }
  if (dramaId.value) {
    getVideoDetail()
  }
})

onUnload(() => {
  showLikeAnim.value = false
  cleanupAllTimers()
  cleanupVideoContexts()
})
</script>

<style scoped>
.kashgar-story-detail {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #090604;
  color: #FFFFFF;
  font-family: "PingFang SC", "Songti SC", sans-serif;
}

.kashgar-story-background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.kashgar-story-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 251, 244, 0.96) 0, rgba(255, 251, 244, 0.96) 118rpx, rgba(255, 251, 244, 0.04) 214rpx, rgba(0, 0, 0, 0.18) 38%, rgba(0, 0, 0, 0.84) 58%, rgba(0, 0, 0, 0.96) 100%),
    linear-gradient(90deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.02) 44%, rgba(0, 0, 0, 0.36) 100%);
  z-index: 1;
}

.kashgar-story-nav {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  top: 48rpx;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kashgar-story-back {
  width: 58rpx;
  height: 58rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.78);
  border: 1rpx solid rgba(83, 58, 37, 0.1);
  color: #1F1711;
  font-size: 60rpx;
  line-height: 49rpx;
  text-align: center;
  box-shadow: 0 8rpx 20rpx rgba(54, 35, 18, 0.1);
}

.kashgar-story-nav-title {
  flex: 1;
  padding: 0 22rpx;
  text-align: center;
  font-family: "Songti SC", "STSong", serif;
  font-size: 33rpx;
  line-height: 42rpx;
  font-weight: 900;
  color: #3B251B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kashgar-story-capsule {
  width: 126rpx;
  height: 58rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.8);
  border: 1rpx solid rgba(83, 56, 26, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  color: #16120E;
  font-size: 26rpx;
}

.kashgar-story-capsule-line {
  width: 1rpx;
  height: 34rpx;
  background: rgba(62, 47, 31, 0.16);
}

.kashgar-story-ring {
  font-size: 38rpx;
  line-height: 38rpx;
  font-weight: 800;
}

.kashgar-story-play {
  position: absolute;
  left: 50%;
  top: 45%;
  transform: translate(-50%, -50%);
  z-index: 4;
  width: 142rpx;
  height: 142rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(3px);
}

.kashgar-story-play-icon {
  color: rgba(255, 255, 255, 0.92);
  font-size: 58rpx;
  line-height: 64rpx;
  transform: translateX(5rpx);
}

.kashgar-story-side {
  position: absolute;
  right: 28rpx;
  top: 41%;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #FFFFFF;
}

.kashgar-story-avatar {
  width: 94rpx;
  height: 94rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 10rpx 26rpx rgba(0, 0, 0, 0.25);
}

.kashgar-story-author {
  margin-top: 12rpx;
  max-width: 118rpx;
  font-size: 23rpx;
  line-height: 28rpx;
  font-weight: 800;
  text-align: center;
  text-shadow: 0 3rpx 8rpx rgba(0, 0, 0, 0.4);
}

.kashgar-story-follow {
  margin-top: 10rpx;
  min-width: 104rpx;
  height: 48rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, rgba(198, 153, 88, 0.96), rgba(154, 108, 55, 0.96));
  color: #FFFFFF;
  font-size: 26rpx;
  line-height: 48rpx;
  text-align: center;
  font-weight: 900;
  box-sizing: border-box;
}

.kashgar-story-side-action {
  margin-top: 36rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  line-height: 28rpx;
  font-weight: 700;
  text-shadow: 0 3rpx 8rpx rgba(0, 0, 0, 0.42);
}

.kashgar-story-heart {
  font-size: 74rpx;
  line-height: 70rpx;
  color: #FFFFFF;
}

.kashgar-story-share {
  font-size: 68rpx;
  line-height: 64rpx;
  color: #FFFFFF;
}

.kashgar-story-content {
  position: absolute;
  left: 39rpx;
  right: 154rpx;
  bottom: 166rpx;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.kashgar-story-location {
  height: 48rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.62);
  background: rgba(32, 25, 17, 0.28);
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #FFFFFF;
  font-size: 27rpx;
  line-height: 48rpx;
  text-shadow: 0 2rpx 7rpx rgba(0, 0, 0, 0.36);
}

.kashgar-story-pin {
  color: #FFE0A6;
  font-size: 22rpx;
}

.kashgar-story-title {
  margin-top: 58rpx;
  font-family: "Songti SC", "STSong", serif;
  font-size: 44rpx;
  line-height: 54rpx;
  font-weight: 900;
  color: #FFF8E8;
  letter-spacing: 0;
  text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.48);
}

.kashgar-story-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
  margin-top: 20rpx;
  color: #F2D79F;
  font-size: 24rpx;
  line-height: 30rpx;
}

.kashgar-story-meta {
  margin-top: 18rpx;
  color: rgba(255, 255, 255, 0.62);
  font-size: 24rpx;
  line-height: 32rpx;
}

.kashgar-story-copy {
  margin-top: 18rpx;
  max-height: 162rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  color: #FFFFFF;
  font-size: 25rpx;
  line-height: 38rpx;
  text-shadow: 0 3rpx 10rpx rgba(0, 0, 0, 0.5);
}

.kashgar-story-copy-expanded {
  max-height: 260rpx;
}

.kashgar-story-expand {
  align-self: flex-end;
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  gap: 7rpx;
  color: #F3CB7D;
  font-size: 25rpx;
  line-height: 32rpx;
  font-weight: 800;
}

.kashgar-story-bottom {
  position: absolute;
  left: 38rpx;
  right: 34rpx;
  bottom: 38rpx;
  z-index: 6;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 86rpx 86rpx 86rpx;
  align-items: end;
  gap: 18rpx;
}

.kashgar-story-comment {
  height: 64rpx;
  padding: 0 26rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  background: rgba(20, 16, 12, 0.46);
  display: flex;
  align-items: center;
  gap: 14rpx;
  color: rgba(255, 255, 255, 0.56);
  font-size: 25rpx;
  line-height: 64rpx;
}

.kashgar-story-pencil {
  font-size: 31rpx;
}

.kashgar-story-bottom-action {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5rpx;
  color: #F6DFA6;
  font-size: 22rpx;
  line-height: 26rpx;
  font-weight: 700;
}

.kashgar-story-bottom-action text:first-child {
  color: #FFE5A6;
  font-size: 52rpx;
  line-height: 54rpx;
}

.container {
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #000;
  overflow: hidden;
}

/* 抖音风格swiper */
.video-swiper {
  width: 100%;
  height: 100vh;
}

.swiper-item {
  width: 100%;
  height: 100vh;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
}

.full-video {
  width: 100%;
  height: 420rpx;
}

.video-logo {
  position: absolute;
  top: calc(50% - 210rpx + 24rpx);
  left: 24rpx;
  z-index: 20;
  width: 120rpx;
  height: 72rpx;
}

.video-placeholder {
  width: 100%;
  height: 420rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
}

.placeholder-cover {
  width: 100%;
  height: 420rpx;
}

/* 双击点赞动画 */
.like-animation {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  animation: likeScale 0.8s ease-out forwards;
}

.like-heart {
  width: 200rpx;
  height: 200rpx;
}

@keyframes likeScale {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

/* 右侧操作栏 */
.side-bar {
  position: absolute;
  right: 20rpx;
  bottom: 400rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
}

/* 头像区域 */
.avatar-wrapper {
  position: relative;
  margin-bottom: 40rpx;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  border: 4rpx solid #fff;
}

.follow-btn {
  position: absolute;
  bottom: -16rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 40rpx;
}

.follow-icon {
  width: 100%;
  height: 100%;
}

/* 操作按钮 */
.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30rpx;
}

.action-icon {
  width: 64rpx;
  height: 64rpx;
}

.action-text {
  font-size: 24rpx;
  color: #fff;
  margin-top: 8rpx;
}

/* 底部信息区域 */
.bottom-info {
  position: absolute;
  left: 30rpx;
  right: 150rpx;
  bottom: 60rpx;
  z-index: 10;
}

.author-name {
  display: block;
  font-size: 34rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 16rpx;
}

.video-tags {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 10rpx;
}

.video-episodes {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 10rpx;
}

.video-date {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.container {
	background: #050505 !important;
}

.video-container,
.video-placeholder {
	background: #050505;
}

.side-bar .action-item {
	padding: 10rpx 8rpx;
	border-radius: 24rpx;
	background: rgba(5, 5, 5, 0.28);
	backdrop-filter: blur(8px);
}

.avatar {
	border-color: rgba(225, 181, 93, 0.88);
	box-shadow: 0 8rpx 18rpx rgba(0, 0, 0, 0.28);
}

.bottom-info {
	padding: 24rpx 28rpx;
	border-radius: 28rpx;
	background: linear-gradient(180deg, rgba(5, 5, 5, 0.05), rgba(5, 5, 5, 0.36));
	backdrop-filter: blur(8px);
}
</style>
