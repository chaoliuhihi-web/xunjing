import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const indexPath = path.join(root, 'pages', 'index', 'index.vue')
const indexPage = fs.readFileSync(indexPath, 'utf8')
const logoUrl = 'https://www.neoxiake.com//upload/admin/20260602/1541ed4672310f0f341f05037f4a53af.png'

assert.ok(
  indexPage.includes(`<image src="${logoUrl}" class="nav-icon" mode="aspectFit"></image>`),
  'homepage top logo should use the newly uploaded server logo URL'
)

assert.doesNotMatch(
  indexPage,
  /class="nav-icon"[\s\S]{0,140}baidu_map\/weatch\/images\/icon\.png/,
  'homepage top logo should not still point to the old icon.png asset'
)

assert.match(
  indexPage,
  /\.nav-icon\s*\{[\s\S]*transform:\s*translateY\(15px\)/,
  'homepage top logo should move down 15px without shifting the whole header layout'
)
