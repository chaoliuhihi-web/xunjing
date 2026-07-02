import router from '@/router'

// 用于 router push
window._hmt = window._hmt || []
// HM_ID
const HM_ID = import.meta.env.VITE_APP_BAIDU_CODE
const HOSTNAME = typeof window !== 'undefined' ? String(window.location.hostname || '').trim() : ''
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost'])
const SHOULD_ENABLE_TONGJI =
  Boolean(HM_ID) &&
  !LOCAL_HOSTS.has(HOSTNAME) &&
  !(typeof navigator !== 'undefined' && navigator.webdriver)
;(function () {
  // 有值的时候，才开启
  if (!SHOULD_ENABLE_TONGJI) {
    return
  }
  const hm = document.createElement('script')
  hm.src = 'https://hm.baidu.com/hm.js?' + HM_ID
  const s = document.getElementsByTagName('script')[0]
  s.parentNode.insertBefore(hm, s)
})()

router.afterEach(function (to) {
  if (!SHOULD_ENABLE_TONGJI) {
    return
  }
  _hmt.push(['_trackPageview', to.fullPath])
})
