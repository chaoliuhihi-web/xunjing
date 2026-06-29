import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8')

const home = read('pages', 'xicheng', 'home', 'home.vue')
const scanResult = read('pages', 'xicheng', 'scan-result', 'scan-result.vue')
const travelogue = read('pages', 'xicheng', 'travelogue', 'travelogue.vue')

assert.match(
  home,
  /openXichengTravelogue\(mode = 'record'\)[\s\S]*autoStart=\$\{encodeURIComponent\(mode === 'record' \? '1' : ''\)\}/,
  'Home start-record entry should pass autoStart=1 only for explicit record mode'
)

assert.match(
  home,
  /openXichengTravelogue\(mode = 'record'\)[\s\S]*regionCode=\$\{encodeURIComponent\(this\.region\.regionCode\)\}[\s\S]*packageCode=\$\{encodeURIComponent\(this\.region\.packageCode\)\}[\s\S]*companionName=\$\{encodeURIComponent\(this\.region\.companionName\)\}/,
  'Home travelogue entry should carry regionCode, packageCode, and companionName for direct record/draft attribution'
)

assert.match(
  scanResult,
  /startRecording\(\)[\s\S]*mode=record[\s\S]*autoStart=1[\s\S]*poiCode=\$\{encodeRouteValue\(this\.result\.poiCode \|\| ''\)\}[\s\S]*poiName=\$\{encodeRouteValue\(this\.result\.poiName \|\| ''\)\}/,
  'Scan-result start-record action should navigate with autoStart=1, preserve POI context, and avoid double encoding'
)

assert.match(
  travelogue,
  /async loadJourney\(options = \{\}\)[\s\S]*if\s*\(\s*this\.shouldAutoStartRecording\(options\)\s*\)[\s\S]*await this\.startRecordingSession\(\)/,
  'Travelogue load should auto-start recording when opened from an explicit start-record entry'
)

assert.match(
  travelogue,
  /shouldAutoStartRecording\(options = \{\}\)[\s\S]*options\.mode === 'record'[\s\S]*options\.autoStart === '1'[\s\S]*this\.recordingSession\.status !== 'recording'/,
  'Travelogue auto-start guard should require record mode, autoStart=1, and avoid restarting an active session'
)

assert.doesNotMatch(
  travelogue,
  /autoStart=1[\s\S]*mode=draft|mode=draft[\s\S]*autoStart=1/,
  'Draft mode should never opt into auto-start recording'
)
