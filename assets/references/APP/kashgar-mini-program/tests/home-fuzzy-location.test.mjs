import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const indexPath = path.join(root, 'pages', 'index', 'index.vue')
const manifestPath = path.join(root, 'manifest.json')
const indexPage = fs.readFileSync(indexPath, 'utf8')
const manifest = fs.readFileSync(manifestPath, 'utf8')
const mapDetailPath = path.join(root, 'subPackages', 'feature', 'map_two', 'detail.vue')
const mapOldPath = path.join(root, 'subPackages', 'feature', 'map_two', 'map_two_old.vue')
const mapDetail = fs.existsSync(mapDetailPath) ? fs.readFileSync(mapDetailPath, 'utf8') : ''
const mapOld = fs.existsSync(mapOldPath) ? fs.readFileSync(mapOldPath, 'utf8') : ''
const initLocation = indexPage.slice(
  indexPage.indexOf('initLocation(force = false)'),
  indexPage.indexOf('reverseGeocodeLocation(latitude, longitude)')
)

assert.match(
  initLocation,
  /scope\.userFuzzyLocation/,
  'home location should check fuzzy location authorization'
)

assert.match(
  initLocation,
  /wx\.getFuzzyLocation\(/,
  'home location should use wx.getFuzzyLocation for the homepage city label'
)

assert.doesNotMatch(
  initLocation,
  /uni\.getLocation\(/,
  'home location should not request exact location for the homepage city label'
)

assert.match(
  initLocation,
  /typeof wx === 'undefined' \|\| !wx\.getFuzzyLocation[\s\S]*wx\.getFuzzyLocation\(/,
  'home fuzzy location should be guarded for low base-library compatibility'
)

assert.match(
  manifest,
  /"requiredPrivateInfos"\s*:\s*\[[\s\S]*"getFuzzyLocation"/,
  'mp-weixin manifest should declare getFuzzyLocation'
)

assert.doesNotMatch(
  manifest,
  /"requiredPrivateInfos"\s*:\s*\[[^\]]*"getLocation"[^\]]*"getFuzzyLocation"|"requiredPrivateInfos"\s*:\s*\[[^\]]*"getFuzzyLocation"[^\]]*"getLocation"/,
  'mp-weixin manifest should not declare mutually exclusive getLocation and getFuzzyLocation together'
)

assert.match(
  manifest,
  /"scope\.userFuzzyLocation"\s*:/,
  'mp-weixin manifest should describe fuzzy location authorization'
)

assert.doesNotMatch(
  `${indexPage}\n${mapDetail}\n${mapOld}`,
  /uni\.getLocation\(/,
  'mp-weixin source should not call exact getLocation when only getFuzzyLocation can be declared'
)
