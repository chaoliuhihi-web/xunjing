export const AZURE_OPENAI_PLATFORM = 'AzureOpenAI'
export const AZURE_OPENAI_ENDPOINT_EXAMPLE = 'https://<resource>.openai.azure.com/'

const AZURE_OPENAI_HOST_SUFFIX = '.openai.azure.com'
const AZURE_FOUNDRY_HOST_SUFFIX = '.services.ai.azure.com'

export const isAzureOpenAiPlatform = (platform?: string) =>
  String(platform || '').trim() === AZURE_OPENAI_PLATFORM

const safeParseUrl = (url?: string) => {
  const raw = String(url || '').trim()
  if (!raw) {
    return null
  }
  try {
    return new URL(raw)
  } catch {
    return null
  }
}

export const isAzureOpenAiResourceEndpoint = (url?: string) => {
  const parsed = safeParseUrl(url)
  return !!parsed && parsed.hostname.toLowerCase().endsWith(AZURE_OPENAI_HOST_SUFFIX)
}

export const isAzureFoundryEndpoint = (url?: string) => {
  const parsed = safeParseUrl(url)
  return !!parsed && parsed.hostname.toLowerCase().endsWith(AZURE_FOUNDRY_HOST_SUFFIX)
}

export const isAzureOpenAiProjectEndpoint = (url?: string) => {
  const parsed = safeParseUrl(url)
  return (
    !!parsed &&
    parsed.hostname.toLowerCase().endsWith(AZURE_FOUNDRY_HOST_SUFFIX) &&
    parsed.pathname.toLowerCase().startsWith('/api/projects/')
  )
}

export const normalizeAzureOpenAiEndpoint = (url?: string) => {
  const raw = String(url || '').trim()
  const parsed = safeParseUrl(raw)
  if (!parsed || !parsed.hostname.toLowerCase().endsWith(AZURE_OPENAI_HOST_SUFFIX)) {
    return raw
  }
  return `${parsed.protocol}//${parsed.host}/`
}
