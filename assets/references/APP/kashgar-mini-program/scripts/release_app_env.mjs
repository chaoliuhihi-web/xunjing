import { loadReleaseEnvFile } from './release_env_loader.mjs'
import { normalizeReleaseHttpsUrl } from './release_url_guard.mjs'

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

  try {
    normalizeReleaseHttpsUrl('XUNJING_APP_API_BASE_URL', apiBaseUrl)
  } catch (error) {
    throw new Error(error.message)
  }

  return {
    apiBaseUrl,
    tenantId
  }
}
