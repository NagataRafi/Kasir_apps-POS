import type Database from 'better-sqlite3'
import { hashPin, clearUsernameFailures, clearLoginAttempts } from './model'

export type ResetPinErrorCode = 'INVALID_PIN' | 'USER_NOT_FOUND'

export class ResetPinError extends Error {
  constructor(
    public code: ResetPinErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'ResetPinError'
  }
}

/** PIN baru wajib hanya angka dan minimal 6 digit. */
export function validateNewPin(pin: string | undefined): string | null {
  if (!pin) return 'NEW_PIN wajib diisi'
  if (!/^\d+$/.test(pin)) return 'NEW_PIN hanya boleh angka'
  if (pin.length < 6) return 'NEW_PIN minimal 6 digit'
  return null
}

/**
 * Ganti PIN pengguna yang ada lalu cabut semua sesinya.
 * Hash memakai hashPin() yang sama dengan login. PIN tidak pernah dicetak.
 */
export function resetUserPin(
  db: Database.Database,
  name: string,
  newPin: string | undefined
): { userId: number; sessionsDeleted: number } {
  const invalid = validateNewPin(newPin)
  if (invalid) throw new ResetPinError('INVALID_PIN', invalid)

  const user = db.prepare('SELECT id, name FROM users WHERE name = ?').get(name) as
    | { id: number; name: string }
    | undefined
  if (!user) throw new ResetPinError('USER_NOT_FOUND', `Pengguna "${name}" tidak ditemukan`)

  const pinHash = hashPin(newPin as string)

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET pin_hash = ? WHERE id = ?').run(pinHash, user.id)
    const deleted = db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id)
    return deleted.changes
  })
  const sessionsDeleted = tx()

  // Hitungan percobaan login ada di memori proses. Dipanggil agar bersih bila
  // fungsi ini dipakai di proses yang sama (tes); untuk skrip CLI, jalankan
  // ulang server agar peta percobaan di proses server ikut kosong.
  clearUsernameFailures(name)
  clearLoginAttempts(user.id)

  return { userId: user.id, sessionsDeleted }
}
