import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const pagePath = path.join(root, 'subPackages', 'feature', 'shortPlay', 'shortplay.vue')
const page = fs.readFileSync(pagePath, 'utf8')

assert.match(
  page,
  /<view class="city-filter-bar"[\s\S]*<scroll-view class="city-tabs" scroll-x[\s\S]*v-for="item in cityTabs"[\s\S]*@click="selectCity\(item\)"[\s\S]*\{\{ item\.value \}\}[\s\S]*<view class="video-search"/,
  'shortPlay page should render horizontal city tabs with a search box on the right'
)

assert.match(
  page,
  /loadCityTabs\(\)[\s\S]*request\('api2\/Drama\/getDramaAddressNames'[\s\S]*fallbackCityTabsFromDrama/,
  'shortPlay page should load city tabs from getDramaAddressNames with a local fallback'
)

assert.match(
  page,
  /let hasAddressTabs = false[\s\S]*hasAddressTabs = list\.length > 0[\s\S]*if \(!hasAddressTabs && this\.cityTabs\.length <= 1\)/,
  'shortPlay page should only use fallback city tabs when the address tab API has no usable data'
)

assert.match(
  page,
  /const fallbackTabs = this\.normalizeCityTabs\(this\.fallbackCityTabsFromDrama\(this\.dramaList\)\)[\s\S]*const fallbackActive[\s\S]*if \(fallbackActive\.value !== this\.activeCity\.value\)[\s\S]*await this\.resetDramaList\(\)/,
  'shortPlay page should refetch videos when fallback city tabs change the active city'
)

assert.match(
  page,
  /selectCity\(item\)[\s\S]*this\.activeCity = item[\s\S]*this\.resetDramaList\(\)/,
  'shortPlay page should refresh the video list when a city tab is selected'
)

assert.match(
  page,
  /getDramaList\(\)[\s\S]*const requestValues = this\.getActiveAddressRequestValues\(\)[\s\S]*requestValues\.map\([\s\S]*address_name:\s*addressName[\s\S]*request\('api2\/Drama\/getDrama'/,
  'shortPlay video list should request getDrama for every backend address behind the selected city tab'
)

assert.match(
  page,
  /type:\s*"1,2,3"/,
  'shortPlay city video requests should include type 3 so 喀什剧场 videos are not filtered out'
)

assert.match(
  page,
  /page_size:\s*10/,
  'shortPlay page should request 10 videos per infinite-load page'
)

assert.match(
  page,
  /this\.dramaList\s*=\s*this\.page === 1 \? newList : this\.dramaList\.concat\(newList\)/,
  'shortPlay infinite loading should append the next 10 videos after the first page'
)

assert.doesNotMatch(
  page,
  /class="pagination-bar"|@click="prevPage"|@click="nextPage"/,
  'shortPlay page should not render manual previous/next pagination controls'
)

assert.match(
  page,
  /<scroll-view class="scroll-content" scroll-y[\s\S]*@scrolltolower="loadMoreDrama"/,
  'shortPlay page should load more videos when the user scrolls to the bottom'
)

assert.match(
  page,
  /loadMoreDrama\(\)[\s\S]*this\.page\+\+[\s\S]*this\.getDramaList\(\)/,
  'shortPlay load-more handler should increment the page and fetch the next chunk'
)

assert.match(
  page,
  /filteredDramaList\(\)[\s\S]*this\.searchKeyword[\s\S]*item\.title\.includes\(keyword\)/,
  'shortPlay search should filter the loaded city video list by title'
)

assert.match(
  page,
  /label:\s*tabValue,[\s\S]*value:\s*tabValue,[\s\S]*requestValue:\s*this\.normalizeAddressNameForRequest\(tabValue\),[\s\S]*requestValues:\s*this\.getAddressRequestValues\(value\)/,
  'shortPlay city tabs should display the normalized tab label while keeping every backend request address'
)

assert.match(
  page,
  /normalizeAddressNameForRequest\(value = ''\)[\s\S]*replace\(\s*\/\^剧游\//,
  'shortPlay page should strip the 剧游 prefix before sending address_name to getDrama'
)

assert.match(
  page,
  /const ZHEJIANG_LOCAL_ADDRESS_NAMES = \[[\s\S]*'蛇蟠岛'[\s\S]*'杨家板龙'[\s\S]*'杨家村'[\s\S]*\]/,
  'shortPlay page should define non-province Zhejiang local address names that need to be folded into 剧游浙江'
)

assert.match(
  page,
  /normalizeCityTabValue\(value = ''\)[\s\S]*const requestValue = this\.normalizeAddressNameForRequest\(value\)[\s\S]*if \(ZHEJIANG_LOCAL_ADDRESS_NAMES\.includes\(requestValue\)\) return DEFAULT_CITY_TAB\.value/,
  'shortPlay city tabs should fold 蛇蟠岛/杨家板龙/杨家村 into the 剧游浙江 tab instead of showing them separately'
)

assert.doesNotMatch(
  page,
  /seen\.has\(value\)/,
  'shortPlay city tabs should dedupe by normalized tab value, not by the raw API address label'
)

assert.doesNotMatch(
  page,
  /label:\s*value\.replace\(\s*\/\^剧游\//,
  'shortPlay city tabs should not strip the 剧游 prefix from API labels'
)

assert.doesNotMatch(
  page,
  /provinceSections\(\)|groupDramaByProvince\(this\.dramaList\)/,
  'shortPlay page should no longer render every province section at once'
)
