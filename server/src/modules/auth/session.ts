import crypto from 'crypto'
import type Database from 'better-sqlite3'

export const SESSION_COOKIE = 'kasir_session'
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12 jam

export interface SessionUser {
  id: number
  name: string
  role: 'admin' | 'kasir' | 'dapur'
  sessionId: number
}

/** Hash token mentah dengan SHA-256. Database hanya menyimpan nilai ini. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Buat sesi baru. Token mentah dibuat dengan crypto.randomBytes(32) dalam hex,
 * dikembalikan ke pemanggil (untuk cookie). Database hanya menyimpan hash-nya.
 */
export function createSession(
  db: Database.Database,
  userId: number,
  ipAddress?: string | null,
  userAgent?: string | null
): { token: string; expiresAt: string } {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()

  db.prepare(
    `INSERT INTO sessions (token_hash, user_id, ip_address, user_agent, expires_at, created_at, last_activity)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  ).run(tokenHash, userId, ipAddress ?? null, userAgent ?? null, expiresAt)

  return { token, expiresAt }
}

/**
 * Cari sesi valid berdasarkan token mentah dari cookie.
 * Menghash token, mencari di token_hash, memeriksa kedaluwarsa dan status user.
 */
export function findSession(db: Database.Database, token: string): SessionUser | null {
  if (!token) return null
  const tokenHash = hashToken(token)

  const row = db
    .prepare(
      `SELECT s.id AS session_id, s.expires_at, u.id AS user_id, u.name, u.role, u.active
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(tokenHash) as
    | { session_id: number; expires_at: string; user_id: number; name: string; role: string; active: number }
    | undefined

  if (!row) return null

  if (new Date(row.expires_at).getTime() <= Date.now() || !row.active) {
    deleteSessionById(db, row.session_id)
    return null
  }

  db.prepare('UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = ?').run(row.session_id)

  return {
    id: row.user_id,
    name: row.name,
    role: row.role as SessionUser['role'],
    sessionId: row.session_id
  }
}

export function deleteSessionById(db: Database.Database, sessionId: number): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
}

export function deleteSessionByToken(db: Database.Database, token: string): void {
  if (!token) return
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token))
}

export function pruneExpiredSessions(db: Database.Database): void {
  db.prepare('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP').run()
}