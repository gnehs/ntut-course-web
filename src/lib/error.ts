export function errorMessage(error: unknown, fallback = 'Error') {
  if (error instanceof Error) return error.message
  return String(error || fallback)
}
