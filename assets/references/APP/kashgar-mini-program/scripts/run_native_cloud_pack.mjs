import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { loadReleaseEnvFile } from './release_env_loader.mjs'

loadReleaseEnvFile()

const args = process.argv.slice(2)
const isExecute = args.includes('--execute')
const isDryRun = args.includes('--dry-run') || !isExecute

if (isExecute && args.includes('--dry-run')) {
  console.error('Use either --dry-run or --execute, not both.')
  process.exit(1)
}

const cwd = process.cwd()
const readinessScript = path.resolve(cwd, 'scripts', 'verify_native_package_readiness.mjs')
const secretEnvKeys = [
  'XUNJING_ANDROID_KEYSTORE_PASSWORD',
  'XUNJING_ANDROID_KEY_PASSWORD',
  'XUNJING_IOS_CERTIFICATE_PASSWORD'
]
const sensitiveValueFlags = new Set([
  '--android.certpassword',
  '--android.storepassword',
  '--ios.certpassword'
])

const fail = (message, detail = {}) => {
  console.error(JSON.stringify({
    ok: false,
    artifactType: 'xicheng-native-cloud-pack-command',
    message,
    ...detail
  }, null, 2))
  process.exit(1)
}

if (!fs.existsSync(readinessScript)) {
  fail('scripts/verify_native_package_readiness.mjs is required before native cloud packaging')
}

const readinessResult = spawnSync(process.execPath, [readinessScript], {
  cwd,
  env: process.env,
  encoding: 'utf8'
})

const redactedSecrets = secretEnvKeys
  .map((key) => String(process.env[key] || ''))
  .filter(Boolean)

const redactText = (value = '') => redactedSecrets.reduce(
  (text, secret) => text.split(secret).join('***REDACTED***'),
  String(value)
)

if (readinessResult.status !== 0) {
  fail('Native package readiness failed; fix release env before running HBuilderX cloud pack.', {
    readinessStatus: readinessResult.status,
    readinessStdout: redactText(readinessResult.stdout).trim(),
    readinessStderr: redactText(readinessResult.stderr).trim()
  })
}

let readiness
try {
  readiness = JSON.parse(readinessResult.stdout)
} catch (error) {
  fail(`Native package readiness did not return JSON: ${error.message}`, {
    readinessStdout: redactText(readinessResult.stdout).trim()
  })
}

if (isExecute && process.env.XUNJING_NATIVE_PACK_CONFIRM !== 'cloud-pack') {
  fail('Executing HBuilderX cloud pack requires XUNJING_NATIVE_PACK_CONFIRM=cloud-pack.')
}

const addArg = (argv, flag, value) => {
  const normalized = String(value || '').trim()
  if (normalized) {
    argv.push(flag, normalized)
  }
}

const buildPackArgv = () => {
  const releaseTargets = readiness.releaseTargets || []
  const argv = [
    'pack',
    '--project',
    cwd,
    '--platform',
    releaseTargets.join(','),
    '--iscustom',
    String(process.env.XUNJING_NATIVE_CUSTOM_BASE || 'false'),
    '--safemode',
    String(process.env.XUNJING_NATIVE_SAFE_MODE || 'true'),
    '--sourceMap',
    String(process.env.XUNJING_NATIVE_SOURCEMAP || 'false'),
    '--isconfusion',
    String(process.env.XUNJING_NATIVE_CONFUSION || 'true'),
    '--splashads',
    'false',
    '--rpads',
    'false',
    '--unimpads',
    'false'
  ]

  if (releaseTargets.includes('android')) {
    addArg(argv, '--android.packagename', readiness.android?.packageName)
    addArg(argv, '--android.androidpacktype', process.env.XUNJING_ANDROID_PACK_TYPE || '0')
    addArg(argv, '--android.certalias', readiness.android?.keyAlias)
    addArg(argv, '--android.certfile', readiness.android?.keystore?.path)
    addArg(argv, '--android.certpassword', process.env.XUNJING_ANDROID_KEY_PASSWORD)
    addArg(argv, '--android.storepassword', process.env.XUNJING_ANDROID_KEYSTORE_PASSWORD)
    addArg(argv, '--android.channels', process.env.XUNJING_ANDROID_CHANNELS)
  }

  if (releaseTargets.includes('ios')) {
    addArg(argv, '--ios.bundle', readiness.ios?.bundleId)
    addArg(argv, '--ios.supporteddevice', process.env.XUNJING_IOS_SUPPORTED_DEVICE || 'iPhone')
    addArg(argv, '--ios.profile', readiness.ios?.profile?.path)
    addArg(argv, '--ios.certfile', readiness.ios?.certificate?.path)
    addArg(argv, '--ios.certpassword', process.env.XUNJING_IOS_CERTIFICATE_PASSWORD)
    addArg(argv, '--ios.channels', process.env.XUNJING_IOS_CHANNELS)
  }

  return argv
}

