# 自定义导航栏组件 CustomNav

## 功能特性

✅ 自动适配微信小程序状态栏和胶囊按钮高度
✅ 支持自定义标题和图标
✅ 支持左侧返回按钮或自定义图标
✅ 支持右侧自定义图标
✅ 支持自定义背景颜色或背景图片
✅ 支持固定定位或相对定位
✅ 自动传递导航栏高度给父组件

## 使用方法

### 1. 基础用法

```vue
<template>
  <view>
    <custom-nav title="页面标题" />
  </view>
</template>

<script>
import CustomNav from '@/components/custom-nav/custom-nav.vue'

export default {
  components: {
    CustomNav
  }
}
</script>
```

### 2. 带返回按钮

```vue
<custom-nav
  title="详情页"
  :show-back="true"
/>
```

### 3. 自定义图标

```vue
<custom-nav
  title="首页"
  left-icon="/static/images/menu.png"
  center-icon="/static/images/logo.png"
  right-icon="/static/images/search.png"
  @leftClick="handleLeftClick"
  @rightClick="handleRightClick"
/>
```

### 4. 自定义背景

```vue
<!-- 纯色背景 -->
<custom-nav
  title="我的"
  background-color="#FF5722"
  title-color="#FFFFFF"
/>

<!-- 背景图片 -->
<custom-nav
  title="首页"
  background-image="/static/images/nav-bg.png"
  title-color="#FFFFFF"
/>
```

### 5. 接收导航栏高度

```vue
<template>
  <view>
    <custom-nav
      title="页面"
      @navHeight="handleNavHeight"
    />
    <view :style="`padding-top: ${contentPaddingTop}px;`">
      <!-- 页面内容 -->
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      contentPaddingTop: 80
    }
  },
  methods: {
    handleNavHeight(height) {
      this.contentPaddingTop = height + 15
    }
  }
}
</script>
```

## Props 参数

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| title | String | '' | 导航栏标题 |
| centerIcon | String | '' | 标题旁边的图标 |
| leftIcon | String | '' | 左侧自定义图标 |
| rightIcon | String | '' | 右侧自定义图标 |
| showBack | Boolean | false | 是否显示返回按钮 |
| backgroundColor | String | '#FFFFFF' | 背景颜色 |
| backgroundImage | String | '' | 背景图片路径 |
| titleColor | String | '#000000' | 标题文字颜色 |
| fixed | Boolean | true | 是否固定在顶部 |

## Events 事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| navHeight | 导航栏高度计算完成后触发 | height: 导航栏高度(px) |
| leftClick | 左侧按钮点击事件 | - |
| rightClick | 右侧按钮点击事件 | - |

## 注意事项

1. 如果页面使用了固定定位的导航栏(fixed=true)，记得给页面内容添加顶部间距
2. 在微信小程序中，组件会自动适配状态栏和胶囊按钮高度
3. 当同时设置 `showBack` 和 `leftIcon` 时，`leftIcon` 优先显示
4. 当同时设置 `backgroundColor` 和 `backgroundImage` 时，`backgroundImage` 优先显示

## 示例页面

参考以下页面的使用：
- `pages/theater/theater.vue` - 基础用法
- `pages/HundredPlays/hunderplay.vue` - 带返回按钮
- `pages/index/index.vue` - 自定义背景图片（可参考实现）
