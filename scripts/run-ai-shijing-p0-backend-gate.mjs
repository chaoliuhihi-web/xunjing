import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const commands = [
  {
    name: 'ai-shijing-p0-backend-loop',
    command: 'npm run xunjing:ai-shijing:p0:verify',
    args: ['run', 'xunjing:ai-shijing:p0:verify']
  },
  {
    name: 'ai-shijing-p0-contract-tests',
    command: 'npm run test:run -- scripts/ai-shijing-p0-backend-loop.test.mjs scripts/xunjing-app-api-contract.test.mjs scripts/xicheng-backend-launch-readiness.test.mjs scripts/verify-xunjing-platform-readiness.test.mjs',
    args: [
      'run',
      'test:run',
      '--',
      'scripts/ai-shijing-p0-backend-loop.test.mjs',
      'scripts/xunjing-app-api-contract.test.mjs',
      'scripts/xicheng-backend-launch-readiness.test.mjs',
      'scripts/verify-xunjing-platform-readiness.test.mjs'
    ]
  },
  {
    name: 'xunjing-platform-static',
    command: 'npm run xunjing:platform:verify:static',
    args: ['run', 'xunjing:platform:verify:static']
  }
]

function runCommand(command) {
  const startedAt = new Date().toISOString()
  const result = spawnSync('npm', command.args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })
  if (result.stdout) {
    process.stdout.write(result.stdout)
  }
  if (result.stderr) {
    process.stderr.write(result.stderr)
  }
  return {
    name: command.name,
    command: command.command,
    ok: result.status === 0,
    exitCode: result.status,
    startedAt,
    finishedAt: new Date().toISOString()
  }
}

function gitValue(args) {
  const result = spawnSync('git', args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  })
  return result.status === 0 ? result.stdout.trim() : ''
}

const checks = commands.map(runCommand)
const ok = checks.every((check) => check.ok)

const report = {
  artifactType: 'ai-shijing-p0-backend-gate',
  ok,
  checkedAt: new Date().toISOString(),
  summary: {
    branch: gitValue(['branch', '--show-current']),
    gitCommit: gitValue(['rev-parse', 'HEAD']),
    workingTreeClean: gitValue(['status', '--short']).length === 0,
    backendOnly: true,
    doesNotReplaceProductionPreflight: true,
    productionPreflightCommand: 'npm run xunjing:yudao:release:preflight',
    checkCount: checks.length,
    passedCheckCount: checks.filter((check) => check.ok).length,
    failedCheckCount: checks.filter((check) => !check.ok).length
  },
  checks
}

console.log(JSON.stringify(report, null, 2))

if (!ok) {
  process.exitCode = 1
}
