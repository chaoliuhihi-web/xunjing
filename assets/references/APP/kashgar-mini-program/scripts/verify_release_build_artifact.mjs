import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { loadReleaseEnvFile } from './release_env_loader.mjs'
import { normalizeReleaseHttpsUrl } from './release_url_guard.mjs'

loadReleaseEnvFile()

const artifactDirArg = process.argv[2] || process.env.XUNJING_RELEASE_ARTIFACT_DIR || 'dist/build/app-release'
const expectedApiBaseUrlInput = String(process.env.XUNJING_APP_API_BASE_URL || '').trim()
const expectedTenantId = String(process.env.XUNJING_TENANT_ID || '').trim()
const resolvedArtifactDir = path.resolve(process.cwd(), artifactDirArg)

const fail = (message) => {
  console.error(message)
  process.exit(1)
}

if (!expectedApiBaseUrlInput) {
  fail('Set XUNJING_APP_API_BASE_URL before scanning the release artifact')
}

if (!expectedTenantId) {
  fail('Set XUNJING_TENANT_ID before scanning the release artifact')
}

if (!/^[1-9]\d*$/.test(expectedTenantId)) {
  fail('XUNJING_TENANT_ID must be a positive integer tenant id')
}

let expectedApiBaseUrl
try {
  expectedApiBaseUrl = normalizeReleaseHttpsUrl('XUNJING_APP_API_BASE_URL', expectedApiBaseUrlInput)
} catch (error) {
  fail(error.message)
}

if (!fs.existsSync(resolvedArtifactDir)) {
  fail(`Release artifact not found: ${resolvedArtifactDir}`)
}

const artifactStat = fs.statSync(resolvedArtifactDir)

const textExtensions = new Set([
  '.conf',
  '.env',
  '.html',
  '.ini',
  '.js',
  '.json',
  '.css',
  '.properties',
  '.txt',
  '.xml',
  '.map'
])

const mobileArchiveExtensions = new Set([
  '.apk',
  '.aab',
  '.ipa'
])

