// #ifdef VUE3
import { createSSRApp } from 'vue'
import App from './App.vue'
import appConfig from './app.js'
import TabBar from './components/tab-bar/tab-bar.vue'

export function createApp() {
  const app = createSSRApp(App)

  // 注册自定义tabbar组件
  app.component('tab-bar', TabBar)

  // 混入全局app配置
  app.config.globalProperties.$appConfig = appConfig

  return {
    app
  }
}
// #endif