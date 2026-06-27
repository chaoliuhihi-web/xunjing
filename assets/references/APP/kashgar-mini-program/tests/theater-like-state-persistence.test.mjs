import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const detailPath = path.join(root, 'subPackages', 'feature', 'theater', 'theaterDetail.vue')
const detailPage = fs.readFileSync(detailPath, 'utf8')

assert.match(
  detailPage,
  /const normalizeEpisodeLikeState = \(episodes = \[\],\s*dramaInfo = \{\}\) => \{/,
  'theater detail should normalize like state when loading episodes'
)

assert.doesNotMatch(
  detailPage,
  /episodeList\.value\s*=\s*data\.list\s*\|\|\s*\[\]/,
  'theater detail should not assign raw episode list without restoring isLiked'
)

assert.match(
  detailPage,
  /episodeList\.value\s*=\s*normalizeEpisodeLikeState\(data\.list\s*\|\|\s*\[\],\s*drama\.value\)/,
  'theater detail should restore isLiked from API fields on reload'
)

assert.match(
  detailPage,
  /await syncDramaLikeSummary\(userId\)/,
  'theater detail should load getZanDrama after detail data to restore server like count and state'
)

assert.match(
  detailPage,
  /request\('api2\/Drama\/getZanDrama',\s*params,\s*'GET'\)/,
  'theater detail should call the documented getZanDrama API for liked drama summary'
)

assert.match(
  detailPage,
  /type:\s*getCurrentDramaType\(\)[\s\S]*page_size:\s*100/,
  'theater detail getZanDrama request should query the current drama type with enough page size'
)

assert.match(
  detailPage,
  /String\(item\.id\) === String\(drama\.value\.id\)/,
  'theater detail should match the current drama from getZanDrama'
)

assert.match(
  detailPage,
  /const applyDramaLikeSummary = \(likedDrama\) => \{[\s\S]*drama\.value = \{[\s\S]*zan_num: Number\(likedDrama\.zan_num \|\| drama\.value\.zan_num \|\| 0\)[\s\S]*is_zan: 1[\s\S]*episodeList\.value = normalizeEpisodeLikeState\(episodeList\.value, drama\.value\)/,
  'theater detail should copy getZanDrama zan_num/is_zan into detail state'
)

assert.match(
  detailPage,
  /dataId:\s*drama\.value\.id/,
  'theater detail should like the drama id so it appears in getZanDrama'
)

assert.match(
  detailPage,
  /type:\s*getCurrentDramaType\(\)/,
  'theater detail should like using the current drama type instead of hard-coded type 3'
)

assert.match(
  detailPage,
  /const dramaLiked = routeLikeState\.value !== null \? routeLikeState\.value : Number\(dramaInfo\.zan \|\| dramaInfo\.is_zan \|\| 0\) === 1/,
  'theater detail should prefer route-provided current state, then fall back to API fields'
)

assert.doesNotMatch(
  detailPage,
  /dataId:\s*item\.id|cacheLikedEpisode|removeCachedLikedEpisode|THEATER_LIKED_EPISODE_CACHE_KEY|theaterLikedDramaIds|THEATER_LIKED_DRAMA_CACHE_KEY|getCachedLikedDramaIds|setCachedLikedDramaIds|cacheLikedDrama|removeCachedLikedDrama/,
  'theater detail should not use episode ids or local cache for theater likes'
)
