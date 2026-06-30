import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')
const previewTextBlock = travelogue.match(/traveloguePreviewText\(\) \{[\s\S]*?\n\t\t\},\n\t\ttraveloguePreviewTags/)?.[0] || ''

assert.ok(previewTextBlock, 'Travelogue should expose traveloguePreviewText')

assert.match(
  travelogue,
  /export const createXichengTraveloguePreviewExcerpt\s*=\s*\(text = '', limit = \d+\) => \{[\s\S]*return `\$\{excerpt\}…`/,
  'Travelogue preview should use a bounded excerpt helper that ends long drafts with an ellipsis'
)

assert.ok(
  previewTextBlock.includes('createXichengTraveloguePreviewExcerpt(currentDraft)'),
  'Travelogue preview should use the shared excerpt helper for generated drafts'
)

assert.doesNotMatch(
  previewTextBlock,
  /currentDraft\.slice\(0,\s*118\)/,
  'Travelogue preview should not hard-cut the generated draft mid-sentence'
)
