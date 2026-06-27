import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const appPath = path.join(root, 'App.vue')
const appPage = fs.readFileSync(appPath, 'utf8')

assert.match(
  appPage,
  /getStoredUserId\(\) \{[\s\S]*uni\.getStorageSync\('userId'\)[\s\S]*userInfo\.id[\s\S]*userModel\.member\.id[\s\S]*uni\.setStorageSync\('userId', userId\)[\s\S]*\}/,
  'app login guard should recover userId from existing login caches before redirecting to auth'
)

assert.match(
  appPage,
  /const userId = this\.getStoredUserId\(\)/,
  'app login guard should use recovered userId instead of only raw userId storage'
)
