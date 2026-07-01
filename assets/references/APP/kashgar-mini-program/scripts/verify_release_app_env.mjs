const apiBaseUrl = String(process.env.XUNJING_APP_API_BASE_URL || '').trim()
const tenantId = String(process.env.XUNJING_TENANT_ID || '').trim()

const fail = (message) => {
  console.error(message)
  process.exit(1)
}

if (!apiBaseUrl) {
  fail('Set XUNJING_APP_API_BASE_URL to a non-local HTTPS Yudao APP gateway')
}

if (!tenantId) {
  fail('Set XUNJING_TENANT_ID to the release tenant id')
}

if (!/^[1-9]\d*$/.test(tenantId)) {
  fail('XUNJING_TENANT_ID must be a positive integer tenant id')
}

let parsed
try {
  parsed = new URL(apiBaseUrl)
} catch {
  fail('XUNJING_APP_API_BASE_URL must start with https://')
}

if (parsed.protocol !== 'https:') {
  fail('XUNJING_APP_API_BASE_URL must start with https://')
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
  fail('XUNJING_APP_API_BASE_URL must be a non-local HTTPS URL')
}
