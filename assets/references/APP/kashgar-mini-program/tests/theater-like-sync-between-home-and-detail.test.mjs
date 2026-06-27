import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const indexPath = path.join(root, 'pages', 'index', 'index.vue')
const detailPath = path.join(root, 'subPackages', 'feature', 'theater', 'theaterDetail.vue')
const indexPage = fs.readFileSync(indexPath, 'utf8')
const detailPage = fs.readFileSync(detailPath, 'utf8')

assert.doesNotMatch(
  `${indexPage}\n${detailPage}`,
  /theaterLikedDramaIds|THEATER_LIKED_DRAMA_CACHE_KEY|getCachedLikedDramaIds|setCachedLikedDramaIds|cacheLikedDrama|removeCachedLikedDrama/,
  'theater like state should not use local cache'
)

assert.match(
  indexPage,
  /onShow\(\) \{[\s\S]*this\.syncTheaterLikeStateFromApi\(\)[\s\S]*\}/,
  'home page should refresh visible theater card likes from API when returning normally'
)

assert.match(
  indexPage,
  /request\('api2\/Drama\/getZanDrama',\s*params,\s*'GET'\)/,
  'home page should read theater like state from getZanDrama'
)

assert.match(
  indexPage,
  /syncTheaterLikeStateFromApi[\s\S]*type:\s*HOME_THEATER_LIKE_TYPES[\s\S]*page_size:\s*100/,
  'home page getZanDrama request should query all homepage theater-like types with enough page size'
)

assert.match(
  indexPage,
  /getTheaterLikeKey\(item\)[\s\S]*`\$\{Number\(item\.type \|\| 3\)\}:\$\{item\.id\}`/,
  'home page should key liked state by both drama type and id'
)

assert.match(
  indexPage,
  /const likedMap = new Map\([\s\S]*this\.getTheaterLikeKey\(item\)[\s\S]*\)[\s\S]*isLiked: likedMap\.has\(this\.getTheaterLikeKey\(item\)\)/,
  'home page should use getZanDrama type and id as the source of truth for ordinary refreshes'
)

assert.match(
  indexPage,
  /uni\.\$on\('theaterLikeChanged',\s*this\.applyTheaterLikeChange\)/,
  'home page should apply detail like changes without immediately refetching stale API state'
)

assert.match(
  indexPage,
  /applyTheaterLikeChange\(payload = \{\}\)[\s\S]*String\(item\.id\) !== String\(payload\.id\)[\s\S]*isLiked: Boolean\(payload\.isLiked\)[\s\S]*zan_num: Number\(payload\.zan_num \|\| item\.zan_num \|\| 0\)/,
  'home page should update the matching theater card from the dramaZan success payload'
)

assert.match(
  indexPage,
  /goToTheaterDetail\(item\)[\s\S]*isLiked=\$\{item\.isLiked \? 1 : 0\}[\s\S]*zanNum=\$\{Number\(item\.zan_num \|\| 0\)\}[\s\S]*dramaType=\$\{Number\(item\.type \|\| 3\)\}/,
  'home page should pass current like state, count, and type into theater detail'
)

assert.match(
  detailPage,
  /const emitTheaterLikeChange = \(isLiked\) => \{[\s\S]*uni\.\$emit\('theaterLikeChanged',\s*\{[\s\S]*id: drama\.value\.id[\s\S]*type: getCurrentDramaType\(\)[\s\S]*isLiked[\s\S]*zan_num: Number\(drama\.value\.zan_num \|\| 0\)[\s\S]*\}\)[\s\S]*\}/,
  'theater detail should notify home page with the dramaZan success state and drama type'
)

assert.match(
  detailPage,
  /emitTheaterLikeChange\(false\)[\s\S]*uni\.showToast\(\{[\s\S]*title: '已取消点赞'/,
  'theater detail should emit an unlike change to the previous page after a successful cancel'
)

assert.match(
  detailPage,
  /emitTheaterLikeChange\(true\)[\s\S]*const likeList = uni\.getStorageSync\('myLikeList'\)/,
  'theater detail should emit a like change to the previous page after a successful like'
)

assert.match(
  detailPage,
  /const routeLikeState = ref\(null\)[\s\S]*const routeZanNum = ref\(null\)/,
  'theater detail should remember route-provided home like state before API reconciliation'
)

assert.match(
  detailPage,
  /onLoad\(\(options\) => \{[\s\S]*routeLikeState\.value = options\.isLiked === '1'[\s\S]*routeZanNum\.value = Number\(options\.zanNum \|\| 0\)[\s\S]*routeDramaType\.value = Number\(options\.dramaType \|\| 3\)/,
  'theater detail should read home like state and type from route params'
)

assert.match(
  detailPage,
  /normalizeEpisodeLikeState = \(episodes = \[\],\s*dramaInfo = \{\}\) => \{[\s\S]*routeLikeState\.value !== null[\s\S]*routeLikeState\.value/,
  'theater detail should use the route like state before API reconciliation'
)

assert.match(
  detailPage,
  /if \(routeLikeState\.value === null\) \{[\s\S]*await syncDramaLikeSummary\(userId\)[\s\S]*\}/,
  'theater detail should not immediately overwrite route state with a possibly stale getZanDrama response'
)

assert.match(
  indexPage,
  /if \(res\.code == 0\)[\s\S]*item\.isLiked = !isLiked/,
  'home page should keep the successful dramaZan result visible immediately'
)

assert.doesNotMatch(
  indexPage,
  /if \(res\.code == 0\)[\s\S]*item\.isLiked = !isLiked[\s\S]*this\.syncTheaterLikeStateFromApi\(\)/,
  'home page should not immediately refetch getZanDrama after dramaZan because the list can lag and overwrite the new state'
)
