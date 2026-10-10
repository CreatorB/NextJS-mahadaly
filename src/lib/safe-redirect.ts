/** Path redirect internal yang aman: harus diawali "/" tunggal (tolak "//x" dan "/\x" yang dianggap URL lain oleh browser). */
export function safeRedirectPath(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/')) return null
  if (value[1] === '/' || value[1] === '\\') return null
  return value
}
