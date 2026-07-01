import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const componentPath = path.join(root, 'components', 'tab-bar', 'tab-bar.vue')
const component = fs.readFileSync(componentPath, 'utf8')

assert.match(
  component,
  /src="\/static\/tabbar\/ai_companion_avatar\.png"/,
  'center tab should use the Kashgar AI companion avatar from the reference flow'
)

assert.match(
  component,
  /class="center-avatar"/,
  'center tab avatar should be styled independently from the tab label'
)

assert.match(
  component,
  /<text class="center-text">AI识境<\/text>/,
  'center tab label should match the Vision Agent primary entry copy'
)

assert.doesNotMatch(
  component,
  /<image\s+:src="aiGuideAtlas"/,
  'center tab should not show the old generated reel atlas in the Kashgar demo shell'
)
