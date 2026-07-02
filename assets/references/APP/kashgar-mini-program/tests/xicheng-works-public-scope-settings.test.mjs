import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

const works = read('pages', 'xicheng', 'works', 'works.vue')
assert.ok(
  exists('components', 'xicheng', 'XichengPublicScopeSettings.vue'),
  'Works page should extract public-scope settings into XichengPublicScopeSettings.vue'
)
const publicScopeSettings = read('components', 'xicheng', 'XichengPublicScopeSettings.vue')

for (const token of [
  'XichengPublicScopeSettings',
  'publicScopeState',
  'publicScopeItems',
  'restorePublicScopeSettings',
  'persistPublicScopeSettings',
  'togglePublicScopeSetting',
  'XICHENG_REGION_CONFIG.shareSettingStorageKey'
]) {
  assert.ok(works.includes(token), `Works page should expose public scope setting token: ${token}`)
}

assert.match(
  works,
  /<xicheng-public-scope-settings[\s\S]*:items="publicScopeItems"[\s\S]*@toggle="togglePublicScopeSetting"/,
  'Works page should render a real public-scope settings panel instead of a toast-only privacy entry'
)

assert.match(
  works,
  /restorePublicScopeSettings\(\)[\s\S]*uni\.getStorageSync\(XICHENG_REGION_CONFIG\.shareSettingStorageKey\)[\s\S]*this\.publicScopeState = normalizeWorksPublicScopeState/,
  'Works page should restore public-scope settings from the same local share settings key'
)

assert.match(
  works,
  /persistPublicScopeSettings\(\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.shareSettingStorageKey,\s*\{[\s\S]*\.\.\.storedShareSettings[\s\S]*\.\.\.this\.publicScopeState/,
  'Works page should persist public-scope settings without dropping existing share channel settings'
)

assert.match(
  works,
  /togglePublicScopeSetting\(key = ''\)[\s\S]*this\.publicScopeState\[key\] = !this\.publicScopeState\[key\][\s\S]*this\.persistPublicScopeSettings\(\)/,
  'Works public-scope toggles should be durable'
)

assert.doesNotMatch(
  works,
  /openPrivacyScopeSettings\([\s\S]*uni\.showToast\(|openWorksManager\([\s\S]*可管理游记、PDF 和本机存档/,
  'Works page should not leave privacy scope and management actions as toast-only placeholders'
)

for (const token of [
  '公开范围设置',
  '发布前可逐项确认',
  '正文公开',
  '地点公开',
  '照片公开',
  '问答记录',
  '精确轨迹默认隐藏',
  '不会公开精确坐标'
]) {
  assert.ok(`${works}\n${publicScopeSettings}`.includes(token), `Public scope settings surface should render token: ${token}`)
}

assert.match(
  publicScopeSettings,
  /v-for="item in items"[\s\S]*@click="\$emit\('toggle', item\.key\)"[\s\S]*:class="\{ 'scope-switch-on': item\.enabled \}"/,
  'Public scope settings component should expose explicit toggle rows'
)

assert.ok(works.split(/\r?\n/).length < 900, 'Works page should remain compact after extracting public-scope settings')
assert.ok(publicScopeSettings.split(/\r?\n/).length < 260, 'Public scope settings component should stay small and reusable')

assert.doesNotMatch(
  `${works}\n${publicScopeSettings}`,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Public scope settings should remain local-only and must not introduce backend calls or client-side secrets'
)
