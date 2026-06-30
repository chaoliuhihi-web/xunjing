import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuidePath = path.join(root, 'pages', 'ai-guide', 'ai-guide.vue')
const aiGuide = fs.readFileSync(aiGuidePath, 'utf8')
const renderStreamContentSource = aiGuide.match(/const renderStreamContent = \(state\) => \{[\s\S]*?\n\}/)?.[0] || ''

assert.match(
  aiGuide,
  /const AI_RESPONSE_TIMEOUT_MS\s*=\s*60000/,
  'AI guide should wait long enough for real Yudao sourced answers before falling back to local source context'
)

assert.match(
  aiGuide,
  /const STREAM_RENDER_INTERVAL\s*=\s*40/,
  'AI guide should render streaming text frequently enough that replies feel responsive'
)

assert.match(
  aiGuide,
  /const STREAM_TYPEWRITER_CHARS_PER_TICK\s*=\s*2/,
  'AI guide should reveal AI text in small typewriter batches instead of dumping a full response into the bubble'
)

assert.match(
  aiGuide,
  /\.filter\(item => !\(item\.role === 'assistant' && item\.isPending && !item\.content\)\)/,
  'AI guide should drop stale empty pending assistant messages when restoring cache'
)

assert.match(
  aiGuide,
  /isPending:\s*false/,
  'AI guide should persist cached messages as non-pending snapshots'
)

assert.match(
  aiGuide,
  /responseTimeoutTimer\s*=\s*setTimeout\([\s\S]*requestTask\.abort\(\)[\s\S]*AI_RESPONSE_TIMEOUT_MS/,
  'AI guide should abort a stuck AI request after the timeout'
)

assert.match(
  aiGuide,
  /uni\.request\(\{[\s\S]*timeout:\s*AI_RESPONSE_TIMEOUT_MS/,
  'AI guide should pass the same response timeout to uni.request instead of relying only on a UI timer'
)

assert.match(
  aiGuide,
  /if \(requestSettled\) \{[\s\S]*return[\s\S]*\}/,
  'AI guide should ignore late stream callbacks after timeout or completion'
)

assert.doesNotMatch(
  aiGuide,
  /onChunkReceived|enableChunked:\s*true|stream:\s*true/,
  'AI guide should not use client-side streaming after moving AI calls behind the Yudao proxy'
)

assert.match(
  aiGuide,
  /const commitAssistantMessage\s*=\s*\(message, fields = \{\}\)[\s\S]*messages\.value\s*=\s*\[[\s\S]*messages\.value[\s\S]*\]/,
  'AI guide should replace the messages array after assistant message updates so mini-program rendering refreshes'
)

assert.match(
  aiGuide,
  /displayContent:\s*''/,
  'AI guide should initialize a separate display buffer for typewriter rendering'
)

assert.match(
  aiGuide,
  /const renderStreamContent = \(state\) => \{[\s\S]*STREAM_TYPEWRITER_CHARS_PER_TICK[\s\S]*content:\s*state\.displayContent[\s\S]*scheduleStreamContentRender\(state\)/,
  'AI guide should keep a display buffer and continue scheduling typewriter renders until visible text catches up'
)

assert.match(
  renderStreamContentSource,
  /state\.streamFinished && !state\.cacheSavedAfterTypewriter[\s\S]*state\.cacheSavedAfterTypewriter = true[\s\S]*saveMessagesCache\(\)/,
  'AI guide should save chat cache once after typewriter rendering catches up, not on every streaming tick'
)
