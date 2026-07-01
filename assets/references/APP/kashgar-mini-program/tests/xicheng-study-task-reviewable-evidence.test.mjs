import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const travelogue = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'travelogue', 'travelogue.vue'), 'utf8')

assert.match(
  travelogue,
  /export const hasReviewableStudyTaskEvidence\s*=\s*\(evidence = \{\}\) => \{[\s\S]*if \(!evidence \|\| !evidence\.completedAt\) return false[\s\S]*const safetyStatus = normalizeXichengSafetyStatus\(evidence\.safetyStatus\)[\s\S]*if \(isXichengUnsafeSafetyStatus\(safetyStatus\)\) return false[\s\S]*return Boolean\([\s\S]*String\(evidence\.answerText \|\| ''\)\.trim\(\)[\s\S]*evidence\.photoPath[\s\S]*\)[\s\S]*\}/,
  'Travelogue should reject unsafe completed study task evidence before it can unlock drafts, review, or sharing'
)

assert.match(
  travelogue,
  /export const hasXichengTravelogueDraftEvidence = \(\{[\s\S]*const hasStudyEvidence = Array\.isArray\(studyTaskEvidence\) && studyTaskEvidence\.some\(evidence => hasReviewableStudyTaskEvidence\(evidence\)\)/,
  'Travelogue draft evidence gate should not treat completedAt-only study task records as real evidence'
)

assert.match(
  travelogue,
  /export const hasXichengReviewableWorkEvidence = \(\{[\s\S]*const hasStudyEvidence = Array\.isArray\(studyTaskEvidence\) && studyTaskEvidence\.some\(evidence => hasReviewableStudyTaskEvidence\(evidence\)\)/,
  'Travelogue work evidence gate should reuse the stricter study task evidence helper'
)

assert.match(
  travelogue,
  /const completedStudyEvidence = Array\.isArray\(studyTaskEvidence\)[\s\S]*\.filter\(evidence => hasReviewableStudyTaskEvidence\(evidence\)\)/,
  'Travelogue draft generator should summarize only reviewable study task evidence'
)

assert.match(
  travelogue,
  /completedStudyTaskEvidence\(\)[\s\S]*return this\.studyTaskEvidence\.filter\(evidence => hasReviewableStudyTaskEvidence\(evidence\)\)/,
  'Travelogue computed completedStudyTaskEvidence should reject completedAt-only records before public share export'
)

assert.doesNotMatch(
  travelogue,
  /studyTaskEvidence\.some\(evidence => evidence && evidence\.completedAt\)|this\.studyTaskEvidence\.filter\(evidence => evidence && evidence\.completedAt\)/,
  'Travelogue should not use completedAt-only study task checks for draft, review, or share eligibility'
)
