import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { readReleaseAppEnv } from './release_app_env.mjs'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const releaseEnv = readReleaseAppEnv()
const releaseEnvFile = String(process.env.XUNJING_RELEASE_ENV_FILE || '').trim()
const platformEnvFile = String(process.env.XUNJING_PLATFORM_ENV_FILE || '').trim()

if (!releaseEnvFile) {
  console.error('Set XUNJING_RELEASE_ENV_FILE to the preprod or production env file')
  process.exit(1)
}

const gitRootResult = spawnSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: process.cwd(),
  encoding: 'utf8'
})
if (gitRootResult.status !== 0) {
  console.error(gitRootResult.stderr || gitRootResult.stdout || 'Unable to resolve git repository root')
  process.exit(gitRootResult.status || 1)
}

const repoRoot = gitRootResult.stdout.trim()
const resolvedReleaseEnvFile = path.isAbsolute(releaseEnvFile)
  ? releaseEnvFile
  : path.resolve(process.cwd(), releaseEnvFile)
const resolvedPlatformEnvFile = platformEnvFile
  ? (path.isAbsolute(platformEnvFile) ? platformEnvFile : path.resolve(repoRoot, platformEnvFile))
  : resolvedReleaseEnvFile
const verifyArgs = [
  'run',
  'xunjing:platform:verify',
  '--',
  '--env-file',
  resolvedPlatformEnvFile,
  '--base-url',
  releaseEnv.apiBaseUrl,
  '--tenant-id',
  releaseEnv.tenantId,
  '--skip-admin-check',
  '--include-xicheng-app-check',
  '--include-xicheng-trigger-check',
  '--evidence-file',
  'qa/xicheng-app-readiness-evidence.json'
]

if (dryRun) {
  console.log(JSON.stringify({
    ok: true,
    cwd: repoRoot,
    command: 'npm',
    releaseEnvFile: resolvedReleaseEnvFile,
    platformEnvFile: resolvedPlatformEnvFile,
    args: verifyArgs
  }, null, 2))
  process.exit(0)
}

const result = spawnSync('npm', verifyArgs, {
  cwd: repoRoot,
  env: {
    ...process.env,
    XUNJING_APP_API_BASE_URL: releaseEnv.apiBaseUrl,
    XUNJING_TENANT_ID: releaseEnv.tenantId
  },
  stdio: 'inherit'
})
process.exit(result.status || 0)
