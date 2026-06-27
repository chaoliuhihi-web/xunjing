import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const mapDetailPath = path.join(root, 'subPackages', 'feature', 'map_two', 'detail.vue')
const mapDetail = fs.readFileSync(mapDetailPath, 'utf8')

assert.match(
  mapDetail,
  /v-for="item in recommendEntries"[\s\S]*@click="goAiGuideWithQuestion\(item\.prompt\)"/,
  'map recommendation entries should navigate to AI guide with their configured prompt'
)

const expectedEntries = [
  ['推荐景点', '请推荐几个适合游玩的三门景点，并说明各自亮点。'],
  ['美食小吃', '请推荐三门当地值得尝试的美食小吃，并介绍特色。'],
  ['景区预约', '我想预约三门景区游玩，请介绍可预约的景区和预约建议。'],
  ['酒店预订', '请推荐三门适合游客入住的酒店或住宿区域，并给出预订建议。'],
  ['推荐游线', '请推荐几条三门旅游路线，适合一日游或两日游。']
]

for (const [label, prompt] of expectedEntries) {
  assert.match(
    mapDetail,
    new RegExp(`\\{ label: '${label}', type: '[^']+', iconClass: '[^']+', prompt: '${prompt}' \\}`),
    `${label} entry should include the expected AI prompt`
  )
}
