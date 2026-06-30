import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const helperPath = path.join(root, 'request', 'xunjing', 'userCancel.js')

assert.ok(
  fs.existsSync(helperPath),
  'Xicheng APP should centralize UniApp user-cancel detection in request/xunjing/userCancel.js'
)

const helper = fs.readFileSync(helperPath, 'utf8')

assert.match(
  helper,
  /export const isXunjingUserCancelled\s*=\s*\(err = \{\}\) => \{[\s\S]*errMsg[\s\S]*message[\s\S]*message\.includes\('cancel'\)[\s\S]*message\.includes\('取消'\)/,
  'Shared user cancel helper should normalize errMsg, message, string errors, and Chinese/English cancel markers'
)

const module = await import(`data:text/javascript;base64,${Buffer.from(helper).toString('base64')}`)

assert.equal(module.isXunjingUserCancelled({ errMsg: 'chooseImage:fail cancel' }), true)
assert.equal(module.isXunjingUserCancelled({ message: 'scanCode:fail cancel' }), true)
assert.equal(module.isXunjingUserCancelled('用户取消选择'), true)
assert.equal(module.isXunjingUserCancelled({ errMsg: 'chooseImage:fail auth deny' }), false)
assert.equal(module.isXunjingUserCancelled({ message: 'scanCode:fail camera unavailable' }), false)
