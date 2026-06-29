import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const aiGuide = fs.readFileSync(path.join(root, 'pages', 'ai-guide', 'ai-guide.vue'), 'utf8')

const dedupeHelperSource = aiGuide.match(/const hasCompletedInitialQuestionInMessages\s*=\s*\(question = ''\) => \{[\s\S]*?\n\}/)?.[0] || ''
const sendInitialQuestionSource = aiGuide.match(/const sendInitialQuestion = async \(questionText\) => \{[\s\S]*?\n\}/)?.[0] || ''

assert.match(
  dedupeHelperSource,
  /const normalizedQuestion = String\(question \|\| ''\)\.trim\(\)[\s\S]*messages\.value\.findIndex\(item =>[\s\S]*item\.role === 'user'[\s\S]*String\(item\.content \|\| ''\)\.trim\(\) === normalizedQuestion/,
  'AI guide should detect a cached route question user message before replaying the question param'
)

assert.match(
  dedupeHelperSource,
  /messages\.value\.slice\(questionIndex \+ 1\)\.some\(item =>[\s\S]*item\.role === 'assistant'[\s\S]*!item\.isPending[\s\S]*String\(item\.content \|\| ''\)\.trim\(\)/,
  'AI guide should only skip replay when the cached route question already has a completed assistant answer'
)

assert.match(
  sendInitialQuestionSource,
  /await loadChatHistory\(\{ preferCache: true \}\)[\s\S]*if \(hasCompletedInitialQuestionInMessages\(question\)\) \{[\s\S]*scheduleHistoryScrollToBottom\(\)[\s\S]*return[\s\S]*\}[\s\S]*inputText\.value = question/,
  'AI guide should not append duplicate cached question and answer pairs when reopening a question-param Xiaojing URL'
)
