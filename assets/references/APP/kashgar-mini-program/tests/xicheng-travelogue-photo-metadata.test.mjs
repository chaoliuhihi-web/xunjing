import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

for (const required of [
  'resolvePhotoEvidenceFileMeta',
  'normalizePhotoExifLocationForMaterial',
  'imageSizeBytes',
  'imageMimeType',
  'exifLatitude',
  'exifLongitude',
  'exifSource',
  'captureLocation'
]) {
  assert.ok(travelogue.includes(required), `Travelogue photo evidence should retain metadata marker ${required}`)
}

assert.match(
  travelogue,
  /export const normalizePhotoExifLocationForMaterial\s*=\s*\(fileMeta = \{\}[\s\S]*fileMeta\.exifLocation[\s\S]*fileMeta\.exifLatitude[\s\S]*fileMeta\.exifLongitude[\s\S]*accuracyMeters[\s\S]*exifSource/,
  'Photo material metadata should normalize EXIF/location fields separately from capture-time location'
)

assert.match(
  travelogue,
  /export const resolvePhotoEvidenceFileMeta\s*=\s*\(chooseImageResult = \{\}[\s\S]*chooseImageResult\.tempFiles[\s\S]*chooseImageResult\.tempFilePaths[\s\S]*localFileId[\s\S]*imageSizeBytes[\s\S]*imageMimeType[\s\S]*normalizePhotoExifLocationForMaterial\(tempFile\)/,
  'Photo material metadata should derive local file id, file size, mime type, and EXIF location from chooseImage result'
)

assert.match(
  travelogue,
  /addPhotoMaterial\(\)[\s\S]*const photoFileMeta = resolvePhotoEvidenceFileMeta\(res\)[\s\S]*photoFileMeta\.filePath[\s\S]*resolvedFilePath[\s\S]*localFileId:\s*photoFileMeta\.localFileId \|\| resolvedFilePath[\s\S]*imageSizeBytes:\s*photoFileMeta\.imageSizeBytes[\s\S]*imageMimeType:\s*photoFileMeta\.imageMimeType[\s\S]*exifLocation:\s*photoFileMeta\.exifLocation[\s\S]*captureLocation:\s*this\.normalizeCaptureLocationForMaterial\(captureLocation\)/,
  'Adding a photo material should persist file metadata, EXIF location if available, and capture-time location as separate evidence'
)

assert.match(
  travelogue,
  /submitReviewPackage\(\)[\s\S]*materials:\s*this\.materials[\s\S]*photoMaterialCount:\s*this\.photoMaterialCount/,
  'Review package should keep full photo materials so metadata can be audited before public release'
)

assert.doesNotMatch(
  travelogue,
  /\/app-api\/xunjing|Authorization|Bearer|sk-[A-Za-z0-9]{20,}|pat_[A-Za-z0-9]{20,}/,
  'Photo metadata capture should remain local and must not add backend calls or client-side secrets'
)
