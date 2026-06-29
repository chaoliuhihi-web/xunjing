import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')
const sourceHelper = fs.readFileSync(path.join(root, 'request', 'xunjing', 'sources.js'), 'utf8')

const sourceTitleHelper = scanResult.match(/getDisplaySourceTitle\(source = \{\}\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''
const sourceDescriptionHelper = scanResult.match(/getDisplaySourceDescription\(source = \{\}\) \{[\s\S]*?\n\t\t\}/)?.[0] || ''

assert.match(
  scanResult,
  /<text class="source-title">\{\{ getDisplaySourceTitle\(source\) \|\| '审核来源' \}\}<\/text>/,
  'Recognition result source cards should render display-safe source titles'
)

assert.match(
  scanResult,
  /<text v-if="getDisplaySourceDescription\(source\)" class="source-desc">\s*\{\{ getDisplaySourceDescription\(source\) \}\}\s*<\/text>/,
  'Recognition result source cards should render curated source descriptions instead of raw backend fields'
)

assert.match(
  sourceTitleHelper,
  /return getXichengDisplaySourceTitle\(source\)/,
  'Recognition result source title helper should delegate cleanup to the shared source display helper'
)

assert.match(
  sourceHelper,
  /source\.title \|\| source\.name \|\| source\.sourceTitle/,
  'Recognition result shared source title helper should read known backend source title fields'
)

assert.match(
  sourceHelper,
  /replace\(\s*\/\\s\*POI\\s\*级已审核来源\\s\*\$\/g/,
  'Recognition result source title helper should strip raw POI reviewed-source suffixes'
)

assert.match(
  sourceDescriptionHelper,
  /return getXichengDisplaySourceDescription\(source\)/,
  'Recognition result source description helper should delegate cleanup to the shared source display helper'
)

assert.match(
  sourceHelper,
  /source\.excerpt \|\| source\.summary \|\| source\.contentDigest/,
  'Recognition result shared source description helper should read known backend source excerpt fields'
)

assert.match(
  sourceHelper,
  /replace\(\s*\/POI 级已审核来源：\[\^。\]\*。\/g/,
  'Recognition result source description helper should strip internal POI seed prefixes'
)

assert.match(
  sourceHelper,
  /replace\(\s*\/生产发布前仍需完成\[\^。\]\*。\/g/,
  'Recognition result source description helper should strip production-review operation notes'
)

assert.match(
  sourceHelper,
  /maxLength = 72[\s\S]*cleanedDescription\.length > boundedLength[\s\S]*cleanedDescription\.slice\(0, boundedLength\)/,
  'Recognition result source description helper should keep source cards compact on mobile'
)

assert.doesNotMatch(
  scanResult,
  /\{\{\s*source\.excerpt \|\| source\.summary \|\| source\.url\s*\}\}/,
  'Recognition result source cards should not expose raw source excerpt, summary, or URL fields directly'
)
