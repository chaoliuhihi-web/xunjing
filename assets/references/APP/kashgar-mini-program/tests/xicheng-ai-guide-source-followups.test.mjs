import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')

const sourceTitleHelper = aiGuide.match(/const getDisplaySourceTitle\s*=\s*\(source = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const sourceFollowUpHelper = aiGuide.match(/const getDisplaySourceFollowUp\s*=\s*\(source = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''
const normalizeFollowUpsHelper = aiGuide.match(/const normalizeDisplayFollowUps\s*=\s*\(followUps = \[\]\) => \{[\s\S]*?\n\}/)?.[0] || ''
const cachedMessagesSource = aiGuide.match(/const normalizeCachedMessages\s*=\s*\(list\) => \{[\s\S]*?\n\}/)?.[0] || ''
const sourceFollowUpsSource = aiGuide.match(/const createSourceFollowUps\s*=\s*\(sources = \[\]\) =>[\s\S]*?\n\nconst createXunjingResultFollowUps/)?.[0] || ''

assert.match(
  sourceTitleHelper,
  /source\.title \|\| source\.name \|\| source\.sourceTitle/,
  'Xiaojing should derive source follow-up copy from normalized source title fields'
)

assert.match(
  sourceTitleHelper,
  /replace\(\s*\/\\s\*POI\\s\*级已审核来源\\s\*\$\/g/,
  'Xiaojing should strip raw POI reviewed-source suffixes before showing source titles'
)

assert.match(
  sourceTitleHelper,
  /replace\(\s*\/\\s\*已审核来源\\s\*\$\/g/,
  'Xiaojing should strip raw reviewed-source suffixes before showing source titles'
)

assert.match(
  sourceFollowUpHelper,
  /return `继续了解\$\{sourceTitle\}`/,
  'Xiaojing should turn source titles into actionable follow-up questions'
)

assert.match(
  sourceFollowUpsSource,
  /sources[\s\S]*\.map\(getDisplaySourceFollowUp\)[\s\S]*\.filter\(Boolean\)[\s\S]*\.slice\(0, 3\)/,
  'Xiaojing source follow-up chips should be generated from display-safe source titles, not raw backend source names'
)

assert.match(
  normalizeFollowUpsHelper,
  /String\(followUp \|\| ''\)[\s\S]*replace\(\/\\s\*POI\\s\*级已审核来源\\s\*\$\/g, ''\)[\s\S]*return `继续了解\$\{cleanedFollowUp\}`/,
  'Xiaojing should normalize stale cached reviewed-source follow-up chips into natural questions'
)

assert.match(
  cachedMessagesSource,
  /followUps:\s*unsafeSafetyStatus \? \[\] : normalizeDisplayFollowUps\(item\.followUps\)/,
  'Xiaojing should repair cached assistant follow-up chips before rendering old conversations'
)

assert.doesNotMatch(
  sourceFollowUpsSource,
  /\.map\(source => source\.title\)|source\.title\)/,
  'Xiaojing should not expose raw backend source titles directly as follow-up chips'
)
