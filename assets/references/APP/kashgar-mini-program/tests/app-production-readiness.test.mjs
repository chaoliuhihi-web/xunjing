import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const indexPath = path.join(root, 'pages', 'index', 'index.vue')
const storyDetailPath = path.join(root, 'subPackages', 'feature', 'theater', 'theaterDetail.vue')
const myPath = path.join(root, 'subPackages', 'user', 'my', 'my.vue')
const aiGuidePath = path.join(root, 'pages', 'ai-guide', 'ai-guide.vue')
const appConfigPath = path.join(root, 'app.js')
const projectConfigPath = path.join(root, 'project.config.json')
const authPath = path.join(root, 'pagesLogin', 'auth', 'auth.vue')
const packagePath = path.join(root, 'package.json')
const manifestPath = path.join(root, 'manifest.json')
const pagesPath = path.join(root, 'pages.json')
const qaPath = path.join(root, 'design-qa.md')
const kashgarHomeContentPath = path.join(root, 'pages', 'index', 'kashgar-home-content.js')
const indexPage = fs.readFileSync(indexPath, 'utf8')
const storyDetailPage = fs.readFileSync(storyDetailPath, 'utf8')
const myPage = fs.readFileSync(myPath, 'utf8')
const aiGuidePage = fs.readFileSync(aiGuidePath, 'utf8')
const appConfig = fs.readFileSync(appConfigPath, 'utf8')
const authPage = fs.readFileSync(authPath, 'utf8')
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const readJsonc = (filePath) => JSON.parse(
  fs.readFileSync(filePath, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
)
const manifestJson = readJsonc(manifestPath)
const pagesJson = readJsonc(pagesPath)
const projectConfigJson = readJsonc(projectConfigPath)
const qaReport = fs.existsSync(qaPath) ? fs.readFileSync(qaPath, 'utf8') : ''
const kashgarHomeSource = fs.existsSync(kashgarHomeContentPath)
  ? `${indexPage}\n${fs.readFileSync(kashgarHomeContentPath, 'utf8')}`
  : indexPage
const MAX_APP_PAGE_LINES = 3500

const countSourceLines = (content) => {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  return normalized.split('\n').length - (normalized.endsWith('\n') ? 1 : 0)
}

for (const [relativePath, content] of [
  ['pages/index/index.vue', indexPage],
  ['pages/ai-guide/ai-guide.vue', aiGuidePage],
]) {
  const lineCount = countSourceLines(content)
  assert.ok(
    lineCount <= MAX_APP_PAGE_LINES,
    `${relativePath} should stay at or below ${MAX_APP_PAGE_LINES} lines; got ${lineCount}. Split components and services before adding more page code.`
  )
}

assert.equal(
  packageJson.scripts.build,
  'npm run build:app',
  'default build script should target the UniApp APP artifact'
)

assert.equal(
  packageJson.scripts['build:app'],
  'UNI_INPUT_DIR=. UNI_OUTPUT_DIR=dist/build/app uni build -p app',
  'APP build script should use the root UniApp input and APP output directory'
)

assert.ok(
  packageJson.dependencies?.['@dcloudio/uni-app-plus'],
  'APP build must include @dcloudio/uni-app-plus so `uni build -p app` produces a real mobile APP target instead of a thin H5 shell'
)

assert.equal(
  packageJson.name,
  'xinghe-xunjing-kashgar-app',
  'APP package name should describe the current project, not the original scaffold'
)

assert.match(
  packageJson.description,
  /星河寻境.*城市 AI 旅伴.*西城.*喀什/,
  'APP package description should describe the city companion product and retained Kashgar baseline'
)

assert.equal(
  manifestJson.name,
  '星河寻境',
  'APP manifest display name should use the Xinghe Xunjing brand'
)

assert.match(
  manifestJson.description,
  /星河寻境.*城市 AI 旅伴.*西城.*喀什/,
  'APP manifest description should describe the Xicheng city companion product and retained Kashgar baseline'
)

assert.equal(
  pagesJson.globalStyle.navigationBarTitleText,
  '星河寻境',
  'APP global navigation title should not keep the scaffold default'
)

assert.equal(
  projectConfigJson.projectname,
  'xinghe-xunjing',
  'WeChat project name should use the Xinghe Xunjing product identity'
)

assert.match(
  appConfig,
  /name:\s*'星河寻境'/,
  'APP global config should expose the Xinghe Xunjing product name'
)

assert.match(
  appConfig,
  /description:\s*'星河寻境城市 AI 旅伴/,
  'APP global config should describe the city companion product'
)

assert.match(
  authPage,
  /星河寻境/,
  'login authorization page should use the Xinghe Xunjing product name'
)

for (const [label, content] of Object.entries({
  'APP global config': appConfig,
  'WeChat project config': fs.readFileSync(projectConfigPath, 'utf8'),
  'login authorization page': authPage,
  'APP package manifest': JSON.stringify(packageJson),
  'UniApp manifest': fs.readFileSync(manifestPath, 'utf8'),
})) {
  for (const forbiddenIdentity of [
    /\bxinxiake\b/i,
    /新喀什/,
    /喀什应用/,
  ]) {
    assert.doesNotMatch(
      content,
      forbiddenIdentity,
      `${label} should not keep old scaffold or legacy product identity ${forbiddenIdentity}`
    )
  }
}

const androidPermissions = manifestJson['app-plus']?.distribute?.android?.permissions || []
const hasAndroidPermission = (name) => androidPermissions.some(permission => permission.includes(`android.permission.${name}`))

for (const requiredPermission of [
  'ACCESS_NETWORK_STATE',
  'CAMERA',
  'ACCESS_COARSE_LOCATION',
  'ACCESS_FINE_LOCATION',
]) {
  assert.ok(
    hasAndroidPermission(requiredPermission),
    `APP Android manifest should declare required permission ${requiredPermission}`
  )
}

for (const forbiddenPermission of [
  'READ_LOGS',
  'GET_ACCOUNTS',
  'READ_PHONE_STATE',
  'WRITE_SETTINGS',
  'MOUNT_UNMOUNT_FILESYSTEMS',
  'CHANGE_NETWORK_STATE',
  'CHANGE_WIFI_STATE',
  'WAKE_LOCK',
  'FLASHLIGHT',
]) {
  assert.ok(
    !hasAndroidPermission(forbiddenPermission),
    `APP Android manifest should not request high-risk permission ${forbiddenPermission}`
  )
}

assert.ok(
  androidPermissions.some(permission => permission.includes('android.hardware.camera') && permission.includes('android:required="false"')),
  'APP Android camera feature should be optional so non-camera devices are not filtered unnecessarily'
)

const iosPrivacy = manifestJson['app-plus']?.distribute?.ios?.privacyDescription || {}

for (const [key, expected] of Object.entries({
  NSCameraUsageDescription: /扫码|拍照|识别/,
  NSLocationWhenInUseUsageDescription: /定位|附近|城市/,
  NSPhotoLibraryUsageDescription: /相册|图片|照片/,
  NSPhotoLibraryAddUsageDescription: /保存|相册|照片/,
  NSMicrophoneUsageDescription: /麦克风|语音|提问/,
})) {
  assert.match(
    iosPrivacy[key] || '',
    expected,
    `APP iOS privacyDescription should include a user-facing ${key}`
  )
}

for (const forbidden of [
  'APP_DEMO',
  'REFERENCE_DEMO',
  'isAppMockDemo',
  'isReferenceDemo',
  'reference-demo',
  'demo-hotspot',
  'DEMO_SCREENS',
  'currentDemoScreen',
]) {
  assert.ok(
    !indexPage.includes(forbidden),
    `homepage production source should not include ${forbidden}`
  )
}

for (const required of [
  'KASHGAR_LOCAL_CONTENT_ENABLED',
  'applyKashgarHomeContent',
  'kashgar-home',
  'kashgar-travel-notes-home',
  '搜索目的地/景点/游记',
  '喀什文旅地图',
  '跟着游记',
  '游记剧场',
  '喀什古城的冬日时光',
  '/static/kashgar/home-travel-banner.png',
  '/static/kashgar/note-old-city-winter.png',
  '/static/kashgar/note-baked-bun.png',
]) {
  assert.ok(
    kashgarHomeSource.includes(required),
    `homepage production source should include ${required}`
  )
}

for (const required of [
  'KASHGAR_STORY_DETAIL_LOCAL_CONTENT_ENABLED',
  'useKashgarStoryDetail',
  'kashgar-story-detail',
  '沿着石巷去看喀什',
  '星河漫游记',
  '+ 关注',
  '2025/05/19 · 阅读约 5 分钟',
  '/static/kashgar/story-stone-alley-final.png',
  '/static/kashgar/story-author-avatar.png',
]) {
  assert.ok(
    storyDetailPage.includes(required),
    `story detail production source should include ${required}`
  )
}

for (const required of [
  'KASHGAR_ITINERARY_LOCAL_CONTENT_ENABLED',
  'useKashgarItinerary',
  'kashgar-itinerary-page',
  '我的旅行日程',
  '喀什亲子之旅',
  '调整行程安排',
  '/static/kashgar/itinerary-hero.png',
  '/static/kashgar/itinerary-old-city-1.png',
]) {
  assert.ok(
    myPage.includes(required),
    `my itinerary production source should include ${required}`
  )
}

for (const required of [
  'KASHGAR_DIARY_GENERATOR_ENABLED',
  'showKashgarDiaryGenerator',
  'kashgar-diary-generator',
  '生成我的喀什游记',
  '沿着石巷，把喀什写进今天',
  '一键生成',
  '/static/kashgar/diary-generator-hero.png',
  '/static/kashgar/diary-generator-mascot.png',
]) {
  assert.ok(
    aiGuidePage.includes(required),
    `AI guide diary generator production source should include ${required}`
  )
}

const bundledFullScreenRefs = fs.existsSync(path.join(root, 'static', 'demo', 'kashgar'))
  ? fs.readdirSync(path.join(root, 'static', 'demo', 'kashgar')).filter(name => /^screen-\d+\.png$/.test(name))
  : []

assert.deepEqual(
  bundledFullScreenRefs,
  [],
  'APP static assets should not bundle full-screen reference screenshots'
)

assert.match(
  qaReport,
  /final result: passed/,
  'APP readiness QA report should be passed, not blocked'
)

assert.doesNotMatch(
  qaReport,
  /mock|demo|blocked/i,
  'APP readiness QA report should not describe the shipped branch as mock/demo/blocked'
)

const collectSourceFiles = (relativeDir) => {
  const absoluteDir = path.join(root, relativeDir)
  if (!fs.existsSync(absoluteDir)) return []
  return fs.readdirSync(absoluteDir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDir, entry.name)
    if (entry.isDirectory()) {
      return collectSourceFiles(relativePath)
    }
    return /\.(vue|js)$/.test(entry.name) ? [relativePath] : []
  })
}

const appSourceFiles = [
  'App.vue',
  'app.js',
  'main.js',
  'vite.config.js',
  ...collectSourceFiles('components'),
  ...collectSourceFiles('pages'),
  ...collectSourceFiles('pagesInfo'),
  ...collectSourceFiles('pagesLogin'),
  ...collectSourceFiles('request'),
  ...collectSourceFiles('config'),
  ...collectSourceFiles('subPackages'),
]

for (const relativePath of appSourceFiles) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8')
  assert.doesNotMatch(
    source,
    /console\.(?:log|debug|info)\s*\(/,
    `${relativePath} should not ship production console.log/debug/info statements`
  )
}
