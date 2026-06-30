import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')
const exists = (...segments) => fs.existsSync(path.join(root, ...segments))

const aiGuide = read('pages', 'ai-guide', 'ai-guide.vue')
assert.ok(
  exists('request', 'xunjing', 'initialQuestion.js'),
  'Initial question dedupe logic should live in a shared request/xunjing helper instead of growing ai-guide.vue'
)

const initialQuestionSource = read('request', 'xunjing', 'initialQuestion.js')
const dedupeHelperSource = initialQuestionSource.match(/export const hasCompletedInitialQuestionInMessages\s*=\s*\(messages = \[\], question = ''\) => \{[\s\S]*?\n\}/)?.[0] || ''
const pendingDedupeHelperSource = initialQuestionSource.match(/export const hasPendingInitialQuestionInMessages\s*=\s*\(messages = \[\], question = ''\) => \{[\s\S]*?\n\}/)?.[0] || ''
const sendInitialQuestionSource = aiGuide.match(/const sendInitialQuestion = async \(questionText\) => \{[\s\S]*?\n\}/)?.[0] || ''

assert.match(
  aiGuide,
  /import \{[\s\S]*hasCompletedInitialQuestionInMessages as hasCompletedInitialQuestionInMessageList[\s\S]*hasPendingInitialQuestionInMessages as hasPendingInitialQuestionInMessageList[\s\S]*\} from '@\/request\/xunjing\/initialQuestion\.js'/,
  'AI guide should import the shared initial question dedupe helpers'
)

assert.match(
  aiGuide,
  /const hasCompletedInitialQuestionInMessages = \(question = ''\) => hasCompletedInitialQuestionInMessageList\(messages\.value, question\)[\s\S]*const hasPendingInitialQuestionInMessages = \(question = ''\) => hasPendingInitialQuestionInMessageList\(messages\.value, question\)/,
  'AI guide should keep only message-list wrappers for initial question dedupe'
)

assert.match(
  initialQuestionSource,
  /const normalizedQuestion = String\(question \|\| ''\)\.trim\(\)[\s\S]*messages\.findIndex\(item =>[\s\S]*item\.role === 'user'[\s\S]*String\(item\.content \|\| ''\)\.trim\(\) === normalizedQuestion/,
  'AI guide should detect a cached route question user message before replaying the question param'
)

assert.match(
  dedupeHelperSource,
  /const questionIndex = findInitialQuestionIndex\(messages, normalizedQuestion\)/,
  'Completed initial question helper should reuse the shared message-list lookup'
)

assert.match(
  dedupeHelperSource,
  /messages\.slice\(questionIndex \+ 1\)\.some\(item =>[\s\S]*item\.role === 'assistant'[\s\S]*!item\.isPending[\s\S]*String\(item\.content \|\| ''\)\.trim\(\)/,
  'AI guide should only skip replay when the cached route question already has a completed assistant answer'
)

assert.match(
  pendingDedupeHelperSource,
  /const questionIndex = findInitialQuestionIndex\(messages, normalizedQuestion\)[\s\S]*messages\.slice\(questionIndex \+ 1\)\.some\(item =>[\s\S]*item\.role === 'assistant'[\s\S]*item\.isPending/,
  'AI guide should detect an in-flight initial question before lifecycle refreshes can append the same user message again'
)

assert.match(
  sendInitialQuestionSource,
  /if \(hasPendingInitialQuestionInMessages\(question\)\) \{[\s\S]*scheduleHistoryScrollToBottom\(\)[\s\S]*return[\s\S]*\}[\s\S]*await loadChatHistory\(\{ preferCache: true \}\)[\s\S]*if \(hasCompletedInitialQuestionInMessages\(question\)\) \{[\s\S]*scheduleHistoryScrollToBottom\(\)[\s\S]*return[\s\S]*\}[\s\S]*inputText\.value = question/,
  'AI guide should not append duplicate cached question and answer pairs when reopening a question-param Xiaojing URL'
)
