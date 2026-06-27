import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const tabBarPath = path.join(root, 'components', 'tab-bar', 'tab-bar.vue')
const tabBar = fs.readFileSync(tabBarPath, 'utf8')

assert.match(
  tabBar,
  /<navigator class="tab-item" url="\/pages\/index\/index" open-type="reLaunch"/,
  'left tab should use native navigator to return to xiake theater'
)

assert.match(
  tabBar,
  /<navigator class="center-btn-wrapper" url="\/pages\/ai-guide\/ai-guide" open-type="reLaunch"/,
  'center AI guide tab should use native navigator'
)

assert.match(
  tabBar,
  /<navigator class="tab-item" url="\/subPackages\/user\/my\/my" open-type="reLaunch"/,
  'my tab should use native navigator'
)

assert.doesNotMatch(
  tabBar,
  /@click="switchTab|switchTab\(index\)|uni\.reLaunch\(\{\s*url:\s*this\.list\[index\]\.pagePath/,
  'tab bar should not rely on dynamic click handlers for navigation'
)
