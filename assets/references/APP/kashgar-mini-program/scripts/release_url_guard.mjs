const ipv4Octets = (hostname) => {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    return null
  }
  const octets = hostname.split('.').map((part) => Number(part))
  return octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255) ? octets : null
}

const localOrLanHost = (hostname) => {
  if (hostname === 'localhost' || hostname === '::' || hostname === '::1') {
    return true
  }

  const octets = ipv4Octets(hostname)
  if (octets) {
    const [first, second, third] = octets
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 192 && second === 0 && third === 2) ||
      (first === 198 && (second === 18 || second === 19)) ||
      (first === 198 && second === 51 && third === 100) ||
      (first === 203 && second === 0 && third === 113) ||
      first >= 224
    )
  }

  return (
    /^f[cd][0-9a-f]{0,2}:/i.test(hostname) ||
    /^fe[89ab][0-9a-f]:/i.test(hostname)
  )
}

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
