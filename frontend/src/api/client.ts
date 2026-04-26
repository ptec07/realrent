const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export async function apiGet<T>(path: string, params: object = {}): Promise<T> {
  const response = await fetch(buildApiUrl(path, params))
  if (!response.ok) {
    throw new Error(`RealRent API request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function buildApiUrl(path: string, params: object = {}): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }
    query.set(key, String(value))
  }

  const normalizedBaseUrl = API_BASE_URL.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${normalizedBaseUrl}${normalizedPath}`
  const queryString = query.toString()
  return queryString ? `${url}?${queryString}` : url
}
