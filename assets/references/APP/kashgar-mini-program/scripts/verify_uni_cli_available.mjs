import { spawnSync } from 'node:child_process'

const result = spawnSync('uni', ['--help'], {
  cwd: process.cwd(),
  stdio: 'ignore',
  shell: process.platform === 'win32'
})

if (result.error || result.status !== 0) {
  console.error([
    'UniApp APP packaging requires the `uni` CLI, but it is not available in this shell.',
    '',
    'Run `npm install` in assets/references/APP/kashgar-mini-program so npm scripts can resolve node_modules/.bin/uni,',
    'or use a configured HBuilderX/UniApp build environment before running `npm run build`.'
  ].join('\n'))
  process.exit(127)
}
