import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')
const componentPath = path.join(root, 'components', 'xicheng', 'XichengAiGuideMessageEvidence.vue')

assert.ok(
  fs.existsSync(componentPath),
  'Xiaojing message evidence should be isolated in a reusable component instead of growing ai-guide.vue'
)

const component = fs.readFileSync(componentPath, 'utf8')

assert.match(
  aiGuide,
  /import XichengAiGuideMessageEvidence from '@\/components\/xicheng\/XichengAiGuideMessageEvidence\.vue'/,
  'AI guide should import the isolated message evidence component'
)

assert.match(
  aiGuide,
  /<XichengAiGuideMessageEvidence[\s\S]*:sources="msg\.sources"[\s\S]*:follow-ups="msg\.followUps"[\s\S]*@follow-up="handleFollowUpClick"/,
  'AI guide should render reviewed sources and follow-up questions through the isolated component'
)

assert.doesNotMatch(
  aiGuide,
  /v-for="\s*\(source,\s*sourceIndex\)\s+in\s+msg\.sources"/,
  'AI guide should not keep the reviewed source list loop inline'
)

assert.doesNotMatch(
  aiGuide,
  /v-for="\s*\(followUp,\s*fIndex\)\s+in\s+msg\.followUps"/,
  'AI guide should not keep the follow-up chip loop inline'
)

assert.match(
  component,
  /getXichengDisplaySourceDescription[\s\S]*getXichengDisplaySourceTitle/,
  'Message evidence component should keep using shared source display helpers'
)

assert.match(
  component,
  /\$emit\('follow-up',\s*followUp\)/,
  'Message evidence component should emit follow-up clicks back to ai-guide'
)
