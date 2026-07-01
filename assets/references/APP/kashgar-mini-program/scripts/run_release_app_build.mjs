import { spawnSync } from 'node:child_process'
import { readReleaseAppEnv } from './release_app_env.mjs'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const outputDir = 'dist/build/app-release'
const releaseEnv = readReleaseAppEnv()
const buildEnv = {
  ...process.env,
  VITE_XUNJING_YUDAO_APP_BASE_URL: releaseEnv.apiBaseUrl,
  VITE_XUNJING_TENANT_ID: releaseEnv.tenantId,
  UNI_INPUT_DIR: '.',
  UNI_OUTPUT_DIR: outputDir
}

if (dryRun) {
  console.log(JSON.stringify({
    ok: true,
    env: {
      VITE_XUNJING_YUDAO_APP_BASE_URL: buildEnv.VITE_XUNJING_YUDAO_APP_BASE_URL,
      VITE_XUNJING_TENANT_ID: buildEnv.VITE_XUNJING_TENANT_ID,
      UNI_INPUT_DIR: buildEnv.UNI_INPUT_DIR,
      UNI_OUTPUT_DIR: buildEnv.UNI_OUTPUT_DIR
    },
    commands: [
      'uni build -p app',
      `node scripts/verify_release_build_artifact.mjs ${outputDir}`
    ]
  }, null, 2))
  process.exit(0)
}

const buildResult = spawnSync('uni', ['build', '-p', 'app'], {
  cwd: process.cwd(),
  env: buildEnv,
  stdio: 'inherit'
})
if (buildResult.status !== 0) {
  process.exit(buildResult.status || 1)
}

const scanResult = spawnSync(process.execPath, ['scripts/verify_release_build_artifact.mjs', outputDir], {
  cwd: process.cwd(),
  env: buildEnv,
  stdio: 'inherit'
})
process.exit(scanResult.status || 0)
