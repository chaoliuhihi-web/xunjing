import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const works = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'works', 'works.vue'), 'utf8')

assert.match(
  works,
  /const assets = this\.shareArtifacts\.map\(\(item, index\) => \(\{[\s\S]*assetType:\s*item\.assetType[\s\S]*templateCode:\s*item\.templateCode/,
  'Works page should preserve share artifact assetType and templateCode when building review items'
)

assert.match(
  works,
  /getWorkThumb\(item = \{\}\)[\s\S]*item\.assetType === 'pdf'[\s\S]*this\.region\.visualAssets\.passportStamp/,
  'Works page PDF memorial artifacts should resolve the PDF/passport thumbnail from preserved assetType'
)
