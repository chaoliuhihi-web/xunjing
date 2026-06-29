import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')

const sourceDisplayHelper = aiGuide.match(/const getDisplaySourceDescription\s*=\s*\(source = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''

assert.match(
  aiGuide,
  /<text v-if="getDisplaySourceDescription\(source\)" class="message-source-desc">\s*\{\{ getDisplaySourceDescription\(source\) \}\}\s*<\/text>/,
  'Xiaojing source cards should render a curated user-facing source description instead of raw backend seed notes'
)

assert.match(
  sourceDisplayHelper,
  /source\.excerpt \|\| source\.summary \|\| source\.contentDigest/,
  'Source display helper should normalize the known backend source excerpt fields'
)

assert.match(
  sourceDisplayHelper,
  /replace\(\s*\/POI 级已审核来源：\[\^。\]\*。\/g/,
  'Source display helper should strip repeated internal POI seed prefixes from user-facing cards'
)

assert.match(
  sourceDisplayHelper,
  /replace\(\s*\/触发关键词、坐标和别名来自\[\^。\]\*。\/g/,
  'Source display helper should strip trigger/coordinate seed provenance from user-facing cards'
)

assert.match(
  sourceDisplayHelper,
  /replace\(\s*\/生产发布前仍需完成\[\^。\]\*。\/g/,
  'Source display helper should strip production-review operation notes from user-facing cards'
)

assert.match(
  sourceDisplayHelper,
  /cleanedDescription\.length > 72[\s\S]*cleanedDescription\.slice\(0, 72\)/,
  'Source display helper should keep source cards compact enough for the mobile chat design'
)

assert.doesNotMatch(
  aiGuide,
  /\{\{\s*source\.excerpt \|\| source\.summary \|\| source\.url\s*\}\}/,
  'Xiaojing source cards should not directly expose raw source excerpt, summary, or URL fields'
)
