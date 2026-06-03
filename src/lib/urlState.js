export function replaceQuery(path, params) {
  writeQuery(path, params, 'replace')
}

export function pushQuery(path, params) {
  writeQuery(path, params, 'push')
}

export function createSearchParams(search) {
  if (search instanceof URLSearchParams) return new URLSearchParams(search)
  if (typeof search === 'string') return new URLSearchParams(search)
  if (!search || typeof search !== 'object') return new URLSearchParams()

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    const serialized = serializeQueryValue(value)
    if (serialized === null) continue
    params.set(key, serialized)
  }
  return params
}

function writeQuery(path, params, mode) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const serialized = serializeQueryValue(value)
    if (serialized === null) continue
    search.set(key, serialized)
  }
  const url = `${path}${search.size ? `?${search.toString()}` : ''}`
  if (mode === 'push') window.history.pushState(null, '', url)
  else window.history.replaceState(null, '', url)
}

function serializeQueryValue(value) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value)
  return JSON.stringify(value)
}
