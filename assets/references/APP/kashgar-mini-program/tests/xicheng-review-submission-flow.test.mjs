import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const regionConfig = read('config', 'regions', 'xicheng.js')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

assert.ok(
  regionConfig.includes("reviewStorageKey: 'xicheng:reviewSubmissions'"),
  'Xicheng config should define a local review submission storage key'
)

for (const required of [
  '审核提交记录',
  'reviewSubmission',
  'submitReviewPackage',
  'reviewStorageKey',
  'submittedAt',
  'materialCount',
  'sourceCount',
  'posterStatus',
  'pdfStatus'
]) {
  assert.ok(travelogue.includes(required), `Travelogue page should support review submission evidence ${required}`)
}

assert.match(
  travelogue,
  /submitReview\(\)[\s\S]*const reviewPayload = this\.submitReviewPackage\(\)[\s\S]*uni\.setStorageSync\(XICHENG_REGION_CONFIG\.reviewStorageKey/,
  'submitReview should create and persist a review payload for operations auditing'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*draft:\s*this\.draft[\s\S]*materials:\s*this\.materials[\s\S]*recognizedRoute:\s*this\.recognizedRoute[\s\S]*reviewStatus:\s*this\.reviewText/,
  'review payload should include draft, materials, recognized route, and review status'
)

assert.match(
  travelogue,
  /uni\.getStorageSync\(XICHENG_REGION_CONFIG\.reviewStorageKey\)[\s\S]*this\.reviewSubmission/,
  'travelogue should restore the last review submission on load'
)

assert.doesNotMatch(
  travelogue,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'local review MVP should not introduce backend calls or client-side secrets'
)
