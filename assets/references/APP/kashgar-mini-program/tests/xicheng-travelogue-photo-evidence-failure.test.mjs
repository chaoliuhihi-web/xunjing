import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

for (const required of [
  'showPhotoEvidenceCaptureFailed',
  '照片未保存，请重新选择',
  '研学照片未保存，请重新选择',
  '照片选择失败'
]) {
  assert.ok(
    travelogue.includes(required),
    `Travelogue photo evidence capture should expose failure feedback marker ${required}`
  )
}

assert.match(
  travelogue,
  /showPhotoEvidenceCaptureFailed\(title = '照片选择失败'\)[\s\S]*uni\.showToast\(\{[\s\S]*title[\s\S]*icon:\s*'none'/,
  'Travelogue should centralize photo evidence failure toast copy'
)

assert.match(
  travelogue,
  /addStudyTaskPhoto\(index\)[\s\S]*const filePath = res\.tempFilePaths && res\.tempFilePaths\[0\] \? res\.tempFilePaths\[0\] : ''[\s\S]*if \(!filePath\) \{[\s\S]*this\.showPhotoEvidenceCaptureFailed\('研学照片未保存，请重新选择'\)[\s\S]*return[\s\S]*fail:\s*\(\) => \{[\s\S]*this\.showPhotoEvidenceCaptureFailed\(\)/,
  'Study task photo capture should show a failure prompt when the picker fails or returns no file'
)

assert.match(
  travelogue,
  /addPhotoMaterial\(\)[\s\S]*const filePath = res\.tempFilePaths && res\.tempFilePaths\[0\] \? res\.tempFilePaths\[0\] : ''[\s\S]*if \(!filePath\) \{[\s\S]*this\.showPhotoEvidenceCaptureFailed\('照片未保存，请重新选择'\)[\s\S]*return[\s\S]*fail:\s*\(\) => \{[\s\S]*this\.showPhotoEvidenceCaptureFailed\(\)/,
  'Travelogue photo material capture should show a failure prompt when the picker fails or returns no file'
)
