import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const myPagePath = path.join(root, 'subPackages', 'user', 'my', 'my.vue')
const myPage = fs.readFileSync(myPagePath, 'utf8')
const avatarHandler = myPage.slice(
  myPage.indexOf('const onChooseAvatar = async'),
  myPage.indexOf('// 昵称输入回调')
)

assert.match(
  myPage,
  /const getSavedOpenid = \(\) => \{[\s\S]*uni\.getStorageSync\('openid'\)[\s\S]*userInfo\.wxopen_id[\s\S]*userInfo\.openid[\s\S]*userModel\.openid\.openid[\s\S]*uni\.setStorageSync\('openid', openid\)[\s\S]*\}/,
  'profile user_save should recover openid from all existing login caches before showing a login prompt'
)

assert.match(
  myPage,
  /const saveUserProfile = async \(payload\) => \{[\s\S]*const openid = getSavedOpenid\(\)[\s\S]*if \(!openid\)[\s\S]*请重新登录[\s\S]*request\('api2\/user\/user_save', \{ openid, \.\.\.payload \}, 'POST'\)/,
  'profile user_save should guard missing openid before calling backend'
)

assert.doesNotMatch(
  myPage,
  /openid:\s*userInfo\.wxopen_id/,
  'profile user_save should not depend only on userInfo.wxopen_id'
)

assert.ok(
  myPage.includes('const persistAvatarFile = (tempFilePath) => new Promise'),
  'profile avatar should define a local persistence helper'
)

assert.ok(
  myPage.includes('uni.saveFile({') &&
  myPage.includes('resolve(saveRes.savedFilePath || tempFilePath)') &&
  myPage.includes('resolve(tempFilePath)'),
  'profile avatar should persist the WeChat temporary avatar path locally before caching it'
)

assert.ok(
  myPage.includes('const savedAvatarUrl = await persistAvatarFile(avatarUrl)') &&
  myPage.includes('userAvatar.value = savedAvatarUrl') &&
  myPage.includes('saveUserProfile({ avatarUrl: savedAvatarUrl })') &&
  myPage.includes('userInfo.avatarUrl = savedAvatarUrl'),
  'profile avatar should display, save, and cache the persisted local file path'
)

assert.ok(
  avatarHandler.includes("uni.setStorageSync('userInfo', userInfo)") &&
  avatarHandler.indexOf("uni.setStorageSync('userInfo', userInfo)") < avatarHandler.indexOf('saveUserProfile({ avatarUrl: savedAvatarUrl })'),
  'profile avatar should cache locally before syncing to user_save so navigation does not lose it when the API fails'
)
