const localOrLanHost = (hostname) => (
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '0.0.0.0' ||
  hostname === '::' ||
  hostname === '::1' ||
  hostname.startsWith('10.') ||
  hostname.startsWith('172.') ||
  hostname.startsWith('192.168.') ||
  hostname.startsWith('169.254.') ||
  /^f[cd][0-9a-f]{0,2}:/i.test(hostname) ||
  /^fe[89ab][0-9a-f]:/i.test(hostname)
)

const reservedOrPlaceholderHost = (hostname) => (
  hostname === 'example.com' ||
  hostname.endsWith('.example.com') ||
  hostname === 'example.net' ||
  hostname.endsWith('.example.net') ||
  hostname === 'example.org' ||
  hostname.endsWith('.example.org') ||
  hostname === 'test' ||
  hostname.endsWith('.test') ||
  hostname === 'invalid' ||
  hostname.endsWith('.invalid') ||
  hostname.includes('placeholder')
)

export const normalizeReleaseHttpsUrl = (label, value) => {
  let parsed
  try {
    parsed = new URL(String(value || '').trim())
  } catch {
    throw new Error(`${label} must be a non-local HTTPS URL`)
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (parsed.protocol !== 'https:' || localOrLanHost(hostname)) {
    throw new Error(`${label} must be a non-local HTTPS URL`)
  }
  if (reservedOrPlaceholderHost(hostname)) {
    throw new Error(`${label} must not use a reserved or placeholder hostname`)
  }

  return parsed.toString().replace(/\/+$/, '')
}
