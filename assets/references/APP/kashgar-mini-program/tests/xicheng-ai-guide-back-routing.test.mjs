import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')
const goBackStart = aiGuide.indexOf('const goBack = () => {')
const goBackEnd = aiGuide.indexOf('const openKashgarDiaryGenerator', goBackStart)
const goBackBlock = goBackStart >= 0 && goBackEnd > goBackStart ? aiGuide.slice(goBackStart, goBackEnd) : ''

assert.ok(goBackBlock, 'AI guide should expose a goBack handler')

assert.match(
  aiGuide,
  /const XICHENG_HOME_ROUTE\s*=\s*'\/pages\/xicheng\/home\/home'[\s\S]*const KASHGAR_HOME_ROUTE\s*=\s*'\/pages\/index\/index\?city=kashgar'/,
  'AI guide should centralize explicit Xicheng and Kashgar home fallback routes'
)

assert.match(
  goBackBlock,
  /if\s*\(isXichengChatMode\.value\)\s*\{[\s\S]*uni\.reLaunch\(\{[\s\S]*url:\s*XICHENG_HOME_ROUTE[\s\S]*\}\)[\s\S]*uni\.navigateBack\(\)[\s\S]*return/,
  'Xicheng Xiaojing back should navigate back or relaunch the explicit Xicheng home, never the Kashgar companion home'
)

assert.ok(
  goBackBlock.indexOf('if (isXichengChatMode.value)') > -1 &&
    goBackBlock.indexOf('if (isXichengChatMode.value)') < goBackBlock.indexOf('showAiCompanionHome.value === false'),
  'Xicheng mode must be handled before the generic Kashgar companion-home fallback'
)

assert.match(
  goBackBlock,
  /showAiCompanionHome\.value === false && KASHGAR_AI_COMPANION_HOME_ENABLED[\s\S]*showAiCompanionHome\.value = true/,
  'Non-Xicheng chat should still be able to return to the Kashgar companion home'
)

assert.match(
  goBackBlock,
  /url:\s*KASHGAR_HOME_ROUTE/,
  'Kashgar single-page back fallback should opt into the legacy Kashgar route explicitly'
)

assert.doesNotMatch(
  goBackBlock,
  /url:\s*'\/pages\/index\/index'/,
  'AI guide back fallback should not relaunch the naked legacy index because it now resolves to Xicheng'
)
