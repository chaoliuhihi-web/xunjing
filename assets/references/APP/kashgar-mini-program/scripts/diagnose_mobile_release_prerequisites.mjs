import dns from 'node:dns/promises'
import { spawnSync } from 'node:child_process'
import { readReleaseAppEnv } from './release_app_env.mjs'

const secretEnvKeys = [
  'XUNJING_ANDROID_KEYSTORE_PASSWORD',
  'XUNJING_ANDROID_KEY_PASSWORD',
  'XUNJING_IOS_CERTIFICATE_PASSWORD'
]

const redactText = (value = '') => secretEnvKeys
  .map((key) => String(process.env[key] || ''))
  .filter(Boolean)
  .reduce((text, secret) => text.split(secret).join('***REDACTED***'), String(value))

const runNodeScript = (scriptName, args = []) => spawnSync(
  process.execPath,
  ['scripts/' + scriptName, ...args],
  {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8'
  }
)

const runCommand = (command, args = []) => spawnSync(command, args, {
  cwd: process.cwd(),
  env: process.env,
  encoding: 'utf8'
})

const parseJson = (value) => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const normalizeFirstLine = (value = '') => String(value || '').trim().split('\n')[0] || ''

const withTimeout = async (promise, timeoutMs, timeoutMessage) => {
  let timeout
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      })
    ])
  } finally {
    clearTimeout(timeout)
  }
}

const checkReleaseEnv = () => {
  try {
    const releaseEnv = readReleaseAppEnv()
    return {
      ok: true,
      apiBaseUrl: releaseEnv.apiBaseUrl,
      tenantId: releaseEnv.tenantId
    }
  } catch (error) {
    return {
      ok: false,
      message: error.message,
      nextAction: 'Set XUNJING_RELEASE_ENV_FILE or export XUNJING_APP_API_BASE_URL and XUNJING_TENANT_ID for the release candidate.'
    }
  }
}

const checkApiDns = async (apiBaseUrl) => {
  if (process.env.XUNJING_RELEASE_PREREQ_SKIP_NETWORK === '1') {
    return {
      ok: true,
      skipped: true,
      detail: 'network checks skipped by XUNJING_RELEASE_PREREQ_SKIP_NETWORK=1'
    }
  }

  let hostname = ''
  try {
    hostname = new URL(apiBaseUrl).hostname
  } catch (error) {
    return {
      ok: false,
      message: `Invalid XUNJING_APP_API_BASE_URL: ${error.message}`,
      nextAction: 'Set XUNJING_APP_API_BASE_URL to the preprod or production HTTPS gateway.'
    }
  }

  try {
    const addresses = await withTimeout(
      dns.lookup(hostname, { all: true }),
      Number(process.env.XUNJING_RELEASE_PREREQ_DNS_TIMEOUT_MS || 8000),
      `DNS lookup timed out for ${hostname}`
    )
    return {
      ok: true,
      hostname,
      addresses: addresses.map((address) => address.address)
    }
  } catch (error) {
    return {
      ok: false,
      hostname,
      message: error.message,
      nextAction: `Fix DNS or network access for ${hostname}, then rerun npm run verify:yudao:preprod.`
    }
  }
}

const checkNativePackageDryRun = () => {
  const result = runNodeScript('run_native_cloud_pack.mjs', ['--dry-run'])
  const parsed = parseJson(result.stdout)
  if (result.status !== 0 || parsed?.ok !== true) {
    return {
      ok: false,
      exitCode: result.status,
      stdout: redactText(result.stdout).trim(),
      stderr: redactText(result.stderr).trim(),
      message: parsed?.message || normalizeFirstLine(result.stderr || result.stdout) || 'native cloud pack dry-run failed',
      nextAction: 'Fix native release env, signing config, HBuilderX CLI path, or manifest readiness before cloud packaging.'
    }
  }
  return {
    ok: true,
    releaseTargets: parsed.releaseTargets || [],
    executable: parsed.command?.executable || '',
    command: parsed.redactedCommand || ''
  }
}

const parseHbuilderxAccount = (stdout = '') => {
  const text = String(stdout || '').trim()
  const meaningful = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^0:user info:OK\b/i.test(line))
    .join('\n')

  if (!meaningful || /(user not login|not logged in|未登录|请.*登录)/i.test(meaningful)) {
    return ''
  }

  return /(username|userName|email|nickname|账号|用户名)\s*[:：]/i.test(meaningful)
    ? meaningful
    : ''
}

const checkHbuilderxLogin = (nativePackageDryRun) => {
  const executable = nativePackageDryRun.executable || process.env.HBUILDERX_CLI || 'hbuilderx'
  const result = runCommand(executable, ['user', 'info'])
  const stdout = redactText(result.stdout).trim()
  const stderr = redactText(result.stderr).trim()
  const account = parseHbuilderxAccount(stdout)
  if (result.status !== 0 || !account) {
    return {
      ok: false,
      executable,
      exitCode: result.status,
      stdout,
      stderr,
      message: result.status !== 0
        ? normalizeFirstLine(stderr || stdout) || 'HBuilderX user info failed'
        : 'HBuilderX user info did not include a logged-in release account',
      nextAction: 'Run HBuilderX CLI user login with the release account, then rerun npm run doctor:release:prereqs.'
    }
  }
  return {
    ok: true,
    executable,
    account
  }
}

const releaseEnv = checkReleaseEnv()
const apiDns = releaseEnv.ok
  ? await checkApiDns(releaseEnv.apiBaseUrl)
  : { ok: false, skipped: true, detail: 'skipped because release env is invalid' }
const nativePackageDryRun = checkNativePackageDryRun()
const hbuilderxLogin = checkHbuilderxLogin(nativePackageDryRun)

const checks = {
  releaseEnv,
  apiDns,
  nativePackageDryRun,
  hbuilderxLogin
}

const blockers = Object.entries(checks)
  .filter(([, check]) => !check.ok)
  .map(([name]) => ({
    releaseEnv: 'release-env-invalid',
    apiDns: 'api-dns-unavailable',
    nativePackageDryRun: 'native-package-dry-run-failed',
    hbuilderxLogin: 'hbuilderx-login-missing'
  }[name]))
  .filter(Boolean)

const nextActions = Object.values(checks)
  .map((check) => check.nextAction)
  .filter(Boolean)

const response = {
  ok: blockers.length === 0,
  artifactType: 'xicheng-mobile-release-prerequisites-diagnostic',
  checkedAt: new Date().toISOString(),
  checks,
  blockers,
  nextActions
}

console.log(JSON.stringify(response, null, 2))
process.exit(response.ok ? 0 : 1)
