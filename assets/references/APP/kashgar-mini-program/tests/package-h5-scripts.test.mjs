import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const scripts = packageJson.scripts || {}

assert.equal(scripts.serve, 'npm run dev:h5', 'serve should keep pointing to the H5 dev script')
assert.equal(scripts.build, 'npm run build:app', 'build should point to the UniApp APP build script')
assert.equal(
  scripts['prebuild:app'],
  'node scripts/verify_uni_cli_available.mjs',
  'APP builds should fail early with a clear UniApp CLI diagnostic when packaging tools are missing'
)
assert.equal(
  scripts['build:app'],
  'UNI_INPUT_DIR=. UNI_OUTPUT_DIR=dist/build/app uni build -p app',
  'APP build script should target the UniApp app platform'
)

const uniCliPreflight = fs.readFileSync(path.join(root, 'scripts', 'verify_uni_cli_available.mjs'), 'utf8')
assert.match(
  uniCliPreflight,
  /UniApp APP packaging requires the `uni` CLI/,
  'APP build preflight should explain the missing UniApp CLI dependency'
)

assert.doesNotMatch(
  scripts['dev:h5'],
  /uni-app-cli/,
  'H5 dev script should not call the removed uni-app-cli binary'
)

assert.doesNotMatch(
  scripts['build:h5'],
  /uni-app-cli/,
  'H5 build script should not call the removed uni-app-cli binary'
)

assert.match(
  scripts['dev:h5'],
  /UNI_INPUT_DIR=\./,
  'H5 dev script should point UniApp at the root-based project input directory'
)

assert.match(
  scripts['build:h5'],
  /UNI_INPUT_DIR=\./,
  'H5 build script should point UniApp at the root-based project input directory'
)

assert.match(
  scripts['build:h5'],
  /uni build -p h5/,
  'H5 build script should use the installed uni CLI build command'
)

assert.match(
  scripts['build:app'],
  /uni build -p app/,
  'APP build script should use the installed uni CLI app build command'
)
