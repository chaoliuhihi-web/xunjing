// 应用全局配置
export default {
  // 应用基本信息
  appInfo: {
    name: 'xinxiake',
    version: '1.0.0',
    description: '喀什应用'
  },

  // API 配置
  api: {
    baseUrl: '',
    timeout: 10000
  },

  // 主题配置
  theme: {
    primaryColor: '#3cc51f',
    backgroundColor: '#f5f5f5',
    navigationBarBackgroundColor: '#F8F8F8',
    navigationBarTextStyle: 'black'
  },

  // TabBar 配置
  tabBar: {
    color: '#7A7E83',
    selectedColor: '#3cc51f',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'static/tabbar/xiake.png',
        selectedIconPath: 'static/tabbar/xiake1.png'
      },
      {
        pagePath: 'subPackages/feature/theater/theater',
        text: '喀什剧场',
        iconPath: 'static/tabbar/tab.png',
        selectedIconPath: 'static/tabbar/tab_small.png'
      },
      {
        pagePath: 'subPackages/user/my/my',
        text: '我的',
        iconPath: 'static/tabbar/my.png',
        selectedIconPath: 'static/tabbar/my.png'
      }
    ]
  },

  // 其他全局配置
  settings: {
    debug: false,
    enablePullDownRefresh: false,
    enableReachBottom: true
  }
}