const redactArgv = (argv) => argv.map((value, index) => (
  index > 0 && sensitiveValueFlags.has(argv[index - 1])
    ? '***REDACTED***'
    : value
))

const hbuilderxSoftFailurePatterns = [
  /项目[\s\S]*不存在[\s\S]*请先导入/,
  /project[\s\S]*(not found|does not exist|not imported|import first)/i
]

const detectHbuilderxSoftFailure = (output = '') => {
  const text = String(output || '')
  return hbuilderxSoftFailurePatterns.find((pattern) => pattern.test(text)) || null
}

const shellQuote = (value) => {
  const text = String(value)
  return /^[A-Za-z0-9_./:=@-]+$/.test(text)
    ? text
    : `'${text.replace(/'/g, `'\\''`)}'`
}

const executable = readiness.nativeTool?.command || process.env.HBUILDERX_CLI || 'hbuilderx'
const rawArgv = buildPackArgv()
const redactedArgv = redactArgv(rawArgv)
const redactedCommand = [executable, ...redactedArgv].map(shellQuote).join(' ')

if (isDryRun) {
  console.log(JSON.stringify({
    ok: true,
    artifactType: 'xicheng-native-cloud-pack-command',
    checkedAt: new Date().toISOString(),
    mode: 'dry-run',
    releaseTargets: readiness.releaseTargets,
    command: {
      executable,
      argv: redactedArgv
    },
    redactedCommand,
    nextCommands: [
      'XUNJING_RELEASE_ENV_FILE=/secure/path/preprod.env npm run pack:native:cloud:dry-run',
      'XUNJING_RELEASE_ENV_FILE=/secure/path/preprod.env XUNJING_NATIVE_PACK_CONFIRM=cloud-pack npm run pack:native:cloud',
      'After HBuilderX creates the signed APK/AAB or IPA, set XUNJING_RELEASE_ARTIFACT and run npm run prepare:native:evidence.'
    ]
  }, null, 2))
  process.exit(0)
}

const packResult = spawnSync(executable, rawArgv, {
  cwd,
  env: process.env,
  encoding: 'utf8'
})
const redactedStdout = redactText(packResult.stdout).trim()
const redactedStderr = redactText(packResult.stderr).trim()
const softFailurePattern = detectHbuilderxSoftFailure(`${packResult.stdout}\n${packResult.stderr}`)
const packOk = packResult.status === 0 && !softFailurePattern

const response = {
  ok: packOk,
  artifactType: 'xicheng-native-cloud-pack-command',
  checkedAt: new Date().toISOString(),
  mode: 'execute',
  releaseTargets: readiness.releaseTargets,
  command: {
    executable,
    argv: redactedArgv
  },
  redactedCommand,
  exitCode: packResult.status,
  stdout: redactedStdout,
  stderr: redactedStderr,
  softFailure: softFailurePattern
    ? 'HBuilderX returned exit 0 but reported that the project is not imported or does not exist'
    : '',
  nextCommands: [
    'Locate the signed APK/AAB or IPA produced by HBuilderX.',
    'If HBuilderX reports the project is not imported, import the APP project in HBuilderX or configure the CLI workspace before rerunning cloud pack.',
    'XUNJING_RELEASE_ENV_FILE=/secure/path/preprod.env XUNJING_RELEASE_ARTIFACT=/path/to/signed.apk npm run prepare:native:evidence',
    'Complete physical-device scenarios, then run npm run verify:native:evidence and npm run verify:launch:evidence.'
  ]
}

console[packOk ? 'log' : 'error'](JSON.stringify(response, null, 2))
process.exit(packOk ? 0 : 1)
