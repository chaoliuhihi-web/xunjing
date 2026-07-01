import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

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

if (!/^[1-9]\d*$/.test(expectedTenantId)) {
  fail('XUNJING_TENANT_ID must be a positive integer tenant id')
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
  fail(`Release artifact not found: ${resolvedArtifactDir}`)
}

const artifactStat = fs.statSync(resolvedArtifactDir)

const textExtensions = new Set([
  '.html',
  '.js',
  '.json',
  '.css',
  '.txt',
  '.xml',
  '.map'
])

const mobileArchiveExtensions = new Set([
  '.apk',
  '.aab',
  '.ipa',
  '.zip'
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
  { name: 'XUNJING_LOCAL_APP_API_BASE_URL', pattern: /XUNJING_LOCAL_APP_API_BASE_URL/ },
  { name: 'OpenAI-style secret key', pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'GitHub/Gitee PAT token', pattern: /\b(?:pat|ghp|github_pat)_[A-Za-z0-9_]{20,}\b/ },
  { name: 'AWS access key id credential', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  {
    name: 'AI provider API token marker',
    pattern: /\b(?:COZE|QWEN|DASHSCOPE|OPENAI)[A-Z0-9_]*(?:KEY|TOKEN)\b\s*[:=]\s*["'][^"']{12,}["']/i
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
  return textExtensions.has(ext)
}

const normalizeUrl = (value) => String(value || '').trim().replace(/\/+$/, '')

const embeddedUrls = new Set()
const urlPattern = /https?:\/\/[A-Za-z0-9.-]+(?::\d+)?(?:\/[^\s"'`<>)]*)?/g
let textFilesScanned = 0
let archiveFilesScanned = 0

const scanTextContent = (sourceLabel, content) => {
  for (const { name, pattern } of forbiddenPatterns) {
    if (pattern.test(content)) {
      fail(`Release artifact contains forbidden token ${name} in ${sourceLabel}`)
    }
  }

  for (const match of content.matchAll(urlPattern)) {
    embeddedUrls.add(normalizeUrl(match[0]))
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
  fail(`Release artifact path must be a directory, APK, AAB, IPA, ZIP, or scannable text file: ${resolvedArtifactDir}`)
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
  textFilesScanned,
  archiveFilesScanned,
  embeddedUrlCount: embeddedUrls.size,
  expectedApiBaseUrl,
  expectedTenantId
}, null, 2))
