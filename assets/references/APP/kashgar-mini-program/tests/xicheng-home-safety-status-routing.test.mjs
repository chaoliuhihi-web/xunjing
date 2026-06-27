import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const home = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'home', 'home.vue'), 'utf8')

const openScanResultBlock = home.match(/openScanResult\(trigger = \{\}, source = ''\)[\s\S]*?\n\t\t\},\n\t\topenRecentRecognition/)?.[0] || ''
const openRecentRecognitionBlock = home.match(/openRecentRecognition\(\)[\s\S]*?\n\t\t\},\n\t\tcontinueRecentRecognitionWithXiaojing/)?.[0] || ''
const continueRecentBlock = home.match(/continueRecentRecognitionWithXiaojing\(\)[\s\S]*?\n\t\t\},\n\t\taskXiaojing/)?.[0] || ''

assert.ok(openScanResultBlock, 'Xicheng home should expose openScanResult')
assert.ok(openRecentRecognitionBlock, 'Xicheng home should expose openRecentRecognition')
assert.ok(continueRecentBlock, 'Xicheng home should expose continueRecentRecognitionWithXiaojing')

assert.match(
  openScanResultBlock,
  /safetyStatus=\$\{encodeURIComponent\(result\.safetyStatus \|\| ''\)\}/,
  'Fresh recognition result route should carry backend safetyStatus such as BLOCKED'
)

assert.match(
  openRecentRecognitionBlock,
  /safetyStatus=\$\{encodeURIComponent\(this\.recentRecognition\.safetyStatus \|\| ''\)\}/,
  'Recent recognition result route should carry cached safetyStatus without relying on result-page storage recovery'
)

assert.match(
  continueRecentBlock,
  /`safetyStatus=\$\{encodeURIComponent\(this\.recentRecognition\.safetyStatus \|\| ''\)\}`/,
  'Continuing a recent recognition into Xiaojing should carry safetyStatus in the chat route'
)

assert.doesNotMatch(
  home,
  /Authorization['"]?\s*:\s*`Bearer|pat_[A-Za-z0-9]{20,}|https:\/\/api\.coze\.cn|sk-[A-Za-z0-9]{20,}/,
  'Safety-status routing should not introduce client-side secrets'
)
