# 西城 APP HBuilderX 真机验收准备记录

日期：2026-06-27

分支：`feature/xicheng-app-complete-flow`

## HBuilderX 安装

已从 DCloud 官方 HBuilderX 下载配置安装：

- 官方页面：`https://www.dcloud.io/hbuilderx.html`
- 官方 release 配置：`https://download1.dcloud.net.cn/hbuilderx/release.json`
- 本机架构：`arm64`
- 安装包：`HBuilderX.5.07.2026041006.arm64.dmg`
- 安装位置：`/Applications/HBuilderX.app`
- HBuilderX 版本：`5.07.2026041006`
- CLI：`/Applications/HBuilderX.app/Contents/MacOS/cli`

## 项目导入

已通过 HBuilderX CLI 导入 APP 项目：

```bash
/Applications/HBuilderX.app/Contents/MacOS/cli project open --path /Users/bruce/Developer/work/AI文旅/01_星河寻境-xicheng-app-complete-flow/assets/references/APP/kashgar-mini-program
```

结果：`项目导入成功`

## 插件补齐

新安装的 HBuilderX 首次运行 APP 编译时缺少 Dart Sass 编译插件，CLI 报错：

```text
预编译器错误：代码使用了sass语言，但未安装相应的编译器插件，正在从插件市场安装该插件:
https://ext.dcloud.net.cn/plugin?name=compile-dart-sass
```

已执行：

```bash
/Applications/HBuilderX.app/Contents/MacOS/cli installPlugin --name compile-dart-sass --force true
```

结果：`插件 compile-dart-sass 安装成功`

## HBuilderX APP 编译验证

已通过 HBuilderX CLI 执行 Android APP 编译模式：

```bash
/Applications/HBuilderX.app/Contents/MacOS/cli launch app-android --project /Users/bruce/Developer/work/AI文旅/01_星河寻境-xicheng-app-complete-flow/assets/references/APP/kashgar-mini-program --compile true --continue-on-error false
```

结果：

```text
项目 kashgar-mini-program 编译成功。
ready in 3625ms.
```

这证明 HBuilderX IDE 侧项目导入、APP 编译器和 Sass 插件链路已可用。

## 设备状态

当前仍未发现可用真机/模拟器：

```bash
adb devices
```

输出：

```text
List of devices attached
```

HBuilderX CLI：

```bash
/Applications/HBuilderX.app/Contents/MacOS/cli devices list --platform android
/Applications/HBuilderX.app/Contents/MacOS/cli devices list --platform ios-iPhone
/Applications/HBuilderX.app/Contents/MacOS/cli devices list --platform ios-simulator
```

输出均为空。

## 下一步

真机/HBuilderX 逐页点击视觉验收仍需：

1. 连接 Android 或 iOS 真机，并打开开发者模式/USB 调试。
2. 运行：
   ```bash
   /Applications/HBuilderX.app/Contents/MacOS/cli devices list --platform android
   ```
   或对应 iOS 平台命令，确认出现 device id。
3. 运行到设备：
   ```bash
   /Applications/HBuilderX.app/Contents/MacOS/cli launch app-android --project /Users/bruce/Developer/work/AI文旅/01_星河寻境-xicheng-app-complete-flow/assets/references/APP/kashgar-mini-program --deviceId <device-id>
   ```
4. 逐页点击并截图：
   - 西城首页
   - 识别结果页
   - 导入灵感页
   - 路线详情页
   - 旅行素材盒
   - 游记草稿
   - 路线护照
   - 城市运营报告
5. 使用 HBuilderX CLI `screencap app-android/app-ios` 或系统截图保存真机证据。
