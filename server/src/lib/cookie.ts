export interface CookieOptions {
  httpOnly?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
  path?: string
  maxAge?: number // detik
  secure?: boolean
}

/** Parse header Cookie menjadi objek. */
export function parseCookies(header?: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const val = part.slice(idx + 1).trim()
    if (!key) continue
    out[key] = decodeURIComponent(val)
  }
  return out
}

/** Serialisasi Set-Cookie. */
export function serializeCookie(name: string, value: string, opts: CookieOptions = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`]
  if (opts.path) parts.push(`Path=${opts.path}`)
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(opts.maxAge)}`)
  if (opts.httpOnly) parts.push('HttpOnly')
  if (opts.sameSite) {
    const s = opts.sameSite
    parts.push(`SameSite=${s.charAt(0).toUpperCase()}${s.slice(1)}`)
  }
  if (opts.secure) parts.push('Secure')
  return parts.join('; ')
}

/** Header Set-Cookie untuk menghapus cookie. */
export function clearCookie(name: string, opts: CookieOptions = {}): string {
  return serializeCookie(name, '', { ...opts, maxAge: 0 })
}