const forbiddenPatterns = [
  { name: 'localhost', pattern: /\blocalhost\b/i },
  { name: '127.0.0.1', pattern: /\b127\.0\.0\.1\b/ },
  { name: '0.0.0.0', pattern: /\b0\.0\.0\.0\b/ },
  { name: '192.168 LAN host', pattern: /\b192\.168\.\d{1,3}\.\d{1,3}\b/ },
  { name: '10.x LAN host', pattern: /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/ },
  { name: '172.16-31 LAN host', pattern: /\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/ },
  { name: '169.254 link-local host', pattern: /\b169\.254\.\d{1,3}\.\d{1,3}\b/ },
  { name: '100.64-127 CGNAT host', pattern: /\b100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}\b/ },
  { name: '198.18-19 benchmark reserved host', pattern: /\b198\.(18|19)\.\d{1,3}\.\d{1,3}\b/ },
  { name: '224-255 multicast/reserved host', pattern: /\b(22[4-9]|23\d|24\d|25[0-5])\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/ },
  { name: 'private/link-local IPv6 host', pattern: /https?:\/\/\[(?:::|::1|f[cd][0-9a-f]{0,2}:|fe[89ab][0-9a-f]:)/i },
  { name: '.local or .localdomain host', pattern: /https?:\/\/(?:[^/\s"'`<>:@]+\.)?(?:local|localdomain)(?::\d+)?(?:[/?#]|$)/i },
  { name: 'XICHENG_DEVELOPMENT_TRIGGER_FIXTURE', pattern: /XICHENG_DEVELOPMENT_TRIGGER_FIXTURE/ },
  { name: 'VITE_XUNJING_H5_PROXY_TARGET', pattern: /VITE_XUNJING_H5_PROXY_TARGET/ },
  { name: 'XUNJING_LOCAL_APP_API_BASE_URL', pattern: /XUNJING_LOCAL_APP_API_BASE_URL/ },
  { name: 'URL embedded username/password credential', pattern: /https?:\/\/[^/\s"'`<>:@]+(?::[^@\s"'`<>]*)?@/i },
  { name: 'OpenAI-style secret key', pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'GitHub/Gitee PAT token', pattern: /\b(?:pat|ghp|github_pat)_[A-Za-z0-9_]{20,}\b/ },
  { name: 'AWS access key id credential', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Authorization Bearer token', pattern: /["']?Authorization["']?\s*[:=]\s*["'`]?\s*Bearer\s+[A-Za-z0-9_./+=:-]{20,}/i },
  {
    name: 'AI provider API token marker',
    pattern: /\b(?:COZE|QWEN|DASHSCOPE|OPENAI)[A-Z0-9_]*(?:KEY|TOKEN)\b\s*[:=]\s*(?:"[^"\r\n]{12,}"|'[^'\r\n]{12,}'|[A-Za-z0-9_./+=:-]{12,})/i
  },
  {
    name: 'server-side/internal credential marker',
    pattern: /\b(?:YUDAO|XUNJING|WX|WECHAT|WEIXIN|INTERNAL)[A-Z0-9_]*(?:SECRET|TOKEN|KEY|PASSWORD)\b\s*[:=]\s*(?:"[^"\r\n]{12,}"|'[^'\r\n]{12,}'|[A-Za-z0-9_./+=:-]{12,})/i
  }
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
  const baseName = path.basename(filePath).toLowerCase()
  return textExtensions.has(ext) || baseName === '.env' || baseName.startsWith('.env.')
}

const normalizeUrl = (value) => String(value || '').trim().replace(/[\\.,;]+$/, '').replace(/\/+$/, '')
const allowedNonNetworkUrls = new Set([
  'http://www.w3.org/2000/svg',
  'http://www.w3.org/1998/Math/MathML',
  'http://www.w3.org/1999/xhtml',
  'http://www.w3.org/1999/xlink',
  'http://www.w3.org/XML/1998/namespace',
  'http://www.w3.org/2001/XMLSchema',
  'http://schemas.android.com/apk/res/android'
])

const embeddedUrls = new Set()
const embeddedUrlRecords = []
const tenantIdRecords = []
const urlPattern = /https?:\/\/(?:\[[0-9a-fA-F:.]+\]|[A-Za-z0-9.-]+)(?::\d+)?(?:\/[^\s"'`<>)]*)?/g
const tenantIdPattern = /["']?(tenant-id|tenantId|tenant_id|XunjingTenantId|VITE_XUNJING_TENANT_ID)["']?\s*[:=]\s*(?:String\s*\(\s*)?["']?([1-9]\d*)["']?/gi
let textFilesScanned = 0
let archiveFilesScanned = 0

const scanTextContent = (sourceLabel, content) => {
  for (const { name, pattern } of forbiddenPatterns) {
    if (pattern.test(content)) {
      fail(`Release artifact contains forbidden token ${name} in ${sourceLabel}`)
    }
  }

  for (const match of content.matchAll(urlPattern)) {
    const embeddedUrl = normalizeUrl(match[0])
    const matchIndex = match.index || 0
    const contextStart = Math.max(0, matchIndex - 120)
    const contextEnd = Math.min(content.length, matchIndex + match[0].length + 120)
    embeddedUrls.add(embeddedUrl)
    embeddedUrlRecords.push({
      url: embeddedUrl,
      sourceLabel,
      context: content.slice(contextStart, contextEnd),
      before: content.slice(Math.max(0, matchIndex - 48), matchIndex),
      after: content.slice(matchIndex + match[0].length, Math.min(content.length, matchIndex + match[0].length + 48))
    })
  }

  for (const match of content.matchAll(tenantIdPattern)) {
    tenantIdRecords.push({
      key: match[1],
      value: String(match[2] || '').trim(),
      sourceLabel
    })
  }
}

const scanDirectoryArtifact = () => {
  const textFiles = collectFiles(resolvedArtifactDir).filter(isTextCandidate)
  if (textFiles.length === 0) {
    fail(`Release artifact has no scannable text files: ${resolvedArtifactDir}`)
  }

  for (const filePath of textFiles) {
    textFilesScanned += 1
    scanTextContent(path.relative(resolvedArtifactDir, filePath), fs.readFileSync(filePath, 'utf8'))
  }
}

const listArchiveEntries = (archivePath) => {
  const result = spawnSync('unzip', ['-Z', '-1', archivePath], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  })
  if (result.status !== 0) {
    fail(`Release artifact archive cannot be listed by unzip: ${result.stderr || result.stdout}`)
  }
  return result.stdout.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)
}

const readArchiveEntry = (archivePath, entry) => {
  const result = spawnSync('unzip', ['-p', archivePath, entry], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  })
  if (result.status !== 0) {
    fail(`Release artifact archive entry cannot be read: ${entry}`)
  }
  return result.stdout
}

const scanArchiveArtifact = () => {
  const entries = listArchiveEntries(resolvedArtifactDir).filter(isTextCandidate)
  if (entries.length === 0) {
    fail(`Release APK/ZIP artifact has no scannable text files: ${resolvedArtifactDir}`)
  }
  for (const entry of entries) {
    archiveFilesScanned += 1
    scanTextContent(`archive:${path.basename(resolvedArtifactDir)}:${entry}`, readArchiveEntry(resolvedArtifactDir, entry))
  }
}

if (artifactStat.isDirectory()) {
  scanDirectoryArtifact()
} else if (artifactStat.isFile() && mobileArchiveExtensions.has(path.extname(resolvedArtifactDir).toLowerCase())) {
  scanArchiveArtifact()
} else if (artifactStat.isFile() && isTextCandidate(resolvedArtifactDir)) {
  textFilesScanned += 1
  scanTextContent(path.basename(resolvedArtifactDir), fs.readFileSync(resolvedArtifactDir, 'utf8'))
} else {
  fail(`Release artifact path must be a directory, APK, AAB, IPA, or scannable text file: ${resolvedArtifactDir}. Plain ZIP files are not final mobile install packages.`)
}

const isExpectedApiUrl = (url) => url === expectedApiBaseUrl || url.startsWith(`${expectedApiBaseUrl}/`)
const legacyOnlineFieldPattern = /^(?:UrlImg|UrlServer|UrlRequest|UrlRequest2)$/i
const isApiGatewayContext = (record) => {
  const assignmentMatch = record.before.match(/([A-Za-z0-9_$.-]+)\s*[:=]\s*["']?$/)
  const assignedKey = assignmentMatch ? assignmentMatch[1] : ''
  if (legacyOnlineFieldPattern.test(assignedKey)) {
    return false
  }
  return (
    /api|UrlYudao|VITE_XUNJING|XUNJING|baseUrl|baseURL/i.test(assignedKey) ||
    /app-api|xunjing/i.test(record.after) ||
    /\/app-api\//i.test(record.url)
  )
}

for (const record of embeddedUrlRecords) {
  if (allowedNonNetworkUrls.has(record.url)) {
    continue
  }
  if (record.url.startsWith('http://')) {
    fail(`Release artifact contains non-HTTPS URL: ${record.url}`)
  }
  if (!isExpectedApiUrl(record.url) && isApiGatewayContext(record)) {
    fail(`Release artifact contains API gateway ${record.url} in ${record.sourceLabel}; expected API base from XUNJING_APP_API_BASE_URL is ${expectedApiBaseUrl}`)
  }
}

if (!embeddedUrlRecords.some((record) => isExpectedApiUrl(record.url))) {
  fail(`Release artifact must embed the configured API base from XUNJING_APP_API_BASE_URL: ${expectedApiBaseUrl}`)
}

if (tenantIdRecords.length === 0) {
  fail(`Release artifact must embed the configured tenant id from XUNJING_TENANT_ID: ${expectedTenantId}`)
}

const mismatchedTenantRecord = tenantIdRecords.find((record) => record.value !== expectedTenantId)
if (mismatchedTenantRecord) {
  fail(`Release artifact contains tenant id ${mismatchedTenantRecord.value} in ${mismatchedTenantRecord.sourceLabel}; expected XUNJING_TENANT_ID is ${expectedTenantId}`)
}

console.log(JSON.stringify({
  ok: true,
  artifactDir: resolvedArtifactDir,
  textFilesScanned,
  archiveFilesScanned,
  embeddedUrlCount: embeddedUrls.size,
  expectedApiBaseUrl,
  expectedTenantId,
  tenantIdRecordCount: tenantIdRecords.length
}, null, 2))
