import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const appPath = path.join(root, 'App.vue')
const appPage = fs.readFileSync(appPath, 'utf8')

assert.match(
  appPage,
  /getStoredOpenid\(\) \{[\s\S]*uni\.getStorageSync\('openid'\)[\s\S]*userInfo\.wxopen_id[\s\S]*userInfo\.openid[\s\S]*userModel\.openid\.openid[\s\S]*uni\.setStorageSync\('openid', openid\)[\s\S]*\}/,
  'app login guard should recover openid from existing login caches before redirecting to auth'
)

assert.match(
  appPage,
  /const openid = this\.getStoredOpenid\(\)/,
  'app login guard should use recovered openid instead of only raw openid storage'
)
