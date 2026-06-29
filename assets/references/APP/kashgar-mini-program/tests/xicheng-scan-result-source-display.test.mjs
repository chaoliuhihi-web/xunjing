import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanResult = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'scan-result', 'scan-result.vue'), 'utf8')

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
  /source\.title \|\| source\.name \|\| source\.sourceTitle/,
  'Recognition result source title helper should read known backend source title fields'
)

assert.match(
  sourceTitleHelper,
  /replace\(\s*\/\\s\*POI\\s\*级已审核来源\\s\*\$\/g/,
  'Recognition result source title helper should strip raw POI reviewed-source suffixes'
)

assert.match(
  sourceDescriptionHelper,
  /source\.excerpt \|\| source\.summary \|\| source\.contentDigest/,
  'Recognition result source description helper should read known backend source excerpt fields'
)

assert.match(
  sourceDescriptionHelper,
  /replace\(\s*\/POI 级已审核来源：\[\^。\]\*。\/g/,
  'Recognition result source description helper should strip internal POI seed prefixes'
)

assert.match(
  sourceDescriptionHelper,
  /replace\(\s*\/生产发布前仍需完成\[\^。\]\*。\/g/,
  'Recognition result source description helper should strip production-review operation notes'
)

assert.match(
  sourceDescriptionHelper,
  /cleanedDescription\.length > 72[\s\S]*cleanedDescription\.slice\(0, 72\)/,
  'Recognition result source description helper should keep source cards compact on mobile'
)

assert.doesNotMatch(
  scanResult,
  /\{\{\s*source\.excerpt \|\| source\.summary \|\| source\.url\s*\}\}/,
  'Recognition result source cards should not expose raw source excerpt, summary, or URL fields directly'
)
