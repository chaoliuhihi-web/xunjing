import fs from 'node:fs'
import path from 'node:path'

const artifactDirArg = process.argv[2] || process.env.XUNJING_RELEASE_ARTIFACT_DIR || 'dist/build/app-release'
const expectedApiBaseUrl = String(process.env.XUNJING_APP_API_BASE_URL || '').trim().replace(/\/+$/, '')
const expectedTenantId = String(process.env.XUNJING_TENANT_ID || '').trim()
const resolvedArtifactDir = path.resolve(process.cwd(), artifactDirArg)

const fail = (message) => {
  console.error(message)
  process.exit(1)
}

if (!expectedApiBaseUrl) {
  fail('Set XUNJING_APP_API_BASE_URL before scanning the release artifact')
}

if (!expectedTenantId) {
  fail('Set XUNJING_TENANT_ID before scanning the release artifact')
}

let parsedExpectedApi
try {
  parsedExpectedApi = new URL(expectedApiBaseUrl)
} catch {
  fail('XUNJING_APP_API_BASE_URL must be a valid HTTPS URL')
}

if (parsedExpectedApi.protocol !== 'https:') {
  fail('XUNJING_APP_API_BASE_URL must be a valid HTTPS URL')
}

if (!fs.existsSync(resolvedArtifactDir)) {
  fail(`Release artifact directory not found: ${resolvedArtifactDir}`)
}

if (!fs.statSync(resolvedArtifactDir).isDirectory()) {
  fail(`Release artifact path must be a directory: ${resolvedArtifactDir}`)
}

const textExtensions = new Set([
  '.html',
  '.js',
  '.json',
  '.css',
  '.txt',
  '.xml',
  '.map'
])

const forbiddenPatterns = [
  { name: 'localhost', pattern: /\blocalhost\b/i },
  { name: '127.0.0.1', pattern: /\b127\.0\.0\.1\b/ },
  { name: '0.0.0.0', pattern: /\b0\.0\.0\.0\b/ },
  { name: '192.168 LAN host', pattern: /\b192\.168\.\d{1,3}\.\d{1,3}\b/ },
  { name: '10.x LAN host', pattern: /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/ },
  { name: '172.16-31 LAN host', pattern: /\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/ },
  { name: 'XICHENG_DEVELOPMENT_TRIGGER_FIXTURE', pattern: /XICHENG_DEVELOPMENT_TRIGGER_FIXTURE/ },
  { name: 'VITE_XUNJING_H5_PROXY_TARGET', pattern: /VITE_XUNJING_H5_PROXY_TARGET/ },
  { name: 'XUNJING_LOCAL_APP_API_BASE_URL', pattern: /XUNJING_LOCAL_APP_API_BASE_URL/ }
]

const collectFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return collectFiles(entryPath)
    }
    if (!entry.isFile()) {
      return []
    }
    return [entryPath]
  })
}

const isTextCandidate = (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  return textExtensions.has(ext)
}

const normalizeUrl = (value) => String(value || '').trim().replace(/\/+$/, '')

const textFiles = collectFiles(resolvedArtifactDir).filter(isTextCandidate)
if (textFiles.length === 0) {
  fail(`Release artifact has no scannable text files: ${resolvedArtifactDir}`)
}

const embeddedUrls = new Set()
const urlPattern = /https?:\/\/[A-Za-z0-9.-]+(?::\d+)?(?:\/[^\s"'`<>)]*)?/g

for (const filePath of textFiles) {
  const content = fs.readFileSync(filePath, 'utf8')
  for (const { name, pattern } of forbiddenPatterns) {
    if (pattern.test(content)) {
      fail(`Release artifact contains forbidden token ${name} in ${path.relative(resolvedArtifactDir, filePath)}`)
    }
  }

  for (const match of content.matchAll(urlPattern)) {
    embeddedUrls.add(normalizeUrl(match[0]))
  }
}

for (const embeddedUrl of embeddedUrls) {
  if (embeddedUrl.startsWith('http://')) {
    fail(`Release artifact contains non-HTTPS URL: ${embeddedUrl}`)
  }
  if (!embeddedUrl.startsWith(expectedApiBaseUrl)) {
    fail(`Release artifact contains ${embeddedUrl}; expected API base from XUNJING_APP_API_BASE_URL is ${expectedApiBaseUrl}`)
  }
}

console.log(JSON.stringify({
  ok: true,
  artifactDir: resolvedArtifactDir,
  textFilesScanned: textFiles.length,
  embeddedUrlCount: embeddedUrls.size,
  expectedApiBaseUrl,
  expectedTenantId
}, null, 2))
