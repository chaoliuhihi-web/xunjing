import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const detailPath = path.join(root, 'subPackages', 'feature', 'map_two', 'detail.vue')
const detailPage = fs.readFileSync(detailPath, 'utf8')

const bookingLabel = '\u666f\u533a\u9884\u7ea6'
const oldBookingLabel = '\u4e1c\u6e56\u9884\u7ea6'

assert.match(
  detailPage,
  new RegExp(`\\{ label: '${bookingLabel}', type: 'booking', iconClass: 'recommend-icon-booking'[^}]*\\}`),
  'map detail booking entry should be labeled scenic booking'
)

assert.doesNotMatch(
  detailPage,
  new RegExp(oldBookingLabel),
  'map detail booking entry should not use the old Donghu booking label'
)
