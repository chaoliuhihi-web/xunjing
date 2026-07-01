import fs from 'node:fs'
import path from 'node:path'

const parseEnvLine = (line) => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null
  const withoutExport = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed
  const match = withoutExport.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([\s\S]*)$/)
  if (!match) return null

  const key = match[1]
  let value = match[2].trim()
  const quote = value[0]
  const isQuoted = (quote === '"' || quote === "'") && value.endsWith(quote)
  if (isQuoted) {
    value = value.slice(1, -1)
    if (quote === '"') {
      value = value
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
    }
  } else {
    value = value.replace(/\s+#.*$/, '').trim()
  }

  return { key, value }
}

export const parseReleaseEnv = (source) => String(source || '')
  .split(/\r?\n/)
  .map(parseEnvLine)
  .filter(Boolean)

export const loadReleaseEnvFile = (env = process.env, cwd = process.cwd()) => {
  const inputPath = String(env.XUNJING_RELEASE_ENV_FILE || '').trim()
  if (!inputPath) {
    return {
      loaded: false,
      path: '',
      keys: []
    }
  }

  const resolvedPath = path.isAbsolute(inputPath) ? inputPath : path.resolve(cwd, inputPath)
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`XUNJING_RELEASE_ENV_FILE not found: ${resolvedPath}`)
  }
  if (!fs.statSync(resolvedPath).isFile()) {
    throw new Error(`XUNJING_RELEASE_ENV_FILE must be a file: ${resolvedPath}`)
  }

  const entries = parseReleaseEnv(fs.readFileSync(resolvedPath, 'utf8'))
  const loadedKeys = []
  for (const { key, value } of entries) {
    if (String(env[key] || '').trim()) continue
    env[key] = value
    loadedKeys.push(key)
  }

  return {
    loaded: true,
    path: resolvedPath,
    keys: loadedKeys
  }
}
