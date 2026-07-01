import { loadReleaseEnvFile } from './release_env_loader.mjs'

export const readReleaseAppEnv = (env = process.env) => {
  loadReleaseEnvFile(env)

  const apiBaseUrl = String(env.XUNJING_APP_API_BASE_URL || '').trim()
  const tenantId = String(env.XUNJING_TENANT_ID || '').trim()

  if (!apiBaseUrl) {
    throw new Error('Set XUNJING_APP_API_BASE_URL to a non-local HTTPS Yudao APP gateway')
  }

  if (!tenantId) {
    throw new Error('Set XUNJING_TENANT_ID to the release tenant id')
  }

  if (!/^[1-9]\d*$/.test(tenantId)) {
    throw new Error('XUNJING_TENANT_ID must be a positive integer tenant id')
  }

  let parsed
  try {
    parsed = new URL(apiBaseUrl)
  } catch {
    throw new Error('XUNJING_APP_API_BASE_URL must start with https://')
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('XUNJING_APP_API_BASE_URL must start with https://')
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  const isLocalOrLanHost = (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('172.') ||
    hostname.startsWith('169.254.')
  )

  if (isLocalOrLanHost) {
    throw new Error('XUNJING_APP_API_BASE_URL must be a non-local HTTPS URL')
  }

  return {
    apiBaseUrl,
    tenantId
  }
}
