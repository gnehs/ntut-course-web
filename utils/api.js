function createApi(apiBase) {
  const apiUrl = (path) => {
    const base = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${base}${normalizedPath}`
  }
  return { apiBase, apiUrl }
}

module.exports = createApi
module.exports.default = createApi
