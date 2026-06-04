import '@testing-library/jest-dom/vitest'

function createStorage() {
  const data = new Map()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
    key: (index) => Array.from(data.keys())[index] ?? null,
    get length() {
      return data.size
    },
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: createStorage(),
  configurable: true,
})

Object.defineProperty(globalThis, 'sessionStorage', {
  value: createStorage(),
  configurable: true,
})
