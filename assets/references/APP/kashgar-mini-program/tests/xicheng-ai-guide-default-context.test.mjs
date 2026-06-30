import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')
const applyContextBlock = aiGuide.match(/const applyXichengAiContext\s*=\s*\(options = \{\}\) => \{[\s\S]*?\n\}/)?.[0] || ''

assert.ok(applyContextBlock, 'AI guide should expose applyXichengAiContext')

assert.match(
  applyContextBlock,
  /context\.regionCode\s*&&\s*context\.regionCode !== XICHENG_REGION_CONFIG\.regionCode[\s\S]*!context\.poiCode[\s\S]*!context\.poiName/,
  'AI guide should treat no-parameter direct entry as Xicheng P0 Xiaojing, and only fall back when a non-Xicheng regionCode is explicit'
)

assert.match(
  applyContextBlock,
  /regionCode:\s*context\.regionCode \|\| XICHENG_REGION_CONFIG\.regionCode[\s\S]*companionName:\s*context\.companionName \|\| XICHENG_REGION_CONFIG\.companionName/,
  'No-parameter Xiaojing entry should hydrate the Xicheng region and companion defaults'
)
