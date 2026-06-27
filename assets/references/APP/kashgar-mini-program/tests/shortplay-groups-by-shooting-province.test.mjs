import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const pagePath = path.join(root, 'subPackages', 'feature', 'shortPlay', 'shortplay.vue')
const page = fs.readFileSync(pagePath, 'utf8')

assert.match(
  page,
  /fallbackCityTabsFromDrama\(list = \[\]\)[\s\S]*this\.getDramaProvince\(item\)/,
  'shortPlay page should derive fallback city tabs from shooting province'
)

assert.match(
  page,
  /getDramaProvince\(item\)[\s\S]*item\.addressName[\s\S]*item\.address_name[\s\S]*PROVINCE_NAMES[\s\S]*return DEFAULT_PROVINCE_NAME/,
  'shortPlay page should derive province from shooting location fields with a Zhejiang fallback'
)

assert.match(
  page,
  /<view class="drama-card" v-for="\(\s*item,\s*index\s*\) in filteredDramaList"/,
  'shortPlay page should render the selected city video list'
)

assert.match(
  page,
  /addressName:\s*item\.address_name\s*\|\|\s*''/,
  'shortPlay page should keep address_name on each drama item for city fallback'
)

assert.doesNotMatch(
  page,
  /<text class="province-text">浙江省<\/text>|<text class="province-text">娴欐睙鐪?\/text>/,
  'shortPlay page should not hard-code Zhejiang as the only province label'
)
