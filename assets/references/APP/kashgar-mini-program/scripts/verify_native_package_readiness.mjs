import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { loadReleaseEnvFile } from './release_env_loader.mjs'

loadReleaseEnvFile()

const args = process.argv.slice(2)
const skipToolCheck = args.includes('--skip-tool-check') || process.env.XUNJING_SKIP_NATIVE_TOOL_CHECK === '1'
const supportedTargets = new Set(['android', 'ios'])
const allowedAndroidPermissions = new Set([
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.CAMERA',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION'
])
const requiredAndroidPermissions = [...allowedAndroidPermissions]

const stripJsonComments = (source) => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1')

const readManifest = () => {
  const manifestPath = path.resolve(process.cwd(), 'manifest.json')
  try {
    return JSON.parse(stripJsonComments(fs.readFileSync(manifestPath, 'utf8')))
  } catch (error) {
    throw new Error(`manifest.json is not valid JSON after comment stripping: ${error.message}`)
  }
}

const normalizeUrl = (label, value) => {
  let parsed
  try {
    parsed = new URL(String(value || '').trim())
  } catch {
    throw new Error(`${label} must be a non-local HTTPS URL`)
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  const localOrLanHost = (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('169.254.')
  )

  if (parsed.protocol !== 'https:' || localOrLanHost) {
    throw new Error(`${label} must be a non-local HTTPS URL`)
  }

  return parsed.toString().replace(/\/+$/, '')
}

const requirePositiveInteger = (label, value) => {
  const normalized = String(value || '').trim()
  if (!/^[1-9]\d*$/.test(normalized)) {
    throw new Error(`${label} must be a positive integer`)
  }
  return normalized
}

const parseReleaseTargets = () => {
  const releaseTargets = String(process.env.XUNJING_RELEASE_TARGETS || 'android')
    .split(',')
    .map((target) => target.trim().toLowerCase())
    .filter(Boolean)

  if (releaseTargets.length === 0) {
    throw new Error('XUNJING_RELEASE_TARGETS must include android or ios')
  }

  const unsupported = releaseTargets.filter((target) => !supportedTargets.has(target))
  if (unsupported.length > 0) {
    throw new Error(`XUNJING_RELEASE_TARGETS supports android or ios only; unsupported: ${unsupported.join(', ')}`)
  }

  return [...new Set(releaseTargets)]
}

const assertReverseDnsIdentifier = (label, value, example) => {
  const packageName = String(value || '').trim()
  const packagePattern = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*){2,}$/
  if (!packagePattern.test(packageName)) {
    throw new Error(`${label} must be a valid reverse-DNS identifier such as ${example}`)
  }
  return packageName
}

const assertExistingFile = (label, value) => {
  const inputPath = String(value || '').trim()
  if (!inputPath) {
    throw new Error(`${label} is required`)
  }
  const resolved = path.resolve(process.cwd(), inputPath)
  if (!fs.existsSync(resolved)) {
    throw new Error(`${label} not found: ${resolved}`)
  }
  if (!fs.statSync(resolved).isFile()) {
    throw new Error(`${label} must be a file: ${resolved}`)
  }
  return resolved
}

const assertRequiredSecretPresence = (label, value) => {
  if (!String(value || '').trim()) {
    throw new Error(`${label} is required`)
  }
  return true
}

const commandExists = (command) => {
  const result = spawnSync('sh', ['-lc', `command -v ${JSON.stringify(command)}`], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })
  return result.status === 0 && Boolean(result.stdout.trim())
}

