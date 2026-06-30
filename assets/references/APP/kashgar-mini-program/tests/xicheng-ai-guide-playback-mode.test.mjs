import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')
const aiGuideCss = read('pages', 'ai-guide', 'ai-guide-xicheng-chat.css')
const poi = read('pages', 'xicheng', 'poi', 'poi.vue')

for (const required of [
  'AI 讲解播放',
  'XICHENG_PLAYBACK_WAVE_BARS',
  'xichengPlaybackTitle',
  'xichengPlaybackSourceSummary',
  'xichengPlaybackSources',
  'seekXichengPlayback',
  'toggleXichengPlayback',
  'isXichengRoutePlaybackMode',
  'normalizeXichengAiGuideMode'
]) {
  assert.ok(aiGuide.includes(required), `Xicheng AI guide playback mode should expose ${required}`)
}

for (const required of [
  '.xicheng-playback-card',
  '.xicheng-playback-console',
  '.xicheng-playback-wave',
  '.xicheng-playback-controls',
  '.xicheng-playback-source-row'
]) {
  assert.ok(aiGuideCss.includes(required), `Xicheng AI guide playback styling should include ${required}`)
}

assert.match(
  poi,
  /const playbackQuery = prompt === this\.playQuestion \? `&mode=\$\{encodeRouteValue\('playback'\)\}` : ''[\s\S]*\/pages\/ai-guide\/ai-guide\?question=\$\{encodeRouteValue\(prompt\)\}\$\{playbackQuery\}/,
  'POI playback action should enter Xiaojing with explicit playback mode only for the official play question'
)

assert.match(
  aiGuide,
  /const isXichengRoutePlaybackMode = \(\) => normalizeXichengAiGuideMode\(getCurrentXichengAiRouteOptions\(\)\.mode\) === 'playback'/,
  'Playback mode should be recoverable from the current H5 hash route when UniApp lifecycle options drop the mode param'
)

assert.match(
  aiGuide,
  /const isXichengPlaybackMode = computed\(\(\) =>[\s\S]*\(xichengAiGuideMode\.value === 'playback' \|\| isXichengRoutePlaybackMode\(\)\)[\s\S]*!isXichengUnsafeSafetyStatus\(normalizeXichengSafetyStatus\(xichengAiContext\.value\.safetyStatus\)\)[\s\S]*getXichengContextSources\(\)\.length > 0[\s\S]*\)/,
  'Playback mode should fail closed and should not depend only on lifecycle-captured mode state'
)

assert.match(
  aiGuide,
  /const xichengPlaybackSourceSummary = computed\(\(\) => \{[\s\S]*if \(!isXichengPlaybackMode\.value\)[\s\S]*return XICHENG_BLOCKED_ANSWER[\s\S]*基于 \$\{sources\.length\} 条已审核来源生成/,
  'Playback source summary should never imply generated audio when playback mode is blocked by missing reviewed sources'
)
