const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL
  ?.trim()
  .replace(/\/+$/, '')

function getApiBaseUrl() {
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:4000'
  }

  throw new Error('The backend API URL is not configured.')
}

export function buildApiUrl(path: string) {
  const normalizedPath = `/${path.replace(/^\/+/, '')}`

  return `${getApiBaseUrl()}${normalizedPath}`
}