const isExecutableFile = (filePath) => {
  try {
    fs.accessSync(filePath, fs.constants.X_OK)
    return fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

const isNativeToolAvailable = (command) => (
  path.isAbsolute(command)
    ? isExecutableFile(command)
    : commandExists(command)
)

const hbuilderxCliCandidates = () => {
  const candidates = []
  const appPath = String(process.env.XUNJING_HBUILDERX_APP_PATH || '').trim()
  if (appPath) {
    candidates.push(path.join(appPath, 'Contents', 'MacOS', 'cli'))
  }
  candidates.push(
    '/Applications/HBuilderX.app/Contents/MacOS/cli',
    '/Applications/HBuilderX-Alpha.app/Contents/MacOS/cli',
    '/Applications/HBuilderX.app/Contents/MacOS/HBuilderX',
    '/Applications/HBuilderX-Alpha.app/Contents/MacOS/HBuilderX'
  )
  return candidates
}

const resolveNativeToolCommand = () => {
  const explicitCommand = String(process.env.HBUILDERX_CLI || '').trim()
  if (explicitCommand) {
    return {
      command: explicitCommand,
      autoDetected: false
    }
  }

  if (commandExists('hbuilderx')) {
    return {
      command: 'hbuilderx',
      autoDetected: true
    }
  }

  const detectedCommand = hbuilderxCliCandidates().find((candidate) => isExecutableFile(candidate))
  if (detectedCommand) {
    return {
      command: detectedCommand,
      autoDetected: true
    }
  }

  return {
    command: 'hbuilderx',
    autoDetected: false
  }
}

const checkNativeTool = () => {
  const nativeTool = resolveNativeToolCommand()
  const command = nativeTool.command
  if (!command) {
    throw new Error('HBUILDERX_CLI or hbuilderx command is required for signed native packaging')
  }
  if (!skipToolCheck && !isNativeToolAvailable(command)) {
    throw new Error(`HBuilderX CLI command not found: ${command}. Install HBuilderX CLI or set HBUILDERX_CLI.`)
  }
  return {
    command,
    autoDetected: nativeTool.autoDetected,
    checked: !skipToolCheck,
    skipped: skipToolCheck
  }
}

const extractAndroidPermissionNames = (manifest) => {
  const rawPermissions = manifest?.['app-plus']?.distribute?.android?.permissions
  if (!Array.isArray(rawPermissions)) {
    throw new Error('manifest.json app-plus.distribute.android.permissions must be present')
  }
  return rawPermissions
    .map((entry) => String(entry || '').match(/<uses-permission\s+android:name="([^"]+)"/)?.[1])
    .filter(Boolean)
}

const checkManifest = (manifest) => {
  const appName = String(manifest?.name || '').trim()
  if (appName !== '星河寻境') {
    throw new Error('manifest.json name must remain 星河寻境')
  }
  const appid = String(manifest?.appid || '').trim()
  if (!appid || ['xinxiake', 'uni-app'].includes(appid.toLowerCase())) {
    throw new Error('manifest.json appid must be a real UniApp appid')
  }
  const description = String(manifest?.description || '').trim()
  if (!description || /xinxiake|uni-app/i.test(description)) {
    throw new Error('manifest.json description must describe 星河寻境, not scaffold defaults')
  }
  const versionName = String(manifest?.versionName || '').trim()
  if (!/^\d+\.\d+\.\d+/.test(versionName)) {
    throw new Error('manifest.json versionName must be a semantic release version')
  }
  const versionCode = requirePositiveInteger('manifest.json versionCode', manifest?.versionCode)

  return {
    name: appName,
    appid,
    description,
    versionName,
    versionCode
  }
}

const checkAndroid = (manifest) => {
  const errors = []
  const permissionNames = extractAndroidPermissionNames(manifest)
  const missingPermissions = requiredAndroidPermissions.filter((permission) => !permissionNames.includes(permission))
  if (missingPermissions.length > 0) {
    errors.push(`manifest.json Android permissions missing: ${missingPermissions.join(', ')}`)
  }
  const forbiddenPermissions = permissionNames.filter((permission) => !allowedAndroidPermissions.has(permission))
  if (forbiddenPermissions.length > 0) {
    errors.push(`manifest.json Android permissions include unsupported high-risk permission(s): ${forbiddenPermissions.join(', ')}`)
  }

  const collect = (fn) => {
    try {
      return fn()
    } catch (error) {
      errors.push(error.message)
      return undefined
    }
  }

  const packageName = collect(() => assertReverseDnsIdentifier(
    'XUNJING_ANDROID_PACKAGE_NAME',
    process.env.XUNJING_ANDROID_PACKAGE_NAME,
    'com.xinghe.xunjing'
  ))
  const keystorePath = collect(() => assertExistingFile('XUNJING_ANDROID_KEYSTORE', process.env.XUNJING_ANDROID_KEYSTORE))
  const keyAlias = collect(() => {
    const value = String(process.env.XUNJING_ANDROID_KEY_ALIAS || '').trim()
    if (!value) throw new Error('XUNJING_ANDROID_KEY_ALIAS is required')
    return value
  })
  const hasKeystorePassword = collect(() => assertRequiredSecretPresence('XUNJING_ANDROID_KEYSTORE_PASSWORD', process.env.XUNJING_ANDROID_KEYSTORE_PASSWORD))
  const hasKeyPassword = collect(() => assertRequiredSecretPresence('XUNJING_ANDROID_KEY_PASSWORD', process.env.XUNJING_ANDROID_KEY_PASSWORD))

  if (errors.length > 0) {
    throw new Error(errors.join('; '))
  }

  return {
    packageName,
    keystore: {
      path: keystorePath,
      exists: true
    },
    keyAlias,
    hasKeystorePassword,
    hasKeyPassword,
    permissions: permissionNames
  }
}

const checkIos = () => {
  const errors = []
  const collect = (fn) => {
    try {
      return fn()
    } catch (error) {
      errors.push(error.message)
      return undefined
    }
  }

  const bundleId = collect(() => assertReverseDnsIdentifier(
    'XUNJING_IOS_BUNDLE_ID',
    process.env.XUNJING_IOS_BUNDLE_ID || '',
    'com.xinghe.xunjing'
  ))
  const profilePath = collect(() => assertExistingFile('XUNJING_IOS_PROFILE', process.env.XUNJING_IOS_PROFILE))
  const certificatePath = collect(() => assertExistingFile('XUNJING_IOS_CERTIFICATE', process.env.XUNJING_IOS_CERTIFICATE))
  const hasCertificatePassword = collect(() => assertRequiredSecretPresence('XUNJING_IOS_CERTIFICATE_PASSWORD', process.env.XUNJING_IOS_CERTIFICATE_PASSWORD))

  if (errors.length > 0) {
    throw new Error(errors.join('; '))
  }

  return {
    bundleId,
    profile: {
      path: profilePath,
      exists: true
    },
    certificate: {
      path: certificatePath,
      exists: true
    },
    hasCertificatePassword
  }
}

const blockers = []
const capture = (fn) => {
  try {
    return fn()
  } catch (error) {
    blockers.push(error.message)
    return undefined
  }
}

const manifest = capture(readManifest)
const app = manifest ? capture(() => checkManifest(manifest)) : undefined
const appApiBaseUrl = capture(() => normalizeUrl('XUNJING_APP_API_BASE_URL', process.env.XUNJING_APP_API_BASE_URL))
const tenantId = capture(() => requirePositiveInteger('XUNJING_TENANT_ID', process.env.XUNJING_TENANT_ID))
const releaseTargets = capture(parseReleaseTargets) || []
const nativeTool = capture(checkNativeTool)
const android = releaseTargets.includes('android') && manifest ? capture(() => checkAndroid(manifest)) : undefined
const ios = releaseTargets.includes('ios') ? capture(checkIos) : undefined

if (blockers.length > 0) {
  console.error(JSON.stringify({
    ok: false,
    artifactType: 'xicheng-native-package-readiness',
    blockers
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  artifactType: 'xicheng-native-package-readiness',
  checkedAt: new Date().toISOString(),
  app,
  appApiBaseUrl,
  tenantId,
  releaseTargets,
  nativeTool,
  android,
  ios,
  nextCommands: [
    'XUNJING_RELEASE_ENV_FILE=/secure/path/preprod.env npm run build:app:release',
    'Use HBuilderX native release packaging with the checked signing config to create a signed APK/AAB or IPA.',
    'XUNJING_RELEASE_ARTIFACT=/path/to/signed.apk npm run prepare:native:evidence',
    'Complete physical-device scenarios, then run npm run verify:native:evidence and npm run verify:launch:evidence.'
  ]
}, null, 2))
