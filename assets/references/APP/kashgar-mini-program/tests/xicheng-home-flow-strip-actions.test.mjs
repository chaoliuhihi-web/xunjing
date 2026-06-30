import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const home = fs.readFileSync(path.join(root, 'pages', 'xicheng', 'home', 'home.vue'), 'utf8')

for (const required of [
  'xichengP0FlowActions',
  "key: 'guide'",
  "title: '小京讲解'",
  "key: 'routes'",
  "title: '推荐路线'",
  "key: 'record'",
  "title: '开始记录'",
  "key: 'draft'",
  "title: '生成游记草稿'",
  'handleXichengP0FlowAction(item.key)',
  'class="flow-step"'
]) {
  assert.ok(home.includes(required), `Xicheng home P0 flow strip should expose actionable flow contract ${required}`)
}

assert.match(
  home,
  /<view class="flow-strip"[\s\S]*v-for="item in xichengP0FlowActions"[\s\S]*@click="handleXichengP0FlowAction\(item\.key\)"[\s\S]*{{ item\.title }}/,
  'Xicheng home P0 flow strip should render the P0 sequence as clickable actions instead of static text'
)

assert.match(
  home,
  /handleXichengP0FlowAction\(key = 'guide'\)[\s\S]*case 'guide':[\s\S]*this\.askXiaojing\(\)/,
  'P0 flow guide action should enter Xiaojing explanation from the home page'
)

assert.match(
  home,
  /handleXichengP0FlowAction\(key = 'guide'\)[\s\S]*case 'routes':[\s\S]*this\.openXichengRoutes\(\)/,
  'P0 flow route action should open the dedicated official route list'
)

assert.match(
  home,
  /handleXichengP0FlowAction\(key = 'guide'\)[\s\S]*case 'record':[\s\S]*this\.openXichengRecording\(\)/,
  'P0 flow record action should open the journey recording surface'
)

assert.match(
  home,
  /handleXichengP0FlowAction\(key = 'guide'\)[\s\S]*case 'draft':[\s\S]*this\.openXichengTravelogue\('draft'\)/,
  'P0 flow draft action should open the travelogue draft surface'
)
